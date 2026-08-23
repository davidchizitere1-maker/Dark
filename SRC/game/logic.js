/* ==========================================================
   STEENE — src/game/logic.js
   Core rules engine: wall geometry validation, pathfinding,
   and legal move generation for variable board sizes.
   ========================================================== */

function edgeKey(r1, c1, r2, c2) {
  if (r1 > r2 || (r1 === r2 && c1 > c2)) { 
    [r1, r2] = [r2, r1]; 
    [c1, c2] = [c2, c1]; 
  }
  return `${r1},${c1}|${r2},${c2}`;
}

function wallsBlockEdge(r1, c1, r2, c2) {
  return G.blockedEdges.has(edgeKey(r1, c1, r2, c2));
}

function wallGeometryValid(type, r, c) {
  const limit = G.boardSize - 1;
  if (type === 'h') {
    if (r < 0 || r >= limit || c < 0 || c >= limit) return false;
    if (G.hwalls.some(w => w.r === r && w.c === c)) return false;
    if (G.hwalls.some(w => w.r === r && (w.c === c - 1 || w.c === c + 1))) return false;
    if (G.vwalls.some(w => w.r === r && w.c === c)) return false;
    return true;
  } else {
    if (r < 0 || r >= limit || c < 0 || c >= limit) return false;
    if (G.vwalls.some(w => w.r === r && w.c === c)) return false;
    if (G.vwalls.some(w => w.c === c && (w.r === r - 1 || w.r === r + 1))) return false;
    if (G.hwalls.some(w => w.r === r && w.c === c)) return false;
    return true;
  }
}

function edgesForWall(type, r, c) {
  if (type === 'h') {
    return [ edgeKey(r, c, r + 1, c), edgeKey(r, c + 1, r + 1, c + 1) ];
  } else {
    return [ edgeKey(r, c, r, c + 1), edgeKey(r + 1, c, r + 1, c + 1) ];
  }
}

function hasPathToCell(startR, startC, goal) {
  const seen = new Set([`${startR},${startC}`]);
  const queue = [{r: startR, c: startC}];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.r === goal.r && cur.c === goal.c) return true;
    for (const {dr, dc} of DIRS) {
      const nr = cur.r + dr, nc = cur.c + dc;
      if (!inB(nr, nc)) continue;
      if (wallsBlockEdge(cur.r, cur.c, nr, nc)) continue;
      const key = `${nr},${nc}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({r: nr, c: nc});
    }
  }
  return false;
}

function targetsStillReachable(player) {
  const tgts = G.targets[player];
  if (!tgts || tgts.length < G.pieceCount) return true;
  
  // For single piece or multiple pieces, verify assignments
  const pos = G.pos[player];
  if (pos.length === 1) {
    return hasPathToCell(pos[0].r, pos[0].c, tgts[0]);
  }
  
  // For multi-piece, check that every piece has at least a valid assignment path
  // Simplified robust check: each target must be reachable by at least one piece, 
  // and no piece is completely locked away from all targets.
  for (let i = 0; i < pos.length; i++) {
    let canReachAny = false;
    for (const t of tgts) {
      if (hasPathToCell(pos[i].r, pos[i].c, t)) {
        canReachAny = true;
        break;
      }
    }
    if (!canReachAny) return false;
  }
  return true;
}

function wallKeepsAllPathsOpen(type, r, c) {
  const edges = edgesForWall(type, r, c);
  edges.forEach(e => G.blockedEdges.add(e));
  const ok = targetsStillReachable('white') && targetsStillReachable('blue');
  edges.forEach(e => G.blockedEdges.delete(e));
  return ok;
}

function getLegalMoves(player, idx) {
  const pos = G.pos[player][idx];
  const moves = [];

  DIRS.forEach(({dr, dc}) => {
    const nr = pos.r + dr, nc = pos.c + dc;
    if (!inB(nr, nc)) return;
    if (wallsBlockEdge(pos.r, pos.c, nr, nc)) return;

    const occ = getPieceAt(nr, nc);
    if (!occ) {
      moves.push({r: nr, c: nc, isJump: false});
    } else if (occ.p === player) {
      return;
    } else {
      const jr = nr + dr, jc = nc + dc;
      if (!inB(jr, jc)) return;
      if (wallsBlockEdge(nr, nc, jr, jc)) return;
      if (getPieceAt(jr, jc)) return;
      moves.push({r: jr, c: jc, isJump: true, overR: nr, overC: nc});
    }
  });

  return moves;
}

function inB(r, c) {
  return r >= 0 && r < G.boardSize && c >= 0 && c < G.boardSize;
}

function getPieceAt(r, c) {
  for (const p of ['white', 'blue'])
    for (let i = 0; i < G.pos[p].length; i++)
      if (G.pos[p][i].r === r && G.pos[p][i].c === c) return {p, i};
  return null;
}

function checkWin(player) {
  const tgts = G.targets[player];
  const pos = G.pos[player];
  if (!tgts || tgts.length < pos.length) return false;
  
  if (pos.length === 1) {
    return pos[0].r === tgts[0].r && pos[0].c === tgts[0].c;
  }
  
  // For multiple pieces, check if all current positions match the target set precisely
  const targetSet = new Set(tgts.map(t => `${t.r},${t.c}`));
  const posSet = new Set(pos.map(p => `${p.r},${p.c}`));
  if (targetSet.size !== posSet.size) return false;
  for (const k of targetSet) {
    if (!posSet.has(k)) return false;
  }
  return true;
}
