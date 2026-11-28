(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Formatator JSON', tyTitle: 'Structură și tipuri', tyHint: 'Fiecare cale cu tipurile ei JSON. [*] înseamnă orice element dintr-o listă; cheile „opțional” lipsesc din unele obiecte.', optional: 'opțional', tyMore: '… încă {n} căi', t_object: 'obiect', t_array: 'listă', t_string: 'text', t_number: 'număr', t_boolean: 'boolean', t_null: 'null', srcLabel: 'Lipește sau scrie JSON', indent: 'Indentare', sp2: '2 spații', sp4: '4 spații', tabs: 'Tab-uri', sortKeys: 'Sortează cheile', format: 'Formatează', minify: 'Minifică', sample: 'Exemplu', goErr: 'Mergi la eroare', treeTitle: 'Arbore', expand: 'Extinde tot', collapse: 'Restrânge', path: 'Cale:', pathHint: 'apasă pe o cheie', qTitle: 'Interogare (JSONPath)', qHint: 'Exemple: $.items[*].name · $..id · items[0] · items[-1] · $[\'o cheie\'] · items[?(@.status==\'active\')]', qPaths: 'Arată căile', cvTitle: 'Conversie', cvHint: 'Folosește textul din editorul de sus. Pentru YAML sau CSV → JSON, lipește acolo YAML sau CSV.', convert: 'Convertește', download: 'Descarcă', useInput: 'Pune în editor', dfTitle: 'Compară două documente JSON', dfLabel: 'Al doilea JSON, comparat cu editorul de sus', compare: 'Compară', escTitle: 'Escape / unescape', escPh: 'Text sau un șir JSON cu escape', escape: 'Escape', unescape: 'Unescape', snTitle: 'Fragmente salvate', snName: 'Nume', snSave: 'Salvează editorul', load: 'Încarcă', del: 'Șterge', noSnips: 'Niciun fragment salvat.', local: 'JSON-ul tău nu părăsește dispozitivul.', proPitch: 'Interogare JSONPath cu filtre, JSON ↔ YAML și JSON ↔ CSV, compararea a două documente, escape și unescape pentru șiruri, fragmente salvate.',
      valid: '✓ JSON valid', empty: 'Lipește JSON ca să-l verifici.', errAt: '✗ Linia {l}, coloana {c}: {m}', bigNums: '⚠ {n} numere întregi depășesc 2^53 și își pierd precizia la formatare.',
      e_end: 'textul se termină prea devreme', e_unexpected: 'caracter neașteptat {ch}', e_expectedKey: 'se aștepta un nume de proprietate între ghilimele duble, găsit {ch}', e_expectedColon: 'se aștepta „:” după numele proprietății, găsit {ch}', e_expectedComma: 'se aștepta „,” sau o paranteză de închidere, găsit {ch}', e_trailingComma: 'virgulă în plus înainte de {ch}', e_badNumber: 'număr invalid', e_unterminated: 'șir neînchis (lipsește ")', e_badEscape: 'secvență escape invalidă în șir', e_control: 'caracter de control în șir (folosește \\n, \\t)', e_extra: 'text în plus după sfârșitul JSON-ului: {ch}', nl: 'linie nouă', tab: 'tab',
      st_keys: 'Chei', st_objects: 'Obiecte', st_arrays: 'Liste', st_values: 'Valori', st_depth: 'Adâncime', st_size: 'Mărime', st_min: 'minificat', items: '{n} elemente', props: '{n} chei', more: '… încă {n}',
      nMatch: '{n} rezultate', badPath: 'Cale invalidă lângă „{near}”', needJson: 'Editorul nu conține JSON valid: {m}', yamlErr: 'YAML nesuportat la linia {l}: {why}', cvOk: 'Gata: {n} caractere.', same: 'Documentele sunt identice.', dfSum: '{a} adăugate · {r} eliminate · {c} modificate', added: 'adăugat', removed: 'eliminat', changed: 'modificat', escBad: 'Nu este un șir JSON valid.' },
    en: { appName: 'JSON Formatter', tyTitle: 'Structure and types', tyHint: 'Every path with its JSON types. [*] means any item of a list; “optional” keys are missing in some objects.', optional: 'optional', tyMore: '… {n} more paths', t_object: 'object', t_array: 'array', t_string: 'string', t_number: 'number', t_boolean: 'boolean', t_null: 'null', srcLabel: 'Paste or type JSON', indent: 'Indent', sp2: '2 spaces', sp4: '4 spaces', tabs: 'Tabs', sortKeys: 'Sort keys', format: 'Format', minify: 'Minify', sample: 'Example', goErr: 'Go to error', treeTitle: 'Tree', expand: 'Expand all', collapse: 'Collapse', path: 'Path:', pathHint: 'click a key', qTitle: 'Query (JSONPath)', qHint: 'Examples: $.items[*].name · $..id · items[0] · items[-1] · $[\'a key\'] · items[?(@.status==\'active\')]', qPaths: 'Show paths', cvTitle: 'Convert', cvHint: 'Uses the text in the editor above. For YAML or CSV to JSON, paste YAML or CSV there.', convert: 'Convert', download: 'Download', useInput: 'Put in editor', dfTitle: 'Compare two JSON documents', dfLabel: 'Second JSON, compared with the editor above', compare: 'Compare', escTitle: 'Escape / unescape', escPh: 'Text or an escaped JSON string', escape: 'Escape', unescape: 'Unescape', snTitle: 'Saved snippets', snName: 'Name', snSave: 'Save editor', load: 'Load', del: 'Delete', noSnips: 'No snippets saved.', local: 'Your JSON never leaves this device.', proPitch: 'JSONPath query with filters, JSON ↔ YAML and JSON ↔ CSV, compare two documents, escape and unescape strings, saved snippets.',
      valid: '✓ Valid JSON', empty: 'Paste JSON to check it.', errAt: '✗ Line {l}, column {c}: {m}', bigNums: '⚠ {n} integers are larger than 2^53 and lose precision when formatted.',
      e_end: 'unexpected end of input', e_unexpected: 'unexpected character {ch}', e_expectedKey: 'expected a property name in double quotes, found {ch}', e_expectedColon: 'expected ":" after the property name, found {ch}', e_expectedComma: 'expected "," or a closing bracket, found {ch}', e_trailingComma: 'trailing comma before {ch}', e_badNumber: 'invalid number', e_unterminated: 'unterminated string (missing ")', e_badEscape: 'invalid escape sequence in string', e_control: 'control character in string (use \\n, \\t)', e_extra: 'extra text after the end of the JSON: {ch}', nl: 'newline', tab: 'tab',
      st_keys: 'Keys', st_objects: 'Objects', st_arrays: 'Arrays', st_values: 'Values', st_depth: 'Depth', st_size: 'Size', st_min: 'minified', items: '{n} items', props: '{n} keys', more: '… {n} more',
      nMatch: '{n} matches', badPath: 'Bad path near "{near}"', needJson: 'The editor does not hold valid JSON: {m}', yamlErr: 'Unsupported YAML at line {l}: {why}', cvOk: 'Done: {n} characters.', same: 'The documents are identical.', dfSum: '{a} added · {r} removed · {c} changed', added: 'added', removed: 'removed', changed: 'changed', escBad: 'Not a valid JSON string.' },
    ru: { appName: 'Форматер JSON', tyTitle: 'Структура и типы', tyHint: 'Каждый путь и его типы JSON. [*] — любой элемент массива; «необязательно» — ключ есть не во всех объектах.', optional: 'необязательно', tyMore: '… ещё путей: {n}', t_object: 'объект', t_array: 'массив', t_string: 'строка', t_number: 'число', t_boolean: 'логическое', t_null: 'null', srcLabel: 'Вставьте или введите JSON', indent: 'Отступ', sp2: '2 пробела', sp4: '4 пробела', tabs: 'Табуляция', sortKeys: 'Сортировать ключи', format: 'Форматировать', minify: 'Сжать', sample: 'Пример', goErr: 'К ошибке', treeTitle: 'Дерево', expand: 'Развернуть всё', collapse: 'Свернуть', path: 'Путь:', pathHint: 'нажмите на ключ', qTitle: 'Запрос (JSONPath)', qHint: 'Примеры: $.items[*].name · $..id · items[0] · items[-1] · $[\'ключ\'] · items[?(@.status==\'active\')]', qPaths: 'Показать пути', cvTitle: 'Конвертация', cvHint: 'Берёт текст из редактора выше. Для YAML или CSV → JSON вставьте туда YAML или CSV.', convert: 'Конвертировать', download: 'Скачать', useInput: 'В редактор', dfTitle: 'Сравнение двух JSON', dfLabel: 'Второй JSON, сравнивается с редактором выше', compare: 'Сравнить', escTitle: 'Экранирование', escPh: 'Текст или экранированная строка JSON', escape: 'Экранировать', unescape: 'Разэкранировать', snTitle: 'Сохранённые фрагменты', snName: 'Название', snSave: 'Сохранить редактор', load: 'Открыть', del: 'Удалить', noSnips: 'Нет сохранённых фрагментов.', local: 'Ваш JSON не покидает устройство.', proPitch: 'Запросы JSONPath с фильтрами, JSON ↔ YAML и JSON ↔ CSV, сравнение двух документов, экранирование строк, сохранённые фрагменты.',
      valid: '✓ Корректный JSON', empty: 'Вставьте JSON для проверки.', errAt: '✗ Строка {l}, столбец {c}: {m}', bigNums: '⚠ {n} целых чисел больше 2^53 и теряют точность при форматировании.',
      e_end: 'неожиданный конец текста', e_unexpected: 'неожиданный символ {ch}', e_expectedKey: 'ожидалось имя свойства в двойных кавычках, найдено {ch}', e_expectedColon: 'ожидалось «:» после имени свойства, найдено {ch}', e_expectedComma: 'ожидалась «,» или закрывающая скобка, найдено {ch}', e_trailingComma: 'лишняя запятая перед {ch}', e_badNumber: 'неверное число', e_unterminated: 'незакрытая строка (нет ")', e_badEscape: 'неверная escape-последовательность в строке', e_control: 'управляющий символ в строке (используйте \\n, \\t)', e_extra: 'лишний текст после конца JSON: {ch}', nl: 'перевод строки', tab: 'табуляция',
      st_keys: 'Ключи', st_objects: 'Объекты', st_arrays: 'Массивы', st_values: 'Значения', st_depth: 'Глубина', st_size: 'Размер', st_min: 'сжатый', items: 'элементов: {n}', props: 'ключей: {n}', more: '… ещё {n}',
      nMatch: 'Найдено: {n}', badPath: 'Неверный путь около «{near}»', needJson: 'В редакторе некорректный JSON: {m}', yamlErr: 'Неподдерживаемый YAML в строке {l}: {why}', cvOk: 'Готово: {n} символов.', same: 'Документы совпадают.', dfSum: 'добавлено {a} · удалено {r} · изменено {c}', added: 'добавлено', removed: 'удалено', changed: 'изменено', escBad: 'Это не корректная строка JSON.' }
  };
  const SAMPLE = '{\n  "id": 1024,\n  "name": "Stelar",\n  "active": true,\n  "tags": ["json", "tools", "offline"],\n  "owner": { "login": "ana", "email": null },\n  "items": [\n    { "sku": "A-1", "status": "active", "qty": 3, "price": 9.5 },\n    { "sku": "B-2", "status": "archived", "qty": 0, "price": 12 },\n    { "sku": "C-3", "status": "active", "qty": 7, "price": 4.25 }\n  ]\n}';
  const J = JsonFmt;
  const $ = id => document.getElementById(id);
  const fmtN = n => new Intl.NumberFormat(Core.lang).format(n);
  let isPro = false, snips = [], last = null, cvKind = 'json', timer = 0;
  try { snips = JSON.parse(Core.store('jsonSnips') || '[]'); } catch (e) { snips = []; }

  function showCh(c) {
    if (c === undefined) return 'EOF';
    if (c === '\n' || c === '\r') return Core.t('nl');
    if (c === '\t') return Core.t('tab');
    return '“' + c + '”';
  }
  const errText = r => Core.t('e_' + r.code, { ch: showCh(r.ch) });
  function size(b) {
    const u = b < 1024 ? [b, 'B'] : b < 1048576 ? [b / 1024, 'KB'] : [b / 1048576, 'MB'];
    return new Intl.NumberFormat(Core.lang, { maximumFractionDigits: 1 }).format(u[0]) + ' ' + u[1];
  }

  /* ---- validare, stats ---- */
  function validate() {
    const t = $('src').value, st = $('status'), ctx = $('errCtx'), chips = $('stats');
    Core.store('jsonSrc', t);
    ctx.textContent = ''; chips.textContent = ''; $('goErr').classList.add('hidden');
    if (!t.trim()) { last = null; st.className = 'muted'; st.textContent = Core.t('empty'); renderTree(); renderTypes(); runPro(); return; }
    last = J.check(t);
    if (!last.ok) {
      st.className = 'bad'; st.textContent = Core.t('errAt', { l: fmtN(last.line), c: fmtN(last.col), m: errText(last) });
      const start = Math.max(0, last.col - 60), line = last.lineText.slice(start, start + 100).replace(/\t/g, ' ');
      ctx.textContent = (start ? '…' : '') + line + '\n' + ' '.repeat(last.col - 1 - start + (start ? 1 : 0)) + '^';
      $('goErr').classList.remove('hidden');
    } else {
      st.className = 'ok'; st.textContent = Core.t('valid') + (last.bigNums ? '  ' + Core.t('bigNums', { n: last.bigNums }) : '');
      const s = J.stats(t);
      for (const [k, v] of [['st_keys', fmtN(s.keys)], ['st_objects', fmtN(s.objects)], ['st_arrays', fmtN(s.arrays)], ['st_values', fmtN(s.values)], ['st_depth', fmtN(s.depth)], ['st_size', size(s.bytes) + ' · ' + Core.t('st_min') + ' ' + size(s.minBytes)]]) {
        const c = document.createElement('span'), b = document.createElement('b');
        b.textContent = v; c.append(Core.t(k) + ' ', b); chips.append(c);
      }
    }
    renderTree(); renderTypes(); runPro();
  }
  function goErr() {
    if (!last || last.ok) return;
    const ta = $('src'), off = /^﻿/.test(ta.value) ? 1 : 0;
    ta.focus(); ta.setSelectionRange(last.pos + off, Math.min(last.pos + off + 1, ta.value.length));
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    ta.scrollTop = Math.max(0, (last.line - 4) * lh);
  }
  function rewrite(fn) {
    if (!last || !last.ok) { goErr(); return; }
    $('src').value = fn($('src').value);
    validate();
  }

  /* ---- arbore (copiii se construiesc doar la deschidere) ---- */
  const LIMIT = 500;
  function keyEl(key, path) {
    const k = document.createElement('span'); k.className = 'k';
    k.textContent = typeof key === 'number' ? key : JSON.stringify(key);
    k.addEventListener('click', e => { e.preventDefault(); $('treePath').textContent = path; $('treePath').className = ''; });
    return k;
  }
  function valEl(v) {
    const s = document.createElement('span');
    s.className = typeof v === 'string' ? 's' : typeof v === 'number' ? 'n' : typeof v === 'boolean' ? 'b' : 'z';
    s.textContent = JSON.stringify(v);
    return s;
  }
  function entries(v) { return Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.keys(v).map(k => [k, v[k]]); }
  function fill(d) {
    if (d._done) return;
    d._done = true;
    const list = entries(d._v);
    list.slice(0, LIMIT).forEach(([k, x]) => d.append(node(k, x, J.pathKey(d._p, k))));
    if (list.length > LIMIT) { const m = document.createElement('div'); m.className = 'leaf c'; m.textContent = Core.t('more', { n: fmtN(list.length - LIMIT) }); d.append(m); }
  }
  function node(key, v, path) {
    if (v && typeof v === 'object') {
      const d = document.createElement('details'), s = document.createElement('summary'), c = document.createElement('span');
      d._v = v; d._p = path;
      if (key !== null) s.append(keyEl(key, path), ': ');
      const n = Array.isArray(v) ? v.length : Object.keys(v).length;
      c.className = 'c'; c.textContent = (Array.isArray(v) ? '[ ' : '{ ') + Core.t(Array.isArray(v) ? 'items' : 'props', { n: fmtN(n) }) + (Array.isArray(v) ? ' ]' : ' }');
      s.append(c); d.append(s);
      d.addEventListener('toggle', () => { if (d.open) fill(d); });
      return d;
    }
    const div = document.createElement('div'); div.className = 'leaf';
    if (key !== null) div.append(keyEl(key, path), ': ');
    div.append(valEl(v));
    return div;
  }
  function openAll(d, budget) {
    fill(d); d.open = true; budget.n -= d.children.length;
    for (const c of d.children) { if (budget.n <= 0) return; if (c.tagName === 'DETAILS') openAll(c, budget); }
  }
  function renderTree() {
    const t = $('tree'); t.textContent = '';
    $('treePath').textContent = Core.t('pathHint'); $('treePath').className = 'muted';
    if (!last || !last.ok) return;
    const root = node(null, last.value, '$');
    t.append(root);
    if (root.tagName === 'DETAILS') {
      fill(root); root.open = true;
      for (const c of root.children) if (c.tagName === 'DETAILS' && root.children.length < 30) { fill(c); c.open = true; }
    }
  }

  /* ---- structură și tipuri ---- */
  const TY_LIMIT = 1000;
  function renderTypes() {
    const out = $('tyOut');
    if (!last || !last.ok) { out.textContent = ''; return; }
    const rows = J.typeSummary(last.value), shown = rows.slice(0, TY_LIMIT);
    const w = Math.min(48, Math.max(...shown.map(r => r.path.length)));
    let text = shown.map(r => r.path.padEnd(w) + '  ' + r.types.map(t => Core.t('t_' + t)).join(' | ') + (r.optional ? ' (' + Core.t('optional') + ')' : '')).join('\n');
    if (rows.length > TY_LIMIT) text += '\n' + Core.t('tyMore', { n: fmtN(rows.length - TY_LIMIT) });
    out.textContent = text;
  }

  /* ---- Pro ---- */
  function needJson(msgEl) {
    if (last && last.ok) return true;
    msgEl.className = 'msg bad';
    msgEl.textContent = Core.t('needJson', { m: last ? Core.t('errAt', { l: last.line, c: last.col, m: errText(last) }).replace(/^✗ /, '') : Core.t('empty') });
    return false;
  }
  function runQuery() {
    const out = $('qOut'), msg = $('qMsg');
    out.textContent = ''; msg.textContent = ''; msg.className = 'msg muted';
    if (!isPro) return;
    Core.store('jsonQ', $('qPath').value);
    if (!needJson(msg)) return;
    try {
      const res = J.queryValue(last.value, $('qPath').value || '$');
      msg.textContent = Core.t('nMatch', { n: fmtN(res.length) });
      const body = $('qWithPaths').checked ? res.map(r => r.path + ' = ' + JSON.stringify(r.value)).join('\n') : JSON.stringify(res.length === 1 ? res[0].value : res.map(r => r.value), null, 2);
      out.textContent = body.length > 200000 ? body.slice(0, 200000) + '\n…' : body;
    } catch (e) {
      msg.className = 'msg bad'; msg.textContent = Core.t('badPath', { near: e.near || $('qPath').value });
    }
  }
  function convert() {
    const out = $('cvOut'), msg = $('cvMsg'), mode = $('cvMode').value, src = $('src').value;
    out.textContent = ''; msg.textContent = ''; msg.className = 'msg muted';
    if (!isPro) return;
    try {
      let r;
      if (mode === 'json2ts') { if (!needJson(msg)) return; r = J.toTypeScript(last.value, 'Root'); cvKind = 'ts'; }
      else if (mode === 'json2yaml') { if (!needJson(msg)) return; r = J.toYAML(src); cvKind = 'yaml'; }
      else if (mode === 'json2csv') { if (!needJson(msg)) return; r = J.toCSV(src); cvKind = 'csv'; }
      else if (mode === 'yaml2json') { r = J.fromYAML(src); cvKind = 'json'; }
      else { r = J.fromCSV(src); cvKind = 'json'; }
      out.textContent = r; msg.textContent = Core.t('cvOk', { n: fmtN(r.length) });
    } catch (e) {
      msg.className = 'msg bad';
      msg.textContent = e.line ? Core.t('yamlErr', { l: e.line, why: e.why }) : e.message;
    }
  }
  function runDiff() {
    const ul = $('diffOut'), sum = $('diffSum');
    ul.textContent = ''; sum.textContent = ''; sum.className = 'msg';
    if (!isPro) return;
    Core.store('jsonDiffB', $('diffB').value);
    if (!needJson(sum)) return;
    const b = J.check($('diffB').value);
    if (!b.ok) { sum.className = 'msg bad'; sum.textContent = Core.t('errAt', { l: b.line, c: b.col, m: errText(b) }); return; }
    const d = J.diff(last.value, b.value);
    if (!d.length) { sum.textContent = Core.t('same'); return; }
    const cnt = op => fmtN(d.filter(e => e.op === op).length);
    sum.textContent = Core.t('dfSum', { a: cnt('added'), r: cnt('removed'), c: cnt('changed') });
    const j = v => { const s = JSON.stringify(v); return s.length > 160 ? s.slice(0, 160) + '…' : s; };
    for (const e of d.slice(0, 2000)) {
      const li = document.createElement('li'); li.className = e.op;
      li.textContent = (e.op === 'added' ? '+ ' : e.op === 'removed' ? '− ' : '~ ') + e.path + ': ' + (e.op === 'added' ? j(e.to) : e.op === 'removed' ? j(e.from) : j(e.from) + ' → ' + j(e.to));
      li.title = Core.t(e.op);
      ul.append(li);
    }
  }
  function esc(un) {
    $('escMsg').textContent = ''; $('escOut').textContent = '';
    if (!isPro) return;
    try { $('escOut').textContent = un ? J.unescapeString($('escIn').value) : J.escapeString($('escIn').value); }
    catch (e) { $('escMsg').textContent = Core.t('escBad'); }
  }
  function renderSnips() {
    const ul = $('snipList'); ul.textContent = '';
    if (!snips.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = Core.t('noSnips'); ul.append(li); return; }
    snips.forEach((s, i) => {
      const li = document.createElement('li'), n = document.createElement('span'), m = document.createElement('small');
      n.textContent = s.name + ' '; m.className = 'muted'; m.textContent = s.time + ' · ' + size(new TextEncoder().encode(s.text).length); n.append(m);
      const lb = document.createElement('button'), db = document.createElement('button');
      lb.textContent = Core.t('load'); db.textContent = Core.t('del'); lb.disabled = db.disabled = !isPro;
      lb.addEventListener('click', () => { $('src').value = s.text; validate(); });
      db.addEventListener('click', () => { snips.splice(i, 1); Core.store('jsonSnips', JSON.stringify(snips)); renderSnips(); });
      li.append(n, lb, db); ul.append(li);
    });
  }
  function runPro() { runQuery(); if ($('cvOut').textContent) convert(); if ($('diffOut').children.length || $('diffSum').textContent) runDiff(); }
  function lockPro() {
    ['qPath', 'qWithPaths', 'qCopy', 'cvMode', 'cvRun', 'cvCopy', 'cvDl', 'cvUse', 'diffB', 'diffRun', 'diffCopy', 'escIn', 'escBtn', 'unescBtn', 'escCopy', 'snipName', 'snipSave'].forEach(id => { $(id).disabled = !isPro; });
    if (!isPro) { ['qOut', 'qMsg', 'cvOut', 'cvMsg', 'diffOut', 'diffSum', 'escOut', 'escMsg'].forEach(id => { $(id).textContent = ''; }); }
    runQuery(); renderSnips();
  }

  async function copy(text, btn) {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); btn.textContent = Core.t('copied'); setTimeout(() => { btn.textContent = Core.t('copy'); }, 1200); } catch (e) { /* clipboard blocked */ }
  }
  function download(text, name, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  Core.init(DICT, () => { validate(); renderSnips(); });
  $('src').value = Core.store('jsonSrc') ?? SAMPLE;
  $('indent').value = Core.store('jsonIndent') || '2';
  $('sortKeys').checked = Core.store('jsonSort') === '1';
  $('qPath').value = Core.store('jsonQ') || '$';
  $('diffB').value = Core.store('jsonDiffB') || '';
  $('src').addEventListener('input', () => { clearTimeout(timer); const n = $('src').value.length; if (n < 20000) validate(); else timer = setTimeout(validate, n > 200000 ? 400 : 150); });
  $('indent').addEventListener('change', () => Core.store('jsonIndent', $('indent').value));
  $('sortKeys').addEventListener('change', () => Core.store('jsonSort', $('sortKeys').checked ? '1' : '0'));
  $('fmt').addEventListener('click', () => rewrite(t => J.format(t, $('indent').value, $('sortKeys').checked)));
  $('min').addEventListener('click', () => rewrite(t => J.minify(t, $('sortKeys').checked)));
  $('copySrc').addEventListener('click', e => copy($('src').value, e.currentTarget));
  $('sample').addEventListener('click', () => { $('src').value = SAMPLE; validate(); });
  $('clearSrc').addEventListener('click', () => { $('src').value = ''; validate(); $('src').focus(); });
  $('goErr').addEventListener('click', goErr);
  $('expand').addEventListener('click', () => { const r = $('tree').firstElementChild; if (r && r.tagName === 'DETAILS') openAll(r, { n: 5000 }); });
  $('collapse').addEventListener('click', () => { $('tree').querySelectorAll('details').forEach(d => { d.open = false; }); const r = $('tree').firstElementChild; if (r && r.tagName === 'DETAILS') r.open = true; });
  $('copyPath').addEventListener('click', e => { if (!$('treePath').className) copy($('treePath').textContent, e.currentTarget); });
  $('tyCopy').addEventListener('click', e => copy($('tyOut').textContent, e.currentTarget));
  $('qPath').addEventListener('input', runQuery);
  $('qWithPaths').addEventListener('change', runQuery);
  $('qCopy').addEventListener('click', e => copy($('qOut').textContent, e.currentTarget));
  $('cvRun').addEventListener('click', convert);
  $('cvMode').addEventListener('change', () => { if ($('cvOut').textContent || $('cvMsg').textContent) convert(); });
  $('cvCopy').addEventListener('click', e => copy($('cvOut').textContent, e.currentTarget));
  $('cvDl').addEventListener('click', () => { const t = $('cvOut').textContent; if (isPro && t) download(t, 'data.' + cvKind, { yaml: 'text/yaml', csv: 'text/csv', json: 'application/json', ts: 'text/plain' }[cvKind]); });
  $('cvUse').addEventListener('click', () => { const t = $('cvOut').textContent; if (!isPro || !t) return; $('src').value = t; $('cvOut').textContent = ''; $('cvMsg').textContent = ''; validate(); });
  $('diffRun').addEventListener('click', runDiff);
  $('diffCopy').addEventListener('click', e => copy([...$('diffOut').children].map(li => li.textContent).join('\n'), e.currentTarget));
  $('escBtn').addEventListener('click', () => esc(false));
  $('unescBtn').addEventListener('click', () => esc(true));
  $('escCopy').addEventListener('click', e => copy($('escOut').textContent, e.currentTarget));
  $('snipSave').addEventListener('click', () => {
    if (!isPro || !$('src').value.trim()) return;
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const name = $('snipName').value.trim() || 'snippet ' + (snips.length + 1);
    const s = { name, text: $('src').value, time: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` };
    const i = snips.findIndex(x => x.name === name);
    if (i >= 0) snips[i] = s; else snips.unshift(s);
    if (snips.length > 100) snips.length = 100;
    Core.store('jsonSnips', JSON.stringify(snips)); $('snipName').value = ''; renderSnips();
  });
  validate();
  lockPro();
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
