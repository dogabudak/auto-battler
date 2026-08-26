/**
 * Design tokens — the palette and type scale everything in the renderer draws
 * from, replacing ad-hoc inline hexes.
 *
 * Two scales, because the app renders two different things:
 *
 *   - **Chrome** (setup screen, buttons, panels): sized in screen pixels. It is
 *     a desktop tool UI and never appears in an export.
 *   - **Arena** (unit labels, damage numbers, callouts, watermark): sized as a
 *     *ratio of the board tile*, so text keeps its proportions whichever export
 *     format is selected. A 1080x1920 vertical frame has much bigger tiles than
 *     a 1920x1080 one; hardcoded 8px labels are unreadable in the first and
 *     wrong in both. `getArenaLayout()` turns these ratios into pixel sizes.
 *
 * Arena *artwork* — the gradients and markings inside each theme's floor — is
 * deliberately not tokenised. A pitch's green and a colosseum's sand are
 * illustration, not UI, and forcing them through a shared palette would flatten
 * exactly the distinctiveness the themes exist to provide. Theme accents, which
 * do drive chrome (picker highlight, arena glow), come from here.
 */

export const COLORS = {
  /** Surfaces, darkest to lightest. */
  bg: {
    page: '#0a0d14',
    panel: '#151a26',
    panelRaised: '#1b2030',
    inset: '#0f1420',
    selected: '#1d3a5f',
  },
  border: {
    subtle: '#2a3040',
    default: '#333c50',
    strong: '#60a5fa',
  },
  text: {
    primary: '#e8ecf5',
    secondary: '#8b93a7',
    muted: '#5f6880',
    faint: '#3f4658',
    /** On a light/accent fill. */
    onAccent: '#04210f',
    onSelected: '#93c5fd',
  },
  accent: {
    blue: '#60a5fa',
    blueSoft: '#93c5fd',
    green: '#4ade80',
    greenDeep: '#22c55e',
    gold: '#fbbf24',
    red: '#f87171',
    redDeep: '#ef4444',
  },
  /** Health bar, high → low. */
  hp: {
    high: '#4ade80',
    mid: '#fbbf24',
    low: '#f87171',
  },
  /** Damage feedback. Hard-edged and high-contrast so it survives compression. */
  damage: {
    miss: '#888888',
    light: '#ff8844',
    heavy: '#ff2222',
    lineMiss: '#888888',
    lineLight: '#ffaa44',
    lineHeavy: '#ff4444',
    slashGlow: '#ff6600',
    slashGlowOuter: '#ff3300',
  },
  /**
   * Ability identity colours — one unmistakable hue each, so a viewer can read
   * what happened from a single frame. Consumed by ABILITY_VFX.
   */
  ability: {
    rage: '#ff3b30',
    rageAccent: '#ffd0c4',
    block: '#38bdf8',
    blockAccent: '#e0f2fe',
    blitz: '#facc15',
    blitzAccent: '#fffbeb',
    siphon: '#22c55e',
    siphonAccent: '#dcfce7',
    execute: '#d946ef',
    executeAccent: '#fae8ff',
  },
  shadow: {
    hard: 'rgba(0,0,0,0.9)',
    panel: 'rgba(0,0,0,0.5)',
  },
} as const;

/** Screen-pixel type scale for tool chrome. */
export const TYPE = {
  size: {
    /** Field hints, chip captions. */
    xs: 10,
    /** Section labels, panel fields. */
    sm: 11,
    /** Body, card blurbs. */
    md: 13,
    /** Card titles, buttons. */
    lg: 15,
    /** Primary buttons. */
    xl: 18,
    /** Screen titles. */
    display: 32,
    /** Setup screen wordmark. */
    displayLg: 40,
  },
  weight: {
    normal: 400,
    bold: 700,
    black: 900,
  },
  tracking: {
    tight: 0.5,
    normal: 1,
    wide: 2,
    wider: 3,
  },
} as const;

/**
 * Arena type scale, as a multiple of one board tile. Applied by
 * `getArenaLayout()` so every format gets proportionate text.
 *
 * A tile is roughly one unit wide, so 0.3 means "label text is about a third of
 * a unit tall" — readable on a phone at any of the export sizes.
 */
export const ARENA_TYPE_RATIO = {
  unitLabel: 0.3,
  damageNumber: 0.44,
  damageNumberBig: 0.58,
  calloutTitle: 1.05,
  calloutName: 0.34,
  slash: 0.6,
  watermark: 0.3,
} as const;

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  pill: 999,
} as const;

export const SPACE = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 26,
} as const;

/* ------------------------------------------------------- chrome recipes -- */

/** Section heading on the setup screen. */
export const labelStyle: React.CSSProperties = {
  fontSize: TYPE.size.sm,
  letterSpacing: TYPE.tracking.wide,
  color: COLORS.text.muted,
  textTransform: 'uppercase',
};

/** Field caption inside a panel. */
export const fieldLabelStyle: React.CSSProperties = {
  fontSize: TYPE.size.sm,
  letterSpacing: TYPE.tracking.normal,
  color: COLORS.text.secondary,
  textTransform: 'uppercase',
};

export const inputStyle: React.CSSProperties = {
  background: COLORS.bg.inset,
  border: `1px solid ${COLORS.border.default}`,
  borderRadius: RADIUS.sm,
  color: COLORS.text.primary,
  fontSize: TYPE.size.md,
  padding: '5px 8px',
};

/** Floating settings panel (BRAND, ARENA, FORMAT). */
export const panelStyle: React.CSSProperties = {
  background: COLORS.bg.panel,
  border: `1px solid ${COLORS.border.subtle}`,
  borderRadius: RADIUS.lg,
  boxShadow: `0 8px 24px ${COLORS.shadow.panel}`,
};

/** Outlined control button in the battle toolbar. */
export function outlineButton(accent: string): React.CSSProperties {
  return {
    padding: '12px 20px',
    fontSize: TYPE.size.lg - 1,
    fontWeight: TYPE.weight.bold,
    background: 'transparent',
    border: `1px solid ${accent}`,
    borderRadius: RADIUS.md,
    cursor: 'pointer',
    color: accent,
    letterSpacing: TYPE.tracking.normal,
  };
}

/** Filled primary action. */
export function primaryButton(
  from: string,
  to: string,
  color: string = COLORS.text.onAccent
): React.CSSProperties {
  return {
    padding: '12px 40px',
    fontSize: TYPE.size.xl,
    fontWeight: TYPE.weight.bold,
    background: `linear-gradient(135deg, ${from}, ${to})`,
    border: 'none',
    borderRadius: RADIUS.md,
    cursor: 'pointer',
    color,
    letterSpacing: TYPE.tracking.normal,
  };
}
