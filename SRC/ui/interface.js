/* ==========================================================
   STEENE — src/ui/interface.js
   Handles all UI interactions, modal orchestrations,
   board rotation mechanics, theme application, and
   game setup parameter extraction.
   ========================================================== */

/* ── UI NAVIGATION ───────────────────────────────────────── */
function goTo(s) {
  closeSidebar();
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

  // Counter-rotate the pieces and coordinates so they remain readable
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

/* ── DOM BINDINGS ────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', function() {
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
