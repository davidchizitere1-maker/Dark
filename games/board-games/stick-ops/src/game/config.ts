export const CONFIG = {
  arena: { width: 3600, height: 1500, groundY: 1110, leftMargin: 48, rightMargin: 48 },
  player: {
    maxHp: 100,
    maxArmor: 70,
    speed: 380,
    jump: 720,
    radius: 24,
    staminaMax: 100,
    staminaRegen: 30,
    dodgeCost: 26,
    dodgeSpeed: 980,
    bulletTimeMax: 100,
    bulletTimeDrain: 28,
    bulletTimeRecharge: 16,
    coyote: 0.1,
    jumpBuffer: 0.12,
  },
  melee: { damage: 48, range: 82, cooldown: 0.4 },
  weapons: {
    pistol: {
      id: "pistol",
      name: "Sidearm",
      short: "PTL",
      damage: 27,
      fireRate: 0.24,
      magazine: 12,
      reserve: 72,
      reload: 1.0,
      bulletSpeed: 1450,
      spread: 0.018,
      pellets: 1,
      recoil: 150,
      color: "#c6e86b",
      pierce: 0,
      flavor: "Compact 9mm for room clearing and last-ditch work.",
    },
    smg: {
      id: "smg",
      name: "Vector SMG",
      short: "SMG",
      damage: 14,
      fireRate: 0.085,
      magazine: 30,
      reserve: 150,
      reload: 1.32,
      bulletSpeed: 1650,
      spread: 0.075,
      pellets: 1,
      recoil: 95,
      color: "#8bb8c9",
      pierce: 0,
      flavor: "High cyclic rate. Holds angles and shreds runners.",
    },
    rifle: {
      id: "rifle",
      name: "AR-47",
      short: "AR",
      damage: 23,
      fireRate: 0.13,
      magazine: 30,
      reserve: 150,
      reload: 1.5,
      bulletSpeed: 1850,
      spread: 0.042,
      pellets: 1,
      recoil: 130,
      color: "#d7c89a",
      pierce: 0,
      flavor: "Standard operator rifle. Balanced for every corridor.",
    },
    shotgun: {
      id: "shotgun",
      name: "Breacher",
      short: "SG",
      damage: 15,
      fireRate: 0.7,
      magazine: 6,
      reserve: 42,
      reload: 1.75,
      bulletSpeed: 1200,
      spread: 0.25,
      pellets: 8,
      recoil: 420,
      color: "#e0a07a",
      pierce: 0,
      flavor: "Door-kicker. Devastating inside ten meters.",
    },
    sniper: {
      id: "sniper",
      name: "Longshot",
      short: "SR",
      damage: 110,
      fireRate: 1.02,
      magazine: 5,
      reserve: 30,
      reload: 1.85,
      bulletSpeed: 2550,
      spread: 0.004,
      pellets: 1,
      recoil: 640,
      color: "#e8e4f2",
      pierce: 3,
      flavor: "Pierces cover and heavies. Punishes poor positioning.",
    },
    lmg: {
      id: "lmg",
      name: "Widow LMG",
      short: "LMG",
      damage: 19,
      fireRate: 0.07,
      magazine: 75,
      reserve: 225,
      reload: 2.35,
      bulletSpeed: 1900,
      spread: 0.09,
      pellets: 1,
      recoil: 105,
      color: "#e25c5c",
      pierce: 1,
      flavor: "Suppressive weight. Hold the lane, empty the belt.",
    },
  },
  enemyClasses: {
    grunt: { name: "Grunt", hp: 60, speed: 168, shootRange: 570, shootCooldown: 1.25, damage: 9, color: "#e25c5c", scale: 1 },
    runner: { name: "Runner", hp: 45, speed: 310, shootRange: 0, shootCooldown: 0, damage: 16, color: "#e08a5a", scale: 0.96 },
    heavy: { name: "Heavy", hp: 240, speed: 90, shootRange: 620, shootCooldown: 1.45, damage: 15, color: "#9aa3ae", scale: 1.18, armor: 50 },
    assault: { name: "Assault", hp: 84, speed: 214, shootRange: 690, shootCooldown: 0.76, damage: 12, color: "#c98ad4", scale: 1.02 },
    sniper: { name: "Sniper", hp: 70, speed: 122, shootRange: 1050, shootCooldown: 2.05, damage: 28, color: "#8bb8c9", scale: 1.02 },
    elite: { name: "Elite", hp: 150, speed: 250, shootRange: 760, shootCooldown: 0.6, damage: 17, color: "#c6e86b", scale: 1.08 },
    boss: { name: "Warden", hp: 760, speed: 124, shootRange: 800, shootCooldown: 0.42, damage: 24, color: "#ff4a5e", scale: 1.48, armor: 120, boss: true },
  },
  waves: { maxWaves: 12, baseCount: 4, growth: 2, maxSimultaneous: 14, restTime: 2.0 },
  physics: { gravity: 1950, friction: 0.78, maxFall: 1250 },
  camera: { lookAhead: 170, smoothing: 6.2, shakeDecay: 2.4 },
  colors: {
    ink: "#07080a",
    sky: "#0a0e14",
    ground: "#161d27",
    concrete: "#242d38",
    accent: "#c6e86b",
    cyan: "#8bb8c9",
    danger: "#e25c5c",
    blood: "#c45b64",
    spark: "#ffe7a8",
    good: "#8fcaa0",
  },
} as const;

export type WeaponId = keyof typeof CONFIG.weapons;
export type EnemyType = keyof typeof CONFIG.enemyClasses;
export type OpId = "sweep" | "hold" | "extract";
export type Difficulty = "operative" | "veteran" | "ghost";

export const WEAPON_ORDER: WeaponId[] = ["pistol", "smg", "rifle", "shotgun", "sniper", "lmg"];

export const OPERATIONS: {
  id: OpId;
  name: string;
  kicker: string;
  summary: string;
  detail: string;
  meta: string;
  image: string;
}[] = [
  {
    id: "sweep",
    name: "Blacksite Sweep",
    kicker: "Campaign",
    summary: "Clear twelve waves through the industrial yard. The Warden arrives last.",
    detail: "Structured assault. Hostiles escalate by class. Secure the sector and drop the Warden.",
    meta: "12 waves · boss finale",
    image: "/media/op-sweep.jpg",
  },
  {
    id: "hold",
    name: "Night Hold",
    kicker: "Survival",
    summary: "No extraction. Hold the yard as density never stops climbing.",
    detail: "Endless waves. A Warden patrols every tenth cycle. Score is survival, not a finish line.",
    meta: "Endless · Warden every 10",
    image: "/media/op-hold.jpg",
  },
  {
    id: "extract",
    name: "Extraction",
    kicker: "Push",
    summary: "Fight east to the lit gate. Occupy the zone and get out alive.",
    detail: "A running gunfight. Hostiles spawn on both flanks while you push the extraction corridor.",
    meta: "Reach the gate · 3s occupy",
    image: "/media/op-extract.jpg",
  },
];

export const DIFFICULTIES: { id: Difficulty; name: string; blurb: string }[] = [
  { id: "operative", name: "Operative", blurb: "Standard load and hostile profile." },
  { id: "veteran", name: "Veteran", blurb: "Tougher hostiles, thinner armor budget." },
  { id: "ghost", name: "Ghost", blurb: "Faster enemies, scarce ammo, no margin." },
];

export function difficultyScale(d: Difficulty) {
  if (d === "veteran") {
    return { enemyHp: 1.32, enemyDmg: 1.2, enemySpeed: 1.08, playerHp: 0.9, ammo: 0.88 };
  }
  if (d === "ghost") {
    return { enemyHp: 1.5, enemyDmg: 1.32, enemySpeed: 1.2, playerHp: 0.8, ammo: 0.68 };
  }
  return { enemyHp: 1, enemyDmg: 1, enemySpeed: 1, playerHp: 1, ammo: 1 };
}
