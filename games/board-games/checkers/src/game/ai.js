(function(){
  "use strict";

  const TT=new Map();
  const MAX_TT=18000;
  let nodeCount=0;
  let deadline=0;
  let stop=false;
  let rootColor="red";
  let configCache=null;

  function L(){return window.CheckersLogic}
  function C(){return L().C}
  function opponent(color){return color===C().RED?C().BLACK:C().RED}

  const tables={
    man:100,
    king:205,
    center:12,
    centerKing:7,
    advance:6,
    backRank:4,
    mobility:2.8,
    threat:15,
    edge:2.4,
    connected:3,
    tempo:4
  };

  function keyBoard(board,turn,depth,root,rule){
    let s=`${turn}|${root}|${depth}|${rule}|`;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      const p=board[r][c];
      s+=p?p.color[0]+(p.king?"K":"m"):"-";
    }
    return s;
  }

  function positionalScore(r,c,color,king){
    const center=(c===3||c===4)&&(r===3||r===4);
    const advance=color==="red"?7-r:r;
    const home=color==="red"?r===7:r===0;
    const edge=(c===0||c===7);
    let score=0;
    if(center)score+=tables.center;
    if(king&&center)score+=tables.centerKing;
    if(!king)score+=advance*tables.advance;
    if(home&&!king)score+=tables.backRank;
    if(edge)score+=tables.edge;
    return score;
  }

  function evaluate(board,maxColor,turn){
    const enemy=opponent(maxColor);
    let score=0;
    let maxPieces=0,enemyPieces=0,maxKings=0,enemyKings=0;
    let maxMob=0,enemyMob=0;

    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const p=board[r][c];
        if(!p)continue;
        const base=p.king?tables.king:tables.man;
        const pos=positionalScore(r,c,p.color,p.king);
        const value=base+pos;
        if(p.color===maxColor){
          score+=value;maxPieces++;if(p.king)maxKings++;
        }else{
          score-=value;enemyPieces++;if(p.king)enemyKings++;
        }
      }
    }

    maxMob=L().allLegalMoves(board,maxColor,{captureRule:"open"}).length;
    enemyMob=L().allLegalMoves(board,enemy,{captureRule:"open"}).length;
    score+=(maxMob-enemyMob)*tables.mobility;
    score+=(maxKings-enemyKings)*7;

    const maxCapt=L().allCaptures(board,maxColor).length;
    const enemyCapt=L().allCaptures(board,enemy).length;
    score+=(maxCapt-enemyCapt)*tables.threat;

    if(maxPieces===0)return -1000000;
    if(enemyPieces===0)return 1000000;

    if(turn===maxColor)score+=tables.tempo;
    else score-=tables.tempo;

    return score;
  }

  function orderActions(actions){
    return actions.slice().sort((a,b)=>{
      const ac=b.captureCount-a.captureCount;
      if(ac!==0)return ac;
      const bk=(b.steps.some(s=>s.to.r===0||s.to.r===7)?1:0)-(a.steps.some(s=>s.to.r===0||s.to.r===7)?1:0);
      return bk;
    });
  }

  function search(board,turn,maxColor,depth,alpha,beta,rule){
    if(performance.now()>deadline){stop=true;return {score:0,move:null}}
    nodeCount++;

    const winner=L().winner(board,turn,{captureRule:rule});
    if(winner){
      const terminal=winner===maxColor?1000000+depth*1000:-1000000-depth*1000;
      return {score:terminal,move:null};
    }
    if(depth<=0)return {score:evaluate(board,maxColor,turn),move:null};

    const k=keyBoard(board,turn,depth,maxColor,rule);
    const cached=TT.get(k);
    if(cached)return cached;

    const actions=orderActions(L().allTurnActions(board,turn,{captureRule:rule}));
    if(!actions.length)return {score:turn===maxColor?-1000000:1000000,move:null};

    let bestMove=null;

    if(turn===maxColor){
      let best=-Infinity;
      for(const action of actions){
        if(stop)break;
        const next=L().applyAction(board,action).board;
        const result=search(next,opponent(turn),maxColor,depth-1,alpha,beta,rule);
        if(result.score>best){best=result.score;bestMove=action}
        alpha=Math.max(alpha,best);
        if(beta<=alpha)break;
      }
      const out={score:best,move:bestMove};
      if(TT.size<MAX_TT)TT.set(k,out);
      return out;
    }

    let best=Infinity;
    for(const action of actions){
      if(stop)break;
      const next=L().applyAction(board,action).board;
      const result=search(next,opponent(turn),maxColor,depth-1,alpha,beta,rule);
      if(result.score<best){best=result.score;bestMove=action}
      beta=Math.min(beta,best);
      if(beta<=alpha)break;
    }
    const out={score:best,move:bestMove};
    if(TT.size<MAX_TT)TT.set(k,out);
    return out;
  }

  function maybeAddNoise(score,difficulty){
    const level=Number(difficulty)||1;
    return score+(Math.random()*.2-.1)*(6-level)*100;
  }

  function choose(board,color,difficulty,rule="open"){
    const cfg=window.CheckersConfig.difficulty(difficulty);
    TT.clear();
    nodeCount=0;
    stop=false;
    deadline=performance.now()+cfg.time;
    rootColor=color;
    configCache=cfg;

    const actions=L().allTurnActions(board,color,{captureRule:rule});
    if(!actions.length)return null;

    let best=actions[0];
    let bestScore=-Infinity;

    for(let depth=1;depth<=cfg.depth;depth++){
      if(performance.now()>deadline)break;
      stop=false;
      const result=search(board,color,color,depth,-Infinity,Infinity,rule);
      if(!stop&&result.move){
        best=result.move;
        bestScore=result.score;
      }else if(stop){
        break;
      }
    }

    if(cfg.noise>0&&actions.length>1){
      const scored=actions.map(action=>{
        const next=L().applyAction(board,action).board;
        return {action,score:evaluate(next,color,opponent(color))};
      }).sort((a,b)=>b.score-a.score);
      const pool=Math.max(1,Math.min(scored.length,Math.ceil(scored.length*(0.18+cfg.noise))));
      if(Math.random()<cfg.noise){
        best=scored[Math.floor(Math.random()*pool)].action;
      }
    }

    return best||actions[0];
  }

  function thinkingDelay(level){
    const n=Number(level)||1;
    return [220,280,360,480,620][n-1]||320;
  }

  window.CheckersAI={
    choose,
    thinkingDelay,
    levels:window.CheckersConfig?.DIFFICULTIES||null,
    diagnostics(){
      return {nodes:nodeCount,cache:TT.size,lastConfig:configCache?.name||null}
    }
  };
})();
