/* ==========================================================
   STEENE — src/ui/interface.js
   Handles all UI interactions, modal orchestrations,
   board rotation mechanics, theme application, and
   game setup parameter extraction.
   ========================================================== */

/* ── UI NAVIGATION ───────────────────────────────────────── */
function goTo(s) {
  closeSidebar();
  
  const victOv = id('victOv');
  if (victOv) { victOv.classList.remove('open'); }

  if (s !== 'game' && typeof stopTurnTimer === 'function') {
    stopTurnTimer();
    if (typeof markOnlineLeave === 'function') markOnlineLeave();
  }
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('on'));
  const el = id(s); 
  if (el) { el.classList.add('on'); }
  
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.s === s || (s === 'game' && n.dataset.s === 'play'))
  );
  
  if (s === 'stats' && typeof renderStats === 'function') renderStats();
  if (s === 'tutorial' && typeof renderTut === 'function') { tutStep = 0; renderTut(); }
  if (s === 'profile' && typeof renderProfile === 'function') renderProfile();
}

function closeSidebar() {
  id('sidebar').classList.remove('open');
  id('overlayBg').classList.remove('open');
}

/* Confirms before leaving an in-progress ONLINE match, since exiting
   hands the opponent an automatic win (see online.js's markOnlineLeave,
   called from goTo() above). Local/AI games exit freely — there's no
   opponent waiting on the other end to be affected. This was part of
   the original network-observer request (exit → ask first; network
   drop → 20s grace window, handled separately by the ping loop in
   online.js) but had been dropped from the "← Exit" link itself. */
function confirmExitGame() {
  if (typeof online !== 'undefined' && online.enabled && G.phase === 'playing') {
    if (!confirm('Leave the match? Your opponent will be awarded the win.')) return;
  }
  goTo('play');
}

/* ── GAME SETUP MODAL (Local & AI) ───────────────────────── */
let currentSetupMode = null; // 'local' or 'ai'
let pendingGameConfig = null;

function openSetupModal(mode) {
  currentSetupMode = mode;
  id('setupTitle').textContent = mode === 'ai' ? 'AI Game Settings' : 'Local Game Settings';
  
  // Reset toggles to default visually
  const tog = id('togSetupTimer');
  if (tog) tog.classList.remove('on');
  
  id('setupModal').classList.add('open');
}

function closeSetupModal() {
  id('setupModal').classList.remove('open');
}

function confirmSetup() {
  // Extract custom input parameters
  const timerEnabled = id('togSetupTimer').classList.contains('on');
  const timerSeconds = parseInt(id('setupTimerInput').value, 10) || 45;
  const boardSize = parseInt(id('setupBoardSize').value, 10) || 10;
  const theme = id('setupBoardTheme').value || 'dark';
  const pieceMode = parseInt(id('setupPieceMode').value, 10) || 2;

  pendingGameConfig = {
    timerEnabled: timerEnabled,
    timerSeconds: Math.max(10, Math.min(300, timerSeconds)), // clamp between 10s and 300s
    boardSize: boardSize,
    theme: theme,
    pieceMode: pieceMode
  };

  closeSetupModal();
  applyBoardTheme(pendingGameConfig.theme);

  if (currentSetupMode === 'ai') {
    openDiffModal();
  } else {
    startLocalGame(pendingGameConfig);
  }
}

/* ── BOARD ROTATION ──────────────────────────────────────── */
let currentBoardRotation = 0;

function rotateBoard() {
  currentBoardRotation = (currentBoardRotation + 90) % 360;
  applyRotation();
}

function resetBoardRotation() {
  currentBoardRotation = 0;
  applyRotation();
}

function applyRotation() {
  const board = id('board');
  const wallLayer = id('wallLayer');
  
  // Rotate the board container
  if (board) {
    board.style.transform = `rotate(${currentBoardRotation}deg)`;
    board.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
  }
  if (wallLayer) {
    wallLayer.style.transform = `rotate(${currentBoardRotation}deg)`;
    wallLayer.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
  }

  // Counter-rotate the pieces currently on the board so they stay upright.
  // (render() in board.js also applies this to any piece it creates
  // afterward — e.g. after the next move — so pieces don't "untwist"
  // once you make a move following a rotation.)
  const pieces = document.querySelectorAll('.piece');
  pieces.forEach(p => {
    p.style.transform = `rotate(-${currentBoardRotation}deg)`;
    p.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
  });
}

/* ── THEME APPLICATION ───────────────────────────────────── */
function applyBoardTheme(themeName) {
  const app = document.body;
  
  // Clean up old themes
  app.classList.remove(
    'theme-dark', 
    'theme-neon', 
    'theme-wood', 
    'theme-gold', 
    'theme-scrabble'
  );
  
  // Apply new theme
  app.classList.add(`theme-${themeName}`);
}

/* ── AI MODAL ORCHESTRATION ──────────────────────────────── */
function openDiffModal() {
  _selectedDiff = -1;
  document.querySelectorAll('.diff-card').forEach(c => c.classList.remove('selected'));
  id('diffConfirm').disabled = true;
  
  const statusEl = id('aiLearnStatus');
  if (statusEl && typeof loadAiLearningStatus === 'function') {
    statusEl.textContent = '🧠 Loading shared AI experience…';
    statusEl.className = 'ai-learn-status';
    loadAiLearningStatus();
  }
  
  id('diffModal').classList.add('open');
}

function closeDiffModal() { 
  id('diffModal').classList.remove('open'); 
}

function selectDiff(d) {
  _selectedDiff = d;
  document.querySelectorAll('.diff-card').forEach((c, i) => c.classList.toggle('selected', i === d));
  id('diffConfirm').disabled = false;
}

function confirmDiff() {
  if (_selectedDiff < 0) return;
  closeDiffModal();
  
  // Ensure the AI game launches with the pending setup config
  if (typeof startAiGame === 'function') {
    startAiGame(_selectedDiff, pendingGameConfig);
  }
}

/* ── ONLINE UI ORCHESTRATION ─────────────────────────────── */
function openOnlineModal() {
  showOnlineChoiceView();
  id('onlineModal').classList.add('open');
}

function closeOnlineModal() {
  if (typeof online !== 'undefined' && online.enabled && online.role === 'host') {
    if (typeof cancelOnlineRoom === 'function') cancelOnlineRoom();
    return;
  }
  id('onlineModal').classList.remove('open');
}

function showOnlineChoiceView() {
  id('onlineChoiceView').style.display = 'block';
  id('onlineOptionsView').style.display = 'none';
  id('onlineJoinView').style.display = 'none';
  id('onlineWaitView').style.display = 'none';
}

function showJoinRoomView() {
  id('onlineChoiceView').style.display = 'none';
  id('onlineOptionsView').style.display = 'none';
  id('onlineJoinView').style.display = 'block';
  id('onlineWaitView').style.display = 'none';
  
  const err = id('onlineJoinError');
  err.style.display = 'none'; 
  err.textContent = '';
  
  const codeInput = id('joinCodeInput');
  codeInput.value = '';
  setTimeout(() => codeInput.focus(), 50);
}

function showRoomOptionsView() {
  id('onlineChoiceView').style.display = 'none';
  id('onlineOptionsView').style.display = 'block';
  id('onlineJoinView').style.display = 'none';
  id('onlineWaitView').style.display = 'none';
  
  const togTimer = id('togRoomTimer'); 
  if (togTimer) togTimer.classList.remove('on');
}

function confirmRoomOptions() {
  const timerEnabled = id('togRoomTimer').classList.contains('on');
  const timerSeconds = parseInt(id('roomTimerInput').value, 10) || 45;
  const boardSize = parseInt(id('roomBoardSize').value, 10) || 10;
  const theme = id('roomBoardTheme').value || 'dark';
  const pieceMode = parseInt(id('roomPieceMode').value, 10) || 2;

  const roomConfig = {
    timerEnabled: timerEnabled,
    timerSeconds: Math.max(10, Math.min(300, timerSeconds)),
    boardSize: boardSize,
    theme: theme,
    pieceMode: pieceMode
  };

  applyBoardTheme(theme);
  
  if (typeof hostOnlineGame === 'function') {
    hostOnlineGame(roomConfig);
  }
}

/* ── DISCONNECT OBSERVER UI ──────────────────────────────── */
function showNetworkDisconnectModal() {
  id('networkDisconnectModal').classList.add('open');
  id('disconnectTimerDisplay').textContent = "20";
}

function updateDisconnectTimerDisplay(secondsLeft) {
  id('disconnectTimerDisplay').textContent = secondsLeft;
}

function hideNetworkDisconnectModal() {
  id('networkDisconnectModal').classList.remove('open');
}

/* ── WALL LAYER RESIZE HANDLING ───────────────────────────
   .wslot / .wall-piece positions are computed once in pixels
   (boardMetrics() reads the live .cell size at build time).
   The board's cell size is a CSS clamp() that responds to
   viewport width, so on any resize/orientation-change the
   previously-computed wall hitboxes and wall graphics drift
   out of alignment with the actual re-flowed cells unless we
   rebuild them. Debounced so it doesn't run on every pixel
   of a drag-resize. */
let _resizeDebounce = null;
function _handleBoardResize() {
  clearTimeout(_resizeDebounce);
  _resizeDebounce = setTimeout(() => {
    const gameScreen = id('game');
    if (!gameScreen || !gameScreen.classList.contains('on')) return;
    if (typeof buildWallLayer === 'function') buildWallLayer();
    if (typeof renderWalls === 'function') renderWalls();
    if (typeof updateWallLattice === 'function') updateWallLattice();
  }, 180);
}

/* ── DOM BINDINGS ────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', function() {
  // Load persisted settings/stats/profile before anything renders, so
  // Settings, Statistics, and the new Profile page reflect the last
  // session instead of silently resetting on every reload.
  if (typeof loadCfg === 'function') loadCfg();
  if (typeof loadGs === 'function') loadGs();
  if (typeof loadProfile === 'function') loadProfile();

  // Attach the wall-placement drag/drop system once. It only reacts
  // once a game is active (guarded internally by G.actionMode/G.phase),
  // so it's safe to attach immediately at page load.
  if (typeof initWallDragSystem === 'function') initWallDragSystem();

  window.addEventListener('resize', _handleBoardResize);
  window.addEventListener('orientationchange', _handleBoardResize);

  // Mobile Sidebar
  const mobBtn = id('mobBtn');
  if (mobBtn) {
    mobBtn.addEventListener('click', function() {
      id('sidebar').classList.toggle('open');
      id('overlayBg').classList.toggle('open');
    });
  }
  
  const overlayBg = id('overlayBg');
  if (overlayBg) overlayBg.addEventListener('click', closeSidebar);

  // Navigation Links
  document.querySelectorAll('.nav-item').forEach(function(n) {
    n.addEventListener('click', function() { goTo(n.dataset.s); });
  });
});
