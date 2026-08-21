/* ==========================================================
   STEENE — Game Logic v4 (Quoridor-style)
   Movement : 4-directional, 1 square (U/D/L/R)
   Jump     : opponent directly ahead -> jump straight over to next square
   Walls    : 10 per player (5H + 5V), placed on grid lines between cells
              one action per turn — move OR place a wall, never both
              cannot fully seal a piece's path to its targets (pathfinding check)
   Victory  : both pieces on your 2 secret targets simultaneously
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

/* ── CONFIG ──────────────────────────────────────────────── */
let cfg = { sfx:true, anim:true, hints:true, speed:'normal' };
function loadCfg(){
  try{ const s=localStorage.getItem('steene_cfg'); if(s) cfg=Object.assign({},cfg,JSON.parse(s)); }catch(e){}
  applyCfg();
}
function saveCfg(){ try{ localStorage.setItem('steene_cfg',JSON.stringify(cfg)); }catch(e){} }
function applyCfg(){
  id('togSFX').className   = 'tog'+(cfg.sfx?' on':'');
  id('togHints').className = 'tog'+(cfg.hints?' on':'');
  id('togAnim').className  = 'tog'+(cfg.anim?' on':'');
  id('spdSel').value = cfg.speed;
}
function togSet(k){ cfg[k]=!cfg[k]; saveCfg(); applyCfg(); }

/* ── GLOBAL STATS ────────────────────────────────────────── */
let gs = { played:0, won:0, turns:0, jumps:0, walls:0, longest:0 };
function loadGs(){
  try{ const s=localStorage.getItem('steene_gs'); if(s) gs=Object.assign({},gs,JSON.parse(s)); }catch(e){}
}
function saveGs(){ try{ localStorage.setItem('steene_gs',JSON.stringify(gs)); }catch(e){} }
function resetStats(){
  if(!confirm('Reset all statistics?')) return;
  gs={played:0,won:0,turns:0,jumps:0,walls:0,longest:0};
  saveGs(); renderStats(); renderProfile();
}
function renderStats(){
  const wr = gs.played?Math.round(gs.won/gs.played*100):0;
  const avg= gs.played?Math.round(gs.turns/gs.played):0;
  const rows=[
    {v:gs.played,l:'Games Played'},{v:gs.won,l:'Games Won'},
    {v:wr+'%',l:'Win Rate'},{v:avg||'—',l:'Avg Turns/Game'},
    {v:gs.jumps,l:'Jumps Made'},{v:gs.walls,l:'Walls Placed'},
    {v:gs.longest||'—',l:'Longest Match'}
  ];
  id('statsGrid').innerHTML = rows.map(r=>`<div class="sc"><div class="sc-val">${r.v}</div><div class="sc-lbl">${r.l}</div></div>`).join('');
}
function renderProfile(){
  const wr=gs.played?Math.round(gs.won/gs.played*100)+'%':'—';
  id('prGames').textContent = gs.played||'—';
  id('prWins').textContent  = gs.won||'—';
  id('prWR').textContent    = wr;
  id('prTurns').textContent = gs.turns||'—';
  id('prWalls').textContent = gs.walls||'—';
}

/* ── AUDIO ───────────────────────────────────────────────── */
let _ac=null;
function ac(){ if(!_ac) _ac=new(window.AudioContext||window.webkitAudioContext)(); return _ac; }
function beep(freq,type,dur,vol,delay){
  if(!cfg.sfx) return;
  delay=delay||0;
  try{
    const c=ac(),o=c.createOscillator(),g=c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type=type||'sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(vol||.12, c.currentTime+delay);
    g.gain.exponentialRampToValueAtTime(.001, c.currentTime+delay+dur);
    o.start(c.currentTime+delay); o.stop(c.currentTime+delay+dur+.01);
  }catch(e){}
}
function sfxSel()   { beep(500,'sine',.07,.12); beep(640,'sine',.07,.09,.06); }
function sfxMove()  { beep(370,'sine',.09,.12); }
function sfxJump()  { beep(440,'sine',.1,.13); beep(560,'sine',.1,.11,.08); }
function sfxWall()  { beep(220,'square',.14,.15); }
function sfxWin()   { [523,659,784,1047,1318].forEach((n,i)=>beep(n,'sine',.32,.18,i*.18)); }
function sfxErr()   { beep(180,'square',.07,.1); }

/* ── HELPERS ─────────────────────────────────────────────── */
function id(i){ return document.getElementById(i); }
function cellEl(r,c){ return document.querySelector(`.board [data-r="${r}"][data-c="${c}"]`); }
function cellColor(r,c){ return (r+c)%2===0?'lt':'dk'; }
function inB(r,c){ return r>=0&&r<=9&&c>=0&&c<=9; }
function col2l(c){ return 'ABCDEFGHIJ'[c]; }
function coord(r,c){ return col2l(c)+(r+1); }
function animMs(){ return cfg.speed==='fast'?80:cfg.speed==='slow'?320:160; }
function pretty(p){ return p==='white'?'White':'Blue'; }

/* Cardinal directions ONLY */
const DIRS=[{dr:-1,dc:0,n:'up'},{dr:1,dc:0,n:'down'},{dr:0,dc:-1,n:'left'},{dr:0,dc:1,n:'right'}];

function getPieceAt(r,c){
  for(const p of ['white','blue'])
    for(let i=0;i<2;i++)
      if(G.pos[p][i].r===r&&G.pos[p][i].c===c) return {p,i};
  return null;
}

/* ── WALL MODEL ──────────────────────────────────────────────
   A horizontal wall "hwalls" entry at {r,c} blocks the edge
   between row r and row r+1, spanning columns c and c+1
   (i.e. it sits on the line below cell (r,c) and (r,c+1)).

   A vertical wall "vwalls" entry at {r,c} blocks the edge
   between col c and col c+1, spanning rows r and r+1
   (i.e. it sits on the line right of cell (r,c) and (r+1,c)).

   Each wall blocks 2 unit-edges. We store them as a Set of
   "edge keys" for O(1) lookup, plus the raw wall list for rendering.
   ===========================================================*/
function edgeKey(r1,c1,r2,c2){
  // normalize so smaller coord first
  if(r1>r2||(r1===r2&&c1>c2)){ [r1,r2]=[r2,r1]; [c1,c2]=[c2,c1]; }
  return `${r1},${c1}|${r2},${c2}`;
}

function wallsBlockEdge(r1,c1,r2,c2){
  return G.blockedEdges.has(edgeKey(r1,c1,r2,c2));
}

/* Check if a NEW wall placement is geometrically legal:
   - within board bounds for its 2-cell span
   - does not exactly overlap an existing wall
   - does not cross an existing perpendicular wall at the same midpoint */
function wallGeometryValid(type,r,c){
  if(type==='h'){
    // spans columns c,c+1 at the line below row r — needs c in 0..8, r in 0..8
    if(r<0||r>8||c<0||c>8) return false;
    // exact overlap: another h-wall already at this exact slot
    if(G.hwalls.some(w=>w.r===r&&w.c===c)) return false;
    // overlap: an h-wall at the same row whose 2-cell span shares a column with this one
    // (c-1 spans cols c-1,c ; c+1 spans cols c+1,c+2 — both would overlap our cols c,c+1)
    if(G.hwalls.some(w=>w.r===r&&(w.c===c-1||w.c===c+1))) return false;
    // crossing: a v-wall centered at the same intersection point blocks this placement
    if(G.vwalls.some(w=>w.r===r&&w.c===c)) return false;
    return true;
  } else {
    if(r<0||r>8||c<0||c>8) return false;
    if(G.vwalls.some(w=>w.r===r&&w.c===c)) return false;
    if(G.vwalls.some(w=>w.c===c&&(w.r===r-1||w.r===r+1))) return false;
    if(G.hwalls.some(w=>w.r===r&&w.c===c)) return false;
    return true;
  }
}

function edgesForWall(type,r,c){
  if(type==='h'){
    // blocks vertical movement between row r/r+1 at columns c and c+1
    return [ edgeKey(r,c,r+1,c), edgeKey(r,c+1,r+1,c+1) ];
  } else {
    // blocks horizontal movement between col c/c+1 at rows r and r+1
    return [ edgeKey(r,c,r,c+1), edgeKey(r+1,c,r+1,c+1) ];
  }
}

/* ── BFS PATHFINDING — single-target reachability, respecting
   current walls and ignoring other pieces (pieces don't block
   paths in Quoridor-style pathing) ── */
function hasPathToCell(startR,startC,goal){
  const seen = new Set([`${startR},${startC}`]);
  const queue=[{r:startR,c:startC}];
  while(queue.length){
    const cur=queue.shift();
    if(cur.r===goal.r&&cur.c===goal.c) return true;
    for(const {dr,dc} of DIRS){
      const nr=cur.r+dr, nc=cur.c+dc;
      if(!inB(nr,nc)) continue;
      if(wallsBlockEdge(cur.r,cur.c,nr,nc)) continue;
      const key=`${nr},${nc}`;
      if(seen.has(key)) continue;
      seen.add(key);
      queue.push({r:nr,c:nc});
    }
  }
  return false;
}

/* A player only wins by occupying BOTH target squares at once (in either
   piece↔target assignment). "Not sealed" therefore has to mean a valid
   assignment still exists — each target individually reachable by at
   least one of the 2 pieces — not merely that each piece can reach
   *some* target. The old check used a single merged goal set, which let
   a wall fully seal off one whole target square as long as the other
   target stayed reachable: it passed the legality check while quietly
   making the game unwinnable. */
function targetsStillReachable(player){
  const tgts=G.targets[player];
  if(!tgts || tgts.length<2) return true; // not yet set, assume fine
  const pos=G.pos[player];
  const r0t0=hasPathToCell(pos[0].r,pos[0].c,tgts[0]);
  const r0t1=hasPathToCell(pos[0].r,pos[0].c,tgts[1]);
  const r1t0=hasPathToCell(pos[1].r,pos[1].c,tgts[0]);
  const r1t1=hasPathToCell(pos[1].r,pos[1].c,tgts[1]);
  return (r0t0&&r1t1)||(r0t1&&r1t0);
}

/* Check both players still have a valid assignment of pieces to their
   2 targets after a hypothetical wall is added. Returns true if the
   wall keeps the game winnable for both sides (i.e. the wall is LEGAL).
   This single function gates wall placement for humans (placeWallAt,
   updateWallLattice) AND every AI difficulty (aiLegalWalls) — so the
   no-full-seal rule can't drift out of sync between difficulty tiers. */
function wallKeepsAllPathsOpen(type,r,c){
  const edges = edgesForWall(type,r,c);
  // temporarily add edges
  edges.forEach(e=>G.blockedEdges.add(e));

  const ok = targetsStillReachable('white') && targetsStillReachable('blue');

  // revert
  edges.forEach(e=>G.blockedEdges.delete(e));
  return ok;
}

/* ── LEGAL MOVES (movement mode) ─────────────────────────────
   For each cardinal direction:
     - if edge to adjacent cell is walled -> cannot move that way
     - if adjacent cell empty -> normal move
     - if adjacent cell has opponent piece:
         check edge beyond opponent (same direction) for wall
         check landing cell beyond opponent is empty
         if both ok -> JUMP move (lands 2 squares away)
         else -> cannot move this direction at all
     - if adjacent cell has OWN piece -> cannot move (shouldn't happen, only 2 pieces per side, kept for safety)
*/
function getLegalMoves(player, idx){
  const pos = G.pos[player][idx];
  const moves=[];

  DIRS.forEach(({dr,dc})=>{
    const nr=pos.r+dr, nc=pos.c+dc;
    if(!inB(nr,nc)) return;
    if(wallsBlockEdge(pos.r,pos.c,nr,nc)) return; // wall blocks this direction entirely

    const occ=getPieceAt(nr,nc);
    if(!occ){
      moves.push({r:nr,c:nc,isJump:false});
    } else if(occ.p===player){
      // own piece adjacent — cannot move there (no stacking)
      return;
    } else {
      // opponent directly ahead — attempt jump
      const jr=nr+dr, jc=nc+dc;
      if(!inB(jr,jc)) return; // can't jump off board
      if(wallsBlockEdge(nr,nc,jr,jc)) return; // wall beyond opponent blocks jump
      if(getPieceAt(jr,jc)) return; // landing square occupied
      moves.push({r:jr,c:jc,isJump:true,overR:nr,overC:nc});
    }
  });

  return moves;
}

/* ── GAME STATE ──────────────────────────────────────────── */
let G={};

function newGame(){
  G={
    turn       : 'white',
    phase      : 'playing',
    pos        : {
      white : [{r:0,c:2},{r:0,c:7}],
      blue  : [{r:9,c:2},{r:9,c:7}]
    },
    targets    : { white:[], blue:[] },
    wallStock  : { white:{h:5,v:5}, blue:{h:5,v:5} },
    hwalls     : [],          // {r,c,owner}
    vwalls     : [],          // {r,c,owner}
    blockedEdges: new Set(),
    sel        : null,
    actionMode : 'move',       // 'move' | 'wall'
    wallDraft  : null,         // {type,r,c} pending placement
    carry      : null,         // active drag: {type,pointerId,startX,startY,snap}
    animating  : false,
    turns:0, jumps:0, wallsPlaced:0,
    aiMode:false, aiPlayer:'blue', aiDifficulty:0, aiThinking:false,
    moveLog:[]
  };
}

/* ── NAVIGATION ──────────────────────────────────────────── */
function goTo(s){
  closeSidebar();
  document.querySelectorAll('.screen').forEach(el=>el.classList.remove('on'));
  const el=id(s); if(el){ el.classList.add('on'); }
  document.querySelectorAll('.nav-item').forEach(n=>
    n.classList.toggle('active', n.dataset.s===s||(s==='game'&&n.dataset.s==='play'))
  );
  if(s==='stats')    renderStats();
  if(s==='tutorial'){ tutStep=0; renderTut(); }
  if(s==='profile')  renderProfile();
}
function closeSidebar(){
  id('sidebar').classList.remove('open');
  id('overlayBg').classList.remove('open');
}

/* ── BOARD BUILD ─────────────────────────────────────────── */
function buildBoard(){
  const board=id('board');
  board.innerHTML='';

  const letters='ABCDEFGHIJ'.split('');
  id('cTop').innerHTML = letters.map(c=>`<span class="clbl">${c}</span>`).join('');
  id('cBot').innerHTML = id('cTop').innerHTML;
  id('cLeft').innerHTML  = Array.from({length:10},(_,i)=>`<span class="clbl">${10-i}</span>`).join('');
  id('cRight').innerHTML = id('cLeft').innerHTML;

  for(let row=9; row>=0; row--){
    for(let col=0; col<10; col++){
      const d=document.createElement('div');
      d.className='cell '+cellColor(row,col);
      d.setAttribute('data-r',row);
      d.setAttribute('data-c',col);
      const dot=document.createElement('div');
      dot.className='mdot';
      d.appendChild(dot);
      d.addEventListener('click',()=>{ if(!G.animating) onCellClick(row,col); });
      board.appendChild(d);
    }
  }
  buildWallLayer();
}

/* getComputedStyle().getPropertyValue('--cellsz') returns the literal
   unresolved "clamp(32px,4.4vw,54px)" expression (custom properties are
   not resolved to computed lengths the way normal properties are), so
   parseFloat() on it has always silently produced NaN. That NaN poisoned
   every wall-slot position, every wall-piece size, and made the whole
   barricade layer invisible. Measure the real rendered size from an
   actual cell element instead. */
function boardMetrics(){
  const boardEl=id('board');
  const cell=boardEl.querySelector('.cell');
  const cellSz = cell ? cell.getBoundingClientRect().width : 54;
  const gutSz = parseFloat(getComputedStyle(boardEl).getPropertyValue('--gutsz')) || 7;
  return { cellSz, gutSz, step: cellSz+gutSz };
}

/* WALL VISUAL CONSTANTS
   WALL_THICK — rendered height/width of a placed barricade piece (px)
   WALL_HIT   — pointer hit-area of each slot (px), centred on gutter */
const WALL_THICK = 12;
const WALL_HIT   = 22;

function buildWallLayer(){
  const layer=id('wallLayer');
  layer.innerHTML='';
  const {cellSz,gutSz,step} = boardMetrics();
  // --cellsz/--gutsz are declared on #board; wallLayer is a *sibling* of
  // #board, not a descendant, so it never inherits them. Without this,
  // every .wslot and .wall-piece below resolves var(--cellsz)/var(--gutsz)
  // as invalid and collapses to 0×0 — invisible lines and invisible walls.
  layer.style.setProperty('--cellsz', cellSz+'px');
  layer.style.setProperty('--gutsz', gutSz+'px');

  const hitOffset = (WALL_HIT - gutSz) / 2; // px the hit-area extends into adjacent cells

  // Horizontal slots — gutter between rows r and r+1, spanning cols c and c+1
  for(let r=0;r<=8;r++){
    for(let c=0;c<=8;c++){
      const gutterTop = (9-(r+1))*step + cellSz;
      const slot=document.createElement('div');
      slot.className='wslot h';
      slot.style.top  = (gutterTop - hitOffset)+'px'; // centre 22px hit on 7px gutter
      slot.style.left = (c*step)+'px';
      slot.dataset.type='h'; slot.dataset.r=r; slot.dataset.c=c;
      layer.appendChild(slot);
    }
  }
  // Vertical slots — gutter between cols c and c+1, spanning rows r and r+1
  for(let r=0;r<=8;r++){
    for(let c=0;c<=8;c++){
      const gutterLeft = c*step + cellSz;
      const slot=document.createElement('div');
      slot.className='wslot v';
      slot.style.top  = ((9-(r+1))*step)+'px';
      slot.style.left = (gutterLeft - hitOffset)+'px'; // centre 22px hit on 7px gutter
      slot.dataset.type='v'; slot.dataset.r=r; slot.dataset.c=c;
      layer.appendChild(slot);
    }
  }
}

/* ── RENDER ──────────────────────────────────────────────── */
function render(){
  document.querySelectorAll('.cell').forEach(c=>{
    c.classList.remove('hint-free','hint-jump','sel','last-move');
    const p=c.querySelector('.piece'); if(p) p.remove();
    const dot=c.querySelector('.mdot'); if(dot) dot.style.display='none';
  });

  ['white','blue'].forEach(player=>{
    G.pos[player].forEach((pos,i)=>{
      const cell=cellEl(pos.r,pos.c); if(!cell) return;
      const p=document.createElement('div');
      p.className=`piece ${player}`;
      if(player===G.turn && G.phase==='playing') p.classList.add('active-player');
      p.addEventListener('click',e=>{ e.stopPropagation(); if(!G.animating) onPieceClick(player,i); });
      cell.appendChild(p);
    });
  });

  renderWalls();
  updatePanel();
}

function renderWalls(){
  const layer=id('wallLayer');
  layer.querySelectorAll('.wall-piece').forEach(w=>w.remove());
  const {cellSz,gutSz,step} = boardMetrics();
  const pieceOffset = (WALL_THICK - gutSz) / 2; // centre 12px piece on 7px gutter

  G.hwalls.forEach(w=>{
    const gutterTop = (9-(w.r+1))*step + cellSz;
    const el=document.createElement('div');
    el.className=`wall-piece h ${w.owner}`;
    el.style.top  = (gutterTop - pieceOffset)+'px'; // vertically centred on gutter
    el.style.left = (w.c*step)+'px';
    layer.appendChild(el);
  });
  G.vwalls.forEach(w=>{
    const gutterLeft = w.c*step + cellSz;
    const el=document.createElement('div');
    el.className=`wall-piece v ${w.owner}`;
    el.style.top  = ((9-(w.r+1))*step)+'px';
    el.style.left = (gutterLeft - pieceOffset)+'px'; // horizontally centred on gutter
    layer.appendChild(el);
  });
}

/* ── ACTION MODE TOGGLE ──────────────────────────────────── */
function setActionMode(mode){
  if(G.phase!=='playing') return;
  G.actionMode=mode;
  G.sel=null; G.wallDraft=null;
  if(G.carry){ removeWallGhost(); clearSnapMarks(); G.carry=null; }
  clearHints();
  id('modeMoveBtn').className='btn btn-sm '+(mode==='move'?'btn-blue active-toggle':'btn-out');
  id('modeWallBtn').className='btn btn-sm '+(mode==='wall'?'btn-blue active-toggle':'btn-out');
  if(mode==='wall'){
    const stock=G.wallStock[G.turn];
    if(stock.h+stock.v<=0){
      setInstr(`${pretty(G.turn)} has no barricades left.`);
    } else {
      setInstr(`Drag a glowing line to place a ${pretty(G.turn)} barricade. (${stock.h}H + ${stock.v}V remaining)`);
    }
  } else {
    setInstr(`Select a ${G.turn} piece, then click ↑↓←→ to move.`);
  }
  // wall-mode-active enables pointer-events on .wslot (they're off by default
  // so they don't block cell clicks during move mode)
  id('wallLayer').classList.toggle('wall-mode-active', mode==='wall');
  updateWallLattice();
}

/* ── SHOW MOVE HINTS ─────────────────────────────────────── */
function showHints(player,idx){
  clearHints();
  const pos=G.pos[player][idx];
  const sc=cellEl(pos.r,pos.c);
  if(sc){ sc.classList.add('sel'); const p=sc.querySelector('.piece'); if(p) p.classList.add('selected'); }
  if(!cfg.hints) return;

  const moves=getLegalMoves(player,idx);
  moves.forEach(m=>{
    const c=cellEl(m.r,m.c); if(!c) return;
    c.classList.add(m.isJump?'hint-jump':'hint-free');
    const dot=c.querySelector('.mdot'); if(dot) dot.style.display='block';
    if(m.isJump){
      const overCell=cellEl(m.overR,m.overC);
      if(overCell) overCell.classList.add('hint-jump');
    }
  });
}
function clearHints(){
  document.querySelectorAll('.cell').forEach(c=>{
    c.classList.remove('hint-free','hint-jump','sel');
    const dot=c.querySelector('.mdot'); if(dot) dot.style.display='none';
  });
  document.querySelectorAll('.piece').forEach(p=>p.classList.remove('selected'));
}

/* ── PIECE CLICK ─────────────────────────────────────────── */
function onPieceClick(player,i){

  if(
    G.phase!=='playing' ||
    G.animating ||
    G.aiThinking
  ) return;

  if(
    online.enabled &&
    !online.applyingRemote &&
    player !== onlinePlayer()
  ){
    sfxErr();
    setInstr("It's your opponent's turn.");
    return;
  }

  if(player!==G.turn){
    sfxErr();
    setInstr(`It's ${pretty(G.turn)}'s turn. Select a ${G.turn} piece.`);
    return;
  }

  if(G.sel && G.sel.p===player && G.sel.i===i){
    G.sel=null; clearHints();
    setInstr('Select a piece to move.'); return;
  }

  sfxSel();
  G.sel={p:player,i};
  showHints(player,i);

  const moves=getLegalMoves(player,i);
  const hasJump=moves.some(m=>m.isJump);
  let msg=`${pretty(player)} at ${coord(G.pos[player][i].r,G.pos[player][i].c)} — click ↑↓←→ to move.`;
  if(hasJump) msg+=' 🟠 Orange = jump over opponent.';
  setInstr(msg);
}

/* ── CELL CLICK (movement) ───────────────────────────────── */
function onCellClick(r,c){
  if(G.actionMode!=='move'||!G.sel||G.phase!=='playing') return;
  const {p,i}=G.sel;
  const moves=getLegalMoves(p,i);
  const mv=moves.find(m=>m.r===r&&m.c===c);
  if(!mv){ sfxErr(); setInstr('That square is not reachable. Choose a highlighted square.'); return; }

  clearHints();
  G.sel=null;
  doMove(p,i,r,c,mv);
}

/* ── PERFORM MOVE ────────────────────────────────────────── */
function doMove(player,idx,toR,toC,mv){
  G.animating=true;
  const fromR=G.pos[player][idx].r, fromC=G.pos[player][idx].c;
  const evs=[];

  if(mv.isJump){
    G.jumps++; gs.jumps++;
    evs.push({t:'jump',m:`🦘 ${pretty(player)} jumped over the opponent!`});
    sfxJump();
  }

  G.pos[player][idx]={r:toR,c:toC};
  evs.unshift({t:'', m:`${pretty(player)}: ${coord(fromR,fromC)} → ${coord(toR,toC)}${mv.isJump?' (jump)':''}`});

  G.turns++; gs.turns++;
  G.moveLog.push({turn:G.turns,type:'move',player,from:{r:fromR,c:fromC},to:{r:toR,c:toC},jump:!!mv.isJump});

  if(cfg.anim){
    const fc=cellEl(fromR,fromC), tc=cellEl(toR,toC);
    if(fc) flash(fc,'rgba(232,184,75,.28)');
    if(tc) setTimeout(()=>flash(tc,'rgba(59,114,240,.35)'),animMs()*.25);
  }
  if(!mv.isJump) sfxMove();

  setTimeout(()=>{
    render();
    const dest=cellEl(toR,toC); if(dest) dest.classList.add('last-move');
    evs.forEach((e,i)=>setTimeout(()=>{ banner(e.m,e.t); logEv(e.m,e.t); },i*260));

    if(checkWin(player)){
      setTimeout(()=>doWin(player),500);
      G.animating=false; return;
    }

G.turn = player==='white'?'blue':'white';

setActionMode('move');
updateTurnIndicator();

G.animating=false;

if(online.enabled && !online.applyingRemote){
  syncOnlineState();
}
     maybeAiTurn();
  }, animMs()+80);
}

/* ── WALL PLACEMENT ──────────────────────────────────────── */

/* Lights up every geometrically-legal, path-preserving slot in gold
   so the whole lattice of valid placements is visible at once while
   wall mode is active. Cleared (and recomputed) on every mode/turn
   change and after each placement. */
function updateWallLattice(){
  document.querySelectorAll('.wslot.legal').forEach(s=>s.classList.remove('legal'));
  if(G.actionMode!=='wall'||G.phase!=='playing') return;
  const stock=G.wallStock[G.turn];
  document.querySelectorAll('.wslot').forEach(slot=>{
    const type=slot.dataset.type, r=+slot.dataset.r, c=+slot.dataset.c;
    const hasStock = type==='h' ? stock.h>0 : stock.v>0;
    if(!hasStock) return;
    if(wallGeometryValid(type,r,c) && wallKeepsAllPathsOpen(type,r,c)) slot.classList.add('legal');
  });
}

/* Global pointer-event drag system — a single delegated listener on
   the wall layer plus document-level move/up, replacing the old
   per-slot click handlers. Press on any line, drag across the board,
   and the nearest matching-orientation line snaps gold (or red if
   illegal); releasing places the barricade on the snapped line. A
   press-and-release with no movement still places instantly. */
let wallDragGhost=null;

function initWallDragSystem(){
  id('wallLayer').addEventListener('pointerdown',onWallPointerDown);
  document.addEventListener('pointermove',onWallPointerMove);
  document.addEventListener('pointerup',onWallPointerUp);
  document.addEventListener('pointercancel',onWallPointerUp);
}

function onWallPointerDown(e){
  if(G.actionMode!=='wall'||G.phase!=='playing'||G.animating||G.aiThinking||G.carry) return;
  const slot=e.target.closest('.wslot');
  if(!slot) return;
  e.preventDefault();
  G.carry={type:slot.dataset.type,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,snap:null};
  try{ slot.setPointerCapture(e.pointerId); }catch(_){}
  spawnWallGhost(G.carry.type,e.clientX,e.clientY);
  updateCarriedWall(e.clientX,e.clientY);
}

function onWallPointerMove(e){
  if(!G.carry||e.pointerId!==G.carry.pointerId) return;
  updateCarriedWall(e.clientX,e.clientY);
}

function onWallPointerUp(e){
  if(!G.carry||e.pointerId!==G.carry.pointerId) return;
  const snap=G.carry.snap;
  removeWallGhost();
  clearSnapMarks();
  G.carry=null;
  if(snap) placeWallAt(snap.type,snap.r,snap.c);
}

/* Moves the ghost barricade to follow the pointer and finds the
   nearest legal slot of the carried orientation, snapping the
   highlight (and the eventual placement) to that line. */
function updateCarriedWall(clientX,clientY){
  if(!G.carry) return;

  // If the pointer leaves the board area, hide the ghost and cancel the
  // pending snap so releasing outside the board does nothing.
  const boardRect = id('board').getBoundingClientRect();
  const outsideBoard = clientX < boardRect.left || clientX > boardRect.right ||
                       clientY < boardRect.top  || clientY > boardRect.bottom;

  if(wallDragGhost) wallDragGhost.style.visibility = outsideBoard ? 'hidden' : 'visible';
  clearSnapMarks();

  if(outsideBoard){ G.carry.snap=null; return; }

  // Inside board — position ghost and find nearest legal slot
  if(wallDragGhost){
    wallDragGhost.style.left=(clientX - wallDragGhost.offsetWidth/2)+'px';
    wallDragGhost.style.top =(clientY - wallDragGhost.offsetHeight/2)+'px';
  }
  const type=G.carry.type;
  let best=null,bestDist=Infinity;
  document.querySelectorAll(`.wslot[data-type="${type}"]`).forEach(slot=>{
    const rect=slot.getBoundingClientRect();
    const dx=(rect.left+rect.width/2)-clientX, dy=(rect.top+rect.height/2)-clientY;
    const dist=dx*dx+dy*dy;
    if(dist<bestDist){ bestDist=dist; best=slot; }
  });
  if(best){
    const legal=best.classList.contains('legal');
    best.classList.add(legal?'snap-legal':'snap-illegal');
    G.carry.snap = legal ? {type,r:+best.dataset.r,c:+best.dataset.c} : null;
  } else {
    G.carry.snap=null;
  }
}
function clearSnapMarks(){
  document.querySelectorAll('.wslot.snap-legal,.wslot.snap-illegal').forEach(s=>s.classList.remove('snap-legal','snap-illegal'));
}
function spawnWallGhost(type,clientX,clientY){
  removeWallGhost();
  const {cellSz,gutSz} = boardMetrics();
  const span = cellSz*2 + gutSz; // length along the board (same as placed piece)
  const g=document.createElement('div');
  g.className=`carried-wall ${G.turn}`;
  if(type==='h'){ g.style.width=span+'px'; g.style.height=WALL_THICK+'px'; }
  else           { g.style.height=span+'px'; g.style.width=WALL_THICK+'px'; }
  document.body.appendChild(g);
  wallDragGhost=g;
}
function removeWallGhost(){
  if(wallDragGhost){ wallDragGhost.remove(); wallDragGhost=null; }
}

/* Validates and commits a barricade at the given slot — called either
   from a no-movement tap or from releasing a drag over a snapped slot. */
function placeWallAt(type,r,c){
  if(G.actionMode!=='wall'||G.phase!=='playing'||G.animating) return;

  if(online.enabled && !online.applyingRemote && G.turn !== onlinePlayer()){
    sfxErr(); setInstr("It's your opponent's turn."); return;
  }

  const stock=G.wallStock[G.turn];
  const hasStock = type==='h' ? stock.h>0 : stock.v>0;
  if(!hasStock){ sfxErr(); setInstr(`${pretty(G.turn)} has no ${type==='h'?'horizontal':'vertical'} barricades left.`); return; }

  if(!wallGeometryValid(type,r,c)){ sfxErr(); setInstr('A barricade already occupies or crosses that line.'); return; }
  if(!wallKeepsAllPathsOpen(type,r,c)){ sfxErr(); setInstr('🚫 That barricade would completely seal off a piece — illegal placement.'); return; }

  // Place it
  G.animating=true;
  if(type==='h'){ G.hwalls.push({r,c,owner:G.turn}); stock.h--; }
  else{ G.vwalls.push({r,c,owner:G.turn}); stock.v--; }
  edgesForWall(type,r,c).forEach(e=>G.blockedEdges.add(e));

  G.wallsPlaced++; gs.walls++;
  G.turns++; gs.turns++;
  G.moveLog.push({turn:G.turns,type:'wall',player:G.turn,wallType:type,r,c});

  sfxWall();
  const msg=`▥ ${pretty(G.turn)} placed a ${type==='h'?'horizontal':'vertical'} barricade.`;

  setTimeout(()=>{
    render();
    banner(msg,'wall'); logEv(msg,'wall');

    G.turn = G.turn==='white'?'blue':'white';

setActionMode('move');
updateTurnIndicator();

G.animating=false;

if(online.enabled && !online.applyingRemote){
  syncOnlineState();
}

maybeAiTurn();
  }, animMs()+40);
}

/* ── VICTORY ─────────────────────────────────────────────── */
function checkWin(player){
  const tgts=G.targets[player];
  if(!tgts||tgts.length<2) return false;
  const [p0,p1]=G.pos[player],[t0,t1]=tgts;
  const m=(p,t)=>p.r===t.r&&p.c===t.c;
  return (m(p0,t0)&&m(p1,t1))||(m(p0,t1)&&m(p1,t0));
}

function doWin(player){

  G.phase='over';

  if(online.enabled && !online.applyingRemote){
    syncOnlineState();
  }
  gs.played++; gs.won++;
  if(G.turns>gs.longest) gs.longest=G.turns;
  saveGs();
  sfxWin();

  ['white','blue'].forEach(p=>G.targets[p].forEach(t=>{
    const cell=cellEl(t.r,t.c);
    if(cell) cell.classList.add('is-target');
  }));

  id('victTitle').textContent=pretty(player)+' Wins!';
  id('victStats').innerHTML=
    `<div class="vs"><span class="vs-val">${G.turns}</span><span class="vs-lbl">Turns</span></div>`+
    `<div class="vs"><span class="vs-val">${G.jumps}</span><span class="vs-lbl">Jumps</span></div>`+
    `<div class="vs"><span class="vs-val">${G.wallsPlaced}</span><span class="vs-lbl">Walls Placed</span></div>`;
  id('victOv').classList.add('open');
  doConfetti();
  logGameToSupabase(player);
}
/* "Play Again" needs to relaunch whatever mode was actually being
   played — previously it always called startGame(G.practice), which
   silently dropped back to Local Multiplayer even after an AI or
   online match (G.practice no longer exists at all now that Practice
   Mode is gone, but the underlying bug was the same either way). */
function restartGame(){
  id('victOv').classList.remove('open');

  if(G.aiMode){
    startAiGame(G.aiDifficulty);
    return;
  }

  if(online.enabled){
    // A real online rematch needs both clients to coordinate a fresh
    // room handshake together, which is out of scope here — send the
    // player back to the lobby rather than silently restarting as a
    // different mode or leaving a stale room connection behind.
    leaveOnlineGame();
    goTo('play');
    return;
  }

  startGame();
}

/* ── CONFETTI ────────────────────────────────────────────── */
function doConfetti(){
  const clrs=['#e8b84b','#f5d07a','#1a56db','#3b72f0','#fff','#c8cfe0'];
  for(let i=0;i<88;i++){
    const e=document.createElement('div');
    e.className='cf';
    e.style.left=Math.random()*100+'vw';
    e.style.top='-8px';
    e.style.background=clrs[Math.floor(Math.random()*clrs.length)];
    const s=4+Math.random()*8;
    e.style.width=s+'px'; e.style.height=(Math.random()>.5?s:s*2)+'px';
    e.style.borderRadius=Math.random()>.5?'50%':'2px';
    e.style.animationDuration=(1.6+Math.random()*2)+'s';
    e.style.animationDelay=Math.random()*.8+'s';
    document.body.appendChild(e);
    setTimeout(()=>e.remove(),4000);
  }
}

/* ── FLASH ───────────────────────────────────────────────── */
function flash(cell,color){
  cell.style.transition=`background ${animMs()*.4}ms ease`;
  cell.style.background=color;
  setTimeout(()=>{ cell.style.background=''; cell.style.transition=''; },animMs());
}

/* ── BANNER / LOG ────────────────────────────────────────── */
let _bTmr;
function banner(msg,type){
  const b=id('evBanner');
  b.textContent=msg; b.className=(type?type:'')+' show';
  clearTimeout(_bTmr); _bTmr=setTimeout(()=>b.classList.remove('show'),2500);
}
function logEv(msg,type){
  const log=id('evLog');
  const d=document.createElement('div');
  d.className='ev '+(type||'');
  d.textContent=msg;
  log.prepend(d);
  while(log.children.length>15) log.removeChild(log.lastChild);
}

/* ── PANEL ───────────────────────────────────────────────── */
function updatePanel(){
  id('stTurns').textContent = G.turns||0;
  id('stJumps').textContent = G.jumps||0;
  id('stWalls').textContent = G.wallsPlaced||0;

  const ps=id('pieceStatus');
  ps.innerHTML=['white','blue'].flatMap(p=>
    G.pos[p].map((pos,i)=>`<div class="pchip">
        <div class="pchip-orb ${p}"></div>
        <span style="font-size:.7rem;color:var(--muted)">${pretty(p)}</span>
        <span class="pchip-pos">${coord(pos.r,pos.c)}</span>
      </div>`)
  ).join('');

  const wi=id('wallInv');
  wi.innerHTML = ['white','blue'].map(p=>{
    const s=G.wallStock[p];
    const hDots=Array.from({length:5},(_,i)=>`<div class="wdot ${i<s.h?p+'-w':'used'}"></div>`).join('');
    const vDots=Array.from({length:5},(_,i)=>`<div class="wdot ${i<s.v?p+'-w':'used'}"></div>`).join('');
    return `<div class="wall-inv-row"><span>${pretty(p)} H</span><div class="wall-inv-dots">${hDots}</div></div>
            <div class="wall-inv-row"><span>${pretty(p)} V</span><div class="wall-inv-dots">${vDots}</div></div>`;
  }).join('');
}

function updateTurnIndicator(){
  const c=G.turn;
  id('turnOrb').className='turn-orb '+c;
  id('turnLbl').textContent=pretty(c)+"'s Turn";
  const tw=id('turnWrap');
  tw.classList.remove('pulse'); void tw.offsetWidth; tw.classList.add('pulse');
  setTimeout(()=>tw.classList.remove('pulse'),800);
}
function setInstr(t){ const e=id('instr'); if(e) e.textContent=t; }

/* ── START GAME ──────────────────────────────────────────── */
function startGame(){
  newGame();
  goTo('game');
  setTimeout(()=>{
    buildBoard();
    render();
    updateTurnIndicator();
    setActionMode('move');
    id('evLog').innerHTML='';
    id('victOv').classList.remove('open');
    setInstr('Select a white piece, then click ↑↓←→ to move.');
    setTimeout(()=>openTargetModal('white'),300);
  },60);
}

/* ── TARGET SELECTION ────────────────────────────────────── */
let _tmpTgts=[];
let _curTgtPlayer=null;

function openTargetModal(player){
  _curTgtPlayer=player;
  G.targets[player]=[];
  _tmpTgts=[];
  const tgtRow=player==='white'?9:0;
  id('tgtTitle').textContent=`${pretty(player)} — Choose Secret Targets`;
  id('tgtSub').textContent=`Select 2 squares on row ${player==='white'?'10':'1'} (glowing gold). Both your pieces must reach these to win.`;
  id('tgtBadge').innerHTML=`<div class="pbadge ${player}"><div class="pbadge-dot ${player}"></div>${pretty(player)} Player</div>`;
  id('tgtCount').textContent='0';
  id('tgtConfirm').disabled=true;
  buildMini(player,tgtRow);
  id('tgtModal').classList.add('open');
}

function buildMini(player,tgtRow){
  const mb=id('miniBoard'); mb.innerHTML='';
  const own=G.pos[player];
  for(let row=9;row>=0;row--){
    for(let col=0;col<10;col++){
      const d=document.createElement('div');
      d.className='mc '+cellColor(row,col);
      const isTgt=row===tgtRow;
      if(isTgt) d.classList.add('tgt-row');
      if(_tmpTgts.some(t=>t.r===row&&t.c===col)) d.classList.add('sel-tgt');
      if(own.some(p=>p.r===row&&p.c===col)){
        const mp=document.createElement('div');
        mp.className='mpc '+player; d.appendChild(mp);
      }
      if(isTgt) d.addEventListener('click',()=>onMiniClick(row,col,player,tgtRow));
      mb.appendChild(d);
    }
  }
}

function onMiniClick(r,c,player,tgtRow){
  if(r!==tgtRow) return;
  const idx=_tmpTgts.findIndex(t=>t.r===r&&t.c===c);
  if(idx!==-1) _tmpTgts.splice(idx,1);
  else if(_tmpTgts.length<2) _tmpTgts.push({r,c});
  id('tgtCount').textContent=_tmpTgts.length;
  id('tgtConfirm').disabled=_tmpTgts.length<2;
  buildMini(player,tgtRow);
}

function confirmTargets(){
  const player=_curTgtPlayer;
  G.targets[player]=[..._tmpTgts];
  id('tgtModal').classList.remove('open');

  if(online.enabled){
    syncOnlineTargets();
    setInstr('Waiting for opponent to choose their targets…');
    pollForOpponentTargets();
    return;
  }

  if(player==='white'){
    if(G.aiMode){
      // Auto-pick 2 distinct random columns for the AI on row 0
      const cols=[];
      while(cols.length<2){ const c=Math.floor(Math.random()*10); if(!cols.includes(c)) cols.push(c); }
      G.targets.blue=cols.map(c=>({r:0,c}));
      beginPlay();
    } else {
      id('passModal').classList.add('open');
    }
  } else {
    beginPlay();
  }
}
function toP2(){ id('passModal').classList.remove('open'); openTargetModal('blue'); }
function beginPlay(){
  G.phase='playing'; G.turn='white';
  render(); updateTurnIndicator(); setActionMode('move');
  logEv('🎮 Game started — White moves first.','');
  setInstr('Select a white piece, then click ↑↓←→ to move.');
}

/* ── TUTORIAL ────────────────────────────────────────────── */
const TUTS=[
  {title:'Welcome to STEENE',
   desc:'STEENE is a 2-player strategy game on a 10×10 board. Each player controls 2 pieces and has 10 barricades (5 horizontal, 5 vertical). Before play, each secretly picks 2 target squares on the opponent\'s side. First to land both pieces on their targets simultaneously wins.',
   demo:`<div style="display:flex;gap:13px;align-items:center">
     <div style="width:50px;height:50px;border-radius:9px;overflow:hidden;display:flex;box-shadow:0 0 0 2px var(--gold)">
       <div style="width:50%;background:#0a0a12"></div><div style="width:50%;background:#fff"></div>
     </div>
     <div style="text-align:left;font-size:.82rem;color:var(--muted);line-height:1.85">10×10 board<br>2 pieces per player<br>10 barricades each<br>Secret targets</div>
   </div>`},
  {title:'Movement — ↑↓←→ Only',
   desc:'On your turn, choose to either MOVE a piece or PLACE A BARRICADE — never both. A move is exactly 1 square Up, Down, Left or Right. No diagonals.',
   demo:`<div style="display:grid;grid-template-columns:repeat(3,46px);grid-template-rows:repeat(3,46px);gap:3px">
     <div></div>
     <div style="background:rgba(26,86,219,.22);border:2px solid var(--blue2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--blue2);font-size:1.1rem">↑</div>
     <div></div>
     <div style="background:rgba(26,86,219,.22);border:2px solid var(--blue2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--blue2);font-size:1.1rem">←</div>
     <div style="border-radius:50%;background:radial-gradient(circle at 35% 32%,#fff,#c0c8e0);box-shadow:0 0 0 2.5px var(--gold);width:40px;height:40px;margin:3px"></div>
     <div style="background:rgba(26,86,219,.22);border:2px solid var(--blue2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--blue2);font-size:1.1rem">→</div>
     <div></div>
     <div style="background:rgba(26,86,219,.22);border:2px solid var(--blue2);border-radius:4px;display:flex;align-items:center;justify-content:center;color:var(--blue2);font-size:1.1rem">↓</div>
     <div></div>
   </div>`},
  {title:'Jumping Over an Opponent',
   desc:'If an opponent\'s piece is directly ahead of you, you jump straight over it and land on the next square beyond — as long as that square is empty and not walled off. You never land on or push the opponent.',
   demo:`<div style="display:flex;flex-direction:column;gap:10px;align-items:center">
     <div style="font-size:.74rem;color:var(--muted)">White jumps straight over Blue</div>
     <div style="display:flex;align-items:center;gap:3px">
       <div style="width:42px;height:42px;background:#e0e4f5;border-radius:3px;display:flex;align-items:center;justify-content:center"><div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#fff,#c0c8e0);box-shadow:0 0 0 2.5px var(--gold)"></div></div>
       <div style="width:42px;height:42px;background:rgba(232,140,30,.16);border:2px solid var(--gold);border-radius:3px;display:flex;align-items:center;justify-content:center"><div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#4a6ee0,#0a1560)"></div></div>
       <div style="width:42px;height:42px;background:rgba(232,140,30,.1);border:2px dashed var(--gold);border-radius:3px;display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:1.2rem">●</div>
     </div>
     <div style="font-size:.7rem;color:var(--gold)">Orange path = jump trajectory, lands 2 squares ahead</div>
   </div>`},
  {title:'Barricades — 10 Per Player',
   desc:'Instead of moving, place ONE barricade on a line between cells: horizontal or vertical. You have 5 of each. Barricades block movement and jumps straight through that line.\n\nA barricade can never seal off any piece completely — if doing so would leave a piece with NO route to its targets, the placement is blocked automatically.',
   demo:`<div style="text-align:center">
     <div style="display:inline-flex;gap:8px;align-items:center;margin-bottom:10px">
       <div style="width:40px;height:40px;background:#0d0d1a;border-radius:3px;position:relative;display:flex;align-items:center;justify-content:center">
         <div style="width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#fff,#c0c8e0)"></div>
         <div style="position:absolute;bottom:-5px;left:-2px;width:calc(100%+4px);height:6px;background:linear-gradient(135deg,#4a6ee0,#1a2a8a);border-radius:2px"></div>
       </div>
       <div style="width:40px;height:40px;background:#e0e4f5;border-radius:3px"></div>
     </div>
     <div style="font-size:.78rem;color:var(--muted)">5 horizontal + 5 vertical walls per player</div>
   </div>`},
  {title:'Secret Targets & Winning 🎯',
   desc:'Win by landing BOTH your pieces on your 2 secret target squares at the same time. Targets sit on the opponent\'s starting row. Your opponent watches your moves and walls to guess your targets — disguise your route!',
   demo:`<div style="text-align:center"><div style="font-size:2rem;margin-bottom:10px">🎯🎯</div>
     <div style="font-size:.82rem;color:var(--muted);line-height:1.8">Pick 2 squares on opponent's row<br>Land BOTH pieces simultaneously<br>Misdirect with your moves and walls</div></div>`},
  {title:'Ready to Play!',
   desc:'Move ↑↓←→ or place a barricade — one action per turn. Jump over opponents blocking your path. Use your 10 barricades wisely to carve a maze in your favor. Race both pieces to your secret targets. Good luck!',
   demo:`<div style="text-align:center">
     <div style="width:54px;height:54px;border-radius:10px;overflow:hidden;display:flex;box-shadow:0 0 0 2px var(--gold);margin:0 auto 13px">
       <div style="width:50%;background:#0a0a12"></div><div style="width:50%;background:#fff"></div>
     </div>
     <div style="font-family:var(--fd);font-size:1.2rem;font-weight:800;letter-spacing:.12em">STEENE</div>
     <div style="font-size:.73rem;color:var(--gold);margin-top:5px;letter-spacing:.08em">Control the Motion. Predict the Destination.</div>
   </div>`}
];

let tutStep=0;
function renderTut(){
  id('tutContent').innerHTML=TUTS.map((s,i)=>`
    <div class="tut-step ${i===tutStep?'on':''}" id="ts${i}">
      <div class="tut-n">Step ${i+1} of ${TUTS.length}</div>
      <div class="tut-title">${s.title}</div>
      <div class="tut-demo">${s.demo}</div>
      <div class="tut-desc">${s.desc.replace(/\n/g,'<br>')}</div>
    </div>`).join('');
  id('tutDots').innerHTML=TUTS.map((_,i)=>`
    <div class="tut-dot ${i===tutStep?'on':''}" onclick="tutStep=${i};renderTut()"></div>`).join('');
  id('tutPrev').disabled=tutStep===0;
  id('tutNext').textContent=tutStep===TUTS.length-1?'▶ Play Now':'Next →';
}
function tutGo(d){
  if(d===1&&tutStep===TUTS.length-1){goTo('play');return;}
  tutStep=Math.max(0,Math.min(TUTS.length-1,tutStep+d));
  renderTut();
}

/* ══════════════════════════════════════════════════════════
   AI ENGINE
   ══════════════════════════════════════════════════════════ */

/* ── Difficulty modal ───────────────────────────────────── */
let _selectedDiff = -1;
function openDiffModal(){
  _selectedDiff=-1;
  document.querySelectorAll('.diff-card').forEach(c=>c.classList.remove('selected'));
  id('diffConfirm').disabled=true;
  const statusEl=id('aiLearnStatus');
  if(statusEl){ statusEl.textContent='🧠 Loading shared AI experience…'; statusEl.className='ai-learn-status'; }
  loadAiLearningStatus();
  id('diffModal').classList.add('open');
}
function closeDiffModal(){ id('diffModal').classList.remove('open'); }
function selectDiff(d){
  _selectedDiff=d;
  document.querySelectorAll('.diff-card').forEach((c,i)=>c.classList.toggle('selected',i===d));
  id('diffConfirm').disabled=false;
}
function confirmDiff(){
  if(_selectedDiff<0) return;
  closeDiffModal();
  startAiGame(_selectedDiff);
}

/* ── Start an AI game ───────────────────────────────────── */
function startAiGame(difficulty){
  newGame(false);
  G.aiMode=true; G.aiPlayer='blue'; G.aiDifficulty=difficulty; G.aiThinking=false;
  goTo('game');
  setTimeout(()=>{
    buildBoard(); render(); updateTurnIndicator(); setActionMode('move');
    id('evLog').innerHTML=''; id('victOv').classList.remove('open');
    const names=['Beginner','Amateur','Regular','Pro','Master','Legend'];
    setInstr(`You are White. AI is Blue (${names[difficulty]}). Select a piece to move.`);
    setTimeout(()=>openTargetModal('white'),300);
  },60);
}

/* ── BFS distance: steps from (startR,startC) to nearest cell in
   targets[], respecting G.blockedEdges + optional extraEdges Set. ── */
function aiBfsDistance(startR,startC,targets,extraEdges){
  if(!targets||!targets.length) return 0;
  const goals=new Set(targets.map(t=>`${t.r},${t.c}`));
  if(goals.has(`${startR},${startC}`)) return 0;
  const seen=new Set([`${startR},${startC}`]);
  const queue=[{r:startR,c:startC,d:0}];
  while(queue.length){
    const {r,c,d}=queue.shift();
    for(const {dr,dc} of DIRS){
      const nr=r+dr, nc=c+dc;
      if(!inB(nr,nc)) continue;
      const ek=edgeKey(r,c,nr,nc);
      if(G.blockedEdges.has(ek)) continue;
      if(extraEdges&&extraEdges.has(ek)) continue;
      const k=`${nr},${nc}`;
      if(seen.has(k)) continue;
      seen.add(k);
      if(goals.has(k)) return d+1;
      queue.push({r:nr,c:nc,d:d+1});
    }
  }
  return Infinity;
}

/* Total moves for player to get both pieces to targets (optimal assignment). */
function aiTotalPath(player,extraEdges){
  const pos=G.pos[player], tgts=G.targets[player];
  if(!tgts||tgts.length<2) return 0;
  const d00=aiBfsDistance(pos[0].r,pos[0].c,[tgts[0]],extraEdges);
  const d01=aiBfsDistance(pos[0].r,pos[0].c,[tgts[1]],extraEdges);
  const d10=aiBfsDistance(pos[1].r,pos[1].c,[tgts[0]],extraEdges);
  const d11=aiBfsDistance(pos[1].r,pos[1].c,[tgts[1]],extraEdges);
  return Math.min(d00+d11, d01+d10);
}

function aiRandomMove(ai){
  const all=[];
  for(let i=0;i<2;i++) getLegalMoves(ai,i).forEach(m=>all.push({idx:i,...m}));
  return all.length ? all[Math.floor(Math.random()*all.length)] : null;
}

function aiGreedyMove(ai){
  let best=null, bestDist=Infinity;
  for(let idx=0;idx<2;idx++){
    const orig=G.pos[ai][idx];
    getLegalMoves(ai,idx).forEach(mv=>{
      G.pos[ai][idx]={r:mv.r,c:mv.c};
      const d=aiTotalPath(ai,null);
      G.pos[ai][idx]=orig;
      if(d<bestDist){bestDist=d; best={idx,r:mv.r,c:mv.c,mv};}
    });
  }
  return best||aiRandomMove(ai);
}

function aiLegalWalls(ai){
  const walls=[];
  for(let r=0;r<=8;r++) for(let c=0;c<=8;c++) for(const type of['h','v']){
    if(type==='h'&&G.wallStock[ai].h<=0) continue;
    if(type==='v'&&G.wallStock[ai].v<=0) continue;
    if(wallGeometryValid(type,r,c)&&wallKeepsAllPathsOpen(type,r,c)) walls.push({type,r,c});
  }
  return walls;
}

/* BFS-based wall score: oppGain - penalty*ownHurt + 0.6*ownImprove.
   Still used by aiStrategicWallScore below — the legacy sampling/
   positional-scoring wrapper that used to call this (aiFindBestWall,
   aiPositionalScore, aiShuffle) was removed since aiDecide() only
   calls aiFindStrategicWall now; that older path was fully dead code. */
function aiScoreWall(wall,ai,opp,penalty){
  const extra=new Set(edgesForWall(wall.type,wall.r,wall.c));
  const oppBefore=aiTotalPath(opp,null), aiBefore=aiTotalPath(ai,null);
  const oppAfter =aiTotalPath(opp,extra), aiAfter =aiTotalPath(ai,extra);
  const oppGain   = oppAfter  - oppBefore;
  const ownImprove= Math.max(0, aiBefore - aiAfter);
  const ownHurt   = Math.max(0, aiAfter  - aiBefore);
  return oppGain + ownImprove*0.6 - ownHurt*penalty;
}

/* Main AI decision. */
function aiStrategicWallScore(wall,ai,opp,moveGain){
  const base=aiScoreWall(wall,ai,opp,1.0);
  const own=aiTotalPath(ai,null);
  const extra=new Set(edgesForWall(wall.type,wall.r,wall.c));
  const ownAfter=aiTotalPath(ai,extra);
  const oppBefore=aiTotalPath(opp,null);
  const oppAfter=aiTotalPath(opp,extra);
  const delay=Math.max(0,oppAfter-oppBefore);
  const selfDamage=Math.max(0,ownAfter-own);
  const createsOwnRoute=Math.max(0,own-ownAfter);
  const purpose=Math.max(0,delay*1.4-selfDamage*1.6+createsOwnRoute*1.25);
  return base + purpose - (delay===0 && createsOwnRoute===0 ? 2 : 0) - Math.max(0,moveGain-purpose)*0.55;
}

function aiFindStrategicWall(ai,opp,moveGain){
  const walls=aiLegalWalls(ai);
  let best=null,bestScore=0;
  for(const w of walls){
    const score=aiStrategicWallScore(w,ai,opp,moveGain);
    if(score>bestScore){ best={...w,score}; bestScore=score; }
  }
  return best;
}

function aiDecide(){
  const ai=G.aiPlayer;
  const opp=ai==='blue'?'white':'blue';
  const d=G.aiDifficulty;
  const move=aiGreedyMove(ai);
  if(!move) return null;

  const before=aiTotalPath(ai,null);
  const orig=G.pos[ai][move.idx];
  G.pos[ai][move.idx]={r:move.r,c:move.c};
  const moveGain=Math.max(0,before-aiTotalPath(ai,null));
  G.pos[ai][move.idx]=orig;

  const hasWalls=G.wallStock[ai].h+G.wallStock[ai].v>0;
  if(!hasWalls) return {action:'move',...move};

  /* Higher difficulty means better wall evaluation, not more wall usage. */
  const wall=aiFindStrategicWall(ai,opp,moveGain);
  // Small, capped nudge from shared match history — more logged AI games
  // makes the AI marginally more willing to commit to a strategic wall,
  // without letting it swamp the base per-difficulty threshold.
  const learnAdj = Math.min(0.35, Math.log10(aiLearnState.gamesSeen+1)*0.08);
  const threshold=([2.2,1.8,1.35,0.95,0.6,0.3][d] ?? 1.0) - learnAdj;

  /* Beginner/Amateur only recognize obvious blocks. */
  if(d<2 && wall && wall.score>=threshold && Math.random() < (d===0?.45:.65))
    return {action:'wall',...wall};

  /* Regular+ compare the strategic wall directly against the best move. */
  if(d>=2 && wall && wall.score>=threshold && wall.score>moveGain+0.45)
    return {action:'wall',...wall};

  return {action:'move',...move};
}

const AI_THINK_MS=[500,625,725,900,1100,1600];

function aiTakeTurn(){
  if(G.phase!=='playing'||!G.aiMode||G.turn!==G.aiPlayer) return;
  G.aiThinking=true;
  const names=['Beginner','Amateur','Regular','Pro','Master','Legend'];
  setInstr(`🤖 ${names[G.aiDifficulty]} AI is thinking…`);
  const ti=id('turnWrap');
  if(ti){
    const old=id('aiBadge'); if(old) old.remove();
    const b=document.createElement('span');
    b.className='ai-badge ai-thinking-pulse'; b.textContent='thinking'; b.id='aiBadge';
    ti.appendChild(b);
  }
  const delay=AI_THINK_MS[G.aiDifficulty]+Math.random()*300;
  setTimeout(()=>{
    const badge=id('aiBadge'); if(badge) badge.remove();
    if(G.phase!=='playing'||G.turn!==G.aiPlayer){G.aiThinking=false;return;}
    const dec=aiDecide();
    G.aiThinking=false;
    if(!dec) return;
    if(dec.action==='move'){
      const mv=getLegalMoves(G.aiPlayer,dec.idx).find(m=>m.r===dec.r&&m.c===dec.c);
      if(mv) doMove(G.aiPlayer,dec.idx,dec.r,dec.c,mv);
    } else {
      // placeWallAt guards on actionMode==='wall', so set it first
      G.actionMode='wall';
      placeWallAt(dec.type,dec.r,dec.c);
    }
  },delay);
}

/* Called after every turn switch to trigger AI or restore human instructions. */
function maybeAiTurn(){
  if(!G.aiMode) return;
  if(G.turn===G.aiPlayer){
    aiTakeTurn();
  } else {
    const names=['Beginner','Amateur','Regular','Pro','Master','Legend'];
    setInstr(`Your move (White) — vs ${names[G.aiDifficulty]} AI.`);
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
