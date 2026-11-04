const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('../convertor/logic.js');
const F = require('../focus/logic.js');
const T = require('../text/logic.js');

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
  assert.throws(() => T.pro.jsonFormat('{bad'));
});
