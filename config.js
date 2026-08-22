/* ==========================================================
   STEENE — config.js
   Settings persistence, global stats, audio, and small shared
   helpers/constants used by every other file (board.js, ai.js,
   online.js). Load this file FIRST.
   ========================================================== */

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

