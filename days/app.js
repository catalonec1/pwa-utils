(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Calculator de date', between: 'Zile între două date', from: 'De la', to: 'Până la', includeEnd: 'Include și ziua de sfârșit (+1)', addTitle: 'Adună sau scade', date: 'Data', amount: 'Câte', unit: 'Unitate', days: 'zile', weeks: 'săptămâni', months: 'luni', years: 'ani', negHint: 'Pune un număr negativ ca să mergi înapoi în timp.', aboutTitle: 'Despre o dată', workTitle: 'Zile lucrătoare', workHint: 'Folosește datele de mai sus. Weekendurile sunt sărite; adaugă mai jos zilele tale libere.', holidays: 'Zile libere (AAAA-LL-ZZ, una pe rând)', cdTitle: 'Numărători inverse', event: 'Eveniment', add: 'Adaugă', csv: 'Salvează CSV', del: 'Șterge', proPitch: 'Zile lucrătoare cu zilele tale libere și zilele tale de weekend, adunare de zile lucrătoare, numărători inverse salvate și export CSV.', ageTitle: 'Vârstă', birth: 'Data nașterii', ageOn: 'La data', ageYmd: '{y} ani, {m} luni, {d} zile', ageMore: '{n} zile în total · următoarea aniversare: {date} ({rel})', ageFuture: 'Data nașterii e după data aleasă.', weekendLabel: 'Zile libere în fiecare săptămână',
      nDays: '{n} zile', ymd: '{y} ani, {m} luni, {d} zile · {w} săptămâni și {r} zile', weekday: 'Ziua săptămânii', week: 'Săptămâna ISO', doy: 'Ziua din an', leap: 'An bisect', fromToday: 'Față de azi', yes: 'da', no: 'nu', inDays: 'peste {n} zile', agoDays: 'acum {n} zile', isToday: 'azi', nWork: '{n} zile lucrătoare', addWork: '+{n} zile lucrătoare de la {d}: {r}', badDates: 'Nu am înțeles: {x}', emptyCd: 'Nicio numărătoare încă.' },
    en: { appName: 'Date Calculator', between: 'Days between two dates', from: 'From', to: 'To', includeEnd: 'Include the end day (+1)', addTitle: 'Add or subtract', date: 'Date', amount: 'Amount', unit: 'Unit', days: 'days', weeks: 'weeks', months: 'months', years: 'years', negHint: 'Use a negative amount to go back in time.', aboutTitle: 'About a date', workTitle: 'Working days', workHint: 'Uses the dates above. Weekends are skipped; add your own days off below.', holidays: 'Days off (YYYY-MM-DD, one per line)', cdTitle: 'Countdowns', event: 'Event', add: 'Add', csv: 'Save CSV', del: 'Delete', proPitch: 'Working days with your own days off and your own weekend days, adding working days, saved countdowns and CSV export.', ageTitle: 'Age', birth: 'Date of birth', ageOn: 'On', ageYmd: '{y} years, {m} months, {d} days', ageMore: '{n} days in total · next birthday: {date} ({rel})', ageFuture: 'The birth date is after the chosen date.', weekendLabel: 'Weekly days off',
      nDays: '{n} days', ymd: '{y} years, {m} months, {d} days · {w} weeks and {r} days', weekday: 'Weekday', week: 'ISO week', doy: 'Day of year', leap: 'Leap year', fromToday: 'From today', yes: 'yes', no: 'no', inDays: 'in {n} days', agoDays: '{n} days ago', isToday: 'today', nWork: '{n} working days', addWork: '+{n} working days from {d}: {r}', badDates: 'Not understood: {x}', emptyCd: 'No countdowns yet.' },
    ru: { appName: 'Калькулятор дат', between: 'Дней между датами', from: 'С', to: 'По', includeEnd: 'Включить последний день (+1)', addTitle: 'Прибавить или вычесть', date: 'Дата', amount: 'Сколько', unit: 'Единица', days: 'дней', weeks: 'недель', months: 'месяцев', years: 'лет', negHint: 'Отрицательное число — назад во времени.', aboutTitle: 'О дате', workTitle: 'Рабочие дни', workHint: 'Используются даты выше. Выходные пропускаются; свои выходные добавьте ниже.', holidays: 'Выходные дни (ГГГГ-ММ-ДД, по одному в строке)', cdTitle: 'Обратный отсчёт', event: 'Событие', add: 'Добавить', csv: 'Сохранить CSV', del: 'Удалить', proPitch: 'Рабочие дни с вашими выходными и своими днями отдыха в неделе, прибавление рабочих дней, сохранённые отсчёты и экспорт CSV.', ageTitle: 'Возраст', birth: 'Дата рождения', ageOn: 'На дату', ageYmd: '{y} г., {m} мес., {d} дн.', ageMore: 'Всего {n} дн. · следующий день рождения: {date} ({rel})', ageFuture: 'Дата рождения позже выбранной даты.', weekendLabel: 'Еженедельные выходные',
      nDays: '{n} дн.', ymd: '{y} г., {m} мес., {d} дн. · {w} нед. и {r} дн.', weekday: 'День недели', week: 'Неделя ISO', doy: 'День года', leap: 'Високосный год', fromToday: 'От сегодня', yes: 'да', no: 'нет', inDays: 'через {n} дн.', agoDays: '{n} дн. назад', isToday: 'сегодня', nWork: '{n} рабочих дн.', addWork: '+{n} рабочих дн. от {d}: {r}', badDates: 'Не понято: {x}', emptyCd: 'Отсчётов пока нет.' }
  };
  const D = DateCalc;
  const $ = id => document.getElementById(id);
  let isPro = false;
  let cds = [];
  try { cds = JSON.parse(Core.store('daysCd') || '[]'); } catch (e) { cds = []; }

  function long(t) {
    return new Intl.DateTimeFormat(Core.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(t));
  }
  function rel(n) { return n === 0 ? Core.t('isToday') : Core.t(n > 0 ? 'inDays' : 'agoDays', { n: Math.abs(n) }); }
  function num(n) { return new Intl.NumberFormat(Core.lang).format(n); }

  function between() {
    const a = D.parse($('from').value), b = D.parse($('to').value);
    if (a == null || b == null) { $('diffDays').textContent = '—'; $('diffYmd').textContent = ''; return; }
    let n = D.diffDays(a, b);
    if ($('incl').checked) n += n >= 0 ? 1 : -1;
    const r = D.ymd(a, b), abs = Math.abs(n);
    $('diffDays').textContent = Core.t('nDays', { n: num(n) });
    $('diffYmd').textContent = Core.t('ymd', { y: r.years, m: r.months, d: r.days, w: Math.floor(abs / 7), r: abs % 7 });
  }
  function addSub() {
    const t = D.parse($('base').value), n = Math.trunc(+$('amount').value || 0), u = $('unit').value;
    if (t == null) { $('addOut').textContent = '—'; return; }
    const r = u === 'd' ? D.addDays(t, n) : u === 'w' ? D.addDays(t, 7 * n) : u === 'm' ? D.addMonths(t, n) : D.addMonths(t, 12 * n);
    $('addOut').textContent = long(r);
  }
  function about() {
    const t = D.parse($('info').value), f = $('facts');
    f.textContent = '';
    if (t == null) return;
    const w = D.isoWeek(t), y = new Date(t).getUTCFullYear();
    const rows = [['weekday', new Intl.DateTimeFormat(Core.lang, { weekday: 'long', timeZone: 'UTC' }).format(new Date(t))],
      ['week', w.week + (w.year !== y ? ' (' + w.year + ')' : '')], ['doy', D.dayOfYear(t) + ' / ' + (D.isLeap(y) ? 366 : 365)],
      ['leap', Core.t(D.isLeap(y) ? 'yes' : 'no')], ['fromToday', rel(D.diffDays(D.today(), t))]];
    for (const [k, v] of rows) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = Core.t(k); dd.textContent = v; f.append(dt, dd);
    }
  }
  let weekend = [0, 6];
  try { const w = JSON.parse(Core.store('daysWeekend') || 'null'); if (Array.isArray(w)) weekend = w.filter(d => Number.isInteger(d) && d >= 0 && d <= 6); } catch (e) { /* keep default */ }
  function renderWeekend() {
    const box = $('weekend'); box.textContent = '';
    const fmtW = new Intl.DateTimeFormat(Core.lang, { weekday: 'short', timeZone: 'UTC' });
    [1, 2, 3, 4, 5, 6, 0].forEach(d => {
      const l = document.createElement('label'), c = document.createElement('input'), sp = document.createElement('span');
      c.type = 'checkbox'; c.dataset.wd = d; c.checked = weekend.includes(d); c.disabled = !isPro;
      sp.textContent = fmtW.format(new Date(Date.UTC(2026, 10, 1 + d))); /* 1 Nov 2026 is a Sunday */
      c.addEventListener('change', () => {
        weekend = [...box.querySelectorAll('input:checked')].map(x => +x.dataset.wd);
        Core.store('daysWeekend', JSON.stringify(weekend)); work();
      });
      l.append(c, sp); box.append(l);
    });
  }
  function ageCalc() {
    const b = D.parse($('birth').value), on = D.parse($('ageOn').value);
    $('ageOut').textContent = '—'; $('ageMore').textContent = '';
    if (b == null || on == null) return;
    const r = D.age(b, on);
    if (!r) { $('ageMore').textContent = Core.t('ageFuture'); return; }
    Core.store('daysBirth', $('birth').value);
    $('ageOut').textContent = Core.t('ageYmd', { y: r.years, m: r.months, d: r.days });
    $('ageMore').textContent = Core.t('ageMore', { n: num(r.totalDays), date: long(r.next), rel: rel(r.toNext) });
  }
  function work() {
    const out = $('workOut'), add = $('workAdd');
    if (!isPro) { out.textContent = ''; add.textContent = ''; return; }
    const hol = D.parseList($('hol').value);
    Core.store('daysHol', $('hol').value);
    const a = D.parse($('from').value), b = D.parse($('to').value);
    out.textContent = a != null && b != null ? Core.t('nWork', { n: D.workdaysBetween(a, b, hol.dates, $('incl').checked, weekend) }) : '—';
    const t = D.parse($('base').value), n = Math.trunc(+$('amount').value || 0);
    const r = t != null && $('unit').value === 'd' ? D.addWorkdays(t, n, hol.dates, weekend) : null;
    let txt = r != null ? Core.t('addWork', { n, d: D.fmt(t), r: long(r) }) : '';
    if (hol.bad.length) txt += (txt ? ' · ' : '') + Core.t('badDates', { x: hol.bad.slice(0, 3).join(', ') });
    add.textContent = txt;
  }
  function renderCd() {
    const ul = $('cdList'); ul.textContent = '';
    const list = D.countdowns(cds, D.today());
    if (!list.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = Core.t('emptyCd'); ul.append(li); return; }
    for (const e of list) {
      const li = document.createElement('li'), s = document.createElement('span'), b = document.createElement('button');
      s.textContent = e.name + ' · ' + e.date + ' · ' + rel(e.left);
      b.textContent = Core.t('del'); b.disabled = !isPro;
      b.addEventListener('click', () => { cds = cds.filter(x => !(x.name === e.name && x.date === e.date)); saveCd(); });
      li.append(s, b); ul.append(li);
    }
  }
  function saveCd() { Core.store('daysCd', JSON.stringify(cds)); renderCd(); }
  function all() { between(); addSub(); about(); ageCalc(); renderWeekend(); work(); renderCd(); }
  function lockPro() {
    ['hol', 'cdName', 'cdDate', 'cdAdd', 'cdCsv'].forEach(id => { $(id).disabled = !isPro; });
    all();
  }

  const td = D.fmt(D.today());
  $('from').value = td; $('to').value = D.fmt(D.addMonths(D.today(), 1)); $('base').value = td; $('info').value = td; $('cdDate').value = D.fmt(D.addDays(D.today(), 7));
  $('hol').value = Core.store('daysHol') || '';
  $('ageOn').value = td; $('birth').value = Core.store('daysBirth') || '2000-01-01';
  Core.init(DICT, all);
  lockPro();
  ['from', 'to', 'incl', 'hol'].forEach(id => $(id).addEventListener('input', () => { between(); work(); }));
  $('incl').addEventListener('change', () => { between(); work(); });
  ['base', 'amount', 'unit'].forEach(id => { $(id).addEventListener('input', () => { addSub(); work(); }); $(id).addEventListener('change', () => { addSub(); work(); }); });
  $('info').addEventListener('input', about);
  ['birth', 'ageOn'].forEach(id => $(id).addEventListener('input', ageCalc));
  $('cdAdd').addEventListener('click', () => {
    const name = $('cdName').value.trim(), date = $('cdDate').value;
    if (!isPro || !name || D.parse(date) == null) return;
    cds.push({ name, date }); $('cdName').value = ''; saveCd();
  });
  $('cdCsv').addEventListener('click', () => {
    if (!isPro || !cds.length) return;
    const blob = new Blob([D.toCsv(D.countdowns(cds, D.today()))], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'countdowns.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
