import { BoardState, SimulationResult } from '../types/index.js';
import { BattleSimulator } from './simulator.js';

export const runSimulation = (boardState: BoardState): SimulationResult => {
  const simulator = new BattleSimulator();
  return simulator.runSimulation(boardState);
};

export { BattleSimulator } from './simulator.js';
export { BallBattleSimulator } from './ballSimulator.js';
export { createUnit, generateUnitId } from './unitFactory.js';
export { UNIT_TEMPLATES } from './units.js';

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
