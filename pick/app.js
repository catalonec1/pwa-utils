(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Alegere aleatorie', listTitle: 'Alege din listă', listLabel: 'Câte un nume sau o variantă pe rând', howMany: 'Câte', noRepeats: 'Fără repetări', pick: 'Alege', shuffle: 'Amestecă lista', wheel: 'Roata norocului', toolsTitle: 'Unelte pentru listă', weighted: 'Cu ponderi (scrie „Nume *3”)', elim: 'Scoate din listă numele alese', restore: 'Pune-le pe toate înapoi', listName: 'Numele listei', saveList: 'Salvează lista', savedLists: 'Liste salvate', choose: '— alege —', del: 'Șterge', teamsTitle: 'Echipe și grupe', split: 'Împarte în', byCount: 'număr de echipe', bySize: 'persoane pe echipă', number: 'Număr', makeTeams: 'Fă echipele', team: 'Echipa {n}', coinTitle: 'Cap sau pajură', flip: 'Aruncă moneda', heads: 'Cap', tails: 'Pajură', tally: 'Cap {h} · Pajură {t}', diceTitle: 'Zaruri', diceCount: 'Zaruri', sides: 'Fețe', roll: 'Aruncă', sum: 'Suma: {s}', numTitle: 'Număr aleatoriu', min: 'De la', max: 'Până la', generate: 'Generează', badNum: 'Scrie numere întregi.', histTitle: 'Istoric', histHint: 'Fiecare rezultat se salvează aici, cele mai noi primele.', csv: 'Salvează CSV', emptyHist: 'Nimic încă.', proPitch: 'Echipe și grupe, alegere cu ponderi, scoaterea numelor alese (pentru clase și tombole), liste salvate și istoric cu export CSV.', fair: 'Folosește generatorul securizat de numere aleatorii al dispozitivului, fără bias de modulo.',
      names: '{n} nume', namesW: '{n} nume · ponderi în total {w}', emptyList: 'Adaugă câteva nume în listă.', removed: 'Scos din listă · rămân {n}', allBack: 'Lista completă a fost pusă înapoi.', saved: 'Salvată.', h_pick: 'Alegere', h_shuffle: 'Amestecare', h_teams: 'Echipe', h_coin: 'Monedă', h_dice: 'Zaruri', h_number: 'Număr' },
    en: { appName: 'Random Picker', listTitle: 'Pick from a list', listLabel: 'One name or option per line', howMany: 'How many', noRepeats: 'No repeats', pick: 'Pick', shuffle: 'Shuffle list', wheel: 'Spinning wheel', toolsTitle: 'List tools', weighted: 'Weighted (write “Name *3”)', elim: 'Remove picked names from the list', restore: 'Put back all', listName: 'List name', saveList: 'Save list', savedLists: 'Saved lists', choose: '— choose —', del: 'Delete', teamsTitle: 'Teams and groups', split: 'Split into', byCount: 'number of teams', bySize: 'people per team', number: 'Number', makeTeams: 'Make teams', team: 'Team {n}', coinTitle: 'Coin flip', flip: 'Flip a coin', heads: 'Heads', tails: 'Tails', tally: 'Heads {h} · Tails {t}', diceTitle: 'Dice', diceCount: 'Dice', sides: 'Sides', roll: 'Roll', sum: 'Sum: {s}', numTitle: 'Random number', min: 'From', max: 'To', generate: 'Generate', badNum: 'Enter whole numbers.', histTitle: 'History', histHint: 'Every result is saved here, newest first.', csv: 'Save CSV', emptyHist: 'Nothing yet.', proPitch: 'Teams and groups, weighted picks, remove picked names (for classrooms and raffles), saved lists and a history with CSV export.', fair: "Uses your device's secure random number generator, without modulo bias.",
      names: '{n} names', namesW: '{n} names · total weight {w}', emptyList: 'Add a few names to the list.', removed: 'Removed from the list · {n} left', allBack: 'The full list is back.', saved: 'Saved.', h_pick: 'Pick', h_shuffle: 'Shuffle', h_teams: 'Teams', h_coin: 'Coin', h_dice: 'Dice', h_number: 'Number' },
    ru: { appName: 'Случайный выбор', listTitle: 'Выбор из списка', listLabel: 'Одно имя или вариант на строку', howMany: 'Сколько', noRepeats: 'Без повторов', pick: 'Выбрать', shuffle: 'Перемешать', wheel: 'Колесо', toolsTitle: 'Инструменты списка', weighted: 'С весами (пишите «Имя *3»)', elim: 'Убирать выбранных из списка', restore: 'Вернуть всех', listName: 'Название списка', saveList: 'Сохранить список', savedLists: 'Сохранённые списки', choose: '— выберите —', del: 'Удалить', teamsTitle: 'Команды и группы', split: 'Разделить на', byCount: 'число команд', bySize: 'человек в команде', number: 'Число', makeTeams: 'Разделить', team: 'Команда {n}', coinTitle: 'Монетка', flip: 'Подбросить', heads: 'Орёл', tails: 'Решка', tally: 'Орёл {h} · Решка {t}', diceTitle: 'Кубики', diceCount: 'Кубики', sides: 'Граней', roll: 'Бросить', sum: 'Сумма: {s}', numTitle: 'Случайное число', min: 'От', max: 'До', generate: 'Сгенерировать', badNum: 'Введите целые числа.', histTitle: 'История', histHint: 'Здесь сохраняется каждый результат, новые сверху.', csv: 'Сохранить CSV', emptyHist: 'Пока пусто.', proPitch: 'Команды и группы, выбор с весами, удаление выбранных (для класса и розыгрышей), сохранённые списки и история с экспортом CSV.', fair: 'Использует защищённый генератор случайных чисел устройства, без смещения по модулю.',
      names: 'Имён: {n}', namesW: 'Имён: {n} · общий вес {w}', emptyList: 'Добавьте в список несколько имён.', removed: 'Убрано из списка · осталось {n}', allBack: 'Весь список возвращён.', saved: 'Сохранено.', h_pick: 'Выбор', h_shuffle: 'Перемешивание', h_teams: 'Команды', h_coin: 'Монетка', h_dice: 'Кубики', h_number: 'Число' }
  };
  const R = RandomPick;
  const $ = id => document.getElementById(id);
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  const json = (k, d) => { try { const v = JSON.parse(Core.store(k)); return v == null ? d : v; } catch (e) { return d; } };
  const del = k => { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEFAULT_LIST = 'Alex\nMaria\nDavid\nElena\nIon\nSofia\nVictor\nAna';

  let isPro = false, spinning = false, last = json('pickLast', null), hist = json('pickHist', []), saved = json('pickSaved', {});
  const opts = Object.assign({ count: 1, unique: true, weighted: false, elim: false, teamMode: 'count', teamN: 2, diceN: 2, diceS: '6', numMin: '1', numMax: '100' }, json('pickOpts', {}));
  const tally = { heads: 0, tails: 0 };

  /* ---------- lista ---------- */
  const weightedOn = () => isPro && $('weighted').checked;
  const items = () => R.parseList($('list').value, weightedOn());
  function saveOpts() {
    Object.assign(opts, { count: +$('count').value || 1, unique: $('unique').checked, weighted: $('weighted').checked, elim: $('elim').checked, teamMode: $('teamMode').value, teamN: +$('teamN').value || 2, diceN: +$('diceN').value || 1, diceS: $('diceS').value, numMin: $('numMin').value, numMax: $('numMax').value });
    Core.store('pickOpts', JSON.stringify(opts));
  }
  function listInfo() {
    const it = items(), n = it.length;
    $('listInfo').textContent = !n ? Core.t('emptyList') : weightedOn() ? Core.t('namesW', { n, w: it.reduce((s, x) => s + x.w, 0) }) : Core.t('names', { n });
  }

  /* ---------- roata ---------- */
  const wheel = { rot: 0, hi: -1 };
  const segColor = i => `hsl(${(330 + i * 137.508) % 360}, 62%, 42%)`;
  function segments() {
    const it = items().map((x, i) => Object.assign({ idx: i }, x)).filter(x => x.w > 0);
    const total = it.reduce((s, x) => s + x.w, 0);
    let a = 0;
    return it.map(x => { const s = { idx: x.idx, name: x.name, a0: a, a1: a + x.w / total * 2 * Math.PI }; a = s.a1; return s; });
  }
  function draw() {
    const c = $('wheel'), css = getComputedStyle(document.documentElement);
    const size = Math.round(c.getBoundingClientRect().width) || 300, dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(size * dpr)) { c.width = c.height = Math.round(size * dpr); }
    const g = c.getContext('2d'), R0 = size / 2, rad = R0 - 6;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, size, size);
    const segs = segments(), text = css.getPropertyValue('--text').trim() || '#000', card = css.getPropertyValue('--card').trim() || '#fff', border = css.getPropertyValue('--border').trim() || '#ccc';
    g.save(); g.translate(R0, R0 + 4);
    if (!segs.length) {
      g.beginPath(); g.arc(0, 0, rad - 4, 0, 2 * Math.PI); g.fillStyle = border; g.fill();
    }
    const fs = Math.max(10, Math.min(16, 360 / Math.max(segs.length, 1)));
    segs.forEach((s, i) => {
      g.save(); g.rotate(wheel.rot);
      g.globalAlpha = wheel.hi >= 0 && !spinning && s.idx !== wheel.hi ? 0.5 : 1;
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, rad - 4, s.a0, s.a1); g.closePath();
      g.fillStyle = segColor(i); g.fill();
      if (segs.length > 1) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.stroke(); }
      if (segs.length <= 60 && (s.a1 - s.a0) * rad > fs * 0.9) {
        const mid = (s.a0 + s.a1) / 2, left = Math.cos(mid + wheel.rot) < 0;
        g.rotate(left ? mid + Math.PI : mid);
        g.fillStyle = '#fff'; g.font = `600 ${fs}px system-ui, "Segoe UI", sans-serif`; g.textAlign = left ? 'left' : 'right'; g.textBaseline = 'middle';
        let t = s.name; const maxW = rad * 0.6;
        if (g.measureText(t).width > maxW) { while (t.length > 1 && g.measureText(t + '…').width > maxW) t = t.slice(0, -1); t += '…'; }
        g.fillText(t, left ? -(rad - 24) : rad - 24, 0);
      }
      g.restore();
    });
    g.beginPath(); g.arc(0, 0, rad - 4, 0, 2 * Math.PI); g.lineWidth = 3; g.strokeStyle = border; g.stroke();
    g.beginPath(); g.arc(0, 0, Math.max(14, rad * 0.12), 0, 2 * Math.PI); g.fillStyle = card; g.fill(); g.lineWidth = 2; g.strokeStyle = border; g.stroke();
    g.restore();
    /* acul, sus */
    g.beginPath(); g.moveTo(R0 - 11, 1); g.lineTo(R0 + 11, 1); g.lineTo(R0, 24); g.closePath();
    g.fillStyle = text; g.fill(); g.lineWidth = 2; g.strokeStyle = card; g.stroke();
  }
  function spinTo(idx, done) {
    const s = segments().find(x => x.idx === idx);
    if (!s || reduced()) {
      if (s) wheel.rot = -Math.PI / 2 - (s.a0 + s.a1) / 2;
      wheel.hi = idx; draw(); return done();
    }
    const theta = s.a0 + (s.a1 - s.a0) * (0.2 + R.randInt(61) / 100), TAU = 2 * Math.PI;
    const from = wheel.rot % TAU, delta = (((-Math.PI / 2 - theta - from) % TAU) + TAU) % TAU;
    const to = from + 5 * TAU + delta, dur = 3200, t0 = performance.now();
    spinning = true; wheel.hi = -1; setBusy(true);
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      wheel.rot = from + (to - from) * e; draw();
      if (k < 1) return requestAnimationFrame(step);
      spinning = false; wheel.rot = to % TAU; wheel.hi = idx; draw(); setBusy(false); done();
    };
    requestAnimationFrame(step);
  }
  function setBusy(b) { ['pickBtn', 'shuffleBtn', 'teamGo'].forEach(id => { $(id).disabled = b || (id === 'teamGo' && !isPro); }); $('list').readOnly = b; }

  /* ---------- rezultate ---------- */
  function renderResult() {
    const box = $('result'); box.textContent = '';
    if (!last) return;
    if (last.names.length === 1 && last.kind === 'pick') box.append(el('span', last.names[0]));
    else { const ol = el('ol'); last.names.forEach(n => ol.append(el('li', n))); box.append(ol); }
    if (last.left != null) box.append(el('span', Core.t('removed', { n: last.left }), 'note'));
  }
  function setLast(v) { last = v; Core.store('pickLast', JSON.stringify(v)); renderResult(); }
  function now() { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }
  function addHist(type, result) {
    if (!isPro) return;
    hist.push({ time: now(), type, result });
    if (hist.length > 500) hist = hist.slice(-500);
    Core.store('pickHist', JSON.stringify(hist)); renderHist();
  }
  function renderHist() {
    const ul = $('histList'); ul.textContent = '';
    if (!hist.length) { ul.append(el('li', Core.t('emptyHist'), 'muted')); return; }
    for (const h of hist.slice(-100).reverse()) ul.append(el('li', `${h.time} · ${Core.t('h_' + h.type)} · ${h.result}`));
  }

  function doPick() {
    if (spinning) return;
    saveOpts();
    const it = items();
    if (!it.some(x => x.w > 0)) { $('result').textContent = Core.t('emptyList'); return; }
    const n = Math.min(1000, Math.max(1, Math.floor(+$('count').value) || 1));
    const idx = R.pick(it, n, $('unique').checked);
    const names = idx.map(i => it[i].name);
    $('result').textContent = '';
    spinTo(idx[0], () => {
      let left = null;
      if (isPro && $('elim').checked) {
        if (Core.store('pickOrig') == null) Core.store('pickOrig', $('list').value);
        const drop = new Set(idx.map(i => it[i].line));
        $('list').value = $('list').value.split(/\r?\n/).filter((_, k) => !drop.has(k)).join('\n');
        Core.store('pickList', $('list').value);
        left = items().length; wheel.hi = -1; draw(); listInfo();
      }
      setLast({ kind: 'pick', names, left });
      addHist('pick', names.join('; '));
    });
  }
  function doShuffle() {
    if (spinning) return;
    const it = items();
    if (!it.length) { $('result').textContent = Core.t('emptyList'); return; }
    const names = R.shuffle(it.map(x => x.name));
    wheel.hi = -1; draw();
    setLast({ kind: 'shuffle', names });
    addHist('shuffle', names.join('; '));
  }
  function doTeams() {
    if (!isPro) return;
    saveOpts();
    const names = items().filter(x => x.w > 0).map(x => x.name), box = $('teamsOut');
    box.textContent = '';
    if (!names.length) { box.append(el('p', Core.t('emptyList'), 'muted')); return; }
    const t = R.teams(names, +$('teamN').value, $('teamMode').value === 'size');
    t.forEach((members, i) => {
      const d = el('div'), ul = el('ul');
      d.append(el('strong', Core.t('team', { n: i + 1 }) + ` (${members.length})`));
      members.forEach(m => ul.append(el('li', m)));
      d.append(ul); box.append(d);
    });
    addHist('teams', t.map((m, i) => `${Core.t('team', { n: i + 1 })}: ${m.join(', ')}`).join(' | '));
  }
  function doCoin() {
    const r = R.coin(), out = $('coinOut');
    tally[r]++;
    out.textContent = Core.t(r); out.dataset.v = r;
    out.classList.remove('flip'); void out.offsetWidth; out.classList.add('flip');
    $('coinTally').textContent = Core.t('tally', { h: tally.heads, t: tally.tails });
    addHist('coin', Core.t(r));
  }
  function doDice() {
    saveOpts();
    const n = Math.min(50, Math.max(1, Math.floor(+$('diceN').value) || 1)), s = +$('diceS').value;
    $('diceN').value = n;
    const r = R.dice(n, s), box = $('diceOut');
    box.textContent = '';
    r.rolls.forEach(x => box.append(el('span', String(x))));
    $('diceSum').textContent = n > 1 ? Core.t('sum', { s: r.sum }) : '';
    addHist('dice', `${n}d${s}: ${r.rolls.join(' + ')}${n > 1 ? ' = ' + r.sum : ''}`);
  }
  function intOf(s) { const t = String(s).replace(/\s/g, ''); return /^[-+]?\d+$/.test(t) && Number.isSafeInteger(+t) ? +t : NaN; }
  function doNumber() {
    saveOpts();
    const a = intOf($('numMin').value), b = intOf($('numMax').value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) { $('numOut').textContent = Core.t('badNum'); return; }
    let v;
    try { v = R.randRange(a, b); } catch (e) { $('numOut').textContent = Core.t('badNum'); return; }
    $('numOut').textContent = new Intl.NumberFormat(Core.lang).format(v);
    addHist('number', `${Math.min(a, b)}…${Math.max(a, b)}: ${v}`);
  }

  /* ---------- liste salvate ---------- */
  function renderSaved(sel) {
    const s = $('listSel'); s.textContent = '';
    s.append(Object.assign(el('option', Core.t('choose')), { value: '' }));
    Object.keys(saved).sort((a, b) => a.localeCompare(b)).forEach(k => s.append(Object.assign(el('option', k), { value: k })));
    s.value = sel && saved[sel] != null ? sel : '';
  }

  function all() { listInfo(); draw(); renderResult(); renderHist(); renderSaved($('listSel').value); if ($('coinOut').dataset.v) { $('coinOut').textContent = Core.t($('coinOut').dataset.v); $('coinTally').textContent = Core.t('tally', { h: tally.heads, t: tally.tails }); } }
  function lockPro() {
    ['weighted', 'elim', 'restore', 'listName', 'listSave', 'listSel', 'listDel', 'teamMode', 'teamN', 'teamGo', 'histCsv', 'histClear'].forEach(id => { $(id).disabled = !isPro; });
    if (!isPro) $('teamsOut').textContent = '';
    all();
  }

  /* ---------- pornire ---------- */
  const storedList = Core.store('pickList');
  $('list').value = storedList == null ? DEFAULT_LIST : storedList;
  $('count').value = opts.count; $('unique').checked = opts.unique; $('weighted').checked = opts.weighted; $('elim').checked = opts.elim;
  $('teamMode').value = opts.teamMode; $('teamN').value = opts.teamN; $('diceN').value = opts.diceN; $('diceS').value = opts.diceS;
  $('numMin').value = opts.numMin; $('numMax').value = opts.numMax;
  if (last && last.kind === 'pick') { const i = items().findIndex(x => x.name === last.names[0]); if (i >= 0) { const s = segments().find(x => x.idx === i); if (s) { wheel.hi = i; wheel.rot = -Math.PI / 2 - (s.a0 + s.a1) / 2; } } }

  Core.init(DICT, all);
  lockPro();

  $('list').addEventListener('input', () => { Core.store('pickList', $('list').value); wheel.hi = -1; listInfo(); draw(); });
  $('pickBtn').addEventListener('click', doPick);
  $('shuffleBtn').addEventListener('click', doShuffle);
  $('teamGo').addEventListener('click', doTeams);
  $('coinBtn').addEventListener('click', doCoin);
  $('diceBtn').addEventListener('click', doDice);
  $('numBtn').addEventListener('click', doNumber);
  ['count', 'unique', 'elim', 'teamMode', 'teamN', 'diceS'].forEach(id => $(id).addEventListener('change', saveOpts));
  $('weighted').addEventListener('change', () => { saveOpts(); wheel.hi = -1; listInfo(); draw(); });
  $('restore').addEventListener('click', () => {
    const o = Core.store('pickOrig');
    if (!isPro || o == null) return;
    $('list').value = o; Core.store('pickList', o); del('pickOrig');
    wheel.hi = -1; listInfo(); draw(); setLast(null); $('result').append(el('span', Core.t('allBack'), 'note'));
  });
  $('listSave').addEventListener('click', () => {
    const name = $('listName').value.trim();
    if (!isPro || !name || !$('list').value.trim()) return;
    saved[name] = $('list').value;
    const keys = Object.keys(saved); if (keys.length > 100) delete saved[keys[0]];
    Core.store('pickSaved', JSON.stringify(saved)); renderSaved(name);
  });
  $('listSel').addEventListener('change', () => {
    const k = $('listSel').value;
    if (!isPro || saved[k] == null) return;
    $('list').value = saved[k]; $('listName').value = k; Core.store('pickList', saved[k]);
    del('pickOrig');
    wheel.hi = -1; listInfo(); draw();
  });
  $('listDel').addEventListener('click', () => {
    const k = $('listSel').value;
    if (!isPro || saved[k] == null) return;
    delete saved[k]; Core.store('pickSaved', JSON.stringify(saved)); renderSaved('');
  });
  $('histClear').addEventListener('click', () => { if (!isPro) return; hist = []; Core.store('pickHist', '[]'); renderHist(); });
  $('histCsv').addEventListener('click', () => {
    if (!isPro || !hist.length) return;
    const rows = hist.map(h => ({ time: h.time, type: Core.t('h_' + h.type), result: h.result }));
    const blob = new Blob([R.toCsv(rows)], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'random-history.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 100); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  $('theme').addEventListener('click', () => setTimeout(draw, 0));
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
