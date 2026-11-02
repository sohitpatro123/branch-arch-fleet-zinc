import { a as ghostElements, c as BODIES, d as getBody, f as meanFromTrue, i as bump, l as bodyElements, n as begin, o as sim, p as stateVectors, r as bindProbe, s as tick, u as displayTemp } from "./routes-DXQkq7AB.mjs";
import { A as Timer, C as Points, D as Scene, E as SRGBColorSpace, O as ShaderMaterial, S as PointLight, T as RingGeometry, _ as Mesh, a as BufferAttribute, b as PerspectiveCamera, c as Color, d as DirectionalLight, f as Group, g as MathUtils, h as LineBasicMaterial, i as BoxGeometry, j as Vector3, k as SphereGeometry, l as ConeGeometry, m as Line, n as WebGLRenderer, o as BufferGeometry, p as HemisphereLight, r as AmbientLight, s as CapsuleGeometry, t as OrbitControls, u as CylinderGeometry, v as MeshBasicMaterial, w as PointsMaterial, x as PlaneGeometry, y as MeshStandardMaterial } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/world-CqIV-iv7.js
var NOISE = `
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x),
        mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
        mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise3(p);
    p = p * 2.02 + vec3(1.7, 9.2, 2.4);
    a *= 0.5;
  }
  return v;
}
vec3 heatRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.02, 0.03, 0.07);
  vec3 c1 = vec3(0.35, 0.08, 0.08);
  vec3 c2 = vec3(0.85, 0.32, 0.08);
  vec3 c3 = vec3(0.98, 0.82, 0.45);
  vec3 c4 = vec3(1.0, 0.97, 0.94);
  if (t < 0.25) return mix(c0, c1, t / 0.25);
  if (t < 0.5) return mix(c1, c2, (t - 0.25) / 0.25);
  if (t < 0.75) return mix(c2, c3, (t - 0.5) / 0.25);
  return mix(c3, c4, (t - 0.75) / 0.25);
}
`;
var GLOBE_VERT = `
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vLocal = position;
  vWorld = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
  #include <logdepthbuf_vertex>
}
`;
var GLOBE_FRAG = `
precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uHeat;
uniform float uKind;
uniform float uTeq;
uniform float uSeed;
uniform vec3 uSun;
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
${NOISE}
void main() {
  vec3 sp = normalize(vLocal);
  vec3 n = normalize(vN);
  float lat = sp.y;
  float ndl = dot(n, normalize(uSun));
  float day = smoothstep(-0.12, 0.28, ndl);
  float nse = fbm(sp * 2.6 + vec3(uSeed));
  float n2 = fbm(sp * 6.0 + vec3(uSeed * 1.7));
  vec3 albedo = vec3(0.35, 0.32, 0.28);

  if (uKind < 0.5) {
    float land = smoothstep(0.46, 0.58, nse);
    albedo = mix(vec3(0.10, 0.18, 0.20), vec3(0.28, 0.26, 0.22), land);
    albedo = mix(albedo, vec3(0.42, 0.40, 0.36), n2 * land);
  } else if (uKind < 1.5) {
    float band = sin(lat * 16.0 + fbm(sp * 3.0 + vec3(uSeed)) * 1.4);
    float band2 = sin(lat * 42.0 + 1.7);
    albedo = mix(vec3(0.62, 0.50, 0.36), vec3(0.32, 0.24, 0.18), band * 0.5 + 0.5);
    albedo = mix(albedo, vec3(0.72, 0.58, 0.40), band2 * 0.15 + 0.1);
    float spot = length(sp - vec3(0.55, -0.28, 0.45));
    albedo = mix(albedo, vec3(0.55, 0.22, 0.14), smoothstep(0.22, 0.05, spot));
  } else if (uKind < 2.5) {
    float band = sin(lat * 10.0 + fbm(sp * 2.0) * 0.6);
    albedo = mix(vec3(0.45, 0.70, 0.72), vec3(0.12, 0.28, 0.42), band * 0.5 + 0.5);
  } else if (uKind < 3.5) {
    albedo = mix(vec3(0.62, 0.70, 0.72), vec3(0.88, 0.92, 0.93), nse);
    float crev = smoothstep(0.55, 0.2, n2);
    albedo *= 0.75 + 0.25 * crev;
  } else if (uKind < 4.5) {
    albedo = vec3(0.10, 0.04, 0.03);
    float crack = smoothstep(0.52, 0.78, n2);
    albedo = mix(albedo, vec3(1.0, 0.42, 0.08), crack);
  } else if (uKind < 5.5) {
    albedo = vec3(0.78, 0.66, 0.40) * (0.88 + 0.16 * nse);
  } else if (uKind < 6.5) {
    float g = fbm(sp * 9.0 + vec3(uSeed, uSeed * 0.2, 0.4));
    albedo = mix(vec3(0.95, 0.32, 0.05), vec3(1.0, 0.86, 0.55), g);
    float limb = pow(1.0 - abs(ndl), 0.45);
    albedo *= 0.55 + 0.45 * (1.0 - limb * 0.35);
  } else if (uKind < 7.5) {
    albedo = mix(vec3(0.45, 0.18, 0.10), vec3(0.70, 0.38, 0.22), nse);
    if (abs(lat) > 0.78) albedo = mix(albedo, vec3(0.82, 0.84, 0.82), smoothstep(0.78, 0.92, abs(lat)));
  } else if (uKind < 8.5) {
    float land = smoothstep(0.42, 0.55, nse);
    vec3 sea = vec3(0.05, 0.18, 0.26);
    vec3 shore = vec3(0.20, 0.32, 0.18);
    vec3 dry = vec3(0.36, 0.32, 0.20);
    albedo = mix(sea, mix(shore, dry, n2), land);
    if (abs(lat) > 0.75) albedo = mix(albedo, vec3(0.82, 0.86, 0.88), smoothstep(0.75, 0.9, abs(lat)));
  } else if (uKind < 9.5) {
    albedo = mix(vec3(0.28, 0.12, 0.09), vec3(0.55, 0.26, 0.14), nse);
  } else {
    albedo = mix(vec3(0.42, 0.46, 0.48), vec3(0.70, 0.62, 0.48), nse);
  }

  float temp = uTeq * mix(0.42, 1.08, day) * (1.0 - 0.18 * abs(lat));
  if (uKind > 5.5 && uKind < 6.5) temp = uTeq;
  float tn = clamp((temp - 30.0) / (max(uTeq, 80.0) + 40.0), 0.0, 1.0);
  vec3 heat = heatRamp(tn);

  vec3 lit = albedo * mix(0.035, 1.0, day);
  if (uKind > 3.5 && uKind < 4.5) lit += vec3(1.0, 0.35, 0.05) * smoothstep(0.55, 0.85, n2) * (0.45 + 0.55 * day);
  if (uKind > 7.5 && uKind < 8.5) {
    float cities = smoothstep(0.62, 0.82, fbm(sp * 14.0 + vec3(uSeed)));
    float land = smoothstep(0.42, 0.55, nse);
    lit += vec3(0.95, 0.82, 0.55) * cities * land * (1.0 - day) * 0.55;
  }
  vec3 comp = lit + heat * (1.0 - day) * 0.8;
  vec3 color = (uKind > 5.5 && uKind < 6.5) ? albedo : (uHeat > 0.75 ? heat : (uHeat < 0.25 ? lit : comp));
  gl_FragColor = vec4(color, 1.0);
  #include <logdepthbuf_fragment>
}
`;
var CLOUD_FRAG = `
precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uTime;
uniform float uKind;
uniform float uCover;
uniform float uSeed;
uniform vec3 uSun;
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
${NOISE}
void main() {
  vec3 sp = normalize(vLocal);
  vec3 n = normalize(vN);
  float ndl = dot(n, normalize(uSun));
  float day = smoothstep(-0.05, 0.35, ndl);
  vec3 wind = (uKind < 1.5 || (uKind > 1.5 && uKind < 2.5))
    ? vec3(uTime * 0.015, 0.0, 0.0)
    : vec3(uTime * 0.008, uTime * 0.002, 0.0);
  float lat = sp.y;
  float bands = 0.5 + 0.5 * sin(lat * 14.0);
  float puff = fbm(sp * vec3(3.0, 7.0, 3.0) + vec3(uSeed) + wind);
  float mask = smoothstep(0.42, 0.72, puff);
  if (uKind > 0.5 && uKind < 2.5) mask = smoothstep(0.35, 0.8, bands * 0.45 + puff * 0.7);
  float alpha = mask * uCover * (0.25 + 0.75 * day);
  if (alpha < 0.02) discard;
  vec3 col = vec3(0.82, 0.84, 0.86) * (0.35 + 0.65 * day);
  if (uKind > 4.5 && uKind < 5.5) col = vec3(0.86, 0.78, 0.52) * (0.45 + 0.55 * day);
  if (uKind > 1.5 && uKind < 2.5) col = vec3(0.75, 0.88, 0.9) * (0.4 + 0.6 * day);
  gl_FragColor = vec4(col, alpha);
  #include <logdepthbuf_fragment>
}
`;
var ATMO_FRAG = `
precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uSun;
uniform vec3 uRay;
uniform vec3 uSet;
uniform float uWidth;
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
void main() {
  vec3 n = normalize(vN);
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 1.7);
  float ndl = dot(n, normalize(uSun));
  float day = smoothstep(-0.15, 0.45, ndl);
  float twilight = exp(-ndl * ndl * (10.0 - uWidth * 6.0));
  vec3 col = uRay * fres * day + uSet * fres * twilight * 1.15;
  float alpha = clamp(fres * (0.55 + twilight), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
  #include <logdepthbuf_fragment>
}
`;
var SUN_FRAG = `
precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uTime;
varying vec3 vN;
varying vec3 vLocal;
varying vec3 vWorld;
${NOISE}
void main() {
  vec3 sp = normalize(vLocal);
  float g = fbm(sp * 7.0 + vec3(uTime * 0.03, 0.0, uTime * 0.02));
  float g2 = fbm(sp * 16.0 - vec3(uTime * 0.05));
  vec3 col = mix(vec3(0.92, 0.28, 0.04), vec3(1.0, 0.86, 0.5), g);
  col = mix(col, vec3(1.0, 0.95, 0.8), smoothstep(0.55, 0.85, g2) * 0.35);
  float limb = pow(1.0 - abs(dot(normalize(vN), normalize(cameraPosition))), 0.6);
  col *= 1.0 - limb * 0.45;
  gl_FragColor = vec4(col, 1.0);
  #include <logdepthbuf_fragment>
}
`;
var SKY_FRAG = `
precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunset;
uniform vec3 uSun;
uniform float uStars;
varying vec3 vDir;
float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
void main() {
  vec3 d = normalize(vDir);
  vec3 col = mix(uHorizon, uZenith, smoothstep(-0.05, 0.65, d.y));
  vec3 sun = normalize(uSun);
  float graz = pow(max(dot(normalize(vec3(sun.x, 0.0, sun.z)), normalize(vec3(d.x, 0.0, d.z))), 0.0), 3.0);
  float band = exp(-d.y * d.y * 6.0);
  col = mix(col, uSunset, band * graz * 0.85);
  float disk = pow(max(dot(d, sun), 0.0), 900.0);
  float glow = pow(max(dot(d, sun), 0.0), 6.0);
  col += vec3(1.0, 0.96, 0.9) * disk * 1.4;
  col += uSunset * glow * 0.45;
  float s = step(0.997, hash(floor(d * 180.0)));
  col += vec3(s) * uStars * smoothstep(0.05, 0.4, d.y);
  gl_FragColor = vec4(col, 1.0);
  #include <logdepthbuf_fragment>
}
`;
var SKY_VERT = `
varying vec3 vDir;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vDir = position;
  gl_Position = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`;
function hash(ix, iy, seed) {
	let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
	n = Math.imul(n ^ n >>> 13, 1274126177);
	return ((n ^ n >>> 16) >>> 0) / 4294967295;
}
var smooth = (t) => t * t * (3 - 2 * t);
function noise2(x, y, seed) {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const tx = smooth(x - x0);
	const ty = smooth(y - y0);
	const v00 = hash(x0, y0, seed);
	const v10 = hash(x0 + 1, y0, seed);
	const v01 = hash(x0, y0 + 1, seed);
	const v11 = hash(x0 + 1, y0 + 1, seed);
	const a = v00 + (v10 - v00) * tx;
	return (a + (v01 + (v11 - v01) * tx - a) * ty) * 2 - 1;
}
function fbm2(x, y, seed) {
	let h = 0;
	let f = 1;
	let a = .5;
	for (let o = 0; o < 4; o++) {
		h += a * noise2(x * f, y * f, seed + o * 17);
		f *= 2.03;
		a *= .5;
	}
	return h;
}
function seedOf(id) {
	let h = 216613626;
	for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
	return Math.abs(h % 9e3) + 3;
}
function ampFor(palette) {
	if (palette === "gas" || palette === "icegiant" || palette === "haze" || palette === "venus") return 5.5;
	if (palette === "star") return 3.2;
	if (palette === "ice") return 4.5;
	if (palette === "lava") return 7;
	if (palette === "ocean") return 6;
	return 11;
}
function heightAt(x, z, seed, amp) {
	return amp * fbm2(x * .045, z * .045, seed) + amp * .35 * fbm2(x * .12, z * .12, seed + 9);
}
function mix(a, b, t) {
	return [
		a[0] + (b[0] - a[0]) * t,
		a[1] + (b[1] - a[1]) * t,
		a[2] + (b[2] - a[2]) * t
	];
}
/** Surface tint shared by the walkable mesh. Values are linear-ish 0–1. */
function surfaceColor(palette, h, amp, n) {
	const t = Math.max(0, Math.min(1, h / Math.max(amp, .001) * .5 + .5));
	switch (palette) {
		case "earth":
		case "ocean": return n > .12 ? mix([
			.16,
			.28,
			.18
		], [
			.32,
			.3,
			.2
		], t) : [
			.05,
			.16,
			.2
		];
		case "mars": return mix([
			.38,
			.16,
			.1
		], [
			.62,
			.34,
			.2
		], t);
		case "venus": return mix([
			.42,
			.28,
			.16
		], [
			.62,
			.5,
			.28
		], t);
		case "gas": return mix([
			.55,
			.42,
			.28
		], [
			.32,
			.26,
			.2
		], n * .5 + .5);
		case "icegiant": return mix([
			.35,
			.55,
			.58
		], [
			.15,
			.28,
			.38
		], t);
		case "ice": return mix([
			.55,
			.62,
			.64
		], [
			.82,
			.86,
			.84
		], t);
		case "lava": return n > .25 ? [
			.85,
			.28,
			.08
		] : [
			.12,
			.05,
			.04
		];
		case "star": return mix([
			.85,
			.32,
			.08
		], [
			1,
			.82,
			.45
		], t);
		case "tholin": return mix([
			.32,
			.14,
			.1
		], [
			.55,
			.28,
			.16
		], t);
		case "haze": return mix([
			.35,
			.4,
			.42
		], [
			.62,
			.58,
			.48
		], t);
		default: return mix([
			.28,
			.26,
			.24
		], [
			.5,
			.46,
			.4
		], t);
	}
}
function skyFor(palette) {
	switch (palette) {
		case "earth":
		case "ocean": return {
			zenith: [
				.12,
				.28,
				.52
			],
			horizon: [
				.45,
				.58,
				.66
			],
			sunset: [
				.85,
				.42,
				.22
			],
			stars: 0
		};
		case "mars": return {
			zenith: [
				.32,
				.16,
				.1
			],
			horizon: [
				.62,
				.36,
				.24
			],
			sunset: [
				.25,
				.38,
				.55
			],
			stars: .15
		};
		case "venus": return {
			zenith: [
				.72,
				.55,
				.22
			],
			horizon: [
				.9,
				.72,
				.36
			],
			sunset: [
				.95,
				.55,
				.2
			],
			stars: 0
		};
		case "gas": return {
			zenith: [
				.42,
				.32,
				.22
			],
			horizon: [
				.72,
				.58,
				.4
			],
			sunset: [
				.85,
				.5,
				.25
			],
			stars: 0
		};
		case "icegiant": return {
			zenith: [
				.12,
				.32,
				.4
			],
			horizon: [
				.45,
				.7,
				.72
			],
			sunset: [
				.2,
				.45,
				.55
			],
			stars: 0
		};
		case "ice": return {
			zenith: [
				.02,
				.03,
				.06
			],
			horizon: [
				.35,
				.42,
				.48
			],
			sunset: [
				.55,
				.4,
				.28
			],
			stars: .85
		};
		case "lava": return {
			zenith: [
				.25,
				.06,
				.04
			],
			horizon: [
				.7,
				.22,
				.08
			],
			sunset: [
				1,
				.45,
				.12
			],
			stars: .1
		};
		case "star": return {
			zenith: [
				.55,
				.18,
				.05
			],
			horizon: [
				1,
				.72,
				.3
			],
			sunset: [
				1,
				.9,
				.6
			],
			stars: 0
		};
		case "tholin": return {
			zenith: [
				.04,
				.03,
				.05
			],
			horizon: [
				.28,
				.14,
				.1
			],
			sunset: [
				.45,
				.2,
				.12
			],
			stars: .9
		};
		case "haze": return {
			zenith: [
				.22,
				.26,
				.3
			],
			horizon: [
				.62,
				.6,
				.5
			],
			sunset: [
				.7,
				.45,
				.28
			],
			stars: 0
		};
		default: return {
			zenith: [
				.05,
				.05,
				.07
			],
			horizon: [
				.28,
				.26,
				.24
			],
			sunset: [
				.55,
				.32,
				.2
			],
			stars: .4
		};
	}
}
var TAU = Math.PI * 2;
function visualRadius(b) {
	if (b.id === "sun") return .16;
	return .0105 * Math.max(b.radiusKm / 6371, .04) ** .3 + .0038;
}
function kindOf(p) {
	switch (p) {
		case "gas": return 1;
		case "icegiant": return 2;
		case "ice": return 3;
		case "lava": return 4;
		case "venus": return 5;
		case "star": return 6;
		case "mars": return 7;
		case "earth":
		case "ocean": return 8;
		case "tholin": return 9;
		case "haze": return 10;
		default: return 0;
	}
}
function tint(p) {
	switch (p) {
		case "earth":
		case "ocean": return 7244934;
		case "mars": return 10574908;
		case "venus": return 12758650;
		case "gas": return 12760474;
		case "icegiant": return 8362662;
		case "ice": return 14015960;
		case "lava": return 11029298;
		case "tholin": return 9067080;
		case "haze": return 9083556;
		default: return 10129544;
	}
}
function airColors(b) {
	const a = b.atm;
	const ray = new Color(.02, .03, .05);
	ray.r += .25 * a.n2 + .2 * a.o2 + .75 * a.co2 + .08 * a.ch4 + .7 * a.so2 + .45 * a.h2 + .4 * a.h2o;
	ray.g += .45 * a.n2 + .5 * a.o2 + .62 * a.co2 + .55 * a.ch4 + .55 * a.so2 + .5 * a.h2 + .55 * a.h2o + .35 * a.nh3;
	ray.b += .85 * a.n2 + .95 * a.o2 + .28 * a.co2 + .62 * a.ch4 + .18 * a.so2 + .55 * a.h2 + .6 * a.he;
	const set = ray.clone();
	if (a.ch4 > .01 && a.h2 > .4) set.setRGB(.25, .55, .6);
	else if (a.co2 > .5) set.setRGB(.85, .55, .25);
	else if (b.palette === "mars") set.setRGB(.35, .5, .7);
	else set.setRGB(Math.min(1, ray.r + .45), ray.g * .55, ray.b * .35);
	return {
		ray,
		set,
		width: Math.max(.15, Math.min(1, Math.log10(b.pressureBar + 1.2) / 2))
	};
}
var MissionWorld = class {
	canvas;
	renderer;
	timer = new Timer();
	spaceScene = new Scene();
	spaceCam = new PerspectiveCamera(48, 1, 8e-4, 800);
	globeScene = new Scene();
	globeCam = new PerspectiveCamera(42, 1, .01, 50);
	surfScene = new Scene();
	surfCam = new PerspectiveCamera(58, 1, .08, 600);
	spaceCtl;
	globeCtl;
	planets = /* @__PURE__ */ new Map();
	ship;
	plume;
	shipLine;
	ghostLine;
	planLine;
	markers = [];
	tmp = new Vector3();
	tmp2 = new Vector3();
	tmp3 = new Vector3();
	sunDir = new Vector3(1, .25, .35).normalize();
	builtKey = "";
	shipKey = "";
	planKey = "";
	ghostKey = "";
	camNonce = -1;
	disposed = false;
	onResize;
	onKeyDown;
	onKeyUp;
	onBlur;
	drag = false;
	lastX = 0;
	globeMat = null;
	cloudMat = null;
	atmoMat = null;
	globePivot = null;
	walker = null;
	surfSeed = 1;
	surfAmp = 8;
	shipVis = new Vector3();
	constructor(canvas) {
		this.canvas = canvas;
		this.renderer = new WebGLRenderer({
			canvas,
			antialias: true,
			alpha: false,
			powerPreference: "high-performance",
			logarithmicDepthBuffer: true
		});
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.setClearColor(657931, 1);
		this.timer.connect(document);
		this.spaceScene.background = new Color(657931);
		this.globeScene.background = new Color(460810);
		this.surfScene.background = new Color(657931);
		this.spaceCtl = new OrbitControls(this.spaceCam, canvas);
		this.spaceCtl.enableDamping = true;
		this.spaceCtl.dampingFactor = .08;
		this.spaceCtl.minDistance = .03;
		this.spaceCtl.maxDistance = 180;
		this.globeCtl = new OrbitControls(this.globeCam, canvas);
		this.globeCtl.enableDamping = true;
		this.globeCtl.autoRotate = true;
		this.globeCtl.autoRotateSpeed = .35;
		this.globeCtl.minDistance = 1.35;
		this.globeCtl.maxDistance = 8;
		this.globeCtl.enablePan = false;
		this.buildSpace();
		this.ship = this.buildShip();
		this.plume = this.ship.getObjectByName("plume");
		this.spaceScene.add(this.ship);
		this.shipLine = this.makeLine(16053493, .9);
		this.ghostLine = this.makeLine(9147296, .55);
		this.planLine = this.makeLine(10592682, .4);
		this.spaceScene.add(this.shipLine, this.ghostLine, this.planLine);
		for (let i = 0; i < 4; i++) {
			const m = new Mesh(new SphereGeometry(1, 10, 8), new MeshBasicMaterial({ color: i === 0 ? 16053493 : 9147296 }));
			this.markers.push(m);
			this.spaceScene.add(m);
		}
		this.spaceCam.position.set(1.15, .38, .72);
		this.globeCam.position.set(2.6, 1.05, 2.4);
		this.onResize = () => this.resize();
		this.onKeyDown = (e) => {
			if (e.repeat) return;
			if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
			sim.held.add(e.code);
			if (e.code === "Enter" && sim.phase === "title") begin();
		};
		this.onKeyUp = (e) => sim.held.delete(e.code);
		this.onBlur = () => sim.held.clear();
		window.addEventListener("resize", this.onResize);
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.onBlur);
		canvas.addEventListener("pointerdown", this.onPointerDown);
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		this.resize();
		bindProbe();
	}
	onPointerDown = (e) => {
		if (sim.phase !== "surface") return;
		if (e.target !== this.canvas) return;
		this.drag = true;
		this.lastX = e.clientX;
	};
	onPointerMove = (e) => {
		if (!this.drag || sim.phase !== "surface") return;
		const dx = e.clientX - this.lastX;
		this.lastX = e.clientX;
		sim.yaw -= dx * .0075;
	};
	onPointerUp = () => {
		this.drag = false;
	};
	start() {
		this.renderer.setAnimationLoop(this.loop);
		sim.glReady = true;
	}
	dispose() {
		this.disposed = true;
		this.renderer.setAnimationLoop(null);
		this.timer.disconnect();
		window.removeEventListener("resize", this.onResize);
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.onBlur);
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		this.spaceCtl.dispose();
		this.globeCtl.dispose();
		this.renderer.dispose();
	}
	loop = () => {
		if (this.disposed) return;
		this.timer.update();
		const dt = Math.min(this.timer.getDelta(), .05);
		tick(dt);
		this.sync(dt);
		const mode = sim.phase === "globe" ? "globe" : sim.phase === "surface" ? "surface" : "space";
		this.spaceCtl.enabled = sim.phase === "cruise";
		this.globeCtl.enabled = sim.phase === "globe";
		if (mode === "space") {
			if (sim.phase === "cruise") this.spaceCtl.update();
			this.renderer.render(this.spaceScene, this.spaceCam);
		} else if (mode === "globe") {
			this.globeCtl.update();
			this.renderer.render(this.globeScene, this.globeCam);
		} else this.renderer.render(this.surfScene, this.surfCam);
		if (Math.floor(sim.elapsed * 8) !== Math.floor((sim.elapsed - dt) * 8)) bump();
	};
	resize() {
		const w = this.canvas.clientWidth || window.innerWidth;
		const h = this.canvas.clientHeight || window.innerHeight;
		const dpr = Math.min(window.devicePixelRatio || 1, w < 800 ? 1.5 : 2);
		this.renderer.setPixelRatio(dpr);
		this.renderer.setSize(w, h, false);
		for (const cam of [
			this.spaceCam,
			this.globeCam,
			this.surfCam
		]) {
			cam.aspect = w / Math.max(1, h);
			cam.updateProjectionMatrix();
		}
	}
	buildSpace() {
		this.spaceScene.add(new AmbientLight(12041931, .55));
		this.spaceScene.add(new HemisphereLight(15198444, 1316380, .45));
		const key = new PointLight(16774632, 80, 0, 0);
		this.spaceScene.add(key);
		const stars = new BufferGeometry();
		const pos = /* @__PURE__ */ new Float32Array(5400);
		for (let i = 0; i < 1800; i++) {
			const r = 220 + Math.random() * 160;
			const th = Math.random() * TAU;
			const ph = Math.acos(2 * Math.random() - 1);
			pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
			pos[i * 3 + 1] = r * Math.cos(ph);
			pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
		}
		stars.setAttribute("position", new BufferAttribute(pos, 3));
		this.spaceScene.add(new Points(stars, new PointsMaterial({
			color: 14014172,
			size: 1.15,
			sizeAttenuation: false
		})));
		this.addBelt(2.15, 3.3, 700, .08, 10129544);
		this.addBelt(32, 48, 900, 6, 9077112);
		const sunMat = new ShaderMaterial({
			vertexShader: GLOBE_VERT,
			fragmentShader: SUN_FRAG,
			uniforms: { uTime: { value: 0 } }
		});
		const sun = new Mesh(new SphereGeometry(visualRadius(getBody("sun")), 48, 32), sunMat);
		sun.name = "sun";
		this.spaceScene.add(sun);
		const corona = new Mesh(new SphereGeometry(visualRadius(getBody("sun")) * 1.75, 32, 24), new MeshBasicMaterial({
			color: 16773596,
			transparent: true,
			opacity: .14,
			blending: 2,
			side: 1,
			depthWrite: false
		}));
		this.spaceScene.add(corona);
		for (const b of BODIES) {
			if (b.id === "sun") continue;
			const group = new Group();
			const geo = new SphereGeometry(visualRadius(b), b.group === "planet" ? 32 : 20, 18);
			const mat = new MeshStandardMaterial({
				color: tint(b.palette),
				roughness: .82,
				metalness: .04,
				emissive: tint(b.palette),
				emissiveIntensity: .08
			});
			const mesh = new Mesh(geo, mat);
			mesh.rotation.z = b.axialTilt * Math.PI / 180;
			group.add(mesh);
			if (b.id === "saturn") {
				const ring = new Mesh(new RingGeometry(visualRadius(b) * 1.35, visualRadius(b) * 2.15, 64), new MeshBasicMaterial({
					color: 13157560,
					side: 2,
					transparent: true,
					opacity: .85
				}));
				ring.rotation.x = Math.PI / 2;
				ring.rotation.z = b.axialTilt * Math.PI / 180;
				group.add(ring);
			}
			const line = this.makeLine(3816772, .85, 160);
			this.writeOrbit(line, bodyElements(b.id, 0), 160);
			this.spaceScene.add(line);
			group.userData.line = line;
			group.userData.bodyId = b.id;
			this.planets.set(b.id, group);
			this.spaceScene.add(group);
		}
	}
	addBelt(inner, outer, count, thick, color) {
		const geo = new BufferGeometry();
		const pos = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			const a = Math.random() * TAU;
			const r = inner + Math.random() * (outer - inner);
			const y = (Math.random() - .5) * thick;
			pos[i * 3] = Math.cos(a) * r;
			pos[i * 3 + 1] = y * .02;
			pos[i * 3 + 2] = Math.sin(a) * r;
		}
		geo.setAttribute("position", new BufferAttribute(pos, 3));
		this.spaceScene.add(new Points(geo, new PointsMaterial({
			color,
			size: 1.4,
			sizeAttenuation: false,
			transparent: true,
			opacity: .45
		})));
	}
	buildShip() {
		const g = new Group();
		const metal = new MeshStandardMaterial({
			color: 12961998,
			metalness: .86,
			roughness: .28
		});
		const dark = new MeshStandardMaterial({
			color: 2303016,
			metalness: .55,
			roughness: .42
		});
		const hullGeo = new CylinderGeometry(.2, .26, 1.45, 14);
		hullGeo.rotateX(Math.PI / 2);
		g.add(new Mesh(hullGeo, metal));
		const noseGeo = new ConeGeometry(.2, .5, 14);
		noseGeo.rotateX(Math.PI / 2);
		const nose = new Mesh(noseGeo, metal);
		nose.position.z = .95;
		g.add(nose);
		const flapGeo = new BoxGeometry(.46, .035, .26);
		const left = new Mesh(flapGeo, dark);
		left.position.set(-.3, 0, -.42);
		const right = left.clone();
		right.position.x = .3;
		g.add(left, right);
		const bellGeo = new CylinderGeometry(.15, .09, .2, 12);
		bellGeo.rotateX(Math.PI / 2);
		const bell = new Mesh(bellGeo, dark);
		bell.position.z = -.82;
		g.add(bell);
		const slit = new Mesh(new BoxGeometry(.08, .05, .16), new MeshStandardMaterial({
			color: 1711136,
			roughness: .3,
			metalness: .4
		}));
		slit.position.set(0, .18, .35);
		g.add(slit);
		const plumeGeo = new ConeGeometry(.12, .7, 12);
		plumeGeo.rotateX(-Math.PI / 2);
		const plume = new Mesh(plumeGeo, new MeshBasicMaterial({
			color: 16052714,
			transparent: true,
			opacity: .92,
			blending: 2,
			depthWrite: false
		}));
		plume.position.z = -1.25;
		plume.name = "plume";
		plume.visible = false;
		g.add(plume);
		return g;
	}
	makeLine(color, opacity, segments = 256) {
		const geo = new BufferGeometry();
		geo.setAttribute("position", new BufferAttribute(new Float32Array((segments + 1) * 3), 3));
		const mat = new LineBasicMaterial({
			color,
			transparent: true,
			opacity
		});
		return new Line(geo, mat);
	}
	writeOrbit(line, el, segments) {
		const attr = line.geometry.getAttribute("position");
		const n = segments ?? attr.count - 1;
		const count = Math.min(n, attr.count - 1);
		for (let i = 0; i <= count; i++) {
			const nu = i / count * TAU;
			const st = stateVectors({
				...el,
				M: meanFromTrue(nu, Math.min(el.e, .989))
			});
			attr.setXYZ(i, st.r.x, st.r.z, st.r.y);
		}
		attr.needsUpdate = true;
		line.geometry.computeBoundingSphere();
	}
	place(out, p) {
		return out.set(p.x, p.z, p.y);
	}
	bodyPos(id, t, out) {
		if (id === "sun") return out.set(0, 0, 0);
		const el = bodyElements(id, t);
		if (!el) return out.set(0, 0, 0);
		return this.place(out, stateVectors(el).r);
	}
	sync(dt) {
		const sun = this.spaceScene.getObjectByName("sun");
		const sunMat = sun && sun.material;
		if (sunMat instanceof ShaderMaterial) sunMat.uniforms.uTime.value = sim.elapsed;
		for (const b of BODIES) {
			if (b.id === "sun") continue;
			const obj = this.planets.get(b.id);
			if (!obj) continue;
			this.bodyPos(b.id, sim.t, this.tmp);
			obj.position.copy(this.tmp);
			obj.rotation.y += dt * (b.rotHours < 0 ? -.15 : .15);
			const mat = obj.userData.line.material;
			const selected = b.id === sim.targetId;
			mat.opacity = selected ? .95 : .28;
			mat.color.set(selected ? 12962257 : 3816772);
		}
		const shipState = stateVectors(sim.ship);
		this.place(this.tmp, shipState.r);
		const visual = this.visualShip(this.tmp);
		this.ship.position.copy(visual);
		const vel = this.place(this.tmp2, shipState.v);
		if (vel.lengthSq() > 1e-12) {
			this.tmp3.copy(visual).add(vel);
			this.ship.lookAt(this.tmp3);
		}
		const camDist = this.spaceCam.position.distanceTo(visual);
		const sc = MathUtils.clamp(camDist * .02, .006, .45);
		this.ship.scale.setScalar(sc);
		this.plume.visible = sim.burnFlash > .05 || !!sim.queue;
		this.plume.scale.setScalar(.7 + sim.burnFlash * 1.4);
		const sKey = sim.orbitStamp + ":" + sim.ship.a.toFixed(4) + ":" + sim.ship.e.toFixed(4);
		if (sKey !== this.shipKey) {
			this.shipKey = sKey;
			this.writeOrbit(this.shipLine, sim.ship);
		}
		this.placeNodes();
		const ghost = ghostElements();
		const gKey = ghost ? `${ghost.a.toFixed(4)}:${ghost.e.toFixed(4)}:${ghost.i.toFixed(4)}` : "";
		this.ghostLine.visible = !!ghost && sim.phase === "cruise";
		if (ghost && gKey !== this.ghostKey) {
			this.ghostKey = gKey;
			this.writeOrbit(this.ghostLine, ghost);
		}
		const plan = sim.plan;
		const pKey = plan?.transfer ? `${plan.tDep.toFixed(2)}:${plan.transfer.a.toFixed(4)}:${plan.tof.toFixed(1)}` : "";
		this.planLine.visible = !!plan?.transfer && (sim.phase === "cruise" || sim.phase === "auto");
		if (plan?.transfer && pKey !== this.planKey) {
			this.planKey = pKey;
			this.writeOrbit(this.planLine, plan.transfer);
		}
		this.syncCamera(dt, visual);
		if (sim.phase === "globe" || sim.phase === "surface") {
			const key = `${sim.phase}:${sim.targetId}:${sim.sceneEpoch}`;
			if (key !== this.builtKey) {
				this.builtKey = key;
				if (sim.phase === "globe") this.buildGlobe();
				else this.buildSurface();
			}
			if (sim.phase === "globe") this.syncGlobe(dt);
			else this.syncSurface(dt);
		}
	}
	visualShip(real) {
		let bestD = Infinity;
		let vr = 0;
		const center = this.tmp3;
		const keep = this.shipVis.copy(real);
		for (const b of BODIES) {
			if (b.id === "sun") continue;
			this.bodyPos(b.id, sim.t, center);
			const d = keep.distanceTo(center);
			const r = visualRadius(b);
			if (d < bestD) {
				bestD = d;
				vr = r;
				this.tmp2.copy(center);
			}
		}
		if (bestD < vr * 1.2 && bestD > 1e-6) return keep.sub(this.tmp2).normalize().multiplyScalar(vr * 1.45).add(this.tmp2);
		return keep;
	}
	placeNodes() {
		const names = [
			"pe",
			"ap",
			"an",
			"dn"
		];
		const nus = [
			0,
			Math.PI,
			(-sim.ship.w + TAU) % TAU,
			(Math.PI - sim.ship.w + TAU) % TAU
		];
		for (let i = 0; i < 4; i++) {
			const st = stateVectors({
				...sim.ship,
				M: meanFromTrue(nus[i], Math.min(sim.ship.e, .989))
			});
			this.place(this.tmp, st.r);
			this.markers[i].position.copy(this.tmp);
			const dist = this.spaceCam.position.distanceTo(this.tmp);
			this.markers[i].scale.setScalar(Math.max(.004, dist * .008));
			const mat = this.markers[i].material;
			const armed = sim.node === "pe" && names[i] === "pe" || sim.node === "ap" && names[i] === "ap" || sim.node === "an" && names[i] === "an" || sim.node === "dn" && names[i] === "dn";
			mat.color.set(armed ? 16053493 : 7172732);
		}
	}
	syncCamera(dt, visual) {
		if (sim.phase === "title") {
			const ang = sim.elapsed * .15;
			this.spaceCam.position.set(visual.x + Math.cos(ang) * .07, visual.y + .028, visual.z + Math.sin(ang) * .07);
			this.spaceCam.lookAt(visual);
			this.spaceCtl.target.copy(visual);
			return;
		}
		if (sim.phase === "auto") {
			const body = getBody(sim.targetId);
			if (body.id === "sun") this.tmp2.set(0, 0, 0);
			else this.bodyPos(body.id, sim.t, this.tmp2);
			const u = sim.autoU;
			const look = this.tmp.copy(visual).lerp(this.tmp2, MathUtils.clamp((u - .2) / .7, 0, 1));
			const dist = Math.max(.35, visual.distanceTo(this.tmp2)) * (u < .86 ? .85 : .85 - (u - .86) * 3.2);
			const desired = this.tmp3.set(look.x + dist * .45, look.y + dist * .28, look.z + dist * .62);
			const k = 1 - Math.exp(-dt * 2.2);
			this.spaceCam.position.lerp(desired, k);
			this.spaceCam.lookAt(look);
			return;
		}
		if (sim.phase === "cruise") {
			if (this.camNonce !== sim.camNonce) {
				this.camNonce = sim.camNonce;
				this.spaceCtl.target.copy(visual);
				this.spaceCam.position.set(visual.x + .16, visual.y + .08, visual.z + .14);
			}
			const focusId = sim.focus === "sun" ? "sun" : sim.focus === "target" ? sim.targetId : "";
			if (focusId) {
				if (focusId === "sun") this.tmp.set(0, 0, 0);
				else this.bodyPos(focusId, sim.t, this.tmp);
				this.spaceCtl.target.lerp(this.tmp, 1 - Math.exp(-dt * 3));
			} else this.spaceCtl.target.lerp(visual, 1 - Math.exp(-dt * 2.4));
		}
	}
	clearScene(scene) {
		for (const obj of [...scene.children]) {
			scene.remove(obj);
			obj.traverse((child) => {
				const mesh = child;
				mesh.geometry?.dispose?.();
				const mat = mesh.material;
				if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
				else mat?.dispose?.();
			});
		}
	}
	buildGlobe() {
		this.clearScene(this.globeScene);
		const body = getBody(sim.targetId);
		this.globeScene.add(new AmbientLight(10133675, .35));
		const sun = new DirectionalLight(16774890, 2.4);
		sun.position.copy(this.sunDir);
		this.globeScene.add(sun);
		const stars = new BufferGeometry();
		const pos = /* @__PURE__ */ new Float32Array(2400);
		for (let i = 0; i < 800; i++) {
			const r = 18;
			const th = Math.random() * TAU;
			const ph = Math.acos(2 * Math.random() - 1);
			pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
			pos[i * 3 + 1] = r * Math.cos(ph);
			pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
		}
		stars.setAttribute("position", new BufferAttribute(pos, 3));
		this.globeScene.add(new Points(stars, new PointsMaterial({
			color: 13685464,
			size: 1.2,
			sizeAttenuation: false
		})));
		const air = airColors(body);
		this.globeMat = new ShaderMaterial({
			vertexShader: GLOBE_VERT,
			fragmentShader: GLOBE_FRAG,
			uniforms: {
				uHeat: { value: .5 },
				uKind: { value: kindOf(body.palette) },
				uTeq: { value: displayTemp(body) },
				uSeed: { value: seedOf(body.id) * .01 },
				uSun: { value: this.sunDir.clone() }
			}
		});
		const pivot = new Group();
		pivot.rotation.z = body.axialTilt * Math.PI / 180;
		const globe = new Mesh(new SphereGeometry(1, 96, 64), this.globeMat);
		pivot.add(globe);
		this.cloudMat = new ShaderMaterial({
			vertexShader: GLOBE_VERT,
			fragmentShader: CLOUD_FRAG,
			transparent: true,
			depthWrite: false,
			uniforms: {
				uTime: { value: 0 },
				uKind: { value: kindOf(body.palette) },
				uCover: { value: body.clouds },
				uSeed: { value: seedOf(body.id) * .02 },
				uSun: { value: this.sunDir.clone() }
			}
		});
		if (body.clouds > .02) pivot.add(new Mesh(new SphereGeometry(1.025, 64, 48), this.cloudMat));
		this.atmoMat = new ShaderMaterial({
			vertexShader: GLOBE_VERT,
			fragmentShader: ATMO_FRAG,
			transparent: true,
			side: 1,
			depthWrite: false,
			blending: 2,
			uniforms: {
				uSun: { value: this.sunDir.clone() },
				uRay: { value: air.ray },
				uSet: { value: air.set },
				uWidth: { value: air.width }
			}
		});
		if (body.pressureBar > 1e-4 || body.palette === "star" || body.id === "earth") {
			const shell = new Mesh(new SphereGeometry(1.12, 48, 32), this.atmoMat);
			this.globeScene.add(shell);
		}
		this.globeScene.add(pivot);
		this.globePivot = pivot;
		this.globeCam.position.set(2.5, .95, 2.3);
		this.globeCtl.target.set(0, 0, 0);
		this.globeCtl.update();
	}
	syncGlobe(dt) {
		const heat = sim.view === "heat" ? 1 : sim.view === "natural" ? 0 : .5;
		if (this.globeMat) this.globeMat.uniforms.uHeat.value = heat;
		if (this.cloudMat) this.cloudMat.uniforms.uTime.value = sim.elapsed;
		if (this.globePivot) {
			const body = getBody(sim.targetId);
			const sign = body.rotHours < 0 ? -1 : 1;
			this.globePivot.rotation.y += dt * sign * (.15 + 8 / Math.max(8, Math.abs(body.rotHours)));
		}
	}
	buildSurface() {
		this.clearScene(this.surfScene);
		const body = getBody(sim.targetId);
		this.surfSeed = seedOf(body.id);
		this.surfAmp = ampFor(body.palette);
		const sky = skyFor(body.palette);
		const skyMat = new ShaderMaterial({
			vertexShader: SKY_VERT,
			fragmentShader: SKY_FRAG,
			depthWrite: false,
			side: 1,
			uniforms: {
				uZenith: { value: new Color(...sky.zenith) },
				uHorizon: { value: new Color(...sky.horizon) },
				uSunset: { value: new Color(...sky.sunset) },
				uSun: { value: this.sunDir.clone() },
				uStars: { value: sky.stars }
			}
		});
		const skyMesh = new Mesh(new SphereGeometry(380, 24, 16), skyMat);
		skyMesh.frustumCulled = false;
		skyMesh.renderOrder = -1;
		this.surfScene.add(skyMesh);
		this.surfScene.add(new AmbientLight(12962514, .45));
		this.surfScene.add(new HemisphereLight(15264494, 2761756, .55));
		const sun = new DirectionalLight(16774372, body.palette === "star" ? 2.2 : 1.6);
		sun.position.copy(this.sunDir).multiplyScalar(10);
		this.surfScene.add(sun);
		const geo = new PlaneGeometry(170, 170, 90, 90);
		geo.rotateX(-Math.PI / 2);
		const pos = geo.attributes.position;
		const colors = new Float32Array(pos.count * 3);
		for (let i = 0; i < pos.count; i++) {
			const x = pos.getX(i);
			const z = pos.getZ(i);
			const h = heightAt(x, z, this.surfSeed, this.surfAmp);
			pos.setY(i, h);
			const n = heightAt(x + 4, z - 3, this.surfSeed + 2, 1);
			const c = surfaceColor(body.palette, h, this.surfAmp, n);
			colors[i * 3] = c[0];
			colors[i * 3 + 1] = c[1];
			colors[i * 3 + 2] = c[2];
		}
		geo.setAttribute("color", new BufferAttribute(colors, 3));
		geo.computeVertexNormals();
		const ground = new Mesh(geo, new MeshStandardMaterial({
			vertexColors: true,
			roughness: .94,
			metalness: .02
		}));
		this.surfScene.add(ground);
		const beaconMat = new MeshStandardMaterial({
			color: 16053493,
			roughness: .4,
			metalness: .1,
			emissive: 16053493,
			emissiveIntensity: .2
		});
		for (let i = 0; i < 4; i++) {
			const b = {
				x: Math.cos(i / 4 * TAU + .5) * (22 + i % 3 * 7),
				z: Math.sin(i / 4 * TAU + .5) * (22 + i % 3 * 7)
			};
			const h = heightAt(b.x, b.z, this.surfSeed, this.surfAmp);
			const pole = new Mesh(new CylinderGeometry(.07, .09, 2.8, 6), beaconMat);
			pole.position.set(b.x, h + 1.4, b.z);
			this.surfScene.add(pole);
		}
		this.walker = this.buildWalker();
		this.surfScene.add(this.walker);
		this.surfCam.position.set(0, 6, 24);
	}
	buildWalker() {
		const g = new Group();
		const suit = new MeshStandardMaterial({
			color: 14014428,
			metalness: .45,
			roughness: .4
		});
		const dark = new MeshStandardMaterial({
			color: 1447964,
			metalness: .3,
			roughness: .35
		});
		const body = new Mesh(new CapsuleGeometry(.32, .7, 4, 8), suit);
		body.position.y = 1.05;
		g.add(body);
		const pack = new Mesh(new BoxGeometry(.38, .42, .16), dark);
		pack.position.set(0, 1.1, -.28);
		g.add(pack);
		const visor = new Mesh(new BoxGeometry(.32, .16, .1), dark);
		visor.position.set(0, 1.35, .26);
		g.add(visor);
		return g;
	}
	syncSurface(dt) {
		if (!this.walker) return;
		const h = heightAt(sim.x, sim.z, this.surfSeed, this.surfAmp);
		this.walker.position.set(sim.x, h + sim.hop, sim.z);
		const fx = -Math.sin(sim.yaw);
		const fz = -Math.cos(sim.yaw);
		this.tmp.set(sim.x + fx, this.walker.position.y, sim.z + fz);
		this.walker.lookAt(this.tmp);
		const desired = this.tmp2.set(sim.x - fx * 7.2, h + sim.hop + 3.3, sim.z - fz * 7.2);
		const k = 1 - Math.exp(-dt * 8);
		this.surfCam.position.lerp(desired, k);
		this.tmp3.set(sim.x + fx * 2, h + sim.hop + 1.35, sim.z + fz * 2);
		this.surfCam.lookAt(this.tmp3);
	}
};
//#endregion
export { MissionWorld };
