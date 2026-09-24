import { CONFIG, type Difficulty, type OpId, type WeaponId } from "./config";

const KEY = "steene-stick-ops-v2";

export type OpRecord = {
  score: number;
  wave: number;
  kills: number;
  won: boolean;
};

export type SaveData = {
  v: 2;
  settings: { audio: boolean; shake: boolean; touch: "auto" | "on" | "off" };
  last: { op: OpId; difficulty: Difficulty; weapon: WeaponId };
  records: Record<OpId, OpRecord | null>;
  stats: { deployments: number; totalKills: number };
};

const empty = (): SaveData => ({
  v: 2,
  settings: { audio: true, shake: true, touch: "auto" },
  last: { op: "sweep", difficulty: "operative", weapon: "rifle" },
  records: { sweep: null, hold: null, extract: null },
  stats: { deployments: 0, totalKills: 0 },
});

export function loadSave(): SaveData {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.v !== 2) return empty();
    return { ...empty(), ...parsed, settings: { ...empty().settings, ...parsed.settings } };
  } catch {
    return empty();
  }
}

export function writeSave(data: SaveData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function recordDeployment(partial: {
  op: OpId;
  difficulty: Difficulty;
  weapon: WeaponId;
  score: number;
  wave: number;
  kills: number;
  won: boolean;
}) {
  const save = loadSave();
  save.last = { op: partial.op, difficulty: partial.difficulty, weapon: partial.weapon };
  save.stats.deployments += 1;
  save.stats.totalKills += partial.kills;
  const prev = save.records[partial.op];
  if (!prev || partial.score > prev.score || (partial.won && !prev.won)) {
    save.records[partial.op] = {
      score: partial.score,
      wave: partial.wave,
      kills: partial.kills,
      won: partial.won,
    };
  }
  writeSave(save);
  return save;
}

export function saveSettings(settings: SaveData["settings"]) {
  const save = loadSave();
  save.settings = settings;
  writeSave(save);
}

export function saveLast(last: SaveData["last"]) {
  const save = loadSave();
  save.last = last;
  writeSave(save);
}

export function rankFor(save: SaveData) {
  const bestWave = save.records.sweep?.wave ?? 0;
  const wins = Object.values(save.records).filter((r) => r?.won).length;
  if (wins >= 3 || (save.records.sweep?.won && bestWave >= CONFIG.waves.maxWaves)) return "Warden Killer";
  if (save.records.sweep?.won) return "Ghost";
  if (bestWave >= 8 || save.stats.totalKills >= 120) return "Veteran";
  if (save.stats.deployments >= 1) return "Operative";
  return "Recruit";
}
