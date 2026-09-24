import { useCallback, useRef } from "react";
import type { Input } from "@/game/input";
import { cn } from "@/lib/utils";

function Stick({
  label,
  onChange,
  className,
}: {
  label: string;
  onChange: (x: number, y: number, active: boolean) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);

  const read = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const max = r.width * 0.42;
      const m = Math.hypot(dx, dy);
      const k = m > max ? max / m : 1;
      onChange((dx * k) / max, (dy * k) / max, true);
      const knob = el.querySelector("[data-knob]") as HTMLElement | null;
      if (knob) knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    },
    [onChange],
  );

  const end = useCallback(() => {
    pid.current = null;
    onChange(0, 0, false);
    const el = ref.current;
    const knob = el?.querySelector("[data-knob]") as HTMLElement | null;
    if (knob) knob.style.transform = "translate(0px, 0px)";
  }, [onChange]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative size-[118px] touch-none rounded-full border border-fg/15 bg-fg/8",
        className,
      )}
      onPointerDown={(e) => {
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        read(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pid.current !== e.pointerId) return;
        read(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        data-knob
        className="pointer-events-none absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-fg/20 bg-fg/25"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-fg/45">
        {label}
      </span>
    </div>
  );
}

function PadButton({
  label,
  sub,
  onDown,
  onUp,
  className,
}: {
  label: string;
  sub?: string;
  onDown: () => void;
  onUp?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-12 min-w-12 touch-none select-none flex-col items-center justify-center rounded-full border border-fg/15 bg-fg/10 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-fg active:bg-accent active:text-accent-fg",
        className,
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {label}
      {sub ? <span className="text-[9px] font-medium tracking-normal text-fg/50">{sub}</span> : null}
    </button>
  );
}

export function MobileControls({
  input,
  visible,
}: {
  input: Input | null;
  visible: boolean;
}) {
  if (!visible || !input) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(56px,env(safe-area-inset-bottom))] pt-8">
      <div className="flex items-end justify-between gap-3">
        <div className="pointer-events-auto flex items-end gap-2">
          <Stick label="Move" onChange={(x) => input.setMove(x, 0)} />
          <div className="mb-1 flex flex-col gap-2">
            <PadButton label="Jump" onDown={() => input.pulse("jump")} />
            <PadButton label="Dodge" onDown={() => input.pulse("dodge")} />
          </div>
        </div>
        <div className="pointer-events-auto flex items-end gap-2">
          <div className="mb-1 flex flex-col gap-2">
            <PadButton label="Melee" onDown={() => input.pulse("melee")} />
            <PadButton label="Reload" onDown={() => input.pulse("reload")} />
            <PadButton
              label="Slow"
              onDown={() => input.hold("time", true)}
              onUp={() => input.hold("time", false)}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <PadButton label="Prev" onDown={() => input.pulse("prevWep")} className="min-w-11" />
              <PadButton label="Next" onDown={() => input.pulse("nextWep")} className="min-w-11" />
            </div>
            <Stick
              label="Aim"
              onChange={(x, y, active) => input.setAimStick(x, y, active)}
            />
            <PadButton
              label="Fire"
              className="size-[72px] min-h-[72px] min-w-[72px] bg-accent/90 text-accent-fg"
              onDown={() => input.setFire(true)}
              onUp={() => input.setFire(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
