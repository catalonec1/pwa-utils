/* Date calculator logic. Pure functions, no DOM. Dates are calendar days ('YYYY-MM-DD'), computed in UTC so time zones and DST never shift a day. */
(function (global) {
  'use strict';
  const DAY = 86400000;
  const RE = /^(\d{4})-(\d{2})-(\d{2})$/;

  function parse(s) {
    const m = RE.exec(String(s || '').trim());
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const t = Date.UTC(y, mo - 1, d);
    const dt = new Date(t);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return t;
  }
  function fmt(t) { return new Date(t).toISOString().slice(0, 10); }
  function today() { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); }
  function weekday(t) { return new Date(t).getUTCDay(); } /* 0 = Sunday */
  function isWeekend(t) { const w = weekday(t); return w === 0 || w === 6; }

  /* Whole days from a to b (negative if b is earlier). */
  function diffDays(a, b) { return Math.round((b - a) / DAY); }
  function addDays(t, n) { return t + n * DAY; }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
  /* Adds months, clamping to the last day (31 Jan + 1 month = 28/29 Feb). */
  function addMonths(t, n) {
    const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + n;
    const ty = y + Math.floor(m / 12), tm = ((m % 12) + 12) % 12;
    return Date.UTC(ty, tm, Math.min(d.getUTCDate(), daysInMonth(ty, tm)));
  }
  /* Calendar difference as years, months, days (a <= b is swapped if needed). */
  function ymd(a, b) {
    let sign = 1;
    if (b < a) { [a, b] = [b, a]; sign = -1; }
    const A = new Date(a), B = new Date(b);
    let total = (B.getUTCFullYear() - A.getUTCFullYear()) * 12 + (B.getUTCMonth() - A.getUTCMonth());
    if (addMonths(a, total) > b) total--;
    return { years: Math.floor(total / 12), months: total % 12, days: diffDays(addMonths(a, total), b), sign };
  }
  function isoWeek(t) {
    const d = new Date(t), wd = (d.getUTCDay() + 6) % 7; /* Monday = 0 */
    const th = t + (3 - wd) * DAY; /* Thursday of this week */
    const y = new Date(th).getUTCFullYear();
    return { week: 1 + Math.floor(diffDays(Date.UTC(y, 0, 1), th) / 7), year: y };
  }
  function dayOfYear(t) { return diffDays(Date.UTC(new Date(t).getUTCFullYear(), 0, 1), t) + 1; }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }

  function holidaySet(list) {
    const s = new Set();
    for (const x of list || []) { const t = typeof x === 'number' ? x : parse(x); if (t != null) s.add(t); }
    return s;
  }
  /* Parses free text: one date per line or separated by commas/spaces; returns {dates, bad}. */
  function parseList(text) {
    const dates = [], bad = [];
    for (const tok of String(text || '').split(/[\s,;]+/)) {
      if (!tok) continue;
      const t = parse(tok);
      if (t == null) bad.push(tok); else dates.push(fmt(t));
    }
    return { dates: [...new Set(dates)].sort(), bad };
  }
  /* weekend: weekday numbers that are days off every week (0 = Sunday); default Saturday + Sunday. */
  function weekendSet(weekend) {
    const w = Array.isArray(weekend) ? weekend.filter(d => Number.isInteger(d) && d >= 0 && d <= 6) : [0, 6];
    return new Set(w);
  }
  function isWorkday(t, hol, we) { return !(we ? we.has(weekday(t)) : isWeekend(t)) && !hol.has(t); }
  /* Working days from a to b, counting both ends when includeEnd (default: start excluded, end included, like "days between"). */
  function workdaysBetween(a, b, holidays, includeStart, weekend) {
    const hol = holidaySet(holidays), we = weekendSet(weekend);
    let sign = 1;
    if (b < a) { [a, b] = [b, a]; sign = -1; }
    let n = 0;
    for (let t = includeStart ? a : addDays(a, 1); t <= b; t = addDays(t, 1)) if (isWorkday(t, hol, we)) n++;
    return n * sign;
  }
  /* Moves n working days from t (n may be negative). Returns null when every weekday is a day off. */
  function addWorkdays(t, n, holidays, weekend) {
    const hol = holidaySet(holidays), we = weekendSet(weekend), step = n < 0 ? -1 : 1;
    if (we.size >= 7) return n === 0 ? t : null;
    let left = Math.abs(n);
    while (left > 0) { t = addDays(t, step); if (isWorkday(t, hol, we)) left--; }
    return t;
  }
  /* Age on a given day: calendar years/months/days, total days and the next birthday.
     A 29 February birthday falls on 28 February in common years. */
  function age(birth, on) {
    if (birth > on) return null;
    const r = ymd(birth, on);
    let next = addMonths(birth, 12 * r.years);
    if (next < on) next = addMonths(birth, 12 * (r.years + 1));
    return { years: r.years, months: r.months, days: r.days, totalDays: diffDays(birth, on), next, toNext: diffDays(on, next) };
  }

  /* Countdowns: [{name, date}] -> sorted with days left from 'from'. */
  function countdowns(list, from) {
    return (list || []).map(e => ({ name: e.name, date: e.date, left: diffDays(from, parse(e.date)) }))
      .filter(e => !Number.isNaN(e.left)).sort((x, y) => x.left - y.left);
  }
  function csvCell(v) {
    let s = String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return /[",\r\n']/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(rows) {
    return ['name,date,days_left'].concat(rows.map(r => [r.name, r.date, r.left].map(csvCell).join(','))).join('\r\n') + '\r\n';
  }

  const DateCalc = { age, parse, fmt, today, weekday, isWeekend, diffDays, addDays, addMonths, ymd, isoWeek, dayOfYear, isLeap, parseList, workdaysBetween, addWorkdays, countdowns, toCsv, DAY };
  global.DateCalc = DateCalc;
  if (typeof module !== 'undefined') module.exports = DateCalc;
})(typeof window !== 'undefined' ? window : globalThis);
