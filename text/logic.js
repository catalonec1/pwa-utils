/* Text tools logic. Pure functions, no DOM. */
(function (global) {
  'use strict';
  const RU = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };

  function stats(t) {
    t = String(t);
    const words = (t.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
    return {
      chars: [...t].length,
      charsNoSpaces: [...t.replace(/\s/g, '')].length,
      words,
      lines: t === '' ? 0 : t.split(/\r\n|\r|\n/).length,
      sentences: (t.match(/[^.!?…]*[\p{L}\p{N}][^.!?…]*([.!?…]+|$)/gu) || []).filter(s => s.trim()).length,
      paragraphs: t.split(/\n\s*\n/).filter(p => p.trim()).length,
      readingMin: Math.ceil(words / 200)
    };
  }
  const lines = t => String(t).split(/\r\n|\r|\n/);
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

  const ops = {
    upper: t => t.toLocaleUpperCase(),
    lower: t => t.toLocaleLowerCase(),
    title: t => t.toLocaleLowerCase().replace(/(^|[\s\-("'«„])(\p{L})/gu, (m, p, c) => p + c.toLocaleUpperCase()),
    sentence: t => t.toLocaleLowerCase().replace(/(^\s*|[.!?…]\s+)(\p{L})/gu, (m, p, c) => p + c.toLocaleUpperCase()),
    sortAZ: t => lines(t).sort(collator.compare).join('\n'),
    sortZA: t => lines(t).sort(collator.compare).reverse().join('\n'),
    dedupe: t => { const seen = new Set(); return lines(t).filter(l => (seen.has(l) ? false : seen.add(l))).join('\n'); },
    reverseLines: t => lines(t).reverse().join('\n'),
    trim: t => lines(t).map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n'),
    removeEmpty: t => lines(t).filter(l => l.trim() !== '').join('\n'),
    removeDiacritics: t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC'),
    slug: t => ops.removeDiacritics(String(t).toLowerCase().replace(/[а-яё]/g, c => RU[c]))
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    numberLines: t => lines(t).map((l, i) => `${i + 1}. ${l}`).join('\n'),
    joinLines: t => lines(t).map(l => l.trim()).filter(Boolean).join(' '),
    stripHtml: t => String(t).replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  };
  const FREE = Object.keys(ops);

  function regexReplace(t, pattern, flags, repl) {
    const f = Array.from(new Set(String(flags || 'g').replace(/[^gimsuy]/g, ''))).join('');
    return String(t).replace(new RegExp(pattern, f), repl == null ? '' : repl);
  }
  const uniq = a => [...new Set(a)];
  // cuvinte pentru camel/snake/kebab: separă și la granița myVar → my var, fără diacritice
  const words = l => ops.removeDiacritics(String(l)).replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  function b64encode(t) {
    const bytes = new TextEncoder().encode(String(t));
    let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64decode(t) {
    const bin = atob(String(t).replace(/\s/g, ''));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  }
  const pro = {
    b64encode, b64decode,
    urlEncode: t => encodeURIComponent(t),
    urlDecode: t => decodeURIComponent(String(t).replace(/\+/g, ' ')),
    jsonFormat: t => JSON.stringify(JSON.parse(t), null, 2),
    jsonMinify: t => JSON.stringify(JSON.parse(t)),
    extractEmails: t => uniq(String(t).match(/[\p{L}\p{N}._%+\-]+@[\p{L}\p{N}.\-]+\.[\p{L}]{2,}/gu) || []).join('\n'),
    extractUrls: t => uniq((String(t).match(/https?:\/\/[^\s<>"'()]+/g) || []).map(u => u.replace(/[.,;:!?]+$/, ''))).join('\n'),
    wordFreq: t => {
      const m = new Map();
      (String(t).toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).forEach(w => m.set(w, (m.get(w) || 0) + 1));
      return [...m].sort((a, b) => b[1] - a[1] || collator.compare(a[0], b[0])).map(([w, n]) => `${w}: ${n}`).join('\n');
    },
    // v1.0.4: stiluri de denumire pentru programatori (pe fiecare rând) și transliterare chirilică → latină
    camelCase: t => lines(t).map(l => words(l).map((w, i) => i ? w[0].toUpperCase() + w.slice(1) : w).join('')).join('\n'),
    snakeCase: t => lines(t).map(l => words(l).join('_')).join('\n'),
    kebabCase: t => lines(t).map(l => words(l).join('-')).join('\n'),
    translit: t => String(t).replace(/[А-яЁё]/g, c => { const l = c.toLowerCase(), r = RU[l]; return r === undefined ? c : c === l ? r : r.charAt(0).toUpperCase() + r.slice(1); })
  };

  const api = { stats, ops, FREE, pro, PRO: Object.keys(pro), regexReplace };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.TextTools = api;
})(typeof window !== 'undefined' ? window : globalThis);
