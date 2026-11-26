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
    state: JSON.stringify({ phase: 'work', workDone: 2, endAt: null, remaining: 1004 }),
    tasks: JSON.stringify([{ id: 'a', text: 'Quarterly report', done: false, pomos: 2 }, { id: 'b', text: 'Reply to emails', done: true, pomos: 1 }, { id: 'c', text: 'Study: chapter 4', done: false, pomos: 0 }]),
    curTask: JSON.stringify('a')
  },
  days: { daysCd: JSON.stringify([{ name: 'New Year', date: '2027-01-01' }, { name: 'Vacation', date: '2027-07-15' }]), daysHol: '2026-12-25\n2027-01-01' },
  pct: { pctHist: JSON.stringify([{ time: '2026-11-24 10:15', calc: 'Profit 40 · margin 40% · markup 66.67%', result: '66.67%' }]) },
  hash: { hashText: 'Hello, world!', hashCmp: '315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3', hashBatch: 'alpha\nbeta\ngamma' },
  ora: { oraQ: 'ORA-06512: at "HR.PAYROLL", line 42\nORA-01403: no data found' },
  pass: { passOpts: JSON.stringify({ length: 20, lower: true, upper: true, digits: true, symbols: true, noSimilar: false }) },
  loan: {
    loanIn: JSON.stringify({ amt: '250000', rate: '5.9', term: '25', termUnit: 'y', type: 'annuity', cur: '€', solveMode: 'term', solvePay: '2000', ones: [] }),
    loanSaved: JSON.stringify([{ name: 'Apartment', in: { amt: '250000', rate: '5.9', term: '25', termUnit: 'y', cur: '€' } }, { name: 'Car', in: { amt: '18000', rate: '8.5', term: '60', termUnit: 'm', cur: '€' } }])
  },
  color: { colorCur: 'rgb(214, 51, 108)', colorFg: '#ffffff', colorBg: '#1864ab', colorScheme: 'tints' },
  json: {
    jsonSrc: '{\n  "order": "SO-2026-1187",\n  "customer": { "name": "Ana Pop", "city": "Chișinău", "vip": true },\n  "items": [\n    { "sku": "KB-104", "status": "active", "qty": 2, "price": 49.9 },\n    { "sku": "MS-220", "status": "backorder", "qty": 1, "price": 19.5 },\n    { "sku": "HD-310", "status": "active", "qty": 1, "price": 89 }\n  ],\n  "total": 208.3,\n  "paid": false,\n  "note": null\n}',
    jsonQ: "$.items[?(@.status=='active')].sku",
    jsonSnips: JSON.stringify([{ name: 'order-api-response', text: '{"ok":true}', time: '2026-11-24 10:15' }])
  },
  pick: {
    pickList: 'Andrei\nBianca\nCristian\nDaria\nEmil\nFlorina\nGabriel\nIoana\nLuca\nMara',
    pickLast: JSON.stringify({ kind: 'pick', names: ['Daria'], left: null }),
    pickOpts: JSON.stringify({ count: 1, unique: true, teamMode: 'count', teamN: 3, diceN: 3, diceS: '6', numMin: '1', numMax: '100' })
  },
  regex: { rxState: JSON.stringify({ p: '(?<level>ERROR|WARN)\\s+\\[(?<module>[\\w.]+)\\]\\s+(.+)', f: 'gm', text: '2026-11-26 09:41:07 INFO  [app.start] Server listening on port 8080\n2026-11-26 09:41:12 WARN  [db.pool] Slow query: 1850 ms\n2026-11-26 09:42:03 INFO  [auth] User signed in\n2026-11-26 09:43:55 ERROR [mail.send] Connection refused (smtp.example.com:587)\n2026-11-26 09:44:10 WARN  [cache] Hit ratio below 60%', repl: '$<module>: $3' }) },
  sql: { sqlSrc: "select e.employee_id, e.last_name as name, d.department_name, case when e.salary > 10000 then 'senior' else 'regular' end as band, count(*) over (partition by d.department_id) dept_size\nfrom employees e join departments d on d.department_id = e.department_id left join locations l on l.location_id = d.location_id\nwhere e.hire_date >= date '2024-01-01' and d.location_id in (1700, 1800) -- active sites\nand e.manager_id = :mgr_id and e.status not in (select code from inactive_codes)\norder by e.last_name;", sqlOpts: JSON.stringify({ mode: 'format', kwCase: 'upper', commas: 'trailing', indent: '2' }) },
  text: { text: 'Grădina de stele — notes\n\nbanana\napple\nbanana\nCherry\nΣ unicode ✓ привет мир\n\nPaste any text here: count words, change case, sort and clean lines.' }
};

/* habit: ~6 weeks of history relative to today, deterministic pseudo-random, Pro shown (colors, emoji, stats) */
function habitSample() {
  const p2 = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const defs = [
    { id: 'read', name: { en: 'Read 20 pages', ro: 'Citit 20 de pagini', ru: 'Читать 20 страниц' }, emoji: '📚', color: '#d6336c', p: 0.85, sched: { t: 'daily' } },
    { id: 'walk', name: { en: 'Walk 30 minutes', ro: 'Plimbare 30 de minute', ru: 'Прогулка 30 минут' }, emoji: '🚶', color: '#2b8a3e', p: 0.75, sched: { t: 'daily' } },
    { id: 'water', name: { en: '8 glasses of water', ro: '8 pahare de apă', ru: '8 стаканов воды' }, emoji: '💧', color: '#1971c2', p: 0.9, sched: { t: 'daily' } },
    { id: 'gym', name: { en: 'Gym', ro: 'Sală', ru: 'Спортзал' }, emoji: '🏋️', color: '#e8590c', p: 0.9, sched: { t: 'days', d: [1, 3, 5] } },
    { id: 'lang', name: { en: 'Spanish lesson', ro: 'Lecție de spaniolă', ru: 'Урок испанского' }, emoji: '🗣️', color: '#7048e8', p: 0.45, sched: { t: 'times', n: 3 } }
  ];
  const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 44);
  const created = key(start);
  const out = {};
  for (const lang of ['en', 'ro', 'ru']) {
    seed = 7;
    const habits = defs.map(h => ({ id: h.id, name: h.name[lang], emoji: h.emoji, color: h.color, sched: h.sched, created, done: {}, notes: {} }));
    for (let i = 0; i <= 44; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), k = key(d);
      defs.forEach((h, j) => {
        const r = rnd();
        if (h.sched.t === 'days' && !h.sched.d.includes(d.getDay())) return;
        if (i === 44 && j >= 2) return; // azi: încă de făcut
        if (r < h.p || (i > 36 && j < 2)) habits[j].done[k] = 1;
      });
    }
    habits[0].notes[key(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))] = { en: 'Finished the first part of the book.', ro: 'Am terminat prima parte a cărții.', ru: 'Дочитал первую часть книги.' }[lang];
    out[lang] = { hbData: JSON.stringify({ v: 1, habits }), 'pro:pro': '1' };
  }
  return out;
}
const HABIT = habitSample();

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
    const data = Object.assign({ lang }, a.dir === 'habit' ? HABIT[lang] : SAMPLE[a.dir]);
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
