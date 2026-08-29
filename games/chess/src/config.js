/* ==========================================================
   STEENE — game/chess/config.js

   Global configuration, defaults, storage helpers, sound
   utilities, and shared application constants.

   This file is loaded before the other classic scripts.
   ========================================================== */

(function () {
  "use strict";

  /* ========================================================
     APPLICATION INFORMATION
     ======================================================== */

  const APP_CONFIG = {
    name: "STEENE",
    version: "1.0.0",
    storagePrefix: "steene-",

    defaultScreen: "home",
    defaultTheme: "dark",
    defaultPieceMode: "classic",

    defaultTimerEnabled: false,
    defaultTimerSeconds: 45,

    defaultMode: "local",
    defaultAiDifficulty: 0,

    boardSize: 8,
    files: "abcdefgh",
    ranks: [8, 7, 6, 5, 4, 3, 2, 1]
  };

  /* ========================================================
     PIECE CONSTANTS
     ======================================================== */

  const PIECE_SYMBOLS = {
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

  const PIECE_NAMES = {
    king: "King",
    queen: "Queen",
    rook: "Rook",
    bishop: "Bishop",
    knight: "Knight",
    pawn: "Pawn"
  };

  const PIECE_TYPES = [
    "king",
    "queen",
    "rook",
    "bishop",
    "knight",
    "pawn"
  ];

  /* ========================================================
     GAME MODES
     ======================================================== */

  const GAME_MODES = {
    LOCAL: "local",
    AI: "ai",
    ONLINE: "online"
  };

  const GAME_PHASES = {
    IDLE: "idle",
    PLAYING: "playing",
    PAUSED: "paused",
    OVER: "over"
  };

  const COLORS = {
    WHITE: "white",
    BLACK: "black"
  };

  const DIFFICULTIES = {
    BEGINNER: 0,
    INTERMEDIATE: 1,
    ADVANCED: 2,
    EXPERT: 3
  };

  const DIFFICULTY_NAMES = {
    0: "Beginner",
    1: "Intermediate",
    2: "Advanced",
    3: "Expert"
  };

  /* ========================================================
     BOARD THEMES
     ======================================================== */

  const BOARD_THEMES = {
    dark: {
      name: "Dark Wood",
      className: "theme-dark",
      light: "#d8c49d",
      dark: "#836b4a",
      border: "#332819"
    },

    wood: {
      name: "Classic Wood",
      className: "theme-wood",
      light: "#d9b47d",
      dark: "#875630",
      border: "#3d2114"
    },

    gold: {
      name: "Golden",
      className: "theme-gold",
      light: "#ead19a",
      dark: "#96732e",
      border: "#493615"
    },

    marble: {
      name: "Marble",
      className: "theme-marble",
      light: "#d8d8d5",
      dark: "#73777c",
      border: "#272b30"
    },

    neon: {
      name: "Neon",
      className: "theme-neon",
      light: "#283b43",
      dark: "#172329",
      border: "#0bd3bd"
    },

    scrabble: {
      name: "Scrabble",
      className: "theme-scrabble",
      light: "#e0bf86",
      dark: "#a97844",
      border: "#47301b"
    }
  };

  /* ========================================================
     TIMER PRESETS
     ======================================================== */

  const TIMER_PRESETS = [
    {
      value: 0,
      label: "Disabled",
      enabled: false
    },

    {
      value: 30,
      label: "30 seconds",
      enabled: true
    },

    {
      value: 45,
      label: "45 seconds",
      enabled: true
    },

    {
      value: 60,
      label: "60 seconds",
      enabled: true
    },

    {
      value: 300,
      label: "5 minutes",
      enabled: true
    },

    {
      value: 600,
      label: "10 minutes",
      enabled: true
    },

    {
      value: 900,
      label: "15 minutes",
      enabled: true
    }
  ];

  /* ========================================================
     STORAGE KEYS
     ======================================================== */

  const STORAGE_KEYS = {
    settings: "settings",
    profile: "profile",
    statistics: "statistics",
    achievements: "achievements",
    game: "game",
    theme: "default-theme",
    sound: "sound-enabled",
    playerName: "player-name",
    playerRating: "player-rating"
  };

  function storageKey(key) {
    return `${APP_CONFIG.storagePrefix}${key}`;
  }

  function readStorage(key, fallback = null) {
    try {
      const value = localStorage.getItem(storageKey(key));

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(
        storageKey(key),
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(storageKey(key));
      return true;
    } catch (error) {
      return false;
    }
  }

  /* ========================================================
     DEFAULT SETTINGS
     ======================================================== */

  const DEFAULT_SETTINGS = {
    theme: APP_CONFIG.defaultTheme,
    pieceMode: APP_CONFIG.defaultPieceMode,

    soundEnabled: true,
    animationEnabled: true,

    boardCoordinates: true,
    boardRotation: false,

    timerEnabled: APP_CONFIG.defaultTimerEnabled,
    timerSeconds: APP_CONFIG.defaultTimerSeconds,

    showLegalMoves: true,
    showLastMove: true,

    playerColor: "white",
    onlineColor: "white"
  };

  const DEFAULT_PROFILE = {
    name: "Steene Player",
    rating: 1200,
    avatar: "S",
    createdAt: new Date().toISOString()
  };

  const DEFAULT_STATISTICS = {
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
  };

  /* ========================================================
     SOUND MANAGEMENT
     ======================================================== */

  let soundEnabled = readStorage(
    STORAGE_KEYS.sound,
    DEFAULT_SETTINGS.soundEnabled
  );

  function getAudioElement(id) {
    return document.getElementById(id);
  }

  function playAudio(id) {
    if (!soundEnabled) {
      return;
    }

    const audio = getAudioElement(id);

    if (!audio) {
      return;
    }

    try {
      audio.currentTime = 0;

      const promise = audio.play();

      if (
        promise &&
        typeof promise.catch === "function"
      ) {
        promise.catch(() => {});
      }
    } catch (error) {
      // Audio may be blocked until the user interacts with the page.
    }
  }

  function setSoundEnabled(enabled) {
    soundEnabled = Boolean(enabled);

    writeStorage(
      STORAGE_KEYS.sound,
      soundEnabled
    );

    return soundEnabled;
  }

  function isSoundEnabled() {
    return soundEnabled;
  }

  function toggleSoundState() {
    return setSoundEnabled(!soundEnabled);
  }

  function sfxMove() {
    playAudio("moveSound");
  }

  function sfxCapture() {
    playAudio("captureSound");
  }

  function sfxSel() {
    playAudio("selectSound");
  }

  function sfxErr() {
    playAudio("errorSound");
  }

  function sfxWin() {
    playAudio("winSound");
  }

  /* ========================================================
     GENERAL HELPERS
     ======================================================== */

  function oppositeColor(color) {
    return color === COLORS.WHITE
      ? COLORS.BLACK
      : COLORS.WHITE;
  }

  function isValidColor(color) {
    return (
      color === COLORS.WHITE ||
      color === COLORS.BLACK
    );
  }

  function isValidTheme(theme) {
    return Object.prototype.hasOwnProperty.call(
      BOARD_THEMES,
      theme
    );
  }

  function normalizeTheme(theme) {
    return isValidTheme(theme)
      ? theme
      : APP_CONFIG.defaultTheme;
  }

  function normalizeDifficulty(difficulty) {
    const number = Number(difficulty);

    if (!Number.isFinite(number)) {
      return DIFFICULTIES.BEGINNER;
    }

    return Math.min(
      DIFFICULTIES.EXPERT,
      Math.max(
        DIFFICULTIES.BEGINNER,
        Math.round(number)
      )
    );
  }

  function normalizeTimerSeconds(seconds) {
    const number = Number(seconds);

    if (!Number.isFinite(number) || number <= 0) {
      return 0;
    }

    return Math.max(
      1,
      Math.round(number)
    );
  }

  function createGameConfig(overrides = {}) {
    const settings = getSettings();

    const timerSeconds =
      overrides.timerSeconds ??
      settings.timerSeconds;

    return {
      mode:
        overrides.mode ||
        APP_CONFIG.defaultMode,

      aiMode:
        overrides.aiMode ??
        overrides.mode === GAME_MODES.AI,

      aiDifficulty:
        normalizeDifficulty(
          overrides.aiDifficulty ??
          APP_CONFIG.defaultAiDifficulty
        ),

      boardTheme:
        normalizeTheme(
          overrides.boardTheme ||
          overrides.theme ||
          settings.theme
        ),

      pieceMode:
        overrides.pieceMode ||
        settings.pieceMode,

      timerEnabled:
        overrides.timerEnabled ??
        (
          timerSeconds > 0
            ? settings.timerEnabled
            : false
        ),

      timerSeconds:
        normalizeTimerSeconds(timerSeconds),

      rotated:
        Boolean(
          overrides.rotated ??
          settings.boardRotation
        )
    };
  }

  /* ========================================================
     SETTINGS
     ======================================================== */

  function getSettings() {
    const saved = readStorage(
      STORAGE_KEYS.settings,
      {}
    );

    return {
      ...DEFAULT_SETTINGS,
      ...(saved || {})
    };
  }

  function saveSettings(changes = {}) {
    const settings = {
      ...getSettings(),
      ...changes
    };

    if (settings.theme) {
      settings.theme =
        normalizeTheme(settings.theme);
    }

    if (settings.timerSeconds !== undefined) {
      settings.timerSeconds =
        normalizeTimerSeconds(
          settings.timerSeconds
        );
    }

    writeStorage(
      STORAGE_KEYS.settings,
      settings
    );

    writeStorage(
      STORAGE_KEYS.theme,
      settings.theme
    );

    setSoundEnabled(
      settings.soundEnabled
    );

    return settings;
  }

  function getDefaultTheme() {
    const savedTheme = readStorage(
      STORAGE_KEYS.theme,
      null
    );

    if (savedTheme) {
      return normalizeTheme(savedTheme);
    }

    return normalizeTheme(
      getSettings().theme
    );
  }

  function saveDefaultTheme(theme) {
    const normalized = normalizeTheme(theme);

    writeStorage(
      STORAGE_KEYS.theme,
      normalized
    );

    saveSettings({
      theme: normalized
    });

    if (
      typeof window.applyBoardTheme === "function"
    ) {
      window.applyBoardTheme(normalized);
    }

    return normalized;
  }

  /* ========================================================
     PROFILE AND STATISTICS
     ======================================================== */

  function getProfile() {
    const saved = readStorage(
      STORAGE_KEYS.profile,
      {}
    );

    return {
      ...DEFAULT_PROFILE,
      ...(saved || {})
    };
  }

  function saveProfile(changes = {}) {
    const profile = {
      ...getProfile(),
      ...changes
    };

    if (
      typeof profile.name === "string" &&
      !profile.name.trim()
    ) {
      profile.name = DEFAULT_PROFILE.name;
    }

    writeStorage(
      STORAGE_KEYS.profile,
      profile
    );

    return profile;
  }

  function getStatistics() {
    const saved = readStorage(
      STORAGE_KEYS.statistics,
      {}
    );

    return {
      ...DEFAULT_STATISTICS,
      ...(saved || {})
    };
  }

  function saveStatistics(changes = {}) {
    const statistics = {
      ...getStatistics(),
      ...changes
    };

    writeStorage(
      STORAGE_KEYS.statistics,
      statistics
    );

    return statistics;
  }

  function resetApplicationData() {
    Object.values(STORAGE_KEYS).forEach(key => {
      removeStorage(key);
    });

    return true;
  }

  /* ========================================================
     INITIALIZATION
     ======================================================== */

  function initializeConfig() {
    const settings = getSettings();
    const profile = getProfile();

    soundEnabled =
      settings.soundEnabled !== undefined
        ? Boolean(settings.soundEnabled)
        : soundEnabled;

    const theme =
      normalizeTheme(settings.theme);

    if (
      typeof window.applyBoardTheme === "function"
    ) {
      window.applyBoardTheme(theme);
    }

    const defaultTheme =
      document.getElementById("defaultTheme");

    if (defaultTheme) {
      defaultTheme.value = theme;
    }

    const profileName =
      document.getElementById("profileName");

    if (profileName) {
      profileName.textContent =
        profile.name;
    }

    const profileAvatar =
      document.getElementById("profileAvatar");

    if (profileAvatar) {
      profileAvatar.textContent =
        profile.avatar ||
        profile.name.charAt(0).toUpperCase();
    }
  }

  /* ========================================================
     GLOBAL EXPORTS
     ======================================================== */

  window.STEENE_CONFIG = APP_CONFIG;
  window.APP_CONFIG = APP_CONFIG;

  window.PIECE_SYMBOLS = PIECE_SYMBOLS;
  window.PIECE_VALUES = PIECE_VALUES;
  window.PIECE_NAMES = PIECE_NAMES;
  window.PIECE_TYPES = PIECE_TYPES;

  window.GAME_MODES = GAME_MODES;
  window.GAME_PHASES = GAME_PHASES;
  window.COLORS = COLORS;

  window.DIFFICULTIES = DIFFICULTIES;
  window.DIFFICULTY_NAMES = DIFFICULTY_NAMES;

  window.BOARD_THEMES = BOARD_THEMES;
  window.TIMER_PRESETS = TIMER_PRESETS;
  window.STORAGE_KEYS = STORAGE_KEYS;

  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  window.DEFAULT_PROFILE = DEFAULT_PROFILE;
  window.DEFAULT_STATISTICS = DEFAULT_STATISTICS;

  window.storageKey = storageKey;
  window.readStorage = readStorage;
  window.writeStorage = writeStorage;
  window.removeStorage = removeStorage;

  window.oppositeColor =
    window.oppositeColor || oppositeColor;

  window.isValidColor =
    window.isValidColor || isValidColor;

  window.normalizeTheme = normalizeTheme;
  window.normalizeDifficulty = normalizeDifficulty;
  window.normalizeTimerSeconds = normalizeTimerSeconds;
  window.createGameConfig = createGameConfig;

  window.getSettings = getSettings;
  window.saveSettings = saveSettings;
  window.getDefaultTheme = getDefaultTheme;
  window.saveDefaultTheme = saveDefaultTheme;

  window.getProfile = getProfile;
  window.saveProfile = saveProfile;
  window.getStatistics = getStatistics;
  window.saveStatistics = saveStatistics;
  window.resetApplicationData = resetApplicationData;

  window.setSoundEnabled = setSoundEnabled;
  window.isSoundEnabled = isSoundEnabled;
  window.toggleSoundState = toggleSoundState;

  /*
   * These names are used by board.js.
   */
  window.sfxMove = sfxMove;
  window.sfxCapture = sfxCapture;
  window.sfxSel = sfxSel;
  window.sfxErr = sfxErr;
  window.sfxWin = sfxWin;

  /*
   * Support the interface.js helper, which may call toggleSound().
   * Only define it when another script has not already done so.
   */
  window.toggleSound = window.toggleSound || function () {
    const enabled = toggleSoundState();

    document.body.dataset.sound =
      enabled ? "on" : "off";

    return enabled;
  };

  window.addEventListener(
    "DOMContentLoaded",
    initializeConfig
  );
})();