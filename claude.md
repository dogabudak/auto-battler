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
| `src/engine/unitFactory.ts` | Unit creation factory |
| `src/data/countryStats.json` | Raw country data (GDP, military, population) |
| `src/data/footballStats.json` | Raw football club data (market value, goals, etc.) |
| `src/renderer/App.tsx` | Main React application |
| `src/renderer/BallApp.tsx` | Ball-style battle renderer |

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

**Data Source**: `src/data/countryStats.json` (63 countries)

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

**Data Source**: `src/data/footballStats.json` (100+ clubs with 10+ metrics)

### Future Entity Types

| Entity Type | HP Based On | Attack Based On | Speed Based On |
|-------------|-------------|-----------------|----------------|
| Politicians | Country GDP | Approval rating | Years in power |
| Historical Figures | Years of influence | Battles won | Era modifier |

---

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
| Countries | 63 with stats, 250 flags | Complete |
| European Football | 100+ clubs from 10+ leagues | Complete |

### Planned
- Politicians (world leaders)
- Historical figures
- Tech companies

---

## Available Exports from Engine

```typescript
// Battle simulators
import { BattleSimulator, BallBattleSimulator } from './engine';

// Unit creation
import { createUnit, generateUnitId, UNIT_TEMPLATES } from './engine';

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
| Renderer | React + Vite + Canvas | Complete |
| Country Data | JSON + TypeScript | Complete |
| Football Data | JSON + TypeScript | Complete |
| Video Export | MediaRecorder API | Planned |
| Assets - Flags | SVG (circle-flags) | 250 flags |
| Assets - Clubs | PNG (TheSportsDB) | 127 badges |
| Audio | Web Audio API | Planned |

---

## Completed Features

- Core simulation engine (BattleSimulator, BallBattleSimulator)
- FFA battle mode
- Ball-style visual renderer with health bars, damage numbers, attack effects
- Death animations and winner display
- Football pitch arena theme
- Basic UI (start battle, reset, tick counter)
- Premier League pack: 20 teams with balanced stats
- Countries pack: 63 countries with real-world stats (GDP, military, population)
- European Football pack: 100+ clubs from 10+ leagues
- Assets: 250 country flags (SVG), 127 club badges (PNG)
- Multi-metric stat calculations for football clubs (10+ data points per club)

---

## TypeScript Notes

- Module system: NodeNext
- JSON imports require: `with { type: 'json' }`
  ```typescript
  import data from './data.json' with { type: 'json' };
  ```
