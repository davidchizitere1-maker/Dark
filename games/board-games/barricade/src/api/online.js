/* ==========================================================
   STEENE — src/api/online.js
   Supabase integration, network observer (20-second ping /
   disconnect timer window), and online room orchestration.

   ── FIXES APPLIED (kept from the live version) ────────────
   1) Wins were double-counted for the winner only. Supabase
      Realtime echoes a client's own writes back to itself, so the
      winner's client received its own "phase: over" update a
      second time via connectOnlineRealtime() and called doWin()
      again — double stats, double confetti, double sound, and a
      duplicate row logged to the shared AI-learning `games` table.
      Fixed with a phase-transition guard in applyOnlineState().
   2) The disconnect detector had no hysteresis — one stale 3s poll
      (a slow fetch, a throttled background tab) was enough to pop
      the "Opponent Disconnected" modal. Now requires 2 consecutive
      stale checks, and immediately re-pings the instant the tab
      regains focus so briefly backgrounding the app on mobile isn't
      misread as your opponent vanishing.
   3) Leaving during an active disconnect-grace window didn't notify
      the opponent — stopPingLoops()/state reset ran before any leave
      notice could send. markOnlineLeave() now fires first.
   4) Closing/refreshing the tab gave zero notice at all — the
      opponent only found out ~20-30s later via heartbeat timeout.
      Added a best-effort pagehide notice using fetch(keepalive:true).
   5) logGameToSupabase() tags online matches as mode:'online'
      instead of mislabeling them 'local' — the live games.mode CHECK
      constraint allows this.

   ── CHANGE THIS PASS (architecture refactor) ──────────────
   Removed a stray, broken STEENE_AUTH_SYNC listener that used to sit
   at the bottom of this file — it called window.supabase.auth
   .setSession(session) directly, but window.supabase is the raw SDK
   library object (from the CDN script tag), not a client instance,
   so that call would throw. This game now uses the shared, working
   version of that bridge instead: games/shared/steene-session-bridge.js
   (included in index.html, two directories up now that this game
   lives under games/board-games/). This file just registers its own
   already-existing SUPABASE_URL/SUPABASE_ANON_KEY with that bridge
   below, rather than duplicating a broken copy of the same logic.
   ========================================================== */

const SUPABASE_URL = 'https://igavamrvcjtpulawjgzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYXZhbXJ2Y2p0cHVsYXdqZ3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDk0NTEsImV4cCI6MjEwMjcyNTQ1MX0.Zl_FAW7oLnGMggGo3H-Tb5nYUxNVnfZtdzzVfpccYBk';

// Hands these existing constants to the shared session bridge so it
// can build an authenticated client once the platform posts a
// session down — without hardcoding the URL/key a second time.
if (typeof registerSteeneSupabaseCredentials === 'function') {
  registerSteeneSupabaseCredentials(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let online = {
  enabled: false,
  role: null,
  roomId: null,
  roomCode: null,
  channel: null,
  clientId: null,
  applyingRemote: false,
  roomConfig: null
};

let pingInterval = null;
let networkObserverInterval = null;
let disconnectCountdown = 20;
let disconnectTimer = null;
let guestJoinPoll = null;
let staleChecksInARow = 0;

function onlinePlayer() {
  return online.role === 'host' ? 'white' : 'blue';
}

function onlineOpponent() {
  return onlinePlayer() === 'white' ? 'blue' : 'white';
}

/* Whether it is currently this client's turn to act in an online match.
   Referenced by beginPlayOnline() for the initial instruction text. */
function isOnlineTurn() {
  return online.enabled && G.phase === 'playing' && G.turn === onlinePlayer();
}

function onlineSnapshot() {
  return {
    boardSize: G.boardSize,
    pieceCount: G.pieceCount,
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
  const clientId = crypto.randomUUID();
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const initialState = {
    ...onlineSnapshot(),
    phase: 'waiting'
  };

  const { data, error } = await fetch(
    `${SUPABASE_URL}/rest/v1/multiplayer_rooms`,
    {
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
        host_last_ping: new Date().toISOString(),
        state: initialState,
        config: config
      })
    }
  ).then(async res => {
    if (!res.ok) throw new Error(await res.text());
    return { data: await res.json(), error: null };
  }).catch(error => ({ data: null, error }));

  if (error) {
    console.error('Create room failed:', error);
    alert('Could not create online room.');
    return null;
  }

  if (!data || !data.length) {
    console.error('Create room: insert returned no row — check the anon SELECT policy on multiplayer_rooms.');
    alert('Could not create online room (no row returned). Please try again.');
    return null;
  }

  online.enabled = true;
  online.role = 'host';
  online.roomId = data[0].id;
  online.roomCode = roomCode;
  online.clientId = clientId;
  online.roomConfig = config;

  startPingLoop();
  return roomCode;
}

async function joinOnlineRoom(roomCode) {
  roomCode = roomCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
    alert('Room code must contain 6 characters.');
    return false;
  }

  const clientId = crypto.randomUUID();
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/multiplayer_rooms?room_code=eq.${encodeURIComponent(roomCode)}&status=eq.waiting&select=*`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {
    alert('Could not find the room.');
    return false;
  }

  const rooms = await response.json();
  if (!rooms.length) {
    alert('Room not found or the game has already started.');
    return false;
  }

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
      body: JSON.stringify({
        guest_id: clientId,
        guest_last_ping: new Date().toISOString(),
        status: 'playing'
      })
    }
  );

  if (!updateResponse.ok) {
    alert('Could not join the room.');
    return false;
  }

  online.enabled = true;
  online.role = 'guest';
  online.roomId = room.id;
  online.roomCode = roomCode;
  online.clientId = clientId;
  online.roomConfig = room.config || { timerEnabled: false, timerSeconds: 45, boardSize: 10, theme: 'dark', pieceMode: 2 };

  startPingLoop();
  return true;
}

/* ── HOST / JOIN UI GLUE ──────────────────────────────────── */
async function hostOnlineGame(config) {
  const roomCode = await createOnlineRoom(config);
  if (!roomCode) return; // createOnlineRoom already alerted on failure

  id('onlineRoomCode').textContent = roomCode;
  id('onlineChoiceView').style.display = 'none';
  id('onlineOptionsView').style.display = 'none';
  id('onlineJoinView').style.display = 'none';
  id('onlineWaitView').style.display = 'block';
  const waitStatus = id('onlineWaitStatus');
  if (waitStatus) { waitStatus.textContent = '⏳ Waiting for opponent to join…'; waitStatus.className = 'ai-learn-status'; }

  pollForGuestJoin();
}

/* Host has no realtime subscription yet while waiting (that only
   starts in beginOnlineGame()), so poll the room row until a guest
   has joined (status flips to 'playing' in joinOnlineRoom). */
function pollForGuestJoin() {
  clearInterval(guestJoinPoll);
  guestJoinPoll = setInterval(async () => {
    if (!online.roomId || online.role !== 'host') { clearInterval(guestJoinPoll); return; }
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}&select=status`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) return;
      const rows = await res.json();
      if (rows.length && rows[0].status === 'playing') {
        clearInterval(guestJoinPoll);
        const waitStatus = id('onlineWaitStatus');
        if (waitStatus) { waitStatus.textContent = '✅ Opponent joined — starting…'; waitStatus.className = 'ai-learn-status ready'; }
        setTimeout(() => {
          id('onlineModal').classList.remove('open');
          beginOnlineGame();
        }, 500);
      }
    } catch (e) {
      console.warn('Guest join poll error:', e);
    }
  }, 1500);
}

async function attemptJoinRoom() {
  const codeInput = id('joinCodeInput');
  const errEl = id('onlineJoinError');
  errEl.style.display = 'none'; errEl.textContent = '';

  const code = codeInput.value.trim();
  if (code.length !== 6) {
    errEl.textContent = 'Enter the full 6-character room code.';
    errEl.style.display = 'block';
    return;
  }

  const ok = await joinOnlineRoom(code);
  if (!ok) {
    errEl.textContent = 'Could not join that room. Check the code and try again.';
    errEl.style.display = 'block';
    return;
  }

  id('onlineModal').classList.remove('open');
  beginOnlineGame();
}

/* ── NETWORK OBSERVER & PING LOOP ────────────────────────── */
function startPingLoop() {
  clearInterval(pingInterval);
  clearInterval(networkObserverInterval);
  staleChecksInARow = 0;

  pingInterval = setInterval(sendHeartbeatPing, 5000);

  document.addEventListener('visibilitychange', onVisibilityRepingHandler);
  window.addEventListener('focus', onVisibilityRepingHandler);

  networkObserverInterval = setInterval(async () => {
    if (!online.enabled || !online.roomId || G.phase !== 'playing') return;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}&select=host_last_ping,guest_last_ping,left_by,status`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (!res.ok) return;
      const rows = await res.json();
      if (!rows.length) return;
      const room = rows[0];

      if (room.left_by && room.left_by !== online.role) {
        triggeredForfeit();
        return;
      }

      const oppPingCol = online.role === 'host' ? 'guest_last_ping' : 'host_last_ping';
      const lastPingTime = room[oppPingCol] ? new Date(room[oppPingCol]).getTime() : Date.now();
      const secondsSincePing = (Date.now() - lastPingTime) / 1000;

      if (secondsSincePing > 8) {
        staleChecksInARow++;
        if (staleChecksInARow >= 2 && !disconnectTimer) {
          showNetworkDisconnectModal();
          disconnectCountdown = 20;
          updateDisconnectTimerDisplay(disconnectCountdown);

          disconnectTimer = setInterval(() => {
            disconnectCountdown--;
            updateDisconnectTimerDisplay(disconnectCountdown);
            if (disconnectCountdown <= 0) {
              clearInterval(disconnectTimer);
              disconnectTimer = null;
              hideNetworkDisconnectModal();
              triggeredForfeit();
            }
          }, 1000);
        }
      } else {
        staleChecksInARow = 0;
        if (disconnectTimer) {
          clearInterval(disconnectTimer);
          disconnectTimer = null;
          hideNetworkDisconnectModal();
        }
      }
    } catch (e) {
      console.warn('Network observer poll error:', e);
    }
  }, 3000);
}

function sendHeartbeatPing() {
  if (!online.enabled || !online.roomId) return;
  const pingCol = online.role === 'host' ? 'host_last_ping' : 'guest_last_ping';
  fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ [pingCol]: new Date().toISOString() })
  }).catch(e => console.warn('Heartbeat ping failed:', e));
}

function onVisibilityRepingHandler() {
  if (document.visibilityState && document.visibilityState !== 'visible') return;
  sendHeartbeatPing();
}

function stopPingLoops() {
  clearInterval(pingInterval);
  clearInterval(networkObserverInterval);
  clearInterval(disconnectTimer);
  clearInterval(guestJoinPoll);
  pingInterval = null;
  networkObserverInterval = null;
  disconnectTimer = null;
  guestJoinPoll = null;
  staleChecksInARow = 0;
  document.removeEventListener('visibilitychange', onVisibilityRepingHandler);
  window.removeEventListener('focus', onVisibilityRepingHandler);
}

function triggeredForfeit() {
  stopPingLoops();
  G.phase = 'over';
  if (typeof stopTurnTimer === 'function') stopTurnTimer();
  hideNetworkDisconnectModal();
  
  id('victTitle').textContent = 'Opponent Forfeited / Disconnected — You Win!';
  id('victStats').innerHTML = `<div class="vs"><span class="vs-val">🏆</span><span class="vs-lbl">Forfeit Win</span></div>`;
  id('victOv').classList.add('open');
  if (typeof doConfetti === 'function') doConfetti();
}

async function connectOnlineRealtime() {
  if (!online.roomId || !window.supabase) return;

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  online.channel = supabaseClient
    .channel(`steene-room-${online.roomId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${online.roomId}` },
      payload => {
        if (!payload.new || online.applyingRemote) return;
        if (payload.new.left_by && payload.new.left_by !== online.role && G.phase === 'playing') {
          triggeredForfeit();
          return;
        }
        const state = payload.new.state;
        if (!state || !state.pos) return;
        applyOnlineState(state);
      }
    )
    .subscribe();
}

function applyOnlineState(state) {
  if (!state) return;
  const wasAlreadyOver = G.phase === 'over';
  online.applyingRemote = true;

  G.boardSize = state.boardSize || 10;
  G.pieceCount = state.pieceCount || 2;
  G.pos = JSON.parse(JSON.stringify(state.pos));
  if (state.targets) G.targets = JSON.parse(JSON.stringify(state.targets));
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

  buildBoard();
  render();
  updateTurnIndicator();
  setActionMode('move');
  refreshTurnTimer();

  online.applyingRemote = false;

  if (state.phase === 'over' && !wasAlreadyOver) {
    const winner = checkWin('white') ? 'white' : checkWin('blue') ? 'blue' : null;
    if (winner) doWin(winner);
  }
}

async function syncOnlineState() {
  if (!online.enabled || !online.roomId || online.applyingRemote) return;
  const state = onlineSnapshot();

  await fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      state: state,
      status: state.phase === 'over' ? 'finished' : 'playing'
    })
  });
}

function beginOnlineGame() {
  const roomCfg = online.roomConfig || { timerEnabled: false, timerSeconds: 45, boardSize: 10, theme: 'dark', pieceMode: 2 };
  newGame(roomCfg);
  G.aiMode = false;
  G.timerEnabled = !!roomCfg.timerEnabled;
  G.timerSeconds = roomCfg.timerSeconds || 45;
  online.applyingRemote = false;
  if (roomCfg.theme && typeof applyBoardTheme === 'function') applyBoardTheme(roomCfg.theme);

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

async function syncOnlineTargets() {
  if (!online.enabled || !online.roomId) return;
  const col = online.role === 'host' ? 'host_targets' : 'guest_targets';
  const myTargets = G.targets[onlinePlayer()];
  await fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ [col]: myTargets })
  });
}

function pollForOpponentTargets() {
  const targetPoll = setInterval(async () => {
    if (!online.roomId) { clearInterval(targetPoll); return; }
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}&select=host_targets,guest_targets`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return;
    const rows = await res.json();
    const room = rows[0];
    if (room && room.host_targets && room.guest_targets) {
      clearInterval(targetPoll);
      G.targets.white = room.host_targets;
      G.targets.blue = room.guest_targets;
      beginPlayOnline();
    }
  }, 1500);
}

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

function cancelOnlineRoom() {
  stopPingLoops();
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

function leaveOnlineGame() {
  markOnlineLeave();
  stopPingLoops();
  if (online.channel) {
    try { online.channel.unsubscribe(); } catch (e) {}
  }
  online = { enabled: false, role: null, roomId: null, roomCode: null, channel: null, clientId: null, applyingRemote: false, roomConfig: null };
}

function beginPlayOnline() {
  G.phase = 'playing'; G.turn = 'white';
  render(); updateTurnIndicator(); setActionMode('move');
  refreshTurnTimer();
  logEv('🎮 Both players ready — White moves first.', '');
  setInstr(isOnlineTurn() ? 'Select a piece to move.' : "Waiting for opponent's move…");
  syncOnlineState();
}

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
      board_size: G.boardSize,
      white_targets: targetIdx(G.targets.white),
      blue_targets: targetIdx(G.targets.blue),
      moves: G.moveLog
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) console.warn('Game log failed:', res.status, await res.text());
  } catch (e) {
    console.warn('Game log error:', e);
  }
}
