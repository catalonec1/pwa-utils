/* JSON Formatter – funcții pure, fără DOM. Adaptat din JSON Pocket (jsontools.js). */
(function (global) {
  'use strict';

  /* Validator propriu: dă poziția exactă (linie/coloană) și un cod de eroare traductibil,
     identic în orice motor JS. Numără și numerele întregi care își pierd precizia (> 2^53). */
  function check(text) {
    const s = String(text).replace(/^﻿/, '');
    let i = 0, bigNums = 0;
    const fail = (code, at) => { throw { code, pos: at == null ? i : at, ch: s[at == null ? i : at] }; };
    const ws = () => { while (i < s.length && (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) i++; };
    const NUM = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    function str() {
      i++;
      for (;;) {
        const c = s[i];
        if (c === undefined) fail('unterminated');
        if (c === '"') { i++; return; }
        if (c === '\\') {
          const e = s[i + 1];
          if (e === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(s.slice(i + 2, i + 6))) fail('badEscape'); i += 6; continue; }
          if (e === undefined || !'"\\/bfnrt'.includes(e)) fail('badEscape');
          i += 2; continue;
        }
        if (c < ' ') fail('control');
        i++;
      }
    }
    function value() {
      const c = s[i];
      if (c === undefined) fail('end');
      if (c === '{') {
        i++; ws();
        if (s[i] === '}') { i++; return; }
        for (;;) {
          if (s[i] !== '"') fail(s[i] === undefined ? 'end' : 'expectedKey');
          str(); ws();
          if (s[i] !== ':') fail(s[i] === undefined ? 'end' : 'expectedColon');
          i++; ws(); value(); ws();
          if (s[i] === ',') { i++; ws(); if (s[i] === '}') fail('trailingComma'); continue; }
          if (s[i] === '}') { i++; return; }
          fail(s[i] === undefined ? 'end' : 'expectedComma');
        }
      }
      if (c === '[') {
        i++; ws();
        if (s[i] === ']') { i++; return; }
        for (;;) {
          value(); ws();
          if (s[i] === ',') { i++; ws(); if (s[i] === ']') fail('trailingComma'); continue; }
          if (s[i] === ']') { i++; return; }
          fail(s[i] === undefined ? 'end' : 'expectedComma');
        }
      }
      if (c === '"') return str();
      if (c === '-' || (c >= '0' && c <= '9')) {
        NUM.lastIndex = i;
        const m = NUM.exec(s);
        if (!m) fail('badNumber');
        const after = s[i + m[0].length];
        if (after !== undefined && /[\d.eE+\-]/.test(after)) fail('badNumber');
        if (/^-?\d{16,}$/.test(m[0]) && !Number.isSafeInteger(+m[0])) bigNums++;
        i += m[0].length; return;
      }
      for (const w of ['true', 'false', 'null']) if (s.startsWith(w, i)) { i += w.length; return; }
      fail('unexpected');
    }
    try {
      ws(); value(); ws();
      if (i < s.length) fail('extra');
      return { ok: true, value: JSON.parse(s), bigNums };
    } catch (e) {
      if (!e || !e.code) throw e;
      const lc = lineCol(s, e.pos);
      const lineText = s.split('\n')[lc.line - 1].replace(/\r$/, '');
      return { ok: false, code: e.code, ch: e.ch, pos: e.pos, line: lc.line, col: lc.col, lineText };
    }
  }
  function lineCol(s, pos) {
    const before = s.slice(0, pos);
    const line = before.split('\n').length;
    return { line, col: pos - (before.lastIndexOf('\n') + 1) + 1 };
  }
  function must(text) {
    const r = check(text);
    if (!r.ok) { const e = new Error(r.code + ' at line ' + r.line + ', column ' + r.col); e.info = r; throw e; }
    return r.value;
  }

  /* Sortare după punct de cod (ca jq -S), deterministă indiferent de limbă. */
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  function sortDeep(v) {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === 'object') {
      const o = {};
      Object.keys(v).sort(cmp).forEach(k => { o[k] = sortDeep(v[k]); });
      return o;
    }
    return v;
  }
  function format(text, indent, sortKeys) {
    let v = must(text);
    if (sortKeys) v = sortDeep(v);
    return JSON.stringify(v, null, indent === 'tab' ? '\t' : Number(indent || 2));
  }
  function minify(text, sortKeys) { let v = must(text); if (sortKeys) v = sortDeep(v); return JSON.stringify(v); }

  function stats(text) {
    const v = must(text);
    let objects = 0, arrays = 0, keys = 0, values = 0, depth = 0;
    (function walk(x, d) {
      if (d > depth) depth = d;
      if (Array.isArray(x)) { arrays++; x.forEach(e => walk(e, d + 1)); }
      else if (x && typeof x === 'object') { objects++; const k = Object.keys(x); keys += k.length; k.forEach(n => walk(x[n], d + 1)); }
      else values++;
    })(v, 0);
    const bytes = s => new TextEncoder().encode(s).length;
    return { objects, arrays, keys, values, depth, bytes: bytes(String(text)), minBytes: bytes(JSON.stringify(v)) };
  }

  /* ---- căi ---- */
  const IDENT = /^[A-Za-z_$][\w$]*$/;
  function pathKey(base, k) {
    if (typeof k === 'number') return base + '[' + k + ']';
    return IDENT.test(k) ? base + '.' + k : base + "['" + String(k).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "']";
  }

  /* ---- Pro: interogare tip JSONPath ----
     $.a.b, a[0], a[-1], a[*], $..id, $['cheie cu spații'], a[?(@.status=='ok')], a[?(@.n!=3)], a[?(@.tag)] */
  function tokens(path) {
    const p = String(path).trim().replace(/^\$/, '');
    const out = [];
    const re = /\.\.([\w$-]+|\*)|\.([\w$-]+|\*)|\[\s*(\*|-?\d+)\s*\]|\[\s*'((?:[^'\\]|\\.)*)'\s*\]|\[\s*"((?:[^"\\]|\\.)*)"\s*\]|\[\s*\?\(?\s*@((?:\.[\w$-]+|\[\s*(?:'[^']*'|"[^"]*"|\d+)\s*\])+)\s*(?:(==|!=)\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null))?\s*\)?\s*\]|^([\w$-]+)/g;
    let m, last = 0;
    const bad = at => { const e = new Error('Bad path near "' + p.slice(at) + '"'); e.near = p.slice(at) || p; throw e; };
    while ((m = re.exec(p))) {
      if (m.index !== last) bad(last);
      last = re.lastIndex;
      if (m[1] !== undefined) out.push({ deep: true, key: m[1] });
      else if (m[6] !== undefined) {
        const sub = tokens('$' + m[6]).map(t => t.key);
        let val;
        if (m[8] !== undefined) val = /^'/.test(m[8]) ? m[8].slice(1, -1).replace(/\\(.)/g, '$1') : JSON.parse(m[8]);
        out.push({ filter: { path: sub, op: m[7] || 'exists', val } });
      } else {
        const k = m[2] ?? m[3] ?? m[9] ?? (m[4] !== undefined ? m[4].replace(/\\(.)/g, '$1') : m[5] !== undefined ? m[5].replace(/\\(.)/g, '$1') : undefined);
        out.push({ key: k, index: m[3] !== undefined && m[3] !== '*' });
      }
    }
    if (last !== p.length) bad(last);
    return out;
  }
  function kids(v, base) {
    if (Array.isArray(v)) return v.map((x, i) => [x, pathKey(base, i)]);
    if (v && typeof v === 'object') return Object.keys(v).map(k => [v[k], pathKey(base, k)]);
    return [];
  }
  function step(v, base, t) {
    if (t.key === '*') return kids(v, base);
    if (Array.isArray(v) && /^-?\d+$/.test(t.key)) { let i = +t.key; if (i < 0) i += v.length; return i >= 0 && i < v.length ? [[v[i], pathKey(base, i)]] : []; }
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.prototype.hasOwnProperty.call(v, t.key)) return [[v[t.key], pathKey(base, t.key)]];
    return [];
  }
  function getIn(v, keys) {
    for (const k of keys) {
      if (Array.isArray(v) && /^\d+$/.test(k)) v = v[+k];
      else if (v && typeof v === 'object' && Object.prototype.hasOwnProperty.call(v, k)) v = v[k];
      else return undefined;
      if (v === undefined) return undefined;
    }
    return v;
  }
  function descend(v, base, t, acc) {
    step(v, base, t).forEach(x => acc.push(x));
    kids(v, base).forEach(([c, p]) => { if (c && typeof c === 'object') descend(c, p, t, acc); });
    return acc;
  }
  function queryValue(root, path) {
    let cur = [[root, '$']];
    for (const t of tokens(path)) {
      const next = [];
      for (const [v, p] of cur) {
        if (t.filter) {
          const f = t.filter;
          kids(v, p).forEach(([c, cp]) => {
            const x = getIn(c, f.path);
            const hit = f.op === 'exists' ? x !== undefined : f.op === '==' ? x === f.val : x !== undefined && x !== f.val;
            if (hit) next.push([c, cp]);
          });
        } else (t.deep ? descend(v, p, t, []) : step(v, p, t)).forEach(x => next.push(x));
      }
      cur = next;
    }
    return cur.map(([value, path]) => ({ path, value }));
  }
  const query = (text, path) => queryValue(must(text), path);

  /* ---- Pro: diff ---- */
  function diff(a, b) {
    const out = [];
    const kind = x => (Array.isArray(x) ? 'array' : x === null ? 'null' : typeof x);
    (function walk(x, y, p) {
      const kx = kind(x), ky = kind(y);
      if (kx === 'object' && ky === 'object') {
        for (const k of Object.keys(x)) {
          const kp = pathKey(p, k);
          if (!Object.prototype.hasOwnProperty.call(y, k)) out.push({ op: 'removed', path: kp, from: x[k] });
          else walk(x[k], y[k], kp);
        }
        for (const k of Object.keys(y)) if (!Object.prototype.hasOwnProperty.call(x, k)) out.push({ op: 'added', path: pathKey(p, k), to: y[k] });
      } else if (kx === 'array' && ky === 'array') {
        const n = Math.max(x.length, y.length);
        for (let i = 0; i < n; i++) {
          if (i >= y.length) out.push({ op: 'removed', path: pathKey(p, i), from: x[i] });
          else if (i >= x.length) out.push({ op: 'added', path: pathKey(p, i), to: y[i] });
          else walk(x[i], y[i], pathKey(p, i));
        }
      } else if (kx !== ky || x !== y) out.push({ op: 'changed', path: p, from: x, to: y });
    })(a, b, '$');
    return out;
  }
  function diffText(d) {
    const j = v => JSON.stringify(v);
    return d.map(e => e.op === 'added' ? '+ ' + e.path + ': ' + j(e.to) : e.op === 'removed' ? '- ' + e.path + ': ' + j(e.from) : '~ ' + e.path + ': ' + j(e.from) + ' → ' + j(e.to)).join('\n');
  }

  /* ---- Pro: CSV ---- */
  function flatten(v, prefix, out) {
    out = out || {};
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const keys = Object.keys(v);
      if (!keys.length && prefix) out[prefix] = '';
      keys.forEach(k => flatten(v[k], prefix ? prefix + '.' + k : k, out));
    } else if (Array.isArray(v)) {
      if (v.every(x => x === null || typeof x !== 'object')) out[prefix || 'value'] = v.join('; ');
      else v.forEach((x, i) => flatten(x, (prefix ? prefix + '.' : '') + i, out));
    } else out[prefix || 'value'] = v;
    return out;
  }
  function csvCell(v, sep) {
    if (v === null || v === undefined) return '';
    let s = String(v);
    if (/^[=+\-@]/.test(s) && !/^-?\d/.test(s)) s = "'" + s; // fără formule la deschiderea în Excel
    return (s.includes(sep) || /["\r\n]/.test(s) || /^\s|\s$/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCSV(text, sep) {
    sep = sep || ',';
    let v = must(text);
    if (!Array.isArray(v)) {
      const arrKey = v && typeof v === 'object' && Object.keys(v).find(k => Array.isArray(v[k]));
      v = arrKey ? v[arrKey] : [v];
    }
    const rows = v.map(x => flatten(x));
    const cols = [];
    rows.forEach(r => Object.keys(r).forEach(k => { if (!cols.includes(k)) cols.push(k); }));
    return [cols.map(c => csvCell(c, sep)).join(sep)].concat(rows.map(r => cols.map(c => csvCell(r[c], sep)).join(sep))).join('\n');
  }
  function parseCSV(text, sep) {
    const s = String(text).replace(/^﻿/, '');
    if (!sep) {
      const first = s.split(/\r?\n/)[0];
      sep = [',', ';', '\t', '|'].map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
    }
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c;
      } else if (c === '"' && cell === '') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && s[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => !(r.length === 1 && r[0] === ''));
  }
  function typed(v) {
    if (v === '') return null;
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v) && Number.isFinite(+v) && !(v.replace(/^-/, '').length > 15 && /^-?\d+$/.test(v))) return +v;
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null') return null;
    return v;
  }
  function fromCSV(text, opts) {
    opts = opts || {};
    const rows = parseCSV(text, opts.sep);
    if (!rows.length) return '[]';
    const head = rows[0].map((h, i) => h.trim() || 'col' + (i + 1));
    const data = rows.slice(1).map(r => {
      const o = {};
      head.forEach((h, i) => {
        const raw = r[i] === undefined ? '' : r[i];
        const val = opts.types === false ? raw : typed(raw);
        if (opts.nest !== false && h.includes('.')) {
          const parts = h.split('.'); let cur = o;
          parts.slice(0, -1).forEach(p => { cur[p] = cur[p] && typeof cur[p] === 'object' ? cur[p] : {}; cur = cur[p]; });
          cur[parts[parts.length - 1]] = val;
        } else o[h] = val;
      });
      return o;
    });
    return JSON.stringify(data, null, 2);
  }

  /* ---- Pro: YAML ---- */
  function yamlScalar(v) {
    if (v === null) return 'null';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    const s = String(v);
    if (s === '' || /^\s|\s$|^[-?:,[\]{}#&*!|>'"%@`]|: | #|:$/.test(s) || /^(true|false|null|yes|no|on|off|y|n|~)$/i.test(s) || /^[-+]?(\d|\.\d|\.inf|\.nan)/i.test(s) || /[\n\r\t\\]/.test(s) || /[\u0000-\u001f]/.test(s)) return JSON.stringify(s);
    return s;
  }
  function toYAML(text) {
    const v = must(text);
    const empty = e => (Array.isArray(e) ? '[]' : '{}');
    const full = e => e && typeof e === 'object' && (Array.isArray(e) ? e.length : Object.keys(e).length);
    function emit(x, ind) {
      const pad = '  '.repeat(ind);
      if (Array.isArray(x)) {
        if (!x.length) return pad + '[]';
        return x.map(e => pad + '- ' + (full(e) ? emit(e, ind + 1).replace(/^\s+/, '') : e && typeof e === 'object' ? empty(e) : yamlScalar(e))).join('\n');
      }
      if (x && typeof x === 'object') {
        const keys = Object.keys(x);
        if (!keys.length) return pad + '{}';
        return keys.map(k => {
          const val = x[k], key = yamlScalar(k);
          if (full(val)) return pad + key + ':\n' + emit(val, Array.isArray(val) ? ind : ind + 1);
          return pad + key + ': ' + (val && typeof val === 'object' ? empty(val) : yamlScalar(val));
        }).join('\n');
      }
      return pad + yamlScalar(x);
    }
    return emit(v, 0) + '\n';
  }

  /* Parser YAML pentru subsetul uzual: mapări și liste pe indentare, scalari simpli sau între ghilimele,
     liste/obiecte inline ([a, b], {a: 1}), blocuri | și >, comentarii #, ---. Fără ancore și tag-uri. */
  function yamlError(line, why) { const e = new Error('YAML: ' + why + ' (line ' + line + ')'); e.line = line; e.why = why; return e; }
  function stripComment(t) {
    let q = null;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '\\' && q === '"') i++; else if (c === q) q = null; continue; }
      if ((c === '"' || c === "'") && (i === 0 || /[\s:,[{-]/.test(t[i - 1]))) q = c;
      else if (c === '#' && (i === 0 || /\s/.test(t[i - 1]))) return t.slice(0, i).replace(/\s+$/, '');
    }
    return t.replace(/\s+$/, '');
  }
  function yamlPlain(s, ln) {
    s = s.trim();
    if (s === '' || s === '~' || /^null$/i.test(s)) return null;
    if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true';
    if (/^[-+]?(0|[1-9][\d_]*)$/.test(s)) return +s.replace(/_/g, '');
    if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16);
    if (/^[-+]?(\d[\d_]*)?\.?\d+([eE][-+]?\d+)?$/.test(s) || /^[-+]?\d+\.\d*$/.test(s)) return +s.replace(/_/g, '');
    if (/^[-+]?\.inf$/i.test(s) || /^\.nan$/i.test(s)) throw yamlError(ln, 'infinity or NaN cannot be JSON');
    if (s[0] === '"') { try { return JSON.parse(s.replace(/\\'/g, "'").replace(/\t/g, '\\t')); } catch (e) { throw yamlError(ln, 'bad double-quoted string'); } }
    if (s[0] === "'") { if (!/^'(?:[^']|'')*'$/.test(s)) throw yamlError(ln, 'bad single-quoted string'); return s.slice(1, -1).replace(/''/g, "'"); }
    if (s[0] === '[' || s[0] === '{') return yamlFlow(s, ln);
    if (/^[&*!]/.test(s)) throw yamlError(ln, 'anchors, aliases and tags are not supported');
    return s;
  }
  function yamlFlow(s, ln) {
    let i = 0;
    const ws = () => { while (/\s/.test(s[i] || '')) i++; };
    function scalar(stop) {
      ws();
      if (s[i] === '"' || s[i] === "'") {
        const q = s[i]; let j = i + 1;
        while (j < s.length && !(s[j] === q && (q === "'" ? s[j + 1] !== "'" : s[j - 1] !== '\\'))) j += (q === "'" && s[j] === "'" && s[j + 1] === "'") ? 2 : 1;
        const raw = s.slice(i, j + 1); i = j + 1; return yamlPlain(raw, ln);
      }
      let j = i;
      while (j < s.length && !stop.includes(s[j])) j++;
      const raw = s.slice(i, j); i = j; return yamlPlain(raw, ln);
    }
    function val(stop) {
      ws();
      if (s[i] === '[') {
        i++; const a = []; ws();
        if (s[i] === ']') { i++; return a; }
        for (;;) { a.push(val(',]')); ws(); if (s[i] === ',') { i++; ws(); if (s[i] === ']') { i++; return a; } continue; } if (s[i] === ']') { i++; return a; } throw yamlError(ln, 'bad inline list'); }
      }
      if (s[i] === '{') {
        i++; const o = {}; ws();
        if (s[i] === '}') { i++; return o; }
        for (;;) {
          const k = scalar(':,}'); ws();
          if (s[i] !== ':') throw yamlError(ln, 'bad inline map');
          i++; o[String(k)] = val(',}'); ws();
          if (s[i] === ',') { i++; ws(); if (s[i] === '}') { i++; return o; } continue; }
          if (s[i] === '}') { i++; return o; }
          throw yamlError(ln, 'bad inline map');
        }
      }
      return scalar(stop);
    }
    const v = val(''); ws();
    if (i < s.length) throw yamlError(ln, 'unexpected text after inline value');
    return v;
  }
  function fromYAML(text) {
    const raw = String(text).replace(/^﻿/, '').replace(/\t/g, '  ').split(/\r?\n/);
    const L = [];
    for (let n = 0; n < raw.length; n++) {
      const t = raw[n];
      if (/^(---|\.\.\.)\s*(#.*)?$/.test(t)) { if (L.length && t.startsWith('---')) throw yamlError(n + 1, 'multiple documents are not supported'); continue; }
      if (/^%/.test(t)) continue;
      const c = stripComment(t);
      if (!c.trim()) { L.push({ blank: true, n: n + 1, raw: t }); continue; }
      L.push({ ind: c.length - c.trimStart().length, text: c.trim(), n: n + 1, raw: t });
    }
    let p = 0;
    const skip = () => { while (p < L.length && L[p].blank) p++; };
    const isDash = t => t === '-' || t.startsWith('- ');
    function keyOf(t, ln) {
      let k, rest;
      if (t[0] === '"' || t[0] === "'") {
        const m = t[0] === '"' ? /^"(?:[^"\\]|\\.)*"/.exec(t) : /^'(?:[^']|'')*'/.exec(t);
        if (!m) return null;
        const after = t.slice(m[0].length).replace(/^\s+/, '');
        if (!/^:(\s|$)/.test(after)) return null;
        k = String(yamlPlain(m[0], ln)); rest = after.slice(1);
      } else {
        if (t[0] === '[' || t[0] === '{') return null;
        const idx = t.search(/:(\s|$)/);
        if (idx < 0) return null;
        k = t.slice(0, idx).trim(); rest = t.slice(idx + 1);
        if (k === '?') throw yamlError(ln, 'complex keys are not supported');
      }
      return { k, rest: rest.trim() };
    }
    function blockScalar(head, parentInd, ln) {
      const style = head[0], chomp = head.includes('-') ? '-' : head.includes('+') ? '+' : '';
      const lines = []; let ind = null;
      while (p < L.length) {
        const r = L[p].raw;
        if (!r.trim()) { lines.push(''); p++; continue; }
        const i = r.length - r.trimStart().length;
        if (i <= parentInd) break;
        if (ind === null) ind = i;
        if (i < ind) break;
        lines.push(r.slice(ind)); p++;
      }
      let trail = 0; while (lines.length && lines[lines.length - 1] === '') { lines.pop(); trail++; }
      let out;
      if (style === '|') out = lines.join('\n');
      else out = lines.reduce((acc, l, i) => acc + (i === 0 ? l : (l === '' || lines[i - 1] === '' || /^\s/.test(l) ? '\n' : ' ') + l), '').replace(/\n /g, '\n');
      if (!lines.length) return '';
      if (chomp === '-') return out;
      return out + '\n' + (chomp === '+' ? '\n'.repeat(trail) : '');
    }
    function inlineValue(rest, ind, ln) {
      if (/^[|>][-+]?\d?$/.test(rest)) return blockScalar(rest, ind, ln);
      if (rest === '') {
        skip();
        if (p < L.length && L[p].ind > ind) return block(L[p].ind);
        if (p < L.length && L[p].ind === ind && isDash(L[p].text)) return block(ind, true);
        return null;
      }
      return yamlPlain(rest, ln);
    }
    function block(ind, seqOnly) {
      skip();
      const first = L[p];
      if (isDash(first.text)) {
        const arr = [];
        while (p < L.length) {
          skip(); if (p >= L.length) break;
          const l = L[p];
          if (l.ind < ind) break;
          if (l.ind > ind) throw yamlError(l.n, 'bad indentation');
          if (!isDash(l.text)) { if (seqOnly) break; throw yamlError(l.n, 'expected "- " list item'); }
          const rest = l.text.slice(1).trim();
          const kv = rest && keyOf(rest, l.n);
          if (kv || isDash(rest)) { l.ind = ind + (l.text.length - rest.length); l.text = rest; arr.push(block(l.ind)); }
          else { p++; arr.push(inlineValue(rest, ind, l.n)); }
        }
        return arr;
      }
      const kv0 = keyOf(first.text, first.n);
      if (!kv0) {
        p++; skip();
        if (p < L.length) throw yamlError(L[p].n, 'unexpected content');
        return yamlPlain(first.text, first.n);
      }
      const obj = {};
      while (p < L.length) {
        skip(); if (p >= L.length) break;
        const l = L[p];
        if (l.ind < ind) break;
        if (l.ind > ind) throw yamlError(l.n, 'bad indentation');
        if (seqOnly) break;
        const kv = keyOf(l.text, l.n);
        if (!kv) throw yamlError(l.n, 'expected "key: value"');
        p++;
        obj[kv.k] = inlineValue(kv.rest, ind, l.n);
      }
      return obj;
    }
    skip();
    if (p >= L.length) return 'null';
    const v = block(L[p].ind);
    skip();
    if (p < L.length) throw yamlError(L[p].n, 'bad indentation');
    return JSON.stringify(v, null, 2);
  }

  /* ---- structură: tipurile pentru fiecare cale ([*] = orice element din listă) ---- */
  const kindOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v;
  function typeSummary(root, limit) {
    const map = new Map(), objs = new Map();
    const at = p => { let e = map.get(p); if (!e) { e = { path: p, types: [], seen: 0, optional: false, parent: null }; map.set(p, e); } return e; };
    (function walk(v, p, parent) {
      const e = at(p), k = kindOf(v);
      if (!e.types.includes(k)) e.types.push(k);
      e.seen++; if (parent != null) e.parent = parent;
      if (k === 'array') v.forEach(x => walk(x, p + '[*]', null));
      else if (k === 'object') { objs.set(p, (objs.get(p) || 0) + 1); Object.keys(v).forEach(n => walk(v[n], pathKey(p, n), p)); }
    })(root, '$', null);
    const out = [];
    for (const e of map.values()) {
      if (e.parent != null && e.seen < objs.get(e.parent)) e.optional = true;
      out.push({ path: e.path, types: e.types, optional: e.optional });
    }
    return limit && out.length > limit ? out.slice(0, limit) : out;
  }

  /* ---- Pro: interfețe TypeScript deduse din date ---- */
  function toTypeScript(root, rootName) {
    const decls = [], used = new Set();
    const pascal = k => {
      const t = String(k).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+(.)?/g, (m, c) => (c ? c.toUpperCase() : '')).replace(/^[a-z]/, c => c.toUpperCase());
      return !t ? '' : /^\d/.test(t) ? 'T' + t : t;
    };
    const single = n => /ies$/.test(n) ? n.slice(0, -3) + 'y' : /(s|x|ch|sh)es$/.test(n) ? n.slice(0, -2) : /(ss|us|is)$/.test(n) || !/s$/.test(n) ? n + 'Item' : n.slice(0, -1);
    const unique = n => { const b = n || 'Item'; let x = b, i = 2; while (used.has(x)) x = b + i++; used.add(x); return x; };
    function typeOf(vals, name) {
      const by = { object: [], array: [], string: 0, number: 0, boolean: 0, null: 0 };
      for (const v of vals) { const k = kindOf(v); if (k === 'object' || k === 'array') by[k].push(v); else by[k]++; }
      const parts = [];
      if (by.object.length) parts.push(iface(by.object, name));
      if (by.array.length) {
        const items = [].concat(...by.array), inner = items.length ? typeOf(items, single(name)) : 'unknown';
        parts.push(/ \| /.test(inner) ? '(' + inner + ')[]' : inner + '[]');
      }
      for (const k of ['string', 'number', 'boolean', 'null']) if (by[k]) parts.push(k);
      return parts.join(' | ') || 'unknown';
    }
    function iface(list, name) {
      const nm = unique(name), slot = decls.length, keys = [];
      decls.push('');
      for (const o of list) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k);
      const lines = keys.map(k => {
        const has = list.filter(o => Object.prototype.hasOwnProperty.call(o, k));
        return '  ' + (IDENT.test(k) ? k : JSON.stringify(k)) + (has.length < list.length ? '?' : '') + ': ' + typeOf(has.map(o => o[k]), pascal(k)) + ';';
      });
      decls[slot] = 'export interface ' + nm + (lines.length ? ' {\n' + lines.join('\n') + '\n}' : ' {}');
      return nm;
    }
    const name = pascal(rootName || 'Root') || 'Root';
    if (kindOf(root) === 'object') iface([root], name);
    else { used.add(name); decls.push(''); decls[0] = 'export type ' + name + ' = ' + typeOf([root], name) + ';'; }
    return decls.join('\n\n') + '\n';
  }

  /* ---- Pro: escape ---- */
  const escapeString = t => JSON.stringify(String(t));
  function unescapeString(t) {
    let s = String(t).trim();
    if (!/^".*"$/s.test(s)) s = '"' + s + '"';
    return JSON.parse(s);
  }

  const api = { check, lineCol, format, minify, sortDeep, stats, pathKey, tokens, query, queryValue, diff, diffText, flatten, toCSV, fromCSV, parseCSV, toYAML, fromYAML, escapeString, unescapeString, typeSummary, toTypeScript };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.JsonFmt = api;
})(typeof window !== 'undefined' ? window : globalThis);
