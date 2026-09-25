import {followPath} from "./paths.js";

export class AISystem{
  constructor(config,weapon,effects){this.config=config;this.weapon=weapon;this.effects=effects}
  update(e,p,s,dt){
    if(e.dead)return;
    // travel the approach lane before engaging — enemies run in from a
    // direction toward a destination instead of appearing at a fixed spot
    if(!e.engaged){followPath(e,dt,this.config.pathSpeed[e.type]||160);return}
    const cls=this.config.enemyClasses[e.type]||this.config.enemyClasses.grunt;const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;e.facing=dx>=0?1:-1;e.aiTimer+=dt;e.walkCycle+=Math.abs(e.vx)*dt*.015;e.dashCooldown=Math.max(0,e.dashCooldown-dt);
    if(e.hitStagger>0)return;
    if(e.type==="runner"){e.vx+=Math.sign(dx)*cls.speed*dt*4;if(d<70&&e.meleeCooldown<=0){e.meleeCooldown=.7;p.damage(cls.damage,p.x,{knockback:260});this.effects.impact(p.x,p.y,this.config.colors.danger)}return}
    if(e.type==="sniper"){
      const ideal=780;if(d<ideal*.7)e.vx-=Math.sign(dx)*cls.speed*dt*2;else if(d>ideal*1.1)e.vx+=Math.sign(dx)*cls.speed*dt*1.5;
      if(e.fireCooldown<=0&&d<cls.shootRange){this.weapon.shoot(e,p.x,p.y,s.projectiles,this.effects)}return;
    }
    if(e.type==="heavy"||e.type==="boss"){
      if(e.type==="boss")this.updateBoss(e,p,s,dt); else {if(d>470)e.vx+=Math.sign(dx)*cls.speed*dt*1.6;else if(d<320)e.vx-=Math.sign(dx)*cls.speed*dt*1.3;}
      if(d<70&&e.meleeCooldown<=0){e.meleeCooldown=.8;p.damage(cls.damage,p.x,{knockback:260});}
      if(e.fireCooldown<=0&&d<cls.shootRange)this.weapon.shoot(e,p.x,p.y,s.projectiles,this.effects);return;
    }
    const desired=e.type==="assault"?440:390;
    if(d>desired)e.vx+=Math.sign(dx)*cls.speed*dt*2.4;else if(d<desired*.72)e.vx-=Math.sign(dx)*cls.speed*dt*1.6;else e.vx*=.96;
    if(e.type==="elite"&&e.dashCooldown<=0&&d<520&&Math.random()<dt*.7){e.vx+=Math.sign(dx)*540;e.dashCooldown=1.6;e.invulnerable=.18;this.effects.muzzle(e.x,e.y,dx>=0?0:Math.PI,"smg",cls.color)}
    if(e.fireCooldown<=0&&d<cls.shootRange)this.weapon.shoot(e,p.x,p.y,s.projectiles,this.effects);
    if(d<66&&e.meleeCooldown<=0){e.meleeCooldown=.65;p.damage(cls.damage,p.x,{knockback:220})}
  }
  updateBoss(e,p,s,dt){
    const hpPct=e.hp/e.maxHp;e.phase=hpPct>.66?1:hpPct>.33?2:3;const desired=e.phase===1?540:e.phase===2?420:300;
    if(Math.abs(p.x-e.x)>desired)e.vx+=Math.sign(p.x-e.x)*(e.phase===3?210:150)*dt*2.1;else e.vx*=.97;
    if(e.phase>=2&&e.dashCooldown<=0){e.vx+=Math.sign(p.x-e.x)*720;e.dashCooldown=e.phase===3?1.8:2.8;e.invulnerable=.2;this.firePowerBurst(e,p,s)}
    if(e.fireCooldown<=0&&Math.abs(p.x-e.x)<e.config.enemyClasses.boss.shootRange)this.weapon.shoot(e,p.x,p.y,s.projectiles,this.effects);
    // each general unleashes their stolen fire power periodically
    e.emberTimer=e.emberTimer??0;if(e.emberTimer<=0){this.firePowerBurst(e,p,s);e.emberTimer=e.phase===3?1.5:2.4}
  }
  firePowerBurst(e,p,s){
    const fp=e.bossMeta?.fire;if(!fp)return;const col=e.bossMeta.color;
    if(fp==="pool"||fp==="all"){s.decals.push({x:e.x+(Math.random()-.5)*200,y:this.config.arena.groundY-6,life:5,size:26,fire:true,color:col})}
    if(fp==="beam"||fp==="all"){this.effects.tracer(e.x,e.y-30,p.x,p.y-20,col);this.effects.burst(e.x,e.y-30,col,10,260)}
    if(fp==="slam"||fp==="all"){this.effects.burst(e.x,e.y,col,22,340);s.shake=Math.min(.9,s.shake+.22)}
    if(fp==="dash"||fp==="all"){this.effects.muzzle(e.x,e.y,e.facing>0?0:Math.PI,"smg",col)}
  }
}
