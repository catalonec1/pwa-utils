(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Cronometru de concentrare', start: 'Start', pause: 'Pauză', resume: 'Continuă', reset: 'Resetează', skip: 'Sari', sound: 'Sunet', settings: 'Durate (minute)', work: 'Concentrare', short: 'Pauză scurtă', long: 'Pauză lungă', every: 'Pauză lungă la fiecare', stats: 'Ultimele 7 zile', csv: 'Exportă CSV', proPitch: 'Durate personalizate, statistici pe 7 zile și export CSV.', today: 'Azi: {n} sesiuni, {m} min', goal: 'Obiectiv zilnic (sesiuni)', streak: 'Serie: {n} zile la rând', goalDone: 'Obiectivul de azi e atins!', doneWork: 'Sesiune încheiată. Ia o pauză.', doneBreak: 'Pauza s-a terminat. Înapoi la treabă.' },
    en: { appName: 'Focus Timer – Pomodoro', start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', skip: 'Skip', sound: 'Sound', settings: 'Durations (minutes)', work: 'Focus', short: 'Short break', long: 'Long break', every: 'Long break every', stats: 'Last 7 days', csv: 'Export CSV', proPitch: 'Custom durations, 7-day statistics and CSV export.', today: 'Today: {n} sessions, {m} min', goal: 'Daily goal (sessions)', streak: 'Streak: {n} days in a row', goalDone: 'Today\'s goal reached!', doneWork: 'Session done. Take a break.', doneBreak: 'Break is over. Back to work.' },
    ru: { appName: 'Таймер фокуса – Помодоро', start: 'Старт', pause: 'Пауза', resume: 'Продолжить', reset: 'Сброс', skip: 'Пропустить', sound: 'Звук', settings: 'Длительность (минуты)', work: 'Фокус', short: 'Короткий перерыв', long: 'Длинный перерыв', every: 'Длинный перерыв каждые', stats: 'Последние 7 дней', csv: 'Экспорт CSV', proPitch: 'Свои длительности, статистика за 7 дней и экспорт CSV.', today: 'Сегодня: {n} сессий, {m} мин', goal: 'Цель на день (сессии)', streak: 'Серия: {n} дн. подряд', goalDone: 'Цель на сегодня выполнена!', doneWork: 'Сессия завершена. Отдохните.', doneBreak: 'Перерыв окончен. За работу.' }
  };
  const $ = id => document.getElementById(id);
  const load = (k, d) => { try { const v = JSON.parse(Core.store(k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => Core.store(k, JSON.stringify(v));

  let isPro = false;
  let cfg = Focus.sanitize(load('cfg', Focus.DEFAULT_CFG));
  let stats = load('stats', {});
  let goal = Focus.sanitizeGoal(load('goal', Focus.GOAL_DEFAULT));
  let st = load('state', null) || { phase: 'work', workDone: 0, endAt: null, remaining: null };
  const activeCfg = () => (isPro ? cfg : Focus.DEFAULT_CFG);
  if (st.remaining == null) st.remaining = Focus.durationSec(st.phase, activeCfg());

  function remaining() { return st.endAt ? (st.endAt - Date.now()) / 1000 : st.remaining; }

  function beep() {
    if (!$('sound').checked) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach(t => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.25);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3);
      });
    } catch (e) { /* no audio */ }
  }
  function notify(msg) {
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification(Core.t('appName'), { body: msg, icon: 'icons/icon-192.png' }); } catch (e) { /* ignore */ }
  }

  function finish(counted) {
    const was = st.phase;
    if (was === 'work' && counted) {
      st.workDone += 1;
      stats = record(stats);
    }
    st.phase = Focus.nextPhase(was, st.workDone, activeCfg());
    st.endAt = null;
    st.remaining = Focus.durationSec(st.phase, activeCfg());
    save('state', st);
    if (counted) { beep(); notify(Core.t(was === 'work' ? 'doneWork' : 'doneBreak')); }
    render();
  }
  function record(s) {
    const out = Focus.record(s, Date.now(), activeCfg().work);
    save('stats', out); return out;
  }

  function render() {
    const r = remaining();
    $('clock').textContent = Focus.fmt(r);
    $('phase').textContent = Core.t(st.phase);
    $('start').textContent = Core.t(st.endAt ? 'pause' : (r < Focus.durationSec(st.phase, activeCfg()) ? 'resume' : 'start'));
    document.title = (st.endAt ? Focus.fmt(r) + ' · ' : '') + Core.t('appName');
    const today = stats[Focus.dayKey(Date.now())] || { sessions: 0, minutes: 0 };
    $('today').textContent = Core.t('today', { n: today.sessions, m: today.minutes });
    if (document.activeElement !== $('goal')) $('goal').value = goal;
    $('goalBar').value = Math.min(today.sessions, goal); $('goalBar').max = goal;
    $('streak').textContent = Core.t('streak', { n: Focus.streak(stats, Date.now(), goal) }) + (today.sessions >= goal ? ' · ' + Core.t('goalDone') : '');
    ['work', 'short', 'long', 'every'].forEach(k => { const el = $('cfg-' + k); el.disabled = !isPro; if (document.activeElement !== el) el.value = activeCfg()[k]; });
    $('csv').disabled = !isPro;
    const days = Focus.lastDays(stats, Date.now(), 7);
    const max = Math.max(1, ...days.map(d => d.minutes));
    const bars = $('bars'); bars.innerHTML = '';
    days.forEach(d => {
      const col = document.createElement('div');
      const b = document.createElement('span'); b.className = 'b';
      b.style.height = (isPro ? (d.minutes / max) * 85 : 0) + '%';
      const lab = document.createElement('span'); lab.textContent = isPro ? `${d.day.slice(8)} · ${d.minutes}` : d.day.slice(8);
      col.title = `${d.day}: ${d.sessions} / ${d.minutes} min`;
      col.append(b, lab); bars.appendChild(col);
    });
  }

  function tick() {
    if (st.endAt && remaining() <= 0) finish(true);
    else if (st.endAt) { $('clock').textContent = Focus.fmt(remaining()); document.title = Focus.fmt(remaining()) + ' · ' + Core.t('appName'); }
  }

  Core.init(DICT, render);
  $('start').addEventListener('click', () => {
    if (st.endAt) { st.remaining = remaining(); st.endAt = null; }
    else {
      st.endAt = Date.now() + st.remaining * 1000;
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    }
    save('state', st); render();
  });
  $('reset').addEventListener('click', () => { st.endAt = null; st.remaining = Focus.durationSec(st.phase, activeCfg()); save('state', st); render(); });
  $('skip').addEventListener('click', () => finish(false));
  ['work', 'short', 'long', 'every'].forEach(k => $('cfg-' + k).addEventListener('change', () => {
    if (!isPro) return;
    cfg = Focus.sanitize(Object.assign({}, cfg, { [k]: $('cfg-' + k).value }));
    save('cfg', cfg);
    if (!st.endAt) st.remaining = Focus.durationSec(st.phase, cfg);
    save('state', st); render();
  }));
  $('goal').addEventListener('change', () => { goal = Focus.sanitizeGoal($('goal').value); save('goal', goal); render(); });
  $('csv').addEventListener('click', () => {
    const blob = new Blob([Focus.toCSV(stats)], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'focus-stats.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  if (st.endAt && remaining() <= 0) finish(true);
  render();
  setInterval(tick, 250);
  Core.wirePro(SKU, owned => {
    const changed = owned !== isPro;
    const wasFull = st.remaining === Focus.durationSec(st.phase, activeCfg());
    isPro = owned;
    if (changed && !st.endAt && wasFull) st.remaining = Focus.durationSec(st.phase, activeCfg());
    render();
  });
})();
