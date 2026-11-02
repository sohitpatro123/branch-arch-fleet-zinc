import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  BODIES,
  bodyElements,
  displayTemp,
  getBody,
  type BodyDef,
  type Palette,
} from "./bodies";
import { meanFromTrue, stateVectors, type Elements } from "./kepler";
import {
  ATMO_FRAG,
  CLOUD_FRAG,
  GLOBE_FRAG,
  GLOBE_VERT,
  SKY_FRAG,
  SKY_VERT,
  SUN_FRAG,
} from "./shaders";
import { bindProbe, bump, begin, ghostElements, sim, tick } from "./sim";
import { ampFor, heightAt, seedOf, skyFor, surfaceColor } from "./terrain";
import { type V3 } from "./vec";

const TAU = Math.PI * 2;

function visualRadius(b: BodyDef): number {
  if (b.id === "sun") return 0.16;
  const x = Math.max(b.radiusKm / 6371, 0.04);
  return 0.0105 * x ** 0.3 + 0.0038;
}

function kindOf(p: Palette): number {
  switch (p) {
    case "gas":
      return 1;
    case "icegiant":
      return 2;
    case "ice":
      return 3;
    case "lava":
      return 4;
    case "venus":
      return 5;
    case "star":
      return 6;
    case "mars":
      return 7;
    case "earth":
    case "ocean":
      return 8;
    case "tholin":
      return 9;
    case "haze":
      return 10;
    default:
      return 0;
  }
}

function tint(p: Palette): number {
  switch (p) {
    case "earth":
    case "ocean":
      return 0x6e8c86;
    case "mars":
      return 0xa15c3c;
    case "venus":
      return 0xc2ae7a;
    case "gas":
      return 0xc2b59a;
    case "icegiant":
      return 0x7f9aa6;
    case "ice":
      return 0xd5ddd8;
    case "lava":
      return 0xa84b32;
    case "tholin":
      return 0x8a5a48;
    case "haze":
      return 0x8a9aa4;
    default:
      return 0x9a9088;
  }
}

function airColors(b: BodyDef): { ray: THREE.Color; set: THREE.Color; width: number } {
  const a = b.atm;
  const ray = new THREE.Color(0.02, 0.03, 0.05);
  ray.r += 0.25 * a.n2 + 0.2 * a.o2 + 0.75 * a.co2 + 0.08 * a.ch4 + 0.7 * a.so2 + 0.45 * a.h2 + 0.4 * a.h2o;
  ray.g += 0.45 * a.n2 + 0.5 * a.o2 + 0.62 * a.co2 + 0.55 * a.ch4 + 0.55 * a.so2 + 0.5 * a.h2 + 0.55 * a.h2o + 0.35 * a.nh3;
  ray.b += 0.85 * a.n2 + 0.95 * a.o2 + 0.28 * a.co2 + 0.62 * a.ch4 + 0.18 * a.so2 + 0.55 * a.h2 + 0.6 * a.he;
  const set = ray.clone();
  if (a.ch4 > 0.01 && a.h2 > 0.4) set.setRGB(0.25, 0.55, 0.6);
  else if (a.co2 > 0.5) set.setRGB(0.85, 0.55, 0.25);
  else if (b.palette === "mars") set.setRGB(0.35, 0.5, 0.7);
  else set.setRGB(Math.min(1, ray.r + 0.45), ray.g * 0.55, ray.b * 0.35);
  const width = Math.max(0.15, Math.min(1, Math.log10(b.pressureBar + 1.2) / 2));
  return { ray, set, width };
}

export class MissionWorld {
  readonly renderer: THREE.WebGLRenderer;
  private readonly timer = new THREE.Timer();
  private readonly spaceScene = new THREE.Scene();
  private readonly spaceCam = new THREE.PerspectiveCamera(48, 1, 0.0008, 800);
  private readonly globeScene = new THREE.Scene();
  private readonly globeCam = new THREE.PerspectiveCamera(42, 1, 0.01, 50);
  private readonly surfScene = new THREE.Scene();
  private readonly surfCam = new THREE.PerspectiveCamera(58, 1, 0.08, 600);
  private readonly spaceCtl: OrbitControls;
  private readonly globeCtl: OrbitControls;
  private readonly planets = new Map<string, THREE.Object3D>();
  private readonly ship: THREE.Group;
  private readonly plume: THREE.Object3D;
  private readonly shipLine: THREE.Line;
  private readonly ghostLine: THREE.Line;
  private readonly planLine: THREE.Line;
  private readonly markers: THREE.Mesh[] = [];
  private readonly tmp = new THREE.Vector3();
  private readonly tmp2 = new THREE.Vector3();
  private readonly tmp3 = new THREE.Vector3();
  private readonly sunDir = new THREE.Vector3(1, 0.25, 0.35).normalize();
  private builtKey = "";
  private shipKey = "";
  private planKey = "";
  private ghostKey = "";
  private camNonce = -1;
  private disposed = false;
  private readonly onResize: () => void;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;
  private readonly onBlur: () => void;
  private drag = false;
  private lastX = 0;
  private globeMat: THREE.ShaderMaterial | null = null;
  private cloudMat: THREE.ShaderMaterial | null = null;
  private atmoMat: THREE.ShaderMaterial | null = null;
  private globePivot: THREE.Group | null = null;
  private walker: THREE.Group | null = null;
  private surfSeed = 1;
  private surfAmp = 8;
  private readonly shipVis = new THREE.Vector3();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      logarithmicDepthBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x0a0a0b, 1);
    this.timer.connect(document);
    this.spaceScene.background = new THREE.Color(0x0a0a0b);
    this.globeScene.background = new THREE.Color(0x07080a);
    this.surfScene.background = new THREE.Color(0x0a0a0b);

    this.spaceCtl = new OrbitControls(this.spaceCam, canvas);
    this.spaceCtl.enableDamping = true;
    this.spaceCtl.dampingFactor = 0.08;
    this.spaceCtl.minDistance = 0.03;
    this.spaceCtl.maxDistance = 180;
    this.globeCtl = new OrbitControls(this.globeCam, canvas);
    this.globeCtl.enableDamping = true;
    this.globeCtl.autoRotate = true;
    this.globeCtl.autoRotateSpeed = 0.35;
    this.globeCtl.minDistance = 1.35;
    this.globeCtl.maxDistance = 8;
    this.globeCtl.enablePan = false;

    this.buildSpace();
    this.ship = this.buildShip();
    this.plume = this.ship.getObjectByName("plume")!;
    this.spaceScene.add(this.ship);
    this.shipLine = this.makeLine(0xf4f4f5, 0.9);
    this.ghostLine = this.makeLine(0x8b93a0, 0.55);
    this.planLine = this.makeLine(0xa1a1aa, 0.4);
    this.spaceScene.add(this.shipLine, this.ghostLine, this.planLine);
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(1, 10, 8),
        new THREE.MeshBasicMaterial({ color: i === 0 ? 0xf4f4f5 : 0x8b93a0 }),
      );
      this.markers.push(m);
      this.spaceScene.add(m);
    }

    this.spaceCam.position.set(1.15, 0.38, 0.72);
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

  private onPointerDown = (e: PointerEvent) => {
    if (sim.phase !== "surface") return;
    if (e.target !== this.canvas) return;
    this.drag = true;
    this.lastX = e.clientX;
  };
  private onPointerMove = (e: PointerEvent) => {
    if (!this.drag || sim.phase !== "surface") return;
    const dx = e.clientX - this.lastX;
    this.lastX = e.clientX;
    sim.yaw -= dx * 0.0075;
  };
  private onPointerUp = () => {
    this.drag = false;
  };

  start(): void {
    this.renderer.setAnimationLoop(this.loop);
    sim.glReady = true;
  }

  dispose(): void {
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

  private loop = (): void => {
    if (this.disposed) return;
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
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
    } else {
      this.renderer.render(this.surfScene, this.surfCam);
    }
    if (Math.floor(sim.elapsed * 8) !== Math.floor((sim.elapsed - dt) * 8)) bump();
  };

  private resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, w < 800 ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    for (const cam of [this.spaceCam, this.globeCam, this.surfCam]) {
      cam.aspect = w / Math.max(1, h);
      cam.updateProjectionMatrix();
    }
  }

  private buildSpace(): void {
    this.spaceScene.add(new THREE.AmbientLight(0xb7becb, 0.55));
    this.spaceScene.add(new THREE.HemisphereLight(0xe7e8ec, 0x14161c, 0.45));
    const key = new THREE.PointLight(0xfff5e8, 80, 0, 0);
    this.spaceScene.add(key);

    const stars = new THREE.BufferGeometry();
    const pos = new Float32Array(1800 * 3);
    for (let i = 0; i < 1800; i++) {
      const r = 220 + Math.random() * 160;
      const th = Math.random() * TAU;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    stars.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.spaceScene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xd5d6dc, size: 1.15, sizeAttenuation: false })));

    this.addBelt(2.15, 3.3, 700, 0.08, 0x9a9088);
    this.addBelt(32, 48, 900, 6, 0x8a8178);

    const sunMat = new THREE.ShaderMaterial({
      vertexShader: GLOBE_VERT,
      fragmentShader: SUN_FRAG,
      uniforms: { uTime: { value: 0 } },
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(visualRadius(getBody("sun")!), 48, 32), sunMat);
    sun.name = "sun";
    this.spaceScene.add(sun);
    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(visualRadius(getBody("sun")!) * 1.75, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfff1dc,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    this.spaceScene.add(corona);

    for (const b of BODIES) {
      if (b.id === "sun") continue;
      const group = new THREE.Group();
      const geo = new THREE.SphereGeometry(visualRadius(b), b.group === "planet" ? 32 : 20, 18);
      const mat = new THREE.MeshStandardMaterial({
        color: tint(b.palette),
        roughness: 0.82,
        metalness: 0.04,
        emissive: tint(b.palette),
        emissiveIntensity: 0.08,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = (b.axialTilt * Math.PI) / 180;
      group.add(mesh);
      if (b.id === "saturn") {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(visualRadius(b) * 1.35, visualRadius(b) * 2.15, 64),
          new THREE.MeshBasicMaterial({
            color: 0xc8c4b8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = (b.axialTilt * Math.PI) / 180;
        group.add(ring);
      }
      const line = this.makeLine(0x3a3d44, 0.85, 160);
      this.writeOrbit(line, bodyElements(b.id, 0)!, 160);
      this.spaceScene.add(line);
      group.userData.line = line;
      group.userData.bodyId = b.id;
      this.planets.set(b.id, group);
      this.spaceScene.add(group);
    }
  }

  private addBelt(inner: number, outer: number, count: number, thick: number, color: number): void {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const r = inner + Math.random() * (outer - inner);
      const y = (Math.random() - 0.5) * thick;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = y * 0.02;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.spaceScene.add(
      new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.45 })),
    );
  }

  private buildShip(): THREE.Group {
    const g = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: 0xc5c8ce, metalness: 0.86, roughness: 0.28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x232428, metalness: 0.55, roughness: 0.42 });
    const hullGeo = new THREE.CylinderGeometry(0.2, 0.26, 1.45, 14);
    hullGeo.rotateX(Math.PI / 2);
    g.add(new THREE.Mesh(hullGeo, metal));
    const noseGeo = new THREE.ConeGeometry(0.2, 0.5, 14);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, metal);
    nose.position.z = 0.95;
    g.add(nose);
    const flapGeo = new THREE.BoxGeometry(0.46, 0.035, 0.26);
    const left = new THREE.Mesh(flapGeo, dark);
    left.position.set(-0.3, 0, -0.42);
    const right = left.clone();
    right.position.x = 0.3;
    g.add(left, right);
    const bellGeo = new THREE.CylinderGeometry(0.15, 0.09, 0.2, 12);
    bellGeo.rotateX(Math.PI / 2);
    const bell = new THREE.Mesh(bellGeo, dark);
    bell.position.z = -0.82;
    g.add(bell);
    const slit = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.05, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.3, metalness: 0.4 }),
    );
    slit.position.set(0, 0.18, 0.35);
    g.add(slit);
    const plumeGeo = new THREE.ConeGeometry(0.12, 0.7, 12);
    plumeGeo.rotateX(-Math.PI / 2);
    const plume = new THREE.Mesh(
      plumeGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf4f1ea,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    plume.position.z = -1.25;
    plume.name = "plume";
    plume.visible = false;
    g.add(plume);
    return g;
  }

  private makeLine(color: number, opacity: number, segments = 256): THREE.Line {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.Line(geo, mat);
  }

  private writeOrbit(line: THREE.Line, el: Elements, segments?: number): void {
    const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    const n = (segments ?? attr.count - 1);
    const count = Math.min(n, attr.count - 1);
    for (let i = 0; i <= count; i++) {
      const nu = (i / count) * TAU;
      const st = stateVectors({ ...el, M: meanFromTrue(nu, Math.min(el.e, 0.989)) });
      attr.setXYZ(i, st.r.x, st.r.z, st.r.y);
    }
    attr.needsUpdate = true;
    line.geometry.computeBoundingSphere();
  }

  private place(out: THREE.Vector3, p: V3): THREE.Vector3 {
    return out.set(p.x, p.z, p.y);
  }

  private bodyPos(id: string, t: number, out: THREE.Vector3): THREE.Vector3 {
    if (id === "sun") return out.set(0, 0, 0);
    const el = bodyElements(id, t);
    if (!el) return out.set(0, 0, 0);
    return this.place(out, stateVectors(el).r);
  }

  private sync(dt: number): void {
    const sun = this.spaceScene.getObjectByName("sun");
    const sunMat = sun && (sun as THREE.Mesh).material;
    if (sunMat instanceof THREE.ShaderMaterial) sunMat.uniforms.uTime!.value = sim.elapsed;

    for (const b of BODIES) {
      if (b.id === "sun") continue;
      const obj = this.planets.get(b.id);
      if (!obj) continue;
      this.bodyPos(b.id, sim.t, this.tmp);
      obj.position.copy(this.tmp);
      obj.rotation.y += dt * (b.rotHours < 0 ? -0.15 : 0.15);
      const line = obj.userData.line as THREE.Line;
      const mat = line.material as THREE.LineBasicMaterial;
      const selected = b.id === sim.targetId;
      mat.opacity = selected ? 0.95 : 0.28;
      mat.color.set(selected ? 0xc5c9d1 : 0x3a3d44);
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
    const sc = THREE.MathUtils.clamp(camDist * 0.02, 0.006, 0.45);
    this.ship.scale.setScalar(sc);
    this.plume.visible = sim.burnFlash > 0.05 || !!sim.queue;
    (this.plume as THREE.Mesh).scale.setScalar(0.7 + sim.burnFlash * 1.4);

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

  private visualShip(real: THREE.Vector3): THREE.Vector3 {
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
    if (bestD < vr * 1.2 && bestD > 1e-6) {
      return keep.sub(this.tmp2).normalize().multiplyScalar(vr * 1.45).add(this.tmp2);
    }
    return keep;
  }

  private placeNodes(): void {
    const names: Array<"pe" | "ap" | "an" | "dn"> = ["pe", "ap", "an", "dn"];
    const nus = [0, Math.PI, (-sim.ship.w + TAU) % TAU, (Math.PI - sim.ship.w + TAU) % TAU];
    for (let i = 0; i < 4; i++) {
      const st = stateVectors({ ...sim.ship, M: meanFromTrue(nus[i]!, Math.min(sim.ship.e, 0.989)) });
      this.place(this.tmp, st.r);
      this.markers[i]!.position.copy(this.tmp);
      const dist = this.spaceCam.position.distanceTo(this.tmp);
      this.markers[i]!.scale.setScalar(Math.max(0.004, dist * 0.008));
      const mat = this.markers[i]!.material as THREE.MeshBasicMaterial;
      const armed =
        (sim.node === "pe" && names[i] === "pe") ||
        (sim.node === "ap" && names[i] === "ap") ||
        (sim.node === "an" && names[i] === "an") ||
        (sim.node === "dn" && names[i] === "dn");
      mat.color.set(armed ? 0xf4f4f5 : 0x6d727c);
    }
  }

  private syncCamera(dt: number, visual: THREE.Vector3): void {
    if (sim.phase === "title") {
      const ang = sim.elapsed * 0.15;
      this.spaceCam.position.set(visual.x + Math.cos(ang) * 0.07, visual.y + 0.028, visual.z + Math.sin(ang) * 0.07);
      this.spaceCam.lookAt(visual);
      this.spaceCtl.target.copy(visual);
      return;
    }
    if (sim.phase === "auto") {
      const body = getBody(sim.targetId)!;
      if (body.id === "sun") this.tmp2.set(0, 0, 0);
      else this.bodyPos(body.id, sim.t, this.tmp2);
      const u = sim.autoU;
      const look = this.tmp.copy(visual).lerp(this.tmp2, THREE.MathUtils.clamp((u - 0.2) / 0.7, 0, 1));
      const span = Math.max(0.35, visual.distanceTo(this.tmp2));
      const dist = span * (u < 0.86 ? 0.85 : 0.85 - (u - 0.86) * 3.2);
      const desired = this.tmp3.set(look.x + dist * 0.45, look.y + dist * 0.28, look.z + dist * 0.62);
      const k = 1 - Math.exp(-dt * 2.2);
      this.spaceCam.position.lerp(desired, k);
      this.spaceCam.lookAt(look);
      return;
    }
    if (sim.phase === "cruise") {
      if (this.camNonce !== sim.camNonce) {
        this.camNonce = sim.camNonce;
        this.spaceCtl.target.copy(visual);
        this.spaceCam.position.set(visual.x + 0.16, visual.y + 0.08, visual.z + 0.14);
      }
      const focusId = sim.focus === "sun" ? "sun" : sim.focus === "target" ? sim.targetId : "";
      if (focusId) {
        if (focusId === "sun") this.tmp.set(0, 0, 0);
        else this.bodyPos(focusId, sim.t, this.tmp);
        this.spaceCtl.target.lerp(this.tmp, 1 - Math.exp(-dt * 3));
      } else {
        this.spaceCtl.target.lerp(visual, 1 - Math.exp(-dt * 2.4));
      }
    }
  }

  private clearScene(scene: THREE.Scene): void {
    for (const obj of [...scene.children]) {
      scene.remove(obj);
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose?.();
      });
    }
  }

  private buildGlobe(): void {
    this.clearScene(this.globeScene);
    const body = getBody(sim.targetId)!;
    this.globeScene.add(new THREE.AmbientLight(0x9aa0ab, 0.35));
    const sun = new THREE.DirectionalLight(0xfff6ea, 2.4);
    sun.position.copy(this.sunDir);
    this.globeScene.add(sun);
    const stars = new THREE.BufferGeometry();
    const pos = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      const r = 18;
      const th = Math.random() * TAU;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    stars.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.globeScene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xd0d2d8, size: 1.2, sizeAttenuation: false })));

    const air = airColors(body);
    this.globeMat = new THREE.ShaderMaterial({
      vertexShader: GLOBE_VERT,
      fragmentShader: GLOBE_FRAG,
      uniforms: {
        uHeat: { value: 0.5 },
        uKind: { value: kindOf(body.palette) },
        uTeq: { value: displayTemp(body) },
        uSeed: { value: seedOf(body.id) * 0.01 },
        uSun: { value: this.sunDir.clone() },
      },
    });
    const pivot = new THREE.Group();
    pivot.rotation.z = (body.axialTilt * Math.PI) / 180;
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), this.globeMat);
    pivot.add(globe);
    this.cloudMat = new THREE.ShaderMaterial({
      vertexShader: GLOBE_VERT,
      fragmentShader: CLOUD_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uKind: { value: kindOf(body.palette) },
        uCover: { value: body.clouds },
        uSeed: { value: seedOf(body.id) * 0.02 },
        uSun: { value: this.sunDir.clone() },
      },
    });
    if (body.clouds > 0.02) {
      pivot.add(new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 48), this.cloudMat));
    }
    this.atmoMat = new THREE.ShaderMaterial({
      vertexShader: GLOBE_VERT,
      fragmentShader: ATMO_FRAG,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uSun: { value: this.sunDir.clone() },
        uRay: { value: air.ray },
        uSet: { value: air.set },
        uWidth: { value: air.width },
      },
    });
    if (body.pressureBar > 1e-4 || body.palette === "star" || body.id === "earth") {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.12, 48, 32), this.atmoMat);
      this.globeScene.add(shell);
    }
    this.globeScene.add(pivot);
    this.globePivot = pivot;
    this.globeCam.position.set(2.5, 0.95, 2.3);
    this.globeCtl.target.set(0, 0, 0);
    this.globeCtl.update();
  }

  private syncGlobe(dt: number): void {
    const heat = sim.view === "heat" ? 1 : sim.view === "natural" ? 0 : 0.5;
    if (this.globeMat) this.globeMat.uniforms.uHeat!.value = heat;
    if (this.cloudMat) this.cloudMat.uniforms.uTime!.value = sim.elapsed;
    if (this.globePivot) {
      const body = getBody(sim.targetId)!;
      const sign = body.rotHours < 0 ? -1 : 1;
      this.globePivot.rotation.y += dt * sign * (0.15 + 8 / Math.max(8, Math.abs(body.rotHours)));
    }
  }

  private buildSurface(): void {
    this.clearScene(this.surfScene);
    const body = getBody(sim.targetId)!;
    this.surfSeed = seedOf(body.id);
    this.surfAmp = ampFor(body.palette);
    const sky = skyFor(body.palette);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        uZenith: { value: new THREE.Color(...sky.zenith) },
        uHorizon: { value: new THREE.Color(...sky.horizon) },
        uSunset: { value: new THREE.Color(...sky.sunset) },
        uSun: { value: this.sunDir.clone() },
        uStars: { value: sky.stars },
      },
    });
    const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(380, 24, 16), skyMat);
    skyMesh.frustumCulled = false;
    skyMesh.renderOrder = -1;
    this.surfScene.add(skyMesh);

    this.surfScene.add(new THREE.AmbientLight(0xc5cad2, 0.45));
    this.surfScene.add(new THREE.HemisphereLight(0xe8eaee, 0x2a241c, 0.55));
    const sun = new THREE.DirectionalLight(0xfff4e4, body.palette === "star" ? 2.2 : 1.6);
    sun.position.copy(this.sunDir).multiplyScalar(10);
    this.surfScene.add(sun);

    const geo = new THREE.PlaneGeometry(170, 170, 90, 90);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position!;
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
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0.02 }),
    );
    this.surfScene.add(ground);

    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.4, metalness: 0.1, emissive: 0xf4f4f5, emissiveIntensity: 0.2 });
    for (let i = 0; i < 4; i++) {
      const b = { x: Math.cos((i / 4) * TAU + 0.5) * (22 + (i % 3) * 7), z: Math.sin((i / 4) * TAU + 0.5) * (22 + (i % 3) * 7) };
      const h = heightAt(b.x, b.z, this.surfSeed, this.surfAmp);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.8, 6), beaconMat);
      pole.position.set(b.x, h + 1.4, b.z);
      this.surfScene.add(pole);
    }

    this.walker = this.buildWalker();
    this.surfScene.add(this.walker);
    this.surfCam.position.set(0, 6, 24);
  }

  private buildWalker(): THREE.Group {
    const g = new THREE.Group();
    const suit = new THREE.MeshStandardMaterial({ color: 0xd5d7dc, metalness: 0.45, roughness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x16181c, metalness: 0.3, roughness: 0.35 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 4, 8), suit);
    body.position.y = 1.05;
    g.add(body);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.16), dark);
    pack.position.set(0, 1.1, -0.28);
    g.add(pack);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.1), dark);
    visor.position.set(0, 1.35, 0.26);
    g.add(visor);
    return g;
  }

  private syncSurface(dt: number): void {
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
}
