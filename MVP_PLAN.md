# MVP Plan: Auto-Battler Social Media Content

## Vision

Generate engaging auto-battle videos featuring real-world entities (countries, politicians, sports teams) for social media.

---

## Phase 1: Video Export (Current Priority)

### 1.1 Recording System
- [ ] Add intro/outro frames (see 4.9 for the spec)

### 1.3 Audio Integration
- [ ] Background music support (royalty-free)
- [ ] Sound effects library (hits, eliminations, victory)
- [ ] Audio ducking for key moments
- [ ] Text-to-speech commentary (optional)

### 1.4 Capture & Output Quality
- [ ] Auto-stop recording at the target platform's max duration (90s vertical/Reels/Shorts, 60s IG/FB feed, 2:20 Twitter/X) — a long-running FFA can currently outrun every platform's limit since recording is fully manual today
- [ ] Raise capture to 60 fps once motion is continuous (4.0)
- [ ] Force/limit capture to the arena's own surface, no browser chrome
- [ ] Crop capture to the arena element only
- [ ] Warn or auto-adjust when capture is below 1:1 pixel scale
- [ ] Evaluate `captureStream()` off an offscreen canvas or ffmpeg/Remotion export if in-browser capture can't hit 1080p60 clean

---

## Phase 2: Battle Formats

### 2.1 Tournament System
- [ ] `TournamentEngine.ts` for bracket logic
- [ ] Support 8, 16, 32 participant brackets
- [ ] Seeding (random, ranked, regional)
- [ ] Track match history and progression
- [ ] Bracket visualization component
- [ ] Bracket display overlay

### 2.2 1v1 Mode
- [ ] Simplified UI for head-to-head
- [ ] Best-of-3 or single elimination options
- [ ] Pre-battle matchup screen
- [ ] Post-battle stats screen

### 2.4 League Mode
- [ ] Points system (3 for win, 1 for draw)
- [ ] League table display
- [ ] Round-robin scheduling

### 2.5 Battle Setup & Entity Selection
- [ ] Save/load favorite rosters

---

## Phase 3: Simulation Enhancements

### 3.1 Drama Mechanics
- [ ] Last-stand buff (final 2 entities get a stat boost)
- [ ] Flat-chance random critical hit system
- [ ] Generate battle highlights/key moments
- [ ] Sudden-death/timeout resolution (highest HP wins if tick limit hit)
- [ ] Deterministic seed + shareable replay code

### 3.2 Special Abilities
- [ ] Entity-type-specific abilities
- [ ] Passive bonuses based on entity characteristics

---

## Phase 4: Visual Enhancements

### 4.0 Motion & Frame Quality (blocking)
- [ ] Replace the `setTimeout` tick pump with a `requestAnimationFrame` loop
- [ ] Interpolate unit positions between ticks
- [ ] Decouple simulation rate from render rate
- [ ] Make tick pacing frame-accurate
- [ ] Ease movement (anticipation + follow-through)
- [ ] Age out effects on their own timeline instead of clearing at tick boundaries
- [ ] Fix effect durations that fight the tick length
- [ ] Animate `transform`/`opacity` only, not `left`/`top`
- [ ] Add a dropped-frame counter in dev
- [ ] Retune `TICK_INTERVAL` once motion is continuous

### 4.2 Camera System
- [ ] Zoom to action on attack
- [ ] Pan to follow last survivors
- [ ] Dramatic zoom on final kill
- [ ] Slow-motion ramp on the killing blow
- [ ] Tighter auto-framing as the roster shrinks
- [ ] Subtle constant camera drift/breathing

### 4.3 Particle Effects
- [ ] Elimination explosion
- [ ] Victory confetti/fireworks
- [ ] Hit sparks/impact flash on every landed attack
- [ ] Screen shake scaled to hit weight
- [ ] Hit-stop/freeze-frame on big hits
- [ ] Chromatic/vignette flash on eliminations

### 4.4 Entity Visuals
- [ ] Entity-specific visual flair
- [ ] Size scaling based on HP
- [ ] Improved elimination animation (shatter effect)

### 4.5 UI Overlays
- [ ] Live standings for FFA
- [ ] Kill feed
- [ ] On-screen stat cards (HP/ATK/SPD)
- [ ] VS intro card with entity crests/flags
- [ ] Playback speed control (1x/2x/4x)

### 4.6 Cross-Mode Visual Consistency (FFA vs PL Brawl)
- [ ] Decide the canonical visual identity for all uploads
- [ ] Extract a shared `<Arena>`/`<BattleView>` component
- [ ] Unify design tokens: unit size, HP bar, labels, typography, death animation, attack feedback
- [ ] Make the arena background a swappable theme prop
- [ ] Deduplicate the battle-log playback logic between `App.tsx` and `BallApp.tsx`
- [ ] Side-by-side screenshot check as a regression gate

### 4.7 General Visual Polish
- [ ] Scale unit size/labels/HP bars for phone-sized viewing
- [ ] Add depth (lighting, shadows, texture) to the board
- [ ] Fix fractional-pixel asset scaling
- [ ] Define a proper color palette and type scale
- [ ] Design the arena at the target export aspect ratio natively

### 4.8 Juice & Game Feel
- [ ] Squash-and-stretch on attacker/target
- [ ] Per-ability SFX (RAGE, BLOCK, BLITZ, SIPHON, EXECUTE)
- [ ] Kill sound + crowd reaction sting on eliminations
- [ ] Streak/combo callouts
- [ ] Arena rim color-flash on big moments

### 4.9 Hook & Pacing
- [ ] Intro card: crest/flag + name + derived stats (HP/Attack/AttackSpeed + source metric) per entity
- [ ] Compress the opening — first hit lands within ~2s of the fight starting
- [ ] Outro card: hold on the winner with a stat callout
- [ ] Auto-detect/flag "boring" battles for batch discard
- [ ] Underdog/upset auto-tagging

---

## Phase 5: New Entity Packs

### 5.2 Historical Figures
- [ ] Military leaders, philosophers, scientists
- [ ] Impact scoring system
- [ ] Stats: years of influence, battles won, era modifier

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

### Milestone 0: Quality Baseline
- [ ] Smooth motion — rAF loop + interpolation (4.0)
- [ ] Clean capture — bitrate, codec, resolution, no UI chrome (1.4)
- [ ] One consistent look across both modes (4.6)
- [ ] Basic juice — hit sparks, screen shake, kill sound, VS card, end card (4.8, 4.9)
- [ ] Side-by-side comparison against a reference viral auto-battler clip

### Milestone 1: First Exportable Video
- [ ] Add intro/outro frames
- [ ] Export first battle video
- [ ] Post test video to TikTok

### Milestone 2: Tournament Mode
- [ ] Tournament bracket engine
- [ ] Bracket visualization
- [ ] Record full 8-team tournament
- [ ] Post tournament series (Parts 1-3)

### Milestone 3: Multi-Theme Content
- [ ] World map arena
- [ ] Basic sound effects
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
- [ ] US Presidents
- [ ] NBA Teams
- [ ] NFL Teams
- [ ] Tech Companies
- [ ] Fast Food Chains
- [ ] Car Brands
- [ ] Superhero Battle (Marvel vs DC)
- [ ] Anime Characters
- [ ] Cryptocurrencies
- [ ] Programming languages / frameworks
- [ ] Cities / megacities
