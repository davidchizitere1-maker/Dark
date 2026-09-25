import {Projectile} from "../entities/projectile.js";
export class WeaponSystem{
  constructor(config,audio){this.config=config;this.audio=audio}
  shoot(actor,tx,ty,projectiles,effects){
    if(actor.dead||actor.reloadTimer>0||actor.fireCooldown>0)return false;
    const w=actor.weapon||this.config.weapons.pistol;
    if(!actor.enemy&&actor.magazine<=0)return false;
    const base=Math.atan2(ty-actor.y,tx-actor.x),muzzleX=actor.x+Math.cos(base)*42,muzzleY=actor.y-23+Math.sin(base)*42;
    for(let i=0;i<w.pellets;i++){
      const spread=(Math.random()-.5)*w.spread;const a=base+spread;projectiles.push(new Projectile({x:muzzleX,y:muzzleY,vx:Math.cos(a)*w.bulletSpeed,vy:Math.sin(a)*w.bulletSpeed,damage:w.damage,owner:actor.enemy?"enemy":"player",weaponId:w.id,color:w.color,radius:w.id==="sniper"?5:3,pierce:w.pierce}));
    }
    actor.fireCooldown=w.fireRate;actor.recoil=Math.min(1.1,actor.recoil+w.recoil/500);actor.action="shoot";actor.actionTimer=.12;
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
}
