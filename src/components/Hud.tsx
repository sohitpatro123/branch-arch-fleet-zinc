import { useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import {
  BODIES,
  displayTemp,
  EARTH_MASS,
  EARTH_RADIUS_KM,
  gOf,
  getBody,
  JUPITER_MASS,
  teqOf,
  type BodyDef,
  type Group,
} from "@/sim/bodies";
import {
  applyShape,
  autoLand,
  begin,
  bump,
  cancelAuto,
  closeSheet,
  enterSurface,
  fireImpulse,
  getVersion,
  landIfClose,
  planDvKms,
  returnToFlight,
  returnToGlobe,
  rpOf,
  raOf,
  selectTarget,
  setDraftApo,
  setDraftInc,
  setDraftPeri,
  setFocus,
  setImpulse,
  setNode,
  setSheet,
  setTab,
  setView,
  setWarp,
  sim,
  sliderToWarp,
  subscribe,
  targetBody,
  warpToSlider,
  type NodeId,
} from "@/sim/sim";

const GROUPS: { id: Group; label: string }[] = [
  { id: "planet", label: "Planets" },
  { id: "kuiper", label: "Kuiper belt" },
  { id: "sun", label: "The Sun" },
  { id: "exo", label: "Catalog worlds" },
];

const NODES: { id: NodeId; label: string }[] = [
  { id: "here", label: "Here" },
  { id: "pe", label: "Periapsis" },
  { id: "ap", label: "Apoapsis" },
  { id: "an", label: "Ascending" },
  { id: "dn", label: "Descending" },
];

const GAS: Record<string, string> = {
  h2: "Hydrogen",
  he: "Helium",
  n2: "Nitrogen",
  o2: "Oxygen",
  co2: "Carbon dioxide",
  ch4: "Methane",
  h2o: "Water",
  nh3: "Ammonia",
  so2: "Sulfur dioxide",
  ar: "Argon",
  co: "Carbon monoxide",
};

const btn =
  "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-40";
const primary = `${btn} bg-fg text-bg`;
const quiet = `${btn} border border-line bg-subtle text-fg`;

function useSim() {
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  return version;
}

function fmtAU(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) < 0.01) return `${Math.round(n * 149597870.7).toLocaleString()} km`;
  return `${n.toFixed(n < 10 ? 3 : 1)} AU`;
}

function fmtDays(d: number): string {
  if (!Number.isFinite(d)) return "—";
  if (d < 1.5) return `${(d * 24).toFixed(1)} h`;
  if (d < 800) return `${Math.round(d)} d`;
  return `${(d / 365.25).toFixed(1)} yr`;
}

function massLabel(b: BodyDef): string {
  const est = b.massEstimated ? " est." : "";
  if (b.id === "sun") return "1 solar mass";
  const me = b.massKg / EARTH_MASS;
  const mj = b.massKg / JUPITER_MASS;
  if (mj >= 0.08) return `${mj.toFixed(2)} Jupiter masses${est}`;
  if (me >= 0.01) return `${me.toFixed(2)} Earth masses${est}`;
  return `${b.massKg.toExponential(2)} kg${est}`;
}

function radiusLabel(b: BodyDef): string {
  const est = b.radiusEstimated ? " est." : "";
  if (b.id === "sun") return "695,700 km";
  const re = b.radiusKm / EARTH_RADIUS_KM;
  if (re >= 8) return `${re.toFixed(1)} Earth radii${est}`;
  return `${re.toFixed(2)} Earth radii${est}`;
}

export function Hud() {
  useSim();
  return (
    <div className="pointer-events-none absolute inset-0 text-fg">
      {sim.glError ? (
        <p className="pointer-events-auto absolute inset-x-4 top-4 rounded-lg bg-elevated px-4 py-3 text-sm">{sim.glError}</p>
      ) : null}
      {sim.phase === "title" ? <Title /> : null}
      {sim.phase === "cruise" || sim.phase === "auto" ? <Flight /> : null}
      {sim.phase === "globe" ? <GlobeHud /> : null}
      {sim.phase === "surface" ? <SurfaceHud /> : null}
    </div>
  );
}

function Title() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end p-4 sm:items-center sm:p-8">
      <section className="panel pointer-events-auto rise w-full max-w-xl p-6 sm:p-8">
        <p className="text-xs font-medium tracking-wide text-muted">Earth orbit</p>
        <h1 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl">Aphelion</h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-muted">
          Vesper is a stainless reusable ship, already in orbit. Plot a transfer to a planet, a Kuiper-belt world, or the Sun.
          On arrival the globe is built from that body’s mass, radius, distance, and air — then you can walk it.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className={primary} onClick={begin}>
            Begin departure
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-faint">
          Maneuvers are Keplerian. Solar-system figures are mean elements. Exoplanet atmospheres are labeled measured, partial, or prior.
        </p>
        {!sim.glReady ? <p className="mt-3 text-xs text-muted">Plotting the ecliptic…</p> : null}
      </section>
    </div>
  );
}

function Flight() {
  const body = targetBody();
  const plan = sim.plan;
  const auto = sim.phase === "auto";
  const msg = sim.elapsed - sim.messageAt < 6 ? sim.message : "";
  return (
    <>
      <header className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto rounded-lg border border-line bg-elevated/90 px-3 py-2">
          <p className="text-xs text-muted">Vesper</p>
          <p className="font-mono text-sm tabular-nums">
            Day {sim.t.toFixed(0)} · {sim.warp <= 0 ? "held" : `${Math.round(sim.warp)} d/s`}
          </p>
        </div>
        <div className="pointer-events-auto rounded-lg border border-line bg-elevated/90 px-3 py-2 text-right">
          <p className="text-xs text-muted">Propellant</p>
          <p className="font-mono text-sm tabular-nums">
            {Math.max(0, sim.dvBudget - sim.dvUsed).toFixed(1)} / {sim.dvBudget} km/s
          </p>
        </div>
      </header>

      <aside className="absolute top-20 bottom-24 left-4 hidden w-72 lg:block">
        <div className="panel pointer-events-auto flex h-full flex-col p-3">
          <Destinations />
        </div>
      </aside>

      <aside className="absolute top-20 right-4 bottom-24 hidden w-80 lg:block">
        <div className="panel pointer-events-auto flex h-full flex-col gap-4 overflow-y-auto p-4">
          {auto ? <AutoStatus /> : <Maneuver />}
        </div>
      </aside>

      <footer className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 sm:p-4">
        {msg ? (
          <p className="pointer-events-none mx-auto max-w-lg text-center text-sm text-fg">{msg}</p>
        ) : null}
        <div className="pointer-events-auto mx-auto flex w-full max-w-lg flex-col gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {auto ? (
              <button type="button" className={quiet} onClick={cancelAuto}>
                Cancel
              </button>
            ) : (
              <>
                <button type="button" className={primary} onClick={autoLand}>
                  {landCta(body)}
                </button>
                {sim.canLand ? (
                  <button type="button" className={quiet} onClick={landIfClose}>
                    Land now
                  </button>
                ) : null}
              </>
            )}
          </div>
          <p className="text-center font-mono text-xs tabular-nums text-muted">
            {body.name}
            {plan?.kind === "fold"
              ? ` · ${body.distanceLy.toFixed(body.distanceLy < 10 ? 1 : 0)} ly`
              : plan
                ? ` · transfer ${planDvKms(plan).toFixed(1)} km/s · coast ${fmtDays(plan.tof)}`
                : ""}
            {body.group !== "exo" && body.group !== "sun" ? ` · miss ${fmtAU(sim.missAU)}` : ""}
          </p>
        </div>
        <div className="pointer-events-auto flex gap-2 lg:hidden">
          <button type="button" className={`${quiet} flex-1`} onClick={() => setSheet("dest")}>
            Destinations
          </button>
          <button type="button" className={`${quiet} flex-1`} onClick={() => setSheet("burn")}>
            {auto ? "Flight" : "Maneuver"}
          </button>
        </div>
      </footer>

      {sim.sheet ? (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 p-3 lg:hidden">
          <div className="sheet panel flex flex-col overflow-hidden p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{sim.sheet === "dest" ? "Destinations" : auto ? "Flight" : "Maneuver"}</p>
              <button type="button" className={quiet} onClick={closeSheet}>
                Close
              </button>
            </div>
            <div className="overflow-y-auto">
              {sim.sheet === "dest" ? <Destinations /> : auto ? <AutoStatus /> : <Maneuver />}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function landCta(body: BodyDef): string {
  if (body.group === "exo") return "Open surface model";
  if (body.group === "sun") return "Enter photosphere model";
  return "Auto-land";
}

function Destinations() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      {GROUPS.map((g) => (
        <div key={g.id}>
          <p className="px-2 pb-1 text-xs text-faint">{g.label}</p>
          <ul className="flex flex-col gap-1">
            {BODIES.filter((b) => b.group === g.id).map((b) => {
              const on = b.id === sim.targetId;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => selectTarget(b.id)}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left ${on ? "bg-subtle text-fg" : "text-muted hover:bg-subtle hover:text-fg"}`}
                  >
                    <span className="text-sm font-medium">{b.name}</span>
                    <span className="text-xs text-faint">{b.blurb}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Maneuver() {
  const el = sim.ship;
  const rp = rpOf(el);
  const ra = raOf(el);
  const inc = (el.i * 180) / Math.PI;
  const nodeName = NODES.find((n) => n.id === sim.node)?.label ?? "Here";
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums text-muted">
        <Stat k="Semi-major" v={`${el.a.toFixed(3)} AU`} />
        <Stat k="Eccentricity" v={el.e.toFixed(3)} />
        <Stat k="Inclination" v={`${inc.toFixed(2)}°`} />
        <Stat k="Periapsis" v={fmtAU(rp)} />
        <Stat k="Apoapsis" v={fmtAU(ra)} />
        <Stat k="Approach" v={targetBody().group === "sun" ? `peri ${fmtAU(sim.missAU)}` : fmtAU(sim.missAU)} />
        <Stat k="ETA" v={fmtDays(sim.missEta)} />
        <Stat k="Relative" v={`${sim.relKms.toFixed(1)} km/s`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ship", "target", "sun"] as const).map((f) => (
          <button key={f} type="button" className={sim.focus === f ? primary : quiet} onClick={() => setFocus(f)}>
            {f === "ship" ? "Frame ship" : f === "target" ? "Frame target" : "Frame Sun"}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-xs text-muted">
        <span className="flex justify-between">
          Time compression
          <span className="font-mono text-fg tabular-nums">{sim.warp <= 0 ? "Hold" : `${Math.round(sim.warp)} d/s`}</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={warpToSlider(sim.warp)}
          aria-label="Time compression"
          onChange={(e) => setWarp(sliderToWarp(Number(e.target.value)))}
        />
      </label>

      <div className="flex rounded-lg bg-subtle p-1">
        <button type="button" className={`min-h-11 flex-1 rounded-md text-sm ${sim.tab === "impulse" ? "bg-elevated text-fg" : "text-muted"}`} onClick={() => setTab("impulse")}>
          Impulse
        </button>
        <button type="button" className={`min-h-11 flex-1 rounded-md text-sm ${sim.tab === "shape" ? "bg-elevated text-fg" : "text-muted"}`} onClick={() => setTab("shape")}>
          Shape
        </button>
      </div>

      {sim.tab === "impulse" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1">
            {NODES.map((n) => (
              <button key={n.id} type="button" className={`${sim.node === n.id ? primary : quiet} px-3`} onClick={() => setNode(n.id)}>
                {n.label}
              </button>
            ))}
          </div>
          <Range label="Prograde" hint="negative slows you" min={-6} max={8} step={0.05} value={sim.impulse.pro} display={`${sim.impulse.pro.toFixed(2)} km/s`} onChange={(v) => setImpulse({ pro: v })} />
          <Range label="Normal" hint="plane change" min={-4} max={4} step={0.05} value={sim.impulse.norm} display={`${sim.impulse.norm.toFixed(2)} km/s`} onChange={(v) => setImpulse({ norm: v })} />
          <Range label="Radial" hint="in or out" min={-3} max={3} step={0.05} value={sim.impulse.rad} display={`${sim.impulse.rad.toFixed(2)} km/s`} onChange={(v) => setImpulse({ rad: v })} />
          <button type="button" className={primary} onClick={fireImpulse}>
            Burn at {nodeName.toLowerCase()}
          </button>
          <p className="text-xs leading-relaxed text-faint">
            The pale orbit is the result of this burn. Nodal burns coast to periapsis, apoapsis, or a node, then fire.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Range
            label="Apoapsis"
            hint="burn at periapsis"
            min={Math.max(0.05, rp + 0.02)}
            max={40}
            step={0.01}
            value={sim.draft?.kind === "apo" ? sim.draft.ra : ra}
            display={fmtAU(sim.draft?.kind === "apo" ? sim.draft.ra : ra)}
            onChange={setDraftApo}
          />
          <Range
            label="Periapsis"
            hint="burn at apoapsis"
            min={0.02}
            max={Math.max(0.05, ra - 0.02)}
            step={0.01}
            value={sim.draft?.kind === "peri" ? sim.draft.rp : rp}
            display={fmtAU(sim.draft?.kind === "peri" ? sim.draft.rp : rp)}
            onChange={setDraftPeri}
          />
          <Range
            label="Inclination"
            hint="burn at ascending node"
            min={0}
            max={45}
            step={0.1}
            value={sim.draft?.kind === "inc" ? sim.draft.incDeg : inc}
            display={`${(sim.draft?.kind === "inc" ? sim.draft.incDeg : inc).toFixed(1)}°`}
            onChange={setDraftInc}
          />
          <button type="button" className={primary} disabled={!sim.draft} onClick={applyShape}>
            Apply shape at node
          </button>
        </div>
      )}
      {sim.plan ? <p className="text-xs leading-relaxed text-faint">{sim.plan.note}</p> : null}
    </div>
  );
}

function AutoStatus() {
  const plan = sim.plan;
  const u = Math.max(0, Math.min(1, sim.autoU));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed">
        {plan?.kind === "fold"
          ? "Folding a catalog lens. Published parameters drive the globe; the distance is not being flown."
          : plan?.kind === "sun"
            ? "Dropping perihelion. The photosphere you enter is a reconstruction."
            : "Waiting out the launch window, then flying the transfer and matching the target."}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-subtle">
        <div className="h-full bg-fg" style={{ width: `${Math.round(u * 100)}%` }} />
      </div>
      <p className="font-mono text-xs tabular-nums text-muted">
        {plan ? `${planDvKms(plan).toFixed(1)} km/s planned · coast ${fmtDays(plan.tof)}` : "Plotting"}
      </p>
    </div>
  );
}

function GlobeHud() {
  const b = targetBody();
  const gases = Object.entries(b.atm)
    .filter(([, v]) => v >= 0.001)
    .sort((a, c) => c[1] - a[1]);
  return (
    <>
      <aside className="absolute top-3 right-3 left-3 max-h-64 overflow-hidden lg:right-auto lg:bottom-24 lg:left-4 lg:w-80 lg:max-h-none">
        <div className="panel pointer-events-auto flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-5">
          <div>
            <p className="text-xs text-muted">{b.starName === "Sun" && b.id !== "sun" ? "Solar system" : b.starName}</p>
            <h2 className="text-2xl font-medium tracking-tight">{b.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{b.walk}</p>
          </div>
          <dl className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
            <Stat k="Mass" v={massLabel(b)} />
            <Stat k="Radius" v={radiusLabel(b)} />
            <Stat k="Distance" v={b.group === "exo" ? `${b.distanceLy.toFixed(b.distanceLy < 10 ? 2 : 0)} ly` : b.id === "sun" ? "—" : `${b.aAU.toFixed(3)} AU`} />
            <Stat k="Gravity" v={`${gOf(b).toFixed(gOf(b) >= 10 ? 1 : 2)} m/s²`} />
            <Stat k="Temperature" v={`${Math.round(displayTemp(b))} K`} />
            <Stat k="Eq. temp" v={b.id === "sun" ? "—" : `${Math.round(teqOf(b))} K`} />
            <Stat k="Pressure" v={b.pressureBar >= 0.01 ? `${b.pressureBar.toFixed(b.pressureBar >= 10 ? 0 : 2)} bar` : b.pressureBar > 0 ? "trace" : "none"} />
            <Stat k="Albedo" v={b.albedo.toFixed(2)} />
          </dl>
          <div>
            <p className="text-xs text-muted">Atmosphere · {b.atmConfidence}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {gases.length === 0 ? <li className="text-sm text-faint">No bulk atmosphere</li> : null}
              {gases.map(([k, v]) => (
                <li key={k} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-xs">
                  <span>{GAS[k] ?? k}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
                    <span className="block h-full bg-fg" style={{ width: `${Math.min(100, v * 100)}%` }} />
                  </span>
                  <span className="font-mono tabular-nums text-muted">{(v * 100).toFixed(v < 0.01 ? 2 : 1)}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-faint">{b.atmNote}</p>
          </div>
          <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted">
            {b.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-faint">{b.source}</p>
        </div>
      </aside>
      <div className="pointer-events-auto absolute right-3 bottom-4 left-3 flex flex-col gap-2 sm:right-4 sm:left-auto sm:w-72">
        <div className="flex rounded-lg bg-elevated p-1">
          {(
            [
              ["natural", "Albedo"],
              ["composite", "Composite"],
              ["heat", "Heat"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" className={`min-h-11 flex-1 rounded-md text-sm ${sim.view === id ? "bg-fg text-bg" : "text-muted"}`} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className={primary} onClick={enterSurface}>
          Walk the surface
        </button>
        <button type="button" className={quiet} onClick={returnToFlight}>
          Return to flight
        </button>
      </div>
    </>
  );
}

function SurfaceHud() {
  const b = getBody(sim.targetId)!;
  const fact = sim.nearFact >= 0 ? b.facts[sim.nearFact] : null;
  return (
    <>
      <header className="absolute top-3 right-3 left-3 flex items-start justify-between gap-3 sm:top-4 sm:right-4 sm:left-4">
        <div className="pointer-events-auto max-w-sm rounded-lg border border-line bg-elevated/90 px-3 py-2">
          <p className="text-sm font-medium">{b.name}</p>
          <p className="font-mono text-xs tabular-nums text-muted">
            {gOf(b).toFixed(gOf(b) >= 10 ? 1 : 2)} m/s² · {Math.round(displayTemp(b))} K
          </p>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" className={quiet} onClick={() => setCodex(!sim.codex)}>
            Codex
          </button>
          <button type="button" className={quiet} onClick={returnToGlobe}>
            Orbit
          </button>
        </div>
      </header>
      {fact ? (
        <article className="panel pointer-events-auto absolute inset-x-4 top-24 p-4 text-sm leading-relaxed sm:top-auto sm:right-auto sm:bottom-28 sm:left-4 sm:max-w-md">
          {fact}
        </article>
      ) : (
        <p className="pointer-events-none absolute bottom-28 left-4 hidden text-xs text-muted sm:block">
          A and D turn. W and S walk. Space jumps. Walk up to a marker.
        </p>
      )}
      {sim.codex ? (
        <div className="pointer-events-auto absolute inset-x-4 top-24 bottom-36 overflow-y-auto sm:left-auto sm:w-96">
          <div className="panel flex flex-col gap-3 p-4">
            <p className="text-sm font-medium">Field notes</p>
            {b.facts.map((f) => (
              <p key={f} className="text-sm leading-relaxed text-muted">
                {f}
              </p>
            ))}
            <p className="text-xs text-faint">{b.atmNote}</p>
            <button type="button" className={quiet} onClick={() => setCodex(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
      <SurfaceControls />
      <p className="pointer-events-none absolute right-4 bottom-36 left-4 text-center text-xs text-muted lg:hidden">
        Drag the view to turn. The stick walks.
      </p>
    </>
  );
}

function setCodex(open: boolean) {
  sim.codex = open;
  bump();
}

function SurfaceControls() {
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
      <Stick />
      <div className="flex gap-2">
        <Hold code="KeyA" label="Left" />
        <Hold code="KeyW" label="Walk" />
        <Hold code="KeyD" label="Right" />
        <Hold code="Space" label="Jump" />
      </div>
    </div>
  );
}

function Hold({ code, label }: { code: string; label: string }) {
  return (
    <button
      type="button"
      className={`${quiet} px-3`}
      onPointerDown={(e) => {
        e.preventDefault();
        sim.held.add(code);
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      }}
      onPointerUp={() => sim.held.delete(code)}
      onPointerCancel={() => sim.held.delete(code)}
    >
      {label}
    </button>
  );
}

function Stick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  function setStick(x: number, y: number) {
    sim.stick.x = x;
    sim.stick.y = y;
    setKnob({ x, y });
  }
  function move(e: ReactPointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setStick(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, -dy)));
  }
  return (
    <div
      className="grid h-24 w-24 touch-none place-items-center rounded-full border border-line bg-elevated/80 lg:hidden"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
      }}
      onPointerUp={() => setStick(0, 0)}
      onPointerCancel={() => setStick(0, 0)}
      role="slider"
      aria-label="Move"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={knob.y}
    >
      <span
        className="h-8 w-8 rounded-full bg-fg"
        style={{ transform: `translate(${knob.x * 28}px, ${-knob.y * 28}px)` }}
      />
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-subtle px-2 py-2">
      <dt className="text-faint">{k}</dt>
      <dd className="mt-1 text-fg">{v}</dd>
    </div>
  );
}

function Range({
  label,
  hint,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const safe = Math.max(min, Math.min(max, value));
  return (
    <label className="flex flex-col text-xs text-muted">
      <span className="flex justify-between gap-3">
        <span>
          {label}
          <span className="text-faint"> · {hint}</span>
        </span>
        <span className="font-mono text-fg tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safe}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
