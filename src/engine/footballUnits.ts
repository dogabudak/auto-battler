import { UnitTemplate } from '../types/index.js';
import footballData from '../data/footballStats.json' with { type: 'json' };

/**
 * Normalize a value to a target range using min-max scaling
 */
function normalize(
  value: number,
  min: number,
  max: number,
  targetMin: number,
  targetMax: number
): number {
  if (max === min) return (targetMin + targetMax) / 2;
  const normalized = ((value - min) / (max - min)) * (targetMax - targetMin) + targetMin;
  return Math.round(normalized);
}

// Extract all club values for normalization bounds
const clubs = Object.values(footballData.clubs);

// Offensive metrics
const marketValues = clubs.map(c => c.marketValue);
const goalsValues = clubs.map(c => c.goalsScored);
const xGValues = clubs.map(c => c.xG);
const shotsValues = clubs.map(c => c.shotsPerGame);

// Defensive metrics
const goalsConcededValues = clubs.map(c => c.goalsConceded);
const xGAValues = clubs.map(c => c.xGA);
const cleanSheetValues = clubs.map(c => c.cleanSheets);

// Tempo metrics
const possessionValues = clubs.map(c => c.possession);
const passAccuracyValues = clubs.map(c => c.passAccuracy);

// Find min/max for each metric
const marketMin = Math.min(...marketValues);
const marketMax = Math.max(...marketValues);
const goalsMin = Math.min(...goalsValues);
const goalsMax = Math.max(...goalsValues);
const xGMin = Math.min(...xGValues);
const xGMax = Math.max(...xGValues);
const shotsMin = Math.min(...shotsValues);
const shotsMax = Math.max(...shotsValues);
const goalsConcededMin = Math.min(...goalsConcededValues);
const goalsConcededMax = Math.max(...goalsConcededValues);
const xGAMin = Math.min(...xGAValues);
const xGAMax = Math.max(...xGAValues);
const cleanSheetMin = Math.min(...cleanSheetValues);
const cleanSheetMax = Math.max(...cleanSheetValues);
const possessionMin = Math.min(...possessionValues);
const possessionMax = Math.max(...possessionValues);
const passAccuracyMin = Math.min(...passAccuracyValues);
const passAccuracyMax = Math.max(...passAccuracyValues);

/**
 * Calculate HP from squad value + defensive strength
 * Components:
 * - Market value (40%): Squad depth and quality
 * - Goals conceded (20%): Defensive record (inverted - fewer = better)
 * - xGA (20%): Expected defensive performance (inverted)
 * - Clean sheets (20%): Shutout ability
 * Range: 8-18, +2 bonus for tier 1 clubs
 */
function calculateHP(
  marketValue: number,
  goalsConceded: number,
  xGA: number,
  cleanSheets: number,
  tier: number
): number {
  // Market value component (0-10 contribution)
  const marketScore = normalize(marketValue, marketMin, marketMax, 0, 10);

  // Defensive components (inverted - lower conceded = higher score)
  const concededScore = normalize(goalsConcededMax - goalsConceded, 0, goalsConcededMax - goalsConcededMin, 0, 10);
  const xGAScore = normalize(xGAMax - xGA, 0, xGAMax - xGAMin, 0, 10);
  const cleanSheetScore = normalize(cleanSheets, cleanSheetMin, cleanSheetMax, 0, 10);

  // Weighted combination
  const combinedScore = (marketScore * 0.4) + (concededScore * 0.2) + (xGAScore * 0.2) + (cleanSheetScore * 0.2);

  // Map to HP range (8-18)
  const baseHP = Math.round((combinedScore / 10) * 10 + 8);

  // Tier 1 clubs get bonus HP (elite squads)
  return tier === 1 ? Math.min(20, baseHP + 2) : Math.min(18, baseHP);
}

/**
 * Calculate Attack from offensive metrics
 * Components:
 * - Goals scored (40%): Actual output
 * - xG (35%): Expected offensive quality
 * - Shots per game (25%): Attacking threat volume
 * Range: 2-5, +1 bonus for tier 1 clubs
 */
function calculateAttack(
  goalsScored: number,
  xG: number,
  shotsPerGame: number,
  tier: number
): number {
  const goalsScore = normalize(goalsScored, goalsMin, goalsMax, 0, 10);
  const xGScore = normalize(xG, xGMin, xGMax, 0, 10);
  const shotsScore = normalize(shotsPerGame, shotsMin, shotsMax, 0, 10);

  // Weighted combination
  const combinedScore = (goalsScore * 0.4) + (xGScore * 0.35) + (shotsScore * 0.25);

  // Map to Attack range (2-5)
  const baseAttack = Math.round((combinedScore / 10) * 3 + 2);

  // Tier 1 clubs get +1 attack (quality finishing)
  return tier === 1 ? Math.min(6, baseAttack + 1) : Math.min(5, baseAttack);
}

/**
 * Calculate Attack Speed from tempo metrics
 * Components:
 * - Possession (60%): Ball control = tempo
 * - Pass accuracy (40%): Quick, precise play
 * Range: 1-4
 */
function calculateAttackSpeed(possession: number, passAccuracy: number): number {
  const possessionScore = normalize(possession, possessionMin, possessionMax, 0, 10);
  const passScore = normalize(passAccuracy, passAccuracyMin, passAccuracyMax, 0, 10);

  // Weighted combination
  const combinedScore = (possessionScore * 0.6) + (passScore * 0.4);

  // Map to Speed range (1-4)
  return Math.round((combinedScore / 10) * 3 + 1);
}

// Generate unit templates for all clubs
type ClubKey = keyof typeof footballData.clubs;

export const FOOTBALL_TEMPLATES: Record<string, UnitTemplate> = {};

for (const [key, club] of Object.entries(footballData.clubs)) {
  const hp = calculateHP(club.marketValue, club.goalsConceded, club.xGA, club.cleanSheets, club.tier);
  const attack = calculateAttack(club.goalsScored, club.xG, club.shotsPerGame, club.tier);
  const attackSpeed = calculateAttackSpeed(club.possession, club.passAccuracy);

  FOOTBALL_TEMPLATES[key] = {
    imageUrl: `/crests/${key}.png`,
    hp,
    attack,
    range: 1,
    attackSpeed,
  };
}

// Export individual club stats for debugging/display
export interface ClubStats {
  name: string;
  league: string;
  country: string;
  hp: number;
  attack: number;
  attackSpeed: number;
  tier: number;
  rawData: {
    marketValue: number;
    goalsScored: number;
    goalsConceded: number;
    xG: number;
    xGA: number;
    possession: number;
    passAccuracy: number;
    shotsPerGame: number;
    cleanSheets: number;
    trophies: number;
  };
}

export function getClubStats(clubKey: string): ClubStats | null {
  const club = footballData.clubs[clubKey as ClubKey];
  if (!club) return null;

  const template = FOOTBALL_TEMPLATES[clubKey];

  return {
    name: club.name,
    league: club.league,
    country: club.country,
    hp: template.hp,
    attack: template.attack,
    attackSpeed: template.attackSpeed,
    tier: club.tier,
    rawData: {
      marketValue: club.marketValue,
      goalsScored: club.goalsScored,
      goalsConceded: club.goalsConceded,
      xG: club.xG,
      xGA: club.xGA,
      possession: club.possession,
      passAccuracy: club.passAccuracy,
      shotsPerGame: club.shotsPerGame,
      cleanSheets: club.cleanSheets,
      trophies: club.trophies,
    },
  };
}

// Export list of all club keys
export const FOOTBALL_KEYS = Object.keys(footballData.clubs);

// Export clubs grouped by league
export function getClubsByLeague(): Record<string, string[]> {
  const byLeague: Record<string, string[]> = {};

  for (const [key, club] of Object.entries(footballData.clubs)) {
    if (!byLeague[club.league]) {
      byLeague[club.league] = [];
    }
    byLeague[club.league].push(key);
  }

  return byLeague;
}

// Export clubs grouped by country
export function getClubsByCountry(): Record<string, string[]> {
  const byCountry: Record<string, string[]> = {};

  for (const [key, club] of Object.entries(footballData.clubs)) {
    if (!byCountry[club.country]) {
      byCountry[club.country] = [];
    }
    byCountry[club.country].push(key);
  }

  return byCountry;
}

// Export top N clubs by a specific stat
export function getTopClubs(
  stat: 'hp' | 'attack' | 'attackSpeed',
  n: number = 10
): string[] {
  return Object.entries(FOOTBALL_TEMPLATES)
    .sort((a, b) => b[1][stat] - a[1][stat])
    .slice(0, n)
    .map(([key]) => key);
}

// Get clubs by tier (1 = elite, 2 = good, 3 = mid, 4 = lower)
export function getClubsByTier(tier: number): string[] {
  return Object.entries(footballData.clubs)
    .filter(([_, club]) => club.tier === tier)
    .map(([key]) => key);
}

// Display names for UI
export const FOOTBALL_DISPLAY_NAMES: Record<string, string> = {};
for (const [key, club] of Object.entries(footballData.clubs)) {
  FOOTBALL_DISPLAY_NAMES[key] = club.name;
}
