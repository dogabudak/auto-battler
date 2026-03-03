import { BoardState } from '../types/index.js';
import { runSimulation, createUnit } from './index.js';

const createTestBoard = (): BoardState => {
  const swordsman1 = createUnit('swordsman', 0, 1);
  const spearman1 = createUnit('spearman', 1, 0);
  const swordsman2 = createUnit('swordsman', 3, 1);
  const spearman2 = createUnit('spearman', 2, 2);

  return {
    units: [swordsman1, spearman1, swordsman2, spearman2],
  };
};

const board = createTestBoard();
const result = runSimulation(board);

console.log('Winner:', result.winner);

const result2 = runSimulation(board);
console.log('\nDeterminism check:', JSON.stringify(result.battleLog) === JSON.stringify(result2.battleLog) ? 'PASSED' : 'FAILED');
