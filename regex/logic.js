/* Regex tester logic. Pure functions, no DOM: compile, find matches, replace, tests, token-by-token explanation,
   CSV/JSON export and the pattern library. Used by app.js (main thread) and worker.js (matching off the UI thread). */
(function (global) {
  'use strict';
  const FLAGS = 'dgimsuy';
  const MAX = 10000;

  /* păstrează doar flag-urile valide, fără duplicate, în ordine canonică */
  function cleanFlags(f) { return FLAGS.split('').filter(c => String(f || '').includes(c)).join(''); }
  function compile(pattern, flags) {
    try { return { re: new RegExp(String(pattern), cleanFlags(flags)) }; }
    catch (e) { return { error: String(e.message || e) }; }
  }
  /* poziția următoare după o potrivire vidă (pe code point în modul u) */
  function advance(text, i, unicode) {
    if (unicode && i < text.length) { const c = text.charCodeAt(i); if (c >= 0xd800 && c <= 0xdbff) return i + 2; }
    return i + 1;
  }
  function pack(m) {
    return {
      i: m.index, t: m[0],
      g: m.slice(1).map(x => x === undefined ? null : x),
      n: m.groups ? Object.assign({}, m.groups) : null,
      gi: m.indices ? m.indices.slice(1).map(x => x ? [x[0], x[1]] : null) : null
    };
  }
  function findMatches(re, text, max) {
    max = max || MAX; text = String(text);
    const out = []; let truncated = false;
    re.lastIndex = 0;
    if (!re.global) { const m = re.exec(text); if (m) out.push(pack(m)); re.lastIndex = 0; return { matches: out, truncated }; }
    let m;
    while ((m = re.exec(text)) !== null) {
      if (out.length >= max) { truncated = true; break; }
      out.push(pack(m));
      if (m[0] === '') re.lastIndex = advance(text, re.lastIndex, re.unicode);
    }
    re.lastIndex = 0;
    return { matches: out, truncated };
  }
  function lines(s) { return String(s || '').split(/\r?\n/).filter(l => l !== ''); }
  /* cazuri de test: fiecare linie din yes trebuie să se potrivească, fiecare din no nu */
  function runTests(pattern, flags, yes, no, whole) {
    const c = compile(whole ? '^(?:' + pattern + ')$' : pattern, cleanFlags(flags).replace(/[gy]/g, ''));
    if (c.error) return { error: c.error };
    const res = [];
    for (const [list, expect] of [[yes, true], [no, false]]) {
      for (const text of list) { const got = c.re.test(text); res.push({ text, expect, got, pass: got === expect }); }
    }
    return { results: res, passed: res.filter(r => r.pass).length, total: res.length };
  }
  /* tot ce rulează regex-ul (poate bloca) — apelat din worker */
  function run(msg) {
    const t0 = Date.now();
    const c = compile(msg.pattern, msg.flags);
    if (c.error) return { error: c.error };
    const r = findMatches(c.re, msg.text, msg.max);
    if (msg.repl != null) r.replaced = String(msg.text).replace(c.re, msg.repl);
    if (msg.tests) r.tests = runTests(msg.pattern, msg.flags, msg.tests.yes || [], msg.tests.no || [], msg.tests.whole);
    r.ms = Date.now() - t0;
    return r;
  }

  /* ---- explicație token cu token: [{t: text, k: cheie de traducere, v: variabile, d: adâncime}] ---- */
  const SIMPLE = { d: 'xDigit', D: 'xNotDigit', w: 'xWord', W: 'xNotWord', s: 'xSpace', S: 'xNotSpace', b: 'xWordB', B: 'xNotWordB' };
  const CTRL = { t: ['xTab', '\t'], n: ['xNl', '\n'], r: ['xCr', '\r'], f: ['xFf', '\f'], v: ['xVt', '\v'] };
  function explain(pattern, flags) {
    const s = String(pattern), f = cleanFlags(flags), out = [];
    let i = 0, d = 0, grp = 0;
    const push = (t, k, v) => out.push({ t, k, v: v || {}, d });
    const lit = (raw, ch) => {
      const last = out[out.length - 1];
      if (last && last.k === 'xLit' && last.d === d) { last.t += raw; last.v.t += ch; } else push(raw, 'xLit', { t: ch });
    };
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') {
        const n = s[i + 1] || '';
        let m;
        if (SIMPLE[n]) { push('\\' + n, SIMPLE[n]); i += 2; }
        else if (CTRL[n]) { push('\\' + n, CTRL[n][0]); i += 2; }
        else if (n === '0' && !/\d/.test(s[i + 2] || '')) { push('\\0', 'xNul'); i += 2; }
        else if ((m = /^\\x([0-9a-fA-F]{2})/.exec(s.slice(i))) || (m = /^\\u([0-9a-fA-F]{4})/.exec(s.slice(i))) || (f.includes('u') && (m = /^\\u\{([0-9a-fA-F]+)\}/.exec(s.slice(i))))) {
          push(m[0], 'xCode', { c: 'U+' + m[1].toUpperCase().padStart(4, '0') }); i += m[0].length;
        }
        else if ((m = /^\\c([A-Za-z])/.exec(s.slice(i)))) { push(m[0], 'xCtrl', { c: m[1].toUpperCase() }); i += 3; }
        else if ((m = /^\\([pP])\{([^}]*)\}/.exec(s.slice(i)))) { push(m[0], m[1] === 'p' ? 'xProp' : 'xNotProp', { p: m[2] }); i += m[0].length; }
        else if ((m = /^\\k<([^>]+)>/.exec(s.slice(i)))) { push(m[0], 'xRef', { n: '«' + m[1] + '»' }); i += m[0].length; }
        else if ((m = /^\\([1-9]\d*)/.exec(s.slice(i)))) { push(m[0], 'xRef', { n: m[1] }); i += m[0].length; }
        else { lit('\\' + n, n); i += 2; }
      }
      else if (c === '[') {
        let j = i + 1; if (s[j] === '^') j++;
        while (j < s.length && s[j] !== ']') j += s[j] === '\\' ? 2 : 1;
        const raw = s.slice(i, j + 1);
        push(raw, raw[1] === '^' ? 'xNotClass' : 'xClass', { s: raw }); i = j + 1;
      }
      else if (c === '(') {
        let m;
        const rest = s.slice(i);
        if (rest.startsWith('(?:')) { push('(?:', 'xNonCap'); i += 3; }
        else if (rest.startsWith('(?=')) { push('(?=', 'xLA'); i += 3; }
        else if (rest.startsWith('(?!')) { push('(?!', 'xNLA'); i += 3; }
        else if (rest.startsWith('(?<=')) { push('(?<=', 'xLB'); i += 4; }
        else if (rest.startsWith('(?<!')) { push('(?<!', 'xNLB'); i += 4; }
        else if ((m = /^\(\?<([^>]+)>/.exec(rest))) { push(m[0], 'xNamed', { n: ++grp, name: m[1] }); i += m[0].length; }
        else if ((m = /^\(\?([ims]*)(?:-([ims]+))?:/.exec(rest))) { push(m[0], 'xMod', { f: m[0].slice(2, -1) }); i += m[0].length; }
        else { push('(', 'xGroup', { n: ++grp }); i++; }
        d++;
      }
      else if (c === ')') { d = Math.max(0, d - 1); push(')', 'xEndGroup'); i++; }
      else if (c === '|') { push('|', 'xAlt'); i++; }
      else if (c === '^') { push('^', f.includes('m') ? 'xStartM' : 'xStart'); i++; }
      else if (c === '$') { push('$', f.includes('m') ? 'xEndM' : 'xEnd'); i++; }
      else if (c === '.') { push('.', f.includes('s') ? 'xAnyS' : 'xAny'); i++; }
      else {
        const m = /^(?:[*+?]|\{(\d+)(,(\d*))?\})/.exec(s.slice(i));
        if (m) {
          let raw = m[0], lazy = false;
          if (s[i + raw.length] === '?') { raw += '?'; lazy = true; }
          let q, v = {};
          if (raw[0] === '*') q = 'qStar'; else if (raw[0] === '+') q = 'qPlus'; else if (raw[0] === '?') q = 'qOpt';
          else if (!m[2]) { q = 'qN'; v = { n: m[1] }; }
          else if (m[3] === '') { q = 'qMin'; v = { n: m[1] }; }
          else { q = 'qRange'; v = { n: m[1], m: m[3] }; }
          /* cuantificatorul se aplică doar ultimului caracter dintr-un text literal */
          const last = out[out.length - 1];
          if (last && last.k === 'xLit' && Array.from(last.v.t).length > 1) {
            const ch = Array.from(last.v.t).pop(), rawCh = last.t.endsWith('\\' + ch) ? '\\' + ch : ch;
            last.t = last.t.slice(0, -rawCh.length); last.v.t = last.v.t.slice(0, -ch.length);
            push(rawCh, 'xLit', { t: ch });
          }
          push(raw, 'xRepeat', Object.assign({ q, lazy }, v)); i += raw.length;
        }
        else { const ch = String.fromCodePoint(s.codePointAt(i)); lit(ch, ch); i += ch.length; }
      }
    }
    return out;
  }
  /* ---- fișă rapidă (gratuit): token, cheie de explicație, variabile ---- */
  const CHEAT = [
    ['.', 'xAny'], ['\\d', 'xDigit'], ['\\D', 'xNotDigit'], ['\\w', 'xWord'], ['\\W', 'xNotWord'], ['\\s', 'xSpace'], ['\\S', 'xNotSpace'],
    ['\\b', 'xWordB'], ['^', 'xStart'], ['$', 'xEnd'], ['[abc]', 'xClass', { s: '[abc]' }], ['[^abc]', 'xNotClass', { s: '[^abc]' }], ['[a-z]', 'xClass', { s: '[a-z]' }],
    ['a|b', 'xAlt'], ['(…)', 'xGroup', { n: 1 }], ['(?<name>…)', 'xNamed', { n: 1, name: 'name' }], ['(?:…)', 'xNonCap'], ['\\1', 'xRef', { n: 1 }],
    ['(?=…)', 'xLA'], ['(?!…)', 'xNLA'], ['(?<=…)', 'xLB'], ['(?<!…)', 'xNLB'],
    ['*', 'xRepeat', { q: 'qStar' }], ['+', 'xRepeat', { q: 'qPlus' }], ['?', 'xRepeat', { q: 'qOpt' }], ['{3}', 'xRepeat', { q: 'qN', n: 3 }],
    ['{2,}', 'xRepeat', { q: 'qMin', n: 2 }], ['{2,5}', 'xRepeat', { q: 'qRange', n: 2, m: 5 }], ['+?', 'xRepeat', { q: 'qPlus', lazy: true }],
    ['\\.', 'xLit', { t: '.' }], ['\\t', 'xTab'], ['\\n', 'xNl'], ['\\p{L}', 'xProp', { p: 'L' }]
  ].map(([t, k, v]) => ({ t, k, v: v || {}, ins: t.replace('…', '') }));

  /* ---- Pro: fragment de cod pentru alte limbaje ----
     Returnează { code, warn: [{ k, v }] }; warn = construcții pe care limbajul nu le suportă sau le tratează altfel. */
  const LANGS = { js: 'JavaScript', py: 'Python', java: 'Java', cs: 'C#', plsql: 'PL/SQL' };
  function escSlash(p) {
    let o = '';
    for (let i = 0; i < p.length; i++) {
      if (p[i] === '\\') { o += p.slice(i, i + 2); i++; }
      else o += p[i] === '/' ? '\\/' : p[i];
    }
    return o;
  }
  function escQuoteRaw(p) {
    let o = '';
    for (let i = 0; i < p.length; i++) {
      if (p[i] === '\\') { o += p.slice(i, i + 2); i++; }
      else o += p[i] === '"' ? '\\"' : p[i];
    }
    return o;
  }
  const lineBreaks = p => p.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  function codeSnippet(lang, pattern, flags) {
    const f = cleanFlags(flags), g = f.includes('g'), toks = explain(pattern, f), warn = [];
    const has = (...ks) => toks.filter(x => ks.includes(x.k)).map(x => x.t);
    const uniq = a => Array.from(new Set(a));
    const unsupported = list => { const u = uniq(list); if (u.length) warn.push({ k: 'wUnsupported', v: { lang: LANGS[lang], t: u.join('  ') } }); };
    const bigU = toks.filter(x => x.k === 'xCode' && x.t.startsWith('\\u{')).map(x => x.t);
    const sticky = f.includes('y') && lang !== 'js' ? ['y'] : [];
    const uniDigits = () => { if (has('xDigit', 'xNotDigit', 'xWord', 'xNotWord', 'xWordB', 'xNotWordB').length) warn.push({ k: 'wUni', v: { lang: LANGS[lang] } }); };
    let p = lang === 'plsql' ? String(pattern) : lineBreaks(String(pattern)), code;
    if (lang === 'js') {
      code = `const re = /${p === '' ? '(?:)' : escSlash(p)}/${f};\n` + (g ? 'const matches = [...text.matchAll(re)];\nfor (const m of matches) console.log(m.index, m[0]);' : 'const m = re.exec(text);\nif (m) console.log(m.index, m[0]);');
    } else if (lang === 'py') {
      /* Python: (?<n>…) → (?P<n>…), \k<n> → (?P=n) */
      p = toks.map(x => x.k === 'xNamed' ? '(?P<' + x.v.name + '>' : x.k === 'xRef' && x.t.startsWith('\\k<') ? '(?P=' + x.t.slice(3, -1) + ')' : x.t).join('');
      p = lineBreaks(p);
      const fl = [['i', 're.IGNORECASE'], ['m', 're.MULTILINE'], ['s', 're.DOTALL']].filter(([c]) => f.includes(c)).map(x => x[1]);
      code = `import re\n\npattern = re.compile(r"${escQuoteRaw(p)}"${fl.length ? ', ' + fl.join(' | ') : ''})\n` + (g ? 'for m in pattern.finditer(text):\n    print(m.start(), m.group())' : 'm = pattern.search(text)\nif m:\n    print(m.start(), m.group())');
      unsupported(has('xProp', 'xNotProp', 'xCtrl').concat(bigU, sticky));
      uniDigits();
    } else if (lang === 'java') {
      const fl = [['i', 'Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE'], ['m', 'Pattern.MULTILINE'], ['s', 'Pattern.DOTALL']].filter(([c]) => f.includes(c)).map(x => x[1]);
      const lit = p.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      code = `import java.util.regex.*;\n\nPattern p = Pattern.compile("${lit}"${fl.length ? ', ' + fl.join(' | ') : ''});\nMatcher m = p.matcher(text);\n` + (g ? 'while (m.find()) {\n    System.out.println(m.start() + " " + m.group());\n}' : 'if (m.find()) {\n    System.out.println(m.start() + " " + m.group());\n}');
      unsupported(bigU.concat(sticky));
      if (toks.some(x => x.k === 'xNamed' && !/^[A-Za-z][A-Za-z0-9]*$/.test(x.v.name))) warn.push({ k: 'wJavaName', v: {} });
    } else if (lang === 'cs') {
      const fl = [['i', 'RegexOptions.IgnoreCase'], ['m', 'RegexOptions.Multiline'], ['s', 'RegexOptions.Singleline']].filter(([c]) => f.includes(c)).map(x => x[1]);
      code = `using System.Text.RegularExpressions;\n\nvar re = new Regex(@"${p.replace(/"/g, '""')}"${fl.length ? ', ' + fl.join(' | ') : ''});\n` + (g ? 'foreach (Match m in re.Matches(text))\n{\n    Console.WriteLine($"{m.Index} {m.Value}");\n}' : 'Match m = re.Match(text);\nif (m.Success)\n{\n    Console.WriteLine($"{m.Index} {m.Value}");\n}');
      unsupported(bigU.concat(sticky));
      uniDigits();
    } else if (lang === 'plsql') {
      const mp = (f.includes('i') ? 'i' : '') + (f.includes('m') ? 'm' : '') + (f.includes('s') ? 'n' : '');
      const lit = "'" + p.replace(/'/g, "''") + "'", arg = mp ? `, '${mp}'` : '';
      code = (g ? `v_count := REGEXP_COUNT(v_text, ${lit}, 1${arg ? arg : ", 'c'"});\n` : '') + `IF REGEXP_LIKE(v_text, ${lit}${arg}) THEN\n  DBMS_OUTPUT.PUT_LINE(REGEXP_SUBSTR(v_text, ${lit}, 1, 1${arg ? arg : ", 'c'"}));\nEND IF;`;
      unsupported(has('xLA', 'xNLA', 'xLB', 'xNLB', 'xNonCap', 'xMod', 'xNamed', 'xProp', 'xNotProp', 'xWordB', 'xNotWordB', 'xCtrl').concat(toks.filter(x => x.k === 'xRef' && x.t.startsWith('\\k<')).map(x => x.t), toks.filter(x => x.k === 'xCode').map(x => x.t), sticky));
    } else throw new RangeError('unknown language');
    return { code, warn };
  }
  /* nume pentru fiecare grup capturant, în ordine (null = fără nume) */
  function groupNames(pattern) { return explain(pattern, '').filter(x => x.k === 'xGroup' || x.k === 'xNamed').map(x => x.v.name || null); }

  /* ---- export ---- */
  function cell(v) {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(matches, names) {
    const k = Math.max(names ? names.length : 0, ...matches.map(m => m.g.length), 0);
    const head = ['n', 'index', 'length', 'match'];
    for (let j = 0; j < k; j++) head.push('$' + (j + 1) + (names && names[j] ? ' ' + names[j] : ''));
    const rows = matches.map((m, n) => [n + 1, m.i, m.t.length, m.t].concat(Array.from({ length: k }, (_, j) => m.g[j])));
    return [head].concat(rows).map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
  }
  function toJson(matches) {
    return JSON.stringify(matches.map((m, n) => {
      const o = { n: n + 1, index: m.i, length: m.t.length, match: m.t, groups: m.g };
      if (m.n) o.named = m.n;
      if (m.gi) o.groupIndices = m.gi;
      return o;
    }), null, 2);
  }

  /* ---- bibliotecă (Pro): [id, nume en/ro/ru, model, flag-uri, exemplu] ---- */
  const LIB = [
    ['email', ['Email address', 'Adresă de email', 'Адрес эл. почты'], '[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+', 'g', 'Write to ana.pop@example.com or support+bugs@mail.example.org, not to @nobody.'],
    ['url', ['Web address (http/https)', 'Adresă web (http/https)', 'Веб-адрес (http/https)'], 'https?:\\/\\/[^\\s/$.?#][^\\s]*', 'g', 'Docs: https://example.com/docs?page=2 and http://test.example.org/a/b#top.'],
    ['domain', ['Domain name', 'Nume de domeniu', 'Доменное имя'], '\\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,}\\b', 'gi', 'Hosts: example.com, mail.example.co.uk, my-site.dev'],
    ['ipv4', ['IPv4 address', 'Adresă IPv4', 'Адрес IPv4'], '\\b(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\b', 'g', 'Router 192.168.0.1, DNS 8.8.8.8, invalid 256.1.1.1'],
    ['ipv6', ['IPv6 address (full form)', 'Adresă IPv6 (formă completă)', 'Адрес IPv6 (полная форма)'], '\\b(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\\b', 'gi', 'Host 2001:0db8:85a3:0000:0000:8a2e:0370:7334 is up.'],
    ['mac', ['MAC address', 'Adresă MAC', 'MAC-адрес'], '\\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\\b', 'g', 'eth0 00:1A:2B:3C:4D:5E, wlan0 a4-5e-60-c2-11-08'],
    ['isoDate', ['Date YYYY-MM-DD (named groups)', 'Dată AAAA-LL-ZZ (grupuri cu nume)', 'Дата ГГГГ-ММ-ДД (именованные группы)'], '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])', 'g', 'Released 2026-11-26, patched 2027-01-05, wrong 2026-13-40.'],
    ['dmyDate', ['Date DD.MM.YYYY or DD/MM/YYYY', 'Dată ZZ.LL.AAAA sau ZZ/LL/AAAA', 'Дата ДД.ММ.ГГГГ или ДД/ММ/ГГГГ'], '\\b(0?[1-9]|[12]\\d|3[01])([./-])(0?[1-9]|1[0-2])\\2(\\d{4})\\b', 'g', 'Meeting on 26.11.2026, invoice 05/01/2027, typo 26.11/2026'],
    ['mdyDate', ['Date MM/DD/YYYY', 'Dată LL/ZZ/AAAA', 'Дата ММ/ДД/ГГГГ'], '\\b(0?[1-9]|1[0-2])\\/(0?[1-9]|[12]\\d|3[01])\\/(\\d{4})\\b', 'g', 'Due 11/26/2026, shipped 1/5/2027.'],
    ['time24', ['Time 24h HH:MM(:SS)', 'Oră 24h HH:MM(:SS)', 'Время 24ч ЧЧ:ММ(:СС)'], '\\b(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?\\b', 'g', 'Open 08:30–17:45, backup at 23:59:59, not 24:10.'],
    ['time12', ['Time 12h with AM/PM', 'Oră 12h cu AM/PM', 'Время 12ч с AM/PM'], '\\b(?:0?[1-9]|1[0-2]):[0-5]\\d\\s?[AaPp][Mm]\\b', 'g', 'Call at 9:15 AM or 4:30pm.'],
    ['isoDateTime', ['ISO 8601 date and time', 'Dată și oră ISO 8601', 'Дата и время ISO 8601'], '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d+)?)?(?:Z|[+-]\\d{2}:\\d{2})?', 'g', 'created=2026-11-26T09:41:07.123Z updated=2026-11-26T11:00+02:00'],
    ['e164', ['Phone, international +country format', 'Telefon, format internațional +țară', 'Телефон, международный формат +код'], '\\+[1-9]\\d{6,14}\\b', 'g', 'Call +442071234567 or +15551234567.'],
    ['phone', ['Phone number, common formats', 'Număr de telefon, formate uzuale', 'Номер телефона, обычные форматы'], '(?:\\+\\d{1,3}[\\s.-]?)?\\(?\\d{2,4}\\)?(?:[\\s.-]?\\d{2,4}){2,3}', 'g', 'Office (555) 123-4567, mobile +44 20 7123 4567, fax 555.987.6543'],
    ['integer', ['Integer', 'Număr întreg', 'Целое число'], '-?\\b\\d+\\b', 'g', 'Values: 42, -7 and 1000 items'],
    ['decimal', ['Decimal number (. or ,)', 'Număr zecimal (. sau ,)', 'Десятичное число (. или ,)'], '[-+]?\\b\\d+(?:[.,]\\d+)?\\b', 'g', 'Prices 19.99, 5,50 and -0.75'],
    ['thousands', ['Number with thousands separators', 'Număr cu separator de mii', 'Число с разделителями тысяч'], '\\b\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?\\b', 'g', 'Population 1,234,567 and budget 12,500.75'],
    ['hexColor', ['Hex color', 'Culoare hex', 'Цвет hex'], '#(?:[0-9a-fA-F]{3,4}){1,2}\\b', 'g', 'color: #9c36b5; background: #fff; border: #11223344'],
    ['uuid', ['UUID / GUID', 'UUID / GUID', 'UUID / GUID'], '\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b', 'gi', 'id=3F2504E0-4F89-11D3-9A0C-0305E82C3301 ref=123e4567-e89b-12d3-a456-426614174000'],
    ['semver', ['Version number (semver)', 'Număr de versiune (semver)', 'Номер версии (semver)'], '\\bv?(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-([\\da-z-]+(?:\\.[\\da-z-]+)*))?(?:\\+([\\da-z-]+(?:\\.[\\da-z-]+)*))?\\b', 'gi', 'Upgrade from v1.4.2 to 2.0.0-beta.1+build.5'],
    ['hashtag', ['Hashtag', 'Hashtag', 'Хештег'], '(?<!\\w)#[\\p{L}\\p{N}_]+', 'gu', 'Loving #regex and #JavaScript, not issue#12. #привет'],
    ['mention', ['@mention', '@mențiune', '@упоминание'], '(?<![\\w.])@\\w{1,30}', 'g', 'Thanks @ana and @dev_team (not mail@example.com)'],
    ['htmlTag', ['HTML tag', 'Etichetă HTML', 'HTML-тег'], '<\\/?([a-zA-Z][a-zA-Z0-9-]*)\\b[^>]*>', 'g', '<p class="x">Hi <b>there</b></p>'],
    ['htmlComment', ['HTML comment', 'Comentariu HTML', 'HTML-комментарий'], '<!--[\\s\\S]*?-->', 'g', '<div><!-- todo --> text <!-- multi\nline --></div>'],
    ['quoted', ['Text in double quotes', 'Text între ghilimele duble', 'Текст в двойных кавычках'], '"(?:[^"\\\\\\n]|\\\\.)*"', 'g', 'name="Ana" note="say \\"hi\\"" empty=""'],
    ['dupWords', ['Repeated word', 'Cuvânt repetat', 'Повторённое слово'], '\\b(\\w+)\\s+\\1\\b', 'gi', 'This is is a test of the the checker.'],
    ['trailing', ['Spaces at end of line', 'Spații la final de rând', 'Пробелы в конце строки'], '[ \\t]+$', 'gm', 'first line   \nsecond line\nthird\t\n'],
    ['blank', ['Empty lines', 'Rânduri goale', 'Пустые строки'], '^[ \\t]*$', 'gm', 'one\n\ntwo\n   \nthree'],
    ['strongPw', ['Password rule: 8+ chars, upper, lower, digit, symbol', 'Regulă parolă: 8+ caractere, mari, mici, cifră, simbol', 'Правило пароля: 8+ символов, заглавные, строчные, цифра, знак'], '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,}$', 'gm', 'Passw0rd!\npassword\nShort1!\nN0-Spaces-Here'],
    ['slug', ['URL slug', 'Slug pentru URL', 'Слаг для URL'], '^[a-z0-9]+(?:-[a-z0-9]+)*$', 'gm', 'my-first-post\nBad Slug\nversion-2-0'],
    ['imageFile', ['Image file name', 'Nume de fișier imagine', 'Имя файла изображения'], '[\\w-]+\\.(?:jpe?g|png|gif|webp|svg)\\b', 'gi', 'Attached photo_01.JPG, logo.svg and notes.txt'],
    ['zip', ['US ZIP code', 'Cod poștal SUA (ZIP)', 'Почтовый индекс США (ZIP)'], '\\b\\d{5}(?:-\\d{4})?\\b', 'g', 'Ship to 90210 or 10001-1234.'],
    ['logLevel', ['Log level', 'Nivel de jurnal (log)', 'Уровень лога'], '\\b(ERROR|WARN(?:ING)?|INFO|DEBUG)\\b', 'g', '[INFO] start\n[WARN] slow disk\n[ERROR] failed to connect'],
    ['keyValue', ['key = value lines', 'Rânduri cheie = valoare', 'Строки ключ = значение'], '^\\s*([\\w.-]+)\\s*=\\s*(.*?)\\s*$', 'gm', 'host = localhost\nport=5432\n# comment\ndb.name = shop']
  ].map(([id, name, p, f, sample]) => ({ id, name: { en: name[0], ro: name[1], ru: name[2] }, p, f, sample }));

  const RegexLogic = { FLAGS, MAX, cleanFlags, compile, findMatches, lines, runTests, run, explain, groupNames, cell, toCsv, toJson, LIB, CHEAT, LANGS, codeSnippet };
  if (typeof module !== 'undefined' && module.exports) module.exports = RegexLogic;
  else global.RegexLogic = RegexLogic;
})(typeof window !== 'undefined' ? window : globalThis);
