export class Fighter{
  constructor({x,y,color,enemy=false,type="grunt",elite=false,config}){
    Object.assign(this,{x,y,color,enemy,type,elite,config});
    const data=enemy?config.enemyClasses[type]:null;
    this.vx=0;this.vy=0;this.radius=enemy?22*(data?.scale||1):config.player.radius;
    this.maxHp=enemy?(data?.hp||60):config.player.maxHp;this.hp=this.maxHp;
    this.maxArmor=enemy?(data?.armor||0):config.player.maxArmor;this.armor=this.maxArmor;
    this.grounded=false;this.facing=enemy?-1:1;this.walkCycle=0;this.fireCooldown=0;this.meleeCooldown=0;this.reloadTimer=0;this.invulnerable=0;
    this.flash=0;this.dead=false;this.deathTimer=0;this.deathAngle=0;this.hitStagger=0;this.recoil=0;this.action="idle";this.actionTimer=0;this.dodgeTimer=0;this.dashCooldown=0;
    this.magazine=enemy?Infinity:config.weapons.pistol.magazine;this.reserve=enemy?Infinity:config.weapons.pistol.reserve;this.weaponId=enemy?"pistol":"pistol";
    this.ammo={};if(!enemy)for(const [id,w] of Object.entries(config.weapons))this.ammo[id]={mag:w.magazine,reserve:w.reserve};
    this.stamina=config.player.staminaMax;this.bulletTime=config.player.bulletTimeMax;this.targetX=x;this.targetY=y;this.aiState="approach";this.aiTimer=0;this.phase=1;
  }
  get weapon(){return this.config.weapons[this.weaponId]}
  equip(id){if(this.enemy||!this.config.weapons[id])return;this.weaponId=id;this.magazine=this.ammo[id].mag;this.reserve=this.ammo[id].reserve;this.reloadTimer=0}
  syncAmmo(){if(this.enemy)return;this.ammo[this.weaponId].mag=this.magazine;this.ammo[this.weaponId].reserve=this.reserve}
  updateTimers(dt){
    this.fireCooldown=Math.max(0,this.fireCooldown-dt);this.meleeCooldown=Math.max(0,this.meleeCooldown-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);this.flash=Math.max(0,this.flash-dt);this.recoil=Math.max(0,this.recoil-dt*7);this.hitStagger=Math.max(0,this.hitStagger-dt);this.dashCooldown=Math.max(0,this.dashCooldown-dt);this.actionTimer=Math.max(0,this.actionTimer-dt);
    if(!this.enemy){this.stamina=Math.min(this.config.player.staminaMax,this.stamina+this.config.player.staminaRegen*dt)}
  }
  damage(amount,hitX=this.x,options={}){
    if(this.invulnerable>0||this.dead)return {applied:false,killed:false};
    const dir=Math.sign(hitX-this.x)||1;let remaining=amount;
    if(this.armor>0){const absorbed=Math.min(this.armor,remaining*.72);this.armor-=absorbed;remaining-=absorbed*.55}
    this.hp=Math.max(0,this.hp-remaining);this.flash=.1;this.hitStagger=Math.max(this.hitStagger,.08);this.vx+=dir*(options.knockback||120);this.action="hurt";
    if(this.hp<=0){this.dead=true;this.deathTimer=1.0;this.deathAngle=(Math.random()>.5?1:-1)*(.95+Math.random()*.4);this.action="death"}
    return {applied:true,killed:this.dead,remainingDamage:remaining};
  }
}
