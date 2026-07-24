import { useState, useEffect, useRef, useCallback } from 'react';
import { BoardState, Unit, BattleLog, Position, BOARD_CONFIG, SvgType, UnitAnimState, SlashEffect, DamageNumber, AttackLine } from '../types/index.js';
import { runSimulation, createUnit, UNIT_TEMPLATES } from '../engine/index.js';
import { UnitSvg } from './UnitSvgs.js';
import { useScreenRecorder } from './useScreenRecorder.js';

const UnitImage: React.FC<{ unit: Unit; size: number }> = ({ unit, size }) => {
  if (unit.imageUrl) {
    return <img src={unit.imageUrl} alt={unit.id} width={size} height={size} style={{ objectFit: 'contain' }} />;
  }
  if (unit.svgType) {
    return <UnitSvg svgType={unit.svgType} size={size} />;
  }
  return null;
};

const TILE_SIZE = 50;
const BOARD_WIDTH = BOARD_CONFIG.width * TILE_SIZE;
const BOARD_HEIGHT = BOARD_CONFIG.height * TILE_SIZE;
const TICK_INTERVAL = 400; // ms per tick — slower for readability

const TEMPLATE_KEYS = Object.keys(UNIT_TEMPLATES) as (keyof typeof UNIT_TEMPLATES)[];

function distributedPositions(count: number): Position[] {
  const cols = Math.ceil(Math.sqrt(count * (BOARD_CONFIG.width / BOARD_CONFIG.height)));
  const rows = Math.ceil(count / cols);

  const cellW = (BOARD_CONFIG.width - 1) / cols;
  const cellH = (BOARD_CONFIG.height - 1) / rows;

  const positions: Position[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      x: 0.5 + cellW * (col + 0.5),
      y: 0.5 + cellH * (row + 0.5),
    });
  }
  return positions;
}

export function App({ onBack }: { onBack?: () => void } = {}) {
  const { isRecording, startRecording, stopRecording } = useScreenRecorder('ffa');
  const [units, setUnits] = useState<Unit[]>([]);
  const [isBattling, setIsBattling] = useState(false);
  const [winner, setWinner] = useState<string | 'draw' | null>(null);
  const [unitStates, setUnitStates] = useState<Map<string, UnitAnimState>>(new Map());
  const [slashes, setSlashes] = useState<SlashEffect[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [attackLines, setAttackLines] = useState<AttackLine[]>([]);
  const [currentTick, setCurrentTick] = useState(0);
  const [maxTick, setMaxTick] = useState(0);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allUnitsRef = useRef<Unit[]>([]);

  const initializeUnits = useCallback(() => {
    const positions = distributedPositions(TEMPLATE_KEYS.length);
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

      // Clear previous tick's effects
      setSlashes([]);
      setDamageNumbers([]);
      setAttackLines([]);

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
                id: `dmg-${tick}-${event.targetId}-${event.attackerId}`,
                x: targetState.x,
                y: targetState.y,
                damage: event.damage,
                startTime: Date.now(),
              }]);

              setAttackLines(prevLines => [...prevLines, {
                id: `line-${tick}-${event.attackerId}-${event.targetId}`,
                fromX: attackerState.x,
                fromY: attackerState.y,
                toX: targetState.x,
                toY: targetState.y,
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
      animTimeoutRef.current = setTimeout(processTick, TICK_INTERVAL);
    };

    processTick();
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
        ? new Set(result.battleLog.map((e: any) => e.tick)).size * TICK_INTERVAL + 500
        : 500;
      setTimeout(() => {
        setSlashes([]);
        setDamageNumbers([]);
        setAttackLines([]);
        setWinner(result.winner);
      }, totalTime);
    }, 300);
  };

  const reset = () => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    setIsBattling(false);
    setWinner(null);
    setSlashes([]);
    setDamageNumbers([]);
    setAttackLines([]);
    setCurrentTick(0);
    initializeUnits();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, minHeight: '100vh' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            alignSelf: 'flex-start', padding: '8px 16px', fontSize: 14,
            background: 'transparent', border: '1px solid #444', borderRadius: 8,
            cursor: 'pointer', color: '#888', letterSpacing: 1, marginBottom: 12,
          }}
        >
          ← BACK
        </button>
      )}
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
        {/* Attack lines — drawn first so they appear behind units */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
          {attackLines.map(line => {
            const color = line.damage === 0 ? '#888888' : line.damage >= 3 ? '#ff4444' : '#ffaa44';
            return (
              <line
                key={line.id}
                className="attack-line"
                x1={line.fromX * TILE_SIZE + TILE_SIZE / 2}
                y1={line.fromY * TILE_SIZE + TILE_SIZE / 2}
                x2={line.toX * TILE_SIZE + TILE_SIZE / 2}
                y2={line.toY * TILE_SIZE + TILE_SIZE / 2}
                stroke={color}
                strokeWidth={line.damage >= 3 ? 3 : 2}
                strokeDasharray={line.damage === 0 ? '4 4' : 'none'}
              />
            );
          })}
        </svg>

        {units.map(unit => {
          const state = unitStates.get(unit.id);
          if (!state) return null;

          let lungeOffset = state.attacking ? (state.attackDir * TILE_SIZE * 0.2) : 0;
          if (state.x <= 0 && lungeOffset < 0) lungeOffset = 0;
          if (state.x >= BOARD_CONFIG.width - 1 && lungeOffset > 0) lungeOffset = 0;

          const hpRatio = state.hp / state.maxHp;
          const displayName = unit.id.replace(/_/g, ' ');

          return (
            <div
              key={unit.id}
              style={{
                position: 'absolute',
                left: state.x * TILE_SIZE,
                top: state.y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                transform: `translateX(${lungeOffset}px) ${!state.alive ? 'scale(0.3) rotate(45deg)' : ''}`,
                opacity: state.alive ? 1 : 0,
                transitionProperty: 'left, top, transform, opacity',
                transitionDuration: '0.35s, 0.35s, 0.25s, 0.8s',
                transitionTimingFunction: 'ease-out, ease-out, ease, ease',
                zIndex: state.attacking ? 20 : 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* Unit name label */}
              <div style={{
                position: 'absolute',
                top: -12,
                whiteSpace: 'nowrap',
                fontSize: 8,
                fontWeight: 'bold',
                color: '#ccc',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                textShadow: '0 0 3px #000, 0 1px 2px #000',
              }}>
                {displayName}
              </div>

              {/* Unit image with attack flash */}
              <div style={{
                filter: state.attacking ? 'brightness(1.4) drop-shadow(0 0 6px #ff8800)' : undefined,
                transition: 'filter 0.15s',
              }}>
                <UnitImage unit={unit} size={TILE_SIZE * 0.7} />
              </div>

              {/* HP bar */}
              <div style={{
                position: 'absolute',
                bottom: 2,
                left: '10%',
                width: '80%',
                height: 5,
                background: '#222',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid #444',
              }}>
                <div style={{
                  width: `${hpRatio * 100}%`,
                  height: '100%',
                  background: hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#fbbf24' : '#f87171',
                  transition: 'width 0.3s ease',
                  borderRadius: 3,
                  boxShadow: hpRatio <= 0.25 ? '0 0 4px #f87171' : undefined,
                }} />
              </div>
            </div>
          );
        })}

        {/* Slash effects at the target */}
        {slashes.map(slash => (
          <div
            key={slash.id}
            className="slash-effect"
            style={{
              position: 'absolute',
              left: slash.x * TILE_SIZE + TILE_SIZE / 2,
              top: slash.y * TILE_SIZE + TILE_SIZE / 2,
              pointerEvents: 'none',
              zIndex: 30,
              fontSize: 24,
              color: '#fff',
              textShadow: '0 0 8px #ff6600, 0 0 16px #ff3300',
            }}
          >
            /
          </div>
        ))}

        {/* Damage numbers */}
        {damageNumbers.map(dmg => (
          <div
            key={dmg.id}
            className="damage-number"
            style={{
              position: 'absolute',
              left: dmg.x * TILE_SIZE + TILE_SIZE / 2,
              top: dmg.y * TILE_SIZE,
              color: dmg.damage === 0 ? '#888' : dmg.damage >= 3 ? '#ff2222' : '#ff8844',
              fontWeight: 'bold',
              fontSize: dmg.damage >= 3 ? 22 : 16,
              textShadow: '0 0 4px #000, 0 0 8px #000',
              pointerEvents: 'none',
              zIndex: 40,
            }}
          >
            {dmg.damage === 0 ? 'MISS' : `-${dmg.damage}`}
          </div>
        ))}
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

        {!isRecording ? (
          <button onClick={startRecording} style={{ padding: '12px 24px', fontSize: 16, fontWeight: 'bold', background: 'linear-gradient(135deg, #f87171, #ef4444)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', letterSpacing: 1 }}>
            ● REC
          </button>
        ) : (
          <button onClick={stopRecording} style={{ padding: '12px 24px', fontSize: 16, fontWeight: 'bold', background: 'linear-gradient(135deg, #1f2937, #111827)', border: '2px solid #ef4444', borderRadius: 8, cursor: 'pointer', color: '#fff', letterSpacing: 1 }}>
            ■ STOP & SAVE
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
        @keyframes damage-float {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-25px); }
        }
        @keyframes slash-pop {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8) rotate(-15deg); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4) rotate(15deg); }
        }
        @keyframes line-fade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .damage-number {
          animation: damage-float 0.38s ease-out forwards;
        }
        .slash-effect {
          animation: slash-pop 0.35s ease-out forwards;
        }
        .attack-line {
          animation: line-fade 0.38s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
