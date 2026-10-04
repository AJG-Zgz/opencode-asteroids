# AGENTS.md

Zero-dependency static game: HTML5 Canvas Asteroids clone. No bundler, no packages, no build/test/lint tooling.

## Run

Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .
```

No install step. No env vars. No config files.

## Structure

- `index.html` — 800x600 canvas + `<script src="game.js">`. All styling inline.
- `game.js` — entire game (~423 lines, `'use strict'`). All logic, no modules/exports.
- `favicon.svg` — static asset only.

## Architecture (`game.js`)

Single `requestAnimationFrame` loop: `initGame()` → `loop(ts)` → `update(dt)` + `draw()`. `dt` clamped to 0.05s.

Entities: `Ship`, `Asteroid`, `Bullet`, `Particle`. Game state in module globals: `ship, bullets, asteroids, particles, score, lives, level, state`.

- `state`: `'playing' | 'dead' | 'gameover'`. Respawn after 2s (`deadTimer`); `Space` restarts from gameover.
- Space is toroidal: `wrap(v, max)` on ship, bullets, asteroids.
- Splitting: `Asteroid.split()` spawns 2 of `size - 1`; size 1 destroyed outright.
- Levels: start 4 asteroids, `nextLevel()` spawns `3 + level`. Clears bullets/particles and resets ship (without touching lives/score).
- Ship collision uses `a.radius * 0.82` forgiveness factor; skipped while `ship.invincible > 0` (3s on reset, blink-drawn).

## Input

`keys` (held) + `justPressed` (edge, consumed by `pressed(code)`). Uses `e.code`: `ArrowLeft/Right/Up`, `Space`. Arrow/Space keys call `preventDefault()`.

## Tuning constants

- `RADII = [0,16,30,50]`, `SPEEDS = [0,85,55,32]`, `POINTS = [0,100,50,20]` indexed by size 1–3.
- Ship: rotation 3.5 rad/s, thrust 260 px/s², drag 0.987/frame, fire cooldown 0.2s.
- Bullet: speed 520, ttl 1.1s.
- Spawn safe distance 130px from center.

## Conventions

- Code/comments in file are Spanish; HUD strings in Spanish (`NIVEL`, `PUNTAJE`). Keep new user-facing text in Spanish.
- Keep it dependency-free and single-file — do not add frameworks, bundlers, or modules without explicit request.
