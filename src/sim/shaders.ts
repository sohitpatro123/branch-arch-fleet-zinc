export const NOISE = /* glsl */ `
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

export const GLOBE_VERT = /* glsl */ `
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

export const GLOBE_FRAG = /* glsl */ `
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

export const CLOUD_FRAG = /* glsl */ `
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

export const ATMO_FRAG = /* glsl */ `
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

export const SUN_FRAG = /* glsl */ `
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

export const SKY_FRAG = /* glsl */ `
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

export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vDir = position;
  gl_Position = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`;
