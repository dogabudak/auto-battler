import { useState, useEffect, useRef, useCallback } from 'react';
import { BoardState, Unit, BattleLog, Position, BOARD_CONFIG, SvgType, UnitAnimState, SlashEffect, DamageNumber } from '../types/index.js';
import { runSimulation, createUnit, UNIT_TEMPLATES } from '../engine/index.js';
import { UnitSvg } from './UnitSvgs.js';

const UnitImage: React.FC<{ unit: Unit; size: number }> = ({ unit, size }) => {
  if (unit.imageUrl) {
    return <img src={unit.imageUrl} alt={unit.id} width={size} height={size} style={{ objectFit: 'cover' }} />;
  }
  if (unit.svgType) {
    return <UnitSvg svgType={unit.svgType} size={size} />;
  }
  return null;
};

const TILE_SIZE = 50;
const BOARD_WIDTH = BOARD_CONFIG.width * TILE_SIZE;
const BOARD_HEIGHT = BOARD_CONFIG.height * TILE_SIZE;

const TEMPLATE_KEYS = Object.keys(UNIT_TEMPLATES) as (keyof typeof UNIT_TEMPLATES)[];

function randomPositions(count: number): Position[] {
  const positions: Position[] = [];
  for (let i = 0; i < count; i++) {
    // Keep them slightly away from the absolute edges
    positions.push({
      x: 0.5 + Math.random() * (BOARD_CONFIG.width - 2),
      y: 0.5 + Math.random() * (BOARD_CONFIG.height - 2)
    });
  }
  return positions;
}

export function App() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isBattling, setIsBattling] = useState(false);
  const [winner, setWinner] = useState<string | 'draw' | null>(null);
  const [unitStates, setUnitStates] = useState<Map<string, UnitAnimState>>(new Map());
  const [slashes, setSlashes] = useState<SlashEffect[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [currentTick, setCurrentTick] = useState(0);
  const [maxTick, setMaxTick] = useState(0);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allUnitsRef = useRef<Unit[]>([]);

  const initializeUnits = useCallback(() => {
    const positions = randomPositions(TEMPLATE_KEYS.length);
    const newUnits: Unit[] = TEMPLATE_KEYS.map((key, i) =>
      createUnit(key, positions[i].x, positions[i].y)
    ).filter(Boolean);

    setUnits(newUnits);
    allUnitsRef.current = newUnits;

    const states = new Map<string, UnitAnimState>();
    newUnits.forEach(u => {
      states.set(u.id, {
        x: u.x, y: u.y, hp: u.hp, maxHp: u.maxHp,
        alive: true, attacking: false, attackDir: 0, deathProgress: 0,
      });
    });
    setUnitStates(states);
  }, []);

  useEffect(() => {
    initializeUnits();
  }, [initializeUnits]);

  const playBattleLog = useCallback((log: BattleLog) => {
    const tickMap = new Map<number, any[]>();
    log.forEach((event: any) => {
      const events = tickMap.get(event.tick) || [];
      events.push(event);
      tickMap.set(event.tick, events);
    });

    const ticks = Array.from(tickMap.keys()).sort((a, b) => a - b);
    if (ticks.length === 0) return;

    setMaxTick(ticks[ticks.length - 1]);

    let tickIndex = 0;

    const processTick = () => {
      if (tickIndex >= ticks.length) return;

      const tick = ticks[tickIndex];
      const events = tickMap.get(tick) || [];
      setCurrentTick(tick);

      setUnitStates(prev => {
        const next = new Map(prev);

        for (const [id, state] of next) {
          if (state.attacking) {
            next.set(id, { ...state, attacking: false });
          }
        }

        for (const event of events) {
          if (event.type === 'move') {
            const state = next.get(event.unitId);
            if (state) {
              next.set(event.unitId, { ...state, x: event.to.x, y: event.to.y });
            }
          }

          if (event.type === 'attack') {
            const attackerState = next.get(event.attackerId);
            const targetState = next.get(event.targetId);
            if (attackerState && targetState) {
              const dir = targetState.x > attackerState.x ? 1 : -1;
              next.set(event.attackerId, { ...attackerState, attacking: true, attackDir: dir });
              next.set(event.targetId, { ...targetState, hp: targetState.hp - event.damage });

              const slashId = `slash-${tick}-${event.targetId}`;
              setSlashes(prevSlashes => [...prevSlashes, {
                id: slashId,
                x: targetState.x,
                y: targetState.y,
                startTime: Date.now(),
              }]);

              setDamageNumbers(prevNumbers => [...prevNumbers, {
                id: `dmg-${tick}-${event.targetId}-${Math.random()}`,
                x: targetState.x,
                y: targetState.y,
                damage: event.damage,
                startTime: Date.now(),
              }]);
            }
          }

          if (event.type === 'death') {
            const state = next.get(event.unitId);
            if (state) {
              next.set(event.unitId, { ...state, alive: false, hp: 0 });
            }
          }
        }

        return next;
      });

      tickIndex++;
      animTimeoutRef.current = setTimeout(processTick, 180);
    };

    processTick();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSlashes(prev => prev.filter(s => now - s.startTime < 300));
      setDamageNumbers(prev => prev.filter(d => now - d.startTime < 800));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const startBattle = () => {
    const boardState: BoardState = {
      units: units.map(u => ({ ...u })),
    };

    const result = runSimulation(boardState);
    setIsBattling(true);
    setWinner(null);
    setCurrentTick(0);

    const states = new Map<string, UnitAnimState>();
    units.forEach(u => {
      states.set(u.id, {
        x: u.x, y: u.y, hp: u.hp, maxHp: u.maxHp,
        alive: true, attacking: false, attackDir: 0, deathProgress: 0,
      });
    });
    setUnitStates(states);

    setTimeout(() => {
      playBattleLog(result.battleLog);
      const totalTime = result.battleLog.length > 0
        ? new Set(result.battleLog.map((e: any) => e.tick)).size * 180 + 500
        : 500;
      setTimeout(() => setWinner(result.winner), totalTime);
    }, 300);
  };

  const reset = () => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    setIsBattling(false);
    setWinner(null);
    setSlashes([]);
    setDamageNumbers([]);
    setCurrentTick(0);
    initializeUnits();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, minHeight: '100vh' }}>
      <h1 style={{ fontSize: 32, marginBottom: 8, letterSpacing: 2 }}>FFA BATTLE SIMULATOR</h1>
      <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>Last unit standing wins</p>

      <div style={{
        position: 'relative',
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        background: '#1a1f2e',
        border: '2px solid #2a3040',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        {units.map(unit => {
          const state = unitStates.get(unit.id);
          if (!state) return null;

          let lungeOffset = state.attacking ? (state.attackDir * TILE_SIZE * 0.15) : 0;
          if (state.x <= 0 && lungeOffset < 0) {
            lungeOffset = 0;
          }
          if (state.x >= BOARD_CONFIG.width - 1 && lungeOffset > 0) {
            lungeOffset = 0;
          }

          return (
            <div
              key={unit.id}
              style={{
                position: 'absolute',
                left: state.x * TILE_SIZE,
                top: state.y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                transform: `translateX(${lungeOffset}px)`,
                opacity: state.alive ? 1 : 0,
                transitionProperty: 'left, top, transform, opacity',
                transitionDuration: '0.18s, 0.18s, 0.2s, 0.6s',
                transitionTimingFunction: 'linear, linear, ease, ease',
                zIndex: state.attacking ? 20 : 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ filter: state.attacking ? 'brightness(1.3)' : undefined, transition: 'filter 0.1s' }}>
                <UnitImage unit={unit} size={TILE_SIZE * 0.7} />
              </div>

              <div style={{
                position: 'absolute',
                bottom: 4,
                left: '15%',
                width: '70%',
                height: 5,
                background: '#333',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(state.hp / state.maxHp) * 100}%`,
                  height: '100%',
                  background: state.hp / state.maxHp > 0.5 ? '#4ade80' : state.hp / state.maxHp > 0.25 ? '#fbbf24' : '#f87171',
                  transition: 'width 0.2s ease',
                  borderRadius: 3,
                }} />
              </div>
            </div>
          );
        })}

        {damageNumbers.map(dmg => {
          const age = Date.now() - dmg.startTime;
          const floatY = Math.min(age / 800, 1) * -30;
          const opacity = Math.max(0, 1 - age / 800);
          return (
            <div
              key={dmg.id}
              style={{
                position: 'absolute',
                left: dmg.x * TILE_SIZE + TILE_SIZE / 2,
                top: dmg.y * TILE_SIZE + floatY,
                transform: 'translateX(-50%)',
                color: '#ff4444',
                fontWeight: 'bold',
                fontSize: 18,
                textShadow: '0 0 4px #000, 0 0 8px #ff0000',
                opacity,
                pointerEvents: 'none',
                zIndex: 40,
              }}
            >
              -{dmg.damage}
            </div>
          );
        })}
      </div>

      <div style={{ margin: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        {!isBattling ? (
          <button onClick={startBattle} style={{ padding: '12px 40px', fontSize: 18, fontWeight: 'bold', background: 'linear-gradient(135deg, #4ade80, #22c55e)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#000', letterSpacing: 1 }}>
            START BATTLE
          </button>
        ) : (
          <button onClick={reset} style={{ padding: '12px 40px', fontSize: 18, fontWeight: 'bold', background: 'linear-gradient(135deg, #666, #444)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', letterSpacing: 1 }}>
            RESET
          </button>
        )}
      </div>

      {winner && (
        <div style={{ fontSize: 36, fontWeight: 'bold', color: '#fbbf24', textShadow: `0 0 20px #fbbf24`, animation: 'pulse 1s ease-in-out infinite', marginTop: 10 }}>
          {winner === 'draw' ? 'DRAW!' : `WINNER: ${winner}`}
        </div>
      )}

      {isBattling && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
          Tick: {currentTick} / {maxTick}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
