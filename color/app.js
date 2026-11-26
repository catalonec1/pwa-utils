(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Convertor de culori', colorLabel: 'Culoare în orice format', pick: 'Alege o culoare', formatsHint: 'HEX, rgb(), hsl(), hwb(), cmyk(), oklch(), lab() sau un nume CSS.', badColor: 'Nu recunosc această culoare. Exemple: #3d5afe, rgb(61, 90, 254), hsl(231 99% 62%), tomato.', fmtTitle: 'Formate', ctTitle: 'Verificare contrast (WCAG)', fgLabel: 'Text', bgLabel: 'Fundal', swap: '⇅ Inversează', useFg: 'Culoarea curentă ca text', useBg: 'Culoarea curentă ca fundal', sampleLarge: 'Text mare 24px', sampleNormal: 'Textul obișnuit se citește mai ușor cu un contrast suficient.', ratio: 'Contrast {r}:1', aaN: 'AA text normal', aaL: 'AA text mare', aaaN: 'AAA text normal', aaaL: 'AAA text mare', pass: '✓', fail: '✗', nameTitle: 'Cel mai apropiat nume de culoare CSS', exact: 'Potrivire exactă', near: 'Diferență ΔE (OKLab) {d}', palTitle: 'Generator de palete', palHint: 'Apasă pe o culoare ca să copiezi codul HEX.', palName: 'Numele paletei', palSave: 'Salvează paleta', complementary: 'Complementară', analogous: 'Analogă', triadic: 'Triadică', tetradic: 'Tetradică', tints: 'Nuanțe deschise și închise', savedTitle: 'Palete salvate și export', noSaved: 'Nicio paletă salvată încă. Generează una și apasă „Salvează paleta”.', del: 'Șterge', use: 'Folosește', expFmt: 'Exportă ca', fmtCss: 'Variabile CSS', fmtTw: 'Configurație Tailwind', saveFile: 'Salvează fișier', cvdTitle: 'Previzualizare daltonism', cvdHint: 'Cum arată culoarea curentă și perechea de contrast pentru fiecare tip de deficiență de vedere a culorilor (simulare).', normal: 'Vedere normală', protanopia: 'Protanopie (fără roșu)', deuteranopia: 'Deuteranopie (fără verde)', tritanopia: 'Tritanopie (fără albastru)', proOnly: 'Disponibil în Pro.', proPitch: 'Generator de palete, cel mai apropiat nume CSS, OKLCH și LAB, palete salvate cu export CSS, JSON și Tailwind și previzualizare pentru daltonism.', defName: 'Paleta mea' },
    en: { appName: 'Color Converter', colorLabel: 'Color in any format', pick: 'Pick a color', formatsHint: 'HEX, rgb(), hsl(), hwb(), cmyk(), oklch(), lab() or a CSS name.', badColor: 'This color is not recognized. Examples: #3d5afe, rgb(61, 90, 254), hsl(231 99% 62%), tomato.', fmtTitle: 'Formats', ctTitle: 'Contrast checker (WCAG)', fgLabel: 'Text', bgLabel: 'Background', swap: '⇅ Swap', useFg: 'Current color as text', useBg: 'Current color as background', sampleLarge: 'Large text 24px', sampleNormal: 'Normal body text is easier to read with enough contrast.', ratio: 'Contrast {r}:1', aaN: 'AA normal text', aaL: 'AA large text', aaaN: 'AAA normal text', aaaL: 'AAA large text', pass: '✓', fail: '✗', nameTitle: 'Nearest CSS color name', exact: 'Exact match', near: 'Difference ΔE (OKLab) {d}', palTitle: 'Palette generator', palHint: 'Click a color to copy its HEX.', palName: 'Palette name', palSave: 'Save palette', complementary: 'Complementary', analogous: 'Analogous', triadic: 'Triadic', tetradic: 'Tetradic', tints: 'Tints and shades', savedTitle: 'Saved palettes and export', noSaved: 'No saved palettes yet. Generate one and press “Save palette”.', del: 'Delete', use: 'Use', expFmt: 'Export as', fmtCss: 'CSS variables', fmtTw: 'Tailwind config', saveFile: 'Save file', cvdTitle: 'Colorblindness preview', cvdHint: 'How the current color and the contrast pair look with each type of color vision deficiency (simulation).', normal: 'Normal vision', protanopia: 'Protanopia (no red)', deuteranopia: 'Deuteranopia (no green)', tritanopia: 'Tritanopia (no blue)', proOnly: 'Available in Pro.', proPitch: 'Palette generator, nearest CSS color name, OKLCH and LAB, saved palettes with CSS, JSON and Tailwind export, and colorblindness previews.', defName: 'My palette' },
    ru: { appName: 'Конвертер цветов', colorLabel: 'Цвет в любом формате', pick: 'Выбрать цвет', formatsHint: 'HEX, rgb(), hsl(), hwb(), cmyk(), oklch(), lab() или имя CSS.', badColor: 'Цвет не распознан. Примеры: #3d5afe, rgb(61, 90, 254), hsl(231 99% 62%), tomato.', fmtTitle: 'Форматы', ctTitle: 'Проверка контраста (WCAG)', fgLabel: 'Текст', bgLabel: 'Фон', swap: '⇅ Поменять', useFg: 'Текущий цвет как текст', useBg: 'Текущий цвет как фон', sampleLarge: 'Крупный текст 24px', sampleNormal: 'Обычный текст легче читать при достаточном контрасте.', ratio: 'Контраст {r}:1', aaN: 'AA обычный текст', aaL: 'AA крупный текст', aaaN: 'AAA обычный текст', aaaL: 'AAA крупный текст', pass: '✓', fail: '✗', nameTitle: 'Ближайшее имя цвета CSS', exact: 'Точное совпадение', near: 'Разница ΔE (OKLab) {d}', palTitle: 'Генератор палитр', palHint: 'Нажмите на цвет, чтобы скопировать HEX.', palName: 'Название палитры', palSave: 'Сохранить палитру', complementary: 'Комплементарная', analogous: 'Аналоговая', triadic: 'Триада', tetradic: 'Тетрада', tints: 'Светлые и тёмные оттенки', savedTitle: 'Сохранённые палитры и экспорт', noSaved: 'Сохранённых палитр пока нет. Создайте палитру и нажмите «Сохранить палитру».', del: 'Удалить', use: 'Выбрать', expFmt: 'Экспорт как', fmtCss: 'CSS-переменные', fmtTw: 'Конфигурация Tailwind', saveFile: 'Сохранить файл', cvdTitle: 'Просмотр для дальтонизма', cvdHint: 'Как выглядят текущий цвет и контрастная пара при каждом типе нарушения цветового зрения (симуляция).', normal: 'Обычное зрение', protanopia: 'Протанопия (без красного)', deuteranopia: 'Дейтеранопия (без зелёного)', tritanopia: 'Тританопия (без синего)', proOnly: 'Доступно в Pro.', proPitch: 'Генератор палитр, ближайшее имя цвета CSS, OKLCH и LAB, сохранённые палитры с экспортом в CSS, JSON и Tailwind и просмотр для дальтонизма.', defName: 'Моя палитра' }
  };
  const C = ColorLogic;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const LABELS = { hex: 'HEX', rgb: 'RGB', hsl: 'HSL', hwb: 'HWB', cmyk: 'CMYK', oklch: 'OKLCH', lab: 'LAB' };
  let isPro = false, cur = C.parse('#3d5afe'), fg = C.parse('#1b1f2a'), bg = C.parse('#ffffff'), pals = [];
  let scheme = C.SCHEMES.includes(Core.store('colorScheme')) ? Core.store('colorScheme') : 'analogous';
  try { pals = JSON.parse(Core.store('colorPals') || '[]'); if (!Array.isArray(pals)) pals = []; } catch (e) { pals = []; }

  const ink = c => C.contrast(c, { r: 0, g: 0, b: 0 }).ratio >= C.contrast(c, { r: 255, g: 255, b: 255 }).ratio ? '#000000' : '#ffffff';
  function copy(text, btn) {
    const done = () => { if (!btn) return; const old = btn.textContent; btn.textContent = Core.t('copied'); setTimeout(() => { btn.textContent = old; }, 1200); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
  }
  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function renderColor() {
    const hex = C.toHex(cur), sw = $('swatch');
    sw.style.background = hex; sw.style.color = ink(cur); sw.textContent = hex;
    $('picker').value = hex;
    const ul = $('fmts'); ul.textContent = '';
    for (const k of C.FREE.concat(C.PRO)) {
      const li = el('li'), locked = C.PRO.includes(k) && !isPro, val = C.format(cur, k);
      li.dataset.k = k;
      li.append(el('span', 'k', LABELS[k]));
      const code = el('code', locked ? 'locked' : '', locked ? Core.t('proOnly') : val); li.append(code);
      const b = el('button', '', Core.t('copy')); b.disabled = locked;
      b.addEventListener('click', () => copy(val, b)); li.append(b);
      ul.append(li);
    }
    renderName(); renderPalette(); renderCvd();
  }
  function renderContrast() {
    const fh = C.toHex(fg), bh = C.toHex(bg), r = C.contrast(fg, bg), pv = $('preview');
    pv.style.color = fh; pv.style.background = bh;
    $('fgPick').value = fh; $('bgPick').value = bh;
    $('ratio').textContent = Core.t('ratio', { r: new Intl.NumberFormat(Core.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r.ratio) });
    const bd = $('badges'); bd.textContent = '';
    for (const [k, ok] of [['aaN', r.aaNormal], ['aaL', r.aaLarge], ['aaaN', r.aaaNormal], ['aaaL', r.aaaLarge]]) {
      const s = el('span', 'badge ' + (ok ? 'pass' : 'fail'), Core.t(ok ? 'pass' : 'fail') + ' ' + Core.t(k)); s.dataset.k = k; bd.append(s);
    }
    renderCvd();
  }
  function renderName() {
    const out = $('nameOut'); out.textContent = '';
    if (!isPro) { out.append(el('p', 'locked', Core.t('proOnly'))); return; }
    const n = C.nearestName(cur), box = el('div', 'named'), sw = el('div', 'sw'), info = el('div');
    sw.style.background = n.hex;
    const name = el('strong', '', n.name); name.id = 'nameVal';
    info.append(name, el('br'), el('code', '', n.hex), el('br'), el('span', 'muted', n.exact ? Core.t('exact') : Core.t('near', { d: n.deltaE })));
    const b = el('button', 'sm', Core.t('copy')); b.addEventListener('click', () => copy(n.name, b));
    box.append(sw, info, b); out.append(box);
  }
  function current() { return C.palette(cur, scheme); }
  function chip(hex, onClick) {
    const b = el('button', 'chip'), s = el('span'); s.style.background = hex;
    b.append(s, el('code', '', hex)); b.title = hex; b.disabled = !isPro;
    b.addEventListener('click', () => onClick(hex, b)); return b;
  }
  function renderPalette() {
    const tabs = $('schemes'); tabs.textContent = '';
    for (const s of C.SCHEMES) {
      const b = el('button', '', Core.t(s)); b.dataset.s = s; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(s === scheme)); b.disabled = !isPro;
      b.addEventListener('click', () => { scheme = s; Core.store('colorScheme', s); renderPalette(); }); tabs.append(b);
    }
    const box = $('palette'); box.textContent = '';
    if (!isPro) { box.append(el('p', 'locked', Core.t('proOnly'))); return; }
    for (const hex of current()) box.append(chip(hex, (h, b) => { copy(h, b.querySelector('code')); }));
  }
  function exportText() {
    const f = $('expFmt').value;
    return f === 'json' ? C.exportJson(pals) : f === 'tw' ? C.exportTailwind(pals) : C.exportCss(pals);
  }
  function renderSaved() {
    const box = $('saved'); box.textContent = '';
    if (!isPro) { box.append(el('p', 'locked', Core.t('proOnly'))); $('expOut').value = ''; return; }
    if (!pals.length) box.append(el('p', 'muted', Core.t('noSaved')));
    pals.forEach((p, i) => {
      const row = el('div', 'saved'), head = el('div', 'head'), strip = el('div', 'strip');
      head.append(el('strong', '', p.name));
      const use = el('button', 'sm', Core.t('use')); use.addEventListener('click', () => setCur(C.parse(p.colors[0]), true));
      const del = el('button', 'sm', Core.t('del')); del.addEventListener('click', () => { pals.splice(i, 1); savePals(); });
      head.append(use, del);
      for (const c of p.colors) { const s = el('span'); s.style.background = c; s.title = c; strip.append(s); }
      row.append(head, strip); box.append(row);
    });
    $('expOut').value = exportText();
  }
  function savePals() { Core.store('colorPals', JSON.stringify(pals)); renderSaved(); }
  function renderCvd() {
    const box = $('cvd'); box.textContent = '';
    if (!isPro) { box.append(el('p', 'locked', Core.t('proOnly'))); return; }
    for (const t of ['normal'].concat(C.CVD)) {
      const sim = c => C.toHex(C.simulate(c, t)), d = el('div'), sw = el('div', 'sw'), tx = el('div', 'tx', 'Aa ' + Core.t('fgLabel'));
      d.dataset.t = t;
      sw.style.background = sim(cur);
      tx.style.color = sim(fg); tx.style.background = sim(bg);
      const r = C.contrast(C.simulate(fg, t), C.simulate(bg, t)).ratio;
      d.append(el('h3', '', Core.t(t)), sw, el('code', '', sim(cur)), tx, el('p', 'muted', Core.t('ratio', { r: r.toFixed(2) })));
      d.lastChild.style.margin = '4px 0 0';
      box.append(d);
    }
  }
  function setCur(c, updateInput) {
    if (!c) return;
    cur = c; if (updateInput) $('color').value = C.toHex(c);
    $('err').textContent = ''; Core.store('colorCur', $('color').value);
    renderColor();
  }
  function all() { renderColor(); renderContrast(); renderSaved(); }
  function lockPro() {
    ['palName', 'palSave', 'expFmt', 'expCopy', 'expFile'].forEach(id => { $(id).disabled = !isPro; });
    all();
  }

  /* stare salvată */
  const savedCur = Core.store('colorCur'); if (savedCur && C.parse(savedCur)) { $('color').value = savedCur; cur = C.parse(savedCur); }
  for (const [k, id] of [['colorFg', 'fg'], ['colorBg', 'bg']]) { const v = Core.store(k); if (v && C.parse(v)) $(id).value = v; }
  fg = C.parse($('fg').value) || fg; bg = C.parse($('bg').value) || bg;

  Core.init(DICT, all);
  lockPro();
  $('color').addEventListener('input', () => {
    const c = C.parse($('color').value);
    if (c) setCur(c, false); else $('err').textContent = $('color').value.trim() ? Core.t('badColor') : '';
  });
  $('picker').addEventListener('input', () => { setCur(C.parse($('picker').value), true); });
  function setPair(which, c, text) {
    if (!c) return;
    if (which === 'fg') fg = c; else bg = c;
    if (text != null) $(which).value = text;
    Core.store(which === 'fg' ? 'colorFg' : 'colorBg', $(which).value); renderContrast();
  }
  for (const w of ['fg', 'bg']) {
    $(w).addEventListener('input', () => setPair(w, C.parse($(w).value)));
    $(w + 'Pick').addEventListener('input', () => setPair(w, C.parse($(w + 'Pick').value), $(w + 'Pick').value));
  }
  $('swap').addEventListener('click', () => { const f = $('fg').value, b = $('bg').value, cf = fg; setPair('fg', bg, b); setPair('bg', cf, f); });
  $('useFg').addEventListener('click', () => setPair('fg', cur, C.toHex(cur)));
  $('useBg').addEventListener('click', () => setPair('bg', cur, C.toHex(cur)));
  $('palSave').addEventListener('click', () => {
    if (!isPro) return;
    const name = $('palName').value.trim() || Core.t('defName') + ' ' + (pals.length + 1);
    pals.push({ name, colors: current() }); if (pals.length > 100) pals = pals.slice(-100);
    $('palName').value = ''; savePals();
  });
  $('expFmt').addEventListener('change', () => { $('expOut').value = exportText(); });
  $('expCopy').addEventListener('click', () => { if (isPro) copy(exportText(), $('expCopy')); });
  $('expFile').addEventListener('click', () => {
    if (!isPro) return;
    const f = $('expFmt').value;
    download(f === 'json' ? 'palettes.json' : f === 'tw' ? 'tailwind.colors.js' : 'palettes.css', exportText(), f === 'json' ? 'application/json' : f === 'tw' ? 'text/javascript' : 'text/css');
  });
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
