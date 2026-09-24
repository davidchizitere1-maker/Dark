import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { EndReport } from "@/game/types";
import { OPERATIONS } from "@/game/config";

export function PauseOverlay({
  open,
  onResume,
  audio,
  shake,
  onAudio,
  onShake,
}: {
  open: boolean;
  onResume: () => void;
  audio: boolean;
  shake: boolean;
  onAudio: (v: boolean) => void;
  onShake: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-bg/70 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">Hold position</p>
        <h2 className="font-display mt-2 text-4xl font-semibold tracking-tight text-fg">Paused</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The yard is frozen. Resume when the lane is yours.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <label className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-3 text-sm">
            <span>Audio</span>
            <input type="checkbox" checked={audio} onChange={(e) => onAudio(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-3 text-sm">
            <span>Camera shake</span>
            <input type="checkbox" checked={shake} onChange={(e) => onShake(e.target.checked)} />
          </label>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={onResume}>
            Resume
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => navigate({ to: "/" })}>
            Exit to home
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ResultOverlay({
  report,
  onRedeploy,
}: {
  report: EndReport | null;
  onRedeploy: () => void;
}) {
  const navigate = useNavigate();
  if (!report) return null;
  const op = OPERATIONS.find((o) => o.id === report.op);
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-bg/74 px-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
          {report.win ? "Mission complete" : "Mission failed"}
        </p>
        <h2 className="font-display mt-2 text-4xl font-semibold tracking-tight text-fg">
          {report.win ? "Sector secured" : "Operator down"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {op?.name} · {report.difficulty}
          {report.win
            ? " — hostiles neutralized and the objective is closed."
            : " — the operation ended before the objective was closed."}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Score", report.score.toLocaleString()],
            ["Wave", String(report.wave).padStart(2, "0")],
            ["Defeated", String(report.kills)],
            ["Best combo", String(report.combo)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border bg-surface-2 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-subtle">{k}</p>
              <p className="font-display mt-1 text-2xl font-semibold tabular text-fg">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={onRedeploy}>
            Redeploy
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => navigate({ to: "/ops" })}>
            Operations
          </Button>
        </div>
      </div>
    </div>
  );
}
