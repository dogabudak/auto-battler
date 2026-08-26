import { useCallback, useEffect, useState } from 'react';
import type { PackId } from '../engine/index.js';
import type { ArenaLayout } from './boardLayout.js';
import {
  COLORS,
  RADIUS,
  SPACE,
  TYPE,
  labelStyle,
  outlineButton,
  panelStyle,
} from './designTokens.js';

/**
 * Arena themes — the stage a battle is fought on.
 *
 * A theme is pure presentation: a surface (background + frame), a floor layer
 * drawn behind the units, an optional atmosphere layer graded over them, and
 * the label colours units need to stay readable on that surface. Nothing here
 * touches the simulation, so any pack plays on any theme.
 *
 * Everything is CSS/SVG — no image assets — so themes cost nothing to load and
 * scale to any board size (the same components render the setup-screen
 * previews at 100x60).
 *
 * Layering inside the arena element:
 *   floor 0 · units 10/20 · slashes 30 · beams 35 · damage 40 · ability fx 45
 *   atmosphere 50 · flash 55 · callout 60 · watermark 70
 */

export type ArenaThemeId = 'pitch' | 'world_map' | 'debate_stage' | 'colosseum' | 'neon';

/**
 * What a floor needs to know to draw itself: the frame it fills and where the
 * play area sits inside it. Floor art bleeds under the margin — like real
 * out-of-bounds space — while markings and grids align to the play area.
 *
 * Kept separate from `ArenaLayout` so the setup-screen previews can render the
 * same components at 132x76 by scaling the frame down.
 */
export interface ArenaLayerProps {
  width: number;
  height: number;
  insetX: number;
  insetY: number;
  cols: number;
  rows: number;
}

export function frameFromLayout(layout: ArenaLayout): ArenaLayerProps {
  return {
    width: layout.width,
    height: layout.height,
    insetX: layout.insetX,
    insetY: layout.insetY,
    cols: layout.cols,
    rows: layout.rows,
  };
}

/** The same frame at preview size, so a thumbnail is a true miniature. */
export function previewFrame(
  layout: ArenaLayout,
  width: number,
  height: number
): ArenaLayerProps {
  const sx = width / layout.width;
  const sy = height / layout.height;
  return {
    width,
    height,
    insetX: Math.max(1, layout.insetX * sx),
    insetY: Math.max(1, layout.insetY * sy),
    cols: layout.cols,
    rows: layout.rows,
  };
}

export interface ArenaTheme {
  id: ArenaThemeId;
  name: string;
  blurb: string;
  /** Accent for theme-tied UI chrome (picker highlight, arena glow). */
  accent: string;
  /** The arena element's own background + frame. */
  surface: React.CSSProperties;
  /** Page backdrop behind the arena, so the whole frame reads as one scene. */
  pageBackground: string;
  /** Unit name labels — turf needs white, marble needs ink. */
  labelColor: string;
  labelShadow: string;
  /** Drawn behind the units. */
  Floor: React.FC<ArenaLayerProps>;
  /** Optional grade drawn over the units (haze, scanlines, vignette). */
  Atmosphere?: React.FC<ArenaLayerProps>;
}

const FLOOR_BASE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 0,
  overflow: 'hidden',
};

const ATMOSPHERE_BASE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 50,
};

/* ------------------------------------------------------------------ pitch -- */

/** The original football pitch, kept as its own theme so nothing regresses. */
const PitchFloor: React.FC<ArenaLayerProps> = ({ width, height, insetX, insetY }) => {
  // Touchlines sit halfway out into the margin, so units — which never leave
  // the play area — stay inside the lines instead of straddling them.
  const lineInset = `${insetY * 0.5}px ${insetX * 0.5}px`;
  const boxW = width * 0.44;
  const boxH = height * 0.16;

  return (
    <div style={FLOOR_BASE}>
      {/* Mown stripes */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.045) 0 ' +
          `${height / 10}px, rgba(0,0,0,0.045) ${height / 10}px ${height / 5}px)`,
      }} />
      {/* Touchlines */}
      <div style={{ position: 'absolute', inset: lineInset, border: '2px solid rgba(255,255,255,0.22)' }} />
      {/* Halfway line */}
      <div style={{
        position: 'absolute', left: insetX * 0.5, right: insetX * 0.5, top: '50%',
        borderTop: '2px solid rgba(255,255,255,0.22)',
      }} />
      {/* Centre circle + spot */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: width * 0.24, height: width * 0.24,
        transform: 'translate(-50%, -50%)',
        border: '2px solid rgba(255,255,255,0.22)', borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: 6, height: 6,
        transform: 'translate(-50%, -50%)',
        background: 'rgba(255,255,255,0.3)', borderRadius: '50%',
      }} />
      {/* Penalty boxes at both goals */}
      {[0, 1].map(i => (
        <div
          key={i}
          style={{
            position: 'absolute', left: '50%', width: boxW, height: boxH,
            transform: 'translateX(-50%)',
            [i === 0 ? 'top' : 'bottom']: insetY * 0.5,
            border: '2px solid rgba(255,255,255,0.22)',
            borderTop: i === 0 ? 'none' : '2px solid rgba(255,255,255,0.22)',
            borderBottom: i === 0 ? '2px solid rgba(255,255,255,0.22)' : 'none',
          }}
        />
      ))}
    </div>
  );
};

/* -------------------------------------------------------------- world map -- */

/**
 * Coarse continent outlines in (lon, lat). Stylised on purpose — this is a
 * backdrop, not a reference map — but real coordinates keep the silhouettes
 * recognisable at a glance in a vertical video.
 */
const LANDMASSES: [number, number][][] = [
  // North America
  [[-168, 66], [-140, 70], [-110, 70], [-85, 68], [-60, 58], [-55, 47], [-65, 45],
   [-70, 42], [-75, 35], [-81, 25], [-90, 29], [-97, 26], [-105, 20], [-95, 16],
   [-84, 10], [-78, 8], [-90, 15], [-100, 25], [-115, 30], [-124, 40], [-125, 49],
   [-135, 58], [-150, 60]],
  // Greenland
  [[-45, 60], [-30, 68], [-20, 72], [-25, 80], [-40, 83], [-55, 80], [-58, 72], [-50, 65]],
  // South America
  [[-78, 8], [-70, 10], [-60, 10], [-50, 0], [-35, -6], [-38, -13], [-48, -25],
   [-58, -35], [-62, -42], [-68, -52], [-73, -54], [-72, -45], [-71, -30],
   [-70, -18], [-80, -5], [-78, 2]],
  // Africa
  [[-17, 15], [-10, 28], [0, 32], [10, 34], [20, 32], [32, 31], [35, 25], [40, 15],
   [45, 11], [51, 12], [48, 2], [40, -5], [40, -15], [35, -22], [32, -28], [25, -34],
   [18, -34], [14, -22], [12, -15], [9, -2], [2, 5], [-8, 5], [-13, 9]],
  // Eurasia — up the Atlantic coast, east across the Arctic, back along the south
  [[-10, 36], [-9, 43], [-2, 48], [2, 51], [5, 58], [12, 55], [10, 63], [18, 69],
   [30, 70], [60, 72], [75, 74], [100, 76], [130, 72], [160, 70], [170, 66],
   [160, 60], [142, 54], [130, 45], [122, 40], [120, 33], [110, 22], [105, 10],
   [100, 13], [92, 22], [80, 10], [72, 20], [65, 25], [58, 25], [50, 30], [43, 37],
   [35, 36], [28, 40], [20, 42], [15, 38], [12, 45], [5, 43], [-2, 43]],
  // Australia
  [[113, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19],
   [151, -24], [153, -28], [150, -37], [143, -39], [136, -35], [129, -32],
   [120, -34], [115, -34]],
];

/** Equirectangular projection into a 360x180 viewBox. */
function landPath(points: [number, number][]): string {
  return points
    .map(([lon, lat], i) => `${i === 0 ? 'M' : 'L'}${lon + 180} ${90 - lat}`)
    .join(' ') + ' Z';
}

const WorldMapFloor: React.FC<ArenaLayerProps> = ({ width }) => {
  // The map is letterboxed rather than cropped — `slice` on a 2:1 map would
  // lose half the world on a near-square board. With `meet` it spans the full
  // width, so 30° of latitude is width/12 and the equator is dead centre.
  const lat30 = width / 12;

  return (
    <div style={FLOOR_BASE}>
      {/* Sunlit hemisphere */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 25%, rgba(96,165,250,0.20), transparent 65%)',
      }} />

      {/* Meridians every 30°, full height so the letterbox edges don't show */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(90deg, rgba(125,211,252,0.14) 0 1px, transparent 1px 8.3333%)',
      }} />
      {/* Parallels, keyed to the map's own scale */}
      {[-2, -1, 1, 2].map(n => (
        <div
          key={n}
          style={{
            position: 'absolute', left: 0, right: 0, top: '50%',
            marginTop: n * lat30,
            borderTop: '1px solid rgba(125,211,252,0.12)',
          }}
        />
      ))}
      {/* Equator reads brighter — free "this is Earth" signal */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '50%',
        borderTop: '1px dashed rgba(125,211,252,0.34)',
      }} />

      <svg
        viewBox="0 0 360 180"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {LANDMASSES.map((points, i) => (
          <path
            key={i}
            d={landPath(points)}
            fill="rgba(45,90,80,0.85)"
            stroke="rgba(134,239,172,0.45)"
            strokeWidth={0.6}
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
};

const WorldMapAtmosphere: React.FC<ArenaLayerProps> = () => (
  <div style={{
    ...ATMOSPHERE_BASE,
    background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(2,10,26,0.55) 100%)',
  }} />
);

/* ----------------------------------------------------------- debate stage -- */

const DebateStageFloor: React.FC<ArenaLayerProps> = ({ width, height }) => {
  const horizon = height * 0.66;
  const valanceH = Math.max(10, height * 0.055);
  const lecternW = width * 0.075;

  return (
    <div style={FLOOR_BASE}>
      {/* Backdrop drape with campaign stripes */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: horizon,
        background:
          `repeating-linear-gradient(90deg, rgba(190,30,45,0.22) 0 ${width / 16}px,` +
          ` rgba(226,232,255,0.07) ${width / 16}px ${width / 8}px),` +
          'linear-gradient(180deg, #16223f 0%, #101a33 65%, #0a1020 100%)',
      }} />

      {/* Star valance along the very top, clear of the top rank of units */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: valanceH,
        background: 'linear-gradient(180deg, rgba(30,58,138,0.85), rgba(15,30,75,0.6))',
        borderBottom: '1px solid rgba(255,214,132,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        color: 'rgba(255,255,255,0.55)', fontSize: Math.max(6, valanceH * 0.5),
        letterSpacing: 1,
      }}>
        {Array.from({ length: 11 }, (_, i) => <span key={i}>★</span>)}
      </div>

      {/* Two spotlights raking the stage */}
      {[0.26, 0.74].map(cx => (
        <div
          key={cx}
          className="arena-spotlight"
          style={{
            position: 'absolute', left: `${cx * 100}%`, top: valanceH,
            width: width * 0.52, height: height,
            transform: 'translateX(-50%)',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255,247,214,0.24), transparent 60%)',
          }}
        />
      ))}

      {/* Stage floor — planks receding from camera, glossy under the lights */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: horizon, bottom: 0,
        background:
          `repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 1px, transparent 1px ${height * 0.045}px),` +
          'linear-gradient(180deg, #2e2418 0%, #1b1610 55%, #0f0b07 100%)',
        borderTop: '2px solid rgba(255,214,132,0.4)',
        boxShadow: 'inset 0 14px 26px rgba(255,214,132,0.07)',
      }} />
      {/* Light pool on the boards, where the two lecterns face each other */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: horizon, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 120%, rgba(255,236,180,0.18), transparent 70%)',
      }} />

      {/* Lecterns tucked into the front corners so they frame rather than block */}
      {[0.07, 0.93].map(cx => (
        <div
          key={cx}
          style={{
            position: 'absolute', left: `${cx * 100}%`, bottom: height * 0.03,
            width: lecternW, height: height * 0.15,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #443a2b, #1e1811)',
            borderTop: `${Math.max(2, height * 0.01)}px solid rgba(255,214,132,0.55)`,
            borderRadius: '3px 3px 1px 1px',
            boxShadow: '0 6px 14px rgba(0,0,0,0.55)',
          }}
        />
      ))}
    </div>
  );
};

const DebateStageAtmosphere: React.FC<ArenaLayerProps> = () => (
  <div style={{
    ...ATMOSPHERE_BASE,
    background:
      'radial-gradient(ellipse at 50% 30%, rgba(255,247,214,0.10), transparent 55%),' +
      'radial-gradient(ellipse at 50% 55%, transparent 50%, rgba(4,6,14,0.6) 100%)',
  }} />
);

/* -------------------------------------------------------------- colosseum -- */

const ColosseumFloor: React.FC<ArenaLayerProps> = ({ width, height }) => {
  const archCount = 11;

  return (
    <div style={FLOOR_BASE}>
      {/* Stone stands wrapping the bowl */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #3c3227 0%, #4a3d2e 40%, #2e251c 100%)',
      }} />
      {/* Arcade of arches along the rim */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: height * 0.13,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: `0 ${width * 0.01}px`,
      }}>
        {Array.from({ length: archCount }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              margin: `0 ${width * 0.004}px`,
              height: '82%',
              background: 'linear-gradient(180deg, #17120d, #241c14)',
              borderRadius: '999px 999px 0 0',
              border: '1px solid rgba(255,224,168,0.14)',
              borderBottom: 'none',
            }}
          />
        ))}
      </div>
      {/* Tiered seating hint */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-radial-gradient(ellipse at 50% 50%, transparent 0 ' +
          `${height * 0.045}px, rgba(0,0,0,0.10) ${height * 0.045}px ${height * 0.055}px)`,
      }} />

      {/* Sand floor */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: width * 0.94, height: height * 0.88,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at 42% 35%, #e7cf9b 0%, #d4b57c 45%, #b7965f 80%, #97794a 100%)',
        boxShadow: 'inset 0 0 40px rgba(90,63,30,0.55), 0 0 0 ' +
          `${Math.max(3, height * 0.012)}px #241c14, 0 0 34px rgba(0,0,0,0.6)`,
        overflow: 'hidden',
      }}>
        {/* Raked sand rings */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-radial-gradient(ellipse at 50% 50%, transparent 0 ' +
            `${height * 0.05}px, rgba(120,88,44,0.16) ${height * 0.05}px ${height * 0.058}px)`,
        }} />
        {/* Centre marker */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: width * 0.1, height: width * 0.1,
          transform: 'translate(-50%, -50%) rotate(45deg)',
          border: `${Math.max(1, height * 0.004)}px solid rgba(120,88,44,0.35)`,
        }} />
      </div>

      {/* Gladiator gates east/west */}
      {[0, 1].map(i => (
        <div
          key={i}
          style={{
            position: 'absolute', top: '50%',
            [i === 0 ? 'left' : 'right']: 0,
            width: width * 0.05, height: height * 0.2,
            transform: 'translateY(-50%)',
            background: 'linear-gradient(90deg, #0d0a07, #241c14)',
            borderRadius: i === 0 ? '0 999px 999px 0' : '999px 0 0 999px',
            border: '1px solid rgba(255,224,168,0.18)',
          }}
        />
      ))}
    </div>
  );
};

const ColosseumAtmosphere: React.FC<ArenaLayerProps> = () => (
  <div style={{
    ...ATMOSPHERE_BASE,
    background:
      'radial-gradient(ellipse at 35% 20%, rgba(255,214,140,0.14), transparent 55%),' +
      'radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(20,13,6,0.62) 100%)',
  }} />
);

/* ------------------------------------------------------------------- neon -- */

const NeonFloor: React.FC<ArenaLayerProps> = ({ width, height, insetX, insetY, cols, rows }) => {
  // Grid lines land on board-cell boundaries, so they line up with the play
  // area rather than the arena frame — and stay square in any export format.
  const cellX = (width - insetX * 2) / cols;
  const cellY = (height - insetY * 2) / rows;
  const gridInset = `${insetY}px ${insetX}px`;

  return (
    <div style={FLOOR_BASE}>
      <div style={{
        position: 'absolute', inset: gridInset,
        background:
          `repeating-linear-gradient(90deg, rgba(56,189,248,0.42) 0 1px, transparent 1px ${cellX}px),` +
          `repeating-linear-gradient(180deg, rgba(217,70,239,0.36) 0 1px, transparent 1px ${cellY}px)`,
      }} />
      {/* Glow bloom over the grid, so lines read as light not ink */}
      <div style={{
        position: 'absolute', inset: gridInset,
        background:
          `repeating-linear-gradient(90deg, rgba(56,189,248,0.16) 0 2px, transparent 2px ${cellX}px),` +
          `repeating-linear-gradient(180deg, rgba(217,70,239,0.14) 0 2px, transparent 2px ${cellY}px)`,
        filter: 'blur(3px)',
      }} />
      {/* Horizon sweep */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '50%', height: 2,
        background: 'linear-gradient(90deg, transparent, #22d3ee 20%, #f0abfc 80%, transparent)',
        boxShadow: '0 0 18px #22d3ee, 0 0 40px rgba(240,171,252,0.6)',
      }} />
      {/* Centre ring */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: width * 0.3, height: width * 0.3,
        transform: 'translate(-50%, -50%)',
        border: '1px solid rgba(103,232,249,0.5)', borderRadius: '50%',
        boxShadow: '0 0 20px rgba(34,211,238,0.35), inset 0 0 26px rgba(217,70,239,0.22)',
      }} />
      {/* Corner glows */}
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'radial-gradient(circle at 0% 0%, rgba(217,70,239,0.22), transparent 40%),' +
          'radial-gradient(circle at 100% 100%, rgba(34,211,238,0.22), transparent 40%)',
      }} />
    </div>
  );
};

const NeonAtmosphere: React.FC<ArenaLayerProps> = () => (
  <div style={{
    ...ATMOSPHERE_BASE,
    background:
      'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px),' +
      'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(2,4,14,0.55) 100%)',
  }} />
);

/* ---------------------------------------------------------------- registry -- */

export const ARENA_THEMES: Record<ArenaThemeId, ArenaTheme> = {
  pitch: {
    id: 'pitch',
    name: 'Football Pitch',
    blurb: 'Floodlit turf, mown stripes',
    accent: '#4ade80',
    surface: {
      background: 'linear-gradient(180deg, #2d5a27 0%, #3a7a32 50%, #2d5a27 100%)',
      border: '3px solid rgba(255,255,255,0.2)',
      borderRadius: 10,
      boxShadow: '0 0 60px rgba(74,222,128,0.12)',
    },
    pageBackground: 'radial-gradient(ellipse at 50% 0%, #16281a 0%, #0d1410 60%, #080c0a 100%)',
    labelColor: '#ffffff',
    labelShadow: '0 0 3px #000, 0 1px 2px #000',
    Floor: PitchFloor,
  },
  world_map: {
    id: 'world_map',
    name: 'World Map',
    blurb: 'Nations clash over the globe',
    accent: '#60a5fa',
    surface: {
      background: 'linear-gradient(180deg, #071c33 0%, #0a2540 45%, #05121f 100%)',
      border: '3px solid rgba(125,211,252,0.28)',
      borderRadius: 10,
      boxShadow: '0 0 60px rgba(56,189,248,0.16)',
    },
    pageBackground: 'radial-gradient(ellipse at 50% 0%, #061627 0%, #030a14 60%, #01050b 100%)',
    labelColor: '#e0f2fe',
    labelShadow: '0 0 4px #001220, 0 1px 2px #000',
    Floor: WorldMapFloor,
    Atmosphere: WorldMapAtmosphere,
  },
  debate_stage: {
    id: 'debate_stage',
    name: 'Debate Stage',
    blurb: 'Lecterns, spotlights, stripes',
    accent: '#fbbf24',
    surface: {
      background: 'linear-gradient(180deg, #0d1526 0%, #131c33 60%, #0a0f1c 100%)',
      border: '3px solid rgba(255,214,132,0.3)',
      borderRadius: 10,
      boxShadow: '0 0 60px rgba(251,191,36,0.14)',
    },
    pageBackground: 'radial-gradient(ellipse at 50% 0%, #131a2e 0%, #080b16 60%, #04060c 100%)',
    labelColor: '#fff7d6',
    labelShadow: '0 0 4px #000, 0 1px 2px #000',
    Floor: DebateStageFloor,
    Atmosphere: DebateStageAtmosphere,
  },
  colosseum: {
    id: 'colosseum',
    name: 'Colosseum',
    blurb: 'Sand, stone arches, sunlight',
    accent: '#f59e0b',
    surface: {
      background: 'linear-gradient(180deg, #1b1510 0%, #241c14 100%)',
      border: '3px solid rgba(255,224,168,0.24)',
      borderRadius: 10,
      boxShadow: '0 0 60px rgba(245,158,11,0.16)',
    },
    pageBackground: 'radial-gradient(ellipse at 50% 0%, #241a10 0%, #120d08 60%, #080503 100%)',
    // Units roam off the sand and onto the dark stone ring, so labels have to
    // read on both — light text with a hard shadow, not ink on sand.
    labelColor: '#fff6e2',
    labelShadow: '0 0 3px #1a1005, 0 1px 2px #000',
    Floor: ColosseumFloor,
    Atmosphere: ColosseumAtmosphere,
  },
  neon: {
    id: 'neon',
    name: 'Neon Grid',
    blurb: 'Abstract synth arena',
    accent: '#22d3ee',
    surface: {
      background: 'linear-gradient(180deg, #0a0618 0%, #120a26 50%, #05030f 100%)',
      border: '3px solid rgba(103,232,249,0.35)',
      borderRadius: 10,
      boxShadow: '0 0 70px rgba(34,211,238,0.25)',
    },
    pageBackground: 'radial-gradient(ellipse at 50% 0%, #150a2b 0%, #08041a 55%, #02010a 100%)',
    labelColor: '#e0f7ff',
    labelShadow: '0 0 5px #06b6d4, 0 1px 2px #000',
    Floor: NeonFloor,
    Atmosphere: NeonAtmosphere,
  },
};

export const ARENA_THEME_LIST: ArenaTheme[] = Object.values(ARENA_THEMES);

/** `auto` picks the theme that suits the pack; anything else is an explicit choice. */
export type ArenaThemeSelection = 'auto' | ArenaThemeId;

/** Each pack has an obvious stage — countries belong on the map, clubs on turf. */
export function defaultThemeForPack(packId: PackId): ArenaThemeId {
  switch (packId) {
    case 'countries':
      return 'world_map';
    case 'premier_league':
    case 'club_football':
      return 'pitch';
    default:
      return 'neon';
  }
}

export function resolveTheme(selection: ArenaThemeSelection, packId: PackId): ArenaTheme {
  return ARENA_THEMES[selection === 'auto' ? defaultThemeForPack(packId) : selection]
    ?? ARENA_THEMES[defaultThemeForPack(packId)];
}

const STORAGE_KEY = 'auto-battler:arena-theme';

function loadSelection(): ArenaThemeSelection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'auto' || (raw && raw in ARENA_THEMES)) return raw as ArenaThemeSelection;
  } catch {
    // Private mode / storage disabled — fall through to auto.
  }
  return 'auto';
}

/**
 * Persisted theme choice, shared by the setup screen and both battle views —
 * pick a stage once and every battle uses it until you change it.
 */
export function useArenaTheme(packId: PackId) {
  const [selection, setSelection] = useState<ArenaThemeSelection>(loadSelection);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, selection);
    } catch {
      // Same as above — the choice just won't survive a reload.
    }
  }, [selection]);

  const select = useCallback((next: ArenaThemeSelection) => setSelection(next), []);

  const theme = resolveTheme(selection, packId);

  // Paint the page itself too — `#root` is padded, so without this a strip of
  // the default body colour frames the scene in a full-screen capture.
  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = theme.pageBackground;
    return () => { document.body.style.background = previous; };
  }, [theme.pageBackground]);

  return { theme, selection, select };
}

/* ------------------------------------------------------------- components -- */

/** Floor layer. Render as the arena's first child. */
export const ArenaBackdrop: React.FC<{ theme: ArenaTheme; layout: ArenaLayout }> = ({
  theme, layout,
}) => <theme.Floor {...frameFromLayout(layout)} />;

/**
 * Atmosphere grade. Render after the effect layers but before the watermark, so
 * it colours the fight without dimming the branding.
 */
export const ArenaAtmosphere: React.FC<{ theme: ArenaTheme; layout: ArenaLayout }> = ({
  theme, layout,
}) => (theme.Atmosphere ? <theme.Atmosphere {...frameFromLayout(layout)} /> : null);

/**
 * Live miniature of a theme in the current export format — so the thumbnail
 * shows the actual frame shape, not a generic rectangle.
 */
export const ArenaThemePreview: React.FC<{
  theme: ArenaTheme;
  layout: ArenaLayout;
  /** Longest edge of the thumbnail; the other follows the format's aspect. */
  size?: number;
}> = ({ theme, layout, size = 76 }) => {
  // Fixed height, width from the format's aspect — so a row of thumbnails
  // lines up and each one is visibly the shape it will export as.
  const height = size;
  const width = Math.round(size * (layout.width / layout.height));
  const frame = previewFrame(layout, width, height);

  return (
    <div style={{
      position: 'relative', width, height, overflow: 'hidden', margin: '0 auto',
      borderRadius: RADIUS.sm, ...theme.surface,
      border: '1px solid rgba(255,255,255,0.14)',
      boxShadow: 'none',
    }}>
      <theme.Floor {...frame} />
      {theme.Atmosphere && <theme.Atmosphere {...frame} />}
    </div>
  );
};

/** Card grid of themes — used on the setup screen and inside the ARENA panel. */
export const ArenaThemeGrid: React.FC<{
  selection: ArenaThemeSelection;
  packId: PackId;
  layout: ArenaLayout;
  onSelect: (selection: ArenaThemeSelection) => void;
  compact?: boolean;
}> = ({ selection, packId, layout, onSelect, compact = false }) => {
  const autoTheme = ARENA_THEMES[defaultThemeForPack(packId)];
  const previewSize = compact ? 58 : 84;
  // Card width follows the format: a 9:16 thumbnail is narrow, 16:9 is wide.
  const cardWidth = Math.round(
    Math.max(96, (previewSize * layout.width) / layout.height) + 18
  );

  const options: { key: ArenaThemeSelection; theme: ArenaTheme; label: string; sub: string }[] = [
    {
      key: 'auto',
      theme: autoTheme,
      label: 'Auto',
      sub: `Matches pack — ${autoTheme.name}`,
    },
    ...ARENA_THEME_LIST.map(theme => ({
      key: theme.id as ArenaThemeSelection,
      theme,
      label: theme.name,
      sub: theme.blurb,
    })),
  ];

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 10,
      justifyContent: 'center', maxWidth: compact ? cardWidth * 2 + 12 : 800,
    }}>
      {options.map(({ key, theme, label, sub }) => {
        const selected = key === selection;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              padding: 8,
              background: selected ? COLORS.bg.panelRaised : 'transparent',
              border: `2px solid ${selected ? theme.accent : COLORS.border.subtle}`,
              borderRadius: RADIUS.lg, cursor: 'pointer',
              color: selected ? theme.accent : COLORS.text.secondary,
              textAlign: 'center', width: cardWidth,
            }}
          >
            <ArenaThemePreview theme={theme} layout={layout} size={previewSize} />
            <div style={{
              fontSize: TYPE.size.md - 1, fontWeight: TYPE.weight.bold,
              letterSpacing: TYPE.tracking.tight, marginTop: 7,
            }}>
              {label}
            </div>
            <div style={{
              fontSize: TYPE.size.xs, color: COLORS.text.muted,
              marginTop: 3, lineHeight: 1.35,
            }}>
              {sub}
            </div>
          </button>
        );
      })}
    </div>
  );
};

/** Compact in-battle switcher — an ARENA button that expands into the grid. */
export const ArenaThemeControls: React.FC<{
  selection: ArenaThemeSelection;
  theme: ArenaTheme;
  packId: PackId;
  layout: ArenaLayout;
  onSelect: (selection: ArenaThemeSelection) => void;
}> = ({ selection, theme, packId, layout, onSelect }) => {
  const [open, setOpen] = useState(false);
  const cardWidth = Math.max(96, (58 * layout.width) / layout.height) + 18;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={outlineButton(theme.accent)}>
        ARENA
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          // Explicit width: an absolutely positioned box anchored to a narrow
          // button otherwise shrinks to a single card per row.
          width: Math.round(cardWidth * 2 + 40),
          display: 'flex', flexDirection: 'column', gap: SPACE.md,
          padding: 14, zIndex: 100, ...panelStyle,
        }}>
          <div style={{ ...labelStyle, letterSpacing: 1.5 }}>Arena theme</div>
          <ArenaThemeGrid
            selection={selection}
            packId={packId}
            layout={layout}
            onSelect={onSelect}
            compact
          />
        </div>
      )}
    </div>
  );
};

/** Theme animations, appended to each view's style block. */
export const ARENA_THEME_CSS = `
  @keyframes arena-spot-drift {
    0%, 100% { opacity: 0.85; transform: translateX(-50%) translateY(0); }
    50%      { opacity: 1;    transform: translateX(-50%) translateY(2%); }
  }
  .arena-spotlight {
    animation: arena-spot-drift 6s ease-in-out infinite;
  }
`;
