import fs from 'node:fs';

function replaceOnce(source, oldText, newText, label) {
  if (!source.includes(oldText)) throw new Error(`Could not find ${label}`);
  return source.replace(oldText, newText);
}

const mainPath = 'ai-design-studio/src/main.js';
let main = fs.readFileSync(mainPath, 'utf8');
main = replaceOnce(
  main,
  "import { analyzeProject, mentorReplyOffline, mentorReplyClaude, getApiKey, setApiKey } from './ai.js';",
  "import { analyzeProject, mentorReplyOffline, mentorReplyClaude, reconstructFromClaude, getApiKey, setApiKey } from './ai.js';",
  'main AI import',
);
main = replaceOnce(
  main,
  '<input type="file" id="fileInput" accept="image/*,.pdf" hidden />',
  '<input type="file" id="fileInput" accept="image/*" hidden />',
  'file input accept',
);
main = replaceOnce(
  main,
  '<div class="dz-sub">photo · floor plan · sketch · PDF · scan</div>',
  '<div class="dz-sub">photo · floor plan image · sketch · scan (JPG/PNG)</div>',
  'dropzone subtitle',
);
main = replaceOnce(
  main,
  `      source: S.uploadPreview ? 'photo' : 'template',\n    });`,
  `      source: S.uploadPreview ? 'photo' : 'template',\n      // Use the AI-detected openings/furniture only if the user kept the\n      // detected room type — switching type means the layout no longer applies.\n      layout: root.querySelector('#confTpl').value === S.detected?.templateId ? S.detected?.layout : null,\n    });`,
  'createProject layout',
);

const startMarker = 'async function startAnalysis(file) {';
const endMarker = '\nasync function estimateFromImage(dataURL) {';
const start = main.indexOf(startMarker);
const end = main.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error('Could not locate startAnalysis function');
const newStartAnalysis = `async function startAnalysis(file) {
  try {
    S.uploadPreview = null;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || /\\.pdf$/i.test(file.name || '');

    if (!isImage && isPdf) {
      // Be honest: the app can't read PDF geometry yet. Ask for an image
      // instead of silently handing back a canned template.
      toast('PDF plans aren’t supported yet — please upload a photo, screenshot or image export (JPG/PNG) of the plan.');
      return;
    }
    if (!isImage) {
      toast('That file type isn’t supported — please upload a JPG or PNG of the room or plan.');
      return;
    }

    S.uploadPreview = await readAsDataURL(file);
    S.screen = 'analyzing';
    S.analyzeStep = 0;
    renderApp();

    // Kick off the real work while the step animation plays.
    // With an Anthropic key connected: genuine reconstruction via Claude vision.
    // Without a key: transparent local heuristic (and we say so).
    const work = (async () => {
      if (getApiKey()) {
        try {
          const r = await reconstructFromClaude(S.uploadPreview);
          if (r) return { ...r, viaClaude: true };
        } catch (err) {
          const h = await estimateFromImage(S.uploadPreview);
          return { ...h, note: \`Claude analysis failed (\${err.message}) — showing a rough local estimate instead. \${h.note}\` };
        }
      }
      const h = await estimateFromImage(S.uploadPreview);
      return { ...h, note: \`\${h.note} (Local estimate only — connect an Anthropic API key in Settings and I’ll actually read the plan: walls, doors, windows and furniture.)\` };
    })();
    work.catch(() => {});

    for (let i = 1; i <= ANALYZE_STEPS.length; i++) {
      await sleep(520 + Math.random() * 320);
      S.analyzeStep = i;
      if (S.screen !== 'analyzing') return;
      renderApp();
    }
    const est = await work;
    if (S.screen !== 'analyzing') return;
    const t = TEMPLATES.find((x) => x.id === est.templateId);
    S.detected = { ...est, name: est.name || t.name };
    S.screen = 'confirm';
    renderApp();
  } catch (err) {
    S.screen = 'launcher';
    S.uploadPreview = null;
    renderApp();
    toast(\`Couldn’t read that file (\${err?.message || 'unknown error'}). Try a JPG or PNG under ~10 MB.\`);
  }
}
`;
main = main.slice(0, start) + newStartAnalysis + main.slice(end);
main = replaceOnce(
  main,
  "function readAsDataURL(file) { return new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); }); }",
  "function readAsDataURL(file) { return new Promise((r, j) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => j(new Error('file could not be read')); fr.readAsDataURL(file); }); }",
  'readAsDataURL',
);
main = replaceOnce(
  main,
  "function loadImage(src) { return new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; }); }",
  "function loadImage(src) { return new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => j(new Error('image could not be decoded — HEIC and some formats aren’t supported by every browser')); i.src = src; }); }",
  'loadImage',
);
fs.writeFileSync(mainPath, main);

const modelPath = 'ai-design-studio/src/model.js';
let model = fs.readFileSync(modelPath, 'utf8');
model = replaceOnce(
  model,
  "export function createProject({ templateId = 'living', name, w, l, h, source = 'template' } = {}) {",
  "export function createProject({ templateId = 'living', name, w, l, h, source = 'template', layout = null } = {}) {\n  // `layout` (optional): AI-detected { openings:[{type,wall,offset,width,sill,height}],\n  // furniture:[{catalogId,x,y,rot}] } reconstructed from an uploaded plan/photo.\n  // When present it replaces the template's placements.",
  'createProject signature',
);
model = replaceOnce(
  model,
  "  const sx = sw / t.w, sy = sl / t.l; // scale template placements into the confirmed room size\n  const p = {",
  "  const sx = sw / t.w, sy = sl / t.l; // scale template placements into the confirmed room size\n  const srcOpenings = layout?.openings?.length ? layout.openings : null;\n  const srcFurniture = layout?.furniture?.length ? layout.furniture : null;\n  const p = {",
  'layout sources',
);
const oldOpenings = `      openings: t.openings.map((o) => ({
        id: uid(), sill: 0, height: o.type === 'door' ? 2100 : 1300, ...o,
        offset: Math.round(o.offset * (o.wall % 2 === 0 ? sx : sy)),
      })),
      furniture: t.furniture
        .map((f) => placeFromCatalog(f.catalogId, Math.round(f.x * sx), Math.round(f.y * sy), f.rot))
        .filter(Boolean),`;
const newOpenings = `      openings: srcOpenings
        ? srcOpenings.map((o) => ({
            id: uid(),
            type: o.type === 'window' ? 'window' : 'door',
            wall: [0, 1, 2, 3].includes(o.wall) ? o.wall : 0,
            offset: Math.max(0, Math.round(o.offset || 0)),
            width: Math.max(500, Math.min(3500, Math.round(o.width || (o.type === 'window' ? 1500 : 900)))),
            sill: o.type === 'window' ? Math.max(0, Math.round(o.sill ?? 900)) : 0,
            height: Math.max(400, Math.min(sh, Math.round(o.height || (o.type === 'window' ? 1300 : 2100)))),
          }))
        : t.openings.map((o) => ({
            id: uid(), sill: 0, height: o.type === 'door' ? 2100 : 1300, ...o,
            offset: Math.round(o.offset * (o.wall % 2 === 0 ? sx : sy)),
          })),
      furniture: srcFurniture
        ? srcFurniture
            .map((f) => placeFromCatalog(f.catalogId, Math.max(0, Math.round(f.x || 0)), Math.max(0, Math.round(f.y || 0)), [0, 45, 90, 135, 180, 225, 270, 315].includes(f.rot) ? f.rot : 0))
            .filter(Boolean)
        : t.furniture
            .map((f) => placeFromCatalog(f.catalogId, Math.round(f.x * sx), Math.round(f.y * sy), f.rot))
            .filter(Boolean),`;
model = replaceOnce(model, oldOpenings, newOpenings, 'openings and furniture layout');
fs.writeFileSync(modelPath, model);

const aiPath = 'ai-design-studio/src/ai.js';
let ai = fs.readFileSync(aiPath, 'utf8');
ai = replaceOnce(
  ai,
  "import { catalogItem } from './catalog.js';",
  "import { catalogItem, CATALOG } from './catalog.js';",
  'catalog import',
);
const mentorMarker = '// Online mentor: direct browser call with the user\'s own key.';
if (!ai.includes('export async function reconstructFromClaude')) {
  const reconstruction = `// ---------- Real reconstruction from an uploaded plan / photo ----------
// Sends the image to Claude (user's own key) and asks for a strict-JSON
// description of the room: dimensions, openings and furniture mapped to
// the app's catalog. Returns null if no key is connected.

export async function reconstructFromClaude(dataURL) {
  const key = getApiKey();
  if (!key) return null;
  const m = /^data:(image\\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataURL);
  if (!m) throw new Error('Unsupported image encoding');
  const [, mediaType, b64] = m;

  const catalogIds = CATALOG.map((c) => \`\${c.id} (\${c.name}, \${c.w}×\${c.d} mm)\`).join(', ');
  const sys = \`You reconstruct rooms from floor plans or room photos for an interior design app.
Respond with ONLY a JSON object, no markdown fences, no prose. Schema:
{
 "roomType": "living" | "bedroom" | "kitchen" | "studio",
 "name": string,
 "w": number, "l": number, "h": number,
 "note": string,
 "openings": [ { "type": "door"|"window", "wall": 0|1|2|3, "offset": number, "width": number, "sill": number, "height": number } ],
 "furniture": [ { "catalogId": string, "x": number, "y": number, "rot": 0|90|180|270 } ]
}
Coordinates: room interior origin at top-left of the plan, x right, y down, all mm. Walls: 0=top, 1=right, 2=bottom, 3=left. "offset" is distance along that wall from its origin corner. Furniture x,y is the item's top-left corner. Only use these catalogIds (pick the closest match, skip items with no reasonable match): \${catalogIds}.
If the image contains several rooms, reconstruct the largest habitable one. If dimensions are not labelled, estimate from door widths (~900 mm) and typical proportions and say so in "note".\`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      system: sys,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
          { type: 'text', text: 'Reconstruct this room. JSON only.' },
        ],
      }],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(\`API \${res.status}: \${t.slice(0, 140)}\`);
  }
  const data = await res.json();
  const raw = (data.content || []).map((b) => b.text || '').join('').trim()
    .replace(/^\`\`\`(json)?/i, '').replace(/\`\`\`$/, '').trim();
  let d;
  try { d = JSON.parse(raw); } catch { throw new Error('Claude returned an unreadable reconstruction'); }

  const clampNum = (v, lo, hi, dflt) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, Math.round(+v))) : dflt);
  return {
    templateId: ['living', 'bedroom', 'kitchen', 'studio'].includes(d.roomType) ? d.roomType : 'living',
    name: typeof d.name === 'string' && d.name.trim() ? d.name.trim().slice(0, 40) : null,
    w: clampNum(d.w, 1800, 15000, 4800),
    l: clampNum(d.l, 1800, 15000, 3900),
    h: clampNum(d.h, 2200, 4500, 2700),
    note: typeof d.note === 'string' ? d.note.slice(0, 300) : 'Reconstructed from your image.',
    layout: {
      openings: Array.isArray(d.openings) ? d.openings.slice(0, 8) : [],
      furniture: Array.isArray(d.furniture) ? d.furniture.slice(0, 20) : [],
    },
  };
}

`;
  if (!ai.includes(mentorMarker)) throw new Error('Could not locate online mentor marker');
  ai = ai.replace(mentorMarker, reconstruction + mentorMarker);
}
fs.writeFileSync(aiPath, ai);

console.log('AI Design Studio source updated successfully.');
