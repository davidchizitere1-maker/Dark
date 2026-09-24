const GAME_KEYS = new Set([
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "KeyR",
  "KeyF",
  "KeyP",
  "Escape",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
]);

function radialDeadzone(x: number, y: number, dz = 0.16) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export class Input {
  canvas: HTMLCanvasElement;
  keys = new Set<string>();
  pressed = new Set<string>();
  mouse = { x: 0, y: 0, down: false, present: false };
  touchMove = { x: 0, y: 0 };
  touchAim = { x: 0, y: 0, active: false };
  touchFire = false;
  padMove = { x: 0, y: 0 };
  padAim = { x: 0, y: 0, active: false };
  padFire = false;
  forcedKeys: string[] | null = null;
  pulses = new Set<string>();
  holds = new Set<string>();
  private ac = new AbortController();
  private padPrev = new Set<number>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const { signal } = this.ac;
    window.addEventListener(
      "keydown",
      (e) => {
        if (!this.keys.has(e.code)) this.pressed.add(e.code);
        this.keys.add(e.code);
        if (GAME_KEYS.has(e.code)) e.preventDefault();
      },
      { signal },
    );
    window.addEventListener("keyup", (e) => this.keys.delete(e.code), { signal });
    window.addEventListener(
      "blur",
      () => {
        this.keys.clear();
        this.mouse.down = false;
      },
      { signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          this.keys.clear();
          this.mouse.down = false;
        }
      },
      { signal },
    );

    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
      this.mouse.present = true;
    };
    canvas.addEventListener("pointermove", move, { signal });
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        move(e);
        if (e.button === 0 || e.pointerType === "touch") this.mouse.down = true;
      },
      { signal },
    );
    window.addEventListener(
      "pointerup",
      (e) => {
        if (e.button === 0 || e.pointerType !== "mouse") this.mouse.down = false;
      },
      { signal },
    );
    window.addEventListener("pointercancel", () => (this.mouse.down = false), { signal });
  }

  destroy() {
    this.ac.abort();
  }

  setMove(x: number, y: number) {
    this.touchMove = { x, y };
  }
  setAimStick(x: number, y: number, active: boolean) {
    this.touchAim = { x, y, active };
  }
  setFire(v: boolean) {
    this.touchFire = v;
  }
  hold(action: string, v: boolean) {
    if (v) this.holds.add(action);
    else this.holds.delete(action);
  }
  pulse(action: string) {
    this.pulses.add(action);
  }
  setKeys(codes: string[]) {
    this.forcedKeys = codes.length ? codes : null;
  }

  down(code: string) {
    if (this.forcedKeys) return this.forcedKeys.includes(code);
    return this.keys.has(code);
  }

  consume(code: string) {
    if (this.forcedKeys) return false;
    const v = this.pressed.has(code);
    this.pressed.delete(code);
    return v;
  }

  consumePulse(action: string) {
    const v = this.pulses.has(action);
    this.pulses.delete(action);
    return v;
  }

  axisX() {
    let x = 0;
    if (this.down("KeyA") || this.down("ArrowLeft")) x -= 1;
    if (this.down("KeyD") || this.down("ArrowRight")) x += 1;
    x += this.touchMove.x;
    x += this.padMove.x;
    return Math.max(-1, Math.min(1, x));
  }

  jumpHeld() {
    return this.down("KeyW") || this.down("ArrowUp") || this.holds.has("jump") || this.padJump;
  }

  fireHeld() {
    return this.mouse.down || this.touchFire || this.padFire || this.holds.has("fire");
  }

  bulletTimeHeld() {
    return this.down("KeyQ") || this.holds.has("time") || this.padTime;
  }

  padTime = false;
  padJump = false;
  padDodge = false;
  padReload = false;
  padMelee = false;
  padPause = false;
  weaponNext = false;
  weaponPrev = false;

  sampleGamepad() {
    this.padMove = { x: 0, y: 0 };
    this.padAim = { x: 0, y: 0, active: false };
    this.padFire = false;
    this.padTime = false;
    this.padJump = false;
    this.padDodge = false;
    this.padReload = false;
    this.padMelee = false;
    this.padPause = false;
    this.weaponNext = false;
    this.weaponPrev = false;
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad || pad.mapping !== "standard") continue;
      const ls = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      this.padMove.x += ls.x;
      this.padMove.y += ls.y;
      const rs = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);
      if (Math.hypot(rs.x, rs.y) > 0.05) {
        this.padAim = { x: rs.x, y: rs.y, active: true };
      }
      const pressed = (i: number) => !!pad.buttons[i]?.pressed;
      const value = (i: number) => pad.buttons[i]?.value ?? 0;
      this.padFire = this.padFire || value(7) > 0.2;
      this.padTime = this.padTime || value(6) > 0.4;
      const now = new Set<number>();
      for (let i = 0; i < pad.buttons.length; i++) if (pressed(i)) now.add(i);
      const edge = (i: number) => now.has(i) && !this.padPrev.has(i);
      if (edge(9) || edge(8)) this.padPause = true;
      if (edge(5)) this.weaponNext = true;
      if (edge(4)) this.weaponPrev = true;
      if (edge(0)) this.pulses.add("jump");
      if (edge(1)) this.pulses.add("dodge");
      if (edge(2)) this.pulses.add("reload");
      if (edge(3)) this.pulses.add("melee");
      this.padPrev = now;
      break;
    }
  }

  endFrame() {
    this.pressed.clear();
    this.pulses.clear();
  }
}
