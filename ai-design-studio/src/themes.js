// ============================================================
// AI Design Studio — Design Themes
// Each theme restyles walls, floor, accents and furniture tones,
// and carries a cost multiplier used by the budget engine.
// ============================================================

export const THEMES = [
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Clean lines, calm neutrals, glass and matte metal.',
    wall: '#eceae6', accentWall: '#3f4a52',
    floor: { material: 'Engineered oak', color: '#c8b294', rate: 240 },
    trim: '#ffffff',
    furnitureTint: '#87919a',
    fabric: '#aab2b8', wood: '#9b8468', metal: '#84898e',
    lightWarmth: 0.55, costX: 1.0,
    swatches: ['#eceae6', '#3f4a52', '#c8b294', '#87919a'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Only what matters. White, light wood, air.',
    wall: '#f5f4f1', accentWall: '#e4e1da',
    floor: { material: 'Pale maple', color: '#ddcdb0', rate: 220 },
    trim: '#ffffff',
    furnitureTint: '#c9c5bd',
    fabric: '#d4d0c8', wood: '#c2ad8d', metal: '#b9b6b0',
    lightWarmth: 0.45, costX: 0.9,
    swatches: ['#f5f4f1', '#e4e1da', '#ddcdb0', '#c9c5bd'],
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    tagline: 'Hygge warmth — pale wood, wool, soft daylight.',
    wall: '#f3efe8', accentWall: '#d9cfc0',
    floor: { material: 'White-oiled ash', color: '#e0d2b6', rate: 260 },
    trim: '#f8f5ef',
    furnitureTint: '#c3b49b',
    fabric: '#cbbfa9', wood: '#caae85', metal: '#9e9a92',
    lightWarmth: 0.7, costX: 1.05,
    swatches: ['#f3efe8', '#d9cfc0', '#e0d2b6', '#caae85'],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    tagline: 'Raw concrete, dark steel, exposed character.',
    wall: '#d8d4cd', accentWall: '#5c5650',
    floor: { material: 'Polished concrete', color: '#a8a49c', rate: 180 },
    trim: '#4c4844',
    furnitureTint: '#6f6a63',
    fabric: '#7c766e', wood: '#7a6046', metal: '#54514d',
    lightWarmth: 0.6, costX: 0.95,
    swatches: ['#d8d4cd', '#5c5650', '#a8a49c', '#54514d'],
  },
  {
    id: 'luxury',
    name: 'Luxury',
    tagline: 'Marble, brass, velvet — quiet opulence.',
    wall: '#efe9df', accentWall: '#37413e',
    floor: { material: 'Italian marble', color: '#e7e1d4', rate: 520 },
    trim: '#d9c9a3',
    furnitureTint: '#8d7f66',
    fabric: '#9d8e70', wood: '#6e5136', metal: '#c2a35c',
    lightWarmth: 0.75, costX: 1.6,
    swatches: ['#efe9df', '#37413e', '#e7e1d4', '#c2a35c'],
  },
  {
    id: 'japandi',
    name: 'Japandi',
    tagline: 'Japanese restraint meets Nordic comfort.',
    wall: '#f0ebe1', accentWall: '#b9a88c',
    floor: { material: 'Bamboo plank', color: '#d3bd93', rate: 250 },
    trim: '#e8e0d0',
    furnitureTint: '#a99372',
    fabric: '#b6a486', wood: '#a58a62', metal: '#8b8578',
    lightWarmth: 0.68, costX: 1.1,
    swatches: ['#f0ebe1', '#b9a88c', '#d3bd93', '#a58a62'],
  },
  {
    id: 'traditional',
    name: 'Traditional',
    tagline: 'Rich wood, deep tones, timeless comfort.',
    wall: '#ece2d2', accentWall: '#7d3b32',
    floor: { material: 'Teak hardwood', color: '#9c6b42', rate: 380 },
    trim: '#f0e8da',
    furnitureTint: '#7c5a3c',
    fabric: '#8e6a50', wood: '#71462a', metal: '#8f6f3e',
    lightWarmth: 0.8, costX: 1.25,
    swatches: ['#ece2d2', '#7d3b32', '#9c6b42', '#71462a'],
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    tagline: 'Of the moment — bold accents on soft neutrals.',
    wall: '#f0eeea', accentWall: '#2f5d5a',
    floor: { material: 'Wide-plank walnut', color: '#8d6b4e', rate: 300 },
    trim: '#fbfaf8',
    furnitureTint: '#7f8a86',
    fabric: '#93a09b', wood: '#8a6c50', metal: '#767b79',
    lightWarmth: 0.6, costX: 1.15,
    swatches: ['#f0eeea', '#2f5d5a', '#8d6b4e', '#93a09b'],
  },
];

export function theme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

// Blend a furniture item's base colour toward the theme's palette
// so a restyle feels cohesive rather than repainted.
export function themedColor(baseColor, th, cat) {
  const target =
    cat === 'seating' || cat === 'bed' || cat === 'decor' ? th.fabric :
    cat === 'lighting' ? th.metal :
    cat === 'kitchen' || cat === 'bath' ? th.metal :
    th.wood;
  return mix(baseColor, target, 0.62);
}

export function mix(a, b, t) {
  const pa = hex(a), pb = hex(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hex(h) {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
