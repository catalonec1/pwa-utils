(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Trusă de unelte pentru text', input: 'Text', placeholder: 'Lipește sau scrie textul aici…', undo: 'Anulează', proTools: 'Avansat', find: 'Caută (regex)', replace: 'Înlocuiește cu', flags: 'Opțiuni', replaceBtn: 'Înlocuiește', proPitch: 'Căutare și înlocuire cu regex, Base64, codare URL, formatare JSON, extragere e-mailuri și linkuri, frecvența cuvintelor, camelCase / snake_case / kebab-case, transliterare chirilic → latin, CSV ↔ JSON, escape HTML, filtre de rânduri cu regex și compararea a două texte.',
      chars: 'Caractere', charsNoSpaces: 'Fără spații', words: 'Cuvinte', lines: 'Rânduri', sentences: 'Propoziții', paragraphs: 'Paragrafe', readingMin: 'Min. de citit',
      upper: 'MAJUSCULE', lower: 'minuscule', title: 'Fiecare Cuvânt', sentence: 'Ca propoziție', sortAZ: 'Sortează A→Z', sortZA: 'Sortează Z→A', dedupe: 'Elimină dubluri', reverseLines: 'Inversează rândurile', trim: 'Curăță spațiile', removeEmpty: 'Fără rânduri goale', removeDiacritics: 'Fără diacritice', slug: 'Slug URL', numberLines: 'Numerotează', joinLines: 'Unește rândurile', stripHtml: 'Fără HTML', shuffleLines: 'Amestecă rândurile', sortLength: 'Sortează după lungime',
      b64encode: 'Base64 →', b64decode: 'Base64 ←', urlEncode: 'URL →', urlDecode: 'URL ←', jsonFormat: 'JSON frumos', jsonMinify: 'JSON compact', extractEmails: 'Extrage e-mailuri', extractUrls: 'Extrage linkuri', wordFreq: 'Frecvența cuvintelor', camelCase: 'camelCase', snakeCase: 'snake_case', kebabCase: 'kebab-case', translit: 'Chirilic → latin', csvToJson: 'CSV → JSON', jsonToCsv: 'JSON → CSV', htmlEscape: 'Escape HTML', error: 'Eroare: {m}', lineTools: 'Rânduri', lfLabel: 'Rândurile care conțin', lfKeep: 'Păstrează', lfDrop: 'Elimină', lfCase: 'Ignoră majusculele', lfRegex: 'Expresie regulată', prefix: 'Prefix', suffix: 'Sufix', affix: 'Adaugă la fiecare rând', cmpTitle: 'Compară texte', cmpLabel: 'Al doilea text (comparat cu textul de sus, rând cu rând)', cmpBtn: 'Compară', diffSum: '{a} rânduri adăugate, {d} eliminate, {s} la fel', diffSame: 'Textele sunt identice.' },
    en: { appName: 'Text Toolbox', input: 'Text', placeholder: 'Paste or type your text here…', undo: 'Undo', proTools: 'Advanced', find: 'Find (regex)', replace: 'Replace with', flags: 'Flags', replaceBtn: 'Replace', proPitch: 'Regex find and replace, Base64, URL encoding, JSON formatting, email and link extraction, word frequency, camelCase / snake_case / kebab-case, Cyrillic → Latin transliteration, CSV ↔ JSON, HTML escaping, regex line filters and comparing two texts.',
      chars: 'Characters', charsNoSpaces: 'No spaces', words: 'Words', lines: 'Lines', sentences: 'Sentences', paragraphs: 'Paragraphs', readingMin: 'Min. to read',
      upper: 'UPPERCASE', lower: 'lowercase', title: 'Title Case', sentence: 'Sentence case', sortAZ: 'Sort A→Z', sortZA: 'Sort Z→A', dedupe: 'Remove duplicates', reverseLines: 'Reverse lines', trim: 'Trim spaces', removeEmpty: 'Remove empty lines', removeDiacritics: 'Remove accents', slug: 'URL slug', numberLines: 'Number lines', joinLines: 'Join lines', stripHtml: 'Strip HTML', shuffleLines: 'Shuffle lines', sortLength: 'Sort by length',
      b64encode: 'Base64 →', b64decode: 'Base64 ←', urlEncode: 'URL →', urlDecode: 'URL ←', jsonFormat: 'Pretty JSON', jsonMinify: 'Minify JSON', extractEmails: 'Extract emails', extractUrls: 'Extract links', wordFreq: 'Word frequency', camelCase: 'camelCase', snakeCase: 'snake_case', kebabCase: 'kebab-case', translit: 'Cyrillic → Latin', csvToJson: 'CSV → JSON', jsonToCsv: 'JSON → CSV', htmlEscape: 'Escape HTML', error: 'Error: {m}', lineTools: 'Lines', lfLabel: 'Lines containing', lfKeep: 'Keep', lfDrop: 'Remove', lfCase: 'Ignore case', lfRegex: 'Regular expression', prefix: 'Prefix', suffix: 'Suffix', affix: 'Add to each line', cmpTitle: 'Compare texts', cmpLabel: 'Second text (compared with the text above, line by line)', cmpBtn: 'Compare', diffSum: '{a} lines added, {d} removed, {s} unchanged', diffSame: 'The texts are identical.' },
    ru: { appName: 'Набор инструментов для текста', input: 'Текст', placeholder: 'Вставьте или введите текст…', undo: 'Отменить', proTools: 'Расширенные', find: 'Найти (regex)', replace: 'Заменить на', flags: 'Флаги', replaceBtn: 'Заменить', proPitch: 'Поиск и замена по regex, Base64, URL-кодирование, форматирование JSON, извлечение e-mail и ссылок, частота слов, camelCase / snake_case / kebab-case, транслитерация кириллицы, CSV ↔ JSON, экранирование HTML, фильтр строк по regex и сравнение двух текстов.',
      chars: 'Символы', charsNoSpaces: 'Без пробелов', words: 'Слова', lines: 'Строки', sentences: 'Предложения', paragraphs: 'Абзацы', readingMin: 'Мин. чтения',
      upper: 'ВЕРХНИЙ', lower: 'нижний', title: 'Каждое Слово', sentence: 'Как в предложении', sortAZ: 'Сортировка А→Я', sortZA: 'Сортировка Я→А', dedupe: 'Убрать дубли', reverseLines: 'Перевернуть строки', trim: 'Убрать пробелы', removeEmpty: 'Без пустых строк', removeDiacritics: 'Без диакритики', slug: 'URL-слаг', numberLines: 'Нумеровать', joinLines: 'Склеить строки', stripHtml: 'Убрать HTML', shuffleLines: 'Перемешать строки', sortLength: 'По длине',
      b64encode: 'Base64 →', b64decode: 'Base64 ←', urlEncode: 'URL →', urlDecode: 'URL ←', jsonFormat: 'Красивый JSON', jsonMinify: 'Сжать JSON', extractEmails: 'Извлечь e-mail', extractUrls: 'Извлечь ссылки', wordFreq: 'Частота слов', camelCase: 'camelCase', snakeCase: 'snake_case', kebabCase: 'kebab-case', translit: 'Кириллица → латиница', csvToJson: 'CSV → JSON', jsonToCsv: 'JSON → CSV', htmlEscape: 'Экранировать HTML', error: 'Ошибка: {m}', lineTools: 'Строки', lfLabel: 'Строки, содержащие', lfKeep: 'Оставить', lfDrop: 'Удалить', lfCase: 'Без учёта регистра', lfRegex: 'Регулярное выражение', prefix: 'Префикс', suffix: 'Суффикс', affix: 'Добавить к каждой строке', cmpTitle: 'Сравнить тексты', cmpLabel: 'Второй текст (сравнивается с текстом выше построчно)', cmpBtn: 'Сравнить', diffSum: 'Добавлено строк: {a}, удалено: {d}, без изменений: {s}', diffSame: 'Тексты одинаковые.' }
  };
  const $ = id => document.getElementById(id);
  const txt = $('txt');
  let isPro = false;
  const undo = [];
  txt.value = Core.store('text') || '';

  function setText(v) {
    if (v === txt.value) return;
    undo.push(txt.value); if (undo.length > 50) undo.shift();
    txt.value = v; changed();
  }
  function changed() {
    Core.store('text', txt.value);
    const s = TextTools.stats(txt.value);
    const box = $('stats'); box.innerHTML = '';
    Object.keys(s).forEach(k => {
      const d = document.createElement('div');
      d.innerHTML = '<strong></strong><span class="muted"></span>';
      d.firstChild.textContent = s[k]; d.lastChild.textContent = Core.t(k);
      d.dataset.stat = k; box.appendChild(d);
    });
    $('undo').disabled = !undo.length;
  }
  function run(fn) {
    $('err').textContent = '';
    try { setText(fn(txt.value)); } catch (e) { $('err').textContent = Core.t('error', { m: e.message }); }
  }
  function renderButtons() {
    const ops = $('ops'); ops.innerHTML = '';
    TextTools.FREE.forEach(k => {
      const b = document.createElement('button'); b.textContent = Core.t(k); b.dataset.op = k;
      b.addEventListener('click', () => run(TextTools.ops[k])); ops.appendChild(b);
    });
    const p = $('proOps'); p.innerHTML = '';
    TextTools.PRO.forEach(k => {
      const b = document.createElement('button'); b.textContent = Core.t(k); b.dataset.op = k; b.disabled = !isPro;
      b.addEventListener('click', () => run(TextTools.pro[k])); p.appendChild(b);
    });
    ['find', 'repl', 'flags', 'doRepl', 'lfRegex', 'cmp', 'doDiff'].forEach(id => { $(id).disabled = !isPro; });
    if (!isPro) $('lfRegex').checked = false;
  }

  Core.init(DICT, () => { renderButtons(); changed(); });
  renderButtons(); changed();
  txt.addEventListener('input', changed);
  $('undo').addEventListener('click', () => { if (undo.length) { txt.value = undo.pop(); changed(); } });
  $('clear').addEventListener('click', () => setText(''));
  $('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(txt.value); $('copy').textContent = Core.t('copied'); setTimeout(() => { $('copy').textContent = Core.t('copy'); }, 1200); } catch (e) { /* blocked */ }
  });
  $('doRepl').addEventListener('click', () => {
    if (!isPro || !$('find').value) return;
    run(t => TextTools.regexReplace(t, $('find').value, $('flags').value, $('repl').value));
  });
  function lineFilter(keep) {
    $('lfErr').textContent = '';
    const needle = $('lf').value;
    if (!needle) return;
    try { setText(TextTools.filterLines(txt.value, needle, keep, { ignoreCase: $('lfCase').checked, regex: isPro && $('lfRegex').checked })); }
    catch (e) { $('lfErr').textContent = Core.t('error', { m: e.message }); }
  }
  $('lfKeep').addEventListener('click', () => lineFilter(true));
  $('lfDrop').addEventListener('click', () => lineFilter(false));
  $('affix').addEventListener('click', () => { if ($('pre').value || $('suf').value) setText(TextTools.affixLines(txt.value, $('pre').value, $('suf').value)); });
  $('doDiff').addEventListener('click', () => {
    if (!isPro) return;
    const out = $('diffOut'); out.textContent = ''; $('diffSum').textContent = '';
    let d;
    try { d = TextTools.diffLines(txt.value, $('cmp').value); } catch (e) { $('diffSum').textContent = Core.t('error', { m: e.message }); return; }
    const n = { '+': 0, '-': 0, ' ': 0 };
    d.forEach(x => { n[x.op]++; });
    $('diffSum').textContent = n['+'] || n['-'] ? Core.t('diffSum', { a: n['+'], d: n['-'], s: n[' '] }) : Core.t('diffSame');
    if (!n['+'] && !n['-']) return;
    d.forEach((x, i) => {
      const sp = document.createElement('span');
      sp.className = x.op === '+' ? 'add' : x.op === '-' ? 'del' : '';
      sp.textContent = x.op + ' ' + x.line + (i < d.length - 1 ? '\n' : '');
      out.appendChild(sp);
    });
  });
  Core.wirePro(SKU, owned => { isPro = owned; renderButtons(); });
})();
