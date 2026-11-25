(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Ajutor erori ORA', qLabel: 'Cod de eroare, cuvinte sau un mesaj de eroare lipit', qPh: 'ORA-00942, 942, deadlock sau lipește: ORA-06512: at line 5 ...', favTitle: 'Favorite', proPitch: 'Cauze și soluții pentru toate cele 251 de erori (încă 207), favorite și copiere ca Markdown.', note: 'Explicațiile sunt în engleză. Unealtă independentă, fără legătură cu Oracle.', cause: 'Cauza:', fix: 'Soluția:', proOnly: 'Cauza și soluția pentru această eroare sunt în Pro.', fav: '☆ Favorit', unfav: '★ Scoate', copyMd: 'Copiază Markdown', copied: 'Copiat', nRes: '{n} rezultate', none: 'Nu am găsit nimic. Încearcă un cod (942) sau alt cuvânt.', popular: 'Erori frecvente (gratuite):', noFav: 'Apasă ☆ la o eroare ca s-o păstrezi aici.', notListed: '{c} nu este încă în catalog.' },
    en: { appName: 'ORA Error Helper', qLabel: 'Error code, words, or a pasted error stack', qPh: 'ORA-00942, 942, deadlock, or paste: ORA-06512: at line 5 ...', favTitle: 'Favorites', proPitch: 'Causes and fixes for all 251 errors (207 more), favorites and copy as Markdown.', note: 'Explanations are in English. Independent tool, not affiliated with Oracle.', cause: 'Cause:', fix: 'Fix:', proOnly: 'The cause and fix for this error are in Pro.', fav: '☆ Favorite', unfav: '★ Remove', copyMd: 'Copy Markdown', copied: 'Copied', nRes: '{n} results', none: 'Nothing found. Try a code (942) or another word.', popular: 'Common errors (free):', noFav: 'Press ☆ on an error to keep it here.', notListed: '{c} is not in the catalog yet.' },
    ru: { appName: 'Справочник ошибок ORA', qLabel: 'Код ошибки, слова или вставленный текст ошибки', qPh: 'ORA-00942, 942, deadlock или вставьте: ORA-06512: at line 5 ...', favTitle: 'Избранное', proPitch: 'Причины и решения для всех 251 ошибок (ещё 207), избранное и копирование в Markdown.', note: 'Пояснения на английском. Независимый инструмент, не связан с Oracle.', cause: 'Причина:', fix: 'Решение:', proOnly: 'Причина и решение для этой ошибки — в Pro.', fav: '☆ В избранное', unfav: '★ Убрать', copyMd: 'Копировать Markdown', copied: 'Скопировано', nRes: 'Найдено: {n}', none: 'Ничего не найдено. Попробуйте код (942) или другое слово.', popular: 'Частые ошибки (бесплатно):', noFav: 'Нажмите ☆ у ошибки, чтобы сохранить её здесь.', notListed: '{c} пока нет в каталоге.' }
  };
  const L = OraLookup, DATA = ORA_DATA;
  const $ = id => document.getElementById(id);
  let isPro = false, favs = [];
  try { favs = JSON.parse(Core.store('oraFavs') || '[]'); } catch (e) { favs = []; }

  function card(e) {
    const d = document.createElement('div'); d.className = 'err';
    const h = document.createElement('h3'), c = document.createElement('code'), t = document.createElement('span');
    c.textContent = e.code; t.textContent = e.title; h.append(c, t); d.append(h);
    if (e.free || isPro) {
      for (const [k, v] of [['cause', e.cause], ['fix', e.fix]]) {
        const p = document.createElement('p'), b = document.createElement('span');
        b.className = 'lbl'; b.textContent = Core.t(k) + ' '; p.append(b, document.createTextNode(v)); d.append(p);
      }
    } else {
      const p = document.createElement('p'); p.className = 'locked'; p.textContent = Core.t('proOnly'); d.append(p);
    }
    const tools = document.createElement('div'); tools.className = 'tools';
    const fb = document.createElement('button'), on = favs.includes(e.code);
    fb.textContent = Core.t(on ? 'unfav' : 'fav'); fb.disabled = !isPro;
    fb.addEventListener('click', () => { favs = on ? favs.filter(x => x !== e.code) : favs.concat(e.code); Core.store('oraFavs', JSON.stringify(favs)); render(); });
    const cb = document.createElement('button');
    cb.textContent = Core.t('copyMd'); cb.disabled = !isPro;
    cb.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(L.toMarkdown(e)); cb.textContent = Core.t('copied'); setTimeout(() => { cb.textContent = Core.t('copyMd'); }, 1200); } catch (err) { /* clipboard blocked */ }
    });
    tools.append(fb, cb); d.append(tools);
    return d;
  }
  function render() {
    const q = $('q').value, res = $('results'), list = L.search(DATA, q, 30);
    res.textContent = '';
    if (!q.trim()) { const p = document.createElement('p'); p.className = 'muted'; p.style.margin = '0 0 4px'; p.textContent = Core.t('popular'); res.append(p); }
    for (const e of list) res.append(card(e));
    const missing = L.codesIn(q).concat(L.codeOf(q) && L.codeOf(q).prefix ? [L.codeOf(q).prefix + '-' + L.codeOf(q).num] : []).filter(c => !DATA.some(r => r[0] === c));
    for (const c of [...new Set(missing)]) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = Core.t('notListed', { c }); res.append(p); }
    if (!list.length && !missing.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = Core.t('none'); res.append(p); }
    $('count').textContent = q.trim() ? Core.t('nRes', { n: list.length }) : '';
    const fv = $('favs'); fv.textContent = '';
    const fl = favs.map(c => DATA.find(r => r[0] === c)).filter(Boolean).map(L.entry);
    if (!fl.length) { const p = document.createElement('p'); p.className = 'muted'; p.style.margin = '0'; p.textContent = Core.t('noFav'); fv.append(p); }
    for (const e of fl) fv.append(card(e));
  }
  Core.init(DICT, render);
  $('q').value = Core.store('oraQ') || '';
  $('q').addEventListener('input', () => { Core.store('oraQ', $('q').value); render(); });
  render();
  Core.wirePro(SKU, owned => { isPro = owned; render(); });
})();
