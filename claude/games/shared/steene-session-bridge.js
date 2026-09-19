/**
 * STEENE — games/shared/steene-session-bridge.js
 *
 * Receives the authenticated STEENE session from the platform shell
 * (steene/js/core/host.js posts it via postMessage when a game loads
 * inside the iframe, and again on every auth state change) and makes
 * it usable inside the game.
 *
 * ── WHAT A GAME GETS FROM THIS FILE ─────────────────────────────
 *   window.steeneSession   — the raw Supabase session object, or null
 *   window.steeneUser      — session.user, or null
 *   window.steeneClient    — an authenticated Supabase client, or
 *                             null until the game registers its
 *                             project credentials (see below) AND a
 *                             session exists
 *
 * A game can check `window.steeneUser` at any time; it updates live
 * if the player signs in/out of STEENE while the game is open.
 * Games are NOT required to use any of this — local/AI modes and
 * anonymous online rooms all work identically with no session.
 *
 * ── REGISTERING CREDENTIALS (no new hardcoded key) ──────────────
 * A game that already declares its own SUPABASE_URL / SUPABASE_ANON_KEY
 * constants (for its own anon-key REST calls) can hand them to this
 * bridge once, rather than a new file hardcoding the same pair again:
 *
 *   registerSteeneSupabaseCredentials(SUPABASE_URL, SUPABASE_ANON_KEY);
 *
 * Until a game calls this, window.steeneSession/steeneUser still
 * populate normally — only the extra authenticated client is skipped.
 *
 * Include this AFTER the Supabase CDN script and BEFORE the game's
 * own scripts, in <head> or high in <body>.
 */

(function () {
    "use strict";

    window.steeneSession = null;
    window.steeneUser = null;
    window.steeneClient = null;

    let _credentials = null; // { url, key } — supplied by the game itself
    const listeners = [];

    window.registerSteeneSupabaseCredentials = function (url, key) {
        if (!url || !key) return;
        _credentials = { url, key };
        tryBuildClient();
    };

    /**
     * Lets a game's own code react when the platform session arrives
     * or changes, instead of polling window.steeneUser.
     * Usage: window.onSteeneSessionChange(user => { ... });
     */
    window.onSteeneSessionChange = function (callback) {
        if (typeof callback === "function") {
            listeners.push(callback);
            // Fire immediately with current state so a late subscriber
            // (a script that loads after the first sync already
            // happened) doesn't miss it.
            callback(window.steeneUser);
        }
    };

    function tryBuildClient() {
        if (!window.steeneSession || !_credentials || !window.supabase) return;
        try {
            // Always a SEPARATE client from whatever anon-key client the
            // game's own code manages, so this never interferes with
            // existing anonymous online-room logic.
            window.steeneClient = window.supabase.createClient(_credentials.url, _credentials.key);
            window.steeneClient.auth.setSession(window.steeneSession);
        } catch (err) {
            console.warn("STEENE session bridge: could not build authenticated client.", err);
            window.steeneClient = null;
        }
    }

    function applySession(session) {
        window.steeneSession = session || null;
        window.steeneUser = session ? session.user : null;
        window.steeneClient = null;

        if (session) {
            tryBuildClient();
        }

        listeners.forEach(fn => {
            try { fn(window.steeneUser); } catch (err) { console.warn("STEENE session listener error:", err); }
        });
    }

    window.addEventListener("message", event => {
        // The platform loads games same-origin via a plain path (not a
        // separate domain), so this is a same-origin check, not
        // cross-origin messaging.
        if (event.origin !== window.location.origin) return;
        if (!event.data || event.data.type !== "STEENE_AUTH_SYNC") return;

        applySession(event.data.session || null);
    });

    // If this game was opened directly (not inside the platform
    // iframe), there is no parent posting to us — steeneUser simply
    // stays null, which every game already treats as "anonymous", so
    // nothing breaks when a game is opened standalone during
    // development.
})();
