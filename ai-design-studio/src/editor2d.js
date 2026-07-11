// ============================================================
// AI Design Studio — 2D Floor Plan Editor (SVG)
// Renders the parametric model as an architectural plan and
// makes furniture directly draggable. All coordinates are mm;
// the SVG viewBox does the scaling.
// ============================================================

import { footprint, clampFurniture, fmtLen } from './model.js';
import { catalogItem } from './catalog.js';

const WALL_T = 120;   // wall thickness, mm
const MARGIN = 700;   // plan margin for dimensions

export function render2D(p, selId, opts = {}) {
  const r = p.room;
  const vb = `${-MARGIN - WALL_T} ${-MARGIN - WALL_T} ${r.w + 2 * (MARGIN + WALL_T)} ${r.l + 2 * (MARGIN + WALL_T)}`;
  const grid = gridPattern(r);
  const walls = wallsPath(r);
  const openings = r.openings.map((o) => openingSVG(r, o)).join('');
  const lights = r.lighting.map((li) => `
    <g class="light2d"><circle cx="${li.x}" cy="${li.y}" r="110" fill="none" stroke="#c9a227" stroke-width="22"/>
    <line x1="${li.x - 150}" y1="${li.y}" x2="${li.x + 150}" y2="${li.y}" stroke="#c9a227" stroke-width="22"/>
    <line x1="${li.x}" y1="${li.y - 150}" x2="${li.x}" y2="${li.y + 150}" stroke="#c9a227" stroke-width="22"/></g>`).join('');
  // rugs first so they render under everything else
  const sorted = [...r.furniture].sort((a, b) => (catalogItem(a.catalogId)?.flat ? -1 : 0) - (catalogItem(b.catalogId)?.flat ? -1 : 0));
  const furn = sorted.map((f) => furnitureSVG(f, f.id === selId)).join('');
  const dims = dimensionsSVG(r);

  return `<svg class="plan-svg" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" data-roomw="${r.w}" data-rooml="${r.l}">
    <defs>${grid}</defs>
    <rect x="${-WALL_T}" y="${-WALL_T}" width="${r.w + 2 * WALL_T}" height="${r.l + 2 * WALL_T}" rx="18" fill="#3c3a36"/>
    <rect x="0" y="0" width="${r.w}" height="${r.l}" fill="url(#plangrid)"/>
    ${walls}${openings}${lights}${furn}${dims}
  </svg>`;
}

function gridPattern(r) {
  return `<pattern id="plangrid" width="500" height="500" patternUnits="userSpaceOnUse">
    <rect width="500" height="500" fill="#fbfaf7"/>
    <path d="M 500 0 L 0 0 0 500" fill="none" stroke="#e9e5dc" stroke-width="10"/>
  </pattern>`;
}

function wallsPath(r) {
  // interior face outline (walls are drawn by the dark slab behind the floor)
  return `<rect x="0" y="0" width="${r.w}" height="${r.l}" fill="none" stroke="#3c3a36" stroke-width="24"/>`;
}

function openingSVG(r, o) {
  const horiz = o.wall % 2 === 0;
  const x = horiz ? o.offset : (o.wall === 1 ? r.w - WALL_T / 2 : -WALL_T / 2);
  const y = horiz ? (o.wall === 0 ? -WALL_T / 2 : r.l - WALL_T / 2) : o.offset;
  if (o.type === 'window') {
    const wrect = horiz
      ? `<rect x="${o.offset}" y="${(o.wall === 0 ? -WALL_T : r.l)}" width="${o.width}" height="${WALL_T}" fill="#fbfaf7"/>
         <line x1="${o.offset}" y1="${(o.wall === 0 ? -WALL_T / 2 : r.l + WALL_T / 2)}" x2="${o.offset + o.width}" y2="${(o.wall === 0 ? -WALL_T / 2 : r.l + WALL_T / 2)}" stroke="#7ea6c8" stroke-width="34"/>`
      : `<rect x="${(o.wall === 3 ? -WALL_T : r.w)}" y="${o.offset}" width="${WALL_T}" height="${o.width}" fill="#fbfaf7"/>
         <line x1="${(o.wall === 3 ? -WALL_T / 2 : r.w + WALL_T / 2)}" y1="${o.offset}" x2="${(o.wall === 3 ? -WALL_T / 2 : r.w + WALL_T / 2)}" y2="${o.offset + o.width}" stroke="#7ea6c8" stroke-width="34"/>`;
    return `<g class="opening" data-oid="${o.id}">${wrect}</g>`;
  }
  // door: clear the wall, draw leaf + swing arc into the room
  const leaf = o.width;
  let clear, arc;
  if (o.wall === 0) {
    clear = `<rect x="${o.offset}" y="${-WALL_T - 14}" width="${leaf}" height="${WALL_T + 28}" fill="#fbfaf7"/>`;
    arc = `<path d="M ${o.offset} 0 L ${o.offset} ${leaf} A ${leaf} ${leaf} 0 0 0 ${o.offset + leaf} 0" fill="none" stroke="#b7b1a5" stroke-width="20" stroke-dasharray="60 60"/>
           <line x1="${o.offset}" y1="0" x2="${o.offset}" y2="${leaf}" stroke="#3c3a36" stroke-width="34"/>`;
  } else if (o.wall === 2) {
    clear = `<rect x="${o.offset}" y="${r.l - 14}" width="${leaf}" height="${WALL_T + 28}" fill="#fbfaf7"/>`;
    arc = `<path d="M ${o.offset} ${r.l} L ${o.offset} ${r.l - leaf} A ${leaf} ${leaf} 0 0 1 ${o.offset + leaf} ${r.l}" fill="none" stroke="#b7b1a5" stroke-width="20" stroke-dasharray="60 60"/>
           <line x1="${o.offset}" y1="${r.l}" x2="${o.offset}" y2="${r.l - leaf}" stroke="#3c3a36" stroke-width="34"/>`;
  } else if (o.wall === 3) {
    clear = `<rect x="${-WALL_T - 14}" y="${o.offset}" width="${WALL_T + 28}" height="${leaf}" fill="#fbfaf7"/>`;
    arc = `<path d="M 0 ${o.offset} L ${leaf} ${o.offset} A ${leaf} ${leaf} 0 0 1 0 ${o.offset + leaf}" fill="none" stroke="#b7b1a5" stroke-width="20" stroke-dasharray="60 60"/>
           <line x1="0" y1="${o.offset}" x2="${leaf}" y2="${o.offset}" stroke="#3c3a36" stroke-width="34"/>`;
  } else {
    clear = `<rect x="${r.w - 14}" y="${o.offset}" width="${WALL_T + 28}" height="${leaf}" fill="#fbfaf7"/>`;
    arc = `<path d="M ${r.w} ${o.offset} L ${r.w - leaf} ${o.offset} A ${leaf} ${leaf} 0 0 0 ${r.w} ${o.offset + leaf}" fill="none" stroke="#b7b1a5" stroke-width="20" stroke-dasharray="60 60"/>
           <line x1="${r.w}" y1="${o.offset}" x2="${r.w - leaf}" y2="${o.offset}" stroke="#3c3a36" stroke-width="34"/>`;
  }
  return `<g class="opening" data-oid="${o.id}">${clear}${arc}</g>`;
}

function furnitureSVG(f, selected) {
  const c = catalogItem(f.catalogId) || {};
  const fp = footprint(f);
  const cx = fp.x + fp.w / 2, cy = fp.y + fp.d / 2;
  const flat = !!c.flat;
  const fill = f.color || '#9a938a';
  const detail = furnitureDetail(c, f);
  const sel = selected
    ? `<rect x="${-f.w / 2 - 70}" y="${-f.d / 2 - 70}" width="${f.w + 140}" height="${f.d + 140}" rx="90" fill="none" stroke="#1a6ee0" stroke-width="30" stroke-dasharray="120 90"/>`
    : '';
  const label = fp.w > 700 ? `<text class="flabel" x="0" y="${f.d / 2 + 230}" text-anchor="middle" font-size="200" fill="#8b857a" transform="rotate(${-f.rot} 0 ${f.d / 2 + 230})">${c.name || ''}</text>` : '';
  return `<g class="furn${flat ? ' flat' : ''}" data-fid="${f.id}" transform="translate(${cx} ${cy}) rotate(${f.rot})">
    <rect x="${-f.w / 2}" y="${-f.d / 2}" width="${f.w}" height="${f.d}" rx="${flat ? 60 : 90}"
      fill="${fill}" fill-opacity="${flat ? 0.55 : 0.92}" stroke="#5d574d" stroke-width="${flat ? 14 : 22}"/>
    ${detail}${sel}${label}
  </g>`;
}

// small plan-style glyphs so pieces are recognisable from above
function furnitureDetail(c, f) {
  const w = f.w, d = f.d;
  switch (c.icon) {
    case 'sofa':
      return `<rect x="${-w / 2 + 60}" y="${-d / 2 + 60}" width="${w - 120}" height="${d * 0.3}" rx="70" fill="#ffffff" fill-opacity="0.35"/>
              <line x1="0" y1="${-d / 2 + 60 + d * 0.3}" x2="0" y2="${d / 2 - 60}" stroke="#5d574d" stroke-width="16" stroke-opacity="0.5"/>`;
    case 'bed':
      return `<rect x="${-w / 2 + 60}" y="${-d / 2 + 60}" width="${w - 120}" height="${d * 0.22}" rx="70" fill="#ffffff" fill-opacity="0.55"/>
              <line x1="${-w / 2 + 60}" y1="${-d / 2 + 60 + d * 0.26}" x2="${w / 2 - 60}" y2="${-d / 2 + 60 + d * 0.26}" stroke="#5d574d" stroke-width="16" stroke-opacity="0.4"/>`;
    case 'table': case 'desk': case 'counter':
      return `<rect x="${-w / 2 + 70}" y="${-d / 2 + 70}" width="${w - 140}" height="${d - 140}" rx="60" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="18"/>`;
    case 'chair': case 'stool':
      return `<circle cx="0" cy="0" r="${Math.min(w, d) * 0.26}" fill="#ffffff" fill-opacity="0.3"/>`;
    case 'lamp':
      return `<circle cx="0" cy="0" r="${Math.min(w, d) * 0.32}" fill="#f5d878" fill-opacity="0.85"/><circle cx="0" cy="0" r="${Math.min(w, d) * 0.12}" fill="#c9a227"/>`;
    case 'pendant':
      return `<circle cx="0" cy="0" r="${Math.min(w, d) * 0.3}" fill="#f5d878" fill-opacity="0.9" stroke="#c9a227" stroke-width="18"/>`;
    case 'plant':
      return `<circle cx="0" cy="0" r="${Math.min(w, d) * 0.34}" fill="#7fa86c" fill-opacity="0.9"/><circle cx="${w * 0.1}" cy="${-d * 0.08}" r="${Math.min(w, d) * 0.18}" fill="#93bb7f"/>`;
    case 'rug':
      return `<rect x="${-w / 2 + 100}" y="${-d / 2 + 100}" width="${w - 200}" height="${d - 200}" rx="40" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="14" stroke-dasharray="80 60"/>`;
    case 'tvunit':
      return `<rect x="${-w / 2 + 100}" y="${-d / 2 + 40}" width="${w - 200}" height="60" rx="30" fill="#2f2d2a"/>`;
    case 'wardrobe': case 'cabinet': case 'shelf':
      return `<line x1="0" y1="${-d / 2 + 40}" x2="0" y2="${d / 2 - 40}" stroke="#ffffff" stroke-opacity="0.4" stroke-width="16"/>`;
    case 'fridge':
      return `<line x1="${-w / 2 + 50}" y1="${-d * 0.12}" x2="${w / 2 - 50}" y2="${-d * 0.12}" stroke="#ffffff" stroke-opacity="0.55" stroke-width="16"/>`;
    case 'tub':
      return `<rect x="${-w / 2 + 90}" y="${-d / 2 + 90}" width="${w - 180}" height="${d - 180}" rx="${(d - 180) / 2}" fill="#ffffff" fill-opacity="0.5"/>`;
    default:
      return '';
  }
}

function dimensionsSVG(r) {
  const off = MARGIN * 0.55;
  return `<g class="dims" font-size="230" fill="#8b857a">
    <line x1="0" y1="${-off}" x2="${r.w}" y2="${-off}" stroke="#b7b1a5" stroke-width="14"/>
    <line x1="0" y1="${-off - 90}" x2="0" y2="${-off + 90}" stroke="#b7b1a5" stroke-width="14"/>
    <line x1="${r.w}" y1="${-off - 90}" x2="${r.w}" y2="${-off + 90}" stroke="#b7b1a5" stroke-width="14"/>
    <text x="${r.w / 2}" y="${-off - 110}" text-anchor="middle">${fmtLen(r.w)}</text>
    <line x1="${-off}" y1="0" x2="${-off}" y2="${r.l}" stroke="#b7b1a5" stroke-width="14"/>
    <line x1="${-off - 90}" y1="0" x2="${-off + 90}" y2="0" stroke="#b7b1a5" stroke-width="14"/>
    <line x1="${-off - 90}" y1="${r.l}" x2="${-off + 90}" y2="${r.l}" stroke="#b7b1a5" stroke-width="14"/>
    <text x="${-off - 130}" y="${r.l / 2}" text-anchor="middle" transform="rotate(-90 ${-off - 130} ${r.l / 2})">${fmtLen(r.l)}</text>
  </g>`;
}

// ---------- Interaction ----------
// Drag updates the model live and repaints only the dragged group's
// transform; a full app re-render happens on commit (pointer-up).

// onDragStart fires before any mutation (so the caller can snapshot for
// undo); onDragAbort fires if the pointer never moved (snapshot discarded).
export function bindEditor2D(container, p, { onSelect, onCommit, onDragStart, onDragAbort }) {
  const svg = container.querySelector('.plan-svg');
  if (!svg) return;
  let drag = null;

  const toModel = (ev) => {
    const pt = new DOMPoint(ev.clientX, ev.clientY);
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const loc = pt.matrixTransform(m.inverse());
    return { x: loc.x, y: loc.y };
  };

  svg.addEventListener('pointerdown', (ev) => {
    const g = ev.target.closest('.furn');
    if (!g) { onSelect(null); return; }
    const f = p.room.furniture.find((x) => x.id === g.dataset.fid);
    if (!f) return;
    const start = toModel(ev);
    onDragStart?.();
    drag = { f, g, dx: start.x - f.x, dy: start.y - f.y, moved: false };
    svg.setPointerCapture(ev.pointerId);
    onSelect(f.id);
    ev.preventDefault();
  });

  svg.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const loc = toModel(ev);
    const snap = 25; // 25 mm grid snap
    drag.f.x = Math.round((loc.x - drag.dx) / snap) * snap;
    drag.f.y = Math.round((loc.y - drag.dy) / snap) * snap;
    clampFurniture(p.room, drag.f);
    drag.moved = true;
    const fp = footprint(drag.f);
    drag.g.setAttribute('transform', `translate(${fp.x + fp.w / 2} ${fp.y + fp.d / 2}) rotate(${drag.f.rot})`);
  });

  const finish = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (moved) onCommit();
    else onDragAbort?.();
  };
  svg.addEventListener('pointerup', finish);
  svg.addEventListener('pointercancel', finish);
}
