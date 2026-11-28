(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Generator de parole', generate: 'Generează', length: 'Lungime', noSimilar: 'Fără caractere asemănătoare (I l 1 O 0)', checkLabel: 'Verifică o parolă (rămâne pe acest dispozitiv)', proTools: 'Alte generatoare', kind: 'Tip', kindPhrase: 'Frază din cuvinte', kindPin: 'PIN', kindPron: 'Ușor de pronunțat', kindRandom: 'Aleatorie (setările de sus)', words: 'Cuvinte / cifre', count: 'Câte', capitalize: 'Majuscule', addNumber: 'Adaugă un număr', bulk: 'Generează lista', csv: 'Salvează CSV', copyList: 'Copiază lista', offlineNote: 'Parolele sunt create pe dispozitivul tău și nu sunt trimise sau salvate nicăieri. Funcționează și fără internet.', proPitch: 'Fraze din cuvinte în română, engleză și rusă cu separatorul ales, PIN-uri, parole ușor de pronunțat, simbolurile permise de tine, liste de până la 500 și export CSV.', startLetter: 'Începe cu o literă', exclude: 'Nu folosi niciodată aceste caractere', symSet: 'Doar aceste simboluri', sep: 'Separator', sepSpace: 'spațiu', sepNone: 'fără', noChars: 'Niciun caracter disponibil: schimbă setările.',
      bits: '{b} biți de entropie · {l}', weak: 'slabă', fair: 'acceptabilă', strong: 'puternică', veryStrong: 'foarte puternică', listInfo: '{n} parole · ~{b} biți fiecare', empty: '—' },
    en: { appName: 'Password Generator', generate: 'Generate', length: 'Length', noSimilar: 'No look-alikes (I l 1 O 0)', checkLabel: 'Check a password (stays on this device)', proTools: 'More generators', kind: 'Type', kindPhrase: 'Passphrase', kindPin: 'PIN', kindPron: 'Easy to say', kindRandom: 'Random (settings above)', words: 'Words / digits', count: 'How many', capitalize: 'Capital letters', addNumber: 'Add a number', bulk: 'Generate list', csv: 'Save CSV', copyList: 'Copy list', offlineNote: 'Passwords are created on your device and are never sent or saved. Works offline too.', proPitch: 'Passphrases in English, Romanian and Russian with your choice of separator, PINs, easy-to-say passwords, your own allowed symbols, lists of up to 500 and CSV export.', startLetter: 'Start with a letter', exclude: 'Never use these characters', symSet: 'Allowed symbols only', sep: 'Separator', sepSpace: 'space', sepNone: 'none', noChars: 'No characters left: change the settings.',
      bits: '{b} bits of entropy · {l}', weak: 'weak', fair: 'fair', strong: 'strong', veryStrong: 'very strong', listInfo: '{n} passwords · ~{b} bits each', empty: '—' },
    ru: { appName: 'Генератор паролей', generate: 'Создать', length: 'Длина', noSimilar: 'Без похожих символов (I l 1 O 0)', checkLabel: 'Проверить пароль (остаётся на устройстве)', proTools: 'Другие генераторы', kind: 'Тип', kindPhrase: 'Фраза из слов', kindPin: 'PIN-код', kindPron: 'Легко произнести', kindRandom: 'Случайный (настройки выше)', words: 'Слова / цифры', count: 'Сколько', capitalize: 'Заглавные буквы', addNumber: 'Добавить число', bulk: 'Создать список', csv: 'Сохранить CSV', copyList: 'Копировать список', offlineNote: 'Пароли создаются на вашем устройстве и никуда не отправляются и не сохраняются. Работает и без интернета.', proPitch: 'Фразы из слов на русском, английском и румынском с выбранным разделителем, PIN-коды, легко произносимые пароли, свои разрешённые символы, списки до 500 и экспорт CSV.', startLetter: 'Начинать с буквы', exclude: 'Никогда не использовать эти символы', symSet: 'Только эти символы', sep: 'Разделитель', sepSpace: 'пробел', sepNone: 'без', noChars: 'Не осталось символов: измените настройки.',
      bits: '{b} бит энтропии · {l}', weak: 'слабый', fair: 'средний', strong: 'надёжный', veryStrong: 'очень надёжный', listInfo: '{n} паролей · ~{b} бит каждый', empty: '—' }
  };
  const $ = id => document.getElementById(id);
  let isPro = false;
  const OPT_IDS = ['lower', 'upper', 'digits', 'symbols', 'noSimilar', 'startLetter'];

  function opts() {
    const o = { length: +$('len').value, exclude: $('exclude').value };
    OPT_IDS.forEach(k => { o[k] = $(k).checked; });
    if (isPro && PassGen.cleanSymbols($('symSet').value)) o.symbolSet = $('symSet').value;
    return o;
  }
  function saveOpts() { Core.store('passOpts', JSON.stringify(Object.assign(opts(), { symSet: $('symSet').value, sep: $('sep').value }))); }
  function loadOpts() {
    try {
      const o = JSON.parse(Core.store('passOpts') || 'null');
      if (!o) return;
      if (o.length) $('len').value = o.length;
      if (typeof o.exclude === 'string') $('exclude').value = o.exclude;
      if (typeof o.symSet === 'string') $('symSet').value = o.symSet;
      if (typeof o.sep === 'string' && [...$('sep').options].some(x => x.value === o.sep)) $('sep').value = o.sep;
      OPT_IDS.forEach(k => { if (k in o) $(k).checked = !!o[k]; });
    } catch (e) { /* ignore */ }
  }
  function showStrength(b, el, bar) {
    const l = PassGen.level(b);
    el.textContent = b ? Core.t('bits', { b, l: Core.t(l) }) : Core.t('empty');
    if (bar) { bar.style.width = Math.min(100, b / 1.28) + '%'; bar.dataset.level = l; }
  }
  function gen() {
    const o = opts();
    if (!o.lower && !o.upper && !o.digits && !o.symbols) { $('lower').checked = true; o.lower = true; }
    $('lenVal').textContent = o.length;
    saveOpts();
    try { $('out').textContent = PassGen.generate(o); }
    catch (e) { $('out').textContent = ''; $('strength').textContent = Core.t('noChars'); $('bar').style.width = '0'; return; }
    showStrength(PassGen.genBits(o), $('strength'), $('bar'));
  }
  function proOpts() {
    const n = +$('words').value;
    return Object.assign(opts(), { words: n, length: $('kind').value === 'random' ? +$('len').value : n, sep: $('sep').value, capitalize: $('cap').checked, number: $('num').checked, lang: Core.lang });
  }
  function bulkBits(kind, o) {
    if (kind === 'phrase') return PassGen.passphraseBits(o);
    if (kind === 'pin') return PassGen.bits(Math.max(3, Math.min(12, o.length)), 10);
    if (kind === 'pron') return Math.round(Math.max(6, Math.min(32, o.length)) / 2 * Math.log2(80) + Math.log2(100));
    return PassGen.genBits(o);
  }
  function bulk() {
    if (!isPro) return;
    const kind = $('kind').value, o = proOpts();
    let list;
    try { list = PassGen.bulk(kind, o, +$('count').value); } catch (e) { $('list').value = ''; $('listInfo').textContent = Core.t('noChars'); return; }
    $('list').value = list.join('\n');
    $('listInfo').textContent = Core.t('listInfo', { n: list.length, b: bulkBits(kind, o) });
  }
  async function copy(text, btn, label) {
    try { await navigator.clipboard.writeText(text); btn.textContent = Core.t('copied'); setTimeout(() => { btn.textContent = Core.t(label); }, 1200); } catch (e) { /* blocked */ }
  }
  function lockPro() {
    ['kind', 'words', 'sep', 'count', 'cap', 'num', 'bulk', 'csv', 'copyList', 'symSet'].forEach(id => { $(id).disabled = !isPro; });
  }

  loadOpts();
  Core.init(DICT, () => { gen(); if ($('list').value) bulk(); $('check').dispatchEvent(new Event('input')); });
  gen(); lockPro();
  $('gen').addEventListener('click', gen);
  $('len').addEventListener('input', gen);
  OPT_IDS.forEach(k => $(k).addEventListener('change', gen));
  $('exclude').addEventListener('input', gen);
  $('symSet').addEventListener('input', gen);
  $('sep').addEventListener('change', () => { saveOpts(); if ($('list').value) bulk(); });
  $('copy').addEventListener('click', () => copy($('out').textContent, $('copy'), 'copy'));
  $('check').addEventListener('input', () => showStrength(PassGen.estimate($('check').value), $('checkOut')));
  $('bulk').addEventListener('click', bulk);
  $('copyList').addEventListener('click', () => copy($('list').value, $('copyList'), 'copyList'));
  $('csv').addEventListener('click', () => {
    if (!isPro || !$('list').value) return;
    const blob = new Blob([PassGen.toCsv($('list').value.split('\n'))], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'passwords.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  Core.wirePro(SKU, owned => { const was = isPro; isPro = owned; lockPro(); if (was !== owned && PassGen.cleanSymbols($('symSet').value)) gen(); });
})();
