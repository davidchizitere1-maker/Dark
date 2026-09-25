// Killer-Bean-style approach paths: enemies don't simply pop into existence
// at a fixed spot, they run in from a lane entrance, down a corridor of
// waypoints, to a hold point — then engagement AI takes over.
// Waypoints are horizontal-only (constant ground y): the ground height is
// owned by the game loop, so a path that also tried to move fighter.y would
// fight that every frame and could stall forever a few pixels short of the
// target. Keeping paths purely on the x-axis keeps arrival detection exact.
export function buildLane(config,lane,groundY){
  const w=config.arena.width;
  const enterX=lane.from==="left"?-140:w+140;
  const holdX=w*lane.hold;
  const midX=(enterX+holdX)/2;
  return [
    {x:enterX,y:groundY-40},
    {x:midX,y:groundY-40},
    {x:holdX,y:groundY-40},
  ];
}

export function assignPath(fighter,waypoints){
  fighter.path=waypoints;fighter.pathIndex=1;fighter.engaged=false;
  fighter.x=waypoints[0].x;fighter.y=waypoints[0].y;
}

// returns true while the fighter is still travelling its path
export function followPath(fighter,dt,speed){
  if(!fighter.path||fighter.pathIndex>=fighter.path.length){fighter.engaged=true;return false}
  const target=fighter.path[fighter.pathIndex];
  const dx=target.x-fighter.x;
  const dist=Math.abs(dx);
  fighter.facing=dx>=0?1:-1;
  const step=speed*dt;
  if(dist<=step){fighter.x=target.x;fighter.pathIndex++}
  else{fighter.x+=Math.sign(dx)*step}
  fighter.walkCycle+=step*0.02;
  if(fighter.pathIndex>=fighter.path.length){fighter.engaged=true;return false}
  return true;
}
