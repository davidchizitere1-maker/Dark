import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { CONFIG, WEAPON_ORDER } from "@/game/config";

export const Route = createFileRoute("/armory")({ component: ArmoryPage });

function ArmoryPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">Loadout</p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-tight">Armory</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Six weapons on the rig. Pick a primary in briefing — the rest stay hot on keys 1 through 6.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {WEAPON_ORDER.map((id, i) => {
            const w = CONFIG.weapons[id];
            const rpm = Math.round((1 / w.fireRate) * 60);
            return (
              <article key={id} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">0{i + 1}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{w.short}</p>
                </div>
                <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-fg">{w.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{w.flavor}</p>
                <dl className="mt-5 grid grid-cols-4 gap-2 text-center">
                  <Stat k="Damage" v={String(w.damage)} />
                  <Stat k="RPM" v={String(rpm)} />
                  <Stat k="Mag" v={String(w.magazine)} />
                  <Stat k="Pierce" v={String(w.pierce)} />
                </dl>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-fg/10">
                  <i className="block h-full bg-accent" style={{ width: `${Math.min(100, w.damage)}%` }} />
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-10">
          <Link to="/ops" className="no-underline">
            <Button size="lg">Take a primary into briefing</Button>
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-2 py-2">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-subtle">{k}</dt>
      <dd className="font-display mt-1 text-xl font-semibold tabular text-fg">{v}</dd>
    </div>
  );
}
