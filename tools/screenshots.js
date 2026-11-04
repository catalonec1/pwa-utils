/* Renders manifest screenshots (icons/screenshot-*.png) and Store listing screenshots (store/<app>/<lang>-*.png). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { apps } = require('./apps');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const SAMPLE = {
  convertor: { cat: 'length' },
  focus: {
    state: JSON.stringify({ phase: 'work', workDone: 2, endAt: null, remaining: 1004 })
  },
  text: { text: 'Grădina de stele — notes\n\nbanana\napple\nbanana\nCherry\nΣ unicode ✓ привет мир\n\nPaste any text here: count words, change case, sort and clean lines.' }
};

(async () => {
  const srv = http.createServer((req, res) => {
    let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch();

  async function shot(a, lang, w, h, file, theme) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: lang, serviceWorkers: 'block', colorScheme: theme || 'light' });
    const data = Object.assign({ lang }, SAMPLE[a.dir]);
    await ctx.addInitScript(d => { for (const k in d) localStorage.setItem(k, d[k]); }, data);
    const page = await ctx.newPage();
    await page.goto(base + a.dir + '/');
    if (a.dir === 'convertor') { await page.fill('#value', '42'); }
    if (a.dir === 'focus') {
      const d = new Date(); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      await page.evaluate(k => { localStorage.setItem('stats', JSON.stringify({ [k]: { sessions: 2, minutes: 50 } })); }, k);
      await page.reload();
      await page.evaluate(() => localStorage.removeItem('stats'));
    }
    await page.waitForTimeout(300);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file });
    await ctx.close();
  }

  for (const a of apps) {
    await shot(a, 'en', 1366, 768, path.join(ROOT, a.dir, 'icons', 'screenshot-wide.png'));
    await shot(a, 'en', 412, 915, path.join(ROOT, a.dir, 'icons', 'screenshot-narrow.png'));
    for (const lang of ['en', 'ro', 'ru']) {
      await shot(a, lang, 1366, 768, path.join(ROOT, 'store', a.dir, `${lang}-1-light.png`));
      await shot(a, lang, 1366, 768, path.join(ROOT, 'store', a.dir, `${lang}-2-dark.png`), 'dark');
    }
    fs.copyFileSync(path.join(ROOT, a.dir, 'icons', 'store-300.png'), path.join(ROOT, 'store', a.dir, 'logo-300.png'));
  }
  await browser.close();
  srv.close();
  console.log('screenshots done');
})().catch(e => { console.error(e); process.exit(1); });
