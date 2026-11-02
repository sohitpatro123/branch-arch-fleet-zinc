import { deg, wrapTau } from "./vec";
import { propagate, type Elements } from "./kepler";

export type OrbitInput = {
  aAU: number;
  e: number;
  iDeg: number;
  omDeg: number;
  wDeg: number;
  Ldeg: number;
};

export function baseElements(b: OrbitInput): Elements {
  const Om = deg(b.omDeg);
  const w = deg(b.wDeg);
  const L = deg(b.Ldeg);
  return {
    a: Math.max(b.aAU, 0.01),
    e: b.e,
    i: deg(b.iDeg),
    Om,
    w,
    M: wrapTau(L - Om - w),
  };
}

export function elementsAtTime(el0: Elements, tDays: number): Elements {
  return propagate(el0, tDays);
}

export function equilibriumK(albedo: number, starL: number, aAU: number): number {
  const a = Math.max(aAU, 1e-4);
  const flux = (1 - albedo) * starL / (a * a);
  return 278.5 * Math.pow(Math.max(flux, 1e-8), 0.25);
}

export function gravityMs2(massKg: number, radiusKm: number): number {
  const R = radiusKm * 1000;
  return (6.6743e-11 * massKg) / (R * R);
}
