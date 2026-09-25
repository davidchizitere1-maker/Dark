export class Projectile{
  constructor({x,y,vx,vy,damage,owner,weaponId,color,radius=4,pierce=0,explosive=false}){
    Object.assign(this,{x,y,vx,vy,damage,owner,weaponId,color,radius,pierce,explosive});
    this.life=2.2;this.dead=false;this.age=0;this.hitIds=new Set();this.gravity=explosive?260:0;
  }
  update(dt,scale=1){this.age+=dt*scale;this.x+=this.vx*dt*scale;this.y+=this.vy*dt*scale;this.vy+=this.gravity*dt*scale;this.life-=dt*scale;if(this.life<=0)this.dead=true}
}
