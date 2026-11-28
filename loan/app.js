(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Calculator de credite', loanTitle: 'Credit', amount: 'Suma creditului', ratePct: 'Dobânda, % pe an', term: 'Termen', unit: 'Unitate', years: 'ani', months: 'luni', type: 'Rate', annuity: 'Egale (anuități)', linear: 'Descrescătoare (principal egal)', currency: 'Monedă (opțional)', curPh: '€, $, lei', totInt: 'Dobândă totală', totPaid: 'Total plătit', termLbl: 'Termen',
      solveTitle: 'Rată ↔ termen', solveMode: 'Află', solveTerm: 'termenul pentru o rată lunară', solveAmt: 'suma pentru o rată lunară', monthlyPay: 'Rata lunară', solveHint: 'Folosește suma, dobânda și termenul de mai sus (rate egale).', yearTitle: 'Rezumat pe ani',
      extraTitle: 'Plăți anticipate', recAmt: 'În plus în fiecare lună', fromMonth: 'Începând cu rata nr.', oneMonth: 'O singură dată: la rata nr.', oneAmt: 'Suma o singură dată', add: 'Adaugă', rcTitle: 'Schimbarea dobânzii (dobândă variabilă)', rcMonth: 'După rata nr.', rcRate: 'Dobânda nouă, % pe an', schedTitle: 'Graficul lunar de rambursare', csv: 'Salvează CSV',
      cmpTitle: 'Compară oferte', offerName: 'Numele ofertei', termYears: 'Termen, ani', fees: 'Comisioane inițiale', cmpHint: 'Folosește tipul de rate ales mai sus. Completează a treia ofertă doar dacă ai nevoie.', savedTitle: 'Credite salvate', saveName: 'Nume', saveNamePh: 'de ex. Apartament, mașină', save: 'Salvează creditul',
      affTitle: 'Cât pot împrumuta?', income: 'Venit net lunar', debts: 'Alte rate lunare la credite', share: 'Partea maximă din venit pentru rate, %', affHint: 'Folosește dobânda și termenul de mai sus (rate egale). Băncile aplică propriile reguli, deci este doar o estimare.', affRes: 'Rată de până la {p} pe lună · poți împrumuta aproximativ {x}', affNone: 'Celelalte rate folosesc deja toată partea din venit.', affEnter: 'Introdu venitul ca să vezi o estimare.',
      chartTitle: 'Graficul amortizării', chartHint: 'Bare: principalul și dobânda plătite în fiecare an. Linie: soldul rămas.', proOnly: 'Disponibil în Pro.',
      proPitch: 'Graficul lunar complet cu export CSV, graficul amortizării, plăți anticipate, schimbarea dobânzii, comparația a până la 3 oferte și credite salvate.', disclaimer: 'Doar estimări, nu sunt sfaturi financiare. Ofertele reale pot diferi din cauza comisioanelor, asigurărilor, rotunjirilor și regulilor băncii.',
      yearF: 'an|ani', monthF: 'lună|luni', payF: 'rată|rate', perMonth: '{x} pe lună', linNote: 'Prima rată {a}, ultima {b} (descrescătoare)', termRes: '{d} · {n}', invalid: 'Introdu o sumă > 0, dobânda ≥ 0 și un termen de cel mult 100 de ani.', solveTermRes: 'Achitat în {d} ({n})', solveAmtRes: 'Poți împrumuta până la {x}', tooLow: 'Rata nu acoperă nici dobânda lunară.',
      yrCol: 'An', paidCol: 'Plătit', princCol: 'Principal', intCol: 'Dobândă', extraCol: 'În plus', balCol: 'Sold', monthCol: 'Nr.', payCol: 'Rată', rateCol: 'Dobândă %', yearNote: 'Include plățile anticipate și schimbarea dobânzii.',
      extraRes: 'Economisești {s} la dobândă și termini cu {d} mai devreme ({n} mai puțin).', extraNone: 'Adaugă o plată lunară în plus sau una unică ca să vezi cât economisești.', oneItem: 'Rata nr. {m}: +{x}', remove: 'Șterge',
      rcRes: 'De la rata nr. {m}: {p} pe lună (acum {o}). Dobânda totală {s} cu {x}.', up: 'crește', down: 'scade', rcNone: 'Introdu luna și dobânda nouă ca să vezi efectul.',
      cmpPay: 'Rata lunară', cmpInt: 'Dobândă totală', cmpFee: 'Comisioane', cmpCost: 'Dobândă + comisioane', cmpEff: 'Rata anuală efectivă', cmpBest: 'Cea mai ieftină în total: {n}', emptySaved: 'Niciun credit salvat încă.', open: 'Deschide', del: 'Șterge', loanN: 'Credit {n}', bad: '—' },
    en: { appName: 'Loan Calculator', loanTitle: 'Loan', amount: 'Loan amount', ratePct: 'Interest rate, % per year', term: 'Term', unit: 'Unit', years: 'years', months: 'months', type: 'Payments', annuity: 'Equal (annuity)', linear: 'Decreasing (equal principal)', currency: 'Currency (optional)', curPh: '€, $, lei', totInt: 'Total interest', totPaid: 'Total paid', termLbl: 'Term',
      solveTitle: 'Payment ↔ term', solveMode: 'Find', solveTerm: 'term for a monthly payment', solveAmt: 'loan amount for a monthly payment', monthlyPay: 'Monthly payment', solveHint: 'Uses the amount, rate and term above (equal payments).', yearTitle: 'Summary by year',
      extraTitle: 'Extra payments', recAmt: 'Extra every month', fromMonth: 'Starting with payment no.', oneMonth: 'One-off: at payment no.', oneAmt: 'One-off amount', add: 'Add', rcTitle: 'Rate change (variable rate)', rcMonth: 'After payment no.', rcRate: 'New rate, % per year', schedTitle: 'Monthly payment schedule', csv: 'Save CSV',
      cmpTitle: 'Compare offers', offerName: 'Offer name', termYears: 'Term, years', fees: 'Upfront fees', cmpHint: 'Uses the payment type chosen above. Fill the third offer only if you need it.', savedTitle: 'Saved loans', saveName: 'Name', saveNamePh: 'e.g. Apartment, car', save: 'Save current loan',
      affTitle: 'How much can I borrow?', income: 'Monthly net income', debts: 'Other loan payments per month', share: 'Max share of income for loans, %', affHint: 'Uses the rate and term above (equal payments). Lenders apply their own rules, so this is only an estimate.', affRes: 'Payment up to {p} a month · you could borrow about {x}', affNone: 'Your other payments already use the whole share of income.', affEnter: 'Enter your income to see an estimate.',
      chartTitle: 'Amortization chart', chartHint: 'Bars: principal and interest paid each year. Line: remaining balance.', proOnly: 'Available in Pro.',
      proPitch: 'Full monthly schedule with CSV export, amortization chart, extra payments, rate changes, comparing up to 3 offers and saved loans.', disclaimer: 'Estimates only, not financial advice. Real offers can differ because of fees, insurance, rounding and lender rules.',
      yearF: 'year|years', monthF: 'month|months', payF: 'payment|payments', perMonth: '{x} a month', linNote: 'First payment {a}, last {b} (decreasing)', termRes: '{d} · {n}', invalid: 'Enter an amount > 0, a rate ≥ 0 and a term of up to 100 years.', solveTermRes: 'Repaid in {d} ({n})', solveAmtRes: 'You can borrow up to {x}', tooLow: 'The payment does not even cover the monthly interest.',
      yrCol: 'Year', paidCol: 'Paid', princCol: 'Principal', intCol: 'Interest', extraCol: 'Extra', balCol: 'Balance', monthCol: 'No.', payCol: 'Payment', rateCol: 'Rate %', yearNote: 'Includes your extra payments and the rate change.',
      extraRes: 'You save {s} in interest and finish {d} earlier ({n} fewer).', extraNone: 'Add a monthly extra or a one-off payment to see how much you save.', oneItem: 'Payment no. {m}: +{x}', remove: 'Remove',
      rcRes: 'From payment no. {m}: {p} a month (now {o}). Total interest {s} by {x}.', up: 'grows', down: 'drops', rcNone: 'Enter the month and the new rate to see the effect.',
      cmpPay: 'Monthly payment', cmpInt: 'Total interest', cmpFee: 'Fees', cmpCost: 'Interest + fees', cmpEff: 'Effective annual rate', cmpBest: 'Cheapest overall: {n}', emptySaved: 'No saved loans yet.', open: 'Open', del: 'Delete', loanN: 'Loan {n}', bad: '—' },
    ru: { appName: 'Кредитный калькулятор', loanTitle: 'Кредит', amount: 'Сумма кредита', ratePct: 'Ставка, % годовых', term: 'Срок', unit: 'Единица', years: 'лет', months: 'месяцев', type: 'Платежи', annuity: 'Равные', linear: 'Убывающие', currency: 'Валюта (необязательно)', curPh: '€, $, ₽', totInt: 'Всего процентов', totPaid: 'Всего выплат', termLbl: 'Срок',
      solveTitle: 'Платёж ↔ срок', solveMode: 'Найти', solveTerm: 'срок для ежемесячного платежа', solveAmt: 'сумму для ежемесячного платежа', monthlyPay: 'Ежемесячный платёж', solveHint: 'Используются сумма, ставка и срок выше (равные платежи).', yearTitle: 'Итоги по годам',
      extraTitle: 'Досрочные платежи', recAmt: 'Дополнительно каждый месяц', fromMonth: 'Начиная с платежа №', oneMonth: 'Разово: в платёж №', oneAmt: 'Разовая сумма', add: 'Добавить', rcTitle: 'Изменение ставки (плавающая ставка)', rcMonth: 'После платежа №', rcRate: 'Новая ставка, % годовых', schedTitle: 'Помесячный график платежей', csv: 'Сохранить CSV',
      cmpTitle: 'Сравнение предложений', offerName: 'Название', termYears: 'Срок, лет', fees: 'Разовые комиссии', cmpHint: 'Используется тип платежей, выбранный выше. Третье предложение заполняйте только при необходимости.', savedTitle: 'Сохранённые кредиты', saveName: 'Название', saveNamePh: 'напр. Квартира, машина', save: 'Сохранить кредит',
      affTitle: 'Сколько можно занять?', income: 'Чистый доход в месяц', debts: 'Другие платежи по кредитам в месяц', share: 'Максимальная доля дохода на кредиты, %', affHint: 'Используются ставка и срок выше (равные платежи). У банков свои правила, поэтому это лишь оценка.', affRes: 'Платёж до {p} в месяц · можно занять примерно {x}', affNone: 'Другие платежи уже занимают всю долю дохода.', affEnter: 'Введите доход, чтобы увидеть оценку.',
      chartTitle: 'График погашения', chartHint: 'Столбцы: основной долг и проценты за каждый год. Линия: остаток долга.', proOnly: 'Доступно в Pro.',
      proPitch: 'Полный помесячный график с экспортом CSV, график погашения, досрочные платежи, изменение ставки, сравнение до 3 предложений и сохранённые кредиты.', disclaimer: 'Только оценка, не финансовая консультация. Реальные условия могут отличаться из-за комиссий, страховок, округлений и правил банка.',
      yearF: 'год|года|лет', monthF: 'месяц|месяца|месяцев', payF: 'платёж|платежа|платежей', perMonth: '{x} в месяц', linNote: 'Первый платёж {a}, последний {b} (убывающие)', termRes: '{d} · {n}', invalid: 'Введите сумму > 0, ставку ≥ 0 и срок не более 100 лет.', solveTermRes: 'Погашение за {d} ({n})', solveAmtRes: 'Можно занять до {x}', tooLow: 'Платёж не покрывает даже ежемесячные проценты.',
      yrCol: 'Год', paidCol: 'Выплачено', princCol: 'Основной долг', intCol: 'Проценты', extraCol: 'Досрочно', balCol: 'Остаток', monthCol: '№', payCol: 'Платёж', rateCol: 'Ставка %', yearNote: 'С учётом досрочных платежей и изменения ставки.',
      extraRes: 'Экономия на процентах {s}, кредит закрыт на {d} раньше (на {n} меньше).', extraNone: 'Добавьте ежемесячный или разовый досрочный платёж, чтобы увидеть экономию.', oneItem: 'Платёж № {m}: +{x}', remove: 'Удалить',
      rcRes: 'С платежа № {m}: {p} в месяц (сейчас {o}). Всего процентов {s} на {x}.', up: 'больше', down: 'меньше', rcNone: 'Введите месяц и новую ставку, чтобы увидеть эффект.',
      cmpPay: 'Ежемесячный платёж', cmpInt: 'Всего процентов', cmpFee: 'Комиссии', cmpCost: 'Проценты + комиссии', cmpEff: 'Эффективная годовая ставка', cmpBest: 'Дешевле всего в итоге: {n}', emptySaved: 'Пока нет сохранённых кредитов.', open: 'Открыть', del: 'Удалить', loanN: 'Кредит {n}', bad: '—' }
  };
  const L = LoanCalc;
  const $ = id => document.getElementById(id);
  const v = id => L.num($(id).value);
  const FIELDS = ['amt', 'rate', 'term', 'termUnit', 'type', 'cur', 'solveMode', 'solvePay', 'recAmt', 'recFrom', 'rcMonth', 'rcRate', 'income', 'debts', 'share'];
  const OFFER = ['cName', 'cAmt', 'cRate', 'cYears', 'cFee'];
  let isPro = false, ones = [], saved = [], full = null;
  const load = (k, d) => { try { return JSON.parse(Core.store(k) || '') || d; } catch (e) { return d; } };

  /* ---- formatare ---- */
  function f(x, max, min) {
    if (!Number.isFinite(x)) return Core.t('bad');
    return new Intl.NumberFormat(Core.lang, { minimumFractionDigits: min == null ? 0 : min, maximumFractionDigits: max == null ? 2 : max }).format(x);
  }
  function money(x) { const c = $('cur').value.trim(); return f(x, 2, 2) + (c && Number.isFinite(x) ? ' ' + c : ''); }
  function plural(n, key) {
    const fm = Core.t(key).split('|');
    if (Core.lang === 'ru') { const a = n % 10, b = n % 100; return n + ' ' + fm[a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2]; }
    if (Core.lang === 'ro') return n + (n !== 1 && (n % 100 === 0 || n % 100 >= 20) ? ' de ' : ' ') + fm[n === 1 ? 0 : 1];
    return n + ' ' + fm[n === 1 ? 0 : 1];
  }
  function dur(n) {
    const y = Math.floor(n / 12), m = n % 12, p = [];
    if (y) p.push(plural(y, 'yearF'));
    if (m || !y) p.push(plural(m, 'monthF'));
    return p.join(' ');
  }
  function table(el, head, rows, bestCol) {
    el.textContent = '';
    if (!rows.length) return;
    const tr = document.createElement('tr');
    head.forEach((h, i) => { const th = document.createElement('th'); th.textContent = h; if (i === bestCol) th.className = 'best'; tr.append(th); });
    const frag = document.createDocumentFragment(); frag.append(tr);
    for (const r of rows) {
      const row = document.createElement('tr');
      r.forEach((c, i) => { const td = document.createElement('td'); td.textContent = c; if (i === bestCol) td.className = 'best'; row.append(td); });
      frag.append(row);
    }
    el.append(frag);
  }

  /* ---- date de intrare ---- */
  function base() {
    const t = v('term');
    return { principal: v('amt'), rate: v('rate'), months: Math.round($('termUnit').value === 'y' ? t * 12 : t), type: $('type').value };
  }
  function scenario(b) {
    const o = Object.assign({}, b), rm = v('rcMonth'), rr = v('rcRate'), ra = v('recAmt');
    if (Number.isFinite(rm) && rm >= 1 && Number.isFinite(rr) && rr >= 0) o.rateChange = { month: Math.floor(rm), rate: rr };
    const withExtra = Object.assign({}, o, { extras: ones, recurring: ra > 0 ? { amount: ra, from: v('recFrom') || 1 } : null });
    return { rc: o, ex: withExtra, hasRc: !!o.rateChange, hasEx: ra > 0 || ones.length > 0 };
  }
  function snapshot() { const s = {}; FIELDS.forEach(id => { s[id] = $(id).value; }); s.ones = ones; return s; }
  function restore(s) {
    if (!s) return;
    FIELDS.forEach(id => { if (s[id] != null) $(id).value = s[id]; });
    ones = Array.isArray(s.ones) ? s.ones.filter(e => e && e.month >= 1 && e.amount > 0) : [];
  }
  function persist() {
    Core.store('loanIn', JSON.stringify(snapshot()));
    const offers = []; for (let i = 1; i <= 3; i++) offers.push(OFFER.map(k => $(k + i).value));
    Core.store('loanOffers', JSON.stringify(offers));
  }

  /* ---- calcul și afișare ---- */
  function main() {
    const b = base(), s = L.schedule(b);
    full = null;
    if (!s) {
      $('payOut').textContent = Core.t('invalid');
      ['payNote', 'totInt', 'totPaid', 'termOut', 'extraOut', 'rcOut'].forEach(id => { $(id).textContent = ''; });
      ['yearTable', 'schedTable'].forEach(id => { $(id).textContent = ''; });
      $('yearNote').textContent = '';
      solve(); afford(); drawChart(null); return;
    }
    const first = s.rows[0].payment, last = s.rows[s.rows.length - 1].payment;
    $('payOut').textContent = Core.t('perMonth', { x: money(first) });
    $('payNote').textContent = b.type === 'linear' ? Core.t('linNote', { a: money(first), b: money(last) }) : '';
    $('totInt').textContent = money(s.totalInterest);
    $('totPaid').textContent = money(s.totalPaid);
    $('termOut').textContent = Core.t('termRes', { d: dur(s.months), n: plural(s.months, 'payF') });
    solve(); afford();

    let shown = s, note = '';
    $('extraOut').textContent = ''; $('rcOut').textContent = '';
    if (isPro) {
      const sc = scenario(b), rcS = sc.hasRc ? L.schedule(sc.rc) : s, exS = L.schedule(sc.ex);
      if (rcS && exS) {
        full = exS; shown = exS;
        if (sc.hasEx || sc.hasRc) note = Core.t('yearNote');
        if (sc.hasEx) {
          const sv = L.c2(rcS.totalInterest - exS.totalInterest), fewer = rcS.months - exS.months;
          const span = document.createElement('span'); span.className = 'good';
          span.textContent = Core.t('extraRes', { s: money(sv), d: dur(fewer), n: plural(fewer, 'payF') });
          $('extraOut').append(span);
        } else $('extraOut').textContent = Core.t('extraNone');
        if (sc.hasRc) {
          const m = sc.rc.rateChange.month, row = rcS.rows[m], diff = L.c2(rcS.totalInterest - s.totalInterest);
          $('rcOut').textContent = m >= rcS.months || m >= s.months ? Core.t('bad') : Core.t('rcRes', { m: m + 1, p: money(row.payment), o: money(s.rows[m].payment), s: Core.t(diff >= 0 ? 'up' : 'down'), x: money(Math.abs(diff)) });
        } else $('rcOut').textContent = Core.t('rcNone');
      }
    }
    $('yearNote').textContent = note;
    table($('yearTable'), ['yrCol', 'paidCol', 'princCol', 'intCol', 'balCol'].map(k => Core.t(k)),
      L.yearly(shown.rows).map(y => [y.year, money(y.paid), money(y.principal), money(y.interest), money(y.balance)]));
    if (isPro) {
      const hasEx = shown.totalExtra > 0;
      const head = ['monthCol', 'rateCol', 'payCol', 'intCol', 'princCol'].concat(hasEx ? ['extraCol'] : [], ['balCol']).map(k => Core.t(k));
      table($('schedTable'), head, shown.rows.map(r => [r.month, f(r.rate, 4), money(r.payment), money(r.interest), money(r.principal)].concat(hasEx ? [money(r.extra)] : [], [money(r.balance)])));
    } else $('schedTable').textContent = '';
    drawChart(shown.rows);
  }
  function solve() {
    const P = v('amt'), r = v('rate'), pay = v('solvePay'), b = base(), out = $('solveOut');
    if (!(pay > 0) || !(r >= 0)) { out.textContent = Core.t('bad'); return; }
    if ($('solveMode').value === 'term') {
      const n = L.termFor(P, r, pay);
      out.textContent = !(P > 0) ? Core.t('bad') : Number.isFinite(n) && n <= L.MAX_MONTHS ? Core.t('solveTermRes', { d: dur(n), n: plural(n, 'payF') }) : Core.t('tooLow');
    } else {
      const x = L.principalFor(pay, r, b.months);
      out.textContent = Number.isFinite(x) ? Core.t('solveAmtRes', { x: money(x) }) : Core.t('bad');
    }
  }
  function afford() {
    const out = $('affOut'), inc = v('income'), b = base();
    if (!(inc > 0)) { out.textContent = Core.t('affEnter'); return; }
    const a = L.affordable(inc, v('debts'), v('share'), b.rate, b.months);
    out.textContent = !a || !Number.isFinite(a.principal) ? Core.t('bad') : a.payment > 0 ? Core.t('affRes', { p: money(a.payment), x: money(a.principal) }) : Core.t('affNone');
  }
  function drawChart(rows) {
    const cv = $('chart'), lockMsg = $('chartLocked');
    lockMsg.textContent = isPro ? '' : Core.t('proOnly');
    const m = isPro && rows ? L.chartModel(rows) : null;
    cv.classList.toggle('hidden', !m);
    if (!m) return;
    const css = getComputedStyle(document.documentElement), col = k => css.getPropertyValue(k).trim() || '#888';
    const dpr = window.devicePixelRatio || 1, W = cv.clientWidth || 600, H = cv.clientHeight || 260;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const cP = col('--accent'), cI = col('--warn'), cB = col('--text'), cM = col('--muted'), cL = col('--border');
    document.querySelectorAll('.legend .lgP').forEach(e => { e.style.background = cP; });
    document.querySelectorAll('.legend .lgI').forEach(e => { e.style.background = cI; });
    document.querySelectorAll('.legend .lgB').forEach(e => { e.style.background = cB; });
    const padL = 8, padR = 8, padT = 18, padB = 20, pw = W - padL - padR, ph = H - padT - padB, n = m.years.length, bw = pw / n;
    const short = x => new Intl.NumberFormat(Core.lang, { notation: 'compact', maximumFractionDigits: 1 }).format(x);
    g.strokeStyle = cL; g.lineWidth = 1; g.beginPath(); g.moveTo(padL, padT + ph + .5); g.lineTo(W - padR, padT + ph + .5); g.stroke();
    for (let i = 0; i < n; i++) {
      const x = padL + i * bw + bw * 0.15, w = Math.max(1, bw * 0.7);
      const hp = m.principal[i] / m.maxPaid * ph, hi = m.interest[i] / m.maxPaid * ph;
      g.fillStyle = cP; g.fillRect(x, padT + ph - hp, w, hp);
      g.fillStyle = cI; g.fillRect(x, padT + ph - hp - hi, w, hi);
    }
    g.strokeStyle = cB; g.lineWidth = 2; g.beginPath();
    m.balance.forEach((b, i) => { const x = padL + i * bw, y = padT + ph - b / m.start * ph; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.stroke();
    g.fillStyle = cM; g.font = '11px system-ui, sans-serif'; g.textBaseline = 'alphabetic';
    g.textAlign = 'left'; g.fillText(short(m.maxPaid) + ' / ' + Core.t('yrCol').toLowerCase(), padL, 12);
    g.textAlign = 'right'; g.fillText(Core.t('balCol') + ' ' + short(m.start), W - padR, 12);
    const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / 34))));
    g.textAlign = 'center';
    for (let i = 0; i < n; i += every) g.fillText(String(m.years[i]), padL + i * bw + bw / 2, H - 5);
  }
  function renderOnes() {
    const ul = $('oneList'); ul.textContent = '';
    ones.sort((a, b) => a.month - b.month).forEach((e, i) => {
      const li = document.createElement('li'), sp = document.createElement('span'), del = document.createElement('button');
      sp.textContent = Core.t('oneItem', { m: e.month, x: money(e.amount) });
      del.textContent = Core.t('remove'); del.disabled = !isPro;
      del.addEventListener('click', () => { ones.splice(i, 1); changed(); });
      li.append(sp, del); ul.append(li);
    });
  }
  function compare() {
    const el = $('cmpTable');
    if (!isPro) { el.textContent = ''; return; }
    const offers = [], names = [];
    for (let i = 1; i <= 3; i++) {
      const a = v('cAmt' + i), r = v('cRate' + i), y = v('cYears' + i);
      if (!Number.isFinite(a) && !Number.isFinite(r)) continue;
      names.push($('cName' + i).value.trim() || String.fromCharCode(64 + i));
      offers.push({ principal: a, rate: r, months: Math.round(y * 12), type: $('type').value, fee: v('cFee' + i) || 0 });
    }
    const c = L.compare(offers), lin = $('type').value === 'linear';
    const col = k => c.offers.map(o => o ? k(o) : Core.t('bad'));
    const rows = [
      [Core.t('cmpPay')].concat(col(o => lin ? money(o.first) + ' → ' + money(o.last) : money(o.first))),
      [Core.t('cmpInt')].concat(col(o => money(o.totalInterest))),
      [Core.t('cmpFee')].concat(col(o => money(o.fee))),
      [Core.t('cmpCost')].concat(col(o => money(o.totalCost))),
      [Core.t('cmpEff')].concat(col(o => f(o.effRate, 2, 2) + '%'))
    ];
    if (c.best >= 0 && offers.length > 1) rows.push([Core.t('cmpBest', { n: names[c.best] })].concat(names.map(() => '')));
    table(el, [''].concat(names), offers.length ? rows : [], c.best >= 0 && offers.length > 1 ? c.best + 1 : -1);
  }
  function renderSaved() {
    const ul = $('savedList'); ul.textContent = '';
    if (!saved.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = Core.t('emptySaved'); ul.append(li); return; }
    saved.forEach((s, i) => {
      const li = document.createElement('li'), sp = document.createElement('span');
      const t = L.num(s.in.term), months = Math.round(s.in.termUnit === 'y' ? t * 12 : t), c = (s.in.cur || '').trim();
      sp.textContent = s.name + ' · ' + f(L.num(s.in.amt), 2, 2) + (c ? ' ' + c : '') + ' · ' + f(L.num(s.in.rate), 4) + '% · ' + (months > 0 ? dur(months) : '');
      const op = document.createElement('button'), del = document.createElement('button');
      op.textContent = Core.t('open'); del.textContent = Core.t('del'); op.disabled = del.disabled = !isPro;
      op.addEventListener('click', () => { if (!isPro) return; restore(s.in); changed(); });
      del.addEventListener('click', () => { if (!isPro) return; saved.splice(i, 1); Core.store('loanSaved', JSON.stringify(saved)); renderSaved(); });
      li.append(sp, op, del); ul.append(li);
    });
  }
  function all() { main(); renderOnes(); compare(); renderSaved(); }
  function changed() { persist(); all(); }
  function lockPro() {
    ['recAmt', 'recFrom', 'oneMonth', 'oneAmt', 'oneAdd', 'rcMonth', 'rcRate', 'csv', 'saveName', 'saveBtn'].concat(...[1, 2, 3].map(i => OFFER.map(k => k + i)))
      .forEach(id => { $(id).disabled = !isPro; });
    all();
  }

  restore(load('loanIn', null));
  load('loanOffers', []).forEach((o, i) => { if (Array.isArray(o) && i < 3) OFFER.forEach((k, j) => { if (o[j] != null) $(k + (i + 1)).value = o[j]; }); });
  saved = load('loanSaved', []);
  if (!Array.isArray(saved)) saved = [];
  Core.init(DICT, all);
  lockPro();
  FIELDS.concat(...[1, 2, 3].map(i => OFFER.map(k => k + i))).forEach(id => { $(id).addEventListener('input', changed); $(id).addEventListener('change', changed); });
  $('oneAdd').addEventListener('click', () => {
    const m = Math.floor(v('oneMonth')), a = v('oneAmt');
    if (!isPro || !(m >= 1) || !(a > 0)) return;
    ones.push({ month: m, amount: a }); $('oneAmt').value = ''; changed();
  });
  $('csv').addEventListener('click', () => {
    if (!isPro || !full) return;
    const blob = new Blob([L.toCsv(full.rows)], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'loan-schedule.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('saveBtn').addEventListener('click', () => {
    if (!isPro || !L.schedule(base())) return;
    const name = $('saveName').value.trim() || Core.t('loanN', { n: saved.length + 1 });
    saved.push({ name, in: snapshot() });
    if (saved.length > 50) saved = saved.slice(-50);
    Core.store('loanSaved', JSON.stringify(saved)); $('saveName').value = ''; renderSaved();
  });
  let rt = 0;
  const redraw = () => { clearTimeout(rt); rt = setTimeout(main, 120); };
  window.addEventListener('resize', redraw);
  $('theme').addEventListener('click', main);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', main);
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
