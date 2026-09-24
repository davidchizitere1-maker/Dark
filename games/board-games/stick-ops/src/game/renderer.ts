import { CONFIG } from "./config";
import type { Fighter } from "./entities";
import type { Input } from "./input";
import type { GameState } from "./state";

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera = { x: 400, y: 900, zoom: 1 };
  dpr = 1;
  private ro: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
  }

  destroy() {
    this.ro.disconnect();
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width * dpr));
    const h = Math.max(1, Math.floor(r.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
  }

  viewport() {
    return { w: this.canvas.width / this.dpr, h: this.canvas.height / this.dpr };
  }

  screenToWorld(sx: number, sy: number) {
    const { w, h } = this.viewport();
    const z = this.camera.zoom;
    return { x: (sx - w / 2) / z + this.camera.x, y: (sy - h / 2) / z + this.camera.y };
  }

  follow(player: Fighter | null, dt: number, shake: boolean) {
    const { w, h } = this.viewport();
    const z = this.camera.zoom;
    const a = CONFIG.arena;
    const vw = w / z;
    const vh = h / z;
    const look = player ? CONFIG.camera.lookAhead * (player.facing || 1) : 0;
    const targetX = player
      ? Math.max(vw * 0.5, Math.min(a.width - vw * 0.5, player.x + look))
      : a.width * 0.5;
    const targetY = player
      ? Math.max(vh * 0.5, Math.min(a.height - vh * 0.5, player.y - vh * 0.04))
      : a.height * 0.55;
    const k = CONFIG.camera.smoothing;
    const t = 1 - Math.exp(-k * dt);
    this.camera.x += (targetX - this.camera.x) * t;
    this.camera.y += (targetY - this.camera.y) * t;
    void shake;
  }

  draw(s: GameState, input: Input | null, dt: number, opts: { shake: boolean; reticle: boolean }) {
    const c = this.ctx;
    const { w, h } = this.viewport();
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, w, h);

    const close = s.player ? s.enemies.some((e) => !e.dead && Math.hypot(e.x - s.player!.x, e.y - s.player!.y) < 190) : false;
    const targetZoom = s.hitStop > 0.02 ? 1.08 : close ? 1.03 : 1;
    this.camera.zoom += (targetZoom - this.camera.zoom) * (1 - Math.exp(-8 * dt));
    this.follow(s.player, dt, opts.shake);

    const mag = opts.shake ? s.trauma * s.trauma : 0;
    const t = s.time;
    const cam = {
      x: this.camera.x - mag * 38 * Math.sin(t * 47.2),
      y: this.camera.y - mag * 24 * Math.sin(t * 39.1 + 1.3),
    };

    this.drawBackground(c, w, h, cam);
    this.drawWorld(c, cam, s);
    c.save();
    c.translate(w / 2, h / 2);
    c.scale(this.camera.zoom, this.camera.zoom);
    c.translate(-cam.x, -cam.y);
    for (const b of s.projectiles) {
      c.fillStyle = b.color;
      c.shadowBlur = 12;
      c.shadowColor = b.color;
      c.beginPath();
      c.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.globalAlpha = 0.28;
      c.strokeStyle = b.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(b.x, b.y);
      c.lineTo(b.x - b.vx * 0.012, b.y - b.vy * 0.012);
      c.stroke();
      c.globalAlpha = 1;
    }
    const all = [...s.enemies].sort((a, b) => a.y - b.y);
    for (const e of all) this.drawFighter(c, e);
    if (s.player) this.drawFighter(c, s.player, true);
    for (const p of s.pickups) this.drawPickup(c, p);
    for (const f of s.floats) {
      c.globalAlpha = Math.max(0, f.life / f.maxLife);
      c.fillStyle = f.color;
      c.font = "700 13px Barlow Condensed, sans-serif";
      c.textAlign = "center";
      c.fillText(f.text, f.x, f.y);
      c.globalAlpha = 1;
    }
    c.restore();
    this.drawEffects(c, s, cam);
    this.drawDamage(c, s);
    if (opts.reticle && s.player && input?.mouse.present) {
      const aim = this.screenToWorld(input.mouse.x, input.mouse.y);
      this.drawReticle(c, aim, cam);
    }
    if (s.hitStop > 0) {
      c.fillStyle = "rgba(255,255,255,0.03)";
      c.fillRect(0, 0, w, h);
    }
  }

  private gradient(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (const [p, col] of stops) g.addColorStop(p, col);
    return g;
  }

  private drawBackground(c: CanvasRenderingContext2D, w: number, h: number, cam: { x: number; y: number }) {
    c.fillStyle = this.gradient(c, 0, 0, 0, h, [
      [0, "#06080c"],
      [0.45, "#0c121a"],
      [1, "#141b24"],
    ]);
    c.fillRect(0, 0, w, h);
    c.save();
    c.translate(-cam.x * 0.12, -cam.y * 0.04);
    for (let i = -2; i < 28; i++) {
      const x = i * 170;
      const hh = 160 + ((i * 47) % 120);
      c.fillStyle = i % 3 === 0 ? "#111925" : "#0d141e";
      c.fillRect(x, 210 - hh, 120, hh);
      c.fillStyle = "rgba(150,185,215,0.08)";
      for (let wy = 235 - hh; wy < 210; wy += 32) {
        for (let wx = x + 18; wx < x + 105; wx += 28) {
          if ((wx + wy) % 3 !== 0) c.fillRect(wx, wy, 8, 12);
        }
      }
    }
    c.restore();
    c.save();
    c.translate(-cam.x * 0.28, -cam.y * 0.08);
    c.strokeStyle = "rgba(128,163,197,0.12)";
    c.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const x = 180 + i * 510;
      c.beginPath();
      c.moveTo(x, 560);
      c.lineTo(x, 250);
      c.lineTo(x + 250, 250);
      c.moveTo(x + 30, 320);
      c.lineTo(x + 220, 500);
      c.stroke();
    }
    c.restore();
    c.save();
    c.translate(-cam.x * 0.48, -cam.y * 0.15);
    c.fillStyle = "#121923";
    for (let i = 0; i < 16; i++) {
      const x = i * 240;
      c.fillRect(x, 500 - (i % 4) * 35, 140, 610);
    }
    c.fillStyle = "rgba(214,226,239,0.08)";
    for (let i = 0; i < 52; i++) {
      const x = (i * 233) % 3900;
      const y = 540 - ((i * 67) % 180);
      c.fillRect(x, y, 10, 26);
    }
    c.restore();
  }

  private drawWorld(c: CanvasRenderingContext2D, cam: { x: number; y: number }, s: GameState) {
    const a = CONFIG.arena;
    const { w, h } = this.viewport();
    c.save();
    c.translate(w / 2, h / 2);
    c.scale(this.camera.zoom, this.camera.zoom);
    c.translate(-cam.x, -cam.y);
    const groundY = a.groundY;
    c.fillStyle = "#10161f";
    c.fillRect(0, groundY - 210, a.width, 210);
    c.fillStyle = "#1a212b";
    c.fillRect(0, groundY, a.width, a.height - groundY);
    c.strokeStyle = "rgba(208,218,230,0.07)";
    c.lineWidth = 2;
    for (let x = 0; x < a.width; x += 150) {
      c.beginPath();
      c.moveTo(x, groundY);
      c.lineTo(x, groundY + 390);
      c.stroke();
    }
    c.fillStyle = "rgba(198,232,107,0.16)";
    for (let x = 80; x < a.width; x += 520) c.fillRect(x, groundY + 58, 260, 4);
    for (let x = 0; x < a.width; x += 340) {
      c.fillStyle = x % 680 === 0 ? "#242d38" : "#202832";
      c.fillRect(x, groundY - 150, 22, 150);
      c.fillStyle = "#2e3844";
      c.fillRect(x + 20, groundY - 8, 300, 8);
    }
    for (let x = 220; x < a.width; x += 720) {
      c.strokeStyle = "#3a444f";
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(x, groundY);
      c.lineTo(x, groundY - 270);
      c.lineTo(x + 65, groundY - 270);
      c.stroke();
      c.fillStyle = "rgba(198,232,107,0.18)";
      c.beginPath();
      c.arc(x + 65, groundY - 264, 18, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#d8d5a4";
      c.fillRect(x + 52, groundY - 273, 26, 8);
    }
    this.drawCars(c, groundY);
    this.drawCrates(c, groundY);
    for (let x = 360; x < a.width; x += 940) {
      c.fillStyle = "#11161d";
      c.fillRect(x, groundY - 80, 95, 80);
      c.fillStyle = "#c8a847";
      c.globalAlpha = 0.35;
      c.fillRect(x + 8, groundY - 70, 78, 10);
      c.fillRect(x + 8, groundY - 28, 78, 10);
      c.globalAlpha = 1;
    }
    if (s.op === "extract") {
      const zx = a.width - 280;
      c.fillStyle = "rgba(198,232,107,0.08)";
      c.fillRect(zx, groundY - 220, 240, 220);
      c.strokeStyle = "rgba(198,232,107,0.55)";
      c.lineWidth = 3;
      c.strokeRect(zx + 8, groundY - 212, 224, 204);
      c.fillStyle = "#c6e86b";
      c.font = "700 18px Barlow Condensed, sans-serif";
      c.textAlign = "center";
      c.fillText("EXTRACTION", zx + 120, groundY - 170);
    }
    for (const d of s.decals) {
      c.globalAlpha = Math.min(1, d.life / 2);
      c.fillStyle = CONFIG.colors.blood;
      c.beginPath();
      c.arc(d.x, d.y, d.size * (1.2 - d.life / 15), 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  private drawCars(c: CanvasRenderingContext2D, groundY: number) {
    for (let i = 0; i < 6; i++) {
      const x = 460 + i * 570;
      const w = 190;
      const h = 54;
      c.fillStyle = "#121820";
      c.beginPath();
      c.roundRect(x, groundY - h, w, h, 10);
      c.fill();
      c.fillStyle = "#0a0d12";
      c.beginPath();
      c.moveTo(x + 42, groundY - h);
      c.lineTo(x + 77, groundY - h - 32);
      c.lineTo(x + 142, groundY - h - 32);
      c.lineTo(x + 160, groundY - h);
      c.closePath();
      c.fill();
      c.fillStyle = "#05070b";
      for (const wx of [x + 38, x + w - 38]) {
        c.beginPath();
        c.arc(wx, groundY, 18, 0, Math.PI * 2);
        c.fill();
      }
    }
  }

  private drawCrates(c: CanvasRenderingContext2D, groundY: number) {
    for (let i = 0; i < 15; i++) {
      const x = 110 + (i * 263) % 3000;
      const y = groundY - 32 - (i % 3) * 34;
      c.fillStyle = i % 2 ? "#5d4b3c" : "#4d4d50";
      c.fillRect(x, y, 58, 32);
      c.strokeStyle = "rgba(240,214,166,0.23)";
      c.lineWidth = 2;
      c.strokeRect(x + 3, y + 3, 52, 26);
    }
  }

  private drawPickup(c: CanvasRenderingContext2D, p: GameState["pickups"][number]) {
    const col = p.kind === "hp" ? CONFIG.colors.danger : p.kind === "armor" ? CONFIG.colors.cyan : CONFIG.colors.accent;
    c.fillStyle = "#0e1218";
    c.fillRect(p.x - 14, p.y - 14, 28, 28);
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.strokeRect(p.x - 14, p.y - 14, 28, 28);
    c.fillStyle = col;
    c.font = "700 11px Barlow Condensed, sans-serif";
    c.textAlign = "center";
    c.fillText(p.kind === "hp" ? "HP" : p.kind === "armor" ? "AR" : "AM", p.x, p.y + 4);
  }

  private drawFighter(c: CanvasRenderingContext2D, f: Fighter, isPlayer = false) {
    const scale = f.enemy ? CONFIG.enemyClasses[f.type].scale : 1;
    const walk = Math.sin(f.walkCycle * 1.25);
    const speed = Math.min(1, Math.abs(f.vx) / 320);
    const flip = f.facing < 0 ? -1 : 1;
    const worldAim = f.aimAngle || (f.facing > 0 ? 0 : Math.PI);
    const localAim = f.facing < 0 ? Math.PI - worldAim : worldAim;
    c.save();
    c.translate(f.x, f.y);
    c.scale(flip * scale, scale);
    c.lineCap = "round";
    c.lineJoin = "round";
    const hurt = f.flash > 0;
    const body = f.color;
    if (f.dead) {
      c.rotate(f.deathAngle * (1 - f.deathTimer));
      c.globalAlpha = Math.max(0.1, f.deathTimer);
    }
    c.save();
    c.scale(1 / scale, 1 / scale);
    c.globalAlpha = 0.22;
    c.fillStyle = "#000";
    c.beginPath();
    c.ellipse(0, 6, 30 + speed * 8, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    const stride = walk * 9 * speed;
    c.strokeStyle = body;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(-7, 29);
    c.lineTo(-15 + stride, 61);
    c.lineTo(-23 + stride, 84);
    c.stroke();
    c.beginPath();
    c.moveTo(7, 29);
    c.lineTo(15 - stride, 61);
    c.lineTo(25 - stride, 84);
    c.stroke();
    c.fillStyle = "#0b0e12";
    c.beginPath();
    c.roundRect(-31 + stride, 80, 17, 7, 3);
    c.fill();
    c.beginPath();
    c.roundRect(17 - stride, 80, 17, 7, 3);
    c.fill();
    c.fillStyle = hurt ? "#fff" : body;
    c.beginPath();
    c.moveTo(-17, -17);
    c.lineTo(17, -17);
    c.lineTo(19, 30);
    c.lineTo(-19, 30);
    c.closePath();
    c.fill();
    c.fillStyle = isPlayer ? "#10160c" : "#0c1118";
    c.fillRect(-12, -8, 24, 27);
    c.strokeStyle = "rgba(255,255,255,0.18)";
    c.lineWidth = 2;
    c.strokeRect(-12, -8, 24, 27);
    c.fillStyle = "#141a22";
    c.beginPath();
    c.arc(0, -38, 17, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = hurt ? "#fff" : body;
    c.lineWidth = 4;
    c.stroke();
    c.fillStyle = body;
    c.beginPath();
    c.arc(1, -42, 11, Math.PI, Math.PI * 2);
    c.fill();
    c.fillStyle = "#070a0e";
    c.beginPath();
    c.roundRect(-12, -39, 25, 7, 3);
    c.fill();
    const gunLen = f.enemy ? (f.type === "heavy" ? 48 : 38) : 46;
    const gunBaseX = 19;
    const gunBaseY = -1;
    const elbowY = 10 + walk * 2;
    const armColor = hurt ? "#fff" : body;
    c.strokeStyle = armColor;
    c.lineWidth = f.type === "heavy" ? 10 : 7;
    c.beginPath();
    c.moveTo(10, -5);
    c.lineTo(23, elbowY);
    c.lineTo(gunBaseX + Math.cos(localAim) * 16, gunBaseY + Math.sin(localAim) * 16);
    c.stroke();
    c.beginPath();
    c.moveTo(-9, -2);
    c.lineTo(-20, 12 + walk * 2);
    c.lineTo(gunBaseX + Math.cos(localAim) * 8, gunBaseY + Math.sin(localAim) * 8);
    c.stroke();
    c.fillStyle = "#d3d8dd";
    c.beginPath();
    c.arc(gunBaseX + Math.cos(localAim) * 14, gunBaseY + Math.sin(localAim) * 14, 4, 0, Math.PI * 2);
    c.fill();
    const recoil = (f.recoil || 0) * (f.action === "shoot" ? 1 : 0);
    c.save();
    c.translate(gunBaseX - recoil * 3, gunBaseY);
    c.rotate(localAim);
    c.fillStyle = "#090c11";
    c.fillRect(0, -4, gunLen, 8);
    c.fillStyle = "#303b47";
    c.fillRect(8, -7, Math.max(10, gunLen - 22), 4);
    c.fillStyle = "#141a21";
    c.fillRect(4, 4, 12, 12);
    c.fillRect(gunLen - 5, -6, 12, 4);
    c.restore();
    if (f.type === "boss") {
      c.strokeStyle = "rgba(255,62,86,0.45)";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, -18, 36, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
    if (f.enemy && !f.dead) {
      const cls = CONFIG.enemyClasses[f.type];
      const bw = f.type === "boss" ? 128 : 50;
      c.fillStyle = "rgba(0,0,0,0.62)";
      c.fillRect(f.x - bw / 2, f.y - 102 - (scale - 1) * 20, bw, 7);
      c.fillStyle = cls.color;
      c.fillRect(f.x - bw / 2, f.y - 102 - (scale - 1) * 20, bw * Math.max(0, f.hp / f.maxHp), 7);
      if (f.armor > 0) {
        c.fillStyle = "#6b809b";
        c.fillRect(f.x - bw / 2, f.y - 111 - (scale - 1) * 20, bw * Math.max(0, f.armor / f.maxArmor), 4);
      }
      if (f.type === "boss") {
        c.fillStyle = "#f3f5f8";
        c.font = "700 9px Barlow, sans-serif";
        c.textAlign = "center";
        c.fillText("WARDEN", f.x, f.y - 116);
      }
    }
  }

  private drawEffects(c: CanvasRenderingContext2D, s: GameState, cam: { x: number; y: number }) {
    const { w, h } = this.viewport();
    c.save();
    c.translate(w / 2, h / 2);
    c.scale(this.camera.zoom, this.camera.zoom);
    c.translate(-cam.x, -cam.y);
    for (const t of s.tracers) {
      c.globalAlpha = t.life / t.maxLife;
      c.strokeStyle = t.color;
      c.lineWidth = 2 + c.globalAlpha * 2;
      c.beginPath();
      c.moveTo(t.x1, t.y1);
      c.lineTo(t.x2, t.y2);
      c.stroke();
    }
    c.globalAlpha = 1;
    for (const p of s.particles) {
      const a = Math.max(0, p.life / p.maxLife);
      c.globalAlpha = a;
      if (p.kind === "smoke") {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size * (1 + (1 - a) * 0.9), 0, Math.PI * 2);
        c.fill();
      } else if (p.kind === "casing") {
        c.fillStyle = p.color;
        c.save();
        c.translate(p.x, p.y);
        c.rotate((1 - a) * 4);
        c.fillRect(-p.size * 0.5, -p.size * 0.15, p.size, p.size * 0.3);
        c.restore();
      } else if (p.kind === "arc") {
        c.strokeStyle = p.color;
        c.lineWidth = 4 * a;
        c.beginPath();
        c.arc(p.x, p.y, p.size, Math.PI * -0.55 + (p.angle ?? 0), Math.PI * 0.55 + (p.angle ?? 0));
        c.stroke();
      } else {
        c.fillStyle = p.color;
        c.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
      }
    }
    c.globalAlpha = 1;
    c.restore();
  }

  private drawDamage(c: CanvasRenderingContext2D, s: GameState) {
    const { w, h } = this.viewport();
    if (!s.damageIndicators.length) return;
    c.save();
    c.translate(w / 2, h / 2);
    for (const d of s.damageIndicators) {
      c.globalAlpha = 0.35 * (d.life / d.maxLife);
      c.strokeStyle = CONFIG.colors.danger;
      c.lineWidth = 18;
      c.beginPath();
      c.arc(0, 0, Math.min(w, h) * 0.42, d.angle - 0.18, d.angle + 0.18);
      c.stroke();
    }
    c.restore();
  }

  private drawReticle(c: CanvasRenderingContext2D, world: { x: number; y: number }, cam: { x: number; y: number }) {
    const { w, h } = this.viewport();
    const x = (world.x - cam.x) * this.camera.zoom + w / 2;
    const y = (world.y - cam.y) * this.camera.zoom + h / 2;
    c.save();
    c.translate(x, y);
    c.strokeStyle = CONFIG.colors.accent;
    c.globalAlpha = 0.88;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, 0, 8, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(-15, 0);
    c.lineTo(-6, 0);
    c.moveTo(15, 0);
    c.lineTo(6, 0);
    c.moveTo(0, -15);
    c.lineTo(0, -6);
    c.moveTo(0, 15);
    c.lineTo(0, 6);
    c.stroke();
    c.fillStyle = CONFIG.colors.accent;
    c.fillRect(-1, -1, 2, 2);
    c.restore();
  }
}
