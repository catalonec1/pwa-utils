(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Obiceiuri zilnice', todayTitle: 'Azi', weekTitle: 'Săptămâna', monthTitle: 'Luna', habitsTitle: 'Obiceiuri', prev: 'Înapoi', next: 'Înainte', allHabits: 'Toate obiceiurile', less: 'Mai puțin', more: 'Mai mult', name: 'Nume', namePh: 'ex. Citesc 10 pagini', schedule: 'Program', sDaily: 'În fiecare zi', sDays: 'În anumite zile', sTimes: 'De N ori pe săptămână', timesN: 'Ori pe săpt.', color: 'Culoare', emoji: 'Emoji', add: 'Adaugă obiceiul', save: 'Salvează', cancel: 'Renunță', edit: 'Editează', del: 'Șterge', notesTitle: 'Notițe', notesHint: 'O notiță scurtă pentru o zi: cum a mers, ce a ajutat.', habit: 'Obicei', date: 'Data', note: 'Notiță', saveNote: 'Salvează notița', statsTitle: 'Statistici', statsHint: 'Cât ai bifat la fiecare obicei în luna de mai sus și cea mai bună zi a săptămânii (ultimele 12 săptămâni).', backupTitle: 'Copie de siguranță', backupHint: 'Totul rămâne pe acest dispozitiv. Salvează o copie ca să nu pierzi datele sau ca să le muți pe alt dispozitiv.', exportJson: 'Salvează copia (JSON)', importJson: 'Restaurează copia', exportCsv: 'Salvează CSV', proPitch: 'Obiceiuri nelimitate, anumite zile sau de N ori pe săptămână, notițe pentru fiecare zi, statistici, copie de siguranță și export CSV, culori și emoji.',
      msgEmpty: 'Adaugă mai jos primul obicei. Începe cu ceva mic.', msgRest: 'Nimic planificat azi. Bucură-te de pauză.', msgAll: 'Gata pe azi. Bravo!', msgNone: 'O zi nouă: {n} de bifat. Un pas mic e de ajuns ca să începi.', msgSome: '{d} din {n} gata. Mai ai: {left}.', streakD: 'serie {n} zile · record {b}', streakW: 'serie {n} săpt. · record {b}', everyDay: 'în fiecare zi', timesWeek: 'de {n} ori pe săptămână · {c}/{n} acum', notToday: 'nu azi', markDone: 'Bifează: {name}', limit: 'Versiunea gratuită păstrează până la 3 obiceiuri. Cu Pro: nelimitat.', nameNeeded: 'Scrie mai întâi un nume.', pickDays: 'Alege cel puțin o zi.', confirmDel: 'Ștergi „{name}” cu tot istoricul?', noHabits: 'Niciun obicei încă.', noNotes: 'Nicio notiță încă.', noteSaved: 'Notiță salvată.', colHabit: 'Obicei', colPct: 'Bifat', colDays: 'Zile', colStreak: 'Serie', colBest: 'Record', bestDay: 'Cea mai bună zi: {d} ({p}%)', noData: 'Încă nu sunt destule date.', confirmImport: 'Înlocuiești obiceiurile actuale cu cele {n} din copie?', imported: 'Copie restaurată: {n} obiceiuri.', badFile: 'Fișierul nu este o copie validă.' },
    en: { appName: 'Habit Tracker', todayTitle: 'Today', weekTitle: 'Week', monthTitle: 'Month', habitsTitle: 'Habits', prev: 'Previous', next: 'Next', allHabits: 'All habits', less: 'Less', more: 'More', name: 'Name', namePh: 'e.g. Read 10 pages', schedule: 'Schedule', sDaily: 'Every day', sDays: 'On specific weekdays', sTimes: 'N times per week', timesN: 'Times a week', color: 'Color', emoji: 'Emoji', add: 'Add habit', save: 'Save', cancel: 'Cancel', edit: 'Edit', del: 'Delete', notesTitle: 'Notes', notesHint: 'A short note for a day: how it went, what helped.', habit: 'Habit', date: 'Date', note: 'Note', saveNote: 'Save note', statsTitle: 'Statistics', statsHint: 'Completion per habit for the month shown above and your best day of the week (last 12 weeks).', backupTitle: 'Backup', backupHint: 'Everything stays on this device. Save a backup file to keep it safe or to move it to another device.', exportJson: 'Save backup (JSON)', importJson: 'Restore backup', exportCsv: 'Save CSV', proPitch: 'Unlimited habits, specific weekdays or N times per week, notes for each day, statistics, backup and CSV export, colors and emoji.',
      msgEmpty: 'Add your first habit below. Start small.', msgRest: 'Nothing planned for today. Enjoy the break.', msgAll: 'All done for today. Nice work!', msgNone: 'A fresh day: {n} to go. One small step is enough to start.', msgSome: '{d} of {n} done. Still to do: {left}.', streakD: '{n}-day streak · best {b}', streakW: '{n}-week streak · best {b}', everyDay: 'every day', timesWeek: '{n} times a week · {c}/{n} so far', notToday: 'not today', markDone: 'Mark done: {name}', limit: 'The free version keeps up to 3 habits. With Pro: unlimited.', nameNeeded: 'Write a name first.', pickDays: 'Pick at least one day.', confirmDel: 'Delete “{name}” and all its history?', noHabits: 'No habits yet.', noNotes: 'No notes yet.', noteSaved: 'Note saved.', colHabit: 'Habit', colPct: 'Done', colDays: 'Days', colStreak: 'Streak', colBest: 'Best', bestDay: 'Best day: {d} ({p}%)', noData: 'Not enough data yet.', confirmImport: 'Replace your current habits with the {n} habits from the backup?', imported: 'Backup restored: {n} habits.', badFile: 'This file is not a valid backup.' },
    ru: { appName: 'Трекер привычек', todayTitle: 'Сегодня', weekTitle: 'Неделя', monthTitle: 'Месяц', habitsTitle: 'Привычки', prev: 'Назад', next: 'Вперёд', allHabits: 'Все привычки', less: 'Меньше', more: 'Больше', name: 'Название', namePh: 'напр. Читать 10 страниц', schedule: 'Расписание', sDaily: 'Каждый день', sDays: 'В определённые дни', sTimes: 'N раз в неделю', timesN: 'Раз в неделю', color: 'Цвет', emoji: 'Эмодзи', add: 'Добавить привычку', save: 'Сохранить', cancel: 'Отмена', edit: 'Изменить', del: 'Удалить', notesTitle: 'Заметки', notesHint: 'Короткая заметка на день: как прошло, что помогло.', habit: 'Привычка', date: 'Дата', note: 'Заметка', saveNote: 'Сохранить заметку', statsTitle: 'Статистика', statsHint: 'Выполнение каждой привычки за месяц выше и ваш лучший день недели (последние 12 недель).', backupTitle: 'Резервная копия', backupHint: 'Все данные хранятся на этом устройстве. Сохраните копию, чтобы не потерять их или перенести на другое устройство.', exportJson: 'Сохранить копию (JSON)', importJson: 'Восстановить копию', exportCsv: 'Сохранить CSV', proPitch: 'Неограниченное число привычек, определённые дни или N раз в неделю, заметки на каждый день, статистика, резервная копия и экспорт CSV, цвета и эмодзи.',
      msgEmpty: 'Добавьте первую привычку ниже. Начните с малого.', msgRest: 'На сегодня ничего не запланировано. Отдыхайте.', msgAll: 'На сегодня всё сделано. Отлично!', msgNone: 'Новый день: осталось {n}. Для начала достаточно одного шага.', msgSome: 'Сделано {d} из {n}. Осталось: {left}.', streakD: 'серия {n} дн. · рекорд {b}', streakW: 'серия {n} нед. · рекорд {b}', everyDay: 'каждый день', timesWeek: '{n} раз в неделю · {c}/{n} сейчас', notToday: 'не сегодня', markDone: 'Отметить: {name}', limit: 'В бесплатной версии — до 3 привычек. С Pro — без ограничений.', nameNeeded: 'Сначала введите название.', pickDays: 'Выберите хотя бы один день.', confirmDel: 'Удалить «{name}» со всей историей?', noHabits: 'Привычек пока нет.', noNotes: 'Заметок пока нет.', noteSaved: 'Заметка сохранена.', colHabit: 'Привычка', colPct: 'Выполнено', colDays: 'Дни', colStreak: 'Серия', colBest: 'Рекорд', bestDay: 'Лучший день: {d} ({p}%)', noData: 'Пока недостаточно данных.', confirmImport: 'Заменить текущие привычки на {n} из копии?', imported: 'Копия восстановлена, привычек: {n}.', badFile: 'Этот файл не является резервной копией.' }
  };
  const L = HabitLogic;
  const $ = id => document.getElementById(id);
  const PALETTE = ['#d6336c', '#1971c2', '#2b8a3e', '#e8590c', '#7048e8', '#0b7a75', '#c92a2a', '#5c940d'];
  const KEY = 'hbData';
  let isPro = false, weekOff = 0, editId = null, today = L.key(), month = curMonth(), heatSel = 'all';
  let data;
  try { data = L.normalize(JSON.parse(Core.store(KEY) || '{"habits":[]}')); } catch (e) { data = { v: 1, habits: [] }; }
  const habits = () => data.habits;

  function curMonth() { const [y, m] = today.split('-').map(Number); return { y, m }; }
  function save() { Core.store(KEY, JSON.stringify(data)); }
  function fmt(k, opts) { return new Intl.DateTimeFormat(Core.lang, Object.assign({ timeZone: 'UTC' }, opts)).format(new Date(L.dayNum(k) * 864e5)); }
  const dayName = (d, w) => fmt(L.fromDay(3 + d), { weekday: w || 'short' });
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function color(h) { return isPro && h.color ? h.color : ''; }
  function mark(h, e) { const c = color(h); if (c) e.style.setProperty('--hc', c); }
  function badge(h) {
    if (isPro && h.emoji) return el('span', 'em', h.emoji);
    const s = el('span', 'em'), d = el('span', 'dot'); mark(h, d); s.append(d); return s;
  }
  function schedText(h) {
    const s = L.sched(h);
    if (s.t === 'times') return Core.t('timesWeek', { n: s.n, c: L.weekCount(h, today) });
    if (s.t === 'days') return [1, 2, 3, 4, 5, 6, 0].filter(d => s.d.includes(d)).map(d => dayName(d)).join(', ');
    return Core.t('everyDay');
  }
  function streakText(h) { const r = L.streaks(h, today); return Core.t(r.unit === 'w' ? 'streakW' : 'streakD', { n: r.current, b: r.best }); }
  function toggle(h, k) { L.toggle(h, k); save(); render(); }

  function renderToday() {
    $('todayDate').textContent = fmt(today, { weekday: 'long', day: 'numeric', month: 'long' });
    const s = L.summary(habits(), today);
    $('todayMsg').textContent = !habits().length ? Core.t('msgEmpty') : !s.due ? Core.t('msgRest') : s.done === s.due ? Core.t('msgAll')
      : !s.done ? Core.t('msgNone', { n: s.due }) : Core.t('msgSome', { d: s.done, n: s.due, left: s.left.join(', ') });
    const ul = $('todayList'); ul.textContent = '';
    for (const h of habits()) {
      const li = el('li'), b = el('button', 'chk', '✓'), nm = el('div', 'nm'), done = L.isDone(h, today);
      mark(h, b);
      b.setAttribute('aria-pressed', done); b.setAttribute('aria-label', Core.t('markDone', { name: h.name }));
      b.addEventListener('click', () => toggle(h, today));
      const due = L.dueToday(h, today);
      nm.append(el('strong', '', h.name), el('span', 'muted', (due ? '' : Core.t('notToday') + ' · ') + schedText(h) + ' · ' + streakText(h)));
      li.append(b, badge(h), nm); ul.append(li);
    }
  }

  function renderWeek() {
    const ws = L.addDays(L.weekStart(today), 7 * weekOff), we = L.addDays(ws, 6);
    $('weekLabel').textContent = fmt(ws, { day: 'numeric', month: 'short' }) + ' – ' + fmt(we, { day: 'numeric', month: 'short' });
    $('wNext').disabled = weekOff >= 0;
    const g = $('week'); g.textContent = '';
    g.append(el('div'));
    for (let i = 0; i < 7; i++) {
      const k = L.addDays(ws, i), hd = el('div', 'hd' + (k === today ? ' now' : ''));
      hd.append(dayName(L.dow(k)), el('br'), String(+k.slice(8)));
      g.append(hd);
    }
    for (const h of habits()) {
      const n = el('div', 'nmc', (isPro && h.emoji ? h.emoji + ' ' : '') + h.name); n.title = h.name; g.append(n);
      const s = L.sched(h);
      for (let i = 0; i < 7; i++) {
        const k = L.addDays(ws, i), b = el('button', '', '✓');
        if (s.t === 'days' && !L.scheduled(h, k)) b.classList.add('off');
        if (k === today) b.classList.add('now');
        mark(h, b);
        b.setAttribute('aria-pressed', L.isDone(h, k));
        b.setAttribute('aria-label', h.name + ' · ' + fmt(k, { weekday: 'long', day: 'numeric', month: 'long' }));
        b.dataset.k = k;
        b.disabled = k > today;
        b.addEventListener('click', () => toggle(h, k));
        g.append(b);
      }
    }
  }

  function renderMonth() {
    const first = month.y + '-' + String(month.m).padStart(2, '0') + '-01';
    $('monthLabel').textContent = fmt(first, { month: 'long', year: 'numeric' });
    $('mNext').disabled = first >= today.slice(0, 8) + '01';
    const sel = $('heatSel'); sel.textContent = '';
    sel.append(new Option(Core.t('allHabits'), 'all'));
    for (const h of habits()) sel.append(new Option((isPro && h.emoji ? h.emoji + ' ' : '') + h.name, h.id));
    if (heatSel !== 'all' && !habits().some(h => h.id === heatSel)) heatSel = 'all';
    sel.value = heatSel;
    const list = heatSel === 'all' ? habits() : habits().filter(h => h.id === heatSel);
    const g = $('heat'); g.textContent = '';
    g.style.removeProperty('--hc');
    if (heatSel !== 'all') mark(list[0], g);
    g.classList.toggle('click', isPro);
    for (let d = 1; d <= 7; d++) g.append(el('div', 'hd', dayName(d % 7)));
    for (const wk of L.monthGrid(month.y, month.m)) for (const k of wk) {
      if (!k) { g.append(el('div', 'e')); continue; }
      const r = L.dayRate(list, k, today), c = el('div', k > today ? 'fut' : 'l' + L.level(r), String(+k.slice(8)));
      if (k === today) c.classList.add('now');
      c.dataset.k = k;
      c.title = fmt(k, { day: 'numeric', month: 'long' }) + (r == null ? '' : ' · ' + Math.round(r * 100) + '%');
      g.append(c);
    }
  }

  function renderHabits() {
    const ul = $('hList'); ul.textContent = '';
    if (!habits().length) ul.append(el('li', 'muted', Core.t('noHabits')));
    for (const h of habits()) {
      const li = el('li'), nm = el('div', 'nm'), e = el('button', '', Core.t('edit')), d = el('button', '', Core.t('del'));
      nm.append(el('strong', '', h.name), el('span', 'muted', schedText(h)));
      e.addEventListener('click', () => startEdit(h));
      d.addEventListener('click', () => {
        if (!confirm(Core.t('confirmDel', { name: h.name }))) return;
        data.habits = habits().filter(x => x !== h); if (editId === h.id) resetForm(); save(); render();
      });
      li.append(badge(h), nm, e, d); ul.append(li);
    }
    const can = editId || L.canAdd(habits(), isPro);
    $('hAdd').disabled = !can; $('hName').disabled = !can;
    $('hAdd').textContent = Core.t(editId ? 'save' : 'add');
    $('hCancel').classList.toggle('hidden', !editId);
    if (!can) $('hMsg').textContent = Core.t('limit');
    else if ($('hMsg').textContent === Core.t('limit')) $('hMsg').textContent = '';
    const days = $('hDays');
    if (!days.childElementCount || days.dataset.lang !== Core.lang) {
      const checked = [...days.querySelectorAll('input:checked')].map(i => +i.value);
      days.textContent = ''; days.dataset.lang = Core.lang;
      for (const d of [1, 2, 3, 4, 5, 6, 0]) {
        const lb = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.value = d; cb.checked = checked.includes(d);
        lb.append(cb, dayName(d)); days.append(lb);
      }
    }
    for (const i of days.querySelectorAll('input')) i.disabled = !isPro;
    ['hSched', 'hTimes', 'hColor', 'hEmoji'].forEach(id => { $(id).disabled = !isPro; });
    if (!isPro) $('hSched').value = 'daily';
    schedUi();
  }
  function schedUi() { const v = $('hSched').value; $('hDays').classList.toggle('hidden', v !== 'days'); $('hTimesBox').classList.toggle('hidden', v !== 'times'); }
  function resetForm() {
    editId = null; $('hName').value = ''; $('hSched').value = 'daily'; $('hTimes').value = 3; $('hEmoji').value = '';
    $('hColor').value = PALETTE[habits().length % PALETTE.length];
    $('hDays').querySelectorAll('input').forEach(i => { i.checked = false; });
  }
  function startEdit(h) {
    editId = h.id; const s = L.sched(h);
    $('hName').value = h.name; $('hSched').value = s.t; $('hTimes').value = s.n || 3;
    $('hDays').querySelectorAll('input').forEach(i => { i.checked = s.t === 'days' && s.d.includes(+i.value); });
    $('hColor').value = h.color || PALETTE[0]; $('hEmoji').value = h.emoji || '';
    $('hMsg').textContent = ''; renderHabits(); $('hName').focus();
  }
  function submit() {
    const name = $('hName').value.trim();
    if (!name) { $('hMsg').textContent = Core.t('nameNeeded'); return; }
    const old = editId && habits().find(h => h.id === editId);
    if (!old && !L.canAdd(habits(), isPro)) return;
    const h = old || { id: L.newId(habits()), created: today, done: {}, notes: {}, sched: { t: 'daily' }, color: null, emoji: '' };
    if (isPro) {
      const t = $('hSched').value, d = [...$('hDays').querySelectorAll('input:checked')].map(i => +i.value);
      if (t === 'days' && !d.length) { $('hMsg').textContent = Core.t('pickDays'); return; }
      h.sched = t === 'days' ? { t, d } : t === 'times' ? { t, n: Math.min(7, Math.max(1, Math.round(+$('hTimes').value) || 1)) } : { t: 'daily' };
      h.color = $('hColor').value; h.emoji = Array.from($('hEmoji').value.trim()).slice(0, 2).join('');
    }
    h.name = name.slice(0, 80);
    if (!old) habits().push(h);
    data = L.normalize(data); save(); resetForm(); $('hMsg').textContent = ''; render();
  }

  function renderNotes() {
    const sel = $('nHabit'), cur = sel.value; sel.textContent = '';
    for (const h of habits()) sel.append(new Option(h.name, h.id));
    if (habits().some(h => h.id === cur)) sel.value = cur;
    $('nDate').max = today;
    if (!L.valid($('nDate').value) || $('nDate').value > today) $('nDate').value = today;
    ['nHabit', 'nDate', 'nText', 'nSave'].forEach(id => { $(id).disabled = !isPro || !habits().length; });
    const ul = $('nList'); ul.textContent = '';
    const h = habits().find(x => x.id === sel.value);
    if (!isPro || !h) { $('nText').value = ''; return; }
    if (!$('nText').dataset.dirty) $('nText').value = h.notes[$('nDate').value] || '';
    const ks = Object.keys(h.notes).sort().reverse().slice(0, 8);
    if (!ks.length) ul.append(el('li', 'muted', Core.t('noNotes')));
    for (const k of ks) {
      const li = el('li'), b = el('button', '', fmt(k, { day: 'numeric', month: 'short' })), t = el('span', 'nm', h.notes[k]);
      b.addEventListener('click', () => openNote(h.id, k));
      li.append(b, t); ul.append(li);
    }
  }
  function openNote(id, k) { $('nHabit').value = id; $('nDate').value = k; delete $('nText').dataset.dirty; renderNotes(); $('nText').focus(); }

  function renderStats() {
    const box = $('stats'); box.textContent = '';
    if (!isPro) return;
    if (!habits().length) { box.append(el('p', 'muted', Core.t('noData'))); return; }
    const t = el('table', 'st'), hr = el('tr');
    for (const k of ['colHabit', 'colPct', 'colDays', 'colStreak', 'colBest']) hr.append(el('th', '', Core.t(k)));
    t.append(hr);
    for (const h of habits()) {
      const m = L.monthStats(h, month.y, month.m, today), s = L.streaks(h, today), tr = el('tr');
      for (const c of [(h.emoji ? h.emoji + ' ' : '') + h.name, m.pct == null ? '—' : m.pct + '%', m.done + ' / ' + m.due, s.current, s.best]) tr.append(el('td', '', String(c)));
      t.append(tr);
    }
    box.append(t);
    const w = L.weekdayRates(habits(), L.addDays(today, -83), today);
    box.append(el('p', '', w.best == null ? Core.t('noData') : Core.t('bestDay', { d: dayName(w.best, 'long'), p: Math.round(w.rates[w.best] * 100) })));
    const bars = el('div', 'bars'), bl = el('div', 'bl');
    for (const d of [1, 2, 3, 4, 5, 6, 0]) {
      const r = w.rates[d] || 0, b = el('div', d === w.best ? 'best' : '');
      b.style.height = Math.max(3, Math.round(r * 100)) + '%'; b.title = dayName(d, 'long') + ' · ' + Math.round(r * 100) + '%';
      bars.append(b); bl.append(el('span', '', dayName(d)));
    }
    box.append(bars, bl);
  }

  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function render() {
    const k = L.key();
    if (k !== today) { today = k; }
    ['bJson', 'bImport', 'bCsv'].forEach(id => { $(id).disabled = !isPro; });
    renderToday(); renderWeek(); renderMonth(); renderHabits(); renderNotes(); renderStats();
  }

  Core.init(DICT, render);
  resetForm();
  render();
  $('wPrev').addEventListener('click', () => { weekOff--; renderWeek(); });
  $('wNext').addEventListener('click', () => { if (weekOff < 0) weekOff++; renderWeek(); });
  $('mPrev').addEventListener('click', () => { month = L.addMonths(month.y, month.m, -1); renderMonth(); renderStats(); });
  $('mNext').addEventListener('click', () => { month = L.addMonths(month.y, month.m, 1); renderMonth(); renderStats(); });
  $('heatSel').addEventListener('change', () => { heatSel = $('heatSel').value; renderMonth(); });
  $('heat').addEventListener('click', e => {
    const k = e.target.dataset && e.target.dataset.k;
    if (!isPro || !k || k > today || !habits().length) return;
    openNote(heatSel === 'all' ? $('nHabit').value || habits()[0].id : heatSel, k);
  });
  $('hSched').addEventListener('change', schedUi);
  $('hAdd').addEventListener('click', submit);
  $('hName').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  $('hCancel').addEventListener('click', () => { resetForm(); $('hMsg').textContent = ''; renderHabits(); });
  $('nHabit').addEventListener('change', () => { delete $('nText').dataset.dirty; renderNotes(); });
  $('nDate').addEventListener('change', () => { delete $('nText').dataset.dirty; renderNotes(); });
  $('nText').addEventListener('input', () => { $('nText').dataset.dirty = '1'; });
  $('nSave').addEventListener('click', () => {
    const h = habits().find(x => x.id === $('nHabit').value), k = $('nDate').value, t = $('nText').value.trim();
    if (!isPro || !h || !L.valid(k)) return;
    if (t) h.notes[k] = t.slice(0, 1000); else delete h.notes[k];
    delete $('nText').dataset.dirty; save(); renderNotes();
  });
  $('bJson').addEventListener('click', () => { if (isPro) download('habits-backup-' + today + '.json', L.exportJson(data, today), 'application/json'); });
  $('bCsv').addEventListener('click', () => { if (isPro) download('habits-' + today + '.csv', L.toCsv(habits()), 'text/csv'); });
  $('bImport').addEventListener('click', () => { if (isPro) $('bFile').click(); });
  $('bFile').addEventListener('change', async () => {
    const f = $('bFile').files[0]; $('bFile').value = '';
    if (!f || !isPro) return;
    try {
      const d = L.importJson(await f.text());
      if (!confirm(Core.t('confirmImport', { n: d.habits.length }))) return;
      data = d; save(); resetForm(); render();
      $('bMsg').textContent = Core.t('imported', { n: d.habits.length });
    } catch (e) { $('bMsg').textContent = Core.t('badFile'); }
  });
  /* new day while the app stays open */
  setInterval(() => { if (L.key() !== today) render(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && L.key() !== today) render(); });
  Core.wirePro(SKU, owned => { isPro = owned; render(); });
})();
