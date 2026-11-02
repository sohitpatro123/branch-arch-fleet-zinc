import type { Palette } from "./bodies";

function hash(ix: number, iy: number, seed: number): number {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

export function noise2(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smooth(x - x0);
  const ty = smooth(y - y0);
  const v00 = hash(x0, y0, seed);
  const v10 = hash(x0 + 1, y0, seed);
  const v01 = hash(x0, y0 + 1, seed);
  const v11 = hash(x0 + 1, y0 + 1, seed);
  const a = v00 + (v10 - v00) * tx;
  const b = v01 + (v11 - v01) * tx;
  return (a + (b - a) * ty) * 2 - 1;
}

export function fbm2(x: number, y: number, seed: number): number {
  let h = 0;
  let f = 1;
  let a = 0.5;
  for (let o = 0; o < 4; o++) {
    h += a * noise2(x * f, y * f, seed + o * 17);
    f *= 2.03;
    a *= 0.5;
  }
  return h;
}

export function seedOf(id: string): number {
  let h = 216613626;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return Math.abs(h % 9000) + 3;
}

export function ampFor(palette: Palette): number {
  if (palette === "gas" || palette === "icegiant" || palette === "haze" || palette === "venus") return 5.5;
  if (palette === "star") return 3.2;
  if (palette === "ice") return 4.5;
  if (palette === "lava") return 7;
  if (palette === "ocean") return 6;
  return 11;
}

export function heightAt(x: number, z: number, seed: number, amp: number): number {
  return amp * fbm2(x * 0.045, z * 0.045, seed) + amp * 0.35 * fbm2(x * 0.12, z * 0.12, seed + 9);
}

export type RGB = [number, number, number];

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Surface tint shared by the walkable mesh. Values are linear-ish 0–1. */
export function surfaceColor(palette: Palette, h: number, amp: number, n: number): RGB {
  const t = Math.max(0, Math.min(1, (h / Math.max(amp, 0.001)) * 0.5 + 0.5));
  switch (palette) {
    case "earth":
    case "ocean":
      return n > 0.12 ? mix([0.16, 0.28, 0.18], [0.32, 0.3, 0.2], t) : [0.05, 0.16, 0.2];
    case "mars":
      return mix([0.38, 0.16, 0.1], [0.62, 0.34, 0.2], t);
    case "venus":
      return mix([0.42, 0.28, 0.16], [0.62, 0.5, 0.28], t);
    case "gas":
      return mix([0.55, 0.42, 0.28], [0.32, 0.26, 0.2], n * 0.5 + 0.5);
    case "icegiant":
      return mix([0.35, 0.55, 0.58], [0.15, 0.28, 0.38], t);
    case "ice":
      return mix([0.55, 0.62, 0.64], [0.82, 0.86, 0.84], t);
    case "lava":
      return n > 0.25 ? [0.85, 0.28, 0.08] : [0.12, 0.05, 0.04];
    case "star":
      return mix([0.85, 0.32, 0.08], [1, 0.82, 0.45], t);
    case "tholin":
      return mix([0.32, 0.14, 0.1], [0.55, 0.28, 0.16], t);
    case "haze":
      return mix([0.35, 0.4, 0.42], [0.62, 0.58, 0.48], t);
    default:
      return mix([0.28, 0.26, 0.24], [0.5, 0.46, 0.4], t);
  }
}

export function skyFor(palette: Palette): { zenith: RGB; horizon: RGB; sunset: RGB; stars: number } {
  switch (palette) {
    case "earth":
    case "ocean":
      return { zenith: [0.12, 0.28, 0.52], horizon: [0.45, 0.58, 0.66], sunset: [0.85, 0.42, 0.22], stars: 0 };
    case "mars":
      return { zenith: [0.32, 0.16, 0.1], horizon: [0.62, 0.36, 0.24], sunset: [0.25, 0.38, 0.55], stars: 0.15 };
    case "venus":
      return { zenith: [0.72, 0.55, 0.22], horizon: [0.9, 0.72, 0.36], sunset: [0.95, 0.55, 0.2], stars: 0 };
    case "gas":
      return { zenith: [0.42, 0.32, 0.22], horizon: [0.72, 0.58, 0.4], sunset: [0.85, 0.5, 0.25], stars: 0 };
    case "icegiant":
      return { zenith: [0.12, 0.32, 0.4], horizon: [0.45, 0.7, 0.72], sunset: [0.2, 0.45, 0.55], stars: 0 };
    case "ice":
      return { zenith: [0.02, 0.03, 0.06], horizon: [0.35, 0.42, 0.48], sunset: [0.55, 0.4, 0.28], stars: 0.85 };
    case "lava":
      return { zenith: [0.25, 0.06, 0.04], horizon: [0.7, 0.22, 0.08], sunset: [1, 0.45, 0.12], stars: 0.1 };
    case "star":
      return { zenith: [0.55, 0.18, 0.05], horizon: [1, 0.72, 0.3], sunset: [1, 0.9, 0.6], stars: 0 };
    case "tholin":
      return { zenith: [0.04, 0.03, 0.05], horizon: [0.28, 0.14, 0.1], sunset: [0.45, 0.2, 0.12], stars: 0.9 };
    case "haze":
      return { zenith: [0.22, 0.26, 0.3], horizon: [0.62, 0.6, 0.5], sunset: [0.7, 0.45, 0.28], stars: 0 };
    default:
      return { zenith: [0.05, 0.05, 0.07], horizon: [0.28, 0.26, 0.24], sunset: [0.55, 0.32, 0.2], stars: 0.4 };
  }
}
