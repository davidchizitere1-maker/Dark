import { useEffect, useRef, useState } from "react";
import { Game } from "@/game/game";
import { cn } from "@/lib/utils";

export function LiveFeed({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !enabled) return;
    const game = new Game(
      canvas,
      { op: "sweep", difficulty: "operative", weapon: "rifle", demo: true },
      { audio: false, shake: false },
    );
    game.init();
    return () => game.destroy();
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={ref}
      className={cn(className)}
      aria-hidden
      style={{ touchAction: "none" }}
    />
  );
}
