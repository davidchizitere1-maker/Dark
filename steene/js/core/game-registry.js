
const gameRegistryData = [
  // ── AVAILABLE ──────────────────────────────────────────
  {
    id: 'barricade',
    name: 'STEENE Barricade',
    description: 'A strategy board game of blocking, jumping, and secret destinations.',
    icon: '🧱',
    thumbnail: "https://tse2.mm.bing.net/th/id/OIP.khdsXUPsZKlf7sQVOcPEsQHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    category: 'board-games',
    route: 'games/board-games/barricade/index.html',
    players: '2',
    supportedModes: ['local', 'ai', 'online'],
    status: 'available'
  },
  {
    id: 'chess',
    name: 'STEENE Chess',
    description: 'Classic chess — play locally or against the computer.',
    icon: '♞',
    thumbnail: "https://tse4.mm.bing.net/th/id/OIP.JDNTOaw9RAQhfm3O8Q4RoQHaEo?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    category: 'board-games',
    route: 'games/board-games/chess/index.html',
    players: '2',
    supportedModes: ['local', 'ai' , 'online'],
    status: 'available'
  },
    
  // ── ROADMAP — BOARD GAMES ──────────────────────────────
  { id: 'checkers', name: 'Checkers', description: 'The timeless classic of diagonal captures and kings.', icon: '⚫', thumbnail: "https://tse4.mm.bing.net/th/id/OIP._jAJ-vnRk6XW5kKANnUM1QHaE0?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: null, players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  { id: 'backgammon', name: 'Backgammon', description: 'Race your pieces home in this ancient dice-and-strategy game.', icon: '🎲', thumbnail: "https://tse1.explicit.bing.net/th/id/OIP.iWxGw1fvGRroVPRLItrskQHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: null, players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  { id: 'go', name: 'Go', description: 'Surround more territory than your opponent on a 19x19 grid.', icon: '⚪', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.0GGbbwfYd8W6-6avw51KZwHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: null, players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  { id: 'reversi', name: 'Reversi', description: 'Flip your opponent\'s discs to claim the board.', icon: '🔴', thumbnail: "https://tse1.explicit.bing.net/th/id/OIP.fB4LNxD6PQxAiXe8vCmQbQHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: null, players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  { id: 'ludo', name: 'Ludo', description: 'Race four tokens home in this beloved family classic.', icon: '🎯', thumbnail: "https://tse1.mm.bing.net/th/id/OIP.mjcPCbx3J_n9pLOn3YGL6gHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: null, players: '2-4', supportedModes: ['local', 'ai'], status: 'coming_soon' },

  // ── ROADMAP — CARD GAMES ───────────────────────────────
  { id: 'poker', name: 'STEENE Poker', description: 'Texas Hold\'em with friends or the house.', icon: '🃏', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.8J6GtWe01i4434qOCpZEvwHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'card-games', route: null, players: '2-8', supportedModes: ['local', 'ai', 'online'], status: 'coming_soon' },
  { id: 'blackjack', name: 'Blackjack', description: 'Beat the dealer to 21.', icon: '🂡', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.c3YWFwlTFJ7YxEZfcHuZRgHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'card-games', route: null, players: '1', supportedModes: ['ai'], status: 'coming_soon' },
  { id: 'solitaire', name: 'Solitaire', description: 'The classic single-player card sort.', icon: '🂮', thumbnail: "https://th.bing.com/th/id/R.bc258e9b5c676081f00b771ecd876948?rik=bYsvobSIDz6q1w&pid=ImgRaw&r=0", category: 'card-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'spades', name: 'Spades', description: 'Bid, trick, and take — a partnership card game classic.', icon: '♠️', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.u_UGK_IVQQPd38O5cFzOLAHaFO?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'card-games', route: null, players: '4', supportedModes: ['local', 'online'], status: 'coming_soon' },
  { id: "snakes-and-ladders", name: "Snakes and Ladders",  description: "A game of pure chance, excellent for testing RNG and linear progression.",  icon: '🏁' , thumbnail: "https://media.istockphoto.com/id/2170863282/vector/snake-ladder-snakes-ladders-board-game-template-children-puzzle-play-fun-competition-gaming.jpg?s=170667a&w=0&k=20&c=oy7EvaQiwpTiv36G3LS4m4ypHEazjMfhKwkdkjGQBvk=", category: 'board-games' , supportedModes: ['local', 'ai' , 'online'], route: "games/snakes-and-ladders/index.html", players: "2 - 4 Players", status: "coming_soon" },

  {
        id: "pucket",
        name: "Pucket",
        description: "Both players race simultaneously, to clear their side of the board first.",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.niHZQyINHt5dvAIVS_bJ0gHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🍥' ,
        supportedModes: ['local', 'ai' , 'online'],
        category: 'board-games' ,
        route: "games/pucket/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
  // ── ROADMAP — PUZZLE GAMES ─────────────────────────────
  { id: 'sudoku', name: 'Sudoku', description: 'Fill the grid, one logical deduction at a time.', icon: '🔢', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.9dGcS6pBuDqXn3sIIJO_eAHaE8?r=0&w=992&h=662&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'puzzle-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'minesweeper', name: 'Minesweeper', description: 'Clear the field without triggering a mine.', icon: '💣', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.UGO3iYip9kvSg3TTZhbSlgHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'puzzle-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'word-search', name: 'Word Search', description: 'Find every hidden word before the timer runs out.', icon: '🔤', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.SJMuYDjOXpQcRRvL0oZwHQHaE9?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'puzzle-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },

  // ── ROADMAP — STRATEGY GAMES ───────────────────────────
  { id: 'risk-clone', name: 'Empire', description: 'Conquer the map, one territory at a time.', icon: '🗺️', thumbnail: "https://th.bing.com/th/id/R.feb3723efd80304fc06c2aab03955956?rik=yH1l733kLM6zEQ&pid=ImgRaw&r=0", category: 'strategy-games', route: null, players: '2-6', supportedModes: ['local', 'ai', 'online'], status: 'coming_soon' },
  { id: 'stratego', name: 'Stratego', description: 'Hidden armies clash — outwit, don\'t just outgun.', icon: '🎖️', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.OwHPyHK7ojUu4i40hAuRrgHaE6?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'strategy-games', route: null, players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },

  // ── ROADMAP — ARCADE GAMES ─────────────────────────────
  { id: 'snake', name: 'Snake', description: 'Grow longer, don\'t hit the walls (or yourself).', icon: '🐍', thumbnail: "https://wallpaperaccess.com/full/8552514.jpg", category: 'arcade-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'breakout', name: 'Breakout', description: 'Break every brick without losing the ball.', icon: '🧱', thumbnail: "https://thumbs.dreamstime.com/b/bold-stylized-graphic-featuring-word-breakout-script-font-text-rendered-white-thick-black-outline-creating-strong-416275632.jpg?w=360", category: 'arcade-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'pong', name: 'Pong', description: 'The original — first to 11 wins.', icon: '🏓', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.SUePp78t7UfCKypfrjb-8gHaLH?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'arcade-games', route: null, players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  {
        id: "mancala",
        name: "Mancala (Oware / Wari)",
        description: "A sowing game relying on arrays and mathematical calculation rather than a grid map.",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.JSHpJHnWIa_VtaBMdnjHxgHaFh?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🪨' ,
        category: 'board-games' ,
        supportedModes: ['local', 'ai' , 'online'],
        route: "games/mancala/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },  
  {
        id: "Whot",
        name: "Whot",
        description: "A fun and engaging card game for all ages.",
        thumbnail: "https://lh3.googleusercontent.com/J9y-KArT25Gx5CncOfHzAu5LiFYRzhtpD7Imd0HGhruGbj5ZmbdFAq5TYCUcd-dUeXPz7LZpyKTsBZN2eosdWafV3fFQ4XfRtlXN1akdV4LV98D3PtjvdrbtXJMfxvueOkv9X3mT6kHBpfZHrw",
        icon: '🎴' ,
        category: 'card-games' ,
        supportedModes: ['local', 'ai' , 'online'],
        route: "games/whot/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"

    },
     {
        id: "mahjong",
        name: "Mahjong",
        description: "Traditional Chinese tile-matching and melding game.",
        thumbnail: "https://tse4.mm.bing.net/th/id/OIP.4MD-SGlJCaWCciAdFOLG8QHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🀄' ,
        category: 'board-games' ,
        supportedModes: ['local', 'ai' , 'online'],
        route: "games/mahjong/index.html",
        players: "4 Players",
        status: "coming_soon"
    },
    {
        id: "Pool",
        name: "Snooker ",
        description: "A classic strategy game of cue sports.",
        thumbnail: "https://tse3.mm.bing.net/th/id/OIP.fycR4aMT4BuLU3KWITrHYwHaE8?r=0&w=606&h=404&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🎱' ,
        category: 'board-games' ,
        supportedModes: ['local', 'ai' , 'online'],
        route: "games/pool/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "connect-four",
        name: "Connect Four",
        description: "A classic strategy game of dropping discs into a grid.",
        thumbnail: "https://microless.com/cdn/products/1f5b91f1d99ca779dee80a8628961a82-hi.jpg",
        icon: '🔴' ,
        category: 'board-games' ,
        supportedModes: ['local', 'ai' , 'online'],
        route: "games/connect-four/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "dominoes",
        name: "Dominoes",
        description: "Standard block and draw tile games.",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.j65knk34KhiAkqcnImCd3AHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🁢' ,
        category: 'board-games' ,
        supportedModes: ['local', 'ai' , 'online'],
        route: "games/dominoes/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },
  // ── ROADMAP — OTHER ─────────────────────────────────────
  { id: 'trivia', name: 'STEENE Trivia', description: 'Test your knowledge across categories, solo or head-to-head.', icon: '❓', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.6iYT-C2dSmHR8cpzsMsM6AHaDt?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'other-games', route: null, players: '1-8', supportedModes: ['local', 'online'], status: 'coming_soon' }
];

window.gameRegistry = {
  /** Every entry, real or planned. */
  getAll() {
    return gameRegistryData;
  },

  /** A single game by id, or null. */
  getById(id) {
    return gameRegistryData.find(g => g.id === id) || null;
  },

  /** All entries in one category (e.g. 'board-games'). */
  getByCategory(category) {
    return gameRegistryData.filter(g => g.category === category);
  },

  /** Only games that actually exist and can be launched. */
  getAvailable() {
    return gameRegistryData.filter(g => g.status === 'available');
  },

  /** Distinct category ids, in first-seen order. */
  getCategories() {
    const seen = [];
    gameRegistryData.forEach(g => {
      if (!seen.includes(g.category)) seen.push(g.category);
    });
    return seen;
  }
};
