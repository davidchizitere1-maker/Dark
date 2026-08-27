/* ==========================================================
   STEENE — src/API/online.js
   Online Multiplayer: room create/join, realtime move sync, private
   per-player target handshake, and network-observer disconnect
   detection (heartbeat-based — works even though anon-key REST
   access has no persistent socket to hook into for presence).
   ========================================================== */

const SUPABASE_URL = 'https://igavamrvcjtpulawjgzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYXZhbXJ2Y2p0cHVsYXdqZ3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDk0NTEsImV4cCI6MjEwMjcyNTQ1MX0.Zl_FAW7oLnGMggGo3H-Tb5nYUxNVnfZtdzzVfpccYBk';

/* ── MATCH LOGGING (Local Multiplayer + AI Opponent) ─────────
   Online Multiplayer matches don't log here — see multiplayer_rooms
   instead. This feeds the games table used for AI shared learning. */
async function logGameToSupabase(winner) {
  try {
    const targetIdx = tgts => tgts.map(t => t.r * G.boardSize + t.c);
    const payload = {
      difficulty: G.aiMode ? G.aiDifficulty : null,
      mode: G.aiMode ? 'ai' : 'local',
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

function applyOnlineState(state) {
  if (!state) return;
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

  if (state.phase === 'over') {
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

function readRoomOptionsForm() {
  const timerEnabled = id('togRoomTimer') ? id('togRoomTimer').classList.contains('on') : false;
  const timerSeconds = id('roomTimerSel') ? (parseInt(id('roomTimerSel').value, 10) || 45) : 45;
  const boardSizeEl = document.querySelector('input[name="roomBoardSize"]:checked');
  const boardSize = boardSizeEl ? parseInt(boardSizeEl.value, 10) : 10;
  const pieceModeEl = document.querySelector('input[name="roomPieceMode"]:checked');
  const pieceMode = pieceModeEl ? parseInt(pieceModeEl.value, 10) : 2;
  const themeEl = document.querySelector('input[name="roomBoardTheme"]:checked');
  const boardTheme = themeEl ? themeEl.value : 'dark';
  return { timerEnabled, timerSeconds, boardSize, pieceMode, boardTheme };
}

function confirmRoomOptions() {
  hostOnlineGame(readRoomOptionsForm());
}

async function hostOnlineGame(config) {
  // onlineSnapshot() (inside createOnlineRoom) reads G.pos etc. — G
  // must be populated first, or JSON.stringify(undefined) silently
  // returns undefined and the following JSON.parse throws.
  newGame(config);
  if (typeof applyBoardTheme === 'function') applyBoardTheme(config.boardTheme);

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
  if (typeof applyBoardTheme === 'function') applyBoardTheme(roomCfg.boardTheme);

  goTo('game');
  setTimeout(() => {
    buildBoard(); render(); updateTurnIndicator(); setActionMode('move');
    id('evLog').innerHTML = ''; id('victOv').classList.remove('open');
    connectOnlineRealtime();
    const myRole = onlinePlayer();
    // Guest sees the board rotated 180° so their own pieces read as
    // "moving up the screen" from their perspective too.
    if (typeof applyBoardRotation === 'function') applyBoardRotation(myRole === 'blue');
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
   last ping goes stale (>9s old), that's treated as a dropped
   connection and a 20-second reconnect grace window opens — runs on
   its own independent clock, so it never pauses the normal per-move
   turn timer. If the opponent's ping becomes fresh again within the
   20s, the grace window cancels automatically. */
let heartbeatSendTimer = null;
let heartbeatCheckTimer = null;

function startHeartbeat() {
  stopHeartbeat();
  const col = online.role === 'host' ? 'host_last_ping' : 'guest_last_ping';
  const peerCol = online.role === 'host' ? 'guest_last_ping' : 'host_last_ping';

  heartbeatSendTimer = setInterval(() => {
    if (!online.enabled || !online.roomId) return;
    fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ [col]: new Date().toISOString() })
    }).catch(() => {});
  }, 4000);

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
        startReconnectGrace();
      } else {
        clearReconnectGrace();
      }
    } catch (e) { /* transient — don't panic on a single failed check */ }
  }, 3000);
}

function stopHeartbeat() {
  if (heartbeatSendTimer) { clearInterval(heartbeatSendTimer); heartbeatSendTimer = null; }
  if (heartbeatCheckTimer) { clearInterval(heartbeatCheckTimer); heartbeatCheckTimer = null; }
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
   host bailing out of an empty waiting room before anyone's joined. */
function leaveOnlineGame() {
  clearInterval(onlinePollTimer);
  stopHeartbeat();
  if (typeof stopTurnTimer === 'function') stopTurnTimer();
  clearReconnectGrace();
  if (online.channel) { try { online.channel.unsubscribe(); } catch (e) {} }
  online = { enabled: false, role: null, roomId: null, roomCode: null, channel: null, clientId: null, applyingRemote: false, roomConfig: null };
}
