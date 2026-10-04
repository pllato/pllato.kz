// Каждый лист .page документа → PNG (<префикс>1.png, <префикс>2.png…) — чтобы посмотреть глазами.
// Использование: node tools/sales-kit/scripts/pages-png.js app/kp-x.html /tmp/look/kp
const fs = require('fs'), path = require('path');
const { launch, url } = require('./lib');
const F = process.argv[2], P = process.argv[3] || 'p';
fs.mkdirSync(path.dirname(path.resolve(P)), { recursive: true });
(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 840, height: 1188 }, deviceScaleFactor: 1.5 });
  await p.goto(url(F), { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const els = await p.$$('.page');
  for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: `${P}${i + 1}.png` });
  console.log('страниц:', els.length);
  await b.close();
})();
