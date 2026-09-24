import { CONFIG, type EnemyType, type WeaponId } from "./config";

export class Fighter {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  color: string;
  enemy: boolean;
  type: EnemyType;
  radius: number;
  maxHp: number;
  hp: number;
  maxArmor: number;
  armor: number;
  grounded = false;
  facing = 1;
  walkCycle = 0;
  fireCooldown = 0;
  meleeCooldown = 0;
  reloadTimer = 0;
  invulnerable = 0;
  flash = 0;
  dead = false;
  deathTimer = 0;
  deathAngle = 0;
  hitStagger = 0;
  recoil = 0;
  action = "idle";
  actionTimer = 0;
  dodgeTimer = 0;
  dashCooldown = 0;
  magazine: number;
  reserve: number;
  weaponId: WeaponId;
  ammo: Record<string, { mag: number; reserve: number }> = {};
  stamina: number;
  bulletTime: number;
  targetX: number;
  targetY: number;
  aimAngle = 0;
  coyote = 0;
  speedMul = 1;
  dmgMul = 1;
  phase = 1;

  constructor(opts: {
    x: number;
    y: number;
    color: string;
    enemy?: boolean;
    type?: EnemyType;
    hpMul?: number;
    speedMul?: number;
    dmgMul?: number;
    ammoMul?: number;
    startWeapon?: WeaponId;
  }) {
    this.x = opts.x;
    this.y = opts.y;
    this.color = opts.color;
    this.enemy = !!opts.enemy;
    this.type = opts.type ?? "grunt";
    const data = this.enemy ? CONFIG.enemyClasses[this.type] : null;
    this.radius = this.enemy ? 22 * (data?.scale ?? 1) : CONFIG.player.radius;
    this.maxHp = this.enemy
      ? Math.round((data?.hp ?? 60) * (opts.hpMul ?? 1))
      : Math.round(CONFIG.player.maxHp * (opts.hpMul ?? 1));
    this.hp = this.maxHp;
    this.maxArmor = this.enemy ? (data && "armor" in data ? (data.armor as number) : 0) : CONFIG.player.maxArmor;
    this.armor = this.maxArmor;
    this.speedMul = opts.speedMul ?? 1;
    this.dmgMul = opts.dmgMul ?? 1;
    this.weaponId = this.enemy ? "pistol" : (opts.startWeapon ?? "pistol");
    const w = CONFIG.weapons[this.weaponId];
    const ammoMul = opts.ammoMul ?? 1;
    this.magazine = this.enemy ? Infinity : w.magazine;
    this.reserve = this.enemy ? Infinity : Math.round(w.reserve * ammoMul);
    if (!this.enemy) {
      for (const [id, wep] of Object.entries(CONFIG.weapons)) {
        this.ammo[id] = { mag: wep.magazine, reserve: Math.round(wep.reserve * ammoMul) };
      }
    }
    this.stamina = CONFIG.player.staminaMax;
    this.bulletTime = CONFIG.player.bulletTimeMax;
    this.targetX = opts.x + 200;
    this.targetY = opts.y - 20;
    this.facing = this.enemy ? -1 : 1;
  }

  get weapon() {
    return CONFIG.weapons[this.weaponId];
  }

  equip(id: WeaponId) {
    if (this.enemy || !CONFIG.weapons[id]) return;
    this.syncAmmo();
    this.weaponId = id;
    this.magazine = this.ammo[id].mag;
    this.reserve = this.ammo[id].reserve;
    this.reloadTimer = 0;
  }

  syncAmmo() {
    if (this.enemy) return;
    this.ammo[this.weaponId] = { mag: this.magazine, reserve: this.reserve };
  }

  updateTimers(dt: number) {
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.meleeCooldown = Math.max(0, this.meleeCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.recoil = Math.max(0, this.recoil - dt * 7);
    this.hitStagger = Math.max(0, this.hitStagger - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.actionTimer = Math.max(0, this.actionTimer - dt);
    this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
    if (this.grounded) this.coyote = CONFIG.player.coyote;
    else this.coyote = Math.max(0, this.coyote - dt);
    if (!this.enemy) {
      this.stamina = Math.min(CONFIG.player.staminaMax, this.stamina + CONFIG.player.staminaRegen * dt);
    }
  }

  damage(amount: number, hitX = this.x, options: { knockback?: number } = {}) {
    if (this.invulnerable > 0 || this.dead) return { applied: false, killed: false, taken: 0 };
    const dir = Math.sign(this.x - hitX) || 1;
    let remaining = amount;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, remaining * 0.72);
      this.armor -= absorbed;
      remaining -= absorbed * 0.55;
    }
    const taken = remaining;
    this.hp = Math.max(0, this.hp - remaining);
    this.flash = 0.1;
    this.hitStagger = Math.max(this.hitStagger, 0.08);
    this.vx += dir * (options.knockback ?? 120);
    this.action = "hurt";
    if (this.hp <= 0) {
      this.dead = true;
      this.deathTimer = 1.05;
      this.deathAngle = (Math.random() > 0.5 ? 1 : -1) * (0.95 + Math.random() * 0.4);
      this.action = "death";
    }
    return { applied: true, killed: this.dead, taken };
  }
}

export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  owner: "player" | "enemy";
  weaponId: string;
  color: string;
  radius: number;
  pierce: number;
  life = 2.2;
  dead = false;
  age = 0;
  hitIds = new Set<Fighter>();
  gravity = 0;

  constructor(opts: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    owner: "player" | "enemy";
    weaponId: string;
    color: string;
    radius?: number;
    pierce?: number;
  }) {
    this.x = opts.x;
    this.y = opts.y;
    this.vx = opts.vx;
    this.vy = opts.vy;
    this.damage = opts.damage;
    this.owner = opts.owner;
    this.weaponId = opts.weaponId;
    this.color = opts.color;
    this.radius = opts.radius ?? 3;
    this.pierce = opts.pierce ?? 0;
  }

  update(dt: number, scale = 1) {
    this.age += dt * scale;
    this.x += this.vx * dt * scale;
    this.y += this.vy * dt * scale;
    this.vy += this.gravity * dt * scale;
    this.life -= dt * scale;
    if (this.life <= 0) this.dead = true;
  }
}
