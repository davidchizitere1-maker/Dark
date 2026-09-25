import {Projectile} from "../entities/projectile.js";
export class WeaponSystem{
  constructor(config,audio){this.config=config;this.audio=audio}
  shoot(actor,tx,ty,projectiles,effects){
    if(actor.dead||actor.reloadTimer>0||actor.fireCooldown>0)return false;
    const w=actor.weapon||this.config.weapons.pistol;
    if(!actor.enemy&&actor.magazine<=0)return false;
    const base=Math.atan2(ty-actor.y,tx-actor.x),muzzleX=actor.x+Math.cos(base)*42,muzzleY=actor.y-23+Math.sin(base)*42;
    // crouching and aiming (zoom/ADS) both tighten the spread — a small
    // realism touch: stance and stillness actually change your accuracy
    let spreadMul=1;if(actor.crouching)spreadMul*=this.config.player.crouchSpreadMul;if(actor.aiming)spreadMul*=this.config.player.aimSpreadMul;
    for(let i=0;i<w.pellets;i++){
      const spread=(Math.random()-.5)*w.spread*spreadMul;const a=base+spread;projectiles.push(new Projectile({x:muzzleX,y:muzzleY,vx:Math.cos(a)*w.bulletSpeed,vy:Math.sin(a)*w.bulletSpeed,damage:w.damage,owner:actor.enemy?"enemy":"player",weaponId:w.id,color:w.color,radius:w.id==="sniper"?5:3,pierce:w.pierce}));
    }
    actor.fireCooldown=w.fireRate;actor.recoil=Math.min(1.4,actor.recoil+w.recoil/380);actor.action="shoot";actor.actionTimer=.12;
    if(!actor.enemy){actor.magazine--;actor.syncAmmo()}
    this.audio?.unlock();this.audio?.shot(w.id);effects.muzzle(muzzleX,muzzleY,base,w.id,w.color);effects.casing(actor.x,actor.y-5,actor.facing);effects.tracer(muzzleX,muzzleY,tx,ty,w.color);
    return true;
  }
  reload(actor){
    if(actor.enemy||actor.dead||actor.reloadTimer>0||actor.magazine>=actor.weapon.magazine||actor.reserve<=0)return false;
    actor.reloadTimer=actor.weapon.reload;actor.action="reload";actor.actionTimer=actor.weapon.reload;this.audio?.reload();return true;
  }
  finishReload(actor){const w=actor.weapon;if(actor.enemy||actor.reloadTimer>0)return;const need=w.magazine-actor.magazine;const n=Math.min(need,actor.reserve);actor.magazine+=n;actor.reserve-=n;actor.syncAmmo()}
  switch(actor,id){if(actor.enemy||!this.config.weapons[id])return false;actor.equip(id);return true}
  // arc-throw a fragmentation grenade; it explodes on a fuse timer or on
  // touching the ground (see Game#update, which owns the projectile list)
  throwGrenade(actor,tx,ty,projectiles,effects){
    const g=this.config.grenade;if(!g||actor.dead||actor.enemy||actor.grenades<=0||actor.grenadeCooldown>0)return false;
    const base=Math.atan2(ty-actor.y,tx-actor.x);
    const vx=Math.cos(base)*g.throwSpeed,vy=Math.sin(base)*g.throwSpeed-320;
    const nade=new Projectile({x:actor.x+actor.facing*20,y:actor.y-30,vx,vy,damage:g.damage,owner:"player",weaponId:"grenade",color:"#9fbf6a",radius:8,explosive:true});
    nade.life=g.fuse;projectiles.push(nade);
    actor.grenades--;actor.grenadeCooldown=g.cooldown;actor.action="throw";actor.actionTimer=.3;
    this.audio?.unlock();effects.burst(actor.x+actor.facing*20,actor.y-30,"#9fbf6a",4,80);
    return true;
  }
}
