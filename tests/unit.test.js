const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../convertor/logic.js');
const F = require('../focus/logic.js');
const T = require('../text/logic.js');
const P = require('../pass/logic.js');

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('converter: linear units', () => {
  close(U.convert('length', 'km', 'mi', 1), 0.621371192237334);
  close(U.convert('length', 'in', 'cm', 1), 2.54);
  close(U.convert('mass', 'lb', 'kg', 1), 0.45359237);
  close(U.convert('volume', 'galUS', 'l', 1), 3.785411784);
  close(U.convert('area', 'ha', 'm2', 1), 10000);
  close(U.convert('speed', 'kmh', 'mps', 36), 10);
  close(U.convert('data', 'GiB', 'MB', 1), 1073.741824);
  close(U.convert('time', 'd', 'h', 2), 48);
  close(U.convert('pressure', 'atm', 'bar', 1), 1.01325);
  close(U.convert('energy', 'kWh', 'kJ', 1), 3600);
  close(U.convert('angle', 'turn', 'rad', 1), 2 * Math.PI);
});

test('converter: temperature', () => {
  close(U.convert('temperature', 'C', 'F', 100), 212);
  close(U.convert('temperature', 'F', 'C', -40), -40);
  close(U.convert('temperature', 'K', 'C', 0), -273.15);
  close(U.convert('temperature', 'C', 'K', 25), 298.15);
});

test('converter: density and flow rate (Pro)', () => {
  close(U.convert('density', 'gcm3', 'kgm3', 1), 1000);
  close(U.convert('density', 'lbft3', 'kgm3', 62.428), 1000, 1e-3);
  close(U.convert('density', 'gml', 'gl', 0.8), 800);
  close(U.convert('flow', 'm3h', 'ls', 3.6), 1);
  close(U.convert('flow', 'galUSmin', 'lmin', 1), 3.785411784);
  close(U.convert('flow', 'cfm', 'm3h', 1), 1.6990107955);
  assert.equal(U.categories(false).includes('density'), false);
  assert.equal(U.categories(true).includes('flow'), true);
});

test('converter: frequency and torque (Pro)', () => {
  close(U.convert('frequency', 'rpm', 'Hz', 3000), 50);
  close(U.convert('frequency', 'GHz', 'MHz', 2.4), 2400);
  close(U.convert('torque', 'lbfft', 'Nm', 100), 135.58179483314);
  close(U.convert('torque', 'kgfm', 'Nm', 1), 9.80665);
  assert.equal(U.categories(false).includes('torque'), false);
  assert.equal(U.categories(true).includes('frequency'), true);
});

test('converter: fuel economy is reciprocal', () => {
  close(U.convert('fuel', 'l100', 'kml', 5), 20);
  close(U.convert('fuel', 'mpgUS', 'l100', 30), 7.84048610, 1e-7);
  close(U.convert('fuel', 'l100', 'l100', 6.5), 6.5);
  assert.equal(U.convert('fuel', 'kml', 'l100', 0), Infinity);
});

test('converter: round trips across every pair', () => {
  for (const cat of U.categories(true)) {
    const units = Object.keys(U.CATEGORIES[cat].units);
    for (const a of units) for (const b of units) close(U.convert(cat, b, a, U.convert(cat, a, b, 7.25)), 7.25, 1e-9);
  }
});

test('converter: format and errors', () => {
  assert.equal(U.format(0.1 + 0.2), '0.3');
  assert.equal(U.format(0), '0');
  assert.equal(U.format(NaN), '—');
  assert.equal(U.format(Infinity), '∞');
  assert.match(U.format(1e-12), /e-12$/);
  assert.ok(Number.isNaN(U.convert('length', 'm', 'km', 'abc')));
  assert.throws(() => U.convert('nope', 'm', 'km', 1));
  assert.throws(() => U.convert('length', 'm', 'kg', 1));
  assert.deepEqual(U.categories(false).includes('pressure'), false);
  assert.ok(U.categories(true).includes('fuel'));
});

test('focus: phases cycle with long break every N', () => {
  const cfg = { work: 25, short: 5, long: 15, every: 4 };
  assert.equal(F.nextPhase('work', 1, cfg), 'short');
  assert.equal(F.nextPhase('work', 4, cfg), 'long');
  assert.equal(F.nextPhase('work', 8, cfg), 'long');
  assert.equal(F.nextPhase('short', 1, cfg), 'work');
  assert.equal(F.nextPhase('long', 4, cfg), 'work');
  assert.equal(F.durationSec('short', cfg), 300);
});

test('focus: sanitize clamps and fills defaults', () => {
  assert.deepEqual(F.sanitize({ work: 0, short: 'x', long: 999, every: 1 }), { work: 1, short: 5, long: 90, every: 2 });
  assert.deepEqual(F.sanitize(null), F.DEFAULT_CFG);
});

test('focus: fmt', () => {
  assert.equal(F.fmt(1500), '25:00');
  assert.equal(F.fmt(59.2), '01:00');
  assert.equal(F.fmt(-3), '00:00');
  assert.equal(F.fmt(3725), '1:02:05');
});

test('focus: stats, last days and csv', () => {
  const d1 = new Date(2026, 10, 3, 10), d2 = new Date(2026, 10, 4, 9);
  let s = F.record({}, d1, 25);
  s = F.record(s, d2, 25);
  s = F.record(s, d2, 50);
  assert.deepEqual(s['2026-11-04'], { sessions: 2, minutes: 75 });
  const days = F.lastDays(s, d2, 7);
  assert.equal(days.length, 7);
  assert.equal(days[6].day, '2026-11-04');
  assert.equal(days[5].minutes, 25);
  assert.equal(days[0].day, '2026-10-29');
  assert.equal(F.toCSV(s), 'date,sessions,minutes\n2026-11-03,1,25\n2026-11-04,2,75\n');
});

test('focus: daily goal and streak', () => {
  assert.equal(F.sanitizeGoal('x'), F.GOAL_DEFAULT);
  assert.equal(F.sanitizeGoal(0), 1);
  assert.equal(F.sanitizeGoal(99), 16);
  const s = { '2026-11-05': { sessions: 4, minutes: 100 }, '2026-11-06': { sessions: 5, minutes: 125 },
    '2026-11-07': { sessions: 4, minutes: 100 }, '2026-11-08': { sessions: 1, minutes: 25 } };
  assert.equal(F.streak(s, new Date(2026, 10, 7, 20), 4), 3);
  assert.equal(F.streak(s, new Date(2026, 10, 8, 9), 4), 3);
  assert.equal(F.streak(s, new Date(2026, 10, 9, 9), 4), 0);
  assert.equal(F.streak(s, new Date(2026, 10, 8, 9), 1), 4);
  assert.equal(F.streak({}, new Date(2026, 10, 8), 4), 0);
});

test('text: stats in three languages', () => {
  const s = T.stats('Salut, lume! Ce faci?\n\nПривет мир. Hello world');
  assert.equal(s.words, 8);
  assert.equal(s.lines, 3);
  assert.equal(s.paragraphs, 2);
  assert.equal(s.sentences, 4);
  assert.equal(T.stats('').words, 0);
  assert.equal(T.stats('').lines, 0);
  assert.equal(T.stats('a b').charsNoSpaces, 2);
  assert.equal(T.stats("don't stop").words, 2);
});

test('text: case operations', () => {
  assert.equal(T.ops.upper('ștrudel'), 'ȘTRUDEL');
  assert.equal(T.ops.title('ana are MERE'), 'Ana Are Mere');
  assert.equal(T.ops.sentence('HELLO. how ARE you? fine'), 'Hello. How are you? Fine');
  assert.equal(T.ops.title('привет мир'), 'Привет Мир');
});

test('text: line operations', () => {
  assert.equal(T.ops.sortAZ('b\nA\nc\na10\na2'), 'A\na2\na10\nb\nc');
  assert.equal(T.ops.sortZA('a\nc\nb'), 'c\nb\na');
  assert.equal(T.ops.dedupe('a\nb\na\nc\nb'), 'a\nb\nc');
  assert.equal(T.ops.reverseLines('1\n2\n3'), '3\n2\n1');
  assert.equal(T.ops.trim('  a   b \n\t c  '), 'a b\nc');
  assert.equal(T.ops.removeEmpty('a\n\n  \nb'), 'a\nb');
  assert.equal(T.ops.numberLines('x\ny'), '1. x\n2. y');
  assert.equal(T.ops.dedupe('a\r\nb\r\na'), 'a\nb');
  assert.equal(T.ops.joinLines('  a \n\nb\r\n c'), 'a b c');
  assert.equal(T.ops.stripHtml('<p>Hi &amp; <b>bye</b></p><script>x()</script>&lt;3'), 'Hi & bye<3');
});

test('text: diacritics and slug', () => {
  assert.equal(T.ops.removeDiacritics('Știință și țară, Ăă Îî Ââ'), 'Stiinta si tara, Aa Ii Aa');
  assert.equal(T.ops.slug('  Grădina de Stele: v2!  '), 'gradina-de-stele-v2');
  assert.equal(T.ops.slug('Привет, мир щука'), 'privet-mir-schuka');
});

test('text: pro tools', () => {
  assert.equal(T.regexReplace('a1b22c', '\\d+', 'g', '#'), 'a#b#c');
  assert.equal(T.regexReplace('Aa', 'a', 'gi', ''), '');
  assert.equal(T.regexReplace('x', 'x', 'gzz', 'y'), 'y');
  assert.throws(() => T.regexReplace('x', '(', 'g', ''));
  const s = 'Șir ăîâ привет 🙂';
  assert.equal(T.pro.b64decode(T.pro.b64encode(s)), s);
  assert.equal(T.pro.b64encode('hello'), 'aGVsbG8=');
  assert.equal(T.pro.urlEncode('a b&c'), 'a%20b%26c');
  assert.equal(T.pro.urlDecode('a+b%26c'), 'a b&c');
  assert.equal(T.pro.jsonFormat('{"a":[1,2]}'), '{\n  "a": [\n    1,\n    2\n  ]\n}');
  assert.equal(T.pro.jsonMinify('{ "a" : 1 }'), '{"a":1}');
  assert.equal(T.pro.extractEmails('Scrie la ana.pop@ex.ro sau ANA@x.com; ana.pop@ex.ro'), 'ana.pop@ex.ro\nANA@x.com');
  assert.equal(T.pro.extractUrls('Vezi https://a.ro/x?y=1, apoi (http://b.com/p).'), 'https://a.ro/x?y=1\nhttp://b.com/p');
  assert.equal(T.pro.wordFreq('Ana are mere. ana ARE pere, mere'), 'ana: 2\nare: 2\nmere: 2\npere: 1');
  assert.equal(T.pro.wordFreq(''), '');
  assert.throws(() => T.pro.jsonFormat('{bad'));
});

test('text v1.0.4: camelCase / snake_case / kebab-case / transliterare (Pro)', () => {
  assert.equal(T.pro.camelCase('Hello world\nuser_id field'), 'helloWorld\nuserIdField');
  assert.equal(T.pro.snakeCase('myVariableName\nȘir de text'), 'my_variable_name\nsir_de_text');
  assert.equal(T.pro.kebabCase('Total Price (USD)'), 'total-price-usd');
  assert.equal(T.pro.camelCase(''), '');
  assert.equal(T.pro.translit('Привет, Мир! Ёж и Щука'), 'Privet, Mir! Ezh i Schuka');
  assert.equal(T.pro.translit('abc 123'), 'abc 123');
  assert.ok(!T.FREE.includes('camelCase') && T.PRO.includes('translit'));
});

test('pass: generator respects length, sets and look-alikes', () => {
  for (let i = 0; i < 200; i++) {
    const p = P.generate({ length: 12, lower: true, upper: true, digits: true, symbols: true, noSimilar: true });
    assert.equal(p.length, 12);
    assert.match(p, /[a-z]/); assert.match(p, /[A-Z]/); assert.match(p, /[0-9]/); assert.match(p, /[^a-zA-Z0-9]/);
    assert.doesNotMatch(p, /[Il1O0o|]/);
  }
  assert.match(P.generate({ length: 8, digits: true }), /^\d{8}$/);
  assert.equal(P.generate({ length: 2, lower: true }).length, 4);
  assert.throws(() => P.generate({ length: 10 }));
});
test('pass: entropy and levels', () => {
  assert.equal(P.bits(16, 94), 105);
  assert.equal(P.poolSize({ lower: true, upper: true, digits: true, symbols: true }), 26 + 26 + 10 + P.SETS.symbols.length);
  assert.equal(P.level(30), 'weak'); assert.equal(P.level(50), 'fair'); assert.equal(P.level(70), 'strong'); assert.equal(P.level(90), 'veryStrong');
  assert.ok(P.estimate('password123') <= 20);
  assert.ok(P.estimate('aaaaaaaaaaaa') <= 20);
  assert.ok(P.estimate('xK9#mQ2$vL7!pR4') > 80);
  assert.equal(P.estimate(''), 0);
});
test('pass: randInt is uniform enough', () => {
  const c = [0, 0, 0];
  for (let i = 0; i < 30000; i++) c[P.randInt(3)]++;
  for (const n of c) assert.ok(n > 9300 && n < 10700, String(c));
});
test('pass: passphrase, PIN, pronounceable, word lists', () => {
  for (const lang of ['en', 'ro', 'ru']) {
    const list = P.WORDS[lang];
    assert.ok(list.length >= 120); assert.equal(new Set(list).size, list.length);
    const ph = P.passphrase({ words: 5, sep: ' ', lang });
    assert.equal(ph.split(' ').length, 5);
    for (const w of ph.split(' ')) assert.ok(list.includes(w));
  }
  assert.doesNotMatch(P.WORDS.ro.join(''), /[ăâîșțşţ]/);
  assert.match(P.passphrase({ words: 3, capitalize: true, number: true, lang: 'en' }), /^[A-Z][a-z]+\d*-[A-Z][a-z]+\d*-[A-Z][a-z]+\d*$/);
  assert.match(P.pin(6), /^\d{6}$/);
  assert.match(P.pronounceable(10), /^[A-Z][a-z]{7}\d\d$/);
  assert.equal(P.bulk('pin', { length: 4 }, 7).length, 7);
  assert.ok(P.passphraseBits({ words: 6, lang: 'en' }) >= 42);
});
test('pass: CSV guards formulas and quotes', () => {
  assert.equal(P.toCsv(['=1+2', 'a,b', 'ok']), 'password\r\n"\'=1+2"\r\n"a,b"\r\nok\r\n');
});

const DC = require('../days/logic.js');
test('days: parse, diff, ymd and addMonths', () => {
  const p = DC.parse;
  assert.equal(p('2026-02-30'), null);
  assert.equal(p('x'), null);
  assert.equal(DC.diffDays(p('2026-03-28'), p('2026-03-30')), 2); /* across DST in most zones */
  assert.equal(DC.diffDays(p('2026-11-20'), p('2026-01-01')), -323);
  assert.deepEqual(DC.ymd(p('1994-05-10'), p('2026-11-20')), { years: 32, months: 6, days: 10, sign: 1 });
  assert.deepEqual(DC.ymd(p('2024-01-31'), p('2024-03-01')), { years: 0, months: 1, days: 1, sign: 1 });
  assert.equal(DC.fmt(DC.addMonths(p('2024-01-31'), 1)), '2024-02-29');
  assert.equal(DC.fmt(DC.addMonths(p('2026-01-15'), -2)), '2025-11-15');
});
test('days: ISO week, day of year, leap years', () => {
  const p = DC.parse;
  assert.deepEqual(DC.isoWeek(p('2026-01-01')), { week: 1, year: 2026 });
  assert.deepEqual(DC.isoWeek(p('2024-12-30')), { week: 1, year: 2025 });
  assert.deepEqual(DC.isoWeek(p('2021-01-03')), { week: 53, year: 2020 });
  assert.equal(DC.dayOfYear(p('2024-12-31')), 366);
  assert.equal(DC.isLeap(1900), false); assert.equal(DC.isLeap(2000), true);
});
test('days: working days, days off, countdowns CSV', () => {
  const p = DC.parse;
  assert.equal(DC.workdaysBetween(p('2026-11-16'), p('2026-11-23'), []), 5);
  assert.equal(DC.workdaysBetween(p('2026-11-16'), p('2026-11-23'), [], true), 6);
  assert.equal(DC.workdaysBetween(p('2026-12-21'), p('2026-12-28'), ['2026-12-25']), 4);
  assert.equal(DC.workdaysBetween(p('2026-11-23'), p('2026-11-16'), []), -5);
  assert.equal(DC.fmt(DC.addWorkdays(p('2026-11-20'), 1, [])), '2026-11-23');
  assert.equal(DC.fmt(DC.addWorkdays(p('2026-11-23'), -1, [])), '2026-11-20');
  assert.equal(DC.fmt(DC.addWorkdays(p('2026-12-24'), 1, ['2026-12-25'])), '2026-12-28');
  assert.deepEqual(DC.parseList('2026-12-25, 2026-12-25\nbad 2027-01-01'), { dates: ['2026-12-25', '2027-01-01'], bad: ['bad'] });
  const cd = DC.countdowns([{ name: 'B', date: '2026-12-31' }, { name: '=A', date: '2026-11-30' }], p('2026-11-20'));
  assert.deepEqual(cd.map(e => e.left), [10, 41]);
  assert.equal(DC.toCsv(cd), 'name,date,days_left\r\n"\'=A",2026-11-30,10\r\nB,2026-12-31,41\r\n');
});

const PC = require('../pct/logic.js');
test('pct: basic percentages and parsing', () => {
  assert.equal(PC.pctOf(15, 80), 12);
  assert.equal(PC.whatPct(30, 120), 25);
  assert.ok(Number.isNaN(PC.whatPct(1, 0)));
  assert.equal(PC.change(80, 100), 25);
  assert.equal(PC.change(-50, -25), 50);
  assert.ok(Number.isNaN(PC.change(0, 5)));
  assert.equal(PC.apply(0.1, 200), 0.3);
  assert.equal(PC.original(120, 20), 100);
  assert.ok(Number.isNaN(PC.original(5, -100)));
  assert.deepEqual(PC.discount(80, 15), { save: 12, final: 68 });
  assert.equal(PC.num('1 234,5'), 1234.5);
  assert.ok(Number.isNaN(PC.num('12abc')));
  assert.ok(Number.isNaN(PC.num('')));
});
test('pct: Pro VAT, tip, margin, compound, CSV', () => {
  assert.deepEqual(PC.vatAdd(100, 19), { net: 100, vat: 19, gross: 119 });
  assert.deepEqual(PC.vatRemove(119, 19), { net: 100, vat: 19, gross: 119 });
  assert.deepEqual(PC.tip(90, 10, 3), { tip: 9, total: 99, each: 33 });
  assert.deepEqual(PC.tip(10, 0, 0), { tip: 0, total: 10, each: 10 });
  assert.deepEqual(PC.margin(60, 100), { profit: 40, margin: 40, markup: 66.6666666667 });
  const c = PC.compound(1000, 10, 2, 1);
  assert.deepEqual(c, [{ year: 1, value: 1100, gain: 100 }, { year: 2, value: 1210, gain: 210 }]);
  assert.equal(PC.compound(1, 1, 500, 1).length, 100);
  assert.equal(PC.toCsv([{ time: 't', calc: '=SUM(A1)', result: '-5' }, { time: 't', calc: 'a, b', result: '1' }]), 'time,calculation,result\r\nt,\'=SUM(A1),-5\r\nt,"a, b",1\r\n');
  assert.equal(PC.toCsv([]), 'time,calculation,result\r\n');
});

const OD = require('../ora/data.js');
const OL = require('../ora/logic.js');
test('ora: catalog is well formed', () => {
  assert.equal(OD.length, 251);
  assert.equal(OD.filter(r => r[1] === 1).length, 44);
  assert.equal(new Set(OD.map(r => r[0])).size, OD.length);
  for (const r of OD) { assert.match(r[0], /^(ORA|PLS)-\d{5}$/); assert.ok(r[2] && r[3] && r[4]); }
});
test('ora: code parsing and search', () => {
  assert.deepEqual(OL.codeOf('ora 1'), { prefix: 'ORA', num: '00001' });
  assert.deepEqual(OL.codeOf('942'), { prefix: null, num: '00942' });
  assert.equal(OL.codeOf('deadlock'), null);
  assert.deepEqual(OL.codesIn('ORA-06512: at line 5 ORA-1403 ora-06512 PLS-201'), ['ORA-06512', 'ORA-01403', 'PLS-00201']);
  assert.equal(OL.search(OD, 'ORA-00942')[0].code, 'ORA-00942');
  assert.equal(OL.search(OD, 'pls-201')[0].code, 'PLS-00201');
  assert.equal(OL.search(OD, 'deadlock')[0].code, 'ORA-00060');
  assert.equal(OL.search(OD, 'unique constraint')[0].code, 'ORA-00001');
  assert.deepEqual(OL.search(OD, 'qqzzxx'), []);
  assert.ok(OL.search(OD, '').every(e => e.free));
  assert.equal(OL.search(OD, 'the', 5).length, 5);
  assert.match(OL.toMarkdown(OL.entry(OD[0])), /^\*\*ORA-00001: Unique constraint violated\*\*\n\nCause: .+\n\nFix: .+\n$/);
});

test('text v1.1: shuffle, sort by length (free); CSV ↔ JSON, HTML escape (Pro)', () => {
  let k = 0; const seq = [0.1, 0.9, 0.5];
  const sh = T.ops.shuffleLines('a\nb\nc\nd', () => seq[k++ % 3]);
  assert.deepEqual(sh.split('\n').sort(), ['a', 'b', 'c', 'd']);
  assert.equal(T.ops.sortLength('ccc\na\nbb\nd'), 'a\nd\nbb\nccc');
  assert.equal(T.pro.csvToJson('name,city\n"Pop, Ion",Chișinău\nAna,"Iași ""vechi"""\n'),
    JSON.stringify([{ name: 'Pop, Ion', city: 'Chișinău' }, { name: 'Ana', city: 'Iași "vechi"' }], null, 2));
  assert.equal(T.pro.csvToJson('a;b\n1;2'), JSON.stringify([{ a: '1', b: '2' }], null, 2));
  assert.equal(T.pro.jsonToCsv('[{"a":1,"b":"x,y"},{"a":2,"c":null}]'), 'a,b,c\n1,"x,y",\n2,,');
  assert.equal(T.pro.csvToJson(T.pro.jsonToCsv('[{"q":"say \\"hi\\"\\nnow"}]')), JSON.stringify([{ q: 'say "hi"\nnow' }], null, 2));
  assert.equal(T.pro.htmlEscape('<a href="x">Tom & \'Jerry\'</a>'), '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;');
});

const LN = require('../loan/logic.js');
test('loan: annuity, decreasing, zero rate, solving', () => {
  assert.equal(LN.payment(100000, 6, 360), 599.55);
  assert.equal(LN.payment(1200, 0, 12), 100);
  assert.ok(Number.isNaN(LN.payment(0, 5, 10)));
  assert.ok(Number.isNaN(LN.payment(1000, 5, 1201)));
  const a = LN.schedule({ principal: 100000, rate: 6, months: 360 });
  assert.equal(a.months, 360);
  assert.equal(a.totalInterest, 115838.45);
  assert.equal(a.totalPaid, 215838.45);
  assert.equal(a.rows[359].balance, 0);
  const d = LN.schedule({ principal: 12000, rate: 12, months: 12, type: 'linear' });
  assert.deepEqual([d.rows[0].payment, d.rows[11].payment, d.totalInterest], [1120, 1010, 780]);
  const odd = LN.schedule({ principal: 10000, rate: 7, months: 7, type: 'linear' });
  assert.equal(odd.rows[6].principal, 1428.58);
  assert.equal(LN.schedule({ principal: 100, rate: 5, months: 0 }), null);
  assert.equal(LN.termFor(100000, 6, 599.55), 360);
  assert.equal(LN.termFor(1000, 0, 300), 4);
  assert.ok(Number.isNaN(LN.termFor(100000, 6, 500)));
  assert.equal(LN.principalFor(599.55, 6, 360), 99999.91);
  assert.equal(LN.principalFor(100, 0, 12), 1200);
  assert.equal(LN.num('1 234,5'), 1234.5);
  assert.ok(Number.isNaN(LN.num('12abc')));
  const y = LN.yearly(LN.schedule({ principal: 1000, rate: 12, months: 24 }).rows);
  assert.equal(y.length, 2);
  assert.equal(y[1].balance, 0);
  assert.equal(LN.c2(y[0].principal + y[1].principal), 1000);
});
test('loan: Pro extras, rate change, compare, CSV', () => {
  const base = { principal: 100000, rate: 6, months: 360 };
  const e = LN.schedule(Object.assign({ recurring: { amount: 100, from: 1 }, extras: [{ month: 12, amount: 5000 }] }, base));
  assert.ok(e.months < 360 && e.totalInterest < 115838.45);
  assert.equal(e.rows[11].extra, 5100);
  assert.equal(e.rows[e.rows.length - 1].balance, 0);
  const big = LN.schedule(Object.assign({ extras: [{ month: 1, amount: 1e9 }] }, base));
  assert.equal(big.months, 1);
  assert.equal(big.totalPaid, LN.c2(100000 + 500));
  const r = LN.schedule(Object.assign({ rateChange: { month: 60, rate: 8 } }, base));
  assert.equal(r.months, 360);
  assert.equal(r.rows[59].payment, 599.55);
  assert.equal(r.rows[60].rate, 8);
  assert.ok(r.rows[60].payment > 700 && r.totalInterest > 115838.45);
  close(LN.effectiveRate(100000, 0, LN.schedule(base).rows), 6.1678, 1e-4);
  assert.ok(LN.effectiveRate(100000, 2000, LN.schedule(base).rows) > 6.3);
  const c = LN.compare([base, Object.assign({}, base, { rate: 5.8, fee: 3000 }), Object.assign({}, base, { months: 0 })]);
  assert.equal(c.best, 1);
  assert.equal(c.offers[1].totalCost, LN.c2(c.offers[1].totalInterest + 3000));
  assert.equal(c.offers[2], null);
  assert.equal(LN.toCsv(LN.schedule({ principal: 1000, rate: 12, months: 2 }).rows),
    'month,rate_pct,payment,interest,principal,extra,balance\r\n1,12,507.51,10.00,497.51,0.00,502.49\r\n2,12,507.51,5.02,502.49,0.00,0.00\r\n');
});
