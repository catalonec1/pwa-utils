/* Password generator logic. Pure functions, no DOM. Randomness comes from crypto.getRandomValues. */
(function (global) {
  'use strict';
  const SETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    symbols: '!#$%&*+-=?@^_~.,:;()[]{}'
  };
  const SIMILAR = /[Il1O0o|]/g;

  function cryptoObj() { return (global.crypto && global.crypto.getRandomValues) ? global.crypto : require('crypto').webcrypto; }
  /* Uniform integer in [0, n) without modulo bias. */
  function randInt(n, rng) {
    if (rng) return Math.floor(rng() * n);
    const max = Math.floor(0x100000000 / n) * n, buf = new Uint32Array(1);
    do { cryptoObj().getRandomValues(buf); } while (buf[0] >= max);
    return buf[0] % n;
  }
  function pick(str, rng) { return str[randInt(str.length, rng)]; }
  function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1, rng); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* Keeps only printable ASCII symbols (no letters, digits or spaces), each once. */
  function cleanSymbols(str) {
    return [...new Set(String(str || '').split(''))].filter(c => /[!-~]/.test(c) && !/[A-Za-z0-9]/.test(c)).join('');
  }
  function poolFor(k, o) {
    let s = k === 'symbols' && o.symbolSet ? cleanSymbols(o.symbolSet) : SETS[k];
    if (o.noSimilar) s = s.replace(SIMILAR, '');
    if (o.exclude) { const ex = new Set(String(o.exclude)); s = [...s].filter(c => !ex.has(c)).join(''); }
    return s;
  }
  function pools(o) {
    const out = [];
    for (const k of ['lower', 'upper', 'digits', 'symbols']) {
      if (!o[k]) continue;
      const s = poolFor(k, o);
      if (s) out.push(s);
    }
    return out;
  }
  function letterPool(o) { return (o.lower ? poolFor('lower', o) : '') + (o.upper ? poolFor('upper', o) : ''); }
  /* opts: length, lower, upper, digits, symbols, noSimilar, exclude (characters never used),
     startLetter (first character is a letter), symbolSet (Pro: allowed symbols instead of the default set).
     Every chosen set appears at least once. */
  function generate(o, rng) {
    const len = Math.max(4, Math.min(128, o.length | 0 || 16));
    const ps = pools(o);
    if (!ps.length) throw new Error('no character set');
    const all = ps.join('');
    const chars = ps.map(p => pick(p, rng));
    while (chars.length < len) chars.push(pick(all, rng));
    const out = shuffle(chars, rng).slice(0, len);
    const letters = letterPool(o);
    if (o.startLetter && letters && !letters.includes(out[0])) {
      const idx = out.map((c, i) => (letters.includes(c) ? i : -1)).filter(i => i > 0);
      if (idx.length) { const j = idx[randInt(idx.length, rng)]; [out[0], out[j]] = [out[j], out[0]]; }
      else out[0] = pick(letters, rng);
    }
    return out.join('');
  }
  function poolSize(o) { return pools(o).join('').length; }
  const bits = (len, pool) => (pool > 1 ? Math.round(len * Math.log2(pool)) : 0);
  /* Entropy of generate(o): a forced first letter carries log2(letters) bits instead of log2(pool). */
  function genBits(o) {
    const len = Math.max(4, Math.min(128, o.length | 0 || 16)), pool = poolSize(o), letters = letterPool(o).length;
    if (pool < 2) return 0;
    if (!o.startLetter || !letters) return bits(len, pool);
    return Math.round((len - 1) * Math.log2(pool) + Math.log2(Math.max(1, letters)));
  }

  /* Estimated entropy of an arbitrary password (character classes present). */
  function estimate(pw) {
    pw = String(pw); if (!pw) return 0;
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
    const uniq = new Set(pw).size;
    let b = [...pw].length * Math.log2(pool || 1);
    if (uniq < [...pw].length / 2) b *= uniq / ([...pw].length / 2);
    if (/^(.)\1+$/.test(pw) || /(1234|abcd|qwer|password|parola|пароль)/i.test(pw)) b = Math.min(b, 20);
    return Math.round(b);
  }
  function level(b) { return b < 40 ? 'weak' : b < 60 ? 'fair' : b < 80 ? 'strong' : 'veryStrong'; }

  /* ---- Pro ---- */
  const WORDS = {
    en: 'apple river stone cloud tiger lemon piano forest candle rocket garden silver window planet orange basket dragon meadow coffee rabbit castle summer winter spring autumn harbor island marble pepper violet jungle falcon copper cotton anchor bridge canyon desert engine feather glacier hammer helmet jacket kettle ladder magnet needle oyster pillow puzzle quartz saddle salmon tunnel turtle velvet wagon walnut yogurt zebra banana cherry mango olive peach grape melon carrot onion tomato potato butter cookie muffin noodle pickle waffle bottle button camera mirror pencil rubber ticket wallet beacon comet galaxy meteor nebula orbit saturn breeze thunder rainbow sunset shadow canvas violin guitar trumpet drum flute anthem ballad poem story legend riddle wizard knight pirate sailor farmer hunter baker tailor doctor artist ranger pilot cactus bamboo maple cedar willow tulip daisy lotus orchid clover'.split(' '),
    ro: 'mar rau piatra nor tigru lamaie pian padure lumanare racheta gradina argint fereastra planeta portocala cos dragon lunca cafea iepure castel vara iarna primavara toamna port insula marmura piper violeta junglă soim cupru bumbac ancora pod canion desert motor pana ghetar ciocan casca geaca ceainic scara magnet ac perna puzzle saua somon tunel broasca catifea caruta nuca iaurt zebra banana cireasa mango masina piersica strugure pepene morcov ceapa rosie cartof unt biscuit covrig gogoasa sticla nasture camera oglinda creion guma bilet portofel far cometa galaxie meteor orbita briza tunet curcubeu apus umbra panza vioara chitara trompeta toba fluier imn balada poem poveste legenda ghicitoare vrajitor cavaler pirat marinar fermier vanator brutar croitor doctor pictor pilot cactus bambus artar cedru salcie lalea margareta lotus orhidee trifoi'.split(' ').map(w => w.normalize('NFD').replace(/[̀-ͯ]/g, '')),
    ru: 'яблоко река камень облако тигр лимон пианино лес свеча ракета сад серебро окно планета апельсин корзина дракон луг кофе кролик замок лето зима весна осень гавань остров мрамор перец фиалка джунгли сокол медь хлопок якорь мост каньон пустыня мотор перо ледник молоток шлем куртка чайник лестница магнит игла подушка пазл седло лосось тоннель черепаха бархат телега орех йогурт зебра банан вишня манго олива персик виноград дыня морковь лук томат картофель масло печенье кекс лапша огурец вафля бутылка пуговица камера зеркало карандаш ластик билет кошелек маяк комета галактика метеор орбита бриз гром радуга закат тень холст скрипка гитара труба барабан флейта гимн баллада поэма сказка легенда загадка волшебник рыцарь пират моряк фермер охотник пекарь портной доктор художник пилот кактус бамбук клен кедр ива тюльпан ромашка лотос орхидея клевер'.split(' ')
  };
  function wordList(lang) { return WORDS[lang] || WORDS.en; }
  /* opts: words (3..10), sep, capitalize, number, lang */
  function passphrase(o, rng) {
    const list = wordList(o.lang), n = Math.max(3, Math.min(10, o.words | 0 || 4));
    const w = [];
    for (let i = 0; i < n; i++) {
      let x = pick(list, rng);
      if (o.capitalize) x = x.charAt(0).toUpperCase() + x.slice(1);
      w.push(x);
    }
    if (o.number) w[randInt(n, rng)] += String(randInt(100, rng));
    return w.join(o.sep == null ? '-' : o.sep);
  }
  function passphraseBits(o) {
    const n = Math.max(3, Math.min(10, o.words | 0 || 4));
    return Math.round(n * Math.log2(wordList(o.lang).length) + (o.number ? Math.log2(100 * n) : 0));
  }
  function pin(len, rng) { let s = ''; for (let i = 0; i < Math.max(3, Math.min(12, len | 0 || 6)); i++) s += randInt(10, rng); return s; }
  /* Pronounceable: alternating consonant/vowel syllables plus 2 digits. */
  function pronounceable(len, rng) {
    const C = 'bcdfghjkmnprstvz', V = 'aeiou';
    len = Math.max(6, Math.min(32, len | 0 || 12));
    let s = '';
    while (s.length < len - 2) s += pick(C, rng) + pick(V, rng);
    s = s.slice(0, len - 2);
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s + randInt(10, rng) + randInt(10, rng);
  }
  function bulk(kind, o, count, rng) {
    const n = Math.max(1, Math.min(500, count | 0 || 10)), out = [];
    for (let i = 0; i < n; i++) out.push(kind === 'phrase' ? passphrase(o, rng) : kind === 'pin' ? pin(o.length, rng) : kind === 'pron' ? pronounceable(o.length, rng) : generate(o, rng));
    return out;
  }
  /* CSV with formula-injection guard (cells starting with = + - @ get a leading apostrophe). */
  function toCsv(list) {
    return 'password\r\n' + list.map(p => {
      const v = /^[=+\-@]/.test(p) ? "'" + p : p;
      return /[",\r\n']/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join('\r\n') + '\r\n';
  }

  const api = { SETS, cleanSymbols, genBits, generate, poolSize, bits, estimate, level, passphrase, passphraseBits, pin, pronounceable, bulk, toCsv, WORDS, randInt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.PassGen = api;
})(typeof window !== 'undefined' ? window : globalThis);
