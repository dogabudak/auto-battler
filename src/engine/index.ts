import { BoardState, BoardBounds, SimulationResult } from '../types/index.js';
import { BattleSimulator } from './simulator.js';

/**
 * Run an FFA battle. `bounds` is the board grid in tiles — pass the one the
 * selected export format uses, or omit it to fall back to BOARD_CONFIG.
 */
export const runSimulation = (
  boardState: BoardState,
  bounds?: BoardBounds
): SimulationResult => {
  const simulator = new BattleSimulator(bounds);
  return simulator.runSimulation(boardState);
};

export { BattleSimulator } from './simulator.js';
export { BallBattleSimulator } from './ballSimulator.js';
export { createUnit, generateUnitId } from './unitFactory.js';
export { UNIT_TEMPLATES } from './units.js';

// Entity packs
export {
  PACKS,
  PACK_LIST,
  DEFAULT_PACK_ID,
  getPack,
  getEntityName,
  getGroupNames,
  buildRoster,
  entityPower,
} from './packs.js';
export type { PackId, EntityPack, RosterMode, RosterOptions } from './packs.js';

// Abilities
export {
  ABILITIES,
  deriveAbilities,
  hasAbility,
  resolveAbilityAttack,
} from './abilities.js';
export type { AbilityDef, AbilityTrigger, AbilityAttackOutcome } from './abilities.js';

// Country units
export {
  COUNTRY_TEMPLATES,
  COUNTRY_KEYS,
  COUNTRY_DISPLAY_NAMES,
  getCountryStats,
  getCountriesByContinent,
  getTopCountries
} from './countryUnits.js';

// Football club units
export {
  FOOTBALL_TEMPLATES,
  FOOTBALL_KEYS,
  FOOTBALL_DISPLAY_NAMES,
  getClubStats,
  getClubsByLeague,
  getClubsByCountry,
  getClubsByTier,
  getTopClubs
} from './footballUnits.js';
