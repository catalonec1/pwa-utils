/* Hash generator logic. Pure functions, no DOM.
   Streaming (chunked) implementations of MD5, SHA-1, SHA-256, SHA-384, SHA-512 and CRC32, so big files
   can be hashed piece by piece. Text uses Web Crypto for the SHA family when available (digest()). */
(function (global) {
  'use strict';
  const ALGS = ['sha256', 'sha1', 'sha384', 'sha512', 'md5', 'crc32'];
  const NAMES = { md5: 'MD5', sha1: 'SHA-1', sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512', crc32: 'CRC32' };
  const SIZE = { crc32: 4, md5: 16, sha1: 20, sha256: 32, sha384: 48, sha512: 64 };

  /* ---- constantele SHA-2 derivate exact (BigInt) din rădăcinile numerelor prime, fără tabele copiate ---- */
  function primes(n) { const p = []; for (let k = 2; p.length < n; k++) if (p.every(q => k % q)) p.push(k); return p; }
  function iroot(x, r) { // floor(x^(1/r)), Newton pe BigInt
    let y = 1n << BigInt(Math.ceil(x.toString(2).length / r) + 1);
    for (;;) { const z = ((BigInt(r) - 1n) * y + x / y ** BigInt(r - 1)) / BigInt(r); if (z >= y) return y; y = z; }
  }
  const M64 = (1n << 64n) - 1n;
  const frac64 = (p, r) => iroot(BigInt(p) << BigInt(64 * r), r) & M64; // primii 64 biți ai părții fracționare
  const P = primes(80);
  const split = xs => { const a = new Int32Array(xs.length * 2); xs.forEach((x, i) => { a[2 * i] = Number(x >> 32n) | 0; a[2 * i + 1] = Number(x & 0xffffffffn) | 0; }); return a; };
  const K512 = split(P.map(p => frac64(p, 3)));
  const H512 = split(P.slice(0, 8).map(p => frac64(p, 2)));
  const H384 = split(P.slice(8, 16).map(p => frac64(p, 2)));
  const K256 = new Int32Array(64).map((_, i) => K512[2 * i]);
  const H256 = new Int32Array(8).map((_, i) => H512[2 * i]);
  const KMD5 = new Int32Array(64).map((_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0);
  const SMD5 = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });

  const be32 = (b, o) => (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3];
  const W = new Int32Array(160);

  function md5c(h, b, o) {
    for (let j = 0; j < 16; j++) W[j] = b[o + 4 * j] | (b[o + 4 * j + 1] << 8) | (b[o + 4 * j + 2] << 16) | (b[o + 4 * j + 3] << 24);
    let a = h[0], x = h[1], c = h[2], d = h[3];
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) { f = (x & c) | (~x & d); g = i; }
      else if (i < 32) { f = (d & x) | (~d & c); g = (5 * i + 1) & 15; }
      else if (i < 48) { f = x ^ c ^ d; g = (3 * i + 5) & 15; }
      else { f = c ^ (x | ~d); g = (7 * i) & 15; }
      const s = SMD5[(i >> 4) * 4 + (i & 3)], t = (a + f + KMD5[i] + W[g]) | 0;
      a = d; d = c; c = x; x = (x + ((t << s) | (t >>> (32 - s)))) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + x) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
  }

  function sha1c(h, b, o) {
    for (let j = 0; j < 16; j++) W[j] = be32(b, o + 4 * j);
    for (let j = 16; j < 80; j++) { const v = W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16]; W[j] = (v << 1) | (v >>> 31); }
    let a = h[0], x = h[1], c = h[2], d = h[3], e = h[4];
    for (let j = 0; j < 80; j++) {
      const f = j < 20 ? ((x & c) | (~x & d)) + 0x5a827999 : j < 40 ? (x ^ c ^ d) + 0x6ed9eba1
        : j < 60 ? ((x & c) | (x & d) | (c & d)) - 0x70e44324 : (x ^ c ^ d) - 0x359d3e2a;
      const t = (((a << 5) | (a >>> 27)) + f + e + W[j]) | 0;
      e = d; d = c; c = (x << 30) | (x >>> 2); x = a; a = t;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + x) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0; h[4] = (h[4] + e) | 0;
  }

  const r32 = (x, n) => (x >>> n) | (x << (32 - n));
  function sha256c(h, b, o) {
    for (let j = 0; j < 16; j++) W[j] = be32(b, o + 4 * j);
    for (let j = 16; j < 64; j++) {
      const x = W[j - 15], y = W[j - 2];
      W[j] = ((r32(y, 17) ^ r32(y, 19) ^ (y >>> 10)) + W[j - 7] + (r32(x, 7) ^ r32(x, 18) ^ (x >>> 3)) + W[j - 16]) | 0;
    }
    let a = h[0], x = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], k = h[7];
    for (let j = 0; j < 64; j++) {
      const t1 = (k + (r32(e, 6) ^ r32(e, 11) ^ r32(e, 25)) + ((e & f) ^ (~e & g)) + K256[j] + W[j]) | 0;
      const t2 = ((r32(a, 2) ^ r32(a, 13) ^ r32(a, 22)) + ((a & x) ^ (a & c) ^ (x & c))) | 0;
      k = g; g = f; f = e; e = (d + t1) | 0; d = c; c = x; x = a; a = (t1 + t2) | 0;
    }
    const v = [a, x, c, d, e, f, g, k];
    for (let i = 0; i < 8; i++) h[i] = (h[i] + v[i]) | 0;
  }

  /* SHA-512: valori de 64 biți ca perechi (hi, lo) de întregi pe 32 de biți */
  const rH = (h, l, n) => n < 32 ? (h >>> n) | (l << (32 - n)) : (l >>> (n - 32)) | (h << (64 - n));
  const rL = (h, l, n) => n < 32 ? (l >>> n) | (h << (32 - n)) : (h >>> (n - 32)) | (l << (64 - n));
  const u = x => x >>> 0;
  function sha512c(h, b, o) {
    for (let j = 0; j < 32; j++) W[j] = be32(b, o + 4 * j);
    for (let j = 16; j < 80; j++) {
      const xh = W[2 * j - 30], xl = W[2 * j - 29], yh = W[2 * j - 4], yl = W[2 * j - 3];
      const s0h = rH(xh, xl, 1) ^ rH(xh, xl, 8) ^ (xh >>> 7), s0l = rL(xh, xl, 1) ^ rL(xh, xl, 8) ^ ((xl >>> 7) | (xh << 25));
      const s1h = rH(yh, yl, 19) ^ rH(yh, yl, 61) ^ (yh >>> 6), s1l = rL(yh, yl, 19) ^ rL(yh, yl, 61) ^ ((yl >>> 6) | (yh << 26));
      const lo = u(s0l) + u(s1l) + u(W[2 * j - 13]) + u(W[2 * j - 31]);
      W[2 * j + 1] = lo | 0;
      W[2 * j] = (s0h + s1h + W[2 * j - 14] + W[2 * j - 32] + Math.floor(lo / 4294967296)) | 0;
    }
    let ah = h[0], al = h[1], bh = h[2], bl = h[3], ch = h[4], cl = h[5], dh = h[6], dl = h[7];
    let eh = h[8], el = h[9], fh = h[10], fl = h[11], gh = h[12], gl = h[13], hh = h[14], hl = h[15];
    for (let j = 0; j < 80; j++) {
      const S1h = rH(eh, el, 14) ^ rH(eh, el, 18) ^ rH(eh, el, 41), S1l = rL(eh, el, 14) ^ rL(eh, el, 18) ^ rL(eh, el, 41);
      const chh = (eh & fh) ^ (~eh & gh), chl = (el & fl) ^ (~el & gl);
      const t1l = u(hl) + u(S1l) + u(chl) + u(K512[2 * j + 1]) + u(W[2 * j + 1]);
      const t1h = (hh + S1h + chh + K512[2 * j] + W[2 * j] + Math.floor(t1l / 4294967296)) | 0;
      const S0h = rH(ah, al, 28) ^ rH(ah, al, 34) ^ rH(ah, al, 39), S0l = rL(ah, al, 28) ^ rL(ah, al, 34) ^ rL(ah, al, 39);
      const mjh = (ah & bh) ^ (ah & ch) ^ (bh & ch), mjl = (al & bl) ^ (al & cl) ^ (bl & cl);
      const t2l = u(S0l) + u(mjl), t2h = (S0h + mjh + Math.floor(t2l / 4294967296)) | 0;
      hh = gh; hl = gl; gh = fh; gl = fl; fh = eh; fl = el;
      const el2 = u(dl) + u(t1l | 0);
      eh = (dh + t1h + Math.floor(el2 / 4294967296)) | 0; el = el2 | 0;
      dh = ch; dl = cl; ch = bh; cl = bl; bh = ah; bl = al;
      const al2 = u(t1l | 0) + u(t2l | 0);
      ah = (t1h + t2h + Math.floor(al2 / 4294967296)) | 0; al = al2 | 0;
    }
    const v = [ah, al, bh, bl, ch, cl, dh, dl, eh, el, fh, fl, gh, gl, hh, hl];
    for (let i = 0; i < 16; i += 2) {
      const lo = u(h[i + 1]) + u(v[i + 1]);
      h[i] = (h[i] + v[i] + Math.floor(lo / 4294967296)) | 0; h[i + 1] = lo | 0;
    }
  }

  /* Învelișul comun pentru funcțiile pe blocuri: buffer, padding, lungimea mesajului */
  function blockHasher(bs, state, compress, littleEndian, outLen) {
    const buf = new Uint8Array(bs);
    let pos = 0, total = 0;
    const h = {
      update(data) {
        let i = 0;
        total += data.length;
        if (pos) {
          i = Math.min(bs - pos, data.length);
          buf.set(data.subarray(0, i), pos); pos += i;
          if (pos < bs) return h;
          compress(state, buf, 0); pos = 0;
        }
        for (; i + bs <= data.length; i += bs) compress(state, data, i);
        if (i < data.length) { buf.set(data.subarray(i), 0); pos = data.length - i; }
        return h;
      },
      digest() {
        const lb = bs === 128 ? 16 : 8, pad = ((bs - lb - 1 - pos) % bs + bs) % bs;
        const tail = new Uint8Array(1 + pad + lb), n = tail.length;
        tail[0] = 0x80;
        const hi = Math.floor(total / 0x20000000), lo = (total * 8) >>> 0;
        for (let k = 0; k < 4; k++) {
          if (littleEndian) { tail[n - 8 + k] = lo >>> (8 * k); tail[n - 4 + k] = hi >>> (8 * k); }
          else { tail[n - 1 - k] = lo >>> (8 * k); tail[n - 5 - k] = hi >>> (8 * k); }
        }
        h.update(tail);
        const out = new Uint8Array(outLen);
        for (let k = 0; k < outLen; k++) {
          const w = state[k >> 2];
          out[k] = littleEndian ? w >>> (8 * (k & 3)) : w >>> (24 - 8 * (k & 3));
        }
        return out;
      }
    };
    return h;
  }

  function crc32Hasher() {
    let c = -1;
    const h = {
      update(data) { for (let i = 0; i < data.length; i++) c = CRC[(c ^ data[i]) & 255] ^ (c >>> 8); return h; },
      digest() { const v = ~c; return new Uint8Array([v >>> 24, v >>> 16, v >>> 8, v]); }
    };
    return h;
  }

  /* createHasher(alg) -> { update(Uint8Array), digest() -> Uint8Array } */
  function createHasher(alg) {
    switch (alg) {
      case 'md5': return blockHasher(64, Int32Array.of(0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476), md5c, true, 16);
      case 'sha1': return blockHasher(64, Int32Array.of(0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0), sha1c, false, 20);
      case 'sha256': return blockHasher(64, H256.slice(), sha256c, false, 32);
      case 'sha384': return blockHasher(128, H384.slice(), sha512c, false, 48);
      case 'sha512': return blockHasher(128, H512.slice(), sha512c, false, 64);
      case 'crc32': return crc32Hasher();
    }
    throw new Error('unknown algorithm ' + alg);
  }
  function hashBytes(alg, bytes) { return createHasher(alg).update(bytes).digest(); }

  const utf8 = s => new TextEncoder().encode(String(s == null ? '' : s));
  const SUBTLE = { sha1: 'SHA-1', sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' };
  function subtle() { const c = global.crypto; return c && c.subtle ? c.subtle : null; }
  /* SHA prin Web Crypto (dacă există), MD5/CRC32 prin implementarea proprie */
  async function digest(alg, bytes) {
    const s = subtle();
    if (s && SUBTLE[alg]) return new Uint8Array(await s.digest(SUBTLE[alg], bytes));
    return hashBytes(alg, bytes);
  }
  async function hmac(alg, key, msg) {
    const s = subtle();
    if (s && SUBTLE[alg] && key.length) { // cheia goală o refuză unele browsere: atunci calculăm local
      const k = await s.importKey('raw', key, { name: 'HMAC', hash: SUBTLE[alg] }, false, ['sign']);
      return new Uint8Array(await s.sign('HMAC', k, msg));
    }
    return hmacSync(alg, key, msg);
  }
  /* HMAC (RFC 2104) peste implementarea proprie */
  function hmacSync(alg, key, msg) {
    const bs = alg === 'sha384' || alg === 'sha512' ? 128 : 64;
    if (key.length > bs) key = hashBytes(alg, key);
    const ip = new Uint8Array(bs), op = new Uint8Array(bs);
    for (let i = 0; i < bs; i++) { ip[i] = (key[i] || 0) ^ 0x36; op[i] = (key[i] || 0) ^ 0x5c; }
    return createHasher(alg).update(op).update(createHasher(alg).update(ip).update(msg).digest()).digest();
  }

  /* ---- formatare ---- */
  const toHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function toBase64(b) {
    let s = '';
    for (let i = 0; i < b.length; i += 3) {
      const n = (b[i] << 16) | ((b[i + 1] || 0) << 8) | (b[i + 2] || 0);
      s += B64[n >> 18] + B64[(n >> 12) & 63] + (i + 1 < b.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < b.length ? B64[n & 63] : '=');
    }
    return s;
  }
  function format(bytes, fmt, upper) {
    if (fmt === 'base64') return toBase64(bytes);
    const h = toHex(bytes);
    return upper ? h.toUpperCase() : h;
  }
  function fromHex(s) {
    const t = String(s).replace(/\s+/g, '');
    if (t.length % 2 || /[^0-9a-f]/i.test(t)) return null;
    const out = new Uint8Array(t.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(t.substr(2 * i, 2), 16);
    return out;
  }

  /* ---- verificare ---- */
  const BY_LEN = { 8: 'crc32', 32: 'md5', 40: 'sha1', 64: 'sha256', 96: 'sha384', 128: 'sha512' };
  const BSD = { MD5: 'md5', SHA1: 'sha1', SHA256: 'sha256', SHA384: 'sha384', SHA512: 'sha512', CRC32: 'crc32' };
  function algOfHex(hex) { return /^[0-9a-f]+$/i.test(hex) ? BY_LEN[hex.length] || null : null; }
  /* Citește un hash simplu, linii „hash  fișier” (sha256sum, cu * pentru binar) sau „SHA256 (fișier) = hash” (BSD). */
  function parseSums(text) {
    const out = [];
    for (let line of String(text || '').split(/\r?\n/)) {
      line = line.trim();
      if (!line || line[0] === '#') continue;
      let m = /^(MD5|SHA-?1|SHA-?256|SHA-?384|SHA-?512|CRC32)\s*\((.*)\)\s*=\s*([0-9a-f]+)$/i.exec(line);
      if (m) {
        const alg = BSD[m[1].toUpperCase().replace('-', '')];
        if (algOfHex(m[3]) === alg) out.push({ hash: m[3].toLowerCase(), name: m[2], alg });
        continue;
      }
      m = /^\\?([0-9a-f]+)(?:\s+\*?(.+))?$/i.exec(line);
      if (m && algOfHex(m[1])) out.push({ hash: m[1].toLowerCase(), name: m[2] ? m[2].trim() : null, alg: algOfHex(m[1]) });
    }
    return out;
  }
  const base = n => String(n).split(/[\\/]/).pop();
  /* Rândul potrivit pentru un fișier: după nume; altfel, un singur hash fără nume se aplică oricărui fișier. */
  function entryFor(entries, fileName) {
    const f = base(fileName);
    return entries.find(e => e.name && base(e.name) === f)
      || entries.find(e => e.name && base(e.name).toLowerCase() === f.toLowerCase())
      || (entries.length === 1 && !entries[0].name ? entries[0] : null);
  }
  /* Compară o valoare așteptată (hex sau Base64, cu sau fără nume de fișier) cu un set de rezultate {alg: bytes}.
     Întoarce { alg, match } sau null dacă valoarea nu arată a hash. */
  function compare(expected, results) {
    const s = String(expected || '').trim();
    if (!s) return null;
    const e = parseSums(s)[0];
    if (e) return { alg: e.alg, match: !!results[e.alg] && toHex(results[e.alg]) === e.hash };
    const b = s.replace(/\s+/g, '');
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(b)) {
      for (const alg of ALGS) if (results[alg] && toBase64(results[alg]) === b) return { alg, match: true };
      const n = Math.floor(b.replace(/=+$/, '').length * 3 / 4);
      const alg = ALGS.find(a => SIZE[a] === n);
      if (alg) return { alg, match: false };
    }
    return null;
  }

  /* ---- loturi și CSV ---- */
  function batch(text, alg, fmt, upper) {
    return String(text || '').split('\n').map(l => l.replace(/\r$/, '')).filter(l => l !== '')
      .map(line => ({ line, hash: format(hashBytes(alg, utf8(line)), fmt, upper) }));
  }
  function cell(v) {
    let s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(header, rows) {
    return [header].concat(rows).map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
  }

  /* ---- UUID v4 și token-uri aleatorii (gratuit) ---- */
  function randomBytes(n) { const b = new Uint8Array(n); global.crypto.getRandomValues(b); return b; }
  /* UUID versiunea 4 (RFC 9562) din 16 octeți aleatorii. */
  function uuid4(bytes) {
    const b = Uint8Array.from(bytes || randomBytes(16));
    if (b.length !== 16) throw new RangeError('16 bytes needed');
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = toHex(b);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  const toBase64Url = b => toBase64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  /* kind: uuid | hex | b64url; n = octeți aleatorii pentru token-uri. */
  function tokens(kind, n, count, src) {
    src = src || randomBytes;
    const out = [];
    for (let i = 0; i < count; i++) {
      if (kind === 'uuid') out.push(uuid4(src(16)));
      else if (kind === 'hex') out.push(toHex(src(n)));
      else if (kind === 'b64url') out.push(toBase64Url(src(n)));
      else throw new RangeError('unknown kind');
    }
    return out;
  }

  /* ---- Pro: două fișiere comparate după hash ---- */
  /* a, b: { size, res: {alg: bytes} }. same: true/false sau null dacă încă nu e calculat. */
  function compareFiles(a, b, alg) {
    if (!a || !b || !a.res[alg] || !b.res[alg]) return null;
    return { same: toHex(a.res[alg]) === toHex(b.res[alg]), sizeDiff: b.size - a.size };
  }

  const HashKit = { ALGS, NAMES, SIZE, createHasher, hashBytes, digest, hmac, hmacSync, utf8, toHex, toBase64, fromHex, format, algOfHex, parseSums, entryFor, compare, batch, toCsv, randomBytes, uuid4, toBase64Url, tokens, compareFiles };
  if (typeof module !== 'undefined' && module.exports) module.exports = HashKit;
  else global.HashKit = HashKit;
})(typeof window !== 'undefined' ? window : globalThis);
