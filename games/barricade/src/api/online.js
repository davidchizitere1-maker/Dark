/* ==========================================================
   STEENE — src/api/online.js
   Online Multiplayer: room create/join, realtime move sync, private
   per-player target handshake, and network-observer disconnect
   detection (heartbeat-based — works even though anon-key REST
   access has no persistent socket to hook into for presence).

   ── FIXES IN THIS PASS ──────────────────────────────────────
   1) Winner's own stats/confetti/sound/AI-log were double-firing.
      Supabase Realtime echoes a client's own writes back to itself,
      so the winner's client received its own "phase: over" update a
      second time and re-ran doWin(). Fixed with a phase-transition
      guard in applyOnlineState() — see the comment there.
   2) The disconnect detector had zero hysteresis: one stale 3s poll
      (ordinary jitter, a throttled background tab, one slow fetch)
      was enough to pop the "Opponent Disconnected" modal. Now
      requires 2 consecutive stale checks before opening it, and
      immediately re-pings on tab focus so briefly backgrounding the
      app doesn't get misread as a drop.
   3) Leaving mid-game via the disconnect modal's "Leave Game" button
      wiped online.roomId before the leave notice could be sent, so
      the opponent never got told and just sat through the full
      heartbeat timeout instead. leaveOnlineGame() now notifies first.
   4) Closing/refreshing the tab outright had no notification at all
      — the opponent only ever found out via heartbeat timeout
      (~30s+). Added a best-effort pagehide notice.
   5) Removed a duplicate confirmRoomOptions()/readRoomOptionsForm()
      that read form field IDs which don't exist in index.html — it
      only "worked" because interface.js's correct version happened
      to load after this one and silently shadow it. Single source
      of truth now lives in interface.js.
   ========================================================== */

const SUPABASE_URL = 'https://igavamrvcjtpulawjgzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYXZhbXJ2Y2p0cHVsYXdqZ3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDk0NTEsImV4cCI6MjEwMjcyNTQ1MX0.Zl_FAW7oLnGMggGo3H-Tb5nYUxNVnfZtdzzVfpccYBk';

/* ── MATCH LOGGING (Local Multiplayer + AI Opponent + Online) ─
   Mode is tagged from online.enabled at call time so online matches
   no longer get mislabeled as 'local' in the shared games table. */
async function logGameToSupabase(winner) {
  try {
    const targetIdx = tgts => tgts.map(t => t.r * G.boardSize + t.c);
    const mode = G.aiMode ? 'ai' : (online.enabled ? 'online' : 'local');
    const payload = {
      difficulty: G.aiMode ? G.aiDifficulty : null,
      mode: mode,
      winner: winner,
      turn_count: G.turns,
      jump_count: G.jumps,
      wall_count: G.wallsPlaced,
      white_targets: targetIdx(G.targets.white),
      blue_targets: targetIdx(G.targets.blue),
      moves: G.moveLog,
      board_size: G.boardSize
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) console.warn('Game log failed:', res.status, await res.text());
  } catch (e) {
    console.warn('Game log error (non-blocking):', e);
  }
}

let online = {
  enabled: false,
  role: null,          // 'host' or 'guest'
  roomId: null,
  roomCode: null,
  channel: null,
  clientId: null,
  applyingRemote: false,
  roomConfig: null      // {boardSize, pieceMode, timerEnabled, timerSeconds}
};

function onlinePlayer()   { return online.role === 'host' ? 'white' : 'blue'; }
function onlineOpponent() { return onlinePlayer() === 'white' ? 'blue' : 'white'; }
function isOnlineTurn()   { return !online.enabled || G.turn === onlinePlayer(); }

/* NOTE: 'targets' is intentionally excluded from this snapshot — it's
   broadcast to BOTH players via the shared 'state' column on every
   move/wall, so including secret targets here would let either
   player read the opponent's targets straight out of the synced
   JSON. Targets sync separately via host_targets/guest_targets. */
function onlineSnapshot() {
  return {
    pos: JSON.parse(JSON.stringify(G.pos)),
    wallStock: JSON.parse(JSON.stringify(G.wallStock)),
    hwalls: JSON.parse(JSON.stringify(G.hwalls)),
    vwalls: JSON.parse(JSON.stringify(G.vwalls)),
    blockedEdges: [...G.blockedEdges],
    turn: G.turn,
    phase: G.phase,
    turns: G.turns,
    jumps: G.jumps,
    wallsPlaced: G.wallsPlaced,
    moveLog: JSON.parse(JSON.stringify(G.moveLog || []))
  };
}

async function createOnlineRoom(config) {
  config = config || { boardSize: 10, pieceMode: 2, timerEnabled: false, timerSeconds: 45 };
  const clientId = crypto.randomUUID();
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const initialState = { ...onlineSnapshot(), phase: 'waiting' };

  const {data, error} = await fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      room_code: roomCode,
      status: 'waiting',
      host_id: clientId,
      state: initialState,
      config: config,
      host_last_ping: new Date().toISOString()
    })
  }).then(async res => {
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json(), error: null };
  }).catch(error => ({ data: null, error }));

  if (error) {
    console.error('Create room failed:', error);
    return null;
  }

  if (!data || !data.length) {
    console.error('Create room: insert returned no row — check that the anon role has a SELECT policy on multiplayer_rooms in Supabase RLS.');
    return null;
  }

  online.enabled = true;
  online.role = 'host';
  online.roomId = data[0].id;
  online.roomCode = roomCode;
  online.clientId = clientId;
  online.roomConfig = config;

  return roomCode;
}

async function joinOnlineRoom(roomCode) {
  roomCode = roomCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
    return {ok: false, error: 'Room code must contain 6 characters.'};
  }

  const clientId = crypto.randomUUID();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/multiplayer_rooms?room_code=eq.${encodeURIComponent(roomCode)}&status=eq.waiting&select=*`,
    { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!response.ok) return {ok: false, error: 'Could not find the room.'};

  const rooms = await response.json();
  if (!rooms.length) return {ok: false, error: 'Room not found or the game has already started.'};

  const room = rooms[0];

  const updateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${room.id}&status=eq.waiting`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ guest_id: clientId, status: 'playing', guest_last_ping: new Date().toISOString() })
    }
  );
  if (!updateResponse.ok) return {ok: false, error: 'Could not join the room — someone may have just joined first.'};

  online.enabled = true;
  online.role = 'guest';
  online.roomId = room.id;
  online.roomCode = roomCode;
  online.clientId = clientId;
  online.roomConfig = room.config || { boardSize: 10, pieceMode: 2, timerEnabled: false, timerSeconds: 45 };

  return {ok: true};
}

async function connectOnlineRealtime() {
  if (!online.roomId) return;
  if (!window.supabase) { console.error('Supabase client library is not loaded.'); return; }

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  online.channel = supabaseClient
    .channel(`steene-room-${online.roomId}`)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${online.roomId}` },
      payload => {
        if (!payload.new || online.applyingRemote) return;

        // Explicit confirmed exit — instant forfeit, no grace period.
        if (payload.new.left_by && payload.new.left_by !== online.role && G.phase === 'playing') {
          clearReconnectGrace();
          triggerForfeitWin();
          return;
        }

        const state = payload.new.state;
        if (!state || !state.pos) return;
        applyOnlineState(state);
      }
    )
    .subscribe(status => console.log('Online Realtime status:', status));

  startHeartbeat();
}

/* applyOnlineState() re-applies a synced board state and, if that
   state says the match just ended, fires doWin() for this client too.

   BUG FIXED: Realtime echoes a client's own writes back to itself.
   The winner's client used to receive its own "phase: over" update a
   second time here and call doWin() again — double-counting stats,
   confetti, sound, and the AI-learning log entry, since doWin() only
   gated its OWN syncOnlineState() call on applyingRemote, not
   anything else it does. The fix: only treat this as a genuine
   game-over EVENT (and call doWin()) on the transition into 'over' —
   i.e. only if G.phase wasn't already 'over' before this update
   arrived. The winner's echoed update arrives after their own doWin()
   already set G.phase = 'over' locally, so it's now correctly
   ignored; the loser's client (which was still 'playing') still
   fires doWin() exactly once, as intended. */
function applyOnlineState(state) {
  if (!state) return;
  const wasAlreadyOver = G.phase === 'over';
  online.applyingRemote = true;

  G.pos = JSON.parse(JSON.stringify(state.pos));
  G.wallStock = JSON.parse(JSON.stringify(state.wallStock));
  G.hwalls = JSON.parse(JSON.stringify(state.hwalls));
  G.vwalls = JSON.parse(JSON.stringify(state.vwalls));
  G.blockedEdges = new Set(state.blockedEdges || []);
  G.turn = state.turn;
  G.phase = state.phase;
  G.turns = state.turns;
  G.jumps = state.jumps;
  G.wallsPlaced = state.wallsPlaced;
  G.moveLog = JSON.parse(JSON.stringify(state.moveLog || []));
  G.sel = null;
  G.animating = false;

  render();
  updateTurnIndicator();
  setActionMode('move');
  if (typeof refreshTurnTimer === 'function') refreshTurnTimer();

  online.applyingRemote = false;

  if (state.phase === 'over' && !wasAlreadyOver) {
    const winner = checkWin('white') ? 'white' : checkWin('blue') ? 'blue' : null;
    if (winner) doWin(winner);
  }
}

async function syncOnlineState() {
  if (!online.enabled || !online.roomId || online.applyingRemote) return;
  const state = onlineSnapshot();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ state: state, status: state.phase === 'over' ? 'finished' : 'playing' })
  });

  if (!response.ok) console.error('Online sync failed:', await response.text());
}

/* ── ROOM LIFECYCLE UI ORCHESTRATION ──────────────────────── */
let onlinePollTimer = null;

function openOnlineModal() {
  showOnlineChoiceView();
  id('onlineModal').classList.add('open');
}

function closeOnlineModal() {
  if (online.enabled && online.role === 'host' && (!G.phase || G.phase !== 'playing')) {
    cancelOnlineRoom();
    return;
  }
  id('onlineModal').classList.remove('open');
}

function showOnlineChoiceView() {
  id('onlineChoiceView').style.display = 'block';
  const opt = id('onlineOptionsView'); if (opt) opt.style.display = 'none';
  id('onlineJoinView').style.display = 'none';
  id('onlineWaitView').style.display = 'none';
}

function showJoinRoomView() {
  id('onlineChoiceView').style.display = 'none';
  const opt = id('onlineOptionsView'); if (opt) opt.style.display = 'none';
  id('onlineJoinView').style.display = 'block';
  id('onlineWaitView').style.display = 'none';
  const err = id('onlineJoinError'); err.style.display = 'none'; err.textContent = '';
  id('joinCodeInput').value = '';
  setTimeout(() => id('joinCodeInput').focus(), 50);
}

function showRoomOptionsView() {
  id('onlineChoiceView').style.display = 'none';
  id('onlineOptionsView').style.display = 'block';
  id('onlineJoinView').style.display = 'none';
  id('onlineWaitView').style.display = 'none';
}

/* confirmRoomOptions() intentionally NOT defined here anymore.
   interface.js owns the single, correct implementation (it reads
   #roomTimerInput / #roomBoardSize / #roomBoardTheme / #roomPieceMode
   — the actual elements in index.html) and calls hostOnlineGame()
   below directly. This file previously had its own duplicate that
   read #roomTimerSel and radio-button groups that don't exist in the
   HTML; it only "worked" because interface.js's script tag loads
   after this one and silently overwrote it. Keeping two definitions
   of the same function name across files is a landmine — if the
   load order ever changes, room creation silently starts using
   wrong/default board size, piece mode, theme, and timer duration. */

async function hostOnlineGame(config) {
  // onlineSnapshot() (inside createOnlineRoom) reads G.pos etc. — G
  // must be populated first, or JSON.stringify(undefined) silently
  // returns undefined and the following JSON.parse throws.
  newGame(config);
  if (typeof applyBoardTheme === 'function') applyBoardTheme(config.boardTheme || config.theme);

  id('onlineChoiceView').style.display = 'none';
  const opt = id('onlineOptionsView'); if (opt) opt.style.display = 'none';
  id('onlineJoinView').style.display = 'none';
  id('onlineWaitView').style.display = 'block';
  id('onlineRoomCode').textContent = '------';
  const statusEl = id('onlineWaitStatus');
  statusEl.textContent = '⏳ Creating room…';
  statusEl.className = 'ai-learn-status';

  const code = await createOnlineRoom(config);
  if (!code) {
    statusEl.textContent = '❌ Could not create a room. Try again.';
    statusEl.className = 'ai-learn-status offline';
    return;
  }
  id('onlineRoomCode').textContent = code;
  statusEl.textContent = '⏳ Waiting for opponent to join…';
  statusEl.className = 'ai-learn-status';

  pollForGuest();
}

function pollForGuest() {
  clearInterval(onlinePollTimer);
  onlinePollTimer = setInterval(async () => {
    if (!online.roomId) return;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}&select=status,guest_id`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) return;
      const rows = await res.json();
      const room = rows[0];
      if (room && room.guest_id) {
        clearInterval(onlinePollTimer);
        const statusEl = id('onlineWaitStatus');
        statusEl.textContent = '✅ Opponent joined! Starting…';
        statusEl.className = 'ai-learn-status ready';
        setTimeout(() => {
          id('onlineModal').classList.remove('open');
          beginOnlineGame();
        }, 600);
      }
    } catch (e) { console.warn('Guest-join poll error (non-blocking):', e); }
  }, 2000);
}

function cancelOnlineRoom() {
  clearInterval(onlinePollTimer);
  stopHeartbeat();
  if (online.roomId) {
    fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    }).catch(() => {});
  }
  online = { enabled: false, role: null, roomId: null, roomCode: null, channel: null, clientId: null, applyingRemote: false, roomConfig: null };
  id('onlineModal').classList.remove('open');
  showOnlineChoiceView();
}

async function attemptJoinRoom() {
  const codeInput = id('joinCodeInput');
  const err = id('onlineJoinError');
  const code = codeInput.value.trim().toUpperCase();
  err.style.display = 'none';

  if (!/^[A-Z0-9]{6}$/.test(code)) {
    err.textContent = 'Enter the 6-character room code.';
    err.style.display = 'block';
    return;
  }

  const result = await joinOnlineRoom(code);
  if (!result.ok) {
    err.textContent = result.error || 'Could not join that room.';
    err.style.display = 'block';
    return;
  }

  id('onlineModal').classList.remove('open');
  beginOnlineGame();
}

/* Called once both host and guest are present. Builds a fresh local
   game using the room's config (board size, piece mode, timer),
   applies the matching theme, wires up realtime + heartbeat, and
   routes into the private per-player target handshake since online
   players are on separate devices (no shared "pass device" step). */
function beginOnlineGame() {
  const roomCfg = online.roomConfig || { boardSize: 10, pieceMode: 2, timerEnabled: false, timerSeconds: 45 };
  newGame(roomCfg);
  G.aiMode = false;
  online.applyingRemote = false;
  if (typeof applyBoardTheme === 'function') applyBoardTheme(roomCfg.boardTheme || roomCfg.theme);

  goTo('game');
  setTimeout(() => {
    buildBoard(); render(); updateTurnIndicator(); setActionMode('move');
    id('evLog').innerHTML = ''; id('victOv').classList.remove('open');
    connectOnlineRealtime();
    const myRole = onlinePlayer();
    setInstr(`Connected — you are ${pretty(myRole)}. Choose your secret targets.`);
    setTimeout(() => openTargetModal(myRole), 300);
  }, 60);
}

/* ── PRIVATE TARGET HANDSHAKE ─────────────────────────────── */
async function syncOnlineTargets() {
  if (!online.enabled || !online.roomId) return;
  const col = online.role === 'host' ? 'host_targets' : 'guest_targets';
  const myTargets = G.targets[onlinePlayer()];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ [col]: myTargets })
    });
    if (!res.ok) console.warn('Target sync failed:', res.status, await res.text());
  } catch (e) { console.warn('Target sync error (non-blocking):', e); }
}

function pollForOpponentTargets() {
  clearInterval(onlinePollTimer);
  onlinePollTimer = setInterval(async () => {
    if (!online.roomId) return;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}&select=host_targets,guest_targets`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) return;
      const rows = await res.json();
      const room = rows[0];
      if (room && room.host_targets && room.guest_targets) {
        clearInterval(onlinePollTimer);
        G.targets.white = room.host_targets;
        G.targets.blue  = room.guest_targets;
        beginPlayOnline();
      }
    } catch (e) { console.warn('Target poll error (non-blocking):', e); }
  }, 1500);
}

function beginPlayOnline() {
  G.phase = 'playing'; G.turn = 'white';
  render(); updateTurnIndicator(); setActionMode('move');
  if (typeof refreshTurnTimer === 'function') refreshTurnTimer();
  logEv('🎮 Both players ready — White moves first.', '');
  setInstr(isOnlineTurn() ? 'Select a piece to move.' : "Waiting for opponent's move…");
}

/* ── NETWORK OBSERVER (heartbeat-based disconnect detection) ──
   Presence-style detection isn't available over plain REST, so this
   uses a simple heartbeat instead: each client PATCHes its own
   last-ping column every 4s while a match is live. If the opponent's
   last ping goes stale (>9s old) on TWO CONSECUTIVE checks (~6s
   apart), that's treated as a dropped connection and a 20-second
   reconnect grace window opens — runs on its own independent clock,
   so it never pauses the normal per-move turn timer. If the
   opponent's ping becomes fresh again, the grace window cancels
   automatically.

   Requiring two consecutive stale checks (instead of one) adds
   roughly 3-6 extra seconds of detection latency in exchange for not
   popping the "opponent disconnected" modal on a single slow fetch,
   one momentary network hiccup, or a mobile tab that got throttled
   for a couple seconds in the background — previously, any one of
   those alone was enough to trigger it. */
let heartbeatSendTimer = null;
let heartbeatCheckTimer = null;
let staleChecksInARow = 0;

function startHeartbeat() {
  stopHeartbeat();
  staleChecksInARow = 0;
  const col = online.role === 'host' ? 'host_last_ping' : 'guest_last_ping';
  const peerCol = online.role === 'host' ? 'guest_last_ping' : 'host_last_ping';

  const sendPing = () => {
    if (!online.enabled || !online.roomId) return;
    fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ [col]: new Date().toISOString() })
    }).catch(() => {});
  };

  heartbeatSendTimer = setInterval(sendPing, 4000);

  // Immediately re-ping the instant this tab regains focus/visibility.
  // Mobile browsers throttle or pause setInterval timers in
  // backgrounded tabs, so a brief app-switch can otherwise leave our
  // own heartbeat stale for longer than the opponent's check window
  // expects — making a still-connected player look disconnected on
  // the OTHER side. One extra listener, harmless if added twice since
  // stopHeartbeat() below removes it.
  document.addEventListener('visibilitychange', onVisibilityPing);
  window.addEventListener('focus', onVisibilityPing);

  heartbeatCheckTimer = setInterval(async () => {
    if (!online.enabled || !online.roomId || G.phase !== 'playing') return;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}&select=${peerCol}`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) return;
      const rows = await res.json();
      const lastPing = rows[0] ? rows[0][peerCol] : null;
      if (!lastPing) return;

      const ageMs = Date.now() - new Date(lastPing).getTime();
      if (ageMs > 9000) {
        staleChecksInARow++;
        if (staleChecksInARow >= 2) startReconnectGrace();
      } else {
        staleChecksInARow = 0;
        clearReconnectGrace();
      }
    } catch (e) { /* transient — don't panic on a single failed check */ }
  }, 3000);
}

function onVisibilityPing() {
  if (document.visibilityState && document.visibilityState !== 'visible') return;
  if (!online.enabled || !online.roomId || online.role === null) return;
  const col = online.role === 'host' ? 'host_last_ping' : 'guest_last_ping';
  fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ [col]: new Date().toISOString() })
  }).catch(() => {});
}

function stopHeartbeat() {
  if (heartbeatSendTimer) { clearInterval(heartbeatSendTimer); heartbeatSendTimer = null; }
  if (heartbeatCheckTimer) { clearInterval(heartbeatCheckTimer); heartbeatCheckTimer = null; }
  document.removeEventListener('visibilitychange', onVisibilityPing);
  window.removeEventListener('focus', onVisibilityPing);
  staleChecksInARow = 0;
}

/* ── RECONNECT GRACE WINDOW ──────────────────────────────────
   20 seconds of "waiting for opponent to reconnect", fully
   independent of refreshTurnTimer()'s per-move countdown. */
let reconnectGraceActive = false;
let reconnectGraceRemaining = 0;
let reconnectGraceInterval = null;

function startReconnectGrace() {
  if (reconnectGraceActive) return;
  reconnectGraceActive = true;
  reconnectGraceRemaining = 20;
  if (typeof showNetworkDisconnectModal === 'function') showNetworkDisconnectModal();
  renderReconnectGrace();

  reconnectGraceInterval = setInterval(() => {
    reconnectGraceRemaining--;
    renderReconnectGrace();
    if (reconnectGraceRemaining <= 0) {
      clearReconnectGrace();
      if (G.phase === 'playing') triggerForfeitWin();
    }
  }, 1000);
}

function renderReconnectGrace() {
  if (typeof updateDisconnectTimerDisplay === 'function') {
    updateDisconnectTimerDisplay(Math.max(0, reconnectGraceRemaining));
  }
}

function clearReconnectGrace() {
  reconnectGraceActive = false;
  staleChecksInARow = 0;
  if (reconnectGraceInterval) { clearInterval(reconnectGraceInterval); reconnectGraceInterval = null; }
  if (typeof hideNetworkDisconnectModal === 'function') hideNetworkDisconnectModal();
}

/* ── EXPLICIT LEAVE / FORFEIT ─────────────────────────────── */
async function markOnlineLeave() {
  if (!online.enabled || !online.roomId || G.phase !== 'playing') return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ left_by: online.role })
    });
  } catch (e) { console.warn('markOnlineLeave failed (non-blocking):', e); }
}

/* Best-effort notice when the tab is actually closing (close tab,
   refresh, hard navigation) rather than just navigating between
   in-app screens. `pagehide` fires reliably in these cases (unlike
   `beforeunload` on mobile); `fetch(..., {keepalive:true})` lets the
   request survive the page unload, similar to sendBeacon but usable
   with PATCH. Without this, closing the tab mid-game gave the
   opponent zero notice — they'd only find out ~30s later via the
   heartbeat timeout. This is still best-effort (no guarantee of
   delivery), so the heartbeat/grace-window path remains the backstop. */
window.addEventListener('pagehide', () => {
  if (!online.enabled || !online.roomId || G.phase !== 'playing') return;
  try {
    fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ left_by: online.role }),
      keepalive: true
    });
  } catch (e) { /* best-effort only */ }
});

function triggerForfeitWin() {
  G.phase = 'over';
  if (typeof stopTurnTimer === 'function') stopTurnTimer();
  clearReconnectGrace();
  logEv('🚩 Your opponent left the match.', 'err');
  id('victTitle').textContent = 'Opponent Left — You Win!';
  id('victStats').innerHTML = `<div class="vs"><span class="vs-val">🏳️</span><span class="vs-lbl">Forfeit Win</span></div>`;
  id('victOv').classList.add('open');
  doConfetti();
}

/* Resets local online state after a finished match without deleting
   the shared room row — cancelOnlineRoom() (DELETE) is only for a
   host bailing out of an empty waiting room before anyone's joined.

   BUG FIXED: this used to wipe `online` (including roomId) BEFORE
   any leave notice could go out. goTo()'s call to markOnlineLeave()
   happens right after, but by then online.roomId is already null, so
   markOnlineLeave() silently no-ops — meaning clicking "Leave Game"
   during an active disconnect-grace window never actually told the
   opponent, who'd just sit through their own full heartbeat timeout
   instead. Now notifies first, then tears down. */
function leaveOnlineGame() {
  markOnlineLeave();
  clearInterval(onlinePollTimer);
  stopHeartbeat();
  if (typeof stopTurnTimer === 'function') stopTurnTimer();
  clearReconnectGrace();
  if (online.channel) { try { online.channel.unsubscribe(); } catch (e) {} }
  online = { enabled: false, role: null, roomId: null, roomCode: null, channel: null, clientId: null, applyingRemote: false, roomConfig: null };
}
