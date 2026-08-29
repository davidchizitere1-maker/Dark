/**
 * STEENE — steene/js/core/game-registry.js
 * Central configuration database for board games available on the STEENE platform.
 */

const GameRegistry = [
    
    {
        id: "neon-tactics",
        name: "Barricade Game",
        description: "A strategy board game of blocking, jumping and secret destinations. Wall off your opponent. Reach your targets first.",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.khdsXUPsZKlf7sQVOcPEsQHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/barricade/index.html",
        players: "1 - 2 Players",
        status: "available"
    },
    {
        id: "quantum-chess",
        name: "Chess",
        description: "Classic rules with a futuristic twist and shifting boundaries.",
        thumbnail: "https://tse4.mm.bing.net/th/id/OIP.JDNTOaw9RAQhfm3O8Q4RoQHaEo?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/chess/index.html",
        players: "2 Players",
        status: "available"
    },
    {
        id: "ludo",
        name: "Ludo",
        description: "A classic board game of strategy and luck.",
        thumbnail: "https://tse1.mm.bing.net/th/id/OIP.mjcPCbx3J_n9pLOn3YGL6gHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/ludo/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },
    {
        id: "Pool",
        name: "Snooker ",
        description: "A classic strategy game of cue sports.",
        thumbnail: "https://tse3.mm.bing.net/th/id/OIP.fycR4aMT4BuLU3KWITrHYwHaE8?r=0&w=606&h=404&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/pool/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "go",
        name: "Go (Weiqi)",
        description: "Simple rules, deep complexity. Ideal for testing grid and state logic.",
        thumbnail: "https://tse4.mm.bing.net/th/id/OIP.0GGbbwfYd8W6-6avw51KZwHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/go/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "checkers",
        name: "Checkers (Draughts)",
        description: "A great entry-level project to build your first board game engine.",
        thumbnail: "https://tse4.mm.bing.net/th/id/OIP._jAJ-vnRk6XW5kKANnUM1QHaE0?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/checkers/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "mancala",
        name: "Mancala (Oware / Wari)",
        description: "A sowing game relying on arrays and mathematical calculation rather than a grid map.",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.JSHpJHnWIa_VtaBMdnjHxgHaFh?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/mancala/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },
    {
        id: "connect-four",
        name: "Connect Four",
        description: "A classic strategy game of dropping discs into a grid.",
        thumbnail: "https://microless.com/cdn/products/1f5b91f1d99ca779dee80a8628961a82-hi.jpg",
        route: "games/connect-four/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "royal-game-of-ur",
        name: "The Royal Game of Ur",
        description: "The oldest playable board game in the world (c. 2600 BC) featuring a simple race mechanic.",
        thumbnail: "steene/assets/placeholder.png",
        route: "games/royal-game-of-ur/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "hnefatafl",
        name: "Hnefatafl (Viking Chess)",
        description: "An asymmetrical strategy game where a king tries to escape while attackers swarm.",
        thumbnail: "https://th.bing.com/th/id/R.63fe85dc2976f050add4c51a3ac29582?rik=qLu2fOtT7eEgvw&pid=ImgRaw&r=0",
        route: "games/hnefatafl/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "senet",
        name: "Senet",
        description: "An ancient Egyptian race game beloved by pharaohs.",
        thumbnail: "steene/assets/placeholder.png",
        route: "games/senet/index.html",
        players: "2 Players",   
        status: "coming_soon"
    },
    {
        id: "nine-mens-morris",
        name: "Nine Men's Morris",
        description: "A classic alignment and capture game played on a grid of intersections.",
        thumbnail: "https://tse4.mm.bing.net/th/id/OIP.fh3Uj8mSBj9sr1kevDyFHwHaFW?r=0&w=1000&h=722&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/nine-mens-morris/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "backgammon",
        name: "Backgammon",
        description: "Combines dice-roll probability with strategic board movement.",
        thumbnail: "steene/assets/placeholder.png",
        route: "games/backgammon/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "pachisi-ludo",
        name: "Pachisi / Ludo",
        description: "The public domain ancestor to modern commercial roll-and-move games.",
        thumbnail: "steene/assets/placeholder.png",
        route: "games/pachisi-ludo/index.html",
        players: "2 - 4 Players", 
        status: "coming_soon"
    },
    {
        id: "snakes-and-ladders",
        name: "Snakes and Ladders (Moksha Patam)",
        description: "A game of pure chance, excellent for testing RNG and linear progression.",
        thumbnail: "https://media.istockphoto.com/id/2170863282/vector/snake-ladder-snakes-ladders-board-game-template-children-puzzle-play-fun-competition-gaming.jpg?s=170667a&w=0&k=20&c=oy7EvaQiwpTiv36G3LS4m4ypHEazjMfhKwkdkjGQBvk=",
        route: "games/snakes-and-ladders/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },
    {
        id: "halma",
        name: "Halma",
        description: "The 19th-century public domain precursor to Chinese Checkers.",
        thumbnail: "steene/assets/placeholder.png",
        route: "games/halma/index.html",
        players: "2 - 4 Players",   
        status: "coming_soon"
    },
    {
        id: "mahjong",
        name: "Mahjong",
        description: "Traditional Chinese tile-matching and melding game.",
        thumbnail: "https://tse4.mm.bing.net/th/id/OIP.4MD-SGlJCaWCciAdFOLG8QHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/mahjong/index.html",
        players: "4 Players",
        status: "coming_soon"
    },
    {
        id: "dominoes",
        name: "Dominoes",
        description: "Standard block and draw tile games.",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.j65knk34KhiAkqcnImCd3AHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/dominoes/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },
    {
        id: "standard-cards",
        name: "Standard 52-Card Deck Games",
        variants: ["Poker", "Hearts", "Spades", "Cribbage", "Solitaire", "Bridge"],
        description: "Completely free-to-implement card classics using a standard 52-card deck.",
        thumbnail: "steene/assets/placeholder.png",
        route: "games/standard-cards/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"

    },
    {
        id: "pucket",
        name: "Pucket",
        description: "Both players race simultaneously, to clear their side of the board first.",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.niHZQyINHt5dvAIVS_bJ0gHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        route: "games/pucket/index.html",
        players: "2 Players",
        status: "coming_soon"
    }
];