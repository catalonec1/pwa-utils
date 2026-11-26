/* Random picker logic. Pure functions, no DOM.
   Every random draw goes through a "source": a function that returns a uniform 32-bit unsigned integer.
   The default source uses crypto.getRandomValues; tests inject a fake one. */
(function (global) {
  'use strict';
  const U32 = 4294967296; // 2^32
  const M53 = 9007199254740992; // 2^53

  /* Sursa implicită: crypto.getRandomValues, citită în blocuri de 64 de valori. */
  let buf = new Uint32Array(0), pos = 0;
  function cryptoSource() {
    if (pos >= buf.length) { buf = new Uint32Array(64); global.crypto.getRandomValues(buf); pos = 0; }
    return buf[pos++];
  }

  /* Cea mai mare valoare (exclusiv) acceptată pentru n: un multiplu de n, deci fiecare rest apare la fel de des. */
  function limit(n) { return n <= U32 ? U32 - (U32 % n) : M53 - (M53 % n); }

  /* Întreg uniform în [0, n), fără bias de modulo (eșantionare cu respingere). n până la 2^53. */
  function randInt(n, src) {
    src = src || cryptoSource;
    if (!Number.isInteger(n) || n < 1 || n > M53) throw new RangeError('n out of range');
    if (n === 1) return 0;
    const lim = limit(n);
    let x;
    if (n <= U32) { do x = src() >>> 0; while (x >= lim); }
    else { do x = ((src() >>> 0) & 0x1fffff) * U32 + (src() >>> 0); while (x >= lim); }
    return x % n;
  }
  /* Întreg uniform în [min, max], inclusiv capetele; ordinea argumentelor nu contează. */
  function randRange(min, max, src) {
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) throw new RangeError('not a safe integer');
    if (min > max) [min, max] = [max, min];
    const span = max - min + 1;
    if (span > M53) throw new RangeError('range too large');
    return min + randInt(span, src);
  }

  /* Fisher–Yates, nu modifică lista primită. */
  function shuffle(list, src) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1, src); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* Liniile textului; cu weighted=true, „Nume *3” dă ponderea 3 (0 = exclus). */
  function parseList(text, weighted) {
    const out = [];
    String(text || '').split(/\r?\n/).forEach((raw, line) => {
      const t = raw.trim();
      if (!t) return;
      let name = t, w = 1;
      if (weighted) {
        const m = t.match(/^(.*?)\s*[*×]\s*(\d{1,6})$/);
        if (m && m[1]) { name = m[1]; w = Math.min(+m[2], 100000); }
      }
      out.push({ name, w, line });
    });
    return out;
  }

  /* Indicii a n elemente; unique=true fără repetări. Ponderile (w) contează; w=0 nu e ales niciodată. */
  function pick(items, n, unique, src) {
    const pool = items.map((it, i) => ({ i, w: it.w == null ? 1 : it.w })).filter(p => p.w > 0);
    const res = [];
    n = Math.max(0, Math.floor(n) || 0);
    if (unique) n = Math.min(n, pool.length);
    while (res.length < n && pool.length) {
      const total = pool.reduce((s, p) => s + p.w, 0);
      let r = randInt(total, src), k = 0;
      while (r >= pool[k].w) { r -= pool[k].w; k++; }
      res.push(pool[k].i);
      if (unique) pool.splice(k, 1);
    }
    return res;
  }

  function coin(src) { return randInt(2, src) === 0 ? 'heads' : 'tails'; }
  function dice(count, sides, src) {
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(1 + randInt(sides, src));
    return { rolls, sum: rolls.reduce((s, x) => s + x, 0) };
  }

  /* ---- Pro ---- */
  /* Împarte lista în k echipe cu mărimi echilibrate (diferență de cel mult 1). bySize=true: k = câte persoane pe echipă. */
  function teams(list, k, bySize, src) {
    const n = list.length;
    if (!n) return [];
    k = Math.max(1, Math.floor(k) || 1);
    if (bySize) k = Math.ceil(n / k);
    k = Math.min(k, n);
    const mixed = shuffle(list, src), out = Array.from({ length: k }, () => []);
    mixed.forEach((x, i) => out[i % k].push(x));
    return out;
  }

  function cell(v) {
    let s = String(v);
    if (/^[=+\-@]/.test(s) && !/^-?\d/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(rows) {
    return 'time,type,result\r\n' + rows.map(h => [h.time, h.type, h.result].map(cell).join(',')).join('\r\n') + (rows.length ? '\r\n' : '');
  }

  const RandomPick = { limit, randInt, randRange, shuffle, parseList, pick, coin, dice, teams, toCsv, cryptoSource };
  if (typeof module !== 'undefined' && module.exports) module.exports = RandomPick;
  else global.RandomPick = RandomPick;
})(typeof window !== 'undefined' ? window : globalThis);
