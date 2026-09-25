# ZERO: EXTRACTION — Stick Ops (STEENE)

A cinematic 2D stick-ops action shooter. Zero returns to the Extraction to
take back what his brother ONE burned down, fighting through ONE's
fire-powered generals and their minions.

## Modes

- **STORY MODE** — plays an animated opening cinematic (the betrayal, the
  fall, the rise, the generals) then drops straight into Campaign Level 1.
- **CAMPAIGN** — 50 levels across 5 zones (Docks → Undercity → Foundry →
  Spire → Sanctum). Enemies run in along approach lanes from off-screen and
  travel to an engagement point before fighting — no random "enemies just
  appear" waves. Every 10th level is a boss fight against one of ONE's
  generals (Cinder, Ashen, Molten, Wildfire, and finally ONE himself), each
  with a unique fire power (fire pools, an ash beam, a magma slam, a twin
  blaze dash, or all four at once for ONE). Levels unlock in order and
  progress is saved locally in the browser.
- **ENDLESS RAVE** — Zero breaches building after building; enemies never
  stop coming. Score/floor chase mode, best floor saved locally.

## Included systems

- Articulated stick-figure animation with jointed limbs, walking, recoil,
  dodge, melee, execution, hurt and death states, plus a fire-power aura for
  ONE's generals and their zone's minions.
- Path/lane-based enemy entrances (`src/systems/paths.js`) — enemies enter
  from a screen edge and travel a multi-point path to a hold point before
  engaging, Killer-Bean style.
- Six weapons, seven enemy archetypes, data-driven campaign generation
  (`src/data/levels.js`) producing 50 structurally distinct levels (escalating
  enemy mix, per-zone theming, boss encounters) from a small ruleset.
- Animated canvas story cinematic (`src/render/cutscene.js`).
- Cinematic effects: camera shake/zoom, bullet time, hit-stop, tracers,
  muzzle flashes, blood/scorch decals, combo scoring.
- Synthesized Web Audio (no external sound/image assets required).

## Controls

WASD = movement, Mouse = aim/fire, 1–6 = weapon select, R = reload, F = melee,
E = execution, Space = dodge/roll, Q = bullet time, P/Esc = pause.

## Run

Serve the folder with any static web server because ES modules are used:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Repo drop-in

This folder is self-contained (`index.html` + `styles.css` + `src/`) and is
meant to sit at `games/board-games/stick-ops/` so the existing
`game-registry.js` entry (route `games/board-games/stick-ops/index.html`)
keeps working unchanged.

## Honest note on "50 complete levels"

The 50 campaign levels are generated from a deterministic ruleset in
`src/data/levels.js` (same level number always builds the same layout/enemy
mix) rather than 50 individually hand-authored layouts — that's what made
50 *playable, progressively harder, distinctly zoned* levels with real boss
fights feasible in one pass. Tune `TIERS`, `buildEncounter`, and `ZONES` in
that file to hand-adjust any specific level or add real per-level art later.
