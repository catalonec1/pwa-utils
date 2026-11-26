/* Unit conversion logic. Linear units store the factor to the category's base unit. */
(function (global) {
  'use strict';
  const C = {
    length: { pro: false, base: 'm', units: { um: 1e-6, mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 } },
    mass: { pro: false, base: 'kg', units: { mg: 1e-6, ct: 0.0002, g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237, st: 6.35029318 } },
    temperature: { pro: false, base: 'C', units: { C: null, F: null, K: null } },
    volume: { pro: false, base: 'l', units: { ml: 0.001, l: 1, m3: 1000, tsp: 0.00492892159375, tbsp: 0.01478676478125, cup: 0.2365882365, floz: 0.0295735295625, ptUS: 0.473176473, qtUS: 0.946352946, galUS: 3.785411784, galUK: 4.54609 } },
    area: { pro: false, base: 'm2', units: { cm2: 1e-4, m2: 1, ha: 1e4, km2: 1e6, ft2: 0.09290304, ac: 4046.8564224, mi2: 2589988.110336 } },
    speed: { pro: false, base: 'mps', units: { mps: 1, kmh: 1 / 3.6, mph: 0.44704, kn: 1852 / 3600 } },
    time: { pro: false, base: 's', units: { ms: 0.001, s: 1, min: 60, h: 3600, d: 86400, wk: 604800, yr: 31557600 } },
    data: { pro: false, base: 'B', units: { b: 0.125, B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824, TiB: 1099511627776 } },
    /* Number bases convert text (integers of any size), see convertBase(); numerically they are identical. */
    bases: { pro: false, text: true, base: 'dec', units: { bin: 2, oct: 8, dec: 10, hex: 16 } },
    pressure: { pro: true, base: 'Pa', units: { Pa: 1, kPa: 1000, bar: 1e5, atm: 101325, psi: 6894.757293168, mmHg: 133.322387415 } },
    energy: { pro: true, base: 'J', units: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, BTU: 1055.05585262 } },
    power: { pro: true, base: 'W', units: { W: 1, kW: 1000, hp: 745.69987158227, PS: 735.49875 } },
    angle: { pro: true, base: 'deg', units: { deg: 1, rad: 180 / Math.PI, grad: 0.9, turn: 360 } },
    fuel: { pro: true, base: 'l100', units: { l100: null, kml: null, mpgUS: null, mpgUK: null } },
    frequency: { pro: true, base: 'Hz', units: { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, rpm: 1 / 60 } },
    torque: { pro: true, base: 'Nm', units: { Nm: 1, kNm: 1000, kgfm: 9.80665, lbfft: 1.3558179483314004, lbfin: 0.1129848290276167 } },
    density: { pro: true, base: 'kgm3', units: { kgm3: 1, gcm3: 1000, gml: 1000, gl: 1, lbft3: 16.01846337396014, lbgalUS: 119.82642731689663 } },
    pace: { pro: true, base: 'kmh', units: { minkm: null, minmi: null, kmh: null, mph: null } },
    datarate: { pro: true, base: 'bps', units: { bps: 1, kbps: 1e3, Mbps: 1e6, Gbps: 1e9, Bps: 8, kBps: 8e3, MBps: 8e6, GBps: 8e9, MiBps: 8388608 } },
    flow: { pro: true, base: 'm3s', units: { m3s: 1, m3h: 1 / 3600, ls: 0.001, lmin: 0.001 / 60, galUSmin: 3.785411784e-3 / 60, cfm: 0.028316846592 / 60 } }
  };

  const MI_KM = 1.609344;
  /* Pace <-> speed: min/km = 60 / (km/h); the same formula works in both directions. */
  function pace(unit, v) {
    if (unit === 'kmh') return v;
    if (unit === 'mph') return v * MI_KM;
    if (v === 0) return Infinity;
    if (unit === 'minkm') return 60 / v;
    return 60 * MI_KM / v; /* minmi */
  }
  function paceFrom(unit, kmh) {
    if (unit === 'kmh') return kmh;
    if (unit === 'mph') return kmh / MI_KM;
    if (kmh === 0) return Infinity;
    if (unit === 'minkm') return 60 / kmh;
    return 60 * MI_KM / kmh;
  }
  function toBase(cat, unit, v) {
    if (C[cat].text) return v;
    if (cat === 'pace') return pace(unit, v);
    if (cat === 'temperature') return unit === 'C' ? v : unit === 'F' ? (v - 32) * 5 / 9 : v - 273.15;
    if (cat === 'fuel') {
      if (unit === 'l100') return v;
      if (v === 0) return Infinity;
      if (unit === 'kml') return 100 / v;
      if (unit === 'mpgUS') return 235.214583 / v;
      if (unit === 'mpgUK') return 282.480936 / v;
    }
    return v * C[cat].units[unit];
  }
  function fromBase(cat, unit, v) {
    if (C[cat].text) return v;
    if (cat === 'pace') return paceFrom(unit, v);
    if (cat === 'temperature') return unit === 'C' ? v : unit === 'F' ? v * 9 / 5 + 32 : v + 273.15;
    if (cat === 'fuel') {
      if (unit === 'l100') return v;
      if (v === 0) return Infinity;
      if (unit === 'kml') return 100 / v;
      if (unit === 'mpgUS') return 235.214583 / v;
      if (unit === 'mpgUK') return 282.480936 / v;
    }
    return v / C[cat].units[unit];
  }
  function convert(cat, from, to, value) {
    if (!C[cat]) throw new Error('Unknown category ' + cat);
    if (!(from in C[cat].units) || !(to in C[cat].units)) throw new Error('Unknown unit');
    const v = Number(value);
    if (!Number.isFinite(v)) return NaN;
    return fromBase(cat, to, toBase(cat, from, v));
  }
  /* Rounds to significant digits, drops float noise like 0.30000000000000004. */
  function format(n, sig) {
    if (!Number.isFinite(n)) return n === Infinity ? '∞' : '—';
    if (n === 0) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e15 || abs < 1e-9) return n.toExponential(Math.max(0, (sig || 10) - 1)).replace(/\.?0+e/, 'e');
    return String(Number(n.toPrecision(sig || 10)));
  }
  /* Converts an integer written in one base to another. Accepts a sign, spaces/underscores and 0b/0o/0x prefixes.
     Returns null for invalid input. Uses BigInt, so there is no size limit. */
  function convertBase(str, from, to) {
    const fr = C.bases.units[from], tr = C.bases.units[to];
    if (!fr || !tr) throw new Error('Unknown unit');
    let s = String(str).replace(/[\s_]/g, '').toLowerCase();
    let neg = false;
    if (s[0] === '-' || s[0] === '+') { neg = s[0] === '-'; s = s.slice(1); }
    const prefix = { 2: '0b', 8: '0o', 16: '0x' }[fr];
    if (prefix && s.startsWith(prefix)) s = s.slice(2);
    if (!s) return null;
    const digits = '0123456789abcdef'.slice(0, fr);
    let n = 0n;
    const big = BigInt(fr);
    for (const ch of s) {
      const d = digits.indexOf(ch);
      if (d < 0) return null;
      n = n * big + BigInt(d);
    }
    const out = n.toString(tr).toUpperCase();
    return (neg && n !== 0n ? '-' : '') + out;
  }
  /* Reads "5:30" (minutes:seconds) as 5.5; plain numbers pass through. */
  function parseMinSec(s) {
    const m = /^\s*(\d+):([0-5]?\d(?:[.,]\d+)?)\s*$/.exec(String(s));
    if (!m) return Number(String(s).replace(/\s/g, '').replace(',', '.'));
    return Number(m[1]) + Number(m[2].replace(',', '.')) / 60;
  }
  /* 5.5 -> "5:30" */
  function formatMinSec(min) {
    if (!Number.isFinite(min)) return min === Infinity ? '∞' : '—';
    let total = Math.round(Math.abs(min) * 60);
    const h = Math.floor(total / 3600); total -= h * 3600;
    const m = Math.floor(total / 60), sec = total % 60;
    const ss = String(sec).padStart(2, '0');
    return (min < 0 ? '-' : '') + (h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`);
  }
  function categories(includePro) {
    return Object.keys(C).filter(k => includePro || !C[k].pro);
  }

  const api = { CATEGORIES: C, convert, format, categories, convertBase, parseMinSec, formatMinSec, PACE_UNITS: ['minkm', 'minmi'] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Units = api;
})(typeof window !== 'undefined' ? window : globalThis);
