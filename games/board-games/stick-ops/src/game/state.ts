import type { Difficulty, OpId } from "./config";
import type { Fighter, Projectile } from "./entities";
import type { FloatText, GameStatus, Pickup } from "./types";
import type { Particle } from "./types";

export class GameState {
  status: GameStatus = "ready";
  time = 0;
  score = 0;
  wave = 1;
  kills = 0;
  combo = 0;
  bestCombo = 0;
  comboTimer = 0;
  enemies: Fighter[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  tracers: { x1: number; y1: number; x2: number; y2: number; color: string; life: number; maxLife: number }[] = [];
  decals: { x: number; y: number; life: number; size: number }[] = [];
  pickups: Pickup[] = [];
  floats: FloatText[] = [];
  damageIndicators: { angle: number; life: number; maxLife: number }[] = [];
  waveTimer = 0;
  hitStop = 0;
  trauma = 0;
  player: Fighter | null = null;
  message = "Clear the wave";
  op: OpId = "sweep";
  difficulty: Difficulty = "operative";
  extractHold = 0;
  spawnAcc = 0;
  totalWaves: number | null = 12;

  reset() {
    this.status = "ready";
    this.time = 0;
    this.score = 0;
    this.wave = 1;
    this.kills = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTimer = 0;
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.tracers = [];
    this.decals = [];
    this.pickups = [];
    this.floats = [];
    this.damageIndicators = [];
    this.waveTimer = 0;
    this.hitStop = 0;
    this.trauma = 0;
    this.player = null;
    this.message = "Clear the wave";
    this.extractHold = 0;
    this.spawnAcc = 0;
  }

  start(player: Fighter, op: OpId, difficulty: Difficulty, demo: boolean) {
    this.reset();
    this.status = demo ? "demo" : "playing";
    this.player = player;
    this.op = op;
    this.difficulty = difficulty;
    this.totalWaves = op === "sweep" ? 12 : op === "hold" ? null : null;
    this.message = op === "extract" ? "Push east to the gate" : "Clear the wave";
  }

  pause() {
    if (this.status === "playing") this.status = "paused";
  }
  resume() {
    if (this.status === "paused") this.status = "playing";
  }
  end(result: "won" | "lost") {
    this.status = result;
  }
}
