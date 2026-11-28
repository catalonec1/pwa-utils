(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Formatator SQL', width: 'Liste (coloane, SET, ORDER BY)', w0: 'Un element pe rând', w80: 'Umple până la 80 de caractere', w100: 'Umple până la 100 de caractere', w120: 'Umple până la 120 de caractere', cmpTitle: 'Compară două variante', cmpLabel: 'Al doilea SQL, comparat cu cel de sus după ce ambele sunt formatate la fel', cmpSame: 'La fel după formatare.', cmpSum: '{a} rânduri adăugate · {r} eliminate', cmpEmpty: 'Lipește a doua variantă ca s-o compari.', cmpLong: 'Prea lung pentru comparare (peste 3000 de rânduri).', mode: 'Mod', fmt: 'Formatează', minify: 'Pe un singur rând', kwCase: 'Cuvinte cheie', keep: 'Cum sunt scrise', commas: 'Virgule', trailing: 'La final (a,)', leading: 'La început (, a)', indent: 'Indentare', sp2: '2 spații', sp4: '4 spații', input: 'SQL de formatat', sample: 'Exemplu', output: 'Rezultat', dl: 'Salvează .sql', ph: 'Lipește SQL aici: SELECT, INSERT, UPDATE, DELETE, MERGE…', proOpts: 'PL/SQL și opțiuni avansate', plsqlOpt: 'Indentează blocurile PL/SQL', alignOpt: 'Aliniază aliasurile AS', idCase: 'Identificatori', splitTitle: 'Instrucțiunile din script', splitHint: 'Împarte după ; și după o linie cu /, păstrează blocurile PL/SQL întregi.', codeTitle: 'Copiază ca șir în cod', codeLang: 'Limbaj', snipTitle: 'Fragmente salvate', snipName: 'Nume', snipSave: 'Salvează SQL-ul curent', load: 'Deschide', del: 'Șterge', noSnips: 'Niciun fragment salvat.', proPitch: 'Indentarea blocurilor PL/SQL, majuscule pentru identificatori, aliasuri aliniate, împărțirea scriptului în instrucțiuni, copiere ca șir Java, C#, Python sau PL/SQL cu indicii pentru variabilele bind, compararea a două variante și fragmente salvate.', indep: 'SQL-ul tău nu părăsește dispozitivul. Unealtă independentă, fără legătură cu Oracle.', info: '{n} instrucțiuni · {l} rânduri', plsqlNote: 'Blocurile PL/SQL ({n}) sunt lăsate cum au fost scrise, doar cu majusculele aplicate. Indentarea lor este în Pro.', proLocked: 'Disponibil în Pro.', empty: 'Lipește SQL în stânga.', snipDef: 'Fragment {n}' },
    en: { appName: 'SQL Formatter', width: 'Lists (columns, SET, ORDER BY)', w0: 'One item per line', w80: 'Fill up to 80 characters', w100: 'Fill up to 100 characters', w120: 'Fill up to 120 characters', cmpTitle: 'Compare two versions', cmpLabel: 'Second SQL, compared with the input above after formatting both the same way', cmpSame: 'Same after formatting.', cmpSum: '{a} lines added · {r} removed', cmpEmpty: 'Paste the second version to compare it.', cmpLong: 'Too long to compare (over 3000 lines).', mode: 'Mode', fmt: 'Format', minify: 'Minify (one line)', kwCase: 'Keywords', keep: 'Keep as typed', commas: 'Commas', trailing: 'Trailing (a,)', leading: 'Leading (, a)', indent: 'Indent', sp2: '2 spaces', sp4: '4 spaces', input: 'SQL to format', sample: 'Example', output: 'Result', dl: 'Save .sql', ph: 'Paste SQL here: SELECT, INSERT, UPDATE, DELETE, MERGE…', proOpts: 'PL/SQL and advanced options', plsqlOpt: 'Indent PL/SQL blocks', alignOpt: 'Align AS aliases', idCase: 'Identifiers', splitTitle: 'Statements in the script', splitHint: 'Splits on ; and on a / line, keeps PL/SQL blocks whole.', codeTitle: 'Copy as a string in code', codeLang: 'Language', snipTitle: 'Saved snippets', snipName: 'Name', snipSave: 'Save current SQL', load: 'Open', del: 'Delete', noSnips: 'No saved snippets.', proPitch: 'PL/SQL block indentation, identifier case, aligned aliases, splitting a script into statements, copy as a Java, C#, Python or PL/SQL string with bind hints, comparing two versions, and saved snippets.', indep: 'Your SQL never leaves your device. Independent tool, not affiliated with Oracle.', info: '{n} statements · {l} lines', plsqlNote: 'PL/SQL blocks ({n}) are kept as written, with case applied. Indenting them is in Pro.', proLocked: 'Available in Pro.', empty: 'Paste SQL on the left.', snipDef: 'Snippet {n}' },
    ru: { appName: 'Форматирование SQL', width: 'Списки (столбцы, SET, ORDER BY)', w0: 'Один элемент на строку', w80: 'Заполнять до 80 символов', w100: 'Заполнять до 100 символов', w120: 'Заполнять до 120 символов', cmpTitle: 'Сравнение двух версий', cmpLabel: 'Второй SQL, сравнивается с SQL выше после одинакового форматирования обоих', cmpSame: 'Совпадают после форматирования.', cmpSum: 'добавлено строк: {a} · удалено: {r}', cmpEmpty: 'Вставьте вторую версию для сравнения.', cmpLong: 'Слишком длинный текст для сравнения (более 3000 строк).', mode: 'Режим', fmt: 'Форматировать', minify: 'В одну строку', kwCase: 'Ключевые слова', keep: 'Как написано', commas: 'Запятые', trailing: 'В конце (a,)', leading: 'В начале (, a)', indent: 'Отступ', sp2: '2 пробела', sp4: '4 пробела', input: 'SQL для форматирования', sample: 'Пример', output: 'Результат', dl: 'Сохранить .sql', ph: 'Вставьте SQL: SELECT, INSERT, UPDATE, DELETE, MERGE…', proOpts: 'PL/SQL и дополнительные настройки', plsqlOpt: 'Отступы в блоках PL/SQL', alignOpt: 'Выравнивать псевдонимы AS', idCase: 'Идентификаторы', splitTitle: 'Команды в скрипте', splitHint: 'Делит по ; и по строке с /, блоки PL/SQL остаются целыми.', codeTitle: 'Копировать как строку в коде', codeLang: 'Язык', snipTitle: 'Сохранённые фрагменты', snipName: 'Название', snipSave: 'Сохранить текущий SQL', load: 'Открыть', del: 'Удалить', noSnips: 'Нет сохранённых фрагментов.', proPitch: 'Отступы в блоках PL/SQL, регистр идентификаторов, выравнивание псевдонимов, разбиение скрипта на команды, копирование строкой для Java, C#, Python или PL/SQL с подсказками по bind-переменным, сравнение двух версий и сохранённые фрагменты.', indep: 'Ваш SQL не покидает устройство. Независимый инструмент, не связан с Oracle.', info: 'Команд: {n} · строк: {l}', plsqlNote: 'Блоки PL/SQL ({n}) оставлены как написаны, применён только регистр. Отступы в них — в Pro.', proLocked: 'Доступно в Pro.', empty: 'Вставьте SQL слева.', snipDef: 'Фрагмент {n}' }
  };
  const SAMPLE = `select e.employee_id, e.last_name as name, d.department_name, case when e.salary > 10000 then 'senior' else 'regular' end as band
from employees e join departments d on d.department_id = e.department_id
where e.hire_date >= date '2024-01-01' and d.location_id in (1700, 1800) -- active sites
and e.manager_id = :mgr_id order by e.last_name;`;
  const F = SqlFormatter;
  const $ = id => document.getElementById(id);
  let isPro = false, snips = [], result = '';
  try { snips = JSON.parse(Core.store('sqlSnips') || '[]'); } catch (e) { snips = []; }
  let opts = {};
  try { opts = JSON.parse(Core.store('sqlOpts') || '{}') || {}; } catch (e) { opts = {}; }
  const OPT_IDS = ['mode', 'kwCase', 'commas', 'indent', 'width', 'idCase', 'codeLang'];
  const CHK_IDS = ['plsql', 'alignAs'];
  for (const id of OPT_IDS) if (opts[id] != null && [...$(id).options].some(o => o.value === opts[id])) $(id).value = opts[id];
  for (const id of CHK_IDS) if (typeof opts[id] === 'boolean') $(id).checked = opts[id];
  const saved = Core.store('sqlSrc');
  $('src').value = saved == null ? SAMPLE : saved;

  function saveOpts() {
    const o = {};
    for (const id of OPT_IDS) o[id] = $(id).value;
    for (const id of CHK_IDS) o[id] = $(id).checked;
    Core.store('sqlOpts', JSON.stringify(o));
  }
  function paint(el, text) {
    el.textContent = '';
    const frag = document.createDocumentFragment();
    for (const [c, t] of F.highlight(text)) {
      if (!c) { frag.append(document.createTextNode(t)); continue; }
      const s = document.createElement('span'); s.className = c; s.textContent = t; frag.append(s);
    }
    el.append(frag);
  }
  function fmtOpts(minify) {
    return {
      keywordCase: $('kwCase').value, commaStyle: $('commas').value, indent: +$('indent').value, width: +$('width').value, minify,
      identCase: isPro ? $('idCase').value : 'keep', alignAs: isPro && $('alignAs').checked, plsql: isPro && $('plsql').checked
    };
  }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); const o = btn.textContent; btn.textContent = Core.t('copied'); setTimeout(() => { btn.textContent = o; }, 1200); } catch (e) { /* clipboard blocked */ }
  }
  function render() {
    const src = $('src').value;
    result = F.format(src, fmtOpts($('mode').value === 'minify'));
    if (src.trim()) paint($('out'), result);
    else { $('out').textContent = ''; const s = document.createElement('span'); s.className = 'm'; s.textContent = Core.t('empty'); $('out').append(s); }
    const st = F.statements(src);
    $('info').textContent = src.trim() ? Core.t('info', { n: st.length, l: result ? result.split('\n').length : 0 }) : '';
    const npl = st.filter(s => s.kind === 'plsql').length;
    const showNote = !isPro && npl > 0 && $('mode').value === 'format';
    $('note').classList.toggle('hidden', !showNote);
    $('note').textContent = showNote ? Core.t('plsqlNote', { n: npl }) : '';
    renderStmts(st); renderCode(src); renderCmp(src); renderSnips();
  }
  function renderCmp(src) {
    const pre = $('cmpOut'), sum = $('cmpSum'), b = $('cmpSrc').value;
    $('cmpSrc').disabled = !isPro;
    if (!isPro) { sum.textContent = ''; return locked(pre); }
    pre.textContent = '';
    if (!b.trim()) { sum.textContent = Core.t('cmpEmpty'); return; }
    let d;
    try { d = F.compare(src, b, fmtOpts(false)); } catch (e) { sum.textContent = Core.t('cmpLong'); return; }
    const a = d.filter(x => x.op === '+').length, r = d.filter(x => x.op === '-').length;
    sum.textContent = a || r ? Core.t('cmpSum', { a, r }) : Core.t('cmpSame');
    const frag = document.createDocumentFragment();
    for (const x of d) {
      if (x.op === ' ') { frag.append(document.createTextNode('  ' + x.line + '\n')); continue; }
      const s = document.createElement('span'); s.className = x.op === '+' ? 'dA' : 'dR'; s.textContent = x.op + ' ' + x.line; frag.append(s);
    }
    pre.append(frag);
  }
  function locked(el) { el.textContent = ''; const p = document.createElement(el.tagName === 'PRE' ? 'span' : 'li'); p.className = 'muted'; p.style.listStyle = 'none'; p.textContent = Core.t('proLocked'); el.append(p); }
  function renderStmts(st) {
    const ol = $('stmts');
    if (!isPro) return locked(ol);
    ol.textContent = '';
    const o = fmtOpts(false);
    for (const s of st) {
      const li = document.createElement('li'), r = document.createElement('div'); r.className = 'row1';
      const c = document.createElement('code'), k = document.createElement('span'), b = document.createElement('button');
      const first = s.text.split('\n').find(l => l.trim() && !/^\s*(--|\/\*)/.test(l)) || s.text.split('\n')[0];
      c.textContent = first.length > 90 ? first.slice(0, 90) + '…' : first;
      k.className = 'kind'; k.textContent = s.kind === 'plsql' ? 'PL/SQL' : s.kind === 'cmd' ? 'SQL*Plus' : 'SQL';
      b.textContent = Core.t('copy');
      b.addEventListener('click', () => copy(s.kind === 'cmd' ? s.text : F.format(s.text, o), b));
      const left = document.createElement('span'); left.append(k, document.createTextNode(' '), c);
      r.append(left, b); li.append(r); ol.append(li);
    }
  }
  function renderCode(src) {
    const pre = $('code');
    if (!isPro) return locked(pre);
    paintCode(pre, F.toCode(F.format(src, fmtOpts(false)), $('codeLang').value));
  }
  function paintCode(pre, text) { pre.textContent = text; }
  function renderSnips() {
    const ul = $('snips'); ul.textContent = '';
    if (!snips.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = Core.t('noSnips'); ul.append(li); return; }
    snips.forEach((s, i) => {
      const li = document.createElement('li'), name = document.createElement('span'), tools = document.createElement('span');
      name.textContent = s.name + ' · ' + s.time; tools.className = 'btns';
      const lb = document.createElement('button'), db = document.createElement('button');
      lb.textContent = Core.t('load'); db.textContent = Core.t('del'); lb.disabled = db.disabled = !isPro;
      lb.addEventListener('click', () => { $('src').value = s.sql; Core.store('sqlSrc', s.sql); render(); });
      db.addEventListener('click', () => { snips.splice(i, 1); Core.store('sqlSnips', JSON.stringify(snips)); renderSnips(); });
      tools.append(lb, db); li.append(name, tools); ul.append(li);
    });
  }
  function lockPro() {
    ['plsql', 'alignAs', 'idCase', 'codeLang', 'codeCopy', 'snipName', 'snipSave'].forEach(id => { $(id).disabled = !isPro; });
    render();
  }

  Core.init(DICT, render);
  lockPro();
  $('src').addEventListener('input', () => { Core.store('sqlSrc', $('src').value); render(); });
  $('cmpSrc').value = Core.store('sqlCmp') || '';
  renderCmp($('src').value);
  $('cmpSrc').addEventListener('input', () => { Core.store('sqlCmp', $('cmpSrc').value); renderCmp($('src').value); });
  $('src').addEventListener('keydown', e => { // Tab inserează spații
    if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.altKey) return;
    e.preventDefault(); document.execCommand('insertText', false, '  ');
  });
  [...OPT_IDS, ...CHK_IDS].forEach(id => $(id).addEventListener('change', () => { saveOpts(); render(); }));
  $('sample').addEventListener('click', () => { $('src').value = SAMPLE; Core.store('sqlSrc', SAMPLE); render(); });
  $('clear').addEventListener('click', () => { $('src').value = ''; Core.store('sqlSrc', ''); render(); $('src').focus(); });
  $('copy').addEventListener('click', () => copy(result, $('copy')));
  $('codeCopy').addEventListener('click', () => { if (isPro) copy($('code').textContent, $('codeCopy')); });
  $('dl').addEventListener('click', () => {
    if (!result) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([result + '\n'], { type: 'application/sql' })); a.download = 'formatted.sql';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('snipSave').addEventListener('click', () => {
    const sql = $('src').value;
    if (!isPro || !sql.trim()) return;
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const name = $('snipName').value.trim() || Core.t('snipDef', { n: snips.length + 1 });
    snips.unshift({ name, sql, time: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` });
    if (snips.length > 100) snips.length = 100;
    Core.store('sqlSnips', JSON.stringify(snips)); $('snipName').value = ''; renderSnips();
  });
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
