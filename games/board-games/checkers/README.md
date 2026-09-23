# STEENE Checkers Arena

A standalone Checkers game designed for the STEENE platform.

## What changed in this version

This pass gives Checkers its own identity instead of following the Chess presentation.

### Arena identity
- Obsidian/Ember/Frost/Verdant/Violet visual auras.
- Cinematic board glow and tactical UI.
- Arena-style typography, panels and match telemetry.
- Animated pieces, crown transitions, tactical indicators and AI-thinking state.
- Profile presentation aligned with the main STEENE platform: clean navigation, identity, stats, rating and player customization — while keeping the Checkers look original.

### Rules
The game supports a configurable **Open Capture** rule.

Open Capture:
- If a capture exists, the player can choose a capture or another legal quiet move.
- Once a player starts a capture sequence, the same piece continues the multi-jump until no further capture is available.

Mandatory Capture:
- Traditional capture-first behavior.

### AI
Five levels:
1. Learner
2. Club
3. Expert
4. Master
5. Legendary

The stronger levels use:
- iterative deepening;
- alpha-beta pruning;
- move ordering;
- transposition caching;
- tactical capture sequences;
- positional evaluation;
- king value;
- centre control;
- mobility;
- promotion progress;
- threat awareness;
- stronger time budgets.

Legendary is intentionally difficult without being defined as unbeatable.

## File layout

```text
games/board-games/checkers/
├── index.html
├── styles.css
├── README.md
├── src/
│   ├── config.js
│   ├── api/
│   │   └── online.js
│   ├── game/
│   │   ├── logic.js
│   │   ├── board.js
│   │   └── ai.js
│   └── ui/
│       ├── interface.js
│       ├── navigation.js
│       ├── profile.js
│       ├── settings.js
│       └── tutorial.js
└── supabase/
    └── checkers_rooms.sql
```

## STEENE registration

The platform registry still needs the Checkers entry changed from `coming_soon` to `available`:

```js
{
  id: 'checkers',
  icon: '⚫',
  thumbnail: '...',
  category: 'board-games',
  route: 'games/board-games/checkers/index.html',
  players: '2',
  supportedModes: ['local', 'ai', 'online'],
  status: 'available'
}
```

## Session bridge

The game uses the existing shared bridge:

```text
games/shared/steene-session-bridge.js
```

The relative path in `index.html` is intentionally:

```html
<script src="../../shared/steene-session-bridge.js"></script>
```

## Online mode

Run:

```text
supabase/checkers_rooms.sql
```

in the STEENE Supabase project before enabling online play.

The current implementation uses Supabase Postgres Changes for room synchronization. For a larger production deployment, Supabase currently recommends Broadcast over Postgres Changes for scalable realtime architectures. The frontend therefore keeps the online transport isolated in `src/api/online.js` so it can be migrated without rewriting the game engine.
