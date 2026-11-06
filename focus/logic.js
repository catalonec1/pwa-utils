/* Pomodoro timer logic: phases, durations, stats. Pure functions, no DOM. */
(function (global) {
  'use strict';
  const DEFAULT_CFG = { work: 25, short: 5, long: 15, every: 4 };
  const LIMITS = { work: [1, 180], short: [1, 60], long: [1, 90], every: [2, 12] };

  function sanitize(cfg) {
    const out = {};
    for (const k in DEFAULT_CFG) {
      const raw = cfg ? cfg[k] : undefined;
      let v = raw === null || raw === '' ? NaN : Math.round(Number(raw));
      if (!Number.isFinite(v)) v = DEFAULT_CFG[k];
      out[k] = Math.min(LIMITS[k][1], Math.max(LIMITS[k][0], v));
    }
    return out;
  }
  /* After finishing `phase`, given how many work sessions are done (including this one). */
  function nextPhase(phase, workDone, cfg) {
    const c = sanitize(cfg);
    if (phase !== 'work') return 'work';
    return workDone > 0 && workDone % c.every === 0 ? 'long' : 'short';
  }
  function durationSec(phase, cfg) { return sanitize(cfg)[phase] * 60; }
  function fmt(sec) {
    sec = Math.max(0, Math.ceil(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  function dayKey(d) {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }
  /* stats: { 'YYYY-MM-DD': { sessions: n, minutes: m } } */
  function record(stats, when, minutes) {
    const s = Object.assign({}, stats);
    const k = dayKey(when);
    const cur = s[k] || { sessions: 0, minutes: 0 };
    s[k] = { sessions: cur.sessions + 1, minutes: cur.minutes + minutes };
    return s;
  }
  function lastDays(stats, today, n) {
    const out = [];
    const base = new Date(today);
    base.setHours(12, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(base); d.setDate(base.getDate() - i);
      const k = dayKey(d);
      out.push(Object.assign({ day: k }, stats[k] || { sessions: 0, minutes: 0 }));
    }
    return out;
  }
  function toCSV(stats) {
    const rows = Object.keys(stats).sort().map(k => `${k},${stats[k].sessions},${stats[k].minutes}`);
    return ['date,sessions,minutes'].concat(rows).join('\n') + '\n';
  }

  const api = { DEFAULT_CFG, LIMITS, sanitize, nextPhase, durationSec, fmt, dayKey, record, lastDays, toCSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Focus = api;
})(typeof window !== 'undefined' ? window : globalThis);
