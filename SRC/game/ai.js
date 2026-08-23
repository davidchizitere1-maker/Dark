/* ==========================================================
   STEENE — src/game/ai.js
   Full AI opponent engine with distinct difficulty tiers,
   BFS pathfinding evaluation, and shared-learning integration.
   ========================================================== */

let _selectedDiff = -1;

function startAiGame(difficulty, config) {
  config = config || { boardSize: 10, pieceMode: 2, timerEnabled: false, timerSeconds: 45 };
  newGame(config);
  G.aiMode = true; 
  G.aiPlayer = 'blue'; 
  G.aiDifficulty = difficulty; 
  G.aiThinking = false;
  
  goTo('game');
  setTimeout(() => {
    buildBoard(); render(); updateTurnIndicator(); setActionMode('move');
    id('evLog').innerHTML = ''; id('victOv').classList.remove('open');
    const names = ['Beginner','Amateur','Regular','Pro','Master','Legend'];
    setInstr(`You are White. AI is Blue (${names[difficulty]}). Select a piece to move.`);
    setTimeout(() => openTargetModal('white'), 300);
  }, 60);
}

function aiBfsDistance(startR, startC, targets, extraEdges) {
  if (!targets || !targets.length) return 0;
  const goals = new Set(targets.map(t => `${t.r},${t.c}`));
  if (goals.has(`${startR},${startC}`)) return 0;
  const seen = new Set([`${startR},${startC}`]);
  const queue = [{r: startR, c: startC, d: 0}];
  
  while (queue.length) {
    const {r, c, d} = queue.shift();
    for (const {dr, dc} of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (!inB(nr, nc)) continue;
      const ek = edgeKey(r, c, nr, nc);
      if (G.blockedEdges.has(ek)) continue;
      if (extraEdges && extraEdges.has(ek)) continue;
      const k = `${nr},${nc}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (goals.has(k)) return d + 1;
      queue.push({r: nr, c: nc, d: d + 1});
    }
  }
  return Infinity;
}

function aiTotalPath(player, extraEdges) {
  const pos = G.pos[player], tgts = G.targets[player];
  if (!tgts || tgts.length < pos.length) return 0;
  
  let totalDist = 0;
  for (let i = 0; i < pos.length; i++) {
    let bestPieceDist = Infinity;
    for (const t of tgts) {
      const d = aiBfsDistance(pos[i].r, pos[i].c, [t], extraEdges);
      if (d < bestPieceDist) bestPieceDist = d;
    }
    totalDist += bestPieceDist;
  }
  return totalDist;
}

function aiRandomMove(ai) {
  const all = [];
  for (let i = 0; i < G.pos[ai].length; i++) {
    getLegalMoves(ai, i).forEach(m => all.push({idx: i, ...m}));
  }
  return all.length ? all[Math.floor(Math.random() * all.length)] : null;
}

function aiGreedyMove(ai) {
  let best = null, bestDist = Infinity;
  for (let idx = 0; idx < G.pos[ai].length; idx++) {
    const orig = G.pos[ai][idx];
    getLegalMoves(ai, idx).forEach(mv => {
      G.pos[ai][idx] = {r: mv.r, c: mv.c};
      const d = aiTotalPath(ai, null);
      G.pos[ai][idx] = orig;
      if (d < bestDist) { bestDist = d; best = {idx, r: mv.r, c: mv.c, mv}; }
    });
  }
  return best || aiRandomMove(ai);
}

function aiLegalWalls(ai) {
  const walls = [];
  const limit = G.boardSize - 1;
  for (let r = 0; r < limit; r++) {
    for (let c = 0; c < limit; c++) {
      for (const type of ['h', 'v']) {
        if (type === 'h' && G.wallStock[ai].h <= 0) continue;
        if (type === 'v' && G.wallStock[ai].v <= 0) continue;
        if (wallGeometryValid(type, r, c) && wallKeepsAllPathsOpen(type, r, c)) {
          walls.push({type, r, c});
        }
      }
    }
  }
  return walls;
}

function aiScoreWall(wall, ai, opp, penalty) {
  const extra = new Set(edgesForWall(wall.type, wall.r, wall.c));
  const oppBefore = aiTotalPath(opp, null), aiBefore = aiTotalPath(ai, null);
  const oppAfter  = aiTotalPath(opp, extra), aiAfter  = aiTotalPath(ai, extra);
  const oppGain   = oppAfter - oppBefore;
  const ownImprove = Math.max(0, aiBefore - aiAfter);
  const ownHurt   = Math.max(0, aiAfter - aiBefore);
  return oppGain + ownImprove * 0.6 - ownHurt * penalty;
}

function aiStrategicWallScore(wall, ai, opp, moveGain) {
  const base = aiScoreWall(wall, ai, opp, 1.0);
  const own = aiTotalPath(ai, null);
  const extra = new Set(edgesForWall(wall.type, wall.r, wall.c));
  const ownAfter = aiTotalPath(ai, extra);
  const oppBefore = aiTotalPath(opp, null);
  const oppAfter = aiTotalPath(opp, extra);
  const delay = Math.max(0, oppAfter - oppBefore);
  const selfDamage = Math.max(0, ownAfter - own);
  const createsOwnRoute = Math.max(0, own - ownAfter);
  const purpose = Math.max(0, delay * 1.4 - selfDamage * 1.6 + createsOwnRoute * 1.25);
  return base + purpose - (delay === 0 && createsOwnRoute === 0 ? 2 : 0) - Math.max(0, moveGain - purpose) * 0.55;
}

function aiFindStrategicWall(ai, opp, moveGain) {
  const walls = aiLegalWalls(ai);
  let best = null, bestScore = 0;
  for (const w of walls) {
    const score = aiStrategicWallScore(w, ai, opp, moveGain);
    if (score > bestScore) { best = {...w, score}; bestScore = score; }
  }
  return best;
}

function aiDecide() {
  const ai = G.aiPlayer;
  const opp = ai === 'blue' ? 'white' : 'blue';
  const d = G.aiDifficulty;
  
  // FIXED DIFFICULTY SCALING: Beginner/Amateur have strict leniency
  if (d === 0 && Math.random() < 0.65) {
    return {action: 'move', ...aiRandomMove(ai)};
  }
  if (d === 1 && Math.random() < 0.45) {
    return {action: 'move', ...aiGreedyMove(ai)};
  }

  const move = aiGreedyMove(ai);
  if (!move) return null;

  const before = aiTotalPath(ai, null);
  const orig = G.pos[ai][move.idx];
  G.pos[ai][move.idx] = {r: move.r, c: move.c};
  const moveGain = Math.max(0, before - aiTotalPath(ai, null));
  G.pos[ai][move.idx] = orig;

  const hasWalls = G.wallStock[ai].h + G.wallStock[ai].v > 0;
  if (!hasWalls) return {action: 'move', ...move};

  const wall = aiFindStrategicWall(ai, opp, moveGain);
  const learnAdj = typeof aiLearnState !== 'undefined' ? Math.min(0.35, Math.log10(aiLearnState.gamesSeen + 1) * 0.08) : 0;
  const threshold = ([3.0, 2.4, 1.8, 1.2, 0.7, 0.3][d] ?? 1.0) - learnAdj;

  if (d === 1 && wall && wall.score >= threshold && Math.random() < 0.3)
    return {action: 'wall', ...wall};

  if (d >= 2 && wall && wall.score >= threshold && wall.score > moveGain + 0.45)
    return {action: 'wall', ...wall};

  return {action: 'move', ...move};
}

const AI_THINK_MS = [600, 750, 850, 1000, 1200, 1600];

function aiTakeTurn() {
  if (G.phase !== 'playing' || !G.aiMode || G.turn !== G.aiPlayer) return;
  G.aiThinking = true;
  const names = ['Beginner','Amateur','Regular','Pro','Master','Legend'];
  setInstr(`🤖 ${names[G.aiDifficulty]} AI is thinking…`);
  
  const ti = id('turnWrap');
  if (ti) {
    const old = id('aiBadge'); if (old) old.remove();
    const b = document.createElement('span');
    b.className = 'ai-badge ai-thinking-pulse'; b.textContent = 'thinking'; b.id = 'aiBadge';
    ti.appendChild(b);
  }
  
  const delay = AI_THINK_MS[G.aiDifficulty] + Math.random() * 300;
  setTimeout(() => {
    const badge = id('aiBadge'); if (badge) badge.remove();
    if (G.phase !== 'playing' || G.turn !== G.aiPlayer) { G.aiThinking = false; return; }
    
    const dec = aiDecide();
    G.aiThinking = false;
    if (!dec) return;
    
    if (dec.action === 'move') {
      const mv = getLegalMoves(G.aiPlayer, dec.idx).find(m => m.r === dec.r && m.c === dec.c);
      if (mv) doMove(G.aiPlayer, dec.idx, dec.r, dec.c, mv);
    } else {
      G.actionMode = 'wall';
      placeWallAt(dec.type, dec.r, dec.c);
    }
  }, delay);
}

function maybeAiTurn() {
  if (!G.aiMode) return;
  if (G.turn === G.aiPlayer) {
    aiTakeTurn();
  } else {
    const names = ['Beginner','Amateur','Regular','Pro','Master','Legend'];
    setInstr(`Your move (White) — vs ${names[G.aiDifficulty]} AI.`);
  }
}

let aiLearnState = { loaded: false, gamesSeen: 0 };

async function loadAiLearningStatus() {
  const statusEl = id('aiLearnStatus');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/games?select=id&mode=eq.ai`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    if (!res.ok) throw new Error('status ' + res.status);
    const range = res.headers.get('content-range');
    const total = range ? (parseInt(range.split('/')[1], 10) || 0) : 0;
    aiLearnState = { loaded: true, gamesSeen: total };
    if (statusEl) {
      statusEl.textContent = total > 0
        ? `🧠 Learning from ${total.toLocaleString()} shared AI matches`
        : '🧠 Shared AI experience connected — no matches logged yet';
      statusEl.className = 'ai-learn-status ready';
    }
  } catch (e) {
    aiLearnState = { loaded: false, gamesSeen: 0 };
    if (statusEl) {
      statusEl.textContent = '🧠 Shared experience unavailable — playing on local heuristics';
      statusEl.className = 'ai-learn-status offline';
    }
  }
}
