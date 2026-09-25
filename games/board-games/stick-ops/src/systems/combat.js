export class CombatSystem{
  constructor(config,audio,effects){this.config=config;this.audio=audio;this.effects=effects}
  handleProjectileHit(s,projectile,target){
    if(projectile.hitIds.has(target))return false;projectile.hitIds.add(target);
    const hit=target.damage(projectile.damage,projectile.x,{knockback:projectile.weaponId==="shotgun"?280:projectile.weaponId==="sniper"?460:140});
    if(!hit.applied)return false;
    if(target===s.player){const ang=Math.atan2(projectile.y-target.y,projectile.x-target.x);s.damageIndicators.push({angle:ang,life:.5,maxLife:.5})}
    this.effects.impact(projectile.x,projectile.y,target.enemy?this.config.colors.blood:projectile.color,projectile.weaponId==="sniper");this.audio?.hit();s.shake=Math.min(.5,s.shake+.035+(projectile.weaponId==="sniper"?.16:0));s.hitStop=Math.max(s.hitStop,projectile.weaponId==="sniper"?.045:.012);
    if(target.enemy)this.effects.blood(projectile.x,projectile.y);
    if(projectile.pierce<=0)projectile.dead=true;else projectile.pierce--;
    if(hit.killed)this.registerKill(s,target);
    return true;
  }
  registerKill(s,target){s.kills++;s.score+=target.type==="boss"?1800:target.type==="elite"?350:target.type==="heavy"?220:target.type==="sniper"?180:target.type==="runner"?140:100;s.combo++;s.bestCombo=Math.max(s.bestCombo,s.combo);s.comboTimer=2.5;s.shake=Math.min(.8,s.shake+.16);this.audio?.death()}
  melee(actor,enemies,s){
    if(actor.dead||actor.meleeCooldown>0)return 0;actor.meleeCooldown=.42;actor.action="melee";actor.actionTimer=.25;let hits=0;this.audio?.melee();
    const a=actor.facing>0?0:Math.PI;this.effects.meleeArc(actor.x+Math.cos(a)*34,actor.y-8,a,this.config.colors.accent);
    for(const t of enemies){if(t.dead)continue;const dx=t.x-actor.x,dy=t.y-actor.y,d=Math.hypot(dx,dy);if(d<=78+t.radius&&Math.sign(dx||actor.facing)===actor.facing){const hit=t.damage(this.config.melee.damage||42,t.x,{knockback:420});if(hit.applied){hits++;this.effects.impact(t.x,t.y,this.config.colors.spark,true);this.effects.blood(t.x,t.y);s.hitStop=Math.max(s.hitStop,.055);s.shake=Math.min(.7,s.shake+.12);if(hit.killed)this.registerKill(s,t)}}}
    return hits;
  }
  execute(actor,enemies,s){
    if(actor.dead||actor.meleeCooldown>0)return false;let target=null,near=Infinity;for(const e of enemies){if(e.dead||e.hp>32)continue;const d=Math.hypot(e.x-actor.x,e.y-actor.y);if(d<64&&d<near){target=e;near=d}}
    if(!target)return false;actor.meleeCooldown=.8;actor.action="execute";actor.actionTimer=.55;target.damage(9999,target.x,{knockback:700});target.deathTimer=.75;this.effects.impact(target.x,target.y,this.config.colors.accent,true);this.effects.blood(target.x,target.y);s.score+=150;s.hitStop=.11;s.shake=.42;this.registerKill(s,target);return true;
  }
  // grenade blast: falls off linearly with distance, hits everyone in
  // radius (enemies, or the player if they wander into their own blast)
  explode(s,x,y,damage,radius){
    this.effects.burst(x,y,"#ffb35c",30,360);this.effects.impact(x,y,"#ff7a3d",true);
    s.shake=Math.min(1,s.shake+.55);s.hitStop=Math.max(s.hitStop,.09);this.audio?.hit();
    const targets=[...s.enemies];if(s.player&&!s.player.dead)targets.push(s.player);
    for(const t of targets){
      if(t.dead)continue;const d=Math.hypot(t.x-x,t.y-y);if(d>radius)continue;
      const falloff=1-d/radius,dmg=damage*Math.max(.2,falloff);
      const hit=t.damage(dmg,x,{knockback:560*falloff});
      if(hit.applied){this.effects.blood(t.x,t.y);if(t===s.player){const ang=Math.atan2(t.y-y,t.x-x);s.damageIndicators.push({angle:ang,life:.5,maxLife:.5})}if(t.enemy&&hit.killed)this.registerKill(s,t)}
    }
  }
}
