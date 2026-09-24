import { CONFIG, difficultyScale } from "./config";
import { AudioSystem } from "./audio";
import { Fighter } from "./entities";
import { useHud } from "./hud-store";
import { Input } from "./input";
import { Renderer } from "./renderer";
import { GameState } from "./state";
import { AISystem, CombatSystem, Effects, Physics, SpawnSystem, WeaponSystem } from "./systems";
import type { EndReport, MissionSetup } from "./types";

export class Game {
  canvas: HTMLCanvasElement;
  input: Input;
  renderer: Renderer;
  audio = new AudioSystem();
  state = new GameState();
  effects = new Effects(this.state);
  physics = new Physics();
  weapons: WeaponSystem;
  combat: CombatSystem;
  ai: AISystem;
  spawn = new SpawnSystem();
  last = 0;
  raf = 0;
  setup: MissionSetup;
  jumpBuffer = 0;
  shakeEnabled = true;
  private onEnd?: (r: EndReport) => void;
  private onPause?: (v: boolean) => void;
  destroyed = false;

  constructor(
    canvas: HTMLCanvasElement,
    setup: MissionSetup,
    hooks: { onEnd?: (r: EndReport) => void; onPause?: (v: boolean) => void; audio?: boolean; shake?: boolean } = {},
  ) {
    this.canvas = canvas;
    this.setup = setup;
    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas);
    this.weapons = new WeaponSystem(this.audio);
    this.combat = new CombatSystem(this.audio, this.effects);
    this.ai = new AISystem(this.weapons, this.effects);
    this.onEnd = hooks.onEnd;
    this.onPause = hooks.onPause;
    this.audio.enabled = hooks.audio !== false;
    this.shakeEnabled = hooks.shake !== false;
  }

  init() {
    this.bindQa();
    this.start();
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.input.destroy();
    this.renderer.destroy();
    if (import.meta.env.DEV || new URLSearchParams(location.search).has("qa")) {
      delete window.__controlsTest;
    }
  }

  start() {
    this.audio.unlock();
    const scale = difficultyScale(this.setup.difficulty);
    const p = new Fighter({
      x: this.setup.op === "extract" ? 220 : CONFIG.arena.width * 0.5,
      y: CONFIG.arena.groundY - 40,
      color: CONFIG.colors.accent,
      hpMul: scale.playerHp,
      ammoMul: scale.ammo,
      startWeapon: this.setup.weapon,
    });
    p.equip(this.setup.weapon);
    this.state.start(p, this.setup.op, this.setup.difficulty, !!this.setup.demo);
    if (this.setup.op !== "extract") this.spawn.spawnWave(this.state);
    else {
      for (let i = 0; i < 5; i++) this.spawn.spawnExtract(this.state, 4);
    }
    this.last = performance.now();
    this.pushHud();
  }

  pause() {
    if (this.state.status !== "playing") return;
    this.state.pause();
    this.onPause?.(true);
    this.pushHud();
  }

  resume() {
    if (this.state.status !== "paused") return;
    this.state.resume();
    this.last = performance.now();
    this.onPause?.(false);
    this.pushHud();
  }

  private bindQa() {
    const enable = import.meta.env.DEV || new URLSearchParams(location.search).has("qa");
    if (!enable) return;
    window.__controlsTest = {
      getYaw: () => this.state.player?.x ?? 0,
      getSpeed: () => Math.abs(this.state.player?.vx ?? 0),
      getX: () => this.state.player?.x ?? 0,
      getFacing: () => this.state.player?.facing ?? 1,
      setKeys: (codes: string[]) => this.input.setKeys(codes),
      setSteer: (v: number) => {
        if (v > 0.2) this.input.setKeys(["KeyA"]);
        else if (v < -0.2) this.input.setKeys(["KeyD"]);
        else this.input.setKeys([]);
      },
    };
  }

  private aimWorld(p: Fighter) {
    if (this.input.touchAim.active) {
      return { x: p.x + this.input.touchAim.x * 480, y: p.y - 22 + this.input.touchAim.y * 280 };
    }
    if (this.input.padAim.active) {
      return { x: p.x + this.input.padAim.x * 480, y: p.y - 22 + this.input.padAim.y * 280 };
    }
    if (this.input.mouse.present && !this.setup.demo) {
      return this.renderer.screenToWorld(this.input.mouse.x, this.input.mouse.y);
    }
    const live = this.state.enemies.filter((e) => !e.dead);
    let best: Fighter | null = null;
    let bestD = Infinity;
    for (const e of live) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bestD) {
        best = e;
        bestD = d;
      }
    }
    if (best) return { x: best.x, y: best.y - 22 };
    return { x: p.x + p.facing * 260, y: p.y - 22 };
  }

  private handlePlayer(dt: number, scale: number) {
    const s = this.state;
    const p = s.player;
    if (!p) return;
    const move = this.setup.demo ? this.demoMove() : this.input.axisX();
    const aim = this.aimWorld(p);
    p.targetX = aim.x;
    p.targetY = aim.y;
    p.aimAngle = Math.atan2(aim.y - (p.y - 22), aim.x - p.x);
    p.facing = aim.x >= p.x ? 1 : -1;
    p.walkCycle += Math.abs(p.vx) * dt * 0.02;

    if (p.reloadTimer > 0) {
      p.reloadTimer = Math.max(0, p.reloadTimer - dt);
      if (p.reloadTimer === 0) this.weapons.finishReload(p);
    }

    this.jumpBuffer = this.input.consume("KeyW") || this.input.consume("ArrowUp") || this.input.consumePulse("jump")
      ? CONFIG.player.jumpBuffer
      : Math.max(0, this.jumpBuffer - dt);

    if (p.hitStagger <= 0) {
      p.vx += move * CONFIG.player.speed * dt * 7;
      const canJump = (p.grounded || p.coyote > 0) && this.jumpBuffer > 0;
      if (canJump) {
        p.vy = -CONFIG.player.jump;
        p.grounded = false;
        p.coyote = 0;
        this.jumpBuffer = 0;
      }
      const dodge =
        this.input.consume("Space") || this.input.consumePulse("dodge");
      if (dodge && p.stamina >= CONFIG.player.dodgeCost && p.dashCooldown <= 0) {
        p.stamina -= CONFIG.player.dodgeCost;
        const dir = Math.abs(move) > 0.2 ? Math.sign(move) : p.facing;
        p.vx = dir * CONFIG.player.dodgeSpeed;
        p.invulnerable = 0.28;
        p.dodgeTimer = 0.28;
        p.dashCooldown = 0.35;
        p.action = "dodge";
        this.audio.dodge();
        this.effects.burst(p.x, p.y, "#aab6c4", 7, 120);
      }
    }

    if (!this.setup.demo) {
      if (this.input.consume("Digit1")) this.weapons.switch(p, "pistol");
      if (this.input.consume("Digit2")) this.weapons.switch(p, "smg");
      if (this.input.consume("Digit3")) this.weapons.switch(p, "rifle");
      if (this.input.consume("Digit4")) this.weapons.switch(p, "shotgun");
      if (this.input.consume("Digit5")) this.weapons.switch(p, "sniper");
      if (this.input.consume("Digit6")) this.weapons.switch(p, "lmg");
      if (this.input.consumePulse("nextWep") || this.input.weaponNext) this.weapons.cycle(p, 1);
      if (this.input.consumePulse("prevWep") || this.input.weaponPrev) this.weapons.cycle(p, -1);
      if (this.input.consume("KeyR") || this.input.consumePulse("reload")) this.weapons.reload(p);
      if (this.input.consume("KeyF") || this.input.consumePulse("melee")) this.combat.melee(p, s.enemies, s);
      if (this.input.consume("KeyE")) this.combat.tryExecute(p, s.enemies, s);
      const firing = this.input.fireHeld();
      if (firing) this.weapons.shoot(p, p.targetX, p.targetY, s.projectiles, this.effects);
    } else if (this.demoFire()) {
      this.weapons.shoot(p, p.targetX, p.targetY, s.projectiles, this.effects);
    }
    if (p.magazine === 0 && p.reserve > 0 && p.reloadTimer === 0) this.weapons.reload(p);
    this.physics.update(p, dt * scale);
  }

  private demoMove() {
    const p = this.state.player;
    if (!p) return 0;
    const t = this.nearestEnemy();
    if (!t) return Math.sin(this.state.time * 0.6) * 0.4;
    const d = t.x - p.x;
    if (Math.abs(d) > 420) return Math.sign(d);
    if (Math.abs(d) < 280) return -Math.sign(d);
    return 0;
  }

  private demoFire() {
    return !!this.nearestEnemy();
  }

  private nearestEnemy() {
    const p = this.state.player;
    if (!p) return null;
    let best: Fighter | null = null;
    let d = Infinity;
    for (const e of this.state.enemies) {
      if (e.dead) continue;
      const n = Math.hypot(e.x - p.x, e.y - p.y);
      if (n < d) {
        best = e;
        d = n;
      }
    }
    return best;
  }

  private collectPickups(p: Fighter, dt: number) {
    const remain = [];
    for (const u of this.state.pickups) {
      u.life -= dt;
      if (Math.hypot(u.x - p.x, u.y - p.y) < 42) {
        if (u.kind === "ammo") {
          p.reserve += Math.round(p.weapon.magazine * 1.5);
          this.effects.float(p.x, p.y - 80, "+AMMO", CONFIG.colors.accent);
        } else if (u.kind === "armor") {
          p.armor = Math.min(p.maxArmor, p.armor + 28);
          this.effects.float(p.x, p.y - 80, "+ARMOR", CONFIG.colors.cyan);
        } else {
          p.hp = Math.min(p.maxHp, p.hp + 24);
          this.effects.float(p.x, p.y - 80, "+HP", CONFIG.colors.good);
        }
        this.audio.pickup();
        continue;
      }
      if (u.life > 0) remain.push(u);
    }
    this.state.pickups = remain;
  }

  private dropSupport() {
    const p = this.state.player;
    if (!p) return;
    const kinds: Array<"ammo" | "armor" | "hp"> = ["ammo", "armor", "hp"];
    this.state.pickups.push({
      x: p.x + (Math.random() > 0.5 ? 70 : -70),
      y: CONFIG.arena.groundY - 18,
      kind: kinds[Math.floor(Math.random() * kinds.length)]!,
      life: 14,
    });
  }

  update(dt: number) {
    const s = this.state;
    const p = s.player;
    if (!p) return;
    s.time += dt;
    p.updateTimers(dt);
    s.trauma = Math.max(0, s.trauma - dt * CONFIG.camera.shakeDecay);

    if (s.hitStop > 0) {
      s.hitStop = Math.max(0, s.hitStop - dt);
      this.effects.update(dt * 0.35);
      return;
    }

    const bulletTime = !this.setup.demo && this.input.bulletTimeHeld() && p.bulletTime > 0;
    const scale = bulletTime ? 0.34 : 1;
    p.bulletTime = bulletTime
      ? Math.max(0, p.bulletTime - CONFIG.player.bulletTimeDrain * dt)
      : Math.min(CONFIG.player.bulletTimeMax, p.bulletTime + CONFIG.player.bulletTimeRecharge * dt);

    this.handlePlayer(dt, scale);

    for (const e of s.enemies) {
      e.updateTimers(dt);
      if (e.dead) {
        e.deathTimer = Math.max(0, e.deathTimer - dt * scale);
        e.vx *= 0.92;
        this.physics.update(e, dt * scale);
        continue;
      }
      if (p && !p.dead) this.ai.update(e, p, s, dt * scale);
      this.physics.update(e, dt * scale);
    }

    for (const b of s.projectiles) {
      b.update(dt, scale);
      const targets = b.owner === "player" ? s.enemies : p ? [p] : [];
      for (const t of targets) {
        if (t.dead || b.dead) continue;
        if (Math.hypot(b.x - t.x, b.y - t.y) < t.radius + b.radius) this.combat.handleProjectileHit(s, b, t);
      }
      if (b.x < -40 || b.x > CONFIG.arena.width + 40 || b.y < -100 || b.y > CONFIG.arena.height + 100) b.dead = true;
    }
    s.projectiles = s.projectiles.filter((x) => !x.dead);
    s.enemies = s.enemies.filter((e) => !e.dead || e.deathTimer > 0);

    if (p.dead && p.deathTimer > 0) p.deathTimer = Math.max(0, p.deathTimer - dt);
    if (s.comboTimer > 0) {
      s.comboTimer -= dt;
      if (s.comboTimer <= 0) s.combo = 0;
    }

    this.collectPickups(p, dt);

    if (s.op === "extract" && !p.dead) {
      this.spawn.spawnExtract(s, dt);
      const zone = p.x >= CONFIG.arena.width - 260;
      s.extractHold = zone ? s.extractHold + dt : 0;
      s.message = zone ? "Hold the gate" : "Push east to the gate";
      if (s.extractHold >= 3) {
        this.finish(true);
        return;
      }
    } else if (!s.enemies.filter((e) => !e.dead).length && !p.dead && s.op !== "extract") {
      s.waveTimer += dt;
      if (s.waveTimer >= CONFIG.waves.restTime) {
        if (s.op === "sweep" && s.wave >= CONFIG.waves.maxWaves) {
          this.finish(true);
          return;
        }
        this.dropSupport();
        s.wave++;
        s.waveTimer = 0;
        s.message = `Wave ${String(s.wave).padStart(2, "0")} inbound`;
        this.spawn.spawnWave(s);
      }
    }

    if (p.dead && p.deathTimer <= 0) {
      if (this.setup.demo) {
        this.start();
        return;
      }
      this.finish(false);
      return;
    }

    this.effects.update(dt);
    for (const d of s.damageIndicators) d.life -= dt;
    s.damageIndicators = s.damageIndicators.filter((d) => d.life > 0);
  }

  private finish(win: boolean) {
    if (this.setup.demo) {
      this.start();
      return;
    }
    if (this.state.status === "won" || this.state.status === "lost") return;
    this.state.end(win ? "won" : "lost");
    const s = this.state;
    this.onEnd?.({
      win,
      score: s.score,
      wave: s.wave,
      kills: s.kills,
      combo: s.bestCombo,
      op: s.op,
      difficulty: s.difficulty,
    });
    this.pushHud();
  }

  private loop(now: number) {
    if (this.destroyed) return;
    const dt = Math.min(0.035, Math.max(0.001, (now - this.last) / 1000 || 0.016));
    this.last = now;
    this.input.sampleGamepad();

    if (!this.setup.demo) {
      if (this.input.consume("KeyP") || this.input.consume("Escape") || this.input.padPause) {
        if (this.state.status === "playing") this.pause();
        else if (this.state.status === "paused") this.resume();
      }
    }

    if (this.state.status === "playing" || this.state.status === "demo") this.update(dt);
    const coarse = this.input.touchAim.active || this.input.touchFire || this.input.touchMove.x !== 0;
    this.renderer.draw(this.state, this.input, dt, {
      shake: this.shakeEnabled,
      reticle: !coarse && !this.setup.demo,
    });
    this.pushHud();
    this.input.endFrame();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  private pushHud() {
    const s = this.state;
    const p = s.player;
    if (!p) return;
    const w = p.weapon;
    useHud.setState({
      status: s.status,
      hp: p.hp,
      maxHp: p.maxHp,
      armor: p.armor,
      maxArmor: p.maxArmor,
      stamina: p.stamina,
      maxStamina: CONFIG.player.staminaMax,
      bulletTime: p.bulletTime,
      magazine: Number.isFinite(p.magazine) ? p.magazine : 0,
      reserve: Number.isFinite(p.reserve) ? p.reserve : 0,
      weaponName: w.name,
      weaponMeta: `${w.short} · ${Math.round((1 / w.fireRate) * 60)} RPM`,
      weaponId: p.weaponId,
      wave: s.wave,
      totalWaves: s.op === "sweep" ? CONFIG.waves.maxWaves : null,
      kills: s.kills,
      score: s.score,
      combo: s.combo,
      message: s.message,
      reloading: p.reloadTimer > 0,
      hostiles: s.enemies.filter((e) => !e.dead).length,
      extractProgress: s.op === "extract" ? Math.min(1, s.extractHold / 3) : 0,
      timeScale: this.input.bulletTimeHeld() && p.bulletTime > 0 ? 0.34 : 1,
    });
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getFacing: () => number;
      setKeys: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}

export { WEAPON_ORDER } from "./config";
