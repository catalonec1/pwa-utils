(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Cronometru de concentrare', start: 'Start', pause: 'Pauză', resume: 'Continuă', reset: 'Resetează', skip: 'Sari', sound: 'Sunet', settings: 'Durate (minute)', work: 'Concentrare', short: 'Pauză scurtă', long: 'Pauză lungă', every: 'Pauză lungă la fiecare', stats: 'Ultimele 7 zile', csv: 'Exportă CSV', proPitch: 'Durate personalizate, sunete ambientale în timpul concentrării, statistici pe 7 zile și export CSV al statisticilor și sarcinilor.', autoStart: 'Pornește automat etapa următoare', tasks: 'Sarcini', taskLabel: 'La ce lucrezi?', add: 'Adaugă', tasksHint: 'Atinge o sarcină ca s-o faci curentă: fiecare sesiune de concentrare încheiată se numără la ea.', clearDone: 'Șterge cele terminate', tasksCsv: 'Exportă sarcinile CSV', del: 'Șterge', taskDone: 'Terminată', sessionsN: '{n} ses.', ambient: 'Sunet ambiental', ambKind: 'Zgomot în timpul concentrării', ambOff: 'Oprit', ambWhite: 'Zgomot alb', ambPink: 'Zgomot roz (ca ploaia)', ambBrown: 'Zgomot maro (vuiet adânc)', ambVol: 'Volum', ambHint: 'Se aude doar cât rulează o sesiune de concentrare și se oprește în pauze. Generat pe dispozitiv, fără fișiere.', today: 'Azi: {n} sesiuni, {m} min', goal: 'Obiectiv zilnic (sesiuni)', streak: 'Serie: {n} zile la rând', goalDone: 'Obiectivul de azi e atins!', doneWork: 'Sesiune încheiată. Ia o pauză.', doneBreak: 'Pauza s-a terminat. Înapoi la treabă.' },
    en: { appName: 'Focus Timer – Pomodoro', start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', skip: 'Skip', sound: 'Sound', settings: 'Durations (minutes)', work: 'Focus', short: 'Short break', long: 'Long break', every: 'Long break every', stats: 'Last 7 days', csv: 'Export CSV', proPitch: 'Custom durations, ambient sounds while you focus, 7-day statistics and CSV export of statistics and tasks.', autoStart: 'Start next phase automatically', tasks: 'Tasks', taskLabel: 'What are you working on?', add: 'Add', tasksHint: 'Tap a task to make it current: each finished focus session is counted on it.', clearDone: 'Remove done', tasksCsv: 'Export tasks CSV', del: 'Delete', taskDone: 'Done', sessionsN: '{n} sess.', ambient: 'Ambient sound', ambKind: 'Noise while you focus', ambOff: 'Off', ambWhite: 'White noise', ambPink: 'Pink noise (rain-like)', ambBrown: 'Brown noise (deep rumble)', ambVol: 'Volume', ambHint: 'Plays only while a focus session is running and stops on breaks. Generated on your device, no files.', today: 'Today: {n} sessions, {m} min', goal: 'Daily goal (sessions)', streak: 'Streak: {n} days in a row', goalDone: 'Today\'s goal reached!', doneWork: 'Session done. Take a break.', doneBreak: 'Break is over. Back to work.' },
    ru: { appName: 'Таймер фокуса – Помодоро', start: 'Старт', pause: 'Пауза', resume: 'Продолжить', reset: 'Сброс', skip: 'Пропустить', sound: 'Звук', settings: 'Длительность (минуты)', work: 'Фокус', short: 'Короткий перерыв', long: 'Длинный перерыв', every: 'Длинный перерыв каждые', stats: 'Последние 7 дней', csv: 'Экспорт CSV', proPitch: 'Свои длительности, фоновые звуки во время фокуса, статистика за 7 дней и экспорт статистики и задач в CSV.', autoStart: 'Автоматически запускать следующий этап', tasks: 'Задачи', taskLabel: 'Над чем вы работаете?', add: 'Добавить', tasksHint: 'Нажмите на задачу, чтобы сделать её текущей: каждая завершённая сессия фокуса засчитывается ей.', clearDone: 'Удалить выполненные', tasksCsv: 'Экспорт задач в CSV', del: 'Удалить', taskDone: 'Выполнено', sessionsN: '{n} сес.', ambient: 'Фоновый звук', ambKind: 'Шум во время фокуса', ambOff: 'Выкл.', ambWhite: 'Белый шум', ambPink: 'Розовый шум (как дождь)', ambBrown: 'Коричневый шум (низкий гул)', ambVol: 'Громкость', ambHint: 'Звучит только во время сессии фокуса и выключается на перерывах. Создаётся на устройстве, без файлов.', today: 'Сегодня: {n} сессий, {m} мин', goal: 'Цель на день (сессии)', streak: 'Серия: {n} дн. подряд', goalDone: 'Цель на сегодня выполнена!', doneWork: 'Сессия завершена. Отдохните.', doneBreak: 'Перерыв окончен. За работу.' }
  };
  const $ = id => document.getElementById(id);
  const load = (k, d) => { try { const v = JSON.parse(Core.store(k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => Core.store(k, JSON.stringify(v));

  let isPro = false;
  let cfg = Focus.sanitize(load('cfg', Focus.DEFAULT_CFG));
  let stats = load('stats', {});
  let goal = Focus.sanitizeGoal(load('goal', Focus.GOAL_DEFAULT));
  let tasks = Focus.sanitizeTasks(load('tasks', []));
  let curTask = load('curTask', null);
  let ambient = Object.assign({ kind: 'off', vol: 40 }, load('ambient', {}));
  if (!Focus.NOISES.includes(ambient.kind)) ambient.kind = 'off';
  ambient.vol = Math.min(100, Math.max(0, Math.round(Number(ambient.vol)) || 0));
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
      const cur = currentTask();
      if (cur) { tasks = Focus.creditTask(tasks, cur.id); save('tasks', tasks); }
    }
    st.phase = Focus.nextPhase(was, st.workDone, activeCfg());
    st.endAt = null;
    st.remaining = Focus.durationSec(st.phase, activeCfg());
    if (counted && $('autoStart').checked) st.endAt = Date.now() + st.remaining * 1000;
    save('state', st);
    if (counted) { beep(); notify(Core.t(was === 'work' ? 'doneWork' : 'doneBreak')); }
    render();
  }
  function record(s) {
    const out = Focus.record(s, Date.now(), activeCfg().work);
    save('stats', out); return out;
  }

  function currentTask() { return tasks.find(t => t.id === curTask && !t.done) || null; }

  /* Ambient noise (Pro): a looped buffer generated with Web Audio, only during a running focus phase. */
  let audio = null;
  function syncAmbient() {
    const kind = isPro ? ambient.kind : 'off';
    const want = kind !== 'off' && !!st.endAt && st.phase === 'work';
    try {
      if (!want) {
        if (audio && audio.src) { audio.src.stop(); audio.src = null; }
        document.body.dataset.ambient = '';
        return;
      }
      if (!audio) audio = { ctx: new (window.AudioContext || window.webkitAudioContext)(), src: null, gain: null, kind: null };
      const vol = (ambient.vol / 100) * 0.5;
      if (audio.src && audio.kind === kind) { audio.gain.gain.value = vol; return; }
      if (audio.src) audio.src.stop();
      const ctx = audio.ctx;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      Focus.fillNoise(kind, buf.getChannelData(0));
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const g = ctx.createGain(); g.gain.value = vol;
      src.connect(g); g.connect(ctx.destination); src.start();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      Object.assign(audio, { src, gain: g, kind });
      document.body.dataset.ambient = kind;
    } catch (e) { /* no audio */ }
  }

  function renderTasks() {
    const ul = $('tasks'); ul.innerHTML = '';
    tasks.forEach(t => {
      const li = document.createElement('li');
      li.className = (t.done ? 'done' : '') + (t.id === curTask && !t.done ? ' current' : '');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = t.done; cb.setAttribute('aria-label', Core.t('taskDone'));
      cb.addEventListener('change', () => { tasks = Focus.toggleTask(tasks, t.id); save('tasks', tasks); render(); });
      const name = document.createElement('button'); name.className = 'name'; name.textContent = t.text;
      name.setAttribute('aria-pressed', String(t.id === curTask && !t.done));
      name.addEventListener('click', () => { if (t.done) return; curTask = curTask === t.id ? null : t.id; save('curTask', curTask); render(); });
      const n = document.createElement('span'); n.className = 'n'; n.textContent = Core.t('sessionsN', { n: t.pomos });
      const del = document.createElement('button'); del.className = 'del'; del.textContent = '×'; del.setAttribute('aria-label', Core.t('del'));
      del.addEventListener('click', () => { tasks = Focus.removeTask(tasks, t.id); save('tasks', tasks); render(); });
      li.append(cb, name, n, del); ul.appendChild(li);
    });
    $('clearDone').disabled = !tasks.some(t => t.done);
    $('tasksCsv').disabled = !isPro || !tasks.length;
  }

  function render() {
    const r = remaining();
    $('clock').textContent = Focus.fmt(r);
    const cur = currentTask();
    $('phase').textContent = Core.t(st.phase) + (st.phase === 'work' && cur ? ' · ' + cur.text : '');
    renderTasks();
    $('ambKind').disabled = $('ambVol').disabled = !isPro;
    $('ambKind').value = ambient.kind; $('ambVol').value = ambient.vol;
    syncAmbient();
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
  function download(text, file) {
    const blob = new Blob([text], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  $('csv').addEventListener('click', () => download(Focus.toCSV(stats), 'focus-stats.csv'));
  $('tasksCsv').addEventListener('click', () => { if (isPro) download(Focus.tasksCSV(tasks, activeCfg().work), 'focus-tasks.csv'); });
  $('taskForm').addEventListener('submit', e => {
    e.preventDefault();
    const before = tasks.length;
    tasks = Focus.addTask(tasks, $('taskText').value, Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    if (tasks.length > before) {
      if (!currentTask()) { curTask = tasks[tasks.length - 1].id; save('curTask', curTask); }
      save('tasks', tasks); $('taskText').value = '';
    }
    render();
  });
  $('clearDone').addEventListener('click', () => { tasks = Focus.clearDone(tasks); save('tasks', tasks); render(); });
  $('autoStart').checked = load('autoStart', false) === true;
  $('autoStart').addEventListener('change', () => save('autoStart', $('autoStart').checked));
  $('ambKind').addEventListener('change', () => { ambient.kind = Focus.NOISES.includes($('ambKind').value) ? $('ambKind').value : 'off'; save('ambient', ambient); render(); });
  $('ambVol').addEventListener('input', () => { ambient.vol = Number($('ambVol').value); save('ambient', ambient); syncAmbient(); });
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
