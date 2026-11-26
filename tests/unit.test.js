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
