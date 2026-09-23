/* ==========================================================
   STEENE — game-registry.js (Fully Internationalized)
   ========================================================== */

const gameRegistryTranslations = {
    en: {
        barricade: { name: 'STEENE Barricade', description: 'A strategy board game of blocking, jumping, and secret destinations.' },
        chess: { name: 'STEENE Chess', description: 'Classic chess — play locally or against the computer.' },
        checkers: { name: 'Checkers', description: 'The timeless classic of diagonal captures and kings.' },
        backgammon: { name: 'Backgammon', description: 'Race your pieces home in this ancient dice-and-strategy game.' },
        go: { name: 'Go', description: 'Surround more territory than your opponent on a 19x19 grid.' },
        reversi: { name: 'Reversi', description: 'Flip your opponent\'s discs to claim the board.' },
        ludo: { name: 'Ludo', description: 'Race four tokens home in this beloved family classic.' },
        poker: { name: 'STEENE Poker', description: 'Texas Hold\'em with friends or the house.' },
        blackjack: { name: 'Blackjack', description: 'Beat the dealer to 21.' },
        solitaire: { name: 'Solitaire', description: 'The classic single-player card sort.' },
        spades: { name: 'Spades', description: 'Bid, trick, and take — a partnership card game classic.' },
        'snakes-and-ladders': { name: 'Snakes and Ladders', description: 'A game of pure chance, excellent for testing RNG and linear progression.' },
        pucket: { name: 'Pucket', description: 'Both players race simultaneously, to clear their side of the board first.' },
        sudoku: { name: 'Sudoku', description: 'Fill the grid, one logical deduction at a time.' },
        minesweeper: { name: 'Minesweeper', description: 'Clear the field without triggering a mine.' },
        'word-search': { name: 'Word Search', description: 'Find every hidden word before the timer runs out.' },
        'risk-clone': { name: 'Empire', description: 'Conquer the map, one territory at a time.' },
        stratego: { name: 'Stratego', description: 'Hidden armies clash — outwit, don\'t just outgun.' },
        snake: { name: 'Snake', description: 'Grow longer, don\'t hit the walls (or yourself).' },
        breakout: { name: 'Breakout', description: 'Break every brick without losing the ball.' },
        pong: { name: 'Pong', description: 'The original — first to 11 wins.' },
        mancala: { name: 'Mancala (Oware / Wari)', description: 'A sowing game relying on arrays and mathematical calculation rather than a grid map.' },
        Whot: { name: 'Whot', description: 'A fun and engaging card game for all ages.' },
        mahjong: { name: 'Mahjong', description: 'Traditional Chinese tile-matching and melding game.' },
        Pool: { name: 'Snooker', description: 'A classic strategy game of cue sports.' },
        'connect-four': { name: 'Connect Four', description: 'A classic strategy game of dropping discs into a grid.' },
        dominoes: { name: 'Dominoes', description: 'Standard block and draw tile games.' },
        trivia: { name: 'STEENE Trivia', description: 'Test your knowledge across categories, solo or head-to-head.' }
    },
    es: {
        barricade: { name: 'STEENE Barricade', description: 'Un juego de mesa de estrategia de bloqueo, saltos y destinos secretos.' },
        chess: { name: 'STEENE Ajedrez', description: 'Ajedrez clásico: juega localmente o contra la computadora.' },
        checkers: { name: 'Damas', description: 'El clásico atemporal de capturas diagonales y reyes.' },
        backgammon: { name: 'Backgammon', description: 'Lleva tus piezas a casa en este antiguo juego de dados y estrategia.' },
        go: { name: 'Go', description: 'Rodea más territorio que tu oponente en una cuadrícula de 19x19.' },
        reversi: { name: 'Reversi', description: 'Voltea los discos de tu oponente para reclamar el tablero.' },
        ludo: { name: 'Ludo', description: 'Lleva cuatro fichas a casa en este querido clásico familiar.' },
        poker: { name: 'STEENE Póker', description: 'Texas Hold\'em con amigos o la casa.' },
        blackjack: { name: 'Blackjack', description: 'Vence al crupier llegando a 21.' },
        solitaire: { name: 'Solitario', description: 'El clásico ordenamiento de cartas para un jugador.' },
        spades: { name: 'Spades', description: 'Puja, haz triquiñuelas y gana: un clásico de cartas por parejas.' },
        'snakes-and-ladders': { name: 'Serpientes y Escaleras', description: 'Un juego de pura suerte, excelente para probar RNG y progresión lineal.' },
        pucket: { name: 'Pucket', description: 'Ambos jugadores compiten simultáneamente para limpiar su lado del tablero primero.' },
        sudoku: { name: 'Sudoku', description: 'Llena la cuadrícula, una deducción lógica a la vez.' },
        minesweeper: { name: 'Buscaminas', description: 'Limpia el campo sin activar ninguna mina.' },
        'word-search': { name: 'Sopa de Letras', description: 'Encuentra cada palabra oculta antes de que se acabe el tiempo.' },
        'risk-clone': { name: 'Imperio', description: 'Conquista el mapa, un territorio a la vez.' },
        stratego: { name: 'Stratego', description: 'Ejércitos ocultos chocan: sé más astuto, no solo más fuerte.' },
        snake: { name: 'Snake', description: 'Crece más, no choques contra las paredes (ni contra ti mismo).' },
        breakout: { name: 'Breakout', description: 'Rompe cada ladrillo sin perder la pelota.' },
        pong: { name: 'Pong', description: 'El original: el primero en llegar a 11 gana.' },
        mancala: { name: 'Mancala (Oware / Wari)', description: 'Un juego de siembra basado en matrices y cálculos matemáticos en lugar de un mapa de cuadrícula.' },
        Whot: { name: 'Whot', description: 'Un juego de cartas divertido y atractivo para todas las edades.' },
        mahjong: { name: 'Mahjong', description: 'Juego tradicional chino de combinación y emparejamiento de fichas.' },
        Pool: { name: 'Snooker', description: 'Un juego de estrategia clásico de deportes de taco.' },
        'connect-four': { name: 'Conecta 4', description: 'Un clásico juego de estrategia de soltar fichas en una cuadrícula.' },
        dominoes: { name: 'Dominó', description: 'Juegos estándar de fichas de bloqueo y robo.' },
        trivia: { name: 'STEENE Trivia', description: 'Prueba tus conocimientos en varias categorías, solo o cara a cara.' }
    },
    fr: {
        barricade: { name: 'STEENE Barricade', description: 'Un jeu de plateau de stratégie basé sur le blocage, les sauts et les destinations secrètes.' },
        chess: { name: 'STEENE Échecs', description: 'Échecs classiques — jouez en local ou contre l’ordinateur.' },
        checkers: { name: 'Dames', description: 'Le grand classique intemporel des captures en diagonale et des rois.' },
        backgammon: { name: 'Backgammon', description: 'Ramenez vos pions chez vous dans ce jeu ancien de dés et de stratégie.' },
        go: { name: 'Go', description: 'Entourez plus de territoire que votre adversaire sur une grille 19x19.' },
        reversi: { name: 'Reversi', description: 'Retournez les disques de votre adversaire pour revendiquer le plateau.' },
        ludo: { name: 'Petits Chevaux (Ludo)', description: 'Ramenez quatre pions à la maison dans ce classique familial bien-aimé.' },
        poker: { name: 'STEENE Poker', description: 'Texas Hold\'em entre amis ou contre la maison.' },
        blackjack: { name: 'Blackjack', description: 'Battez le croupier pour atteindre 21.' },
        solitaire: { name: 'Solitaire', description: 'Le tri de cartes classique en solo.' },
        spades: { name: 'Spades', description: 'Enchérissez, rusez et remportez la mise — un classique du jeu de cartes en partenariat.' },
        'snakes-and-ladders': { name: 'Serpents et Échelles', description: 'Un jeu de pur hasard, excellent pour tester le RNG et la progression linéaire.' },
        pucket: { name: 'Pucket', description: 'Les deux joueurs s’affrontent simultanément pour vider leur côté du plateau en premier.' },
        sudoku: { name: 'Sudoku', description: 'Remplissez la grille, une déduction logique à la fois.' },
        minesweeper: { name: 'Démineur', description: 'Nettoyez le terrain sans déclencher de mine.' },
        'word-search': { name: 'Mots Mêlés', description: 'Trouvez chaque mot caché avant la fin du temps imparti.' },
        'risk-clone': { name: 'Empire', description: 'Conquérez la carte, un territoire à la fois.' },
        stratego: { name: 'Stratego', description: 'Des armées cachées s’affrontent — soyez plus malin, pas seulement plus fort.' },
        snake: { name: 'Snake', description: 'Grandissez, ne touchez pas les murs (ni vous-même).' },
        breakout: { name: 'Casse-briques', description: 'Cassez chaque brique sans perdre la balle.' },
        pong: { name: 'Pong', description: 'L’original — le premier à 11 gagne.' },
        mancala: { name: 'Mancala (Oware / Wari)', description: 'Un jeu de semence reposant sur des tableaux et des calculs mathématiques plutôt que sur une grille.' },
        Whot: { name: 'Whot', description: 'Un jeu de cartes amusant et captivant pour tous les âges.' },
        mahjong: { name: 'Mahjong', description: 'Jeu traditionnel chinois d’association et de composition de tuiles.' },
        Pool: { name: 'Snooker', description: 'Un jeu de stratégie classique de sports de queue.' },
        'connect-four': { name: 'Puissance 4', description: 'Un jeu de stratégie classique consistant à aligner des disques dans une grille.' },
        dominoes: { name: 'Dominos', description: 'Jeux de tuiles classiques de blocage et de pioche.' },
        trivia: { name: 'STEENE Trivia', description: 'Testez vos connaissances dans diverses catégories, en solo ou en tête-à-tête.' }
    },
    de: {
        barricade: { name: 'STEENE Barricade', description: 'Ein Strategie-Brettspiel voller Blockaden, Sprünge und geheimer Ziele.' },
        chess: { name: 'STEENE Schach', description: 'Klassisches Schach — spiele lokal oder gegen den Computer.' },
        checkers: { name: 'Dame', description: 'Der zeitlose Klassiker mit diagonalen Schlägen und Königen.' },
        backgammon: { name: 'Backgammon', description: 'Bringe deine Steine in diesem antiken Würfel- und Strategierspiel nach Hause.' },
        go: { name: 'Go', description: 'Umschließe mehr Gebiet als dein Gegner auf einem 19x19-Gitter.' },
        reversi: { name: 'Reversi', description: 'Drehe die Spielsteine deines Gegners um, um das Brett zu erobern.' },
        ludo: { name: 'Mensch ärgere Dich nicht (Ludo)', description: 'Bringe vier Spielfiguren in diesem beliebten Familienklassiker nach Hause.' },
        poker: { name: 'STEENE Poker', description: 'Texas Hold\'em mit Freunden oder dem Haus.' },
        blackjack: { name: 'Blackjack', description: 'Schlage den Croupier bis zur 21.' },
        solitaire: { name: 'Solitaire', description: 'Das klassische Einzelspieler-Kartenspiel.' },
        spades: { name: 'Spades', description: 'Bieten, tricksen und gewinnen — ein Partnerschafts-Kartenklassiker.' },
        'snakes-and-ladders': { name: 'Schlitten und Leitern (Leiterspiel)', description: 'Ein reines Glücksspiel, hervorragend geeignet zum Testen von Zufall und linearer Progression.' },
        pucket: { name: 'Pucket', description: 'Beide Spieler treten gleichzeitig an, um ihre Seite des Brettes als Erste zu leeren.' },
        sudoku: { name: 'Sudoku', description: 'Fülle das Gitter aus, eine logische Schlussfolgerung nach der anderen.' },
        minesweeper: { name: 'Minesweeper', description: ' Räume das Feld, ohne eine Mine auszulösen.' },
        'word-search': { name: 'Wortsuche', description: 'Finde jedes versteckte Wort, bevor die Zeit abläuft.' },
        'risk-clone': { name: 'Empire', description: 'Erobere die Karte, Gebiet für Gebiet.' },
        stratego: { name: 'Stratego', description: 'Versteckte Armeen prallen aufeinander — sei clever, nicht nur bewaffnet.' },
        snake: { name: 'Snake', description: 'Wachse länger, triff nicht die Wände (oder dich selbst).' },
        breakout: { name: 'Breakout', description: 'Zerstöre jeden Stein, ohne den Ball zu verlieren.' },
        pong: { name: 'Pong', description: 'Das Original — wer zuerst 11 erreicht, gewinnt.' },
        mancala: { name: 'Mancala (Oware / Wari)', description: 'Ein Sä-Spiel, das auf Arrays und mathematischen Berechnungen anstelle eines Rasterfelds basiert.' },
        Whot: { name: 'Whot', description: 'Ein unterhaltsames und fesselndes Kartenspiel für alle Altersgruppen.' },
        mahjong: { name: 'Mahjong', description: 'Traditionelles chinesisches Kachel- und Kombinationsspiel.' },
        Pool: { name: 'Snooker', description: 'Ein klassisches Strategiespiel aus dem Queue-Sport.' },
        'connect-four': { name: 'Vier gewinnt', description: 'Ein klassisches Strategiespiel, bei dem Scheiben in ein Gitter eingeworfen werden.' },
        dominoes: { name: 'Domino', description: 'Standard-Block- und Zieh-Steinspiele.' },
        trivia: { name: 'STEENE Trivia', description: 'Teste dein Wissen in verschiedenen Kategorien, allein oder im Duell.' }
    }
};

const baseGameRegistryData = [
  // ── AVAILABLE ──────────────────────────────────────────
  {
    id: 'barricade',
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
    icon: '♞',
    thumbnail: "https://tse4.mm.bing.net/th/id/OIP.JDNTOaw9RAQhfm3O8Q4RoQHaEo?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    category: 'board-games',
    route: 'games/board-games/chess/index.html',
    players: '2',
    supportedModes: ['local', 'ai', 'online'],
    status: 'available'
  },
    
  // ── ROADMAP — BOARD GAMES ──────────────────────────────
  { id: 'checkers', icon: '⚫', thumbnail: "https://tse4.mm.bing.net/th/id/OIP._jAJ-vnRk6XW5kKANnUM1QHaE0?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: "games/board-games/checkers/index.html", players: '2', supportedModes: ['local', 'ai', 'online'], status: 'available' },
  { id: 'backgammon', icon: '🎲', thumbnail: "https://tse1.explicit.bing.net/th/id/OIP.iWxGw1fvGRroVPRLItrskQHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: "games/board-games/backgammon/index.html", players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  { id: 'go', icon: '⚪', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.0GGbbwfYd8W6-6avw51KZwHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: "games/board-games/go/index.html", players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  { id: 'reversi', icon: '🔴', thumbnail: "https://tse1.explicit.bing.net/th/id/OIP.fB4LNxD6PQxAiXe8vCmQbQHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: "games/board-games/reversi/index.html", players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  { id: 'ludo', icon: '🎯', thumbnail: "https://tse1.explicit.bing.net/th/id/OIP.mjcPCbx3J_n9pLOn3YGL6gHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'board-games', route: "games/board-games/ludo/index.html", players: '2-4', supportedModes: ['local', 'ai'], status: 'coming_soon' },

  // ── ROADMAP — CARD GAMES ───────────────────────────────
  { id: 'poker', icon: '🃏', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.8J6GtWe01i4434qOCpZEvwHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'card-games', route: "games/card-games/poker/index.html", players: '2-8', supportedModes: ['local', 'ai', 'online'], status: 'coming_soon' },
  { id: 'blackjack', icon: '🂡', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.c3YWFwlTFJ7YxEZfcHuZRgHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'card-games', route: "games/card-games/blackjack/index.html", players: '1', supportedModes: ['ai'], status: 'coming_soon' },
  { id: 'solitaire', icon: '🂮', thumbnail: "https://th.bing.com/th/id/R.bc258e9b5c676081f00b771ecd876948?rik=bYsvobSIDz6q1w&pid=ImgRaw&r=0", category: 'card-games', route: "games/card-games/solitaire/index.html", players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'spades', icon: '♠️', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.u_UGK_IVQQPd38O5cFzOLAHaFO?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'card-games', route: "games/card-games/spades/index.html", players: '4', supportedModes: ['local', 'online'], status: 'coming_soon' },
  { id: "snakes-and-ladders", icon: '🏁', thumbnail: "https://media.istockphoto.com/id/2170863282/vector/snake-ladder-snakes-ladders-board-game-template-children-puzzle-play-fun-competition-gaming.jpg?s=170667a&w=0&k=20&c=oy7EvaQiwpTiv36G3LS4m4ypHEazjMfhKwkdkjGQBvk=", category: 'board-games', supportedModes: ['local', 'ai', 'online'], route: "games/snakes-and-ladders/index.html", players: "2 - 4 Players", status: "coming_soon" },

  {
        id: "pucket",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.niHZQyINHt5dvAIVS_bJ0gHaEK?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🍥',
        supportedModes: ['local', 'ai', 'online'],
        category: 'board-games',
        route: "games/pucket/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
  // ── ROADMAP — PUZZLE GAMES ─────────────────────────────
  { id: 'sudoku', icon: '🔢', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.9dGcS6pBuDqXn3sIIJO_eAHaE8?r=0&w=992&h=662&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'puzzle-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'minesweeper', icon: '💣', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.UGO3iYip9kvSg3TTZhbSlgHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'puzzle-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'word-search', icon: '🔤', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.SJMuYDjOXpQcRRvL0oZwHQHaE9?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'puzzle-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },

  // ── ROADMAP — STRATEGY GAMES ───────────────────────────
  { id: 'risk-clone', icon: '🗺️', thumbnail: "https://th.bing.com/th/id/R.feb3723efd80304fc06c2aab03955956?rik=yH1l733kLM6zEQ&pid=ImgRaw&r=0", category: 'strategy-games', route: null, players: '2-6', supportedModes: ['local', 'ai', 'online'], status: 'coming_soon' },
  { id: 'stratego', icon: '🎖️', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.OwHPyHK7ojUu4i40hAuRrgHaE6?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'strategy-games', route: null, players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },

  // ── ROADMAP — ARCADE GAMES ─────────────────────────────
  { id: 'snake', icon: '🐍', thumbnail: "https://wallpaperaccess.com/full/8552514.jpg", category: 'arcade-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'breakout', icon: '🧱', thumbnail: "https://thumbs.dreamstime.com/b/bold-stylized-graphic-featuring-word-breakout-script-font-text-rendered-white-thick-black-outline-creating-strong-416275632.jpg?w=360", category: 'arcade-games', route: null, players: '1', supportedModes: ['local'], status: 'coming_soon' },
  { id: 'pong', icon: '🏓', thumbnail: "https://tse3.mm.bing.net/th/id/OIP.SUePp78t7UfCKypfrjb-8gHaLH?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'arcade-games', route: null, players: '2', supportedModes: ['local', 'ai'], status: 'coming_soon' },
  {
        id: "mancala",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.JSHpJHnWIa_VtaBMdnjHxgHaFh?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🪨',
        category: 'board-games',
        supportedModes: ['local', 'ai', 'online'],
        route: "games/mancala/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },  
  {
        id: "Whot",
        thumbnail: "https://lh3.googleusercontent.com/J9y-KArT25Gx5CncOfHzAu5LiFYRzhtpD7Imd0HGhruGbj5ZmbdFAq5TYCUcd-dUeXPz7LZpyKTsBZN2eosdWafV3fFQ4XfRtlXN1akdV4LV98D3PtjvdrbtXJMfxvueOkv9X3mT6kHBpfZHrw",
        icon: '🎴',
        category: 'card-games',
        supportedModes: ['local', 'ai', 'online'],
        route: "games/whot/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },
     {
        id: "mahjong",
        thumbnail: "https://tse4.mm.bing.net/th/id/OIP.4MD-SGlJCaWCciAdFOLG8QHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🀄',
        category: 'board-games',
        supportedModes: ['local', 'ai', 'online'],
        route: "games/mahjong/index.html",
        players: "4 Players",
        status: "coming_soon"
    },
    {
        id: "Pool",
        thumbnail: "https://tse3.mm.bing.net/th/id/OIP.fycR4aMT4BuLU3KWITrHYwHaE8?r=0&w=606&h=404&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🎱',
        category: 'board-games',
        supportedModes: ['local', 'ai', 'online'],
        route: "games/pool/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "connect-four",
        thumbnail: "https://microless.com/cdn/products/1f5b91f1d99ca779dee80a8628961a82-hi.jpg",
        icon: '🔴',
        category: 'board-games',
        supportedModes: ['local', 'ai', 'online'],
        route: "games/connect-four/index.html",
        players: "2 Players",
        status: "coming_soon"
    },
    {
        id: "dominoes",
        thumbnail: "https://tse2.mm.bing.net/th/id/OIP.j65knk34KhiAkqcnImCd3AHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
        icon: '🁢',
        category: 'board-games',
        supportedModes: ['local', 'ai', 'online'],
        route: "games/dominoes/index.html",
        players: "2 - 4 Players",
        status: "coming_soon"
    },
  // ── ROADMAP — OTHER ─────────────────────────────────────
  { id: 'trivia', icon: '❓', thumbnail: "https://tse4.mm.bing.net/th/id/OIP.6iYT-C2dSmHR8cpzsMsM6AHaDt?r=0&rs=1&pid=ImgDetMain&o=7&rm=3", category: 'other-games', route: null, players: '1-8', supportedModes: ['local', 'online'], status: 'coming_soon' }
];

function getLocalizedGameRegistry() {
    const settings = window.steeneSettingsView?._settings || {};
    const lang = settings.language || document.documentElement.lang || 'en';
    const dict = gameRegistryTranslations[lang] || gameRegistryTranslations.en;

    return baseGameRegistryData.map(game => {
        const localized = dict[game.id] || gameRegistryTranslations.en[game.id] || { name: game.id, description: '' };
        return {
            ...game,
            name: localized.name,
            description: localized.description
        };
    });
}

window.gameRegistry = {
  /** Every entry, real or planned, localized to active language. */
  getAll() {
    return getLocalizedGameRegistry();
  },

  /** A single game by id, or null. */
  getById(id) {
    return getLocalizedGameRegistry().find(g => g.id === id) || null;
  },

  /** All entries in one category (e.g. 'board-games'). */
  getByCategory(category) {
    return getLocalizedGameRegistry().filter(g => g.category === category);
  },

  /** Only games that actually exist and can be launched. */
  getAvailable() {
    return getLocalizedGameRegistry().filter(g => g.status === 'available');
  },

  /** Distinct category ids, in first-seen order. */
  getCategories() {
    const registry = getLocalizedGameRegistry();
    const seen = [];
    registry.forEach(g => {
      if (!seen.includes(g.category)) seen.push(g.category);
    });
    return seen;
  }
};