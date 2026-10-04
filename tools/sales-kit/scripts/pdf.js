// HTML-документ из листов .page → PDF A4 без полей (поля задаются внутри .page).
// Использование: node tools/sales-kit/scripts/pdf.js app/dogovor-x.html app/dogovor-x.pdf
const path = require('path');
const { launch, url, ROOT } = require('./lib');
const [F, O] = process.argv.slice(2);
if (!F || !O) { console.log('Нужно: <html> <pdf>'); process.exit(1); }
(async () => {
  const b = await launch(); const p = await b.newPage();
  await p.goto(url(F), { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
  const out = path.isAbsolute(O) ? O : path.join(ROOT, O);
  await p.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const n = (require('fs').readFileSync(out).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log('pdf ok:', O, 'страниц:', n);
  await b.close();
})();
