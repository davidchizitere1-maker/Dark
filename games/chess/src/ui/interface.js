/* ==========================================================
   STEENE CHESS — src/ui/interface.js
   Main application controller / UI integration layer.

   Depends on:
   - config/config.js
   - game/logic.js
   - game/ai.js
   - api/online.js
   - ui/profile.js
   - ui/tutorial.js
   - game/board.js
   ========================================================== */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    screen: "home",
    gameMode: null,
    aiDifficulty: 1,
    sound: true,
    selectedSquare: null,
    aiThinking: false,
    moveHistory: []
  };

  const pageTitles = {
    home: "Dashboard",
    play: "Play",
    game: "Game",
    tutorial: "Tutorial",
    profile: "Profile"
  };

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */

  function showModal(id) {
    const modal = $(id);
    if (modal) modal.classList.add("open");
  }

  function hideModal(id) {
    const modal = $(id);
    if (modal) modal.classList.remove("open");
  }

  function notify(message, type = "info") {
    const existing = document.querySelector(".steene-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `steene-toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 250);
    }, 2600);
  }

  function getCurrentTurn() {
    if (window.G && window.G.turn) {
      return window.G.turn;
    }

    return "white";
  }

  function getCurrentBoard() {
    if (window.G && window.G.board) {
      return window.G.board;
    }

    if (window.board && Array.isArray(window.board)) {
      return window.board;
    }

    return null;
  }

  function playSound(name) {
    if (!state.sound) return;

    /*
      Uses Web Audio when no external audio assets are supplied.
      This keeps the interface self-contained.
    */
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      const frequencies = {
        move: 520,
        capture: 330,
        check: 760,
        castle: 620,
        promote: 880,
        gameover: 220
      };

      oscillator.frequency.value =
        frequencies[name] || 500;

      oscillator.type = "sine";

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.045,
        ctx.currentTime + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + 0.12
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.13);
    } catch (_) {
      /* Audio is optional. */
    }
  }

  /* ----------------------------------------------------------
     Navigation
     ---------------------------------------------------------- */

  window.goTo = function (screen) {
    state.screen = screen;

    document.querySelectorAll(".screen").forEach((section) => {
      section.classList.toggle(
        "active",
        section.id === screen
      );
    });

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.screen === screen
      );
    });

    const title = $("pageTitle");
    if (title) {
      title.textContent =
        pageTitles[screen] || "STEENE";
    }

    if (
      screen === "profile" &&
      typeof window.renderProfile === "function"
    ) {
      window.renderProfile();
    }

    if (
      screen === "home" &&
      typeof window.refreshDashboard === "function"
    ) {
      window.refreshDashboard();
    }

    if (
      screen === "tutorial" &&
      typeof window.initTutorial === "function"
    ) {
      window.initTutorial();
    }
  };

  /* ----------------------------------------------------------
     Sound
     ---------------------------------------------------------- */

  window.toggleSound = function () {
    state.sound = !state.sound;

    document.body.dataset.sound =
      state.sound ? "on" : "off";

    const buttons =
      document.querySelectorAll("[data-sound-toggle]");

    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(state.sound)
      );
    });

    try {
      localStorage.setItem(
        "steene_sound",
        JSON.stringify(state.sound)
      );
    } catch (_) {}

    notify(
      state.sound ? "Sound enabled" : "Sound muted"
    );

    return state.sound;
  };

  window.toggleSoundState = function () {
    return window.toggleSound();
  };

  function restoreSound() {
    try {
      const saved =
        localStorage.getItem("steene_sound");

      if (saved !== null) {
        state.sound = JSON.parse(saved);
      }
    } catch (_) {}

    document.body.dataset.sound =
      state.sound ? "on" : "off";
  }

  /* ----------------------------------------------------------
     Settings
     ---------------------------------------------------------- */

  window.openSettings = function () {
    showModal("settingsModal");
  };

  window.closeModal = function (id) {
    hideModal(id);
  };

  /* ----------------------------------------------------------
     Local Game
     ---------------------------------------------------------- */

  window.openLocalSetup = function () {
    showModal("localModal");
  };

  window.confirmLocalGame = function () {
    const theme =
      $("localTheme")?.value || "dark";

    const timer =
      Number($("localTimer")?.value || 0);

    hideModal("localModal");

    state.gameMode = "local";

    if (typeof window.startLocalGame === "function") {
      window.startLocalGame({
        boardTheme: theme,
        timerEnabled: timer > 0,
        timerSeconds: timer
      });
      return;
    }

    startFallbackGame("local", {
      boardTheme: theme,
      timerEnabled: timer > 0,
      timerSeconds: timer
    });
  };

  /* ----------------------------------------------------------
     AI Game
     ---------------------------------------------------------- */

  window.openAiModal = function () {
    showModal("aiModal");
  };

  window.confirmAiGame = function () {
    const difficulty =
      Number($("aiDifficulty")?.value || 0);

    const theme =
      $("aiTheme")?.value || "dark";

    const timer =
      Number($("aiTimer")?.value || 0);

    hideModal("aiModal");

    state.gameMode = "ai";
    state.aiDifficulty = difficulty;

    if (typeof window.startAiGame === "function") {
      window.startAiGame(difficulty, {
        boardTheme: theme,
        timerEnabled: timer > 0,
        timerSeconds: timer
      });
      return;
    }

    startFallbackGame("ai", {
      difficulty,
      boardTheme: theme,
      timerEnabled: timer > 0,
      timerSeconds: timer
    });
  };

  /* ----------------------------------------------------------
     Online Game — Supabase-ready
     ---------------------------------------------------------- */

  window.openOnlineModal = function () {
    showModal("onlineModal");
  };

  window.createOnlineRoom = async function () {
    if (
      window.SteeneOnline &&
      typeof window.SteeneOnline.createRoom === "function"
    ) {
      try {
        const result =
          await window.SteeneOnline.createRoom();

        if (result?.roomCode) {
          const input = $("roomCode");
          if (input) input.value = result.roomCode;

          notify(
            `Room ${result.roomCode} created`,
            "success"
          );
        }

        return result;
      } catch (error) {
        console.error(error);
        notify(
          error.message || "Could not create room.",
          "error"
        );
        return null;
      }
    }

    notify(
      "Online service is not loaded.",
      "error"
    );

    return null;
  };

  window.joinOnlineRoom = async function () {
    const input = $("roomCode");

    const code =
      input?.value.trim().toUpperCase();

    if (!code) {
      notify(
        "Enter a room code first.",
        "error"
      );
      return null;
    }

    if (
      window.SteeneOnline &&
      typeof window.SteeneOnline.joinRoom === "function"
    ) {
      try {
        const result =
          await window.SteeneOnline.joinRoom(code);

        if (result) {
          hideModal("onlineModal");
          state.gameMode = "online";
        }

        return result;
      } catch (error) {
        console.error(error);
        notify(
          error.message || "Could not join room.",
          "error"
        );
        return null;
      }
    }

    notify(
      "Online service is not loaded.",
      "error"
    );

    return null;
  };

  /* ----------------------------------------------------------
     Board Controls
     ---------------------------------------------------------- */

  window.rotateBoard = function () {
    if (typeof window.rotateBoardState === "function") {
      window.rotateBoardState();
      return;
    }

    if (window.G) {
      window.G.rotated = !window.G.rotated;

      if (typeof window.buildBoard === "function") {
        window.buildBoard();
      }

      if (typeof window.render === "function") {
        window.render();
      }
    }
  };

  window.undoMove = function () {
    if (typeof window.undoLastMove === "function") {
      window.undoLastMove();
      return;
    }

    notify(
      "Undo is not available for this game yet.",
      "info"
    );
  };

  window.confirmResign = function () {
    if (
      window.G &&
      window.G.phase &&
      window.G.phase !== "playing"
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to resign this game?"
      );

    if (!confirmed) return;

    if (typeof window.resignGame === "function") {
      window.resignGame();
      return;
    }

    if (typeof window.endGame === "function") {
      const winner =
        getCurrentTurn() === "white"
          ? "black"
          : "white";

      window.endGame(
        winner,
        "resignation"
      );
      return;
    }

    notify("Game resigned.", "info");
  };

  /* ----------------------------------------------------------
     Game Start Fallback
     ---------------------------------------------------------- */

  function startFallbackGame(mode, options = {}) {
    /*
      board.js remains the authoritative game controller
      when its public start functions are available.
    */

    if (typeof window.resetGame === "function") {
      window.resetGame();

      if (typeof window.goTo === "function") {
        window.goTo("game");
      }

      return;
    }

    if (typeof window.newGame === "function") {
      window.newGame(options);

      if (typeof window.goTo === "function") {
        window.goTo("game");
      }

      return;
    }

    notify(
      "Game engine is not loaded. Check your script paths.",
      "error"
    );
  }

  /* ----------------------------------------------------------
     AI Turn Bridge
     ---------------------------------------------------------- */

  window.requestAiMove = function () {
    const board = getCurrentBoard();

    if (
      !board ||
      !window.ChessAI ||
      typeof window.ChessAI.makeComputerMove !== "function"
    ) {
      return;
    }

    if (state.aiThinking) return;

    state.aiThinking = true;

    const aiColor =
      window.G?.aiColor ||
      "black";

    window.ChessAI.makeComputerMove(
      board,
      aiColor,
      state.aiDifficulty,
      function (move) {
        state.aiThinking = false;

        if (!move) {
          return;
        }

        if (
          typeof window.applyAiMove === "function"
        ) {
          window.applyAiMove(move);
          return;
        }

        if (
          typeof window.executeMove === "function"
        ) {
          window.executeMove(
            move.from,
            move.to,
            move
          );
        }
      }
    );
  };

  /* ----------------------------------------------------------
     Move Feedback
     ---------------------------------------------------------- */

  window.playMoveSound = function ({
    capture = false,
    check = false,
    castle = false,
    promotion = false
  } = {}) {
    if (promotion) {
      playSound("promote");
    } else if (check) {
      playSound("check");
    } else if (castle) {
      playSound("castle");
    } else if (capture) {
      playSound("capture");
    } else {
      playSound("move");
    }
  };

  window.showGameMessage = function (
    message,
    type = "info"
  ) {
    notify(message, type);
  };

  /* ----------------------------------------------------------
     Keyboard shortcuts
     ---------------------------------------------------------- */

  document.addEventListener("keydown", (event) => {
    if (
      event.target &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(
        event.target.tagName
      )
    ) {
      return;
    }

    if (event.key === "Escape") {
      document
        .querySelectorAll(".overlay.open")
        .forEach((modal) => {
          modal.classList.remove("open");
        });
    }

    if (
      event.key.toLowerCase() === "r" &&
      state.screen === "game"
    ) {
      window.rotateBoard();
    }

    if (
      event.key.toLowerCase() === "u" &&
      state.screen === "game"
    ) {
      window.undoMove();
    }
  });

  /* ----------------------------------------------------------
     Modal backdrop
     ---------------------------------------------------------- */

  document.addEventListener("click", (event) => {
    if (
      event.target.classList.contains("overlay")
    ) {
      event.target.classList.remove("open");
    }
  });

  /* ----------------------------------------------------------
     Initialization
     ---------------------------------------------------------- */

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      restoreSound();

      /*
        Do not force the game engine to initialize here.
        board.js owns board creation.
      */

      if (
        typeof window.refreshDashboard === "function"
      ) {
        window.refreshDashboard();
      }

      if (
        typeof window.initTutorial === "function"
      ) {
        window.initTutorial();
      }

      window.goTo(
        window.APP_CONFIG?.defaultScreen ||
        "home"
      );
    }
  );

})();
