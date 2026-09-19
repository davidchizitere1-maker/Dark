/* ==========================================================
   STEENE — src/api/online.js
   Online multiplayer for Chess.

   ── FIX APPLIED THIS PASS ────────────────────────────────
   The live version of this file used `export async function ...`
   — ES module syntax — inside a plain <script> tag (index.html does
   not load it with type="module"). That is a SyntaxError: the
   entire file fails to parse, so NONE of its code ever actually ran.
   It also pointed at a nonexistent `http://localhost:3000/api`
   backend, unrelated to anything else in this project (there is no
   Chess equivalent of Barricade's `multiplayer_rooms` Supabase
   table).

   Real Chess online multiplayer isn't built yet — that's a genuine
   feature to implement later (a `chess_rooms` table, realtime sync,
   the same kind of heartbeat/disconnect handling Barricade's
   src/api/online.js has), not something to invent silently inside a
   directory-structure refactor. What this file does now is be
   honest and non-breaking: it defines window.createOnlineRoom /
   window.joinOnlineRoom directly (so this is the actual source of
   truth, rather than relying on index.html's `window.x || fallback`
   guard to paper over a script that failed to load) and clearly
   reports that online play isn't available yet, matching what the
   UI already told players before this fix — just without the
   silent console error underneath it.
   ========================================================== */

function setOnlineStatus(message) {
  const status = document.getElementById("onlineStatus");

  if (status) {
    status.textContent = message;
  }
}

window.createOnlineRoom = function () {
  setOnlineStatus(
    "Online multiplayer is not configured yet for Chess."
  );
};

window.joinOnlineRoom = function () {
  setOnlineStatus(
    "Online multiplayer is not configured yet for Chess."
  );
};

/* Games launched in "online" mode (none currently reachable through
   the UI, since the Online Multiplayer modal only ever shows the
   "not configured yet" message above) would report results tagged
   mode: "online" in endGame() — src/game/board.js already handles
   that branch defensively via `typeof window.onlinePlayer === "function"`,
   so this file intentionally does not need to define that function
   until real online play exists. */
