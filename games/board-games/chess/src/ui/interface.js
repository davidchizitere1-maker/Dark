/* ==========================================================
   STEENE CHESS — src/ui/interface.js
   Main application controller / UI integration layer, and the
   editable player profile, dashboard stats, and achievements.

   Depends on:
   - config.js
   - game/logic.js
   - game/ai.js
   - api/online.js
   - ui/tutorial.js
   - game/board.js

   ── CHANGE THIS PASS (architecture refactor) ──────────────
   Chess never had a separate src/ui/profile.js file committed to
   the repo (an earlier session built one, but it was never pushed),
   and the approved directory structure for this refactor lists only
   ui/{interface,tutorial}.js for this game anyway — matching how
   Barricade's profile logic was merged into its own interface.js.
   Everything below the original interface.js content (from
   "PLAYER PROFILE" onward) is that logic, written directly against
   this file rather than as a separate module.

   Because it lives in the same file as nothing else that redeclares
   getProfile/saveProfile/getStatistics/saveStatistics, this version
   calls window.getProfile()/window.saveProfile()/window.getStatistics()/
   window.saveStatistics() directly — the ones config.js already
   defines and owns — instead of redeclaring local functions with
   the same names. That sidesteps the exact bug Barricade's original
   profile.js had (bare calls to local functions silently shadowing
   the correctly-keyed config.js versions): there's simply nothing
   here to shadow them with.

   Also newly wired up: index.html's #achievementList element (it
   existed in the markup with a placeholder message, but nothing
   ever rendered real content into it — only the achievement COUNT
   at #profileAchievements was ever populated).
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
     Online Game

     window.createOnlineRoom / window.joinOnlineRoom are now
     defined directly by src/api/online.js (see that file's header
     — the previous version was dead code due to a SyntaxError, so
     this UI layer never actually reached a working implementation
     regardless of what it called). Left as-is here since
     online.js owns that surface now.
     ---------------------------------------------------------- */

  window.openOnlineModal = function () {
    showModal("onlineModal");
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

  /* ==========================================================
     PLAYER PROFILE, DASHBOARD STATS & ACHIEVEMENTS
     (merged in — see file header)
     ========================================================== */

  const ACHIEVEMENTS = [
    { id: "first_game",  icon: "🎮", name: "First Steps",   desc: "Play your first game",                  test: s => s.gamesPlayed >= 1 },
    { id: "ten_games",   icon: "📅", name: "Regular",       desc: "Play 10 games",                         test: s => s.gamesPlayed >= 10 },
    { id: "fifty_games", icon: "🗓️", name: "Veteran",       desc: "Play 50 games",                         test: s => s.gamesPlayed >= 50 },
    { id: "first_win",   icon: "🏆", name: "First Victory", desc: "Win a game",                            test: s => s.gamesWon >= 1 },
    { id: "ten_wins",    icon: "👑", name: "Champion",      desc: "Win 10 games",                          test: s => s.gamesWon >= 10 },
    { id: "captures",    icon: "⚔️", name: "Tactician",     desc: "Make 25 captures total",                test: s => s.totalCaptures >= 25 },
    { id: "checks",      icon: "♛", name: "Aggressor",     desc: "Deliver 20 checks total",               test: s => s.totalChecks >= 20 },
    { id: "streak",      icon: "🔥", name: "Hot Streak",    desc: "Win 3 games in a row",                  test: s => s.bestStreak >= 3 },
    { id: "sharpshoot",  icon: "⭐", name: "Sharpshooter",  desc: "Reach a 60%+ win rate (min. 5 games)",  test: s => s.gamesPlayed >= 5 && (s.gamesWon / s.gamesPlayed) >= 0.6 }
  ];

  function computeRatingDelta(result) {
    if (result === "win") return 15;
    if (result === "loss") return -10;
    if (result === "draw") return 2;
    return 0;
  }

  function calculateWinRate(stats) {
    const games = Number(stats.gamesPlayed) || 0;
    const wins = Number(stats.gamesWon) || 0;
    if (!games) return 0;
    return Math.round((wins / games) * 100);
  }

  function countAchievements(stats) {
    return ACHIEVEMENTS.filter(a => a.test(stats)).length;
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value ?? "";
  }

  /* ---- Dashboard (Home screen) ---- */

  window.refreshDashboard = function () {
    const profile = window.getProfile ? window.getProfile() : {};
    const stats = window.getStatistics ? window.getStatistics() : {};

    setText("homeGames", stats.gamesPlayed ?? 0);
    setText("homeWins", stats.gamesWon ?? 0);
    setText("homeRating", profile.rating ?? 1200);
    setText("homeStreak", stats.currentStreak ?? 0);

    document.querySelectorAll(".profile-mini-name").forEach(el => {
      el.textContent = profile.name || "Steene Player";
    });

    document.querySelectorAll(".profile-mini-meta").forEach(el => {
      el.textContent = `Rating ${profile.rating ?? 1200}`;
    });

    document.querySelectorAll(".avatar").forEach(el => {
      el.textContent =
        profile.avatar ||
        (profile.name || "S").charAt(0).toUpperCase();
    });
  };

  /* ---- Profile screen ---- */

  window.renderProfile = function () {
    const profile = window.getProfile ? window.getProfile() : {};
    const stats = window.getStatistics ? window.getStatistics() : {};

    setText("profileName", profile.name || "Steene Player");
    setText("profileRating", `Rating ${profile.rating ?? 1200}`);
    setText("profileGames", stats.gamesPlayed ?? 0);
    setText("profileWins", stats.gamesWon ?? 0);
    setText("profileLosses", stats.gamesLost ?? 0);
    setText("profileAchievements", countAchievements(stats));

    const achievementList = $("achievementList");

    if (achievementList) {
      achievementList.innerHTML = ACHIEVEMENTS.map(a => {
        const unlocked = a.test(stats);

        return `
          <div class="card stat-card" style="opacity:${unlocked ? "1" : ".45"}">
            <div class="stat-icon">${unlocked ? a.icon : "🔒"}</div>
            <div class="stat-label" style="font-weight:750;color:var(--text);margin-bottom:4px">${a.name}</div>
            <div class="stat-label">${a.desc}</div>
          </div>
        `;
      }).join("");
    }
  };

  /* ---- Editing (called by index.html's editProfile() fallback) ---- */

  window.updatePlayerName = function (name) {
    const cleanName = String(name || "").trim();
    if (!cleanName || !window.saveProfile) return;

    window.saveProfile({
      name: cleanName,
      avatar: cleanName.charAt(0).toUpperCase()
    });

    window.refreshDashboard();
    window.renderProfile();
  };

  window.updatePlayerAvatar = function (avatar) {
    const cleanAvatar = String(avatar || "").trim().slice(0, 2);
    if (!cleanAvatar || !window.saveProfile) return;

    window.saveProfile({ avatar: cleanAvatar });

    window.refreshDashboard();
    window.renderProfile();
  };

  window.updatePlayerRating = function (amount) {
    if (!window.saveProfile) return;

    const rating = Math.max(0, Number(amount) || 0);
    window.saveProfile({ rating });

    window.refreshDashboard();
    window.renderProfile();
  };

  /* ---- Recording a finished game (called by board.js's endGame()) ---- */

  window.recordGameResult = function ({
    result,
    mode = "local",
    turns = 0,
    captures = 0,
    checks = 0
  } = {}) {
    if (!window.getStatistics || !window.saveStatistics) return;

    const stats = window.getStatistics();

    stats.gamesPlayed += 1;
    stats.totalTurns += Number(turns) || 0;
    stats.totalCaptures += Number(captures) || 0;
    stats.totalChecks += Number(checks) || 0;

    if (mode === "local") stats.localGames += 1;
    if (mode === "ai") stats.aiGames += 1;
    if (mode === "online") stats.onlineGames += 1;

    if (result === "win") {
      stats.gamesWon += 1;
      stats.currentStreak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    }

    if (result === "loss") {
      stats.gamesLost += 1;
      stats.currentStreak = 0;
    }

    if (result === "draw") {
      stats.gamesDrawn += 1;
      stats.currentStreak = 0;
    }

    stats.lastGameAt = new Date().toISOString();
    window.saveStatistics(stats);

    if (window.getProfile && window.saveProfile) {
      const profile = window.getProfile();
      const delta = computeRatingDelta(result);
      const newRating = Math.max(100, (Number(profile.rating) || 1200) + delta);
      window.saveProfile({ rating: newRating });
    }

    window.refreshDashboard();
    window.renderProfile();
  };

  /* ---- Reset (Settings screen's "Reset Statistics" button) ---- */

  window.resetStatistics = function () {
    if (!window.confirm("Reset all chess statistics? This cannot be undone.")) {
      return false;
    }

    if (window.saveStatistics) {
      window.saveStatistics({
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDrawn: 0,
        localGames: 0,
        aiGames: 0,
        onlineGames: 0,
        totalTurns: 0,
        totalCaptures: 0,
        totalChecks: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastGameAt: null
      });
    }

    window.refreshDashboard();
    window.renderProfile();

    return true;
  };

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
