/* Habit tracker logic. Pure functions, no DOM.
   Zilele sunt chei 'YYYY-MM-DD' în ora LOCALĂ; calculele se fac pe numere de zi UTC,
   deci schimbarea orei (DST) nu mută niciodată o zi. */
(function (global) {
  'use strict';
  const FREE_LIMIT = 3;
  const p2 = n => String(n).padStart(2, '0');

  /* local calendar day of a Date (default: now) */
  function key(d) { d = d || new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function dayNum(k) { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  function fromDay(n) { const d = new Date(n * 864e5); return d.getUTCFullYear() + '-' + p2(d.getUTCMonth() + 1) + '-' + p2(d.getUTCDate()); }
  function valid(k) { return typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && fromDay(dayNum(k)) === k; }
  function addDays(k, n) { return fromDay(dayNum(k) + n); }
  function diff(a, b) { return dayNum(b) - dayNum(a); }
  /* 0 = Sunday … 6 = Saturday (1970-01-01 was a Thursday) */
  function dow(k) { return (((dayNum(k) + 4) % 7) + 7) % 7; }
  /* weeks start on Monday */
  function weekStart(k) { return addDays(k, -((dow(k) + 6) % 7)); }
  function monthDays(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function addMonths(y, m, n) { const t = y * 12 + (m - 1) + n; return { y: Math.floor(t / 12), m: (t % 12) + 1 }; }
  /* Monday-first calendar: array of weeks, each 7 keys or null */
  function monthGrid(y, m) {
    const first = y + '-' + p2(m) + '-01', cells = [];
    for (let i = (dow(first) + 6) % 7; i > 0; i--) cells.push(null);
    for (let d = 0; d < monthDays(y, m); d++) cells.push(addDays(first, d));
    while (cells.length % 7) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }

  function sched(h) {
    const s = (h && h.sched) || {};
    if (s.t === 'days' && Array.isArray(s.d)) {
      const d = [...new Set(s.d.map(Number).filter(x => Number.isInteger(x) && x >= 0 && x <= 6))].sort();
      if (d.length) return { t: 'days', d };
    }
    if (s.t === 'times' && Number.isInteger(+s.n) && +s.n >= 1 && +s.n <= 7) return { t: 'times', n: +s.n };
    return { t: 'daily' };
  }
  function scheduled(h, k) { const s = sched(h); return s.t !== 'days' || s.d.includes(dow(k)); }
  function isDone(h, k) { return !!(h.done && h.done[k]); }
  function toggle(h, k) { h.done = h.done || {}; if (h.done[k]) delete h.done[k]; else h.done[k] = 1; return !!h.done[k]; }
  /* first day the habit counts: creation day or an earlier check-off */
  function start(h, today) {
    let s = valid(h.created) && h.created < today ? h.created : today;
    for (const k in h.done || {}) if (h.done[k] && k < s) s = k;
    return s;
  }
  function weekCount(h, k) { const w = weekStart(k); let c = 0; for (let i = 0; i < 7; i++) if (isDone(h, addDays(w, i))) c++; return c; }

  /* Streaks. Today (or the current week) not yet done never breaks the streak. */
  function streaks(h, today) {
    const s = sched(h), from = start(h, today);
    let best = 0, run = 0;
    if (s.t === 'times') {
      const last = weekStart(today);
      for (let w = weekStart(from); w <= last; w = addDays(w, 7)) {
        if (weekCount(h, w) >= s.n) { run++; if (run > best) best = run; } else if (w !== last) run = 0;
      }
      return { current: run, best, unit: 'w' };
    }
    for (let k = from; k <= today; k = addDays(k, 1)) {
      if (!scheduled(h, k)) continue;
      if (isDone(h, k)) { run++; if (run > best) best = run; } else if (k !== today) run = 0;
    }
    return { current: run, best, unit: 'd' };
  }

  function dueToday(h, today) {
    const s = sched(h);
    if (s.t === 'times') return isDone(h, today) || weekCount(h, today) < s.n;
    return scheduled(h, today);
  }
  function summary(habits, today) {
    const due = habits.filter(h => dueToday(h, today));
    return { due: due.length, done: due.filter(h => isDone(h, today)).length, left: due.filter(h => !isDone(h, today)).map(h => h.name) };
  }

  /* share of planned habits done on day k: null = nothing planned; extra check-offs count as a bonus */
  function dayRate(habits, k, today) {
    let due = 0, done = 0;
    for (const h of habits) {
      if (k < start(h, today) || k > today) continue;
      const d = isDone(h, k), s = sched(h);
      if (s.t === 'times' ? d : (scheduled(h, k) || d)) { due++; if (d) done++; }
    }
    return due ? done / due : null;
  }
  function level(rate) { return rate == null || rate <= 0 ? 0 : rate < 0.34 ? 1 : rate < 0.67 ? 2 : rate < 1 ? 3 : 4; }

  /* Pro: completion of one habit in month y-m, up to today */
  function monthStats(h, y, m, today) {
    const s = sched(h), from = start(h, today), first = y + '-' + p2(m) + '-01';
    let due = 0, done = 0, days = 0;
    for (let i = 0; i < monthDays(y, m); i++) {
      const k = addDays(first, i);
      if (k < from || k > today) continue;
      days++;
      if (s.t === 'times') { if (isDone(h, k)) done++; } else if (scheduled(h, k)) { due++; if (isDone(h, k)) done++; }
    }
    if (s.t === 'times') due = Math.round(s.n * days / 7 * 10) / 10;
    return { done, due, pct: due > 0 ? Math.min(100, Math.round(done / due * 100)) : null };
  }
  /* Pro: completion rate by weekday between from and to (inclusive) */
  function weekdayRates(habits, from, to) {
    const done = Array(7).fill(0), due = Array(7).fill(0);
    for (const h of habits) {
      const s = sched(h), st = start(h, to);
      for (let k = st > from ? st : from; k <= to; k = addDays(k, 1)) {
        if (s.t !== 'times' && !scheduled(h, k)) continue;
        const d = dow(k); due[d]++; if (isDone(h, k)) done[d]++;
      }
    }
    const rates = due.map((n, i) => n ? done[i] / n : null);
    let best = null;
    rates.forEach((r, i) => { if (r != null && r > 0 && (best == null || r > rates[best])) best = i; });
    return { rates, best };
  }

  function canAdd(habits, pro) { return !!pro || habits.length < FREE_LIMIT; }
  function newId(habits, rnd) {
    const ids = new Set(habits.map(h => h.id));
    let id;
    do id = 'h' + Math.floor((rnd || Math.random)() * 1e9).toString(36); while (ids.has(id));
    return id;
  }

  /* backup: validate and clean any parsed object; throws Error('format') */
  function normalize(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.habits)) throw new Error('format');
    const out = [];
    for (const h of data.habits) {
      if (!h || typeof h.name !== 'string' || !h.name.trim()) continue;
      const done = {}, notes = {};
      if (h.done && typeof h.done === 'object') for (const k in h.done) if (h.done[k] && valid(k)) done[k] = 1;
      if (h.notes && typeof h.notes === 'object') for (const k in h.notes) if (valid(k) && typeof h.notes[k] === 'string' && h.notes[k].trim()) notes[k] = h.notes[k].trim().slice(0, 1000);
      const id = typeof h.id === 'string' && /^[\w-]{1,40}$/.test(h.id) && !out.some(o => o.id === h.id) ? h.id : newId(out);
      out.push({
        id, name: h.name.trim().slice(0, 80),
        sched: sched(h),
        color: typeof h.color === 'string' && /^#[0-9a-f]{6}$/i.test(h.color) ? h.color.toLowerCase() : null,
        emoji: typeof h.emoji === 'string' ? Array.from(h.emoji.trim()).slice(0, 2).join('') : '',
        created: valid(h.created) ? h.created : null,
        done, notes
      });
    }
    return { v: 1, habits: out };
  }
  function exportJson(data, now) { return JSON.stringify({ app: 'stelar-habit-tracker', v: 1, exported: now || '', habits: normalize(data).habits }, null, 2); }
  function importJson(text) {
    let d;
    try { d = JSON.parse(text); } catch (e) { throw new Error('format'); }
    return normalize(d);
  }
  function csvCell(v) { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function toCsv(habits) {
    const rows = [];
    habits.forEach((h, i) => {
      const keys = new Set(Object.keys(h.done || {}).concat(Object.keys(h.notes || {})));
      for (const k of keys) rows.push([k, i, h.name, isDone(h, k) ? 1 : 0, (h.notes || {})[k] || '']);
    });
    rows.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]);
    return ['date,habit,done,note'].concat(rows.map(r => [r[0], r[2], r[3], r[4]].map(csvCell).join(','))).join('\r\n') + '\r\n';
  }

  const HabitLogic = { FREE_LIMIT, key, dayNum, fromDay, valid, addDays, diff, dow, weekStart, monthDays, addMonths, monthGrid, sched, scheduled, isDone, toggle, start, weekCount, streaks, dueToday, summary, dayRate, level, monthStats, weekdayRates, canAdd, newId, normalize, exportJson, importJson, toCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = HabitLogic;
  else global.HabitLogic = HabitLogic;
})(typeof window !== 'undefined' ? window : globalThis);
