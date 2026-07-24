import { UnitTemplate } from '../types/index.js';
import countryData from '../data/countryStats.json' with { type: 'json' };

/**
 * Normalize a value to a target range using min-max scaling
 * @param value - The raw value to normalize
 * @param min - Minimum value in the dataset
 * @param max - Maximum value in the dataset
 * @param targetMin - Target range minimum (default: 8 for HP)
 * @param targetMax - Target range maximum (default: 20 for HP)
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

/**
 * Calculate population density (people per km²)
 */
function getDensity(population: number, area: number): number {
  return (population * 1_000_000) / area;
}

// Extract all country values for normalization bounds
const countries = Object.values(countryData.countries);
const gdpValues = countries.map(c => c.gdp);
const militaryValues = countries.map(c => c.military);
const densityValues = countries.map(c => getDensity(c.population, c.area));

// Find min/max for each metric
const gdpMin = Math.min(...gdpValues);
const gdpMax = Math.max(...gdpValues);
const militaryMin = Math.min(...militaryValues);
const militaryMax = Math.max(...militaryValues);
const densityMin = Math.min(...densityValues);
const densityMax = Math.max(...densityValues);

/**
 * Calculate HP from GDP
 * Higher GDP = more economic resilience = more HP
 * Range: 8-20
 * Bonus: +2 if nuclear power
 */
function calculateHP(gdp: number, isNuclear: boolean): number {
  const baseHP = normalize(gdp, gdpMin, gdpMax, 8, 18);
  return isNuclear ? baseHP + 2 : baseHP;
}

/**
 * Calculate Attack from military spending
 * Higher military = more offensive power
 * Range: 2-6
 */
function calculateAttack(military: number): number {
  return normalize(military, militaryMin, militaryMax, 2, 6);
}

/**
 * Calculate Attack Speed from population density
 * Higher density = faster mobilization
 * Range: 1-4
 */
function calculateAttackSpeed(population: number, area: number): number {
  const density = getDensity(population, area);
  return normalize(density, densityMin, densityMax, 1, 4);
}

// Generate unit templates for all countries
type CountryKey = keyof typeof countryData.countries;

export const COUNTRY_TEMPLATES: Record<string, UnitTemplate> = {};

for (const [key, country] of Object.entries(countryData.countries)) {
  const hp = calculateHP(country.gdp, country.nuclear);
  const attack = calculateAttack(country.military);
  const attackSpeed = calculateAttackSpeed(country.population, country.area);

  COUNTRY_TEMPLATES[key] = {
    imageUrl: `/flags/${key}.svg`,
    hp,
    attack,
    range: 1,
    attackSpeed,
  };
}

// Export individual country stats for debugging/display
export interface CountryStats {
  name: string;
  code: string;
  hp: number;
  attack: number;
  attackSpeed: number;
  nuclear: boolean;
  continent: string;
  rawData: {
    gdp: number;
    military: number;
    population: number;
    area: number;
    density: number;
  };
}

export function getCountryStats(countryKey: string): CountryStats | null {
  const country = countryData.countries[countryKey as CountryKey];
  if (!country) return null;

  const template = COUNTRY_TEMPLATES[countryKey];
  const density = getDensity(country.population, country.area);

  return {
    name: country.name,
    code: country.code,
    hp: template.hp,
    attack: template.attack,
    attackSpeed: template.attackSpeed,
    nuclear: country.nuclear,
    continent: country.continent,
    rawData: {
      gdp: country.gdp,
      military: country.military,
      population: country.population,
      area: country.area,
      density: Math.round(density),
    },
  };
}

// Export list of all country keys
export const COUNTRY_KEYS = Object.keys(countryData.countries);

// Export countries grouped by continent
export function getCountriesByContinent(): Record<string, string[]> {
  const byContinent: Record<string, string[]> = {};

  for (const [key, country] of Object.entries(countryData.countries)) {
    if (!byContinent[country.continent]) {
      byContinent[country.continent] = [];
    }
    byContinent[country.continent].push(key);
  }

  return byContinent;
}

// Export top N countries by a specific stat
export function getTopCountries(
  stat: 'hp' | 'attack' | 'attackSpeed',
  n: number = 10
): string[] {
  return Object.entries(COUNTRY_TEMPLATES)
    .sort((a, b) => b[1][stat] - a[1][stat])
    .slice(0, n)
    .map(([key]) => key);
}

// Display names for UI
export const COUNTRY_DISPLAY_NAMES: Record<string, string> = {};
for (const [key, country] of Object.entries(countryData.countries)) {
  COUNTRY_DISPLAY_NAMES[key] = country.name;
}
