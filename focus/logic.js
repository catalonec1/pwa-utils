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
  /* Daily goal in work sessions (free feature). */
  const GOAL_DEFAULT = 4, GOAL_LIMITS = [1, 16];
  function sanitizeGoal(g) {
    let v = g === null || g === '' ? NaN : Math.round(Number(g));
    if (!Number.isFinite(v)) v = GOAL_DEFAULT;
    return Math.min(GOAL_LIMITS[1], Math.max(GOAL_LIMITS[0], v));
  }
  /* Consecutive days (ending today) whose sessions reached the goal. A today that is not
     reached yet does not break the streak: counting then starts from yesterday. */
  function streak(stats, today, goal) {
    const g = sanitizeGoal(goal);
    const d = new Date(today); d.setHours(12, 0, 0, 0);
    const met = x => ((stats[dayKey(x)] || {}).sessions || 0) >= g;
    if (!met(d)) d.setDate(d.getDate() - 1);
    let n = 0;
    while (met(d) && n < 3660) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function toCSV(stats) {
    const rows = Object.keys(stats).sort().map(k => `${k},${stats[k].sessions},${stats[k].minutes}`);
    return ['date,sessions,minutes'].concat(rows).join('\n') + '\n';
  }

  /* Tasks: [{ id, text, done, pomos }]. Pure helpers that return new arrays. */
  const TASK_MAX = 50, TASK_LEN = 120;
  function addTask(tasks, text, id) {
    const t = String(text || '').replace(/\s+/g, ' ').trim().slice(0, TASK_LEN);
    if (!t || tasks.length >= TASK_MAX) return tasks;
    return tasks.concat([{ id: String(id), text: t, done: false, pomos: 0 }]);
  }
  function toggleTask(tasks, id) { return tasks.map(t => t.id === id ? Object.assign({}, t, { done: !t.done }) : t); }
  function removeTask(tasks, id) { return tasks.filter(t => t.id !== id); }
  function clearDone(tasks) { return tasks.filter(t => !t.done); }
  function creditTask(tasks, id) { return tasks.map(t => t.id === id ? Object.assign({}, t, { pomos: t.pomos + 1 }) : t); }
  function sanitizeTasks(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(t => t && typeof t.text === 'string' && t.id != null).slice(0, TASK_MAX)
      .map(t => ({ id: String(t.id), text: t.text.slice(0, TASK_LEN), done: !!t.done, pomos: Math.max(0, Math.round(Number(t.pomos)) || 0) }));
  }
  function csvCell(v) {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function tasksCSV(tasks, minutesPerSession) {
    const rows = tasks.map(t => [csvCell(t.text), t.done ? 'yes' : 'no', t.pomos, t.pomos * (minutesPerSession || 25)].join(','));
    return ['task,done,sessions,minutes'].concat(rows).join('\n') + '\n';
  }

  /* Ambient noise samples in [-1, 1]. white: flat; pink: Paul Kellet's filter (-3 dB/octave);
     brown: leaky integration of white noise (-6 dB/octave). `rand` returns [0, 1). */
  const NOISES = ['white', 'pink', 'brown'];
  function fillNoise(kind, out, rand) {
    rand = rand || Math.random;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < out.length; i++) {
      const w = rand() * 2 - 1;
      let v;
      if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        v = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02; v = last * 3.5;
      } else v = w;
      out[i] = v;
    }
    /* Remove the drift between the last and first sample so a looped buffer has no click. */
    const n = out.length, drift = n > 1 ? out[n - 1] - out[0] : 0;
    for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, out[i] - drift * i / (n - 1)));
    return out;
  }

  const api = { TASK_MAX, TASK_LEN, addTask, toggleTask, removeTask, clearDone, creditTask, sanitizeTasks, tasksCSV, NOISES, fillNoise, DEFAULT_CFG, LIMITS, GOAL_DEFAULT, GOAL_LIMITS, sanitize, sanitizeGoal, streak, nextPhase, durationSec, fmt, dayKey, record, lastDays, toCSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Focus = api;
})(typeof window !== 'undefined' ? window : globalThis);
