/* ==========================================================
   STEENE PLATFORM HOST
   steene/js/core/host.js
   ========================================================== */

const steenePlatform = {
    currentGame: null,
    previousView: 'dashboard',
    isGameLoading: false,

    /*
     * The router may use "game", while the actual HTML section
     * is named "view-game-runner".
     */
    viewAliases: {
        game: 'game-runner',
        runner: 'game-runner',
        games: 'dashboard',
        home: 'dashboard'
    },

    init() {
        this.bindGlobalEvents();
        this.showView('dashboard');
    },

    bindGlobalEvents() {
        window.addEventListener('message', (event) => {
            this.handleGameMessage(event);
        });

        window.addEventListener('beforeunload', () => {
            this.clearGameFrame();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.currentGame) {
                this.exitGame();
            }
        });
    },

    normalizeViewId(viewId) {
        return this.viewAliases[viewId] || viewId;
    },

    /**
     * Activates a STEENE view.
     *
     * Examples:
     * showView('dashboard')     -> #view-dashboard
     * showView('game')          -> #view-game-runner
     * showView('game-runner')   -> #view-game-runner
     */
    showView(viewId) {
        const normalizedViewId = this.normalizeViewId(viewId);

        document.querySelectorAll('.steene-view').forEach((view) => {
            view.classList.remove('active');
            view.setAttribute('aria-hidden', 'true');
        });

        const target = document.getElementById(
            `view-${normalizedViewId}`
        );

        if (!target) {
            console.warn(
                `STEENE: view "${normalizedViewId}" was not found.`
            );
            return false;
        }

        target.classList.add('active');
        target.setAttribute('aria-hidden', 'false');

        this.updateNavigationState(normalizedViewId);

        return true;
    },

    updateNavigationState(viewId) {
        const navView = viewId === 'game-runner'
            ? 'dashboard'
            : viewId;

        document.querySelectorAll('[data-nav]').forEach((item) => {
            item.classList.toggle(
                'active',
                item.dataset.nav === navView
            );
        });
    },

    /**
     * Loads a registered game into the game iframe.
     */
    launchGame(gameId) {
        const registry = window.gameRegistry;
        const game = registry && typeof registry.getById === 'function'
            ? registry.getById(gameId)
            : null;

        if (!game) {
            console.warn(`STEENE: game "${gameId}" was not found.`);
            return false;
        }

        if (game.status !== 'available' || !game.route) {
            console.warn(
                `STEENE: game "${gameId}" is not currently available.`
            );
            return false;
        }

        const frame = document.getElementById('game-frame');
        const titleElement = document.getElementById(
            'active-game-title'
        );

        if (!frame) {
            console.error(
                'STEENE: #game-frame was not found.'
            );
            return false;
        }

        this.previousView = 'dashboard';
        this.currentGame = game;
        this.isGameLoading = true;

        frame.classList.add('is-loading');
        frame.setAttribute(
            'aria-label',
            `${game.name} game`
        );

        if (titleElement) {
            titleElement.textContent = game.name;
        }

        this.setGameLoadingState(true);

        frame.onload = () => {
            this.isGameLoading = false;
            frame.classList.remove('is-loading');
            this.setGameLoadingState(false);

            const session =
                window.steeneAuth &&
                window.steeneAuth.currentSession
                    ? window.steeneAuth.currentSession
                    : null;

            this.syncAuthToIframe(session);
            this.syncSettingsToIframe();
        };

        frame.onerror = () => {
            this.isGameLoading = false;
            frame.classList.remove('is-loading');
            this.setGameLoadingState(false);

            console.error(
                `STEENE: failed to load game "${game.name}".`
            );

            this.showGameError(
                'This game could not be loaded. Please try again.'
            );
        };

        /*
         * Resolve routes relative to the current page while still
         * allowing absolute URLs from the registry.
         */
        frame.src = this.resolveGameRoute(game.route);

        const audioManager = window.steeneAudioManager;

        if (
            audioManager &&
            typeof audioManager.pauseForGame === 'function'
        ) {
            audioManager.pauseForGame();
        }

        const router = window.steeneRouter;

        if (
            router &&
            typeof router.navigateTo === 'function'
        ) {
            router.navigateTo('game');
        } else {
            this.showView('game');
        }

        return true;
    },

    resolveGameRoute(route) {
        try {
            return new URL(
                route,
                window.location.href
            ).href;
        } catch (error) {
            return route;
        }
    },

    setGameLoadingState(isLoading) {
        const runner = document.getElementById(
            'view-game-runner'
        );

        if (!runner) return;

        runner.classList.toggle('game-is-loading', isLoading);
        runner.setAttribute(
            'aria-busy',
            String(isLoading)
        );
    },

    showGameError(message) {
        const runner = document.getElementById(
            'view-game-runner'
        );

        if (!runner) return;

        let errorElement = document.getElementById(
            'game-load-error'
        );

        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'game-load-error';
            errorElement.className = 'game-load-error';

            runner.prepend(errorElement);
        }

        errorElement.textContent = message;
        errorElement.hidden = false;
    },

    hideGameError() {
        const errorElement = document.getElementById(
            'game-load-error'
        );

        if (errorElement) {
            errorElement.hidden = true;
        }
    },

    /**
     * Unloads the current game and returns to the dashboard.
     */
    exitGame() {
        this.clearGameFrame();

        const titleElement = document.getElementById(
            'active-game-title'
        );

        if (titleElement) {
            titleElement.textContent = 'Game';
        }

        this.currentGame = null;
        this.isGameLoading = false;

        this.hideGameError();
        this.setGameLoadingState(false);

        const audioManager = window.steeneAudioManager;

        if (
            audioManager &&
            typeof audioManager.resumeHostTrack === 'function'
        ) {
            audioManager.resumeHostTrack();
        }

        const router = window.steeneRouter;

        if (
            router &&
            typeof router.navigateTo === 'function'
        ) {
            router.navigateTo('dashboard');
        } else {
            this.showView('dashboard');
        }
    },

    clearGameFrame() {
        const frame = document.getElementById('game-frame');

        if (!frame) return;

        frame.onload = null;
        frame.onerror = null;

        /*
         * Removing the src stops timers, audio, and JavaScript
         * running inside the previous game.
         */
        frame.src = '';
        frame.classList.remove('is-loading');
    },

    /**
     * Sends the current Supabase session to the active game.
     */
    syncAuthToIframe(session) {
        const frame = document.getElementById('game-frame');

        if (
            !frame ||
            !frame.contentWindow ||
            !this.currentGame
        ) {
            return;
        }

        this.postMessageToGame({
            type: 'STEENE_AUTH_SYNC',
            session: session || null
        });
    },

    /**
     * Sends user settings to the active game.
     */
    syncSettingsToIframe() {
        const frame = document.getElementById('game-frame');

        if (
            !frame ||
            !frame.contentWindow ||
            !this.currentGame
        ) {
            return;
        }

        const settings =
            window.steeneSettingsView &&
            window.steeneSettingsView._settings
                ? window.steeneSettingsView._settings
                : null;

        if (!settings) return;

        this.postMessageToGame({
            type: 'STEENE_SETTINGS_SYNC',
            settings
        });
    },

    postMessageToGame(message) {
        const frame = document.getElementById('game-frame');

        if (
            !frame ||
            !frame.contentWindow ||
            !this.currentGame
        ) {
            return false;
        }

        try {
            frame.contentWindow.postMessage(
                message,
                window.location.origin
            );

            return true;
        } catch (error) {
            console.warn(
                'STEENE: could not communicate with game iframe.',
                error
            );

            return false;
        }
    },

    /**
     * Handles optional messages sent by games to the host.
     */
    handleGameMessage(event) {
        if (event.origin !== window.location.origin) {
            return;
        }

        const frame = document.getElementById('game-frame');

        if (
            !frame ||
            event.source !== frame.contentWindow
        ) {
            return;
        }

        const message = event.data;

        if (!message || typeof message !== 'object') {
            return;
        }

        switch (message.type) {
            case 'STEENE_GAME_READY':
                this.syncAuthToIframe(
                    window.steeneAuth
                        ? window.steeneAuth.currentSession
                        : null
                );

                this.syncSettingsToIframe();
                break;

            case 'STEENE_EXIT_GAME':
                this.exitGame();
                break;

            case 'STEENE_REQUEST_AUTH':
                this.syncAuthToIframe(
                    window.steeneAuth
                        ? window.steeneAuth.currentSession
                        : null
                );
                break;

            default:
                break;
        }
    }
};

window.steenePlatform = steenePlatform;

window.addEventListener('DOMContentLoaded', () => {
    steenePlatform.init();

    const audioManager = window.steeneAudioManager;

    if (
        audioManager &&
        typeof audioManager.playHostTrack === 'function'
    ) {
        audioManager.playHostTrack();
    }
});
