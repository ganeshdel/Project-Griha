// ============================================================
// AI Design Studio — Furniture & Fixture Catalog
// Dimensions in mm (w = width along x, d = depth along y, h = height).
// Prices in INR: [budget, standard, premium].
// ============================================================

export const CATALOG = [
  // ---- Seating ----
  { id: 'sofa3',      name: '3-Seat Sofa',        cat: 'seating',  w: 2100, d: 900,  h: 850,  price: [24000, 52000, 145000], styles: ['modern', 'contemporary', 'luxury'], color: '#8a8d92', icon: 'sofa' },
  { id: 'sofa2',      name: '2-Seat Sofa',        cat: 'seating',  w: 1600, d: 880,  h: 850,  price: [16000, 38000, 98000],  styles: ['modern', 'minimal', 'scandinavian'], color: '#9a9d9f', icon: 'sofa' },
  { id: 'armchair',   name: 'Armchair',           cat: 'seating',  w: 800,  d: 820,  h: 900,  price: [7000, 18000, 55000],   styles: ['scandinavian', 'japandi', 'traditional'], color: '#a7a396', icon: 'chair' },
  { id: 'accent',     name: 'Accent Chair',       cat: 'seating',  w: 700,  d: 720,  h: 800,  price: [5500, 14000, 42000],   styles: ['contemporary', 'luxury'], color: '#b09a7d', icon: 'chair' },
  { id: 'diningchair',name: 'Dining Chair',       cat: 'seating',  w: 460,  d: 520,  h: 880,  price: [2200, 6500, 18000],    styles: ['modern', 'scandinavian', 'traditional'], color: '#8f7d68', icon: 'chair' },
  { id: 'stool',      name: 'Counter Stool',      cat: 'seating',  w: 400,  d: 400,  h: 650,  price: [1500, 4500, 12000],    styles: ['industrial', 'modern'], color: '#6d6a66', icon: 'stool' },
  { id: 'bench',      name: 'Entry Bench',        cat: 'seating',  w: 1200, d: 400,  h: 450,  price: [4000, 11000, 28000],   styles: ['japandi', 'minimal'], color: '#9c8c76', icon: 'bench' },

  // ---- Tables ----
  { id: 'coffee',     name: 'Coffee Table',       cat: 'table',    w: 1100, d: 600,  h: 420,  price: [4500, 12000, 38000],   styles: ['modern', 'minimal', 'japandi'], color: '#7d6c58', icon: 'table' },
  { id: 'side',       name: 'Side Table',         cat: 'table',    w: 450,  d: 450,  h: 550,  price: [1800, 5500, 16000],    styles: ['minimal', 'contemporary'], color: '#84766a', icon: 'table' },
  { id: 'dining4',    name: 'Dining Table (4)',   cat: 'table',    w: 1200, d: 800,  h: 750,  price: [9000, 24000, 68000],   styles: ['modern', 'traditional', 'scandinavian'], color: '#8a7458', icon: 'table' },
  { id: 'dining6',    name: 'Dining Table (6)',   cat: 'table',    w: 1800, d: 900,  h: 750,  price: [15000, 38000, 110000], styles: ['traditional', 'luxury'], color: '#7c6448', icon: 'table' },
  { id: 'desk',       name: 'Work Desk',          cat: 'table',    w: 1400, d: 650,  h: 740,  price: [6500, 17000, 48000],   styles: ['modern', 'industrial', 'minimal'], color: '#8c8378', icon: 'desk' },
  { id: 'console',    name: 'Console Table',      cat: 'table',    w: 1200, d: 350,  h: 800,  price: [5000, 14000, 40000],   styles: ['luxury', 'contemporary'], color: '#93826c', icon: 'table' },

  // ---- Beds ----
  { id: 'bedq',       name: 'Queen Bed',          cat: 'bed',      w: 1600, d: 2050, h: 950,  price: [18000, 42000, 120000], styles: ['modern', 'contemporary', 'luxury'], color: '#a49a8e', icon: 'bed' },
  { id: 'bedk',       name: 'King Bed',           cat: 'bed',      w: 1850, d: 2100, h: 950,  price: [24000, 55000, 160000], styles: ['luxury', 'traditional'], color: '#a89c8c', icon: 'bed' },
  { id: 'beds',       name: 'Single Bed',         cat: 'bed',      w: 950,  d: 2000, h: 900,  price: [9000, 22000, 58000],   styles: ['minimal', 'scandinavian'], color: '#aca397', icon: 'bed' },
  { id: 'nightstand', name: 'Nightstand',         cat: 'storage',  w: 480,  d: 420,  h: 550,  price: [2500, 7000, 22000],    styles: ['modern', 'minimal'], color: '#8e8072', icon: 'cabinet' },

  // ---- Storage ----
  { id: 'wardrobe',   name: 'Wardrobe',           cat: 'storage',  w: 1800, d: 600,  h: 2200, price: [22000, 48000, 130000], styles: ['modern', 'traditional'], color: '#948875', icon: 'wardrobe' },
  { id: 'bookshelf',  name: 'Bookshelf',          cat: 'storage',  w: 900,  d: 320,  h: 1900, price: [5500, 14000, 38000],   styles: ['scandinavian', 'industrial', 'minimal'], color: '#8a7c66', icon: 'shelf' },
  { id: 'tvunit',     name: 'TV Unit',            cat: 'storage',  w: 1800, d: 420,  h: 500,  price: [8000, 20000, 62000],   styles: ['modern', 'contemporary'], color: '#7e7264', icon: 'tvunit' },
  { id: 'sideboard',  name: 'Sideboard',          cat: 'storage',  w: 1600, d: 450,  h: 800,  price: [11000, 28000, 78000],  styles: ['japandi', 'luxury', 'scandinavian'], color: '#8c7c64', icon: 'cabinet' },
  { id: 'dresser',    name: 'Dresser',            cat: 'storage',  w: 1200, d: 480,  h: 850,  price: [9000, 24000, 60000],   styles: ['traditional', 'contemporary'], color: '#968670', icon: 'cabinet' },

  // ---- Kitchen & Bath ----
  { id: 'kisland',    name: 'Kitchen Island',     cat: 'kitchen',  w: 1800, d: 900,  h: 900,  price: [30000, 75000, 210000], styles: ['modern', 'luxury', 'industrial'], color: '#9aa0a2', icon: 'counter' },
  { id: 'kcounter',   name: 'Counter Run',        cat: 'kitchen',  w: 2400, d: 620,  h: 900,  price: [36000, 90000, 260000], styles: ['modern', 'contemporary'], color: '#a5a8aa', icon: 'counter' },
  { id: 'fridge',     name: 'Refrigerator',       cat: 'kitchen',  w: 750,  d: 720,  h: 1800, price: [28000, 62000, 190000], styles: ['modern'], color: '#c4c8cc', icon: 'fridge' },
  { id: 'vanity',     name: 'Bath Vanity',        cat: 'bath',     w: 900,  d: 480,  h: 850,  price: [9000, 26000, 72000],   styles: ['modern', 'luxury'], color: '#b6b1a8', icon: 'counter' },
  { id: 'tub',        name: 'Bathtub',            cat: 'bath',     w: 1700, d: 760,  h: 580,  price: [24000, 60000, 220000], styles: ['luxury', 'contemporary'], color: '#e6e4de', icon: 'tub' },

  // ---- Lighting ----
  { id: 'floorlamp',  name: 'Floor Lamp',         cat: 'lighting', w: 380,  d: 380,  h: 1550, price: [2800, 8500, 26000],    styles: ['scandinavian', 'japandi', 'minimal'], color: '#c9b98f', icon: 'lamp', emits: true },
  { id: 'tablelamp',  name: 'Table Lamp',         cat: 'lighting', w: 300,  d: 300,  h: 520,  price: [1400, 4500, 15000],    styles: ['contemporary', 'traditional'], color: '#d1c193', icon: 'lamp', emits: true },
  { id: 'pendant',    name: 'Pendant Light',      cat: 'lighting', w: 350,  d: 350,  h: 400,  price: [2200, 7000, 24000],    styles: ['industrial', 'modern', 'luxury'], color: '#d8c47e', icon: 'pendant', emits: true, ceiling: true },

  // ---- Soft & Decor ----
  { id: 'ruglg',      name: 'Large Rug',          cat: 'decor',    w: 2400, d: 1700, h: 15,   price: [5500, 16000, 65000],   styles: ['traditional', 'luxury', 'scandinavian'], color: '#b8a488', icon: 'rug', flat: true },
  { id: 'rugsm',      name: 'Small Rug',          cat: 'decor',    w: 1500, d: 1000, h: 15,   price: [2500, 8000, 28000],    styles: ['minimal', 'japandi'], color: '#bcae96', icon: 'rug', flat: true },
  { id: 'plant',      name: 'Floor Plant',        cat: 'decor',    w: 450,  d: 450,  h: 1500, price: [1200, 3500, 9500],     styles: ['scandinavian', 'japandi', 'minimal'], color: '#6e8b5e', icon: 'plant' },
];

export const CATEGORIES = [
  { id: 'seating',  label: 'Seating' },
  { id: 'table',    label: 'Tables' },
  { id: 'bed',      label: 'Beds' },
  { id: 'storage',  label: 'Storage' },
  { id: 'kitchen',  label: 'Kitchen' },
  { id: 'bath',     label: 'Bath' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'decor',    label: 'Decor' },
];

export function catalogItem(id) {
  return CATALOG.find((c) => c.id === id);
}

// Real-world reference objects for Scale Intelligence.
export const SCALE_REFERENCES = [
  { id: 'adult',  name: 'Adult (1.7 m)', h: 1700, w: 450 },
  { id: 'child',  name: 'Child (1.1 m)', h: 1100, w: 320 },
  { id: 'door',   name: 'Door (2.1 m)',  h: 2100, w: 900 },
  { id: 'bottle', name: 'Bottle (25 cm)', h: 250, w: 70 },
];
