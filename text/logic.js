/* Text tools logic. Pure functions, no DOM. */
(function (global) {
  'use strict';
  const RU = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };

  function stats(t) {
    t = String(t);
    const words = (t.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
    return {
      chars: [...t].length,
      charsNoSpaces: [...t.replace(/\s/g, '')].length,
      words,
      lines: t === '' ? 0 : t.split(/\r\n|\r|\n/).length,
      sentences: (t.match(/[^.!?…]*[\p{L}\p{N}][^.!?…]*([.!?…]+|$)/gu) || []).filter(s => s.trim()).length,
      paragraphs: t.split(/\n\s*\n/).filter(p => p.trim()).length,
      readingMin: Math.ceil(words / 200)
    };
  }
  const lines = t => String(t).split(/\r\n|\r|\n/);
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

  const ops = {
    upper: t => t.toLocaleUpperCase(),
    lower: t => t.toLocaleLowerCase(),
    title: t => t.toLocaleLowerCase().replace(/(^|[\s\-("'«„])(\p{L})/gu, (m, p, c) => p + c.toLocaleUpperCase()),
    sentence: t => t.toLocaleLowerCase().replace(/(^\s*|[.!?…]\s+)(\p{L})/gu, (m, p, c) => p + c.toLocaleUpperCase()),
    sortAZ: t => lines(t).sort(collator.compare).join('\n'),
    sortZA: t => lines(t).sort(collator.compare).reverse().join('\n'),
    dedupe: t => { const seen = new Set(); return lines(t).filter(l => (seen.has(l) ? false : seen.add(l))).join('\n'); },
    reverseLines: t => lines(t).reverse().join('\n'),
    trim: t => lines(t).map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n'),
    removeEmpty: t => lines(t).filter(l => l.trim() !== '').join('\n'),
    removeDiacritics: t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'),
    slug: t => ops.removeDiacritics(String(t).toLowerCase().replace(/[а-яё]/g, c => RU[c]))
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    numberLines: t => lines(t).map((l, i) => `${i + 1}. ${l}`).join('\n'),
    joinLines: t => lines(t).map(l => l.trim()).filter(Boolean).join(' '),
    stripHtml: t => String(t).replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
    // v1.1: amestecă rândurile, sortează după lungime
    shuffleLines: (t, rnd = Math.random) => { const a = lines(t); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.join('\n'); },
    sortLength: t => lines(t).map((l, i) => [l, i]).sort((a, b) => [...a[0]].length - [...b[0]].length || a[1] - b[1]).map(x => x[0]).join('\n')
  };
  const FREE = Object.keys(ops);

  function regexReplace(t, pattern, flags, repl) {
    const f = Array.from(new Set(String(flags || 'g').replace(/[^gimsuy]/g, ''))).join('');
    return String(t).replace(new RegExp(pattern, f), repl == null ? '' : repl);
  }
  const uniq = a => [...new Set(a)];
  // v1.1: CSV (RFC 4180: ghilimele, virgule și rânduri noi în câmp; separator , ; sau tab detectat din primul rând)
  function parseCsv(t) {
    t = String(t).replace(/^\uFEFF/, '');
    const first = t.split(/\r?\n/)[0];
    const sep = [',', ';', '\t'].reduce((b, c) => (first.split(c).length > first.split(b).length ? c : b), ',');
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter(r => r.some(x => x !== ''));
  }
  function csvToJson(t) {
    const rows = parseCsv(t); if (!rows.length) return '[]';
    const head = rows[0].map((h, i) => h.trim() || `col${i + 1}`);
    return JSON.stringify(rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined ? '' : r[i]]))), null, 2);
  }
  function jsonToCsv(t) {
    let data = JSON.parse(t); if (!Array.isArray(data)) data = [data];
    const cols = uniq(data.flatMap(o => (o && typeof o === 'object' ? Object.keys(o) : [])));
    const cell = v => { if (v == null) return ''; const x = typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\r\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
    return [cols.map(cell).join(','), ...data.map(o => cols.map(c => cell(o && o[c])).join(','))].join('\n');
  }
  const htmlEscape = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  // cuvinte pentru camel/snake/kebab: separă și la granița myVar → my var, fără diacritice
  const words = l => ops.removeDiacritics(String(l)).replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  function b64encode(t) {
    const bytes = new TextEncoder().encode(String(t));
    let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64decode(t) {
    const bin = atob(String(t).replace(/\s/g, ''));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  const pro = {
    b64encode, b64decode,
    urlEncode: t => encodeURIComponent(t),
    urlDecode: t => decodeURIComponent(String(t).replace(/\+/g, ' ')),
    jsonFormat: t => JSON.stringify(JSON.parse(t), null, 2),
    jsonMinify: t => JSON.stringify(JSON.parse(t)),
    extractEmails: t => uniq(String(t).match(/[\p{L}\p{N}._%+\-]+@[\p{L}\p{N}.\-]+\.[\p{L}]{2,}/gu) || []).join('\n'),
    extractUrls: t => uniq((String(t).match(/https?:\/\/[^\s<>"'()]+/g) || []).map(u => u.replace(/[.,;:!?]+$/, ''))).join('\n'),
    wordFreq: t => {
      const m = new Map();
      (String(t).toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).forEach(w => m.set(w, (m.get(w) || 0) + 1));
      return [...m].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0])).map(([w, n]) => `${w}: ${n}`).join('\n');
    },
    // v1.0.4: stiluri de denumire pentru programatori (pe fiecare rând) și transliterare chirilică → latină
    camelCase: t => lines(t).map(l => words(l).map((w, i) => i ? w[0].toUpperCase() + w.slice(1) : w).join('')).join('\n'),
    snakeCase: t => lines(t).map(l => words(l).join('_')).join('\n'),
    kebabCase: t => lines(t).map(l => words(l).join('-')).join('\n'),
    csvToJson, jsonToCsv, htmlEscape,
    translit: t => String(t).replace(/[А-яЁё]/g, c => { const l = c.toLowerCase(), r = RU[l]; return r === undefined ? c : c === l ? r : r.charAt(0).toUpperCase() + r.slice(1); })
  };

  // v1.2: filtre de rânduri, prefix/sufix (gratuit); regex în filtru și diferențe între texte (Pro)
  /* Keeps (keep = true) or removes the lines that contain `needle`. opts: { ignoreCase, regex }. */
  function filterLines(t, needle, keep, opts) {
    const o = opts || {};
    if (!needle) return String(t);
    let test;
    if (o.regex) { const re = new RegExp(needle, o.ignoreCase ? 'iu' : 'u'); test = l => re.test(l); }
    else if (o.ignoreCase) { const n = needle.toLocaleLowerCase(); test = l => l.toLocaleLowerCase().includes(n); }
    else test = l => l.includes(needle);
    return lines(t).filter(l => test(l) === !!keep).join('\n');
  }
  /* Adds a prefix and/or suffix to every non-empty line. */
  function affixLines(t, prefix, suffix) {
    return lines(t).map(l => (l.trim() === '' ? l : (prefix || '') + l + (suffix || ''))).join('\n');
  }
  /* Line diff (longest common subsequence): [{ op: ' ' | '-' | '+', line }]. */
  const DIFF_MAX = 3000;
  function diffLines(a, b) {
    const A = lines(a), B = lines(b);
    if (A.length > DIFF_MAX || B.length > DIFF_MAX) throw new Error(`max ${DIFF_MAX} lines`);
    let s = 0;
    while (s < A.length && s < B.length && A[s] === B[s]) s++;
    let ea = A.length, eb = B.length;
    while (ea > s && eb > s && A[ea - 1] === B[eb - 1]) { ea--; eb--; }
    const a2 = A.slice(s, ea), b2 = B.slice(s, eb), n = a2.length, m = b2.length;
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a2[i] === b2[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = A.slice(0, s).map(line => ({ op: ' ', line }));
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a2[i] === b2[j]) { out.push({ op: ' ', line: a2[i] }); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) out.push({ op: '-', line: a2[i++] });
      else out.push({ op: '+', line: b2[j++] });
    }
    while (i < n) out.push({ op: '-', line: a2[i++] });
    while (j < m) out.push({ op: '+', line: b2[j++] });
    return out.concat(A.slice(ea).map(line => ({ op: ' ', line })));
  }
  function diffText(a, b) { return diffLines(a, b).map(d => d.op + ' ' + d.line).join('\n'); }

  const api = { stats, ops, FREE, pro, PRO: Object.keys(pro), regexReplace, parseCsv, filterLines, affixLines, diffLines, diffText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.TextTools = api;
})(typeof window !== 'undefined' ? window : globalThis);
