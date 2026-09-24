export class AudioSystem {
  ctx: AudioContext | null = null;
  master = 0.05;
  enabled = true;

  unlock() {
    if (!this.enabled) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.ctx && AC) this.ctx = new AC();
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  tone(freq: number, duration = 0.05, type: OscillatorType = "square", gain = 0.03, slide = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + duration);
    const vol = gain * this.master * 16 * (0.9 + Math.random() * 0.2);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + duration);
  }

  shot(id: string) {
    const map: Record<string, [number, number]> = {
      pistol: [220, 0.055],
      smg: [125, 0.04],
      rifle: [155, 0.05],
      shotgun: [80, 0.11],
      sniper: [95, 0.16],
      lmg: [115, 0.035],
    };
    const [f, d] = map[id] ?? [150, 0.05];
    this.tone(f, d, "sawtooth", 0.8, 160);
  }
  hit() {
    this.tone(650, 0.03, "square", 0.65, -260);
  }
  melee() {
    this.tone(210, 0.09, "triangle", 1, 420);
  }
  reload() {
    this.tone(280, 0.08, "square", 0.5, 120);
    window.setTimeout(() => this.tone(410, 0.07, "square", 0.45, 180), 90);
  }
  dodge() {
    this.tone(390, 0.09, "triangle", 0.8, 220);
  }
  death() {
    this.tone(90, 0.22, "sawtooth", 1, -50);
  }
  pickup() {
    this.tone(520, 0.08, "sine", 0.7, 240);
  }
}
