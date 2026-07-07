/* ─────────────────────────────────────────────────────────────
   Report Studio — UI layer (standalone tool).
   Everything runs on this device: files are parsed in browser
   memory, never uploaded, never written to disk by the app.
   Only report *settings* (no data) are kept in localStorage.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const E = window.RBEngine;
  const TPL_KEY = 'reportstudio.templates.v1';
  const DRAFT_KEY = 'reportstudio.draft.v1';
  const PREVIEW_ROWS = 100;

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.js';
  }

  /* ══════════════ tiny DOM helpers ══════════════ */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function uid() { return 'c' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function toast(msg, isErr) {
    const host = $('#rb-toast');
    if (!host) return;
    const d = document.createElement('div');
    d.className = 'rb-toast-item' + (isErr ? ' err' : '');
    d.textContent = msg;
    host.appendChild(d);
    setTimeout(function () { d.remove(); }, isErr ? 5200 : 3200);
  }
  let previewTimer = null;
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 180);
  }

  /* ══════════════ state ══════════════ */

  const state = {
    tab: 'files',
    sources: [],            // [{id(=unique name), name, fileName, kind, fields:[{name,type}], rows:[{}], note}]
    report: newReport(),
    templates: loadTemplates(),
    activeTemplateId: null,
    editable: true,          // false when a locked template is loaded and not yet unlocked
    exportFormat: 'xlsx'
  };

  function newReport() {
    return {
      name: 'Untitled report',
      primarySourceId: null,
      links: [],
      columns: [],
      filters: [],
      sort: [],
      groupBy: null,
      options: { totalsRow: false, title: '' }
    };
  }

  function loadTemplates() {
    try { return JSON.parse(localStorage.getItem(TPL_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveTemplates() {
    localStorage.setItem(TPL_KEY, JSON.stringify(state.templates));
  }
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        report: state.report, activeTemplateId: state.activeTemplateId, editable: state.editable
      }));
    } catch (e) { /* storage full — draft is best-effort */ }
  }
  function loadDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (d && d.report && d.report.columns) {
        state.report = Object.assign(newReport(), d.report);
        state.activeTemplateId = d.activeTemplateId || null;
        state.editable = d.editable !== false;
      }
    } catch (e) { /* ignore corrupt draft */ }
  }

  function touch() { saveDraft(); schedulePreview(); }

  /* ══════════════ password hashing (edit lock) ══════════════ */

  const PBKDF2_ITER = 150000;
  function randomSalt() {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }
  function hexToBuf(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }
  function hashPassword(password, saltHex) {
    const enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
      .then(function (key) {
        return crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: hexToBuf(saltHex), iterations: PBKDF2_ITER, hash: 'SHA-256' }, key, 256);
      })
      .then(function (bits) {
        return Array.prototype.map.call(new Uint8Array(bits), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
      });
  }

  /* ══════════════ file parsing ══════════════ */

  function uniqueSourceName(base) {
    let name = base, n = 2;
    const taken = state.sources.map(function (s) { return s.name.toLowerCase(); });
    while (taken.indexOf(name.toLowerCase()) >= 0) { name = base + ' (' + n + ')'; n++; }
    return name;
  }

  function addSource(name, fileName, kind, fields, rows, note) {
    const finalName = uniqueSourceName(name);
    const typed = E.inferTypes(fields, rows);
    state.sources.push({ id: finalName, name: finalName, fileName: fileName, kind: kind, fields: typed, rows: rows, note: note || '' });
  }

  function handleFiles(fileList) {
    const files = Array.prototype.slice.call(fileList);
    if (!files.length) return;
    let pending = files.length;
    files.forEach(function (file) {
      parseFile(file).then(function () { done(); })
        .catch(function (err) {
          console.error(err);
          toast('Could not read ' + file.name + ': ' + (err && err.message ? err.message : err), true);
          done();
        });
    });
    function done() {
      pending--;
      if (pending === 0) { render(); toast('Files loaded — nothing left this device.'); }
    }
  }

  function parseFile(file) {
    const name = file.name;
    const base = name.replace(/\.[^.]+$/, '');
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return parsePdfFile(file, base);
    if (ext === 'json') return parseJsonFile(file, base);
    return file.arrayBuffer().then(function (buf) {
      const wb = XLSX.read(buf, { type: 'array', cellDates: true, raw: true });
      let added = 0;
      wb.SheetNames.forEach(function (sn) {
        const ws = wb.Sheets[sn];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
        if (!rows.length) return;
        const fields = Object.keys(rows[0]);
        if (!fields.length) return;
        const srcName = wb.SheetNames.length > 1 ? base + ' · ' + sn : base;
        addSource(srcName, name, ext, fields, rows);
        added++;
      });
      if (!added) throw new Error('no data rows found (is the first row a header?)');
    });
  }

  function parseJsonFile(file, base) {
    return file.text().then(function (text) {
      const data = JSON.parse(text);
      let arr = null;
      if (Array.isArray(data)) arr = data;
      else if (data && typeof data === 'object') {
        for (const k in data) {
          if (Array.isArray(data[k]) && data[k].length && typeof data[k][0] === 'object') { arr = data[k]; break; }
        }
      }
      if (!arr || !arr.length) throw new Error('expected a JSON array of objects');
      const rows = arr.map(function (item) {
        const flat = {};
        flatten(item, '', flat);
        return flat;
      });
      const fieldSet = [];
      rows.forEach(function (r) { for (const k in r) if (fieldSet.indexOf(k) < 0) fieldSet.push(k); });
      rows.forEach(function (r) { fieldSet.forEach(function (f) { if (!(f in r)) r[f] = ''; }); });
      addSource(base, file.name, 'json', fieldSet, rows);
    });
    function flatten(obj, prefix, out) {
      if (obj === null || typeof obj !== 'object' || obj instanceof Date) { out[prefix || 'value'] = obj; return; }
      if (Array.isArray(obj)) { out[prefix || 'value'] = obj.join(', '); return; }
      for (const k in obj) {
        const key = prefix ? prefix + '.' + k : k;
        const v = obj[k];
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) flatten(v, key, out);
        else if (Array.isArray(v)) out[key] = v.join(', ');
        else out[key] = v;
      }
    }
  }

  /* Best-effort PDF table extraction: cluster text by line, split cells on wide gaps. */
  function parsePdfFile(file, base) {
    if (!window.pdfjsLib) return Promise.reject(new Error('PDF engine not loaded'));
    return file.arrayBuffer().then(function (buf) {
      return window.pdfjsLib.getDocument({ data: buf }).promise;
    }).then(function (doc) {
      const pagePromises = [];
      for (let p = 1; p <= doc.numPages; p++) {
        pagePromises.push(doc.getPage(p).then(function (page) { return page.getTextContent(); }));
      }
      return Promise.all(pagePromises);
    }).then(function (contents) {
      const lines = [];
      contents.forEach(function (tc) {
        const byY = new Map();
        tc.items.forEach(function (it) {
          if (!it.str || !it.str.trim()) return;
          const y = Math.round(it.transform[5] / 3) * 3;
          if (!byY.has(y)) byY.set(y, []);
          byY.get(y).push({ x: it.transform[4], w: it.width || 0, s: it.str });
        });
        const ys = Array.from(byY.keys()).sort(function (a, b) { return b - a; });
        ys.forEach(function (y) {
          const items = byY.get(y).sort(function (a, b) { return a.x - b.x; });
          const cells = [];
          let cur = null, curEnd = 0;
          items.forEach(function (it) {
            const gap = it.x - curEnd;
            if (cur === null || gap > 9) { cur = { text: it.s }; cells.push(cur); }
            else cur.text += (gap > 1.5 ? ' ' : '') + it.s;
            curEnd = it.x + it.w;
          });
          lines.push(cells.map(function (c) { return c.text.trim(); }));
        });
      });
      const tableLines = lines.filter(function (l) { return l.length >= 2; });
      if (!tableLines.length) throw new Error('no table-like text found in this PDF');
      // most frequent column count wins
      const freq = {};
      tableLines.forEach(function (l) { freq[l.length] = (freq[l.length] || 0) + 1; });
      let colCount = 2, best = 0;
      for (const k in freq) if (freq[k] > best) { best = freq[k]; colCount = Number(k); }
      const rowsRaw = tableLines.filter(function (l) { return l.length === colCount; });
      let header = rowsRaw[0];
      const headerLooksReal = header.every(function (h) { return h && !/^[\d.,%₹$-]+$/.test(h); });
      const fields = headerLooksReal
        ? header.map(function (h, i) { return h || ('Column ' + (i + 1)); })
        : header.map(function (_, i) { return 'Column ' + (i + 1); });
      const dataRows = (headerLooksReal ? rowsRaw.slice(1) : rowsRaw).map(function (l) {
        const o = {};
        fields.forEach(function (f, i) {
          let v = l[i] === undefined ? '' : l[i];
          const n = Number(String(v).replace(/[,\s₹$€£%]/g, ''));
          o[f] = v !== '' && Number.isFinite(n) && /[\d]/.test(v) && /^[\d.,\s₹$€£%()-]+$/.test(v) ? n : v;
        });
        return o;
      });
      if (!dataRows.length) throw new Error('PDF table had a header but no data rows');
      addSource(base, file.name, 'pdf', fields, dataRows,
        'Extracted from PDF text (best effort) — check the preview, PDFs have no true table structure.');
    });
  }

  /* ══════════════ demo data ══════════════ */

  function loadDemo() {
    addSource('Invoices', 'demo', 'demo',
      ['Invoice', 'Customer', 'Item', 'Qty', 'Unit price', 'Date'],
      [
        { 'Invoice': 'INV-001', 'Customer': 'C001', 'Item': 'LED bulb 9W', 'Qty': 12, 'Unit price': 95, 'Date': '2026-06-02' },
        { 'Invoice': 'INV-002', 'Customer': 'C002', 'Item': 'Ceiling fan', 'Qty': 2, 'Unit price': 2450, 'Date': '2026-06-04' },
        { 'Invoice': 'INV-003', 'Customer': 'C001', 'Item': 'Smart plug', 'Qty': 5, 'Unit price': 799, 'Date': '2026-06-10' },
        { 'Invoice': 'INV-004', 'Customer': 'C003', 'Item': 'MCB 16A', 'Qty': 8, 'Unit price': 210, 'Date': '2026-06-15' },
        { 'Invoice': 'INV-005', 'Customer': 'C002', 'Item': 'LED batten', 'Qty': 6, 'Unit price': 340, 'Date': '2026-06-21' }
      ]);
    addSource('Customers', 'demo', 'demo',
      ['Code', 'Name', 'City', 'GST'],
      [
        { 'Code': 'C001', 'Name': 'Asha Traders', 'City': 'Pune', 'GST': '27AAAPA1111A1Z5' },
        { 'Code': 'C002', 'Name': 'Ravi Electricals', 'City': 'Delhi', 'GST': '07BBBPB2222B2Z6' },
        { 'Code': 'C003', 'Name': 'Meera Enterprises', 'City': 'Chennai', 'GST': '33CCCPC3333C3Z7' }
      ]);
    render();
    toast('Demo files loaded — try dragging fields on the Build tab.');
  }

  /* ══════════════ report actions ══════════════ */

  function requireEditable() {
    if (state.editable) return true;
    toast('This report is locked. Unlock it to make changes.', true);
    return false;
  }

  function addColumnFromField(sourceId, field, atIndex) {
    if (!requireEditable()) return;
    const src = state.sources.find(function (s) { return s.id === sourceId; });
    if (!src) return;
    const r = state.report;
    if (!r.primarySourceId) r.primarySourceId = sourceId;

    function insert() {
      const labels = r.columns.map(function (c) { return c.label; });
      let label = field, n = 2;
      while (labels.indexOf(label) >= 0) { label = field + ' (' + n + ')'; n++; }
      const fieldDef = src.fields.find(function (f) { return f.name === field; });
      const col = {
        id: uid(), kind: 'field', sourceId: sourceId, field: field, label: label,
        format: fieldDef && fieldDef.type === 'number' ? 'auto' : (fieldDef && fieldDef.type === 'date' ? 'date' : 'auto'),
        decimals: 2, align: fieldDef && fieldDef.type === 'number' ? 'right' : 'left',
        agg: fieldDef && fieldDef.type === 'number' ? 'sum' : 'first',
        total: false, width: 0
      };
      if (atIndex === undefined || atIndex === null || atIndex < 0 || atIndex > r.columns.length) r.columns.push(col);
      else r.columns.splice(atIndex, 0, col);
      touch();
      renderBuild();
    }

    if (sourceId !== r.primarySourceId && !r.links.some(function (l) { return l.sourceId === sourceId; })) {
      openLinkModal(sourceId, insert);
    } else {
      insert();
    }
  }

  function removeColumn(colId) {
    if (!requireEditable()) return;
    const r = state.report;
    r.columns = r.columns.filter(function (c) { return c.id !== colId; });
    r.filters = r.filters.filter(function (f) { return f.colId !== colId; });
    r.sort = r.sort.filter(function (s) { return s.colId !== colId; });
    if (r.groupBy === colId) r.groupBy = null;
    touch();
    renderBuild();
  }

  function moveColumn(colId, toIndex) {
    if (!requireEditable()) return;
    const r = state.report;
    const from = r.columns.findIndex(function (c) { return c.id === colId; });
    if (from < 0) return;
    const col = r.columns.splice(from, 1)[0];
    if (toIndex > from) toIndex--;
    r.columns.splice(Math.max(0, Math.min(toIndex, r.columns.length)), 0, col);
    touch();
    renderBuild();
  }

  function runFull() {
    return E.runReport(state.sources, state.report, {});
  }

  /* ══════════════ modals ══════════════ */

  function openModal(html, wide) {
    closeModal();
    const back = document.createElement('div');
    back.className = 'rb-modal-back';
    back.id = 'rb-modal';
    back.innerHTML = '<div class="rb-modal' + (wide ? ' wide' : '') + '">' + html + '</div>';
    back.addEventListener('mousedown', function (e) { if (e.target === back) closeModal(); });
    document.body.appendChild(back);
    const first = back.querySelector('input, textarea, select');
    if (first) setTimeout(function () { first.focus(); }, 30);
    return back;
  }
  function closeModal() {
    const m = $('#rb-modal');
    if (m) m.remove();
  }

  function promptPassword(title, sub, confirm) {
    return new Promise(function (resolve) {
      const m = openModal(
        '<h3>' + esc(title) + '</h3><p class="sub">' + esc(sub) + '</p>' +
        '<label class="rb-field-label">Password</label>' +
        '<input type="password" class="rb-input" id="pw1" autocomplete="off" />' +
        (confirm ? '<label class="rb-field-label">Repeat password</label><input type="password" class="rb-input" id="pw2" autocomplete="off" />' : '') +
        '<div class="rb-error" id="pw-err" style="display:none"></div>' +
        '<div class="acts"><button class="rb-btn ghost" id="pw-cancel">Cancel</button>' +
        '<button class="rb-btn primary" id="pw-ok">OK</button></div>'
      );
      $('#pw-cancel', m).onclick = function () { closeModal(); resolve(null); };
      function submit() {
        const p1 = $('#pw1', m).value;
        if (!p1) return err('Enter a password.');
        if (confirm && p1 !== $('#pw2', m).value) return err('Passwords do not match.');
        closeModal();
        resolve(p1);
      }
      function err(msg) {
        const e = $('#pw-err', m);
        e.style.display = 'block';
        e.textContent = msg;
      }
      $('#pw-ok', m).onclick = submit;
      m.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    });
  }

  function openLinkModal(sourceId, onDone) {
    const r = state.report;
    const primary = state.sources.find(function (s) { return s.id === r.primarySourceId; });
    const foreign = state.sources.find(function (s) { return s.id === sourceId; });
    if (!primary || !foreign) return;
    const sameName = foreign.fields.find(function (f) {
      return primary.fields.some(function (p) { return p.name.toLowerCase() === f.name.toLowerCase(); });
    });
    const m = openModal(
      '<h3>Link “' + esc(foreign.name) + '” to “' + esc(primary.name) + '”</h3>' +
      '<p class="sub">Pick the matching key on each side — like a VLOOKUP. Rows from “' + esc(foreign.name) +
      '” are matched to each row of “' + esc(primary.name) + '” by this key.</p>' +
      '<label class="rb-field-label">Key in ' + esc(primary.name) + ' (base file)</label>' +
      '<select class="rb-select" id="lk-local">' + primary.fields.map(function (f) {
        return '<option value="' + esc(f.name) + '"' + (sameName && f.name.toLowerCase() === sameName.name.toLowerCase() ? ' selected' : '') + '>' + esc(f.name) + '</option>';
      }).join('') + '</select>' +
      '<label class="rb-field-label">Matching key in ' + esc(foreign.name) + '</label>' +
      '<select class="rb-select" id="lk-foreign">' + foreign.fields.map(function (f) {
        return '<option value="' + esc(f.name) + '"' + (sameName && f.name === sameName.name ? ' selected' : '') + '>' + esc(f.name) + '</option>';
      }).join('') + '</select>' +
      '<div class="acts"><button class="rb-btn ghost" id="lk-cancel">Cancel</button>' +
      '<button class="rb-btn primary" id="lk-ok">Link files</button></div>'
    );
    $('#lk-cancel', m).onclick = closeModal;
    $('#lk-ok', m).onclick = function () {
      state.report.links.push({
        sourceId: sourceId,
        localKey: $('#lk-local', m).value,
        foreignKey: $('#lk-foreign', m).value
      });
      closeModal();
      touch();
      if (onDone) onDone();
    };
  }

  function openColumnModal(colId) {
    if (!requireEditable()) return;
    const r = state.report;
    const col = r.columns.find(function (c) { return c.id === colId; });
    if (!col) return;
    const isFormula = col.kind === 'formula';
    const aggOptions = [['first', 'First value'], ['last', 'Last value'], ['sum', 'Sum'], ['avg', 'Average'], ['min', 'Min'], ['max', 'Max'], ['count', 'Count'], ['countd', 'Count distinct'], ['join', 'Join unique (a, b, c)']];
    const m = openModal(
      '<h3>Column settings</h3>' +
      '<p class="sub">' + (isFormula ? 'Formula column' : esc(col.sourceId) + ' → ' + esc(col.field)) + '</p>' +
      '<label class="rb-field-label">Column heading</label>' +
      '<input class="rb-input" id="cc-label" value="' + esc(col.label) + '" />' +
      (isFormula
        ? '<label class="rb-field-label">Formula</label><textarea class="rb-input" id="cc-expr">' + esc(col.expr || '') + '</textarea>' +
          '<div class="rb-live-test" id="cc-test"></div>' + fieldPillsHtml('cc-expr') + fnHelpHtml()
        : '') +
      '<label class="rb-field-label">Format</label>' +
      '<select class="rb-select" id="cc-format">' +
      [['auto', 'Auto'], ['text', 'Text'], ['number', 'Number'], ['currency', 'Currency (₹)'], ['percent', 'Percent'], ['date', 'Date']].map(function (o) {
        return '<option value="' + o[0] + '"' + (col.format === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<label class="rb-field-label">Decimal places (number / currency / percent)</label>' +
      '<select class="rb-select" id="cc-dec">' + [0, 1, 2, 3, 4].map(function (d) {
        return '<option value="' + d + '"' + (col.decimals === d ? ' selected' : '') + '>' + d + '</option>';
      }).join('') + '</select>' +
      '<label class="rb-field-label">Alignment</label>' +
      '<select class="rb-select" id="cc-align">' + [['left', 'Left'], ['right', 'Right'], ['center', 'Center']].map(function (o) {
        return '<option value="' + o[0] + '"' + (col.align === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<label class="rb-field-label">When grouping, combine rows with</label>' +
      '<select class="rb-select" id="cc-agg">' + aggOptions.map(function (o) {
        return '<option value="' + o[0] + '"' + ((col.agg || 'first') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>' +
      '<label class="rb-field-label">Fixed width in characters — used by PRN / fixed-width export (0 = auto)</label>' +
      '<input class="rb-input" id="cc-width" type="number" min="0" max="80" value="' + (col.width || 0) + '" />' +
      '<label class="rb-field-label" style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0">' +
      '<input type="checkbox" id="cc-total"' + (col.total ? ' checked' : '') + ' style="width:auto" /> Include in totals row</label>' +
      '<div class="acts"><button class="rb-btn ghost" id="cc-cancel">Cancel</button>' +
      '<button class="rb-btn primary" id="cc-save">Save</button></div>',
      isFormula
    );
    if (isFormula) wireFormulaTester(m, '#cc-expr', '#cc-test');
    $('#cc-cancel', m).onclick = closeModal;
    $('#cc-save', m).onclick = function () {
      col.label = $('#cc-label', m).value.trim() || col.label;
      if (isFormula) col.expr = $('#cc-expr', m).value;
      col.format = $('#cc-format', m).value;
      col.decimals = Number($('#cc-dec', m).value);
      col.align = $('#cc-align', m).value;
      col.agg = $('#cc-agg', m).value;
      col.width = Math.max(0, Number($('#cc-width', m).value) || 0);
      col.total = $('#cc-total', m).checked;
      closeModal();
      touch();
      renderBuild();
    };
  }

  function fieldPillsHtml(targetId) {
    let html = '<div class="rb-inline-note">Click to insert a field:</div><div class="rb-pills">';
    state.sources.forEach(function (s) {
      s.fields.forEach(function (f) {
        const ref = s.id === state.report.primarySourceId ? '[' + f.name + ']' : '[' + s.name + '!' + f.name + ']';
        html += '<button class="rb-pill" data-insert="' + esc(ref) + '" data-target="' + esc(targetId) + '">' + esc(ref) + '</button>';
      });
    });
    return html + '</div>';
  }

  function fnHelpHtml() {
    return '<details class="rb-fn-help"><summary>Formula reference — functions &amp; operators</summary>' +
      E.FUNCTION_HELP.map(function (h) {
        return '<div class="fnrow"><code>' + esc(h.sig) + '</code><span>' + esc(h.desc) + '</span></div>';
      }).join('') + '</details>';
  }

  function wireFormulaTester(m, exprSel, testSel) {
    const ta = $(exprSel, m);
    const out = $(testSel, m);
    function test() {
      const expr = ta.value.trim();
      if (!expr) { out.className = 'rb-live-test'; out.textContent = 'Result preview appears here as you type.'; return; }
      try {
        const probe = {
          primarySourceId: state.report.primarySourceId,
          links: state.report.links,
          columns: [{ id: 'probe', kind: 'formula', expr: expr, label: 'probe' }],
          filters: [], sort: [], groupBy: null, options: {}
        };
        const res = E.runReport(state.sources, probe, { limit: 1 });
        if (res.errors.length) throw new Error(res.errors[0].replace(/^Column "probe": /, ''));
        const v = res.rows.length ? res.rows[0][0] : '(no rows)';
        out.className = 'rb-live-test ok';
        out.textContent = 'Row 1 → ' + (v === '' ? '(blank)' : E.toStr(v));
      } catch (e) {
        out.className = 'rb-live-test err';
        out.textContent = e.message;
      }
    }
    ta.addEventListener('input', test);
    m.addEventListener('click', function (e) {
      const pill = e.target.closest('[data-insert]');
      if (!pill) return;
      const target = $('#' + pill.getAttribute('data-target'), m);
      if (!target) return;
      const start = target.selectionStart || target.value.length;
      target.value = target.value.slice(0, start) + pill.getAttribute('data-insert') + target.value.slice(target.selectionEnd || start);
      target.focus();
      target.dispatchEvent(new Event('input'));
    });
    test();
  }

  function openFormulaModal() {
    if (!requireEditable()) return;
    if (!state.sources.length) { toast('Add files first.', true); return; }
    if (!state.report.primarySourceId) state.report.primarySourceId = state.sources[0].id;
    const m = openModal(
      '<h3>New formula column</h3>' +
      '<p class="sub">Reference fields in [brackets], e.g. <code class="k">[Qty] * [Unit price]</code> or ' +
      '<code class="k">LOOKUP([Customer], "Customers", "Code", "Name")</code></p>' +
      '<label class="rb-field-label">Column heading</label>' +
      '<input class="rb-input" id="fm-label" value="New column" />' +
      '<label class="rb-field-label">Formula</label>' +
      '<textarea class="rb-input" id="fm-expr" placeholder="[Qty] * [Unit price]"></textarea>' +
      '<div class="rb-live-test" id="fm-test"></div>' +
      fieldPillsHtml('fm-expr') + fnHelpHtml() +
      '<div class="acts"><button class="rb-btn ghost" id="fm-cancel">Cancel</button>' +
      '<button class="rb-btn primary" id="fm-add">Add column</button></div>',
      true
    );
    wireFormulaTester(m, '#fm-expr', '#fm-test');
    $('#fm-cancel', m).onclick = closeModal;
    $('#fm-add', m).onclick = function () {
      const expr = $('#fm-expr', m).value.trim();
      if (!expr) { toast('Write a formula first.', true); return; }
      try { E.parse(expr); }
      catch (e) { toast('Formula error: ' + e.message, true); return; }
      state.report.columns.push({
        id: uid(), kind: 'formula', expr: expr,
        label: $('#fm-label', m).value.trim() || 'New column',
        format: 'auto', decimals: 2, align: 'right', agg: 'sum', total: false, width: 0
      });
      closeModal();
      touch();
      renderBuild();
    };
  }

  /* ══════════════ templates (saved reports) ══════════════ */

  function reportToDef(r) {
    return JSON.parse(JSON.stringify({
      primarySourceName: r.primarySourceId,
      links: r.links.map(function (l) { return { sourceName: l.sourceId, localKey: l.localKey, foreignKey: l.foreignKey }; }),
      columns: r.columns.map(function (c) {
        const o = Object.assign({}, c);
        if (c.kind === 'field') { o.sourceName = c.sourceId; delete o.sourceId; }
        return o;
      }),
      filters: r.filters, sort: r.sort, groupBy: r.groupBy, options: r.options
    }));
  }

  function defToReport(def, name) {
    const r = newReport();
    r.name = name;
    r.primarySourceId = def.primarySourceName || null;
    r.links = (def.links || []).map(function (l) { return { sourceId: l.sourceName, localKey: l.localKey, foreignKey: l.foreignKey }; });
    r.columns = (def.columns || []).map(function (c) {
      const o = Object.assign({}, c);
      if (c.kind === 'field') { o.sourceId = c.sourceName; delete o.sourceName; }
      return o;
    });
    r.filters = def.filters || [];
    r.sort = def.sort || [];
    r.groupBy = def.groupBy || null;
    r.options = def.options || { totalsRow: false, title: '' };
    return r;
  }

  function templateSourceNames(tpl) {
    const names = new Set();
    if (tpl.def.primarySourceName) names.add(tpl.def.primarySourceName);
    (tpl.def.links || []).forEach(function (l) { names.add(l.sourceName); });
    (tpl.def.columns || []).forEach(function (c) { if (c.sourceName) names.add(c.sourceName); });
    return Array.from(names);
  }

  function saveCurrentTemplate() {
    const r = state.report;
    if (!r.columns.length) { toast('Nothing to save yet — add some columns.', true); return; }
    const existing = state.templates.find(function (t) { return t.id === state.activeTemplateId; });
    if (existing && existing.lock && !state.editable) { toast('Unlock this report before saving over it.', true); return; }
    const m = openModal(
      '<h3>Save report settings</h3>' +
      '<p class="sub">Only the report design is saved (columns, formulas, filters, links). ' +
      'Your file data is never stored — re-open the same files to run it again.</p>' +
      '<label class="rb-field-label">Report name</label>' +
      '<input class="rb-input" id="sv-name" value="' + esc(r.name === 'Untitled report' && existing ? existing.name : r.name) + '" />' +
      (existing ? '<label class="rb-field-label" style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0">' +
        '<input type="checkbox" id="sv-over" checked style="width:auto" /> Overwrite “' + esc(existing.name) + '”</label>' : '') +
      '<div class="acts"><button class="rb-btn ghost" id="sv-cancel">Cancel</button>' +
      '<button class="rb-btn primary" id="sv-ok">Save</button></div>'
    );
    $('#sv-cancel', m).onclick = closeModal;
    $('#sv-ok', m).onclick = function () {
      const name = $('#sv-name', m).value.trim() || 'Untitled report';
      const over = existing && $('#sv-over', m) && $('#sv-over', m).checked;
      r.name = name;
      if (over) {
        existing.name = name;
        existing.def = reportToDef(r);
        existing.updatedAt = Date.now();
      } else {
        const tpl = { id: uid(), name: name, createdAt: Date.now(), updatedAt: Date.now(), lock: null, def: reportToDef(r) };
        state.templates.push(tpl);
        state.activeTemplateId = tpl.id;
        state.editable = true;
      }
      saveTemplates();
      saveDraft();
      closeModal();
      render();
      toast('Report “' + name + '” saved on this device.');
    };
  }

  function loadTemplate(tplId) {
    const tpl = state.templates.find(function (t) { return t.id === tplId; });
    if (!tpl) return;
    const missing = templateSourceNames(tpl).filter(function (n) {
      return !state.sources.some(function (s) { return s.name.toLowerCase() === String(n).toLowerCase(); });
    });
    state.report = defToReport(tpl.def, tpl.name);
    state.activeTemplateId = tpl.id;
    state.editable = !tpl.lock;
    state.tab = 'build';
    saveDraft();
    render();
    if (missing.length) {
      toast('Load these files to run this report: ' + missing.join(', '), true);
    } else {
      toast('Report “' + tpl.name + '” loaded.' + (tpl.lock ? ' It is locked — export works, editing needs the password.' : ''));
    }
  }

  function lockTemplate(tplId) {
    const tpl = state.templates.find(function (t) { return t.id === tplId; });
    if (!tpl) return;
    if (tpl.lock) {
      promptPassword('Remove lock', 'Enter the password for “' + tpl.name + '” to remove its lock.').then(function (pw) {
        if (pw === null) return;
        hashPassword(pw, tpl.lock.salt).then(function (h) {
          if (h !== tpl.lock.hash) { toast('Wrong password.', true); return; }
          tpl.lock = null;
          if (state.activeTemplateId === tplId) state.editable = true;
          saveTemplates(); saveDraft(); render();
          toast('Lock removed from “' + tpl.name + '”.');
        });
      });
    } else {
      promptPassword('Lock “' + tpl.name + '”',
        'Anyone on this device can still run and export the report, but changing or deleting it will need this password. (Settings live in this browser — the lock deters edits, it is not encryption.)',
        true).then(function (pw) {
        if (pw === null) return;
        const salt = randomSalt();
        hashPassword(pw, salt).then(function (h) {
          tpl.lock = { salt: salt, hash: h, iter: PBKDF2_ITER };
          if (state.activeTemplateId === tplId) state.editable = false;
          saveTemplates(); saveDraft(); render();
          toast('“' + tpl.name + '” is now locked.');
        });
      });
    }
  }

  function unlockForEditing() {
    const tpl = state.templates.find(function (t) { return t.id === state.activeTemplateId; });
    if (!tpl || !tpl.lock) { state.editable = true; render(); return; }
    promptPassword('Unlock report', 'Enter the password for “' + tpl.name + '” to edit it in this session.').then(function (pw) {
      if (pw === null) return;
      hashPassword(pw, tpl.lock.salt).then(function (h) {
        if (h !== tpl.lock.hash) { toast('Wrong password.', true); return; }
        state.editable = true;
        saveDraft(); render();
        toast('Unlocked for this session.');
      });
    });
  }

  function deleteTemplate(tplId) {
    const tpl = state.templates.find(function (t) { return t.id === tplId; });
    if (!tpl) return;
    function doDelete() {
      state.templates = state.templates.filter(function (t) { return t.id !== tplId; });
      if (state.activeTemplateId === tplId) { state.activeTemplateId = null; state.editable = true; }
      saveTemplates(); saveDraft(); render();
      toast('Deleted “' + tpl.name + '”.');
    }
    if (tpl.lock) {
      promptPassword('Delete locked report', 'Enter the password for “' + tpl.name + '” to delete it.').then(function (pw) {
        if (pw === null) return;
        hashPassword(pw, tpl.lock.salt).then(function (h) {
          if (h !== tpl.lock.hash) { toast('Wrong password.', true); return; }
          doDelete();
        });
      });
    } else if (window.confirm('Delete report “' + tpl.name + '”? This cannot be undone.')) {
      doDelete();
    }
  }

  function exportTemplate(tplId) {
    const tpl = state.templates.find(function (t) { return t.id === tplId; });
    if (!tpl) return;
    const blob = new Blob([JSON.stringify({ reportStudio: 1, template: tpl }, null, 2)], { type: 'application/json' });
    downloadBlob(blob, slug(tpl.name) + '.report.json');
    toast('Report settings exported (no data inside).');
  }

  function importTemplateFile(file) {
    file.text().then(function (text) {
      const data = JSON.parse(text);
      const tpl = data && (data.reportStudio || data.grihaReport) ? data.template : null;
      if (!tpl || !tpl.def) throw new Error('not a Report Studio settings file');
      tpl.id = uid();
      tpl.name = tpl.name || 'Imported report';
      const names = state.templates.map(function (t) { return t.name; });
      let name = tpl.name, n = 2;
      while (names.indexOf(name) >= 0) { name = tpl.name + ' (' + n + ')'; n++; }
      tpl.name = name;
      state.templates.push(tpl);
      saveTemplates(); render();
      toast('Imported “' + tpl.name + '”.');
    }).catch(function (e) {
      toast('Import failed: ' + e.message, true);
    });
  }

  /* ══════════════ export formats ══════════════ */

  const FORMATS = [
    { id: 'xlsx', name: 'Excel (.xlsx)', desc: 'Standard workbook, real numbers & dates', lockable: true },
    { id: 'csv', name: 'CSV (.csv)', desc: 'Comma separated, pick a delimiter', lockable: false },
    { id: 'tsv', name: 'TSV (.tsv)', desc: 'Tab separated values', lockable: false },
    { id: 'pdf', name: 'PDF (.pdf)', desc: 'Print-ready table document', lockable: true },
    { id: 'prn', name: 'PRN fixed width (.prn)', desc: 'Space-padded columns for legacy systems', lockable: false },
    { id: 'txt', name: 'Text (.txt)', desc: 'Plain tab-delimited text', lockable: false },
    { id: 'html', name: 'HTML (.html)', desc: 'Self-contained web page table', lockable: false },
    { id: 'json', name: 'JSON (.json)', desc: 'Array of records for developers', lockable: false },
    { id: 'xml', name: 'XML (.xml)', desc: 'Row/field markup for integrations', lockable: false },
    { id: 'md', name: 'Markdown (.md)', desc: 'Pipe table for docs and wikis', lockable: false }
  ];

  function slug(s) {
    return String(s || 'report').trim().replace(/[^\w\d-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'report';
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 800);
  }

  function exportRows() {
    const res = runFull();
    if (res.errors.length) toast('Note: some formulas failed — check the Build tab.', true);
    if (!res.columns.length || !res.rows.length) {
      toast('Nothing to export — build a report with at least one column and one row.', true);
      return null;
    }
    return res;
  }

  function formattedMatrix(res) {
    const head = res.columns.map(function (c) { return c.label; });
    const body = res.rows.map(function (r) {
      return r.map(function (v, i) { return E.formatValue(v, res.columns[i]); });
    });
    if (res.totals) {
      body.push(res.totals.map(function (v, i) {
        return typeof v === 'number' ? E.formatValue(v, res.columns[i]) : E.toStr(v);
      }));
    }
    return { head: head, body: body };
  }

  function rawMatrix(res) {
    const head = res.columns.map(function (c) { return c.label; });
    const rows = res.rows.map(function (r) {
      return r.map(function (v) { return v instanceof Date ? v : (v === null || v === undefined ? '' : v); });
    });
    if (res.totals) rows.push(res.totals.slice());
    return [head].concat(rows);
  }

  function doExport() {
    const fmt = state.exportFormat;
    const res = exportRows();
    if (!res) return;
    const fname = ($('#ex-name') ? $('#ex-name').value.trim() : '') || slug(state.report.name) + '-' + new Date().toISOString().slice(0, 10);
    const pw = $('#ex-pass') ? $('#ex-pass').value : '';
    const fdef = FORMATS.find(function (f) { return f.id === fmt; });
    if (pw && (!fdef || !fdef.lockable)) {
      toast('Password protection is available for Excel and PDF only.', true);
      return;
    }
    try {
      if (fmt === 'xlsx') return exportXlsx(res, fname, pw);
      if (fmt === 'csv') return exportDelimited(res, fname + '.csv', $('#ex-delim') ? $('#ex-delim').value : ',', 'text/csv');
      if (fmt === 'tsv') return exportDelimited(res, fname + '.tsv', '\t', 'text/tab-separated-values');
      if (fmt === 'txt') return exportText(res, fname + '.txt', '\t');
      if (fmt === 'prn') return exportPrn(res, fname + '.prn');
      if (fmt === 'pdf') return exportPdf(res, fname, pw);
      if (fmt === 'html') return exportHtml(res, fname + '.html');
      if (fmt === 'json') return exportJson(res, fname + '.json');
      if (fmt === 'xml') return exportXml(res, fname + '.xml');
      if (fmt === 'md') return exportMarkdown(res, fname + '.md');
    } catch (e) {
      console.error(e);
      toast('Export failed: ' + e.message, true);
    }
  }

  function exportXlsx(res, fname, pw) {
    const aoa = rawMatrix(res);
    if (!pw) {
      const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
      ws['!cols'] = res.columns.map(function (c, i) {
        let w = String(c.label).length;
        res.rows.slice(0, 200).forEach(function (r) { w = Math.max(w, E.formatValue(r[i], c).length); });
        return { wch: Math.min(50, w + 2) };
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, (state.report.name || 'Report').slice(0, 31).replace(/[\\/?*[\]:]/g, ' ') || 'Report');
      XLSX.writeFile(wb, fname + '.xlsx');
      toast('Excel file downloaded.');
      return;
    }
    if (!window.XlsxPopulate) { toast('Encrypted Excel engine not loaded.', true); return; }
    XlsxPopulate.fromBlankAsync().then(function (wb) {
      const sheet = wb.sheet(0);
      const safe = aoa.map(function (row) {
        return row.map(function (v) {
          if (v instanceof Date) return v;
          if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v;
          return E.toStr(v);
        });
      });
      sheet.cell('A1').value(safe);
      sheet.row(1).style('bold', true);
      return wb.outputAsync({ password: pw });
    }).then(function (blob) {
      downloadBlob(blob, fname + '.xlsx');
      toast('Password-protected Excel downloaded — it will ask for the password on open.');
    }).catch(function (e) {
      console.error(e);
      toast('Encrypted export failed: ' + e.message, true);
    });
  }

  function csvCell(v, delim) {
    let s = v instanceof Date ? v.toISOString().slice(0, 10) : E.toStr(v);
    if (s.indexOf('"') >= 0 || s.indexOf(delim) >= 0 || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function exportDelimited(res, filename, delim, mime) {
    const aoa = rawMatrix(res);
    const text = aoa.map(function (row) {
      return row.map(function (v) { return csvCell(v, delim); }).join(delim);
    }).join('\r\n');
    downloadBlob(new Blob(['﻿' + text], { type: mime + ';charset=utf-8' }), filename);
    toast(filename + ' downloaded.');
  }

  function exportText(res, filename, delim) {
    const m = formattedMatrix(res);
    const text = [m.head.join(delim)].concat(m.body.map(function (r) { return r.join(delim); })).join('\r\n');
    downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
    toast(filename + ' downloaded.');
  }

  function exportPrn(res, filename) {
    const m = formattedMatrix(res);
    const widths = res.columns.map(function (c, i) {
      if (c.width && c.width > 0) return c.width;
      let w = String(m.head[i]).length;
      m.body.forEach(function (r) { w = Math.max(w, String(r[i]).length); });
      return Math.min(60, w) + 2;
    });
    function pad(s, i) {
      s = String(s);
      const w = widths[i];
      if (s.length > w - 1) s = s.slice(0, w - 1);
      const numeric = res.columns[i].align === 'right' || ['number', 'currency', 'percent'].indexOf(res.columns[i].format) >= 0;
      return numeric ? s.padStart(w - 1) + ' ' : s.padEnd(w);
    }
    const lines = [m.head.map(pad).join('')].concat(
      m.body.map(function (r) { return r.map(pad).join(''); })
    );
    downloadBlob(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/plain;charset=utf-8' }), filename);
    toast(filename + ' downloaded (fixed-width columns).');
  }

  function exportPdf(res, fname, pw) {
    const jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) { toast('PDF engine not loaded.', true); return; }
    const m = formattedMatrix(res);
    const landscape = m.head.length > 6;
    const opts = { orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' };
    if (pw) opts.encryption = { userPassword: pw, ownerPassword: pw, userPermissions: ['print'] };
    const doc = new jsPDF(opts);
    const title = state.report.options.title || state.report.name || 'Report';
    doc.setFontSize(15);
    doc.text(title, 40, 42);
    doc.setFontSize(8.5);
    doc.setTextColor(120);
    doc.text('Generated ' + new Date().toLocaleString() + ' · Report Studio · processed on-device', 40, 58);
    const colStyles = {};
    res.columns.forEach(function (c, i) {
      if (c.align === 'right' || ['number', 'currency', 'percent'].indexOf(c.format) >= 0) colStyles[i] = { halign: 'right' };
    });
    doc.autoTable({
      head: [m.head],
      body: m.body,
      startY: 72,
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [24, 24, 24], textColor: [244, 182, 63], fontStyle: 'bold' },
      columnStyles: colStyles,
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.getHeight() - 14);
      }
    });
    doc.save(fname + '.pdf');
    toast(pw ? 'Password-protected PDF downloaded.' : 'PDF downloaded.');
  }

  function exportHtml(res, filename) {
    const m = formattedMatrix(res);
    const title = esc(state.report.options.title || state.report.name || 'Report');
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + title + '</title><style>' +
      'body{font-family:system-ui,sans-serif;margin:32px;color:#111}h1{font-size:20px}' +
      'table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}' +
      'th{background:#f3f3f3}tr:nth-child(even) td{background:#fafafa}td.num{text-align:right;font-variant-numeric:tabular-nums}' +
      '</style></head><body><h1>' + title + '</h1><p style="color:#777;font-size:12px">Generated ' +
      esc(new Date().toLocaleString()) + ' · Report Studio</p><table><thead><tr>' +
      m.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      m.body.map(function (r) {
        return '<tr>' + r.map(function (v, i) {
          const numeric = ['number', 'currency', 'percent'].indexOf(res.columns[i].format) >= 0 || res.columns[i].align === 'right';
          return '<td' + (numeric ? ' class="num"' : '') + '>' + esc(v) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></body></html>';
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), filename);
    toast(filename + ' downloaded.');
  }

  function exportJson(res, filename) {
    const out = res.rows.map(function (r) {
      const o = {};
      res.columns.forEach(function (c, i) {
        o[c.label] = r[i] instanceof Date ? r[i].toISOString().slice(0, 10) : r[i];
      });
      return o;
    });
    downloadBlob(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), filename);
    toast(filename + ' downloaded.');
  }

  function exportXml(res, filename) {
    function tag(s) {
      const t = String(s).replace(/[^\w\d]+/g, '_').replace(/^(\d)/, '_$1');
      return t || 'field';
    }
    const rowsXml = res.rows.map(function (r) {
      return '  <row>\n' + res.columns.map(function (c, i) {
        const v = r[i] instanceof Date ? r[i].toISOString().slice(0, 10) : E.toStr(r[i]);
        return '    <' + tag(c.label) + '>' + esc(v) + '</' + tag(c.label) + '>';
      }).join('\n') + '\n  </row>';
    }).join('\n');
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<report name="' + esc(state.report.name) + '">\n' + rowsXml + '\n</report>\n';
    downloadBlob(new Blob([xml], { type: 'application/xml' }), filename);
    toast(filename + ' downloaded.');
  }

  function exportMarkdown(res, filename) {
    const m = formattedMatrix(res);
    function mdCell(v) { return String(v).replace(/\|/g, '\\|').replace(/\n/g, ' '); }
    const lines = [
      '| ' + m.head.map(mdCell).join(' | ') + ' |',
      '| ' + m.head.map(function (_, i) {
        const numeric = ['number', 'currency', 'percent'].indexOf(res.columns[i].format) >= 0;
        return numeric ? '---:' : '---';
      }).join(' | ') + ' |'
    ].concat(m.body.map(function (r) { return '| ' + r.map(mdCell).join(' | ') + ' |'; }));
    downloadBlob(new Blob([lines.join('\n') + '\n'], { type: 'text/markdown;charset=utf-8' }), filename);
    toast(filename + ' downloaded.');
  }

  /* ══════════════ rendering ══════════════ */

  function render() {
    const root = $('#rb-root');
    root.innerHTML =
      '<div class="rb-app">' +
      '<header class="rb-top">' +
      '<h1>Report <span>Studio</span></h1>' +
      '<span class="rb-privacy">🔒 100% on-device · no upload · no data stored</span>' +
      '<nav class="rb-tabs">' +
      tabBtn('files', '1', 'Files') + tabBtn('build', '2', 'Build') +
      tabBtn('export', '3', 'Export') + tabBtn('saved', '4', 'Saved reports') +
      '</nav></header>' +
      '<main id="rb-main"></main>' +
      '</div><div id="rb-toast"></div>';
    $$('.rb-tab', root).forEach(function (b) {
      b.onclick = function () { state.tab = b.getAttribute('data-tab'); render(); };
    });
    const main = $('#rb-main');
    if (state.tab === 'files') renderFiles(main);
    else if (state.tab === 'build') { renderBuildShell(main); renderBuild(); }
    else if (state.tab === 'export') renderExport(main);
    else renderSaved(main);
  }

  function tabBtn(id, n, label) {
    return '<button class="rb-tab' + (state.tab === id ? ' active' : '') + '" data-tab="' + id + '"><span class="n">' + n + '</span>' + label + '</button>';
  }

  /* ── Files tab ── */

  function renderFiles(main) {
    main.innerHTML =
      '<div class="rb-drop" id="rb-drop">' +
      '<h2>Drop your files here</h2>' +
      '<p>or click to browse. Load as many files as you need — they are read into memory only,<br/>never uploaded anywhere, and vanish when you close this tab.</p>' +
      '<div class="formats">' + ['xlsx', 'xls', 'csv', 'tsv', 'txt', 'pdf', 'json', 'ods'].map(function (f) {
        return '<span class="rb-chip">.' + f + '</span>';
      }).join('') + '</div>' +
      '<input type="file" id="rb-file-input" multiple style="display:none" accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt,.prn,.pdf,.json,.ods" />' +
      '</div>' +
      '<div class="rb-row" style="justify-content:center;margin-top:14px">' +
      '<button class="rb-btn ghost sm" id="rb-demo">Try with demo data</button>' +
      (state.sources.length ? '<button class="rb-btn ghost sm danger" id="rb-clear">Remove all files from memory</button>' : '') +
      '</div>' +
      '<div class="rb-files" id="rb-file-cards"></div>' +
      '<p class="rb-inline-note" style="text-align:center;max-width:640px;margin:26px auto 0">' +
      'Privacy by design: this page runs entirely in your browser. File contents stay in memory on this machine and are gone when the tab closes. ' +
      'Only report <em>designs</em> (column layouts, formulas — never data) can be saved, and those stay in this browser. ' +
      'No servers, no processing of data off-device, so there is nothing to attract DPA/GDPR obligations for the data you load.</p>';

    const drop = $('#rb-drop', main);
    const input = $('#rb-file-input', main);
    drop.onclick = function () { input.click(); };
    input.onchange = function () { handleFiles(input.files); input.value = ''; };
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('drag'); });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    });
    $('#rb-demo', main).onclick = loadDemo;
    const clearBtn = $('#rb-clear', main);
    if (clearBtn) clearBtn.onclick = function () {
      if (window.confirm('Remove all loaded files from memory?')) { state.sources = []; render(); }
    };

    const cards = $('#rb-file-cards', main);
    cards.innerHTML = state.sources.map(function (s) {
      const icon = { pdf: '📄', json: '🧾', demo: '✨' }[s.kind] || '📊';
      return '<div class="rb-file-card">' +
        '<div class="fh"><span class="ficon">' + icon + '</span><div>' +
        '<div class="fname">' + esc(s.name) + '</div>' +
        '<div class="fmeta">' + esc(s.fileName) + ' · ' + s.rows.length.toLocaleString() + ' rows · ' + s.fields.length + ' fields</div>' +
        '</div><button class="fx" data-remove="' + esc(s.id) + '" title="Remove">✕</button></div>' +
        (s.note ? '<div class="rb-warn">' + esc(s.note) + '</div>' : '') +
        '<div class="rb-file-fields">' + s.fields.map(function (f) {
          return '<span class="rb-chip ' + f.type + '">' + esc(f.name) + '</span>';
        }).join('') + '</div></div>';
    }).join('');
    $$('[data-remove]', cards).forEach(function (b) {
      b.onclick = function () {
        const id = b.getAttribute('data-remove');
        state.sources = state.sources.filter(function (s) { return s.id !== id; });
        render();
      };
    });
  }

  /* ── Build tab ── */

  function renderBuildShell(main) {
    if (!state.sources.length) {
      main.innerHTML = '<div class="rb-empty-state"><h2>No files loaded yet</h2>' +
        '<p>Go to the <b>Files</b> tab and add the spreadsheets, CSVs or PDFs you want to combine.</p>' +
        '<button class="rb-btn primary" style="margin-top:16px" id="rb-goto-files">Add files</button></div>';
      $('#rb-goto-files', main).onclick = function () { state.tab = 'files'; render(); };
      return;
    }
    main.innerHTML =
      '<div class="rb-build">' +
      '<aside class="rb-palette" id="rb-palette"></aside>' +
      '<section id="rb-canvas-col"></section>' +
      '</div>';
  }

  function renderBuild() {
    if (state.tab !== 'build' || !state.sources.length) return;
    renderPalette();
    renderCanvas();
    renderPreview();
  }

  function renderPalette() {
    const host = $('#rb-palette');
    if (!host) return;
    const r = state.report;
    host.innerHTML = '<h3>Available fields</h3><p class="rb-hint">Drag a field into the canvas — or click it to add.</p>' +
      state.sources.map(function (s) {
        const isPrimary = s.id === r.primarySourceId;
        const linked = r.links.some(function (l) { return l.sourceId === s.id; });
        return '<div class="src-group"><div class="src-name">' + esc(s.name) +
          (isPrimary ? '<span class="badge">base file</span>' : (linked ? '<span class="badge" style="background:#93c5fd">linked</span>' : '')) +
          '</div>' +
          s.fields.map(function (f) {
            const t = f.type === 'number' ? '123' : (f.type === 'date' ? 'date' : 'abc');
            return '<button class="rb-field-chip" draggable="true" data-src="' + esc(s.id) + '" data-field="' + esc(f.name) + '">' +
              '<span class="plus">＋</span>' + esc(f.name) + '<span class="t">' + t + '</span></button>';
          }).join('') + '</div>';
      }).join('');
    $$('.rb-field-chip', host).forEach(function (chip) {
      chip.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/rb-field', JSON.stringify({ s: chip.getAttribute('data-src'), f: chip.getAttribute('data-field') }));
        e.dataTransfer.effectAllowed = 'copy';
      });
      chip.addEventListener('click', function () {
        addColumnFromField(chip.getAttribute('data-src'), chip.getAttribute('data-field'));
      });
    });
  }

  function renderCanvas() {
    const host = $('#rb-canvas-col');
    if (!host) return;
    const r = state.report;
    const primary = state.sources.find(function (s) { return s.id === r.primarySourceId; });
    const lockedTpl = state.templates.find(function (t) { return t.id === state.activeTemplateId && t.lock; });

    host.innerHTML =
      (!state.editable && lockedTpl
        ? '<div class="rb-card" style="border-color:rgba(244,182,63,.4)"><div class="rb-section-head">' +
          '<h2>🔒 “' + esc(lockedTpl.name) + '” is locked</h2><div class="spacer"></div>' +
          '<button class="rb-btn sm" id="rb-unlock">Unlock to edit</button></div>' +
          '<p class="rb-hint">You can preview and export it, but changing the design needs the password.</p></div>'
        : '') +
      '<div class="rb-card"><div class="rb-section-head">' +
      '<h2>Report canvas</h2>' +
      '<span class="rb-count">' + (primary ? 'Base file: ' + esc(primary.name) + ' (' + primary.rows.length.toLocaleString() + ' rows)' : 'Drop the first field to pick the base file') + '</span>' +
      '<div class="spacer"></div>' +
      '<input class="rb-input" id="rb-report-name" style="width:200px" value="' + esc(r.name) + '"' + (state.editable ? '' : ' disabled') + ' />' +
      '<button class="rb-btn sm" id="rb-add-formula"' + (state.editable ? '' : ' disabled') + '>ƒx Formula column</button>' +
      '<button class="rb-btn sm primary" id="rb-save-tpl">Save report</button>' +
      '</div>' +
      '<div class="rb-canvas-zone" id="rb-canvas">' +
      (r.columns.length ? '' : '<div class="empty">Drag fields here from the left to build your report columns.<br/>Fields from different files are joined automatically once you link them by a key.</div>') +
      '</div></div>' +
      '<div class="rb-card"><div class="rb-section-head"><h2>Shaping</h2><div class="spacer"></div>' +
      '<label style="display:flex;align-items:center;gap:7px;font-size:.8rem;color:var(--muted)">' +
      '<input type="checkbox" id="rb-totals"' + (r.options.totalsRow ? ' checked' : '') + (state.editable ? '' : ' disabled') + ' /> Totals row</label></div>' +
      '<div class="rb-row"><span class="rb-field-label" style="margin:0;min-width:70px">Group by</span>' +
      '<select class="rb-select" id="rb-groupby"' + (state.editable ? '' : ' disabled') + '>' +
      '<option value="">— no grouping (one row per source row) —</option>' +
      r.columns.map(function (c) {
        return '<option value="' + c.id + '"' + (r.groupBy === c.id ? ' selected' : '') + '>' + esc(c.label) + '</option>';
      }).join('') + '</select></div>' +
      (r.groupBy ? '<p class="rb-inline-note">Rows sharing the same value are combined. Set how each other column combines (sum, average, count…) in its ⚙ settings.</p>' : '') +
      '<div id="rb-filters"></div><div id="rb-sorts"></div>' +
      '</div>' +
      '<div class="rb-card"><div class="rb-section-head"><h2>Live preview</h2>' +
      '<span class="rb-count" id="rb-preview-count"></span></div>' +
      '<div id="rb-preview"></div></div>';

    const unlockBtn = $('#rb-unlock', host);
    if (unlockBtn) unlockBtn.onclick = unlockForEditing;
    $('#rb-report-name', host).onchange = function (e) {
      if (!requireEditable()) return;
      state.report.name = e.target.value.trim() || 'Untitled report';
      saveDraft();
    };
    $('#rb-add-formula', host).onclick = openFormulaModal;
    $('#rb-save-tpl', host).onclick = saveCurrentTemplate;
    $('#rb-totals', host).onchange = function (e) {
      r.options.totalsRow = e.target.checked;
      if (e.target.checked && !r.columns.some(function (c) { return c.total; })) {
        // sensible default: totalize numeric-ish columns
        r.columns.forEach(function (c) {
          if (['number', 'currency', 'percent'].indexOf(c.format) >= 0 || c.kind === 'formula') c.total = true;
        });
      }
      touch(); renderBuild();
    };
    $('#rb-groupby', host).onchange = function (e) {
      r.groupBy = e.target.value || null;
      touch(); renderBuild();
    };

    renderColumnChips();
    renderFilterRows();
    renderSortRows();
    wireCanvasDnD();
  }

  function renderColumnChips() {
    const zone = $('#rb-canvas');
    if (!zone) return;
    const r = state.report;
    if (r.columns.length) {
      zone.innerHTML = r.columns.map(function (c) {
        const isFx = c.kind === 'formula';
        const foreign = !isFx && c.sourceId !== r.primarySourceId;
        return '<div class="rb-col-chip" draggable="' + (state.editable ? 'true' : 'false') + '" data-col="' + c.id + '">' +
          '<span class="grip">⋮⋮</span>' +
          '<span class="lbl">' + esc(c.label) + '</span>' +
          (isFx ? '<span class="fx-tag">ƒx</span>' : '') +
          (foreign ? '<span class="lk-tag">lookup</span>' : '') +
          '<span class="meta">' + (isFx ? esc((c.expr || '').slice(0, 42)) : esc(c.sourceId) + ' · ' + esc(c.field)) +
          (r.groupBy && r.groupBy !== c.id ? ' · ' + esc(c.agg || 'first') : '') + '</span>' +
          '<span class="acts">' +
          '<button data-cfg="' + c.id + '" title="Column settings">⚙</button>' +
          '<button class="del" data-del="' + c.id + '" title="Remove">✕</button>' +
          '</span></div>';
      }).join('');
    }
    $$('[data-cfg]', zone).forEach(function (b) { b.onclick = function () { openColumnModal(b.getAttribute('data-cfg')); }; });
    $$('[data-del]', zone).forEach(function (b) { b.onclick = function () { removeColumn(b.getAttribute('data-del')); }; });
    $$('.rb-col-chip', zone).forEach(function (chip) {
      chip.addEventListener('dragstart', function (e) {
        if (!state.editable) { e.preventDefault(); return; }
        e.dataTransfer.setData('text/rb-col', chip.getAttribute('data-col'));
        e.dataTransfer.effectAllowed = 'move';
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', function () { chip.classList.remove('dragging'); });
    });
  }

  function wireCanvasDnD() {
    const zone = $('#rb-canvas');
    if (!zone) return;
    let marker = null;
    function clearMarker() { if (marker) { marker.remove(); marker = null; } }
    function insertIndexAt(y) {
      const chips = $$('.rb-col-chip', zone).filter(function (c) { return !c.classList.contains('dragging'); });
      for (let i = 0; i < chips.length; i++) {
        const rect = chips[i].getBoundingClientRect();
        if (y < rect.top + rect.height / 2) return i;
      }
      return chips.length;
    }
    zone.addEventListener('dragover', function (e) {
      const types = Array.prototype.slice.call(e.dataTransfer.types || []);
      if (types.indexOf('text/rb-field') < 0 && types.indexOf('text/rb-col') < 0) return;
      e.preventDefault();
      zone.classList.add('drag');
      clearMarker();
      const idx = insertIndexAt(e.clientY);
      marker = document.createElement('div');
      marker.className = 'rb-drop-marker';
      const chips = $$('.rb-col-chip', zone).filter(function (c) { return !c.classList.contains('dragging'); });
      if (idx >= chips.length) zone.appendChild(marker);
      else zone.insertBefore(marker, chips[idx]);
    });
    zone.addEventListener('dragleave', function (e) {
      if (e.target === zone) { zone.classList.remove('drag'); clearMarker(); }
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag');
      const idx = insertIndexAt(e.clientY);
      clearMarker();
      const fieldData = e.dataTransfer.getData('text/rb-field');
      const colData = e.dataTransfer.getData('text/rb-col');
      if (fieldData) {
        try {
          const d = JSON.parse(fieldData);
          addColumnFromField(d.s, d.f, idx);
        } catch (err) { /* ignore malformed drops */ }
      } else if (colData) {
        moveColumn(colData, idx);
      }
    });
  }

  const FILTER_OP_LABELS = [
    ['eq', 'equals'], ['neq', 'does not equal'], ['contains', 'contains'], ['ncontains', 'does not contain'],
    ['starts', 'starts with'], ['ends', 'ends with'], ['gt', '>'], ['gte', '≥'], ['lt', '<'], ['lte', '≤'],
    ['empty', 'is empty'], ['nempty', 'is not empty']
  ];

  function renderFilterRows() {
    const host = $('#rb-filters');
    if (!host) return;
    const r = state.report;
    const dis = state.editable ? '' : ' disabled';
    host.innerHTML = '<label class="rb-field-label">Filters (keep rows where…)</label>' +
      r.filters.map(function (f, i) {
        return '<div class="rb-row">' +
          '<select class="rb-select" data-f-col="' + i + '"' + dis + '><option value="">— column —</option>' +
          r.columns.map(function (c) { return '<option value="' + c.id + '"' + (f.colId === c.id ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('') +
          '</select>' +
          '<select class="rb-select" data-f-op="' + i + '"' + dis + '>' +
          FILTER_OP_LABELS.map(function (o) { return '<option value="' + o[0] + '"' + (f.op === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
          '</select>' +
          (f.op === 'empty' || f.op === 'nempty' ? '' :
            '<input class="rb-input" data-f-val="' + i + '" value="' + esc(f.value || '') + '" placeholder="value"' + dis + ' />') +
          '<button class="rm" data-f-rm="' + i + '"' + dis + '>✕</button></div>';
      }).join('') +
      '<div class="rb-row"><button class="rb-btn ghost sm" id="rb-add-filter"' + dis + '>＋ Add filter</button></div>';
    $('#rb-add-filter', host).onclick = function () {
      if (!requireEditable()) return;
      r.filters.push({ colId: r.columns.length ? r.columns[0].id : '', op: 'eq', value: '' });
      touch(); renderBuild();
    };
    $$('[data-f-col]', host).forEach(function (s) {
      s.onchange = function () { r.filters[Number(s.getAttribute('data-f-col'))].colId = s.value; touch(); };
    });
    $$('[data-f-op]', host).forEach(function (s) {
      s.onchange = function () { r.filters[Number(s.getAttribute('data-f-op'))].op = s.value; touch(); renderBuild(); };
    });
    $$('[data-f-val]', host).forEach(function (inp) {
      inp.oninput = function () { r.filters[Number(inp.getAttribute('data-f-val'))].value = inp.value; touch(); };
    });
    $$('[data-f-rm]', host).forEach(function (b) {
      b.onclick = function () {
        if (!requireEditable()) return;
        r.filters.splice(Number(b.getAttribute('data-f-rm')), 1); touch(); renderBuild();
      };
    });
  }

  function renderSortRows() {
    const host = $('#rb-sorts');
    if (!host) return;
    const r = state.report;
    const dis = state.editable ? '' : ' disabled';
    host.innerHTML = '<label class="rb-field-label">Sort order</label>' +
      r.sort.map(function (s, i) {
        return '<div class="rb-row">' +
          '<select class="rb-select" data-s-col="' + i + '"' + dis + '><option value="">— column —</option>' +
          r.columns.map(function (c) { return '<option value="' + c.id + '"' + (s.colId === c.id ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join('') +
          '</select>' +
          '<select class="rb-select" data-s-dir="' + i + '"' + dis + '>' +
          '<option value="asc"' + (s.dir !== 'desc' ? ' selected' : '') + '>A → Z / small → large</option>' +
          '<option value="desc"' + (s.dir === 'desc' ? ' selected' : '') + '>Z → A / large → small</option>' +
          '</select>' +
          '<button class="rm" data-s-rm="' + i + '"' + dis + '>✕</button></div>';
      }).join('') +
      '<div class="rb-row"><button class="rb-btn ghost sm" id="rb-add-sort"' + dis + '>＋ Add sort level</button></div>';
    $('#rb-add-sort', host).onclick = function () {
      if (!requireEditable()) return;
      r.sort.push({ colId: r.columns.length ? r.columns[0].id : '', dir: 'asc' });
      touch(); renderBuild();
    };
    $$('[data-s-col]', host).forEach(function (s) {
      s.onchange = function () { r.sort[Number(s.getAttribute('data-s-col'))].colId = s.value; touch(); };
    });
    $$('[data-s-dir]', host).forEach(function (s) {
      s.onchange = function () { r.sort[Number(s.getAttribute('data-s-dir'))].dir = s.value; touch(); };
    });
    $$('[data-s-rm]', host).forEach(function (b) {
      b.onclick = function () {
        if (!requireEditable()) return;
        r.sort.splice(Number(b.getAttribute('data-s-rm')), 1); touch(); renderBuild();
      };
    });
  }

  function renderPreview() {
    const host = $('#rb-preview');
    if (!host) return;
    const res = E.runReport(state.sources, state.report, { limit: PREVIEW_ROWS });
    const count = $('#rb-preview-count');
    if (count) {
      count.textContent = res.fullCount !== undefined && res.columns.length
        ? res.fullCount.toLocaleString() + ' rows × ' + res.columns.length + ' columns'
        : '';
    }
    let html = '';
    if (res.errors.length) html += '<div class="rb-error">' + res.errors.map(esc).join('<br/>') + '</div>';
    if (!res.columns.length) {
      html += '<p class="rb-hint">' + esc(res.warnings[0] || 'Add columns to see the preview.') + '</p>';
      host.innerHTML = html;
      return;
    }
    html += '<div class="rb-preview-wrap"><table class="rb-table"><thead><tr>' +
      res.columns.map(function (c) {
        const numeric = ['number', 'currency', 'percent'].indexOf(c.format) >= 0 || c.align === 'right';
        return '<th' + (numeric ? ' class="num"' : '') + '>' + esc(c.label) + '</th>';
      }).join('') + '</tr></thead><tbody>' +
      res.rows.map(function (r) {
        return '<tr>' + r.map(function (v, i) {
          const c = res.columns[i];
          const numeric = ['number', 'currency', 'percent'].indexOf(c.format) >= 0 || c.align === 'right' || (c.format === 'auto' && typeof v === 'number');
          return '<td' + (numeric ? ' class="num"' : '') + '>' + esc(E.formatValue(v, c)) + '</td>';
        }).join('') + '</tr>';
      }).join('') +
      (res.totals ? '<tr class="totals">' + res.totals.map(function (v, i) {
        const c = res.columns[i];
        return '<td' + (typeof v === 'number' ? ' class="num"' : '') + '>' +
          esc(typeof v === 'number' ? E.formatValue(v, c) : E.toStr(v)) + '</td>';
      }).join('') + '</tr>' : '') +
      '</tbody></table></div>';
    if (res.warnings.length) html += '<div class="rb-warn">' + res.warnings.map(esc).join('<br/>') + '</div>';
    host.innerHTML = html;
  }

  /* ── Export tab ── */

  function renderExport(main) {
    const r = state.report;
    if (!r.columns.length) {
      main.innerHTML = '<div class="rb-empty-state"><h2>Nothing to export yet</h2>' +
        '<p>Build a report first — add files, then drag fields onto the canvas.</p>' +
        '<button class="rb-btn primary" style="margin-top:16px" id="rb-goto-build">Go to Build</button></div>';
      $('#rb-goto-build', main).onclick = function () { state.tab = 'build'; render(); };
      return;
    }
    const res = E.runReport(state.sources, state.report, { limit: 1 });
    const fdef = FORMATS.find(function (f) { return f.id === state.exportFormat; });
    main.innerHTML =
      '<div class="rb-card"><div class="rb-section-head"><h2>Export “' + esc(r.name) + '”</h2>' +
      '<span class="rb-count">' + (res.fullCount || 0).toLocaleString() + ' rows × ' + r.columns.length + ' columns</span></div>' +
      '<p class="rb-hint">The file is generated in your browser and saved straight to your Downloads — it never touches a server.</p>' +
      '<div class="rb-formats">' + FORMATS.map(function (f) {
        return '<button class="rb-format' + (state.exportFormat === f.id ? ' sel' : '') + '" data-fmt="' + f.id + '">' +
          (f.lockable ? '<span class="lock-ico">🔐</span>' : '') +
          '<div class="fn">' + esc(f.name) + '</div><div class="fd">' + esc(f.desc) + '</div></button>';
      }).join('') + '</div>' +
      '<div class="rb-row" style="margin-top:18px">' +
      '<div style="flex:2;min-width:200px"><label class="rb-field-label">File name</label>' +
      '<input class="rb-input" id="ex-name" value="' + esc(slug(r.name) + '-' + new Date().toISOString().slice(0, 10)) + '" /></div>' +
      (state.exportFormat === 'csv'
        ? '<div style="flex:1;min-width:140px"><label class="rb-field-label">Delimiter</label>' +
          '<select class="rb-select" id="ex-delim"><option value=",">Comma ,</option><option value=";">Semicolon ;</option><option value="|">Pipe |</option></select></div>'
        : '') +
      (fdef && fdef.lockable
        ? '<div style="flex:1;min-width:170px"><label class="rb-field-label">Open password (optional)</label>' +
          '<input class="rb-input" id="ex-pass" type="password" placeholder="Encrypt the file" autocomplete="new-password" /></div>'
        : '') +
      '</div>' +
      (fdef && fdef.lockable
        ? '<p class="rb-inline-note">🔐 With a password set, the ' + (state.exportFormat === 'pdf' ? 'PDF is encrypted and asks for the password when opened.' : 'workbook is encrypted (Excel will ask for the password to open it).') + '</p>'
        : '') +
      '<div class="rb-row" style="margin-top:16px"><button class="rb-btn primary" id="ex-go">⬇ Generate &amp; download</button></div>' +
      '</div>';
    $$('[data-fmt]', main).forEach(function (b) {
      b.onclick = function () { state.exportFormat = b.getAttribute('data-fmt'); renderExport(main); };
    });
    $('#ex-go', main).onclick = doExport;
  }

  /* ── Saved tab ── */

  function renderSaved(main) {
    main.innerHTML =
      '<div class="rb-card"><div class="rb-section-head"><h2>Saved reports</h2><div class="spacer"></div>' +
      '<button class="rb-btn sm" id="tp-import">Import settings file</button>' +
      '<input type="file" id="tp-import-file" accept=".json" style="display:none" />' +
      '<button class="rb-btn sm primary" id="tp-save">Save current report</button></div>' +
      '<p class="rb-hint">A saved report is a reusable design: which files it needs, the columns, formulas, links, filters and layout. ' +
      'No row data is ever saved. Load the same (or updated) files next month and run it again. ' +
      'Lock a report with a password to stop others on this device changing or deleting it.</p></div>' +
      '<div class="rb-tpl-grid">' +
      (state.templates.length ? state.templates.map(function (t) {
        const needs = templateSourceNames(t);
        return '<div class="rb-tpl">' +
          '<div class="tn">' + (t.lock ? '<span class="lock">🔒</span>' : '') + esc(t.name) + '</div>' +
          '<div class="tm">' + (t.def.columns || []).length + ' columns · updated ' + new Date(t.updatedAt).toLocaleDateString() +
          '<br/>Needs: ' + needs.map(esc).join(', ') + '</div>' +
          '<div class="acts">' +
          '<button class="rb-btn sm primary" data-t-load="' + t.id + '">Load</button>' +
          '<button class="rb-btn sm" data-t-lock="' + t.id + '">' + (t.lock ? 'Remove lock' : 'Lock 🔒') + '</button>' +
          '<button class="rb-btn sm ghost" data-t-exp="' + t.id + '">Export settings</button>' +
          '<button class="rb-btn sm ghost danger" data-t-del="' + t.id + '">Delete</button>' +
          '</div></div>';
      }).join('') : '<div class="rb-empty-state" style="grid-column:1/-1"><h2>No saved reports yet</h2><p>Build a report and press “Save report” — the design is kept on this device for reuse.</p></div>') +
      '</div>';
    $('#tp-save', main).onclick = saveCurrentTemplate;
    const fileInput = $('#tp-import-file', main);
    $('#tp-import', main).onclick = function () { fileInput.click(); };
    fileInput.onchange = function () { if (fileInput.files[0]) importTemplateFile(fileInput.files[0]); fileInput.value = ''; };
    $$('[data-t-load]', main).forEach(function (b) { b.onclick = function () { loadTemplate(b.getAttribute('data-t-load')); }; });
    $$('[data-t-lock]', main).forEach(function (b) { b.onclick = function () { lockTemplate(b.getAttribute('data-t-lock')); }; });
    $$('[data-t-exp]', main).forEach(function (b) { b.onclick = function () { exportTemplate(b.getAttribute('data-t-exp')); }; });
    $$('[data-t-del]', main).forEach(function (b) { b.onclick = function () { deleteTemplate(b.getAttribute('data-t-del')); }; });
  }

  /* ══════════════ boot ══════════════ */

  loadDraft();
  render();
})();
