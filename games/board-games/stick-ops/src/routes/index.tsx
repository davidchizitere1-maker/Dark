import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Crosshair, Shield, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-nav";
import { LiveFeed } from "@/components/live-feed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OPERATIONS } from "@/game/config";
import { loadSave, rankFor } from "@/game/persistence";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [save, setSave] = useState(() => (typeof window === "undefined" ? null : loadSave()));
  useEffect(() => setSave(loadSave()), []);
  const rank = save ? rankFor(save) : "Recruit";

  return (
    <SiteShell>
      <section className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden">
        <img
          src="/media/hero.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/88 to-bg/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/40" />

        <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-10 px-5 py-12 pb-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Badge>Blacksite division</Badge>
            <h1 className="font-display mt-5 text-6xl font-semibold leading-[0.9] tracking-tight text-fg sm:text-7xl lg:text-8xl">
              Stick Ops
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-[17px]">
              A cinematic 2D operator shooter. Six weapons. Seven hostile classes. Three live operations
              across an industrial yard that never sleeps.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/ops" className="no-underline">
                <Button size="lg">
                  Select operation
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/armory" className="no-underline">
                <Button size="lg" variant="secondary">
                  Open armory
                </Button>
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.16em] text-subtle">Rank</dt>
                <dd className="mt-1 font-display text-xl font-semibold text-fg">{rank}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.16em] text-subtle">Deployments</dt>
                <dd className="mt-1 font-display text-xl font-semibold tabular text-fg">
                  {save?.stats.deployments ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.16em] text-subtle">Confirmed</dt>
                <dd className="mt-1 font-display text-xl font-semibold tabular text-fg">
                  {save?.stats.totalKills ?? 0}
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative mb-14 hidden overflow-hidden rounded-xl border border-border bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.45)] lg:block">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Live yard feed</span>
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-good">
                <span className="size-1.5 rounded-full bg-good" />
                Active
              </span>
            </div>
            <LiveFeed className="block h-[340px] w-full bg-surface-2" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">Operations board</p>
            <h2 className="font-display mt-2 text-4xl font-semibold tracking-tight">Choose the night</h2>
          </div>
          <Link to="/ops" className="hidden text-sm font-medium text-fg no-underline sm:inline">
            Full briefing
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {OPERATIONS.map((op) => {
            const rec = save?.records[op.id];
            return (
              <Link
                key={op.id}
                to="/ops"
                search={{ op: op.id }}
                className="group overflow-hidden rounded-xl border border-border bg-surface no-underline transition-colors duration-150 hover:border-fg/25"
              >
                <div className="relative h-40 overflow-hidden">
                  <img src={op.image} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                  <Badge className="absolute left-3 top-3 bg-bg/70">{op.kicker}</Badge>
                </div>
                <div className="px-5 pb-5 pt-2">
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-fg">{op.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{op.summary}</p>
                  <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-subtle">
                    {rec ? `Best ${rec.score.toLocaleString()} · wave ${rec.wave}` : op.meta}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-3">
          <Feature icon={Crosshair} title="Six weapons" body="Sidearm to Widow LMG. Swap mid-fight, manage mags, pierce armor." />
          <Feature icon={Shield} title="Seven classes" body="Runners, heavies, elites, and the Warden. Each holds a different lane." />
          <Feature icon={Timer} title="Bullet time" body="Drain a slow-motion meter to thread shots through a packed corridor." />
        </div>
      </section>
    </SiteShell>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Crosshair;
  title: string;
  body: string;
}) {
  return (
    <div>
      <Icon className="size-5 text-accent" strokeWidth={1.75} />
      <h3 className="mt-3 font-display text-xl font-semibold text-fg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
