(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Convertor rapid de unități', value: 'Valoare', from: 'Din', to: 'În', swap: 'Inversează', allUnits: 'Toate unitățile', history: 'Istoric', historyLocked: 'Pro păstrează ultimele 30 de conversii.', proPitch: 'Deblochează presiune, energie, putere, unghi și consum de carburant, plus istoricul conversiilor.', invalid: 'Introdu un număr',
      length: 'Lungime', mass: 'Masă', temperature: 'Temperatură', volume: 'Volum', area: 'Suprafață', speed: 'Viteză', time: 'Timp', data: 'Date', pressure: 'Presiune', energy: 'Energie', power: 'Putere', angle: 'Unghi', fuel: 'Consum' },
    en: { appName: 'Quick Unit Converter', value: 'Value', from: 'From', to: 'To', swap: 'Swap', allUnits: 'All units', history: 'History', historyLocked: 'Pro keeps your last 30 conversions.', proPitch: 'Unlocks pressure, energy, power, angle and fuel economy, plus conversion history.', invalid: 'Enter a number',
      length: 'Length', mass: 'Mass', temperature: 'Temperature', volume: 'Volume', area: 'Area', speed: 'Speed', time: 'Time', data: 'Data', pressure: 'Pressure', energy: 'Energy', power: 'Power', angle: 'Angle', fuel: 'Fuel economy' },
    ru: { appName: 'Быстрый конвертер единиц', value: 'Значение', from: 'Из', to: 'В', swap: 'Поменять', allUnits: 'Все единицы', history: 'История', historyLocked: 'Pro хранит последние 30 конвертаций.', proPitch: 'Открывает давление, энергию, мощность, углы и расход топлива, а также историю.', invalid: 'Введите число',
      length: 'Длина', mass: 'Масса', temperature: 'Температура', volume: 'Объём', area: 'Площадь', speed: 'Скорость', time: 'Время', data: 'Данные', pressure: 'Давление', energy: 'Энергия', power: 'Мощность', angle: 'Угол', fuel: 'Расход топлива' }
  };
  const LABEL = { C: '°C', F: '°F', K: 'K', m2: 'm²', cm2: 'cm²', km2: 'km²', ft2: 'ft²', mi2: 'mi²', m3: 'm³', mps: 'm/s', kmh: 'km/h', galUS: 'gal (US)', galUK: 'gal (UK)', floz: 'fl oz', l100: 'L/100 km', kml: 'km/L', mpgUS: 'mpg (US)', mpgUK: 'mpg (UK)', deg: '°', b: 'bit', B: 'byte' };
  const DEFAULTS = { length: ['km', 'mi'], mass: ['kg', 'lb'], temperature: ['C', 'F'], volume: ['l', 'galUS'], area: ['m2', 'ft2'], speed: ['kmh', 'mph'], time: ['h', 'min'], data: ['GB', 'MB'], pressure: ['bar', 'psi'], energy: ['kcal', 'kJ'], power: ['kW', 'hp'], angle: ['deg', 'rad'], fuel: ['l100', 'mpgUS'] };
  const $ = id => document.getElementById(id);
  let cat = Core.store('cat') || 'length';
  let isPro = false;
  let history = [];
  try { history = JSON.parse(Core.store('history') || '[]'); } catch (e) { history = []; }

  const label = u => LABEL[u] || u;
  const parse = s => Number(String(s).replace(/\s/g, '').replace(',', '.'));

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
  }
  let histTimer = null;
  function update() {
    const v = parse($('value').value);
    const from = $('from').value, to = $('to').value;
    if (!Number.isFinite(v) || $('value').value.trim() === '') {
      $('result').textContent = Core.t('invalid'); $('all').innerHTML = ''; return;
    }
    const r = Units.format(Units.convert(cat, from, to, v));
    $('result').textContent = `${Units.format(v)} ${label(from)} = ${r} ${label(to)}`;
    const all = $('all'); all.innerHTML = '';
    Object.keys(Units.CATEGORIES[cat].units).forEach(u => {
      if (u === from) return;
      const li = document.createElement('li');
      li.innerHTML = '<span></span><strong></strong>';
      li.firstChild.textContent = label(u);
      li.lastChild.textContent = Units.format(Units.convert(cat, from, u, v));
      all.appendChild(li);
    });
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
  $('from').addEventListener('change', update);
  $('to').addEventListener('change', update);
  $('swap').addEventListener('click', () => { const f = $('from').value; $('from').value = $('to').value; $('to').value = f; update(); });
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
