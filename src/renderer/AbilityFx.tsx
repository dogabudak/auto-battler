import { AbilityCallout, AbilityEffect, AbilityId } from '../types/index.js';
import { COLORS, TYPE } from './designTokens.js';

/**
 * Visual language for ability triggers.
 *
 * Each ability gets one unmistakable silhouette so a viewer can read what
 * happened in a single frame of a vertical video: rage = red rings,
 * block = cyan hex, blitz = yellow bolt, siphon = green beam,
 * execute = magenta star.
 */
export type AbilityFxKind = 'burst' | 'shield' | 'bolt' | 'beam' | 'slam';

export interface AbilityVfxStyle {
  label: string;
  kind: AbilityFxKind;
  color: string;
  accent: string;
  /** ms the on-field effect lives. */
  duration: number;
  /** Leaves a permanent aura on the unit after the trigger. */
  aura?: boolean;
  /** Also fires the big centre-screen banner. */
  callout?: boolean;
}

export const ABILITY_VFX: Record<AbilityId, AbilityVfxStyle> = {
  rage: {
    label: 'RAGE',
    kind: 'burst',
    color: COLORS.ability.rage,
    accent: COLORS.ability.rageAccent,
    duration: 900,
    aura: true,
    callout: true,
  },
  fortress: {
    label: 'BLOCK',
    kind: 'shield',
    color: COLORS.ability.block,
    accent: COLORS.ability.blockAccent,
    duration: 620,
  },
  blitz: {
    label: 'BLITZ',
    kind: 'bolt',
    color: COLORS.ability.blitz,
    accent: COLORS.ability.blitzAccent,
    duration: 560,
  },
  siphon: {
    label: 'SIPHON',
    kind: 'beam',
    color: COLORS.ability.siphon,
    accent: COLORS.ability.siphonAccent,
    duration: 700,
  },
  execute: {
    label: 'EXECUTE',
    kind: 'slam',
    color: COLORS.ability.execute,
    accent: COLORS.ability.executeAccent,
    duration: 880,
    callout: true,
  },
};

export const CALLOUT_DURATION = 1300;

/** Drops effects whose animation has already finished. */
export function pruneAbilityEffects(effects: AbilityEffect[], now: number): AbilityEffect[] {
  return effects.filter(e => now - e.startTime < ABILITY_VFX[e.abilityId].duration);
}

export function pruneAbilityCallouts(callouts: AbilityCallout[], now: number): AbilityCallout[] {
  return callouts.filter(c => now - c.startTime < CALLOUT_DURATION);
}

/* ------------------------------------------------------------------ */
/* Per-kind shapes                                                     */
/* ------------------------------------------------------------------ */

/** RAGE — twin shockwave rings behind a ring of radial spikes. */
function BurstFx({ style, size }: { style: AbilityVfxStyle; size: number }) {
  const spikes = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <circle className="fx-ring fx-ring-1" cx="50" cy="50" r="22" fill="none" stroke={style.color} strokeWidth="4" />
      <circle className="fx-ring fx-ring-2" cx="50" cy="50" r="22" fill="none" stroke={style.accent} strokeWidth="2" />
      <g className="fx-spikes">
        {spikes.map(angle => (
          <rect
            key={angle}
            x="48.5"
            y="8"
            width="3"
            height="14"
            rx="1.5"
            fill={style.color}
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>
    </svg>
  );
}

/** BLOCK — a hexagonal barrier that snaps shut and flashes. */
function ShieldFx({ style, size }: { style: AbilityVfxStyle; size: number }) {
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${50 + 34 * Math.cos(a)},${50 + 34 * Math.sin(a)}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <g className="fx-shield">
        <polygon points={hex} fill={style.color} fillOpacity="0.18" stroke={style.color} strokeWidth="3" />
        <polygon points={hex} fill="none" stroke={style.accent} strokeWidth="1" transform="scale(0.82) translate(11 11)" />
      </g>
    </svg>
  );
}

/** BLITZ — lightning bolt flanked by speed streaks. */
function BoltFx({ style, size }: { style: AbilityVfxStyle; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <g className="fx-streaks">
        {[26, 50, 74].map((y, i) => (
          <rect key={y} x={12 - i * 4} y={y - 1.5} width={22 + i * 6} height="3" rx="1.5" fill={style.color} opacity="0.75" />
        ))}
      </g>
      <path
        className="fx-bolt"
        d="M58 12 L36 54 L50 54 L42 88 L68 42 L53 42 L64 12 Z"
        fill={style.color}
        stroke={style.accent}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** EXECUTE — four-point star flash over a cracking shockwave ring. */
function SlamFx({ style, size }: { style: AbilityVfxStyle; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <circle className="fx-ring fx-ring-1" cx="50" cy="50" r="20" fill="none" stroke={style.color} strokeWidth="5" />
      <g className="fx-star">
        <path
          d="M50 0 L58 42 L100 50 L58 58 L50 100 L42 58 L0 50 L42 42 Z"
          fill={style.accent}
          opacity="0.9"
        />
        <path
          d="M50 14 L56 44 L86 50 L56 56 L50 86 L44 56 L14 50 L44 44 Z"
          fill={style.color}
        />
      </g>
    </svg>
  );
}

/**
 * SIPHON — drawn in the board-wide SVG overlay rather than at a point,
 * since it connects two units.
 */
function BeamFx({
  effect,
  style,
  tileSize,
}: {
  effect: AbilityEffect;
  style: AbilityVfxStyle;
  tileSize: number;
}) {
  const half = tileSize / 2;
  const x1 = (effect.fromX ?? effect.x) * tileSize + half;
  const y1 = (effect.fromY ?? effect.y) * tileSize + half;
  const x2 = effect.x * tileSize + half;
  const y2 = effect.y * tileSize + half;

  return (
    <g className="fx-beam">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={style.color} strokeWidth="6" opacity="0.25" strokeLinecap="round" />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={style.accent}
        strokeWidth="2"
        strokeDasharray="6 8"
        strokeLinecap="round"
        className="fx-beam-dashes"
      />
      {[0, 1, 2].map(i => (
        <circle key={i} r="3.5" fill={style.color} className={`fx-mote fx-mote-${i}`}>
          <animate attributeName="cx" from={x1} to={x2} dur="0.7s" begin={`${i * 0.12}s`} fill="freeze" />
          <animate attributeName="cy" from={y1} to={y2} dur="0.7s" begin={`${i * 0.12}s`} fill="freeze" />
        </circle>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Layers                                                              */
/* ------------------------------------------------------------------ */

/** Board-wide SVG overlay for effects that connect two units. */
export function AbilityBeamLayer({
  effects,
  tileSize,
}: {
  effects: AbilityEffect[];
  tileSize: number;
}) {
  const beams = effects.filter(e => ABILITY_VFX[e.abilityId].kind === 'beam');
  if (beams.length === 0) return null;

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 35 }}
    >
      {beams.map(effect => (
        <BeamFx key={effect.id} effect={effect} style={ABILITY_VFX[effect.abilityId]} tileSize={tileSize} />
      ))}
    </svg>
  );
}

/** Point effects (burst / shield / bolt / slam) plus their labels. */
export function AbilityEffectLayer({
  effects,
  tileSize,
}: {
  effects: AbilityEffect[];
  tileSize: number;
}) {
  const points = effects.filter(e => ABILITY_VFX[e.abilityId].kind !== 'beam');

  return (
    <>
      {points.map(effect => {
        const style = ABILITY_VFX[effect.abilityId];
        const size = tileSize * (style.kind === 'slam' ? 2.4 : 1.9);

        return (
          <div
            key={effect.id}
            style={{
              position: 'absolute',
              left: effect.x * tileSize + tileSize / 2,
              top: effect.y * tileSize + tileSize / 2,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 45,
              filter: `drop-shadow(0 0 6px ${style.color})`,
            }}
          >
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              {style.kind === 'burst' && <BurstFx style={style} size={size} />}
              {style.kind === 'shield' && <ShieldFx style={style} size={size} />}
              {style.kind === 'bolt' && <BoltFx style={style} size={size} />}
              {style.kind === 'slam' && <SlamFx style={style} size={size} />}
            </div>

            <div
              className="ability-label"
              style={{
                position: 'absolute',
                left: '50%',
                top: -tileSize * 0.55,
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: style.kind === 'slam' ? 14 : 11,
                fontWeight: 900,
                letterSpacing: 1.5,
                color: style.accent,
                textShadow: `0 0 6px ${style.color}, 0 0 14px ${style.color}, 0 2px 3px #000`,
                WebkitTextStroke: `0.5px ${style.color}`,
              }}
            >
              {style.label}
            </div>
          </div>
        );
      })}

      {/* Floating value for the effects that move a number (siphon heals). */}
      {effects
        .filter(e => e.abilityId === 'siphon' && e.value)
        .map(effect => (
          <div
            key={`${effect.id}-value`}
            className="ability-value"
            style={{
              position: 'absolute',
              left: effect.x * tileSize + tileSize / 2,
              top: effect.y * tileSize,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 46,
              fontSize: 15,
              fontWeight: 900,
              color: ABILITY_VFX.siphon.accent,
              textShadow: `0 0 6px ${ABILITY_VFX.siphon.color}, 0 2px 3px #000`,
            }}
          >
            +{effect.value}
          </div>
        ))}
    </>
  );
}

/**
 * Persistent aura for units running an active buff. Rendered behind the unit
 * so the crest/flag stays readable.
 */
export function AbilityAura({ abilities, size }: { abilities: AbilityId[]; size: number }) {
  const auras = abilities.filter(id => ABILITY_VFX[id].aura);
  if (auras.length === 0) return null;

  return (
    <>
      {auras.map(id => {
        const style = ABILITY_VFX[id];
        return (
          <div
            key={id}
            className="ability-aura"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: size * 1.35,
              height: size * 1.35,
              marginLeft: -(size * 1.35) / 2,
              marginTop: -(size * 1.35) / 2,
              borderRadius: '50%',
              border: `2px solid ${style.color}`,
              boxShadow: `0 0 10px ${style.color}, inset 0 0 12px ${style.color}`,
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />
        );
      })}
    </>
  );
}

/** Centre-screen banner for the loudest triggers — the shareable moment. */
export function AbilityCalloutLayer({
  callouts,
  titleSize,
  nameSize,
}: {
  callouts: AbilityCallout[];
  /** Export-space font sizes from the arena layout. */
  titleSize: number;
  nameSize: number;
}) {
  // Only the newest banner shows, so a busy tick can't stack them.
  const callout = callouts[callouts.length - 1];
  if (!callout) return null;

  const style = ABILITY_VFX[callout.abilityId];

  return (
    <div
      key={callout.id}
      className="ability-callout"
      style={{
        position: 'absolute',
        left: '50%',
        top: '38%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 60,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: titleSize,
          fontWeight: TYPE.weight.black,
          letterSpacing: titleSize * 0.1,
          color: style.accent,
          textShadow: `0 0 12px ${style.color}, 0 0 36px ${style.color}, 0 4px 6px #000`,
          WebkitTextStroke: `1px ${style.color}`,
        }}
      >
        {style.label}
      </div>
      <div
        style={{
          fontSize: nameSize,
          fontWeight: TYPE.weight.bold,
          letterSpacing: nameSize * 0.2,
          color: '#fff',
          textTransform: 'uppercase',
          textShadow: '0 0 6px #000, 0 2px 3px #000',
          marginTop: 2,
        }}
      >
        {callout.unitName}
      </div>
    </div>
  );
}

/** Full-board tint flash — pairs with a callout to punch up the moment. */
export function AbilityFlashLayer({ callouts }: { callouts: AbilityCallout[] }) {
  const callout = callouts[callouts.length - 1];
  if (!callout) return null;

  return (
    <div
      key={`flash-${callout.id}`}
      className="ability-flash"
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 45%, ${ABILITY_VFX[callout.abilityId].color}40 0%, transparent 65%)`,
        pointerEvents: 'none',
        zIndex: 55,
      }}
    />
  );
}

/** Keyframes for every ability effect — inject once per screen. */
export const ABILITY_FX_CSS = `
  @keyframes fx-ring-out {
    0%   { opacity: 1; transform: scale(0.3); }
    100% { opacity: 0; transform: scale(2.1); }
  }
  @keyframes fx-spikes-out {
    0%   { opacity: 0; transform: scale(0.55) rotate(-25deg); }
    35%  { opacity: 1; }
    100% { opacity: 0; transform: scale(1.25) rotate(15deg); }
  }
  @keyframes fx-shield-snap {
    0%   { opacity: 0; transform: scale(1.7) rotate(-12deg); }
    25%  { opacity: 1; transform: scale(0.95) rotate(0deg); }
    60%  { opacity: 1; transform: scale(1.05); }
    100% { opacity: 0; transform: scale(1.25); }
  }
  @keyframes fx-bolt-strike {
    0%   { opacity: 0; transform: scale(0.5) translateY(-8px); }
    20%  { opacity: 1; transform: scale(1.15) translateY(0); }
    45%  { opacity: 0.6; transform: scale(1); }
    65%  { opacity: 1; transform: scale(1.05); }
    100% { opacity: 0; transform: scale(0.9); }
  }
  @keyframes fx-streaks-rush {
    0%   { opacity: 0; transform: translateX(14px); }
    30%  { opacity: 0.9; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(-18px); }
  }
  @keyframes fx-star-flash {
    0%   { opacity: 0; transform: scale(0.2) rotate(-20deg); }
    18%  { opacity: 1; transform: scale(1.15) rotate(0deg); }
    100% { opacity: 0; transform: scale(0.75) rotate(25deg); }
  }
  @keyframes fx-beam-fade {
    0%   { opacity: 0; }
    18%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes fx-beam-crawl {
    0%   { stroke-dashoffset: 0; }
    100% { stroke-dashoffset: -42; }
  }
  @keyframes ability-label-rise {
    0%   { opacity: 0; transform: translateX(-50%) translateY(6px) scale(0.8); }
    22%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.1); }
    70%  { opacity: 1; transform: translateX(-50%) translateY(-6px) scale(1); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.95); }
  }
  @keyframes ability-value-rise {
    0%   { opacity: 0; transform: translateX(-50%) translateY(4px); }
    25%  { opacity: 1; }
    100% { opacity: 0; transform: translateX(-50%) translateY(-22px); }
  }
  @keyframes ability-aura-pulse {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%      { opacity: 1;    transform: scale(1.12); }
  }
  @keyframes ability-callout-in {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.55); }
    16%  { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
    28%  { transform: translate(-50%, -50%) scale(1); }
    72%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -55%) scale(1.05); }
  }
  @keyframes ability-flash-out {
    0%   { opacity: 0; }
    12%  { opacity: 1; }
    100% { opacity: 0; }
  }

  .fx-ring        { transform-origin: 50% 50%; transform-box: fill-box; }
  .fx-ring-1      { animation: fx-ring-out 0.6s ease-out forwards; }
  .fx-ring-2      { animation: fx-ring-out 0.75s ease-out 0.12s forwards; }
  .fx-spikes      { transform-origin: 50% 50%; transform-box: fill-box;
                    animation: fx-spikes-out 0.8s ease-out forwards; }
  .fx-shield      { transform-origin: 50% 50%; transform-box: fill-box;
                    animation: fx-shield-snap 0.6s ease-out forwards; }
  .fx-bolt        { transform-origin: 50% 50%; transform-box: fill-box;
                    animation: fx-bolt-strike 0.55s ease-out forwards; }
  .fx-streaks     { transform-origin: 50% 50%; transform-box: fill-box;
                    animation: fx-streaks-rush 0.5s ease-out forwards; }
  .fx-star        { transform-origin: 50% 50%; transform-box: fill-box;
                    animation: fx-star-flash 0.8s ease-out forwards; }
  .fx-beam        { animation: fx-beam-fade 0.7s ease-out forwards; }
  .fx-beam-dashes { animation: fx-beam-crawl 0.7s linear forwards; }

  .ability-label   { animation: ability-label-rise 0.85s ease-out forwards; }
  .ability-value   { animation: ability-value-rise 0.7s ease-out forwards; }
  .ability-aura    { animation: ability-aura-pulse 0.9s ease-in-out infinite; }
  .ability-callout { animation: ability-callout-in 1.3s ease-out forwards; }
  .ability-flash   { animation: ability-flash-out 0.7s ease-out forwards; }

  @media (prefers-reduced-motion: reduce) {
    .fx-ring-1, .fx-ring-2, .fx-spikes, .fx-shield, .fx-bolt, .fx-streaks,
    .fx-star, .fx-beam, .fx-beam-dashes, .ability-label, .ability-value,
    .ability-callout, .ability-flash {
      animation-duration: 0.01ms;
      animation-iteration-count: 1;
    }
    .ability-aura { animation: none; opacity: 0.8; }
  }
`;
