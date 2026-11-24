(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Calculator de procente', ofTitle: 'Cât este X% din Y?', ofNum: 'din numărul', isTitle: 'X cât la sută este din Y?', chTitle: 'Variație procentuală', oldV: 'Valoarea veche', newV: 'Valoarea nouă', apTitle: 'Crește sau scade cu %', value: 'Valoare', pctSigned: '% (negativ = scădere)', dsTitle: 'Reducere', price: 'Preț', discountPct: 'Reducere %', vatTitle: 'TVA / taxă', amount: 'Sumă', ratePct: 'Cotă %', mode: 'Suma este', isNet: 'fără taxă', isGross: 'cu taxă', tipTitle: 'Bacșiș și împărțire', bill: 'Notă', tipPct: 'Bacșiș %', people: 'Persoane', mgTitle: 'Marjă și adaos', cost: 'Cost', cgTitle: 'Creștere compusă', start: 'Suma inițială', yearPct: '% pe an', years: 'Ani', perYear: 'Capitalizare', yearly: 'anuală', monthly: 'lunară', histTitle: 'Istoric', histHint: 'Salvează ultimul rezultat calculat.', saveLast: 'Salvează ultimul rezultat', csv: 'Salvează CSV', proPitch: 'TVA și taxe, bacșiș și împărțirea notei, marjă și adaos, creștere compusă și istoric cu export CSV.',
      ofRes: '{p}% din {x} = {r}', isRes: '{a} este {r}% din {b}', up: 'creștere de {r}%', down: 'scădere de {r}%', same: 'fără schimbare', apRes: '{x} {s} {p}% = {r}', apOrig: 'Invers: {x} a rezultat din {o} după {s} {p}%', plus: '+', minus: '−', dsRes: 'Plătești {f}', dsSave: 'Economisești {s}', vatRes: 'Fără taxă {n} · taxă {v} · cu taxă {g}', tipRes: 'Bacșiș {t} · total {s} · {e} de persoană', mgRes: 'Profit {p} · marjă {m}% · adaos {k}%', year: 'An', valueCol: 'Valoare', gain: 'Câștig', emptyHist: 'Nimic salvat încă.', bad: '—' },
    en: { appName: 'Percentage Calculator', ofTitle: 'What is X% of Y?', ofNum: 'of number', isTitle: 'X is what % of Y?', chTitle: 'Percent change', oldV: 'Old value', newV: 'New value', apTitle: 'Increase or decrease by %', value: 'Value', pctSigned: '% (negative = decrease)', dsTitle: 'Discount', price: 'Price', discountPct: 'Discount %', vatTitle: 'VAT / sales tax', amount: 'Amount', ratePct: 'Rate %', mode: 'Amount is', isNet: 'without tax', isGross: 'with tax', tipTitle: 'Tip and split', bill: 'Bill', tipPct: 'Tip %', people: 'People', mgTitle: 'Margin and markup', cost: 'Cost', cgTitle: 'Compound growth', start: 'Start amount', yearPct: '% per year', years: 'Years', perYear: 'Compounded', yearly: 'yearly', monthly: 'monthly', histTitle: 'History', histHint: 'Saves the last result you calculated.', saveLast: 'Save last result', csv: 'Save CSV', proPitch: 'VAT and sales tax, tip and bill split, margin and markup, compound growth and a history with CSV export.',
      ofRes: '{p}% of {x} = {r}', isRes: '{a} is {r}% of {b}', up: '{r}% increase', down: '{r}% decrease', same: 'no change', apRes: '{x} {s} {p}% = {r}', apOrig: 'Reverse: {x} came from {o} after {s} {p}%', plus: '+', minus: '−', dsRes: 'You pay {f}', dsSave: 'You save {s}', vatRes: 'Net {n} · tax {v} · gross {g}', tipRes: 'Tip {t} · total {s} · {e} per person', mgRes: 'Profit {p} · margin {m}% · markup {k}%', year: 'Year', valueCol: 'Value', gain: 'Gain', emptyHist: 'Nothing saved yet.', bad: '—' },
    ru: { appName: 'Калькулятор процентов', ofTitle: 'Сколько X% от Y?', ofNum: 'от числа', isTitle: 'Сколько процентов X от Y?', chTitle: 'Изменение в процентах', oldV: 'Старое значение', newV: 'Новое значение', apTitle: 'Увеличить или уменьшить на %', value: 'Значение', pctSigned: '% (минус = уменьшение)', dsTitle: 'Скидка', price: 'Цена', discountPct: 'Скидка %', vatTitle: 'НДС / налог', amount: 'Сумма', ratePct: 'Ставка %', mode: 'Сумма', isNet: 'без налога', isGross: 'с налогом', tipTitle: 'Чаевые и деление счёта', bill: 'Счёт', tipPct: 'Чаевые %', people: 'Человек', mgTitle: 'Маржа и наценка', cost: 'Себестоимость', cgTitle: 'Сложный процент', start: 'Начальная сумма', yearPct: '% в год', years: 'Лет', perYear: 'Капитализация', yearly: 'ежегодно', monthly: 'ежемесячно', histTitle: 'История', histHint: 'Сохраняет последний результат.', saveLast: 'Сохранить результат', csv: 'Сохранить CSV', proPitch: 'НДС и налоги, чаевые и деление счёта, маржа и наценка, сложный процент и история с экспортом CSV.',
      ofRes: '{p}% от {x} = {r}', isRes: '{a} — это {r}% от {b}', up: 'рост на {r}%', down: 'снижение на {r}%', same: 'без изменений', apRes: '{x} {s} {p}% = {r}', apOrig: 'Обратно: {x} получено из {o} после {s} {p}%', plus: '+', minus: '−', dsRes: 'К оплате {f}', dsSave: 'Экономия {s}', vatRes: 'Без налога {n} · налог {v} · с налогом {g}', tipRes: 'Чаевые {t} · итого {s} · {e} с человека', mgRes: 'Прибыль {p} · маржа {m}% · наценка {k}%', year: 'Год', valueCol: 'Сумма', gain: 'Доход', emptyHist: 'Пока ничего не сохранено.', bad: '—' }
  };
  const P = PercentCalc;
  const $ = id => document.getElementById(id);
  const v = id => P.num($(id).value);
  let isPro = false, last = null, hist = [];
  try { hist = JSON.parse(Core.store('pctHist') || '[]'); } catch (e) { hist = []; }

  function f(x, max) {
    if (!Number.isFinite(x)) return Core.t('bad');
    return new Intl.NumberFormat(Core.lang, { maximumFractionDigits: max == null ? 4 : max }).format(x);
  }
  const m = x => f(x, 2);
  function out(id, text, rec) { $(id).textContent = text; if (rec && !text.includes(Core.t('bad'))) last = text; }
  function ok(...xs) { return xs.every(Number.isFinite); }

  function of() { const p = v('ofP'), x = v('ofX'); out('ofOut', ok(p, x) ? Core.t('ofRes', { p: f(p), x: f(x), r: f(P.pctOf(p, x)) }) : Core.t('bad'), true); }
  function is() { const a = v('isA'), b = v('isB'), r = ok(a, b) ? P.whatPct(a, b) : NaN; out('isOut', Number.isFinite(r) ? Core.t('isRes', { a: f(a), b: f(b), r: f(r, 2) }) : Core.t('bad'), true); }
  function ch() {
    const a = v('chA'), b = v('chB'), r = ok(a, b) ? P.change(a, b) : NaN;
    out('chOut', !Number.isFinite(r) ? Core.t('bad') : r === 0 ? Core.t('same') : Core.t(r > 0 ? 'up' : 'down', { r: f(Math.abs(r), 2) }), true);
  }
  function ap() {
    const x = v('apX'), p = v('apP');
    if (!ok(x, p)) { out('apOut', Core.t('bad')); $('apOrig').textContent = ''; return; }
    const s = Core.t(p < 0 ? 'minus' : 'plus'), pa = f(Math.abs(p));
    out('apOut', Core.t('apRes', { x: f(x), s, p: pa, r: f(P.apply(x, p)) }), true);
    const o = P.original(x, p);
    $('apOrig').textContent = Number.isFinite(o) ? Core.t('apOrig', { x: f(x), o: f(o), s, p: pa }) : '';
  }
  function ds() {
    const pr = v('dsPrice'), p = v('dsP');
    if (!ok(pr, p)) { out('dsOut', Core.t('bad')); $('dsSave').textContent = ''; return; }
    const r = P.discount(pr, p);
    out('dsOut', Core.t('dsRes', { f: m(r.final) }), true);
    $('dsSave').textContent = Core.t('dsSave', { s: m(r.save) });
  }
  function vat() {
    if (!isPro) { $('vatOut').textContent = ''; return; }
    const x = v('vatX'), rt = v('vatR');
    if (!ok(x, rt)) { out('vatOut', Core.t('bad')); return; }
    const r = $('vatMode').value === 'gross' ? P.vatRemove(x, rt) : P.vatAdd(x, rt);
    out('vatOut', Core.t('vatRes', { n: m(r.net), v: m(r.vat), g: m(r.gross) }), true);
  }
  function tip() {
    if (!isPro) { $('tipOut').textContent = ''; return; }
    const b = v('tipBill'), p = v('tipP'), n = v('tipN');
    if (!ok(b, p, n)) { out('tipOut', Core.t('bad')); return; }
    const r = P.tip(b, p, n);
    out('tipOut', Core.t('tipRes', { t: m(r.tip), s: m(r.total), e: m(r.each) }), true);
  }
  function mg() {
    if (!isPro) { $('mgOut').textContent = ''; return; }
    const c = v('mgCost'), p = v('mgPrice');
    if (!ok(c, p)) { out('mgOut', Core.t('bad')); return; }
    const r = P.margin(c, p);
    out('mgOut', Core.t('mgRes', { p: m(r.profit), m: f(r.margin, 2), k: f(r.markup, 2) }), true);
  }
  function cg() {
    const t = $('cgTable'); t.textContent = '';
    if (!isPro) return;
    const pr = v('cgP'), r = v('cgR'), y = v('cgY');
    if (!ok(pr, r, y)) return;
    const rows = P.compound(pr, r, y, +$('cgK').value);
    const head = document.createElement('tr');
    for (const k of ['year', 'valueCol', 'gain']) { const th = document.createElement('th'); th.textContent = Core.t(k); head.append(th); }
    t.append(head);
    for (const row of rows) {
      const tr = document.createElement('tr');
      for (const c of [row.year, m(row.value), m(row.gain)]) { const td = document.createElement('td'); td.textContent = c; tr.append(td); }
      t.append(tr);
    }
    if (rows.length) last = Core.t('cgTitle') + ': ' + f(pr) + ' → ' + m(rows[rows.length - 1].value) + ' (' + f(y) + ' ' + Core.t('years').toLowerCase() + ', ' + f(r) + '%)';
  }
  function renderHist() {
    const ul = $('histList'); ul.textContent = '';
    if (!hist.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = Core.t('emptyHist'); ul.append(li); return; }
    for (const h of hist.slice().reverse()) { const li = document.createElement('li'); li.textContent = h.time + ' · ' + h.calc; ul.append(li); }
  }
  function all() { of(); is(); ch(); ap(); ds(); vat(); tip(); mg(); cg(); renderHist(); }
  function lockPro() {
    ['vatX', 'vatR', 'vatMode', 'tipBill', 'tipP', 'tipN', 'mgCost', 'mgPrice', 'cgP', 'cgR', 'cgY', 'cgK', 'histSave', 'histCsv', 'histClear'].forEach(id => { $(id).disabled = !isPro; });
    all();
  }

  Core.init(DICT, all);
  lockPro();
  const wire = (ids, fn) => ids.forEach(id => { $(id).addEventListener('input', fn); $(id).addEventListener('change', fn); });
  wire(['ofP', 'ofX'], of); wire(['isA', 'isB'], is); wire(['chA', 'chB'], ch); wire(['apX', 'apP'], ap); wire(['dsPrice', 'dsP'], ds);
  wire(['vatX', 'vatR', 'vatMode'], vat); wire(['tipBill', 'tipP', 'tipN'], tip); wire(['mgCost', 'mgPrice'], mg); wire(['cgP', 'cgR', 'cgY', 'cgK'], cg);
  $('histSave').addEventListener('click', () => {
    if (!isPro || !last) return;
    const d = new Date(), p = n => String(n).padStart(2, '0');
    hist.push({ time: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`, calc: last, result: last.split(/[=:]/).pop().trim() });
    if (hist.length > 200) hist = hist.slice(-200);
    Core.store('pctHist', JSON.stringify(hist)); renderHist();
  });
  $('histClear').addEventListener('click', () => { if (!isPro) return; hist = []; Core.store('pctHist', '[]'); renderHist(); });
  $('histCsv').addEventListener('click', () => {
    if (!isPro || !hist.length) return;
    const blob = new Blob([P.toCsv(hist)], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'percent-history.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
