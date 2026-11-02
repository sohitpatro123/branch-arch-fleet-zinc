import { BODIES, bodyElements, getBody, gOf, type BodyDef } from "./bodies";
import {
  KMS,
  MU,
  applyDv,
  cartesianToElements,
  lambert,
  meanMotion,
  nodeNu,
  periodDays,
  propagate,
  stateVectors,
  timeToAnomaly,
  trueAnomaly,
  type Elements,
} from "./kepler";
import { clamp, mag, mul, sub, TAU, type V3 } from "./vec";

export type Phase = "title" | "cruise" | "auto" | "globe" | "surface";
export type NodeId = "here" | "pe" | "ap" | "an" | "dn";
export type ManeuverTab = "impulse" | "shape";
export type GlobeView = "natural" | "heat" | "composite";
export type Sheet = null | "dest" | "burn" | "info";
export type Focus = "ship" | "target" | "sun";

export type Draft =
  | { kind: "apo"; ra: number }
  | { kind: "peri"; rp: number }
  | { kind: "inc"; incDeg: number }
  | null;

export type Plan = {
  kind: "ballistic" | "sun" | "fold";
  tDep: number;
  tof: number;
  dv1: number;
  dv2: number;
  transfer: Elements | null;
  arrival: Elements | null;
  note: string;
  errAU: number;
};

type Queue = { node: NodeId; pro: number; norm: number; rad: number; left: number };

export type Sim = {
  phase: Phase;
  t: number;
  warp: number;
  ship: Elements;
  targetId: string;
  tab: ManeuverTab;
  node: NodeId;
  impulse: { pro: number; norm: number; rad: number };
  draft: Draft;
  dvUsed: number;
  dvBudget: number;
  message: string;
  messageAt: number;
  elapsed: number;
  plan: Plan | null;
  autoU: number;
  autoDur: number;
  autoT0: number;
  autoShip0: Elements | null;
  burnFlash: number;
  view: GlobeView;
  yaw: number;
  x: number;
  z: number;
  hop: number;
  vy: number;
  speed: number;
  stick: { x: number; y: number };
  held: Set<string>;
  steerOverride: number | null;
  nearFact: number;
  codex: boolean;
  sheet: Sheet;
  glReady: boolean;
  glError: string;
  acc: number;
  queue: Queue | null;
  focus: Focus;
  sceneEpoch: number;
  orbitStamp: number;
  missAU: number;
  missEta: number;
  relKms: number;
  canLand: boolean;
  camNonce: number;
};

const earth0 = bodyElements("earth", 0)!;

function freshShip(): Elements {
  return { ...earth0, M: earth0.M + 0.012 };
}

export const sim: Sim = {
  phase: "title",
  t: 0,
  warp: 20,
  ship: freshShip(),
  targetId: "mars",
  tab: "impulse",
  node: "here",
  impulse: { pro: 0, norm: 0, rad: 0 },
  draft: null,
  dvUsed: 0,
  dvBudget: 22,
  message: "",
  messageAt: -10,
  elapsed: 0,
  plan: null,
  autoU: 0,
  autoDur: 13,
  autoT0: 0,
  autoShip0: null,
  burnFlash: 0,
  view: "composite",
  yaw: 0,
  x: 0,
  z: 14,
  hop: 0,
  vy: 0,
  speed: 0,
  stick: { x: 0, y: 0 },
  held: new Set(),
  steerOverride: null,
  nearFact: -1,
  codex: false,
  sheet: null,
  glReady: false,
  glError: "",
  acc: 0,
  queue: null,
  focus: "ship",
  sceneEpoch: 0,
  orbitStamp: 0,
  missAU: 99,
  missEta: 0,
  relKms: 0,
  canLand: false,
  camNonce: 0,
};

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function getVersion(): number {
  return version;
}
export function bump(): void {
  version += 1;
  listeners.forEach((l) => l());
}

export function say(text: string): void {
  sim.message = text;
  sim.messageAt = sim.elapsed;
  bump();
}

export function targetBody(): BodyDef {
  return getBody(sim.targetId) ?? BODIES[4]!;
}

export function rpOf(el: Elements): number {
  return el.a * (1 - el.e);
}
export function raOf(el: Elements): number {
  return el.a * (1 + el.e);
}

function touchOrbit(): void {
  sim.orbitStamp += 1;
  sim.plan = null;
}

export function sliderToWarp(s: number): number {
  if (s <= 0.001) return 0;
  return 0.5 * 10 ** (s * 4);
}
export function warpToSlider(w: number): number {
  if (w <= 0) return 0;
  return clamp(Math.log10(w / 0.5) / 4, 0, 1);
}

export function begin(): void {
  if (sim.phase !== "title") return;
  sim.phase = "cruise";
  sim.focus = "ship";
  recomputePlan();
  say("Vesper is co-orbital with Earth. Arm a node, or let auto-land fly the window.");
}

export function selectTarget(id: string): void {
  if (!getBody(id)) return;
  sim.targetId = id;
  sim.plan = null;
  if (sim.phase !== "title" && sim.phase !== "auto") recomputePlan();
  sim.focus = "target";
  bump();
}

export function setWarp(w: number): void {
  sim.warp = clamp(w, 0, 8000);
  bump();
}
export function setTab(tab: ManeuverTab): void {
  sim.tab = tab;
  bump();
}
export function setNode(node: NodeId): void {
  sim.node = node;
  bump();
}
export function setImpulse(partial: Partial<Sim["impulse"]>): void {
  sim.impulse = { ...sim.impulse, ...partial };
  sim.draft = null;
  bump();
}
export function setView(view: GlobeView): void {
  sim.view = view;
  bump();
}
export function setFocus(focus: Focus): void {
  sim.focus = focus;
  bump();
}
export function setSheet(sheet: Sheet): void {
  sim.sheet = sim.sheet === sheet ? null : sheet;
  bump();
}
export function closeSheet(): void {
  sim.sheet = null;
  bump();
}

export function setDraftApo(ra: number): void {
  sim.draft = { kind: "apo", ra };
  sim.tab = "shape";
  bump();
}
export function setDraftPeri(rp: number): void {
  sim.draft = { kind: "peri", rp };
  sim.tab = "shape";
  bump();
}
export function setDraftInc(incDeg: number): void {
  sim.draft = { kind: "inc", incDeg };
  sim.tab = "shape";
  bump();
}

function remaining(): number {
  return sim.dvBudget - sim.dvUsed;
}

function commitDv(el: Elements, proKms: number, normKms: number, radKms: number, free: boolean): boolean {
  const res = applyDv(el, proKms * KMS, normKms * KMS, radKms * KMS);
  if (!res.el) {
    say(res.reason);
    return false;
  }
  const kms = res.dvAuDay / KMS;
  if (!free && kms > remaining() + 0.05) {
    say("Main tanks are empty. Auto-land can still draw the reserve.");
    return false;
  }
  sim.ship = res.el;
  sim.dvUsed += kms;
  sim.burnFlash = 1;
  touchOrbit();
  refreshApproach();
  if (free && sim.dvUsed > sim.dvBudget) {
    say("Reserve propellant drawn for the arrival burn.");
  } else {
    say(`Burn ${kms.toFixed(2)} km/s · remaining ${(sim.dvBudget - sim.dvUsed).toFixed(1)} km/s`);
  }
  return true;
}

export function fireImpulse(): void {
  if (sim.phase !== "cruise") return;
  const { pro, norm, rad } = sim.impulse;
  if (Math.hypot(pro, norm, rad) < 0.001) {
    say("Set an impulse above zero.");
    return;
  }
  if (sim.node === "here") {
    commitDv(sim.ship, pro, norm, rad, false);
    recomputePlan();
    return;
  }
  const nu = nodeNu(sim.node, sim.ship);
  const left = timeToAnomaly(sim.ship, nu);
  sim.queue = { node: sim.node, pro, norm, rad, left };
  say(left < 0.2 ? "Burning at the node." : "Coasting to the armed node.");
}

export function applyShape(): void {
  if (sim.phase !== "cruise" || !sim.draft) return;
  const el = sim.ship;
  const rp = rpOf(el);
  const ra = raOf(el);
  const d = sim.draft;
  if (d.kind === "apo") {
    const ra2 = Math.max(d.ra, rp + 0.02);
    const a2 = (rp + ra2) / 2;
    if (a2 >= 70) {
      say("That apoapsis leaves the modeled system.");
      return;
    }
    const vOld = Math.sqrt(MU * (2 / rp - 1 / el.a));
    const vNew = Math.sqrt(Math.max(0, MU * (2 / rp - 1 / a2)));
    const dv = (vNew - vOld) / KMS;
    sim.node = "pe";
    sim.queue = { node: "pe", pro: dv, norm: 0, rad: 0, left: timeToAnomaly(el, 0) };
    say("Coasting to periapsis to set apoapsis.");
  } else if (d.kind === "peri") {
    const rp2 = clamp(d.rp, 0.02, ra - 0.02);
    const a2 = (rp2 + ra) / 2;
    const vOld = Math.sqrt(MU * (2 / ra - 1 / el.a));
    const vNew = Math.sqrt(Math.max(0, MU * (2 / ra - 1 / a2)));
    const dv = (vNew - vOld) / KMS;
    sim.node = "ap";
    sim.queue = { node: "ap", pro: dv, norm: 0, rad: 0, left: timeToAnomaly(el, Math.PI) };
    say("Coasting to apoapsis to set periapsis.");
  } else {
    const di = (d.incDeg * Math.PI) / 180 - el.i;
    const nu = nodeNu("an", el);
    const at = { ...el, M: trueToMean(el.e, nu) };
    const v = mag(stateVectors(at).v);
    const dv = (2 * v * Math.sin(di / 2)) / KMS;
    sim.node = "an";
    sim.queue = { node: "an", pro: 0, norm: dv, rad: 0, left: timeToAnomaly(el, nu) };
    say("Coasting to the ascending node for the plane change.");
  }
  bump();
}

function trueToMean(e: number, nu: number): number {
  const c = Math.cos(nu);
  const s = Math.sin(nu);
  const b = Math.sqrt(Math.max(0, 1 - e * e));
  const E = Math.atan2((b * s) / (1 + e * c), (e + c) / (1 + e * c));
  const M = E - e * Math.sin(E);
  return M < 0 ? M + TAU : M;
}

export function ghostElements(): Elements | null {
  if (sim.phase !== "cruise" && sim.phase !== "title") return null;
  if (sim.draft?.kind === "apo" || sim.draft?.kind === "peri" || sim.draft?.kind === "inc") {
    const el = sim.ship;
    const rp = rpOf(el);
    const ra = raOf(el);
    if (sim.draft.kind === "apo") {
      const ra2 = Math.max(sim.draft.ra, rp + 0.02);
      const a = (rp + ra2) / 2;
      const e = clamp((ra2 - rp) / (ra2 + rp), 0, 0.96);
      return { ...el, a, e };
    }
    if (sim.draft.kind === "peri") {
      const rp2 = clamp(sim.draft.rp, 0.02, ra - 0.02);
      const a = (rp2 + ra) / 2;
      const e = clamp((ra - rp2) / (ra + rp2), 0, 0.96);
      return { ...el, a, e };
    }
    return { ...el, i: (sim.draft.incDeg * Math.PI) / 180 };
  }
  const { pro, norm, rad } = sim.impulse;
  if (Math.hypot(pro, norm, rad) < 0.001) return null;
  const base = sim.node === "here" ? sim.ship : propagate(sim.ship, timeToAnomaly(sim.ship, nodeNu(sim.node, sim.ship)));
  const res = applyDv(base, pro * KMS, norm * KMS, rad * KMS);
  return res.el;
}

export function recomputePlan(): void {
  const body = targetBody();
  if (body.group === "exo") {
    sim.plan = {
      kind: "fold",
      tDep: sim.t,
      tof: 0,
      dv1: 0,
      dv2: 0,
      transfer: null,
      arrival: null,
      errAU: 0,
      note: `${body.distanceLy.toFixed(body.distanceLy < 10 ? 2 : 0)} light-years. The globe uses published mass, radius, orbit, and atmosphere — it is not a ballistic flight.`,
    };
    bump();
    return;
  }
  if (body.group === "sun") {
    sim.plan = planSun(sim.ship, sim.t);
    bump();
    return;
  }
  const tgt = bodyElements(body.id, sim.t);
  if (!tgt) return;
  const best = bestTransfer(sim.ship, tgt);
  if (!best) {
    sim.plan = null;
    say("No clean transfer from this orbit. Lower eccentricity, or burn closer to circular.");
    return;
  }
  sim.plan = {
    kind: "ballistic",
    tDep: sim.t + best.tOff,
    tof: best.tof,
    dv1: best.dv1,
    dv2: best.dv2,
    transfer: best.transfer,
    arrival: propagate(tgt, best.tOff + best.tof),
    errAU: best.err,
    note: "Ballistic transfer in the Sun’s gravity. Auto-land waits out the real launch window, then coasts.",
  };
  bump();
}

function planSun(ship: Elements, t: number): Plan {
  const { r, v } = stateVectors(ship);
  const rmag = Math.max(mag(r), 0.05);
  const rp = 0.02;
  const a = (rmag + rp) / 2;
  const vApo = Math.sqrt(MU * (2 / rmag - 1 / a));
  const h = {
    x: r.y * v.z - r.z * v.y,
    y: r.z * v.x - r.x * v.z,
    z: r.x * v.y - r.y * v.x,
  };
  const tang = normalize(cross(h, r));
  const vNew = mul(tang, vApo);
  const transfer = cartesianToElements(r, vNew) ?? ship;
  const tof = timeToAnomaly(transfer, 0);
  return {
    kind: "sun",
    tDep: t,
    tof,
    dv1: mag(sub(vNew, v)),
    dv2: 0,
    transfer,
    arrival: transfer,
    errAU: 0,
    note: "A retrograde burn drops perihelion to 0.02 AU. The walk is a photosphere reconstruction, not a landing.",
  };
}

function cross(a: V3, b: V3): V3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
function normalize(a: V3): V3 {
  const m = mag(a) || 1;
  return mul(a, 1 / m);
}

type Best = {
  tOff: number;
  tof: number;
  dv1: number;
  dv2: number;
  transfer: Elements;
  err: number;
};

export function bestTransfer(ship: Elements, targetNow: Elements): Best | null {
  const n1 = meanMotion(ship.a);
  const n2 = meanMotion(targetNow.a);
  const syn = Math.abs(n1 - n2) < 1e-8 ? periodDays(ship.a) : TAU / Math.abs(n1 - n2);
  const aT = (ship.a + targetNow.a) / 2;
  const tofH = Math.PI * Math.sqrt((aT * aT * aT) / MU);
  let best: Best | null = null;
  let bestLoose: Best | null = null;
  const scales = [0.72, 0.9, 1, 1.15, 1.4];
  for (let i = 0; i < 26; i++) {
    const tOff = ((i + 0.5) / 26) * syn;
    const shipD = propagate(ship, tOff);
    const st = stateVectors(shipD);
    for (const s of scales) {
      const tof = Math.max(12, tofH * s);
      const tgt = propagate(targetNow, tOff + tof);
      const ts = stateVectors(tgt);
      if (mag(ts.r) < 0.02 || mag(st.r) < 0.02) continue;
      const sol = lambert(st.r, ts.r, tof);
      if (!sol) continue;
      const transfer = cartesianToElements(st.r, sol.v1);
      if (!transfer) continue;
      const arr = stateVectors(propagate(transfer, tof));
      const err = mag(sub(arr.r, ts.r));
      const dv1 = mag(sub(sol.v1, st.v));
      const dv2 = mag(sub(ts.v, sol.v2));
      const cand = { tOff, tof, dv1, dv2, transfer, err };
      if (!bestLoose || err < bestLoose.err) bestLoose = cand;
      if (err > 0.2) continue;
      if (!best || dv1 + dv2 < best.dv1 + best.dv2) best = cand;
    }
  }
  return best ?? (bestLoose && bestLoose.err < 0.8 ? bestLoose : null);
}

export function planDvKms(plan: Plan | null): number {
  if (!plan || plan.kind === "fold") return 0;
  return (plan.dv1 + plan.dv2) / KMS;
}

export function autoLand(): void {
  if (sim.phase !== "cruise" && sim.phase !== "globe") return;
  if (sim.phase === "globe") {
    enterSurface();
    return;
  }
  recomputePlan();
  const plan = sim.plan;
  if (!plan) return;
  sim.phase = "auto";
  sim.autoU = 0;
  sim.autoT0 = sim.t;
  sim.autoShip0 = { ...sim.ship };
  sim.queue = null;
  sim.sheet = null;
  sim.autoDur = plan.kind === "fold" ? 6 : plan.kind === "sun" ? 11 : 14;
  sim.focus = "ship";
  bump();
}

export function cancelAuto(): void {
  if (sim.phase !== "auto") return;
  sim.phase = "cruise";
  sim.burnFlash = 0;
  sim.camNonce += 1;
  recomputePlan();
  say("Auto-land cancelled. Orbit left as the burn sequence had it.");
}

export function finishAuto(): void {
  const plan = sim.plan;
  const body = targetBody();
  if (plan?.kind === "ballistic" && plan.arrival) {
    sim.ship = { ...plan.arrival, M: plan.arrival.M + 0.004 };
    sim.t = plan.tDep + plan.tof;
    sim.dvUsed += planDvKms(plan);
  } else if (plan?.kind === "sun" && plan.transfer) {
    const atPeri = propagate(plan.transfer, plan.tof);
    sim.ship = atPeri;
    sim.t = plan.tDep + plan.tof;
    sim.dvUsed += plan.dv1 / KMS;
  }
  if (sim.dvUsed > sim.dvBudget) {
    sim.message = "Reserve propellant covered the transfer.";
    sim.messageAt = sim.elapsed;
  }
  sim.phase = "globe";
  sim.burnFlash = 0;
  sim.sceneEpoch += 1;
  sim.view = body.palette === "star" ? "heat" : "composite";
  bump();
}

export function enterSurface(): void {
  sim.phase = "surface";
  sim.yaw = 0;
  sim.x = 0;
  sim.z = 16;
  sim.hop = 0;
  sim.vy = 0;
  sim.speed = 0;
  sim.nearFact = -1;
  sim.codex = false;
  sim.sheet = null;
  sim.sceneEpoch += 1;
  bump();
}

export function returnToGlobe(): void {
  sim.phase = "globe";
  sim.codex = false;
  sim.sceneEpoch += 1;
  bump();
}

export function returnToFlight(): void {
  const b = targetBody();
  if (b.group === "planet" || b.group === "kuiper") {
    const el = bodyElements(b.id, sim.t);
    if (el) sim.ship = { ...el, M: el.M + 0.02 };
  } else if (b.group === "sun") {
    const v = Math.sqrt(MU / 0.08);
    const el = cartesianToElements({ x: 0.08, y: 0, z: 0 }, { x: 0, y: v, z: 0 });
    if (el) sim.ship = el;
  } else {
    const el = bodyElements("earth", sim.t);
    if (el) sim.ship = { ...el, M: el.M + 0.02 };
    say("Catalog lens closed. Vesper is back on Earth’s orbit.");
  }
  sim.phase = "cruise";
  sim.sceneEpoch += 1;
  sim.camNonce += 1;
  sim.draft = null;
  touchOrbit();
  recomputePlan();
}

export function landIfClose(): void {
  if (!sim.canLand || sim.phase !== "cruise") return;
  sim.phase = "globe";
  sim.sceneEpoch += 1;
  sim.view = targetBody().palette === "star" ? "heat" : "composite";
  say("Capture confirmed. Surface model is live.");
}

function refreshApproach(): void {
  const body = targetBody();
  if (body.group === "exo") {
    sim.missAU = body.distanceLy;
    sim.missEta = 0;
    sim.relKms = 0;
    sim.canLand = false;
    return;
  }
  if (body.group === "sun") {
    const peri = rpOf(sim.ship);
    const nu = trueAnomaly(sim.ship);
    const dNu = Math.abs(Math.atan2(Math.sin(nu), Math.cos(nu)));
    sim.missAU = peri;
    sim.missEta = timeToAnomaly(sim.ship, 0);
    sim.relKms = 0;
    sim.canLand = peri < 0.035 && dNu < 0.45;
    return;
  }
  const tgt = bodyElements(body.id, sim.t);
  if (!tgt) return;
  const horizon = Math.min(Math.max(periodDays(sim.ship.a), periodDays(tgt.a)), 8000);
  let best = Infinity;
  let eta = 0;
  const N = 180;
  const ship0 = sim.ship;
  for (let i = 0; i <= N; i++) {
    const dt = (horizon * i) / N;
    const s = stateVectors(propagate(ship0, dt));
    const g = stateVectors(propagate(tgt, dt));
    const d = mag(sub(s.r, g.r));
    if (d < best) {
      best = d;
      eta = dt;
    }
  }
  sim.missAU = best;
  sim.missEta = eta;
  const sNow = stateVectors(ship0);
  const gNow = stateVectors(tgt);
  sim.relKms = mag(sub(sNow.v, gNow.v)) / KMS;
  const mRatio = body.massKg / 1.98847e30;
  const soi = Math.max(0.01, body.aAU * mRatio ** 0.4);
  const here = mag(sub(sNow.r, gNow.r));
  sim.canLand = here < Math.max(soi * 0.9, 0.025) && sim.relKms < 2.8;
}

function tickQueue(dt: number): void {
  const q = sim.queue;
  if (!q || sim.phase !== "cruise") return;
  const step = Math.min(q.left, Math.max(q.left * (dt / 1.15), dt * 40));
  if (q.left > 0.03) {
    sim.ship = propagate(sim.ship, step);
    sim.t += step;
    q.left -= step;
    sim.burnFlash = 0.2;
    return;
  }
  sim.ship = propagate(sim.ship, Math.max(0, q.left));
  sim.t += Math.max(0, q.left);
  const nu = q.node === "here" ? trueAnomaly(sim.ship) : nodeNu(q.node, sim.ship);
  sim.ship = { ...sim.ship, M: trueToMean(sim.ship.e, nu) };
  sim.queue = null;
  commitDv(sim.ship, q.pro, q.norm, q.rad, false);
  recomputePlan();
}

function tickAuto(dt: number): void {
  const plan = sim.plan;
  if (!plan || !sim.autoShip0) {
    sim.phase = "cruise";
    return;
  }
  sim.autoU += dt / sim.autoDur;
  const u = sim.autoU;
  if (u >= 1) {
    finishAuto();
    return;
  }
  sim.burnFlash = 0;
  if (plan.kind === "fold") return;
  const start = sim.autoShip0;
  if (u < 0.16) {
    const f = u / 0.16;
    const eased = f * f * (3 - 2 * f);
    const dtDays = (plan.tDep - sim.autoT0) * eased;
    sim.t = sim.autoT0 + dtDays;
    sim.ship = propagate(start, dtDays);
    sim.focus = "ship";
  } else if (u < 0.26) {
    sim.t = plan.tDep;
    if (plan.transfer) sim.ship = plan.transfer;
    sim.burnFlash = 1;
    sim.focus = "ship";
  } else if (u < 0.78) {
    const f = (u - 0.26) / 0.52;
    sim.t = plan.tDep + plan.tof * f;
    if (plan.transfer) sim.ship = propagate(plan.transfer, plan.tof * f);
    sim.focus = f < 0.5 ? "ship" : "target";
  } else if (u < 0.9) {
    sim.t = plan.tDep + plan.tof;
    sim.burnFlash = 1;
    if (plan.arrival) sim.ship = plan.arrival;
    else if (plan.transfer) sim.ship = propagate(plan.transfer, plan.tof);
    sim.focus = "target";
  } else {
    sim.burnFlash = 0;
    if (plan.arrival) sim.ship = plan.arrival;
    sim.focus = "target";
  }
}

function moveScale(body: BodyDef): { speed: number; grav: number; jump: number } {
  const g = gOf(body) / 9.80665;
  const gScale = clamp(g, 0.15, 2.5);
  return {
    speed: 9 / Math.sqrt(gScale),
    grav: 22 * gScale,
    jump: 7.2 / Math.sqrt(gScale),
  };
}

function tickWalker(dt: number): void {
  const body = targetBody();
  const { speed, grav, jump } = moveScale(body);
  let steer = 0;
  if (sim.steerOverride !== null) steer = clamp(sim.steerOverride, -1, 1);
  else {
    if (sim.held.has("KeyA") || sim.held.has("ArrowLeft")) steer += 1;
    if (sim.held.has("KeyD") || sim.held.has("ArrowRight")) steer -= 1;
    steer += -sim.stick.x;
    steer = clamp(steer, -1, 1);
  }
  sim.yaw += steer * 2.4 * dt;
  let throttle = 0;
  if (sim.held.has("KeyW") || sim.held.has("ArrowUp")) throttle += 1;
  if (sim.held.has("KeyS") || sim.held.has("ArrowDown")) throttle -= 1;
  throttle += sim.stick.y;
  throttle = clamp(throttle, -1, 1);
  const fx = -Math.sin(sim.yaw);
  const fz = -Math.cos(sim.yaw);
  sim.x = clamp(sim.x + fx * speed * throttle * dt, -78, 78);
  sim.z = clamp(sim.z + fz * speed * throttle * dt, -78, 78);
  sim.speed = speed * Math.max(0, throttle);
  const jumpPressed = sim.held.has("Space");
  if (jumpPressed && sim.hop <= 0.02) sim.vy = jump;
  sim.vy -= grav * dt;
  sim.hop += sim.vy * dt;
  if (sim.hop <= 0) {
    sim.hop = 0;
    sim.vy = 0;
  }
  // Drop jump so a single tap doesn't stick. Callers clear Space if it was a tap;
  // held Space is allowed to hop once because hop>0 blocks retrigger.
  const facts = body.facts;
  let near = -1;
  let best = 6;
  for (let i = 0; i < 4; i++) {
    const b = beaconAt(i);
    const d = Math.hypot(sim.x - b.x, sim.z - b.z);
    if (d < best) {
      best = d;
      near = i % facts.length;
    }
  }
  sim.nearFact = near;
}

export function beaconAt(i: number): { x: number; z: number } {
  const ang = (i / 4) * TAU + 0.5;
  const rad = 22 + (i % 3) * 7;
  return { x: Math.cos(ang) * rad, z: Math.sin(ang) * rad };
}

let approachAcc = 0;

export function tick(dt: number): void {
  const step = Math.min(dt, 0.05);
  sim.elapsed += step;
  if (sim.burnFlash > 0) sim.burnFlash = Math.max(0, sim.burnFlash - step * 1.4);
  if (sim.phase === "title") {
    sim.t += step * 2;
    sim.ship = propagate(sim.ship, step * 2);
    return;
  }
  if (sim.phase === "auto") {
    tickAuto(step);
    return;
  }
  if (sim.phase === "cruise") {
    const days = step * sim.warp;
    if (!sim.queue && days > 0) {
      sim.ship = propagate(sim.ship, days);
      sim.t += days;
    }
    tickQueue(step);
    approachAcc += step;
    if (approachAcc > 0.45) {
      approachAcc = 0;
      refreshApproach();
    }
    return;
  }
  if (sim.phase === "surface") {
    sim.acc += step;
    const fixed = 1 / 60;
    let guard = 0;
    while (sim.acc >= fixed && guard < 4) {
      tickWalker(fixed);
      sim.acc -= fixed;
      guard += 1;
    }
  }
}

export function bindProbe(): void {
  if (typeof window === "undefined") return;
  window.__controlsTest = {
    getYaw: () => sim.yaw,
    getSpeed: () => sim.speed,
    setKeys: (codes: string[]) => {
      sim.held = new Set(codes);
    },
    setSteer: (v: number) => {
      sim.steerOverride = v;
    },
  };
  window.__debugExplore = (id?: string) => {
    if (id && getBody(id)) sim.targetId = id;
    enterSurface();
  };
  window.__debugGlobe = (id?: string) => {
    if (id && getBody(id)) sim.targetId = id;
    sim.phase = "globe";
    sim.sceneEpoch += 1;
    bump();
  };
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
    __debugExplore?: (id?: string) => void;
    __debugGlobe?: (id?: string) => void;
  }
}
