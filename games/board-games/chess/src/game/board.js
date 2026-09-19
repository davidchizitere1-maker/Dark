/* ==========================================================
   STEENE — src/game/board.js

   Chess board state, rendering, selection, movement, captures,
   promotion, board rotation, timers, AI orchestration, and
   game-panel updates.

   Board coordinates:
   row 0 = rank 8
   row 7 = rank 1
   column 0 = file a
   column 7 = file h

   ── FIXES BROUGHT FORWARD THIS PASS ──────────────────────
   These were built and delivered in an earlier session but never
   actually made it into the live repo, so this refactor carries
   them forward rather than reconstructing the older, unfixed file:

   1) endGame() now calls window.recordGameResult() (defined in
      src/ui/interface.js) so games actually get reported to the
      stats/profile system — this previously never happened at all,
      which was the deeper half of why "games played / games won /
      rating" never moved (the other half was a storage-key bug
      fixed in the profile logic itself).
   2) checkForNoLegalMoves() is no longer the active win-condition
      check — checkGameEndStatus() is, using ChessLogic.getGameStatus()
      (already correctly implemented in logic.js, just never wired
      up) to tell checkmate and stalemate apart. Every no-legal-move
      position used to be scored as a checkmate win for the other
      side, including genuine stalemates, which should be a draw.
      This also finally increments G.checks, which existed as a
      displayed stat (#stChecks) but was never incremented anywhere.
   3) Added the full post-game replay scrubber (startReplay,
      exitReplay, replayStep, replayScrub) — there was no replay
      feature at all before this, on the board or in the victory
      screen.
   ========================================================== */

let G = {};

const FILES = "abcdefgh";

const PIECES = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙"
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟"
  }
};

const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0
};

let promotionState = null;

/* Post-game replay state. Populated by startReplay() from
   G.moveLog, which is why replay only exists after a game has
   ended and is discarded the moment you start/leave a game. */
let replay = { active: false, moves: [], index: 0 };

/* ==========================================================
   HELPERS
   ========================================================== */

function id(name) {
  return document.getElementById(name);
}

function pretty(color) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function oppositeColor(color) {
  return color === "white" ? "black" : "white";
}

function coord(row, column) {
  return `${FILES[column]}${8 - row}`;
}

function isInsideBoard(row, column) {
  return row >= 0 && row < 8 && column >= 0 && column < 8;
}

function cellColor(row, column) {
  return (row + column) % 2 === 0 ? "lt" : "dk";
}

function cellEl(row, column) {
  return document.querySelector(
    `.cell[data-r="${row}"][data-c="${column}"]`
  );
}

function playSound(name) {
  if (typeof window[name] === "function") {
    window[name]();
  }
}

function getPiece(row, column) {
  if (!G.board || !isInsideBoard(row, column)) {
    return null;
  }

  return G.board[row][column];
}

function setPiece(row, column, piece) {
  if (isInsideBoard(row, column)) {
    G.board[row][column] = piece;
  }
}

function cloneBoard(board) {
  return board.map(row =>
    row.map(piece => piece ? { ...piece } : null)
  );
}

function createPiece(color, type) {
  return {
    color,
    type,
    hasMoved: false
  };
}

/* ==========================================================
   GAME INITIALIZATION
   ========================================================== */

function newGame(config = {}) {
  G = {
    boardSize: 8,
    board: createInitialBoard(),

    turn: "white",
    phase: "playing",
    selected: null,

    mode: config.mode || "local",
    aiMode: config.mode === "ai" || !!config.aiMode,
    aiPlayer: "black",
    aiDifficulty: Number(config.aiDifficulty || 0),
    aiThinking: false,

    boardTheme: config.boardTheme || config.theme || "dark",
    pieceMode: config.pieceMode || "classic",
    rotated: false,

    timerEnabled: !!config.timerEnabled,
    timerSeconds: Number(config.timerSeconds) || 45,
    timerRemaining: Number(config.timerSeconds) || 45,
    timerInterval: null,

    animating: false,
    moveNumber: 0,
    turns: 0,
    captures: 0,
    checks: 0,

    captured: {
      white: [],
      black: []
    },

    moveLog: [],
    positionHistory: []
  };

  window.G = G;

  applyBoardTheme(G.boardTheme);

  G.positionHistory.push({
    board: cloneBoard(G.board),
    turn: G.turn
  });

  return G;
}

function createInitialBoard() {
  const board = Array.from(
    { length: 8 },
    () => Array(8).fill(null)
  );

  const backRank = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook"
  ];

  for (let column = 0; column < 8; column++) {
    board[0][column] = createPiece(
      "black",
      backRank[column]
    );

    board[1][column] = createPiece(
      "black",
      "pawn"
    );

    board[6][column] = createPiece(
      "white",
      "pawn"
    );

    board[7][column] = createPiece(
      "white",
      backRank[column]
    );
  }

  return board;
}

function startLocalGame(config = {}) {
  newGame({
    ...config,
    mode: "local"
  });

  if (typeof goTo === "function") {
    goTo("game");
  }

  setTimeout(() => {
    buildBoard();
    render();
    updateTurnIndicator();
    refreshTurnTimer();

    if (id("victOv")) {
      id("victOv").classList.remove("open");
    }

    clearEventLog();

    setInstr(
      "Select a white piece, then choose a highlighted square."
    );
  }, 60);
}

function startAiGame(difficulty = 0, config = {}) {
  newGame({
    ...config,
    mode: "ai",
    aiMode: true,
    aiDifficulty: difficulty
  });

  if (typeof goTo === "function") {
    goTo("game");
  }

  setTimeout(() => {
    buildBoard();
    render();
    updateTurnIndicator();
    refreshTurnTimer();

    if (id("victOv")) {
      id("victOv").classList.remove("open");
    }

    clearEventLog();

    setInstr(
      "You play as White. Select a piece to begin."
    );
  }, 60);
}

/* ==========================================================
   BOARD BUILDING
   ========================================================== */

function buildBoard() {
  const board = id("board");

  if (!board) {
    return;
  }

  board.innerHTML = "";
  board.style.setProperty("--board-size", "8");

  buildCoordinates();

  const rows = G.rotated
    ? [0, 1, 2, 3, 4, 5, 6, 7]
    : [7, 6, 5, 4, 3, 2, 1, 0];

  const columns = G.rotated
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7];

  rows.forEach(row => {
    columns.forEach(column => {
      const cell = document.createElement("div");

      cell.className = `cell ${cellColor(row, column)}`;
      cell.dataset.r = row;
      cell.dataset.c = column;

      const dot = document.createElement("div");
      dot.className = "mdot";

      cell.appendChild(dot);

      cell.addEventListener("click", event => {
        if (
          event.target.closest(".piece") ||
          G.animating
        ) {
          return;
        }

        onCellClick(row, column);
      });

      board.appendChild(cell);
    });
  });

  applyRotation();
}

function buildCoordinates() {
  const top = id("cTop");
  const bottom = id("cBot");
  const left = id("cLeft");
  const right = id("cRight");

  const files = G.rotated
    ? FILES.split("").reverse()
    : FILES.split("");

  const ranks = G.rotated
    ? [1, 2, 3, 4, 5, 6, 7, 8]
    : [8, 7, 6, 5, 4, 3, 2, 1];

  const filesHtml = files
    .map(file => `<span class="clbl">${file}</span>`)
    .join("");

  const ranksHtml = ranks
    .map(rank => `<span class="clbl">${rank}</span>`)
    .join("");

  if (top) {
    top.innerHTML = filesHtml;
  }

  if (bottom) {
    bottom.innerHTML = filesHtml;
  }

  if (left) {
    left.innerHTML = ranksHtml;
  }

  if (right) {
    right.innerHTML = ranksHtml;
  }
}

/* ==========================================================
   RENDERING
   ========================================================== */

function render() {
  if (!G.board) {
    return;
  }

  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove(
      "sel",
      "last-move",
      "hint-free",
      "hint-capture",
      "in-check"
    );

    const piece = cell.querySelector(".piece");

    if (piece) {
      piece.remove();
    }

    const dot = cell.querySelector(".mdot");

    if (dot) {
      dot.style.display = "none";
    }
  });

  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      const piece = getPiece(row, column);

      if (!piece) {
        continue;
      }

      const cell = cellEl(row, column);

      if (!cell) {
        continue;
      }

      const pieceElement = createPieceElement(
        piece,
        row,
        column
      );

      cell.appendChild(pieceElement);
    }
  }

  renderSelection();
  renderLastMove();
  renderHighlights();
  renderCapturedPieces();
  updatePanel();
}

function createPieceElement(piece, row, column) {
  const element = document.createElement("div");

  element.className =
    `piece chess-piece ${piece.color} piece-${piece.type}`;

  element.dataset.r = row;
  element.dataset.c = column;
  element.dataset.type = piece.type;
  element.dataset.color = piece.color;

  element.textContent =
    PIECES[piece.color][piece.type];

  if (
    piece.color === G.turn &&
    G.phase === "playing"
  ) {
    element.classList.add("active-player");
  }

  if (
    G.selected &&
    G.selected.row === row &&
    G.selected.column === column
  ) {
    element.classList.add("selected");
  }

  element.addEventListener("click", event => {
    event.stopPropagation();

    if (!G.animating) {
      if (G.selected && piece.color !== G.turn) {
        onCellClick(row, column);
      } else {
        onPieceClick(row, column);
      }
    }
  });

  return element;
}

function renderSelection() {
  if (!G.selected) {
    return;
  }

  const cell = cellEl(
    G.selected.row,
    G.selected.column
  );

  if (cell) {
    cell.classList.add("sel");
  }
}

function renderLastMove() {
  const move = G.moveLog[G.moveLog.length - 1];

  if (!move) {
    return;
  }

  const fromCell = cellEl(
    move.from.row,
    move.from.column
  );

  const toCell = cellEl(
    move.to.row,
    move.to.column
  );

  if (fromCell) {
    fromCell.classList.add("last-move");
  }

  if (toCell) {
    toCell.classList.add("last-move");
  }
}

function renderHighlights() {
  clearHighlights();

  if (
    !G.selected ||
    G.phase !== "playing"
  ) {
    return;
  }

  const moves = getMovesForPiece(
    G.selected.row,
    G.selected.column
  );

  moves.forEach(move => {
    const cell = cellEl(
      move.row,
      move.column
    );

    if (!cell) {
      return;
    }

    const target = getPiece(
      move.row,
      move.column
    );

    cell.classList.add(
      target ? "hint-capture" : "hint-free"
    );

    const dot = cell.querySelector(".mdot");

    if (dot) {
      dot.style.display = "block";
    }
  });
}

function clearHighlights() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove(
      "hint-free",
      "hint-capture",
      "sel"
    );

    const dot = cell.querySelector(".mdot");

    if (dot) {
      dot.style.display = "none";
    }
  });
}

/* ==========================================================
   LEGAL MOVE ACCESS
   ========================================================== */

function getMovesForPiece(row, column) {
  const piece = getPiece(row, column);

  if (!piece) {
    return [];
  }

  let moves = [];

  if (typeof getLegalMoves === "function") {
    moves = getLegalMoves(
      G.board,
      {
        row,
        column
      },
      piece.color
    );
  } else if (
    typeof ChessLogic !== "undefined" &&
    typeof ChessLogic.getLegalMoves === "function"
  ) {
    moves = ChessLogic.getLegalMoves(
      G.board,
      {
        row,
        column
      },
      piece.color
    );
  }

  if (!Array.isArray(moves)) {
    return [];
  }

  return moves
    .map(move => ({
      row: Number(
        move.row ??
        move.r ??
        move.toRow
      ),

      column: Number(
        move.column ??
        move.c ??
        move.toColumn
      ),

      castle: !!move.castle,
      enPassant: !!move.enPassant,
      promotion: !!move.promotion
    }))
    .filter(move =>
      isInsideBoard(
        move.row,
        move.column
      )
    );
}

/* ==========================================================
   PLAYER INTERACTION
   ========================================================== */

function onPieceClick(row, column) {
  if (replay.active) {
    return;
  }

  if (
    G.phase !== "playing" ||
    G.animating ||
    G.aiThinking
  ) {
    return;
  }

  const piece = getPiece(row, column);

  if (!piece) {
    return;
  }

  if (
    G.aiMode &&
    G.turn === G.aiPlayer
  ) {
    setInstr("The AI is thinking...");
    return;
  }

  if (piece.color !== G.turn) {
    playSound("sfxErr");

    setInstr(
      `It is ${pretty(G.turn)}'s turn.`
    );

    return;
  }

  if (
    G.selected &&
    G.selected.row === row &&
    G.selected.column === column
  ) {
    G.selected = null;
    render();

    setInstr("Select a piece to move.");
    return;
  }

  G.selected = {
    row,
    column
  };

  playSound("sfxSel");

  render();

  const moves = getMovesForPiece(row, column);

  setInstr(
    `${pretty(piece.color)} ${piece.type} at ` +
    `${coord(row, column)}. ` +
    `${moves.length
      ? "Choose a highlighted square."
      : "This piece has no legal moves."}`
  );
}

function onCellClick(row, column) {
  if (replay.active) {
    return;
  }

  if (
    G.phase !== "playing" ||
    G.animating
  ) {
    return;
  }

  if (!G.selected) {
    const piece = getPiece(row, column);

    if (
      piece &&
      piece.color === G.turn
    ) {
      onPieceClick(row, column);
    }

    return;
  }

  const from = {
    row: G.selected.row,
    column: G.selected.column
  };

  const to = {
    row,
    column
  };

  const moves = getMovesForPiece(
    from.row,
    from.column
  );

  const legalMove = moves.find(move =>
    move.row === to.row &&
    move.column === to.column
  );

  if (!legalMove) {
    const clickedPiece = getPiece(row, column);

    if (
      clickedPiece &&
      clickedPiece.color === G.turn
    ) {
      onPieceClick(row, column);
      return;
    }

    playSound("sfxErr");
    setInstr("Choose one of the highlighted squares.");
    return;
  }

  performMove(from, to, legalMove);
}

/* ==========================================================
   MOVE EXECUTION
   ========================================================== */

function performMove(from, to, moveData = {}) {
  if (
    G.phase !== "playing" ||
    G.animating
  ) {
    return;
  }

  const piece = getPiece(
    from.row,
    from.column
  );

  if (!piece) {
    return;
  }

  G.animating = true;

  const captured = getPiece(
    to.row,
    to.column
  );

  const moveRecord = {
    number: G.moveNumber + 1,
    color: piece.color,
    piece: piece.type,
    from: { ...from },
    to: { ...to },
    captured: captured
      ? { ...captured }
      : null,
    promotion: null,
    castle: !!moveData.castle,
    enPassant: !!moveData.enPassant,
    notation: ""
  };

  /*
   * Castling support.
   * The legal-move generator should mark a king move
   * with castle: true.
   */
  if (
    piece.type === "king" &&
    Math.abs(to.column - from.column) === 2
  ) {
    moveRecord.castle = true;
    moveCastleRook(from, to);
  }

  /*
   * En passant support.
   * The legal-move generator should mark the move with
   * enPassant: true and the target square will be empty.
   */
  if (
    piece.type === "pawn" &&
    moveData.enPassant
  ) {
    const capturedPawnRow =
      piece.color === "white"
        ? to.row + 1
        : to.row - 1;

    const capturedPawn = getPiece(
      capturedPawnRow,
      to.column
    );

    if (capturedPawn) {
      G.captured[capturedPawn.color].push(
        capturedPawn
      );

      G.captures++;
      moveRecord.captured = {
        ...capturedPawn
      };

      setPiece(
        capturedPawnRow,
        to.column,
        null
      );
    }
  }

  moveRecord.notation = createNotation(
    piece,
    from,
    to,
    captured,
    moveRecord.castle
  );

  setPiece(
    to.row,
    to.column,
    {
      ...piece,
      hasMoved: true
    }
  );

  setPiece(
    from.row,
    from.column,
    null
  );

  if (captured) {
    G.captured[captured.color].push(
      captured
    );

    G.captures++;

    playSound("sfxCapture");
  } else {
    playSound("sfxMove");
  }

  G.turns++;
  G.moveNumber++;
  G.selected = null;

  G.moveLog.push(moveRecord);

  G.positionHistory.push({
    board: cloneBoard(G.board),
    turn: oppositeColor(G.turn)
  });

  render();
  updatePanel();

  logMove(moveRecord);

  const promotionRow =
    piece.color === "white" ? 0 : 7;

  if (
    piece.type === "pawn" &&
    to.row === promotionRow
  ) {
    G.animating = false;

    openPromotionModal(
      to.row,
      to.column,
      piece.color,
      moveRecord
    );

    return;
  }

  finishTurn(moveRecord);
}

function moveCastleRook(from, to) {
  const row = from.row;

  if (to.column > from.column) {
    const rook = getPiece(row, 7);

    if (rook) {
      setPiece(row, 5, {
        ...rook,
        hasMoved: true
      });

      setPiece(row, 7, null);
    }
  } else {
    const rook = getPiece(row, 0);

    if (rook) {
      setPiece(row, 3, {
        ...rook,
        hasMoved: true
      });

      setPiece(row, 0, null);
    }
  }
}

function finishTurn(moveRecord) {
  if (G.phase !== "playing") {
    G.animating = false;
    return;
  }

  G.turn = oppositeColor(G.turn);
  G.animating = false;

  render();
  updateTurnIndicator();
  refreshTurnTimer();

  setInstr(
    `Select a ${G.turn} piece, then choose a highlighted square.`
  );

  const ended = checkGameEndStatus();

  if (
    !ended &&
    G.aiMode &&
    G.turn === G.aiPlayer &&
    G.phase === "playing"
  ) {
    scheduleAIMove();
  }
}

function createNotation(
  piece,
  from,
  to,
  captured,
  castling
) {
  if (
    piece.type === "king" &&
    castling &&
    to.column > from.column
  ) {
    return "O-O";
  }

  if (
    piece.type === "king" &&
    castling &&
    to.column < from.column
  ) {
    return "O-O-O";
  }

  const symbol = piece.type === "pawn"
    ? ""
    : piece.type.charAt(0).toUpperCase();

  const pawnFile =
    piece.type === "pawn" && captured
      ? FILES[from.column]
      : "";

  const captureSymbol = captured ? "x" : "";

  return (
    `${symbol}${pawnFile}${captureSymbol}` +
    `${coord(to.row, to.column)}`
  );
}

/* ==========================================================
   PROMOTION
   ========================================================== */

function openPromotionModal(
  row,
  column,
  color,
  moveRecord
) {
  promotionState = {
    row,
    column,
    color,
    moveRecord,
    selected: "queen"
  };

  const modal = id("promoModal");
  const options = id("promoOptions");

  if (!modal || !options) {
    promotePawn("queen");
    return;
  }

  options.innerHTML = "";

  [
    "queen",
    "rook",
    "bishop",
    "knight"
  ].forEach(type => {
    const button = document.createElement("button");

    button.className =
      `promo-piece ${type} ${
        type === "queen" ? "selected" : ""
      }`;

    button.dataset.type = type;
    button.textContent = PIECES[color][type];

    button.addEventListener("click", () => {
      selectPromotion(type);
    });

    options.appendChild(button);
  });

  const title = id("promoTitle");

  if (title) {
    title.textContent =
      `${pretty(color)} Pawn Promotion`;
  }

  const confirm = id("promoConfirm");

  if (confirm) {
    confirm.disabled = false;
  }

  modal.classList.add("open");
}

function selectPromotion(type) {
  if (!promotionState) {
    return;
  }

  promotionState.selected = type;

  document.querySelectorAll(".promo-piece").forEach(
    button => {
      button.classList.toggle(
        "selected",
        button.dataset.type === type
      );
    }
  );
}

function confirmPromotion() {
  if (!promotionState) {
    return;
  }

  promotePawn(promotionState.selected);
}

function promotePawn(type) {
  if (!promotionState) {
    return;
  }

  const {
    row,
    column,
    color,
    moveRecord
  } = promotionState;

  setPiece(
    row,
    column,
    createPiece(color, type)
  );

  moveRecord.promotion = type;
  moveRecord.notation +=
    `=${type.charAt(0).toUpperCase()}`;

  promotionState = null;

  if (id("promoModal")) {
    id("promoModal").classList.remove("open");
  }

  render();
  finishTurn(moveRecord);
}

/* ==========================================================
   BOARD ROTATION
   ========================================================== */

function rotateBoard() {
  G.rotated = !G.rotated;

  buildBoard();
  render();
  applyRotation();

  if (
    typeof currentBoardRotation !== "undefined"
  ) {
    currentBoardRotation =
      G.rotated ? 180 : 0;
  }
}

function applyRotation() {
  const board = id("board");
  const highlightLayer = id("highlightLayer");
  const rotation = G.rotated ? 180 : 0;

  if (board) {
    board.style.transform =
      `rotate(${rotation}deg)`;
  }

  if (highlightLayer) {
    highlightLayer.style.transform =
      `rotate(${rotation}deg)`;
  }

  document.querySelectorAll(".piece").forEach(
    piece => {
      piece.style.transform =
        `rotate(${-rotation}deg)`;
    }
  );
}

/* ==========================================================
   AI
   ========================================================== */

function scheduleAIMove() {
  if (
    !G.aiMode ||
    G.phase !== "playing"
  ) {
    return;
  }

  G.aiThinking = true;
  setInstr("The AI is thinking...");

  setTimeout(() => {
    const move = findAIMove();

    if (!move) {
      G.aiThinking = false;
      // No legal AI move — resolve via checkGameEndStatus() so
      // stalemate (draw) and checkmate are still told apart here too.
      checkGameEndStatus();
      return;
    }

    G.aiThinking = false;

    performMove(
      move.from,
      move.to,
      move.moveData
    );
  }, getAIDelay());
}

function findAIMove() {
  const moves = [];

  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      const piece = getPiece(row, column);

      if (
        !piece ||
        piece.color !== G.aiPlayer
      ) {
        continue;
      }

      const legalMoves =
        getMovesForPiece(row, column);

      legalMoves.forEach(move => {
        const target = getPiece(
          move.row,
          move.column
        );

        moves.push({
          from: {
            row,
            column
          },

          to: {
            row: move.row,
            column: move.column
          },

          moveData: move,

          score: target
            ? PIECE_VALUES[target.type]
            : 0
        });
      });
    }
  }

  if (!moves.length) {
    return null;
  }

  moves.sort((a, b) =>
    b.score - a.score
  );

  const difficulty =
    Number(G.aiDifficulty) || 0;

  if (difficulty >= 3) {
    return moves[0];
  }

  if (difficulty >= 1) {
    const bestMoves = moves.slice(
      0,
      Math.max(
        1,
        Math.ceil(moves.length * 0.35)
      )
    );

    return bestMoves[
      Math.floor(
        Math.random() * bestMoves.length
      )
    ];
  }

  return moves[
    Math.floor(
      Math.random() * moves.length
    )
  ];
}

function getAIDelay() {
  return Math.max(
    350,
    1100 - Number(G.aiDifficulty || 0) * 100
  );
}

/* ==========================================================
   CHECKMATE / STALEMATE / CHECK
   ========================================================== */

/* Legacy fallback only — used if ChessLogic.getGameStatus isn't
   available for some reason. Cannot distinguish stalemate from
   checkmate (declares the CURRENT side's opponent the winner
   whenever there are no legal moves, regardless of whether the
   current side is actually in check), which is why
   checkGameEndStatus() below is the real entry point now. */
function checkForNoLegalMoves() {
  if (G.phase !== "playing") {
    return;
  }

  let legalMoveCount = 0;

  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      const piece = getPiece(row, column);

      if (
        piece &&
        piece.color === G.turn
      ) {
        legalMoveCount += getMovesForPiece(
          row,
          column
        ).length;
      }
    }
  }

  if (legalMoveCount === 0) {
    endGame(
      oppositeColor(G.turn),
      "checkmate"
    );
  }
}

/* The real win-condition check, run after every completed turn.
   Uses ChessLogic.getGameStatus() (logic.js) to correctly tell
   checkmate, stalemate, and "just in check" apart, and increments
   G.checks — previously nothing in this file ever touched
   G.checks, so the "Checks" panel stat was permanently stuck at 0
   no matter what happened in the game. Returns true if the game
   ended, so callers (finishTurn, scheduleAIMove) know not to
   continue as if play is still active. */
function checkGameEndStatus() {
  if (G.phase !== "playing") {
    return false;
  }

  if (
    typeof window.ChessLogic === "undefined" ||
    typeof ChessLogic.getGameStatus !== "function"
  ) {
    checkForNoLegalMoves();
    return G.phase === "over";
  }

  const status = ChessLogic.getGameStatus(
    G.board,
    G.turn
  );

  if (status.checkmate) {
    endGame(status.winner, "checkmate");
    return true;
  }

  if (status.stalemate) {
    endGame(null, "stalemate");
    return true;
  }

  if (status.inCheck) {
    G.checks++;
    updatePanel();
    logEvent(
      `${pretty(G.turn)} is in check!`,
      "err"
    );
  }

  return false;
}

/* Kept for backward compatibility with anything that might still
   call window.checkGameEnd() directly. */
window.checkGameEnd = checkGameEndStatus;

function endGame(winner, reason = "checkmate") {
  if (G.phase === "over") {
    return;
  }

  G.phase = "over";
  stopTurnTimer();

  const isDraw = winner === null || reason === "stalemate";

  const title = id("victTitle");

  if (title) {
    title.textContent = isDraw
      ? "Draw!"
      : `${pretty(winner)} Wins!`;
  }

  const stats = id("victStats");

  if (stats) {
    stats.innerHTML = `
      <div class="vs">
        <span class="vs-val">${G.turns}</span>
        <span class="vs-lbl">Turns</span>
      </div>

      <div class="vs">
        <span class="vs-val">${G.captures}</span>
        <span class="vs-lbl">Captures</span>
      </div>
    `;
  }

  if (id("victOv")) {
    id("victOv").classList.add("open");
  }

  logEvent(
    isDraw
      ? `Game drawn by ${reason}.`
      : `${pretty(winner)} wins by ${reason}.`,
    "win"
  );

  playSound("sfxWin");

  if (typeof doConfetti === "function") {
    doConfetti();
  }

  /* Report the finished game to the stats/profile system. This
     call previously didn't exist at all, so recordGameResult()
     (src/ui/interface.js) was dead code — no game, win or loss,
     ever reached it, regardless of the storage-key bug fixed there. */
  if (typeof window.recordGameResult === "function") {
    let result;

    if (isDraw) {
      result = "draw";
    } else if (G.mode === "ai") {
      result = winner === "white" ? "win" : "loss";
    } else if (
      G.mode === "online" &&
      typeof window.onlinePlayer === "function"
    ) {
      result = winner === window.onlinePlayer() ? "win" : "loss";
    } else {
      // Local pass-and-play has no single "you" on this shared
      // device, so a finished game always counts the same way —
      // consistent with how STEENE's other games treat local mode.
      result = "win";
    }

    window.recordGameResult({
      result,
      mode: G.mode,
      turns: G.turns,
      captures: G.captures,
      checks: G.checks
    });
  }
}

/* ==========================================================
   TIMER
   ========================================================== */

function refreshTurnTimer() {
  stopTurnTimer();

  const timerBox = id("timerBox");

  if (
    !G.timerEnabled ||
    G.phase !== "playing"
  ) {
    if (timerBox) {
      timerBox.style.display = "none";
    }

    return;
  }

  if (timerBox) {
    timerBox.style.display = "block";
  }

  G.timerRemaining = G.timerSeconds;
  updateTimerDisplay();

  G.timerInterval = setInterval(() => {
    G.timerRemaining--;
    updateTimerDisplay();

    if (G.timerRemaining <= 0) {
      stopTurnTimer();
      handleTimeExpired();
    }
  }, 1000);
}

function stopTurnTimer() {
  if (G.timerInterval) {
    clearInterval(G.timerInterval);
    G.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const display = id("timerDisplay");

  if (!display) {
    return;
  }

  const seconds = Math.max(
    0,
    G.timerRemaining
  );

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  display.textContent =
    `${minutes}:${remainder < 10 ? "0" : ""}${remainder}`;

  display.classList.toggle(
    "low",
    seconds <= 10
  );
}

function handleTimeExpired() {
  if (G.phase !== "playing") {
    return;
  }

  const loser = G.turn;
  const winner = oppositeColor(loser);

  logEvent(
    `⏱ ${pretty(loser)} ran out of time.`,
    "err"
  );

  endGame(winner, "timeout");
}

/* ==========================================================
   PANEL UPDATES
   ========================================================== */

function updateTurnIndicator() {
  const orb = id("turnOrb");
  const label = id("turnLbl");
  const wrapper = id("turnWrap");

  if (orb) {
    orb.className = `turn-orb ${G.turn}`;
  }

  if (label) {
    label.textContent =
      `${pretty(G.turn)}'s Turn`;
  }

  if (wrapper) {
    wrapper.classList.remove("pulse");
    void wrapper.offsetWidth;
    wrapper.classList.add("pulse");
  }
}

function updatePanel() {
  const turns = id("stTurns");
  const captures = id("stCaptures");
  const checks = id("stChecks");

  if (turns) {
    turns.textContent = G.turns;
  }

  if (captures) {
    captures.textContent = G.captures;
  }

  if (checks) {
    checks.textContent = G.checks;
  }

  updateMaterialStatus();
}

function updateMaterialStatus() {
  const element = id("pieceStatus");

  if (!element) {
    return;
  }

  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      const piece = getPiece(row, column);

      if (!piece) {
        continue;
      }

      if (piece.color === "white") {
        whiteMaterial += PIECE_VALUES[piece.type];
      } else {
        blackMaterial += PIECE_VALUES[piece.type];
      }
    }
  }

  const difference =
    whiteMaterial - blackMaterial;

  if (difference === 0) {
    element.textContent = "Even";
  } else if (difference > 0) {
    element.textContent =
      `White +${difference}`;
  } else {
    element.textContent =
      `Black +${Math.abs(difference)}`;
  }
}

function renderCapturedPieces() {
  const element = id("capturedInv");

  if (!element) {
    return;
  }

  const whiteCaptured = G.captured.white
    .map(piece =>
      `<span class="captured-piece white">
        ${PIECES.white[piece.type]}
      </span>`
    )
    .join("");

  const blackCaptured = G.captured.black
    .map(piece =>
      `<span class="captured-piece black">
        ${PIECES.black[piece.type]}
      </span>`
    )
    .join("");

  element.innerHTML = `
    <div class="captured-row">
      <span>White</span>
      <div>${whiteCaptured || "—"}</div>
    </div>

    <div class="captured-row">
      <span>Black</span>
      <div>${blackCaptured || "—"}</div>
    </div>
  `;
}

/* ==========================================================
   EVENT LOG
   ========================================================== */

function logMove(move) {
  const moveText =
    move.color === "white"
      ? `${Math.ceil(move.number / 2)}. ${move.notation}`
      : `${Math.ceil(move.number / 2)}... ${move.notation}`;

  logEvent(moveText, "");
}

function logEvent(message, type = "") {
  const log = id("evLog");

  if (!log) {
    return;
  }

  const event = document.createElement("div");

  event.className = `ev ${type}`;
  event.textContent = message;

  log.prepend(event);

  while (log.children.length > 30) {
    log.lastElementChild.remove();
  }
}

function clearEventLog() {
  const log = id("evLog");

  if (log) {
    log.innerHTML = "";
  }
}

function setInstr(message) {
  const element = id("instr");

  if (element) {
    element.textContent = message;
  }
}

/* ==========================================================
   THEMES
   ========================================================== */

function applyBoardTheme(theme) {
  document.body.classList.remove(
    "theme-dark",
    "theme-wood",
    "theme-gold",
    "theme-marble",
    "theme-neon",
    "theme-scrabble"
  );

  document.body.classList.add(
    `theme-${theme}`
  );
}

/* ==========================================================
   RESET
   ========================================================== */

function resetBoardGame() {
  const config = {
    mode: G.mode,
    aiMode: G.aiMode,
    aiDifficulty: G.aiDifficulty,
    boardTheme: G.boardTheme,
    pieceMode: G.pieceMode,
    timerEnabled: G.timerEnabled,
    timerSeconds: G.timerSeconds
  };

  newGame(config);
  buildBoard();
  render();
  updateTurnIndicator();
  refreshTurnTimer();

  if (id("victOv")) {
    id("victOv").classList.remove("open");
  }

  setInstr(
    "Select a white piece, then choose a highlighted square."
  );
}

/* ==========================================================
   POST-GAME REPLAY SCRUBBER
   ==========================================================
   Reconstructs each position directly from G.moveLog (from/to/
   captured/promotion/castle/enPassant, all already recorded by
   performMove()) rather than re-deriving legality, so it works
   for any finished game regardless of mode. Only available right
   on the victory screen ("View Replay"), since G gets replaced
   the moment you start or reset a game.
   ========================================================== */

function startReplay() {
  if (!G.moveLog || !G.moveLog.length) {
    return;
  }

  replay = {
    active: true,
    moves: JSON.parse(JSON.stringify(G.moveLog)),
    index: 0
  };

  if (id("victOv")) {
    id("victOv").classList.remove("open");
  }

  if (typeof goTo === "function") {
    goTo("game");
  }

  setTimeout(() => {
    buildBoard();

    const timerBox = id("timerBox");
    if (timerBox) timerBox.style.display = "none";

    const rc = id("replayControls");
    if (rc) rc.style.display = "block";

    setInstr(
      "Replay mode — use the controls below to step through the match."
    );

    renderReplayFrame();
  }, 60);
}

function exitReplay() {
  replay.active = false;

  const rc = id("replayControls");
  if (rc) rc.style.display = "none";

  if (typeof goTo === "function") {
    goTo("play");
  }
}

/* Replays moves 0..idx-1 from the starting position forward,
   applying castling/en passant/promotion exactly as performMove()
   did originally, and collecting captured pieces along the way. */
function computeReplayStateAt(idx) {
  const board = createInitialBoard();
  const captured = { white: [], black: [] };

  for (let i = 0; i < idx; i++) {
    const move = replay.moves[i];
    const piece = board[move.from.row][move.from.column];

    if (!piece) {
      continue;
    }

    if (move.castle) {
      const row = move.from.row;

      if (move.to.column > move.from.column) {
        const rook = board[row][7];
        if (rook) {
          board[row][5] = { ...rook, hasMoved: true };
          board[row][7] = null;
        }
      } else {
        const rook = board[row][0];
        if (rook) {
          board[row][3] = { ...rook, hasMoved: true };
          board[row][0] = null;
        }
      }
    }

    if (move.enPassant) {
      const capturedPawnRow =
        piece.color === "white"
          ? move.to.row + 1
          : move.to.row - 1;

      const capturedPawn =
        board[capturedPawnRow][move.to.column];

      if (capturedPawn) {
        captured[capturedPawn.color].push(capturedPawn);
        board[capturedPawnRow][move.to.column] = null;
      }
    } else if (move.captured) {
      captured[move.captured.color].push(move.captured);
    }

    let movedPiece = { ...piece, hasMoved: true };

    if (move.promotion) {
      movedPiece = {
        color: piece.color,
        type: move.promotion,
        hasMoved: true
      };
    }

    board[move.to.row][move.to.column] = movedPiece;
    board[move.from.row][move.from.column] = null;
  }

  return { board, captured };
}

function renderReplayFrame() {
  const state = computeReplayStateAt(replay.index);

  document.querySelectorAll(".cell .piece").forEach(p => p.remove());

  for (let row = 0; row < 8; row++) {
    for (let column = 0; column < 8; column++) {
      const piece = state.board[row][column];
      if (!piece) continue;

      const cell = cellEl(row, column);
      if (!cell) continue;

      const el = document.createElement("div");
      el.className =
        `piece chess-piece ${piece.color} piece-${piece.type}`;
      el.textContent = PIECES[piece.color][piece.type];
      cell.appendChild(el);
    }
  }

  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove("last-move");
  });

  if (replay.index > 0) {
    const move = replay.moves[replay.index - 1];
    const fromCell = cellEl(move.from.row, move.from.column);
    const toCell = cellEl(move.to.row, move.to.column);
    if (fromCell) fromCell.classList.add("last-move");
    if (toCell) toCell.classList.add("last-move");
  }

  const capturedEl = id("capturedInv");
  if (capturedEl) {
    const whiteCaptured = state.captured.white
      .map(p => `<span class="captured-piece white">${PIECES.white[p.type]}</span>`)
      .join("");
    const blackCaptured = state.captured.black
      .map(p => `<span class="captured-piece black">${PIECES.black[p.type]}</span>`)
      .join("");

    capturedEl.innerHTML = `
      <div class="captured-row">
        <span>White</span>
        <div>${whiteCaptured || "—"}</div>
      </div>
      <div class="captured-row">
        <span>Black</span>
        <div>${blackCaptured || "—"}</div>
      </div>
    `;
  }

  const total = replay.moves.length;

  const counter = id("replayCounter");
  if (counter) counter.textContent = `Move ${replay.index} / ${total}`;

  const scrub = id("replayScrubber");
  if (scrub) {
    scrub.max = total;
    scrub.value = replay.index;
  }

  const lastEl = id("replayLastMove");
  if (lastEl) {
    if (replay.index === 0) {
      lastEl.textContent = "Starting position";
    } else {
      const move = replay.moves[replay.index - 1];
      lastEl.textContent =
        move.color === "white"
          ? `${Math.ceil(move.number / 2)}. ${move.notation}`
          : `${Math.ceil(move.number / 2)}... ${move.notation}`;
    }
  }
}

function replayStep(delta) {
  replay.index = Math.max(
    0,
    Math.min(replay.moves.length, replay.index + delta)
  );
  renderReplayFrame();
}

function replayScrub(value) {
  replay.index = Math.max(
    0,
    Math.min(replay.moves.length, parseInt(value, 10) || 0)
  );
  renderReplayFrame();
}

/* ==========================================================
   GLOBAL EXPORTS
   ========================================================== */

window.G = G;

window.newGame = newGame;
window.startLocalGame = startLocalGame;
window.startAiGame = startAiGame;

window.createInitialBoard = createInitialBoard;
window.buildBoard = buildBoard;
window.render = render;

window.onPieceClick = onPieceClick;
window.onCellClick = onCellClick;
window.performMove = performMove;

window.rotateBoard = rotateBoard;
window.applyRotation = applyRotation;

window.refreshTurnTimer = refreshTurnTimer;
window.stopTurnTimer = stopTurnTimer;

window.openPromotionModal = openPromotionModal;
window.selectPromotion = selectPromotion;
window.confirmPromotion = confirmPromotion;
window.promotePawn = promotePawn;

window.updateTurnIndicator = updateTurnIndicator;
window.updatePanel = updatePanel;
window.checkForNoLegalMoves = checkForNoLegalMoves;
window.checkGameEndStatus = checkGameEndStatus;
window.endGame = endGame;

window.resetBoardGame = resetBoardGame;

window.startReplay = startReplay;
window.exitReplay = exitReplay;
window.replayStep = replayStep;
window.replayScrub = replayScrub;
