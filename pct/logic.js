/* Percentage calculator logic. Pure functions, no DOM. Results are rounded to 10 decimals to hide float noise (0.1 + 0.2). */
(function (global) {
  'use strict';
  function r(x) { return Number.isFinite(x) ? Math.round(x * 1e10) / 1e10 : NaN; }
  function num(s) {
    if (typeof s === 'number') return s;
    const t = String(s == null ? '' : s).trim().replace(/\s/g, '').replace(',', '.');
    return t === '' || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(t) ? NaN : +t;
  }
  /* p% of x */
  function pctOf(p, x) { return r(x * p / 100); }
  /* a is what % of b */
  function whatPct(a, b) { return b === 0 ? NaN : r(a / b * 100); }
  /* % change from a to b */
  function change(a, b) { return a === 0 ? NaN : r((b - a) / Math.abs(a) * 100); }
  /* x increased (p > 0) or decreased (p < 0) by p% */
  function apply(x, p) { return r(x * (1 + p / 100)); }
  /* original value before a p% change produced y */
  function original(y, p) { return p === -100 ? NaN : r(y / (1 + p / 100)); }
  function discount(price, p) { const save = r(price * p / 100); return { save, final: r(price - save) }; }

  /* Two rates in %: difference in percentage points and relative change in %. */
  function points(a, b) { return { pp: r(b - a), rel: change(a, b) }; }
  /* a : b = c : x */
  function proportion(a, b, c) { return a === 0 ? NaN : r(b * c / a); }

  /* ---- Pro ---- */
  /* Compound annual growth rate from start to end over years (fractional years allowed). */
  function cagr(start, end, years) {
    if (!(start > 0) || !(end >= 0) || !(years > 0)) return NaN;
    return r((Math.pow(end / start, 1 / years) - 1) * 100);
  }
  function vatAdd(net, rate) { const vat = r(net * rate / 100); return { net: r(net), vat, gross: r(net + vat) }; }
  function vatRemove(gross, rate) { const net = r(gross / (1 + rate / 100)); return { net, vat: r(gross - net), gross: r(gross) }; }
  function tip(bill, p, people) {
    const n = Math.max(1, Math.floor(people || 1)), t = r(bill * p / 100), total = r(bill + t);
    return { tip: t, total, each: r(total / n) };
  }
  /* profit, margin (of price) and markup (of cost) */
  function margin(cost, price) {
    const profit = r(price - cost);
    return { profit, margin: price === 0 ? NaN : r(profit / price * 100), markup: cost === 0 ? NaN : r(profit / cost * 100) };
  }
  /* compound growth: yearly table [{year, value, gain}] */
  function compound(principal, rate, years, perYear) {
    const k = Math.max(1, Math.floor(perYear || 1)), y = Math.max(0, Math.min(100, Math.floor(years))), rows = [];
    for (let i = 1; i <= y; i++) {
      const v = r(principal * Math.pow(1 + rate / 100 / k, k * i));
      rows.push({ year: i, value: v, gain: r(v - principal) });
    }
    return rows;
  }
  function cell(v) {
    let s = String(v);
    if (/^[=+\-@]/.test(s) && !/^-?\d/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(hist) {
    return 'time,calculation,result\r\n' + hist.map(h => [h.time, h.calc, h.result].map(cell).join(',')).join('\r\n') + (hist.length ? '\r\n' : '');
  }
  const PercentCalc = { points, proportion, cagr, r, num, pctOf, whatPct, change, apply, original, discount, vatAdd, vatRemove, tip, margin, compound, toCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = PercentCalc;
  else global.PercentCalc = PercentCalc;
})(typeof window !== 'undefined' ? window : globalThis);
