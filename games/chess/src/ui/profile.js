/* ==========================================================
   STEENE CHESS — src/ui/profile.js
   Player profile, dashboard statistics and game results.
   ========================================================== */

(function () {
  "use strict";

  const DEFAULT_PROFILE = {
    name: "Steene Player",
    rating: 1200,
    avatar: "S"
  };

  const DEFAULT_STATS = {
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

  const PROFILE_KEY = "steene_profile";
  const STATS_KEY = "steene_statistics";

  /* ----------------------------------------------------------
     Storage
     ---------------------------------------------------------- */

  function readStorage(key, fallback) {
    try {
      const saved = localStorage.getItem(key);

      if (!saved) {
        return { ...fallback };
      }

      const parsed = JSON.parse(saved);

      if (!parsed || typeof parsed !== "object") {
        return { ...fallback };
      }

      return {
        ...fallback,
        ...parsed
      };
    } catch (error) {
      console.warn(
        `STEENE: Could not read ${key}.`,
        error
      );

      return { ...fallback };
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      console.warn(
        `STEENE: Could not save ${key}.`,
        error
      );

      return false;
    }
  }

  /* ----------------------------------------------------------
     Profile
     ---------------------------------------------------------- */

  function getProfile() {
    /*
      Prefer the application's existing config.js
      helper when it is available.
    */
    if (
      typeof window.getProfile === "function" &&
      window.getProfile !== getProfile
    ) {
      return window.getProfile();
    }

    return readStorage(
      PROFILE_KEY,
      DEFAULT_PROFILE
    );
  }

  function saveProfile(changes = {}) {
    const current = getProfile();

    const updated = {
      ...current,
      ...changes
    };

    if (
      !updated.avatar &&
      updated.name
    ) {
      updated.avatar =
        updated.name
          .charAt(0)
          .toUpperCase();
    }

    writeStorage(
      PROFILE_KEY,
      updated
    );

    return updated;
  }

  /*
    Expose only if config.js has not already
    provided the same helper.
  */

  if (
    typeof window.getProfile !== "function"
  ) {
    window.getProfile = getProfile;
  }

  if (
    typeof window.saveProfile !== "function"
  ) {
    window.saveProfile = saveProfile;
  }

  /* ----------------------------------------------------------
     Statistics
     ---------------------------------------------------------- */

  function getStatistics() {
    if (
      typeof window.getStatistics === "function" &&
      window.getStatistics !== getStatistics
    ) {
      return window.getStatistics();
    }

    return readStorage(
      STATS_KEY,
      DEFAULT_STATS
    );
  }

  function saveStatistics(stats) {
    const updated = {
      ...DEFAULT_STATS,
      ...stats
    };

    writeStorage(
      STATS_KEY,
      updated
    );

    return updated;
  }

  if (
    typeof window.saveStatistics !== "function"
  ) {
    window.saveStatistics = saveStatistics;
  }

  /* ----------------------------------------------------------
     DOM Helpers
     ---------------------------------------------------------- */

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        value ?? "";
    }
  }

  function setTexts(selector, value) {
    document
      .querySelectorAll(selector)
      .forEach((element) => {
        element.textContent =
          value ?? "";
      });
  }

  function calculateWinRate(stats) {
    const games =
      Number(stats.gamesPlayed) || 0;

    const wins =
      Number(stats.gamesWon) || 0;

    if (!games) {
      return 0;
    }

    return Math.round(
      (wins / games) * 100
    );
  }

  /* ----------------------------------------------------------
     Dashboard
     ---------------------------------------------------------- */

  window.refreshDashboard = function () {
    const profile =
      getProfile();

    const stats =
      getStatistics();

    /*
      These IDs correspond to the dashboard
      elements when present.
    */

    setText(
      "homeGames",
      stats.gamesPlayed
    );

    setText(
      "homeWins",
      stats.gamesWon
    );

    setText(
      "homeRating",
      profile.rating
    );

    setText(
      "homeStreak",
      stats.currentStreak
    );

    setText(
      "homeWinRate",
      `${calculateWinRate(stats)}%`
    );

    setTexts(
      ".profile-mini-name",
      profile.name
    );

    setTexts(
      ".profile-mini-meta",
      `Rating ${profile.rating}`
    );

    document
      .querySelectorAll(".avatar")
      .forEach((element) => {
        element.textContent =
          profile.avatar ||
          profile.name
            .charAt(0)
            .toUpperCase();
      });
  };

  /* ----------------------------------------------------------
     Profile Screen
     ---------------------------------------------------------- */

  window.renderProfile = function () {
    const profile =
      getProfile();

    const stats =
      getStatistics();

    setText(
      "profileName",
      profile.name
    );

    setText(
      "profileRating",
      profile.rating
    );

    setText(
      "profileGames",
      stats.gamesPlayed
    );

    setText(
      "profileWins",
      stats.gamesWon
    );

    setText(
      "profileLosses",
      stats.gamesLost
    );

    setText(
      "profileDraws",
      stats.gamesDrawn
    );

    setText(
      "profileStreak",
      stats.currentStreak
    );

    setText(
      "profileBestStreak",
      stats.bestStreak
    );

    setText(
      "profileCaptures",
      stats.totalCaptures
    );

    setText(
      "profileChecks",
      stats.totalChecks
    );

    setText(
      "profileWinRate",
      `${calculateWinRate(stats)}%`
    );

    /*
      Optional generic statistic elements.
      Useful if you add these IDs later.
    */

    setText(
      "localGames",
      stats.localGames
    );

    setText(
      "aiGames",
      stats.aiGames
    );

    setText(
      "onlineGames",
      stats.onlineGames
    );

    setText(
      "totalTurns",
      stats.totalTurns
    );
  };

  /* ----------------------------------------------------------
     Edit Profile
     ---------------------------------------------------------- */

  window.updatePlayerName = function (
    name
  ) {
    const cleanName =
      String(name || "").trim();

    if (!cleanName) {
      return getProfile();
    }

    const profile =
      saveProfile({
        name: cleanName,
        avatar:
          cleanName
            .charAt(0)
            .toUpperCase()
      });

    window.refreshDashboard();
    window.renderProfile();

    return profile;
  };

  window.updatePlayerAvatar = function (
    avatar
  ) {
    const cleanAvatar =
      String(avatar || "")
        .trim()
        .slice(0, 2);

    if (!cleanAvatar) {
      return getProfile();
    }

    const profile =
      saveProfile({
        avatar: cleanAvatar
      });

    window.refreshDashboard();
    window.renderProfile();

    return profile;
  };

  /* ----------------------------------------------------------
     Rating
     ---------------------------------------------------------- */

  window.updatePlayerRating = function (
    amount
  ) {
    const profile =
      getProfile();

    const rating =
      Math.max(
        0,
        Number(amount) || 0
      );

    const updated =
      saveProfile({
        ...profile,
        rating
      });

    window.refreshDashboard();
    window.renderProfile();

    return updated;
  };

  /* ----------------------------------------------------------
     Record Game Result
     ---------------------------------------------------------- */

  window.recordGameResult = function ({
    result,
    mode = "local",
    turns = 0,
    captures = 0,
    checks = 0
  } = {}) {
    const stats =
      getStatistics();

    stats.gamesPlayed += 1;

    stats.totalTurns +=
      Number(turns) || 0;

    stats.totalCaptures +=
      Number(captures) || 0;

    stats.totalChecks +=
      Number(checks) || 0;

    if (mode === "local") {
      stats.localGames += 1;
    }

    if (mode === "ai") {
      stats.aiGames += 1;
    }

    if (mode === "online") {
      stats.onlineGames += 1;
    }

    if (result === "win") {
      stats.gamesWon += 1;
      stats.currentStreak += 1;

      stats.bestStreak =
        Math.max(
          stats.bestStreak,
          stats.currentStreak
        );
    }

    if (result === "loss") {
      stats.gamesLost += 1;
      stats.currentStreak = 0;
    }

    if (result === "draw") {
      stats.gamesDrawn += 1;
      stats.currentStreak = 0;
    }

    stats.lastGameAt =
      new Date().toISOString();

    saveStatistics(stats);

    window.refreshDashboard();
    window.renderProfile();

    return stats;
  };

  /* ----------------------------------------------------------
     Reset Statistics
     ---------------------------------------------------------- */

  window.resetStatistics = function () {
    const confirmed =
      window.confirm(
        "Reset all chess statistics? This cannot be undone."
      );

    if (!confirmed) {
      return false;
    }

    const stats =
      saveStatistics({
        ...DEFAULT_STATS
      });

    window.refreshDashboard();
    window.renderProfile();

    return stats;
  };

  /* ----------------------------------------------------------
     Reset Profile
     ---------------------------------------------------------- */

  window.resetProfile = function () {
    const confirmed =
      window.confirm(
        "Reset your STEENE profile?"
      );

    if (!confirmed) {
      return false;
    }

    const profile =
      saveProfile({
        ...DEFAULT_PROFILE
      });

    window.refreshDashboard();
    window.renderProfile();

    return profile;
  };

  /* ----------------------------------------------------------
     Initialization
     ---------------------------------------------------------- */

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      window.refreshDashboard();
      window.renderProfile();
    }
  );

})();
