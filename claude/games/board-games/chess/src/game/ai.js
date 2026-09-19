/* ==========================================================
   STEENE CHESS — src/game/ai.js
   Chess AI engine.

   Uses ChessLogic from logic.js.
   Designed to work with board.js and interface.js.

   Features:
   - Legal move generation through ChessLogic
   - Material + positional evaluation
   - Minimax search with alpha-beta pruning
   - Difficulty levels
   - Randomized move selection among equally good moves
   - Checkmate / draw awareness
   ========================================================== */

(function () {
  "use strict";

  const Logic = window.ChessLogic;

  if (!Logic) {
    console.error(
      "STEENE CHESS: ai.js requires logic.js to be loaded first."
    );
    return;
  }

  /* ----------------------------------------------------------
     Configuration
     ---------------------------------------------------------- */

  const AI_LEVELS = {
    easy: {
      depth: 1,
      randomness: 0.45,
      thinkDelay: 350
    },

    medium: {
      depth: 2,
      randomness: 0.18,
      thinkDelay: 550
    },

    hard: {
      depth: 3,
      randomness: 0.06,
      thinkDelay: 750
    },

    expert: {
      depth: 4,
      randomness: 0.02,
      thinkDelay: 950
    }
  };

  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  /*
    Piece-square tables.

    The values are intentionally moderate because material
    remains more important than positional bonuses.
  */

  const PST = {
    p: [
       0,   0,   0,   0,   0,   0,   0,   0,
      50,  50,  50,  50,  50,  50,  50,  50,
      10,  10,  20,  30,  30,  20,  10,  10,
       5,   5,  10,  25,  25,  10,   5,   5,
       0,   0,   0,  20,  20,   0,   0,   0,
       5,  -5, -10,   0,   0, -10,  -5,   5,
       5,  10,  10, -20, -20,  10,  10,   5,
       0,   0,   0,   0,   0,   0,   0,   0
    ],

    n: [
      -50, -40, -30, -30, -30, -30, -40, -50,
      -40, -20,   0,   0,   0,   0, -20, -40,
      -30,   0,  10,  15,  15,  10,   0, -30,
      -30,   5,  15,  20,  20,  15,   5, -30,
      -30,   0,  15,  20,  20,  15,   0, -30,
      -30,   5,  10,  15,  15,  10,   5, -30,
      -40, -20,   0,   5,   5,   0, -20, -40,
      -50, -40, -30, -30, -30, -30, -40, -50
    ],

    b: [
      -20, -10, -10, -10, -10, -10, -10, -20,
      -10,   0,   0,   0,   0,   0,   0, -10,
      -10,   0,   5,  10,  10,   5,   0, -10,
      -10,   5,   5,  10,  10,   5,   5, -10,
      -10,   0,  10,  10,  10,  10,   0, -10,
      -10,  10,  10,  10,  10,  10,  10, -10,
      -10,   5,   0,   0,   0,   0,   5, -10,
      -20, -10, -10, -10, -10, -10, -10, -20
    ],

    r: [
       0,   0,   0,   5,   5,   0,   0,   0,
      -5,   0,   0,   0,   0,   0,   0,  -5,
      -5,   0,   0,   0,   0,   0,   0,  -5,
      -5,   0,   0,   0,   0,   0,   0,  -5,
      -5,   0,   0,   0,   0,   0,   0,  -5,
      -5,   0,   0,   0,   0,   0,   0,  -5,
       5,  10,  10,  10,  10,  10,  10,   5,
       0,   0,   0,   0,   0,   0,   0,   0
    ],

    q: [
      -20, -10, -10,  -5,  -5, -10, -10, -20,
      -10,   0,   0,   0,   0,   0,   0, -10,
      -10,   0,   5,   5,   5,   5,   0, -10,
       -5,   0,   5,   5,   5,   5,   0,  -5,
        0,   0,   5,   5,   5,   5,   0,  -5,
      -10,   5,   5,   5,   5,   5,   0, -10,
      -10,   0,   5,   0,   0,   0,   0, -10,
      -20, -10, -10,  -5,  -5, -10, -10, -20
    ],

    k: [
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20,
      -10, -20, -20, -20, -20, -20, -20, -10,
       20,  20,   0,   0,   0,   0,  20,  20,
       20,  30,  10,   0,   0,  10,  30,  20
    ]
  };

  /* ----------------------------------------------------------
     AI state
     ---------------------------------------------------------- */

  let aiState = {
    difficulty: "medium",
    thinking: false,
    cancelled: false,
    lastMove: null,
    nodes: 0
  };

  /* ----------------------------------------------------------
     Utility helpers
     ---------------------------------------------------------- */

  function normalizeDifficulty(level) {
    const value =
      String(level || "medium").toLowerCase();

    return AI_LEVELS[value]
      ? value
      : "medium";
  }

  function getLevelConfig(level) {
    return AI_LEVELS[
      normalizeDifficulty(level)
    ];
  }

  function cloneBoard(board) {
    return Logic.cloneBoard(board);
  }

  function moveKey(move) {
    return [
      move?.from?.row,
      move?.from?.col ?? move?.from?.column,
      move?.to?.row,
      move?.to?.col ?? move?.to?.column,
      move?.promotion || ""
    ].join(":");
  }

  function centerBonus(row, col) {
    const distance =
      Math.abs(3.5 - row) +
      Math.abs(3.5 - col);

    return Math.max(
      0,
      Math.round(14 - distance * 4)
    );
  }

  /* ----------------------------------------------------------
     Evaluation
     ---------------------------------------------------------- */

  function pieceSquareValue(
    piece,
    row,
    col
  ) {
    const table =
      PST[piece.type];

    if (!table) {
      return 0;
    }

    /*
      Tables are written from White's point of view.
      Flip the row for Black.
    */

    const index =
      piece.color === Logic.COLORS.WHITE
        ? row * 8 + col
        : (7 - row) * 8 + col;

    return table[index] || 0;
  }

  function evaluateMaterial(board) {
    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece =
          Logic.getPiece(board, {
            row,
            col
          });

        if (!piece) {
          continue;
        }

        const value =
          PIECE_VALUES[piece.type] || 0;

        const positional =
          pieceSquareValue(
            piece,
            row,
            col
          );

        const center =
          piece.type === "p" ||
          piece.type === "n" ||
          piece.type === "b"
            ? centerBonus(row, col)
            : 0;

        const total =
          value +
          positional +
          center;

        score +=
          piece.color === Logic.COLORS.WHITE
            ? total
            : -total;
      }
    }

    return score;
  }

  function evaluateKingSafety(
    board,
    color
  ) {
    const king =
      Logic.findKing(
        board,
        color
      );

    if (!king) {
      return -100000;
    }

    let score = 0;

    if (
      Logic.isKingInCheck(
        board,
        color
      )
    ) {
      score -= 70;
    }

    /*
      Reward king safety in the early game.
    */

    if (
      king.row === 7 ||
      king.row === 0
    ) {
      score += 8;
    }

    return score;
  }

  function evaluateMobility(
    board,
    color
  ) {
    const moves =
      Logic.getAllLegalMoves(
        board,
        color
      );

    return moves.length * 2;
  }

  function evaluatePosition(
    board
  ) {
    let score =
      evaluateMaterial(board);

    score +=
      evaluateKingSafety(
        board,
        Logic.COLORS.WHITE
      );

    score -=
      evaluateKingSafety(
        board,
        Logic.COLORS.BLACK
      );

    score +=
      evaluateMobility(
        board,
        Logic.COLORS.WHITE
      );

    score -=
      evaluateMobility(
        board,
        Logic.COLORS.BLACK
      );

    return score;
  }

  function evaluateForColor(
    board,
    color
  ) {
    const score =
      evaluatePosition(board);

    return color === Logic.COLORS.WHITE
      ? score
      : -score;
  }

  /* ----------------------------------------------------------
     Move ordering
     ---------------------------------------------------------- */

  function moveScore(
    board,
    move
  ) {
    let score = 0;

    const target =
      Logic.getPiece(
        board,
        move.to
      );

    const moving =
      Logic.getPiece(
        board,
        move.from
      );

    if (target) {
      const capturedValue =
        PIECE_VALUES[
          target.type
        ] || 0;

      const movingValue =
        PIECE_VALUES[
          moving?.type
        ] || 0;

      score +=
        1000 +
        capturedValue -
        Math.floor(
          movingValue / 10
        );
    }

    if (move.enPassant) {
      score += 900;
    }

    if (move.castle) {
      score += 60;
    }

    if (move.promotion) {
      score +=
        PIECE_VALUES[
          Logic.normalizePieceType(
            move.promotion
          )
        ] || 0;
    }

    const to =
      Logic.normalizeSquare(
        move.to
      );

    if (to) {
      score +=
        centerBonus(
          to.row,
          to.col
        );
    }

    return score;
  }

  function orderMoves(
    board,
    moves
  ) {
    return moves
      .map((move) => ({
        move,
        score:
          moveScore(
            board,
            move
          )
      }))
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .map(
        (item) => item.move
      );
  }

  /* ----------------------------------------------------------
     Minimax
     ---------------------------------------------------------- */

  function minimax(
    board,
    depth,
    alpha,
    beta,
    maximizingColor
  ) {
    aiState.nodes++;

    const currentColor =
      depth % 2 === 0
        ? maximizingColor
        : Logic.oppositeColor(
            maximizingColor
          );

    const status =
      Logic.getGameStatus(
        board,
        currentColor
      );

    if (
      status.checkmate
    ) {
      return {
        score:
          currentColor ===
          maximizingColor
            ? -100000 -
              depth
            : 100000 +
              depth,
        move: null
      };
    }

    if (
      status.stalemate ||
      depth === 0
    ) {
      return {
        score:
          evaluateForColor(
            board,
            maximizingColor
          ),
        move: null
      };
    }

    let moves =
      status.legalMoves;

    moves =
      orderMoves(
        board,
        moves
      );

    let bestMove = null;

    if (
      currentColor ===
      maximizingColor
    ) {
      let bestScore =
        -Infinity;

      for (const move of moves) {
        if (aiState.cancelled) {
          break;
        }

        const next =
          Logic.applyMove(
            board,
            move
          );

        const result =
          minimax(
            next,
            depth - 1,
            alpha,
            beta,
            maximizingColor
          );

        if (
          result.score >
          bestScore
        ) {
          bestScore =
            result.score;

          bestMove =
            move;
        }

        alpha =
          Math.max(
            alpha,
            bestScore
          );

        if (
          beta <= alpha
        ) {
          break;
        }
      }

      return {
        score: bestScore,
        move: bestMove
      };
    }

    let bestScore =
      Infinity;

    for (const move of moves) {
      if (aiState.cancelled) {
        break;
      }

      const next =
        Logic.applyMove(
          board,
          move
        );

      const result =
        minimax(
          next,
          depth - 1,
          alpha,
          beta,
          maximizingColor
        );

      if (
        result.score <
        bestScore
      ) {
        bestScore =
          result.score;

        bestMove =
          move;
      }

      beta =
        Math.min(
          beta,
          bestScore
        );

      if (
        beta <= alpha
      ) {
        break;
      }
    }

    return {
      score: bestScore,
      move: bestMove
    };
  }

  /* ----------------------------------------------------------
     Root search
     ---------------------------------------------------------- */

  function searchBestMove(
    board,
    color,
    options = {}
  ) {
    const depth =
      Math.max(
        1,
        Number(
          options.depth ??
          getLevelConfig(
            aiState.difficulty
          ).depth
        )
      );

    const legalMoves =
      Logic.getAllLegalMoves(
        board,
        color,
        options
      );

    if (!legalMoves.length) {
      return {
        move: null,
        score: 0,
        nodes: aiState.nodes
      };
    }

    const ordered =
      orderMoves(
        board,
        legalMoves
      );

    let bestScore =
      -Infinity;

    let bestMoves = [];

    aiState.nodes = 0;
    aiState.cancelled = false;

    for (const move of ordered) {
      if (aiState.cancelled) {
        break;
      }

      const next =
        Logic.applyMove(
          board,
          move
        );

      const result =
        minimax(
          next,
          depth - 1,
          -Infinity,
          Infinity,
          color
        );

      const score =
        result.score;

      if (
        score >
        bestScore
      ) {
        bestScore = score;
        bestMoves = [move];
      } else if (
        score === bestScore
      ) {
        bestMoves.push(move);
      }
    }

    if (!bestMoves.length) {
      return {
        move: ordered[0] || null,
        score: bestScore,
        nodes: aiState.nodes
      };
    }

    /*
      Difficulty-based randomness prevents the AI
      from playing exactly the same opening every time.
    */

    const config =
      getLevelConfig(
        aiState.difficulty
      );

    let selected =
      bestMoves[0];

    if (
      bestMoves.length > 1 &&
      Math.random() <
        config.randomness
    ) {
      selected =
        bestMoves[
          Math.floor(
            Math.random() *
              bestMoves.length
          )
        ];
    }

    return {
      move: selected,
      score: bestScore,
      nodes: aiState.nodes
    };
  }

  /* ----------------------------------------------------------
     Public difficulty API
     ---------------------------------------------------------- */

  function setDifficulty(level) {
    const normalized =
      normalizeDifficulty(level);

    aiState.difficulty =
      normalized;

    try {
      localStorage.setItem(
        "steene_ai_difficulty",
        normalized
      );
    } catch (error) {
      console.warn(
        "STEENE: Could not save AI difficulty.",
        error
      );
    }

    return normalized;
  }

  function getDifficulty() {
    return aiState.difficulty;
  }

  function loadDifficulty() {
    try {
      const saved =
        localStorage.getItem(
          "steene_ai_difficulty"
        );

      if (saved) {
        aiState.difficulty =
          normalizeDifficulty(
            saved
          );
      }
    } catch (error) {
      console.warn(
        "STEENE: Could not load AI difficulty.",
        error
      );
    }
  }

  /* ----------------------------------------------------------
     Synchronous move selection
     ---------------------------------------------------------- */

  function getBestMove(
    board,
    color,
    options = {}
  ) {
    if (!Array.isArray(board)) {
      return null;
    }

    const wanted =
      Logic.normalizeColor(
        color
      );

    if (
      wanted !==
        Logic.COLORS.WHITE &&
      wanted !==
        Logic.COLORS.BLACK
    ) {
      return null;
    }

    aiState.cancelled = false;

    const result =
      searchBestMove(
        cloneBoard(board),
        wanted,
        options
      );

    aiState.lastMove =
      result.move;

    return result.move;
  }

  /* ----------------------------------------------------------
     Async AI move

     Useful for making the AI feel natural in the UI.
     callback(move, result)
     ---------------------------------------------------------- */

  function think(
    board,
    color,
    callback,
    options = {}
  ) {
    if (
      typeof callback !==
      "function"
    ) {
      return Promise.reject(
        new Error(
          "AI callback must be a function."
        )
      );
    }

    if (aiState.thinking) {
      return Promise.reject(
        new Error(
          "AI is already thinking."
        )
      );
    }

    aiState.thinking = true;
    aiState.cancelled = false;

    const config =
      getLevelConfig(
        options.difficulty ||
          aiState.difficulty
      );

    if (
      options.difficulty
    ) {
      setDifficulty(
        options.difficulty
      );
    }

    return new Promise(
      (resolve) => {
        window.setTimeout(
          () => {
            if (
              aiState.cancelled
            ) {
              aiState.thinking =
                false;

              callback(
                null,
                {
                  cancelled: true
                }
              );

              resolve(null);
              return;
            }

            let result;

            try {
              const move =
                getBestMove(
                  board,
                  color,
                  options
                );

              result = {
                move,
                cancelled: false,
                nodes:
                  aiState.nodes,
                difficulty:
                  aiState.difficulty
              };
            } catch (error) {
              console.error(
                "STEENE AI error:",
                error
              );

              result = {
                move: null,
                cancelled: false,
                error,
                nodes:
                  aiState.nodes
              };
            }

            aiState.thinking =
              false;

            callback(
              result.move,
              result
            );

            resolve(
              result.move
            );
          },
          Math.max(
            0,
            Number(
              options.thinkDelay ??
              config.thinkDelay
            )
          )
        );
      }
    );
  }

  function cancelThinking() {
    aiState.cancelled =
      true;
  }

  function isThinking() {
    return aiState.thinking;
  }

  /* ----------------------------------------------------------
     Tactical helpers
     ---------------------------------------------------------- */

  function findCaptures(
    board,
    color
  ) {
    return Logic
      .getAllLegalMoves(
        board,
        color
      )
      .filter(
        (move) =>
          move.capture ||
          move.enPassant
      );
  }

  function findChecks(
    board,
    color
  ) {
    const moves =
      Logic.getAllLegalMoves(
        board,
        color
      );

    return moves.filter(
      (move) => {
        const next =
          Logic.applyMove(
            board,
            move
          );

        return Logic.isKingInCheck(
          next,
          Logic.oppositeColor(
            color
          )
        );
      }
    );
  }

  function findCheckmates(
    board,
    color
  ) {
    return findChecks(
      board,
      color
    ).filter(
      (move) => {
        const next =
          Logic.applyMove(
            board,
            move
          );

        const opponent =
          Logic.oppositeColor(
            color
          );

        const status =
          Logic.getGameStatus(
            next,
            opponent
          );

        return status.checkmate;
      }
    );
  }

  /* ----------------------------------------------------------
     Quick move selector

     Useful for Easy difficulty or mobile devices.
     ---------------------------------------------------------- */

  function getEasyMove(
    board,
    color
  ) {
    const moves =
      Logic.getAllLegalMoves(
        board,
        color
      );

    if (!moves.length) {
      return null;
    }

    const checks =
      findChecks(
        board,
        color
      );

    if (checks.length) {
      return checks[
        Math.floor(
          Math.random() *
            checks.length
        )
      ];
    }

    const captures =
      findCaptures(
        board,
        color
      );

    if (captures.length) {
      return captures[
        Math.floor(
          Math.random() *
            captures.length
        )
      ];
    }

    return moves[
      Math.floor(
        Math.random() *
          moves.length
      )
    ];
  }

  /* ----------------------------------------------------------
     Best move wrapper
     ---------------------------------------------------------- */

  function chooseMove(
    board,
    color,
    options = {}
  ) {
    const difficulty =
      normalizeDifficulty(
        options.difficulty ||
          aiState.difficulty
      );

    if (
      difficulty === "easy" &&
      options.forceSearch !== true
    ) {
      return getEasyMove(
        board,
        color
      );
    }

    return getBestMove(
      board,
      color,
      {
        ...options,
        difficulty
      }
    );
  }

  /* ----------------------------------------------------------
     AI information
     ---------------------------------------------------------- */

  function getState() {
    return {
      ...aiState
    };
  }

  function getLevels() {
    return JSON.parse(
      JSON.stringify(
        AI_LEVELS
      )
    );
  }

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */

  window.ChessAI = {
    PIECE_VALUES,
    AI_LEVELS,

    setDifficulty,
    getDifficulty,
    getLevels,

    evaluatePosition,
    evaluateForColor,

    searchBestMove,
    getBestMove,
    chooseMove,

    think,
    cancelThinking,
    isThinking,

    findCaptures,
    findChecks,
    findCheckmates,

    getEasyMove,
    getState
  };

  /*
    Compatibility aliases.
  */

  window.getAIMove =
    window.getAIMove ||
    function (
      board,
      color,
      options
    ) {
      return ChessAI.chooseMove(
        board,
        color,
        options
      );
    };

  window.setAIDifficulty =
    window.setAIDifficulty ||
    setDifficulty;

  window.cancelAI =
    window.cancelAI ||
    cancelThinking;

  loadDifficulty();

})();
