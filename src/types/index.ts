export interface Position {
  x: number;
  y: number;
}

export type SvgType = 'swordsman' | 'spearman' | 'knight' | 'monster' | 'robot';

export interface SpritePosition {
  col: number;
  row: number;
}

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
}

export interface UnitTemplate {
  svgType?: SvgType;
  imageUrl?: string;
  sprite?: SpritePosition;
  hp: number;
  attack: number;
  range: number;
  attackSpeed: number;
}

export interface BoardState {
  units: Unit[];
}

export interface Grid {
  width: number;
  height: number;
  tileSize: number;
}

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
