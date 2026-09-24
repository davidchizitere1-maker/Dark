import { Link } from "@tanstack/react-router";
import { Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHud } from "@/game/hud-store";
import { cn } from "@/lib/utils";

function Bar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const w = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
      <i className={cn("block h-full rounded-full", className)} style={{ width: `${w}%` }} />
    </div>
  );
}

export function GameHud({ onPause }: { onPause: () => void }) {
  const h = useHud();
  if (h.status === "demo") return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 pt-[max(10px,env(safe-area-inset-top))]">
        <Link to="/" className="font-display text-sm font-semibold tracking-[0.18em] text-fg no-underline">
          STEENE
        </Link>
        <div className="hidden items-center gap-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted sm:flex">
          <span>
            {h.totalWaves ? `Wave ${String(h.wave).padStart(2, "0")}` : `Cycle ${String(h.wave).padStart(2, "0")}`}
          </span>
          <span className="size-1 rounded-full bg-muted" />
          <span>{h.message}</span>
        </div>
        <div className="flex items-center gap-2">
          {h.extractProgress > 0 ? (
            <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold tracking-[0.14em] text-accent">
              Gate {Math.round(h.extractProgress * 100)}%
            </span>
          ) : null}
          {h.combo >= 2 ? (
            <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-semibold tracking-[0.14em] text-accent">
              Combo {h.combo}
            </span>
          ) : null}
          <Button variant="secondary" size="sm" className="h-10 px-3" onClick={onPause} aria-label="Pause">
            <Pause className="size-4" />
            <span className="hidden sm:inline">Pause</span>
          </Button>
        </div>
      </div>

      <div className="absolute left-4 top-16 max-w-[220px] sm:hidden">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{h.message}</p>
      </div>

      <div className="absolute bottom-[max(20px,env(safe-area-inset-bottom))] left-4 right-20 flex items-end justify-between gap-4 pb-1 max-md:bottom-44 max-md:right-4">
        <div className="w-[min(240px,42vw)]">
          <div className="mb-1 flex items-baseline justify-between text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            <span>Operator</span>
            <span className="tabular text-fg">{Math.ceil(h.hp)}</span>
          </div>
          <Bar value={h.hp} max={h.maxHp} className="bg-good" />
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-subtle">Armor</p>
              <Bar value={h.armor} max={h.maxArmor} className="bg-cyan" />
            </div>
            <div>
              <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-subtle">Stamina</p>
              <Bar value={h.stamina} max={h.maxStamina} className="bg-fg/55" />
            </div>
          </div>
        </div>

        <div className="hidden text-center sm:block">
          <p className="font-display text-xl font-semibold tracking-[0.12em] text-fg">{h.weaponName}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{h.weaponMeta}</p>
        </div>

        <div className="text-right">
          <p className="font-display text-3xl font-semibold tabular leading-none text-fg">
            {h.magazine}
            <span className="ml-1 text-base text-muted">/{h.reserve}</span>
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted">
            {h.reloading ? "Reloading" : "Ammo"}
          </p>
          <div className="ml-auto mt-2 w-28">
            <p className="mb-1 text-[9px] uppercase tracking-[0.14em] text-subtle">Bullet time</p>
            <Bar value={h.bulletTime} max={100} className="bg-cyan" />
          </div>
        </div>
      </div>
    </div>
  );
}
