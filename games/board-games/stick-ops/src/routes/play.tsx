import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameHud } from "@/components/game-hud";
import { MobileControls } from "@/components/mobile-controls";
import { PauseOverlay, ResultOverlay } from "@/components/game-overlays";
import { Game } from "@/game/game";
import type { Input } from "@/game/input";
import { WEAPON_ORDER, type Difficulty, type OpId, type WeaponId } from "@/game/config";
import { loadSave, recordDeployment, saveSettings } from "@/game/persistence";
import { resetHud } from "@/game/hud-store";
import type { EndReport } from "@/game/types";

type PlaySearch = { op: OpId; diff: Difficulty; weapon: WeaponId };

export const Route = createFileRoute("/play")({
  validateSearch: (raw: Record<string, unknown>): PlaySearch => ({
    op: raw.op === "hold" || raw.op === "extract" ? raw.op : "sweep",
    diff: raw.diff === "veteran" || raw.diff === "ghost" ? raw.diff : "operative",
    weapon:
      typeof raw.weapon === "string" && (WEAPON_ORDER as readonly string[]).includes(raw.weapon)
        ? (raw.weapon as WeaponId)
        : "rifle",
  }),
  component: PlayPage,
});

function PlayPage() {
  const search = Route.useSearch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [input, setInput] = useState<Input | null>(null);
  const [paused, setPaused] = useState(false);
  const [report, setReport] = useState<EndReport | null>(null);
  const [audio, setAudio] = useState(true);
  const [shake, setShake] = useState(true);
  const [touch, setTouch] = useState(false);
  const [tick, setTick] = useState(0);

  const boot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    gameRef.current?.destroy();
    resetHud();
    const save = loadSave();
    const game = new Game(
      canvas,
      { op: search.op, difficulty: search.diff, weapon: search.weapon },
      {
        audio: save.settings.audio,
        shake: save.settings.shake,
        onEnd: (r) => {
          recordDeployment({
            op: r.op,
            difficulty: r.difficulty,
            weapon: search.weapon,
            score: r.score,
            wave: r.wave,
            kills: r.kills,
            won: r.win,
          });
          setReport(r);
        },
        onPause: (v) => setPaused(v),
      },
    );
    game.init();
    gameRef.current = game;
    setInput(game.input);
    setAudio(save.settings.audio);
    setShake(save.settings.shake);
  }, [search.op, search.diff, search.weapon]);

  useEffect(() => {
    boot();
    return () => {
      gameRef.current?.destroy();
      gameRef.current = null;
    };
  }, [boot]);

  useEffect(() => {
    const compute = () => {
      const save = loadSave();
      const coarse = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
      setTouch(save.settings.touch === "on" || (save.settings.touch === "auto" && coarse));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [tick]);

  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    g.audio.enabled = audio;
    g.shakeEnabled = shake;
    const save = loadSave();
    saveSettings({ ...save.settings, audio, shake });
  }, [audio, shake]);

  return (
    <div className="relative h-dvh overflow-hidden bg-bg">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full bg-bg"
        style={{ touchAction: "none", cursor: touch ? "auto" : "none" }}
        aria-label="STEENE Stick Ops battlefield"
      />
      <GameHud onPause={() => gameRef.current?.pause()} />
      <MobileControls input={input} visible={touch && !paused && !report} />
      <PauseOverlay
        open={paused && !report}
        onResume={() => gameRef.current?.resume()}
        audio={audio}
        shake={shake}
        onAudio={setAudio}
        onShake={setShake}
      />
      <ResultOverlay
        report={report}
        onRedeploy={() => {
          setReport(null);
          setPaused(false);
          setTick((n) => n + 1);
          boot();
        }}
      />
    </div>
  );
}
