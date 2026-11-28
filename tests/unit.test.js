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

const CL = require('../color/logic.js');
test('color: parse every input format and convert', () => {
  assert.equal(Object.keys(CL.NAMES).length, 148);
  const red = { r: 255, g: 0, b: 0 };
  for (const s of ['#f00', 'FF0000', 'red', 'rgb(255, 0, 0)', 'rgb(100% 0% 0%)', 'rgba(255,0,0,1)', '255 0 0', 'hsl(0, 100%, 50%)', 'hsl(360deg 100% 50% / 100%)', 'hwb(0 0% 0%)', 'cmyk(0%, 100%, 100%, 0%)', 'oklch(62.8% 0.2577 29.23)', 'lab(54.29 80.8 69.88)']) {
    assert.equal(CL.toHex(CL.parse(s)), '#ff0000', s);
  }
  for (const s of ['', 'nope', '#ff00', 'rgb(300, 0, 0)', 'rgba(255, 0, 0, 0.5)', 'hsl(0, 120%, 50%)', 'rgb(1, 2)']) assert.equal(CL.parse(s), null, s);
  assert.deepEqual(['hex', 'rgb', 'hsl', 'hwb', 'cmyk', 'oklch', 'lab'].map(k => CL.format(red, k)),
    ['#ff0000', 'rgb(255, 0, 0)', 'hsl(0, 100%, 50%)', 'hwb(0 0% 0%)', 'cmyk(0%, 100%, 100%, 0%)', 'oklch(62.8% 0.2577 29.23)', 'lab(54.29 80.8 69.88)']);
  const c = CL.parse('#3d5afe');
  assert.equal(CL.format(c, 'hwb'), 'hwb(231 24% 0%)');
  assert.equal(CL.format(CL.parse('#808080'), 'oklch'), 'oklch(59.99% 0 0)');
  assert.equal(CL.format(CL.parse('black'), 'cmyk'), 'cmyk(0%, 0%, 0%, 100%)');
  assert.equal(CL.toHex(CL.fromHwb({ h: 0, w: 70, b: 70 })), '#808080');
  for (const k of ['oklch', 'lab']) assert.equal(CL.toHex(CL.parse(CL.format(c, k))), '#3d5afe', k);
});
test('color: WCAG contrast', () => {
  assert.deepEqual(CL.contrast(CL.parse('#000'), CL.parse('#fff')), { ratio: 21, aaNormal: true, aaLarge: true, aaaNormal: true, aaaLarge: true });
  assert.deepEqual(CL.contrast(CL.parse('#777'), CL.parse('#fff')), { ratio: 4.47, aaNormal: false, aaLarge: true, aaaNormal: false, aaaLarge: false });
  assert.equal(CL.contrast(CL.parse('#fff'), CL.parse('#fff')).ratio, 1);
});
test('color: Pro names, palettes, colorblind simulation, export', () => {
  assert.deepEqual(CL.nearestName(CL.parse('#ff6347')), { name: 'tomato', hex: '#ff6347', dist: 0, exact: true, deltaE: 0 });
  const n = CL.nearestName(CL.parse('#3d5afe'));
  assert.equal(n.name, 'royalblue'); assert.equal(n.exact, false);
  const c = CL.parse('#3d5afe');
  assert.deepEqual(CL.palette(c, 'complementary'), ['#3d5afe', '#fee13d']);
  assert.deepEqual(CL.palette(c, 'triadic'), ['#3d5afe', '#fe3d5a', '#5afe3d']);
  assert.equal(CL.palette(c, 'analogous').length, 3);
  assert.equal(CL.palette(c, 'tetradic').length, 4);
  const t = CL.palette(c, 'tints'); assert.equal(t.length, 9); assert.equal(t[4], '#3d5afe');
  assert.deepEqual(CL.palette(c, 'x'), []);
  assert.equal(CL.toHex(CL.simulate(CL.parse('#ff0000'), 'protanopia')), '#6d5f00');
  assert.equal(CL.toHex(CL.simulate(CL.parse('#ff0000'), 'deuteranopia')), '#a39000');
  for (const k of CL.CVD) for (const g of ['#000000', '#ffffff']) assert.equal(CL.toHex(CL.simulate(CL.parse(g), k)), g);
  const pals = [{ name: 'Brand Ăă', colors: ['#3d5afe', '#ffffff'] }, { name: 'Brand Ăă', colors: ['#000000'] }, { name: '!!', colors: ['#111111'] }];
  assert.equal(CL.exportCss(pals), ':root {\n  --brand-aa-100: #3d5afe;\n  --brand-aa-200: #ffffff;\n  --brand-aa-2-100: #000000;\n  --palette-3-100: #111111;\n}\n');
  assert.deepEqual(JSON.parse(CL.exportJson(pals)), pals);
  assert.match(CL.exportTailwind(pals), /colors: \{\n {8}'brand-aa': \{\n {10}100: '#3d5afe',\n {10}200: '#ffffff'\n {8}\},/);
  assert.equal(CL.exportCss([]), ':root {\n}\n');
});

const JF = require('../json/logic.js');
test('json: validator gives exact line and column', () => {
  const at = s => { const r = JF.check(s); return r.ok ? 'ok' : `${r.code} ${r.line}:${r.col}`; };
  assert.equal(at('{"a": [1, 2], "b": {"c": null}}'), 'ok');
  assert.equal(at('{\n  "a": 1,\n}'), 'trailingComma 3:1');
  assert.equal(at('{"a" 1}'), 'expectedColon 1:6');
  assert.equal(at('[1 2]'), 'expectedComma 1:4');
  assert.equal(at("{'a': 1}"), 'expectedKey 1:2');
  assert.equal(at('{"a": 01}'), 'badNumber 1:7');
  assert.equal(at('"abc'), 'unterminated 1:5');
  assert.equal(at('["\\q"]'), 'badEscape 1:3');
  assert.equal(at('"a\tb"'), 'control 1:3');
  assert.equal(at('{"a":1}}'), 'extra 1:8');
  assert.equal(at('[1,\n 2,\n'), 'end 3:1');
  assert.equal(at('nul'), 'unexpected 1:1');
  assert.equal(at('\uFEFF{"x": true}'), 'ok');
  assert.equal(JF.check('[12345678901234567890, 9007199254740991]').bigNums, 1);
  assert.equal(JF.check('{"a":\n  tru}').lineText, '  tru}');
});
test('json: format, minify, sort keys, stats', () => {
  const src = '{"b":1,"a":{"d":[1,2],"c":"x"}}';
  assert.equal(JF.format(src, '2'), '{\n  "b": 1,\n  "a": {\n    "d": [\n      1,\n      2\n    ],\n    "c": "x"\n  }\n}');
  assert.equal(JF.format('[1]', '4'), '[\n    1\n]');
  assert.equal(JF.format('{"a":1}', 'tab'), '{\n\t"a": 1\n}');
  assert.equal(JF.minify(JF.format(src, 4)), src);
  assert.equal(JF.minify(src, true), '{"a":{"c":"x","d":[1,2]},"b":1}');
  assert.equal(JF.minify('{"b":1,"B":2,"a":3}', true), '{"B":2,"a":3,"b":1}');
  assert.deepEqual(JF.stats('{ "a": [1, {"b": "ș"}] }'), { objects: 2, arrays: 1, keys: 2, values: 2, depth: 3, bytes: 25, minBytes: 20 });
  assert.throws(() => JF.format('{', 2), /end at line 1, column 2/);
});
test('json: Pro query with wildcards, recursion, negative index and filters', () => {
  const s = JSON.stringify({ store: { books: [{ t: 'A', cat: 'fic', p: 8 }, { t: 'B', cat: 'ref', p: 12 }, { t: 'C', cat: 'fic', p: 5, isbn: '1' }], 'odd key': { v: 1 } } });
  const vals = q => JF.query(s, q).map(r => r.value);
  assert.deepEqual(vals('$.store.books[*].t'), ['A', 'B', 'C']);
  assert.deepEqual(vals('$..p'), [8, 12, 5]);
  assert.deepEqual(vals('store.books[-1].t'), ['C']);
  assert.deepEqual(vals("$['store']['odd key'].v"), [1]);
  assert.deepEqual(vals("$.store.books[?(@.cat=='fic')].t"), ['A', 'C']);
  assert.deepEqual(vals('$.store.books[?(@.cat!="fic")].t'), ['B']);
  assert.deepEqual(vals('$.store.books[?(@.p==12)].t'), ['B']);
  assert.deepEqual(vals('$.store.books[?(@.isbn)].t'), ['C']);
  assert.deepEqual(vals('$.store.books[9]'), []);
  assert.deepEqual(JF.query(s, '$.store.*').map(r => r.path), ['$.store.books', "$.store['odd key']"]);
  assert.throws(() => JF.query(s, '$.store[oops'), e => e.near === '[oops');
});
test('json: Pro diff of two documents', () => {
  const d = JF.diff({ a: 1, b: { c: [1, 2, 3] }, d: 'x', t: [1] }, { a: 2, b: { c: [1, 2] }, d: 'x', e: null, t: { 0: 1 } });
  assert.deepEqual(d.map(e => e.op + ' ' + e.path), ['changed $.a', 'removed $.b.c[2]', 'changed $.t', 'added $.e']);
  assert.equal(JF.diffText(d.slice(0, 2)), '~ $.a: 1 → 2\n- $.b.c[2]: 3');
  assert.deepEqual(JF.diff({ x: [1, { y: 'z' }] }, { x: [1, { y: 'z' }] }), []);
  assert.deepEqual(JF.diff(1, '1').map(e => e.op), ['changed']);
});
test('json: Pro YAML both ways', () => {
  const doc = { name: 'x', list: [1, 'two', { a: null, b: [true, false] }, [1, [2, 3]], [], {}], 'my key': 'a: b', n: -1.5e3, s: 'multi\nline', e: '', t: 'true', v: '1.2.3', nested: { deep: { x: '#hash' } } };
  const y = JF.toYAML(JSON.stringify(doc));
  assert.match(y, /^name: x\nlist:\n- 1\n- two\n- a: null\n  b:\n  - true\n/);
  assert.deepEqual(JSON.parse(JF.fromYAML(y)), doc);
  const cfg = JF.fromYAML('# config\nserver:\n  host: localhost   # comment\n  port: 8080\n  tags: [web, "api", 3]\n  opts: {a: 1, b: \'it\'\'s\'}\nitems:\n- name: a\n  qty: 2\n- name: b\n  more:\n    - x\nscript: |\n  line1\n  line2\nfolded: >-\n  a\n  b\nempty:\n');
  assert.deepEqual(JSON.parse(cfg), { server: { host: 'localhost', port: 8080, tags: ['web', 'api', 3], opts: { a: 1, b: "it's" } }, items: [{ name: 'a', qty: 2 }, { name: 'b', more: ['x'] }], script: 'line1\nline2\n', folded: 'a b', empty: null });
  assert.throws(() => JF.fromYAML('a: 1\n   b: 2'), e => e.line === 2);
  assert.throws(() => JF.fromYAML('a: &x 1'), e => /anchors/.test(e.why));
});
test('json: Pro CSV both ways and escaping', () => {
  assert.equal(JF.toCSV('[{"a":1,"b":{"c":"x,y"}},{"a":2,"d":[1,2]}]'), 'a,b.c,d\n1,"x,y",\n2,,1; 2');
  assert.equal(JF.toCSV('{"rows":[{"f":"=1+1"}]}'), "f\n'=1+1");
  assert.deepEqual(JSON.parse(JF.fromCSV('a;b.c\n1;"y;z"\n007;true')), [{ a: 1, b: { c: 'y;z' } }, { a: '007', b: { c: true } }]);
  assert.deepEqual(JSON.parse(JF.fromCSV('id\n12345678901234567890')), [{ id: '12345678901234567890' }]);
  assert.equal(JF.escapeString('say "hi"\n\tok'), '"say \\"hi\\"\\n\\tok"');
  assert.equal(JF.unescapeString('say \\"hi\\"\\n'), 'say "hi"\n');
  assert.equal(JF.unescapeString('"\\u0103"'), 'ă');
  assert.throws(() => JF.unescapeString('bad \\x'));
});

const RP = require('../pick/logic.js');
/* sursă falsă: întoarce valorile date, apoi o ia de la capăt */
const seqSrc = vals => { let i = 0; return () => vals[i++ % vals.length]; };
test('pick: unbiased randInt rejects the biased tail', () => {
  const MAX = 2 ** 32;
  for (const n of [2, 3, 6, 7, 10, 20, 100, 1000, 2 ** 31 + 1, 2 ** 32]) {
    const lim = RP.limit(n);
    assert.equal(lim % n, 0, 'limit must be a multiple of n: ' + n);
    assert.ok(lim <= MAX && MAX - lim < n);
  }
  // n=3: 2^32 % 3 = 1, so 2^32-1 is rejected and the next value is used
  let calls = 0; const s3 = seqSrc([MAX - 1, 5]);
  assert.equal(RP.randInt(3, () => { calls++; return s3(); }), 2);
  assert.equal(calls, 2);
  assert.equal(RP.randInt(3, seqSrc([MAX - 2])), (MAX - 2) % 3);
  // n=6: the last 4 values are rejected
  assert.equal(RP.randInt(6, seqSrc([MAX - 4, MAX - 1, 13])), 1);
  // classic worst case: n = 2^31 + 1 rejects almost half of all values
  assert.equal(RP.randInt(2 ** 31 + 1, seqSrc([2 ** 31 + 1, 2 ** 31])), 2 ** 31);
  assert.equal(RP.randInt(1, () => { throw new Error('no draw needed'); }), 0);
  assert.throws(() => RP.randInt(0, seqSrc([0])), RangeError);
  assert.throws(() => RP.randInt(1.5, seqSrc([0])), RangeError);
  // above 2^32: two draws build a 53-bit value
  assert.equal(RP.randInt(2 ** 40, seqSrc([1, 7])), 2 ** 32 + 7);
});
test('pick: randRange is inclusive and spreads evenly over a full cycle', () => {
  assert.equal(RP.randRange(5, 5, seqSrc([123])), 5);
  assert.equal(RP.randRange(10, 1, seqSrc([0])), 1);
  assert.equal(RP.randRange(-3, 3, seqSrc([6])), 3);
  assert.equal(RP.randRange(-3, 3, seqSrc([7])), -3);
  // every source value 0..59 once → each face of a d6 exactly 10 times
  const seen = {}; let k = 0;
  for (let i = 0; i < 60; i++) { const v = RP.randRange(1, 6, () => k++); seen[v] = (seen[v] || 0) + 1; }
  assert.deepEqual(seen, { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10 });
  assert.throws(() => RP.randRange(0, 2 ** 60), RangeError);
  // the real crypto source stays in range
  for (let i = 0; i < 2000; i++) { const v = RP.randRange(1, 20); assert.ok(v >= 1 && v <= 20 && Number.isInteger(v)); }
});
test('pick: parse, pick without repeats, weights, shuffle, coin, dice', () => {
  assert.deepEqual(RP.parseList(' Ana \n\nBob *3\r\nCe'), [{ name: 'Ana', w: 1, line: 0 }, { name: 'Bob *3', w: 1, line: 2 }, { name: 'Ce', w: 1, line: 3 }]);
  assert.deepEqual(RP.parseList('Ana\nBob *3\nCe ×0\n*2', true).map(x => [x.name, x.w]), [['Ana', 1], ['Bob', 3], ['Ce', 0], ['*2', 1]]);
  const four = RP.parseList('a\nb\nc\nd');
  const p = RP.pick(four, 10, true, RP.cryptoSource);
  assert.equal(p.length, 4); assert.equal(new Set(p).size, 4);
  assert.equal(RP.pick(four, 10, false, seqSrc([0])).length, 10);
  assert.deepEqual(RP.pick(four, 3, true, seqSrc([0])), [0, 1, 2]);
  // weights: total 1+3=4 → r=1..3 lands on Bob, r=0 on Ana; weight 0 never
  const w = RP.parseList('Ana\nBob *3\nCe *0', true);
  assert.deepEqual(RP.pick(w, 1, true, seqSrc([0])), [0]);
  assert.deepEqual(RP.pick(w, 1, true, seqSrc([1])), [1]);
  assert.deepEqual(RP.pick(w, 1, true, seqSrc([3])), [1]);
  assert.deepEqual(RP.pick(w, 5, true, seqSrc([3, 0])), [1, 0]);
  assert.deepEqual(RP.pick([], 1, true), []);
  const sh = RP.shuffle(['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(sh.slice().sort(), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(RP.shuffle(['a', 'b', 'c'], seqSrc([0])), ['b', 'c', 'a']);
  assert.equal(RP.coin(seqSrc([4])), 'heads'); assert.equal(RP.coin(seqSrc([5])), 'tails');
  assert.deepEqual(RP.dice(3, 6, seqSrc([0, 5, 11])), { rolls: [1, 6, 6], sum: 13 });
});
test('pick: Pro teams are balanced and keep everyone; CSV', () => {
  const people = Array.from({ length: 10 }, (_, i) => 'p' + i);
  for (const [k, bySize, sizes] of [[3, false, [4, 3, 3]], [2, false, [5, 5]], [4, true, [4, 3, 3]], [3, true, [3, 3, 2, 2]], [20, false, Array(10).fill(1)], [1, false, [10]], [0, false, [10]]]) {
    const t = RP.teams(people, k, bySize, RP.cryptoSource);
    assert.deepEqual(t.map(x => x.length), sizes, `k=${k} bySize=${bySize}`);
    assert.deepEqual(t.flat().sort(), people.slice().sort());
  }
  assert.deepEqual(RP.teams(['a', 'b', 'c', 'd'], 2, false, seqSrc([0])), [['b', 'd'], ['c', 'a']]);
  assert.deepEqual(RP.teams([], 3, false), []);
  assert.equal(RP.toCsv([{ time: 't', type: 'Pick', result: '=cmd' }, { time: 't', type: 'Teams', result: 'a, b' }]), 'time,type,result\r\nt,Pick,\'=cmd\r\nt,Teams,"a, b"\r\n');
  assert.equal(RP.toCsv([]), 'time,type,result\r\n');
});

const RX = require('../regex/logic.js');
test('regex: compile, flags, matches with numbered and named groups', () => {
  assert.equal(RX.cleanFlags('yggix'), 'giy');
  assert.match(RX.compile('(', 'g').error, /Invalid regular expression/);
  const re = RX.compile('(?<y>\\d{4})-(\\d{2})(x)?', 'gd').re;
  const r = RX.findMatches(re, 'a 2026-11 b 2027-01x');
  assert.equal(r.matches.length, 2);
  assert.deepEqual(r.matches[0], { i: 2, t: '2026-11', g: ['2026', '11', null], n: { y: '2026' }, gi: [[2, 6], [7, 9], null] });
  assert.equal(r.matches[1].g[2], 'x');
  assert.equal(RX.findMatches(RX.compile('\\d', '').re, 'a1b2').matches.length, 1, 'no g: first match only');
  assert.equal(RX.findMatches(RX.compile('', 'g').re, 'abc').matches.length, 4, 'empty matches advance');
  assert.equal(RX.findMatches(RX.compile('', 'gu').re, '😀a').matches.length, 3, 'u flag advances by code point');
  const big = RX.findMatches(RX.compile('a', 'g').re, 'a'.repeat(50), 10);
  assert.equal(big.matches.length, 10); assert.equal(big.truncated, true);
  assert.deepEqual(RX.groupNames('(a)(?<b>c)(?:d)(?=e)\\(x\\)[(]'), [null, 'b']);
});
test('regex: run with replace and test cases', () => {
  const r = RX.run({ pattern: '(?<y>\\d{4})-(\\d{2})', flags: 'g', text: '2026-11 și 2027-01', repl: '$2/$<y> [$&]' });
  assert.equal(r.replaced, '11/2026 [2026-11] și 01/2027 [2027-01]');
  assert.equal(RX.run({ pattern: 'a', flags: '', text: 'aa', repl: 'b' }).replaced, 'ba');
  assert.match(RX.run({ pattern: '[', flags: 'g', text: '' }).error, /Invalid/);
  const t = RX.runTests('\\d+', 'gy', ['123', 'a1'], ['abc'], false);
  assert.deepEqual([t.passed, t.total], [3, 3]);
  const w = RX.runTests('\\d+|x', 'g', ['123', 'a1'], ['x1'], true);
  assert.deepEqual(w.results.map(x => x.pass), [true, false, true]);
  assert.deepEqual(RX.lines('a\r\n\nb\n'), ['a', 'b']);
});
test('regex: explanation tokens', () => {
  const k = RX.explain('^(?<y>\\d{4})-ab+?[^a-z]\\.|\\1(?=x)$', 'm').map(x => x.k + ':' + x.t + ':' + x.d);
  assert.deepEqual(k, ['xStartM:^:0', 'xNamed:(?<y>:0', 'xDigit:\\d:1', 'xRepeat:{4}:1', 'xEndGroup:):0', 'xLit:-a:0', 'xLit:b:0', 'xRepeat:+?:0',
    'xNotClass:[^a-z]:0', 'xLit:\\.:0', 'xAlt:|:0', 'xRef:\\1:0', 'xLA:(?=:0', 'xLit:x:1', 'xEndGroup:):0', 'xEndM:$:0']);
  const q = RX.explain('a{2,5}b{3,}c{1}\\u{1F600}\\p{L}', 'u').filter(x => x.k === 'xRepeat' || x.k === 'xCode' || x.k === 'xProp').map(x => x.v);
  assert.deepEqual(q, [{ q: 'qRange', lazy: false, n: '2', m: '5' }, { q: 'qMin', lazy: false, n: '3' }, { q: 'qN', lazy: false, n: '1' }, { c: 'U+1F600' }, { p: 'L' }]);
  assert.equal(RX.explain('\\.\\.+', '').map(x => x.t).join(' '), '\\. \\. +');
  assert.equal(RX.explain('x{a}', '')[0].v.t, 'x{a}', 'invalid quantifier is literal');
});
test('regex: export and library', () => {
  const ms = RX.findMatches(RX.compile('(?<k>\\w+)=(\\d)?', 'g').re, 'a=1 =b= c,d=').matches;
  assert.equal(RX.toCsv(ms, RX.groupNames('(?<k>\\w+)=(\\d)?')), 'n,index,length,match,$1 k,$2\r\n1,0,3,a=1,a,1\r\n2,5,2,b=,b,\r\n3,10,2,d=,d,\r\n');
  assert.equal(RX.toCsv([{ i: 0, t: '=SUM(A1)', g: [] }]), 'n,index,length,match\r\n1,0,8,\'=SUM(A1)\r\n');
  assert.deepEqual(JSON.parse(RX.toJson(ms))[0], { n: 1, index: 0, length: 3, match: 'a=1', groups: ['a', '1'], named: { k: 'a' } });
  assert.ok(RX.LIB.length >= 30);
  assert.equal(new Set(RX.LIB.map(l => l.id)).size, RX.LIB.length);
  for (const l of RX.LIB) {
    const c = RX.compile(l.p, l.f);
    assert.ok(c.re, l.id + ': ' + c.error);
    assert.ok(RX.findMatches(c.re, l.sample).matches.length > 0, l.id + ' sample has no match');
    assert.ok(l.name.en && l.name.ro && l.name.ru);
  }
});

const HK = require('../hash/logic.js');
const hx = (alg, s) => HK.toHex(HK.hashBytes(alg, typeof s === 'string' ? HK.utf8(s) : s));
const rep = (b, n) => new Uint8Array(n).fill(b);
const MLN_A = HK.utf8('a'.repeat(1000000));
test('hash: MD5 test suite (RFC 1321)', () => {
  assert.equal(hx('md5', ''), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(hx('md5', 'a'), '0cc175b9c0f1b6a831c399e269772661');
  assert.equal(hx('md5', 'abc'), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(hx('md5', 'message digest'), 'f96b697d7cb7938d525a2f31aaf161d0');
  assert.equal(hx('md5', 'abcdefghijklmnopqrstuvwxyz'), 'c3fcd3d76192e4007dfb496cca67e13b');
  assert.equal(hx('md5', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'), 'd174ab98d277d9f5a5611c2c9f419d9f');
  assert.equal(hx('md5', '1234567890'.repeat(8)), '57edf4a22be3c955ac49da2e2107b67a');
});
test('hash: CRC32 check values (IEEE 802.3)', () => {
  assert.equal(hx('crc32', '123456789'), 'cbf43926');
  assert.equal(hx('crc32', ''), '00000000');
  assert.equal(hx('crc32', 'The quick brown fox jumps over the lazy dog'), '414fa339');
});
test('hash: SHA-1 and SHA-2 (FIPS 180 examples)', () => {
  const m448 = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
  const m896 = 'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu';
  assert.equal(hx('sha1', ''), 'da39a3ee5e6b4b0d3255bfef95601890afd80709');
  assert.equal(hx('sha1', 'abc'), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  assert.equal(hx('sha1', m448), '84983e441c3bd26ebaae4aa1f95129e5e54670f1');
  assert.equal(hx('sha1', MLN_A), '34aa973cd4c4daa4f61eeb2bdbad27316534016f');
  assert.equal(hx('sha256', ''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(hx('sha256', 'abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(hx('sha256', m448), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  assert.equal(hx('sha256', MLN_A), 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  assert.equal(hx('sha384', ''), '38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b');
  assert.equal(hx('sha384', 'abc'), 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7');
  assert.equal(hx('sha384', m896), '09330c33f71147e83d192fc782cd1b4753111b173b3b05d22fa08086e3b0f712fcc7c71a557e2db966c3e9fa91746039');
  assert.equal(hx('sha512', ''), 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
  assert.equal(hx('sha512', 'abc'), 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f');
  assert.equal(hx('sha512', m896), '8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018501d289e4900f7e4331b99dec4b5433ac7d329eeb6dd26545e96e55b874be909');
});
test('hash: chunked updates equal one-shot, Web Crypto path equals own code', async () => {
  const data = new Uint8Array(5000).map((_, i) => (i * 131 + 7) & 255);
  for (const alg of HK.ALGS) {
    const h = HK.createHasher(alg);
    for (let i = 0, k = 1; i < data.length; i += k, k = (k * 7) % 191 + 1) h.update(data.subarray(i, i + k));
    assert.equal(HK.toHex(h.digest()), hx(alg, data), alg);
    for (const n of [55, 56, 63, 64, 111, 112, 128]) assert.equal(HK.toHex(await HK.digest(alg, data.subarray(0, n))), hx(alg, data.subarray(0, n)), alg + ' ' + n);
  }
});
test('hash: HMAC test cases (RFC 4231)', async () => {
  const cases = [
    [rep(0x0b, 20), HK.utf8('Hi There'), 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
      'afd03944d84895626b0825f4ab46907f15f9dadbe4101ec682aa034c7cebc59cfaea9ea9076ede7f4af152e8b2fa9cb6',
      '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854'],
    [HK.utf8('Jefe'), HK.utf8('what do ya want for nothing?'), '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
      'af45d2e376484031617f78d2b58a6b1b9c7ef464f5a01b47e42ec3736322445e8e2240ca5e69e2c78b3239ecfab21649',
      '164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737'],
    [rep(0xaa, 20), rep(0xdd, 50), '773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe', null, null],
    [rep(0xaa, 131), HK.utf8('Test Using Larger Than Block-Size Key - Hash Key First'), '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54', null,
      '80b24263c7c1a3ebb71493c1dd7be8b49b46d1f41b4aeec1121b013783f8f3526b56d037e05f2598bd0fd2215d6a1e5295e64f73f63f0aec8b915a985d786598'],
    [rep(0xaa, 131), HK.utf8('This is a test using a larger than block-size key and a larger than block-size data. The key needs to be hashed before being used by the HMAC algorithm.'),
      '9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2', null, null]
  ];
  for (const [key, msg, ...exp] of cases) {
    ['sha256', 'sha384', 'sha512'].forEach((alg, i) => { if (exp[i]) assert.equal(HK.toHex(HK.hmacSync(alg, key, msg)), exp[i], alg); });
    assert.equal(HK.toHex(await HK.hmac('sha256', key, msg)), exp[0]);
  }
  assert.equal(HK.toHex(HK.hmacSync('sha256', rep(0x0c, 20), HK.utf8('Test With Truncation'))).slice(0, 32), 'a3b6167473100ee06e0c796c2955552b');
  assert.equal(HK.toHex(await HK.hmac('sha256', new Uint8Array(0), new Uint8Array(0))), 'b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad');
});
test('hash: formats, checksum lists, compare, batch and CSV', () => {
  const abc = HK.hashBytes('sha256', HK.utf8('abc'));
  assert.equal(HK.toBase64(abc), 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
  assert.equal(HK.toBase64(HK.utf8('ab')), 'YWI=');
  assert.equal(HK.format(HK.hashBytes('crc32', HK.utf8('123456789')), 'hex', true), 'CBF43926');
  assert.deepEqual(Array.from(HK.fromHex('0a ff')), [10, 255]);
  assert.equal(HK.fromHex('abc'), null);
  const sums = HK.parseSums('# list\n' + HK.toHex(abc) + '  dist/app.zip\n' + 'd41d8cd98f00b204e9800998ecf8427e *empty.bin\nSHA512 (x.iso) = ' + 'ab'.repeat(64) + '\nnot a hash line\n' + 'A'.repeat(39));
  assert.deepEqual(sums.map(e => [e.alg, e.name]), [['sha256', 'dist/app.zip'], ['md5', 'empty.bin'], ['sha512', 'x.iso']]);
  assert.equal(HK.entryFor(sums, 'app.zip').alg, 'sha256');
  assert.equal(HK.entryFor(sums, 'EMPTY.BIN').alg, 'md5');
  assert.equal(HK.entryFor(sums, 'other.txt'), null);
  assert.equal(HK.entryFor(HK.parseSums(HK.toHex(abc).toUpperCase()), 'any.file').hash, HK.toHex(abc));
  const res = {}; for (const a of HK.ALGS) res[a] = HK.hashBytes(a, HK.utf8('abc'));
  assert.deepEqual(HK.compare(' ' + HK.toHex(abc).toUpperCase() + ' ', res), { alg: 'sha256', match: true });
  assert.deepEqual(HK.compare('900150983cd24fb0d6963f7d28e17f72  abc.txt', res), { alg: 'md5', match: true });
  assert.deepEqual(HK.compare('900150983cd24fb0d6963f7d28e17f73', res), { alg: 'md5', match: false });
  assert.deepEqual(HK.compare('ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=', res), { alg: 'sha256', match: true });
  assert.equal(HK.compare('hello world', res), null);
  assert.equal(HK.compare('', res), null);
  assert.deepEqual(HK.batch('abc\r\n\n123456789', 'crc32', 'hex', false), [{ line: 'abc', hash: '352441c2' }, { line: '123456789', hash: 'cbf43926' }]);
  assert.equal(HK.toCsv(['text', 'hash'], [['=1+1', 'a"b'], ['x,y', 1]]), 'text,hash\r\n\'=1+1,"a""b"\r\n"x,y",1\r\n');
});

const H = require('../habit/logic.js');
/* rulează fn cu un fus orar dat (Node recitește process.env.TZ la fiecare schimbare) */
function inTz(tz, fn) {
  const old = process.env.TZ;
  process.env.TZ = tz;
  try { fn(); } finally { if (old === undefined) delete process.env.TZ; else process.env.TZ = old; }
}
const hab = (done, extra) => Object.assign({ id: 'a', name: 'A', created: '2026-01-01', done: Object.fromEntries(done.map(k => [k, 1])), notes: {} }, extra);

test('habit: day keys are local and DST-safe', () => {
  inTz('Europe/Bucharest', () => {
    assert.equal(new Date(2026, 2, 29, 12).getTimezoneOffset(), -180, 'TZ switch works');
    // DST începe 29 martie 2026 (03:00 → 04:00), se termină 25 octombrie 2026
    assert.equal(H.key(new Date(2026, 2, 29, 0, 30)), '2026-03-29');
    assert.equal(H.key(new Date(2026, 2, 29, 23, 59)), '2026-03-29');
    assert.equal(H.key(new Date(2026, 9, 25, 23, 30)), '2026-10-25');
    assert.equal(H.key(new Date(2026, 9, 26, 0, 5)), '2026-10-26');
    // ziua de 23 h și cea de 25 h sunt tot câte o zi
    assert.equal(H.addDays('2026-03-28', 1), '2026-03-29');
    assert.equal(H.addDays('2026-03-29', 1), '2026-03-30');
    assert.equal(H.addDays('2026-10-25', 1), '2026-10-26');
    assert.equal(H.diff('2026-03-01', '2026-04-01'), 31);
    assert.equal(H.diff('2026-10-01', '2026-11-01'), 31);
    // un timestamp de miezul nopții + 24 h ar cădea greșit; cheile nu
    const mid = new Date(2026, 9, 25).getTime();
    assert.equal(H.key(new Date(mid + 24 * 3600e3)), '2026-10-25', 'naive +24h stays on the 25-hour day');
  });
  inTz('America/New_York', () => {
    assert.equal(H.key(new Date(2026, 2, 8, 1, 59)), '2026-03-08');
    assert.equal(H.key(new Date(2026, 10, 1, 23, 0)), '2026-11-01');
    assert.equal(H.addDays('2026-11-01', 1), '2026-11-02');
  });
  inTz('America/Santiago', () => {
    // în Chile ora se schimbă la miezul nopții: 6 sept 2026 00:00 nu există
    assert.equal(H.key(new Date(2026, 8, 6)), '2026-09-06');
    assert.equal(H.key(new Date(2026, 8, 5, 23, 30)), '2026-09-05');
  });
  inTz('Pacific/Kiritimati', () => assert.equal(H.key(new Date(Date.UTC(2026, 0, 1, 10, 30))), '2026-01-02'));
  assert.equal(H.dow('1970-01-01'), 4);
  assert.equal(H.dow('2026-11-26'), 4);
  assert.equal(H.dow('1969-12-28'), 0);
  assert.equal(H.weekStart('2026-11-26'), '2026-11-23');
  assert.equal(H.weekStart('2026-11-29'), '2026-11-23');
  assert.equal(H.weekStart('2026-11-30'), '2026-11-30');
  assert.equal(H.monthDays(2028, 2), 29);
  assert.equal(H.monthDays(2026, 2), 28);
  assert.deepEqual(H.addMonths(2026, 12, 1), { y: 2027, m: 1 });
  assert.deepEqual(H.addMonths(2026, 1, -1), { y: 2025, m: 12 });
  const g = H.monthGrid(2026, 3);
  assert.equal(g[0].indexOf('2026-03-01'), 6, 'March 2026 starts on Sunday');
  assert.equal(g.flat().filter(Boolean).length, 31);
  assert.ok(g.every(w => w.length === 7));
  assert.ok(H.valid('2028-02-29') && !H.valid('2026-02-29') && !H.valid('2026-1-5') && !H.valid(null));
});

test('habit: daily streaks across DST, today not done does not break', () => {
  const days = []; for (let k = '2026-03-25'; k <= '2026-04-02'; k = H.addDays(k, 1)) days.push(k);
  const h = hab(days.concat(['2026-03-10', '2026-03-11']));
  assert.deepEqual(H.streaks(h, '2026-04-02'), { current: 9, best: 9, unit: 'd' });
  assert.deepEqual(H.streaks(h, '2026-04-03'), { current: 9, best: 9, unit: 'd' }, 'today still open');
  assert.deepEqual(H.streaks(h, '2026-04-04'), { current: 0, best: 9, unit: 'd' }, 'missed yesterday');
  const fall = hab(['2026-10-24', '2026-10-25', '2026-10-26']);
  assert.equal(H.streaks(fall, '2026-10-26').current, 3);
  assert.deepEqual(H.streaks(hab([]), '2026-04-04'), { current: 0, best: 0, unit: 'd' });
  assert.equal(H.start(hab(['2025-12-30']), '2026-02-01'), '2025-12-30', 'backfilled day before creation counts');
});

test('habit: weekday and N-per-week schedules (Pro)', () => {
  // Lu, Mi, Vi
  const mwf = hab(['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-11', '2026-11-13', '2026-11-16'], { sched: { t: 'days', d: [1, 3, 5] } });
  assert.ok(H.scheduled(mwf, '2026-11-16') && !H.scheduled(mwf, '2026-11-17'));
  assert.equal(H.streaks(mwf, '2026-11-17').current, 7, 'Tuesday is not scheduled');
  assert.equal(H.streaks(mwf, '2026-11-18').current, 7, 'Wednesday not yet done');
  assert.equal(H.streaks(mwf, '2026-11-19').current, 0, 'missed Wednesday');
  assert.equal(H.dueToday(mwf, '2026-11-17'), false);
  // de 3 ori pe săptămână, în săptămâni (luni–duminică)
  const t3 = hab(['2026-11-02', '2026-11-03', '2026-11-08', '2026-11-10', '2026-11-12', '2026-11-14', '2026-11-16'], { sched: { t: 'times', n: 3 } });
  assert.equal(H.weekCount(t3, '2026-11-12'), 3);
  assert.deepEqual(H.streaks(t3, '2026-11-17'), { current: 2, best: 2, unit: 'w' }, 'current week still open');
  assert.equal(H.streaks(t3, '2026-11-24').current, 0, 'last week had only 1');
  assert.equal(H.dueToday(t3, '2026-11-13'), false, 'goal already met this week');
  assert.equal(H.dueToday(t3, '2026-11-14'), true, 'done today still shows');
  assert.deepEqual(H.sched({ sched: { t: 'days', d: [] } }), { t: 'daily' });
  assert.deepEqual(H.sched({ sched: { t: 'times', n: 9 } }), { t: 'daily' });
  assert.deepEqual(H.sched({ sched: { t: 'days', d: [5, 1, 1, 9] } }), { t: 'days', d: [1, 5] });
});

test('habit: today summary, heat levels, month stats, best weekday', () => {
  const a = hab(['2026-11-26'], { id: 'a', name: 'Read' }), b = hab([], { id: 'b', name: 'Walk' }), c = hab([], { id: 'c', name: 'Gym', sched: { t: 'days', d: [1] } });
  assert.deepEqual(H.summary([a, b, c], '2026-11-26'), { due: 2, done: 1, left: ['Walk'] });
  assert.deepEqual(H.summary([], '2026-11-26'), { due: 0, done: 0, left: [] });
  assert.equal(H.dayRate([a, b, c], '2026-11-26', '2026-11-26'), 0.5);
  assert.equal(H.dayRate([a, b], '2026-11-27', '2026-11-26'), null, 'future');
  assert.equal(H.dayRate([hab([], { created: '2026-11-20' })], '2026-11-10', '2026-11-26'), null, 'before start');
  assert.deepEqual([null, 0, 0.2, 0.5, 0.9, 1].map(H.level), [0, 0, 1, 2, 3, 4]);
  // noiembrie 2026 până pe 26: 26 de zile, 13 bifate
  const done = []; for (let i = 1; i <= 26; i += 2) done.push('2026-11-' + String(i).padStart(2, '0'));
  assert.deepEqual(H.monthStats(hab(done), 2026, 11, '2026-11-26'), { done: 13, due: 26, pct: 50 });
  assert.deepEqual(H.monthStats(hab(done), 2026, 12, '2026-11-26'), { done: 0, due: 0, pct: null });
  assert.deepEqual(H.monthStats(hab(['2026-11-02', '2026-11-03'], { sched: { t: 'days', d: [1] } }), 2026, 11, '2026-11-26'), { done: 1, due: 4, pct: 25 });
  assert.deepEqual(H.monthStats(hab(done.slice(0, 6), { sched: { t: 'times', n: 2 } }), 2026, 11, '2026-11-14'), { done: 6, due: 4, pct: 100 });
  // doar luni bifate
  const mon = hab(['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23'], { created: '2026-11-01' });
  const w = H.weekdayRates([mon], '2026-11-01', '2026-11-26');
  assert.equal(w.best, 1); assert.equal(w.rates[1], 1); assert.equal(w.rates[2], 0);
  assert.equal(H.weekdayRates([hab([])], '2026-11-01', '2026-11-26').best, null);
});

test('habit: free limit, backup JSON round trip, CSV', () => {
  assert.ok(H.canAdd([1, 2], false)); assert.ok(!H.canAdd([1, 2, 3], false)); assert.ok(H.canAdd([1, 2, 3, 4], true));
  const data = { habits: [
    { id: 'x', name: ' Read ', sched: { t: 'days', d: [1, 3] }, color: '#AA0011', emoji: '📚📚📚', created: '2026-11-01', done: { '2026-11-02': 1, '2026-11-31': 1, bad: 1 }, notes: { '2026-11-02': ' 20 pages, "great" ' } },
    { id: 'x', name: 'Walk, outside', done: { '2026-11-01': 1 } },
    { name: '' }, null
  ] };
  const n = H.normalize(data);
  assert.equal(n.habits.length, 2);
  assert.notEqual(n.habits[1].id, 'x', 'duplicate id replaced');
  assert.deepEqual(n.habits[0], { id: 'x', name: 'Read', sched: { t: 'days', d: [1, 3] }, color: '#aa0011', emoji: '📚📚', created: '2026-11-01', done: { '2026-11-02': 1 }, notes: { '2026-11-02': '20 pages, "great"' } });
  const back = H.importJson(H.exportJson(n, '2026-11-26'));
  assert.deepEqual(back, n);
  assert.throws(() => H.importJson('not json'), /format/);
  assert.throws(() => H.importJson('{"foo":1}'), /format/);
  assert.equal(H.toCsv(n.habits), 'date,habit,done,note\r\n2026-11-01,"Walk, outside",1,\r\n2026-11-02,Read,1,"20 pages, ""great"""\r\n');
  const h = hab([]); assert.equal(H.toggle(h, '2026-11-26'), true); assert.equal(H.toggle(h, '2026-11-26'), false); assert.deepEqual(h.done, {});
});
const SQ = require('../sql/logic.js');
const sqlToks = s => SQ.tokenize(s).filter(t => !/comment/.test(t.type)).map(t => (t.type === 'word' ? t.text.toUpperCase() : t.text));
test('sql: tokenizer handles Oracle literals, comments, binds and slash lines', () => {
  const k = s => SQ.tokenize(s).map(t => t.type + ':' + t.text);
  assert.deepEqual(k("q'[it's; -- ok]' nq'{x}' N'n' 'a''b' \"Col \"\"x\" :b1 :=1"),
    ["string:q'[it's; -- ok]'", "string:nq'{x}'", "string:N'n'", "string:'a''b'", 'quoted:"Col "', 'quoted:"x"', 'bind::b1', 'symbol::=', 'number:1']);
  assert.deepEqual(k("q'<a>b'>' q'!x!'"), ["string:q'<a>b'>'", "string:q'!x!'"].slice(0, 1).concat(k("q'!x!'")));
  assert.deepEqual(k('-- a /* b\n/* c -- d */x'), ['lcomment:-- a /* b', 'bcomment:/* c -- d */', 'word:x']);
  assert.deepEqual(k('1..10 .5 1e-3 2.5f v%TYPE emp@dblink a<>b'), ['number:1', 'symbol:..', 'number:10', 'number:.5', 'number:1e-3', 'number:2.5f',
    'word:v', 'symbol:%', 'word:TYPE', 'word:emp', 'symbol:@', 'word:dblink', 'word:a', 'symbol:<>', 'word:b']);
  assert.deepEqual(k('a / b\n  /  \n&&sub x$#'), ['word:a', 'symbol:/', 'word:b', 'slash:/', 'bind:&&sub', 'word:x$#']);
  assert.deepEqual(k("'unterminated -- x"), ["string:'unterminated -- x"]);
  assert.deepEqual(k('Über_tabel ţară'), ['word:Über_tabel', 'word:ţară']);
});
test('sql: splits scripts on ; and /, keeps PL/SQL blocks whole', () => {
  const kinds = s => SQ.statements(s).map(x => x.kind + ':' + x.text);
  assert.deepEqual(kinds("select 'a;b' from dual; select 2 from dual\n/\nselect 3 from dual"),
    ["sql:select 'a;b' from dual;", 'sql:select 2 from dual\n/', 'sql:select 3 from dual']);
  const blk = 'begin\n  if x then y; end if;\n  for r in (select 1 from dual) loop null; end loop;\nend;';
  assert.deepEqual(kinds(blk + '\nselect 1 from dual;'), ['plsql:' + blk, 'sql:select 1 from dual;']);
  const pkg = 'create or replace package body p as\n procedure a is begin null; end;\nbegin init; end p;';
  assert.deepEqual(kinds(pkg + '\n/\ncommit;'), ['plsql:' + pkg + '\n/', 'sql:commit;']);
  assert.deepEqual(kinds('create type t as object (a number);\n/\ncreate or replace type body t as member function f return number is begin return 1; end; end;\n/'),
    ['sql:create type t as object (a number);\n/', 'plsql:create or replace type body t as member function f return number is begin return 1; end; end;\n/']);
  assert.deepEqual(kinds("SET SERVEROUTPUT ON\nPROMPT it's running\n@setup.sql\nset transaction read only;\nexec p;"),
    ['cmd:SET SERVEROUTPUT ON', "cmd:PROMPT it's running", 'cmd:@setup.sql', 'sql:set transaction read only;', 'cmd:exec p;']);
  assert.deepEqual(kinds('create trigger t before insert on x for each row begin :new.a := 1; end;\ndeclare v number; begin v := case when 1=1 then 1 end; end;'),
    ['plsql:create trigger t before insert on x for each row begin :new.a := 1; end;', 'plsql:declare v number; begin v := case when 1=1 then 1 end; end;']);
  assert.deepEqual(SQ.statements('-- just a note\n'), []);
  assert.deepEqual(SQ.statements(''), []);
});
test('sql: formats SELECT with joins, CASE, BETWEEN, subquery and comments', () => {
  const src = "select /*+ first_rows */ e.id, e.name, -- who\ncase when e.sal > 10 then 'hi' else 'lo' end band from emp e join dept d on d.id = e.dept_id and d.on_line = 'Y' " +
    "where e.sal between 1 and 2 and e.dept_id in (select id from dept where loc = 'a;b') and e.x=-1 order by 1 desc;";
  assert.equal(SQ.format(src), [
    'SELECT /*+ first_rows */',
    '  e.id,',
    '  e.name, -- who',
    '  CASE',
    "    WHEN e.sal > 10 THEN 'hi'",
    "    ELSE 'lo'",
    '  END band',
    'FROM',
    '  emp e',
    '  JOIN dept d ON d.id = e.dept_id',
    "    AND d.on_line = 'Y'",
    'WHERE',
    '  e.sal BETWEEN 1 AND 2',
    '  AND e.dept_id IN (',
    '    SELECT',
    '      id',
    '    FROM',
    '      dept',
    '    WHERE',
    "      loc = 'a;b'",
    '  )',
    '  AND e.x = -1',
    'ORDER BY',
    '  1 DESC;'].join('\n'));
});
test('sql: keyword case, comma style, indent and minify', () => {
  const src = 'SELECT a, Count(*) AS n FROM T WHERE x = 1 GROUP BY a';
  assert.equal(SQ.format(src, { keywordCase: 'lower', commaStyle: 'leading', indent: 4 }),
    'select\n    a\n    , count(*) as n\nfrom\n    T\nwhere\n    x = 1\ngroup by\n    a');
  assert.equal(SQ.format('select A from B', { keywordCase: 'keep' }), 'select\n  A\nfrom\n  B');
  assert.equal(SQ.format("select a -- c1\n, b from t where s = '--x' /* k */;", { minify: true }), "SELECT a /* c1 */, b FROM t WHERE s = '--x' /* k */;");
  assert.equal(SQ.format('select 1 from dual;\nbegin null; end;\n/', { minify: true }), 'SELECT 1 FROM dual;\nBEGIN NULL; END;\n/');
  assert.equal(SQ.format('-- c */ x\nselect 1 from dual', { minify: true }), '/* c * / x */ SELECT 1 FROM dual');
  assert.equal(SQ.format("select x||'y', a.b(+), t.*, -5, 3-2, sysdate - 1, f(-x) from dual", { minify: true }),
    "SELECT x || 'y', a.b(+), t.*, -5, 3 - 2, SYSDATE - 1, f(-x) FROM dual");
  assert.equal(SQ.format("select name, t.date, cast(x as number(5,2)) from t", { minify: true }), 'SELECT name, t.date, CAST(x AS NUMBER(5, 2)) FROM t');
});
test('sql: INSERT, UPDATE, DELETE, MERGE, WITH and set operators', () => {
  assert.equal(SQ.format("insert into t (a, b) values (1, q'[x;y]');"), "INSERT INTO t (a, b)\nVALUES (1, q'[x;y]');");
  assert.equal(SQ.format('update t set a = 1, b = b * 2 where id = :id returning a into :ra;'),
    'UPDATE t\nSET\n  a = 1,\n  b = b * 2\nWHERE\n  id = :id\nRETURNING a INTO :ra;');
  assert.equal(SQ.format('delete from t where a = 1 or b is null'), 'DELETE FROM t\nWHERE\n  a = 1\n  OR b IS NULL');
  assert.equal(SQ.format('merge into t using s on (t.id = s.id) when matched then update set t.a = s.a when not matched then insert (id) values (s.id)'),
    'MERGE INTO t\nUSING s\nON (t.id = s.id)\nWHEN MATCHED THEN\n  UPDATE SET\n    t.a = s.a\nWHEN NOT MATCHED THEN\n  INSERT (id)\n  VALUES (s.id)');
  assert.equal(SQ.format('with a as (select 1 x from dual) select x from a union all select 2 from dual minus select 3 from dual'),
    'WITH\n  a AS (\n    SELECT\n      1 x\n    FROM\n      dual\n  )\nSELECT\n  x\nFROM\n  a\nUNION ALL\nSELECT\n  2\nFROM\n  dual\nMINUS\nSELECT\n  3\nFROM\n  dual');
  assert.equal(SQ.format('select rank() over (partition by a order by b) r from t order by r fetch first 5 rows only'),
    'SELECT\n  RANK() OVER (PARTITION BY a ORDER BY b) r\nFROM\n  t\nORDER BY\n  r\nFETCH FIRST 5 ROWS ONLY');
  assert.equal(SQ.format('select id from t start with p is null connect by prior id = p'), 'SELECT\n  id\nFROM\n  t\nSTART WITH\n  p IS NULL\nCONNECT BY\n  PRIOR id = p');
  assert.equal(SQ.format('create table t (id number(10) primary key, n varchar2(30))'), 'CREATE TABLE t (\n  id NUMBER(10) PRIMARY KEY,\n  n VARCHAR2(30)\n)');
  assert.equal(SQ.format('grant select, update on t to u;'), 'GRANT SELECT, UPDATE ON t TO u;');
  assert.equal(SQ.format('create view v as select a from t'), 'CREATE VIEW v AS\nSELECT\n  a\nFROM\n  t');
  assert.equal(SQ.format('select 1 from dual;select 2 from dual;'), 'SELECT\n  1\nFROM\n  dual;\n\nSELECT\n  2\nFROM\n  dual;');
});
test('sql: Pro identifier case and aligned AS aliases', () => {
  assert.equal(SQ.format('select e.Id as a, e.long_name as b, nvl(x, 0) as c from Emp e', { identCase: 'upper', keywordCase: 'lower', alignAs: true }),
    'select\n  E.ID        as A,\n  E.LONG_NAME as B,\n  nvl(X, 0)   as C\nfrom\n  EMP E');
  assert.equal(SQ.format('select a as x from t', { alignAs: true }), 'SELECT\n  a AS x\nFROM\n  t');
  assert.equal(SQ.format('select "Mixed" as "M", Abc from t', { identCase: 'lower' }), 'SELECT\n  "Mixed" AS "M",\n  abc\nFROM\n  t');
  assert.equal(SQ.format('select t.type, p(x => 1), v%rowtype from t', { identCase: 'upper', keywordCase: 'lower', minify: true }), 'select T.TYPE, P(X => 1), V%rowtype from T');
});
test('sql: Pro PL/SQL procedure with IF, loops, CASE and exceptions', () => {
  const src = `create or replace procedure p(a in number, b out varchar2, c in date default sysdate) is
v number := 0; cursor cr is select id from t;
begin
if a > 0 then for r in cr loop v := v + 1; end loop; elsif a < 0 then null; else
case a when 1 then b := 'x'; else b := 'y'; end case; end if;
select count(*) into v from t where id = a;
exception when no_data_found then null; when others then raise; end p;
/`;
  assert.equal(SQ.format(src), `CREATE OR REPLACE PROCEDURE p (
  a IN NUMBER,
  b OUT VARCHAR2,
  c IN DATE DEFAULT SYSDATE
) IS
  v NUMBER := 0;
  CURSOR cr IS
    SELECT
      id
    FROM
      t;
BEGIN
  IF a > 0 THEN
    FOR r IN cr LOOP
      v := v + 1;
    END LOOP;
  ELSIF a < 0 THEN
    NULL;
  ELSE
    CASE a
      WHEN 1 THEN
        b := 'x';
      ELSE
        b := 'y';
    END CASE;
  END IF;
  SELECT
    COUNT(*)
  INTO v
  FROM
    t
  WHERE
    id = a;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    NULL;
  WHEN OTHERS THEN
    RAISE;
END p;
/`);
});
test('sql: Pro PL/SQL packages, triggers, nested blocks, labels; free keeps layout', () => {
  assert.equal(SQ.format('create package k as function f return number; procedure p; end k;\n/\ncreate or replace package body k as\nfunction f return number is begin return 1; end;\n\nprocedure p is begin null; end;\nend k;\n/'),
    'CREATE PACKAGE k AS\n  FUNCTION f RETURN NUMBER;\n  PROCEDURE p;\nEND k;\n/\n\nCREATE OR REPLACE PACKAGE BODY k AS\n  FUNCTION f RETURN NUMBER IS\n  BEGIN\n    RETURN 1;\n  END;\n\n  PROCEDURE p IS\n  BEGIN\n    NULL;\n  END;\nEND k;\n/');
  assert.equal(SQ.format('create or replace trigger t before update on x for each row when (new.a > 0) declare v number; begin :new.b := v; end;'),
    'CREATE OR REPLACE TRIGGER t\n  BEFORE UPDATE ON x\n  FOR EACH ROW\n  WHEN (new.a > 0)\nDECLARE\n  v NUMBER;\nBEGIN\n  :new.b := v;\nEND;');
  assert.equal(SQ.format('begin <<outer_loop>> loop exit when x > 1; begin null; exception when others then null; end; end loop outer_loop; forall i in 1..n delete from t where id = ids(i); end;'),
    'BEGIN\n  <<outer_loop>>\n  LOOP\n    EXIT WHEN x > 1;\n    BEGIN\n      NULL;\n    EXCEPTION\n      WHEN OTHERS THEN\n        NULL;\n    END;\n  END LOOP outer_loop;\n  FORALL i IN 1..n\n    DELETE FROM t\n    WHERE\n      id = ids(i);\nEND;');
  const blk = 'begin\n      if x then   y;\nend if; -- note\nend;';
  assert.equal(SQ.format(blk + '\nselect 1 from dual', { plsql: false }), 'BEGIN\n      IF x THEN   y;\nEND IF; -- note\nEND;\n\nSELECT\n  1\nFROM\n  dual');
  assert.equal(SQ.format('begin x := 1; -- a\n-- b\n\n  y := 2; end;'), 'BEGIN\n  x := 1; -- a\n  -- b\n\n  y := 2;\nEND;');
});
test('sql: formatting is stable and never changes tokens', () => {
  const samples = [
    "select a, b -- x\n , c from t where q'[;]' = 'x' and y in (1,2) order by 1",
    'with x as (select * from (select 1 a from dual) where a in (select 1 from dual)) select * from x',
    'begin for r in (select * from t) loop if r.a = 1 then p(r.a => 1); elsif r.b then null; end if; end loop; end;',
    'create or replace package body k as procedure p(a number, b number, c number) is begin update t set a = 1; end; begin null; end;',
    "select /* a */ 1 /* b */ from dual -- end\n",
    'select case when a then case when b then 1 end else 2 end from t; select nvl(case when a then 1 end, 0) from t',
    'merge into t using (select * from s) s on (t.id = s.id) when matched then update set a = 1 delete where b = 2',
    'select * from a, b, c where a.id = b.id(+) and x between 1 and 2 having count(*) > 1',
    '', '   ', '-- just comment', ';', ')', 'end;', 'select (', 'begin if x then'];
  for (const s of samples) for (const o of [{}, { commaStyle: 'leading', alignAs: true, keywordCase: 'lower', identCase: 'upper' }, { minify: true }, { plsql: false }]) {
    const a = SQ.format(s, o);
    assert.equal(SQ.format(a, o), a, 'not stable: ' + s + ' ' + JSON.stringify(o));
    assert.deepEqual(sqlToks(a), sqlToks(s), 'tokens changed: ' + s);
    assert.equal(SQ.highlight(s).map(x => x[1]).join(''), s);
  }
});
test('sql: highlighting classes', () => {
  const h = SQ.highlight("select nvl(a, 'x') from t -- c\nwhere b = :v and n = 1").filter(x => x[0]);
  assert.deepEqual(h, [['k', 'select'], ['f', 'nvl'], ['s', "'x'"], ['k', 'from'], ['c', '-- c'], ['k', 'where'], ['b', ':v'], ['k', 'and'], ['n', '1']]);
  assert.deepEqual(SQ.highlight("PROMPT it's\nselect 1 from dual").slice(0, 1), [['m', "PROMPT it's"]]);
});
test('sql: Pro code strings with bind hints', () => {
  const sql = 'SELECT\n  "Name", \'a\\b\'\nFROM t\nWHERE id = :id AND d = :dept_no OR id = :id;';
  assert.equal(SQ.toCode(sql, 'java'), 'String sql = "SELECT\\n"\n    + "  \\"Name\\", \'a\\\\b\'\\n"\n    + "FROM t\\n"\n    + "WHERE id = ? AND d = ? OR id = ?";\n' +
    '// PreparedStatement ps = conn.prepareStatement(sql);\n// ps.setObject(1, id); // :id\n// ps.setObject(2, deptNo); // :dept_no\n// ps.setObject(3, id); // :id');
  assert.equal(SQ.toCode(sql, 'csharp'), 'string sql = @"SELECT\n  ""Name"", \'a\\b\'\nFROM t\nWHERE id = :id AND d = :dept_no OR id = :id";\n// cmd.BindByName = true;\n// cmd.Parameters.Add("id", id);\n// cmd.Parameters.Add("dept_no", deptNo);');
  assert.equal(SQ.toCode(sql, 'python'), 'sql = """SELECT\n  "Name", \'a\\\\b\'\nFROM t\nWHERE id = :id AND d = :dept_no OR id = :id\n"""\n# cursor.execute(sql, {"id": id, "dept_no": dept_no})');
  assert.equal(SQ.toCode(sql, 'plsql'), 'l_sql VARCHAR2(32767) := q\'[SELECT\n  "Name", \'a\\b\'\nFROM t\nWHERE id = :id AND d = :dept_no OR id = :id]\';\n-- EXECUTE IMMEDIATE l_sql USING l_id, l_dept_no, l_id;');
  assert.equal(SQ.toCode("select q'[x]' from t where a = :1 and b = :2", 'plsql'), "l_sql VARCHAR2(32767) := q'{select q'[x]' from t where a = :1 and b = :2}';\n-- EXECUTE IMMEDIATE l_sql USING l_p1, l_p2;");
  assert.equal(SQ.toCode('select :1 from dual', 'python'), 'sql = """select :1 from dual\n"""\n# cursor.execute(sql, [p1])');
  assert.equal(SQ.toCode("begin p(:a, ':not_bind'); x := :a; end;\n/\nselect 1 from dual;\nSET ECHO ON", 'plsql'),
    "l_sql VARCHAR2(32767) := q'[begin p(:a, ':not_bind'); x := :a; end;]';\n-- EXECUTE IMMEDIATE l_sql USING l_a;\n\nl_sql2 VARCHAR2(32767) := q'[select 1 from dual]';\n-- EXECUTE IMMEDIATE l_sql2;");
  assert.equal(SQ.toCode('select 1 from dual', 'java'), 'String sql = "select 1 from dual";');
  assert.equal(SQ.toCode('', 'java'), '');
});
test('converter v1.2: number bases, new units (free); pace and data rate (Pro)', () => {
  assert.equal(U.convertBase('255', 'dec', 'hex'), 'FF');
  assert.equal(U.convertBase('0xff', 'hex', 'bin'), '11111111');
  assert.equal(U.convertBase('1111 0000', 'bin', 'oct'), '360');
  assert.equal(U.convertBase('-42', 'dec', 'bin'), '-101010');
  assert.equal(U.convertBase('-0', 'dec', 'hex'), '0');
  assert.equal(U.convertBase('18446744073709551615', 'dec', 'hex'), 'FFFFFFFFFFFFFFFF');
  assert.equal(U.convertBase('12a', 'dec', 'hex'), null);
  assert.equal(U.convertBase('102', 'bin', 'dec'), null);
  assert.equal(U.convertBase('', 'dec', 'hex'), null);
  assert.throws(() => U.convertBase('1', 'dec', 'b36'));
  assert.ok(U.categories(false).includes('bases'));
  close(U.convert('length', 'um', 'mm', 1500), 1.5);
  close(U.convert('mass', 'ct', 'g', 5), 1);
  close(U.convert('volume', 'qtUS', 'ptUS', 1), 2);
  close(U.convert('volume', 'ptUS', 'cup', 1), 2);
  close(U.convert('pace', 'minkm', 'kmh', 5), 12);
  close(U.convert('pace', 'kmh', 'minmi', 12), 8.04672);
  close(U.convert('pace', 'mph', 'minmi', 6), 10);
  assert.equal(U.convert('pace', 'kmh', 'minkm', 0), Infinity);
  assert.equal(U.parseMinSec('5:30'), 5.5);
  assert.equal(U.parseMinSec('4,25'), 4.25);
  assert.equal(U.formatMinSec(5.5), '5:30');
  assert.equal(U.formatMinSec(8.04672), '8:03');
  assert.equal(U.formatMinSec(75), '1:15:00');
  assert.equal(U.formatMinSec(Infinity), '∞');
  close(U.convert('datarate', 'Mbps', 'MBps', 100), 12.5);
  close(U.convert('datarate', 'Gbps', 'MiBps', 1), 119.20928955078125);
  assert.equal(U.categories(false).includes('pace'), false);
  assert.equal(U.categories(false).includes('datarate'), false);
});

test('focus v1.2: tasks (free), noise generator and tasks CSV (Pro)', () => {
  let t = F.addTask([], '  Write   report ', 'a');
  t = F.addTask(t, '', 'x');
  t = F.addTask(t, 'Read, "notes"', 'b');
  assert.deepEqual(t.map(x => x.text), ['Write report', 'Read, "notes"']);
  assert.equal(F.addTask([], 'x'.repeat(500), 'c')[0].text.length, F.TASK_LEN);
  let many = [];
  for (let i = 0; i < 60; i++) many = F.addTask(many, 't' + i, i);
  assert.equal(many.length, F.TASK_MAX);
  t = F.creditTask(F.creditTask(t, 'a'), 'a');
  assert.equal(t[0].pomos, 2);
  t = F.toggleTask(t, 'b');
  assert.equal(t[1].done, true);
  assert.equal(F.tasksCSV(t, 25), 'task,done,sessions,minutes\nWrite report,no,2,50\n"Read, ""notes""",yes,0,0\n');
  assert.equal(F.tasksCSV(F.addTask([], '=1+1', 'z')), "task,done,sessions,minutes\n'=1+1,no,0,0\n");
  assert.deepEqual(F.clearDone(t).map(x => x.id), ['a']);
  assert.deepEqual(F.removeTask(t, 'a').map(x => x.id), ['b']);
  assert.deepEqual(F.sanitizeTasks([{ id: 1, text: 'ok', pomos: '3' }, null, { text: 5 }]), [{ id: '1', text: 'ok', done: false, pomos: 3 }]);
  assert.deepEqual(F.sanitizeTasks('nope'), []);
  let seed = 1;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const roughness = a => { let d = 0; for (let i = 1; i < a.length; i++) d += Math.abs(a[i] - a[i - 1]); return d / a.length; };
  const r = {};
  for (const k of F.NOISES) {
    const a = F.fillNoise(k, new Float32Array(20000), rand);
    assert.ok(a.every(v => v >= -1 && v <= 1), k);
    assert.ok(Math.abs(a[a.length - 1] - a[0]) < 1e-6, k + ' loops without a jump');
    r[k] = roughness(a);
  }
  assert.ok(r.white > r.pink && r.pink > r.brown, JSON.stringify(r));
});

test('pass v1.2: excluded characters, start with a letter (free); allowed symbols (Pro)', () => {
  const o = { length: 14, lower: true, upper: true, digits: true, symbols: true, exclude: 'aA1!', startLetter: true };
  for (let i = 0; i < 300; i++) {
    const p = P.generate(o);
    assert.equal(p.length, 14);
    assert.match(p, /^[a-zA-Z]/);
    assert.doesNotMatch(p, /[aA1!]/);
    assert.match(p, /[0-9]/); assert.match(p, /[^a-zA-Z0-9]/);
  }
  assert.equal(P.poolSize(o), P.poolSize({ lower: true, upper: true, digits: true, symbols: true }) - 4);
  assert.match(P.generate({ length: 6, digits: true, startLetter: true }), /^\d{6}$/, 'no letters chosen: ignored');
  assert.throws(() => P.generate({ length: 8, digits: true, exclude: '0123456789' }));
  assert.equal(P.cleanSymbols('!?ab 12!#é'), '!?#');
  for (let i = 0; i < 100; i++) assert.match(P.generate({ length: 10, lower: true, symbols: true, symbolSet: '#_' }), /^(?=.*[#_])[a-z#_]{10}$/);
  assert.equal(P.poolSize({ symbols: true, symbolSet: 'xyz' }), 0);
  assert.equal(P.genBits({ length: 16, lower: true, upper: true, digits: true, symbols: true }), P.bits(16, P.poolSize({ lower: true, upper: true, digits: true, symbols: true })));
  assert.equal(P.genBits({ length: 10, lower: true, digits: true, startLetter: true }), Math.round(9 * Math.log2(36) + Math.log2(26)));
  assert.match(P.passphrase({ words: 3, sep: '', capitalize: true, lang: 'en' }), /^([A-Z][a-z]+){3}$/);
});

test('days v1.2: age (free) and custom weekend days (Pro)', () => {
  const p = DC.parse;
  const a = DC.age(p('2000-02-29'), p('2026-11-26'));
  assert.deepEqual([a.years, a.months, a.days, a.totalDays, DC.fmt(a.next), a.toNext], [26, 8, 28, 9767, '2027-02-28', 94]);
  const b = DC.age(p('1990-11-26'), p('2026-11-26'));
  assert.deepEqual([b.years, b.months, b.days, b.toNext], [36, 0, 0, 0]);
  assert.equal(DC.age(p('2027-01-01'), p('2026-01-01')), null);
  assert.equal(DC.age(p('2024-02-29'), p('2028-02-29')).toNext, 0);
  /* 2026-11-29 is a Sunday; Mon..Sat to 2026-12-05 */
  assert.equal(DC.workdaysBetween(p('2026-11-29'), p('2026-12-05'), []), 5);
  assert.equal(DC.workdaysBetween(p('2026-11-29'), p('2026-12-05'), [], false, [5, 6]), 4);
  assert.equal(DC.workdaysBetween(p('2026-11-29'), p('2026-12-05'), [], false, [0]), 6);
  assert.equal(DC.workdaysBetween(p('2026-11-29'), p('2026-12-05'), ['2026-12-01'], false, []), 5);
  assert.equal(DC.fmt(DC.addWorkdays(p('2026-12-03'), 1, [], [5])), '2026-12-05');
  assert.equal(DC.fmt(DC.addWorkdays(p('2026-12-03'), 1)), '2026-12-04');
  assert.equal(DC.addWorkdays(p('2026-12-03'), 3, [], [0, 1, 2, 3, 4, 5, 6]), null);
});

test('pct v1.2: percentage points and proportion (free), CAGR (Pro)', () => {
  assert.deepEqual(PC.points(5, 7), { pp: 2, rel: 40 });
  assert.deepEqual(PC.points(0.1, 0.3), { pp: 0.2, rel: 200 });
  assert.ok(Number.isNaN(PC.points(0, 3).rel));
  assert.equal(PC.proportion(3, 450, 5), 750);
  assert.equal(PC.proportion(4, 1, 2), 0.5);
  assert.ok(Number.isNaN(PC.proportion(0, 1, 2)));
  assert.equal(PC.cagr(1000, 1210, 2), 10);
  assert.equal(PC.cagr(100, 100, 5), 0);
  assert.equal(PC.cagr(200, 100, 1), -50);
  assert.ok(Math.abs(PC.cagr(1000, 1500, 4) - 10.668192) < 1e-6);
  assert.ok(Number.isNaN(PC.cagr(0, 100, 2)));
  assert.ok(Number.isNaN(PC.cagr(100, 200, 0)));
  assert.ok(Number.isNaN(PC.cagr(100, -1, 2)));
});

test('ora v1.2: highlight terms, recent searches (free); Markdown table (Pro)', () => {
  assert.deepEqual(OL.terms('Unique  constraint'), ['unique', 'constraint']);
  assert.deepEqual(OL.terms('942'), []);
  assert.deepEqual(OL.terms('ORA-06512: at line 5'), []);
  assert.deepEqual(OL.highlight('Unique constraint violated; UNIQUE', ['unique']),
    [{ t: 'Unique', hit: true }, { t: ' constraint violated; ', hit: false }, { t: 'UNIQUE', hit: true }]);
  assert.deepEqual(OL.highlight('abc', []), [{ t: 'abc', hit: false }]);
  assert.deepEqual(OL.highlight('', ['x']), [{ t: '', hit: false }]);
  let r = OL.addRecent([], ' deadlock ');
  r = OL.addRecent(r, '942'); r = OL.addRecent(r, 'DEADLOCK');
  assert.deepEqual(r, ['DEADLOCK', '942']);
  assert.deepEqual(OL.addRecent(r, 'ORA-1\nORA-2'), r);
  assert.deepEqual(OL.addRecent(r, 'x'.repeat(61)), r);
  let many = [];
  for (let i = 0; i < 12; i++) many = OL.addRecent(many, 'q' + i);
  assert.equal(many.length, 8);
  assert.equal(OL.toMarkdownTable([{ code: 'ORA-1', title: 'a|b', cause: 'line1\nline2', fix: 'x\\y' }]),
    '| Code | Title | Cause | Fix |\n| --- | --- | --- | --- |\n| ORA-1 | a\\|b | line1 line2 | x\\\\y |\n');
  const t = OL.toMarkdownTable(OL.search(OD, 'ORA-00942 ORA-00001').slice(0, 2));
  assert.equal(t.trim().split('\n').length, 4);
});

test('text v1.2: line filters, prefix/suffix (free); regex filter and text diff (Pro)', () => {
  const t = 'Apple pie\nbanana\napricot jam\n\nCherry';
  assert.equal(T.filterLines(t, 'ap', true, { ignoreCase: true }), 'Apple pie\napricot jam');
  assert.equal(T.filterLines(t, 'ap', true), 'apricot jam');
  assert.equal(T.filterLines(t, 'an', false), 'Apple pie\napricot jam\n\nCherry');
  assert.equal(T.filterLines(t, '', true), t);
  assert.equal(T.filterLines('id 12\nname\nid 7', '^id \\d+$', false, { regex: true }), 'name');
  assert.equal(T.filterLines('Мир\nмир\nдом', 'МИР', true, { regex: true, ignoreCase: true }), 'Мир\nмир');
  assert.throws(() => T.filterLines('a', '(', true, { regex: true }));
  assert.equal(T.affixLines('a\n\n  \nb', '- ', ';'), '- a;\n\n  \n- b;');
  assert.equal(T.diffText('a\nb\nc\nd', 'a\nc\nx\nd'), '  a\n- b\n  c\n+ x\n  d');
  assert.equal(T.diffText('same', 'same'), '  same');
  assert.deepEqual(T.diffLines('', 'new'), [{ op: '-', line: '' }, { op: '+', line: 'new' }]);
  const d = T.diffLines('1\n2\n3\n4\n5', '0\n1\n3\n4\n5\n6');
  assert.deepEqual(d.map(x => x.op).join(''), '+ -   +');
  assert.throws(() => T.diffLines('x\n'.repeat(3001), 'y'));
});

test('pick v1.1: yes/no and rock-paper-scissors (free); tournament bracket (Pro)', () => {
  assert.equal(RP.yesNo(seqSrc([0])), 'yes'); assert.equal(RP.yesNo(seqSrc([1])), 'no');
  assert.deepEqual([0, 1, 2].map(v => RP.rps(seqSrc([v]))), ['rock', 'paper', 'scissors']);
  assert.equal(RP.rpsWinner('rock', 'scissors'), 1); assert.equal(RP.rpsWinner('rock', 'paper'), 2);
  assert.equal(RP.rpsWinner('paper', 'rock'), 1); assert.equal(RP.rpsWinner('scissors', 'paper'), 1);
  assert.equal(RP.rpsWinner('paper', 'paper'), 0);
  assert.throws(() => RP.rpsWinner('lizard', 'rock'));
  assert.equal(RP.bracket(['solo']), null);
  for (let n = 2; n <= 33; n++) {
    const names = Array.from({ length: n }, (_, i) => 'p' + i), b = RP.bracket(names);
    const size = b.slots.length;
    assert.ok(size >= n && size < 2 * n && (size & (size - 1)) === 0, 'power of two');
    assert.deepEqual(b.slots.filter(x => x !== null).sort(), names.slice().sort());
    for (let m = 0; m < size / 2; m++) assert.notEqual(b.slots[2 * m], null, 'at most one bye per match');
    assert.equal(b.picks.length, Math.log2(size));
    const done = RP.bracketRandom(b);
    assert.ok(names.includes(RP.champion(done)));
    assert.equal(RP.champion(b), null, 'input not changed');
  }
  let b = { slots: ['A', 'B', 'C', null], picks: [[null, null], [null]] };
  let rs = RP.bracketRounds(b);
  assert.deepEqual(rs[0], [{ a: 'A', b: 'B', w: null }, { a: 'C', b: null, w: 'C' }]);
  assert.deepEqual(rs[1][0], { a: null, b: 'C', w: null });
  assert.equal(RP.bracketPick(b, 1, 0, 0), b, 'final not ready yet');
  b = RP.bracketPick(b, 0, 0, 1);
  b = RP.bracketPick(b, 1, 0, 0);
  assert.equal(RP.champion(b), 'B');
  b = RP.bracketPick(b, 0, 0, 0);
  assert.deepEqual(RP.bracketRounds(b)[1][0], { a: 'A', b: 'C', w: null }, 'changing a result resets the next rounds');
  assert.equal(RP.champion(RP.bracketRandom(b, seqSrc([1]))), 'C');
});
