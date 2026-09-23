(function(){
  "use strict";

  const state={
    board:null,turn:"red",mode:"local",localColor:"red",aiColor:"black",aiDifficulty:2,
    theme:"obsidian",timerSeconds:0,remaining:{red:0,black:0},timer:null,
    captureRule:"open",rotated:false,phase:"idle",selected:null,
    choiceMode:"all",chainPiece:null,history:[],turnNumber:1,captureTotal:{red:0,black:0},
    lastMove:null,aiBusy:false
  };

  const $=id=>document.getElementById(id);
  const L=()=>window.CheckersLogic;
  const C=()=>L().C;

  function opposite(color){return color===C().RED?C().BLACK:C().RED}

  function start(options={}){
    stopClock();
    Object.assign(state,{
      board:L().initialBoard(),
      turn:"red",
      mode:options.mode||"local",
      localColor:options.localColor||"red",
      aiColor:options.aiColor||"black",
      aiDifficulty:Number(options.aiDifficulty)||2,
      theme:options.theme||window.CheckersConfig.settings().theme,
      timerSeconds:Number(options.timerSeconds)||0,
      remaining:{red:Number(options.timerSeconds)||0,black:Number(options.timerSeconds)||0},
      captureRule:options.captureRule||window.CheckersConfig.settings().captureRule||"open",
      rotated:false,phase:"playing",selected:null,choiceMode:"all",chainPiece:null,
      history:[],turnNumber:1,captureTotal:{red:0,black:0},lastMove:null,aiBusy:false
    });
    document.body.className=`theme-${state.theme}`;
    render();
    updatePanel();
    resetClock();
    postOnlineState("playing");
    maybeAi();
  }

  function selectablePieces(){
    if(state.phase!=="playing")return[];
    if(state.mode==="ai"&&state.turn===state.aiColor)return[];
    if(state.mode==="online"&&state.turn!==state.localColor)return[];
    if(state.chainPiece)return[state.chainPiece];
    const moves=L().allLegalMoves(state.board,state.turn,{captureRule:state.captureRule});
    const set=new Set(moves.map(m=>`${m.from.r}:${m.from.c}`));
    return [...set].map(v=>{const [r,c]=v.split(":").map(Number);return{r,c}})
  }

  function legalForSelection(){
    if(!state.selected)return[];
    if(state.chainPiece){
      return L().forcedPieceCaptures(state.board,state.chainPiece);
    }
    const all=L().allLegalMoves(state.board,state.turn,{captureRule:state.captureRule});
    if(state.choiceMode==="captures")return all.filter(m=>m.capture);
    if(state.choiceMode==="quiet")return all.filter(m=>!m.capture);
    return all.filter(m=>m.from.r===state.selected.r&&m.from.c===state.selected.c);
  }

  function isOwnPiece(r,c){
    return state.board[r]?.[c]?.color===state.turn;
  }

  function onCell(r,c){
    if(state.phase!=="playing"||state.aiBusy)return;
    if(state.mode==="ai"&&state.turn===state.aiColor)return;
    if(state.mode==="online"&&state.turn!==state.localColor)return;

    const piece=state.board[r][c];

    if(state.selected){
      const move=legalForSelection().find(m=>m.to.r===r&&m.to.c===c);
      if(move){perform(move);return}

      if(isOwnPiece(r,c)&&(!state.chainPiece||same({r,c},state.chainPiece))){
        state.selected={r,c};
        render();
        return;
      }

      if(!state.chainPiece&&isOwnPiece(r,c)){
        state.selected={r,c};render();return;
      }

      state.selected=null;
      render();
      return;
    }

    if(isOwnPiece(r,c)){
      state.selected={r,c};
      render();
    }
  }

  function same(a,b){return a&&b&&a.r===b.r&&a.c===b.c}

  function perform(move){
    const piece=state.board[move.from.r][move.from.c];
    if(!piece)return;

    const before=L().cloneBoard(state.board);
    const applied=L().makeMove(state.board,move);
    state.board=applied.board;
    state.captureTotal[piece.color]+=applied.captured?1:0;
    state.lastMove=move;

    const historyEntry={board:before,turn:state.turn,turnNumber:state.turnNumber,captureTotal:{...state.captureTotal},move};
    state.history.push(historyEntry);

    playTone(applied.captured?"capture":"move");
    if(applied.crowned)playTone("crown");

    if(state.chainPiece && same(state.chainPiece,move.from))state.chainPiece={...move.to};
    else state.chainPiece=applied.captured?{...move.to}:null;

    addMoveLog(move,piece,applied);

    if(applied.captured&&!applied.crowned){
      const more=L().forcedPieceCaptures(state.board,move.to);
      if(more.length){
        state.selected={...move.to};
        state.chainPiece={...move.to};
        state.choiceMode="all";
        updatePanel();
        showChainChoice();
        render();
        return;
      }
    }

    completeTurn();
  }

  function completeTurn(){
    state.chainPiece=null;
    state.selected=null;
    state.choiceMode="all";
    state.turn=opposite(state.turn);
    state.turnNumber++;
    state.remaining[state.turn]=state.remaining[state.turn]||state.timerSeconds;

    const winner=L().winner(state.board,state.turn,{captureRule:state.captureRule});
    if(winner){
      finish(winner, "board control");
      return;
    }

    updatePanel();
    resetClock();
    postOnlineState("playing");
    render();
    maybeAi();
  }

  function showChainChoice(){
    $("chainBar")?.classList.remove("hidden");
    if($("chainText"))$("chainText").textContent="Another jump is available from the same piece.";
    if($("choiceBar"))$("choiceBar").classList.add("hidden");
    if($("continueChainBtn")){
      $("continueChainBtn").onclick=()=>{
        $("chainBar")?.classList.add("hidden");
        render();
      };
    }
  }

  /*
   * A jump sequence is mandatory once it has started.
   * The user can choose a capture or a different quiet move before
   * starting the chain when Open Capture is enabled.
   */
  function showCaptureChoice(){
    const captures=L().allCaptures(state.board,state.turn);
    const quiet=L().allQuietMoves(state.board,state.turn);
    const shouldShow=state.captureRule==="open"&&captures.length&&quiet.length&&!state.chainPiece;
    $("choiceBar")?.classList.toggle("hidden",!shouldShow);
    if(!shouldShow)return;
    $("showCapturesBtn").onclick=()=>{state.choiceMode="captures";state.selected=null;render();};
    $("showQuietBtn").onclick=()=>{state.choiceMode="quiet";state.selected=null;render();};
  }

  function maybeAi(){
    if(state.phase!=="playing"||state.mode!=="ai"||state.turn!==state.aiColor||state.aiBusy)return;
    state.aiBusy=true;
    renderThinking(true);
    setTimeout(()=>{
      try{
        const action=window.CheckersAI.choose(state.board,state.aiColor,state.aiDifficulty,state.captureRule);
        if(!action){finish(opposite(state.aiColor),"no legal move");return}
        for(const step of action.steps){
          const applied=L().makeMove(state.board,step);
          state.board=applied.board;
          state.lastMove=step;
          state.captureTotal[state.aiColor]+=applied.captured?1:0;
        }
        addAiLog(action);
        playTone(action.captureCount?"capture":"move");
        if(action.steps.some(step=>{
          const p=state.board[step.to.r]?.[step.to.c];
          return p?.king;
        }))playTone("crown");
        completeTurn();
      }finally{
        state.aiBusy=false;
        renderThinking(false);
      }
    },window.CheckersAI.thinkingDelay(state.aiDifficulty));
  }

  function addAiLog(action){
    const log=$("moveLog");if(!log)return;
    const row=document.createElement("div");row.className=`move-row ${action.captureCount?"capture":""}`;
    row.innerHTML=`<span>AI • ${action.steps.map(s=>L().squareName(s.from.r,s.from.c)+"-"+L().squareName(s.to.r,s.to.c)).join(" → ")}</span><strong>${action.captureCount?"x"+action.captureCount:"quiet"}</strong>`;
    log.prepend(row);
    while(log.children.length>28)log.lastElementChild.remove();
    if($("moveStreamCount"))$("moveStreamCount").textContent=String(log.children.length);
  }

  function addMoveLog(move,piece,applied){
    const log=$("moveLog");if(!log)return;
    const row=document.createElement("div");row.className=`move-row ${applied.captured?"capture":""}`;
    row.innerHTML=`<span>${piece.color.toUpperCase()} • ${L().notation(move,piece,applied.captured,applied.crowned)}</span><strong>${applied.captured?"CAPTURE":"QUIET"}</strong>`;
    log.prepend(row);
    while(log.children.length>28)log.lastElementChild.remove();
    if($("moveStreamCount"))$("moveStreamCount").textContent=String(log.children.length);
  }

  function render(){
    const board=$("board");if(!board)return;
    document.body.className=`theme-${state.theme}`;
    board.innerHTML="";

    const settings=window.CheckersConfig.settings();
    const rowOrder=state.rotated?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
    const colOrder=state.rotated?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
    const selectable=new Set(selectablePieces().map(p=>`${p.r}:${p.c}`));
    const legal=legalForSelection();
    const legalTargets=new Set(legal.map(m=>`${m.to.r}:${m.to.c}`));

    rowOrder.forEach((r,ri)=>{
      colOrder.forEach((c,ci)=>{
        const cell=document.createElement("button");
        cell.type="button";
        cell.className=`cell ${((r+c)%2===0)?"light":"dark"}`;
        cell.dataset.row=String(r);cell.dataset.col=String(c);
        if(selectable.has(`${r}:${c}`))cell.classList.add("selectable");
        if(state.selected&&same(state.selected,{r,c}))cell.classList.add("selected");
        if(legalTargets.has(`${r}:${c}`)){
          const move=legal.find(m=>m.to.r===r&&m.to.c===c);
          cell.classList.add(move?.capture?"capture-target":"legal");
        }
        if(state.lastMove){
          if(same(state.lastMove.from,{r,c}))cell.classList.add("last-from");
          if(same(state.lastMove.to,{r,c}))cell.classList.add("last-to");
        }
        if(settings.coordinates){
          const file=String.fromCharCode(97+c),rank=String(8-r);
          cell.insertAdjacentHTML("beforeend",`<span class="coord">${state.rotated?file.toUpperCase()+rank:file+rank}</span>`);
        }

        const piece=state.board[r][c];
        if(piece){
          const el=document.createElement("div");
          el.className=`piece ${piece.color}${piece.king?" king":""}`;
          el.textContent=piece.king?"◆":"";
          cell.appendChild(el);
        }
        cell.addEventListener("click",()=>onCell(r,c));
        board.appendChild(cell);
      });
    });

    showCaptureChoice();
    updatePanel();
  }

  function undo(){
    if(!state.history.length||state.aiBusy||state.mode==="online")return false;
    const last=state.history.pop();
    state.board=L().cloneBoard(last.board);
    state.turn=last.turn;
    state.turnNumber=last.turnNumber;
    state.captureTotal={...last.captureTotal};
    state.selected=null;state.chainPiece=null;state.choiceMode="all";
    render();resetClock();
    return true;
  }

  function rotate(){state.rotated=!state.rotated;render()}

  function resign(){if(state.phase!=="playing")return;finish(opposite(state.turn),"resignation")}

  function finish(winner,reason){
    if(state.phase==="over")return;
    state.phase="over";stopClock();renderThinking(false);
    const stats=window.CheckersConfig.stats();
    const profile=window.CheckersConfig.profile();
    const aiWin=state.mode==="ai"&&winner===profilePerspectiveWinner(winner);

    let result="draw";
    if(winner){
      if(state.mode==="local")result="win";
      else if(state.localColor===winner)result="win";
      else if(state.mode==="ai")result=winner===state.localColor?"win":"loss";
      else result=winner===state.localColor?"win":"loss";
    }

    const patch={
      gamesPlayed:stats.gamesPlayed+1,
      gamesWon:stats.gamesWon+(result==="win"?1:0),
      gamesLost:stats.gamesLost+(result==="loss"?1:0),
      gamesDrawn:stats.gamesDrawn+(result==="draw"?1:0),
      currentStreak:result==="win"?stats.currentStreak+1:0,
      bestStreak:result==="win"?Math.max(stats.bestStreak,stats.currentStreak+1):stats.bestStreak,
      legendaryWins:stats.legendaryWins+(result==="win"&&state.mode==="ai"&&state.aiDifficulty===5?1:0),
      totalCaptures:stats.totalCaptures+state.captureTotal.red+state.captureTotal.black,
      totalTurns:stats.totalTurns+Math.max(0,state.turnNumber-1),
      lastGameAt:new Date().toISOString()
    };
    window.CheckersConfig.saveStats(patch);

    const title=winner?`${winner[0].toUpperCase()+winner.slice(1)} wins`:"Draw";
    if($("resultTitle"))$("resultTitle").textContent=title;
    if($("resultText"))$("resultText").textContent=`${reason[0].toUpperCase()+reason.slice(1)}. ${state.mode==="ai"&&state.aiDifficulty===5&&result==="win"?"Legendary has been beaten.":"The arena has recorded the match."}`;
    if($("resultGlyph"))$("resultGlyph").textContent=result==="win"?"✦":result==="loss"?"◆":"•";
    if($("resultStats"))$("resultStats").innerHTML=`<div><span>Turns</span><b>${Math.max(0,state.turnNumber-1)}</b></div><div><span>Captures</span><b>${state.captureTotal.red+state.captureTotal.black}</b></div><div><span>AI</span><b>${state.mode==="ai"?window.CheckersConfig.formatDifficulty(state.aiDifficulty):"—"}</b></div>`;
    $("resultModal")?.classList.remove("hidden");

    if(window.CheckersUI?.refreshAll)window.CheckersUI.refreshAll();
    if(window.CheckersOnline?.disconnect)window.CheckersOnline.disconnect();
  }

  function profilePerspectiveWinner(winner){return state.localColor||"red"}

  function resetClock(){
    stopClock();
    if(!state.timerSeconds){
      updateClocks();return;
    }
    if(!state.remaining.red||state.phase==="idle")state.remaining.red=state.timerSeconds;
    if(!state.remaining.black||state.phase==="idle")state.remaining.black=state.timerSeconds;
    updateClocks();startClock();
  }

  function startClock(){
    stopClock();
    if(!state.timerSeconds||state.phase!=="playing")return;
    state.timer=setInterval(()=>{
      state.remaining[state.turn]--;
      updateClocks();
      if(state.remaining[state.turn]<=0)finish(opposite(state.turn),"time");
    },1000);
  }

  function stopClock(){if(state.timer)clearInterval(state.timer);state.timer=null}

  function formatClock(seconds){
    if(!state.timerSeconds)return"—";
    const n=Math.max(0,seconds);return `${Math.floor(n/60)}:${String(n%60).padStart(2,"0")}`;
  }

  function updateClocks(){
    if($("redClock"))$("redClock").textContent=formatClock(state.remaining.red);
    if($("blackClock"))$("blackClock").textContent=formatClock(state.remaining.black);
    const redPct=state.timerSeconds?Math.max(0,Math.min(100,(state.remaining.red/state.timerSeconds)*100)):100;
    const blackPct=state.timerSeconds?Math.max(0,Math.min(100,(state.remaining.black/state.timerSeconds)*100)):100;
    if($("redProgress"))$("redProgress").style.width=`${redPct}%`;
    if($("blackProgress"))$("blackProgress").style.width=`${blackPct}%`;
  }

  function updatePanel(){
    const currentCount=L().count(state.board,C().RED),blackCount=L().count(state.board,C().BLACK);
    const captures=L().allCaptures(state.board,state.turn);
    const winnerCheck=L().winner(state.board,state.turn,{captureRule:state.captureRule});
    if($("turnDot"))$("turnDot").className=`turn-dot ${state.turn}`;
    if($("turnLabel"))$("turnLabel").textContent=`${state.turn[0].toUpperCase()+state.turn.slice(1)}'s turn`;
    if($("gameHint"))$("gameHint").textContent=state.chainPiece?"Continue the jump.":(captures.length&&state.captureRule==="open"?"Capture is optional — choose your line.":"Select a piece.");
    if($("moveCounter"))$("moveCounter").textContent=`Turn ${Math.max(0,state.turnNumber-1)}`;
    if($("captureInfo"))$("captureInfo").textContent=`Captures ${state.captureTotal.red}–${state.captureTotal.black}`;
    if($("moveModeInfo"))$("moveModeInfo").textContent=state.captureRule==="open"?"Open capture":"Mandatory capture";
    if($("piecesLeft"))$("piecesLeft").textContent=`${currentCount.pieces}–${blackCount.pieces}`;
    if($("turnNumber"))$("turnNumber").textContent=String(state.turnNumber);
    if($("kingCount"))$("kingCount").textContent=`${currentCount.kings}–${blackCount.kings}`;
    if($("forcedCapture"))$("forcedCapture").textContent=captures.length?`${captures.length} choices`:"None";

    let threat="STABLE";
    const oppCaps=L().allCaptures(state.board,opposite(state.turn)).length;
    if(captures.length&&state.turn===state.localColor)threat="PRESSURE";
    if(oppCaps>=3)threat="DANGER";
    const badge=$("threatBadge");
    if(badge){badge.textContent=threat;badge.className=`threat-badge ${threat==="DANGER"?"danger":threat==="PRESSURE"?"warn":"safe"}`}
    if(state.aiBusy&&$("thinkingTitle"))$("thinkingTitle").textContent=`${window.CheckersConfig.formatDifficulty(state.aiDifficulty)} is calculating…`;
    showCaptureChoice();
    if(winnerCheck&&state.phase==="playing")setTimeout(()=>finish(winnerCheck,"board control"),0);
  }

  function renderThinking(show){
    $("thinkingLayer")?.classList.toggle("hidden",!show);
    if(show){
      if($("thinkingTitle"))$("thinkingTitle").textContent=`${window.CheckersConfig.formatDifficulty(state.aiDifficulty)} is calculating…`;
      if($("thinkingSub"))$("thinkingSub").textContent=`${window.CheckersAI?.diagnostics?.().nodes||0} tactical nodes and counting`;
    }
  }

  function playTone(kind){
    if(!window.CheckersConfig.settings().soundEnabled)return;
    try{
      const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
      const ctx=new AudioContext();const o=ctx.createOscillator();const g=ctx.createGain();
      const freq={move:430,capture:250,crown:720,warning:180,win:920}[kind]||430;
      o.frequency.value=freq;o.type=kind==="capture"?"triangle":"sine";
      g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.045,ctx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.12);
      o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.13);
    }catch(_){}
  }

  function postOnlineState(status){
    if(state.mode!=="online"||!window.CheckersOnline?.publishState)return;
    window.CheckersOnline.publishState({
      status,
      state:{
        board:L().cloneBoard(state.board),
        turn:state.turn,
        captureTotal:{...state.captureTotal},
        turnNumber:state.turnNumber,
        captureRule:state.captureRule,
        lastMove:state.lastMove
      }
    }).catch(()=>{});
  }

  function applyRemote(remote){
    if(!remote?.board)return;
    stopClock();
    state.board=L().cloneBoard(remote.board);
    state.turn=remote.turn||"red";
    state.captureTotal=remote.captureTotal||state.captureTotal;
    state.turnNumber=remote.turnNumber||state.turnNumber;
    state.lastMove=remote.lastMove||null;
    state.phase="playing";
    state.selected=null;state.chainPiece=null;state.choiceMode="all";
    render();updatePanel();
    resetClock();
  }

  window.CheckersBoard={state,start,render,undo,rotate,resign,applyRemote};
})();
