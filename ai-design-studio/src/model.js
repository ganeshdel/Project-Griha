// ============================================================
// AI Design Studio — Project Model
// One parametric model is the single source of truth; the 2D
// editor and 3D viewer both render from it.
//
// Coordinate system: room interior origin at top-left corner,
// x → right (width), y → down on plan (length). Units: mm.
// Walls are indexed 0=top(N), 1=right(E), 2=bottom(S), 3=left(W).
// ============================================================

import { catalogItem } from './catalog.js';

const STORE_KEY = 'ads.projects.v1';

let uid = () => Math.random().toString(36).slice(2, 9);

// ---------- Room templates (used by "start fresh" and photo reconstruction) ----------

export const TEMPLATES = [
  {
    id: 'living',
    name: 'Living Room',
    desc: 'Sofa, media wall and space to gather.',
    w: 4800, l: 3900, h: 2750,
    openings: [
      { type: 'door', wall: 3, offset: 2800, width: 900 },
      { type: 'window', wall: 0, offset: 1400, width: 1800, sill: 900, height: 1300 },
    ],
    furniture: [
      { catalogId: 'sofa3', x: 1300, y: 2850, rot: 180 },
      { catalogId: 'coffee', x: 1750, y: 1950, rot: 0 },
      { catalogId: 'tvunit', x: 1400, y: 150, rot: 0 },
      { catalogId: 'ruglg', x: 1150, y: 1500, rot: 0 },
      { catalogId: 'floorlamp', x: 3900, y: 3200, rot: 0 },
      { catalogId: 'plant', x: 4200, y: 300, rot: 0 },
    ],
    lighting: [{ type: 'ceiling', x: 2400, y: 1950 }],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    desc: 'A restful layout with generous clearances.',
    w: 4200, l: 3600, h: 2700,
    openings: [
      { type: 'door', wall: 2, offset: 3100, width: 850 },
      { type: 'window', wall: 1, offset: 1000, width: 1500, sill: 950, height: 1250 },
    ],
    furniture: [
      { catalogId: 'bedq', x: 1300, y: 350, rot: 0 },
      { catalogId: 'nightstand', x: 700, y: 400, rot: 0 },
      { catalogId: 'nightstand', x: 3000, y: 400, rot: 0 },
      { catalogId: 'wardrobe', x: 200, y: 2900, rot: 0 },
      { catalogId: 'rugsm', x: 1350, y: 2450, rot: 0 },
    ],
    lighting: [{ type: 'ceiling', x: 2100, y: 1800 }],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    desc: 'Working triangle with island seating.',
    w: 4400, l: 3400, h: 2700,
    openings: [
      { type: 'door', wall: 2, offset: 300, width: 950 },
      { type: 'window', wall: 0, offset: 1600, width: 1400, sill: 1050, height: 1000 },
    ],
    furniture: [
      { catalogId: 'kcounter', x: 1000, y: 120, rot: 0 },
      { catalogId: 'fridge', x: 3550, y: 150, rot: 0 },
      { catalogId: 'kisland', x: 1300, y: 1700, rot: 0 },
      { catalogId: 'stool', x: 1600, y: 2750, rot: 0 },
      { catalogId: 'stool', x: 2400, y: 2750, rot: 0 },
      { catalogId: 'pendant', x: 2200, y: 2150, rot: 0 },
    ],
    lighting: [{ type: 'ceiling', x: 2200, y: 1700 }],
  },
  {
    id: 'studio',
    name: 'Studio Apartment',
    desc: 'Live, sleep and work in one open room.',
    w: 5600, l: 4200, h: 2750,
    openings: [
      { type: 'door', wall: 3, offset: 3300, width: 900 },
      { type: 'window', wall: 0, offset: 1800, width: 2200, sill: 850, height: 1400 },
    ],
    furniture: [
      { catalogId: 'beds', x: 4400, y: 250, rot: 0 },
      { catalogId: 'sofa2', x: 700, y: 3150, rot: 180 },
      { catalogId: 'coffee', x: 950, y: 2300, rot: 0 },
      { catalogId: 'desk', x: 250, y: 250, rot: 0 },
      { catalogId: 'bookshelf', x: 4600, y: 3700, rot: 0 },
      { catalogId: 'rugsm', x: 750, y: 2050, rot: 0 },
      { catalogId: 'plant', x: 5000, y: 2600, rot: 0 },
    ],
    lighting: [{ type: 'ceiling', x: 2800, y: 2100 }],
  },
];

// ---------- Project factory ----------

export function createProject({ templateId = 'living', name, w, l, h, source = 'template' } = {}) {
  const t = TEMPLATES.find((x) => x.id === templateId) || TEMPLATES[0];
  const sw = w || t.w, sl = l || t.l, sh = h || t.h;
  const sx = sw / t.w, sy = sl / t.l; // scale template placements into the confirmed room size
  const p = {
    id: uid(),
    name: name || t.name,
    source, // 'template' | 'photo' | 'plan'
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currency: '₹',
    themeId: 'modern',
    room: {
      w: sw, l: sl, h: sh,
      wallColor: '#eceae6',
      accentWallIndex: 0,
      floor: { material: 'Engineered oak', color: '#c8b294' },
      openings: t.openings.map((o) => ({
        id: uid(), sill: 0, height: o.type === 'door' ? 2100 : 1300, ...o,
        offset: Math.round(o.offset * (o.wall % 2 === 0 ? sx : sy)),
      })),
      furniture: t.furniture
        .map((f) => placeFromCatalog(f.catalogId, Math.round(f.x * sx), Math.round(f.y * sy), f.rot))
        .filter(Boolean),
      lighting: t.lighting.map((li) => ({ id: uid(), ...li, x: Math.round(li.x * sx), y: Math.round(li.y * sy) })),
    },
    beforeSnapshot: null, // captured before the first AI/theme change, for compare
    history: [],
    future: [],
  };
  clampAll(p);
  return p;
}

export function placeFromCatalog(catalogId, x, y, rot = 0) {
  const c = catalogItem(catalogId);
  if (!c) return null;
  return {
    id: uid(), catalogId, x, y, rot,
    w: c.w, d: c.d, h: c.h,
    color: c.color,
    tier: 1, // 0 budget, 1 standard, 2 premium
  };
}

// ---------- Geometry helpers ----------

export function footprint(f) {
  // Axis-aligned bounding box of a (possibly rotated) furniture piece.
  const rotated = ((f.rot % 180) + 180) % 180 >= 45 && ((f.rot % 180) + 180) % 180 < 135;
  const w = rotated ? f.d : f.w;
  const d = rotated ? f.w : f.d;
  return { x: f.x, y: f.y, w, d, cx: f.x + w / 2, cy: f.y + d / 2 };
}

export function overlaps(a, b, margin = 0) {
  return a.x < b.x + b.w + margin && a.x + a.w + margin > b.x &&
         a.y < b.y + b.d + margin && a.y + a.d + margin > b.y;
}

export function clampFurniture(room, f) {
  const fp = footprint(f);
  f.x = Math.max(0, Math.min(room.w - fp.w, f.x));
  f.y = Math.max(0, Math.min(room.l - fp.d, f.y));
}

export function clampAll(p) {
  p.room.furniture.forEach((f) => clampFurniture(p.room, f));
  p.room.openings.forEach((o) => {
    const wallLen = o.wall % 2 === 0 ? p.room.w : p.room.l;
    o.offset = Math.max(0, Math.min(wallLen - o.width, o.offset));
  });
}

// Position of an opening in room plan coordinates (start point + direction).
export function openingSegment(room, o) {
  switch (o.wall) {
    case 0: return { x1: o.offset, y1: 0, x2: o.offset + o.width, y2: 0 };
    case 1: return { x1: room.w, y1: o.offset, x2: room.w, y2: o.offset + o.width };
    case 2: return { x1: o.offset, y1: room.l, x2: o.offset + o.width, y2: room.l };
    default: return { x1: 0, y1: o.offset, x2: 0, y2: o.offset + o.width };
  }
}

export function roomArea(room) { // m²
  return (room.w / 1000) * (room.l / 1000);
}

export function wallArea(room) { // m², perimeter walls minus openings
  const per = 2 * (room.w + room.l) / 1000;
  const gross = per * (room.h / 1000);
  const cut = room.openings.reduce((s, o) => s + (o.width / 1000) * (o.height / 1000), 0);
  return Math.max(0, gross - cut);
}

// ---------- Undo / redo ----------

export function snapshot(p) {
  return JSON.stringify({ room: p.room, themeId: p.themeId });
}

export function pushHistory(p) {
  p.history.push(snapshot(p));
  if (p.history.length > 60) p.history.shift();
  p.future = [];
}

export function undo(p) {
  if (!p.history.length) return false;
  p.future.push(snapshot(p));
  const s = JSON.parse(p.history.pop());
  p.room = s.room; p.themeId = s.themeId;
  return true;
}

export function redo(p) {
  if (!p.future.length) return false;
  p.history.push(snapshot(p));
  const s = JSON.parse(p.future.pop());
  p.room = s.room; p.themeId = s.themeId;
  return true;
}

export function captureBefore(p) {
  if (!p.beforeSnapshot) p.beforeSnapshot = snapshot(p);
}

// ---------- Persistence ----------

export function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch { return []; }
}

export function saveProject(p) {
  p.updatedAt = Date.now();
  const all = loadProjects().filter((x) => x.id !== p.id);
  // Persist without volatile undo stacks to stay well inside localStorage limits.
  const { history, future, ...persistable } = p;
  all.unshift(persistable);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(all.slice(0, 20)));
  } catch { /* storage full or unavailable — session continues in memory */ }
}

export function deleteProject(id) {
  localStorage.setItem(STORE_KEY, JSON.stringify(loadProjects().filter((x) => x.id !== id)));
}

export function reviveProject(stored) {
  return { ...stored, history: [], future: [] };
}

// ---------- Formatting ----------

export function fmtLen(mm) {
  return mm >= 1000 ? `${(mm / 1000).toFixed(2).replace(/\.?0+$/, '')} m` : `${mm} mm`;
}

export function fmtMoney(n, cur = '₹') {
  return cur + Math.round(n).toLocaleString('en-IN');
}
