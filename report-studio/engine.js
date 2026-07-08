/* Report Studio — pure computation engine.
   No DOM, no network, no storage: safe to unit-test in Node.
   Exposes window.RBEngine in browsers and module.exports in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RBEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ══════════════ value helpers ══════════════ */

  function isBlank(v) {
    return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
  }

  function toNum(v) {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v instanceof Date) return v.getTime();
    const s = String(v).replace(/[,\s]/g, '').replace(/^₹|^\$|^€|^£/, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function isNumeric(v) {
    if (typeof v === 'number') return Number.isFinite(v);
    if (v === null || v === undefined || v === '' || typeof v === 'boolean') return false;
    if (v instanceof Date) return false;
    return Number.isFinite(toNum(v));
  }

  function toStr(v) {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
  }

  function truthy(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (isBlank(v)) return false;
    const s = String(v).trim().toLowerCase();
    if (s === 'false' || s === '0') return false;
    return true;
  }

  function normKey(v) {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return toStr(v).trim().toLowerCase();
  }

  /* ══════════════ type inference ══════════════ */

  function inferTypes(fields, rows) {
    const sample = rows.slice(0, 200);
    return fields.map(function (f) {
      let num = 0, date = 0, filled = 0;
      for (const r of sample) {
        const v = r[f];
        if (isBlank(v)) continue;
        filled++;
        if (v instanceof Date) date++;
        else if (isNumeric(v)) num++;
        else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v.trim())) date++;
      }
      let type = 'text';
      if (filled > 0 && num / filled >= 0.8) type = 'number';
      else if (filled > 0 && date / filled >= 0.8) type = 'date';
      return { name: f, type: type };
    });
  }

  /* ══════════════ formula engine ══════════════ */

  const OPS = ['<>', '!=', '==', '>=', '<=', '=', '>', '<', '+', '-', '*', '/', '%', '^', '&'];

  function tokenize(expr) {
    const tokens = [];
    let i = 0;
    const n = expr.length;
    while (i < n) {
      const c = expr[i];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
      if (c === '[') {
        const end = expr.indexOf(']', i);
        if (end < 0) throw new Error('Unclosed field reference "["');
        tokens.push({ t: 'field', v: expr.slice(i + 1, end).trim() });
        i = end + 1; continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1, out = '';
        while (j < n) {
          if (expr[j] === c) {
            if (expr[j + 1] === c) { out += c; j += 2; continue; }
            break;
          }
          out += expr[j]; j++;
        }
        if (j >= n) throw new Error('Unclosed text string');
        tokens.push({ t: 'str', v: out });
        i = j + 1; continue;
      }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < n && /[0-9.]/.test(expr[j])) j++;
        const raw = expr.slice(i, j);
        const num = Number(raw);
        if (!Number.isFinite(num)) throw new Error('Bad number "' + raw + '"');
        tokens.push({ t: 'num', v: num });
        i = j; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < n && /[A-Za-z0-9_]/.test(expr[j])) j++;
        tokens.push({ t: 'ident', v: expr.slice(i, j).toUpperCase() });
        i = j; continue;
      }
      if (c === '(') { tokens.push({ t: 'lparen' }); i++; continue; }
      if (c === ')') { tokens.push({ t: 'rparen' }); i++; continue; }
      if (c === ',' || c === ';') { tokens.push({ t: 'comma' }); i++; continue; }
      const two = expr.slice(i, i + 2);
      if (OPS.indexOf(two) >= 0) { tokens.push({ t: 'op', v: two }); i += 2; continue; }
      if (OPS.indexOf(c) >= 0) { tokens.push({ t: 'op', v: c }); i++; continue; }
      throw new Error('Unexpected character "' + c + '"');
    }
    return tokens;
  }

  function parse(expr) {
    const tokens = tokenize(expr);
    let pos = 0;
    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }
    function expect(t) {
      const tok = next();
      if (!tok || tok.t !== t) throw new Error('Expected ' + t + (tok ? ' but got ' + (tok.v || tok.t) : ' but expression ended'));
      return tok;
    }

    // precedence: comparison < concat & < add/sub < mul/div/mod < unary < power < primary
    function parseExpr() { return parseCompare(); }

    function parseCompare() {
      let left = parseConcat();
      while (peek() && peek().t === 'op' && ['=', '==', '<>', '!=', '>', '<', '>=', '<='].indexOf(peek().v) >= 0) {
        const op = next().v;
        const right = parseConcat();
        left = { t: 'cmp', op: op, l: left, r: right };
      }
      return left;
    }

    function parseConcat() {
      let left = parseAdd();
      while (peek() && peek().t === 'op' && peek().v === '&') {
        next();
        left = { t: 'concat', l: left, r: parseAdd() };
      }
      return left;
    }

    function parseAdd() {
      let left = parseMul();
      while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
        const op = next().v;
        left = { t: 'arith', op: op, l: left, r: parseMul() };
      }
      return left;
    }

    function parseMul() {
      let left = parseUnary();
      while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/' || peek().v === '%')) {
        const op = next().v;
        left = { t: 'arith', op: op, l: left, r: parseUnary() };
      }
      return left;
    }

    function parseUnary() {
      if (peek() && peek().t === 'op' && (peek().v === '-' || peek().v === '+')) {
        const op = next().v;
        return { t: 'unary', op: op, v: parseUnary() };
      }
      return parsePower();
    }

    function parsePower() {
      const base = parsePrimary();
      if (peek() && peek().t === 'op' && peek().v === '^') {
        next();
        return { t: 'arith', op: '^', l: base, r: parseUnary() };
      }
      return base;
    }

    function parsePrimary() {
      const tok = next();
      if (!tok) throw new Error('Unexpected end of formula');
      if (tok.t === 'num') return { t: 'num', v: tok.v };
      if (tok.t === 'str') return { t: 'str', v: tok.v };
      if (tok.t === 'field') return { t: 'field', v: tok.v };
      if (tok.t === 'lparen') {
        const inner = parseExpr();
        expect('rparen');
        return inner;
      }
      if (tok.t === 'ident') {
        if (tok.v === 'TRUE') return { t: 'bool', v: true };
        if (tok.v === 'FALSE') return { t: 'bool', v: false };
        if (peek() && peek().t === 'lparen') {
          next();
          const args = [];
          if (peek() && peek().t !== 'rparen') {
            args.push(parseExpr());
            while (peek() && peek().t === 'comma') { next(); args.push(parseExpr()); }
          }
          expect('rparen');
          return { t: 'call', name: tok.v, args: args };
        }
        throw new Error('Unknown name "' + tok.v + '" — wrap field names in [brackets]');
      }
      throw new Error('Unexpected token "' + (tok.v || tok.t) + '"');
    }

    const ast = parseExpr();
    if (pos < tokens.length) throw new Error('Unexpected "' + (tokens[pos].v || tokens[pos].t) + '" after end of formula');
    return ast;
  }

  function numArg(v, name) {
    const n = toNum(v);
    if (Number.isNaN(n)) throw new Error(name + ' expects a number, got "' + toStr(v) + '"');
    return n;
  }

  function flattenNums(args) {
    const out = [];
    for (const a of args) {
      if (Array.isArray(a)) { for (const x of a) { if (isNumeric(x)) out.push(toNum(x)); } }
      else if (!isBlank(a) && isNumeric(a)) out.push(toNum(a));
    }
    return out;
  }

  const FUNCTIONS = {
    IF: function (args, ev) {
      if (args.length < 2) throw new Error('IF needs (condition, then, else)');
      return truthy(ev(args[0])) ? ev(args[1]) : (args.length > 2 ? ev(args[2]) : '');
    },
    AND: function (args, ev) { return args.every(function (a) { return truthy(ev(a)); }); },
    OR: function (args, ev) { return args.some(function (a) { return truthy(ev(a)); }); },
    NOT: function (args, ev) { return !truthy(ev(args[0])); },
    IFBLANK: function (args, ev) { const v = ev(args[0]); return isBlank(v) ? ev(args[1]) : v; }
  };

  const SIMPLE_FUNCTIONS = {
    SUM: function (a) { return flattenNums(a).reduce(function (x, y) { return x + y; }, 0); },
    AVG: function (a) { const ns = flattenNums(a); return ns.length ? ns.reduce(function (x, y) { return x + y; }, 0) / ns.length : 0; },
    MIN: function (a) { const ns = flattenNums(a); return ns.length ? Math.min.apply(null, ns) : 0; },
    MAX: function (a) { const ns = flattenNums(a); return ns.length ? Math.max.apply(null, ns) : 0; },
    COUNT: function (a) { return a.filter(function (v) { return !isBlank(v); }).length; },
    ROUND: function (a) { const p = a.length > 1 ? numArg(a[1], 'ROUND') : 0; const m = Math.pow(10, p); return Math.round(numArg(a[0], 'ROUND') * m) / m; },
    FLOOR: function (a) { return Math.floor(numArg(a[0], 'FLOOR')); },
    CEIL: function (a) { return Math.ceil(numArg(a[0], 'CEIL')); },
    ABS: function (a) { return Math.abs(numArg(a[0], 'ABS')); },
    INT: function (a) { return Math.trunc(numArg(a[0], 'INT')); },
    MOD: function (a) { return numArg(a[0], 'MOD') % numArg(a[1], 'MOD'); },
    POWER: function (a) { return Math.pow(numArg(a[0], 'POWER'), numArg(a[1], 'POWER')); },
    SQRT: function (a) { return Math.sqrt(numArg(a[0], 'SQRT')); },
    VALUE: function (a) { const n = toNum(a[0]); return Number.isNaN(n) ? 0 : n; },
    CONCAT: function (a) { return a.map(toStr).join(''); },
    UPPER: function (a) { return toStr(a[0]).toUpperCase(); },
    LOWER: function (a) { return toStr(a[0]).toLowerCase(); },
    PROPER: function (a) { return toStr(a[0]).toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); }); },
    TRIM: function (a) { return toStr(a[0]).trim(); },
    LEN: function (a) { return toStr(a[0]).length; },
    LEFT: function (a) { return toStr(a[0]).slice(0, a.length > 1 ? numArg(a[1], 'LEFT') : 1); },
    RIGHT: function (a) { const s = toStr(a[0]); const k = a.length > 1 ? numArg(a[1], 'RIGHT') : 1; return k <= 0 ? '' : s.slice(-k); },
    MID: function (a) { return toStr(a[0]).substr(Math.max(0, numArg(a[1], 'MID') - 1), numArg(a[2], 'MID')); },
    SUBSTITUTE: function (a) { return toStr(a[0]).split(toStr(a[1])).join(toStr(a[2])); },
    TEXTJOIN: function (a) { return a.slice(1).filter(function (v) { return !isBlank(v); }).map(toStr).join(toStr(a[0])); },
    TODAY: function () { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); },
    NOW: function () { return new Date(); },
    YEAR: function (a) { const d = asDate(a[0]); return d ? d.getFullYear() : ''; },
    MONTH: function (a) { const d = asDate(a[0]); return d ? d.getMonth() + 1 : ''; },
    DAY: function (a) { const d = asDate(a[0]); return d ? d.getDate() : ''; }
  };

  function asDate(v) {
    if (v instanceof Date) return v;
    if (isBlank(v)) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /* Context-aware functions: lookups + whole-column aggregates. */
  const CONTEXT_FUNCTIONS = {
    // LOOKUP(value, "Source name", "Key field", "Return field")
    LOOKUP: function (a, ctx) {
      if (a.length < 4) throw new Error('LOOKUP needs (value, "source", "key field", "return field")');
      const src = ctx.findSource(toStr(a[1]));
      if (!src) throw new Error('LOOKUP: no source named "' + toStr(a[1]) + '"');
      const idx = ctx.getIndex(src.id, toStr(a[2]));
      const hit = idx.get(normKey(a[0]));
      return hit ? valueOf(hit, toStr(a[3])) : '';
    },
    // COUNTMATCH(value, "Source", "Field") — how many rows share this value (self-lookup / duplicate check)
    COUNTMATCH: function (a, ctx) {
      if (a.length < 3) throw new Error('COUNTMATCH needs (value, "source", "field")');
      const src = ctx.findSource(toStr(a[1]));
      if (!src) throw new Error('COUNTMATCH: no source named "' + toStr(a[1]) + '"');
      const counts = ctx.getCounts(src.id, toStr(a[2]));
      return counts.get(normKey(a[0])) || 0;
    },
    // SUMIF(value, "Source", "Match field", "Sum field")
    SUMIF: function (a, ctx) {
      if (a.length < 4) throw new Error('SUMIF needs (value, "source", "match field", "sum field")');
      const src = ctx.findSource(toStr(a[1]));
      if (!src) throw new Error('SUMIF: no source named "' + toStr(a[1]) + '"');
      const key = normKey(a[0]);
      let total = 0;
      for (const r of src.rows) {
        if (normKey(valueOf(r, toStr(a[2]))) === key) {
          const n = toNum(valueOf(r, toStr(a[3])));
          if (!Number.isNaN(n)) total += n;
        }
      }
      return total;
    },
    // COLSUM("Field") or COLSUM("Source!Field") — sum of an entire column
    COLSUM: function (a, ctx) { return colAgg(a, ctx, 'sum'); },
    COLAVG: function (a, ctx) { return colAgg(a, ctx, 'avg'); },
    COLMIN: function (a, ctx) { return colAgg(a, ctx, 'min'); },
    COLMAX: function (a, ctx) { return colAgg(a, ctx, 'max'); },
    COLCOUNT: function (a, ctx) { return colAgg(a, ctx, 'count'); },
    ROW: function (a, ctx) { return ctx.rowIndex + 1; }
  };

  function colAgg(a, ctx, kind) {
    const ref = toStr(a[0]);
    let srcName = null, field = ref;
    const bang = ref.indexOf('!');
    if (bang >= 0) { srcName = ref.slice(0, bang); field = ref.slice(bang + 1); }
    const src = srcName ? ctx.findSource(srcName) : ctx.primary;
    if (!src) throw new Error('No source named "' + srcName + '"');
    const vals = [];
    let count = 0;
    for (const r of src.rows) {
      const v = valueOf(r, field);
      if (isBlank(v)) continue;
      count++;
      if (isNumeric(v)) vals.push(toNum(v));
    }
    if (kind === 'count') return count;
    if (!vals.length) return 0;
    if (kind === 'sum') return vals.reduce(function (x, y) { return x + y; }, 0);
    if (kind === 'avg') return vals.reduce(function (x, y) { return x + y; }, 0) / vals.length;
    if (kind === 'min') return Math.min.apply(null, vals);
    return Math.max.apply(null, vals);
  }

  function valueOf(row, field) {
    if (field in row) return row[field];
    // case-insensitive fallback
    const lower = field.toLowerCase();
    for (const k in row) if (k.toLowerCase() === lower) return row[k];
    return '';
  }

  function evaluate(ast, ctx) {
    function ev(node) {
      switch (node.t) {
        case 'num': return node.v;
        case 'str': return node.v;
        case 'bool': return node.v;
        case 'field': return ctx.getField(node.v);
        case 'unary': {
          const v = numArg(ev(node.v), 'unary ' + node.op);
          return node.op === '-' ? -v : v;
        }
        case 'concat': return toStr(ev(node.l)) + toStr(ev(node.r));
        case 'arith': {
          const l = numArg(ev(node.l), 'operator ' + node.op);
          const r = numArg(ev(node.r), 'operator ' + node.op);
          switch (node.op) {
            case '+': return l + r;
            case '-': return l - r;
            case '*': return l * r;
            case '/': return r === 0 ? '' : l / r;
            case '%': return r === 0 ? '' : l % r;
            case '^': return Math.pow(l, r);
          }
          throw new Error('Bad operator ' + node.op);
        }
        case 'cmp': {
          const l = ev(node.l), r = ev(node.r);
          let res;
          if (isNumeric(l) && isNumeric(r)) {
            const a = toNum(l), b = toNum(r);
            res = { '=': a === b, '==': a === b, '<>': a !== b, '!=': a !== b, '>': a > b, '<': a < b, '>=': a >= b, '<=': a <= b }[node.op];
          } else {
            const a = normKey(l), b = normKey(r);
            res = { '=': a === b, '==': a === b, '<>': a !== b, '!=': a !== b, '>': a > b, '<': a < b, '>=': a >= b, '<=': a <= b }[node.op];
          }
          return res;
        }
        case 'call': {
          if (FUNCTIONS[node.name]) return FUNCTIONS[node.name](node.args, ev);
          const args = node.args.map(ev);
          if (CONTEXT_FUNCTIONS[node.name]) return CONTEXT_FUNCTIONS[node.name](args, ctx);
          if (SIMPLE_FUNCTIONS[node.name]) return SIMPLE_FUNCTIONS[node.name](args);
          throw new Error('Unknown function ' + node.name);
        }
      }
      throw new Error('Bad expression node');
    }
    return ev(ast);
  }

  /* ══════════════ formatting ══════════════ */

  function formatValue(v, col) {
    if (isBlank(v)) return '';
    const fmt = (col && col.format) || 'auto';
    const dec = col && typeof col.decimals === 'number' ? col.decimals : 2;
    if (fmt === 'text') return toStr(v);
    if (fmt === 'date') {
      const d = asDate(v);
      return d ? d.toLocaleDateString() : toStr(v);
    }
    if (fmt === 'number' || fmt === 'currency' || fmt === 'percent') {
      const n = toNum(v);
      if (Number.isNaN(n)) return toStr(v);
      if (fmt === 'percent') return (n * 100).toFixed(dec) + '%';
      const s = n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
      return fmt === 'currency' ? ((col.currencySymbol || '₹') + s) : s;
    }
    // auto
    if (v instanceof Date) return v.toLocaleDateString();
    if (typeof v === 'number') {
      return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    return toStr(v);
  }

  /* ══════════════ report execution ══════════════ */

  const FILTER_OPS = {
    'eq': function (v, t) { return normKey(v) === normKey(t); },
    'neq': function (v, t) { return normKey(v) !== normKey(t); },
    'contains': function (v, t) { return normKey(v).indexOf(normKey(t)) >= 0; },
    'ncontains': function (v, t) { return normKey(v).indexOf(normKey(t)) < 0; },
    'starts': function (v, t) { return normKey(v).indexOf(normKey(t)) === 0; },
    'ends': function (v, t) { const a = normKey(v), b = normKey(t); return b.length <= a.length && a.lastIndexOf(b) === a.length - b.length; },
    'gt': function (v, t) { return toNum(v) > toNum(t); },
    'gte': function (v, t) { return toNum(v) >= toNum(t); },
    'lt': function (v, t) { return toNum(v) < toNum(t); },
    'lte': function (v, t) { return toNum(v) <= toNum(t); },
    'empty': function (v) { return isBlank(v); },
    'nempty': function (v) { return !isBlank(v); }
  };

  const AGGS = {
    'first': function (vals) { return vals.length ? vals[0] : ''; },
    'last': function (vals) { return vals.length ? vals[vals.length - 1] : ''; },
    'sum': function (vals) { return flattenNums([vals]).reduce(function (a, b) { return a + b; }, 0); },
    'avg': function (vals) { const ns = flattenNums([vals]); return ns.length ? ns.reduce(function (a, b) { return a + b; }, 0) / ns.length : ''; },
    'min': function (vals) { const ns = flattenNums([vals]); return ns.length ? Math.min.apply(null, ns) : ''; },
    'max': function (vals) { const ns = flattenNums([vals]); return ns.length ? Math.max.apply(null, ns) : ''; },
    'count': function (vals) { return vals.filter(function (v) { return !isBlank(v); }).length; },
    'countd': function (vals) { const s = new Set(); vals.forEach(function (v) { if (!isBlank(v)) s.add(normKey(v)); }); return s.size; },
    'join': function (vals) {
      const seen = new Set(); const out = [];
      vals.forEach(function (v) { if (isBlank(v)) return; const k = normKey(v); if (!seen.has(k)) { seen.add(k); out.push(toStr(v)); } });
      return out.join(', ');
    }
  };

  /**
   * Run a report definition against in-memory sources.
   * sources: [{ id, name, fields:[{name,type}], rows:[{}] }]
   * report:  { primarySourceId, links:[{sourceId, localKey, foreignKey}],
   *            columns:[{id, kind:'field'|'formula', sourceId, field, expr, label, format, decimals, agg, total, align, width}],
   *            filters:[{colId, op, value}], sort:[{colId, dir}], groupBy: colId|null, options:{totalsRow} }
   * Returns { columns, rows (raw values), totals, warnings, errors }
   */
  function runReport(sources, report, opts) {
    opts = opts || {};
    const warnings = [];
    const errors = [];
    const primary = sources.find(function (s) { return s.id === report.primarySourceId; });
    if (!primary) return { columns: [], rows: [], totals: null, warnings: ['No base file selected — add columns to pick one.'], errors: [] };
    const cols = report.columns || [];
    if (!cols.length) return { columns: [], rows: [], totals: null, warnings: ['Drag fields into the canvas to start.'], errors: [] };

    // lookup indexes per linked source
    const indexCache = new Map();
    const countCache = new Map();
    function getIndex(sourceId, keyField) {
      const key = sourceId + ' ' + keyField.toLowerCase();
      if (!indexCache.has(key)) {
        const src = sources.find(function (s) { return s.id === sourceId; });
        const map = new Map();
        if (src) {
          for (const r of src.rows) {
            const k = normKey(valueOf(r, keyField));
            if (k !== '' && !map.has(k)) map.set(k, r);
          }
        }
        indexCache.set(key, map);
      }
      return indexCache.get(key);
    }
    function getCounts(sourceId, field) {
      const key = sourceId + ' ' + field.toLowerCase();
      if (!countCache.has(key)) {
        const src = sources.find(function (s) { return s.id === sourceId; });
        const map = new Map();
        if (src) {
          for (const r of src.rows) {
            const k = normKey(valueOf(r, field));
            if (k === '') continue;
            map.set(k, (map.get(k) || 0) + 1);
          }
        }
        countCache.set(key, map);
      }
      return countCache.get(key);
    }
    function findSource(name) {
      const lower = String(name).toLowerCase();
      return sources.find(function (s) { return s.name.toLowerCase() === lower; }) || null;
    }
    const linkBySource = {};
    (report.links || []).forEach(function (l) { linkBySource[l.sourceId] = l; });

    // pre-parse formulas
    const parsed = {};
    for (const c of cols) {
      if (c.kind === 'formula') {
        try { parsed[c.id] = parse(c.expr || '""'); }
        catch (e) { errors.push('Column "' + (c.label || '?') + '": ' + e.message); parsed[c.id] = null; }
      }
    }

    function fieldFromRow(baseRow, sourceId, field) {
      if (sourceId === primary.id) return valueOf(baseRow, field);
      const link = linkBySource[sourceId];
      if (!link) return '';
      const idx = getIndex(sourceId, link.foreignKey);
      const hit = idx.get(normKey(valueOf(baseRow, link.localKey)));
      return hit ? valueOf(hit, field) : '';
    }

    const rowErrors = new Set();
    const out = [];
    const baseRows = primary.rows;
    for (let i = 0; i < baseRows.length; i++) {
      const baseRow = baseRows[i];
      const ctx = {
        primary: primary,
        rowIndex: i,
        findSource: findSource,
        getIndex: getIndex,
        getCounts: getCounts,
        getField: function (ref) {
          const bang = ref.indexOf('!');
          if (bang >= 0) {
            const src = findSource(ref.slice(0, bang).trim());
            if (!src) throw new Error('No file/sheet named "' + ref.slice(0, bang).trim() + '"');
            return fieldFromRow(baseRow, src.id, ref.slice(bang + 1).trim());
          }
          // plain name: primary first, then linked sources
          const direct = valueOf(baseRow, ref);
          if (direct !== '' || primary.fields.some(function (f) { return f.name.toLowerCase() === ref.toLowerCase(); })) return direct;
          for (const sid in linkBySource) {
            const src = sources.find(function (s) { return s.id === sid; });
            if (src && src.fields.some(function (f) { return f.name.toLowerCase() === ref.toLowerCase(); })) {
              return fieldFromRow(baseRow, sid, ref);
            }
          }
          return '';
        }
      };
      const vals = [];
      for (const c of cols) {
        if (c.kind === 'field') {
          vals.push(fieldFromRow(baseRow, c.sourceId, c.field));
        } else {
          const ast = parsed[c.id];
          if (!ast) { vals.push(''); continue; }
          try { vals.push(evaluate(ast, ctx)); }
          catch (e) {
            vals.push('');
            const msg = 'Column "' + (c.label || '?') + '": ' + e.message;
            if (!rowErrors.has(msg)) rowErrors.add(msg);
          }
        }
      }
      out.push(vals);
    }
    rowErrors.forEach(function (m) { errors.push(m); });

    // filters (on output columns)
    let rows = out;
    const filters = (report.filters || []).filter(function (f) { return f.colId && f.op; });
    if (filters.length) {
      const colIdx = {};
      cols.forEach(function (c, i) { colIdx[c.id] = i; });
      rows = rows.filter(function (r) {
        return filters.every(function (f) {
          const i = colIdx[f.colId];
          if (i === undefined) return true;
          const fn = FILTER_OPS[f.op];
          return fn ? fn(r[i], f.value) : true;
        });
      });
    }

    // group by
    if (report.groupBy) {
      const gi = cols.findIndex(function (c) { return c.id === report.groupBy; });
      if (gi >= 0) {
        const groups = new Map();
        for (const r of rows) {
          const k = normKey(r[gi]);
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k).push(r);
        }
        const grouped = [];
        groups.forEach(function (members) {
          const rowOut = cols.map(function (c, i) {
            if (i === gi) return members[0][i];
            const agg = AGGS[c.agg || defaultAgg(c)] || AGGS.first;
            return agg(members.map(function (m) { return m[i]; }));
          });
          grouped.push(rowOut);
        });
        rows = grouped;
      }
    }

    // sort
    const sorts = (report.sort || []).filter(function (s) { return s.colId; });
    if (sorts.length) {
      const colIdx = {};
      cols.forEach(function (c, i) { colIdx[c.id] = i; });
      rows = rows.slice().sort(function (a, b) {
        for (const s of sorts) {
          const i = colIdx[s.colId];
          if (i === undefined) continue;
          const va = a[i], vb = b[i];
          let cmp;
          if (isNumeric(va) && isNumeric(vb)) cmp = toNum(va) - toNum(vb);
          else cmp = toStr(va).localeCompare(toStr(vb), undefined, { numeric: true, sensitivity: 'base' });
          if (cmp !== 0) return s.dir === 'desc' ? -cmp : cmp;
        }
        return 0;
      });
    }

    // link health: how many base rows found no match in each linked file
    const linkStats = [];
    for (const l of (report.links || [])) {
      const lsrc = sources.find(function (s) { return s.id === l.sourceId; });
      if (!lsrc) { linkStats.push({ source: l.sourceId, missing: true, unmatched: 0, total: baseRows.length }); continue; }
      const lidx = getIndex(l.sourceId, l.foreignKey);
      let un = 0;
      for (const br of baseRows) {
        if (!lidx.has(normKey(valueOf(br, l.localKey)))) un++;
      }
      linkStats.push({ source: lsrc.name, missing: false, unmatched: un, total: baseRows.length });
    }

    // totals
    let totals = null;
    if (report.options && report.options.totalsRow) {
      totals = cols.map(function (c, i) {
        if (!c.total) return i === 0 ? 'TOTAL' : '';
        const ns = rows.map(function (r) { return r[i]; }).filter(isNumeric).map(toNum);
        return ns.reduce(function (a, b) { return a + b; }, 0);
      });
      if (cols.length && cols[0].total && totals[0] !== 'TOTAL') { /* keep numeric total in col 0 */ }
    }

    if (opts.limit && rows.length > opts.limit) {
      warnings.push('Preview shows first ' + opts.limit + ' of ' + rows.length + ' rows.');
      return { columns: cols, rows: rows.slice(0, opts.limit), fullCount: rows.length, totals: totals, warnings: warnings, errors: errors, linkStats: linkStats };
    }
    return { columns: cols, rows: rows, fullCount: rows.length, totals: totals, warnings: warnings, errors: errors, linkStats: linkStats };
  }

  function defaultAgg(col) {
    if (col.format === 'number' || col.format === 'currency' || col.format === 'percent') return 'sum';
    return 'first';
  }

  const FUNCTION_HELP = [
    { sig: 'IF(condition, then, else)', desc: 'Conditional value' },
    { sig: 'SUM(a, b, …) · AVG · MIN · MAX · COUNT', desc: 'Math across the listed values' },
    { sig: 'ROUND(x, places) · ABS · INT · FLOOR · CEIL · MOD · POWER · SQRT', desc: 'Number helpers' },
    { sig: 'CONCAT(a, b, …) · TEXTJOIN(sep, a, b, …)', desc: 'Join text' },
    { sig: 'UPPER · LOWER · PROPER · TRIM · LEN · LEFT · RIGHT · MID · SUBSTITUTE', desc: 'Text helpers' },
    { sig: 'LOOKUP([Key], "File", "Key field", "Return field")', desc: 'Fetch a value from another file by unique key' },
    { sig: 'COUNTMATCH([Key], "File", "Field")', desc: 'How many rows share this value (duplicate / self-lookup)' },
    { sig: 'SUMIF([Key], "File", "Match field", "Sum field")', desc: 'Sum matching rows in any file' },
    { sig: 'COLSUM("Field") · COLAVG · COLMIN · COLMAX · COLCOUNT', desc: 'Whole-column aggregate, e.g. [Amount]/COLSUM("Amount")' },
    { sig: 'ROW() · TODAY() · NOW() · YEAR · MONTH · DAY', desc: 'Row number and dates' },
    { sig: '+ - * / % ^ & = <> > < >= <=', desc: 'Operators; & joins text: [Name] & " (" & [City] & ")"' }
  ];

  return {
    parse: parse,
    evaluate: evaluate,
    runReport: runReport,
    inferTypes: inferTypes,
    formatValue: formatValue,
    toNum: toNum,
    toStr: toStr,
    isBlank: isBlank,
    isNumeric: isNumeric,
    normKey: normKey,
    FILTER_OPS: FILTER_OPS,
    AGGS: AGGS,
    FUNCTION_HELP: FUNCTION_HELP
  };
});
