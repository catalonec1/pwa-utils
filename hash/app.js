(function () {
  'use strict';
  const SKU = 'pro';
  const DICT = {
    ro: { appName: 'Generator de hash', textLabel: 'Text pentru hash', textPh: 'Scrie sau lipește text', output: 'Format', upper: 'Majuscule', bytes: '{n} octeți (UTF-8)', cmpTitle: 'Compară cu un hash așteptat', cmpPh: 'Lipește hash-ul pe care îl aștepți', cmpMatch: '✓ Se potrivește: {alg}', cmpNo: '✗ Nu se potrivește (pare {alg})', cmpUnknown: 'Nu arată ca un hash cunoscut (hex sau Base64).',
      fileTitle: 'Hash și verificare pentru fișiere', dropHint: 'Trage fișierele aici sau apasă pentru a alege. Fișierele sunt citite pe acest dispozitiv și nu sunt încărcate nicăieri.', algorithm: 'Algoritm', stop: 'Oprește', csv: 'Salvează CSV', sumsLabel: 'Checksum așteptat (opțional)', sumsPh: 'Lipește un hash, o linie .sha256 sau conținutul SHA256SUMS', hashing: 'Se calculează {name}… {p}%', fileOk: '✓ Se potrivește cu {alg} așteptat', fileBad: '✗ NU se potrivește cu {alg} așteptat', fileNoEntry: 'Nu există checksum așteptat pentru acest fișier', stopped: 'Oprit', readErr: 'Fișierul nu a putut fi citit', sumsLoaded: 'Checksum-uri încărcate din {name}',
      hmacTitle: 'HMAC', hmacHint: 'Semnează textul de mai sus cu o cheie secretă. Cheia nu este salvată.', key: 'Cheie secretă', keyIs: 'Cheia este', keyText: 'text', badHex: 'Cheia nu este hex valid.', batchTitle: 'Lot: câte un hash pe linie', batchPh: 'O valoare pe linie', batchCount: '{n} linii', proPitch: 'Hash și verificare pentru fișiere de orice mărime, liste de checksum-uri, HMAC cu cheie secretă și hash pe loturi cu export CSV.', note: 'MD5, SHA-1 și CRC32 sunt bune pentru a găsi descărcări deteriorate, nu pentru securitate. Folosește SHA-256 sau mai puternic.' },
    en: { appName: 'Hash Generator', textLabel: 'Text to hash', textPh: 'Type or paste text', output: 'Output', upper: 'Uppercase', bytes: '{n} bytes (UTF-8)', cmpTitle: 'Compare with an expected hash', cmpPh: 'Paste the hash you expect', cmpMatch: '✓ Match: {alg}', cmpNo: '✗ No match (looks like {alg})', cmpUnknown: 'Not a recognised hash (hex or Base64).',
      fileTitle: 'Hash and verify files', dropHint: 'Drop files here or click to choose. Files are read on this device and never uploaded.', algorithm: 'Algorithm', stop: 'Stop', csv: 'Save CSV', sumsLabel: 'Expected checksum (optional)', sumsPh: 'Paste a hash, a .sha256 line or SHA256SUMS contents', hashing: 'Hashing {name}… {p}%', fileOk: '✓ Matches the expected {alg}', fileBad: '✗ Does NOT match the expected {alg}', fileNoEntry: 'No expected checksum for this file', stopped: 'Stopped', readErr: 'The file could not be read', sumsLoaded: 'Checksums loaded from {name}',
      hmacTitle: 'HMAC', hmacHint: 'Signs the text above with a secret key. The key is not saved.', key: 'Secret key', keyIs: 'Key is', keyText: 'text', badHex: 'The key is not valid hex.', batchTitle: 'Batch: one hash per line', batchPh: 'One value per line', batchCount: '{n} lines', proPitch: 'Hash and verify files of any size, checksum lists, HMAC with a secret key and batch hashing with CSV export.', note: 'MD5, SHA-1 and CRC32 are fine for spotting damaged downloads, not for security. Use SHA-256 or stronger.' },
    ru: { appName: 'Генератор хешей', textLabel: 'Текст для хеширования', textPh: 'Введите или вставьте текст', output: 'Формат', upper: 'Заглавные', bytes: '{n} байт (UTF-8)', cmpTitle: 'Сравнить с ожидаемым хешем', cmpPh: 'Вставьте ожидаемый хеш', cmpMatch: '✓ Совпадает: {alg}', cmpNo: '✗ Не совпадает (похоже на {alg})', cmpUnknown: 'Не похоже на известный хеш (hex или Base64).',
      fileTitle: 'Хеш и проверка файлов', dropHint: 'Перетащите файлы сюда или нажмите, чтобы выбрать. Файлы читаются на этом устройстве и никуда не загружаются.', algorithm: 'Алгоритм', stop: 'Стоп', csv: 'Сохранить CSV', sumsLabel: 'Ожидаемая контрольная сумма (необязательно)', sumsPh: 'Вставьте хеш, строку .sha256 или содержимое SHA256SUMS', hashing: 'Вычисляется {name}… {p}%', fileOk: '✓ Совпадает с ожидаемым {alg}', fileBad: '✗ НЕ совпадает с ожидаемым {alg}', fileNoEntry: 'Нет ожидаемой суммы для этого файла', stopped: 'Остановлено', readErr: 'Не удалось прочитать файл', sumsLoaded: 'Контрольные суммы загружены из {name}',
      hmacTitle: 'HMAC', hmacHint: 'Подписывает текст выше секретным ключом. Ключ не сохраняется.', key: 'Секретный ключ', keyIs: 'Ключ', keyText: 'текст', badHex: 'Ключ — не корректный hex.', batchTitle: 'Пакет: хеш для каждой строки', batchPh: 'Одно значение на строку', batchCount: 'Строк: {n}', proPitch: 'Хеш и проверка файлов любого размера, списки контрольных сумм, HMAC с секретным ключом и пакетное хеширование с экспортом CSV.', note: 'MD5, SHA-1 и CRC32 подходят для поиска повреждённых загрузок, но не для защиты. Используйте SHA-256 или надёжнее.' }
  };
  const H = HashKit;
  const $ = id => document.getElementById(id);
  const CHUNK = 4 << 20, BATCH_MAX = 10000, BATCH_SHOW = 300;
  let isPro = false, textRes = {}, textLen = 0, textSeq = 0, hmacSeq = 0, entries = [];
  let files = [], busy = false, stopReq = false;

  const fmt = b => H.format(b, $('fmt').value, $('upper').checked);
  function size(n) { return new Intl.NumberFormat(Core.lang, { maximumFractionDigits: 1 }).format(n < 1024 ? n : n < 1048576 ? n / 1024 : n < 1073741824 ? n / 1048576 : n / 1073741824) + ' ' + (n < 1024 ? 'B' : n < 1048576 ? 'KB' : n < 1073741824 ? 'MB' : 'GB'); }
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function copyBtn(get) {
    const b = el('button', null, Core.t('copy'));
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(get()); b.textContent = Core.t('copied'); setTimeout(() => { b.textContent = Core.t('copy'); }, 1200); } catch (e) { /* fără clipboard */ }
    });
    return b;
  }
  function hashRow(alg, bytes) {
    const li = el('li'), v = fmt(bytes);
    li.append(el('span', 'alg', H.NAMES[alg]), el('code', null, v), copyBtn(() => v));
    return li;
  }
  function download(name, text) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---- text (gratuit) ---- */
  async function hashText() {
    const seq = ++textSeq, bytes = H.utf8($('text').value);
    const res = {};
    for (const a of H.ALGS) res[a] = await H.digest(a, bytes);
    if (seq !== textSeq) return;
    textRes = res; textLen = bytes.length;
    renderText(); compare(); hmac();
  }
  function renderText() {
    const ul = $('hashes'); ul.textContent = '';
    $('bytes').textContent = Core.t('bytes', { n: new Intl.NumberFormat(Core.lang).format(textLen) });
    for (const a of H.ALGS) if (textRes[a]) ul.append(hashRow(a, textRes[a]));
  }
  function compare() {
    const out = $('cmpOut'), r = H.compare($('expected').value, textRes);
    out.className = 'st' + (r ? (r.match ? ' ok' : ' bad') : '');
    out.textContent = !$('expected').value.trim() ? '' : !r ? Core.t('cmpUnknown') : Core.t(r.match ? 'cmpMatch' : 'cmpNo', { alg: H.NAMES[r.alg] });
  }

  /* ---- fișiere (Pro) ---- */
  function wanted(f) {
    const s = new Set([$('fileAlg').value]), e = H.entryFor(entries, f.file.name);
    if (e) s.add(e.alg);
    return [...s].filter(a => !f.res[a]);
  }
  async function run() {
    if (busy || !isPro) return;
    busy = true; stopReq = false;
    files.forEach(f => { f.stopped = false; });
    $('fileStop').classList.remove('hidden');
    for (const f of files) {
      const need = wanted(f);
      if (!need.length || f.err) continue;
      const hs = need.map(H.createHasher), total = f.file.size;
      $('progBox').classList.remove('hidden');
      try {
        for (let off = 0; off < total && !stopReq;) {
          const buf = new Uint8Array(await f.file.slice(off, off + CHUNK).arrayBuffer());
          for (const h of hs) h.update(buf);
          off += buf.length;
          $('prog').value = off / total;
          $('progTxt').textContent = Core.t('hashing', { name: f.file.name, p: Math.floor(off / total * 100) });
        }
        if (stopReq) { f.stopped = true; break; }
        need.forEach((a, i) => { f.res[a] = hs[i].digest(); });
      } catch (e) { f.err = true; }
      renderFiles();
    }
    busy = false;
    $('fileStop').classList.add('hidden'); $('progBox').classList.add('hidden');
    renderFiles();
    if (!stopReq && files.some(f => !f.err && wanted(f).length)) run(); // setările s-au schimbat între timp
  }
  function renderFiles() {
    const box = $('fileList'); box.textContent = '';
    for (const f of files) {
      const d = el('div', 'file'), ul = el('ul', 'hl');
      d.append(el('div', 'fn', f.file.name + ' · ' + size(f.file.size)));
      for (const a of H.ALGS) if (f.res[a]) ul.append(hashRow(a, f.res[a]));
      d.append(ul);
      const e = H.entryFor(entries, f.file.name), st = el('p', 'st');
      if (f.err) { st.textContent = Core.t('readErr'); st.classList.add('bad'); }
      else if (e && f.res[e.alg]) {
        const ok = H.toHex(f.res[e.alg]) === e.hash;
        st.textContent = Core.t(ok ? 'fileOk' : 'fileBad', { alg: H.NAMES[e.alg] }); st.classList.add(ok ? 'ok' : 'bad');
      } else if (f.stopped) st.textContent = Core.t('stopped');
      else if (entries.length && !e) { st.textContent = Core.t('fileNoEntry'); st.classList.add('muted'); }
      if (st.textContent) d.append(st);
      box.append(d);
    }
  }
  const SUMS_FILE = /\.(md5|sha1|sha256|sha384|sha512)$|sums?(\.txt)?$/i;
  async function addFiles(list) {
    if (!isPro) return;
    for (const file of list) {
      if (SUMS_FILE.test(file.name) && file.size < 1048576) {
        const t = await file.text();
        if (H.parseSums(t).length) {
          $('sums').value = ($('sums').value.trim() ? $('sums').value.trim() + '\n' : '') + t.trim();
          $('progTxt').textContent = Core.t('sumsLoaded', { name: file.name });
          sumsChanged(); continue;
        }
      }
      files.push({ file, res: {} });
    }
    renderFiles(); run();
  }
  function sumsChanged() { entries = H.parseSums($('sums').value); renderFiles(); run(); }

  /* ---- HMAC (Pro) ---- */
  async function hmac() {
    const out = $('hmacOut'), alg = $('hmacAlg').value, seq = ++hmacSeq;
    $('hmacName').textContent = 'HMAC-' + H.NAMES[alg];
    if (!isPro) { out.textContent = ''; return; }
    const key = $('hmacKeyFmt').value === 'hex' ? H.fromHex($('hmacKey').value) : H.utf8($('hmacKey').value);
    if (!key) { out.textContent = Core.t('badHex'); return; }
    const r = await H.hmac(alg, key, H.utf8($('text').value));
    if (seq === hmacSeq) out.textContent = fmt(r);
  }

  /* ---- lot (Pro) ---- */
  let batchRows = [];
  function batch() {
    const t = $('batchOut'); t.textContent = '';
    batchRows = isPro ? H.batch($('batch').value.split('\n').slice(0, BATCH_MAX).join('\n'), $('batchAlg').value, $('fmt').value, $('upper').checked) : [];
    $('batchCount').textContent = batchRows.length ? Core.t('batchCount', { n: batchRows.length }) : '';
    for (const r of batchRows.slice(0, BATCH_SHOW)) {
      const tr = el('tr'); tr.append(el('td', null, r.line), el('td', null, r.hash)); t.append(tr);
    }
  }

  function all() { renderText(); compare(); renderFiles(); hmac(); batch(); }
  const PRO_IDS = ['files', 'fileAlg', 'fileCsv', 'fileClear', 'fileStop', 'sums', 'hmacKey', 'hmacKeyFmt', 'hmacAlg', 'hmacCopy', 'batch', 'batchAlg', 'batchCsv'];
  function lockPro() {
    PRO_IDS.forEach(id => { $(id).disabled = !isPro; });
    $('drop').setAttribute('aria-disabled', String(!isPro));
    all(); run();
  }

  /* ---- pornire ---- */
  for (const id of ['fileAlg', 'batchAlg']) for (const a of H.ALGS) { const o = el('option', null, H.NAMES[a]); o.value = a; $(id).append(o); }
  const keep = { text: 'hashText', expected: 'hashCmp', fmt: 'hashFmt', batch: 'hashBatch', fileAlg: 'hashFileAlg', batchAlg: 'hashBatchAlg', hmacAlg: 'hashHmacAlg' };
  for (const id in keep) {
    const v = Core.store(keep[id]);
    if (v != null) $(id).value = v;
    if ($(id).tagName === 'SELECT' && $(id).selectedIndex < 0) $(id).selectedIndex = 0;
  }
  $('upper').checked = Core.store('hashUpper') === '1';
  const save = id => Core.store(keep[id], $(id).value);
  function upd() { $('upper').disabled = $('fmt').value === 'base64'; }

  Core.init(DICT, all);
  upd(); lockPro(); hashText();
  $('text').addEventListener('input', () => { save('text'); hashText(); });
  $('expected').addEventListener('input', () => { save('expected'); compare(); });
  for (const id of ['fmt', 'upper']) $(id).addEventListener('change', () => { save('fmt'); Core.store('hashUpper', $('upper').checked ? '1' : '0'); upd(); all(); });
  $('fileAlg').addEventListener('change', () => { save('fileAlg'); renderFiles(); run(); });
  $('sums').addEventListener('input', sumsChanged);
  $('files').addEventListener('change', e => { addFiles([...e.target.files]); e.target.value = ''; });
  const drop = $('drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); if (isPro) drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
  $('fileStop').addEventListener('click', () => { stopReq = true; });
  $('fileClear').addEventListener('click', () => { stopReq = true; files = []; $('progTxt').textContent = ''; renderFiles(); });
  $('fileCsv').addEventListener('click', () => {
    if (!isPro || !files.length) return;
    const rows = [];
    for (const f of files) {
      const e = H.entryFor(entries, f.file.name);
      for (const a of H.ALGS) if (f.res[a]) rows.push([f.file.name, f.file.size, H.NAMES[a], fmt(f.res[a]), e && e.alg === a ? e.hash : '', e && e.alg === a ? (H.toHex(f.res[a]) === e.hash ? 'match' : 'mismatch') : '']);
    }
    download('file-hashes.csv', H.toCsv(['file', 'size', 'algorithm', 'hash', 'expected', 'result'], rows));
  });
  for (const id of ['hmacKey', 'hmacKeyFmt', 'hmacAlg']) $(id).addEventListener('input', () => { if (id === 'hmacAlg') save(id); hmac(); });
  $('hmacCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('hmacOut').textContent); $('hmacCopy').textContent = Core.t('copied'); setTimeout(() => { $('hmacCopy').textContent = Core.t('copy'); }, 1200); } catch (e) { /* fără clipboard */ }
  });
  $('batch').addEventListener('input', () => { save('batch'); batch(); });
  $('batchAlg').addEventListener('change', () => { save('batchAlg'); batch(); });
  $('batchCsv').addEventListener('click', () => {
    if (!isPro || !batchRows.length) return;
    const n = H.NAMES[$('batchAlg').value];
    download('batch-hashes.csv', H.toCsv(['text', 'algorithm', 'hash'], batchRows.map(r => [r.line, n, r.hash])));
  });
  Core.wirePro(SKU, owned => { isPro = owned; lockPro(); });
})();
