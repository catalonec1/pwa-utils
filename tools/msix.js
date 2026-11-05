/* Asks the PWABuilder Microsoft Store service for Store packages of every app.
   Runs in GitHub Actions (the service is not reachable from every network).
   Output: msix/<dir>.zip with .msixbundle + .classic.appxbundle. */
const fs = require('fs');
const path = require('path');
const cfg = require('./apps');
const ENDPOINT = 'https://pwabuilder-windows-docker.azurewebsites.net/msix/generatezip';
const OUT = path.join(__dirname, '..', 'msix');

async function build(a) {
  const url = cfg.baseUrl + a.dir + '/';
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', a.dir, 'manifest.webmanifest'), 'utf8'));
  const body = {
    name: a.name,
    packageId: a.packageId,
    url,
    version: cfg.version,
    allowSigning: true,
    publisher: cfg.publisher,
    generateModernPackage: true,
    classicPackage: { generate: true, version: '1.0.0', url },
    edgeHtmlPackage: { generate: false },
    manifestUrl: url + 'manifest.webmanifest',
    startUrl: url,
    resourceLanguage: 'EN-US',
    manifest,
    images: { baseImage: url + 'icons/icon-512.png', backgroundColor: 'transparent', padding: 0.3 }
  };
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const buf = Buffer.from(await res.arrayBuffer());
  if (!res.ok) throw new Error(`${a.dir}: HTTP ${res.status} ${buf.toString('utf8').slice(0, 800)}`);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, a.dir + '.zip'), buf);
  console.log(`${a.dir}: ${buf.length} bytes`);
}

(async () => {
  const only = process.argv[2];
  for (const a of cfg.apps) if (!only || only === a.dir) await build(a);
})().catch(e => { console.error(e.message); process.exit(1); });
