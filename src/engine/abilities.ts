import { AbilityId, Unit } from '../types/index.js';

export interface AbilityDef {
  id: AbilityId;
  /** Short, all-caps label the VFX layer stamps on screen. */
  name: string;
  description: string;
  /** Chance the ability fires when its condition is met (1 = always). */
  chance: number;
}

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  rage: {
    id: 'rage',
    name: 'RAGE',
    description: 'Below 30% HP, deals +2 damage for the rest of the battle.',
    chance: 1,
  },
  fortress: {
    id: 'fortress',
    name: 'BLOCK',
    description: 'Chance to fully negate incoming damage.',
    chance: 0.3,
  },
  blitz: {
    id: 'blitz',
    name: 'BLITZ',
    description: 'Chance to skip the cooldown and strike again immediately.',
    chance: 0.25,
  },
  siphon: {
    id: 'siphon',
    name: 'SIPHON',
    description: 'Chance to recover 1 HP when dealing damage.',
    chance: 0.35,
  },
  execute: {
    id: 'execute',
    name: 'EXECUTE',
    description: 'Double damage against targets under 25% HP.',
    chance: 1,
  },
};

export const RAGE_DAMAGE_BONUS = 2;
export const RAGE_HP_THRESHOLD = 0.3;
export const EXECUTE_HP_THRESHOLD = 0.25;
export const SIPHON_HEAL = 1;

/**
 * Derives a unit's ability kit from its stats, so the kit stays meaningful
 * for any entity pack (countries, clubs, ...) without per-entity authoring.
 * Every unit gets `rage` — the low-HP comeback is the drama beat.
 */
export function deriveAbilities(unit: Pick<Unit, 'hp' | 'attack' | 'attackSpeed'>): AbilityId[] {
  const abilities: AbilityId[] = ['rage'];

  if (unit.attack >= 4) abilities.push('execute');
  if (unit.hp >= 12) abilities.push('fortress');
  if (unit.attackSpeed >= 3) abilities.push('blitz');

  // Underdogs with no signature ability get the sustain kit instead.
  if (abilities.length === 1) abilities.push('siphon');

  return abilities;
}

export function hasAbility(unit: Unit, id: AbilityId): boolean {
  return unit.abilities?.includes(id) ?? false;
}

export function isSpent(unit: Unit, id: AbilityId): boolean {
  return unit.spentAbilities?.includes(id) ?? false;
}

export function markSpent(unit: Unit, id: AbilityId): void {
  unit.spentAbilities = [...(unit.spentAbilities ?? []), id];
}

/** True when the unit has the ability and its random roll lands. */
export function rollAbility(unit: Unit, id: AbilityId): boolean {
  if (!hasAbility(unit, id)) return false;
  return Math.random() < ABILITIES[id].chance;
}

/** A trigger the simulator hands to the battle log for the renderer to draw. */
export interface AbilityTrigger {
  abilityId: AbilityId;
  /** Unit the effect plays on. */
  unitId: string;
  /** Origin unit for directional effects (siphon drains from source → unit). */
  sourceId?: string;
  /** Healed / blocked / bonus amount, when there is a number worth showing. */
  value?: number;
}

export interface AbilityAttackOutcome {
  damage: number;
  /** Attacker skips its cooldown and strikes again next tick. */
  blitz: boolean;
  triggers: AbilityTrigger[];
}

/** Raging units keep a permanent damage bonus once the ability has fired. */
export function rageDamageBonus(unit: Unit): number {
  return isSpent(unit, 'rage') ? RAGE_DAMAGE_BONUS : 0;
}

/**
 * Applies every on-hit ability to a single attack and reports what fired.
 * Mutates `attacker.hp` (siphon) and the units' `spentAbilities` only — the
 * caller still owns applying `damage` to the target.
 */
export function resolveAbilityAttack(
  attacker: Unit,
  target: Unit,
  baseDamage: number
): AbilityAttackOutcome {
  const triggers: AbilityTrigger[] = [];
  // A unit that has already raged keeps hitting harder, but never turns a
  // whiffed swing (0 damage) into a hit.
  let damage = baseDamage > 0 ? baseDamage + rageDamageBonus(attacker) : 0;
  let blitz = false;

  // EXECUTE — finish off a target that's nearly down.
  if (
    damage > 0 &&
    hasAbility(attacker, 'execute') &&
    target.hp <= target.maxHp * EXECUTE_HP_THRESHOLD
  ) {
    damage *= 2;
    triggers.push({ abilityId: 'execute', unitId: target.id, sourceId: attacker.id, value: damage });
  }

  // FORTRESS — the defender shrugs the hit off entirely.
  if (damage > 0 && rollAbility(target, 'fortress')) {
    triggers.push({ abilityId: 'fortress', unitId: target.id, value: damage });
    damage = 0;
  }

  // SIPHON — the attacker drains life on a landed hit.
  if (damage > 0 && attacker.hp < attacker.maxHp && rollAbility(attacker, 'siphon')) {
    const heal = Math.min(SIPHON_HEAL, attacker.maxHp - attacker.hp);
    attacker.hp += heal;
    triggers.push({ abilityId: 'siphon', unitId: attacker.id, sourceId: target.id, value: heal });
  }

  // RAGE — the defender hits back harder once it's cornered.
  const hpAfter = target.hp - damage;
  if (
    hpAfter > 0 &&
    hpAfter <= target.maxHp * RAGE_HP_THRESHOLD &&
    hasAbility(target, 'rage') &&
    !isSpent(target, 'rage')
  ) {
    markSpent(target, 'rage');
    triggers.push({ abilityId: 'rage', unitId: target.id, value: RAGE_DAMAGE_BONUS });
  }

  // BLITZ — the attacker gets an instant follow-up.
  if (rollAbility(attacker, 'blitz')) {
    blitz = true;
    triggers.push({ abilityId: 'blitz', unitId: attacker.id });
  }

  return { damage, blitz, triggers };
}

