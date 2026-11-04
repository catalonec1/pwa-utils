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
    numberLines: t => lines(t).map((l, i) => `${i + 1}. ${l}`).join('\n')
  };
  const FREE = Object.keys(ops);

  function regexReplace(t, pattern, flags, repl) {
    const f = Array.from(new Set(String(flags || 'g').replace(/[^gimsuy]/g, ''))).join('');
    return String(t).replace(new RegExp(pattern, f), repl == null ? '' : repl);
  }
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
    jsonMinify: t => JSON.stringify(JSON.parse(t))
  };

  const api = { stats, ops, FREE, pro, PRO: Object.keys(pro), regexReplace };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.TextTools = api;
})(typeof window !== 'undefined' ? window : globalThis);
