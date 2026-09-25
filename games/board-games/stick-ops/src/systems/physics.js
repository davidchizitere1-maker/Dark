export class Physics{
  constructor(config){this.config=config}
  update(e,dt){
    e.vy=Math.min(this.config.physics.maxFall,e.vy+this.config.physics.gravity*dt);e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.pow(this.config.physics.friction,dt*60);
    const {width,groundY,leftMargin,rightMargin}=this.config.arena;e.x=Math.max(leftMargin,e.x);e.x=Math.min(width-rightMargin,e.x);
    if(e.y+e.radius>=groundY){e.y=groundY-e.radius;e.vy=0;e.grounded=true}else e.grounded=false;
  }
}
