/* ==========================================================
   STEENE — online.js
   Supabase config + game-data logging, the shared AI-learning
   read-path, and the full Online Multiplayer system (room
   create/join, realtime sync, private target handshake).
   Also contains BOOT — the DOMContentLoaded listener that starts
   the app — so this file must be loaded LAST.
   Depends on: config.js, board.js (G, newGame, render, etc.),
   ai.js (not directly, but must exist before any AI game starts).
   ========================================================== */

/* ── SUPABASE (game data logging) ───────────────────────────
   Anon/public key is safe to expose client-side — RLS policy on
   the 'games' table only allows anonymous INSERTs, no reads/writes
   to existing rows. */
const SUPABASE_URL = 'https://igavamrvcjtpulawjgzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYXZhbXJ2Y2p0cHVsYXdqZ3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDk0NTEsImV4cCI6MjEwMjcyNTQ1MX0.Zl_FAW7oLnGMggGo3H-Tb5nYUxNVnfZtdzzVfpccYBk';

/* ── ONLINE MULTIPLAYER ───────────────────────────────────── */

let online = {
  enabled: false,
  role: null,          // 'host' or 'guest'
  roomId: null,
  roomCode: null,
  channel: null,
  clientId: null,
  applyingRemote: false
};

function onlinePlayer(){
  return online.role === 'host' ? 'white' : 'blue';
}

function onlineOpponent(){
  return onlinePlayer() === 'white' ? 'blue' : 'white';
}

function isOnlineTurn(){
  return !online.enabled || G.turn === onlinePlayer();
}

/* NOTE: 'targets' is intentionally NOT included in this snapshot.
   This object is broadcast to BOTH players via the shared 'state'
   column on every move/wall, so including secret targets here would
   let either player read the opponent's targets straight out of the
   synced JSON (e.g. via devtools network tab) — defeating the whole
   secret-target mechanic. Targets are synced separately, once each,
   via the dedicated host_targets/guest_targets columns during the
   pre-game handshake (see syncOnlineTargets/pollForOpponentTargets),
   and never touched again after that. */
function onlineSnapshot(){
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
async function createOnlineRoom(){

  const clientId = crypto.randomUUID();

  const roomCode = Math.random()
    .toString(36)
    .substring(2,8)
    .toUpperCase();

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
        state: initialState
      })
    }
  ).then(async res => {

    if(!res.ok){
      throw new Error(await res.text());
    }

    return {
      data: await res.json(),
      error: null
    };

  }).catch(error => ({
    data: null,
    error
  }));

  if(error){
    console.error('Create room failed:', error);
    alert('Could not create online room.');
    return null;
  }

  online.enabled = true;
  online.role = 'host';
  online.roomId = data[0].id;
  online.roomCode = roomCode;
  online.clientId = clientId;

  console.log('Online room created:', roomCode);

  return roomCode;
}

async function joinOnlineRoom(roomCode){

  roomCode = roomCode.trim().toUpperCase();

  if(!/^[A-Z0-9]{6}$/.test(roomCode)){
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

  if(!response.ok){
    alert('Could not find the room.');
    return false;
  }

  const rooms = await response.json();

  if(!rooms.length){
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
        status: 'playing'
      })
    }
  );

  if(!updateResponse.ok){
    alert('Could not join the room.');
    return false;
  }

  online.enabled = true;
  online.role = 'guest';
  online.roomId = room.id;
  online.roomCode = roomCode;
  online.clientId = clientId;

  console.log('Joined online room:', roomCode);

  return true;
}

async function connectOnlineRealtime(){

  if(!online.roomId) return;

  if(!window.supabase){
    console.error('Supabase client library is not loaded.');
    return;
  }

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  online.channel = supabaseClient
    .channel(`steene-room-${online.roomId}`)

    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'multiplayer_rooms',
        filter: `id=eq.${online.roomId}`
      },
      payload => {

        if(!payload.new || online.applyingRemote) return;

        const state = payload.new.state;

        if(!state || !state.pos) return;

        applyOnlineState(state);
      }
    )

    .subscribe(status => {

      console.log(
        'Online Realtime status:',
        status
      );

    });
           }

/* 'targets' is deliberately left untouched here if the incoming state
   doesn't carry it (see onlineSnapshot) — both clients already have the
   correct G.targets locally from the pre-game handshake, and it never
   changes mid-match, so there's nothing to apply. */
function applyOnlineState(state){

  if(!state) return;

  online.applyingRemote = true;

  G.pos = JSON.parse(JSON.stringify(state.pos));
  if(state.targets) G.targets = JSON.parse(JSON.stringify(state.targets));
  G.wallStock = JSON.parse(JSON.stringify(state.wallStock));

  G.hwalls = JSON.parse(JSON.stringify(state.hwalls));
  G.vwalls = JSON.parse(JSON.stringify(state.vwalls));

  G.blockedEdges = new Set(
    state.blockedEdges || []
  );

  G.turn = state.turn;
  G.phase = state.phase;

  G.turns = state.turns;
  G.jumps = state.jumps;
  G.wallsPlaced = state.wallsPlaced;

  G.moveLog = JSON.parse(
    JSON.stringify(state.moveLog || [])
  );

  G.sel = null;
  G.animating = false;

  render();
  updateTurnIndicator();
  setActionMode('move');

  online.applyingRemote = false;

  if(state.phase === 'over'){

    const winner =
      checkWin('white') ? 'white' :
      checkWin('blue') ? 'blue' :
      null;

    if(winner){
      doWin(winner);
    }
  }
     }

async function syncOnlineState(){

  if(
    !online.enabled ||
    !online.roomId ||
    online.applyingRemote
  ){
    return;
  }

  const state = onlineSnapshot();

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        state: state,
        status: state.phase === 'over'
          ? 'finished'
          : 'playing'
      })
    }
  );

  if(!response.ok){
    console.error(
      'Online synchronization failed:',
      await response.text()
    );
  }
     }

/* ── ONLINE MULTIPLAYER — UI ORCHESTRATION ───────────────────
   Ties the #onlineModal (create/join/waiting views) to the room
   functions above, and adds the pre-game target handshake that the
   local "pass device" flow doesn't cover once players are on
   separate devices. Requires two extra columns on multiplayer_rooms:
   host_targets jsonb, guest_targets jsonb — see setup notes. */
let onlinePollTimer = null;

function openOnlineModal(){
  showOnlineChoiceView();
  id('onlineModal').classList.add('open');
}

function closeOnlineModal(){
  // If a room was created but no opponent has joined yet, clean it up
  // rather than leaving an orphaned waiting room in the database.
  if(online.enabled && online.role==='host' && (!G.phase || G.phase!=='playing')){
    cancelOnlineRoom();
    return;
  }
  id('onlineModal').classList.remove('open');
}

function showOnlineChoiceView(){
  id('onlineChoiceView').style.display='block';
  id('onlineJoinView').style.display='none';
  id('onlineWaitView').style.display='none';
}

function showJoinRoomView(){
  id('onlineChoiceView').style.display='none';
  id('onlineJoinView').style.display='block';
  id('onlineWaitView').style.display='none';
  const err=id('onlineJoinError');
  err.style.display='none'; err.textContent='';
  id('joinCodeInput').value='';
  setTimeout(()=>id('joinCodeInput').focus(),50);
}

async function hostOnlineGame(){
  // onlineSnapshot() (called inside createOnlineRoom) reads G.pos,
  // G.wallStock, etc. — G must be populated before that runs, or
  // JSON.stringify(undefined) silently returns undefined and the
  // JSON.parse right after it throws "undefined is not valid JSON".
  // beginOnlineGame() re-initializes G again once the guest joins;
  // calling newGame() here too is harmless, it just needs to exist.
  newGame();

  id('onlineChoiceView').style.display='none';
  id('onlineJoinView').style.display='none';
  id('onlineWaitView').style.display='block';
  id('onlineRoomCode').textContent='------';
  const statusEl=id('onlineWaitStatus');
  statusEl.textContent='⏳ Creating room…';
  statusEl.className='ai-learn-status';

  const code = await createOnlineRoom();
  if(!code){
    statusEl.textContent='❌ Could not create a room. Try again.';
    statusEl.className='ai-learn-status offline';
    return;
  }
  id('onlineRoomCode').textContent=code;
  statusEl.textContent='⏳ Waiting for opponent to join…';
  statusEl.className='ai-learn-status';

  pollForGuest();
}

function pollForGuest(){
  clearInterval(onlinePollTimer);
  onlinePollTimer = setInterval(async ()=>{
    if(!online.roomId) return;
    try{
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}&select=status,guest_id`,
        { headers:{ 'apikey':SUPABASE_ANON_KEY, 'Authorization':`Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if(!res.ok) return;
      const rows = await res.json();
      const room = rows[0];
      if(room && room.guest_id){
        clearInterval(onlinePollTimer);
        const statusEl=id('onlineWaitStatus');
        statusEl.textContent='✅ Opponent joined! Starting…';
        statusEl.className='ai-learn-status ready';
        setTimeout(()=>{
          id('onlineModal').classList.remove('open');
          beginOnlineGame();
        },600);
      }
    }catch(e){ console.warn('Guest-join poll error (non-blocking):', e); }
  }, 2000);
}

function cancelOnlineRoom(){
  clearInterval(onlinePollTimer);
  if(online.roomId){
    fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
      method:'DELETE',
      headers:{ 'apikey':SUPABASE_ANON_KEY, 'Authorization':`Bearer ${SUPABASE_ANON_KEY}` }
    }).catch(()=>{});
  }
  online = { enabled:false, role:null, roomId:null, roomCode:null, channel:null, clientId:null, applyingRemote:false };
  id('onlineModal').classList.remove('open');
  showOnlineChoiceView();
}

async function attemptJoinRoom(){
  const codeInput = id('joinCodeInput');
  const err = id('onlineJoinError');
  const code = codeInput.value.trim().toUpperCase();
  err.style.display='none';
  if(!/^[A-Z0-9]{6}$/.test(code)){
    err.textContent='Enter the 6-character room code.';
    err.style.display='block';
    return;
  }
  const ok = await joinOnlineRoom(code);
  if(!ok){
    err.textContent='Could not join that room — check the code and try again.';
    err.style.display='block';
    return;
  }
  id('onlineModal').classList.remove('open');
  beginOnlineGame();
}

/* Called once both host and guest are present in the room. Builds a
   fresh local game, wires up the realtime sync channel, and — since
   online players are on separate devices — routes into a private
   per-player target-selection flow instead of the local "pass device"
   modal (see confirmTargets' online branch). */
function beginOnlineGame(){
  newGame(false);
  G.aiMode=false;
  online.applyingRemote=false;
  goTo('game');
  setTimeout(()=>{
    buildBoard(); render(); updateTurnIndicator(); setActionMode('move');
    id('evLog').innerHTML=''; id('victOv').classList.remove('open');
    connectOnlineRealtime();
    const myRole = onlinePlayer();
    setInstr(`Connected — you are ${pretty(myRole)}. Choose your secret targets.`);
    setTimeout(()=>openTargetModal(myRole),300);
  },60);
}

/* Writes only this player's own targets to their own dedicated column
   (host_targets or guest_targets) — never into the shared 'state' blob
   that both clients continuously read, so the opponent can't casually
   read them off the wire mid-match. Note: because this project uses a
   public anon key with open read access (needed for the room lookup
   in joinOnlineRoom), a technically determined opponent could still
   query the row directly and see both columns — there's no way to
   cryptographically hide data from the other player without a real
   backend/session-scoped policy. This keeps targets out of the normal
   match-state traffic, which is what matters for ordinary casual play. */
async function syncOnlineTargets(){
  if(!online.enabled || !online.roomId) return;
  const col = online.role==='host' ? 'host_targets' : 'guest_targets';
  const myTargets = G.targets[onlinePlayer()];
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}`, {
      method:'PATCH',
      headers:{
        'Content-Type':'application/json',
        'apikey':SUPABASE_ANON_KEY,
        'Authorization':`Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ [col]: myTargets })
    });
    if(!res.ok) console.warn('Target sync failed:', res.status, await res.text());
  }catch(e){ console.warn('Target sync error (non-blocking):', e); }
}

function pollForOpponentTargets(){
  clearInterval(onlinePollTimer);
  onlinePollTimer = setInterval(async ()=>{
    if(!online.roomId) return;
    try{
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/multiplayer_rooms?id=eq.${online.roomId}&select=host_targets,guest_targets`,
        { headers:{ 'apikey':SUPABASE_ANON_KEY, 'Authorization':`Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if(!res.ok) return;
      const rows = await res.json();
      const room = rows[0];
      if(room && room.host_targets && room.guest_targets){
        clearInterval(onlinePollTimer);
        G.targets.white = room.host_targets;
        G.targets.blue  = room.guest_targets;
        beginPlayOnline();
      }
    }catch(e){ console.warn('Target poll error (non-blocking):', e); }
  }, 1500);
}

/* Resets local online state after a finished match, without deleting
   the shared room row — cancelOnlineRoom() (DELETE) is only for a host
   bailing out of an empty waiting room before anyone's joined; once a
   match has actually been played, either side leaving shouldn't be
   able to unilaterally delete the other player's room. */
function leaveOnlineGame(){
  clearInterval(onlinePollTimer);
  if(online.channel){
    try{ online.channel.unsubscribe(); }catch(e){}
  }
  online = { enabled:false, role:null, roomId:null, roomCode:null, channel:null, clientId:null, applyingRemote:false };
}

function beginPlayOnline(){
  G.phase='playing'; G.turn='white';
  render(); updateTurnIndicator(); setActionMode('move');
  logEv('🎮 Both players ready — White moves first.','');
  setInstr(isOnlineTurn() ? 'Select a piece to move.' : "Waiting for opponent's move…");
}


async function logGameToSupabase(winner){
  try{
    const targetIdx = tgts => tgts.map(t => t.r*10 + t.c);
    const payload = {
      difficulty   : G.aiMode ? G.aiDifficulty : null,
      // schema constraint only allows mode IN ('ai','local') — practice
      // games are logged as 'local' since there's no separate 'practice' value
      mode         : G.aiMode ? 'ai' : 'local',
      winner       : winner,
      turn_count   : G.turns,
      jump_count   : G.jumps,
      wall_count   : G.wallsPlaced,
      white_targets: targetIdx(G.targets.white),
      blue_targets : targetIdx(G.targets.blue),
      moves        : G.moveLog
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
    if(!res.ok) console.warn('Game log failed:', res.status, await res.text());
  }catch(e){
    console.warn('Game log error (non-blocking):', e);
  }
}

/* ── SHARED AI LEARNING (read path) ──────────────────────────
   Reads back an aggregate count of previously-logged AI games from
   Supabase using the Prefer: count=exact header on a HEAD request —
   no row data is pulled, just a count. Drives (1) the aiLearnStatus
   indicator in the difficulty modal, which was previously wired up
   in the HTML/CSS but never actually touched by script.js, and (2) a
   small nudge to aiDecide()'s wall-placement threshold, so "shared
   match experience" is a real, if modest, effect instead of just
   UI copy with nothing behind it. */
let aiLearnState = { loaded:false, gamesSeen:0 };

async function loadAiLearningStatus(){
  const statusEl = id('aiLearnStatus');
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/games?select=id&mode=eq.ai`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    if(!res.ok) throw new Error('status '+res.status);
    const range = res.headers.get('content-range'); // e.g. "0-0/482"
    const total = range ? (parseInt(range.split('/')[1],10)||0) : 0;
    aiLearnState = { loaded:true, gamesSeen: total };
    if(statusEl){
      statusEl.textContent = total>0
        ? `🧠 Learning from ${total.toLocaleString()} shared AI matches`
        : '🧠 Shared AI experience connected — no matches logged yet';
      statusEl.className = 'ai-learn-status ready';
    }
  }catch(e){
    aiLearnState = { loaded:false, gamesSeen:0 };
    if(statusEl){
      statusEl.textContent = '🧠 Shared experience unavailable — playing on local heuristics';
      statusEl.className = 'ai-learn-status offline';
    }
    console.warn('AI learning status fetch failed (non-blocking):', e);
  }
}


/* ── BOOT ────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded',function(){
  loadCfg(); loadGs();
  initWallDragSystem();
  id('mobBtn').addEventListener('click',function(){
    id('sidebar').classList.toggle('open');
    id('overlayBg').classList.toggle('open');
  });
  id('overlayBg').addEventListener('click',closeSidebar);
  document.querySelectorAll('.nav-item').forEach(function(n){
    n.addEventListener('click',function(){ goTo(n.dataset.s); });
  });
  goTo('home');
});
