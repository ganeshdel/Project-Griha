// ============================================================
// AI Design Studio — Budget, Shopping & Contractor Summary
// Realistic-feeling estimation from the parametric model:
// furniture at the chosen tier + paint + flooring + electrical
// + labour, adjusted by the theme's cost multiplier.
// ============================================================

import { roomArea, wallArea, fmtMoney } from './model.js';
import { catalogItem } from './catalog.js';
import { theme } from './themes.js';

export const TIERS = ['Budget', 'Standard', 'Premium'];

const PAINT_RATE = 38;      // ₹/m² incl. two coats, per wall area
const ELEC_POINT = 1400;    // ₹ per light point (wiring + fitting labour)
const LABOUR_PCT = 0.12;    // installation/handling on furniture

export function estimate(p) {
  const th = theme(p.themeId);
  const room = p.room;
  const areas = { floor: roomArea(room), wall: wallArea(room) };

  const furniture = room.furniture.map((f) => {
    const c = catalogItem(f.catalogId);
    const unit = Math.round((c?.price[f.tier ?? 1] || 0) * th.costX);
    return { id: f.id, name: c?.name || f.catalogId, cat: c?.cat, tier: f.tier ?? 1, unit, qty: 1 };
  });
  // merge duplicates into qty lines
  const merged = [];
  for (const it of furniture) {
    const m = merged.find((x) => x.name === it.name && x.tier === it.tier);
    if (m) { m.qty += 1; } else merged.push({ ...it });
  }
  merged.forEach((m) => (m.total = m.unit * m.qty));

  const furnitureTotal = merged.reduce((s, x) => s + x.total, 0);
  const paint = Math.round(areas.wall * PAINT_RATE * th.costX);
  const flooring = Math.round(areas.floor * th.floor.rate * 10.764 /* rate is per sqft */);
  const lightingPoints = room.lighting.length + room.furniture.filter((f) => catalogItem(f.catalogId)?.emits).length;
  const electrical = lightingPoints * ELEC_POINT;
  const labour = Math.round(furnitureTotal * LABOUR_PCT);
  const subtotal = furnitureTotal + paint + flooring + electrical + labour;
  const contingency = Math.round(subtotal * 0.08);

  return {
    theme: th, areas, lines: merged,
    furnitureTotal, paint, flooring, electrical, labour, contingency,
    total: subtotal + contingency,
  };
}

// ---------- Renovation stages ----------

export function renovationStages(p) {
  const e = estimate(p);
  const stages = [
    {
      name: 'Stage 1 — Prep & Surfaces', days: '3–5 days',
      cost: e.paint + e.flooring,
      steps: ['Clear and protect the room', `Floor: ${e.theme.floor.material} over ${e.areas.floor.toFixed(1)} m²`, `Walls: two coats over ${e.areas.wall.toFixed(0)} m², accent wall last`],
    },
    {
      name: 'Stage 2 — Electrical & Lighting', days: '1–2 days',
      cost: e.electrical,
      steps: ['Rough-in any new light points', 'Mount ceiling and pendant fixtures', 'Test switching and dimmers'],
    },
    {
      name: 'Stage 3 — Furniture & Styling', days: '1–2 days',
      cost: e.furnitureTotal + e.labour,
      steps: ['Deliver large pieces first (sofa, bed, storage)', 'Assemble and position per the floor plan', 'Layer rugs, lamps and plants last'],
    },
  ];
  return { stages, contingency: e.contingency, total: e.total };
}

// ---------- Bill of Materials ----------

export function billOfMaterials(p) {
  const e = estimate(p);
  const rows = e.lines.map((l) => ({ item: l.name, spec: `${TIERS[l.tier]} tier`, qty: l.qty, cost: l.total }));
  rows.push(
    { item: 'Interior paint', spec: `${e.areas.wall.toFixed(0)} m² · 2 coats · washable emulsion`, qty: Math.ceil(e.areas.wall / 10), cost: e.paint, unitLabel: 'L' },
    { item: e.theme.floor.material, spec: `${e.areas.floor.toFixed(1)} m² incl. underlay & wastage`, qty: Math.ceil(e.areas.floor * 1.07), cost: e.flooring, unitLabel: 'm²' },
    { item: 'Light points & fittings', spec: 'wiring, mounting, testing', qty: Math.max(1, Math.round(e.electrical / 1400)), cost: e.electrical },
  );
  return rows;
}

// ---------- Shopping suggestions ----------
// Never pushy: only generated when the user asks, each with a reason.

export function shoppingSuggestions(p) {
  const th = theme(p.themeId);
  const groups = [];
  for (const f of p.room.furniture) {
    const c = catalogItem(f.catalogId);
    if (!c) continue;
    if (groups.some((g) => g.catalogId === c.id)) continue;
    groups.push({
      catalogId: c.id,
      name: c.name,
      why: whySuitable(c, th),
      options: [
        { tier: 'Budget', price: c.price[0], note: 'Solid basics — engineered wood, standard fabric. Best for rentals or first setups.' },
        { tier: 'Standard', price: Math.round(c.price[1] * th.costX), note: `Recommended for ${th.name}: better joinery and finishes that hold up to daily use.` },
        { tier: 'Premium', price: Math.round(c.price[2] * th.costX), note: 'Designer-grade materials; the piece guests will notice.' },
        { tier: 'Eco', price: Math.round(c.price[1] * 1.12), note: 'FSC-certified wood, low-VOC finishes, recycled fillings — small premium, lighter footprint.' },
      ],
      sources: ['Local furniture markets & carpenters (best value, made to size)', 'Online: Urban Ladder, Pepperfry, IKEA (fast delivery, easy returns)', 'Premium: brand studios & imports (longest lifespan)'],
    });
  }
  return groups;
}

function whySuitable(c, th) {
  const styleMatch = c.styles?.includes(th.id);
  return styleMatch
    ? `Its proportions and finish sit naturally in a ${th.name} scheme — no restyling needed.`
    : `Choose a ${th.name.toLowerCase()}-leaning finish (${th.floor.material.toLowerCase()} tones work) so it blends with the palette.`;
}

// ---------- Contractor-ready summary (printable HTML) ----------

export function contractorSummaryHTML(p) {
  const e = estimate(p);
  const stages = renovationStages(p);
  const bom = billOfMaterials(p);
  const room = p.room;
  const openings = room.openings.map((o) =>
    `<tr><td>${o.type === 'door' ? 'Door' : 'Window'}</td><td>${['North', 'East', 'South', 'West'][o.wall]} wall</td><td>${o.width} × ${o.height} mm${o.type === 'window' ? `, sill ${o.sill} mm` : ''}</td><td>${o.offset} mm from corner</td></tr>`).join('');
  const money = (n) => fmtMoney(n, p.currency);
  return `
  <h1>Renovation Brief — ${esc(p.name)}</h1>
  <p class="sub">Prepared with AI Design Studio · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  <h2>Room</h2>
  <table>
    <tr><td>Internal dimensions</td><td>${(room.w / 1000).toFixed(2)} × ${(room.l / 1000).toFixed(2)} m, ceiling ${(room.h / 1000).toFixed(2)} m</td></tr>
    <tr><td>Floor area</td><td>${e.areas.floor.toFixed(1)} m²</td></tr>
    <tr><td>Paintable wall area</td><td>${e.areas.wall.toFixed(1)} m² (openings deducted)</td></tr>
    <tr><td>Design theme</td><td>${e.theme.name} — walls ${e.theme.wall}, accent ${e.theme.accentWall}, floor ${e.theme.floor.material}</td></tr>
  </table>
  <h2>Openings</h2>
  <table><tr><th>Type</th><th>Wall</th><th>Size</th><th>Position</th></tr>${openings}</table>
  <h2>Scope of works</h2>
  ${stages.stages.map((s) => `<h3>${s.name} <span class="days">(${s.days} · ~${money(s.cost)})</span></h3><ul>${s.steps.map((x) => `<li>${x}</li>`).join('')}</ul>`).join('')}
  <h2>Bill of materials</h2>
  <table><tr><th>Item</th><th>Specification</th><th>Qty</th><th>Est. cost</th></tr>
    ${bom.map((r) => `<tr><td>${esc(r.item)}</td><td>${esc(r.spec)}</td><td>${r.qty}${r.unitLabel ? ' ' + r.unitLabel : ''}</td><td>${money(r.cost)}</td></tr>`).join('')}
  </table>
  <h2>Estimate summary</h2>
  <table>
    <tr><td>Furniture & fittings</td><td>${money(e.furnitureTotal)}</td></tr>
    <tr><td>Painting</td><td>${money(e.paint)}</td></tr>
    <tr><td>Flooring</td><td>${money(e.flooring)}</td></tr>
    <tr><td>Electrical</td><td>${money(e.electrical)}</td></tr>
    <tr><td>Labour & installation</td><td>${money(e.labour)}</td></tr>
    <tr><td>Contingency (8%)</td><td>${money(e.contingency)}</td></tr>
    <tr class="total"><td>Estimated total</td><td>${money(e.total)}</td></tr>
  </table>
  <p class="note">Estimates are indicative planning figures generated from the model — obtain fixed quotes before commissioning work.</p>`;
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
