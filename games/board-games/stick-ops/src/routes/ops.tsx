import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CONFIG,
  DIFFICULTIES,
  OPERATIONS,
  WEAPON_ORDER,
  type Difficulty,
  type OpId,
  type WeaponId,
} from "@/game/config";
import { loadSave, saveLast } from "@/game/persistence";
import { cn } from "@/lib/utils";

type OpsSearch = { op?: OpId };

export const Route = createFileRoute("/ops")({
  validateSearch: (raw: Record<string, unknown>): OpsSearch => ({
    op: raw.op === "hold" || raw.op === "extract" || raw.op === "sweep" ? raw.op : undefined,
  }),
  component: OpsPage,
});

function OpsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const initial = useMemo(() => loadSave().last, []);
  const [op, setOp] = useState<OpId>(search.op ?? initial.op);
  const [diff, setDiff] = useState<Difficulty>(initial.difficulty);
  const [weapon, setWeapon] = useState<WeaponId>(initial.weapon);
  const selected = OPERATIONS.find((o) => o.id === op)!;

  function deploy() {
    saveLast({ op, difficulty: diff, weapon });
    void navigate({ to: "/play", search: { op, diff, weapon } });
  }

  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">Briefing</p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-tight">Operations</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Pick the night, the profile, and the first weapon. Everything else you carry is already on the rig.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {OPERATIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOp(item.id)}
              className={cn(
                "overflow-hidden rounded-xl border text-left transition-colors duration-150",
                op === item.id ? "border-accent/50 bg-surface" : "border-border bg-surface hover:border-fg/25",
              )}
            >
              <div className="relative h-36">
                <img src={item.image} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                <Badge className="absolute left-3 top-3 bg-bg/70">{item.kicker}</Badge>
              </div>
              <div className="px-5 pb-5 pt-1">
                <h2 className="font-display text-2xl font-semibold text-fg">{item.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-subtle">{item.meta}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Profile</p>
            <div className="mt-3 grid gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDiff(d.id)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left transition-colors duration-150",
                    diff === d.id ? "border-accent/50 bg-surface-2" : "border-border bg-surface hover:border-fg/25",
                  )}
                >
                  <span className="block font-medium text-fg">{d.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{d.blurb}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Primary weapon</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WEAPON_ORDER.map((id) => {
                const w = CONFIG.weapons[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setWeapon(id)}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-left transition-colors duration-150",
                      weapon === id ? "border-accent/50 bg-surface-2" : "border-border bg-surface hover:border-fg/25",
                    )}
                  >
                    <span className="block font-display text-lg font-semibold text-fg">{w.name}</span>
                    <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-muted">
                      {Math.round(w.damage)} dmg · {w.magazine} mag
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-sm text-muted">
            Deploying <span className="text-fg">{selected.name}</span> as {diff} with {CONFIG.weapons[weapon].name}.
          </p>
          <Button size="lg" onClick={deploy}>
            Deploy
          </Button>
        </div>
      </main>
    </SiteShell>
  );
}
