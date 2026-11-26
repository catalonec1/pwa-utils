(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Convertor rapid de unități', value: 'Valoare', from: 'Din', to: 'În', swap: 'Inversează', allUnits: 'Toate unitățile', history: 'Istoric', historyLocked: 'Pro păstrează ultimele 30 de conversii.', proPitch: 'Deblochează presiune, energie, putere, unghi, consum, frecvență, cuplu, densitate, debit, ritm de alergare (min/km) și viteză de transfer, plus istoricul conversiilor.', invalid: 'Introdu un număr', invalidBase: 'Introdu un număr întreg valid în această bază', paceHint: 'Ritmul se poate scrie și ca minute:secunde, de ex. 5:30.', basesHint: 'Numere întregi de orice mărime; sunt acceptate prefixele 0b, 0o, 0x.',
      length: 'Lungime', mass: 'Masă', temperature: 'Temperatură', volume: 'Volum', area: 'Suprafață', speed: 'Viteză', time: 'Timp', data: 'Date', bases: 'Baze numerice', pace: 'Ritm', datarate: 'Viteză de transfer', pressure: 'Presiune', energy: 'Energie', power: 'Putere', angle: 'Unghi', fuel: 'Consum', frequency: 'Frecvență', torque: 'Cuplu', density: 'Densitate', flow: 'Debit' },
    en: { appName: 'Quick Unit Converter', value: 'Value', from: 'From', to: 'To', swap: 'Swap', allUnits: 'All units', history: 'History', historyLocked: 'Pro keeps your last 30 conversions.', proPitch: 'Unlocks pressure, energy, power, angle, fuel economy, frequency, torque, density, flow rate, running pace (min/km) and data rate, plus conversion history.', invalid: 'Enter a number', invalidBase: 'Enter a valid whole number in this base', paceHint: 'Pace can also be typed as minutes:seconds, e.g. 5:30.', basesHint: 'Whole numbers of any size; 0b, 0o and 0x prefixes are accepted.',
      length: 'Length', mass: 'Mass', temperature: 'Temperature', volume: 'Volume', area: 'Area', speed: 'Speed', time: 'Time', data: 'Data', bases: 'Number bases', pace: 'Pace', datarate: 'Data rate', pressure: 'Pressure', energy: 'Energy', power: 'Power', angle: 'Angle', fuel: 'Fuel economy', frequency: 'Frequency', torque: 'Torque', density: 'Density', flow: 'Flow rate' },
    ru: { appName: 'Быстрый конвертер единиц', value: 'Значение', from: 'Из', to: 'В', swap: 'Поменять', allUnits: 'Все единицы', history: 'История', historyLocked: 'Pro хранит последние 30 конвертаций.', proPitch: 'Открывает давление, энергию, мощность, углы, расход топлива, частоту, крутящий момент, плотность, расход, темп бега (мин/км) и скорость передачи данных, а также историю.', invalid: 'Введите число', invalidBase: 'Введите правильное целое число в этой системе', paceHint: 'Темп можно вводить как минуты:секунды, например 5:30.', basesHint: 'Целые числа любой длины; префиксы 0b, 0o и 0x допускаются.',
      length: 'Длина', mass: 'Масса', temperature: 'Температура', volume: 'Объём', area: 'Площадь', speed: 'Скорость', time: 'Время', data: 'Данные', bases: 'Системы счисления', pace: 'Темп', datarate: 'Скорость передачи', pressure: 'Давление', energy: 'Энергия', power: 'Мощность', angle: 'Угол', fuel: 'Расход топлива', frequency: 'Частота', torque: 'Крутящий момент', density: 'Плотность', flow: 'Расход' }
  };
  const LABEL = { C: '°C', F: '°F', K: 'K', m2: 'm²', cm2: 'cm²', km2: 'km²', ft2: 'ft²', mi2: 'mi²', m3: 'm³', mps: 'm/s', kmh: 'km/h', galUS: 'gal (US)', galUK: 'gal (UK)', floz: 'fl oz', l100: 'L/100 km', kml: 'km/L', mpgUS: 'mpg (US)', mpgUK: 'mpg (UK)', deg: '°', b: 'bit', B: 'byte', Nm: 'N·m', kNm: 'kN·m', kgfm: 'kgf·m', lbfft: 'lbf·ft', lbfin: 'lbf·in', kgm3: 'kg/m³', gcm3: 'g/cm³', gml: 'g/mL', gl: 'g/L', lbft3: 'lb/ft³', lbgalUS: 'lb/gal (US)', m3s: 'm³/s', m3h: 'm³/h', ls: 'L/s', lmin: 'L/min', galUSmin: 'gal/min (US)', cfm: 'ft³/min', um: 'µm', ct: 'ct', ptUS: 'pt (US)', qtUS: 'qt (US)', bin: 'BIN (2)', oct: 'OCT (8)', dec: 'DEC (10)', hex: 'HEX (16)', minkm: 'min/km', minmi: 'min/mi', bps: 'bit/s', kbps: 'kbit/s', Mbps: 'Mbit/s', Gbps: 'Gbit/s', Bps: 'B/s', kBps: 'kB/s', MBps: 'MB/s', GBps: 'GB/s', MiBps: 'MiB/s' };
  const DEFAULTS = { length: ['km', 'mi'], mass: ['kg', 'lb'], temperature: ['C', 'F'], volume: ['l', 'galUS'], area: ['m2', 'ft2'], speed: ['kmh', 'mph'], time: ['h', 'min'], data: ['GB', 'MB'], bases: ['dec', 'hex'], pace: ['minkm', 'kmh'], datarate: ['Mbps', 'MBps'], pressure: ['bar', 'psi'], energy: ['kcal', 'kJ'], power: ['kW', 'hp'], angle: ['deg', 'rad'], fuel: ['l100', 'mpgUS'], frequency: ['rpm', 'Hz'], torque: ['Nm', 'lbfft'], density: ['gcm3', 'kgm3'], flow: ['lmin', 'galUSmin'] };
  const $ = id => document.getElementById(id);
  let cat = Core.store('cat') || 'length';
  let isPro = false;
  let history = [];
  let lastFrom = null;
  try { history = JSON.parse(Core.store('history') || '[]'); } catch (e) { history = []; }

  const label = u => LABEL[u] || u;
  const isPace = u => Units.PACE_UNITS.includes(u);
  const parse = (s, unit) => isPace(unit) ? Units.parseMinSec(s) : Number(String(s).replace(/\s/g, '').replace(',', '.'));
  const fmt = (n, unit) => isPace(unit) ? Units.formatMinSec(n) : Units.format(n);

  function renderTabs() {
    const box = $('cats'); box.innerHTML = '';
    Units.categories(true).forEach(c => {
      const b = document.createElement('button');
      const locked = Units.CATEGORIES[c].pro && !isPro;
      b.textContent = Core.t(c) + (locked ? ' 🔒' : '');
      b.setAttribute('role', 'tab');
      b.dataset.cat = c;
      b.setAttribute('aria-selected', String(c === cat));
      b.addEventListener('click', () => {
        if (locked) { $('proBox').scrollIntoView({ behavior: 'smooth' }); return; }
        cat = c; Core.store('cat', c); renderUnits(); renderTabs(); update();
      });
      box.appendChild(b);
    });
  }
  function renderUnits() {
    const units = Object.keys(Units.CATEGORIES[cat].units);
    const [f, t] = DEFAULTS[cat];
    ['from', 'to'].forEach((id, i) => {
      const s = $(id); s.innerHTML = '';
      units.forEach(u => { const o = document.createElement('option'); o.value = u; o.textContent = label(u); s.appendChild(o); });
      s.value = i ? t : f;
    });
    lastFrom = $('from').value;
  }
  let histTimer = null;
  function renderHint() {
    const textCat = !!Units.CATEGORIES[cat].text;
    $('value').inputMode = textCat ? 'text' : 'decimal';
    const hint = textCat ? 'basesHint' : cat === 'pace' ? 'paceHint' : '';
    $('hint').textContent = hint ? Core.t(hint) : '';
    $('hint').classList.toggle('hidden', !hint);
  }
  function listAll(from, valueOf) {
    const all = $('all'); all.innerHTML = '';
    Object.keys(Units.CATEGORIES[cat].units).forEach(u => {
      if (u === from) return;
      const li = document.createElement('li');
      li.innerHTML = '<span></span><strong></strong>';
      li.firstChild.textContent = label(u);
      li.lastChild.textContent = valueOf(u);
      all.appendChild(li);
    });
  }
  function update() {
    const raw = $('value').value;
    const from = $('from').value, to = $('to').value;
    renderHint();
    if (Units.CATEGORIES[cat].text) {
      const r = raw.trim() === '' ? null : Units.convertBase(raw, from, to);
      if (r === null) { $('result').textContent = Core.t('invalidBase'); $('all').innerHTML = ''; return; }
      $('result').textContent = `${Units.convertBase(raw, from, from)} ${label(from)} = ${r} ${label(to)}`;
      listAll(from, u => Units.convertBase(raw, from, u));
    } else {
      const v = parse(raw, from);
      if (!Number.isFinite(v) || raw.trim() === '') {
        $('result').textContent = Core.t('invalid'); $('all').innerHTML = ''; return;
      }
      const r = fmt(Units.convert(cat, from, to, v), to);
      $('result').textContent = `${fmt(v, from)} ${label(from)} = ${r} ${label(to)}`;
      listAll(from, u => fmt(Units.convert(cat, from, u, v), u));
    }
    if (isPro) {
      clearTimeout(histTimer);
      histTimer = setTimeout(() => addHistory($('result').textContent), 1200);
    }
  }
  function addHistory(line) {
    if (history[0] === line) return;
    history.unshift(line); history = history.slice(0, 30);
    Core.store('history', JSON.stringify(history)); renderHistory();
  }
  function renderHistory() {
    $('historyLocked').classList.toggle('hidden', isPro);
    const ul = $('history'); ul.innerHTML = '';
    if (!isPro) return;
    history.forEach(h => { const li = document.createElement('li'); li.textContent = h; ul.appendChild(li); });
  }

  Core.init(DICT, () => { renderTabs(); update(); });
  if (!Units.CATEGORIES[cat] || Units.CATEGORIES[cat].pro) cat = 'length';
  renderTabs(); renderUnits(); update(); renderHistory();
  $('value').addEventListener('input', update);
  $('from').addEventListener('change', () => {
    /* Number bases: keep the same number when the input base changes. */
    if (Units.CATEGORIES[cat].text) {
      const r = Units.convertBase($('value').value, lastFrom, $('from').value);
      if (r !== null) $('value').value = r;
    }
    lastFrom = $('from').value; update();
  });
  $('to').addEventListener('change', update);
  $('swap').addEventListener('click', () => {
    const f = $('from').value;
    if (Units.CATEGORIES[cat].text) {
      const r = Units.convertBase($('value').value, f, $('to').value);
      if (r !== null) $('value').value = r;
    }
    $('from').value = $('to').value; $('to').value = f; lastFrom = $('from').value; update();
  });
  $('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('result').textContent); $('copy').textContent = Core.t('copied'); setTimeout(() => { $('copy').textContent = Core.t('copy'); }, 1200); } catch (e) { /* clipboard blocked */ }
  });
  Core.wirePro(SKU, owned => {
    isPro = owned;
    const saved = Core.store('cat');
    if (owned && saved && Units.CATEGORIES[saved]) { cat = saved; renderUnits(); }
    renderTabs(); renderHistory(); update();
  });
})();
