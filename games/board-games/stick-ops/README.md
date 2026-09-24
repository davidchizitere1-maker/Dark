# STEENE — Stick Ops (Polished Rebuild)

A rebuilt, modular canvas shooter focused on a cinematic 2D presentation while keeping the stylized articulated stick-figure identity.

## Included systems

- Articulated tactical stick-figure animation with walking, recoil, dodge, melee, execution, hurt and death states.
- Industrial city/blacksite environment with skyline depth, structural layers, lamps, cars, crates, barriers, ground markings and screen vignette/scanlines.
- Six weapons: Sidearm, Vector SMG, AR-47, Breacher shotgun, Longshot sniper and Widow LMG.
- Weapon-specific damage, rate of fire, magazine size, reserve ammo, reload time, spread, projectile speed, recoil, projectile piercing and effects.
- Seven enemy classes: Grunt, Runner, Heavy, Assault, Sniper, Elite and Warden boss.
- Dynamic HUD for HP, armor, stamina, bullet time, weapon, ammo, level/wave/objective, combo and reload state.
- Cinematic effects: camera shake, contextual zoom, bullet time, hit-stop, directional damage arcs, muzzle flash particles, bullet tracers, shell casings, smoke, sparks, hit/blood effects, knockback and impact feedback.
- Synthesized audio hooks through Web Audio (no external sound assets required).
- Data-driven configuration in `src/config.js` for fast expansion.

## Controls

WASD = movement, Mouse = aim/fire, 1–6 = weapon select, R = reload, F = melee, E = execution, Space = dodge/roll, Q = bullet time, P/Esc = pause.

## Run

Serve the folder with any static web server because ES modules are used. For example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.
