import type { Difficulty, OpId, WeaponId } from "./config";

export type GameStatus = "ready" | "playing" | "paused" | "won" | "lost" | "demo";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
  kind: "square" | "smoke" | "casing" | "spark" | "arc";
  angle?: number;
};

export type Pickup = {
  x: number;
  y: number;
  kind: "ammo" | "armor" | "hp";
  life: number;
};

export type FloatText = {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
};

export type MissionSetup = {
  op: OpId;
  difficulty: Difficulty;
  weapon: WeaponId;
  demo?: boolean;
};

export type EndReport = {
  win: boolean;
  score: number;
  wave: number;
  kills: number;
  combo: number;
  op: OpId;
  difficulty: Difficulty;
};
