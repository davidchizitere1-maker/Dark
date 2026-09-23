(function(){
  "use strict";

  const C={RED:"red",BLACK:"black"};
  const forward={red:[[-1,-1],[-1,1]],black:[[1,-1],[1,1]]};
  const kingDirs=[[-1,-1],[-1,1],[1,-1],[1,1]];

  function inBounds(r,c){return r>=0&&r<8&&c>=0&&c<8}
  function cloneBoard(board){return board.map(row=>row.map(p=>p?{...p}:null))}

  function initialBoard(){
    const b=Array.from({length:8},()=>Array(8).fill(null));
    for(let r=0;r<3;r++){
      for(let c=0;c<8;c++){
        if((r+c)%2===1)b[r][c]={color:C.BLACK,king:false};
      }
    }
    for(let r=5;r<8;r++){
      for(let c=0;c<8;c++){
        if((r+c)%2===1)b[r][c]={color:C.RED,king:false};
      }
    }
    return b;
  }

  function moveDirs(piece){return piece.king?kingDirs:forward[piece.color]}

  function simpleMovesFor(board,r,c){
    const p=board[r]?.[c];
    if(!p)return[];
    return moveDirs(p).flatMap(([dr,dc])=>{
      const nr=r+dr,nc=c+dc;
      if(inBounds(nr,nc)&&!board[nr][nc]){
        return [{from:{r,c},to:{r:nr,c:nc},capture:null}];
      }
      return[];
    });
  }

  function captureMovesFor(board,r,c){
    const p=board[r]?.[c];
    if(!p)return[];
    return moveDirs(p).flatMap(([dr,dc])=>{
      const mr=r+dr,mc=c+dc,nr=r+dr*2,nc=c+dc*2;
      if(
        inBounds(nr,nc)&&
        board[mr]?.[mc]&&
        board[mr][mc].color!==p.color&&
        !board[nr][nc]
      ){
        return [{
          from:{r,c},
          to:{r:nr,c:nc},
          capture:{r:mr,c:mc}
        }];
      }
      return[];
    });
  }

  function allCaptures(board,color){
    const out=[];
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        if(board[r][c]?.color===color)out.push(...captureMovesFor(board,r,c));
      }
    }
    return out;
  }

  function allQuietMoves(board,color){
    const out=[];
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        if(board[r][c]?.color===color)out.push(...simpleMovesFor(board,r,c));
      }
    }
    return out;
  }

  /*
   * Open capture is the arena's signature rule:
   * if captures exist, a player can still choose any quiet move.
   * Mandatory mode keeps the traditional constraint.
   */
  function allLegalMoves(board,color,options={}){
    const policy=options.captureRule||"open";
    const captures=allCaptures(board,color);
    const quiet=allQuietMoves(board,color);
    if(policy==="mandatory"&&captures.length)return captures;
    return [...captures,...quiet];
  }

  function forcedPieceCaptures(board,from){
    if(!from)return[];
    return captureMovesFor(board,from.r,from.c);
  }

  function applyAtomic(board,move){
    const next=cloneBoard(board);
    const piece=next[move.from.r][move.from.c];
    const captured=move.capture?next[move.capture.r][move.capture.c]:null;
    next[move.from.r][move.from.c]=null;
    if(captured)next[move.capture.r][move.capture.c]=null;
    let crowned=false;
    if(piece){
      const targetRank=piece.color===C.RED?0:7;
      if(!piece.king&&move.to.r===targetRank){
        piece.king=true;
        crowned=true;
      }
      next[move.to.r][move.to.c]=piece;
    }
    return {board:next,piece,captured,crowned};
  }

  /*
   * Generate complete turn-actions for the AI.
   * A capture sequence is represented as one action containing all jumps.
   * Quiet moves and first captures may coexist under Open Capture.
   */
  function captureSequences(board,color,from,working=board,path=[],results=[]){
    const starts=from?[from]:null;
    const origins=starts||(()=>{
      const a=[];
      for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(working[r][c]?.color===color)a.push({r,c});
      return a;
    })();

    for(const origin of origins){
      const piece=working[origin.r]?.[origin.c];
      if(!piece||piece.color!==color)continue;
      const moves=captureMovesFor(working,origin.r,origin.c);
      if(!moves.length)continue;

      for(const move of moves){
        const applied=applyAtomic(working,move);
        const nextPath=[...path,move];
        const more=applied.crowned?[]:captureMovesFor(applied.board,move.to.r,move.to.c);
        if(more.length){
          captureSequences(applied.board,color,move.to,applied.board,nextPath,results);
        }else{
          results.push({
            steps:nextPath,
            from:nextPath[0].from,
            to:nextPath[nextPath.length-1].to,
            captureCount:nextPath.filter(m=>m.capture).length,
            resultingBoard:applied.board
          });
        }
      }
    }
    return results;
  }

  function allTurnActions(board,color,options={}){
    const policy=options.captureRule||"open";
    const captures=captureSequences(board,color);
    const quiet=allQuietMoves(board,color).map(move=>({
      steps:[move],
      from:move.from,
      to:move.to,
      captureCount:0,
      resultingBoard:applyAtomic(board,move).board
    }));
    if(policy==="mandatory"&&captures.length)return captures;
    return [...captures,...quiet];
  }

  function makeMove(board,move){
    return applyAtomic(board,move);
  }

  function applyAction(board,action){
    let current=cloneBoard(board);
    const steps=[];
    let totalCaptured=0;
    let crowned=false;
    for(const move of action.steps){
      const applied=applyAtomic(current,move);
      current=applied.board;
      if(applied.captured)totalCaptured++;
      crowned=crowned||applied.crowned;
      steps.push({move,piece:applied.piece,captured:applied.captured,crowned:applied.crowned});
    }
    return {board:current,steps,capturedCount:totalCaptured,crowned};
  }

  function hasPieces(board,color){
    return board.some(row=>row.some(p=>p?.color===color));
  }

  function winner(board,turn,options={}){
    const opponent=turn===C.RED?C.BLACK:C.RED;
    if(!hasPieces(board,opponent))return turn;
    if(allLegalMoves(board,opponent,options).length===0)return turn;
    return null;
  }

  function squareName(r,c){return `${String.fromCharCode(97+c)}${8-r}`}
  function notation(move,piece,captured,crowned){
    return `${squareName(move.from.r,move.from.c)}${captured?"×":"–"}${squareName(move.to.r,move.to.c)}${crowned?" • K":""}`;
  }

  function count(board,color){
    let pieces=0,kings=0;
    for(const row of board)for(const p of row)if(p?.color===color){pieces++;if(p.king)kings++}
    return {pieces,kings};
  }

  function cloneAction(action){
    return {
      ...action,
      steps:action.steps.map(s=>({
        from:{...s.from},
        to:{...s.to},
        capture:s.capture?{...s.capture}:null
      }))
    };
  }

  window.CheckersLogic={
    C,inBounds,cloneBoard,initialBoard,moveDirs,simpleMovesFor,captureMovesFor,
    allCaptures,allQuietMoves,allLegalMoves,forcedPieceCaptures,
    applyAtomic,applyAction,allTurnActions,makeMove,hasPieces,winner,
    squareName,notation,count,cloneAction
  };
})();
