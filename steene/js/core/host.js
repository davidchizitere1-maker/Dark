/**
 * STEENE — steene/js/core/host.js
 * Platform orchestration for index.html: launching/exiting a game
 * inside the iframe, showing/hiding the two views it owns
 * ('dashboard' and 'game'), and syncing the authenticated session
 * into the game iframe via postMessage.
 *
 * Does NOT own hash routing itself — steene/js/core/router.js is the
 * single owner of that (see its file header). host.js only exposes
 * showView() for the router to call, and calls steeneRouter.navigateTo()
 * rather than touching window.location.hash directly.
 *
 * Does NOT render the game gallery — steene/js/views/dashboard.js owns
 * that, reading from window.gameRegistry.
 */

const steenePlatform = {
  currentGame: null,

  init() {
    // Default view before the router (which loads after this file)
    // reads the current hash and corrects it if needed.
    this.showView('dashboard');
  },

  /**
   * Activates the view whose section id is `view-${viewId}`, e.g.
   * showView('dashboard') → #view-dashboard. Only called by
   * steeneRouter — game code should call launchGame()/exitGame(),
   * or steeneRouter.navigateTo(), not this directly.
   */
  showView(viewId) {
    document.querySelectorAll('.steene-view').forEach(view => {
      view.classList.remove('active');
    });

    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add('active');
    }
  },

  /**
   * Loads a game into the iframe and switches to the Game Runner
   * view. Silently does nothing for a locked/"coming soon" game or
   * an id the registry doesn't recognize.
   */
  launchGame(gameId) {
    const game = window.gameRegistry ? window.gameRegistry.getById(gameId) : null;

    if (!game || game.status !== 'available' || !game.route) {
      return;
    }

    this.currentGame = game;

    const frame = document.getElementById('game-frame');
    const titleEl = document.getElementById('active-game-title');

    if (titleEl) titleEl.textContent = game.name;

    if (frame) {
      // Sync auth the instant the game finishes loading, in addition
      // to whenever auth state changes later (steeneAuth.setSession()
      // already calls syncAuthToIframe() on every change).
      frame.onload = () => {
        this.syncAuthToIframe(window.steeneAuth ? window.steeneAuth.currentSession : null);
      };
      frame.src = game.route;
    }

    if (typeof steeneAudioManager !== 'undefined') {
      steeneAudioManager.pauseForGame();
    }

    if (typeof steeneRouter !== 'undefined') {
      steeneRouter.navigateTo('game');
    } else {
      this.showView('game');
    }
  },

  /**
   * Unloads the game iframe (stopping any audio/timers running
   * inside it) and returns to the dashboard.
   */
  exitGame() {
    const frame = document.getElementById('game-frame');
    const titleEl = document.getElementById('active-game-title');

    if (frame) {
      frame.onload = null;
      frame.src = '';
    }
    if (titleEl) titleEl.textContent = 'Loading Game...';

    this.currentGame = null;

    if (typeof steeneAudioManager !== 'undefined') {
      steeneAudioManager.resumeHostTrack();
    }

    if (typeof steeneRouter !== 'undefined') {
      steeneRouter.navigateTo('dashboard');
    } else {
      this.showView('dashboard');
    }
  },

  /**
   * Posts the current Supabase session into the loaded game's
   * iframe. Called by steeneAuth.setSession() on every auth change,
   * and by launchGame()'s frame.onload above. A no-op if no game is
   * currently loaded — the games/shared/steene-session-bridge.js
   * listener on the receiving end simply never fires in that case.
   */
  syncAuthToIframe(session) {
    const frame = document.getElementById('game-frame');
    if (!frame || !frame.contentWindow || !this.currentGame) {
      return;
    }

    try {
      frame.contentWindow.postMessage(
        { type: 'STEENE_AUTH_SYNC', session: session || null },
        window.location.origin
      );
    } catch (err) {
      console.warn('STEENE: could not sync session to game iframe.', err);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  steenePlatform.init();

  if (typeof steeneAudioManager !== 'undefined') {
    steeneAudioManager.playHostTrack();
  }
});
