# MVP Plan: Auto-Battler Social Media Content

## Vision

Create a system that generates engaging auto-battle videos featuring real-world entities (countries, politicians, sports teams) for viral social media content.

---

## Phase 1: Video Export (Current Priority)

### 1.0 Rendering target decision — DONE (chosen: simplest path)
The battle renderer is DOM + SVG, not a `<canvas>`, so `canvas.captureStream()`
does not apply. Chosen approach (no renderer rewrite, no new deps):
**`getDisplayMedia()` + `MediaRecorder` → download `.webm`.**
- [x] Add REC / STOP button that records the screen/tab and downloads a `.webm`
- [ ] (Later, only if needed) crop/scale to platform aspect ratios
- [ ] (Later, only if needed) move to canvas or Remotion for automated batch export

### 1.1 Recording System
- [ ] Implement canvas-to-video recording (MediaRecorder API)
- [ ] Support multiple aspect ratios (9:16, 1:1, 16:9)
- [ ] Configurable resolution (1080p, 4K)
- [ ] Frame rate control (30/60 fps)
- [ ] Add intro/outro frames

### 1.2 Platform Presets
- [ ] TikTok preset (9:16, 1080x1920, max 3 min)
- [ ] Instagram Reels preset (9:16, 1080x1920, max 90 sec)
- [ ] Instagram Feed preset (1:1, 1080x1080, max 60 sec)
- [ ] Twitter/X preset (16:9, 1920x1080, max 2:20)
- [ ] YouTube Shorts preset (9:16, 1080x1920, max 60 sec)
- [ ] YouTube Long-form preset (16:9, 1920x1080)

### 1.3 Audio Integration
- [ ] Background music support (royalty-free)
- [ ] Sound effects library (hits, eliminations, victory)
- [ ] Audio ducking for key moments
- [ ] Text-to-speech commentary (optional)

---

## Phase 2: Battle Formats

### 2.1 Tournament System
- [ ] Create `TournamentEngine.ts` for bracket logic
- [ ] Support 8, 16, 32 participant brackets
- [ ] Implement seeding (random, ranked, regional)
- [ ] Track match history and progression
- [ ] Generate bracket visualization component
- [ ] Tournament bracket display overlay

### 2.2 1v1 Mode
- [ ] Simplified UI for head-to-head
- [ ] Best-of-3 or single elimination options
- [ ] Pre-battle matchup screen
- [ ] Post-battle stats screen

### 2.3 Battle Royale
- [ ] Implement zone damage over time
- [ ] Visual indicator for safe zone
- [ ] Shrinking arena mechanics

### 2.4 League Mode
- [ ] Points system (3 for win, 1 for draw)
- [ ] League table display
- [ ] Round-robin scheduling

### 2.5 Battle Setup & Entity Selection
- [ ] Entity picker UI (choose which countries/clubs enter a battle)
- [ ] Randomize matchup button
- [ ] Filter by pack/league/continent/tier
- [ ] Save/load favorite rosters

---

## Phase 3: Simulation Enhancements

### 3.1 Drama Mechanics
- [ ] Low HP rage mode (increased damage when below 25% HP)
- [ ] Last stand buff (final 2 entities get stat boost)
- [ ] Critical hit system (10% chance for 2x damage)
- [ ] Generate battle highlights/key moments
- [ ] Sudden-death / timeout resolution (highest HP wins if tick limit hit, avoids stalls)
- [ ] Deterministic seed + shareable replay code (reproduce any battle)

### 3.2 Special Abilities
- [ ] Entity-type specific abilities
- [ ] Passive bonuses based on entity characteristics
- [ ] Visual effects for ability triggers

---

## Phase 4: Visual Enhancements

### 4.1 Arena Themes
- [ ] World map arena (for countries)
- [ ] Political debate stage
- [ ] Colosseum/historical arena
- [ ] Abstract neon arena

### 4.2 Camera System
- [ ] Zoom to action (when attack happens)
- [ ] Pan to follow last survivors
- [ ] Dramatic zoom on final kill

### 4.3 Particle Effects
- [ ] Elimination explosion
- [ ] Victory confetti/fireworks

### 4.4 Entity Visuals
- [ ] Entity-specific visual flair
- [ ] Size scaling based on HP
- [ ] Improved elimination animation (shatter effect)

### 4.5 UI Overlays
- [ ] Live standings for FFA (leaderboard)
- [ ] Kill feed (like esports)
- [ ] On-screen stat cards (HP/ATK/SPD) to fuel debate/engagement
- [ ] VS intro card with entity crests/flags
- [ ] Playback speed control (1x / 2x / 4x) to fit platform time limits
- [ ] Branding/watermark overlay for exported videos

---

## Phase 5: New Entity Packs

### 5.1 Politicians
- [ ] Create `/public/politicians/` directory
- [ ] Source public domain images
- [ ] Create `politicianUnits.ts` with stats
- [ ] Stats based on: Country GDP, Approval rating, Years in power
- [ ] Bonus: +1 Attack if authoritarian index >6

### 5.2 Historical Figures
- [ ] Military leaders, philosophers, scientists
- [ ] Create impact scoring system
- [ ] Stats based on: Years of influence, Battles won, Era modifier
- [ ] Bonus: +2 HP if ruled >1M km²

---

## Phase 6: Content Templates

### 6.1 Video Formats
- [ ] "World Leaders Battle Royale"
- [ ] "Historical Figures FFA"
- [ ] Daily/weekly series templates

### 6.2 Engagement Features
- [ ] Countdown intros (3-2-1 style)
- [ ] "Subscribe for Part 2" hooks
- [ ] Comment bait text overlays
- [ ] Poll-style thumbnails
- [ ] Prediction prompts

### 6.3 Thumbnail Generator
- [ ] Auto-generate thumbnails (VS layout)
- [ ] Multiple thumbnail styles

---

## Phase 7: Automation & Scaling

### 7.1 Batch Generation
- [ ] Generate multiple videos in sequence
- [ ] Randomized matchups
- [ ] Series generation (Part 1, 2, 3...)

### 7.2 Content Calendar
- [ ] Schedule content types
- [ ] Track what's been posted
- [ ] A/B testing framework

### 7.3 Analytics Integration
- [ ] Track video performance
- [ ] Identify winning formulas
- [ ] Automated reporting

---

## Milestones

### Milestone 1: First Exportable Video (Current)
- [ ] Implement basic video recording
- [ ] Add simple intro/outro frames
- [ ] Export first battle video
- [ ] Post test video to TikTok

### Milestone 2: Tournament Mode
- [ ] Create tournament bracket engine
- [ ] Build bracket visualization
- [ ] Record full 8-team tournament
- [ ] Post tournament series (Parts 1-3)

### Milestone 3: Multi-Theme Content
- [ ] Create world map arena
- [ ] Add basic sound effects
- [ ] Generate 20 videos across themes

### Milestone 4: Production Ready
- [ ] All platform export presets working
- [ ] Audio fully integrated
- [ ] Thumbnail generator working
- [ ] Batch generation functional
- [ ] 50+ videos ready to post

---

## Content Ideas Backlog

### Future Entity Packs
- [ ] US Presidents (Historical)
- [ ] NBA Teams
- [ ] NFL Teams
- [ ] Tech Companies (Google vs Apple vs Meta...)
- [ ] Fast Food Chains
- [ ] Car Brands
- [ ] Superhero Battle (Marvel vs DC)
- [ ] Anime Characters
- [ ] Cryptocurrencies (market cap → stats)
- [ ] Programming languages / frameworks
- [ ] Cities / megacities (population, GDP)

### Viral Hooks
- "You won't believe who wins..."
- "Country tier list but they actually fight"
- "POV: Countries go to war"
- "Rating countries by their battle power"
- "This matchup broke the simulation"
- "My algorithm thinks [X] beats [Y]..."
- "I let AI decide who's strongest"
- "Part 47 of countries fighting"
