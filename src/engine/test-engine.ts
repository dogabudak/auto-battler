import { BoardState, Unit } from '../types/index.js';
import { runSimulation, createUnit, buildRoster } from './index.js';

/**
 * Smoke test: a battle runs and is deterministic.
 * Uses whatever the pack actually contains rather than hardcoded template
 * names — the previous version referenced 'swordsman'/'spearman', which have
 * not existed since the Premier League templates replaced them.
 */
const createTestBoard = (): BoardState => {
  const roster = buildRoster('premier_league', { size: 4 });
  const positions = [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 3, y: 1 },
    { x: 2, y: 2 },
  ];

  const units = roster
    .map((key, i) => createUnit(key, positions[i].x, positions[i].y, 'premier_league'))
    .filter((u): u is Unit => u !== null);

  if (units.length !== positions.length) {
    throw new Error(`Expected ${positions.length} units, built ${units.length}`);
  }

  return { units };
};

const board = createTestBoard();
const result = runSimulation(board);

console.log('Winner:', result.winner);

const result2 = runSimulation(board);
console.log('\nDeterminism check:', JSON.stringify(result.battleLog) === JSON.stringify(result2.battleLog) ? 'PASSED' : 'FAILED');
