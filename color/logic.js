/* Color converter logic. Pure functions, no DOM. Colors are opaque { r, g, b } with 0-255 floats.
   Parts adapted from Color Pocket (colortools.js). */
(function (global) {
  'use strict';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rd = (v, d) => { const k = Math.pow(10, d || 0); const x = Math.round(v * k) / k; return Object.is(x, -0) ? 0 : x; };
  const hex2 = n => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  const fix = c => ({ r: clamp(c.r, 0, 255), g: clamp(c.g, 0, 255), b: clamp(c.b, 0, 255) });

  /* Cele 148 de culori numite din CSS Color 4 (inclusiv variantele gray/grey). */
  const NAMES = 'aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32'
    .split(' ').reduce((o, v, i, a) => { if (i % 2 === 0) o[v] = a[i + 1]; return o; }, {});

  /* ---- sRGB <-> spații de culoare ---- */
  function toHex(c) { return '#' + hex2(c.r) + hex2(c.g) + hex2(c.b); }
  function toHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2; let h = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return { h, s: s * 100, l: l * 100 };
  }
  function fromHsl({ h, s, l }) {
    s /= 100; l /= 100; h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
  }
  function toHwb(c) { const mx = Math.max(c.r, c.g, c.b) / 255, mn = Math.min(c.r, c.g, c.b) / 255; return { h: toHsl(c).h, w: mn * 100, b: (1 - mx) * 100 }; }
  function fromHwb({ h, w, b }) {
    w /= 100; b /= 100;
    if (w + b >= 1) { const g = w / (w + b) * 255; return { r: g, g, b: g }; }
    const p = fromHsl({ h, s: 100, l: 50 }), k = 1 - w - b;
    return { r: p.r * k + w * 255, g: p.g * k + w * 255, b: p.b * k + w * 255 };
  }
  function toCmyk({ r, g, b }) {
    r /= 255; g /= 255; b /= 255; const k = 1 - Math.max(r, g, b);
    if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
    return { c: (1 - r - k) / (1 - k) * 100, m: (1 - g - k) / (1 - k) * 100, y: (1 - b - k) / (1 - k) * 100, k: k * 100 };
  }
  function fromCmyk({ c, m, y, k }) { k /= 100; return { r: 255 * (1 - c / 100) * (1 - k), g: 255 * (1 - m / 100) * (1 - k), b: 255 * (1 - y / 100) * (1 - k) }; }

  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const gam = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055);
  const mul = (M, v) => M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const toLin = c => [lin(c.r), lin(c.g), lin(c.b)];
  const fromLin = v => fix({ r: gam(v[0]), g: gam(v[1]), b: gam(v[2]) });

  /* OKLab (Björn Ottosson) */
  const OK1 = [[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]];
  const OK2 = [[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099], [0.0259040371, 0.7827717662, -0.8086757660]];
  const OK2i = [[1, 0.3963377774, 0.2158037573], [1, -0.1055613458, -0.0638541728], [1, -0.0894841775, -1.2914855480]];
  const OK1i = [[4.0767416621, -3.3077115913, 0.2309699292], [-1.2684380046, 2.6097574011, -0.3413193965], [-0.0041960863, -0.7034186147, 1.7076147010]];
  function toOklab(c) { const [L, a, b] = mul(OK2, mul(OK1, toLin(c)).map(Math.cbrt)); return { L, a, b }; }
  function fromOklab({ L, a, b }) { return fromLin(mul(OK1i, mul(OK2i, [L, a, b]).map(v => v * v * v))); }
  function polar(a, b) { let h = Math.atan2(b, a) * 180 / Math.PI; if (h < 0) h += 360; return { C: Math.hypot(a, b), h }; }
  function toOklch(c) { const o = toOklab(c), p = polar(o.a, o.b); return { L: o.L, C: p.C, h: p.C < 1e-4 ? 0 : p.h }; }
  function fromOklch({ L, C, h }) { const t = h * Math.PI / 180; return fromOklab({ L, a: C * Math.cos(t), b: C * Math.sin(t) }); }

  /* CIE Lab (D50, ca în CSS lab()) */
  const XYZ = [[0.4360747, 0.3850649, 0.1430804], [0.2225045, 0.7168786, 0.0606169], [0.0139322, 0.0971045, 0.7141733]];
  const XYZi = [[3.1338561, -1.6168667, -0.4906146], [-0.9787684, 1.9161415, 0.0334540], [0.0719453, -0.2289914, 1.4052427]];
  const W = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585], E = 216 / 24389, K = 24389 / 27;
  function toLab(c) {
    const f = mul(XYZ, toLin(c)).map((v, i) => { v /= W[i]; return v > E ? Math.cbrt(v) : (K * v + 16) / 116; });
    return { L: 116 * f[1] - 16, a: 500 * (f[0] - f[1]), b: 200 * (f[1] - f[2]) };
  }
  function fromLab({ L, a, b }) {
    const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
    const x = fx ** 3 > E ? fx ** 3 : (116 * fx - 16) / K, y = L > K * E ? fy ** 3 : L / K, z = fz ** 3 > E ? fz ** 3 : (116 * fz - 16) / K;
    return fromLin(mul(XYZi, [x * W[0], y * W[1], z * W[2]]));
  }

  /* ---- Parsare: hex, nume CSS, rgb(), hsl(), hwb(), cmyk(), oklch(), lab(), "r, g, b" ---- */
  function parse(input) {
    if (input == null) return null;
    let s = String(input).trim().toLowerCase().replace(/;$/, '').trim();
    if (!s) return null;
    if (NAMES[s]) s = '#' + NAMES[s];
    let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (m) {
      let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('');
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    }
    m = s.match(/^(rgba?|hsla?|hwb|cmyk|oklch|lab)?\s*\(?\s*([^()]*?)\s*\)?$/);
    if (!m) return null;
    const fn = (m[1] || 'rgb').replace(/^(rgb|hsl)a$/, '$1');
    const parts = m[2].split(/[\s,/]+/).filter(Boolean);
    const n = parts.map(p => parseFloat(p)), pct = parts.map(p => p.endsWith('%'));
    if (!parts.every(p => /^[-+]?(\d+\.?\d*|\.\d+)(%|deg)?$/.test(p))) return null;
    const want = fn === 'cmyk' ? 4 : 3;
    /* doar culori opace: un al 4-lea termen (alfa) e acceptat numai dacă e 1 sau 100% */
    const opaque = want === 3 && parts.length === 4 && (pct[3] ? n[3] === 100 : n[3] === 1);
    if (parts.length !== want && !opaque) return null;
    const inR = (v, a, b) => v >= a && v <= b;
    if (fn === 'rgb') {
      const v = n.slice(0, 3).map((x, i) => pct[i] ? x * 2.55 : x);
      return v.every(x => inR(x, 0, 255)) ? { r: v[0], g: v[1], b: v[2] } : null;
    }
    if (fn === 'cmyk') {
      const v = n.map((x, i) => pct[i] || parts.some(p => parseFloat(p) > 1) ? x : x * 100);
      return v.every(x => inR(x, 0, 100)) ? fromCmyk({ c: v[0], m: v[1], y: v[2], k: v[3] }) : null;
    }
    if (fn === 'hsl' || fn === 'hwb') {
      if (!inR(n[1], 0, 100) || !inR(n[2], 0, 100)) return null;
      return fn === 'hsl' ? fromHsl({ h: n[0], s: n[1], l: n[2] }) : fromHwb({ h: n[0], w: n[1], b: n[2] });
    }
    if (fn === 'oklch') {
      const L = pct[0] ? n[0] / 100 : n[0];
      return inR(L, 0, 1) && n[1] >= 0 ? fromOklch({ L, C: pct[1] ? n[1] * 0.004 : n[1], h: n[2] }) : null;
    }
    return inR(n[0], 0, 100) ? fromLab({ L: n[0], a: n[1], b: n[2] }) : null;
  }

  /* ---- Formate text ---- */
  function format(c, k) {
    const R = [c.r, c.g, c.b].map(Math.round);
    switch (k) {
      case 'hex': return toHex(c);
      case 'rgb': return `rgb(${R.join(', ')})`;
      case 'hsl': { const h = toHsl(c); return `hsl(${rd(h.h)}, ${rd(h.s)}%, ${rd(h.l)}%)`; }
      case 'hwb': { const h = toHwb(c); return `hwb(${rd(h.h)} ${rd(h.w)}% ${rd(h.b)}%)`; }
      case 'cmyk': { const x = toCmyk(c); return `cmyk(${rd(x.c)}%, ${rd(x.m)}%, ${rd(x.y)}%, ${rd(x.k)}%)`; }
      case 'oklch': { const o = toOklch(c); return `oklch(${rd(o.L * 100, 2)}% ${rd(o.C, 4)} ${rd(o.h, 2)})`; }
      case 'lab': { const l = toLab(c); return `lab(${rd(l.L, 2)} ${rd(l.a, 2)} ${rd(l.b, 2)})`; }
    }
    return '';
  }
  const FREE = ['hex', 'rgb', 'hsl', 'hwb', 'cmyk'], PRO = ['oklch', 'lab'];

  /* ---- Contrast WCAG 2.x ---- */
  function luminance(c) { const [r, g, b] = toLin(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
  function contrast(a, b) {
    const L1 = luminance(a), L2 = luminance(b), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return { ratio: Math.floor(ratio * 100) / 100, aaNormal: ratio >= 4.5, aaLarge: ratio >= 3, aaaNormal: ratio >= 7, aaaLarge: ratio >= 4.5 };
  }

  /* ---- Pro: cea mai apropiată culoare CSS numită (distanță în OKLab) ---- */
  function nearestName(c) {
    const o = toOklab(c); let best = null;
    for (const name in NAMES) {
      const hex = '#' + NAMES[name], p = toOklab(parse(hex)), d = Math.hypot(o.L - p.L, o.a - p.a, o.b - p.b);
      if (!best || d < best.dist - 1e-12) best = { name, hex, dist: d };
    }
    best.exact = toHex(c) === best.hex;
    best.deltaE = rd(best.dist * 100, 2);
    return best;
  }

  /* ---- Pro: palete ---- */
  const rot = (c, deg) => { const h = toHsl(c); return fromHsl({ h: h.h + deg, s: h.s, l: h.l }); };
  const mix = (c, t, w) => ({ r: c.r + (t.r - c.r) * w, g: c.g + (t.g - c.g) * w, b: c.b + (t.b - c.b) * w });
  const SCHEMES = ['complementary', 'analogous', 'triadic', 'tetradic', 'tints'];
  function palette(c, scheme) {
    const W1 = { r: 255, g: 255, b: 255 }, B1 = { r: 0, g: 0, b: 0 };
    const list = {
      complementary: () => [c, rot(c, 180)],
      analogous: () => [rot(c, -30), c, rot(c, 30)],
      triadic: () => [c, rot(c, 120), rot(c, 240)],
      tetradic: () => [c, rot(c, 90), rot(c, 180), rot(c, 270)],
      tints: () => [0.8, 0.6, 0.4, 0.2].map(w => mix(c, W1, w)).concat([c], [0.2, 0.4, 0.6, 0.8].map(w => mix(c, B1, w)))
    }[scheme];
    return list ? list().map(toHex) : [];
  }

  /* ---- gradient CSS: culori intermediare interpolate în OKLab (fără zona gri din sRGB) ---- */
  const GRAD_TYPES = ['linear', 'radial', 'conic'];
  function blendOklab(a, b, n) {
    const A = toOklab(a), B = toOklab(b), out = [];
    for (let i = 1; i <= n; i++) { const w = i / (n + 1); out.push(fix(fromOklab({ L: A.L + (B.L - A.L) * w, a: A.a + (B.a - A.a) * w, b: A.b + (B.b - A.b) * w }))); }
    return out;
  }
  function gradientCss(from, to, o) {
    o = o || {};
    const type = GRAD_TYPES.includes(o.type) ? o.type : 'linear';
    const ang = Number.isFinite(+o.angle) && String(o.angle).trim() !== '' ? ((Math.round(+o.angle) % 360) + 360) % 360 : 90;
    const mid = o.smooth ? blendOklab(from, to, 3) : [];
    const stops = [from].concat(mid, [to]).map(toHex).join(', ');
    if (type === 'radial') return 'radial-gradient(circle, ' + stops + ')';
    if (type === 'conic') return 'conic-gradient(from ' + ang + 'deg, ' + stops + ')';
    return 'linear-gradient(' + ang + 'deg, ' + stops + ')';
  }

  /* ---- Pro: culoarea dintr-o imagine (media pe un pătrat de (2r+1)², ignoră pixelii transparenți) ---- */
  function sampleAt(data, w, h, x, y, r) {
    x = Math.floor(x); y = Math.floor(y); r = r == null ? 1 : r;
    if (!(w > 0 && h > 0) || x < 0 || y < 0 || x >= w || y >= h) return null;
    let R = 0, G = 0, B = 0, A = 0;
    for (let j = Math.max(0, y - r); j <= Math.min(h - 1, y + r); j++)
      for (let i = Math.max(0, x - r); i <= Math.min(w - 1, x + r); i++) {
        const k = (j * w + i) * 4, a = data[k + 3];
        R += data[k] * a; G += data[k + 1] * a; B += data[k + 2] * a; A += a;
      }
    return A ? { r: Math.round(R / A), g: Math.round(G / A), b: Math.round(B / A) } : null;
  }

  /* ---- Pro: simulare daltonism (Machado et al. 2009, severitate 1.0, în RGB liniar) ---- */
  const CVD = {
    protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
  };
  function simulate(c, type) { const M = CVD[type]; return M ? fromLin(mul(M, toLin(c)).map(v => clamp(v, 0, 1))) : fix(c); }

  /* ---- Pro: export palete salvate [{ name, colors: ['#hex'] }] ---- */
  function slug(s, i) { const t = String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); return t || 'palette-' + (i + 1); }
  function uniq(pals) { const seen = {}; return pals.map((p, i) => { let k = slug(p.name, i); if (seen[k]) k += '-' + (++seen[k]); else seen[k] = 1; return { key: k, colors: p.colors }; }); }
  const step = (n, i) => n <= 9 ? (i + 1) * 100 : i + 1;
  function exportCss(pals) {
    const lines = []; for (const p of uniq(pals)) p.colors.forEach((c, i) => lines.push(`  --${p.key}-${step(p.colors.length, i)}: ${c};`));
    return ':root {\n' + lines.join('\n') + (lines.length ? '\n' : '') + '}\n';
  }
  function exportJson(pals) { return JSON.stringify(pals.map(p => ({ name: p.name, colors: p.colors })), null, 2) + '\n'; }
  function exportTailwind(pals) {
    const body = uniq(pals).map(p => `        '${p.key}': {\n` + p.colors.map((c, i) => `          ${step(p.colors.length, i)}: '${c}'`).join(',\n') + '\n        }').join(',\n');
    return `/** tailwind.config.js */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${body}${body ? '\n' : ''}      }\n    }\n  }\n};\n`;
  }

  const ColorLogic = { NAMES, parse, format, FREE, PRO, toHex, toHsl, fromHsl, toHwb, fromHwb, toCmyk, fromCmyk, toOklab, toOklch, fromOklch, toLab, fromLab, luminance, contrast, nearestName, SCHEMES, palette, simulate, CVD: Object.keys(CVD), slug, exportCss, exportJson, exportTailwind, GRAD_TYPES, blendOklab, gradientCss, sampleAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = ColorLogic;
  else global.ColorLogic = ColorLogic;
})(typeof window !== 'undefined' ? window : globalThis);
