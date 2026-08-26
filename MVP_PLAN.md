# MVP Plan: Auto-Battler Social Media Content

## Vision

Create a system that generates engaging auto-battle videos featuring real-world entities (countries, politicians, sports teams) for viral social media content.

---

## Known Gaps — Not a Complete Product Yet

Honest state of things as of the current build. These block "this is shippable
content", and should be cleared before chasing new formats or packs.

| Gap | Impact | Tracked in |
|-----|--------|------------|
| Video quality is not postable — choppy motion, soft/smeary capture | Videos look amateur next to native app content | 1.4, 4.0 |
| FFA and PL Brawl look like two different products | No consistent brand/visual identity across uploads | 4.6 |
| Partial entity picking — group/size/strongest-or-random, but no per-entity choice | Cannot hand-build a marquee matchup | 2.5 |

---

## Phase 1: Video Export (Current Priority)

### 1.0 Rendering target decision — DONE (chosen: simplest path)
The battle renderer is DOM + SVG, not a `<canvas>`, so `canvas.captureStream()`
does not apply. Chosen approach (no renderer rewrite, no new deps):
**`getDisplayMedia()` + `MediaRecorder` → download `.webm`.**
- [ ] (Later, only if needed) crop/scale to platform aspect ratios
- [ ] (Later, only if needed) move to canvas or Remotion for automated batch export

### 1.1 Recording System
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

### 1.4 Capture & Output Quality (blocking — videos are not postable yet)
- [ ] Constrain capture resolution explicitly instead of inheriting the shared
      surface (`width`/`height` in the `getDisplayMedia` constraints)
      — partially done: constraints now ask for the surface's *native* pixels
      (`ideal: 3840×2160`, which caps to whatever the surface really has) rather
      than accepting a downscaled stream. Pinning output to an exact 1080p/9:16
      frame belongs with the platform presets in 1.2.
- [ ] Raise capture to 60 fps once animation is actually continuous (see 4.0) —
      60 fps on top of 400ms steps just records the same stutter more faithfully
- [ ] Prompt/force the correct capture surface — recording the whole screen or a
      window pulls in browser chrome, tabs, and the control buttons
- [ ] Crop capture to the arena element only, so no UI chrome reaches the export
- [ ] Warn (or auto-adjust) when the arena is being captured at less than 1:1
      pixel scale — upscaling a 700px board to 1080p is a guaranteed soft image
- [ ] Consider `captureStream()` off an offscreen canvas, or Remotion/ffmpeg
      frame-by-frame export, if in-browser capture can't reach the quality bar
      — real-time screen capture may simply have a ceiling here

**Quality bar to hit before posting anything**: 1080p, 60 fps, no dropped frames
during a full battle, no visible compression mush on crests/flags or text, and
zero UI chrome in frame.

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

### 2.4 League Mode
- [ ] Points system (3 for win, 1 for draw)
- [ ] League table display
- [ ] Round-robin scheduling

### 2.5 Battle Setup & Entity Selection
- [ ] Entity picker UI — per-entity checkboxes (2.6 gives group/size/top-N only)
- [ ] Save/load favorite rosters

## Phase 3: Simulation Enhancements

### 3.1 Drama Mechanics
- [ ] Last stand buff (final 2 entities get stat boost)
- [ ] Critical hit system (10% chance for 2x damage)
      — partially covered by EXECUTE (2x damage, but conditional on target HP
      rather than a flat random roll). A true random crit is still open.
- [ ] Generate battle highlights/key moments
- [ ] Sudden-death / timeout resolution (highest HP wins if tick limit hit, avoids stalls)
- [ ] Deterministic seed + shareable replay code (reproduce any battle)

### 3.2 Special Abilities
- [ ] Entity-type specific abilities (kits are stat-derived, not pack-specific yet)
- [ ] Passive bonuses based on entity characteristics


---

## Phase 4: Visual Enhancements

### 4.0 Motion & Frame Quality (blocking — this is why it looks choppy)
Playback is not animated, it is *stepped*. Both views run `setTimeout` at
`TICK_INTERVAL = 400`ms and let CSS transitions cover the gap between grid
cells. There is no `requestAnimationFrame` loop anywhere in the renderer, so
effective motion is ~2.5 updates/sec no matter what the capture fps says.

- [ ] Replace the `setTimeout` tick pump with a `requestAnimationFrame` loop
      driven by elapsed time — the single fix that makes everything smoother
- [ ] Interpolate unit positions *between* ticks instead of snapping cell to
      cell, so movement reads as continuous travel rather than teleporting
- [ ] Decouple simulation rate from render rate: the engine can stay at N ticks
      per second while the renderer draws every frame
- [ ] Make tick pacing frame-accurate — `setTimeout(400)` drifts under load, so
      the stutter is uneven, which reads worse than a slower-but-steady cadence
- [ ] Ease movement properly (anticipation + follow-through) instead of a flat
      `ease-out` on every property
- [ ] Stop clearing all effects on tick boundaries (`setSlashes([])` etc.) —
      effects should age out on their own timeline, not pop at 400ms edges
- [ ] Fix effect durations that fight the tick length (damage numbers animate
      0.38s inside a 400ms window, so they flash and vanish)
- [ ] Audit for layout thrash / non-compositable properties — animate
      `transform` and `opacity` only, never `left`/`top` (both views animate
      `left`/`top` today, which forces layout every frame)
- [ ] Add a dropped-frame counter in dev so regressions are visible
- [ ] Retune `TICK_INTERVAL` for watchability once motion is continuous

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

### 4.6 Cross-Mode Visual Consistency (FFA vs PL Brawl)
The two modes look like they came from different products. `App.tsx` and
`BallApp.tsx` are ~500-line near-duplicates that drifted apart: dark slate board
vs green pitch, square crests at 0.7 tile vs 3D spheres at 0.85 tile, lunge
offset vs bounce scale, `#ccc` vs `#fff` labels, 5px bordered HP bars vs 4px
bars. Nothing is shared except the effect layers.

- [ ] Decide the canonical look — one visual identity for all uploads
      (recommend the Brawl treatment; the spheres and pitch read far better at
      phone size than the flat FFA board)
- [ ] Extract a shared `<Arena>` / `<BattleView>` component both modes render
      into, so a visual change lands in both by construction
- [ ] Unify the design tokens: unit size, HP bar style, name label style,
      typography, death animation, attack feedback
- [ ] Make the arena background a swappable theme prop rather than a hardcoded
      difference between the two files (feeds into 4.1)
- [ ] Deduplicate the battle-log playback logic — it is copy-pasted between the
      two views and is where the two will keep drifting
- [ ] Side-by-side screenshot check of both modes as a regression gate

### 4.7 General Visual Polish
Beyond consistency, the arena itself does not look like a finished product.

- [ ] Scale unit size, labels, and HP bars for phone-sized viewing; 8px name
      labels are unreadable on a vertical video
- [ ] Replace the flat board with real depth (lighting, shadows, texture)
- [ ] Crisp asset rendering — make sure crests/flags are not being scaled to
      fractional pixel sizes (`TILE_SIZE * 0.85` = 42.5px today)
- [ ] Define a proper color palette and type scale instead of ad-hoc inline hexes
- [ ] Design the arena at the target export aspect ratio rather than a fixed
      desktop-width board that later gets cropped

---

## Phase 5: New Entity Packs

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

### Milestone 0: Quality Baseline (Current — blocks everything below)
Nothing here is a new feature; it is making what already exists good enough to
publish. See the Known Gaps table at the top.
- [ ] Smooth motion — rAF loop + interpolation (4.0)
- [ ] Clean capture — bitrate, codec, resolution, no UI chrome (1.4)
- [ ] One consistent look across both modes (4.6)
- [ ] Side-by-side comparison against a reference viral auto-battler clip —
      does ours look like it belongs on the same feed?

### Milestone 1: First Exportable Video
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
