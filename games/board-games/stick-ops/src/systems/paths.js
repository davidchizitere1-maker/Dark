// Killer-Bean-style approach paths: enemies don't simply pop into existence
// at a fixed spot, they run in from a lane entrance, down a corridor of
// waypoints, to a hold point — then engagement AI takes over.
export function buildLane(config,lane,groundY){
  const w=config.arena.width;
  const enterX=lane.from==="left"?-140:w+140;
  const holdX=w*lane.hold;
  const midX=(enterX+holdX)/2;
  return [
    {x:enterX,y:groundY-40},
    {x:midX,y:groundY-40+(lane.from==="left"?-70:70)},
    {x:holdX,y:groundY-40},
  ];
}

export function assignPath(fighter,waypoints){
  fighter.path=waypoints;fighter.pathIndex=0;fighter.engaged=false;
  fighter.x=waypoints[0].x;fighter.y=waypoints[0].y;
}

// returns true while the fighter is still travelling its path
export function followPath(fighter,dt,speed){
  if(!fighter.path||fighter.pathIndex>=fighter.path.length){fighter.engaged=true;return false}
  const target=fighter.path[fighter.pathIndex];
  const dx=target.x-fighter.x,dy=target.y-fighter.y,d=Math.hypot(dx,dy)||1;
  fighter.facing=dx>=0?1:-1;
  const step=speed*dt;
  if(d<=step){fighter.x=target.x;fighter.pathIndex++}
  else{fighter.x+=(dx/d)*step;fighter.vy=(dy/d)*speed*0.4}
  fighter.walkCycle+=step*0.02;
  if(fighter.pathIndex>=fighter.path.length){fighter.engaged=true;return false}
  return true;
}
