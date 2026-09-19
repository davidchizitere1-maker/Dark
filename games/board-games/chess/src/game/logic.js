/* ==========================================================
   STEENE — src/game/logic.js
   Core chess rules and legal move generation.

   ── KNOWN ISSUE (documented, not fixed this pass) ─────────
   This file contains TWO separate, independently-written rules
   engines concatenated back to back — a smaller one using
   {row, column} square objects (which ends with its own
   `window.ChessLogic = {...}` and `window.getLegalMoves = ...`
   assignment), immediately followed by a second, much larger and
   more complete one using {row, col} objects with FEN support,
   castling-rights tracking, and its own `window.ChessLogic = {...}`
   assignment that OVERWRITES the first.

   Net effect: `window.ChessLogic` ends up being the second engine,
   but `window.getLegalMoves` ends up being the FIRST engine's
   version, because the second engine's own export line is guarded
   with `window.getLegalMoves = window.getLegalMoves || getLegalMoves`
   and the first engine already set it unconditionally. board.js's
   getMovesForPiece() calls the bare `getLegalMoves(...)` (the first
   engine) for actual gameplay, while anything calling
   `ChessLogic.getGameStatus(...)` (board.js's checkGameEndStatus())
   uses the SECOND engine. This happens to work because
   normalizeSquare() in the second engine accepts both `.col` and
   `.column`, but it means en passant — implemented only in the
   second, inactive-for-movegen engine — never actually triggers
   during real play, and the file carries a lot of genuinely dead
   code.

   This is a real correctness/maintainability issue, but rewriting a
   chess rules engine is a substantial, independent piece of work,
   not something to fold silently into a directory-structure
   refactor. Flagging it here in the code itself (not just in
   conversation) so it isn't lost. Every line of actual logic below
   is unchanged from the live version — nothing here was rewritten.
   ========================================================== */

(function () {
  "use strict";

  const FILES = "abcdefgh";
  const BOARD_SIZE = 8;

  const PIECES = {
    PAWN: "p",
    KNIGHT: "n",
    BISHOP: "b",
    ROOK: "r",
    QUEEN: "q",
    KING: "k"
  };

  const COLORS = {
    WHITE: "white",
    BLACK: "black"
  };

  
  function oppositeColor(color) {
    return normalizeColor(color) === COLORS.WHITE
      ? COLORS.BLACK
      : COLORS.WHITE;
  }

  function normalizeColor(color) {
    if (
      color === "w" ||
      String(color).toLowerCase() === "white"
    ) {
      return COLORS.WHITE;
    }

    if (
      color === "b" ||
      String(color).toLowerCase() === "black"
    ) {
      return COLORS.BLACK;
    }

    return color;
  }

  function normalizePieceType(type) {
    if (!type) return null;

    const value =
      String(type).toLowerCase();

    const aliases = {
      pawn: "p",
      knight: "n",
      horse: "n",
      bishop: "b",
      rook: "r",
      castle: "r",
      queen: "q",
      king: "k"
    };

    return aliases[value] || value;
  }

  function normalizePiece(piece) {
    if (!piece) return null;

    if (typeof piece === "string") {
      const value = piece.trim();

      if (!value) return null;

      const first = value.charAt(0);

      let color;

      if (value === value.toUpperCase()) {
        color = COLORS.WHITE;
      } else {
        color = COLORS.BLACK;
      }

      return {
        type: normalizePieceType(first),
        color
      };
    }

    if (typeof piece !== "object") {
      return null;
    }

    return {
      ...piece,
      type: normalizePieceType(
        piece.type || piece.kind || piece.piece
      ),
      color: normalizeColor(piece.color)
    };
  }

  function isInside(row, col) {
    return (
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      row >= 0 &&
      row < BOARD_SIZE &&
      col >= 0 &&
      col < BOARD_SIZE
    );
  }

  function sameSquare(a, b) {
    return (
      !!a &&
      !!b &&
      Number(a.row) === Number(b.row) &&
      Number(a.col ?? a.column) ===
        Number(b.col ?? b.column)
    );
  }

  function normalizeSquare(square) {
    if (!square) return null;

    if (
      typeof square === "string"
    ) {
      const value =
        square.toLowerCase().trim();

      if (
        value.length === 2 &&
        FILES.includes(value[0]) &&
        /^[1-8]$/.test(value[1])
      ) {
        return {
          row: 8 - Number(value[1]),
          col: FILES.indexOf(value[0])
        };
      }

      return null;
    }

    const row =
      Number(square.row);

    const col =
      square.col !== undefined
        ? Number(square.col)
        : Number(square.column);

    if (!isInside(row, col)) {
      return null;
    }

    return { row, col };
  }

  function toSquareName(square) {
    const position =
      normalizeSquare(square);

    if (!position) return "";

    return (
      FILES[position.col] +
      String(8 - position.row)
    );
  }

  function getPiece(board, square) {
    const position =
      normalizeSquare(square);

    if (!position || !Array.isArray(board)) {
      return null;
    }

    return normalizePiece(
      board[position.row]?.[position.col]
    );
  }

  function cloneBoard(board) {
    if (!Array.isArray(board)) {
      return [];
    }

    return board.map((row) =>
      Array.isArray(row)
        ? row.map((piece) => {
            if (!piece) return null;

            if (typeof piece === "string") {
              return piece;
            }

            return {
              ...piece
            };
          })
        : []
    );
  }

  function cloneGameState(state) {
    if (!state) return null;

    return {
      ...state,
      board: cloneBoard(state.board),
      castling: state.castling
        ? JSON.parse(
            JSON.stringify(state.castling)
          )
        : state.castling,
      enPassant:
        state.enPassant
          ? { ...state.enPassant }
          : state.enPassant
    };
  }

  /* ==========================================================
   STEENE — src/game/logic.js

   Core chess rules and legal move generation.

   This file intentionally uses classic global scripts
   because STEENE's current architecture loads JavaScript
   through <script> tags rather than ES modules.
   ========================================================== */

(function () {
  "use strict";

  const FILES = "abcdefgh";

  function inside(row, column) {
    return (
      row >= 0 &&
      row < 8 &&
      column >= 0 &&
      column < 8
    );
  }

  function opposite(color) {
    return color === "white" ? "black" : "white";
  }

  function cloneBoard(board) {
    return board.map(row =>
      row.map(piece =>
        piece ? { ...piece } : null
      )
    );
  }

  function pieceAt(board, row, column) {
    if (!inside(row, column)) {
      return null;
    }

    return board[row][column];
  }

  function findKing(board, color) {
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const piece = board[row][column];

        if (
          piece &&
          piece.color === color &&
          piece.type === "king"
        ) {
          return { row, column };
        }
      }
    }

    return null;
  }

  

  function isSquareAttacked(board, row, column, byColor) {
    const pawnDirection =
      byColor === "white" ? -1 : 1;

    const pawnRow = row - pawnDirection;

    for (const dc of [-1, 1]) {
      const pawn = pieceAt(
        board,
        pawnRow,
        column + dc
      );

      if (
        pawn &&
        pawn.color === byColor &&
        pawn.type === "pawn"
      ) {
        return true;
      }
    }

    const knightOffsets = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1]
    ];

    for (const [dr, dc] of knightOffsets) {
      const piece = pieceAt(
        board,
        row + dr,
        column + dc
      );

      if (
        piece &&
        piece.color === byColor &&
        piece.type === "knight"
      ) {
        return true;
      }
    }

    const kingOffsets = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1]
    ];

    for (const [dr, dc] of kingOffsets) {
      const piece = pieceAt(
        board,
        row + dr,
        column + dc
      );

      if (
        piece &&
        piece.color === byColor &&
        piece.type === "king"
      ) {
        return true;
      }
    }

    const diagonalDirections = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1]
    ];

    for (const [dr, dc] of diagonalDirections) {
      let r = row + dr;
      let c = column + dc;

      while (inside(r, c)) {
        const piece = board[r][c];

        if (piece) {
          if (
            piece.color === byColor &&
            (
              piece.type === "bishop" ||
              piece.type === "queen"
            )
          ) {
            return true;
          }

          break;
        }

        r += dr;
        c += dc;
      }
    }

    const straightDirections = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1]
    ];

    for (const [dr, dc] of straightDirections) {
      let r = row + dr;
      let c = column + dc;

      while (inside(r, c)) {
        const piece = board[r][c];

        if (piece) {
          if (
            piece.color === byColor &&
            (
              piece.type === "rook" ||
              piece.type === "queen"
            )
          ) {
            return true;
          }

          break;
        }

        r += dr;
        c += dc;
      }
    }

    return false;
  }

  function isInCheck(board, color) {
    const king = findKing(board, color);

    if (!king) {
      return true;
    }

    return isSquareAttacked(
      board,
      king.row,
      king.column,
      opposite(color)
    );
  }

  
  function generatePseudoMoves(board, row, column) {
    const piece = pieceAt(board, row, column);

    if (!piece) {
      return [];
    }

    const moves = [];

    function addMove(r, c, extra = {}) {
      if (!inside(r, c)) {
        return;
      }

      const target = board[r][c];

      if (target && target.color === piece.color) {
        return;
      }

      if (
        target &&
        target.type === "king"
      ) {
        return;
      }

      moves.push({
        row: r,
        column: c,
        ...extra
      });
    }

    function slide(directions) {
      for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = column + dc;

        while (inside(r, c)) {
          const target = board[r][c];

          if (!target) {
            addMove(r, c);
          } else {
            if (target.color !== piece.color) {
              addMove(r, c);
            }

            break;
          }

          r += dr;
          c += dc;
        }
      }
    }

    if (piece.type === "pawn") {
      const direction =
        piece.color === "white" ? -1 : 1;

      const startRow =
        piece.color === "white" ? 6 : 1;

      const promotionRow =
        piece.color === "white" ? 0 : 7;

      const oneRow = row + direction;

      if (
        inside(oneRow, column) &&
        !board[oneRow][column]
      ) {
        addMove(
          oneRow,
          column,
          {
            promotion:
              oneRow === promotionRow
          }
        );

        const twoRow =
          row + direction * 2;

        if (
          row === startRow &&
          !board[twoRow][column]
        ) {
          addMove(twoRow, column);
        }
      }

      for (const dc of [-1, 1]) {
        const targetRow = row + direction;
        const targetColumn = column + dc;

        if (!inside(targetRow, targetColumn)) {
          continue;
        }

        const target =
          board[targetRow][targetColumn];

        if (
          target &&
          target.color !== piece.color &&
          target.type !== "king"
        ) {
          addMove(
            targetRow,
            targetColumn,
            {
              promotion:
                targetRow === promotionRow
            }
          );
        }
      }

      return moves;
    }

    if (piece.type === "knight") {
      const offsets = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1]
      ];

      offsets.forEach(([dr, dc]) => {
        addMove(row + dr, column + dc);
      });

      return moves;
    }

    if (piece.type === "bishop") {
      slide([
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      ]);

      return moves;
    }

    if (piece.type === "rook") {
      slide([
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ]);

      return moves;
    }

    if (piece.type === "queen") {
      slide([
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ]);

      return moves;
    }

    if (piece.type === "king") {
      const offsets = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1]
      ];

      offsets.forEach(([dr, dc]) => {
        addMove(row + dr, column + dc);
      });

      /* Castling */

      if (!piece.hasMoved && !isInCheck(board, piece.color)) {
        const homeRow =
          piece.color === "white" ? 7 : 0;

        if (row === homeRow && column === 4) {
          const rookKingSide = board[homeRow][7];

          if (
            rookKingSide &&
            rookKingSide.type === "rook" &&
            rookKingSide.color === piece.color &&
            !rookKingSide.hasMoved &&
            !board[homeRow][5] &&
            !board[homeRow][6] &&
            !isSquareAttacked(
              board,
              homeRow,
              5,
              opposite(piece.color)
            ) &&
            !isSquareAttacked(
              board,
              homeRow,
              6,
              opposite(piece.color)
            )
          ) {
            moves.push({
              row: homeRow,
              column: 6,
              castle: "kingside"
            });
          }

          const rookQueenSide = board[homeRow][0];

          if (
            rookQueenSide &&
            rookQueenSide.type === "rook" &&
            rookQueenSide.color === piece.color &&
            !rookQueenSide.hasMoved &&
            !board[homeRow][1] &&
            !board[homeRow][2] &&
            !board[homeRow][3] &&
            !isSquareAttacked(
              board,
              homeRow,
              3,
              opposite(piece.color)
            ) &&
            !isSquareAttacked(
              board,
              homeRow,
              2,
              opposite(piece.color)
            )
          ) {
            moves.push({
              row: homeRow,
              column: 2,
              castle: "queenside"
            });
          }
        }
      }

      return moves;
    }

    return moves;
  }

 

  function applyMove(
    board,
    from,
    move,
    promotionPiece = "queen"
  ) {
    const next = cloneBoard(board);

    const piece = next[from.row][from.column];

    if (!piece) {
      return next;
    }

    next[from.row][from.column] = null;

    const captured =
      next[move.row][move.column];

    next[move.row][move.column] = {
      ...piece,
      hasMoved: true
    };

    /* Castling */

    if (
      piece.type === "king" &&
      move.castle
    ) {
      const row = from.row;

      if (move.castle === "kingside") {
        const rook = next[row][7];

        next[row][7] = null;
        next[row][5] = rook
          ? { ...rook, hasMoved: true }
          : null;
      }

      if (move.castle === "queenside") {
        const rook = next[row][0];

        next[row][0] = null;
        next[row][3] = rook
          ? { ...rook, hasMoved: true }
          : null;
      }
    }

    /* Promotion */

    if (
      piece.type === "pawn" &&
      (
        move.row === 0 ||
        move.row === 7
      )
    ) {
      next[move.row][move.column] = {
        color: piece.color,
        type: promotionPiece,
        hasMoved: true
      };
    }

    return {
      board: next,
      captured
    };
  }

 

  function getLegalMoves(board, position, color) {
    const piece =
      pieceAt(
        board,
        position.row,
        position.column
      );

    if (
      !piece ||
      piece.color !== color
    ) {
      return [];
    }

    const pseudo =
      generatePseudoMoves(
        board,
        position.row,
        position.column
      );

    return pseudo.filter(move => {
      const result = applyMove(
        board,
        position,
        move
      );

      return !isInCheck(
        result.board,
        color
      );
    });
  }

  function getAllLegalMoves(board, color) {
    const all = [];

    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const piece = board[row][column];

        if (
          piece &&
          piece.color === color
        ) {
          const moves =
            getLegalMoves(
              board,
              { row, column },
              color
            );

          moves.forEach(move => {
            all.push({
              from: { row, column },
              to: {
                row: move.row,
                column: move.column
              },
              ...move
            });
          });
        }
      }
    }

    return all;
  }

  function isCheckmate(board, color) {
    return (
      isInCheck(board, color) &&
      getAllLegalMoves(board, color).length === 0
    );
  }

  function isStalemate(board, color) {
    return (
      !isInCheck(board, color) &&
      getAllLegalMoves(board, color).length === 0
    );
  }

  function getGameStatus(board, color) {
    if (isCheckmate(board, color)) {
      return "checkmate";
    }

    if (isStalemate(board, color)) {
      return "stalemate";
    }

    if (isInCheck(board, color)) {
      return "check";
    }

    return "playing";
  }


  window.ChessLogic = {
    getLegalMoves,
    getAllLegalMoves,
    isInCheck,
    isCheckmate,
    isStalemate,
    getGameStatus,
    applyMove,
    cloneBoard,
    oppositeColor: opposite
  };

  

  window.getLegalMoves = getLegalMoves;

})();

  

  function makeMoveObject(
    from,
    to,
    piece,
    extra = {}
  ) {
    const fromSquare =
      normalizeSquare(from);

    const toSquare =
      normalizeSquare(to);

    return {
      from: {
        row: fromSquare.row,
        col: fromSquare.col,
        column: fromSquare.col
      },

      to: {
        row: toSquare.row,
        col: toSquare.col,
        column: toSquare.col
      },

      fromNotation:
        toSquareName(fromSquare),

      toNotation:
        toSquareName(toSquare),

      piece:
        normalizePiece(piece),

      ...extra
    };
  }

  function directionForPawn(color) {
    return normalizeColor(color) === COLORS.WHITE
      ? -1
      : 1;
  }

  function startingPawnRow(color) {
    return normalizeColor(color) === COLORS.WHITE
      ? 6
      : 1;
  }

  function promotionRow(color) {
    return normalizeColor(color) === COLORS.WHITE
      ? 0
      : 7;
  }

 

  function isSquareAttacked(
    board,
    square,
    byColor
  ) {
    const target =
      normalizeSquare(square);

    if (!target || !Array.isArray(board)) {
      return false;
    }

    const color =
      normalizeColor(byColor);

    /*
      Pawns.
    */

    const pawnRow =
      target.row -
      directionForPawn(color);

    for (const dc of [-1, 1]) {
      const col =
        target.col + dc;

      if (!isInside(pawnRow, col)) {
        continue;
      }

      const piece =
        getPiece(board, {
          row: pawnRow,
          col
        });

      if (
        piece &&
        piece.color === color &&
        piece.type === PIECES.PAWN
      ) {
        return true;
      }
    }

    /*
      Knights.
    */

    const knightOffsets = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1]
    ];

    for (const [dr, dc] of knightOffsets) {
      const row =
        target.row + dr;

      const col =
        target.col + dc;

      if (!isInside(row, col)) {
        continue;
      }

      const piece =
        getPiece(board, {
          row,
          col
        });

      if (
        piece &&
        piece.color === color &&
        piece.type === PIECES.KNIGHT
      ) {
        return true;
      }
    }


    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }

        const row =
          target.row + dr;

        const col =
          target.col + dc;

        if (!isInside(row, col)) {
          continue;
        }

        const piece =
          getPiece(board, {
            row,
            col
          });

        if (
          piece &&
          piece.color === color &&
          piece.type === PIECES.KING
        ) {
          return true;
        }
      }
    }


    const directions = [
      {
        pieces: [
          PIECES.ROOK,
          PIECES.QUEEN
        ],
        vectors: [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1]
        ]
      },

      {
        pieces: [
          PIECES.BISHOP,
          PIECES.QUEEN
        ],
        vectors: [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1]
        ]
      }
    ];

    for (const group of directions) {
      for (const [dr, dc] of group.vectors) {
        let row =
          target.row + dr;

        let col =
          target.col + dc;

        while (isInside(row, col)) {
          const piece =
            getPiece(board, {
              row,
              col
            });

          if (piece) {
            if (
              piece.color === color &&
              group.pieces.includes(
                piece.type
              )
            ) {
              return true;
            }

            break;
          }

          row += dr;
          col += dc;
        }
      }
    }

    return false;
  }


  function findKing(board, color) {
    const wanted =
      normalizeColor(color);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece =
          getPiece(board, {
            row,
            col
          });

        if (
          piece &&
          piece.color === wanted &&
          piece.type === PIECES.KING
        ) {
          return {
            row,
            col,
            column: col
          };
        }
      }
    }

    return null;
  }

  function isKingInCheck(board, color) {
    const king =
      findKing(board, color);


    if (!king) {
      return true;
    }

    return isSquareAttacked(
      board,
      king,
      oppositeColor(color)
    );
  }

  

  function generatePawnMoves(
    board,
    from,
    piece,
    options
  ) {
    const moves = [];

    const direction =
      directionForPawn(piece.color);

    const oneRow =
      from.row + direction;

    const twoRow =
      from.row +
      direction * 2;


    if (
      isInside(oneRow, from.col) &&
      !getPiece(board, {
        row: oneRow,
        col: from.col
      })
    ) {
      moves.push(
        makeMoveObject(
          from,
          {
            row: oneRow,
            col: from.col
          },
          piece
        )
      );

      
      if (
        from.row ===
          startingPawnRow(piece.color) &&
        !getPiece(board, {
          row: twoRow,
          col: from.col
        })
      ) {
        moves.push(
          makeMoveObject(
            from,
            {
              row: twoRow,
              col: from.col
            },
            piece,
            {
              doublePawnPush: true
            }
          )
        );
      }
    }

    for (const dc of [-1, 1]) {
      const row = oneRow;
      const col =
        from.col + dc;

      if (!isInside(row, col)) {
        continue;
      }

      const target =
        getPiece(board, {
          row,
          col
        });

      if (
        target &&
        target.color !== piece.color &&
        target.type !== PIECES.KING
      ) {
        moves.push(
          makeMoveObject(
            from,
            { row, col },
            piece,
            {
              capture: true
            }
          )
        );
      }
    }


    const enPassant =
      normalizeSquare(
        options?.enPassant
      );

    if (
      enPassant &&
      enPassant.row === oneRow &&
      Math.abs(
        enPassant.col - from.col
      ) === 1
    ) {
      moves.push(
        makeMoveObject(
          from,
          enPassant,
          piece,
          {
            capture: true,
            enPassant: true
          }
        )
      );
    }

    return moves;
  }

  function generateKnightMoves(
    board,
    from,
    piece
  ) {
    const moves = [];

    const offsets = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1]
    ];

    for (const [dr, dc] of offsets) {
      const row =
        from.row + dr;

      const col =
        from.col + dc;

      if (!isInside(row, col)) {
        continue;
      }

      const target =
        getPiece(board, {
          row,
          col
        });

      if (
        !target ||
        (
          target.color !==
            piece.color &&
          target.type !==
            PIECES.KING
        )
      ) {
        moves.push(
          makeMoveObject(
            from,
            { row, col },
            piece,
            {
              capture: !!target
            }
          )
        );
      }
    }

    return moves;
  }

  function generateSlidingMoves(
    board,
    from,
    piece,
    vectors
  ) {
    const moves = [];

    for (const [dr, dc] of vectors) {
      let row =
        from.row + dr;

      let col =
        from.col + dc;

      while (
        isInside(row, col)
      ) {
        const target =
          getPiece(board, {
            row,
            col
          });

        if (!target) {
          moves.push(
            makeMoveObject(
              from,
              { row, col },
              piece
            )
          );
        } else {
          if (
            target.color !==
              piece.color &&
            target.type !==
              PIECES.KING
          ) {
            moves.push(
              makeMoveObject(
                from,
                { row, col },
                piece,
                {
                  capture: true
                }
              )
            );
          }

          break;
        }

        row += dr;
        col += dc;
      }
    }

    return moves;
  }

  function generateKingMoves(
    board,
    from,
    piece,
    options
  ) {
    const moves = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (
          dr === 0 &&
          dc === 0
        ) {
          continue;
        }

        const row =
          from.row + dr;

        const col =
          from.col + dc;

        if (!isInside(row, col)) {
          continue;
        }

        const target =
          getPiece(board, {
            row,
            col
          });

        if (
          target &&
          (
            target.color ===
              piece.color ||
            target.type ===
              PIECES.KING
          )
        ) {
          continue;
        }

        /*
          A king cannot capture the opposing king.
          The resulting square must not be attacked.
        */

        const testBoard =
          cloneBoard(board);

        testBoard[from.row][from.col] =
          null;

        testBoard[row][col] =
          piece;

        if (
          !isSquareAttacked(
            testBoard,
            { row, col },
            oppositeColor(
              piece.color
            )
          )
        ) {
          moves.push(
            makeMoveObject(
              from,
              { row, col },
              piece,
              {
                capture: !!target
              }
            )
          );
        }
      }
    }

   

    if (
      !piece.hasMoved &&
      !isKingInCheck(
        board,
        piece.color
      )
    ) {
      const castlingMoves =
        generateCastlingMoves(
          board,
          from,
          piece,
          options
        );

      moves.push(
        ...castlingMoves
      );
    }

    return moves;
  }


  function generateCastlingMoves(
    board,
    kingFrom,
    king,
    options
  ) {
    const moves = [];

    const row =
      kingFrom.row;

    const color =
      king.color;

    

    const rights =
      options?.castling;

    function allowed(side) {
      if (!rights) {
        return true;
      }

      if (color === COLORS.WHITE) {
        return side === "king"
          ? rights.whiteKingSide !== false
          : rights.whiteQueenSide !== false;
      }

      return side === "king"
        ? rights.blackKingSide !== false
        : rights.blackQueenSide !== false;
    }



    if (
      allowed("king") &&
      canCastleKingSide(
        board,
        row,
        color
      )
    ) {
      moves.push(
        makeMoveObject(
          kingFrom,
          {
            row,
            col: 6
          },
          king,
          {
            castle: "king"
          }
        )
      );
    }


    if (
      allowed("queen") &&
      canCastleQueenSide(
        board,
        row,
        color
      )
    ) {
      moves.push(
        makeMoveObject(
          kingFrom,
          {
            row,
            col: 2
          },
          king,
          {
            castle: "queen"
          }
        )
      );
    }

    return moves;
  }

  function canCastleKingSide(
    board,
    row,
    color
  ) {
    const king =
      getPiece(board, {
        row,
        col: 4
      });

    const rook =
      getPiece(board, {
        row,
        col: 7
      });

    if (
      !king ||
      !rook ||
      king.type !== PIECES.KING ||
      rook.type !== PIECES.ROOK ||
      king.color !== color ||
      rook.color !== color ||
      king.hasMoved ||
      rook.hasMoved
    ) {
      return false;
    }

    if (
      getPiece(board, {
        row,
        col: 5
      }) ||
      getPiece(board, {
        row,
        col: 6
      })
    ) {
      return false;
    }

    const enemy =
      oppositeColor(color);

    if (
      isSquareAttacked(
        board,
        { row, col: 4 },
        enemy
      ) ||
      isSquareAttacked(
        board,
        { row, col: 5 },
        enemy
      ) ||
      isSquareAttacked(
        board,
        { row, col: 6 },
        enemy
      )
    ) {
      return false;
    }

    return true;
  }

  function canCastleQueenSide(
    board,
    row,
    color
  ) {
    const king =
      getPiece(board, {
        row,
        col: 4
      });

    const rook =
      getPiece(board, {
        row,
        col: 0
      });

    if (
      !king ||
      !rook ||
      king.type !== PIECES.KING ||
      rook.type !== PIECES.ROOK ||
      king.color !== color ||
      rook.color !== color ||
      king.hasMoved ||
      rook.hasMoved
    ) {
      return false;
    }

    if (
      getPiece(board, {
        row,
        col: 1
      }) ||
      getPiece(board, {
        row,
        col: 2
      }) ||
      getPiece(board, {
        row,
        col: 3
      })
    ) {
      return false;
    }

    const enemy =
      oppositeColor(color);

    if (
      isSquareAttacked(
        board,
        { row, col: 4 },
        enemy
      ) ||
      isSquareAttacked(
        board,
        { row, col: 3 },
        enemy
      ) ||
      isSquareAttacked(
        board,
        { row, col: 2 },
        enemy
      )
    ) {
      return false;
    }

    return true;
  }

 

  function getPseudoLegalMoves(
    board,
    from,
    options = {}
  ) {
    const position =
      normalizeSquare(from);

    if (
      !position ||
      !Array.isArray(board)
    ) {
      return [];
    }

    const piece =
      getPiece(board, position);

    if (!piece) {
      return [];
    }

    switch (piece.type) {
      case PIECES.PAWN:
        return generatePawnMoves(
          board,
          position,
          piece,
          options
        );

      case PIECES.KNIGHT:
        return generateKnightMoves(
          board,
          position,
          piece
        );

      case PIECES.BISHOP:
        return generateSlidingMoves(
          board,
          position,
          piece,
          [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1]
          ]
        );

      case PIECES.ROOK:
        return generateSlidingMoves(
          board,
          position,
          piece,
          [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
          ]
        );

      case PIECES.QUEEN:
        return generateSlidingMoves(
          board,
          position,
          piece,
          [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
          ]
        );

      case PIECES.KING:
        return generateKingMoves(
          board,
          position,
          piece,
          options
        );

      default:
        return [];
    }
  }

  

  function applyMove(
    board,
    move
  ) {
    const next =
      cloneBoard(board);

    const from =
      normalizeSquare(move.from);

    const to =
      normalizeSquare(move.to);

    if (!from || !to) {
      return next;
    }

    const original =
      getPiece(next, from);

    if (!original) {
      return next;
    }

    

    next[from.row][from.col] =
      null;

    next[to.row][to.col] = {
      ...original,
      hasMoved: true
    };

    

    if (move.enPassant) {
      const capturedRow =
        to.row -
        directionForPawn(
          original.color
        );

      if (
        isInside(
          capturedRow,
          to.col
        )
      ) {
        next[capturedRow][to.col] =
          null;
      }
    }

    

    if (move.castle) {
      const rookFromCol =
        move.castle === "king"
          ? 7
          : 0;

      const rookToCol =
        move.castle === "king"
          ? 5
          : 3;

      const rook =
        getPiece(next, {
          row: from.row,
          col: rookFromCol
        });

      if (
        rook &&
        rook.type === PIECES.ROOK
      ) {
        next[from.row][rookFromCol] =
          null;

        next[from.row][rookToCol] = {
          ...rook,
          hasMoved: true
        };
      }
    }

    

    const movedPiece =
      getPiece(next, to);

    if (
      movedPiece &&
      movedPiece.type === PIECES.PAWN &&
      to.row ===
        promotionRow(
          movedPiece.color
        )
    ) {
      const promotion =
        normalizePieceType(
          move.promotion ||
            move.promoteTo ||
            "q"
        );

      const allowed = [
        PIECES.QUEEN,
        PIECES.ROOK,
        PIECES.BISHOP,
        PIECES.KNIGHT
      ];

      next[to.row][to.col] = {
        ...movedPiece,
        type: allowed.includes(
          promotion
        )
          ? promotion
          : PIECES.QUEEN,
        hasMoved: true
      };
    }

    return next;
  }

  

  function isMoveLegal(
    board,
    move,
    options = {}
  ) {
    const from =
      normalizeSquare(move?.from);

    const to =
      normalizeSquare(move?.to);

    if (!from || !to) {
      return false;
    }

    const piece =
      getPiece(board, from);

    if (!piece) {
      return false;
    }

    const requestedColor =
      normalizeColor(
        options.color ||
          piece.color
      );

    if (
      piece.color !==
      requestedColor
    ) {
      return false;
    }

    const pseudo =
      getPseudoLegalMoves(
        board,
        from,
        options
      );

    const candidate =
      pseudo.find(
        (item) =>
          sameSquare(
            item.to,
            to
          )
      );

    if (!candidate) {
      return false;
    }


    const next =
      applyMove(
        board,
        {
          ...candidate,
          ...move
        }
      );

    return !isKingInCheck(
      next,
      piece.color
    );
  }

  function getLegalMoves(
    board,
    from,
    color,
    options = {}
  ) {
    const position =
      normalizeSquare(from);

    if (!position) {
      return [];
    }

    const piece =
      getPiece(board, position);

    if (!piece) {
      return [];
    }

    const requestedColor =
      normalizeColor(
        color || piece.color
      );

    if (
      piece.color !==
      requestedColor
    ) {
      return [];
    }

    const pseudo =
      getPseudoLegalMoves(
        board,
        position,
        {
          ...options,
          color: requestedColor
        }
      );

    return pseudo.filter(
      (move) =>
        isMoveLegal(
          board,
          move,
          {
            ...options,
            color: requestedColor
          }
        )
    );
  }

  function getAllLegalMoves(
    board,
    color,
    options = {}
  ) {
    const wanted =
      normalizeColor(color);

    const moves = [];

    if (!Array.isArray(board)) {
      return moves;
    }

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece =
          getPiece(board, {
            row,
            col
          });

        if (
          !piece ||
          piece.color !== wanted
        ) {
          continue;
        }

        moves.push(
          ...getLegalMoves(
            board,
            { row, col },
            wanted,
            options
          )
        );
      }
    }

    return moves;
  }


  function executeMove(
    board,
    from,
    to,
    options = {}
  ) {
    const piece =
      getPiece(board, from);

    if (!piece) {
      return {
        valid: false,
        board: cloneBoard(board),
        move: null,
        reason: "empty-source"
      };
    }

    const move = {
      from,
      to,
      promotion:
        options.promotion ||
        options.promoteTo,
      enPassant:
        options.enPassant,
      castle:
        options.castle
    };

    if (
      !isMoveLegal(
        board,
        move,
        {
          ...options,
          color:
            options.color ||
            piece.color
        }
      )
    ) {
      return {
        valid: false,
        board: cloneBoard(board),
        move: null,
        reason: "illegal-move"
      };
    }

    const legalMoves =
      getLegalMoves(
        board,
        from,
        piece.color,
        options
      );

    const actualMove =
      legalMoves.find(
        (item) =>
          sameSquare(
            item.to,
            to
          )
      );

    const finalMove = {
      ...actualMove,
      ...move
    };

    const next =
      applyMove(
        board,
        finalMove
      );

    const nextTurn =
      oppositeColor(
        piece.color
      );

    const check =
      isKingInCheck(
        next,
        nextTurn
      );

    const opponentMoves =
      getAllLegalMoves(
        next,
        nextTurn,
        options
      );

    const checkmate =
      check &&
      opponentMoves.length === 0;

    const stalemate =
      !check &&
      opponentMoves.length === 0;

    return {
      valid: true,
      board: next,
      move: {
        ...finalMove,
        check,
        checkmate,
        stalemate,
        capture:
          !!actualMove?.capture ||
          !!actualMove?.enPassant
      },
      check,
      checkmate,
      stalemate,
      gameOver:
        checkmate ||
        stalemate
    };
  }

  
  function getGameStatus(
    board,
    color,
    options = {}
  ) {
    const wanted =
      normalizeColor(color);

    const inCheck =
      isKingInCheck(
        board,
        wanted
      );

    const legalMoves =
      getAllLegalMoves(
        board,
        wanted,
        options
      );

    if (
      inCheck &&
      legalMoves.length === 0
    ) {
      return {
        status: "checkmate",
        inCheck: true,
        checkmate: true,
        stalemate: false,
        gameOver: true,
        winner:
          oppositeColor(wanted),
        legalMoves: []
      };
    }

    if (
      !inCheck &&
      legalMoves.length === 0
    ) {
      return {
        status: "stalemate",
        inCheck: false,
        checkmate: false,
        stalemate: true,
        gameOver: true,
        winner: null,
        legalMoves: []
      };
    }

    return {
      status:
        inCheck
          ? "check"
          : "playing",
      inCheck,
      checkmate: false,
      stalemate: false,
      gameOver: false,
      winner: null,
      legalMoves
    };
  }

  

  function validateBoard(board) {
    const errors = [];

    if (
      !Array.isArray(board) ||
      board.length !== 8
    ) {
      errors.push(
        "Board must contain 8 rows."
      );

      return {
        valid: false,
        errors
      };
    }

    for (let row = 0; row < 8; row++) {
      if (
        !Array.isArray(board[row]) ||
        board[row].length !== 8
      ) {
        errors.push(
          `Row ${row + 1} must contain 8 squares.`
        );
      }
    }

    let whiteKings = 0;
    let blackKings = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece =
          getPiece(board, {
            row,
            col
          });

        if (!piece) continue;

        const validType = [
          PIECES.PAWN,
          PIECES.KNIGHT,
          PIECES.BISHOP,
          PIECES.ROOK,
          PIECES.QUEEN,
          PIECES.KING
        ].includes(
          piece.type
        );

        const validColor = [
          COLORS.WHITE,
          COLORS.BLACK
        ].includes(
          piece.color
        );

        if (!validType) {
          errors.push(
            `Invalid piece at ${toSquareName({
              row,
              col
            })}.`
          );
        }

        if (!validColor) {
          errors.push(
            `Invalid piece colour at ${toSquareName({
              row,
              col
            })}.`
          );
        }

        if (
          piece.type ===
            PIECES.KING &&
          piece.color ===
            COLORS.WHITE
        ) {
          whiteKings++;
        }

        if (
          piece.type ===
            PIECES.KING &&
          piece.color ===
            COLORS.BLACK
        ) {
          blackKings++;
        }
      }
    }

    if (whiteKings !== 1) {
      errors.push(
        "Position must contain exactly one white king."
      );
    }

    if (blackKings !== 1) {
      errors.push(
        "Position must contain exactly one black king."
      );
    }

    return {
      valid:
        errors.length === 0,
      errors,
      whiteKings,
      blackKings
    };
  }

 
  function moveToNotation(
    board,
    move,
    options = {}
  ) {
    const from =
      normalizeSquare(move.from);

    const to =
      normalizeSquare(move.to);

    const piece =
      getPiece(board, from);

    if (!piece || !to) {
      return "";
    }

    if (move.castle === "king") {
      return "O-O";
    }

    if (move.castle === "queen") {
      return "O-O-O";
    }

    const capture =
      !!move.capture ||
      !!getPiece(board, to);

    let notation = "";

    if (
      piece.type !==
      PIECES.PAWN
    ) {
      notation +=
        piece.type.toUpperCase();
    }

    if (
      piece.type ===
        PIECES.PAWN &&
      capture
    ) {
      notation +=
        FILES[from.col];
    }

    if (capture) {
      notation += "x";
    }

    notation +=
      toSquareName(to);

    if (
      move.promotion
    ) {
      notation +=
        "=" +
        normalizePieceType(
          move.promotion
        ).toUpperCase();
    }

    const simulated =
      applyMove(
        board,
        move
      );

    const opponent =
      oppositeColor(
        piece.color
      );

    if (
      isKingInCheck(
        simulated,
        opponent
      )
    ) {
      const replies =
        getAllLegalMoves(
          simulated,
          opponent,
          options
        );

      notation +=
        replies.length === 0
          ? "#"
          : "+";
    }

    return notation;
  }

  
  function boardToFEN(
    board,
    options = {}
  ) {
    const ranks = [];

    for (let row = 0; row < 8; row++) {
      let rank = "";
      let empty = 0;

      for (let col = 0; col < 8; col++) {
        const piece =
          getPiece(board, {
            row,
            col
          });

        if (!piece) {
          empty++;
          continue;
        }

        if (empty) {
          rank += String(empty);
          empty = 0;
        }

        const letter =
          piece.type;

        rank +=
          piece.color ===
          COLORS.WHITE
            ? letter.toUpperCase()
            : letter;
      }

      if (empty) {
        rank += String(empty);
      }

      ranks.push(rank);
    }

    const activeColor =
      normalizeColor(
        options.turn ||
          COLORS.WHITE
      ) === COLORS.WHITE
        ? "w"
        : "b";

    let castling = "";

    if (
      options.castling
    ) {
      const rights =
        options.castling;

      if (
        rights.whiteKingSide
      ) {
        castling += "K";
      }

      if (
        rights.whiteQueenSide
      ) {
        castling += "Q";
      }

      if (
        rights.blackKingSide
      ) {
        castling += "k";
      }

      if (
        rights.blackQueenSide
      ) {
        castling += "q";
      }
    }

    if (!castling) {
      castling = "-";
    }

    const enPassant =
      options.enPassant
        ? toSquareName(
            options.enPassant
          )
        : "-";

    return [
      ranks.join("/"),
      activeColor,
      castling,
      enPassant,
      options.halfmove ?? 0,
      options.fullmove ?? 1
    ].join(" ");
  }

  function fenToBoard(fen) {
    if (
      typeof fen !== "string"
    ) {
      return null;
    }

    const parts =
      fen.trim().split(/\s+/);

    const ranks =
      parts[0]?.split("/");

    if (
      !ranks ||
      ranks.length !== 8
    ) {
      return null;
    }

    const board =
      Array.from(
        { length: 8 },
        () =>
          Array(8).fill(null)
      );

    for (
      let row = 0;
      row < 8;
      row++
    ) {
      let col = 0;

      for (
        const character of ranks[row]
      ) {
        if (/\d/.test(character)) {
          col += Number(character);
          continue;
        }

        if (
          col >= 8
        ) {
          return null;
        }

        const color =
          character ===
          character.toUpperCase()
            ? COLORS.WHITE
            : COLORS.BLACK;

        board[row][col] = {
          type:
            character.toLowerCase(),
          color,
          hasMoved:
            false
        };

        col++;
      }

      if (col !== 8) {
        return null;
      }
    }

    return {
      board,

      turn:
        parts[1] === "b"
          ? COLORS.BLACK
          : COLORS.WHITE,

      castling:
        parts[2] || "-",

      enPassant:
        parts[3] &&
        parts[3] !== "-"
          ? normalizeSquare(
              parts[3]
            )
          : null,

      halfmove:
        Number(parts[4]) || 0,

      fullmove:
        Number(parts[5]) || 1
    };
  }

  

  window.ChessLogic = {
    FILES,
    PIECES,
    COLORS,

    oppositeColor,
    normalizeColor,
    normalizePieceType,
    normalizePiece,
    normalizeSquare,
    toSquareName,

    cloneBoard,
    cloneGameState,

    getPiece,
    findKing,

    isSquareAttacked,
    isKingInCheck,

    getPseudoLegalMoves,
    getLegalMoves,
    getAllLegalMoves,

    isMoveLegal,
    applyMove,
    executeMove,

    getGameStatus,
    validateBoard,

    moveToNotation,

    boardToFEN,
    fenToBoard,

    canCastleKingSide,
    canCastleQueenSide
  };

  

  window.isSquareAttacked =
    window.isSquareAttacked ||
    isSquareAttacked;

  window.isKingInCheck =
    window.isKingInCheck ||
    isKingInCheck;

  window.getLegalMoves =
    window.getLegalMoves ||
    getLegalMoves;

  window.getAllLegalMoves =
    window.getAllLegalMoves ||
    getAllLegalMoves;

  window.isMoveLegal =
    window.isMoveLegal ||
    isMoveLegal;

  window.applyChessMove =
    window.applyChessMove ||
    applyMove;

})();
