import { UnitTemplate } from '../types/index.js';
import { UNIT_TEMPLATES } from './units.js';
import {
  COUNTRY_TEMPLATES,
  COUNTRY_DISPLAY_NAMES,
  getCountriesByContinent,
} from './countryUnits.js';
import {
  FOOTBALL_TEMPLATES,
  FOOTBALL_DISPLAY_NAMES,
  getClubsByLeague,
} from './footballUnits.js';

/**
 * Entity pack registry.
 *
 * Everything that used to be hardwired to `UNIT_TEMPLATES` (Premier League)
 * goes through here instead, so countries and European clubs — which were built
 * in the engine but unreachable from the UI — are first-class options.
 *
 * A pack is just: templates + display names + optional grouping for subset
 * selection. Adding a new pack means adding one entry to `PACKS`.
 */

export type PackId = 'premier_league' | 'countries' | 'club_football';

export interface EntityPack {
  id: PackId;
  name: string;
  /** One-liner for the setup screen. */
  tagline: string;
  /** What the stats are derived from — the "debate fuel" hook. */
  statBasis: string;
  templates: Record<string, UnitTemplate>;
  displayNames: Record<string, string>;
  /** Label for the grouping axis, e.g. "Continent" / "League". */
  groupLabel?: string;
  /** Named subsets, e.g. continent -> country keys. */
  groups?: () => Record<string, string[]>;
  /** Sensible roster size for this pack given arena space. */
  defaultRosterSize: number;
}

export const PACKS: Record<PackId, EntityPack> = {
  premier_league: {
    id: 'premier_league',
    name: 'Premier League',
    tagline: 'The classic 20',
    statBasis: 'Hand-tuned club strength',
    templates: UNIT_TEMPLATES,
    displayNames: PL_DISPLAY_NAMES(),
    defaultRosterSize: 20,
  },
  countries: {
    id: 'countries',
    name: 'Countries',
    tagline: '64 nations, real-world power',
    statBasis: 'GDP → HP, military → attack, density → speed',
    templates: COUNTRY_TEMPLATES,
    displayNames: COUNTRY_DISPLAY_NAMES,
    groupLabel: 'Continent',
    groups: getCountriesByContinent,
    defaultRosterSize: 16,
  },
  club_football: {
    id: 'club_football',
    // Mostly European, but the data also carries MLS and Brazilian Série A
    // clubs — "European" would be wrong on screen.
    name: 'Club Football',
    tagline: '12 leagues, 68 clubs',
    statBasis: 'Market value, xG/xGA, possession',
    templates: FOOTBALL_TEMPLATES,
    displayNames: FOOTBALL_DISPLAY_NAMES,
    groupLabel: 'League',
    groups: getClubsByLeague,
    defaultRosterSize: 16,
  },
};

/**
 * The Premier League pack predates the country/football packs and has no
 * display-name map of its own — its keys are snake_case club names.
 */
function PL_DISPLAY_NAMES(): Record<string, string> {
  const overrides: Record<string, string> = {
    man_city: 'Man City',
    man_united: 'Man Utd',
    nott_forest: "Nott'm Forest",
    west_ham: 'West Ham',
    crystal_palace: 'Crystal Palace',
    aston_villa: 'Aston Villa',
  };
  const names: Record<string, string> = {};
  for (const key of Object.keys(UNIT_TEMPLATES)) {
    names[key] = overrides[key] ?? titleCase(key);
  }
  return names;
}

function titleCase(key: string): string {
  return key
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const PACK_LIST: EntityPack[] = Object.values(PACKS);

export const DEFAULT_PACK_ID: PackId = 'premier_league';

export function getPack(id: PackId): EntityPack {
  return PACKS[id] ?? PACKS[DEFAULT_PACK_ID];
}

/** Display name for an entity key, falling back to a readable form of the key. */
export function getEntityName(packId: PackId, key: string): string {
  return getPack(packId).displayNames[key] ?? titleCase(key);
}

/**
 * Rough "how strong is this entity" score, used to pick the most interesting
 * subset of a large pack rather than the first N alphabetically.
 */
export function entityPower(template: UnitTemplate): number {
  return template.hp + template.attack * 2 + template.attackSpeed;
}

export type RosterMode = 'top' | 'random';

export interface RosterOptions {
  /** How many entities enter the battle. */
  size: number;
  /** Restrict to one group (continent / league). Undefined = whole pack. */
  group?: string;
  /** 'top' = strongest by power score, 'random' = random draw. */
  mode?: RosterMode;
}

/**
 * Pick which entities actually enter a battle. A 64-country pack cannot all fit
 * on one board, so every pack goes through a subset step.
 */
export function buildRoster(packId: PackId, options: RosterOptions): string[] {
  const pack = getPack(packId);

  let keys = Object.keys(pack.templates);
  if (options.group && pack.groups) {
    const grouped = pack.groups()[options.group];
    if (grouped?.length) {
      // Only keep keys that actually have a template built for them.
      keys = grouped.filter(k => pack.templates[k]);
    }
  }

  const size = Math.max(2, Math.min(options.size, keys.length));

  if (options.mode === 'random') {
    const shuffled = [...keys];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, size);
  }

  return keys
    .sort((a, b) => entityPower(pack.templates[b]) - entityPower(pack.templates[a]))
    .slice(0, size);
}

/** Group names that have at least one usable entity, for the setup UI. */
export function getGroupNames(packId: PackId): string[] {
  const pack = getPack(packId);
  if (!pack.groups) return [];
  return Object.entries(pack.groups())
    .filter(([, keys]) => keys.some(k => pack.templates[k]))
    .map(([name]) => name)
    .sort();
}
