import { UnitTemplate } from '../types/index.js';

export const UNIT_TEMPLATES: Record<string, UnitTemplate> = {
  arsenal:        { imageUrl: '/crests/arsenal.png',        hp: 12, attack: 4, range: 1, attackSpeed: 3 },
  aston_villa:    { imageUrl: '/crests/aston_villa.png',    hp: 11, attack: 3, range: 1, attackSpeed: 3 },
  bournemouth:    { imageUrl: '/crests/bournemouth.png',    hp: 9,  attack: 3, range: 1, attackSpeed: 3 },
  brentford:      { imageUrl: '/crests/brentford.png',      hp: 10, attack: 4, range: 1, attackSpeed: 2 },
  brighton:       { imageUrl: '/crests/brighton.png',       hp: 10, attack: 3, range: 1, attackSpeed: 3 },

  chelsea:        { imageUrl: '/crests/chelsea.png',        hp: 12, attack: 4, range: 1, attackSpeed: 2 },
  crystal_palace: { imageUrl: '/crests/crystal_palace.png', hp: 10, attack: 3, range: 1, attackSpeed: 3 },
  everton:        { imageUrl: '/crests/everton.png',        hp: 11, attack: 2, range: 1, attackSpeed: 2 },
  fulham:         { imageUrl: '/crests/fulham.png',         hp: 10, attack: 3, range: 1, attackSpeed: 2 },
  ipswich:        { imageUrl: '/crests/ipswich.png',        hp: 9,  attack: 2, range: 1, attackSpeed: 3 },

  leicester:      { imageUrl: '/crests/leicester.png',      hp: 10, attack: 3, range: 1, attackSpeed: 3 },
  liverpool:      { imageUrl: '/crests/liverpool.png',      hp: 13, attack: 5, range: 1, attackSpeed: 3 },
  man_city:       { imageUrl: '/crests/man_city.png',       hp: 14, attack: 5, range: 1, attackSpeed: 3 },
  man_united:     { imageUrl: '/crests/man_united.png',     hp: 11, attack: 3, range: 1, attackSpeed: 2 },
  newcastle:      { imageUrl: '/crests/newcastle.png',      hp: 12, attack: 4, range: 1, attackSpeed: 2 },

  nott_forest:    { imageUrl: '/crests/nott_forest.png',    hp: 10, attack: 3, range: 1, attackSpeed: 3 },
  southampton:    { imageUrl: '/crests/southampton.png',    hp: 9,  attack: 2, range: 1, attackSpeed: 3 },
  tottenham:      { imageUrl: '/crests/tottenham.png',      hp: 11, attack: 4, range: 1, attackSpeed: 3 },
  west_ham:       { imageUrl: '/crests/west_ham.png',       hp: 11, attack: 3, range: 1, attackSpeed: 2 },
  wolves:         { imageUrl: '/crests/wolves.png',         hp: 10, attack: 3, range: 1, attackSpeed: 3 },
};
