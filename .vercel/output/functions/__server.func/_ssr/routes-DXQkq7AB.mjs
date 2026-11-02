import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DXQkq7AB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var add = (a, b) => ({
	x: a.x + b.x,
	y: a.y + b.y,
	z: a.z + b.z
});
var sub = (a, b) => ({
	x: a.x - b.x,
	y: a.y - b.y,
	z: a.z - b.z
});
var mul = (a, s) => ({
	x: a.x * s,
	y: a.y * s,
	z: a.z * s
});
var dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
var cross$1 = (a, b) => ({
	x: a.y * b.z - a.z * b.y,
	y: a.z * b.x - a.x * b.z,
	z: a.x * b.y - a.y * b.x
});
var mag = (a) => Math.hypot(a.x, a.y, a.z);
var norm = (a) => {
	const m = mag(a);
	if (m < 1e-12) return {
		x: 0,
		y: 0,
		z: 0
	};
	return mul(a, 1 / m);
};
var clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
var TAU = Math.PI * 2;
var wrapTau = (a) => {
	const t = a % TAU;
	return t < 0 ? t + TAU : t;
};
var deg = (d) => d * Math.PI / 180;
/** Heliocentric gravitational parameter, AU^3 / day^2. */
var MU = .0002959122082855911;
/** km/s → AU/day */
var KMS = 86400 / 149597870.7;
function meanMotion(a, mu = MU) {
	return Math.sqrt(mu / (a * a * a));
}
function periodDays(a, mu = MU) {
	return TAU / meanMotion(a, mu);
}
function solveKepler(M, e) {
	const m = wrapTau(M);
	let E = e < .8 ? m : Math.PI;
	for (let k = 0; k < 16; k++) {
		const d = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
		E -= d;
		if (Math.abs(d) < 1e-12) break;
	}
	return E;
}
function rotatePQW(p, el) {
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
		z: r31 * p.x + r32 * p.y
	};
}
function trueAnomalyFromE(E, e) {
	const cosE = Math.cos(E);
	const sinE = Math.sin(E);
	return Math.atan2(Math.sqrt(Math.max(0, 1 - e * e)) * sinE, cosE - e);
}
function eccentricFromTrue(nu, e) {
	const c = Math.cos(nu);
	const s = Math.sin(nu);
	const b = Math.sqrt(Math.max(0, 1 - e * e));
	return Math.atan2(b * s / (1 + e * c), (e + c) / (1 + e * c));
}
function meanFromTrue(nu, e) {
	const E = eccentricFromTrue(nu, e);
	return wrapTau(E - e * Math.sin(E));
}
function trueAnomaly(el) {
	const e = clamp(el.e, 0, .989);
	return wrapTau(trueAnomalyFromE(solveKepler(el.M, e), e));
}
function stateVectors(el, mu = MU) {
	const e = clamp(el.e, 0, .989);
	const a = Math.max(el.a, 1e-4);
	const E = solveKepler(el.M, e);
	const cosE = Math.cos(E);
	const nu = trueAnomalyFromE(E, e);
	const rmag = a * (1 - e * cosE);
	const cN = Math.cos(nu);
	const sN = Math.sin(nu);
	const perifocalR = {
		x: rmag * cN,
		y: rmag * sN,
		z: 0
	};
	const p = Math.max(a * (1 - e * e), 1e-8);
	const s = Math.sqrt(mu / p);
	const perifocalV = {
		x: -s * sN,
		y: s * (e + cN),
		z: 0
	};
	return {
		r: rotatePQW(perifocalR, el),
		v: rotatePQW(perifocalV, el)
	};
}
function propagate(el, dtDays, mu = MU) {
	return {
		...el,
		M: el.M + meanMotion(el.a, mu) * dtDays
	};
}
function cartesianToElements(r, v, mu = MU) {
	const rmag = mag(r);
	const vmag = mag(v);
	if (rmag < 1e-8) return null;
	const energy = vmag * vmag / 2 - mu / rmag;
	if (energy >= -1e-14) return null;
	const a = -mu / (2 * energy);
	const h = cross$1(r, v);
	const hmag = mag(h);
	if (hmag < 1e-12) return null;
	const nvec = cross$1({
		x: 0,
		y: 0,
		z: 1
	}, h);
	const nmag = mag(nvec);
	const eVec = sub(mul(cross$1(v, h), 1 / mu), mul(r, 1 / rmag));
	let e = mag(eVec);
	if (e >= .989) return null;
	if (a < .012 || a > 80 || !isFinite(a)) return null;
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
	return {
		a,
		e,
		i,
		Om,
		w,
		M
	};
}
function stumpffC(z) {
	if (z > 1e-4) return (1 - Math.cos(Math.sqrt(z))) / z;
	if (z < -1e-4) return (1 - Math.cosh(Math.sqrt(-z))) / z;
	return .5 - z / 24 + z * z / 720 - z * z * z / 40320;
}
function stumpffS(z) {
	if (z > 1e-4) {
		const s = Math.sqrt(z);
		return (s - Math.sin(s)) / (s * s * s);
	}
	if (z < -1e-4) {
		const s = Math.sqrt(-z);
		return (Math.sinh(s) - s) / (s * s * s);
	}
	return 1 / 6 - z / 120 + z * z / 5040 - z * z * z / 362880;
}
/**
* Universal-variable Lambert (Curtis). Single revolution.
* Near-180° geometry is regularized with a tiny out-of-plane lift.
*/
function lambert(r1in, r2in, tof, mu = MU, prograde = true) {
	const r1 = r1in;
	let r2 = r2in;
	const r1m = mag(r1);
	const r2m0 = mag(r2);
	if (r1m < 1e-6 || r2m0 < 1e-6 || tof <= 1e-4) return null;
	let cos0 = clamp(dot(r1, r2) / (r1m * r2m0), -1, 1);
	if (cos0 < -.9995) {
		const lift = norm(cross$1(r1, Math.abs(r1.x) < .9 ? {
			x: 1,
			y: 0,
			z: 0
		} : {
			x: 0,
			y: 1,
			z: 0
		}));
		r2 = add(r2, mul(lift, r2m0 * .001));
		cos0 = clamp(dot(r1, r2) / (r1m * mag(r2)), -1, 1);
	}
	const r2m = mag(r2);
	const cz = r1.x * r2.y - r1.y * r2.x;
	let dnu = Math.acos(clamp(cos0, -1, 1));
	if (prograde) {
		if (cz < 0) dnu = TAU - dnu;
	} else if (cz > 0) dnu = TAU - dnu;
	const denom = Math.max(1e-8, 1 - Math.cos(dnu));
	const A = Math.sin(dnu) * Math.sqrt(r1m * r2m) / Math.sqrt(denom);
	if (!isFinite(A) || Math.abs(A) < 1e-8) return null;
	const yOf = (z) => {
		const c = stumpffC(z);
		if (c <= 1e-8) return -1;
		return r1m + r2m + A * (z * stumpffS(z) - 1) / Math.sqrt(c);
	};
	const tofOf = (z) => {
		const y = yOf(z);
		if (!(y > 0)) return NaN;
		const c = stumpffC(z);
		const s = stumpffS(z);
		return (Math.pow(y / c, 1.5) * s + A * Math.sqrt(y)) / Math.sqrt(mu);
	};
	let zLo = -4 * Math.PI;
	for (let i = 0; i < 24 && !(yOf(zLo) > 0); i++) zLo += .4;
	let zHi = 4 * Math.PI * Math.PI;
	let tLo = tofOf(zLo);
	let tHi = tofOf(zHi);
	for (let i = 0; i < 10 && !(isFinite(tHi) && tHi > tof); i++) {
		zHi *= 1.5;
		tHi = tofOf(zHi);
	}
	if (!isFinite(tLo) || !isFinite(tHi) || tLo > tof || tHi < tof) {
		if (prograde) return lambert(r1in, r2in, tof, mu, false);
		return null;
	}
	let z = 0;
	for (let i = 0; i < 50; i++) {
		z = .5 * (zLo + zHi);
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
	if (![
		v1.x,
		v1.y,
		v1.z,
		v2.x,
		v2.y,
		v2.z
	].every(Number.isFinite)) return null;
	return {
		v1,
		v2
	};
}
function nodeNu(which, el) {
	if (which === "pe") return 0;
	if (which === "ap") return Math.PI;
	if (which === "an") return wrapTau(-el.w);
	return wrapTau(Math.PI - el.w);
}
/** Days to advance from the current true anomaly to `nu`, forward only. */
function timeToAnomaly(el, nu, mu = MU) {
	const e = clamp(el.e, 0, .989);
	const E0 = eccentricFromTrue(trueAnomaly(el), e);
	const E1 = eccentricFromTrue(wrapTau(nu), e);
	const M0 = wrapTau(E0 - e * Math.sin(E0));
	let dM = wrapTau(E1 - e * Math.sin(E1)) - M0;
	if (dM < 1e-4) dM += TAU;
	return dM / meanMotion(el.a, mu);
}
function applyDv(el, dvPro, dvNormal, dvRadial, mu = MU) {
	const { r, v } = stateVectors(el, mu);
	const rhat = norm(r);
	const vhat = mag(v) > 1e-10 ? norm(v) : norm(cross$1({
		x: 0,
		y: 0,
		z: 1
	}, rhat));
	const nh = norm(cross$1(r, v));
	const next = cartesianToElements(r, add(add(add(v, mul(vhat, dvPro)), mul(nh, dvNormal)), mul(rhat, dvRadial)), mu);
	if (!next) return {
		el: null,
		reason: "That burn leaves a bound solar orbit."
	};
	return {
		el: next,
		dvAuDay: Math.hypot(dvPro, dvNormal, dvRadial)
	};
}
function baseElements(b) {
	const Om = deg(b.omDeg);
	const w = deg(b.wDeg);
	const L = deg(b.Ldeg);
	return {
		a: Math.max(b.aAU, .01),
		e: b.e,
		i: deg(b.iDeg),
		Om,
		w,
		M: wrapTau(L - Om - w)
	};
}
function elementsAtTime(el0, tDays) {
	return propagate(el0, tDays);
}
function equilibriumK(albedo, starL, aAU) {
	const a = Math.max(aAU, 1e-4);
	const flux = (1 - albedo) * starL / (a * a);
	return 278.5 * Math.pow(Math.max(flux, 1e-8), .25);
}
function gravityMs2(massKg, radiusKm) {
	const R = radiusKm * 1e3;
	return 66743e-15 * massKg / (R * R);
}
var Z = {
	h2: 0,
	he: 0,
	n2: 0,
	o2: 0,
	co2: 0,
	ch4: 0,
	h2o: 0,
	nh3: 0,
	so2: 0,
	ar: 0,
	co: 0
};
var atm = (p) => ({
	...Z,
	...p
});
var SUN_MASS = 198847e25;
var EARTH_MASS = 59722e20;
var JUPITER_MASS = 189813e22;
var EARTH_RADIUS_KM = 6371;
var BODIES = [
	{
		id: "sun",
		name: "Sun",
		group: "sun",
		blurb: "Photosphere model",
		massKg: SUN_MASS,
		massEstimated: false,
		radiusKm: 695700,
		radiusEstimated: false,
		aAU: 0,
		e: 0,
		iDeg: 0,
		omDeg: 0,
		wDeg: 0,
		Ldeg: 0,
		albedo: 0,
		pressureBar: .1,
		clouds: 0,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 609,
		axialTilt: 7.25,
		palette: "star",
		atm: atm({
			h2: .912,
			he: .087,
			o2: 8e-4
		}),
		atmConfidence: "measured",
		atmNote: "Photospheric volume mix is mostly hydrogen and helium. By mass the Sun is about 73% hydrogen and 25% helium.",
		surfaceTempK: 5772,
		walk: "A reconstructed photosphere — granulation from the real solar radius, mass, and composition. Not a survivable landing.",
		facts: [
			"The photosphere is about 5,772 K. Granules are convection cells roughly 1,000 km across.",
			"Mean density is only 1.41 g/cm³. The core, which you are not walking on, is near 15.7 million K.",
			"Equatorial rotation is about 25 days. The poles take closer to 34."
		],
		source: "IAU nominal solar values; Anders & Grevesse-type abundances, rounded."
	},
	{
		id: "mercury",
		name: "Mercury",
		group: "planet",
		blurb: "0.39 AU · iron world",
		massKg: 33011e19,
		massEstimated: false,
		radiusKm: 2439.7,
		radiusEstimated: false,
		aAU: .387098,
		e: .20563,
		iDeg: 7.005,
		omDeg: 48.331,
		wDeg: 29.125,
		Ldeg: 252.25,
		albedo: .088,
		pressureBar: 0,
		clouds: 0,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 1407.6,
		axialTilt: .03,
		palette: "rock",
		atm: atm({}),
		atmConfidence: "none",
		atmNote: "No real atmosphere — a collisionless exosphere of sodium, oxygen, and hydrogen.",
		surfaceTempK: 440,
		walk: "Airless regolith. The model uses Mercury’s mass, radius, and albedo; temperatures swing far wider than the mean.",
		facts: [
			"A solar day lasts 176 Earth days, longer than the 88-day year, from a 3:2 spin-orbit resonance.",
			"The metallic core is about 85% of the radius — a larger core fraction than any other planet.",
			"Surface temperature runs from about 100 K on the night side to 700 K in daylight."
		],
		source: "IAU / NASA planetary fact sheets, mean Keplerian elements."
	},
	{
		id: "venus",
		name: "Venus",
		group: "planet",
		blurb: "0.72 AU · CO₂ greenhouse",
		massKg: 48675e20,
		massEstimated: false,
		radiusKm: 6051.8,
		radiusEstimated: false,
		aAU: .723332,
		e: .006772,
		iDeg: 3.395,
		omDeg: 76.68,
		wDeg: 54.884,
		Ldeg: 181.98,
		albedo: .77,
		pressureBar: 92,
		clouds: 1,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: -5832.5,
		axialTilt: 177.4,
		palette: "venus",
		atm: atm({
			co2: .965,
			n2: .035,
			so2: 15e-5
		}),
		atmConfidence: "measured",
		atmNote: "96.5% carbon dioxide, 3.5% nitrogen, with sulfuric-acid clouds. Surface pressure is 92 bar.",
		surfaceTempK: 737,
		walk: "A basalt plain under the cloud deck. The sky color comes from dense CO₂ and the sulfuric haze.",
		facts: [
			"Runaway greenhouse holds the surface near 737 K, hotter than Mercury, even though the clouds reflect most sunlight.",
			"Rotation is retrograde and slower than the orbit: a sidereal day is 243 Earth days.",
			"The cloud deck is sulfuric acid droplets between roughly 45 and 70 km."
		],
		source: "NASA Venus fact sheet; atmospheric mixing ratios from in-situ probes, rounded."
	},
	{
		id: "earth",
		name: "Earth",
		group: "planet",
		blurb: "1.00 AU · departure world",
		massKg: EARTH_MASS,
		massEstimated: false,
		radiusKm: EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: 1.000001,
		e: .016709,
		iDeg: 5e-5,
		omDeg: -11.26064,
		wDeg: 114.20783,
		Ldeg: 100.46457,
		albedo: .306,
		pressureBar: 1.014,
		clouds: .55,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 23.934,
		axialTilt: 23.44,
		palette: "earth",
		atm: atm({
			n2: .7808,
			o2: .2095,
			ar: .0093,
			co2: 4e-4,
			h2o: .004
		}),
		atmConfidence: "measured",
		atmNote: "Dry air is 78% nitrogen, 21% oxygen, 0.93% argon. Water vapor varies; global clouds are shown separately.",
		surfaceTempK: 288,
		walk: "Home. The globe uses Earth’s measured mass, radius, oceans, and nitrogen-oxygen air.",
		facts: [
			"Equilibrium temperature without greenhouse warming would be near 255 K. The surface mean is about 288 K.",
			"You started co-orbital with Earth. A prograde burn here raises apoapsis toward the outer system.",
			"One bar of N₂/O₂ Rayleigh-scatters blue and leaves orange twilight when the line of sight skims the limb."
		],
		source: "IAU nominal Earth; atmosphere from standard dry-air composition."
	},
	{
		id: "mars",
		name: "Mars",
		group: "planet",
		blurb: "1.52 AU · thin CO₂",
		massKg: 64171e19,
		massEstimated: false,
		radiusKm: 3389.5,
		radiusEstimated: false,
		aAU: 1.523679,
		e: .0934,
		iDeg: 1.85,
		omDeg: 49.558,
		wDeg: 286.502,
		Ldeg: 355.45,
		albedo: .25,
		pressureBar: .00636,
		clouds: .08,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 24.623,
		axialTilt: 25.19,
		palette: "mars",
		atm: atm({
			co2: .9532,
			n2: .027,
			ar: .016,
			o2: .0013
		}),
		atmConfidence: "measured",
		atmNote: "95.3% carbon dioxide, 2.7% nitrogen, 1.6% argon. Surface pressure is about 6.4 millibar.",
		surfaceTempK: 210,
		walk: "Cold desert under a thin CO₂ sky. Polar caps in the model are water ice and seasonal dry ice.",
		facts: [
			"A year is 687 Earth days. The sol is only 24 hours 37 minutes.",
			"Olympus Mons rises about 22 km above the datum. Valles Marineris runs 4,000 km.",
			"The sky scatters red from dust; the setting sun is blue — the opposite of Earth."
		],
		source: "NASA Mars fact sheet; atmosphere from Curiosity/SAM and prior landers, rounded."
	},
	{
		id: "jupiter",
		name: "Jupiter",
		group: "planet",
		blurb: "5.20 AU · hydrogen giant",
		massKg: 18982e23,
		massEstimated: false,
		radiusKm: 69911,
		radiusEstimated: false,
		aAU: 5.2044,
		e: .0489,
		iDeg: 1.303,
		omDeg: 100.464,
		wDeg: 273.867,
		Ldeg: 34.404,
		albedo: .503,
		pressureBar: 1,
		clouds: .92,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 9.925,
		axialTilt: 3.13,
		palette: "gas",
		atm: atm({
			h2: .898,
			he: .102,
			ch4: .003,
			nh3: 26e-5
		}),
		atmConfidence: "measured",
		atmNote: "About 89.8% hydrogen and 10.2% helium by volume, with ammonia, methane, and water clouds.",
		surfaceTempK: 165,
		walk: "There is no solid surface. You are on a 1-bar cloud deck — ammonia ice above a hydrogen-helium envelope.",
		facts: [
			"Jupiter is 318 Earth masses. A day is under 10 hours, which stretches the cloud bands.",
			"The Great Red Spot is a persistent anticyclone wider than Earth.",
			"The 1-bar level is near 165 K. Temperature rises inward; the interior is metallic hydrogen."
		],
		source: "NASA Jupiter fact sheet; Galileo probe mixing ratios, rounded."
	},
	{
		id: "saturn",
		name: "Saturn",
		group: "planet",
		blurb: "9.58 AU · rings of ice",
		massKg: 56834e22,
		massEstimated: false,
		radiusKm: 58232,
		radiusEstimated: false,
		aAU: 9.5826,
		e: .0565,
		iDeg: 2.485,
		omDeg: 113.665,
		wDeg: 339.392,
		Ldeg: 49.944,
		albedo: .342,
		pressureBar: 1,
		clouds: .9,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 10.656,
		axialTilt: 26.73,
		palette: "gas",
		atm: atm({
			h2: .963,
			he: .0325,
			ch4: .0045,
			nh3: 1e-4
		}),
		atmConfidence: "measured",
		atmNote: "Hydrogen-helium atmosphere, poorer in helium than Jupiter, with ammonia and methane.",
		surfaceTempK: 134,
		walk: "A 1-bar ammonia cloud deck. The rings are water ice and are not a walking surface.",
		facts: [
			"Mean density is 0.69 g/cm³, less than water.",
			"The north pole has a persistent hexagon, a standing wave in the jet stream.",
			"The main rings span about 70,000 to 140,000 km from the center and are only tens of meters thick."
		],
		source: "NASA Saturn fact sheet; Cassini atmospheric results, rounded."
	},
	{
		id: "uranus",
		name: "Uranus",
		group: "planet",
		blurb: "19.2 AU · methane ice giant",
		massKg: 8681e22,
		massEstimated: false,
		radiusKm: 25362,
		radiusEstimated: false,
		aAU: 19.19126,
		e: .04717,
		iDeg: .773,
		omDeg: 74.006,
		wDeg: 96.998,
		Ldeg: 313.232,
		albedo: .3,
		pressureBar: 1,
		clouds: .75,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: -17.24,
		axialTilt: 97.77,
		palette: "icegiant",
		atm: atm({
			h2: .83,
			he: .15,
			ch4: .023
		}),
		atmConfidence: "measured",
		atmNote: "Hydrogen and helium with about 2.3% methane. Methane absorbs red light, so the planet looks cyan.",
		surfaceTempK: 76,
		walk: "A 1-bar deck on an ice giant. The pale blue-green is methane absorption, not an ocean surface.",
		facts: [
			"Axial tilt is 98°, so the poles take turns pointing at the Sun for decades.",
			"A year lasts 84 Earth years. Voyager 2 is still the only craft to have flown past.",
			"The interior is water, ammonia, and methane fluids around a small rocky core — an ice giant, not a gas giant."
		],
		source: "NASA Uranus fact sheet; Voyager 2 abundances, rounded."
	},
	{
		id: "neptune",
		name: "Neptune",
		group: "planet",
		blurb: "30.1 AU · windiest giant",
		massKg: 102413e21,
		massEstimated: false,
		radiusKm: 24622,
		radiusEstimated: false,
		aAU: 30.07,
		e: .008678,
		iDeg: 1.77,
		omDeg: 131.784,
		wDeg: 273.187,
		Ldeg: 304.88,
		albedo: .29,
		pressureBar: 1,
		clouds: .7,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 16.11,
		axialTilt: 28.32,
		palette: "icegiant",
		atm: atm({
			h2: .8,
			he: .19,
			ch4: .015
		}),
		atmConfidence: "measured",
		atmNote: "Hydrogen, helium, and about 1.5% methane. Deeper clouds include hydrogen sulfide.",
		surfaceTempK: 72,
		walk: "A 1-bar cloud deck. Darker blue than Uranus because more methane sits above the haze.",
		facts: [
			"Wind speeds reach about 600 m/s, the fastest in the solar system.",
			"The Great Dark Spot seen by Voyager 2 had vanished by the time Hubble looked. Storms here are transient.",
			"Triton, the large moon, orbits retrograde and is likely a captured Kuiper-belt world."
		],
		source: "NASA Neptune fact sheet; Voyager 2 abundances, rounded."
	},
	{
		id: "pluto",
		name: "Pluto",
		group: "kuiper",
		blurb: "39.5 AU · nitrogen ice",
		massKg: 1303e19,
		massEstimated: false,
		radiusKm: 1188.3,
		radiusEstimated: false,
		aAU: 39.482,
		e: .2488,
		iDeg: 17.16,
		omDeg: 110.299,
		wDeg: 113.763,
		Ldeg: 238.929,
		albedo: .52,
		pressureBar: 1e-5,
		clouds: .02,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 153.3,
		axialTilt: 122.5,
		palette: "ice",
		atm: atm({
			n2: .99,
			ch4: .005,
			co: 0
		}),
		atmConfidence: "measured",
		atmNote: "A thin nitrogen atmosphere with methane and carbon monoxide. It freezes onto the surface near aphelion.",
		surfaceTempK: 44,
		walk: "Nitrogen-ice plains. Sputnik Planitia is a glacier of N₂ sitting in an ancient basin.",
		facts: [
			"Pluto and Charon are a binary: the barycenter sits outside Pluto.",
			"Sputnik Planitia is replenished by nitrogen ice and drives a slow overturn of the crust.",
			"Orbital inclination is 17°. Matching the plane is a large share of the Δv."
		],
		source: "NASA Pluto fact sheet; New Horizons 2015 composition."
	},
	{
		id: "haumea",
		name: "Haumea",
		group: "kuiper",
		blurb: "43 AU · fast ice oval",
		massKg: 4006e18,
		massEstimated: false,
		radiusKm: 780,
		radiusEstimated: true,
		aAU: 43.116,
		e: .196,
		iDeg: 28.21,
		omDeg: 122.1,
		wDeg: 239.2,
		Ldeg: 210,
		albedo: .51,
		pressureBar: 0,
		clouds: 0,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 3.915,
		axialTilt: 0,
		palette: "ice",
		atm: atm({}),
		atmConfidence: "none",
		atmNote: "No detected atmosphere. The surface is crystalline water ice, unusually fresh for the Kuiper belt.",
		surfaceTempK: 50,
		walk: "Water-ice crust on a triaxial body. The mean radius here is a volume-equivalent stand-in for an elongated world.",
		facts: [
			"Haumea spins in about 3.9 hours — fast enough that the body is strongly elongated.",
			"It has a ring and two moons, Hiʻiaka and Namaka.",
			"A large impact likely stripped the mantle and spun it up. The family of related fragments shares the orbit region."
		],
		source: "IAU dwarf-planet data; radius is a mean of the triaxial axes, marked estimated."
	},
	{
		id: "makemake",
		name: "Makemake",
		group: "kuiper",
		blurb: "45 AU · methane ice",
		massKg: 31e20,
		massEstimated: true,
		radiusKm: 715,
		radiusEstimated: false,
		aAU: 45.43,
		e: .161,
		iDeg: 28.98,
		omDeg: 79.38,
		wDeg: 296.5,
		Ldeg: 165,
		albedo: .77,
		pressureBar: 0,
		clouds: 0,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 22.8,
		axialTilt: 0,
		palette: "tholin",
		atm: atm({ ch4: 1 }),
		atmConfidence: "prior",
		atmNote: "Surface is methane ice with tholins. Stellar occultations found no substantial atmosphere; any air is a trace at most.",
		surfaceTempK: 36,
		walk: "Methane frost and reddish tholins. The shader treats the air as a trace, not a measured atmosphere.",
		facts: [
			"Makemake is bright because fresh methane reflects sunlight. Albedo is near 0.8.",
			"A moon, MK2, is dark — a useful contrast with the bright primary.",
			"Mass is inferred from the moon and is still uncertain; it is flagged as estimated."
		],
		source: "Ortiz et al. stellar occultation; mass flagged estimated."
	},
	{
		id: "eris",
		name: "Eris",
		group: "kuiper",
		blurb: "67.9 AU · scattered disk",
		massKg: 16466e18,
		massEstimated: false,
		radiusKm: 1163,
		radiusEstimated: false,
		aAU: 67.864,
		e: .436,
		iDeg: 44.04,
		omDeg: 35.95,
		wDeg: 151.6,
		Ldeg: 204,
		albedo: .96,
		pressureBar: 0,
		clouds: .05,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 25.9,
		axialTilt: 0,
		palette: "ice",
		atm: atm({
			n2: .9,
			ch4: .1
		}),
		atmConfidence: "prior",
		atmNote: "Surface is methane and nitrogen ice, brighter than fresh snow. A seasonal nitrogen atmosphere is expected near perihelion and is not directly measured here.",
		surfaceTempK: 42,
		walk: "A bright ice crust. At aphelion any nitrogen atmosphere collapses onto the ground.",
		facts: [
			"Eris is slightly more massive than Pluto. Its discovery pressed the IAU dwarf-planet decision.",
			"Eccentricity 0.44 and inclination 44° put it on a scattered-disk orbit, not a calm Kuiper belt circle.",
			"Perihelion is near 38 AU; aphelion is beyond 97 AU."
		],
		source: "Brown, Schaller, and Sicardy measurements; atmosphere marked as a seasonal prior."
	},
	{
		id: "arrokoth",
		name: "Arrokoth",
		group: "kuiper",
		blurb: "44.6 AU · contact binary",
		massKg: 75e13,
		massEstimated: true,
		radiusKm: 9.5,
		radiusEstimated: true,
		aAU: 44.581,
		e: .0417,
		iDeg: 2.451,
		omDeg: 158.998,
		wDeg: 184.4,
		Ldeg: 320,
		albedo: .21,
		pressureBar: 0,
		clouds: 0,
		starL: 1,
		starTeff: 5772,
		starName: "Sun",
		distanceLy: 0,
		rotHours: 15.9,
		axialTilt: 99,
		palette: "tholin",
		atm: atm({}),
		atmConfidence: "none",
		atmNote: "Airless. New Horizons saw methanol and water ice under a red tholin crust.",
		surfaceTempK: 42,
		walk: "A cold classical contact binary about 36 km long. Movement is damped so the walk stays readable; true gravity is shown in the dossier.",
		facts: [
			"2014 MU69, now Arrokoth, was the second New Horizons target. Flyby: 1 January 2019.",
			"Two lobes, Wenu and Weeyo, joined gently — a sign the Kuiper belt assembled at very low speed.",
			"The surface is old, lightly cratered, and red from irradiated organics. Mass here is an estimate."
		],
		source: "New Horizons / Stern et al. 2019; mass and mean radius estimated from the shape."
	},
	{
		id: "proxima-b",
		name: "Proxima Centauri b",
		group: "exo",
		blurb: "4.2 ly · M-dwarf HZ",
		massKg: 1.07 * EARTH_MASS,
		massEstimated: true,
		radiusKm: 1.08 * EARTH_RADIUS_KM,
		radiusEstimated: true,
		aAU: .04856,
		e: .02,
		iDeg: 0,
		omDeg: 0,
		wDeg: 0,
		Ldeg: 40,
		albedo: .3,
		pressureBar: 1,
		clouds: .35,
		starL: .0017,
		starTeff: 2992,
		starName: "Proxima Centauri",
		distanceLy: 4.24,
		rotHours: 268.464,
		axialTilt: 0,
		palette: "rock",
		atm: atm({
			n2: .8,
			co2: .15,
			h2o: .02,
			ar: .03
		}),
		atmConfidence: "prior",
		atmNote: "Atmosphere unknown. The mix is an illustrative N₂/CO₂ prior, not a detection. The mass is a minimum mass, M sin i.",
		surfaceTempK: null,
		walk: "A terrain prior for a rocky world whose radius has not been measured. Flares from Proxima are noted in the dossier, not simulated as weather.",
		facts: [
			"The nearest known exoplanet. Proxima is 4.24 light-years away; this is a catalog model, not a flight.",
			"Minimum mass is about 1.07 Earth masses. Without a transit, the true mass and radius are unknown.",
			"The star is an active M5.5 dwarf. Ultraviolet flares matter as much as the equilibrium temperature."
		],
		source: "Anglada-Escudé et al. 2016; Faria et al. 2022 mass. Radius is an estimate."
	},
	{
		id: "trappist-1e",
		name: "TRAPPIST-1 e",
		group: "exo",
		blurb: "41 ly · seven-planet system",
		massKg: .692 * EARTH_MASS,
		massEstimated: false,
		radiusKm: .92 * EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: .02925,
		e: .005,
		iDeg: .1,
		omDeg: 10,
		wDeg: 20,
		Ldeg: 80,
		albedo: .3,
		pressureBar: 1,
		clouds: .4,
		starL: 553e-6,
		starTeff: 2566,
		starName: "TRAPPIST-1",
		distanceLy: 40.7,
		rotHours: 146.424,
		axialTilt: 0,
		palette: "earth",
		atm: atm({
			n2: .7,
			co2: .2,
			h2o: .05,
			o2: 0
		}),
		atmConfidence: "prior",
		atmNote: "Mass and radius are measured. The atmosphere is not — JWST has not confirmed a composition. The globe uses an N₂/CO₂ prior.",
		surfaceTempK: null,
		walk: "Rocky terrain scaled to the measured radius. Synchronous rotation is assumed from the short orbit.",
		facts: [
			"One of seven transiting planets around an ultra-cool dwarf 40.7 light-years away.",
			"Mass 0.692 and radius 0.920 Earth units give a density close to Earth’s (Agol et al. 2021).",
			"It sits in the conservative habitable zone. That is an insolation statement, not evidence of water."
		],
		source: "Agol et al. 2021; Gillon et al. 2017. Atmosphere is a prior."
	},
	{
		id: "kepler-442b",
		name: "Kepler-442 b",
		group: "exo",
		blurb: "1,200 ly · K-dwarf HZ",
		massKg: 2.3 * EARTH_MASS,
		massEstimated: true,
		radiusKm: 1.34 * EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: .409,
		e: .04,
		iDeg: .2,
		omDeg: 30,
		wDeg: 40,
		Ldeg: 120,
		albedo: .3,
		pressureBar: 1,
		clouds: .45,
		starL: .117,
		starTeff: 4402,
		starName: "Kepler-442",
		distanceLy: 1206,
		rotHours: 2695.2,
		axialTilt: 15,
		palette: "earth",
		atm: atm({
			n2: .75,
			co2: .18,
			h2o: .04,
			ar: .03
		}),
		atmConfidence: "prior",
		atmNote: "Radius is measured from the transit. Mass is a mass–radius estimate. Atmosphere unknown.",
		surfaceTempK: null,
		walk: "A super-Earth-sized terrain prior. Clouds and air color are illustrative.",
		facts: [
			"Kepler-442 b is about 1.34 Earth radii, in the habitable zone of a K star roughly 1,200 light-years away.",
			"The year is about 112 days. The star is cooler and smaller than the Sun, so the orbit sits closer in.",
			"No mass measurement exists yet. 2.3 Earth masses is an estimate and is labeled as such."
		],
		source: "Torres et al. 2015. Mass estimated; atmosphere is a prior."
	},
	{
		id: "kepler-186f",
		name: "Kepler-186 f",
		group: "exo",
		blurb: "580 ly · Earth-sized HZ",
		massKg: 1.44 * EARTH_MASS,
		massEstimated: true,
		radiusKm: 1.17 * EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: .432,
		e: .04,
		iDeg: .3,
		omDeg: 50,
		wDeg: 15,
		Ldeg: 200,
		albedo: .3,
		pressureBar: .8,
		clouds: .3,
		starL: .055,
		starTeff: 3755,
		starName: "Kepler-186",
		distanceLy: 579,
		rotHours: 129.9 * 24,
		axialTilt: 10,
		palette: "rock",
		atm: atm({
			n2: .85,
			co2: .1,
			ar: .04,
			h2o: .01
		}),
		atmConfidence: "prior",
		atmNote: "Radius only. The cooler equilibrium temperature assumes an Earth-like albedo. Air is an N₂ prior.",
		surfaceTempK: null,
		walk: "Dim reddish daylight from an M dwarf. The surface is a rocky prior, not a mapped world.",
		facts: [
			"The first Earth-sized planet found in the habitable zone of another star (Quintana et al. 2014).",
			"Radius is 1.17 Earth radii. The year is about 130 days around an M1 dwarf.",
			"Distance is about 580 light-years. Nothing in the cruise model reaches it ballistically."
		],
		source: "Quintana et al. 2014. Mass estimated; atmosphere is a prior."
	},
	{
		id: "toi-700d",
		name: "TOI-700 d",
		group: "exo",
		blurb: "101 ly · TESS habitable zone",
		massKg: 1.72 * EARTH_MASS,
		massEstimated: true,
		radiusKm: 1.144 * EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: .1633,
		e: .001,
		iDeg: .1,
		omDeg: 5,
		wDeg: 10,
		Ldeg: 260,
		albedo: .3,
		pressureBar: 1,
		clouds: .4,
		starL: .023,
		starTeff: 3480,
		starName: "TOI-700",
		distanceLy: 101.4,
		rotHours: 898.224,
		axialTilt: 5,
		palette: "earth",
		atm: atm({
			n2: .78,
			co2: .16,
			h2o: .03,
			ar: .03
		}),
		atmConfidence: "prior",
		atmNote: "Transit radius is measured. Mass is not. The atmosphere is an untested prior.",
		surfaceTempK: null,
		walk: "A quiet M-dwarf world in the model. TOI-700 is relatively inactive for its class.",
		facts: [
			"Found by TESS about 101 light-years away. The star is a quiet M2 dwarf.",
			"Radius 1.144 Earth radii, period 37.4 days, instellation a bit under Earth’s.",
			"Two inner planets (b and c) are hotter. A further world, TOI-700 e, was found later."
		],
		source: "Gilbert et al. 2020; Rodriguez et al. 2020. Mass estimated."
	},
	{
		id: "lhs-1140b",
		name: "LHS 1140 b",
		group: "exo",
		blurb: "49 ly · dense super-Earth",
		massKg: 5.6 * EARTH_MASS,
		massEstimated: false,
		radiusKm: 1.73 * EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: .0957,
		e: .06,
		iDeg: .2,
		omDeg: 80,
		wDeg: 30,
		Ldeg: 10,
		albedo: .2,
		pressureBar: 2,
		clouds: .35,
		starL: .0045,
		starTeff: 3216,
		starName: "LHS 1140",
		distanceLy: 49,
		rotHours: 592.8,
		axialTilt: 0,
		palette: "ocean",
		atm: atm({
			h2o: .4,
			n2: .45,
			co2: .12,
			h2: .03
		}),
		atmConfidence: "prior",
		atmNote: "Mass and radius are measured and imply a water-rich or rocky interior. The atmosphere is not settled; this mix is a water-world prior.",
		surfaceTempK: null,
		walk: "A dark, cold ocean prior under an M-dwarf sky. Treat the shoreline as a hypothesis, not a map.",
		facts: [
			"About 5.6 Earth masses and 1.73 Earth radii, 49 light-years away.",
			"Density allows a rocky core with a substantial water layer, or a dense rock with a thin atmosphere. Both are still discussed.",
			"The host is a quiet mid-M dwarf, which makes transmission spectroscopy more practical."
		],
		source: "Dittmann et al. 2017; Cadieux et al. updates. Atmosphere is a prior."
	},
	{
		id: "k2-18b",
		name: "K2-18 b",
		group: "exo",
		blurb: "124 ly · hydrogen envelope",
		massKg: 8.63 * EARTH_MASS,
		massEstimated: false,
		radiusKm: 2.61 * EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: .1429,
		e: .09,
		iDeg: .4,
		omDeg: 100,
		wDeg: 60,
		Ldeg: 150,
		albedo: .2,
		pressureBar: 10,
		clouds: .85,
		starL: .025,
		starTeff: 3457,
		starName: "K2-18",
		distanceLy: 124,
		rotHours: 792,
		axialTilt: 0,
		palette: "haze",
		atm: atm({
			h2: .85,
			he: .1,
			ch4: .02,
			h2o: .02,
			co2: .01
		}),
		atmConfidence: "partial",
		atmNote: "A hydrogen-rich envelope is required by the density. JWST has reported methane and carbon dioxide. Water and any biosignature claims stay out of this model.",
		surfaceTempK: null,
		walk: "You are in the haze of a sub-Neptune, not on rock. The deck is a high-pressure hydrogen atmosphere.",
		facts: [
			"8.63 Earth masses and 2.61 Earth radii: too puffy for bare rock, so a hydrogen envelope is required.",
			"It orbits in the habitable zone of an M dwarf, but the surface pressure under that envelope is not Earth’s.",
			"JWST transit spectra show CH₄ and CO₂. This simulation does not treat disputed biosignature claims as facts."
		],
		source: "Benneke et al. 2019; Madhusudhan et al. 2023 for CH₄ and CO₂."
	},
	{
		id: "55-cnc-e",
		name: "55 Cancri e",
		group: "exo",
		blurb: "41 ly · lava super-Earth",
		massKg: 7.99 * EARTH_MASS,
		massEstimated: false,
		radiusKm: 1.88 * EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: .01544,
		e: .05,
		iDeg: .5,
		omDeg: 20,
		wDeg: 90,
		Ldeg: 300,
		albedo: .1,
		pressureBar: .1,
		clouds: .05,
		starL: .58,
		starTeff: 5172,
		starName: "55 Cancri",
		distanceLy: 41,
		rotHours: .7365 * 24,
		axialTilt: 0,
		palette: "lava",
		atm: atm({
			co2: .5,
			co: .3,
			n2: .15,
			so2: .05
		}),
		atmConfidence: "prior",
		atmNote: "A lava world on an 18-hour orbit. A mineral or CO/CO₂ atmosphere has been proposed and is not settled; the mix is a prior.",
		surfaceTempK: 2e3,
		walk: "A dayside lava field. The orbit is so short the star dominates the sky.",
		facts: [
			"About 8 Earth masses and 1.9 Earth radii, orbiting a naked-eye G8 star every 18 hours.",
			"Dayside temperature is near 2,000 K. The night side is much cooler if the world is not blanketed.",
			"Phase curves show a large day–night contrast and a hotspot offset. The atmosphere is still debated."
		],
		source: "Winn et al. 2011; Bourrier et al. updates. Atmosphere marked as a prior."
	},
	{
		id: "gj1214b",
		name: "GJ 1214 b",
		group: "exo",
		blurb: "48 ly · hazy sub-Neptune",
		massKg: 8.17 * EARTH_MASS,
		massEstimated: false,
		radiusKm: 2.74 * EARTH_RADIUS_KM,
		radiusEstimated: false,
		aAU: .0149,
		e: .01,
		iDeg: .2,
		omDeg: 40,
		wDeg: 10,
		Ldeg: 70,
		albedo: .1,
		pressureBar: 5,
		clouds: 1,
		starL: .004,
		starTeff: 3250,
		starName: "GJ 1214",
		distanceLy: 47.5,
		rotHours: 37.9296,
		axialTilt: 0,
		palette: "haze",
		atm: atm({
			h2: .55,
			h2o: .3,
			he: .1,
			n2: .05
		}),
		atmConfidence: "partial",
		atmNote: "A flat transmission spectrum. Either a high-mean-molecular-weight atmosphere or a thick haze. The mix is one allowed reading, not a unique detection.",
		surfaceTempK: null,
		walk: "Opaque haze. You are inside a cloud deck; the surface, if any, is hidden.",
		facts: [
			"The original mini-Neptune, 48 light-years away, transiting every 1.58 days.",
			"Mass 8.17 Earths and radius 2.74 Earths imply a volatile-rich interior.",
			"Hubble and JWST see almost no spectral features — aerosols hide the gases underneath."
		],
		source: "Charbonneau et al. 2009; Kreidberg et al. 2014 haze result."
	},
	{
		id: "hd189733b",
		name: "HD 189733 b",
		group: "exo",
		blurb: "64 ly · hot Jupiter",
		massKg: 1.13 * JUPITER_MASS,
		massEstimated: false,
		radiusKm: 79698.54,
		radiusEstimated: false,
		aAU: .031,
		e: .004,
		iDeg: .3,
		omDeg: 15,
		wDeg: 200,
		Ldeg: 20,
		albedo: .1,
		pressureBar: 1,
		clouds: .8,
		starL: .33,
		starTeff: 5050,
		starName: "HD 189733",
		distanceLy: 64.5,
		rotHours: 53.256,
		axialTilt: 0,
		palette: "gas",
		atm: atm({
			h2: .85,
			he: .14,
			h2o: .005,
			co: .004
		}),
		atmConfidence: "partial",
		atmNote: "Hydrogen-helium hot Jupiter. Water and carbon monoxide are measured in transmission; silicate haze is inferred from the blue optical color.",
		surfaceTempK: 1200,
		walk: "A 1-bar deck in a 1,200 K wind. Silicate clouds and a hydrogen sky — not a ground.",
		facts: [
			"A hot Jupiter 64.5 light-years away, transiting a K star every 2.2 days.",
			"Sodium, water, and carbon monoxide have been measured. The deep blue color is Rayleigh scattering and haze.",
			"Winds and a dayside hotspot offset are mapped with phase curves and high-resolution spectra."
		],
		source: "Bouchy et al. 2005; transmission results from Hubble, Spitzer, and ground-based high resolution."
	},
	{
		id: "wasp-39b",
		name: "WASP-39 b",
		group: "exo",
		blurb: "750 ly · JWST benchmark",
		massKg: .28 * JUPITER_MASS,
		massEstimated: false,
		radiusKm: 88786.97,
		radiusEstimated: false,
		aAU: .0486,
		e: 0,
		iDeg: .2,
		omDeg: 60,
		wDeg: 0,
		Ldeg: 180,
		albedo: .05,
		pressureBar: 1,
		clouds: .55,
		starL: .72,
		starTeff: 5400,
		starName: "WASP-39",
		distanceLy: 750,
		rotHours: 97.32,
		axialTilt: 0,
		palette: "gas",
		atm: atm({
			h2: .82,
			he: .16,
			h2o: .008,
			co2: .006,
			so2: .004,
			co: .002
		}),
		atmConfidence: "measured",
		atmNote: "JWST’s Early Release Science target. Water, carbon dioxide, carbon monoxide, and sulfur dioxide are detected in a hydrogen-helium atmosphere.",
		surfaceTempK: 1166,
		walk: "A hot hydrogen deck. The twilight and cloud color carry the SO₂ and CO₂ that JWST measured.",
		facts: [
			"A puffy Saturn-mass planet on a 4-day orbit, about 750 light-years away.",
			"JWST found SO₂, produced by photochemistry — the first sulfur dioxide seen in an exoplanet atmosphere.",
			"CO₂ and H₂O are both clearly present. This is one of the best-measured alien atmospheres."
		],
		source: "JWST Transiting Exoplanet Community Early Release Science, 2022–2023."
	}
];
var BY_ID = new Map(BODIES.map((b) => [b.id, b]));
function getBody(id) {
	return BY_ID.get(id);
}
function bodyElements(id, tDays) {
	const b = BY_ID.get(id);
	if (!b || b.group === "sun") return null;
	return elementsAtTime(baseElements(b), tDays);
}
function teqOf(b) {
	if (b.surfaceTempK && b.id === "sun") return b.surfaceTempK;
	return equilibriumK(b.albedo, b.starL, Math.max(b.aAU, .00465));
}
function displayTemp(b) {
	return b.surfaceTempK ?? teqOf(b);
}
function gOf(b) {
	return gravityMs2(b.massKg, b.radiusKm);
}
var earth0 = bodyElements("earth", 0);
function freshShip() {
	return {
		...earth0,
		M: earth0.M + .012
	};
}
var sim = {
	phase: "title",
	t: 0,
	warp: 20,
	ship: freshShip(),
	targetId: "mars",
	tab: "impulse",
	node: "here",
	impulse: {
		pro: 0,
		norm: 0,
		rad: 0
	},
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
	stick: {
		x: 0,
		y: 0
	},
	held: /* @__PURE__ */ new Set(),
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
	camNonce: 0
};
var listeners = /* @__PURE__ */ new Set();
var version = 0;
function subscribe(l) {
	listeners.add(l);
	return () => listeners.delete(l);
}
function getVersion() {
	return version;
}
function bump() {
	version += 1;
	listeners.forEach((l) => l());
}
function say(text) {
	sim.message = text;
	sim.messageAt = sim.elapsed;
	bump();
}
function targetBody() {
	return getBody(sim.targetId) ?? BODIES[4];
}
function rpOf(el) {
	return el.a * (1 - el.e);
}
function raOf(el) {
	return el.a * (1 + el.e);
}
function touchOrbit() {
	sim.orbitStamp += 1;
	sim.plan = null;
}
function sliderToWarp(s) {
	if (s <= .001) return 0;
	return .5 * 10 ** (s * 4);
}
function warpToSlider(w) {
	if (w <= 0) return 0;
	return clamp(Math.log10(w / .5) / 4, 0, 1);
}
function begin() {
	if (sim.phase !== "title") return;
	sim.phase = "cruise";
	sim.focus = "ship";
	recomputePlan();
	say("Vesper is co-orbital with Earth. Arm a node, or let auto-land fly the window.");
}
function selectTarget(id) {
	if (!getBody(id)) return;
	sim.targetId = id;
	sim.plan = null;
	if (sim.phase !== "title" && sim.phase !== "auto") recomputePlan();
	sim.focus = "target";
	bump();
}
function setWarp(w) {
	sim.warp = clamp(w, 0, 8e3);
	bump();
}
function setTab(tab) {
	sim.tab = tab;
	bump();
}
function setNode(node) {
	sim.node = node;
	bump();
}
function setImpulse(partial) {
	sim.impulse = {
		...sim.impulse,
		...partial
	};
	sim.draft = null;
	bump();
}
function setView(view) {
	sim.view = view;
	bump();
}
function setFocus(focus) {
	sim.focus = focus;
	bump();
}
function setSheet(sheet) {
	sim.sheet = sim.sheet === sheet ? null : sheet;
	bump();
}
function closeSheet() {
	sim.sheet = null;
	bump();
}
function setDraftApo(ra) {
	sim.draft = {
		kind: "apo",
		ra
	};
	sim.tab = "shape";
	bump();
}
function setDraftPeri(rp) {
	sim.draft = {
		kind: "peri",
		rp
	};
	sim.tab = "shape";
	bump();
}
function setDraftInc(incDeg) {
	sim.draft = {
		kind: "inc",
		incDeg
	};
	sim.tab = "shape";
	bump();
}
function remaining() {
	return sim.dvBudget - sim.dvUsed;
}
function commitDv(el, proKms, normKms, radKms, free) {
	const res = applyDv(el, proKms * KMS, normKms * KMS, radKms * KMS);
	if (!res.el) {
		say(res.reason);
		return false;
	}
	const kms = res.dvAuDay / KMS;
	if (!free && kms > remaining() + .05) {
		say("Main tanks are empty. Auto-land can still draw the reserve.");
		return false;
	}
	sim.ship = res.el;
	sim.dvUsed += kms;
	sim.burnFlash = 1;
	touchOrbit();
	refreshApproach();
	if (free && sim.dvUsed > sim.dvBudget) say("Reserve propellant drawn for the arrival burn.");
	else say(`Burn ${kms.toFixed(2)} km/s · remaining ${(sim.dvBudget - sim.dvUsed).toFixed(1)} km/s`);
	return true;
}
function fireImpulse() {
	if (sim.phase !== "cruise") return;
	const { pro, norm, rad } = sim.impulse;
	if (Math.hypot(pro, norm, rad) < .001) {
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
	sim.queue = {
		node: sim.node,
		pro,
		norm,
		rad,
		left
	};
	say(left < .2 ? "Burning at the node." : "Coasting to the armed node.");
}
function applyShape() {
	if (sim.phase !== "cruise" || !sim.draft) return;
	const el = sim.ship;
	const rp = rpOf(el);
	const ra = raOf(el);
	const d = sim.draft;
	if (d.kind === "apo") {
		const a2 = (rp + Math.max(d.ra, rp + .02)) / 2;
		if (a2 >= 70) {
			say("That apoapsis leaves the modeled system.");
			return;
		}
		const vOld = Math.sqrt(MU * (2 / rp - 1 / el.a));
		const dv = (Math.sqrt(Math.max(0, MU * (2 / rp - 1 / a2))) - vOld) / KMS;
		sim.node = "pe";
		sim.queue = {
			node: "pe",
			pro: dv,
			norm: 0,
			rad: 0,
			left: timeToAnomaly(el, 0)
		};
		say("Coasting to periapsis to set apoapsis.");
	} else if (d.kind === "peri") {
		const a2 = (clamp(d.rp, .02, ra - .02) + ra) / 2;
		const vOld = Math.sqrt(MU * (2 / ra - 1 / el.a));
		const dv = (Math.sqrt(Math.max(0, MU * (2 / ra - 1 / a2))) - vOld) / KMS;
		sim.node = "ap";
		sim.queue = {
			node: "ap",
			pro: dv,
			norm: 0,
			rad: 0,
			left: timeToAnomaly(el, Math.PI)
		};
		say("Coasting to apoapsis to set periapsis.");
	} else {
		const di = d.incDeg * Math.PI / 180 - el.i;
		const nu = nodeNu("an", el);
		const dv = 2 * mag(stateVectors({
			...el,
			M: trueToMean(el.e, nu)
		}).v) * Math.sin(di / 2) / KMS;
		sim.node = "an";
		sim.queue = {
			node: "an",
			pro: 0,
			norm: dv,
			rad: 0,
			left: timeToAnomaly(el, nu)
		};
		say("Coasting to the ascending node for the plane change.");
	}
	bump();
}
function trueToMean(e, nu) {
	const c = Math.cos(nu);
	const s = Math.sin(nu);
	const b = Math.sqrt(Math.max(0, 1 - e * e));
	const E = Math.atan2(b * s / (1 + e * c), (e + c) / (1 + e * c));
	const M = E - e * Math.sin(E);
	return M < 0 ? M + TAU : M;
}
function ghostElements() {
	if (sim.phase !== "cruise" && sim.phase !== "title") return null;
	if (sim.draft?.kind === "apo" || sim.draft?.kind === "peri" || sim.draft?.kind === "inc") {
		const el = sim.ship;
		const rp = rpOf(el);
		const ra = raOf(el);
		if (sim.draft.kind === "apo") {
			const ra2 = Math.max(sim.draft.ra, rp + .02);
			const a = (rp + ra2) / 2;
			const e = clamp((ra2 - rp) / (ra2 + rp), 0, .96);
			return {
				...el,
				a,
				e
			};
		}
		if (sim.draft.kind === "peri") {
			const rp2 = clamp(sim.draft.rp, .02, ra - .02);
			const a = (rp2 + ra) / 2;
			const e = clamp((ra - rp2) / (ra + rp2), 0, .96);
			return {
				...el,
				a,
				e
			};
		}
		return {
			...el,
			i: sim.draft.incDeg * Math.PI / 180
		};
	}
	const { pro, norm, rad } = sim.impulse;
	if (Math.hypot(pro, norm, rad) < .001) return null;
	return applyDv(sim.node === "here" ? sim.ship : propagate(sim.ship, timeToAnomaly(sim.ship, nodeNu(sim.node, sim.ship))), pro * KMS, norm * KMS, rad * KMS).el;
}
function recomputePlan() {
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
			note: `${body.distanceLy.toFixed(body.distanceLy < 10 ? 2 : 0)} light-years. The globe uses published mass, radius, orbit, and atmosphere — it is not a ballistic flight.`
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
		note: "Ballistic transfer in the Sun’s gravity. Auto-land waits out the real launch window, then coasts."
	};
	bump();
}
function planSun(ship, t) {
	const { r, v } = stateVectors(ship);
	const rmag = Math.max(mag(r), .05);
	const a = (rmag + .02) / 2;
	const vApo = Math.sqrt(MU * (2 / rmag - 1 / a));
	const vNew = mul(normalize(cross({
		x: r.y * v.z - r.z * v.y,
		y: r.z * v.x - r.x * v.z,
		z: r.x * v.y - r.y * v.x
	}, r)), vApo);
	const transfer = cartesianToElements(r, vNew) ?? ship;
	return {
		kind: "sun",
		tDep: t,
		tof: timeToAnomaly(transfer, 0),
		dv1: mag(sub(vNew, v)),
		dv2: 0,
		transfer,
		arrival: transfer,
		errAU: 0,
		note: "A retrograde burn drops perihelion to 0.02 AU. The walk is a photosphere reconstruction, not a landing."
	};
}
function cross(a, b) {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x
	};
}
function normalize(a) {
	return mul(a, 1 / (mag(a) || 1));
}
function bestTransfer(ship, targetNow) {
	const n1 = meanMotion(ship.a);
	const n2 = meanMotion(targetNow.a);
	const syn = Math.abs(n1 - n2) < 1e-8 ? periodDays(ship.a) : TAU / Math.abs(n1 - n2);
	const aT = (ship.a + targetNow.a) / 2;
	const tofH = Math.PI * Math.sqrt(aT * aT * aT / MU);
	let best = null;
	let bestLoose = null;
	const scales = [
		.72,
		.9,
		1,
		1.15,
		1.4
	];
	for (let i = 0; i < 26; i++) {
		const tOff = (i + .5) / 26 * syn;
		const st = stateVectors(propagate(ship, tOff));
		for (const s of scales) {
			const tof = Math.max(12, tofH * s);
			const ts = stateVectors(propagate(targetNow, tOff + tof));
			if (mag(ts.r) < .02 || mag(st.r) < .02) continue;
			const sol = lambert(st.r, ts.r, tof);
			if (!sol) continue;
			const transfer = cartesianToElements(st.r, sol.v1);
			if (!transfer) continue;
			const err = mag(sub(stateVectors(propagate(transfer, tof)).r, ts.r));
			const dv1 = mag(sub(sol.v1, st.v));
			const dv2 = mag(sub(ts.v, sol.v2));
			const cand = {
				tOff,
				tof,
				dv1,
				dv2,
				transfer,
				err
			};
			if (!bestLoose || err < bestLoose.err) bestLoose = cand;
			if (err > .2) continue;
			if (!best || dv1 + dv2 < best.dv1 + best.dv2) best = cand;
		}
	}
	return best ?? (bestLoose && bestLoose.err < .8 ? bestLoose : null);
}
function planDvKms(plan) {
	if (!plan || plan.kind === "fold") return 0;
	return (plan.dv1 + plan.dv2) / KMS;
}
function autoLand() {
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
function cancelAuto() {
	if (sim.phase !== "auto") return;
	sim.phase = "cruise";
	sim.burnFlash = 0;
	sim.camNonce += 1;
	recomputePlan();
	say("Auto-land cancelled. Orbit left as the burn sequence had it.");
}
function finishAuto() {
	const plan = sim.plan;
	const body = targetBody();
	if (plan?.kind === "ballistic" && plan.arrival) {
		sim.ship = {
			...plan.arrival,
			M: plan.arrival.M + .004
		};
		sim.t = plan.tDep + plan.tof;
		sim.dvUsed += planDvKms(plan);
	} else if (plan?.kind === "sun" && plan.transfer) {
		sim.ship = propagate(plan.transfer, plan.tof);
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
function enterSurface() {
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
function returnToGlobe() {
	sim.phase = "globe";
	sim.codex = false;
	sim.sceneEpoch += 1;
	bump();
}
function returnToFlight() {
	const b = targetBody();
	if (b.group === "planet" || b.group === "kuiper") {
		const el = bodyElements(b.id, sim.t);
		if (el) sim.ship = {
			...el,
			M: el.M + .02
		};
	} else if (b.group === "sun") {
		const el = cartesianToElements({
			x: .08,
			y: 0,
			z: 0
		}, {
			x: 0,
			y: Math.sqrt(MU / .08),
			z: 0
		});
		if (el) sim.ship = el;
	} else {
		const el = bodyElements("earth", sim.t);
		if (el) sim.ship = {
			...el,
			M: el.M + .02
		};
		say("Catalog lens closed. Vesper is back on Earth’s orbit.");
	}
	sim.phase = "cruise";
	sim.sceneEpoch += 1;
	sim.camNonce += 1;
	sim.draft = null;
	touchOrbit();
	recomputePlan();
}
function landIfClose() {
	if (!sim.canLand || sim.phase !== "cruise") return;
	sim.phase = "globe";
	sim.sceneEpoch += 1;
	sim.view = targetBody().palette === "star" ? "heat" : "composite";
	say("Capture confirmed. Surface model is live.");
}
function refreshApproach() {
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
		sim.canLand = peri < .035 && dNu < .45;
		return;
	}
	const tgt = bodyElements(body.id, sim.t);
	if (!tgt) return;
	const horizon = Math.min(Math.max(periodDays(sim.ship.a), periodDays(tgt.a)), 8e3);
	let best = Infinity;
	let eta = 0;
	const N = 180;
	const ship0 = sim.ship;
	for (let i = 0; i <= N; i++) {
		const dt = horizon * i / N;
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
	const mRatio = body.massKg / 198847e25;
	const soi = Math.max(.01, body.aAU * mRatio ** .4);
	sim.canLand = mag(sub(sNow.r, gNow.r)) < Math.max(soi * .9, .025) && sim.relKms < 2.8;
}
function tickQueue(dt) {
	const q = sim.queue;
	if (!q || sim.phase !== "cruise") return;
	const step = Math.min(q.left, Math.max(q.left * (dt / 1.15), dt * 40));
	if (q.left > .03) {
		sim.ship = propagate(sim.ship, step);
		sim.t += step;
		q.left -= step;
		sim.burnFlash = .2;
		return;
	}
	sim.ship = propagate(sim.ship, Math.max(0, q.left));
	sim.t += Math.max(0, q.left);
	const nu = q.node === "here" ? trueAnomaly(sim.ship) : nodeNu(q.node, sim.ship);
	sim.ship = {
		...sim.ship,
		M: trueToMean(sim.ship.e, nu)
	};
	sim.queue = null;
	commitDv(sim.ship, q.pro, q.norm, q.rad, false);
	recomputePlan();
}
function tickAuto(dt) {
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
	if (u < .16) {
		const f = u / .16;
		const eased = f * f * (3 - 2 * f);
		const dtDays = (plan.tDep - sim.autoT0) * eased;
		sim.t = sim.autoT0 + dtDays;
		sim.ship = propagate(start, dtDays);
		sim.focus = "ship";
	} else if (u < .26) {
		sim.t = plan.tDep;
		if (plan.transfer) sim.ship = plan.transfer;
		sim.burnFlash = 1;
		sim.focus = "ship";
	} else if (u < .78) {
		const f = (u - .26) / .52;
		sim.t = plan.tDep + plan.tof * f;
		if (plan.transfer) sim.ship = propagate(plan.transfer, plan.tof * f);
		sim.focus = f < .5 ? "ship" : "target";
	} else if (u < .9) {
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
function moveScale(body) {
	const gScale = clamp(gOf(body) / 9.80665, .15, 2.5);
	return {
		speed: 9 / Math.sqrt(gScale),
		grav: 22 * gScale,
		jump: 7.2 / Math.sqrt(gScale)
	};
}
function tickWalker(dt) {
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
	if (sim.held.has("Space") && sim.hop <= .02) sim.vy = jump;
	sim.vy -= grav * dt;
	sim.hop += sim.vy * dt;
	if (sim.hop <= 0) {
		sim.hop = 0;
		sim.vy = 0;
	}
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
function beaconAt(i) {
	const ang = i / 4 * TAU + .5;
	const rad = 22 + i % 3 * 7;
	return {
		x: Math.cos(ang) * rad,
		z: Math.sin(ang) * rad
	};
}
var approachAcc = 0;
function tick(dt) {
	const step = Math.min(dt, .05);
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
		if (approachAcc > .45) {
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
function bindProbe() {
	if (typeof window === "undefined") return;
	window.__controlsTest = {
		getYaw: () => sim.yaw,
		getSpeed: () => sim.speed,
		setKeys: (codes) => {
			sim.held = new Set(codes);
		},
		setSteer: (v) => {
			sim.steerOverride = v;
		}
	};
	window.__debugExplore = (id) => {
		if (id && getBody(id)) sim.targetId = id;
		enterSurface();
	};
	window.__debugGlobe = (id) => {
		if (id && getBody(id)) sim.targetId = id;
		sim.phase = "globe";
		sim.sceneEpoch += 1;
		bump();
	};
}
var GROUPS = [
	{
		id: "planet",
		label: "Planets"
	},
	{
		id: "kuiper",
		label: "Kuiper belt"
	},
	{
		id: "sun",
		label: "The Sun"
	},
	{
		id: "exo",
		label: "Catalog worlds"
	}
];
var NODES = [
	{
		id: "here",
		label: "Here"
	},
	{
		id: "pe",
		label: "Periapsis"
	},
	{
		id: "ap",
		label: "Apoapsis"
	},
	{
		id: "an",
		label: "Ascending"
	},
	{
		id: "dn",
		label: "Descending"
	}
];
var GAS = {
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
	co: "Carbon monoxide"
};
var btn = "inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-40";
var primary = `${btn} bg-fg text-bg`;
var quiet = `${btn} border border-line bg-subtle text-fg`;
function useSim() {
	return (0, import_react.useSyncExternalStore)(subscribe, getVersion, getVersion);
}
function fmtAU(n) {
	if (!Number.isFinite(n)) return "—";
	if (Math.abs(n) < .01) return `${Math.round(n * 149597870.7).toLocaleString()} km`;
	return `${n.toFixed(n < 10 ? 3 : 1)} AU`;
}
function fmtDays(d) {
	if (!Number.isFinite(d)) return "—";
	if (d < 1.5) return `${(d * 24).toFixed(1)} h`;
	if (d < 800) return `${Math.round(d)} d`;
	return `${(d / 365.25).toFixed(1)} yr`;
}
function massLabel(b) {
	const est = b.massEstimated ? " est." : "";
	if (b.id === "sun") return "1 solar mass";
	const me = b.massKg / EARTH_MASS;
	const mj = b.massKg / JUPITER_MASS;
	if (mj >= .08) return `${mj.toFixed(2)} Jupiter masses${est}`;
	if (me >= .01) return `${me.toFixed(2)} Earth masses${est}`;
	return `${b.massKg.toExponential(2)} kg${est}`;
}
function radiusLabel(b) {
	const est = b.radiusEstimated ? " est." : "";
	if (b.id === "sun") return "695,700 km";
	const re = b.radiusKm / EARTH_RADIUS_KM;
	if (re >= 8) return `${re.toFixed(1)} Earth radii${est}`;
	return `${re.toFixed(2)} Earth radii${est}`;
}
function Hud() {
	useSim();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 text-fg",
		children: [
			sim.glError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-auto absolute inset-x-4 top-4 rounded-lg bg-elevated px-4 py-3 text-sm",
				children: sim.glError
			}) : null,
			sim.phase === "title" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, {}) : null,
			sim.phase === "cruise" || sim.phase === "auto" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flight, {}) : null,
			sim.phase === "globe" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobeHud, {}) : null,
			sim.phase === "surface" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SurfaceHud, {}) : null
		]
	});
}
function Title() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 flex items-end p-4 sm:items-center sm:p-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "panel pointer-events-auto rise w-full max-w-xl p-6 sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wide text-muted",
					children: "Earth orbit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-4xl font-medium tracking-tight sm:text-5xl",
					children: "Aphelion"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-prose text-base leading-relaxed text-muted",
					children: "Vesper is a stainless reusable ship, already in orbit. Plot a transfer to a planet, a Kuiper-belt world, or the Sun. On arrival the globe is built from that body’s mass, radius, distance, and air — then you can walk it."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex flex-wrap gap-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: primary,
						onClick: begin,
						children: "Begin departure"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-xs leading-relaxed text-faint",
					children: "Maneuvers are Keplerian. Solar-system figures are mean elements. Exoplanet atmospheres are labeled measured, partial, or prior."
				}),
				!sim.glReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-muted",
					children: "Plotting the ecliptic…"
				}) : null
			]
		})
	});
}
function Flight() {
	const body = targetBody();
	const plan = sim.plan;
	const auto = sim.phase === "auto";
	const msg = sim.elapsed - sim.messageAt < 6 ? sim.message : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto rounded-lg border border-line bg-elevated/90 px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Vesper"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-sm tabular-nums",
					children: [
						"Day ",
						sim.t.toFixed(0),
						" · ",
						sim.warp <= 0 ? "held" : `${Math.round(sim.warp)} d/s`
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto rounded-lg border border-line bg-elevated/90 px-3 py-2 text-right",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Propellant"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-sm tabular-nums",
					children: [
						Math.max(0, sim.dvBudget - sim.dvUsed).toFixed(1),
						" / ",
						sim.dvBudget,
						" km/s"
					]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "absolute top-20 bottom-24 left-4 hidden w-72 lg:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel pointer-events-auto flex h-full flex-col p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Destinations, {})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "absolute top-20 right-4 bottom-24 hidden w-80 lg:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel pointer-events-auto flex h-full flex-col gap-4 overflow-y-auto p-4",
				children: auto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutoStatus, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maneuver, {})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
			className: "absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3 sm:p-4",
			children: [
				msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "pointer-events-none mx-auto max-w-lg text-center text-sm text-fg",
					children: msg
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto mx-auto flex w-full max-w-lg flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap items-center justify-center gap-2",
						children: auto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quiet,
							onClick: cancelAuto,
							children: "Cancel"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: primary,
							onClick: autoLand,
							children: landCta(body)
						}), sim.canLand ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quiet,
							onClick: landIfClose,
							children: "Land now"
						}) : null] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-center font-mono text-xs tabular-nums text-muted",
						children: [
							body.name,
							plan?.kind === "fold" ? ` · ${body.distanceLy.toFixed(body.distanceLy < 10 ? 1 : 0)} ly` : plan ? ` · transfer ${planDvKms(plan).toFixed(1)} km/s · coast ${fmtDays(plan.tof)}` : "",
							body.group !== "exo" && body.group !== "sun" ? ` · miss ${fmtAU(sim.missAU)}` : ""
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pointer-events-auto flex gap-2 lg:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${quiet} flex-1`,
						onClick: () => setSheet("dest"),
						children: "Destinations"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `${quiet} flex-1`,
						onClick: () => setSheet("burn"),
						children: auto ? "Flight" : "Maneuver"
					})]
				})
			]
		}),
		sim.sheet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-auto absolute inset-x-0 bottom-0 p-3 lg:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sheet panel flex flex-col overflow-hidden p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: sim.sheet === "dest" ? "Destinations" : auto ? "Flight" : "Maneuver"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: quiet,
						onClick: closeSheet,
						children: "Close"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-y-auto",
					children: sim.sheet === "dest" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Destinations, {}) : auto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AutoStatus, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maneuver, {})
				})]
			})
		}) : null
	] });
}
function landCta(body) {
	if (body.group === "exo") return "Open surface model";
	if (body.group === "sun") return "Enter photosphere model";
	return "Auto-land";
}
function Destinations() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1",
		children: GROUPS.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-2 pb-1 text-xs text-faint",
			children: g.label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "flex flex-col gap-1",
			children: BODIES.filter((b) => b.group === g.id).map((b) => {
				const on = b.id === sim.targetId;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => selectTarget(b.id),
					className: `flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left ${on ? "bg-subtle text-fg" : "text-muted hover:bg-subtle hover:text-fg"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium",
						children: b.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-faint",
						children: b.blurb
					})]
				}) }, b.id);
			})
		})] }, g.id))
	});
}
function Maneuver() {
	const el = sim.ship;
	const rp = rpOf(el);
	const ra = raOf(el);
	const inc = el.i * 180 / Math.PI;
	const nodeName = NODES.find((n) => n.id === sim.node)?.label ?? "Here";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 font-mono text-xs tabular-nums text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Semi-major",
						v: `${el.a.toFixed(3)} AU`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Eccentricity",
						v: el.e.toFixed(3)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Inclination",
						v: `${inc.toFixed(2)}°`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Periapsis",
						v: fmtAU(rp)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Apoapsis",
						v: fmtAU(ra)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Approach",
						v: targetBody().group === "sun" ? `peri ${fmtAU(sim.missAU)}` : fmtAU(sim.missAU)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "ETA",
						v: fmtDays(sim.missEta)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Relative",
						v: `${sim.relKms.toFixed(1)} km/s`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					"ship",
					"target",
					"sun"
				].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: sim.focus === f ? primary : quiet,
					onClick: () => setFocus(f),
					children: f === "ship" ? "Frame ship" : f === "target" ? "Frame target" : "Frame Sun"
				}, f))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex flex-col gap-1 text-xs text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex justify-between",
					children: ["Time compression", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-fg tabular-nums",
						children: sim.warp <= 0 ? "Hold" : `${Math.round(sim.warp)} d/s`
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 0,
					max: 1,
					step: .01,
					value: warpToSlider(sim.warp),
					"aria-label": "Time compression",
					onChange: (e) => setWarp(sliderToWarp(Number(e.target.value)))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex rounded-lg bg-subtle p-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `min-h-11 flex-1 rounded-md text-sm ${sim.tab === "impulse" ? "bg-elevated text-fg" : "text-muted"}`,
					onClick: () => setTab("impulse"),
					children: "Impulse"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `min-h-11 flex-1 rounded-md text-sm ${sim.tab === "shape" ? "bg-elevated text-fg" : "text-muted"}`,
					onClick: () => setTab("shape"),
					children: "Shape"
				})]
			}),
			sim.tab === "impulse" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1",
						children: NODES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `${sim.node === n.id ? primary : quiet} px-3`,
							onClick: () => setNode(n.id),
							children: n.label
						}, n.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Range, {
						label: "Prograde",
						hint: "negative slows you",
						min: -6,
						max: 8,
						step: .05,
						value: sim.impulse.pro,
						display: `${sim.impulse.pro.toFixed(2)} km/s`,
						onChange: (v) => setImpulse({ pro: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Range, {
						label: "Normal",
						hint: "plane change",
						min: -4,
						max: 4,
						step: .05,
						value: sim.impulse.norm,
						display: `${sim.impulse.norm.toFixed(2)} km/s`,
						onChange: (v) => setImpulse({ norm: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Range, {
						label: "Radial",
						hint: "in or out",
						min: -3,
						max: 3,
						step: .05,
						value: sim.impulse.rad,
						display: `${sim.impulse.rad.toFixed(2)} km/s`,
						onChange: (v) => setImpulse({ rad: v })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: primary,
						onClick: fireImpulse,
						children: ["Burn at ", nodeName.toLowerCase()]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs leading-relaxed text-faint",
						children: "The pale orbit is the result of this burn. Nodal burns coast to periapsis, apoapsis, or a node, then fire."
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Range, {
						label: "Apoapsis",
						hint: "burn at periapsis",
						min: Math.max(.05, rp + .02),
						max: 40,
						step: .01,
						value: sim.draft?.kind === "apo" ? sim.draft.ra : ra,
						display: fmtAU(sim.draft?.kind === "apo" ? sim.draft.ra : ra),
						onChange: setDraftApo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Range, {
						label: "Periapsis",
						hint: "burn at apoapsis",
						min: .02,
						max: Math.max(.05, ra - .02),
						step: .01,
						value: sim.draft?.kind === "peri" ? sim.draft.rp : rp,
						display: fmtAU(sim.draft?.kind === "peri" ? sim.draft.rp : rp),
						onChange: setDraftPeri
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Range, {
						label: "Inclination",
						hint: "burn at ascending node",
						min: 0,
						max: 45,
						step: .1,
						value: sim.draft?.kind === "inc" ? sim.draft.incDeg : inc,
						display: `${(sim.draft?.kind === "inc" ? sim.draft.incDeg : inc).toFixed(1)}°`,
						onChange: setDraftInc
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: primary,
						disabled: !sim.draft,
						onClick: applyShape,
						children: "Apply shape at node"
					})
				]
			}),
			sim.plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-relaxed text-faint",
				children: sim.plan.note
			}) : null
		]
	});
}
function AutoStatus() {
	const plan = sim.plan;
	const u = Math.max(0, Math.min(1, sim.autoU));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed",
				children: plan?.kind === "fold" ? "Folding a catalog lens. Published parameters drive the globe; the distance is not being flown." : plan?.kind === "sun" ? "Dropping perihelion. The photosphere you enter is a reconstruction." : "Waiting out the launch window, then flying the transfer and matching the target."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-2 overflow-hidden rounded-full bg-subtle",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-full bg-fg",
					style: { width: `${Math.round(u * 100)}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs tabular-nums text-muted",
				children: plan ? `${planDvKms(plan).toFixed(1)} km/s planned · coast ${fmtDays(plan.tof)}` : "Plotting"
			})
		]
	});
}
function GlobeHud() {
	const b = targetBody();
	const gases = Object.entries(b.atm).filter(([, v]) => v >= .001).sort((a, c) => c[1] - a[1]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: "absolute top-3 right-3 left-3 max-h-64 overflow-hidden lg:right-auto lg:bottom-24 lg:left-4 lg:w-80 lg:max-h-none",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel pointer-events-auto flex h-full flex-col gap-4 overflow-y-auto p-4 sm:p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: b.starName === "Sun" && b.id !== "sun" ? "Solar system" : b.starName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-medium tracking-tight",
						children: b.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: b.walk
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "grid grid-cols-2 gap-2 font-mono text-xs tabular-nums",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Mass",
							v: massLabel(b)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Radius",
							v: radiusLabel(b)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Distance",
							v: b.group === "exo" ? `${b.distanceLy.toFixed(b.distanceLy < 10 ? 2 : 0)} ly` : b.id === "sun" ? "—" : `${b.aAU.toFixed(3)} AU`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Gravity",
							v: `${gOf(b).toFixed(gOf(b) >= 10 ? 1 : 2)} m/s²`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Temperature",
							v: `${Math.round(displayTemp(b))} K`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Eq. temp",
							v: b.id === "sun" ? "—" : `${Math.round(teqOf(b))} K`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Pressure",
							v: b.pressureBar >= .01 ? `${b.pressureBar.toFixed(b.pressureBar >= 10 ? 0 : 2)} bar` : b.pressureBar > 0 ? "trace" : "none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							k: "Albedo",
							v: b.albedo.toFixed(2)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: ["Atmosphere · ", b.atmConfidence]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-2 flex flex-col gap-1",
						children: [gases.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-faint",
							children: "No bulk atmosphere"
						}) : null, gases.map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: GAS[k] ?? k }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-1.5 overflow-hidden rounded-full bg-subtle",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block h-full bg-fg",
										style: { width: `${Math.min(100, v * 100)}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono tabular-nums text-muted",
									children: [(v * 100).toFixed(v < .01 ? 2 : 1), "%"]
								})
							]
						}, k))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs leading-relaxed text-faint",
						children: b.atmNote
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-2 text-sm leading-relaxed text-muted",
					children: b.facts.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: f }, f))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs leading-relaxed text-faint",
					children: b.source
				})
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto absolute right-3 bottom-4 left-3 flex flex-col gap-2 sm:right-4 sm:left-auto sm:w-72",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex rounded-lg bg-elevated p-1",
				children: [
					["natural", "Albedo"],
					["composite", "Composite"],
					["heat", "Heat"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `min-h-11 flex-1 rounded-md text-sm ${sim.view === id ? "bg-fg text-bg" : "text-muted"}`,
					onClick: () => setView(id),
					children: label
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: primary,
				onClick: enterSurface,
				children: "Walk the surface"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: quiet,
				onClick: returnToFlight,
				children: "Return to flight"
			})
		]
	})] });
}
function SurfaceHud() {
	const b = getBody(sim.targetId);
	const fact = sim.nearFact >= 0 ? b.facts[sim.nearFact] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "absolute top-3 right-3 left-3 flex items-start justify-between gap-3 sm:top-4 sm:right-4 sm:left-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto max-w-sm rounded-lg border border-line bg-elevated/90 px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: b.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-xs tabular-nums text-muted",
					children: [
						gOf(b).toFixed(gOf(b) >= 10 ? 1 : 2),
						" m/s² · ",
						Math.round(displayTemp(b)),
						" K"
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-auto flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: quiet,
					onClick: () => setCodex(!sim.codex),
					children: "Codex"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: quiet,
					onClick: returnToGlobe,
					children: "Orbit"
				})]
			})]
		}),
		fact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
			className: "panel pointer-events-auto absolute inset-x-4 top-24 p-4 text-sm leading-relaxed sm:top-auto sm:right-auto sm:bottom-28 sm:left-4 sm:max-w-md",
			children: fact
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "pointer-events-none absolute bottom-28 left-4 hidden text-xs text-muted sm:block",
			children: "A and D turn. W and S walk. Space jumps. Walk up to a marker."
		}),
		sim.codex ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-auto absolute inset-x-4 top-24 bottom-36 overflow-y-auto sm:left-auto sm:w-96",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel flex flex-col gap-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "Field notes"
					}),
					b.facts.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted",
						children: f
					}, f)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-faint",
						children: b.atmNote
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: quiet,
						onClick: () => setCodex(false),
						children: "Close"
					})
				]
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SurfaceControls, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "pointer-events-none absolute right-4 bottom-36 left-4 text-center text-xs text-muted lg:hidden",
			children: "Drag the view to turn. The stick walks."
		})
	] });
}
function setCodex(open) {
	sim.codex = open;
	bump();
}
function SurfaceControls() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto absolute inset-x-0 bottom-0 flex items-end justify-between p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stick, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
					code: "KeyA",
					label: "Left"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
					code: "KeyW",
					label: "Walk"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
					code: "KeyD",
					label: "Right"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
					code: "Space",
					label: "Jump"
				})
			]
		})]
	});
}
function Hold({ code, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `${quiet} px-3`,
		onPointerDown: (e) => {
			e.preventDefault();
			sim.held.add(code);
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		onPointerUp: () => sim.held.delete(code),
		onPointerCancel: () => sim.held.delete(code),
		children: label
	});
}
function Stick() {
	const [knob, setKnob] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	function setStick(x, y) {
		sim.stick.x = x;
		sim.stick.y = y;
		setKnob({
			x,
			y
		});
	}
	function move(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
		const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
		setStick(Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, -dy)));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-24 w-24 touch-none place-items-center rounded-full border border-line bg-elevated/80 lg:hidden",
		onPointerDown: (e) => {
			e.currentTarget.setPointerCapture(e.pointerId);
			move(e);
		},
		onPointerMove: (e) => {
			if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
		},
		onPointerUp: () => setStick(0, 0),
		onPointerCancel: () => setStick(0, 0),
		role: "slider",
		"aria-label": "Move",
		"aria-valuemin": -1,
		"aria-valuemax": 1,
		"aria-valuenow": knob.y,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "h-8 w-8 rounded-full bg-fg",
			style: { transform: `translate(${knob.x * 28}px, ${-knob.y * 28}px)` }
		})
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md bg-subtle px-2 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-faint",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 text-fg",
			children: v
		})]
	});
}
function Range({ label, hint, min, max, step, value, display, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex flex-col text-xs text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [label, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-faint",
				children: [" · ", hint]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-fg tabular-nums",
				children: display
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min,
			max,
			step,
			value: Math.max(min, Math.min(max, value)),
			"aria-label": label,
			onChange: (e) => onChange(Number(e.target.value))
		})]
	});
}
function Mission() {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		let world = null;
		let dead = false;
		const canvas = ref.current;
		if (!canvas) return;
		import("./world-CqIV-iv7.mjs").then(({ MissionWorld }) => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg font-sans text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref,
			className: "absolute inset-0 h-full w-full touch-none",
			"aria-label": "Flight view"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {})]
	});
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => SplitComponent });
var SplitComponent = Mission;
//#endregion
export { ghostElements as a, BODIES as c, getBody as d, meanFromTrue as f, bump as i, bodyElements as l, begin as n, sim as o, stateVectors as p, bindProbe as r, tick as s, routes_exports as t, displayTemp as u };
