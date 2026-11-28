(function () {
  'use strict';
  const SKU = 'pro';
  const LIMIT = 1500; /* ms: peste atât oprim workerul (backtracking catastrofal) */
  const ROWS = 500;
  const DICT = {
    ro: { appName: 'Tester de expresii regulate', patLabel: 'Expresie regulată', textLabel: 'Text de test', hlLabel: 'Potrivirile în text', listTitle: 'Potriviri', json: 'Salvează JSON', replTitle: 'Previzualizare înlocuire', replLabel: 'Înlocuiește cu ($1, $<nume>, $& = toată potrivirea)', exTitle: 'Explicație', tTitle: 'Cazuri de test', tYes: 'Trebuie să se potrivească (unul pe rând)', tNo: 'Nu trebuie să se potrivească (unul pe rând)', tWhole: 'Tot rândul trebuie să se potrivească', libTitle: 'Bibliotecă de modele', libLabel: 'Modele gata făcute', libUse: 'Folosește modelul', libSample: 'Folosește cu text exemplu', savedTitle: 'Modele salvate', saveName: 'Nume', save: 'Salvează modelul curent', csv: 'Salvează CSV', note: 'Folosește motorul de expresii regulate JavaScript al browserului.',
      proPitch: 'Previzualizare înlocuire, explicație pe înțeles, fragmente de cod pentru JavaScript, Python, Java, C# și PL/SQL, 34 de modele gata făcute, modele salvate, cazuri de test și export CSV/JSON.',
      fl_g: 'toate', fl_i: 'fără majuscule', fl_m: 'multi-rând', fl_s: 'punctul ia și \\n', fl_u: 'unicode', fl_y: 'lipicios', fl_d: 'poziții grupuri',
      status: 'Potriviri: {n} · {ms} ms', statusMore: 'Potriviri: peste {n} (oprit la {n}) · {ms} ms', none: 'Nicio potrivire.', typePat: 'Scrie o expresie regulată.', invalid: 'Expresie invalidă: {e}', timeout: 'Căutarea a durat peste {s} s și a fost oprită. Modelul are probabil backtracking catastrofal (de ex. (a+)+). Simplifică grupurile repetate.', running: 'Se caută…',
      colN: '#', colIdx: 'Poziție', colMatch: 'Potrivire', colGroups: 'Grupuri', empty: '(gol)', unmatched: '(nepotrivit)', moreRows: 'Se afișează primele {n} potriviri. Exportul le include pe toate.',
      tSum: 'Trecute {p} din {t}', tPass: '✓ trecut', tFail: '✗ picat', tExpYes: 'trebuia să se potrivească', tExpNo: 'nu trebuia să se potrivească', noSaved: 'Nimic salvat încă.', load: 'Încarcă', del: 'Șterge', untitled: 'Fără nume',
      xStart: 'Începutul textului', xStartM: 'Începutul unui rând', xEnd: 'Sfârșitul textului', xEndM: 'Sfârșitul unui rând', xWordB: 'Margine de cuvânt', xNotWordB: 'Nu e margine de cuvânt', xAny: 'Orice caracter, în afară de sfârșit de rând', xAnyS: 'Orice caracter, inclusiv sfârșit de rând', xDigit: 'O cifră 0–9', xNotDigit: 'Orice caracter care nu e cifră', xWord: 'Un caracter de cuvânt (literă latină, cifră sau _)', xNotWord: 'Orice caracter care nu e de cuvânt', xSpace: 'Un spațiu alb (spațiu, tab, rând nou…)', xNotSpace: 'Orice caracter care nu e spațiu alb', xTab: 'Un tab', xNl: 'Un rând nou (line feed)', xCr: 'Un retur de car (carriage return)', xFf: 'Un form feed', xVt: 'Un tab vertical', xNul: 'Caracterul NUL', xCode: 'Caracterul cu codul {c}', xCtrl: 'Caracterul de control Ctrl+{c}', xProp: 'Un caracter cu proprietatea Unicode {p}', xNotProp: 'Un caracter fără proprietatea Unicode {p}', xRef: 'Același text pe care l-a prins grupul {n}', xLit: 'Textul „{t}”', xClass: 'Un caracter din setul {s}', xNotClass: 'Un caracter care nu e în setul {s}', xGroup: 'Începe grupul capturant {n}', xNamed: 'Începe grupul capturant {n}, numit „{name}”', xNonCap: 'Începe un grup necapturant', xMod: 'Începe un grup cu flag-urile {f}', xLA: 'Privire înainte: urmează…', xNLA: 'Privire înainte negativă: nu urmează…', xLB: 'Privire înapoi: e precedat de…', xNLB: 'Privire înapoi negativă: nu e precedat de…', xEndGroup: 'Sfârșitul grupului', xAlt: 'SAU: altfel încearcă varianta următoare', xRepeat: 'Repetă elementul anterior {q}{lazy}', qStar: 'de zero sau mai multe ori', qPlus: 'o dată sau de mai multe ori', qOpt: 'de zero ori sau o dată (opțional)', qN: 'exact de {n} ori', qMin: 'de cel puțin {n} ori', qRange: 'între {n} și {m} ori', xGreedy: ' (cât mai mult)', xLazy: ' (cât mai puțin)',
      xf_g: 'Flag g: găsește toate potrivirile, nu doar prima', xf_i: 'Flag i: nu ține cont de majuscule', xf_m: 'Flag m: ^ și $ se potrivesc la începutul și sfârșitul fiecărui rând', xf_s: 'Flag s: punctul se potrivește și cu sfârșitul de rând', xf_u: 'Flag u: mod Unicode (code point-uri, \\p{…})', xf_y: 'Flag y: lipicios, caută doar la poziția curentă', xf_d: 'Flag d: raportează și pozițiile grupurilor', exEmpty: 'Scrie un model ca să vezi explicația.', cheatTitle: 'Fișă rapidă', cheatHint: 'Apasă pe un element ca să-l inserezi în expresie, la cursor.', codeTitle: 'Fragment de cod', codeLang: 'Limbaj', wUnsupported: '{lang} nu suportă: {t}', wUni: 'În {lang}, \\d, \\w și \\b recunosc și cifre și litere din alte alfabete, nu doar 0–9 și A–Z.', wJavaName: 'În Java, numele grupurilor pot conține doar litere latine și cifre.' },
    en: { appName: 'Regex Tester', patLabel: 'Regular expression', textLabel: 'Test text', hlLabel: 'Matches in the text', listTitle: 'Matches', json: 'Save JSON', replTitle: 'Replace preview', replLabel: 'Replace with ($1, $<name>, $& = whole match)', exTitle: 'Explanation', tTitle: 'Test cases', tYes: 'Should match (one per line)', tNo: 'Should not match (one per line)', tWhole: 'The whole line must match', libTitle: 'Pattern library', libLabel: 'Ready-made patterns', libUse: 'Use pattern', libSample: 'Use with example text', savedTitle: 'Saved patterns', saveName: 'Name', save: 'Save current pattern', csv: 'Save CSV', note: "Uses your browser's JavaScript regex engine.",
      proPitch: 'Replace preview, plain-language explanation, code snippets for JavaScript, Python, Java, C# and PL/SQL, 34 ready-made patterns, saved patterns, test cases and CSV/JSON export.',
      fl_g: 'global', fl_i: 'ignore case', fl_m: 'multiline', fl_s: 'dot matches \\n', fl_u: 'unicode', fl_y: 'sticky', fl_d: 'group indices',
      status: 'Matches: {n} · {ms} ms', statusMore: 'Matches: over {n} (stopped at {n}) · {ms} ms', none: 'No matches.', typePat: 'Type a regular expression.', invalid: 'Invalid pattern: {e}', timeout: 'Matching took longer than {s} s and was stopped. The pattern probably has catastrophic backtracking (e.g. (a+)+). Simplify nested repeats.', running: 'Searching…',
      colN: '#', colIdx: 'Index', colMatch: 'Match', colGroups: 'Groups', empty: '(empty)', unmatched: '(not matched)', moreRows: 'Showing the first {n} matches. Export includes all of them.',
      tSum: 'Passed {p} of {t}', tPass: '✓ pass', tFail: '✗ fail', tExpYes: 'should match', tExpNo: 'should not match', noSaved: 'Nothing saved yet.', load: 'Load', del: 'Delete', untitled: 'Untitled',
      xStart: 'Start of the text', xStartM: 'Start of a line', xEnd: 'End of the text', xEndM: 'End of a line', xWordB: 'Word boundary', xNotWordB: 'Not a word boundary', xAny: 'Any character except a line break', xAnyS: 'Any character, including line breaks', xDigit: 'A digit 0–9', xNotDigit: 'Any character that is not a digit', xWord: 'A word character (Latin letter, digit or _)', xNotWord: 'Any character that is not a word character', xSpace: 'A whitespace character (space, tab, line break…)', xNotSpace: 'Any character that is not whitespace', xTab: 'A tab', xNl: 'A line feed (new line)', xCr: 'A carriage return', xFf: 'A form feed', xVt: 'A vertical tab', xNul: 'The NUL character', xCode: 'The character with code {c}', xCtrl: 'Control character Ctrl+{c}', xProp: 'A character with the Unicode property {p}', xNotProp: 'A character without the Unicode property {p}', xRef: 'The same text that group {n} matched', xLit: 'The text “{t}”', xClass: 'One character from the set {s}', xNotClass: 'One character not in the set {s}', xGroup: 'Start of capturing group {n}', xNamed: 'Start of capturing group {n}, named “{name}”', xNonCap: 'Start of a non-capturing group', xMod: 'Start of a group with flags {f}', xLA: 'Lookahead: followed by…', xNLA: 'Negative lookahead: not followed by…', xLB: 'Lookbehind: preceded by…', xNLB: 'Negative lookbehind: not preceded by…', xEndGroup: 'End of group', xAlt: 'OR: otherwise try the next alternative', xRepeat: 'Repeat the previous item {q}{lazy}', qStar: 'zero or more times', qPlus: 'one or more times', qOpt: 'zero or one time (optional)', qN: 'exactly {n} times', qMin: '{n} or more times', qRange: 'between {n} and {m} times', xGreedy: ' (as many as possible)', xLazy: ' (as few as possible)',
      xf_g: 'Flag g: find all matches, not just the first', xf_i: 'Flag i: ignore upper/lower case', xf_m: 'Flag m: ^ and $ match at the start and end of every line', xf_s: 'Flag s: the dot also matches line breaks', xf_u: 'Flag u: Unicode mode (code points, \\p{…})', xf_y: 'Flag y: sticky, matches only at the current position', xf_d: 'Flag d: also report group positions', exEmpty: 'Type a pattern to see the explanation.', cheatTitle: 'Quick reference', cheatHint: 'Click an item to insert it into the expression at the cursor.', codeTitle: 'Code snippet', codeLang: 'Language', wUnsupported: '{lang} does not support: {t}', wUni: 'In {lang}, \\d, \\w and \\b also accept digits and letters from other alphabets, not only 0–9 and A–Z.', wJavaName: 'In Java, group names may contain only Latin letters and digits.' },
    ru: { appName: 'Тестер регулярных выражений', patLabel: 'Регулярное выражение', textLabel: 'Тестовый текст', hlLabel: 'Совпадения в тексте', listTitle: 'Совпадения', json: 'Сохранить JSON', replTitle: 'Предпросмотр замены', replLabel: 'Заменить на ($1, $<имя>, $& = всё совпадение)', exTitle: 'Объяснение', tTitle: 'Тест-кейсы', tYes: 'Должно совпасть (по одному на строку)', tNo: 'Не должно совпасть (по одному на строку)', tWhole: 'Совпадать должна вся строка', libTitle: 'Библиотека шаблонов', libLabel: 'Готовые шаблоны', libUse: 'Использовать', libSample: 'Использовать с примером текста', savedTitle: 'Сохранённые шаблоны', saveName: 'Название', save: 'Сохранить текущий шаблон', csv: 'Сохранить CSV', note: 'Используется встроенный движок регулярных выражений JavaScript.',
      proPitch: 'Предпросмотр замены, объяснение простым языком, фрагменты кода для JavaScript, Python, Java, C# и PL/SQL, 34 готовых шаблона, сохранённые шаблоны, тест-кейсы и экспорт CSV/JSON.',
      fl_g: 'все', fl_i: 'без учёта регистра', fl_m: 'многострочный', fl_s: 'точка ловит \\n', fl_u: 'юникод', fl_y: 'липкий', fl_d: 'позиции групп',
      status: 'Совпадений: {n} · {ms} мс', statusMore: 'Совпадений: больше {n} (остановлено на {n}) · {ms} мс', none: 'Совпадений нет.', typePat: 'Введите регулярное выражение.', invalid: 'Ошибка в выражении: {e}', timeout: 'Поиск длился дольше {s} с и был остановлен. Вероятно, у шаблона катастрофический возврат (например, (a+)+). Упростите вложенные повторы.', running: 'Поиск…',
      colN: '№', colIdx: 'Позиция', colMatch: 'Совпадение', colGroups: 'Группы', empty: '(пусто)', unmatched: '(не совпала)', moreRows: 'Показаны первые {n} совпадений. В экспорт попадут все.',
      tSum: 'Пройдено {p} из {t}', tPass: '✓ пройден', tFail: '✗ не пройден', tExpYes: 'должно совпасть', tExpNo: 'не должно совпасть', noSaved: 'Пока ничего не сохранено.', load: 'Загрузить', del: 'Удалить', untitled: 'Без названия',
      xStart: 'Начало текста', xStartM: 'Начало строки', xEnd: 'Конец текста', xEndM: 'Конец строки', xWordB: 'Граница слова', xNotWordB: 'Не граница слова', xAny: 'Любой символ, кроме перевода строки', xAnyS: 'Любой символ, включая перевод строки', xDigit: 'Цифра 0–9', xNotDigit: 'Любой символ, кроме цифры', xWord: 'Символ слова (латинская буква, цифра или _)', xNotWord: 'Любой символ, кроме символа слова', xSpace: 'Пробельный символ (пробел, табуляция, перевод строки…)', xNotSpace: 'Любой непробельный символ', xTab: 'Табуляция', xNl: 'Перевод строки (line feed)', xCr: 'Возврат каретки', xFf: 'Перевод страницы', xVt: 'Вертикальная табуляция', xNul: 'Символ NUL', xCode: 'Символ с кодом {c}', xCtrl: 'Управляющий символ Ctrl+{c}', xProp: 'Символ со свойством Unicode {p}', xNotProp: 'Символ без свойства Unicode {p}', xRef: 'Тот же текст, что нашла группа {n}', xLit: 'Текст «{t}»', xClass: 'Один символ из набора {s}', xNotClass: 'Один символ не из набора {s}', xGroup: 'Начало захватывающей группы {n}', xNamed: 'Начало захватывающей группы {n} с именем «{name}»', xNonCap: 'Начало незахватывающей группы', xMod: 'Начало группы с флагами {f}', xLA: 'Опережающая проверка: дальше идёт…', xNLA: 'Негативная опережающая проверка: дальше не идёт…', xLB: 'Ретроспективная проверка: перед этим идёт…', xNLB: 'Негативная ретроспективная проверка: перед этим не идёт…', xEndGroup: 'Конец группы', xAlt: 'ИЛИ: иначе пробовать следующий вариант', xRepeat: 'Повторить предыдущий элемент {q}{lazy}', qStar: 'ноль или больше раз', qPlus: 'один или больше раз', qOpt: 'ноль или один раз (необязательно)', qN: 'ровно {n} раз', qMin: 'не меньше {n} раз', qRange: 'от {n} до {m} раз', xGreedy: ' (как можно больше)', xLazy: ' (как можно меньше)',
      xf_g: 'Флаг g: найти все совпадения, а не только первое', xf_i: 'Флаг i: без учёта регистра', xf_m: 'Флаг m: ^ и $ совпадают в начале и конце каждой строки', xf_s: 'Флаг s: точка совпадает и с переводом строки', xf_u: 'Флаг u: режим Unicode (кодовые точки, \\p{…})', xf_y: 'Флаг y: липкий, ищет только с текущей позиции', xf_d: 'Флаг d: также сообщать позиции групп', exEmpty: 'Введите шаблон, чтобы увидеть объяснение.', cheatTitle: 'Краткая шпаргалка', cheatHint: 'Нажмите на элемент, чтобы вставить его в выражение в позицию курсора.', codeTitle: 'Фрагмент кода', codeLang: 'Язык', wUnsupported: '{lang} не поддерживает: {t}', wUni: 'В {lang} \\d, \\w и \\b принимают также цифры и буквы других алфавитов, а не только 0–9 и A–Z.', wJavaName: 'В Java имена групп могут содержать только латинские буквы и цифры.' }
  };
  const R = RegexLogic;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const FLAG_ORDER = 'gimsuyd'.split('');
  const PRO_IDS = ['repl', 'tYes', 'tNo', 'tWhole', 'libSel', 'libUse', 'libSample', 'saveName', 'saveBtn', 'csvBtn', 'jsonBtn', 'codeLang', 'codeCopy'];
  let isPro = false, res = null, worker = null, timer = null, deb = null, seq = 0;
  const DEF = { p: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})', f: 'g', text: 'Invoice 2026-11-26, due 2026-12-10.\nPaid on 2026-12-03 by card.', repl: '$<day>.$<month>.$<year>', yes: '2026-11-26\n1999-01-31', no: '26.11.2026\n2026-1-5', whole: true };
  let st = DEF, saved = [];
  try { st = Object.assign({}, DEF, JSON.parse(Core.store('rxState') || '{}')); } catch (e) { st = Object.assign({}, DEF); }
  try { saved = JSON.parse(Core.store('rxSaved') || '[]'); if (!Array.isArray(saved)) saved = []; } catch (e) { saved = []; }
  const keep = () => Core.store('rxState', JSON.stringify(st));

  /* ---- UI construit din JS ---- */
  for (const f of FLAG_ORDER) {
    const lb = el('label'); const cb = el('input'); cb.type = 'checkbox'; cb.id = 'f_' + f; cb.checked = st.f.includes(f);
    lb.append(cb, el('b', null, f), el('span', null, '')); lb.dataset.flag = f; $('flags').append(lb);
    cb.addEventListener('change', () => { st.f = R.cleanFlags(FLAG_ORDER.filter(x => $('f_' + x).checked).join('')); keep(); schedule(); });
  }
  function labelFlags() {
    for (const lb of $('flags').children) { lb.lastChild.textContent = Core.t('fl_' + lb.dataset.flag); lb.title = Core.t('xf_' + lb.dataset.flag); }
  }
  function fillLib() {
    const sel = $('libSel'), cur = sel.value; sel.textContent = '';
    for (const l of R.LIB) { const o = el('option', null, l.name[Core.lang] || l.name.en); o.value = l.id; sel.append(o); }
    if (cur) sel.value = cur;
    showLib();
  }
  const libItem = () => R.LIB.find(l => l.id === $('libSel').value) || R.LIB[0];
  function showLib() { const l = libItem(); $('libPat').textContent = '/' + l.p + '/' + l.f; }

  function toUi() {
    $('pattern').value = st.p; $('text').value = st.text; $('repl').value = st.repl;
    $('tYes').value = st.yes; $('tNo').value = st.no; $('tWhole').checked = !!st.whole;
    for (const f of FLAG_ORDER) $('f_' + f).checked = st.f.includes(f);
  }

  /* ---- rulare în worker, cu timeout ---- */
  /* un singur worker reutilizat; e oprit și recreat doar dacă o căutare încă rulează (timeout sau model nou) */
  function kill() { clearTimeout(timer); timer = null; if (worker) { worker.terminate(); worker = null; } }
  function schedule() { clearTimeout(deb); deb = setTimeout(go, 90); }
  function go() {
    $('flagsShow').textContent = '/' + st.f;
    explainUi();
    if (timer) kill();
    if (st.p === '') { res = null; renderAll(null, Core.t('typePat')); return; }
    const c = R.compile(st.p, st.f);
    if (c.error) { res = null; renderAll(Core.t('invalid', { e: c.error.replace(/^Invalid regular expression: /, '') }), ''); return; }
    const msg = { id: ++seq, pattern: st.p, flags: st.f, text: st.text, repl: isPro ? st.repl : null, tests: isPro ? { yes: R.lines(st.yes), no: R.lines(st.no), whole: st.whole } : null };
    if (!worker) {
      try {
        const w = worker = new Worker('worker.js');
        w.onmessage = e => { if (w !== worker || e.data.id !== seq) return; clearTimeout(timer); timer = null; done(e.data.res); };
        w.onerror = e => { e.preventDefault(); if (w !== worker) return; kill(); renderAll(String(e.message || 'Worker error'), ''); };
      } catch (e) { worker = null; return done(R.run(msg)); } /* fără worker (ex. file://) */
    }
    $('status').textContent = Core.t('running');
    timer = setTimeout(() => { kill(); res = null; renderAll(Core.t('timeout', { s: LIMIT / 1000 }), ''); }, LIMIT);
    worker.postMessage(msg);
  }
  function done(r) {
    if (r.error) { res = null; return renderAll(Core.t('invalid', { e: r.error }), ''); }
    res = r;
    const n = r.matches.length;
    renderAll(null, n ? Core.t(r.truncated ? 'statusMore' : 'status', { n, ms: r.ms }) : Core.t('none'));
  }

  /* ---- randare ---- */
  function renderAll(err, status) {
    $('err').textContent = err || ''; $('err').classList.toggle('hidden', !err);
    $('status').textContent = status;
    const ms = res ? res.matches : [];
    $('count').textContent = res ? '(' + ms.length + ')' : '';
    highlight(ms); table(ms); replace(); tests();
  }
  function highlight(ms) {
    const box = $('hl'), t = st.text; box.textContent = '';
    let pos = 0, k = 0;
    for (const m of ms.slice(0, 5000)) {
      if (m.i > pos) box.append(t.slice(pos, m.i));
      const mk = el('mark', (m.t === '' ? 'z' : '') + (k++ % 2 ? ' alt' : ''), m.t);
      mk.title = '#' + k + ' @' + m.i; box.append(mk);
      pos = m.i + m.t.length;
    }
    if (pos < t.length) box.append(t.slice(pos));
  }
  function table(ms) {
    const tb = $('list'); tb.textContent = '';
    $('more').classList.toggle('hidden', ms.length <= ROWS); $('more').textContent = Core.t('moreRows', { n: ROWS });
    if (!ms.length) return;
    const names = R.groupNames(st.p), hr = el('tr');
    for (const k of ['colN', 'colIdx', 'colMatch', 'colGroups']) hr.append(el('th', null, Core.t(k)));
    tb.append(hr);
    ms.slice(0, ROWS).forEach((m, n) => {
      const tr = el('tr');
      tr.append(el('td', 'n', String(n + 1)), el('td', 'n', m.i + '–' + (m.i + m.t.length)), el('td', null, m.t === '' ? Core.t('empty') : m.t));
      const g = el('td');
      m.g.forEach((v, j) => {
        const row = el('span', 'grp');
        row.append(el('i', null, '$' + (j + 1) + (names[j] ? ' ' + names[j] : '') + (m.gi && m.gi[j] ? ' [' + m.gi[j][0] + '–' + m.gi[j][1] + ']' : '') + ': '), v == null ? Core.t('unmatched') : v === '' ? Core.t('empty') : v);
        g.append(row);
      });
      tr.append(g); tb.append(tr);
    });
  }
  function replace() { $('replOut').textContent = isPro && res && res.replaced != null ? res.replaced : ''; }
  function tests() {
    const ul = $('tOut'); ul.textContent = ''; $('tSum').textContent = '';
    if (!isPro || !res || !res.tests || res.tests.error) return;
    const T = res.tests;
    $('tSum').textContent = Core.t('tSum', { p: T.passed, t: T.total }); $('tSum').className = T.passed === T.total ? 'pass' : 'fail';
    for (const r of T.results) ul.append(el('li', r.pass ? 'pass' : 'fail', Core.t(r.pass ? 'tPass' : 'tFail') + ' · ' + r.text + ' — ' + Core.t(r.expect ? 'tExpYes' : 'tExpNo')));
  }
  const tokText = x => Core.t(x.k, x.k === 'xRepeat' ? { q: Core.t(x.v.q, x.v), lazy: Core.t(x.v.lazy ? 'xLazy' : 'xGreedy') } : x.v);
  function cheatUi() {
    const box = $('cheat'); box.textContent = '';
    for (const x of R.CHEAT) {
      const b = el('button'); b.type = 'button'; b.dataset.ins = x.ins;
      b.append(el('code', null, x.t), el('span', null, tokText(x)));
      b.addEventListener('click', () => insertTok(x.ins)); box.append(b);
    }
  }
  function insertTok(t) {
    const inp = $('pattern'), a = inp.selectionStart == null ? inp.value.length : inp.selectionStart, b = inp.selectionEnd == null ? a : inp.selectionEnd;
    inp.value = inp.value.slice(0, a) + t + inp.value.slice(b);
    const c = a + (/\)$/.test(t) && t.length > 1 ? t.length - 1 : t.length);
    inp.focus(); inp.setSelectionRange(c, c);
    st.p = inp.value; keep(); schedule();
  }
  function codeUi() {
    const out = $('codeOut'), ul = $('codeWarn'); out.textContent = ''; ul.textContent = '';
    if (!isPro || st.p === '' || R.compile(st.p, st.f).error) return;
    const r = R.codeSnippet($('codeLang').value, st.p, st.f);
    out.textContent = r.code;
    for (const w of r.warn) ul.append(el('li', null, Core.t(w.k, w.v)));
  }
  function explainUi() {
    codeUi();
    const ol = $('explain'); ol.textContent = '';
    if (!isPro) return;
    if (st.p === '') { ol.append(el('li', 'muted', Core.t('exEmpty'))); return; }
    for (const x of R.explain(st.p, st.f)) {
      const v = x.k === 'xRepeat' ? { q: Core.t(x.v.q, x.v), lazy: Core.t(x.v.lazy ? 'xLazy' : 'xGreedy') } : x.v;
      const li = el('li'); li.style.paddingLeft = (x.d * 18) + 'px';
      li.append(el('code', null, x.t), el('span', null, Core.t(x.k, v))); ol.append(li);
    }
    for (const f of st.f) { const li = el('li', 'fl'); li.append(el('code', null, f), el('span', null, Core.t('xf_' + f))); ol.append(li); }
  }
  function renderSaved() {
    const ul = $('savedList'); ul.textContent = '';
    if (!saved.length) { ul.append(el('li', 'muted', Core.t('noSaved'))); return; }
    saved.forEach((s, i) => {
      const li = el('li'), info = el('span');
      info.append(el('strong', null, s.name), document.createElement('br'), el('code', null, '/' + s.p + '/' + s.f));
      const tools = el('span', 'tools'), ld = el('button', null, Core.t('load')), dl = el('button', null, Core.t('del'));
      ld.disabled = dl.disabled = !isPro;
      ld.addEventListener('click', () => { if (!isPro) return; st = Object.assign({}, st, s); delete st.name; toUi(); keep(); schedule(); });
      dl.addEventListener('click', () => { if (!isPro) return; saved.splice(i, 1); Core.store('rxSaved', JSON.stringify(saved)); renderSaved(); });
      tools.append(ld, dl); li.append(info, tools); ul.append(li);
    });
  }
  function all() { cheatUi(); labelFlags(); fillLib(); renderSaved(); schedule(); }
  function lockPro() { PRO_IDS.forEach(id => { $(id).disabled = !isPro; }); all(); }

  function download(name, text, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  Core.init(DICT, all);
  toUi();
  const bind = (id, key, fn) => $(id).addEventListener('input', () => { st[key] = $(id).type === 'checkbox' ? $(id).checked : $(id).value; keep(); (fn || schedule)(); });
  bind('pattern', 'p'); bind('text', 'text'); bind('repl', 'repl'); bind('tYes', 'yes'); bind('tNo', 'no');
  $('tWhole').addEventListener('change', () => { st.whole = $('tWhole').checked; keep(); schedule(); });
  $('libSel').addEventListener('change', showLib);
  $('codeLang').value = ['js', 'py', 'java', 'cs', 'plsql'].includes(Core.store('rxCodeLang')) ? Core.store('rxCodeLang') : 'js';
  $('codeLang').addEventListener('change', () => { Core.store('rxCodeLang', $('codeLang').value); codeUi(); });
  $('codeCopy').addEventListener('click', async () => {
    const t = $('codeOut').textContent;
    if (!isPro || !t) return;
    try { await navigator.clipboard.writeText(t); $('codeCopy').textContent = Core.t('copied'); setTimeout(() => { $('codeCopy').textContent = Core.t('copy'); }, 1200); } catch (e) { /* clipboard unavailable */ }
  });
  const useLib = withText => { if (!isPro) return; const l = libItem(); st.p = l.p; st.f = l.f; if (withText) st.text = l.sample; toUi(); keep(); go(); };
  $('libUse').addEventListener('click', () => useLib(false));
  $('libSample').addEventListener('click', () => useLib(true));
  $('saveBtn').addEventListener('click', () => {
    if (!isPro || !st.p) return;
    const name = $('saveName').value.trim() || Core.t('untitled');
    const item = { name, p: st.p, f: st.f, repl: st.repl, yes: st.yes, no: st.no, whole: st.whole };
    const i = saved.findIndex(s => s.name === name);
    if (i >= 0) saved[i] = item; else saved.unshift(item);
    saved = saved.slice(0, 100); Core.store('rxSaved', JSON.stringify(saved)); $('saveName').value = ''; renderSaved();
  });
  $('csvBtn').addEventListener('click', () => { if (isPro && res && res.matches.length) download('regex-matches.csv', R.toCsv(res.matches, R.groupNames(st.p)), 'text/csv'); });
  $('jsonBtn').addEventListener('click', () => { if (isPro && res && res.matches.length) download('regex-matches.json', R.toJson(res.matches), 'application/json'); });
  lockPro();
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
