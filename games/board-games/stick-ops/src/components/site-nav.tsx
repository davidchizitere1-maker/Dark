import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/ops", label: "Ops" },
  { to: "/armory", label: "Armory" },
  { to: "/intel", label: "Intel" },
] as const;

export function SiteNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex items-baseline gap-2.5 no-underline">
          <span className="font-display text-lg font-semibold tracking-[0.18em] text-fg">STEENE</span>
          <span className="hidden text-[11px] font-medium uppercase tracking-[0.22em] text-muted sm:inline">
            Stick Ops
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const active = pathname === l.to || (l.to === "/ops" && pathname.startsWith("/ops"));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-md px-2.5 py-2 text-[13px] font-medium tracking-wide text-muted no-underline transition-colors duration-150 hover:text-fg",
                  active && "text-fg",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg pb-16">
      <SiteNav />
      {children}
    </div>
  );
}
