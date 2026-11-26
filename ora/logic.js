/* ORA error lookup logic. Pure functions, no DOM. */
(function (global) {
  'use strict';
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  /* Turns "ora 1", "ORA-1", "00942", "pls-201" into a canonical code when the query looks like one. */
  function codeOf(q) {
    const m = /^\s*(ora|pls)?\s*-?\s*(\d{1,5})\s*$/i.exec(q || '');
    if (!m) return null;
    return { prefix: m[1] ? m[1].toUpperCase() : null, num: m[2].padStart(5, '0') };
  }
  function entry(r) { return { code: r[0], free: r[1] === 1, title: r[2], cause: r[3], fix: r[4] }; }
  /* Finds errors in a pasted message: every ORA-nnnnn / PLS-nnnnn mentioned, in order, unique. */
  function codesIn(text) {
    const seen = [], re = /\b(ORA|PLS)-(\d{1,5})\b/gi; let m;
    while ((m = re.exec(text || ''))) { const c = m[1].toUpperCase() + '-' + m[2].padStart(5, '0'); if (!seen.includes(c)) seen.push(c); }
    return seen;
  }
  /* Search: exact code first, then codes found in pasted text, then words in title/cause. Max `limit` results. */
  function search(data, q, limit) {
    const all = data.map(entry), lim = limit || 30, s = String(q || '').trim();
    if (!s) return all.filter(e => e.free).slice(0, lim);
    const c = codeOf(s);
    if (c) {
      const hits = all.filter(e => e.code.slice(4) === c.num && (!c.prefix || e.code.startsWith(c.prefix)));
      return hits.slice(0, lim);
    }
    const found = codesIn(s);
    if (found.length) return found.map(code => all.find(e => e.code === code)).filter(Boolean).slice(0, lim);
    const words = norm(s).split(/\s+/).filter(w => w.length > 1);
    const scored = [];
    for (const e of all) {
      const t = norm(e.title), b = norm(e.cause + ' ' + e.fix);
      let score = 0;
      for (const w of words) { if (t.includes(w)) score += 3; else if (b.includes(w)) score += 1; else { score = -1; break; } }
      if (score > 0) scored.push([score, e]);
    }
    return scored.sort((a, b) => b[0] - a[0] || a[1].code.localeCompare(b[1].code)).slice(0, lim).map(x => x[1]);
  }
  function toMarkdown(e) { return `**${e.code}: ${e.title}**\n\nCause: ${e.cause}\n\nFix: ${e.fix}\n`; }
  /* Words that a word search matched on (none for code searches or pasted stacks). */
  function terms(q) {
    const s = String(q || '').trim();
    if (!s || codeOf(s) || codesIn(s).length) return [];
    return [...new Set(norm(s).split(/\s+/).filter(w => w.length > 1))];
  }
  /* Splits text into [{t, hit}] parts marking every occurrence of the terms (case-insensitive). */
  function highlight(text, words) {
    text = String(text || '');
    const ws = (words || []).filter(Boolean);
    if (!ws.length) return [{ t: text, hit: false }];
    const low = text.toLowerCase(), marks = new Array(text.length).fill(false);
    for (const w of ws) { let i = low.indexOf(w); while (i >= 0) { for (let k = i; k < i + w.length; k++) marks[k] = true; i = low.indexOf(w, i + w.length); } }
    const out = [];
    for (let i = 0; i < text.length; i++) {
      if (out.length && out[out.length - 1].hit === marks[i]) out[out.length - 1].t += text[i];
      else out.push({ t: text[i], hit: marks[i] });
    }
    return out.length ? out : [{ t: '', hit: false }];
  }
  /* Recent searches: newest first, unique (case-insensitive), single-line and short only. */
  function addRecent(list, q, max) {
    const s = String(q || '').replace(/\s+/g, ' ').trim();
    if (!s || s.length > 60 || /\n/.test(String(q).trim())) return list;
    return [s].concat((list || []).filter(x => x.toLowerCase() !== s.toLowerCase())).slice(0, max || 8);
  }
  /* Markdown table of entries (pipes escaped, newlines flattened). */
  function toMarkdownTable(entries) {
    const c = v => String(v).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
    return ['| Code | Title | Cause | Fix |', '| --- | --- | --- | --- |']
      .concat(entries.map(e => `| ${c(e.code)} | ${c(e.title)} | ${c(e.cause)} | ${c(e.fix)} |`)).join('\n') + '\n';
  }
  const OraLookup = { terms, highlight, addRecent, toMarkdownTable, codeOf, codesIn, search, toMarkdown, entry };
  if (typeof module !== 'undefined' && module.exports) module.exports = OraLookup;
  else global.OraLookup = OraLookup;
})(typeof window !== 'undefined' ? window : globalThis);
