import { CONFIG, difficultyScale, type EnemyType, type OpId, type WeaponId } from "./config";
import { Fighter, Projectile } from "./entities";
import type { GameState } from "./state";
import type { AudioSystem } from "./audio";

export class Physics {
  update(e: Fighter, dt: number) {
    e.vy = Math.min(CONFIG.physics.maxFall, e.vy + CONFIG.physics.gravity * dt);
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.vx *= Math.pow(CONFIG.physics.friction, dt * 60);
    const { width, groundY, leftMargin, rightMargin } = CONFIG.arena;
    e.x = Math.max(leftMargin, Math.min(width - rightMargin, e.x));
    if (e.y + e.radius >= groundY) {
      e.y = groundY - e.radius;
      e.vy = 0;
      e.grounded = true;
    } else e.grounded = false;
  }
}

export class Effects {
  constructor(private s: GameState) {}

  particle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    color: string,
    size = 3,
    gravity = 0,
    kind: "square" | "smoke" | "casing" | "spark" | "arc" = "square",
    angle?: number,
  ) {
    this.s.particles.push({ x, y, vx, vy, life, maxLife: life, color, size, gravity, kind, angle });
  }

  burst(x: number, y: number, color: string, count = 10, force = 180) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = force * (0.45 + Math.random() * 0.9);
      this.particle(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.32 + Math.random() * 0.25, color, 2 + Math.random() * 3, 320, "spark");
    }
  }

  muzzle(x: number, y: number, a: number, id: string, color: string) {
    const n = id === "shotgun" ? 10 : id === "sniper" ? 7 : 6;
    for (let i = 0; i < n; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      this.particle(
        x,
        y,
        Math.cos(a + spread) * (180 + Math.random() * 120),
        Math.sin(a + spread) * (180 + Math.random() * 120),
        0.1 + Math.random() * 0.08,
        color,
        3 + Math.random() * 4,
        0,
        "spark",
      );
    }
  }

  casing(x: number, y: number, dir: number) {
    this.particle(x, y, dir * (70 + Math.random() * 100), -40 - Math.random() * 80, 0.45, "#e0b86a", 3, 900, "casing");
  }

  tracer(x1: number, y1: number, x2: number, y2: number, color: string) {
    this.s.tracers.push({ x1, y1, x2, y2, color, life: 0.07, maxLife: 0.07 });
  }

  impact(x: number, y: number, color: string, heavy = false) {
    this.burst(x, y, color, heavy ? 16 : 9, heavy ? 260 : 180);
    for (let i = 0; i < (heavy ? 3 : 1); i++) {
      this.particle(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 30, -30 - Math.random() * 30, 0.5, "#6f7884", 8 + Math.random() * 12, -10, "smoke");
    }
  }

  blood(x: number, y: number) {
    this.burst(x, y, CONFIG.colors.blood, 7, 140);
    this.s.decals.push({ x, y, life: 12, size: 3 + Math.random() * 4 });
    if (this.s.decals.length > 80) this.s.decals.shift();
  }

  meleeArc(x: number, y: number, a: number, color: string) {
    this.s.particles.push({ x, y, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, life: 0.18, maxLife: 0.18, color, size: 28, gravity: 0, kind: "arc", angle: a });
  }

  float(x: number, y: number, text: string, color: string) {
    this.s.floats.push({ x, y, vy: -70, text, color, life: 0.7, maxLife: 0.7 });
  }

  update(dt: number) {
    for (const p of this.s.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(0.12, dt);
      p.life -= dt;
    }
    this.s.particles = this.s.particles.filter((p) => p.life > 0);
    for (const t of this.s.tracers) t.life -= dt;
    this.s.tracers = this.s.tracers.filter((t) => t.life > 0);
    for (const d of this.s.decals) d.life -= dt;
    this.s.decals = this.s.decals.filter((d) => d.life > 0);
    for (const f of this.s.floats) {
      f.y += f.vy * dt;
      f.life -= dt;
    }
    this.s.floats = this.s.floats.filter((f) => f.life > 0);
  }
}

export class WeaponSystem {
  constructor(private audio: AudioSystem) {}

  shoot(actor: Fighter, tx: number, ty: number, projectiles: Projectile[], effects: Effects) {
    if (actor.dead || actor.reloadTimer > 0 || actor.fireCooldown > 0) return false;
    const w = actor.weapon;
    if (!actor.enemy && actor.magazine <= 0) return false;
    const base = Math.atan2(ty - (actor.y - 22), tx - actor.x);
    const muzzleX = actor.x + Math.cos(base) * 42;
    const muzzleY = actor.y - 23 + Math.sin(base) * 42;
    const dmg = actor.enemy ? actor.dmgMul * (CONFIG.enemyClasses[actor.type].damage || w.damage) : w.damage;
    for (let i = 0; i < w.pellets; i++) {
      const spread = (Math.random() - 0.5) * w.spread;
      const a = base + spread;
      projectiles.push(
        new Projectile({
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(a) * w.bulletSpeed,
          vy: Math.sin(a) * w.bulletSpeed,
          damage: actor.enemy ? dmg : w.damage,
          owner: actor.enemy ? "enemy" : "player",
          weaponId: w.id,
          color: w.color,
          radius: w.id === "sniper" ? 5 : 3,
          pierce: w.pierce,
        }),
      );
    }
    actor.fireCooldown = w.fireRate;
    actor.recoil = Math.min(1.1, actor.recoil + w.recoil / 500);
    actor.action = "shoot";
    actor.actionTimer = 0.12;
    if (!actor.enemy) {
      actor.magazine--;
      actor.syncAmmo();
    }
    this.audio.unlock();
    this.audio.shot(w.id);
    effects.muzzle(muzzleX, muzzleY, base, w.id, w.color);
    effects.casing(actor.x, actor.y - 5, actor.facing);
    effects.tracer(muzzleX, muzzleY, tx, ty, w.color);
    return true;
  }

  reload(actor: Fighter) {
    if (actor.enemy || actor.dead || actor.reloadTimer > 0 || actor.magazine >= actor.weapon.magazine || actor.reserve <= 0) return false;
    actor.reloadTimer = actor.weapon.reload;
    actor.action = "reload";
    actor.actionTimer = actor.weapon.reload;
    this.audio.reload();
    return true;
  }

  finishReload(actor: Fighter) {
    const w = actor.weapon;
    if (actor.enemy) return;
    const need = w.magazine - actor.magazine;
    const n = Math.min(need, actor.reserve);
    actor.magazine += n;
    actor.reserve -= n;
    actor.syncAmmo();
  }

  switch(actor: Fighter, id: WeaponId) {
    if (actor.enemy || !CONFIG.weapons[id]) return false;
    actor.equip(id);
    return true;
  }

  cycle(actor: Fighter, dir: number) {
    const ids = Object.keys(CONFIG.weapons) as WeaponId[];
    const i = ids.indexOf(actor.weaponId);
    const next = ids[(i + dir + ids.length) % ids.length];
    return this.switch(actor, next);
  }
}

export class CombatSystem {
  constructor(
    private audio: AudioSystem,
    private effects: Effects,
  ) {}

  handleProjectileHit(s: GameState, projectile: Projectile, target: Fighter) {
    if (projectile.hitIds.has(target)) return false;
    projectile.hitIds.add(target);
    const knock = projectile.weaponId === "shotgun" ? 280 : projectile.weaponId === "sniper" ? 460 : 140;
    const hit = target.damage(projectile.damage, projectile.x, { knockback: knock });
    if (!hit.applied) return false;
    if (target === s.player) {
      const ang = Math.atan2(projectile.y - target.y, projectile.x - target.x);
      s.damageIndicators.push({ angle: ang, life: 0.5, maxLife: 0.5 });
    }
    this.effects.impact(projectile.x, projectile.y, target.enemy ? CONFIG.colors.blood : projectile.color, projectile.weaponId === "sniper");
    this.audio.hit();
    if (hit.taken > 0) this.effects.float(target.x, target.y - 70, String(Math.round(hit.taken)), target.enemy ? "#ececec" : CONFIG.colors.danger);
    s.trauma = Math.min(1, s.trauma + 0.12 + (projectile.weaponId === "sniper" ? 0.22 : 0));
    s.hitStop = Math.max(s.hitStop, projectile.weaponId === "sniper" ? 0.045 : 0.012);
    if (target.enemy) this.effects.blood(projectile.x, projectile.y);
    if (projectile.pierce <= 0) projectile.dead = true;
    else projectile.pierce--;
    if (hit.killed) this.registerKill(s, target);
    return true;
  }

  registerKill(s: GameState, target: Fighter) {
    s.kills++;
    const pts =
      target.type === "boss" ? 1800 : target.type === "elite" ? 350 : target.type === "heavy" ? 220 : target.type === "sniper" ? 180 : target.type === "runner" ? 140 : 100;
    s.score += pts;
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    s.comboTimer = 2.5;
    s.trauma = Math.min(1, s.trauma + 0.28);
    this.audio.death();
    this.effects.float(target.x, target.y - 90, `+${pts}`, CONFIG.colors.accent);
  }

  melee(actor: Fighter, enemies: Fighter[], s: GameState) {
    if (actor.dead || actor.meleeCooldown > 0) return 0;
    const exec = this.tryExecute(actor, enemies, s);
    if (exec) return 1;
    actor.meleeCooldown = CONFIG.melee.cooldown;
    actor.action = "melee";
    actor.actionTimer = 0.25;
    this.audio.melee();
    const a = actor.facing > 0 ? 0 : Math.PI;
    this.effects.meleeArc(actor.x + Math.cos(a) * 34, actor.y - 8, a, CONFIG.colors.accent);
    let hits = 0;
    for (const t of enemies) {
      if (t.dead) continue;
      const dx = t.x - actor.x;
      const dy = t.y - actor.y;
      const d = Math.hypot(dx, dy);
      if (d <= CONFIG.melee.range + t.radius && Math.sign(dx || actor.facing) === actor.facing) {
        const hit = t.damage(CONFIG.melee.damage, t.x, { knockback: 420 });
        if (hit.applied) {
          hits++;
          this.effects.impact(t.x, t.y, CONFIG.colors.spark, true);
          this.effects.blood(t.x, t.y);
          s.hitStop = Math.max(s.hitStop, 0.055);
          s.trauma = Math.min(1, s.trauma + 0.2);
          if (hit.killed) this.registerKill(s, t);
        }
      }
    }
    return hits;
  }

  tryExecute(actor: Fighter, enemies: Fighter[], s: GameState) {
    if (actor.dead || actor.meleeCooldown > 0) return false;
    let target: Fighter | null = null;
    let near = Infinity;
    for (const e of enemies) {
      if (e.dead || e.hp > 32) continue;
      const d = Math.hypot(e.x - actor.x, e.y - actor.y);
      if (d < 64 && d < near) {
        target = e;
        near = d;
      }
    }
    if (!target) return false;
    actor.meleeCooldown = 0.8;
    actor.action = "execute";
    actor.actionTimer = 0.55;
    target.damage(9999, target.x, { knockback: 700 });
    target.deathTimer = 0.75;
    this.effects.impact(target.x, target.y, CONFIG.colors.accent, true);
    this.effects.blood(target.x, target.y);
    s.score += 150;
    s.hitStop = 0.11;
    s.trauma = 0.7;
    this.registerKill(s, target);
    return true;
  }
}

export class AISystem {
  constructor(
    private weapons: WeaponSystem,
    private effects: Effects,
  ) {}

  update(e: Fighter, p: Fighter, s: GameState, dt: number) {
    if (e.dead) return;
    const cls = CONFIG.enemyClasses[e.type];
    const dx = p.x - e.x;
    const d = Math.hypot(dx, p.y - e.y) || 1;
    e.facing = dx >= 0 ? 1 : -1;
    e.targetX = p.x;
    e.targetY = p.y - 22;
    e.aimAngle = Math.atan2(e.targetY - (e.y - 22), e.targetX - e.x);
    e.walkCycle += Math.abs(e.vx) * dt * 0.015;
    if (e.hitStagger > 0) return;
    const spd = cls.speed * e.speedMul;

    if (e.type === "runner") {
      e.vx += Math.sign(dx) * spd * dt * 4;
      if (d < 70 && e.meleeCooldown <= 0) {
        e.meleeCooldown = 0.7;
        p.damage(cls.damage * e.dmgMul, p.x, { knockback: 260 });
        this.effects.impact(p.x, p.y, CONFIG.colors.danger);
      }
      return;
    }
    if (e.type === "sniper") {
      const ideal = 780;
      if (d < ideal * 0.7) e.vx -= Math.sign(dx) * spd * dt * 2;
      else if (d > ideal * 1.1) e.vx += Math.sign(dx) * spd * dt * 1.5;
      if (e.fireCooldown <= 0 && d < cls.shootRange) this.weapons.shoot(e, p.x, p.y - 20, s.projectiles, this.effects);
      return;
    }
    if (e.type === "heavy" || e.type === "boss") {
      if (e.type === "boss") this.updateBoss(e, p, s, dt);
      else {
        if (d > 470) e.vx += Math.sign(dx) * spd * dt * 1.6;
        else if (d < 320) e.vx -= Math.sign(dx) * spd * dt * 1.3;
      }
      if (d < 70 && e.meleeCooldown <= 0) {
        e.meleeCooldown = 0.8;
        p.damage(cls.damage * e.dmgMul, p.x, { knockback: 260 });
      }
      if (e.fireCooldown <= 0 && d < cls.shootRange) this.weapons.shoot(e, p.x, p.y - 20, s.projectiles, this.effects);
      return;
    }
    const desired = e.type === "assault" ? 440 : 390;
    if (d > desired) e.vx += Math.sign(dx) * spd * dt * 2.4;
    else if (d < desired * 0.72) e.vx -= Math.sign(dx) * spd * dt * 1.6;
    else e.vx *= 0.96;
    if (e.type === "elite" && e.dashCooldown <= 0 && d < 520 && Math.random() < dt * 0.7) {
      e.vx += Math.sign(dx) * 540;
      e.dashCooldown = 1.6;
      e.invulnerable = 0.18;
    }
    if (e.fireCooldown <= 0 && d < cls.shootRange) this.weapons.shoot(e, p.x, p.y - 20, s.projectiles, this.effects);
    if (d < 66 && e.meleeCooldown <= 0) {
      e.meleeCooldown = 0.65;
      p.damage(cls.damage * e.dmgMul, p.x, { knockback: 220 });
    }
  }

  updateBoss(e: Fighter, p: Fighter, s: GameState, dt: number) {
    const hpPct = e.hp / e.maxHp;
    e.phase = hpPct > 0.66 ? 1 : hpPct > 0.33 ? 2 : 3;
    const desired = e.phase === 1 ? 540 : e.phase === 2 ? 420 : 300;
    if (Math.abs(p.x - e.x) > desired) e.vx += Math.sign(p.x - e.x) * (e.phase === 3 ? 210 : 150) * e.speedMul * dt * 2.1;
    else e.vx *= 0.97;
    if (e.phase >= 2 && e.dashCooldown <= 0) {
      e.vx += Math.sign(p.x - e.x) * 720;
      e.dashCooldown = e.phase === 3 ? 1.8 : 2.8;
      e.invulnerable = 0.2;
    }
    if (e.fireCooldown <= 0 && Math.abs(p.x - e.x) < CONFIG.enemyClasses.boss.shootRange) {
      this.weapons.shoot(e, p.x, p.y - 20, s.projectiles, this.effects);
    }
  }
}

export class SpawnSystem {
  chooseType(op: OpId, w: number, i: number): EnemyType {
    if (op === "sweep" && w === CONFIG.waves.maxWaves) return i === 0 ? "boss" : i % 3 === 0 ? "elite" : "assault";
    if (op === "hold" && w > 1 && w % 10 === 0 && i === 0) return "boss";
    if (w >= 9 && i % 7 === 0) return "elite";
    if (w >= 7 && i % 6 === 0) return "sniper";
    if (w >= 5 && i % 5 === 0) return "heavy";
    if (w >= 4 && i % 4 === 0) return "assault";
    if (w >= 3 && i % 3 === 0) return "runner";
    return "grunt";
  }

  waveCount(op: OpId, w: number) {
    if (op === "extract") return 0;
    return Math.min(18, CONFIG.waves.baseCount + (w - 1) * CONFIG.waves.growth);
  }

  spawnOne(s: GameState, type: EnemyType, side?: number) {
    const scale = difficultyScale(s.difficulty);
    const dir = side ?? (Math.random() > 0.5 ? -1 : 1);
    const x =
      dir < 0
        ? 120 + Math.random() * 280
        : CONFIG.arena.width - 400 + Math.random() * 260;
    const f = new Fighter({
      x,
      y: CONFIG.arena.groundY - 40,
      color: CONFIG.enemyClasses[type].color,
      enemy: true,
      type,
      hpMul: scale.enemyHp,
      speedMul: scale.enemySpeed,
      dmgMul: scale.enemyDmg,
    });
    s.enemies.push(f);
    return f;
  }

  spawnWave(s: GameState) {
    const n = this.waveCount(s.op, s.wave);
    s.message = s.op === "sweep" && s.wave === CONFIG.waves.maxWaves ? "Warden inbound" : s.op === "extract" ? "Push east to the gate" : "Clear the wave";
    for (let i = 0; i < n && s.enemies.length < CONFIG.waves.maxSimultaneous; i++) {
      this.spawnOne(s, this.chooseType(s.op, s.wave, i), i % 2 === 0 ? -1 : 1);
    }
  }

  spawnExtract(s: GameState, dt: number) {
    s.spawnAcc += dt;
    const interval = Math.max(1.1, 3.4 - s.time * 0.012);
    if (s.spawnAcc < interval || s.enemies.filter((e) => !e.dead).length >= 10) return;
    s.spawnAcc = 0;
    const p = s.player;
    const type = this.chooseType("extract", Math.max(1, Math.floor(s.time / 12) + 1), s.kills);
    const ahead = p ? (Math.random() > 0.35 ? 1 : -1) : 1;
    const base = p ? p.x + ahead * (420 + Math.random() * 520) : CONFIG.arena.width * 0.5;
    const f = this.spawnOne(s, type, ahead);
    f.x = Math.max(80, Math.min(CONFIG.arena.width - 80, base));
  }
}
