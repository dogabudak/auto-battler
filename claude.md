# Claude CLI Project Guide

This file contains instructions and context for AI assistants working on this project.

## Project Overview

**Auto-Battler Content Creator** - A tool for generating engaging auto-battle video content for social media platforms (Instagram, TikTok, Twitter/X, Facebook).

The system simulates battles between entities (countries, politicians, football teams, etc.) and renders them as shareable video content optimized for each platform.

## Goals

1. Create viral, engaging auto-battle content for social media
2. Support multiple battle formats (tournaments, FFA, 1v1, bracket eliminations)
3. Allow theming with real-world entities (countries, politicians, sports teams, etc.)
4. Export videos in platform-optimized formats

---

## Architecture

### Core Components

| Directory | Purpose |
|-----------|---------|
| `src/engine/` | Pure TypeScript simulation logic - deterministic, tick-based battles |
| `src/renderer/` | React visualization layer - renders battles as animations |
| `src/types/` | Shared type definitions between engine and renderer |
| `src/data/` | JSON data files for entity stats (countries, football clubs) |

### Key Files

| File | Description |
|------|-------------|
| `src/engine/simulator.ts` | Core battle simulation logic |
| `src/engine/ballSimulator.ts` | Ball-based battle variant (main style) |
| `src/engine/units.ts` | Premier League unit templates |
| `src/engine/countryUnits.ts` | Country unit templates with stat calculations |
| `src/engine/footballUnits.ts` | Football club templates with stat calculations |
| `src/engine/unitFactory.ts` | Unit creation factory (pack-aware) |
| `src/engine/packs.ts` | Entity pack registry, roster building, display names |
| `src/engine/abilities.ts` | Ability definitions, stat-derived kits, on-hit resolution |
| `src/renderer/AbilityFx.tsx` | Visual effects layer for ability triggers |
| `src/data/countryStats.json` | Raw country data (GDP, military, population) |
| `src/data/footballStats.json` | Raw football club data (market value, goals, etc.) |
| `src/renderer/App.tsx` | Main React application (classic FFA view) |
| `src/renderer/BallApp.tsx` | Ball-style battle renderer |
| `src/renderer/useScreenRecorder.ts` | `getDisplayMedia` + `MediaRecorder` screen capture, quality-tuned, shared by both views |
| `src/renderer/Watermark.tsx` | Branding overlay + BRAND settings panel, persisted in localStorage |
| `src/renderer/boardLayout.ts` | Board/arena geometry: tile size, arena margin, starting formation |
| `src/renderer/ArenaTheme.tsx` | Arena themes: surfaces, floor/atmosphere layers, picker |
| `src/renderer/BattleSetup.tsx` | Pack + mode + theme + roster selection screen (app entry) |
| `src/renderer/EntityImage.tsx` | Flag/crest with initials fallback for missing assets |
| `src/renderer/UnitSvgs.tsx` | Inline SVG unit artwork for the classic view |

### Assets

| Directory | Contents | Count |
|-----------|----------|-------|
| `public/flags/` | Circular country flag SVGs (UN members + territories) | 250 |
| `public/crests/` | Football club badge PNGs | 127 |
| `public/flags_backup/` | Backup of all downloaded flags (including regional) | 493 |

---

## Stat Calculation System

**Core Principle**: Entity stats (HP, Attack, AttackSpeed) are derived from real-world data, making battles meaningful and debatable.

### Stat Ranges
- **HP (Health)**: 8-20 range, how much damage before elimination
- **Attack (Damage)**: 2-6 range, damage dealt per hit
- **AttackSpeed**: 1-4 range, attack frequency

### Normalization Formula
```typescript
function normalize(value, min, max, targetMin, targetMax) {
  return ((value - min) / (max - min)) * (targetMax - targetMin) + targetMin;
}
```

### Countries (`countryUnits.ts`)

| Stat | Based On | Rationale |
|------|----------|-----------|
| HP | GDP (nominal) | Economic strength = resilience |
| Attack | Military spending | Offensive capability |
| AttackSpeed | Population density | Mobilization speed |
| *Bonus* | Nuclear status | +2 HP if nuclear power |

**Data Source**: `src/data/countryStats.json` (64 countries)

### Football Teams (`footballUnits.ts`)

Uses weighted multi-metric calculations:

**HP Calculation** (Squad Value + Defense):
- Market value (40%): Squad depth and quality
- Goals conceded (20%): Defensive record (inverted)
- xGA (20%): Expected defensive performance (inverted)
- Clean sheets (20%): Shutout ability
- Tier 1 bonus: +2 HP

**Attack Calculation** (Offensive Output):
- Goals scored (40%): Actual output
- xG (35%): Expected offensive quality
- Shots per game (25%): Attacking threat volume
- Tier 1 bonus: +1 Attack

**AttackSpeed Calculation** (Tempo):
- Possession (60%): Ball control = tempo
- Pass accuracy (40%): Quick, precise play

**Data Source**: `src/data/footballStats.json` (68 clubs with 10+ metrics)

### Future Entity Types

| Entity Type | HP Based On | Attack Based On | Speed Based On |
|-------------|-------------|-----------------|----------------|
| Politicians | Country GDP | Approval rating | Years in power |
| Historical Figures | Years of influence | Battles won | Era modifier |

---

## Special Abilities

Kits are derived from stats in `deriveAbilities()`, so any entity pack gets them
for free. Every unit has RAGE; the rest depend on its statline.

| Ability | Trigger | Effect | VFX |
|---------|---------|--------|-----|
| RAGE | Own HP falls to ≤30% (once) | +2 damage for the rest of the battle | Red shockwave + permanent aura + callout |
| BLOCK | 30% chance when taking damage (HP ≥ 12) | Negates the damage entirely | Cyan hex barrier |
| BLITZ | 25% chance after landing a hit (AtkSpd ≥ 3) | Skips cooldown, strikes again | Yellow bolt + speed streaks |
| SIPHON | 35% chance on damage (no other signature) | Heals 1 HP | Green beam from target + `+1` |
| EXECUTE | Target ≤25% HP (Attack ≥ 4) | Double damage | Magenta star flash + callout |

Triggers are logged as `{ type: 'ability', abilityId, unitId, sourceId?, value? }`
events, which the renderer turns into `AbilityEffect` / `AbilityCallout` instances.
Rendering is decoupled from the engine — a new ability needs an entry in
`ABILITIES` (engine) and `ABILITY_VFX` (renderer).

---

## Board & Arena Geometry

All of it lives in `src/renderer/boardLayout.ts`, shared by both views.

Two coordinate spaces, and mixing them up is what used to put units outside the
board:

- **Board space** — tile coordinates, what the simulators work in. A unit
  position is a point clamped to `[0, width-1] × [0, height-1]`.
- **Arena space** — pixels inside the arena element, offset by `ARENA_INSET`.

A unit is *drawn* as a one-tile box whose **top-left** sits at its board
position, so its visual centre is half a tile down-right of the point the
simulator tracks. Effect layers convert by adding `TILE_SIZE / 2`;
`distributedPositions()` subtracts half a tile from each slot centre.

| Export | Purpose |
|--------|---------|
| `TILE_SIZE` | 50px per board cell |
| `ARENA_INSET` | 30px margin between arena edge and play area |
| `ARENA_WIDTH` / `ARENA_HEIGHT` | Board plus margin — the arena element's size |
| `arenaStyle` | Arena element style; `flexShrink: 0` is load-bearing (see below) |
| `playAreaStyle` | Inset board-space layer; overflow stays visible by design |
| `LABEL_MAX_WIDTH` | Label cap derived from the room a board-edge unit has |
| `distributedPositions()` | Starting formation, each row centred |

**Two traps worth remembering:**

1. The arena must not flex-shrink. Both views are column flex containers with
   `minHeight: 100vh`; without `flexShrink: 0` a short window squashes the
   arena while unit positions still come from the declared board height, so the
   lower rows render below the visible arena and get clipped.
2. The margin is not decoration. A unit is more than its tile — label above,
   damage numbers rising, ability bursts ringing out, names wider than a cell.
   Without the margin all of that is clipped at the edges.

## Arena Themes

Defined in `src/renderer/ArenaTheme.tsx` and shared by both battle views. A
theme is presentation only — no simulation state — so any pack plays on any
theme. Everything is CSS/SVG, no image assets, and the same layer components
render the setup-screen previews.

| Theme | `id` | Look |
|-------|------|------|
| Football Pitch | `pitch` | Mown turf, halfway line, penalty boxes |
| World Map | `world_map` | Ocean + graticule + stylised continents |
| Debate Stage | `debate_stage` | Star valance, campaign drape, lecterns, spotlights |
| Colosseum | `colosseum` | Sand bowl, raked rings, stone arcade, gates |
| Neon Grid | `neon` | Glowing grid on board-cell boundaries, horizon sweep |

Each theme supplies `surface` (arena background + frame), `pageBackground`,
`labelColor`/`labelShadow` for unit names, a `Floor` layer (z-index 0) and an
optional `Atmosphere` grade (z-index 50, above the effects, below callouts).

Selection lives in `useArenaTheme(packId)`, persisted in localStorage under
`auto-battler:arena-theme`. `auto` resolves via `defaultThemeForPack()` —
countries → World Map, football packs → Pitch. Change it on the setup screen or
mid-battle from the ARENA button.

Adding a theme: one entry in `ARENA_THEMES` plus its layer components. It shows
up in every picker automatically.

## Battle Types

### Currently Implemented
- **FFA (Free-For-All)**: All entities fight simultaneously, last one standing wins

### Planned Formats
- **Tournament**: Bracket-style elimination (8, 16, 32 participants)
- **1v1**: Direct head-to-head battles
- **Battle Royale**: Shrinking arena, last one standing wins
- **League**: Round-robin style competition

---

## Entity Packs

### Available Now

| Pack | Entities | Status |
|------|----------|--------|
| Premier League | 20 clubs | Complete |
| Countries | 64 with stats, 250 flags | Complete |
| Club Football | 68 clubs from 12 leagues | Complete |

### Planned
- Politicians (world leaders)
- Historical figures
- Tech companies

---

## Available Exports from Engine

```typescript
// Battle simulators
import { BattleSimulator, BallBattleSimulator } from './engine';

// Unit creation — createUnit takes a packId and returns null for unknown keys
import { createUnit, generateUnitId, UNIT_TEMPLATES } from './engine';

// Entity packs (premier_league | countries | club_football)
import {
  PACKS,
  PACK_LIST,
  getPack,
  getEntityName,
  getGroupNames,
  buildRoster
} from './engine';

// Abilities
import {
  ABILITIES,
  deriveAbilities,
  hasAbility,
  resolveAbilityAttack
} from './engine';

// Country entities
import {
  COUNTRY_TEMPLATES,
  COUNTRY_KEYS,
  COUNTRY_DISPLAY_NAMES,
  getCountryStats,
  getCountriesByContinent,
  getTopCountries
} from './engine';

// Football entities
import {
  FOOTBALL_TEMPLATES,
  FOOTBALL_KEYS,
  FOOTBALL_DISPLAY_NAMES,
  getClubStats,
  getClubsByLeague,
  getClubsByCountry,
  getClubsByTier,
  getTopClubs
} from './engine';
```

---

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm test         # Run simulation tests
```

---

## Platform Specifications

| Platform | Aspect Ratio | Max Duration | Resolution |
|----------|--------------|--------------|------------|
| TikTok | 9:16 | 3 min | 1080x1920 |
| Instagram Reels | 9:16 | 90 sec | 1080x1920 |
| Instagram Feed | 1:1 or 4:5 | 60 sec | 1080x1080 |
| Twitter/X | 16:9 or 1:1 | 2:20 | 1920x1080 |
| Facebook | 16:9, 1:1, 9:16 | 4 hr | 1920x1080 |

---

## Design Principles

1. **Engagement First**: Battles should be visually exciting and unpredictable
2. **Quick Hooks**: First 3 seconds must capture attention
3. **Clear Winners**: Outcome should be satisfying and shareable
4. **Themed Visuals**: Entities should be instantly recognizable
5. **Real-World Stats**: Stats derived from actual data creates debate/engagement

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/download-flags.sh` | Download specific country flags |
| `scripts/download-all-flags.sh` | Download all 432 flags from circle-flags |
| `scripts/clean-flags.sh` | Remove non-UN flags, keep only countries |
| `scripts/download-football-clubs.sh` | Download club badges from TheSportsDB |

---

## Tech Stack

| Component | Technology | Status |
|-----------|------------|--------|
| Engine | TypeScript | Complete |
| Renderer | React + Vite + DOM/SVG (**not** canvas) | Complete |
| Country Data | JSON + TypeScript | Complete |
| Football Data | JSON + TypeScript | Complete |
| Video Export | `getDisplayMedia` + MediaRecorder → VP9 `.webm` | Quality-tuned capture; platform presets planned |
| Assets - Flags | SVG (circle-flags) | 250 flags |
| Assets - Clubs | PNG (TheSportsDB) | 127 badges |
| Assets - Arenas | None — themes are pure CSS/SVG | 5 themes |
| Audio | Web Audio API | Planned |

---

## Completed Features

- Core simulation engine (BattleSimulator, BallBattleSimulator)
- FFA battle mode
- Ball-style visual renderer with health bars, damage numbers, attack effects
- Death animations and winner display
- Arena themes: pitch / world map / debate stage / colosseum / neon grid,
  switchable on the setup screen or live via the ARENA panel, `Auto` matches
  the pack
- Basic UI (start battle, reset, tick counter)
- Premier League pack: 20 teams with balanced stats
- Countries pack: 64 countries with real-world stats (GDP, military, population)
- Club Football pack: 68 clubs from 12 leagues (incl. MLS + Brazilian Serie A)
- Assets: 250 country flags (SVG), 127 club badges (PNG)
- Multi-metric stat calculations for football clubs (10+ data points per club)
- Special abilities: 5 stat-derived abilities resolved in both simulators
- Ability trigger VFX: per-ability shapes, persistent auras, centre-screen
  callouts — wired into both FFA and Ball modes
- Screen recording: REC / STOP button downloads a `.webm` of the battle —
  VP9 (VP8 fallback), bitrate scaled to the captured pixels at 0.2 bpp
  (12.4 Mbps at 1080p30, clamped 8–50 Mbps), `contentHint = 'detail'`,
  native-resolution capture, cursor hidden, live settings readout in the UI
- Branding watermark: handle/logo pill inside the arena, so screen capture burns
  it into the export — configured from the BRAND panel in both views

---

## TypeScript Notes

- Module system: NodeNext
- JSON imports require: `with { type: 'json' }`
  ```typescript
  import data from './data.json' with { type: 'json' };
  ```
