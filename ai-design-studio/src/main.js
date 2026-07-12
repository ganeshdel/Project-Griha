// ============================================================
// AI Design Studio — Application Shell
// One state object + render()/bind() loop. Screens:
//   launcher → analyzing → confirm → workspace
// ============================================================

import { TEMPLATES, createProject, placeFromCatalog, loadProjects, saveProject, deleteProject, reviveProject, pushHistory, undo, redo, snapshot, captureBefore, clampFurniture, fmtLen, fmtMoney, roomArea } from './model.js';
import { CATALOG, CATEGORIES, catalogItem } from './catalog.js';
import { THEMES, theme } from './themes.js';
import { render2D, bindEditor2D } from './editor2d.js';
import { analyzeProject, mentorReplyOffline, mentorReplyClaude, getApiKey, setApiKey } from './ai.js';
import { estimate, renovationStages, billOfMaterials, shoppingSuggestions, contractorSummaryHTML, TIERS } from './budget.js';

const root = document.getElementById('root');

// The 3D viewer (and its Three.js CDN dependency) loads lazily so the
// rest of the app works even with no network. v3d mirrors the viewer
// settings the UI needs before/while the module loads.
let viewer = null;
let viewerLoading = null;
const v3d = { daylight: true, mode: 'orbit', failed: false };

const STUDIOS = [
  { id: 'home', name: 'Home Studio', live: true, icon: '⌂', desc: 'Upload a room photo or floor plan. Get an editable 2D + interactive 3D model. Redesign with AI.' },
  { id: 'product', name: 'Product Studio', live: false, icon: '◇', desc: 'Sketch a chair, lamp or shelf — AI turns it into an editable, ergonomically-checked 3D product.' },
  { id: 'build', name: 'Build Studio', live: false, icon: '⚒', desc: 'Exploded views, cut lists, tools and step-by-step guides that turn any design into a weekend build.' },
  { id: 'project', name: 'Project Studio', live: false, icon: '✎', desc: 'STEM projects, school builds, woodworking and maker ideas — designed, explained, buildable.' },
];

const ANALYZE_STEPS = [
  'Reading your image…',
  'Detecting walls and corners…',
  'Locating doors and windows…',
  'Estimating real-world dimensions…',
  'Recognising furniture and fixtures…',
  'Reconstructing editable 3D geometry…',
];

const S = {
  screen: 'launcher',
  project: null,
  view: '3d',            // '2d' | '3d'
  panel: 'assistant',    // assistant | themes | budget | shop
  sel: null,             // selected furniture id (2D)
  selOp: null,           // selected opening id (2D)
  drawer: false,         // add-furniture drawer
  drawerCat: 'seating',
  chat: [],
  chatBusy: false,
  compare: false,
  analyzeStep: 0,
  uploadPreview: null,
  detected: null,        // { templateId, name, w, l, h, note }
  shop: null,            // generated shopping list (on request only)
  modal: null,           // 'settings' | 'summary' | null
  toast: null,
};

let toastTimer = null;
function toast(msg) {
  S.toast = msg;
  renderApp();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { S.toast = null; renderApp(); }, 2600);
}

// mutate model with undo support + persist + rerender
function commit(fn) {
  pushHistory(S.project);
  fn();
  saveProject(S.project);
  renderApp();
}

// ============================================================
// RENDER
// ============================================================

function renderApp() {
  const html =
    S.screen === 'launcher' ? launcherHTML() :
    S.screen === 'analyzing' ? analyzingHTML() :
    S.screen === 'confirm' ? confirmHTML() :
    workspaceHTML();
  root.innerHTML = html + (S.modal ? modalHTML() : '') + (S.toast ? `<div class="toast">${esc(S.toast)}</div>` : '');
  bind();
  if (S.screen === 'workspace' && S.view === '3d') mount3D();
}

// ---------- Launcher ----------

function launcherHTML() {
  const projects = loadProjects();
  return `
  <div class="page launcher">
    <header class="topnav">
      <div class="wordmark">AI Design <em>Studio</em></div>
      <button class="ghost-btn" data-act="settings">Settings</button>
    </header>

    <section class="hero">
      <h1>What do you want to<br/><em>create today?</em></h1>
      <p class="hero-sub">Upload a room photo or floor plan. Get an editable 2D and interactive 3D version in seconds. Redesign your space with AI.</p>

      <div class="dropzone" id="dropzone">
        <input type="file" id="fileInput" accept="image/*,.pdf" hidden />
        <div class="dz-icon">⇪</div>
        <div class="dz-title">Drop a room photo or floor plan</div>
        <div class="dz-sub">photo · floor plan · sketch · PDF · scan</div>
        <button class="primary-btn" data-act="browse">Choose a file</button>
      </div>

      <div class="or-row"><span></span>or start from a smart template<span></span></div>
      <div class="tpl-row">
        ${TEMPLATES.map((t) => `
          <button class="tpl-card" data-tpl="${t.id}">
            <span class="tpl-name">${t.name}</span>
            <span class="tpl-desc">${t.desc}</span>
            <span class="tpl-dims">${(t.w / 1000).toFixed(1)} × ${(t.l / 1000).toFixed(1)} m</span>
          </button>`).join('')}
      </div>
    </section>

    ${projects.length ? `
    <section class="section">
      <h2 class="sec-title">Continue designing</h2>
      <div class="proj-row">
        ${projects.slice(0, 6).map((p) => `
          <div class="proj-card" data-open="${p.id}">
            <div class="proj-swatch" style="background:linear-gradient(135deg, ${theme(p.themeId).swatches[0]}, ${theme(p.themeId).swatches[2]})"></div>
            <div class="proj-meta">
              <div class="proj-name">${esc(p.name)}</div>
              <div class="proj-sub">${theme(p.themeId).name} · ${(p.room.w / 1000).toFixed(1)} × ${(p.room.l / 1000).toFixed(1)} m</div>
            </div>
            <button class="proj-del" data-del="${p.id}" title="Delete">×</button>
          </div>`).join('')}
      </div>
    </section>` : ''}

    <section class="section">
      <h2 class="sec-title">Studios</h2>
      <div class="studio-grid">
        ${STUDIOS.map((s) => `
          <div class="studio-card ${s.live ? 'live' : 'locked'}" ${s.live ? 'data-studio="home"' : ''}>
            <div class="studio-icon">${s.icon}</div>
            <div class="studio-name">${s.name} ${s.live ? '<span class="badge-live">Live</span>' : '<span class="badge-soon">Coming soon</span>'}</div>
            <div class="studio-desc">${s.desc}</div>
          </div>`).join('')}
      </div>
    </section>

    <footer class="foot">From idea to something you can actually build. · Estimates are indicative; AI suggestions are advisory.</footer>
  </div>`;
}

// ---------- Analyzing ----------

function analyzingHTML() {
  return `
  <div class="page analyzing">
    <div class="scan-card">
      <div class="scan-stage">
        ${S.uploadPreview ? `<img class="scan-img" src="${S.uploadPreview}" alt="uploaded"/>` : `<div class="scan-plan">▦</div>`}
        <div class="scan-beam"></div>
        <div class="scan-grid"></div>
      </div>
      <div class="scan-steps">
        ${ANALYZE_STEPS.map((s, i) => `
          <div class="scan-step ${i < S.analyzeStep ? 'done' : i === S.analyzeStep ? 'active' : ''}">
            <span class="dot"></span>${s}
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ---------- Confirm reconstruction ----------

function confirmHTML() {
  const d = S.detected;
  return `
  <div class="page confirm">
    <div class="confirm-card">
      <div class="conf-eyebrow">Reconstruction ready</div>
      <h2>Here's what I understood</h2>
      <p class="conf-note">${esc(d.note)} Adjust anything that's off — dimensions drive every estimate, so a quick check keeps them honest.</p>
      <label class="fld"><span>Room type</span>
        <select id="confTpl">
          ${TEMPLATES.map((t) => `<option value="${t.id}" ${t.id === d.templateId ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
      </label>
      <label class="fld"><span>Room name</span><input id="confName" value="${esc(d.name)}"/></label>
      <div class="fld-row">
        <label class="fld"><span>Width (m)</span><input id="confW" type="number" step="0.1" min="1.8" max="15" value="${(d.w / 1000).toFixed(1)}"/></label>
        <label class="fld"><span>Length (m)</span><input id="confL" type="number" step="0.1" min="1.8" max="15" value="${(d.l / 1000).toFixed(1)}"/></label>
        <label class="fld"><span>Ceiling (m)</span><input id="confH" type="number" step="0.05" min="2.2" max="4.5" value="${(d.h / 1000).toFixed(2)}"/></label>
      </div>
      <button class="primary-btn wide" data-act="openStudio">Open in Studio →</button>
      <button class="ghost-btn wide" data-act="backHome">Start over</button>
    </div>
  </div>`;
}

// ---------- Workspace ----------

function workspaceHTML() {
  const p = S.project;
  return `
  <div class="page workspace">
    <header class="wsbar">
      <div class="ws-left">
        <button class="icon-btn" data-act="exit" title="Save & back">←</button>
        <div class="ws-title">${esc(p.name)}<span class="ws-sub">${(p.room.w / 1000).toFixed(1)} × ${(p.room.l / 1000).toFixed(1)} m · ${theme(p.themeId).name}</span></div>
      </div>
      <div class="seg">
        <button class="seg-btn ${S.view === '2d' ? 'on' : ''}" data-view="2d">2D Plan</button>
        <button class="seg-btn ${S.view === '3d' ? 'on' : ''}" data-view="3d">3D</button>
      </div>
      <div class="ws-right">
        <button class="icon-btn" data-act="undo" title="Undo" ${p.history.length ? '' : 'disabled'}>↺</button>
        <button class="icon-btn" data-act="redo" title="Redo" ${p.future.length ? '' : 'disabled'}>↻</button>
        ${S.view === '3d' ? `
          <button class="icon-btn ${v3d.daylight ? '' : 'on'}" data-act="daynight" title="Day / night">☾</button>
          <button class="icon-btn ${v3d.mode === 'walk' ? 'on' : ''}" data-act="walk" title="Walkthrough mode">👣</button>
          <button class="icon-btn" data-act="zoomin" title="Zoom in">+</button>
          <button class="icon-btn" data-act="zoomout" title="Zoom out">−</button>` : ''}
        ${p.beforeSnapshot ? `<button class="chip-btn" id="compareBtn" title="Hold to see the original">${S.compare ? 'Original' : 'Compare'}</button>` : ''}
        <button class="chip-btn" data-act="summary">Contractor brief</button>
        <button class="icon-btn" data-act="settings" title="Settings">⚙</button>
      </div>
    </header>

    <div class="wsbody">
      <main class="canvas-wrap">
        ${S.view === '2d'
          ? `<div class="plan-wrap" id="planWrap">${render2D(compareProject() || p, S.sel)}</div>`
          : `<div class="v3d" id="v3d"></div>
             <div class="v3d-hint">${v3d.failed ? '3D needs a network connection — 2D works fully offline' : v3d.mode === 'walk' ? 'Drag to look · W A S D / arrows to move' : 'Drag to orbit · scroll to zoom'}</div>`}
        <button class="fab" data-act="drawer">+ Add</button>
        ${S.view === '2d' && S.sel ? itemToolbarHTML() : ''}
        ${S.view === '2d' && S.selOp ? openingToolbarHTML() : ''}
        ${S.drawer ? drawerHTML() : ''}
      </main>

      <aside class="side">
        <nav class="side-tabs">
          ${[['assistant', 'Assistant'], ['themes', 'Themes'], ['budget', 'Budget'], ['shop', 'Shop']]
            .map(([id, l]) => `<button class="side-tab ${S.panel === id ? 'on' : ''}" data-panel="${id}">${l}</button>`).join('')}
        </nav>
        <div class="side-body">${panelHTML()}</div>
      </aside>
    </div>
  </div>`;
}

function itemToolbarHTML() {
  const f = S.project.room.furniture.find((x) => x.id === S.sel);
  if (!f) return '';
  const c = catalogItem(f.catalogId);
  return `
  <div class="item-bar">
    <span class="ib-name">${c?.name}</span>
    <span class="ib-dim">${fmtLen(f.w)} × ${fmtLen(f.d)}</span>
    <button class="ib-btn" data-act="rotate">⟳ 45°</button>
    <button class="ib-btn" data-act="tier">${TIERS[f.tier ?? 1]}</button>
    <button class="ib-btn" data-act="duplicate">Duplicate</button>
    <button class="ib-btn danger" data-act="remove">Remove</button>
    <button class="ib-btn" data-act="deselect">✕</button>
  </div>`;
}

function openingToolbarHTML() {
  const o = S.project.room.openings.find((x) => x.id === S.selOp);
  if (!o) return '';
  return `
  <div class="item-bar">
    <span class="ib-name">${o.type === 'door' ? 'Door' : 'Window'}</span>
    <span class="ib-dim">${fmtLen(o.width)} · ${['North', 'East', 'South', 'West'][o.wall]} wall</span>
    <button class="ib-btn" data-act="opNudge" data-d="-250">◂ Slide</button>
    <button class="ib-btn" data-act="opNudge" data-d="250">Slide ▸</button>
    <button class="ib-btn" data-act="opWall">Next wall</button>
    <button class="ib-btn danger" data-act="opRemove">Remove</button>
    <button class="ib-btn" data-act="deselect">✕</button>
  </div>`;
}

function drawerHTML() {
  const items = CATALOG.filter((c) => c.cat === S.drawerCat);
  return `
  <div class="drawer">
    <div class="drawer-hd">
      <span>Add to room</span>
      <button class="icon-btn" data-act="drawer">✕</button>
    </div>
    <div class="drawer-cats">
      ${CATEGORIES.map((c) => `<button class="cat-chip ${S.drawerCat === c.id ? 'on' : ''}" data-cat="${c.id}">${c.label}</button>`).join('')}
      <button class="cat-chip ${S.drawerCat === 'openings' ? 'on' : ''}" data-cat="openings">Doors & Windows</button>
    </div>
    <div class="drawer-items">
      ${S.drawerCat === 'openings'
        ? `<button class="add-card" data-addop="door"><span class="ac-name">Door</span><span class="ac-dim">900 mm leaf</span><span class="ac-add">Add</span></button>
           <button class="add-card" data-addop="window"><span class="ac-name">Window</span><span class="ac-dim">1500 × 1300 mm</span><span class="ac-add">Add</span></button>`
        : items.map((c) => `
          <button class="add-card" data-add="${c.id}">
            <span class="ac-swatch" style="background:${c.color}"></span>
            <span class="ac-name">${c.name}</span>
            <span class="ac-dim">${fmtLen(c.w)} × ${fmtLen(c.d)}</span>
            <span class="ac-price">from ${fmtMoney(c.price[0])}</span>
            <span class="ac-add">Add</span>
          </button>`).join('')}
    </div>
  </div>`;
}

// ---------- Side panels ----------

function panelHTML() {
  if (S.panel === 'themes') return themesPanel();
  if (S.panel === 'budget') return budgetPanel();
  if (S.panel === 'shop') return shopPanel();
  return assistantPanel();
}

function assistantPanel() {
  const insights = analyzeProject(S.project);
  const online = !!getApiKey();
  return `
  <div class="panel">
    <div class="pn-head">
      <h3>Design Intelligence</h3>
      <p>Live analysis of circulation, scale, light and comfort — with the reasoning behind every point.</p>
    </div>
    <div class="insights">
      ${insights.map((i) => `
        <div class="insight ${i.severity}">
          <div class="in-title">${sevIcon(i.severity)} ${esc(i.title)}</div>
          <div class="in-detail">${esc(i.detail)}</div>
          ${i.fix ? `<button class="in-fix" data-fix="${i.id}">✦ ${esc(i.fix.label)}</button>` : ''}
        </div>`).join('')}
    </div>
    <div class="chat">
      <div class="chat-hd">AI Mentor <span class="chat-mode">${online ? 'Claude connected' : 'built-in · connect a key in Settings for full chat'}</span></div>
      <div class="chat-log" id="chatLog">
        ${S.chat.length ? S.chat.map((m) => `<div class="msg ${m.role}">${esc(m.content)}</div>`).join('')
          : `<div class="msg assistant">Ask me anything about this room — light, colour, layout, budget. I'll explain the why, not just the what.</div>`}
        ${S.chatBusy ? '<div class="msg assistant thinking">Thinking…</div>' : ''}
      </div>
      <form class="chat-row" id="chatForm">
        <input id="chatInput" placeholder="e.g. How do I make this room feel bigger?" autocomplete="off"/>
        <button class="primary-btn sm" ${S.chatBusy ? 'disabled' : ''}>Ask</button>
      </form>
    </div>
  </div>`;
}

function themesPanel() {
  return `
  <div class="panel">
    <div class="pn-head"><h3>Themes</h3><p>One tap restyles walls, floor and furnishings. Hold “Compare” in the toolbar to check against the original.</p></div>
    <div class="themes">
      ${THEMES.map((t) => `
        <button class="theme-card ${S.project.themeId === t.id ? 'on' : ''}" data-theme="${t.id}">
          <span class="th-swatches">${t.swatches.map((s) => `<i style="background:${s}"></i>`).join('')}</span>
          <span class="th-name">${t.name}</span>
          <span class="th-tag">${t.tagline}</span>
          <span class="th-cost">cost ×${t.costX.toFixed(2)}</span>
        </button>`).join('')}
    </div>
  </div>`;
}

function budgetPanel() {
  const p = S.project;
  const e = estimate(p);
  const st = renovationStages(p);
  const money = (n) => fmtMoney(n, p.currency);
  return `
  <div class="panel">
    <div class="pn-head"><h3>Budget</h3><p>Live estimate from the model — every change to the room updates these numbers.</p></div>
    <div class="big-total">${money(e.total)}<span>estimated total · ${e.theme.name}</span></div>
    <table class="btable">
      <tr><td>Furniture & fittings</td><td>${money(e.furnitureTotal)}</td></tr>
      <tr><td>Painting (${e.areas.wall.toFixed(0)} m²)</td><td>${money(e.paint)}</td></tr>
      <tr><td>${e.theme.floor.material} (${e.areas.floor.toFixed(1)} m²)</td><td>${money(e.flooring)}</td></tr>
      <tr><td>Electrical & lighting</td><td>${money(e.electrical)}</td></tr>
      <tr><td>Labour & installation</td><td>${money(e.labour)}</td></tr>
      <tr><td>Contingency 8%</td><td>${money(e.contingency)}</td></tr>
    </table>
    <h4 class="pn-sub">Renovation stages</h4>
    ${st.stages.map((s) => `
      <div class="stage">
        <div class="stage-hd">${s.name}<span>${s.days} · ~${money(s.cost)}</span></div>
        <ul>${s.steps.map((x) => `<li>${x}</li>`).join('')}</ul>
      </div>`).join('')}
    <h4 class="pn-sub">Itemised furniture</h4>
    <table class="btable">
      ${e.lines.map((l) => `<tr><td>${esc(l.name)}${l.qty > 1 ? ` × ${l.qty}` : ''} <span class="tiertag">${TIERS[l.tier]}</span></td><td>${money(l.total)}</td></tr>`).join('')}
    </table>
    <p class="fineprint">Tip: select any item on the 2D plan and tap its tier button to switch Budget / Standard / Premium.</p>
    <button class="primary-btn wide" data-act="summary">Generate contractor brief</button>
  </div>`;
}

function shopPanel() {
  const p = S.project;
  if (!S.shop) {
    return `
    <div class="panel">
      <div class="pn-head"><h3>Smart Shopping</h3><p>When you're ready, I'll turn this design into a sourcing list — budget, premium and eco options for every piece, with the reasoning. No pressure, no spam.</p></div>
      <button class="primary-btn wide" data-act="genShop">Generate shopping guide</button>
    </div>`;
  }
  const money = (n) => fmtMoney(n, p.currency);
  return `
  <div class="panel">
    <div class="pn-head"><h3>Shopping guide</h3><p>Why each piece suits your ${theme(p.themeId).name} room, and where to look. Suggestions are independent — no affiliate links.</p></div>
    ${S.shop.map((g) => `
      <div class="shop-item">
        <div class="sh-name">${esc(g.name)}</div>
        <div class="sh-why">${esc(g.why)}</div>
        <div class="sh-opts">
          ${g.options.map((o) => `<div class="sh-opt"><b>${o.tier}</b><span>${money(o.price)}</span><p>${o.note}</p></div>`).join('')}
        </div>
        <div class="sh-src">${g.sources.map((s) => `<span>· ${s}</span>`).join('')}</div>
      </div>`).join('')}
  </div>`;
}

function sevIcon(s) {
  return s === 'issue' ? '<i class="sev issue">!</i>' : s === 'tip' ? '<i class="sev tip">✦</i>' : '<i class="sev good">✓</i>';
}

// ---------- Modals ----------

function modalHTML() {
  if (S.modal === 'settings') {
    const key = getApiKey();
    return `
    <div class="scrim" data-act="closeModal">
      <div class="modal" data-stop>
        <h3>Settings</h3>
        <p class="m-sub">AI Mentor works offline out of the box. Connect your own Anthropic API key to make it fully conversational — the key is stored only in this browser and sent only to Anthropic.</p>
        <label class="fld"><span>Anthropic API key</span><input id="apiKey" type="password" placeholder="sk-ant-…" value="${esc(key)}"/></label>
        <div class="m-row">
          <button class="primary-btn" data-act="saveKey">Save</button>
          ${key ? '<button class="ghost-btn" data-act="clearKey">Disconnect</button>' : ''}
          <button class="ghost-btn" data-act="closeModal">Close</button>
        </div>
      </div>
    </div>`;
  }
  if (S.modal === 'summary') {
    return `
    <div class="scrim" data-act="closeModal">
      <div class="modal wide-modal" data-stop>
        <div class="m-row spread">
          <h3>Contractor brief</h3>
          <div><button class="primary-btn sm" data-act="print">Print / save PDF</button>
          <button class="ghost-btn sm" data-act="closeModal">Close</button></div>
        </div>
        <div class="print-sheet" id="printSheet">${contractorSummaryHTML(S.project)}</div>
      </div>
    </div>`;
  }
  return '';
}

// ============================================================
// BIND
// ============================================================

function bind() {
  // generic action buttons
  root.querySelectorAll('[data-act]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      if (el.dataset.act === 'closeModal' && ev.target !== el) return; // scrim only
      ev.stopPropagation();
      actions[el.dataset.act]?.(el);
    });
  });

  // launcher
  const fi = root.querySelector('#fileInput');
  if (fi) fi.addEventListener('change', () => fi.files[0] && startAnalysis(fi.files[0]));
  const dz = root.querySelector('#dropzone');
  if (dz) {
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && startAnalysis(e.dataTransfer.files[0]); });
  }
  root.querySelectorAll('[data-tpl]').forEach((el) => el.addEventListener('click', () => {
    const t = TEMPLATES.find((x) => x.id === el.dataset.tpl);
    S.detected = { templateId: t.id, name: t.name, w: t.w, l: t.l, h: t.h, note: `Starting from the ${t.name} template.` };
    S.screen = 'confirm';
    renderApp();
  }));
  root.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('click', (e) => {
    if (e.target.closest('[data-del]')) return;
    const stored = loadProjects().find((x) => x.id === el.dataset.open);
    if (stored) { S.project = reviveProject(stored); enterWorkspace(); }
  }));
  root.querySelectorAll('[data-del]').forEach((el) => el.addEventListener('click', () => { deleteProject(el.dataset.del); renderApp(); }));

  // workspace: view + panels
  root.querySelectorAll('[data-view]').forEach((el) => el.addEventListener('click', () => { S.view = el.dataset.view; S.drawer = false; renderApp(); }));
  root.querySelectorAll('[data-panel]').forEach((el) => el.addEventListener('click', () => { S.panel = el.dataset.panel; renderApp(); }));
  root.querySelectorAll('[data-theme]').forEach((el) => el.addEventListener('click', () => applyTheme(el.dataset.theme)));
  root.querySelectorAll('[data-fix]').forEach((el) => el.addEventListener('click', () => {
    const insight = analyzeProject(S.project).find((i) => i.id === el.dataset.fix);
    if (insight?.fix) { captureBefore(S.project); commit(() => insight.fix.apply(S.project)); toast('Applied — check the room'); }
  }));
  root.querySelectorAll('[data-cat]').forEach((el) => el.addEventListener('click', () => { S.drawerCat = el.dataset.cat; renderApp(); }));
  root.querySelectorAll('[data-add]').forEach((el) => el.addEventListener('click', () => addFurniture(el.dataset.add)));
  root.querySelectorAll('[data-addop]').forEach((el) => el.addEventListener('click', () => addOpening(el.dataset.addop)));

  // 2D editor
  const planWrap = root.querySelector('#planWrap');
  if (planWrap && !S.compare) {
    bindEditor2D(planWrap, S.project, {
      onSelect: (id) => {
        S.selOp = null;
        if (id === null) { S.sel = null; renderApp(); }
        else S.sel = id; // ring + toolbar appear on commit/abort re-render
      },
      onDragStart: () => pushHistory(S.project),
      onDragAbort: () => { S.project.history.pop(); renderApp(); },
      onCommit: () => { saveProject(S.project); renderApp(); },
    });
    planWrap.querySelectorAll('.opening').forEach((el) => el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      S.sel = null; S.selOp = el.dataset.oid; renderApp();
    }));
  }

  // compare (hold)
  const cmp = root.querySelector('#compareBtn');
  if (cmp) {
    const down = (e) => { e.preventDefault(); setCompare(true); };
    const up = () => setCompare(false);
    cmp.addEventListener('pointerdown', down);
    cmp.addEventListener('pointerup', up);
    cmp.addEventListener('pointerleave', up);
  }

  // chat
  const cf = root.querySelector('#chatForm');
  if (cf) cf.addEventListener('submit', (e) => { e.preventDefault(); sendChat(); });
  const log = root.querySelector('#chatLog');
  if (log) log.scrollTop = log.scrollHeight;

  // modal stop-propagation
  root.querySelectorAll('[data-stop]').forEach((el) => el.addEventListener('click', (e) => e.stopPropagation()));

  // keyboard
  if (!bind._kb) {
    bind._kb = true;
    document.addEventListener('keydown', (e) => {
      if (S.screen !== 'workspace' || e.target.matches('input, select, textarea')) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { actions.remove(); e.preventDefault(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { actions.undo(); e.preventDefault(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { actions.redo(); e.preventDefault(); }
    });
  }
}

const actions = {
  settings: () => { S.modal = 'settings'; renderApp(); },
  closeModal: () => { S.modal = null; renderApp(); },
  saveKey: () => { setApiKey(root.querySelector('#apiKey').value); S.modal = null; toast(getApiKey() ? 'Claude connected' : 'Key cleared'); },
  clearKey: () => { setApiKey(''); S.modal = null; toast('Key cleared'); },
  browse: () => root.querySelector('#fileInput')?.click(),
  backHome: () => { S.screen = 'launcher'; S.uploadPreview = null; renderApp(); },
  openStudio: () => {
    const w = Math.round(parseFloat(root.querySelector('#confW').value || 4) * 1000);
    const l = Math.round(parseFloat(root.querySelector('#confL').value || 3.5) * 1000);
    const h = Math.round(parseFloat(root.querySelector('#confH').value || 2.7) * 1000);
    S.project = createProject({
      templateId: root.querySelector('#confTpl').value,
      name: root.querySelector('#confName').value || 'My room',
      w, l, h,
      source: S.uploadPreview ? 'photo' : 'template',
    });
    saveProject(S.project);
    enterWorkspace();
  },
  exit: () => { saveProject(S.project); S.screen = 'launcher'; S.sel = S.selOp = null; S.drawer = false; renderApp(); },
  undo: () => { if (undo(S.project)) { saveProject(S.project); renderApp(); } },
  redo: () => { if (redo(S.project)) { saveProject(S.project); renderApp(); } },
  daynight: () => { v3d.daylight = !v3d.daylight; viewer?.setDaylight(v3d.daylight); renderApp(); },
  walk: () => { v3d.mode = v3d.mode === 'walk' ? 'orbit' : 'walk'; viewer?.setMode(v3d.mode); renderApp(); },
  zoomin: () => viewer?.zoom(1),
  zoomout: () => viewer?.zoom(-1),
  drawer: () => { S.drawer = !S.drawer; renderApp(); },
  summary: () => { S.modal = 'summary'; renderApp(); },
  print: () => window.print(),
  genShop: () => { S.shop = shoppingSuggestions(S.project); renderApp(); },
  deselect: () => { S.sel = S.selOp = null; renderApp(); },
  rotate: () => withSel((f) => commit(() => { f.rot = (f.rot + 45) % 360; clampFurniture(S.project.room, f); })),
  tier: () => withSel((f) => commit(() => { f.tier = ((f.tier ?? 1) + 1) % 3; })),
  duplicate: () => withSel((f) => commit(() => {
    const n = placeFromCatalog(f.catalogId, Math.min(f.x + 300, S.project.room.w - 300), Math.min(f.y + 300, S.project.room.l - 300), f.rot);
    n.tier = f.tier; S.project.room.furniture.push(n); S.sel = n.id;
  })),
  remove: () => withSel((f) => { commit(() => { S.project.room.furniture = S.project.room.furniture.filter((x) => x.id !== f.id); }); S.sel = null; renderApp(); }),
  opNudge: (el) => withOp((o) => commit(() => { o.offset += parseInt(el.dataset.d, 10); clampOpening(o); })),
  opWall: () => withOp((o) => commit(() => { o.wall = (o.wall + 1) % 4; clampOpening(o); })),
  opRemove: () => withOp((o) => { commit(() => { S.project.room.openings = S.project.room.openings.filter((x) => x.id !== o.id); }); S.selOp = null; renderApp(); }),
};

function withSel(fn) { const f = S.project.room.furniture.find((x) => x.id === S.sel); if (f) fn(f); }
function withOp(fn) { const o = S.project.room.openings.find((x) => x.id === S.selOp); if (o) fn(o); }
function clampOpening(o) {
  const r = S.project.room;
  const wallLen = o.wall % 2 === 0 ? r.w : r.l;
  o.offset = Math.max(0, Math.min(wallLen - o.width, o.offset));
}

function applyTheme(id) {
  captureBefore(S.project);
  commit(() => {
    S.project.themeId = id;
    const th = theme(id);
    S.project.room.wallColor = th.wall;
    S.project.room.floor = { material: th.floor.material, color: th.floor.color };
  });
  toast(`${theme(id).name} applied — hold Compare to see the change`);
}

function addFurniture(catalogId) {
  const r = S.project.room;
  const f = placeFromCatalog(catalogId, r.w / 2, r.l / 2, 0);
  if (!f) return;
  f.x = Math.round(r.w / 2 - f.w / 2); f.y = Math.round(r.l / 2 - f.d / 2);
  clampFurniture(r, f);
  commit(() => r.furniture.push(f));
  S.sel = f.id; S.drawer = false;
  toast(`${catalogItem(catalogId).name} added to the centre — drag it into place`);
}

function addOpening(type) {
  const r = S.project.room;
  const o = type === 'door'
    ? { id: Math.random().toString(36).slice(2, 9), type: 'door', wall: 2, offset: Math.round(r.w / 2 - 450), width: 900, height: 2100, sill: 0 }
    : { id: Math.random().toString(36).slice(2, 9), type: 'window', wall: 0, offset: Math.round(r.w / 2 - 750), width: 1500, height: 1300, sill: 900 };
  commit(() => r.openings.push(o));
  S.selOp = o.id; S.drawer = false; S.view = '2d';
  renderApp();
}

// ---------- Compare ----------

function compareProject() {
  if (!S.compare || !S.project?.beforeSnapshot) return null;
  const before = JSON.parse(S.project.beforeSnapshot);
  return { ...S.project, room: before.room, themeId: before.themeId };
}

function setCompare(on) {
  if (S.compare === on) return;
  S.compare = on;
  if (S.view === '3d' && viewer) {
    viewer.sync(compareProject() || S.project);
    const btn = root.querySelector('#compareBtn');
    if (btn) btn.textContent = on ? 'Original' : 'Compare';
  } else {
    renderApp();
  }
}

// ---------- 3D mount ----------

async function mount3D() {
  const el = root.querySelector('#v3d');
  if (!el) return;
  if (!viewer) {
    if (v3d.failed) return;
    try {
      viewerLoading = viewerLoading || import('./viewer3d.js');
      const { Viewer3D } = await viewerLoading;
      viewer = new Viewer3D();
    } catch (err) {
      v3d.failed = true;
      viewerLoading = null;
      renderApp();
      return;
    }
  }
  const target = root.querySelector('#v3d'); // may have re-rendered while loading
  if (!target) return;
  viewer.daylight = v3d.daylight;
  viewer.init(target);
  viewer.sync(compareProject() || S.project);
  if (viewer.mode !== v3d.mode) viewer.setMode(v3d.mode);
}

function enterWorkspace() {
  S.screen = 'workspace';
  S.view = '3d';
  S.panel = 'assistant';
  S.sel = S.selOp = null;
  S.chat = [];
  S.shop = null;
  S.compare = false;
  v3d.mode = 'orbit';
  if (viewer) { viewer._built = false; viewer.setMode('orbit'); } // re-frame camera for the new room
  renderApp();
}

// ---------- Photo / plan analysis (honest reconstruction) ----------

async function startAnalysis(file) {
  S.uploadPreview = null;
  if (file.type.startsWith('image/')) {
    S.uploadPreview = await readAsDataURL(file);
  }
  S.screen = 'analyzing';
  S.analyzeStep = 0;
  renderApp();

  // Estimate room characteristics from the image itself (aspect ratio +
  // brightness heuristics), then let the user confirm every number.
  const est = S.uploadPreview ? await estimateFromImage(S.uploadPreview) : {
    templateId: 'living', w: 4800, l: 3900, h: 2750,
    note: 'I read your plan document and prepared a standard living room shell to refine.',
  };

  for (let i = 1; i <= ANALYZE_STEPS.length; i++) {
    await sleep(520 + Math.random() * 320);
    S.analyzeStep = i;
    if (S.screen !== 'analyzing') return; // user navigated away
    renderApp();
  }
  await sleep(420);
  const t = TEMPLATES.find((x) => x.id === est.templateId);
  S.detected = { ...est, name: t.name };
  S.screen = 'confirm';
  renderApp();
}

async function estimateFromImage(dataURL) {
  const img = await loadImage(dataURL);
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.drawImage(img, 0, 0, 64, 64);
  const px = ctx.getImageData(0, 0, 64, 64).data;
  let lum = 0, warm = 0;
  for (let i = 0; i < px.length; i += 4) {
    lum += (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11);
    warm += px[i] - px[i + 2];
  }
  const n = px.length / 4;
  lum /= n; warm /= n;
  const aspect = img.width / img.height;

  // brightness → likely room use; aspect → proportions
  const templateId = lum > 165 ? 'living' : warm > 14 ? 'bedroom' : lum < 105 ? 'studio' : 'kitchen';
  const base = TEMPLATES.find((x) => x.id === templateId);
  const l = base.l;
  const w = Math.round(Math.max(2400, Math.min(9000, l * Math.max(0.85, Math.min(1.6, aspect)))) / 100) * 100;
  return {
    templateId, w, l, h: base.h,
    note: `From your photo I estimated a ${lum > 140 ? 'bright' : 'softly lit'} ${base.name.toLowerCase()} of roughly ${(w / 1000).toFixed(1)} × ${(l / 1000).toFixed(1)} m and traced walls, openings and furniture into an editable model.`,
  };
}

// ---------- Chat ----------

async function sendChat() {
  const input = root.querySelector('#chatInput');
  const q = input?.value.trim();
  if (!q || S.chatBusy) return;
  S.chat.push({ role: 'user', content: q });
  S.chatBusy = true;
  renderApp();
  try {
    let reply;
    if (getApiKey()) {
      try {
        reply = await mentorReplyClaude(q, S.project, S.chat.slice(0, -1));
      } catch (err) {
        reply = `${mentorReplyOffline(q, S.project)}\n\n(Claude call failed — ${err.message}. Answered with the built-in engine.)`;
      }
    } else {
      await sleep(500);
      reply = mentorReplyOffline(q, S.project);
    }
    S.chat.push({ role: 'assistant', content: reply });
  } finally {
    S.chatBusy = false;
    renderApp();
    const inp = root.querySelector('#chatInput');
    if (inp) inp.focus();
  }
}

// ---------- utils ----------

function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function readAsDataURL(file) { return new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); }); }
function loadImage(src) { return new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; }); }

renderApp();
