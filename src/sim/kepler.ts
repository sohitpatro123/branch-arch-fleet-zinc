import { add, clamp, cross, dot, mag, mul, norm, sub, TAU, wrapTau, type V3 } from "./vec";

/** Heliocentric gravitational parameter, AU^3 / day^2. */
export const MU = 2.959122082855911e-4;
export const AU_KM = 149597870.7;
/** km/s → AU/day */
export const KMS = 86400 / AU_KM;

export type Elements = {
  a: number;
  e: number;
  i: number;
  Om: number;
  w: number;
  /** Mean anomaly, radians. */
  M: number;
};

export function meanMotion(a: number, mu = MU): number {
  return Math.sqrt(mu / (a * a * a));
}

export function periodDays(a: number, mu = MU): number {
  return TAU / meanMotion(a, mu);
}

function solveKepler(M: number, e: number): number {
  const m = wrapTau(M);
  let E = e < 0.8 ? m : Math.PI;
  for (let k = 0; k < 16; k++) {
    const f = E - e * Math.sin(E) - m;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

function rotatePQW(p: V3, el: Elements): V3 {
  const cO = Math.cos(el.Om);
  const sO = Math.sin(el.Om);
  const ci = Math.cos(el.i);
  const si = Math.sin(el.i);
  const cw = Math.cos(el.w);
  const sw = Math.sin(el.w);
  const r11 = cO * cw - sO * sw * ci;
  const r12 = -cO * sw - sO * cw * ci;
  const r21 = sO * cw + cO * sw * ci;
  const r22 = -sO * sw + cO * cw * ci;
  const r31 = sw * si;
  const r32 = cw * si;
  return {
    x: r11 * p.x + r12 * p.y,
    y: r21 * p.x + r22 * p.y,
    z: r31 * p.x + r32 * p.y,
  };
}

export function trueAnomalyFromE(E: number, e: number): number {
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  return Math.atan2(Math.sqrt(Math.max(0, 1 - e * e)) * sinE, cosE - e);
}

export function eccentricFromTrue(nu: number, e: number): number {
  const c = Math.cos(nu);
  const s = Math.sin(nu);
  const b = Math.sqrt(Math.max(0, 1 - e * e));
  return Math.atan2((b * s) / (1 + e * c), (e + c) / (1 + e * c));
}

export function meanFromTrue(nu: number, e: number): number {
  const E = eccentricFromTrue(nu, e);
  return wrapTau(E - e * Math.sin(E));
}

export function trueAnomaly(el: Elements): number {
  const e = clamp(el.e, 0, 0.989);
  return wrapTau(trueAnomalyFromE(solveKepler(el.M, e), e));
}

export function stateVectors(el: Elements, mu = MU): { r: V3; v: V3 } {
  const e = clamp(el.e, 0, 0.989);
  const a = Math.max(el.a, 1e-4);
  const E = solveKepler(el.M, e);
  const cosE = Math.cos(E);
  const nu = trueAnomalyFromE(E, e);
  const rmag = a * (1 - e * cosE);
  const cN = Math.cos(nu);
  const sN = Math.sin(nu);
  const perifocalR = { x: rmag * cN, y: rmag * sN, z: 0 };
  const p = Math.max(a * (1 - e * e), 1e-8);
  const s = Math.sqrt(mu / p);
  const perifocalV = { x: -s * sN, y: s * (e + cN), z: 0 };
  return { r: rotatePQW(perifocalR, el), v: rotatePQW(perifocalV, el) };
}

export function propagate(el: Elements, dtDays: number, mu = MU): Elements {
  return { ...el, M: el.M + meanMotion(el.a, mu) * dtDays };
}

export function cartesianToElements(r: V3, v: V3, mu = MU): Elements | null {
  const rmag = mag(r);
  const vmag = mag(v);
  if (rmag < 1e-8) return null;
  const energy = (vmag * vmag) / 2 - mu / rmag;
  if (energy >= -1e-14) return null;
  const a = -mu / (2 * energy);
  const h = cross(r, v);
  const hmag = mag(h);
  if (hmag < 1e-12) return null;
  const nvec = cross({ x: 0, y: 0, z: 1 }, h);
  const nmag = mag(nvec);
  const eVec = sub(mul(cross(v, h), 1 / mu), mul(r, 1 / rmag));
  let e = mag(eVec);
  if (e >= 0.989) return null;
  if (a < 0.012 || a > 80 || !isFinite(a)) return null;

  let i = Math.acos(clamp(h.z / hmag, -1, 1));
  let Om = 0;
  let w = 0;
  let nu = 0;
  if (nmag > 1e-10) {
    Om = Math.acos(clamp(nvec.x / nmag, -1, 1));
    if (nvec.y < 0) Om = TAU - Om;
  }
  if (e < 1e-8) e = 0;
  if (nmag > 1e-10 && e > 1e-8) {
    w = Math.acos(clamp(dot(nvec, eVec) / (nmag * e), -1, 1));
    if (eVec.z < 0) w = TAU - w;
  } else if (e > 1e-8) {
    w = Math.atan2(eVec.y, eVec.x);
    if (h.z < 0) w = TAU - w;
    if (w < 0) w += TAU;
  }
  if (e > 1e-8) {
    nu = Math.acos(clamp(dot(eVec, r) / (e * rmag), -1, 1));
    if (dot(r, v) < 0) nu = TAU - nu;
  } else if (nmag > 1e-10) {
    nu = Math.acos(clamp(dot(nvec, r) / (nmag * rmag), -1, 1));
    if (r.z < 0) nu = TAU - nu;
    w = 0;
  } else {
    nu = Math.atan2(r.y, r.x);
    if (nu < 0) nu += TAU;
    w = 0;
    Om = 0;
  }
  const M = meanFromTrue(nu, e);
  return { a, e, i, Om, w, M };
}

function stumpffC(z: number): number {
  if (z > 1e-4) return (1 - Math.cos(Math.sqrt(z))) / z;
  if (z < -1e-4) return (1 - Math.cosh(Math.sqrt(-z))) / z;
  return 0.5 - z / 24 + (z * z) / 720 - (z * z * z) / 40320;
}

function stumpffS(z: number): number {
  if (z > 1e-4) {
    const s = Math.sqrt(z);
    return (s - Math.sin(s)) / (s * s * s);
  }
  if (z < -1e-4) {
    const s = Math.sqrt(-z);
    return (Math.sinh(s) - s) / (s * s * s);
  }
  return 1 / 6 - z / 120 + (z * z) / 5040 - (z * z * z) / 362880;
}

export type Lambert = { v1: V3; v2: V3 };

/**
 * Universal-variable Lambert (Curtis). Single revolution.
 * Near-180° geometry is regularized with a tiny out-of-plane lift.
 */
export function lambert(r1in: V3, r2in: V3, tof: number, mu = MU, prograde = true): Lambert | null {
  const r1 = r1in;
  let r2 = r2in;
  const r1m = mag(r1);
  const r2m0 = mag(r2);
  if (r1m < 1e-6 || r2m0 < 1e-6 || tof <= 1e-4) return null;
  let cos0 = clamp(dot(r1, r2) / (r1m * r2m0), -1, 1);
  if (cos0 < -0.9995) {
    const axis = Math.abs(r1.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const lift = norm(cross(r1, axis));
    r2 = add(r2, mul(lift, r2m0 * 1e-3));
    cos0 = clamp(dot(r1, r2) / (r1m * mag(r2)), -1, 1);
  }
  const r2m = mag(r2);
  const cz = r1.x * r2.y - r1.y * r2.x;
  let dnu = Math.acos(clamp(cos0, -1, 1));
  if (prograde) {
    if (cz < 0) dnu = TAU - dnu;
  } else if (cz > 0) {
    dnu = TAU - dnu;
  }
  const denom = Math.max(1e-8, 1 - Math.cos(dnu));
  const A = (Math.sin(dnu) * Math.sqrt(r1m * r2m)) / Math.sqrt(denom);
  if (!isFinite(A) || Math.abs(A) < 1e-8) return null;

  const yOf = (z: number) => {
    const c = stumpffC(z);
    if (c <= 1e-8) return -1;
    return r1m + r2m + (A * (z * stumpffS(z) - 1)) / Math.sqrt(c);
  };
  const tofOf = (z: number) => {
    const y = yOf(z);
    if (!(y > 0)) return Number.NaN;
    const c = stumpffC(z);
    const s = stumpffS(z);
    return (Math.pow(y / c, 1.5) * s + A * Math.sqrt(y)) / Math.sqrt(mu);
  };

  let zLo = -4 * Math.PI;
  for (let i = 0; i < 24 && !(yOf(zLo) > 0); i++) zLo += 0.4;
  let zHi = 4 * Math.PI * Math.PI;
  let tLo = tofOf(zLo);
  let tHi = tofOf(zHi);
  for (let i = 0; i < 10 && !(isFinite(tHi) && tHi > tof); i++) {
    zHi *= 1.5;
    tHi = tofOf(zHi);
  }
  if (!isFinite(tLo) || !isFinite(tHi) || tLo > tof || tHi < tof) {
    // Try the long-way branch once by flipping prograde if the short way can't reach tof.
    if (prograde) return lambert(r1in, r2in, tof, mu, false);
    return null;
  }
  let z = 0;
  for (let i = 0; i < 50; i++) {
    z = 0.5 * (zLo + zHi);
    const t = tofOf(z);
    if (!isFinite(t)) {
      zLo = z;
      continue;
    }
    if (Math.abs(t - tof) / tof < 1e-5) break;
    if (t < tof) zLo = z;
    else zHi = z;
  }
  const y = yOf(z);
  if (!(y > 0)) return null;
  const f = 1 - y / r1m;
  const g = A * Math.sqrt(y / mu);
  const gdot = 1 - y / r2m;
  if (!(Math.abs(g) > 1e-10)) return null;
  const v1 = mul(sub(r2, mul(r1, f)), 1 / g);
  const v2 = mul(sub(mul(r2, gdot), r1), 1 / g);
  if (![v1.x, v1.y, v1.z, v2.x, v2.y, v2.z].every(Number.isFinite)) return null;
  return { v1, v2 };
}

export function nodeNu(which: "pe" | "ap" | "an" | "dn", el: Elements): number {
  if (which === "pe") return 0;
  if (which === "ap") return Math.PI;
  if (which === "an") return wrapTau(-el.w);
  return wrapTau(Math.PI - el.w);
}

/** Days to advance from the current true anomaly to `nu`, forward only. */
export function timeToAnomaly(el: Elements, nu: number, mu = MU): number {
  const e = clamp(el.e, 0, 0.989);
  const nu0 = trueAnomaly(el);
  const E0 = eccentricFromTrue(nu0, e);
  const E1 = eccentricFromTrue(wrapTau(nu), e);
  const M0 = wrapTau(E0 - e * Math.sin(E0));
  const M1 = wrapTau(E1 - e * Math.sin(E1));
  let dM = M1 - M0;
  if (dM < 1e-4) dM += TAU;
  return dM / meanMotion(el.a, mu);
}

export type BurnResult = { el: Elements; dvAuDay: number } | { el: null; reason: string };

export function applyDv(el: Elements, dvPro: number, dvNormal: number, dvRadial: number, mu = MU): BurnResult {
  const { r, v } = stateVectors(el, mu);
  const rhat = norm(r);
  const vmag = mag(v);
  const vhat = vmag > 1e-10 ? norm(v) : norm(cross({ x: 0, y: 0, z: 1 }, rhat));
  const nh = norm(cross(r, v));
  const v2 = add(add(add(v, mul(vhat, dvPro)), mul(nh, dvNormal)), mul(rhat, dvRadial));
  const next = cartesianToElements(r, v2, mu);
  if (!next) return { el: null, reason: "That burn leaves a bound solar orbit." };
  return { el: next, dvAuDay: Math.hypot(dvPro, dvNormal, dvRadial) };
}

export function selfTest(): void {
  const fails: string[] = [];
  const check = (name: string, cond: boolean, extra = "") => {
    if (!cond) fails.push(`${name} ${extra}`);
  };

  const vCirc = Math.sqrt(MU);
  const el = cartesianToElements({ x: 1, y: 0, z: 0 }, { x: 0, y: vCirc, z: 0 });
  check("circular a", !!el && Math.abs(el.a - 1) < 1e-3, JSON.stringify(el));
  check("circular e", !!el && el.e < 1e-3, String(el?.e));
  if (el) {
    const st = stateVectors(el);
    check("roundtrip r", Math.abs(mag(st.r) - 1) < 1e-3, String(mag(st.r)));
    check("period", Math.abs(periodDays(1) - 365.256) < 0.05, String(periodDays(1)));
  }

  // Quarter-circle Lambert, mu-canonical scaled: use real mu, r=1, 90°, tof = period/4
  const tofQ = periodDays(1) / 4;
  const sol = lambert({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, tofQ);
  check("lambert 90", !!sol, "no solution");
  if (sol) {
    const speed = mag(sol.v1);
    check("lambert 90 speed", Math.abs(speed - vCirc) / vCirc < 0.05, String(speed));
    const el2 = cartesianToElements({ x: 1, y: 0, z: 0 }, sol.v1);
    check("lambert bound", !!el2);
    if (el2) {
      const at = stateVectors(propagate(el2, tofQ));
      const err = mag(sub(at.r, { x: 0, y: 1, z: 0 }));
      check("lambert arrives", err < 0.03, String(err));
    }
  }

  // Near-Hohmann Earth → Mars radii
  const r2m = 1.524;
  const aT = (1 + r2m) / 2;
  const tofH = Math.PI * Math.sqrt((aT * aT * aT) / MU);
  const hoh = lambert({ x: 1, y: 0, z: 0 }, { x: -r2m, y: 0.02, z: 0.01 }, tofH);
  check("hohmann sol", !!hoh);
  if (hoh) {
    const vp = mag(hoh.v1) / KMS;
    check("hohmann vp km/s", vp > 30 && vp < 36, String(vp));
    const elH = cartesianToElements({ x: 1, y: 0, z: 0 }, hoh.v1);
    if (elH) {
      const arr = stateVectors(propagate(elH, tofH));
      const err = Math.hypot(arr.r.x + r2m, arr.r.y, arr.r.z);
      check("hohmann position", err < 0.08, String(err));
    }
  }

  // Prograde burn raises apoapsis
  if (el) {
    const burned = applyDv(el, 0.002, 0, 0);
    check("burn raises a", burned.el !== null && burned.el.a > 1.2, String(burned.el?.a));
  }

  if (fails.length) {
    throw new Error(fails.join("\n"));
  }
}
