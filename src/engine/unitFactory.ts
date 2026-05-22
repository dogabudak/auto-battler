import { Unit } from '../types/index.js';
import { UNIT_TEMPLATES } from './units.js';

let unitIdCounter = 0;
export const generateUnitId = (): string => {
  return `unit_${++unitIdCounter}`;
};

export const createUnit = (
  templateName: keyof typeof UNIT_TEMPLATES,
  x: number,
  y: number
): Unit => {
  const template = UNIT_TEMPLATES[templateName];
  return {
    id: String(templateName),
    x,
    y,
    maxHp: template.hp,
    cooldown: 0,
    ...template,
  };
};
