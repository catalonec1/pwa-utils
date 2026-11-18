(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Generator de parole', generate: 'Generează', length: 'Lungime', noSimilar: 'Fără caractere asemănătoare (I l 1 O 0)', checkLabel: 'Verifică o parolă (rămâne pe acest dispozitiv)', proTools: 'Alte generatoare', kind: 'Tip', kindPhrase: 'Frază din cuvinte', kindPin: 'PIN', kindPron: 'Ușor de pronunțat', kindRandom: 'Aleatorie (setările de sus)', words: 'Cuvinte / cifre', count: 'Câte', capitalize: 'Majuscule', addNumber: 'Adaugă un număr', bulk: 'Generează lista', csv: 'Salvează CSV', copyList: 'Copiază lista', offlineNote: 'Parolele sunt create pe dispozitivul tău și nu sunt trimise sau salvate nicăieri. Funcționează și fără internet.', proPitch: 'Fraze din cuvinte în română, engleză și rusă, PIN-uri, parole ușor de pronunțat, liste de până la 500 și export CSV.',
      bits: '{b} biți de entropie · {l}', weak: 'slabă', fair: 'acceptabilă', strong: 'puternică', veryStrong: 'foarte puternică', listInfo: '{n} parole · ~{b} biți fiecare', empty: '—' },
    en: { appName: 'Password Generator', generate: 'Generate', length: 'Length', noSimilar: 'No look-alikes (I l 1 O 0)', checkLabel: 'Check a password (stays on this device)', proTools: 'More generators', kind: 'Type', kindPhrase: 'Passphrase', kindPin: 'PIN', kindPron: 'Easy to say', kindRandom: 'Random (settings above)', words: 'Words / digits', count: 'How many', capitalize: 'Capital letters', addNumber: 'Add a number', bulk: 'Generate list', csv: 'Save CSV', copyList: 'Copy list', offlineNote: 'Passwords are created on your device and are never sent or saved. Works offline too.', proPitch: 'Passphrases in English, Romanian and Russian, PINs, easy-to-say passwords, lists of up to 500 and CSV export.',
      bits: '{b} bits of entropy · {l}', weak: 'weak', fair: 'fair', strong: 'strong', veryStrong: 'very strong', listInfo: '{n} passwords · ~{b} bits each', empty: '—' },
    ru: { appName: 'Генератор паролей', generate: 'Создать', length: 'Длина', noSimilar: 'Без похожих символов (I l 1 O 0)', checkLabel: 'Проверить пароль (остаётся на устройстве)', proTools: 'Другие генераторы', kind: 'Тип', kindPhrase: 'Фраза из слов', kindPin: 'PIN-код', kindPron: 'Легко произнести', kindRandom: 'Случайный (настройки выше)', words: 'Слова / цифры', count: 'Сколько', capitalize: 'Заглавные буквы', addNumber: 'Добавить число', bulk: 'Создать список', csv: 'Сохранить CSV', copyList: 'Копировать список', offlineNote: 'Пароли создаются на вашем устройстве и никуда не отправляются и не сохраняются. Работает и без интернета.', proPitch: 'Фразы из слов на русском, английском и румынском, PIN-коды, легко произносимые пароли, списки до 500 и экспорт CSV.',
      bits: '{b} бит энтропии · {l}', weak: 'слабый', fair: 'средний', strong: 'надёжный', veryStrong: 'очень надёжный', listInfo: '{n} паролей · ~{b} бит каждый', empty: '—' }
  };
  const $ = id => document.getElementById(id);
  let isPro = false;
  const OPT_IDS = ['lower', 'upper', 'digits', 'symbols', 'noSimilar'];

  function opts() {
    const o = { length: +$('len').value };
    OPT_IDS.forEach(k => { o[k] = $(k).checked; });
    return o;
  }
  function saveOpts() { Core.store('passOpts', JSON.stringify(opts())); }
  function loadOpts() {
    try {
      const o = JSON.parse(Core.store('passOpts') || 'null');
      if (!o) return;
      if (o.length) $('len').value = o.length;
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
    $('out').textContent = PassGen.generate(o);
    showStrength(PassGen.bits(o.length, PassGen.poolSize(o)), $('strength'), $('bar'));
    saveOpts();
  }
  function proOpts() {
    const n = +$('words').value;
    return Object.assign(opts(), { words: n, length: $('kind').value === 'random' ? +$('len').value : n, sep: '-', capitalize: $('cap').checked, number: $('num').checked, lang: Core.lang });
  }
  function bulkBits(kind, o) {
    if (kind === 'phrase') return PassGen.passphraseBits(o);
    if (kind === 'pin') return PassGen.bits(Math.max(3, Math.min(12, o.length)), 10);
    if (kind === 'pron') return Math.round(Math.max(6, Math.min(32, o.length)) / 2 * Math.log2(80) + Math.log2(100));
    return PassGen.bits(o.length, PassGen.poolSize(o));
  }
  function bulk() {
    if (!isPro) return;
    const kind = $('kind').value, o = proOpts();
    const list = PassGen.bulk(kind, o, +$('count').value);
    $('list').value = list.join('\n');
    $('listInfo').textContent = Core.t('listInfo', { n: list.length, b: bulkBits(kind, o) });
  }
  async function copy(text, btn, label) {
    try { await navigator.clipboard.writeText(text); btn.textContent = Core.t('copied'); setTimeout(() => { btn.textContent = Core.t(label); }, 1200); } catch (e) { /* blocked */ }
  }
  function lockPro() {
    ['kind', 'words', 'count', 'cap', 'num', 'bulk', 'csv', 'copyList'].forEach(id => { $(id).disabled = !isPro; });
  }

  loadOpts();
  Core.init(DICT, () => { gen(); if ($('list').value) bulk(); $('check').dispatchEvent(new Event('input')); });
  gen(); lockPro();
  $('gen').addEventListener('click', gen);
  $('len').addEventListener('input', gen);
  OPT_IDS.forEach(k => $(k).addEventListener('change', gen));
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
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
