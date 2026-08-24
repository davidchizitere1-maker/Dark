/* ==========================================================
   STEENE — src/ui/profile.js
   Editable player profile (name, tagline, avatar), rank badge,
   the full stats breakdown embedded on the Profile page, and
   a lightweight achievements system computed from gs (config.js).
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
