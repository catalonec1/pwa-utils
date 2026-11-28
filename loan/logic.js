/* Loan & mortgage calculator logic. Pure functions, no DOM.
   Sumele lunare se rotunjesc la cenți (ca la bănci); ultima rată închide soldul exact. */
(function (global) {
  'use strict';
  const MAX_MONTHS = 1200;
  function c2(x) { return Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100; }
  function num(s) {
    if (typeof s === 'number') return s;
    const t = String(s == null ? '' : s).trim().replace(/[\s ']/g, '').replace(',', '.');
    return t === '' || !/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(t) ? NaN : +t;
  }
  function valid(P, rate, n) { return P > 0 && rate >= 0 && rate < 1000 && n >= 1 && n <= MAX_MONTHS; }

  /* annuity monthly payment for principal P, annual rate % and n months */
  function payment(P, rate, n) {
    if (!valid(P, rate, n)) return NaN;
    const r = rate / 1200;
    return c2(r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n)));
  }
  /* months needed to repay P with a fixed payment (NaN if the payment does not cover the interest) */
  function termRaw(P, rate, pay) {
    if (!(P > 0 && pay > 0 && rate >= 0)) return NaN;
    const r = rate / 1200;
    if (r === 0) return P / pay;
    if (pay <= c2(P * r)) return NaN;
    return -Math.log(1 - r * P / pay) / Math.log(1 + r);
  }
  function termFor(P, rate, pay) { const n = termRaw(P, rate, pay); return Number.isFinite(n) ? Math.max(1, Math.ceil(n - 0.01)) : NaN; } // toleranță: rotunjirea la cenți se închide în ultima rată
  /* largest principal that a fixed payment repays in n months */
  function principalFor(pay, rate, n) {
    if (!(pay > 0 && rate >= 0 && n >= 1 && n <= MAX_MONTHS)) return NaN;
    const r = rate / 1200;
    return c2(r === 0 ? pay * n : pay * (1 - Math.pow(1 + r, -n)) / r);
  }

  /* affordability estimate: payment limit = income × share% − other monthly payments, then the largest principal it repays (equal payments) */
  function affordable(income, debts, sharePct, rate, n) {
    const d = Number.isFinite(debts) ? debts : 0;
    if (!(income > 0 && sharePct > 0 && sharePct <= 100 && d >= 0 && rate >= 0 && n >= 1 && n <= MAX_MONTHS)) return null;
    const pay = c2(income * sharePct / 100 - d);
    if (!(pay > 0)) return { payment: 0, principal: 0 };
    return { payment: pay, principal: principalFor(pay, rate, n) };
  }

  /* data for the amortization chart: per year principal (incl. extra) and interest, balance at the start and after each year */
  function chartModel(rows) {
    if (!rows || !rows.length) return null;
    const y = yearly(rows), r0 = rows[0], start = c2(r0.balance + r0.principal + r0.extra);
    return {
      years: y.map(g => g.year), principal: y.map(g => g.principal), interest: y.map(g => g.interest),
      balance: [start].concat(y.map(g => g.balance)), maxPaid: Math.max.apply(null, y.map(g => c2(g.principal + g.interest))), start
    };
  }

  /* Full monthly schedule.
     o = { principal, rate, months, type: 'annuity'|'linear',
           extras: [{ month, amount }], recurring: { amount, from },   // plăți anticipate: scurtează termenul
           rateChange: { month, rate } }                              // dobândă nouă de la luna month+1
     Returns { rows: [{ month, rate, payment, interest, principal, extra, balance }], months, totalInterest, totalPaid, totalExtra } */
  function schedule(o) {
    const P = o.principal, n = Math.floor(o.months);
    if (!valid(P, o.rate, n)) return null;
    const linear = o.type === 'linear';
    const once = {};
    for (const e of o.extras || []) { const m = Math.floor(e.month), a = +e.amount; if (m >= 1 && a > 0) once[m] = (once[m] || 0) + a; }
    const rec = o.recurring && o.recurring.amount > 0 ? { amount: +o.recurring.amount, from: Math.max(1, Math.floor(o.recurring.from || 1)) } : null;
    const rc = o.rateChange && o.rateChange.month >= 1 && o.rateChange.rate >= 0 && o.rateChange.rate < 1000 ? o.rateChange : null;
    let rate = o.rate, bal = P, pay = linear ? 0 : payment(P, rate, n), part = c2(P / n), end = n;
    const rows = [];
    let ti = 0, tp = 0, te = 0;
    for (let m = 1; bal > 0.004 && m <= MAX_MONTHS; m++) {
      if (rc && m === Math.floor(rc.month) + 1 && rc.rate !== rate) {
        // rata se recalculează pe termenul rămas estimat (cu plățile anticipate deja făcute)
        const left = linear ? 0 : Math.ceil((termRaw(bal, rate, pay) || n - m + 1) - 0.05); // toleranță pentru rotunjirea la cenți
        rate = rc.rate;
        if (!linear) { pay = payment(bal, rate, Math.max(1, left)); end = m - 1 + Math.max(1, left); }
      }
      const interest = c2(bal * rate / 1200);
      let princ = linear ? part : c2(pay - interest);
      if (princ > bal || m >= end) princ = bal; // ultima rată închide soldul
      if (!linear && princ <= 0) return null; // plata nu acoperă dobânda
      bal = c2(bal - princ);
      let extra = (once[m] || 0) + (rec && m >= rec.from ? rec.amount : 0);
      extra = c2(Math.min(extra, bal));
      bal = c2(bal - extra);
      const paid = c2(interest + princ);
      rows.push({ month: m, rate, payment: paid, interest, principal: princ, extra, balance: bal });
      ti += interest; tp += paid + extra; te += extra;
    }
    return { rows, months: rows.length, totalInterest: c2(ti), totalPaid: c2(tp), totalExtra: c2(te) };
  }

  /* summary by year: [{ year, paid, principal, interest, extra, balance }] */
  function yearly(rows) {
    const out = [];
    for (const r of rows) {
      const y = Math.ceil(r.month / 12);
      let g = out[out.length - 1];
      if (!g || g.year !== y) { g = { year: y, paid: 0, principal: 0, interest: 0, extra: 0, balance: 0 }; out.push(g); }
      g.paid = c2(g.paid + r.payment + r.extra); g.principal = c2(g.principal + r.principal + r.extra);
      g.interest = c2(g.interest + r.interest); g.extra = c2(g.extra + r.extra); g.balance = r.balance;
    }
    return out;
  }

  /* effective annual rate (incl. upfront fees), from the actual cash flows; percent */
  function effectiveRate(principal, fee, rows) {
    const net = principal - (fee || 0);
    if (!(net > 0) || !rows || !rows.length) return NaN;
    const pv = r => rows.reduce((s, x, i) => s + (x.payment + x.extra) / Math.pow(1 + r, i + 1), 0);
    let lo = -0.99, hi = 1;
    if (pv(hi) > net || pv(lo) < net) return NaN;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (pv(mid) > net) lo = mid; else hi = mid; }
    return Math.round((Math.pow(1 + lo, 12) - 1) * 1e6) / 1e4;
  }

  /* compare offers: [{ name, principal, rate, months, type, fee }] → summary rows + index of the cheapest */
  function compare(offers) {
    const res = offers.map(o => {
      const s = schedule(o);
      if (!s) return null;
      const fee = o.fee > 0 ? c2(o.fee) : 0;
      return { name: o.name, first: s.rows[0].payment, last: s.rows[s.rows.length - 1].payment, months: s.months,
        totalInterest: s.totalInterest, fee, totalCost: c2(s.totalInterest + fee), totalPaid: c2(s.totalPaid + fee),
        effRate: effectiveRate(o.principal, fee, s.rows) };
    });
    let best = -1;
    res.forEach((r, i) => { if (r && (best < 0 || r.totalCost < res[best].totalCost)) best = i; });
    return { offers: res, best };
  }

  function cell(v) {
    let s = String(v);
    if (/^[=+\-@]/.test(s) && !/^-?\d/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(rows) {
    const head = 'month,rate_pct,payment,interest,principal,extra,balance\r\n';
    return head + rows.map(r => [r.month, r.rate, r.payment.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.extra.toFixed(2), r.balance.toFixed(2)].map(cell).join(',')).join('\r\n') + (rows.length ? '\r\n' : '');
  }

  const LoanCalc = { MAX_MONTHS, c2, num, payment, termFor, principalFor, affordable, chartModel, schedule, yearly, effectiveRate, compare, toCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = LoanCalc;
  else global.LoanCalc = LoanCalc;
})(typeof window !== 'undefined' ? window : globalThis);
