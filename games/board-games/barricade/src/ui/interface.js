/* ==========================================================
   STEENE — src/ui/interface.js
   Handles all UI interactions, modal orchestrations,
   board rotation mechanics, theme application, game setup
   parameter extraction, and the editable player profile
   (name, tagline, avatar), rank badge, and achievements.

   ── CHANGE THIS PASS (architecture refactor) ──────────────
   src/ui/profile.js has been merged into this file — the approved
   directory structure only lists ui/{interface,tutorial}.js for
   this game, with no separate profile.js. Nothing from it was
   dropped; every function, constant, and piece of state below is
   identical to what profile.js contained, just relocated.

   Merging it also surfaced a real, previously-unnoticed gap:
   goTo('profile') only ever called renderProfile() (the stats-only
   half, from config.js) — it never called renderProfilePage() (the
   avatar/name/tag/rank-badge/achievements half, from the old
   profile.js). That means navigating to the Profile screen never
   actually refreshed your avatar, display name, tagline, rank badge,
   or achievements grid — only the "Player Info" stat rows happened
   to update. Fixed below by calling renderProfilePage() instead,
   which already calls renderProfile() internally, so both halves
   now refresh together.
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
  if (s === 'profile' && typeof renderProfilePage === 'function') renderProfilePage();
}

function closeSidebar() {
  id('sidebar').classList.remove('open');
  id('overlayBg').classList.remove('open');
}

/* Confirms before leaving an in-progress ONLINE match, since exiting
   hands the opponent an automatic win (see online.js's markOnlineLeave,
   called from goTo() above). Local/AI games exit freely — there's no
   opponent waiting on the other end to be affected. */
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
  
  const tog = id('togSetupTimer');
  if (tog) tog.classList.remove('on');
  
  id('setupModal').classList.add('open');
}

function closeSetupModal() {
  id('setupModal').classList.remove('open');
}

function confirmSetup() {
  const timerEnabled = id('togSetupTimer').classList.contains('on');
  const timerSeconds = parseInt(id('setupTimerInput').value, 10) || 45;
  const boardSize = parseInt(id('setupBoardSize').value, 10) || 10;
  const theme = id('setupBoardTheme').value || 'dark';
  const pieceMode = parseInt(id('setupPieceMode').value, 10) || 2;

  pendingGameConfig = {
    timerEnabled: timerEnabled,
    timerSeconds: Math.max(10, Math.min(300, timerSeconds)),
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
  
  if (board) {
    board.style.transform = `rotate(${currentBoardRotation}deg)`;
    board.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
  }
  if (wallLayer) {
    wallLayer.style.transform = `rotate(${currentBoardRotation}deg)`;
    wallLayer.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
  }

  const pieces = document.querySelectorAll('.piece');
  pieces.forEach(p => {
    p.style.transform = `rotate(-${currentBoardRotation}deg)`;
    p.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
  });
}

/* ── THEME APPLICATION ───────────────────────────────────── */
function applyBoardTheme(themeName) {
  const app = document.body;
  
  app.classList.remove(
    'theme-dark', 
    'theme-neon', 
    'theme-wood', 
    'theme-gold', 
    'theme-scrabble'
  );
  
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

/* ==========================================================
   PLAYER PROFILE (merged in from the former src/ui/profile.js)
   Editable player profile (name, tagline, avatar), rank badge,
   the full stats breakdown embedded on the Profile page, and a
   lightweight achievements system computed from gs (config.js).
   ========================================================== */

const AVATAR_CHOICES = [
  '♟','♞','♜','♛','♚','🤖','🎯','🧠','🔥','⚡',
  '🛡️','🏆','🦊','🐺','🦁','🐯','🐉','🦅','🎮','👑',
  '💎','🌟','🥷','🧩','🎲','🚀'
];

const ACHIEVEMENTS = [
  { id: 'first_game',  icon: '🎮', name: 'First Steps',    desc: 'Play your first game',                         test: g => g.played >= 1 },
  { id: 'ten_games',   icon: '📅', name: 'Regular',        desc: 'Play 10 games',                                test: g => g.played >= 10 },
  { id: 'fifty_games', icon: '🗓️', name: 'Veteran',        desc: 'Play 50 games',                                test: g => g.played >= 50 },
  { id: 'first_win',   icon: '🏆', name: 'First Victory',  desc: 'Win a game',                                   test: g => g.won >= 1 },
  { id: 'ten_wins',    icon: '👑', name: 'Champion',       desc: 'Win 10 games',                                 test: g => g.won >= 10 },
  { id: 'jump_master', icon: '🦘', name: 'Jump Master',    desc: 'Make 25 jumps total',                          test: g => g.jumps >= 25 },
  { id: 'wall_arch',   icon: '🧱', name: 'Wall Architect', desc: 'Place 50 barricades total',                    test: g => g.walls >= 50 },
  { id: 'marathon',    icon: '⏳', name: 'Marathon',       desc: 'Win a match lasting 40+ turns',                test: g => g.longest >= 40 },
  { id: 'sharpshoot',  icon: '⭐', name: 'Sharpshooter',   desc: 'Reach a 60%+ win rate (min. 5 games)',         test: g => g.played >= 5 && (g.won / g.played) >= 0.6 }
];

function computeRank(g) {
  if (g.played < 5)   return { icon: '⭐', label: 'Unranked' };
  if (g.played < 20)  return { icon: '🥉', label: 'Bronze' };
  if (g.played < 50)  return { icon: '🥈', label: 'Silver' };
  if (g.played < 100) return { icon: '🥇', label: 'Gold' };
  return { icon: '💎', label: 'Legend' };
}

/* ── PAGE RENDER (called on nav to #profile) ─────────────── */
function renderProfilePage() {
  renderProfileHeader();
  if (typeof renderStats === 'function') renderStats('profStatsGrid');
  if (typeof renderProfile === 'function') renderProfile();
  renderAchievements();
}

function renderProfileHeader() {
  const avEl = id('profAvDisplay'); if (avEl) avEl.textContent = profile.avatar;
  const nameEl = id('profNameDisplay'); if (nameEl) nameEl.textContent = profile.name;
  const tagEl = id('profTagDisplay'); if (tagEl) tagEl.textContent = profile.tag;
  const rank = computeRank(gs);
  const badgeEl = id('profRankBadge');
  if (badgeEl) badgeEl.textContent = `${rank.icon} ${rank.label}`;
}

function renderAchievements() {
  const grid = id('achvGrid');
  if (!grid) return;
  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = a.test(gs);
    return `<div class="achv ${unlocked ? '' : 'locked'}" title="${a.desc}">
        <div class="achv-icon">${unlocked ? a.icon : '🔒'}</div>
        <div class="achv-name">${a.name}</div>
        <div class="achv-desc">${a.desc}</div>
      </div>`;
  }).join('');
}

/* ── EDIT MODAL ───────────────────────────────────────────── */
let _editAvatar = profile.avatar;
let _avatarPickerBuilt = false;

function openProfileEdit() {
  _editAvatar = profile.avatar;
  const nameInput = id('profNameInput'); if (nameInput) nameInput.value = profile.name;
  const tagInput = id('profTagInput'); if (tagInput) tagInput.value = profile.tag;
  const avEditEl = id('profAvEditDisplay'); if (avEditEl) avEditEl.textContent = _editAvatar;
  const picker = id('avatarPicker'); if (picker) picker.style.display = 'none';
  buildAvatarPicker();
  id('profEditModal').classList.add('open');
}

function closeProfileEdit() {
  id('profEditModal').classList.remove('open');
  const picker = id('avatarPicker'); if (picker) picker.style.display = 'none';
}

function buildAvatarPicker() {
  if (_avatarPickerBuilt) return;
  const picker = id('avatarPicker');
  if (!picker) return;
  picker.innerHTML = AVATAR_CHOICES.map(a =>
    `<button type="button" class="av-opt" onclick="selectAvatar('${a}')">${a}</button>`
  ).join('');
  _avatarPickerBuilt = true;
}

function toggleAvatarPicker() {
  const picker = id('avatarPicker');
  if (!picker) return;
  picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
}

function selectAvatar(a) {
  _editAvatar = a;
  const avEditEl = id('profAvEditDisplay'); if (avEditEl) avEditEl.textContent = a;
  const picker = id('avatarPicker'); if (picker) picker.style.display = 'none';
}

function saveProfileEdit() {
  const nameInput = id('profNameInput');
  const tagInput = id('profTagInput');
  const name = (nameInput && nameInput.value.trim()) || 'Player One';
  const tag = (tagInput && tagInput.value.trim()) || 'STEENE Player';

  profile.name = name.slice(0, 20);
  profile.tag = tag.slice(0, 34);
  profile.avatar = _editAvatar || profile.avatar;
  saveProfile();

  closeProfileEdit();
  renderProfileHeader();
}

/* ── DOM BINDINGS ────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', function() {
  // Load persisted settings/stats/profile before anything renders, so
  // Settings, Statistics, and the Profile page reflect the last
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
