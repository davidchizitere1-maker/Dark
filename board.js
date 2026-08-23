/* ==========================================================
   STEENE — src/game/board.js
   Core game state, board generation (dynamic sizing),
   rendering, and turn orchestration.
   Delegates abstract rules (pathfinding, validation) to logic.js.
   ========================================================== */

let G = {};

/* ── GAME STATE INITIALIZATION ───────────────────────────── */
function newGame(config) {
  config = config || {};
  const size = config.boardSize || 10;
  const pc = config.pieceMode || 2;
  
  // Dynamically calculate starting positions based on board size
  const wPos = [];
  const bPos = [];
  const spacing = size / (pc + 1);
  
  for(let i = 1; i <= pc; i++) {
    let col = Math.floor(i * spacing);
    wPos.push({r: 0, c: col});
    bPos.push({r: size - 1, c: col});
  }
  
  // Scale wall stock based on board size (e.g., 10x10 gets 5, 12x12 gets 6)
  const baseWalls = Math.floor((size * size) / 20);

  G = {
    boardSize: size,
    pieceCount: pc,
    turn: 'white',
    phase: 'playing',
    pos: { white: wPos, blue: bPos },
    targets: { white: [], blue: [] },
    wallStock: { white: {h: baseWalls, v: baseWalls}, blue: {h: baseWalls, v: baseWalls} },
    hwalls: [],          
    vwalls: [],          
    blockedEdges: new Set(),
    sel: null,
    actionMode: 'move',       
    wallDraft: null,         
    carry: null,         
    animating: false,
    turns: 0, jumps: 0, wallsPlaced: 0,
    aiMode: false, aiPlayer: 'blue', aiDifficulty: 0, aiThinking: false,
    timerEnabled: !!config.timerEnabled, 
    timerSeconds: config.timerSeconds || 45,
    moveLog: []
  };
}

function startLocalGame(config) {
  newGame(config);
  goTo('game');
  setTimeout(() => {
    buildBoard(); 
    render(); 
    updateTurnIndicator(); 
    setActionMode('move');
    id('evLog').innerHTML = ''; 
    id('victOv').classList.remove('open');
    setInstr(`Select a white piece, then click ↑↓←→ to move.`);
    setTimeout(() => openTargetModal('white'), 300);
  }, 60);
}

/* ── BOARD BUILD ─────────────────────────────────────────── */
function buildBoard() {
  const board = id('board');
  board.innerHTML = '';
  
  // Inject dynamic CSS variable for grid template
  board.style.setProperty('--board-size', G.boardSize);

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const colsHtml = Array.from({length: G.boardSize}, (_, i) => `<span class="clbl">${letters[i]}</span>`).join('');
  id('cTop').innerHTML = colsHtml;
  id('cBot').innerHTML = colsHtml;
  
  const rowsHtml = Array.from({length: G.boardSize}, (_, i) => `<span class="clbl">${G.boardSize - i}</span>`).join('');
  id('cLeft').innerHTML  = rowsHtml;
  id('cRight').innerHTML = rowsHtml;

  for(let row = G.boardSize - 1; row >= 0; row--) {
    for(let col = 0; col < G.boardSize; col++) {
      const d = document.createElement('div');
      d.className = 'cell ' + cellColor(row, col);
      d.setAttribute('data-r', row);
      d.setAttribute('data-c', col);
      const dot = document.createElement('div');
      dot.className = 'mdot';
      d.appendChild(dot);
      d.addEventListener('click', () => { if(!G.animating) onCellClick(row, col); });
      board.appendChild(d);
    }
  }
  buildWallLayer();
}

function boardMetrics() {
  const boardEl = id('board');
  const cell = boardEl.querySelector('.cell');
  const cellSz = cell ? cell.getBoundingClientRect().width : 54;
  const gutSz = parseFloat(getComputedStyle(boardEl).getPropertyValue('--gutsz')) || 7;
  return { cellSz, gutSz, step: cellSz + gutSz };
}

const WALL_THICK = 12;
const WALL_HIT   = 22;

function buildWallLayer() {
  const layer = id('wallLayer');
  layer.innerHTML = '';
  const {cellSz, gutSz, step} = boardMetrics();
  
  layer.style.setProperty('--cellsz', cellSz + 'px');
  layer.style.setProperty('--gutsz', gutSz + 'px');

  const hitOffset = (WALL_HIT - gutSz) / 2; 

  // Horizontal slots
  for(let r = 0; r < G.boardSize - 1; r++) {
    for(let c = 0; c < G.boardSize - 1; c++) {
      const gutterTop = ((G.boardSize - 1) - (r + 1)) * step + cellSz;
      const slot = document.createElement('div');
      slot.className = 'wslot h';
      slot.style.top  = (gutterTop - hitOffset) + 'px'; 
      slot.style.left = (c * step) + 'px';
      slot.dataset.type = 'h'; slot.dataset.r = r; slot.dataset.c = c;
      layer.appendChild(slot);
    }
  }
  // Vertical slots
  for(let r = 0; r < G.boardSize - 1; r++) {
    for(let c = 0; c < G.boardSize - 1; c++) {
      const gutterLeft = c * step + cellSz;
      const slot = document.createElement('div');
      slot.className = 'wslot v';
      slot.style.top  = (((G.boardSize - 1) - (r + 1)) * step) + 'px';
      slot.style.left = (gutterLeft - hitOffset) + 'px'; 
      slot.dataset.type = 'v'; slot.dataset.r = r; slot.dataset.c = c;
      layer.appendChild(slot);
    }
  }
}

/* ── RENDER ──────────────────────────────────────────────── */
function render() {
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('hint-free', 'hint-jump', 'sel', 'last-move', 'own-target');
    const p = c.querySelector('.piece'); if(p) p.remove();
    const dot = c.querySelector('.mdot'); if(dot) dot.style.display = 'none';
  });

  ['white', 'blue'].forEach(player => {
    G.pos[player].forEach((pos, i) => {
      const cell = cellEl(pos.r, pos.c); if(!cell) return;
      const p = document.createElement('div');
      p.className = `piece ${player}`;
      if(player === G.turn && G.phase === 'playing') p.classList.add('active-player');
      p.addEventListener('click', e => { e.stopPropagation(); if(!G.animating) onPieceClick(player, i); });
      cell.appendChild(p);
    });
  });

  myTargetsForDisplay().forEach(t => {
    const cell = cellEl(t.r, t.c);
    if(cell) cell.classList.add('own-target');
  });

  renderWalls();
  updatePanel();
}

function myTargetsForDisplay() {
  if(G.phase !== 'playing' || (typeof online === 'undefined' || !online.enabled)) return [];
  return G.targets[onlinePlayer()] || [];
}

function renderWalls() {
  const layer = id('wallLayer');
  layer.querySelectorAll('.wall-piece').forEach(w => w.remove());
  const {cellSz, gutSz, step} = boardMetrics();
  const pieceOffset = (WALL_THICK - gutSz) / 2;

  G.hwalls.forEach(w => {
    const gutterTop = ((G.boardSize - 1) - (w.r + 1)) * step + cellSz;
    const el = document.createElement('div');
    el.className = `wall-piece h ${w.owner}`;
    el.style.top  = (gutterTop - pieceOffset) + 'px'; 
    el.style.left = (w.c * step) + 'px';
    layer.appendChild(el);
  });
  G.vwalls.forEach(w => {
    const gutterLeft = w.c * step + cellSz;
    const el = document.createElement('div');
    el.className = `wall-piece v ${w.owner}`;
    el.style.top  = (((G.boardSize - 1) - (w.r + 1)) * step) + 'px';
    el.style.left = (gutterLeft - pieceOffset) + 'px'; 
    layer.appendChild(el);
  });
}

/* ── ACTION MODE & HINTS ─────────────────────────────────── */
function setActionMode(mode) {
  if(G.phase !== 'playing') return;
  G.actionMode = mode;
  G.sel = null; G.wallDraft = null;
  if(G.carry) { removeWallGhost(); clearSnapMarks(); G.carry = null; }
  clearHints();
  
  id('modeMoveBtn').className = 'btn btn-sm ' + (mode === 'move' ? 'btn-blue active-toggle' : 'btn-out');
  id('modeWallBtn').className = 'btn btn-sm ' + (mode === 'wall' ? 'btn-blue active-toggle' : 'btn-out');
  
  if(mode === 'wall') {
    const stock = G.wallStock[G.turn];
    if(stock.h + stock.v <= 0) {
      setInstr(`${pretty(G.turn)} has no barricades left.`);
    } else {
      setInstr(`Drag a glowing line to place a barricade. (${stock.h}H + ${stock.v}V remaining)`);
    }
  } else {
    setInstr(`Select a ${G.turn} piece, then click ↑↓←→ to move.`);
  }
  
  id('wallLayer').classList.toggle('wall-mode-active', mode === 'wall');
  updateWallLattice();
}

function showHints(player, idx) {
  clearHints();
  const pos = G.pos[player][idx];
  const sc = cellEl(pos.r, pos.c);
  if(sc) { sc.classList.add('sel'); const p = sc.querySelector('.piece'); if(p) p.classList.add('selected'); }
  if(!cfg.hints) return;

  const moves = getLegalMoves(player, idx);
  moves.forEach(m => {
    const c = cellEl(m.r, m.c); if(!c) return;
    c.classList.add(m.isJump ? 'hint-jump' : 'hint-free');
    const dot = c.querySelector('.mdot'); if(dot) dot.style.display = 'block';
    if(m.isJump) {
      const overCell = cellEl(m.overR, m.overC);
      if(overCell) overCell.classList.add('hint-jump');
    }
  });
}

function clearHints() {
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('hint-free', 'hint-jump', 'sel');
    const dot = c.querySelector('.mdot'); if(dot) dot.style.display = 'none';
  });
  document.querySelectorAll('.piece').forEach(p => p.classList.remove('selected'));
}

/* ── INTERACTION EVENTS ──────────────────────────────────── */
function onPieceClick(player, i) {
  if (typeof replay !== 'undefined' && replay.active) return;
  if (G.phase !== 'playing' || G.animating || G.aiThinking) return;

  if (typeof online !== 'undefined' && online.enabled && !online.applyingRemote && player !== onlinePlayer()) {
    sfxErr(); setInstr("It's your opponent's turn."); return;
  }

  if (player !== G.turn) {
    sfxErr(); setInstr(`It's ${pretty(G.turn)}'s turn. Select a ${G.turn} piece.`); return;
  }

  if (G.sel && G.sel.p === player && G.sel.i === i) {
    G.sel = null; clearHints();
    setInstr('Select a piece to move.'); return;
  }

  sfxSel();
  G.sel = {p: player, i};
  showHints(player, i);

  const moves = getLegalMoves(player, i);
  const hasJump = moves.some(m => m.isJump);
  let msg = `${pretty(player)} at ${coord(G.pos[player][i].r, G.pos[player][i].c)} — click ↑↓←→ to move.`;
  if(hasJump) msg += ' 🟠 Orange = jump over opponent.';
  setInstr(msg);
}

function onCellClick(r, c) {
  if((typeof replay !== 'undefined' && replay.active) || G.actionMode !== 'move' || !G.sel || G.phase !== 'playing') return;
  const {p, i} = G.sel;
  const moves = getLegalMoves(p, i);
  const mv = moves.find(m => m.r === r && m.c === c);
  if(!mv) { sfxErr(); setInstr('That square is not reachable. Choose a highlighted square.'); return; }

  clearHints();
  G.sel = null;
  doMove(p, i, r, c, mv);
}

/* ── PERFORM ACTIONS ─────────────────────────────────────── */
function doMove(player, idx, toR, toC, mv) {
  G.animating = true;
  const fromR = G.pos[player][idx].r, fromC = G.pos[player][idx].c;
  const evs = [];

  if(mv.isJump) {
    G.jumps++; gs.jumps++;
    evs.push({t: 'jump', m: `🦘 ${pretty(player)} jumped over the opponent!`});
    sfxJump();
  }

  G.pos[player][idx] = {r: toR, c: toC};
  evs.unshift({t: '', m: `${pretty(player)}: ${coord(fromR, fromC)} → ${coord(toR, toC)}${mv.isJump ? ' (jump)' : ''}`});

  G.turns++; gs.turns++;
  G.moveLog.push({turn: G.turns, type: 'move', player, from: {r: fromR, c: fromC}, to: {r: toR, c: toC}, jump: !!mv.isJump});

  if(cfg.anim) {
    const fc = cellEl(fromR, fromC), tc = cellEl(toR, toC);
    if(fc) flash(fc, 'rgba(232,184,75,.28)');
    if(tc) setTimeout(() => flash(tc, 'rgba(59,114,240,.35)'), animMs() * .25);
  }
  if(!mv.isJump) sfxMove();

  setTimeout(() => {
    render();
    const dest = cellEl(toR, toC); if(dest) dest.classList.add('last-move');
    evs.forEach((e, i) => setTimeout(() => { banner(e.m, e.t); logEv(e.m, e.t); }, i * 260));

    if(checkWin(player)) {
      setTimeout(() => doWin(player), 500);
      G.animating = false; return;
    }

    G.turn = player === 'white' ? 'blue' : 'white';
    setActionMode('move');
    updateTurnIndicator();
    refreshTurnTimer();
    G.animating = false;

    if(typeof online !== 'undefined' && online.enabled && !online.applyingRemote) {
      syncOnlineState();
    }
    if(typeof maybeAiTurn === 'function') maybeAiTurn();
  }, animMs() + 80);
}

function placeWallAt(type, r, c) {
  if(G.actionMode !== 'wall' || G.phase !== 'playing' || G.animating) return;

  if(typeof online !== 'undefined' && online.enabled && !online.applyingRemote && G.turn !== onlinePlayer()) {
    sfxErr(); setInstr("It's your opponent's turn."); return;
  }

  const stock = G.wallStock[G.turn];
  const hasStock = type === 'h' ? stock.h > 0 : stock.v > 0;
  if(!hasStock) { sfxErr(); setInstr(`${pretty(G.turn)} has no ${type==='h'?'horizontal':'vertical'} barricades left.`); return; }

  if(!wallGeometryValid(type, r, c)) { sfxErr(); setInstr('A barricade already occupies or crosses that line.'); return; }
  if(!wallKeepsAllPathsOpen(type, r, c)) { sfxErr(); setInstr('🚫 That barricade would completely seal off a piece — illegal placement.'); return; }

  G.animating = true;
  if(type === 'h') { G.hwalls.push({r, c, owner: G.turn}); stock.h--; }
  else { G.vwalls.push({r, c, owner: G.turn}); stock.v--; }
  
  edgesForWall(type, r, c).forEach(e => G.blockedEdges.add(e));

  G.wallsPlaced++; gs.walls++;
  G.turns++; gs.turns++;
  G.moveLog.push({turn: G.turns, type: 'wall', player: G.turn, wallType: type, r, c});

  sfxWall();
  const msg = `▥ ${pretty(G.turn)} placed a ${type==='h'?'horizontal':'vertical'} barricade.`;

  setTimeout(() => {
    render();
    banner(msg, 'wall'); logEv(msg, 'wall');

    G.turn = G.turn === 'white' ? 'blue' : 'white';
    setActionMode('move');
    updateTurnIndicator();
    refreshTurnTimer();
    G.animating = false;

    if(typeof online !== 'undefined' && online.enabled && !online.applyingRemote) {
      syncOnlineState();
    }
    if(typeof maybeAiTurn === 'function') maybeAiTurn();
  }, animMs() + 40);
}

/* ── WALL DRAG SYSTEM ────────────────────────────────────── */
let wallDragGhost = null;

function initWallDragSystem() {
  id('wallLayer').addEventListener('pointerdown', onWallPointerDown);
  document.addEventListener('pointermove', onWallPointerMove);
  document.addEventListener('pointerup', onWallPointerUp);
  document.addEventListener('pointercancel', onWallPointerUp);
}

function updateWallLattice() {
  document.querySelectorAll('.wslot.legal').forEach(s => s.classList.remove('legal'));
  if(G.actionMode !== 'wall' || G.phase !== 'playing') return;
  const stock = G.wallStock[G.turn];
  
  document.querySelectorAll('.wslot').forEach(slot => {
    const type = slot.dataset.type, r = +slot.dataset.r, c = +slot.dataset.c;
    const hasStock = type === 'h' ? stock.h > 0 : stock.v > 0;
    if(!hasStock) return;
    if(wallGeometryValid(type, r, c) && wallKeepsAllPathsOpen(type, r, c)) slot.classList.add('legal');
  });
}

function onWallPointerDown(e) {
  if((typeof replay !== 'undefined' && replay.active) || G.actionMode !== 'wall' || G.phase !== 'playing' || G.animating || G.aiThinking || G.carry) return;
  const slot = e.target.closest('.wslot');
  if(!slot) return;
  e.preventDefault();
  G.carry = {type: slot.dataset.type, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, snap: null};
  try{ slot.setPointerCapture(e.pointerId); }catch(_){}
  spawnWallGhost(G.carry.type, e.clientX, e.clientY);
  updateCarriedWall(e.clientX, e.clientY);
}

function onWallPointerMove(e) {
  if(!G.carry || e.pointerId !== G.carry.pointerId) return;
  updateCarriedWall(e.clientX, e.clientY);
}

function onWallPointerUp(e) {
  if(!G.carry || e.pointerId !== G.carry.pointerId) return;
  const snap = G.carry.snap;
  removeWallGhost();
  clearSnapMarks();
  G.carry = null;
  if(snap) placeWallAt(snap.type, snap.r, snap.c);
}

function updateCarriedWall(clientX, clientY) {
  if(!G.carry) return;
  const boardRect = id('board').getBoundingClientRect();
  const outsideBoard = clientX < boardRect.left || clientX > boardRect.right || clientY < boardRect.top || clientY > boardRect.bottom;

  if(wallDragGhost) wallDragGhost.style.visibility = outsideBoard ? 'hidden' : 'visible';
  clearSnapMarks();

  if(outsideBoard) { G.carry.snap = null; return; }

  if(wallDragGhost) {
    wallDragGhost.style.left = (clientX - wallDragGhost.offsetWidth / 2) + 'px';
    wallDragGhost.style.top  = (clientY - wallDragGhost.offsetHeight / 2) + 'px';
  }
  const type = G.carry.type;
  let best = null, bestDist = Infinity;
  
  document.querySelectorAll(`.wslot[data-type="${type}"]`).forEach(slot => {
    const rect = slot.getBoundingClientRect();
    const dx = (rect.left + rect.width / 2) - clientX, dy = (rect.top + rect.height / 2) - clientY;
    const dist = dx * dx + dy * dy;
    if(dist < bestDist) { bestDist = dist; best = slot; }
  });
  
  if(best) {
    const legal = best.classList.contains('legal');
    best.classList.add(legal ? 'snap-legal' : 'snap-illegal');
    G.carry.snap = legal ? {type, r: +best.dataset.r, c: +best.dataset.c} : null;
  } else {
    G.carry.snap = null;
  }
}

function clearSnapMarks() {
  document.querySelectorAll('.wslot.snap-legal,.wslot.snap-illegal').forEach(s => s.classList.remove('snap-legal', 'snap-illegal'));
}

function spawnWallGhost(type, clientX, clientY) {
  removeWallGhost();
  const {cellSz, gutSz} = boardMetrics();
  const span = cellSz * 2 + gutSz;
  const g = document.createElement('div');
  g.className = `carried-wall ${G.turn}`;
  if(type === 'h') { g.style.width = span + 'px'; g.style.height = WALL_THICK + 'px'; }
  else { g.style.height = span + 'px'; g.style.width = WALL_THICK + 'px'; }
  document.body.appendChild(g);
  wallDragGhost = g;
}

function removeWallGhost() {
  if(wallDragGhost) { wallDragGhost.remove(); wallDragGhost = null; }
}

/* ── TARGET SELECTION & MINIBOARD ────────────────────────── */
let _tmpTgts = [];
let _curTgtPlayer = null;

function openTargetModal(player) {
  _curTgtPlayer = player;
  G.targets[player] = [];
  _tmpTgts = [];
  
  const n = G.pieceCount || 2;
  const tgtRow = player === 'white' ? G.boardSize - 1 : 0;
  
  id('setupTitle').textContent = `${pretty(player)} — Choose Secret Target${n > 1 ? 's' : ''}`;
  id('setupSub').textContent = `Select ${n} square${n > 1 ? 's' : ''} on row ${player === 'white' ? G.boardSize : '1'}.`;
  
  id('tgtCount').textContent = '0';
  const denomEl = id('tgtCountDenom'); if(denomEl) denomEl.textContent = n;
  id('tgtConfirm').disabled = true;
  
  buildMini(player, tgtRow);
  id('tgtModal').classList.add('open');
}

function buildMini(player, tgtRow) {
  const mb = id('miniBoard'); mb.innerHTML = '';
  // Set mini-board dynamic CSS variable
  mb.style.setProperty('--board-size', G.boardSize);
  
  const own = G.pos[player];
  
  for(let row = G.boardSize - 1; row >= 0; row--) {
    for(let col = 0; col < G.boardSize; col++) {
      const d = document.createElement('div');
      d.className = 'mc ' + cellColor(row, col);
      const isTgt = row === tgtRow;
      if(isTgt) d.classList.add('tgt-row');
      if(_tmpTgts.some(t => t.r === row && t.c === col)) d.classList.add('sel-tgt');
      
      if(own.some(p => p.r === row && p.c === col)) {
        const mp = document.createElement('div');
        mp.className = 'mpc ' + player; d.appendChild(mp);
      }
      if(isTgt) d.addEventListener('click', () => onMiniClick(row, col, player, tgtRow));
      mb.appendChild(d);
    }
  }
}

function onMiniClick(r, c, player, tgtRow) {
  if(r !== tgtRow) return;
  const n = G.pieceCount || 2;
  const idx = _tmpTgts.findIndex(t => t.r === r && t.c === c);
  if(idx !== -1) _tmpTgts.splice(idx, 1);
  else if(_tmpTgts.length < n) _tmpTgts.push({r, c});
  
  id('tgtCount').textContent = _tmpTgts.length;
  id('tgtConfirm').disabled = _tmpTgts.length < n;
  buildMini(player, tgtRow);
}

function confirmTargets() {
  const player = _curTgtPlayer;
  G.targets[player] = [..._tmpTgts];
  id('tgtModal').classList.remove('open');

  if(typeof online !== 'undefined' && online.enabled) {
    syncOnlineTargets();
    setInstr('Waiting for opponent to choose their targets…');
    pollForOpponentTargets();
    return;
  }

  if(player === 'white') {
    if(G.aiMode) {
      // Auto-pick targets for AI
      const cols = [];
      while(cols.length < G.pieceCount) { 
        const c = Math.floor(Math.random() * G.boardSize); 
        if(!cols.includes(c)) cols.push(c); 
      }
      G.targets.blue = cols.map(c => ({r: 0, c}));
      beginPlay();
    } else {
      id('passModal').classList.add('open');
    }
  } else {
    beginPlay();
  }
}

function toP2() { 
  id('passModal').classList.remove('open'); 
  openTargetModal('blue'); 
}

function beginPlay() {
  G.phase = 'playing'; G.turn = 'white';
  render(); updateTurnIndicator(); setActionMode('move');
  refreshTurnTimer();
  logEv('🎮 Game started — White moves first.', '');
  setInstr('Select a white piece, then click ↑↓←→ to move.');
}

/* ── TURN TIMER AUTO-PLAY (Optional logic dependency) ────── */
function autoPlayOnTimeout() {
  if(G.phase !== 'playing') return;
  const player = G.turn;
  logEv(`⏱ ${pretty(player)}'s time ran out — auto-playing a move.`, 'err');
  banner("⏱ Time's up!", 'err');

  const candidates = [];
  for(let i = 0; i < G.pieceCount; i++) {
    getLegalMoves(player, i).forEach(m => candidates.push({idx: i, ...m}));
  }

  if(!candidates.length) {
    refreshTurnTimer();
    return;
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  doMove(player, pick.idx, pick.r, pick.c, pick);
}

/* ── VICTORY DELEGATION ──────────────────────────────────── */
function doWin(player) {
  G.phase = 'over';
  if(typeof stopTurnTimer === 'function') stopTurnTimer();

  if(typeof online !== 'undefined' && online.enabled && !online.applyingRemote) {
    syncOnlineState();
  }
  
  gs.played++; gs.won++;
  if(G.turns > gs.longest) gs.longest = G.turns;
  saveGs();
  sfxWin();

  ['white', 'blue'].forEach(p => G.targets[p].forEach(t => {
    const cell = cellEl(t.r, t.c);
    if(cell) cell.classList.add('is-target');
  }));

  id('victTitle').textContent = pretty(player) + ' Wins!';
  id('victStats').innerHTML =
    `<div class="vs"><span class="vs-val">${G.turns}</span><span class="vs-lbl">Turns</span></div>` +
    `<div class="vs"><span class="vs-val">${G.jumps}</span><span class="vs-lbl">Jumps</span></div>` +
    `<div class="vs"><span class="vs-val">${G.wallsPlaced}</span><span class="vs-lbl">Walls Placed</span></div>`;
  id('victOv').classList.add('open');
  if(typeof doConfetti === 'function') doConfetti();
  
  if(typeof logGameToSupabase === 'function') logGameToSupabase(player);
}

function restartGame() {
  id('victOv').classList.remove('open');
  if(G.aiMode) {
    if(typeof startAiGame === 'function') startAiGame(G.aiDifficulty, pendingGameConfig);
    return;
  }
  if(typeof online !== 'undefined' && online.enabled) {
    leaveOnlineGame();
    goTo('play');
    return;
  }
  startLocalGame(pendingGameConfig);
}
