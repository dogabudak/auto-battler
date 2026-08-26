import { Unit } from '../types/index.js';
import { DEFAULT_PACK_ID, PackId, getPack } from './packs.js';

let unitIdCounter = 0;
export const generateUnitId = (): string => {
  return `unit_${++unitIdCounter}`;
};

/**
 * Build a unit from any entity pack. Previously this only read `UNIT_TEMPLATES`,
 * which made the country and European-club packs impossible to instantiate.
 */
export const createUnit = (
  templateName: string,
  x: number,
  y: number,
  packId: PackId = DEFAULT_PACK_ID
): Unit | null => {
  const template = getPack(packId).templates[templateName];
  if (!template) return null;

  return {
    id: String(templateName),
    x,
    y,
    maxHp: template.hp,
    cooldown: 0,
    ...template,
  };
};
