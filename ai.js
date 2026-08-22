/* ==========================================================
   STEENE — ai.js
   The full AI opponent engine: BFS pathfinding-based move/wall
   evaluation, difficulty tiers, and the shared-learning threshold
   nudge (aiLearnState, populated by online.js).
   Depends on: config.js, board.js (G, getLegalMoves, edgesForWall,
   wallGeometryValid, wallKeepsAllPathsOpen, doMove, placeWallAt).
   ========================================================== */

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

