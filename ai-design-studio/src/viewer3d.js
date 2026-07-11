// ============================================================
// AI Design Studio — Interactive 3D Viewer (Three.js)
// Builds the scene from the same parametric model as the 2D
// editor. Orbit + walkthrough modes, theme materials, day/night
// lighting, dollhouse section view (near walls auto-hide).
//
// Model plan coords (mm): x → three x, y (plan down) → three z.
// Heights → three y. 1 model mm = 0.001 three units (metres).
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { catalogItem } from './catalog.js';
import { theme, themedColor, mix } from './themes.js';
import { footprint } from './model.js';

const MM = 0.001;
const WALL_T = 0.12;

export class Viewer3D {
  constructor() {
    this.mode = 'orbit';
    this.daylight = true;
    this.keys = {};
    this.walkYaw = Math.PI; this.walkPitch = 0;
    this._built = false;
  }

  init(container) {
    if (this.renderer) {
      // re-attach existing canvas after an app re-render
      container.appendChild(this.renderer.domElement);
      this._observe(container);
      this._resize();
      return;
    }
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#eef0ee');

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.05, 100);
    this.camera.position.set(5.5, 4.6, 6.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 18;

    // lights
    this.ambient = new THREE.AmbientLight('#ffffff', 0.55);
    this.hemi = new THREE.HemisphereLight('#dfe8f0', '#b8a98f', 0.5);
    this.sun = new THREE.DirectionalLight('#fff3df', 1.6);
    this.sun.position.set(6, 8, 4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -8; this.sun.shadow.camera.right = 8;
    this.sun.shadow.camera.top = 8; this.sun.shadow.camera.bottom = -8;
    this.scene.add(this.ambient, this.hemi, this.sun);

    this.roomGroup = new THREE.Group();
    this.scene.add(this.roomGroup);

    this._bindWalkControls();
    this._observe(container);
    this._resize();

    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      this._tick();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  _observe(container) {
    this.container = container;
    this._ro?.disconnect();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(container);
  }

  _resize() {
    const w = this.container.clientWidth || 600;
    const h = this.container.clientHeight || 420;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ---------- scene construction ----------

  sync(p) {
    const th = theme(p.themeId);
    const r = p.room;
    this.dims = { w: r.w * MM, l: r.l * MM, h: r.h * MM };

    // dispose previous build
    this.roomGroup.traverse((o) => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); });
    this.roomGroup.clear();
    this.walls = [];
    this.nightLights = [];

    const W = this.dims.w, L = this.dims.l, H = this.dims.h;

    // floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(W + WALL_T * 2, 0.1, L + WALL_T * 2),
      mat(r.floor?.color || th.floor.color, { roughness: 0.65 })
    );
    floor.position.set(W / 2, -0.05, L / 2);
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    // ground shadow plate
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(W, L) * 1.4, Math.max(W, L) * 1.4, 0.02, 48), mat('#dde0dd', { roughness: 1 }));
    plate.position.set(W / 2, -0.12, L / 2);
    plate.receiveShadow = true;
    this.roomGroup.add(plate);

    // walls (segmented around openings)
    const wallColor = r.wallColor || th.wall;
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const len = i % 2 === 0 ? W : L;
      const color = i === (r.accentWallIndex ?? -1) ? th.accentWall : wallColor;
      const ops = r.openings.filter((o) => o.wall === i).sort((a, b) => a.offset - b.offset);
      this._buildWall(g, len, H, ops, color);
      // orient: wall 0 top (z=0), 1 right (x=W), 2 bottom (z=L), 3 left (x=0)
      if (i === 0) g.position.set(0, 0, -WALL_T / 2);
      if (i === 1) { g.rotation.y = -Math.PI / 2; g.position.set(W + WALL_T / 2, 0, 0); }
      if (i === 2) g.position.set(0, 0, L + WALL_T / 2);
      if (i === 3) { g.rotation.y = -Math.PI / 2; g.position.set(-WALL_T / 2, 0, 0); }
      g.userData.wall = i;
      this.roomGroup.add(g);
      this.walls.push(g);
    }

    // skirting glow line (subtle premium touch)
    // furniture
    for (const f of r.furniture) {
      const c = catalogItem(f.catalogId);
      if (!c) continue;
      const grp = buildFurniture(c, f, th);
      const fp = footprint(f);
      grp.position.set((fp.x + fp.w / 2) * MM, 0, (fp.y + fp.d / 2) * MM);
      grp.rotation.y = -f.rot * Math.PI / 180;
      grp.traverse((o) => { if (o.isMesh) { o.castShadow = !c.flat; o.receiveShadow = true; } });
      this.roomGroup.add(grp);
      if (c.emits) {
        const pl = new THREE.PointLight('#ffd9a0', 0, 4.5, 2);
        pl.position.set(grp.position.x, (c.ceiling ? H - 0.5 : f.h * MM * 0.9), grp.position.z);
        this.roomGroup.add(pl);
        this.nightLights.push(pl);
      }
    }

    // ceiling lights
    for (const li of r.lighting) {
      const x = li.x * MM, z = li.y * MM;
      const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24), mat('#f2ede2', { emissive: '#fff2cf', emissiveIntensity: 0.7 }));
      fixture.position.set(x, H - 0.03, z);
      this.roomGroup.add(fixture);
      const pl = new THREE.PointLight('#ffe1b0', 0, 6, 2);
      pl.position.set(x, H - 0.25, z);
      this.roomGroup.add(pl);
      this.nightLights.push(pl);
    }

    if (!this._built) {
      this._built = true;
      this._frameRoom();
    }
    this.setDaylight(this.daylight);
  }

  _buildWall(g, len, H, ops, color) {
    const wallMat = mat(color, { roughness: 0.9 });
    let cursor = 0;
    const seg = (x0, x1, y0, y1) => {
      if (x1 - x0 < 0.005 || y1 - y0 < 0.005) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, WALL_T), wallMat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    };
    for (const o of ops) {
      const a = o.offset * MM, b = (o.offset + o.width) * MM;
      const sill = (o.sill || 0) * MM, top = ((o.sill || 0) + o.height) * MM;
      seg(cursor, a, 0, H);                 // solid stretch before opening
      seg(a, b, 0, sill);                   // below sill (0 for doors)
      seg(a, b, Math.min(top, H), H);       // lintel above
      if (o.type === 'window') {
        const glass = new THREE.Mesh(
          new THREE.BoxGeometry(b - a, top - sill, 0.02),
          new THREE.MeshPhysicalMaterial({ color: '#bcd6e8', transmission: 0.7, transparent: true, opacity: 0.4, roughness: 0.05 })
        );
        glass.position.set((a + b) / 2, (sill + top) / 2, 0);
        g.add(glass);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(b - a + 0.06, top - sill + 0.06, 0.05), mat('#ffffff'));
        frame.position.copy(glass.position);
        frame.scale.set(1, 1, 0.6);
        const inner = new THREE.Mesh(new THREE.BoxGeometry(b - a - 0.04, top - sill - 0.04, 0.06), mat('#bcd6e8', { transparent: true, opacity: 0.35 }));
        inner.position.copy(glass.position);
        g.add(frame);
      }
      cursor = b;
    }
    seg(cursor, len, 0, H); // remainder
  }

  _frameRoom() {
    const { w, l } = this.dims;
    const d = Math.max(w, l);
    this.camera.position.set(w / 2 + d * 0.9, d * 0.95, l / 2 + d * 1.05);
    this.controls.target.set(w / 2, 0.7, l / 2);
    this.controls.update();
  }

  // ---------- modes & lighting ----------

  setMode(mode) {
    this.mode = mode;
    if (mode === 'walk') {
      this.controls.enabled = false;
      this.camera.position.set(this.dims.w / 2, 1.6, this.dims.l - 0.6);
      this.walkYaw = Math.PI; this.walkPitch = 0;
      this._applyWalkLook();
    } else {
      this.controls.enabled = true;
      this._frameRoom();
    }
  }

  setDaylight(on) {
    this.daylight = on;
    this.scene.background = new THREE.Color(on ? '#eef0ee' : '#14161c');
    this.sun.intensity = on ? 1.6 : 0.06;
    this.ambient.intensity = on ? 0.55 : 0.16;
    this.hemi.intensity = on ? 0.5 : 0.08;
    for (const pl of this.nightLights || []) pl.intensity = on ? 0 : 1.15;
  }

  zoom(dir) {
    if (this.mode !== 'orbit') return;
    const v = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    v.multiplyScalar(dir > 0 ? 0.82 : 1.22);
    this.camera.position.copy(this.controls.target).add(v);
    this.controls.update();
  }

  _bindWalkControls() {
    const el = this.renderer.domElement;
    let look = null;
    el.addEventListener('pointerdown', (e) => { if (this.mode === 'walk') { look = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); } });
    el.addEventListener('pointermove', (e) => {
      if (this.mode !== 'walk' || !look) return;
      this.walkYaw -= (e.clientX - look.x) * 0.0045;
      this.walkPitch = Math.max(-1.2, Math.min(1.2, this.walkPitch - (e.clientY - look.y) * 0.0035));
      look = { x: e.clientX, y: e.clientY };
      this._applyWalkLook();
    });
    el.addEventListener('pointerup', () => (look = null));
    el.tabIndex = 0;
    el.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; if (this.mode === 'walk' && ['arrowup', 'arrowdown', 'w', 's', 'a', 'd'].includes(e.key.toLowerCase())) e.preventDefault(); });
    el.addEventListener('keyup', (e) => (this.keys[e.key.toLowerCase()] = false));
  }

  _applyWalkLook() {
    const d = new THREE.Vector3(
      Math.sin(this.walkYaw) * Math.cos(this.walkPitch),
      Math.sin(this.walkPitch),
      Math.cos(this.walkYaw) * Math.cos(this.walkPitch)
    );
    this.camera.lookAt(this.camera.position.clone().add(d));
  }

  _tick() {
    if (this.mode === 'orbit') {
      this.controls.update();
      this._sectionWalls();
    } else if (this.dims) {
      const sp = 0.045;
      const fwd = new THREE.Vector3(Math.sin(this.walkYaw), 0, Math.cos(this.walkYaw));
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
      if (this.keys['w'] || this.keys['arrowup']) this.camera.position.addScaledVector(fwd, sp);
      if (this.keys['s'] || this.keys['arrowdown']) this.camera.position.addScaledVector(fwd, -sp);
      if (this.keys['a'] || this.keys['arrowleft']) this.camera.position.addScaledVector(right, sp);
      if (this.keys['d'] || this.keys['arrowright']) this.camera.position.addScaledVector(right, -sp);
      this.camera.position.x = Math.max(0.3, Math.min(this.dims.w - 0.3, this.camera.position.x));
      this.camera.position.z = Math.max(0.3, Math.min(this.dims.l - 0.3, this.camera.position.z));
      this.camera.position.y = 1.6;
      this._applyWalkLook();
      for (const w of this.walls || []) w.visible = true;
    }
  }

  // Dollhouse section: hide the two walls nearest the camera so
  // the interior always stays visible while orbiting.
  _sectionWalls() {
    if (!this.walls?.length || !this.dims) return;
    const c = this.camera.position;
    const { w, l } = this.dims;
    for (const g of this.walls) {
      const i = g.userData.wall;
      let outside = false;
      if (i === 0) outside = c.z < l * 0.5;
      if (i === 1) outside = c.x > w * 0.5;
      if (i === 2) outside = c.z > l * 0.5;
      if (i === 3) outside = c.x < w * 0.5;
      g.visible = !outside;
    }
  }

  snapshotDataURL() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }
}

// ---------- materials & furniture builders ----------

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...extra });
}

function box(w, h, d, m) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
}

function buildFurniture(c, f, th) {
  const g = new THREE.Group();
  const w = f.w * MM, d = f.d * MM, h = f.h * MM;
  const base = themedColor(f.color || c.color, th, c.cat);
  const wood = th.wood, metal = th.metal, fabric = base;

  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); g.add(mesh); return mesh; };

  switch (c.icon) {
    case 'sofa': {
      const mFab = mat(fabric, { roughness: 0.95 });
      add(box(w, h * 0.38, d, mFab), 0, h * 0.19, 0);                      // base
      add(box(w, h * 0.62, d * 0.25, mFab), 0, h * 0.31 + h * 0.31, -d * 0.375); // back
      add(box(w * 0.09, h * 0.68, d, mFab), -w / 2 + w * 0.045, h * 0.34, 0);    // arms
      add(box(w * 0.09, h * 0.68, d, mFab), w / 2 - w * 0.045, h * 0.34, 0);
      const cush = mat(mix(fabric, '#ffffff', 0.14), { roughness: 1 });
      const seats = c.id === 'sofa3' ? 3 : c.id === 'sofa2' ? 2 : 1;
      for (let i = 0; i < seats; i++) {
        const cw = (w * 0.8) / seats;
        add(box(cw * 0.92, h * 0.14, d * 0.6, cush), -w * 0.4 + cw * (i + 0.5), h * 0.45, d * 0.06);
      }
      break;
    }
    case 'chair': {
      const mFab = mat(fabric, { roughness: 0.95 });
      add(box(w * 0.9, h * 0.12, d * 0.9, mFab), 0, h * 0.42, 0);
      add(box(w * 0.9, h * 0.5, d * 0.14, mFab), 0, h * 0.7, -d * 0.38);
      legs(g, w * 0.8, d * 0.8, h * 0.36, mat(wood));
      break;
    }
    case 'stool': {
      add(box(w * 0.85, h * 0.1, d * 0.85, mat(wood)), 0, h * 0.95 - h * 0.05, 0);
      legs(g, w * 0.6, d * 0.6, h * 0.88, mat(metal));
      break;
    }
    case 'bench': {
      add(box(w, h * 0.16, d, mat(wood)), 0, h * 0.9, 0);
      legs(g, w * 0.85, d * 0.7, h * 0.82, mat(wood));
      break;
    }
    case 'table': case 'desk': {
      add(box(w, 0.035, d, mat(wood, { roughness: 0.5 })), 0, h - 0.018, 0);
      legs(g, w * 0.88, d * 0.82, h - 0.035, mat(c.icon === 'desk' ? metal : wood));
      break;
    }
    case 'counter': {
      add(box(w, h * 0.94, d, mat(base, { roughness: 0.7 })), 0, h * 0.47, 0);
      add(box(w + 0.03, 0.045, d + 0.03, mat(mix(base, '#ffffff', 0.35), { roughness: 0.3 })), 0, h - 0.022, 0);
      break;
    }
    case 'bed': {
      add(box(w, h * 0.3, d, mat(wood)), 0, h * 0.15, 0);                          // frame
      add(box(w * 0.97, h * 0.22, d * 0.96, mat(mix(fabric, '#ffffff', 0.45), { roughness: 1 })), 0, h * 0.4, 0); // mattress
      add(box(w, h * 0.85, 0.06, mat(wood)), 0, h * 0.45, -d / 2 + 0.03);          // headboard
      add(box(w * 0.8, h * 0.1, d * 0.16, mat('#f4f1ea', { roughness: 1 })), 0, h * 0.55, -d * 0.32); // pillows
      add(box(w * 0.99, h * 0.1, d * 0.55, mat(fabric, { roughness: 1 })), 0, h * 0.48, d * 0.18);    // throw
      break;
    }
    case 'wardrobe': case 'cabinet': case 'shelf': {
      const m = mat(wood, { roughness: 0.7 });
      add(box(w, h, d, m), 0, h / 2, 0);
      const front = mat(mix(wood, '#000000', 0.12));
      if (c.icon === 'shelf') {
        for (let i = 1; i <= 4; i++) add(box(w * 0.94, 0.018, d * 0.9, front), 0, (h / 5) * i, d * 0.02);
      } else {
        add(box(0.012, h * 0.92, d * 0.02, front), 0, h / 2, d / 2 + 0.005);
      }
      break;
    }
    case 'tvunit': {
      add(box(w, h, d, mat(wood)), 0, h / 2, 0);
      add(box(w * 0.62, w * 0.35 * 0.56, 0.03, mat('#101214', { roughness: 0.2, metalness: 0.4 })), 0, h + w * 0.35 * 0.28 + 0.12, 0); // screen above
      break;
    }
    case 'fridge': {
      add(box(w, h, d, mat(mix(metal, '#ffffff', 0.4), { roughness: 0.35, metalness: 0.55 })), 0, h / 2, 0);
      add(box(w * 0.9, 0.012, 0.01, mat('#7d8287')), 0, h * 0.62, d / 2 + 0.006);
      break;
    }
    case 'tub': {
      add(box(w, h, d, mat('#f2f0ea', { roughness: 0.25 })), 0, h / 2, 0);
      add(box(w * 0.86, 0.02, d * 0.7, mat('#dceff5', { roughness: 0.1 })), 0, h - 0.015, 0);
      break;
    }
    case 'lamp': {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.02, 24), mat(metal)), 0, 0.01, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, h * 0.78, 12), mat(metal)), 0, h * 0.4, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(w * 0.32, w * 0.42, h * 0.2, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: '#f3e3c0', emissive: '#ffdf9e', emissiveIntensity: 0.5, side: THREE.DoubleSide })), 0, h * 0.85, 0);
      break;
    }
    case 'pendant': {
      // hangs from ceiling — anchor at floor point, draw at ~2.1m
      const hang = 2.1;
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.6, 8), mat(metal)), 0, hang + 0.3, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(w * 0.36, w * 0.5, 0.22, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: metal, emissive: '#ffd98e', emissiveIntensity: 0.65, side: THREE.DoubleSide })), 0, hang, 0);
      break;
    }
    case 'plant': {
      add(new THREE.Mesh(new THREE.CylinderGeometry(w * 0.28, w * 0.22, h * 0.24, 20), mat('#b06e4a', { roughness: 0.9 })), 0, h * 0.12, 0);
      const leaf = mat('#5f8b4d', { roughness: 1 });
      add(new THREE.Mesh(new THREE.SphereGeometry(w * 0.42, 12, 10), leaf), 0, h * 0.52, 0);
      add(new THREE.Mesh(new THREE.SphereGeometry(w * 0.3, 10, 8), leaf), w * 0.18, h * 0.74, w * 0.06);
      add(new THREE.Mesh(new THREE.SphereGeometry(w * 0.26, 10, 8), leaf), -w * 0.16, h * 0.7, -w * 0.08);
      break;
    }
    case 'rug': {
      add(box(w, 0.012, d, mat(fabric, { roughness: 1 })), 0, 0.006, 0);
      add(box(w * 0.86, 0.014, d * 0.84, mat(mix(fabric, '#ffffff', 0.18), { roughness: 1 })), 0, 0.007, 0);
      break;
    }
    default:
      add(box(w, h, d, mat(base)), 0, h / 2, 0);
  }
  return g;
}

function legs(g, spanW, spanD, h, m) {
  const r = 0.016;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), m);
    leg.position.set((spanW / 2) * sx, h / 2, (spanD / 2) * sz);
    g.add(leg);
  }
}
