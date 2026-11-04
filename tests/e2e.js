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
    await page.fill('#txt', '{"a":1}');
    await page.click('[data-op="jsonFormat"]');
    assert.equal(await page.inputValue('#txt'), '{\n  "a": 1\n}');
    assert.equal(await page.textContent('#err'), '');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  await check('hub and privacy pages load', async () => {
    const { ctx, page } = await newPage(browser, base);
    await page.goto(base);
    assert.equal(await page.locator('.apps a').count(), 3);
    for (const img of await page.locator('.apps img').all()) assert.ok(await img.evaluate(i => i.naturalWidth > 0));
    await page.goto(base + 'privacy.html');
    assert.match(await page.textContent('h1'), /Privacy/);
    await ctx.close();
  });

  await browser.close();
  srv.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
