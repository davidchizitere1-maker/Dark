import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-nav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/intel")({ component: IntelPage });

const KEYBOARD = [
  ["Move", "A / D or arrows"],
  ["Jump", "W or up"],
  ["Aim / fire", "Mouse"],
  ["Dodge", "Space"],
  ["Reload", "R"],
  ["Melee / execute", "F / E"],
  ["Weapons", "1 – 6"],
  ["Bullet time", "Q (hold)"],
  ["Pause", "P or Esc"],
];

const TOUCH = [
  ["Left stick", "Move"],
  ["Jump / dodge", "Left buttons"],
  ["Right stick", "Aim"],
  ["Fire", "Right trigger pad"],
  ["Melee / reload / slow", "Auxiliary pads"],
  ["Prev / next", "Cycle weapons"],
];

const GAMEPAD = [
  ["Left stick", "Move"],
  ["Right stick", "Aim"],
  ["RT / RB", "Fire"],
  ["A", "Jump"],
  ["B", "Dodge"],
  ["X / Y", "Reload / melee"],
  ["LT", "Bullet time"],
  ["LB / RB", "Cycle weapons"],
  ["Start", "Pause"],
];

export function IntelPage() {
  return (
    <SiteShell>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">Field manual</p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-tight">Intel</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Controls live here — not on the door. Keyboard, touch, and a standard gamepad all drive the same actions.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Manual title="Keyboard" rows={KEYBOARD} />
          <Manual title="Touch" rows={TOUCH} />
          <Manual title="Gamepad" rows={GAMEPAD} />
        </div>

        <section className="mt-12 max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Tactics</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>Stamina fuels dodge rolls. A timed roll ignores incoming rounds.</li>
            <li>Melee near a staggered hostile (low health) becomes an execution and pays extra score.</li>
            <li>Support crates drop between waves — ammo, armor, or a patch kit.</li>
            <li>Extraction is a push. Occupy the east gate for three seconds to close the op.</li>
            <li>Night Hold never ends. A Warden walks the yard every tenth cycle.</li>
          </ul>
        </section>

        <div className="mt-10">
          <Link to="/ops" className="no-underline">
            <Button size="lg">Open operations</Button>
          </Link>
        </div>
      </main>
    </SiteShell>
  );
}

function Manual({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="font-display text-2xl font-semibold text-fg">{title}</h2>
      <dl className="mt-4 divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="text-sm font-medium text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
