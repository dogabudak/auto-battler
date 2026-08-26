export interface Position {
  x: number;
  y: number;
}

export type SvgType = 'swordsman' | 'spearman' | 'knight' | 'monster' | 'robot';

export interface SpritePosition {
  col: number;
  row: number;
}

export type AbilityId = 'rage' | 'fortress' | 'blitz' | 'siphon' | 'execute';

export interface Unit {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  attackSpeed: number;
  range: number;
  cooldown: number;
  svgType?: SvgType;
  imageUrl?: string;
  sprite?: SpritePosition;
  abilities?: AbilityId[];
  /** Abilities that have already fired and can't fire again (e.g. rage). */
  spentAbilities?: AbilityId[];
}

export interface UnitTemplate {
  svgType?: SvgType;
  imageUrl?: string;
  sprite?: SpritePosition;
  hp: number;
  attack: number;
  range: number;
  attackSpeed: number;
  abilities?: AbilityId[];
}

export interface BoardState {
  units: Unit[];
}

export interface Grid {
  width: number;
  height: number;
  tileSize: number;
}

/**
 * Board dimensions in tiles, as the simulators need them.
 *
 * The grid is no longer fixed: each export format (9:16, 1:1, 16:9) shapes the
 * board to its frame, so movement clamping has to be told the bounds rather
 * than reading a constant. See `src/renderer/exportFormats.ts`.
 */
export interface BoardBounds {
  width: number;
  height: number;
}

/** Fallback bounds for callers that don't select a format (tests, scripts). */
export const BOARD_CONFIG: Grid = {
  width: 15,
  height: 14,
  tileSize: 1,
};

export type BattleLog = any[];

export interface SimulationResult {
  winner: string | 'draw';
  battleLog: BattleLog;
}

export interface UnitAnimState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  attacking: boolean;
  attackDir: number;
  deathProgress: number; // 0 = alive, 1 = fully dead
  /** Abilities whose buff is still running — drives the persistent aura. */
  auras: AbilityId[];
}

/** One ability trigger, positioned and timed for the VFX layer. */
export interface AbilityEffect {
  id: string;
  abilityId: AbilityId;
  /** Where the effect plays — the unit the ability happened to. */
  x: number;
  y: number;
  /** Origin for directional effects (e.g. siphon drains from here). */
  fromX?: number;
  fromY?: number;
  /** Amount healed/blocked/dealt, shown as a floating number when set. */
  value?: number;
  startTime: number;
}

/** Big centre-screen banner for the loudest triggers. */
export interface AbilityCallout {
  id: string;
  abilityId: AbilityId;
  unitName: string;
  startTime: number;
}

export interface SlashEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  damage: number;
  startTime: number;
}

export interface AttackLine {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  damage: number;
  startTime: number;
}

export interface UnitSvgProps {
  size: number;
}
