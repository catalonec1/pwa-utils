/* Browser tests: serves the repo under /pwa-utils/ (like GitHub Pages) and drives each app in Chromium. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');
const { apps } = require('../tools/apps');

const ROOT = path.join(__dirname, '..');
const PREFIX = '/pwa-utils/';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (!p.startsWith(PREFIX)) { res.writeHead(404); return res.end(); }
      p = path.join(ROOT, p.slice(PREFIX.length));
      if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const PRO_STUB = () => {
  window.getDigitalGoodsService = async () => ({ listPurchases: async () => [{ itemId: 'pro', purchaseToken: 't' }] });
};
const STORE_NOT_OWNED_STUB = () => {
  window.getDigitalGoodsService = async () => ({ listPurchases: async () => [] });
};

let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log('ok   ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n     ')); }
}

async function newPage(browser, base, opts = {}) {
  const ctx = await browser.newContext({ locale: opts.locale || 'en-US', viewport: opts.viewport || { width: 1280, height: 800 }, serviceWorkers: opts.sw ? 'allow' : 'block' });
  if (opts.pro) await ctx.addInitScript(PRO_STUB);
  if (opts.storeNoPro) await ctx.addInitScript(STORE_NOT_OWNED_STUB);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.errors = errors;
  return { ctx, page };
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}${PREFIX}`;
  const browser = await chromium.launch();

  for (const a of apps) {
    await check(`${a.dir}: manifest is store-ready`, async () => {
      const m = JSON.parse(fs.readFileSync(path.join(ROOT, a.dir, 'manifest.webmanifest'), 'utf8'));
      for (const k of ['id', 'name', 'short_name', 'description', 'start_url', 'scope', 'display', 'background_color', 'theme_color', 'icons', 'screenshots', 'categories']) assert.ok(m[k], 'missing ' + k);
      assert.ok(m.short_name.length <= 12, 'short_name too long');
      const sizes = m.icons.map(i => i.sizes);
      assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
      assert.ok(m.icons.some(i => i.purpose === 'maskable'));
      for (const img of m.icons.concat(m.screenshots)) {
        const file = path.join(ROOT, a.dir, img.src);
        assert.ok(fs.existsSync(file), 'missing ' + img.src);
        const buf = fs.readFileSync(file);
        const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
        assert.equal(`${w}x${h}`, img.sizes, img.src + ' has wrong size');
      }
    });

    await check(`${a.dir}: loads without errors, phone width has no horizontal scroll`, async () => {
      const { ctx, page } = await newPage(browser, base, { viewport: { width: 360, height: 740 } });
      await page.goto(base + a.dir + '/');
      await page.waitForLoadState('networkidle');
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(sw <= 360, 'scrollWidth ' + sw);
      assert.deepEqual(page.errors, []);
      await ctx.close();
    });

    await check(`${a.dir}: language switch RO/RU`, async () => {
      const { ctx, page } = await newPage(browser, base, { locale: 'ro-RO' });
      await page.goto(base + a.dir + '/');
      const ro = await page.textContent('h1');
      assert.equal(await page.inputValue('#lang'), 'ro');
      await page.selectOption('#lang', 'ru');
      const ru = await page.textContent('h1');
      assert.notEqual(ro, ru);
      assert.match(ru, /[а-яА-Я]/);
      assert.equal(await page.evaluate(() => document.documentElement.lang), 'ru');
      await page.reload();
      assert.equal(await page.inputValue('#lang'), 'ru', 'language not remembered');
      await ctx.close();
    });

    await check(`${a.dir}: service worker makes it work offline`, async () => {
      const { ctx, page } = await newPage(browser, base, { sw: true });
      await page.goto(base + a.dir + '/');
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload();
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
      await ctx.setOffline(true);
      await page.reload();
      assert.ok((await page.textContent('h1')).length > 2);
      assert.deepEqual(page.errors.filter(e => !/ERR_INTERNET_DISCONNECTED/.test(e)), []);
      await ctx.close();
    });

    await check(`${a.dir}: Pro box says Store-only on the web, buy enabled inside Store`, async () => {
      let { ctx, page } = await newPage(browser, base);
      await page.goto(base + a.dir + '/');
      await page.waitForSelector('#proBox:not(.hidden)');
      assert.ok(await page.isDisabled('#proBuy'));
      assert.match(await page.textContent('#proStatus'), /Microsoft Store/);
      await ctx.close();
      ({ ctx, page } = await newPage(browser, base, { storeNoPro: true }));
      await page.goto(base + a.dir + '/');
      await page.waitForSelector('#proBox:not(.hidden)');
      await page.waitForFunction(() => !document.getElementById('proBuy').disabled);
      await ctx.close();
      ({ ctx, page } = await newPage(browser, base, { pro: true }));
      await page.goto(base + a.dir + '/');
      await page.waitForSelector('#proBox.hidden', { state: 'attached' });
      await ctx.close();
    });
  }

  await check('convertor: converts and lists all units', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base + 'convertor/');
    await page.fill('#value', '1');
    await page.selectOption('#from', 'km'); await page.selectOption('#to', 'mi');
    assert.equal(await page.textContent('#result'), '1 km = 0.6213711922 mi');
    await page.fill('#value', '2,5');
    assert.match(await page.textContent('#result'), /^2.5 km = 1.553427981 mi$/);
    await page.click('#swap');
    assert.match(await page.textContent('#result'), /^2.5 mi = 4.02336 km$/);
    await page.click('[data-cat="temperature"]');
    await page.fill('#value', '100');
    assert.equal(await page.textContent('#result'), '100 °C = 212 °F');
    assert.ok((await page.locator('#all li').count()) === 2);
    await page.fill('#value', 'abc');
    assert.equal(await page.textContent('#result'), 'Enter a number');
    assert.match(await page.textContent('[data-cat="pressure"]'), /🔒/);
    await page.click('[data-cat="pressure"]');
    assert.equal(await page.getAttribute('[data-cat="pressure"]', 'aria-selected'), 'false');
    await ctx.close();
  });

  await check('convertor: Pro unlocks categories and history', async () => {
    const { ctx, page } = await newPage(browser, base, { pro: true });
    await page.goto(base + 'convertor/');
    await page.waitForSelector('#proBox.hidden', { state: 'attached' });
    await page.click('[data-cat="fuel"]');
    await page.fill('#value', '5');
    assert.equal(await page.textContent('#result'), '5 L/100 km = 47.04291660 mpg (US)'.replace('47.04291660', '47.0429166'));
    await page.waitForSelector('#history li', { timeout: 4000 });
    assert.match(await page.textContent('#history li'), /mpg/);
    await page.reload();
    assert.equal(await page.getAttribute('[data-cat="fuel"]', 'aria-selected'), 'true');
    await ctx.close();
  });

  await check('focus: full work session moves to a short break and counts', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.clock.install({ time: new Date('2026-11-04T10:00:00') });
    await page.goto(base + 'focus/');
    assert.equal(await page.textContent('#clock'), '25:00');
    assert.equal(await page.textContent('#phase'), 'Focus');
    await page.click('#start');
    await page.clock.runFor(60 * 1000 + 300); // display refreshes every 250 ms
    assert.equal(await page.textContent('#clock'), '24:00');
    await page.click('#start'); // pause
    assert.equal(await page.textContent('#start'), 'Resume');
    await page.clock.runFor(5 * 60 * 1000);
    assert.equal(await page.textContent('#clock'), '24:00');
    await page.click('#start');
    await page.clock.runFor(24 * 60 * 1000 + 500);
    assert.equal(await page.textContent('#phase'), 'Short break');
    assert.equal(await page.textContent('#clock'), '05:00');
    assert.equal(await page.textContent('#today'), 'Today: 1 sessions, 25 min');
    await page.click('#skip');
    assert.equal(await page.textContent('#phase'), 'Focus');
    assert.ok(await page.isDisabled('#cfg-work'));
    assert.ok(await page.isDisabled('#csv'));
    await ctx.close();
  });

  await check('focus: free daily goal, progress and streak', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.clock.install({ time: new Date('2026-11-04T10:00:00') });
    await page.goto(base + 'focus/');
    assert.equal(await page.inputValue('#goal'), '4');
    assert.equal(await page.textContent('#streak'), 'Streak: 0 days in a row');
    await page.fill('#goal', '1'); await page.press('#goal', 'Tab');
    await page.click('#start');
    await page.clock.runFor(25 * 60 * 1000 + 500);
    assert.equal(await page.textContent('#streak'), "Streak: 1 days in a row · Today's goal reached!");
    assert.equal(await page.getAttribute('#goalBar', 'max'), '1');
    await page.reload();
    assert.equal(await page.inputValue('#goal'), '1');
    await ctx.close();
  });

  await check('focus: state survives reload while running', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.clock.install({ time: new Date('2026-11-04T10:00:00') });
    await page.goto(base + 'focus/');
    await page.click('#start');
    await page.clock.runFor(10 * 60 * 1000);
    await page.reload();
    await page.clock.runFor(1000);
    const left = await page.textContent('#clock');
    assert.match(left, /^14:[0-5]\d$/, 'expected about 15 min left, got ' + left);
    assert.equal(await page.textContent('#start'), 'Pause');
    await ctx.close();
  });

  await check('focus: Pro custom durations, stats and CSV export', async () => {
    const { ctx, page } = await newPage(browser, base, { pro: true });
    await page.clock.install({ time: new Date('2026-11-04T10:00:00') });
    await page.goto(base + 'focus/');
    await page.waitForFunction(() => !document.getElementById('cfg-work').disabled);
    await page.fill('#cfg-work', '2'); await page.press('#cfg-work', 'Tab');
    assert.equal(await page.textContent('#clock'), '02:00');
    await page.click('#start');
    await page.clock.runFor(2 * 60 * 1000 + 500);
    assert.equal(await page.textContent('#today'), 'Today: 1 sessions, 2 min');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csv')]);
    const csv = fs.readFileSync(await dl.path(), 'utf8');
    assert.equal(csv, 'date,sessions,minutes\n2026-11-04,1,2\n');
    assert.equal(await page.locator('#bars > div').count(), 7);
    await ctx.close();
  });

  await check('text: stats, operations and undo', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base + 'text/');
    await page.fill('#txt', 'banana\napple\nbanana\nCherry');
    assert.equal(await page.textContent('[data-stat="words"] strong'), '4');
    assert.equal(await page.textContent('[data-stat="lines"] strong'), '4');
    await page.click('[data-op="dedupe"]');
    assert.equal(await page.inputValue('#txt'), 'banana\napple\nCherry');
    await page.click('[data-op="sortAZ"]');
    assert.equal(await page.inputValue('#txt'), 'apple\nbanana\nCherry');
    await page.click('[data-op="upper"]');
    assert.equal(await page.inputValue('#txt'), 'APPLE\nBANANA\nCHERRY');
    await page.click('#undo');
    assert.equal(await page.inputValue('#txt'), 'apple\nbanana\nCherry');
    await page.reload();
    assert.equal(await page.inputValue('#txt'), 'apple\nbanana\nCherry', 'text not kept');
    assert.ok(await page.isDisabled('[data-op="b64encode"]'));
    assert.ok(await page.isDisabled('#doRepl'));
    await ctx.close();
  });

  await check('text: Pro regex, base64 and JSON with error message', async () => {
    const { ctx, page } = await newPage(browser, base, { pro: true });
    await page.goto(base + 'text/');
    await page.waitForFunction(() => !document.getElementById('doRepl').disabled);
    await page.fill('#txt', 'id 12, id 345');
    await page.fill('#find', '\\d+'); await page.fill('#repl', 'N');
    await page.click('#doRepl');
    assert.equal(await page.inputValue('#txt'), 'id N, id N');
    await page.click('[data-op="b64encode"]');
    assert.equal(await page.inputValue('#txt'), 'aWQgTiwgaWQgTg==');
    await page.click('[data-op="b64decode"]');
    assert.equal(await page.inputValue('#txt'), 'id N, id N');
    await page.click('[data-op="jsonFormat"]');
    assert.match(await page.textContent('#err'), /^Error: /);
    assert.equal(await page.inputValue('#txt'), 'id N, id N');
    await page.fill('#txt', 'mail a@b.ro, a@b.ro');
    await page.click('[data-op="extractEmails"]');
    assert.equal(await page.inputValue('#txt'), 'a@b.ro');
    await page.fill('#txt', '{"a":1}');
    await page.click('[data-op="jsonFormat"]');
    assert.equal(await page.inputValue('#txt'), '{\n  "a": 1\n}');
    assert.equal(await page.textContent('#err'), '');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('pass: generates with chosen sets, strength, check and Pro locked', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base + 'pass/');
    const a = await page.textContent('#out');
    assert.equal(a.length, 16);
    await page.click('#gen');
    assert.notEqual(await page.textContent('#out'), a);
    await page.uncheck('#symbols'); await page.uncheck('#upper'); await page.uncheck('#lower');
    await page.fill('#len', '30'); await page.dispatchEvent('#len', 'input');
    assert.match(await page.textContent('#out'), /^[0-9]{30}$/);
    assert.match(await page.textContent('#strength'), /^100 bits of entropy · very strong$/);
    await page.uncheck('#digits');
    assert.match(await page.textContent('#out'), /^[a-z]{30}$/, 'falls back to lowercase');
    await page.fill('#check', 'password1');
    assert.match(await page.textContent('#checkOut'), /weak/);
    await page.reload();
    assert.equal(await page.inputValue('#len'), '30', 'options not kept');
    assert.ok(await page.isDisabled('#bulk'));
    assert.ok(await page.isDisabled('#csv'));
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('pass: Pro passphrase list and CSV export', async () => {
    const { ctx, page } = await newPage(browser, base, { pro: true, locale: 'ro-RO' });
    await page.goto(base + 'pass/');
    await page.waitForFunction(() => !document.getElementById('bulk').disabled);
    await page.fill('#words', '4'); await page.fill('#count', '5');
    await page.click('#bulk');
    const list = (await page.inputValue('#list')).split('\n');
    assert.equal(list.length, 5);
    for (const l of list) assert.match(l, /^[A-Z][a-z]+\d*(-[A-Z][a-z]+\d*){3}$/);
    assert.match(await page.textContent('#listInfo'), /^5 parole/);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csv')]);
    const csv = fs.readFileSync(await dl.path(), 'utf8');
    assert.equal(csv.split('\r\n').length, 7);
    await page.selectOption('#kind', 'pin'); await page.fill('#words', '6');
    await page.click('#bulk');
    assert.match(await page.inputValue('#list'), /^(\d{6}\n){4}\d{6}$/);
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('days: between, add, about and Pro locked', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base + 'days/');
    await page.fill('#from', '2026-01-01'); await page.fill('#to', '2026-12-31');
    assert.equal(await page.textContent('#diffDays'), '364 days');
    assert.match(await page.textContent('#diffYmd'), /^0 years, 11 months, 30 days · 52 weeks and 0 days$/);
    await page.check('#incl');
    assert.equal(await page.textContent('#diffDays'), '365 days');
    await page.fill('#base', '2024-01-31'); await page.fill('#amount', '1'); await page.selectOption('#unit', 'm');
    assert.match(await page.textContent('#addOut'), /February 29, 2024/);
    await page.fill('#amount', '-10'); await page.selectOption('#unit', 'd');
    assert.match(await page.textContent('#addOut'), /January 21, 2024/);
    await page.fill('#info', '2021-01-03');
    assert.match(await page.textContent('#facts'), /Sunday.*53 \(2020\).*3 \/ 365/);
    assert.ok(await page.isDisabled('#hol'));
    assert.ok(await page.isDisabled('#cdAdd'));
    assert.equal(await page.textContent('#workOut'), '');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('days: Pro working days, countdowns and CSV', async () => {
    const { ctx, page } = await newPage(browser, base, { pro: true, locale: 'ro-RO' });
    await page.goto(base + 'days/');
    await page.waitForFunction(() => !document.getElementById('cdAdd').disabled);
    await page.fill('#from', '2026-12-21'); await page.fill('#to', '2026-12-28');
    await page.fill('#hol', '2026-12-25\nabc');
    assert.equal(await page.textContent('#workOut'), '4 zile lucrătoare');
    await page.fill('#base', '2026-12-24'); await page.fill('#amount', '1');
    assert.match(await page.textContent('#workAdd'), /\+1 zile lucrătoare de la 2026-12-24: .*28.*Nu am înțeles: abc/);
    await page.fill('#cdName', 'Revelion'); await page.fill('#cdDate', '2099-01-01');
    await page.click('#cdAdd');
    assert.match(await page.textContent('#cdList'), /Revelion · 2099-01-01 · peste \d+ zile/);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#cdCsv')]);
    assert.match(fs.readFileSync(await dl.path(), 'utf8'), /^name,date,days_left\r\nRevelion,2099-01-01,\d+\r\n$/);
    await page.reload();
    assert.match(await page.textContent('#cdList'), /Revelion/, 'countdown not kept');
    assert.equal(await page.inputValue('#hol'), '2026-12-25\nabc');
    await page.click('#cdList button');
    assert.match(await page.textContent('#cdList'), /Nicio numărătoare/);
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('hub and privacy pages load', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base);
    assert.equal(await page.locator('.apps a').count(), 8);
    for (const img of await page.locator('.apps img').all()) assert.ok(await img.evaluate(i => i.naturalWidth > 0));
    await page.goto(base + 'privacy.html');
    assert.match(await page.textContent('h1'), /Privacy/);
    await ctx.close();
  });

  await check('pct: free calculators and Pro locked', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base + 'pct/');
    assert.equal(await page.textContent('#ofOut'), '15% of 80 = 12');
    await page.fill('#isA', '1'); await page.fill('#isB', '3');
    assert.equal(await page.textContent('#isOut'), '1 is 33.33% of 3');
    await page.fill('#chA', '200'); await page.fill('#chB', '150');
    assert.equal(await page.textContent('#chOut'), '25% decrease');
    await page.fill('#chA', '0');
    assert.equal(await page.textContent('#chOut'), '—');
    await page.fill('#apX', '1,5'); await page.fill('#apP', '10');
    assert.equal(await page.textContent('#apOut'), '1.5 + 10% = 1.65');
    await page.fill('#dsPrice', '80'); await page.fill('#dsP', '15');
    assert.equal(await page.textContent('#dsOut'), 'You pay 68');
    assert.ok(await page.isDisabled('#vatX'));
    assert.ok(await page.isDisabled('#histSave'));
    assert.equal(await page.textContent('#vatOut'), '');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('pct: Pro VAT, tip, margin, compound and history CSV', async () => {
    const { ctx, page } = await newPage(browser, base, { pro: true, locale: 'ro-RO' });
    await page.goto(base + 'pct/');
    await page.waitForFunction(() => !document.getElementById('histSave').disabled);
    await page.fill('#vatX', '119'); await page.selectOption('#vatMode', 'gross');
    assert.equal(await page.textContent('#vatOut'), 'Fără taxă 100 · taxă 19 · cu taxă 119');
    await page.fill('#tipBill', '90'); await page.fill('#tipP', '10'); await page.fill('#tipN', '3');
    assert.equal(await page.textContent('#tipOut'), 'Bacșiș 9 · total 99 · 33 de persoană');
    await page.fill('#mgCost', '60'); await page.fill('#mgPrice', '100');
    assert.equal(await page.textContent('#mgOut'), 'Profit 40 · marjă 40% · adaos 66,67%');
    await page.fill('#mgPrice', '120');
    await page.click('#histSave');
    assert.match(await page.textContent('#histList'), /Profit 60 · marjă 50% · adaos 100%/);
    await page.fill('#cgP', '1000'); await page.fill('#cgR', '10'); await page.fill('#cgY', '2');
    assert.match(await page.textContent('#cgTable'), /1\.210/);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#histCsv')]);
    assert.match(fs.readFileSync(await dl.path(), 'utf8'), /^time,calculation,result\r\n[\d -:]+,Profit 60 · marjă 50% · adaos 100%,/);
    await page.reload();
    assert.match(await page.textContent('#histList'), /Profit 60/, 'history not kept');
    await page.click('#histClear');
    assert.match(await page.textContent('#histList'), /Nimic salvat/);
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('ora: search by code, words and pasted stack; Pro locked', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base + 'ora/');
    assert.match(await page.textContent('#results'), /Common errors \(free\):.*ORA-00001/s);
    await page.fill('#q', '942');
    assert.match(await page.textContent('#results'), /ORA-00942.*Cause:.*Fix:/s);
    await page.fill('#q', 'PLS-201');
    assert.match(await page.textContent('#results'), /PLS-00201.*The cause and fix for this error are in Pro\./s);
    await page.fill('#q', 'ORA-06512: at "HR.P", line 5\nORA-01403: no data found\nORA-99999: x');
    const t = await page.textContent('#results');
    assert.ok(t.indexOf('ORA-06512') < t.indexOf('ORA-01403'), 'stack order kept');
    assert.match(t, /ORA-99999 is not in the catalog yet\./);
    await page.fill('#q', 'qqzzxx');
    assert.match(await page.textContent('#results'), /Nothing found/);
    assert.ok(await page.locator('#results button').count() === 0 || await page.locator('#results button').first().isDisabled());
    await page.fill('#q', 'deadlock');
    assert.ok(await page.locator('#results button').first().isDisabled());
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('ora: Pro shows all fixes, favorites persist, Markdown copy', async () => {
    const { ctx, page } = await newPage(browser, base, { pro: true, locale: 'ro-RO' });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(base + 'ora/');
    await page.waitForFunction(() => !document.querySelector('#results button').disabled);
    await page.fill('#q', 'PLS-201');
    assert.match(await page.textContent('#results'), /PLS-00201.*Cauza:.*Soluția:/s);
    await page.click('#results .err button:has-text("Favorit")');
    assert.match(await page.textContent('#favs'), /PLS-00201/);
    await page.click('#results .err button:has-text("Markdown")');
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^\*\*PLS-00201: .*\*\*\n\nCause: /);
    await page.reload();
    await page.waitForFunction(() => document.getElementById('favs').textContent.includes('PLS-00201'));
    assert.equal(await page.inputValue('#q'), 'PLS-201');
    await page.click('#favs .err button:has-text("Scoate")');
    assert.match(await page.textContent('#favs'), /Apasă ☆/);
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('json: validates with line/column, formats, minifies, tree; Pro locked', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base + 'json/');
    assert.match(await page.inputValue('#src'), /"items"/, 'sample not loaded');
    assert.equal(await page.textContent('#status'), '✓ Valid JSON');
    assert.match(await page.textContent('#stats'), /Keys 20.*Depth 3.*minified 280 B/s);
    await page.fill('#src', '{"b":1,\n"a":[1,2,]}');
    await page.waitForFunction(() => /Line/.test(document.getElementById('status').textContent));
    assert.equal(await page.textContent('#status'), '✗ Line 2, column 10: trailing comma before “]”');
    assert.equal(await page.textContent('#errCtx'), '"a":[1,2,]}\n         ^');
    await page.click('#goErr');
    assert.equal(await page.evaluate(() => document.getElementById('src').selectionStart), 17);
    await page.fill('#src', '{"b":1,"a":{"c":[1,2]}}');
    await page.waitForFunction(() => /Valid/.test(document.getElementById('status').textContent));
    await page.check('#sortKeys'); await page.selectOption('#indent', '4');
    await page.click('#fmt');
    assert.equal(await page.inputValue('#src'), '{\n    "a": {\n        "c": [\n            1,\n            2\n        ]\n    },\n    "b": 1\n}');
    await page.click('#min');
    assert.equal(await page.inputValue('#src'), '{"a":{"c":[1,2]},"b":1}');
    await page.click('#expand');
    await page.click('#tree .k:text-is("\\"c\\"")');
    assert.equal(await page.textContent('#treePath'), '$.a.c');
    assert.match(await page.textContent('#tree'), /\[ 2 items \]/);
    for (const id of ['#qPath', '#cvRun', '#diffRun', '#escBtn', '#snipSave']) assert.ok(await page.isDisabled(id), id + ' should be locked');
    assert.equal(await page.textContent('#qOut'), '');
    await page.reload();
    assert.equal(await page.inputValue('#src'), '{"a":{"c":[1,2]},"b":1}', 'editor not kept');
    assert.equal(await page.inputValue('#indent'), '4');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('json: Pro query, YAML/CSV, diff, escape and snippets', async () => {
    const { ctx, page } = await newPage(browser, base, { pro: true, locale: 'ro-RO' });
    await page.goto(base + 'json/');
    await page.waitForFunction(() => !document.getElementById('qPath').disabled);
    const doc = '{"items":[{"sku":"A-1","status":"active","qty":3},{"sku":"B-2","status":"archived","qty":0}]}';
    await page.fill('#src', doc);
    await page.waitForFunction(() => /valid/.test(document.getElementById('status').textContent));
    await page.fill('#qPath', "$.items[?(@.status=='active')].sku");
    assert.equal(await page.textContent('#qMsg'), '1 rezultate');
    assert.equal(await page.textContent('#qOut'), '"A-1"');
    await page.fill('#qPath', '$..qty'); await page.check('#qWithPaths');
    assert.equal(await page.textContent('#qOut'), '$.items[0].qty = 3\n$.items[1].qty = 0');
    await page.fill('#qPath', '$.items[');
    assert.match(await page.textContent('#qMsg'), /Cale invalidă/);
    await page.click('#cvRun');
    assert.equal(await page.textContent('#cvOut'), 'items:\n- sku: A-1\n  status: active\n  qty: 3\n- sku: B-2\n  status: archived\n  qty: 0\n');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#cvDl')]);
    assert.equal(dl.suggestedFilename(), 'data.yaml');
    await page.selectOption('#cvMode', 'json2csv');
    assert.equal(await page.textContent('#cvOut'), 'sku,status,qty\nA-1,active,3\nB-2,archived,0');
    await page.fill('#src', 'name: Ana\nlangs: [ro, en]\nage: 30');
    await page.selectOption('#cvMode', 'yaml2json'); await page.click('#cvRun');
    await page.click('#cvUse');
    await page.waitForFunction(() => /valid/.test(document.getElementById('status').textContent));
    assert.equal(await page.inputValue('#src'), '{\n  "name": "Ana",\n  "langs": [\n    "ro",\n    "en"\n  ],\n  "age": 30\n}');
    await page.fill('#diffB', '{"name":"Ana","langs":["ro"],"age":31,"city":"Iași"}');
    await page.click('#diffRun');
    assert.equal(await page.textContent('#diffSum'), '1 adăugate · 1 eliminate · 1 modificate');
    assert.deepEqual(await page.locator('#diffOut li').allTextContents(), ['− $.langs[1]: "en"', '~ $.age: 30 → 31', '+ $.city: "Iași"']);
    await page.fill('#escIn', 'a "b"\nc');
    await page.click('#escBtn');
    assert.equal(await page.textContent('#escOut'), '"a \\"b\\"\\nc"');
    await page.fill('#escIn', '\\u0103\\t!'); await page.click('#unescBtn');
    assert.equal(await page.textContent('#escOut'), 'ă\t!');
    await page.fill('#snipName', 'profil'); await page.click('#snipSave');
    await page.fill('#src', '[]');
    await page.reload();
    await page.waitForFunction(() => !document.getElementById('snipSave').disabled);
    assert.match(await page.textContent('#snipList'), /profil/);
    await page.click('#snipList button:has-text("Încarcă")');
    assert.match(await page.inputValue('#src'), /"Ana"/);
    await page.click('#snipList button:has-text("Șterge")');
    assert.match(await page.textContent('#snipList'), /Niciun fragment/);
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await browser.close();
  srv.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
