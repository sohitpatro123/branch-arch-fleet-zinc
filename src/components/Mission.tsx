import { useEffect, useRef } from "react";
import { Hud } from "@/components/Hud";
import { bump, sim } from "@/sim/sim";

export function Mission() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let world: { dispose: () => void } | null = null;
    let dead = false;
    const canvas = ref.current;
    if (!canvas) return;
    void import("@/sim/world").then(({ MissionWorld }) => {
      if (dead) return;
      try {
        const next = new MissionWorld(canvas);
        world = next;
        next.start();
      } catch (err) {
        sim.glError = err instanceof Error ? err.message : "Graphics failed to start.";
        bump();
      }
    });
    return () => {
      dead = true;
      world?.dispose();
    };
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg font-sans text-fg">
      <canvas ref={ref} className="absolute inset-0 h-full w-full touch-none" aria-label="Flight view" />
      <Hud />
    </main>
  );
}
