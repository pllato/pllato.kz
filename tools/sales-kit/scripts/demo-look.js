// Быстрые PNG экранов демо для собственной проверки глазами (не для КП).
// Использование: node tools/sales-kit/scripts/demo-look.js <имя-демо> <экраны,через,запятую|gate> <папка>
// Экран можно задать как "order:curOrd='A-1'" — JS после двоеточия выполняется перед показом.
const fs = require('fs');
const { launch, url, demoPath } = require('./lib');
const name = process.argv[2], list = (process.argv[3] || 'gate').split(','), out = process.argv[4] || '.';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto(url(demoPath(name)), { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  for (const s of list) {
    if (s === 'gate') { await p.screenshot({ path: `${out}/${name}-gate.png` }); continue; }
    await p.evaluate(k => {
      const g = document.getElementById('gate'); if (!g.classList.contains('hidden')) document.querySelector('.role').click();
      const i = k.indexOf(':'); const a = i < 0 ? k : k.slice(0, i); if (i >= 0) eval(k.slice(i + 1));
      cur = a; build(); document.getElementById('toast').classList.remove('show');
    }, s);
    await p.waitForTimeout(350); await p.screenshot({ path: `${out}/${name}-${s.split(':')[0]}.png` });
  }
  console.log('готово:', list.length, '→', out);
  await b.close();
})();
