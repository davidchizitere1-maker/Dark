/* ==========================================================
   STEENE CHESS — src/ui/tutorial.js
   Interactive chess tutorial / learning system.
   ========================================================== */

(function () {
  "use strict";

  const lessons = [
    {
      id: "objective",
      title: "The Objective",
      category: "Basics",
      text:
        "The objective of chess is to checkmate the opposing king. Checkmate means the king is under attack and there is no legal move that can save it.",
      tip:
        "Always look at the safety of both kings before planning your next move."
    },

    {
      id: "board",
      title: "The Chessboard",
      category: "Basics",
      text:
        "A chessboard has 64 squares arranged in eight ranks and eight files. The board is positioned so that each player has a light-coloured square on the right-hand corner.",
      tip:
        "The coordinates run from a through h and from 1 through 8."
    },

    {
      id: "pawn",
      title: "The Pawn",
      category: "Pieces",
      text:
        "Pawns normally move one square forward. On its first move, a pawn may move two squares if both squares are clear. Pawns capture one square diagonally forward.",
      tip:
        "Pawns move forward but capture diagonally."
    },

    {
      id: "knight",
      title: "The Knight",
      category: "Pieces",
      text:
        "The knight moves in an L-shape: two squares in one direction and one square perpendicular to it. Knights can jump over other pieces.",
      tip:
        "Knights are the only pieces that can jump over pieces."
    },

    {
      id: "bishop",
      title: "The Bishop",
      category: "Pieces",
      text:
        "The bishop moves diagonally any number of squares as long as its path is clear. Each bishop remains on the same colour of square throughout the game.",
      tip:
        "A bishop that starts on a light square always stays on light squares."
    },

    {
      id: "rook",
      title: "The Rook",
      category: "Pieces",
      text:
        "The rook moves any number of squares horizontally or vertically, provided that no piece blocks its path.",
      tip:
        "Rooks become especially powerful on open files and ranks."
    },

    {
      id: "queen",
      title: "The Queen",
      category: "Pieces",
      text:
        "The queen can move horizontally, vertically, or diagonally any number of squares when its path is clear.",
      tip:
        "The queen combines the movement of the rook and bishop."
    },

    {
      id: "king",
      title: "The King",
      category: "Pieces",
      text:
        "The king normally moves one square in any direction. A king may never move onto a square controlled by an opposing piece.",
      tip:
        "The king is the most important piece even though it is not the strongest attacker."
    },

    {
      id: "check",
      title: "Check",
      category: "Rules",
      text:
        "A king is in check when an opposing piece attacks its square. The player in check must make a legal move that removes the threat.",
      tip:
        "When in check, you must respond immediately."
    },

    {
      id: "checkmate",
      title: "Checkmate",
      category: "Rules",
      text:
        "Checkmate occurs when a king is in check and the player has no legal move that can remove the attack.",
      tip:
        "Checkmate ends the game immediately."
    },

    {
      id: "castling",
      title: "Castling",
      category: "Special Moves",
      text:
        "Castling is a special move involving the king and a rook. The king moves two squares toward the rook, and the rook moves to the square next to the king.",
      tip:
        "Castling cannot be performed while in check or through a square attacked by the opponent."
    },

    {
      id: "en-passant",
      title: "En Passant",
      category: "Special Moves",
      text:
        "En passant is a special pawn capture that can occur immediately after an opposing pawn advances two squares from its starting position and lands beside your pawn.",
      tip:
        "The capture must be made immediately on the following move."
    },

    {
      id: "promotion",
      title: "Pawn Promotion",
      category: "Special Moves",
      text:
        "When a pawn reaches the opposite end of the board, it must be promoted to another piece, normally a queen, rook, bishop, or knight.",
      tip:
        "Promotion can dramatically change the outcome of a game."
    },

    {
      id: "stalemate",
      title: "Stalemate",
      category: "Draws",
      text:
        "Stalemate occurs when the player whose turn it is has no legal move, but the king is not in check. The game ends as a draw.",
      tip:
        "Be careful when trying to force checkmate with very few pieces."
    },

    {
      id: "draw",
      title: "Draws",
      category: "Draws",
      text:
        "Chess can be drawn in several ways, including stalemate, agreement, insufficient material, threefold repetition, and the fifty-move rule.",
      tip:
        "Not every game has a winner."
    }
  ];

  let currentLesson = 0;

  let tutorialState = {
    completed: [],
    started: false
  };

  const STORAGE_KEY =
    "steene_tutorial_progress";

  /* ----------------------------------------------------------
     Storage
     ---------------------------------------------------------- */

  function loadProgress() {
    try {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        return;
      }

      const parsed =
        JSON.parse(saved);

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        tutorialState = {
          ...tutorialState,
          ...parsed,
          completed:
            Array.isArray(parsed.completed)
              ? parsed.completed
              : []
        };
      }
    } catch (error) {
      console.warn(
        "STEENE: Could not load tutorial progress.",
        error
      );
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tutorialState)
      );
    } catch (error) {
      console.warn(
        "STEENE: Could not save tutorial progress.",
        error
      );
    }
  }

  /* ----------------------------------------------------------
     DOM helpers
     ---------------------------------------------------------- */

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        value ?? "";
    }
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  /* ----------------------------------------------------------
     Lesson access
     ---------------------------------------------------------- */

  window.getTutorialLessons =
    function () {
      return lessons.map(
        (lesson) => ({
          ...lesson
        })
      );
    };

  window.getTutorialLesson =
    function (index) {
      const safeIndex =
        Math.max(
          0,
          Math.min(
            lessons.length - 1,
            Number(index) || 0
          )
        );

      return lessons[safeIndex];
    };

  /* ----------------------------------------------------------
     Render lesson
     ---------------------------------------------------------- */

  function renderLesson() {
    const lesson =
      lessons[currentLesson];

    if (!lesson) {
      return;
    }

    setText(
      "tutorialTitle",
      lesson.title
    );

    setText(
      "tutorialText",
      lesson.text
    );

    setText(
      "tutorialCategory",
      lesson.category
    );

    setText(
      "tutorialTip",
      lesson.tip
    );

    setText(
      "tutorialStep",
      `${currentLesson + 1} / ${lessons.length}`
    );

    setText(
      "tutorialProgress",
      `${Math.round(
        ((currentLesson + 1) /
          lessons.length) *
          100
      )}%`
    );

    /*
      Progress bar support.
    */

    document
      .querySelectorAll(
        "[data-tutorial-progress]"
      )
      .forEach((element) => {
        element.style.width =
          `${(
            ((currentLesson + 1) /
              lessons.length) *
            100
          )}%`;
      });

    /*
      Lesson navigation.
    */

    document
      .querySelectorAll(
        "[data-tutorial-index]"
      )
      .forEach((item) => {
        const index =
          Number(
            item.dataset.tutorialIndex
          );

        item.classList.toggle(
          "active",
          index === currentLesson
        );

        item.classList.toggle(
          "completed",
          tutorialState.completed.includes(
            lessons[index]?.id
          )
        );
      });

    /*
      Previous / next buttons.
    */

    document
      .querySelectorAll(
        "[data-tutorial-prev]"
      )
      .forEach((button) => {
        button.disabled =
          currentLesson === 0;
      });

    document
      .querySelectorAll(
        "[data-tutorial-next]"
      )
      .forEach((button) => {
        button.disabled =
          currentLesson ===
          lessons.length - 1;
      });

    tutorialState.started = true;

    saveProgress();
  }

  /* ----------------------------------------------------------
     Show lesson
     ---------------------------------------------------------- */

  window.showTutorialLesson =
    function (index) {
      if (!lessons.length) {
        return;
      }

      currentLesson =
        Math.max(
          0,
          Math.min(
            lessons.length - 1,
            Number(index) || 0
          )
        );

      renderLesson();

      const lesson =
        lessons[currentLesson];

      /*
        Optional lesson-specific event.
        Useful for interactive board demonstrations.
      */

      document.dispatchEvent(
        new CustomEvent(
          "steene:tutorialLessonChanged",
          {
            detail: {
              lesson,
              index: currentLesson
            }
          }
        )
      );
    };

  /* ----------------------------------------------------------
     Navigation
     ---------------------------------------------------------- */

  window.nextTutorialLesson =
    function () {
      if (
        currentLesson <
        lessons.length - 1
      ) {
        markCurrentLessonComplete();

        showTutorialLesson(
          currentLesson + 1
        );

        return;
      }

      markCurrentLessonComplete();

      document.dispatchEvent(
        new CustomEvent(
          "steene:tutorialCompleted"
        )
      );
    };

  window.previousTutorialLesson =
    function () {
      if (currentLesson > 0) {
        showTutorialLesson(
          currentLesson - 1
        );
      }
    };

  /* ----------------------------------------------------------
     Completion
     ---------------------------------------------------------- */

  function markCurrentLessonComplete() {
    const lesson =
      lessons[currentLesson];

    if (!lesson) {
      return;
    }

    if (
      !tutorialState.completed.includes(
        lesson.id
      )
    ) {
      tutorialState.completed.push(
        lesson.id
      );
    }

    saveProgress();
    renderLesson();
  }

  window.completeTutorialLesson =
    function () {
      markCurrentLessonComplete();

      return true;
    };

  window.isTutorialLessonComplete =
    function (id) {
      return tutorialState.completed.includes(
        id
      );
    };

  window.getTutorialProgress =
    function () {
      return {
        completed:
          tutorialState.completed.length,
        total:
          lessons.length,
        percentage:
          Math.round(
            (tutorialState.completed.length /
              lessons.length) *
              100
          )
      };
    };

  /* ----------------------------------------------------------
     Reset tutorial
     ---------------------------------------------------------- */

  window.resetTutorialProgress =
    function () {
      const confirmed =
        window.confirm(
          "Reset all tutorial progress?"
        );

      if (!confirmed) {
        return false;
      }

      tutorialState = {
        completed: [],
        started: false
      };

      currentLesson = 0;

      saveProgress();
      renderLesson();

      return true;
    };

  /* ----------------------------------------------------------
     Tutorial start
     ---------------------------------------------------------- */

  window.startTutorial =
    function (index = 0) {
      tutorialState.started = true;

      showTutorialLesson(index);

      if (
        typeof window.goTo === "function"
      ) {
        window.goTo("tutorial");
      }
    };

  window.initTutorial =
    function () {
      loadProgress();
      renderLesson();
    };

  /* ----------------------------------------------------------
     Optional interactive board support
     ---------------------------------------------------------- */

  window.tutorialExplainMove =
    function (
      from,
      to,
      color
    ) {
      const board =
        typeof window.getCurrentBoard ===
        "function"
          ? window.getCurrentBoard()
          : window.G?.board;

      if (
        !board ||
        !window.ChessLogic
      ) {
        return {
          valid: false,
          message:
            "Tutorial board is not available."
        };
      }

      const piece =
        board?.[from?.row]?.[from?.column];

      if (!piece) {
        return {
          valid: false,
          message:
            "There is no piece on the selected square."
        };
      }

      const legalMoves =
        window.ChessLogic.getLegalMoves(
          board,
          from,
          color || piece.color
        );

      const valid =
        legalMoves.some(
          (move) =>
            move.row === to.row &&
            move.column === to.column
        );

      return {
        valid,
        piece,
        message: valid
          ? "That is a legal move."
          : "That move is not legal."
      };
    };

  /* ----------------------------------------------------------
     Keyboard navigation
     ---------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    (event) => {
      /*
        Don't intercept typing.
      */

      if (
        event.target &&
        [
          "INPUT",
          "TEXTAREA",
          "SELECT"
        ].includes(
          event.target.tagName
        )
      ) {
        return;
      }

      /*
        Only use tutorial shortcuts
        while the tutorial screen is active.
      */

      const tutorialScreen =
        document.getElementById(
          "tutorial"
        );

      if (
        tutorialScreen &&
        !tutorialScreen.classList.contains(
          "active"
        )
      ) {
        return;
      }

      if (
        event.key === "ArrowRight"
      ) {
        nextTutorialLesson();
      }

      if (
        event.key === "ArrowLeft"
      ) {
        previousTutorialLesson();
      }
    }
  );

  /* ----------------------------------------------------------
     Initialization
     ---------------------------------------------------------- */

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      initTutorial();
    }
  );

})();
