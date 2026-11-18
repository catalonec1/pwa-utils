/* Unit conversion logic. Linear units store the factor to the category's base unit. */
(function (global) {
  'use strict';
  const C = {
    length: { pro: false, base: 'm', units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 } },
    mass: { pro: false, base: 'kg', units: { mg: 1e-6, g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237, st: 6.35029318 } },
    temperature: { pro: false, base: 'C', units: { C: null, F: null, K: null } },
    volume: { pro: false, base: 'l', units: { ml: 0.001, l: 1, m3: 1000, tsp: 0.00492892159375, tbsp: 0.01478676478125, cup: 0.2365882365, floz: 0.0295735295625, galUS: 3.785411784, galUK: 4.54609 } },
    area: { pro: false, base: 'm2', units: { cm2: 1e-4, m2: 1, ha: 1e4, km2: 1e6, ft2: 0.09290304, ac: 4046.8564224, mi2: 2589988.110336 } },
    speed: { pro: false, base: 'mps', units: { mps: 1, kmh: 1 / 3.6, mph: 0.44704, kn: 1852 / 3600 } },
    time: { pro: false, base: 's', units: { ms: 0.001, s: 1, min: 60, h: 3600, d: 86400, wk: 604800, yr: 31557600 } },
    data: { pro: false, base: 'B', units: { b: 0.125, B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824, TiB: 1099511627776 } },
    pressure: { pro: true, base: 'Pa', units: { Pa: 1, kPa: 1000, bar: 1e5, atm: 101325, psi: 6894.757293168, mmHg: 133.322387415 } },
    energy: { pro: true, base: 'J', units: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, BTU: 1055.05585262 } },
    power: { pro: true, base: 'W', units: { W: 1, kW: 1000, hp: 745.69987158227, PS: 735.49875 } },
    angle: { pro: true, base: 'deg', units: { deg: 1, rad: 180 / Math.PI, grad: 0.9, turn: 360 } },
    fuel: { pro: true, base: 'l100', units: { l100: null, kml: null, mpgUS: null, mpgUK: null } },
    frequency: { pro: true, base: 'Hz', units: { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, rpm: 1 / 60 } },
    torque: { pro: true, base: 'Nm', units: { Nm: 1, kNm: 1000, kgfm: 9.80665, lbfft: 1.3558179483314004, lbfin: 0.1129848290276167 } },
    density: { pro: true, base: 'kgm3', units: { kgm3: 1, gcm3: 1000, gml: 1000, gl: 1, lbft3: 16.01846337396014, lbgalUS: 119.82642731689663 } },
    flow: { pro: true, base: 'm3s', units: { m3s: 1, m3h: 1 / 3600, ls: 0.001, lmin: 0.001 / 60, galUSmin: 3.785411784e-3 / 60, cfm: 0.028316846592 / 60 } }
  };

  function toBase(cat, unit, v) {
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
  function categories(includePro) {
    return Object.keys(C).filter(k => includePro || !C[k].pro);
  }

  const api = { CATEGORIES: C, convert, format, categories };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Units = api;
})(typeof window !== 'undefined' ? window : globalThis);
