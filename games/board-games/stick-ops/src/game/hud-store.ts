import { create } from "zustand";
import type { GameStatus } from "./types";

export type HudSnapshot = {
  status: GameStatus;
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  stamina: number;
  maxStamina: number;
  bulletTime: number;
  magazine: number;
  reserve: number;
  weaponName: string;
  weaponMeta: string;
  weaponId: string;
  wave: number;
  totalWaves: number | null;
  kills: number;
  score: number;
  combo: number;
  message: string;
  reloading: boolean;
  hostiles: number;
  extractProgress: number;
  timeScale: number;
};

const defaults: HudSnapshot = {
  status: "ready",
  hp: 100,
  maxHp: 100,
  armor: 70,
  maxArmor: 70,
  stamina: 100,
  maxStamina: 100,
  bulletTime: 100,
  magazine: 30,
  reserve: 150,
  weaponName: "AR-47",
  weaponMeta: "AR · 460 RPM",
  weaponId: "rifle",
  wave: 1,
  totalWaves: 12,
  kills: 0,
  score: 0,
  combo: 0,
  message: "Clear the wave",
  reloading: false,
  hostiles: 0,
  extractProgress: 0,
  timeScale: 1,
};

export const useHud = create<HudSnapshot>(() => ({ ...defaults }));

export function resetHud() {
  useHud.setState({ ...defaults });
}
