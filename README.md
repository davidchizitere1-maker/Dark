
# STEENE

A strategy board game of blocking, jumping, and secret destinations — built as a lightweight vanilla JS/HTML app with a Supabase-backed online multiplayer mode.

Wall off your opponent, jump over them when they're adjacent, and race to reach your secret target tile before they reach theirs.

## Features

- **10x10 (also 8x8 / 12x12) grid** — configurable board size with theming (Dark, Neon, Classic Wood, Golden Chess, Scrabbled)
- **Local Multiplayer** — two players, same device, pass-and-play
- **Online Multiplayer** — create or join a room with a 6-character code; live sync via Supabase Realtime, with automatic disconnect/forfeit detection
- **AI Opponent** — six difficulty levels (Beginner → Legend) using BFS pathfinding and a wall-scoring heuristic
- **Barricade modes** — 1–4 pieces per player
- **Turn timer, replay/scrubber controls, and event log**

## Tech Stack

- Plain HTML/CSS/JavaScript (no build step, no framework)
- [Supabase](https://supabase.com) (Postgres + Realtime) for online rooms and match logging

## Project Structure

```

├── index.html          # App shell — sidebar nav, screens, modals
├── styles.css           # All styling
├── logo.png
├── SRC/
│   ├── config.js         # Settings persistence, stats, audio, shared helpers (load first)
│   ├── API/
│   │   └── online.js     # Supabase room creation/join, realtime sync, disconnect handling
│   ├── game/
│   │   ├── logic.js       # Core rules / move validation
│   │   ├── board.js       # Board rendering & wall placement
│   │   └── ai.js          # AI opponent (difficulty levels, BFS, wall scoring)
│   └── ui/
│       └── interface.js   # UI wiring, modals, screen navigation
└── views/
    └── home.html          # (unused — safe to remove)
```

> **Note:** Script tags in `index.html` currently reference lowercase `src/...` paths. The actual folder is `SRC/` (uppercase). This works on case-insensitive filesystems (Windows/local dev) but breaks on case-sensitive hosts like GitHub Pages. Fix pending.

## Getting Started

1. Clone the repo
   ```bash
   git clone https://github.com/davidchizitere1-maker/Dark.git
   cd Dark
   ```

2. Serve it locally (any static server works, e.g.):
   ```bash
   npx serve .
   ```
3. Open the local URL in your browser.

No build step, no environment variables required for local play — Supabase credentials for online mode are already configured in `SRC/API/online.js`.

## Database Schema (Online Mode)

Online multiplayer expects a `multiplayer_rooms` table and a `games` table in Supabase. Ask the maintainer for the current schema/migration if setting up a fresh Supabase project.

## License

See [LICENSE](LICENSE).
```
