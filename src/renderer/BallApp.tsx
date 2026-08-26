import { useState, useEffect, useRef, useCallback } from 'react';
import { BoardState, Unit, BattleLog, UnitAnimState, SlashEffect, DamageNumber, AttackLine, AbilityEffect, AbilityCallout } from '../types/index.js';
import { BallBattleSimulator, createUnit, getEntityName, getPack } from '../engine/index.js';
import type { PackId } from '../engine/index.js';
import { useScreenRecorder, formatCaptureStats } from './useScreenRecorder.js';
import { EntityImage } from './EntityImage.js';
import { Watermark, WatermarkControls, useWatermark } from './Watermark.js';
import {
  arenaStyle,
  distributedPositions,
  playAreaStyle,
  usePreviewScale,
  useExportFormat,
} from './boardLayout.js';
import { COLORS, RADIUS, SPACE, TYPE, primaryButton } from './designTokens.js';
import { FormatControls } from './FormatPicker.js';
import {
  ARENA_THEME_CSS,
  ArenaAtmosphere,
  ArenaBackdrop,
  ArenaThemeControls,
  useArenaTheme,
} from './ArenaTheme.js';
import {
  ABILITY_FX_CSS,
  ABILITY_VFX,
  AbilityAura,
  AbilityBeamLayer,
  AbilityCalloutLayer,
  AbilityEffectLayer,
  AbilityFlashLayer,
  pruneAbilityCallouts,
  pruneAbilityEffects,
} from './AbilityFx.js';

/** Ball-shaped unit with 3D sphere effect and the entity's crest/flag inside */
const BallUnit: React.FC<{ unit: Unit; name: string; size: number }> = ({ unit, name, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e0e0e0 30%, #aaaaaa 70%, #666666 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 -2px 6px rgba(0,0,0,0.2)',
    }}
  >
    <EntityImage imageUrl={unit.imageUrl} name={name} size={size * 0.6} />
  </div>
);


const TICK_INTERVAL = 400;

export function BallApp({
  onBack,
  packId,
  roster,
}: {
  onBack: () => void;
  packId: PackId;
  roster: string[];
}) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isBattling, setIsBattling] = useState(false);
  const [winner, setWinner] = useState<string | 'draw' | null>(null);
  const [unitStates, setUnitStates] = useState<Map<string, UnitAnimState>>(new Map());
  const [slashes, setSlashes] = useState<SlashEffect[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [attackLines, setAttackLines] = useState<AttackLine[]>([]);
  const [abilityEffects, setAbilityEffects] = useState<AbilityEffect[]>([]);
  const [abilityCallouts, setAbilityCallouts] = useState<AbilityCallout[]>([]);
  const [currentTick, setCurrentTick] = useState(0);
  const [maxTick, setMaxTick] = useState(0);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pack = getPack(packId);

  const { isRecording, startRecording, stopRecording, stats: captureStats } = useScreenRecorder('pl-brawl');
  const { config: watermark, update: updateWatermark } = useWatermark();
  const { theme, selection: themeSelection, select: selectTheme } = useArenaTheme(packId);
  const { formatId, layout, select: selectFormat } = useExportFormat();
  const { scale, devicePixelScale } = usePreviewScale(layout);

  const initializeUnits = useCallback(() => {
    const positions = distributedPositions(roster.length, layout);
    const newUnits = roster
      .map((key, i) => createUnit(key, positions[i].x, positions[i].y, packId))
      .filter((u): u is Unit => u !== null);

    setUnits(newUnits);

    const states = new Map<string, UnitAnimState>();
    newUnits.forEach(u => {
      states.set(u.id, {
        x: u.x, y: u.y, hp: u.hp, maxHp: u.maxHp,
        alive: true, attacking: false, attackDir: 0, deathProgress: 0, auras: [],
      });
    });
    setUnitStates(states);
  }, [roster, packId, layout]);

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
      // Ability effects outlive a single tick, so age them out instead.
      const now = Date.now();
      setAbilityEffects(prev => pruneAbilityEffects(prev, now));
      setAbilityCallouts(prev => pruneAbilityCallouts(prev, now));

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

              setSlashes(prevSlashes => [...prevSlashes, {
                id: `slash-${tick}-${event.targetId}`,
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

          if (event.type === 'ability') {
            const state = next.get(event.unitId);
            if (state) {
              const style = ABILITY_VFX[event.abilityId as keyof typeof ABILITY_VFX];
              const source = event.sourceId ? next.get(event.sourceId) : undefined;

              // Siphon heals the unit it plays on; keep the bar in sync.
              const healed = event.abilityId === 'siphon' && event.value
                ? Math.min(state.maxHp, state.hp + event.value)
                : state.hp;

              next.set(event.unitId, {
                ...state,
                hp: healed,
                auras: style.aura && !state.auras.includes(event.abilityId)
                  ? [...state.auras, event.abilityId]
                  : state.auras,
              });

              const effectId = `ability-${tick}-${event.abilityId}-${event.unitId}`;
              setAbilityEffects(prevEffects =>
                prevEffects.some(e => e.id === effectId)
                  ? prevEffects
                  : [...prevEffects, {
                      id: effectId,
                      abilityId: event.abilityId,
                      x: state.x,
                      y: state.y,
                      fromX: source?.x,
                      fromY: source?.y,
                      value: event.value,
                      startTime: Date.now(),
                    }]
              );

              if (style.callout) {
                const calloutId = `callout-${tick}-${event.abilityId}-${event.unitId}`;
                setAbilityCallouts(prevCallouts =>
                  // One banner at a time — late-game rage would otherwise
                  // strobe the whole board.
                  prevCallouts.length > 0 || prevCallouts.some(c => c.id === calloutId)
                    ? prevCallouts
                    : [...prevCallouts, {
                        id: calloutId,
                        abilityId: event.abilityId,
                        unitName: getEntityName(packId, event.unitId),
                        startTime: Date.now(),
                      }]
                );
              }
            }
          }

          if (event.type === 'death') {
            const state = next.get(event.unitId);
            if (state) {
              next.set(event.unitId, { ...state, alive: false, hp: 0, auras: [] });
            }
          }
        }

        return next;
      });

      tickIndex++;
      animTimeoutRef.current = setTimeout(processTick, TICK_INTERVAL);
    };

    processTick();
  }, [packId]);


  const startBattle = () => {
    const boardState: BoardState = {
      units: units.map(u => ({ ...u })),
    };

    // The simulator clamps movement to the board, so it has to be told the
    // grid the selected export format uses.
    const simulator = new BallBattleSimulator({ width: layout.cols, height: layout.rows });
    const result = simulator.runSimulation(boardState);
    setIsBattling(true);
    setWinner(null);
    setCurrentTick(0);
    setAbilityEffects([]);
    setAbilityCallouts([]);

    const states = new Map<string, UnitAnimState>();
    units.forEach(u => {
      states.set(u.id, {
        x: u.x, y: u.y, hp: u.hp, maxHp: u.maxHp,
        alive: true, attacking: false, attackDir: 0, deathProgress: 0, auras: [],
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
        setAbilityEffects([]);
        setAbilityCallouts([]);
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
    setAbilityEffects([]);
    setAbilityCallouts([]);
    setCurrentTick(0);
    initializeUnits();
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 20, minHeight: '100vh',
      background: theme.pageBackground,
      transition: 'background 0.4s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: SPACE.lg, marginBottom: SPACE.md,
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '6px 16px', fontSize: TYPE.size.md + 1, background: 'transparent',
            border: `1px solid ${COLORS.border.default}`, borderRadius: RADIUS.sm,
            cursor: 'pointer', color: COLORS.text.secondary,
            letterSpacing: TYPE.tracking.normal,
          }}
        >
          BACK
        </button>
        <h1 style={{
          fontSize: TYPE.size.display - 6, letterSpacing: TYPE.tracking.wide,
          color: COLORS.text.primary,
        }}>
          {pack.name.toUpperCase()} BRAWL
        </h1>
      </div>

      {/*
        Arena, built at the export frame's real pixel size (1080x1920 and
        friends). The wrapper scales it down to fit the window without the
        arena's own geometry ever knowing — board space stays export space, so
        nothing has to be cropped or re-laid-out at export time.
      */}
      <div style={{
        width: layout.width * scale,
        height: layout.height * scale,
        flexShrink: 0,
      }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        ...arenaStyle(layout),
        ...theme.surface,
      }}>
        <ArenaBackdrop theme={theme} layout={layout} />

        <div style={playAreaStyle(layout)}>
          {/* Attack lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {attackLines.map(line => {
              const color = line.damage === 0 ? COLORS.damage.lineMiss
                : line.damage >= 3 ? COLORS.damage.lineHeavy : COLORS.damage.lineLight;
              return (
                <line
                  key={line.id}
                  className="attack-line"
                  x1={line.fromX * layout.tile + layout.tile / 2}
                  y1={line.fromY * layout.tile + layout.tile / 2}
                  x2={line.toX * layout.tile + layout.tile / 2}
                  y2={line.toY * layout.tile + layout.tile / 2}
                  stroke={color}
                  strokeWidth={line.damage >= 3 ? layout.tile * 0.06 : layout.tile * 0.04}
                  strokeDasharray={line.damage === 0 ? '4 4' : 'none'}
                />
              );
            })}
          </svg>

          {units.map(unit => {
            const state = unitStates.get(unit.id);
            if (!state) return null;

            const bounceScale = state.attacking ? 1.2 : 1;
            const hpRatio = state.hp / state.maxHp;
            const displayName = getEntityName(packId, unit.id);

            return (
              <div
                key={unit.id}
                style={{
                  position: 'absolute',
                  left: state.x * layout.tile,
                  top: state.y * layout.tile,
                  width: layout.tile,
                  height: layout.tile,
                  transform: `scale(${bounceScale}) ${!state.alive ? 'scale(0.3) rotate(45deg)' : ''}`,
                  opacity: state.alive ? 1 : 0,
                  transitionProperty: 'left, top, transform, opacity',
                  transitionDuration: '0.35s, 0.35s, 0.25s, 0.8s',
                  transitionTimingFunction: 'ease-out, ease-out, ease-out, ease',
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
                  top: -layout.font.unitLabel * 0.7,
                  whiteSpace: 'nowrap',
                  // Capped to the room a board-edge unit has, so a long name
                  // ellipsises instead of running past the arena.
                  maxWidth: layout.labelMaxWidth,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: layout.font.unitLabel,
                  fontWeight: TYPE.weight.bold,
                  color: theme.labelColor,
                  textTransform: 'uppercase',
                  letterSpacing: layout.tile * 0.012,
                  textShadow: theme.labelShadow,
                }}>
                  {displayName}
                </div>

                {/* Ball with attack glow, plus any active ability aura behind it */}
                <div style={{
                  position: 'relative',
                  filter: state.attacking
                    ? `brightness(1.4) drop-shadow(0 0 ${layout.tile * 0.12}px ${COLORS.damage.light})`
                    : undefined,
                  transition: 'filter 0.15s',
                }}>
                  {state.alive && <AbilityAura abilities={state.auras} size={layout.tile * 0.85} />}
                  <BallUnit unit={unit} name={displayName} size={layout.tile * 0.85} />
                </div>

                {/* HP bar */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '10%',
                  width: '80%',
                  height: Math.max(3, layout.tile * 0.08),
                  background: '#0005',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${hpRatio * 100}%`,
                    height: '100%',
                    background: hpRatio > 0.5 ? COLORS.hp.high : hpRatio > 0.25 ? COLORS.hp.mid : COLORS.hp.low,
                    transition: 'width 0.3s ease',
                    borderRadius: 3,
                    boxShadow: hpRatio <= 0.25 ? `0 0 4px ${COLORS.hp.low}` : undefined,
                  }} />
                </div>
              </div>
            );
          })}

          {/* Slash effects */}
          {slashes.map(slash => (
            <div
              key={slash.id}
              className="slash-effect"
              style={{
                position: 'absolute',
                left: slash.x * layout.tile + layout.tile / 2,
                top: slash.y * layout.tile + layout.tile / 2,
                pointerEvents: 'none',
                zIndex: 30,
                fontSize: layout.font.slash,
                color: '#fff',
                textShadow: `0 0 8px ${COLORS.damage.slashGlow}, 0 0 16px ${COLORS.damage.slashGlowOuter}`,
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
                left: dmg.x * layout.tile + layout.tile / 2,
                top: dmg.y * layout.tile,
                color: dmg.damage === 0 ? COLORS.damage.miss
                  : dmg.damage >= 3 ? COLORS.damage.heavy : COLORS.damage.light,
                fontWeight: TYPE.weight.bold,
                fontSize: dmg.damage >= 3 ? layout.font.damageNumberBig : layout.font.damageNumber,
                textShadow: '0 0 4px #000, 0 0 8px #000',
                pointerEvents: 'none',
                zIndex: 40,
              }}
            >
              {dmg.damage === 0 ? 'MISS' : `-${dmg.damage}`}
            </div>
          ))}

          {/* Ability trigger VFX */}
          <AbilityBeamLayer effects={abilityEffects} tileSize={layout.tile} />
          <AbilityEffectLayer effects={abilityEffects} tileSize={layout.tile} />
        </div>

        {/* Theme grade over the fight, under the callouts */}
        <ArenaAtmosphere theme={theme} layout={layout} />

        <AbilityFlashLayer callouts={abilityCallouts} />
        <AbilityCalloutLayer
          callouts={abilityCallouts}
          titleSize={layout.font.calloutTitle}
          nameSize={layout.font.calloutName}
        />

        {/* Branding — last child so it sits above every effect layer */}
        <Watermark config={watermark} isRecording={isRecording} pixelScale={layout.tile / 50} />
      </div>
      </div>

      <div style={{ margin: SPACE.xl, display: 'flex', gap: SPACE.md, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {!isBattling ? (
          <button onClick={startBattle} style={primaryButton(COLORS.accent.green, COLORS.accent.greenDeep)}>
            KICK OFF
          </button>
        ) : (
          <button onClick={reset} style={primaryButton('#666', '#444', COLORS.text.primary)}>
            RESET
          </button>
        )}

        {!isRecording ? (
          <button onClick={startRecording} style={{ ...primaryButton(COLORS.accent.red, COLORS.accent.redDeep, '#fff'), padding: '12px 24px', fontSize: TYPE.size.lg + 1 }}>
            ● REC
          </button>
        ) : (
          <button onClick={stopRecording} style={{ ...primaryButton('#1f2937', '#111827', '#fff'), padding: '12px 24px', fontSize: TYPE.size.lg + 1, border: `2px solid ${COLORS.accent.redDeep}` }}>
            ■ STOP & SAVE
          </button>
        )}

        <ArenaThemeControls
          selection={themeSelection}
          theme={theme}
          packId={packId}
          layout={layout}
          onSelect={selectTheme}
        />

        <FormatControls
          formatId={formatId}
          layout={layout}
          onSelect={id => {
            // A different frame means a different board, so the battle in
            // progress no longer matches the geometry — start over.
            reset();
            selectFormat(id);
          }}
        />

        <WatermarkControls config={watermark} onChange={updateWatermark} />
      </div>

      {/*
        Frame and capture readout. devicePixelScale is the number that decides
        whether an export is sharp: it's device pixels per export pixel, so
        below 1 the capture is upscaling the arena and no bitrate can rescue it.
      */}
      <div style={{
        display: 'flex', gap: SPACE.lg, alignItems: 'center',
        fontSize: TYPE.size.sm, letterSpacing: TYPE.tracking.normal,
        color: COLORS.text.muted, marginTop: -SPACE.md, marginBottom: SPACE.sm,
      }}>
        <span>
          {layout.format.name} {layout.format.aspect} · {layout.width}×{layout.height}
          {' · '}{layout.cols}×{layout.rows} board
        </span>
        <span style={{ color: devicePixelScale >= 1 ? COLORS.accent.green : COLORS.accent.gold }}>
          preview {Math.round(scale * 100)}% · {devicePixelScale.toFixed(2)}× device px
          {devicePixelScale < 1 ? ' (capture will upscale)' : ''}
        </span>
        {captureStats && (
          <span style={{ color: isRecording ? COLORS.accent.red : COLORS.text.faint }}>
            {isRecording ? '● ' : ''}{formatCaptureStats(captureStats)}
          </span>
        )}
      </div>

      {winner && (
        <div style={{
          fontSize: TYPE.size.display + 4, fontWeight: TYPE.weight.bold,
          color: COLORS.accent.gold, textShadow: `0 0 20px ${COLORS.accent.gold}`,
          animation: 'pulse 1s ease-in-out infinite', marginTop: SPACE.md,
        }}>
          {winner === 'draw' ? 'DRAW!' : `WINNER: ${getEntityName(packId, winner)}`}
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
        ${ABILITY_FX_CSS}
        ${ARENA_THEME_CSS}
      `}</style>
    </div>
  );
}
