export type V3 = { x: number; y: number; z: number };

export const v3 = (x = 0, y = 0, z = 0): V3 => ({ x, y, z });

export const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const mul = (a: V3, s: number): V3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
export const dot = (a: V3, b: V3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const mag = (a: V3): number => Math.hypot(a.x, a.y, a.z);
export const norm = (a: V3): V3 => {
  const m = mag(a);
  if (m < 1e-12) return { x: 0, y: 0, z: 0 };
  return mul(a, 1 / m);
};
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const TAU = Math.PI * 2;
export const wrapTau = (a: number) => {
  const t = a % TAU;
  return t < 0 ? t + TAU : t;
};
export const deg = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;
