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
