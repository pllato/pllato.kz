// Поиск ошибок JS: кликает всё кликабельное на каждом экране и печатает ошибки со стеком.
// Запускать, когда demo-test показал PAGEERROR и непонятно, какая кнопка его даёт.
// Использование: node tools/sales-kit/scripts/demo-clicks.js <имя-демо> ["Роль"]
const { launch, url, demoPath } = require('./lib');
const name = process.argv[2], roleName = process.argv[3] || 'Руководитель';
const SEL = '#content button, #content a[onclick], #content tr[onclick], #content div[onclick], #content span[onclick]';
(async () => {
  const b = await launch(); const p = await b.newPage({ viewport: { width: 1560, height: 960 } });
  p.on('pageerror', e => console.log('ОШИБКА', e.stack.split('\n').slice(0, 4).join(' | '), '← последний клик:', lastClick));
  let lastClick = '';
  await p.goto(url(demoPath(name)), { waitUntil: 'networkidle' }); await p.click('.role');
  const scr = await p.evaluate(() => Object.keys(SUBN));
  let total = 0;
  for (const s of scr) {
    const n = await p.evaluate(({ k, r, SEL }) => { role = r; cur = k; build(); return document.querySelectorAll(SEL).length; }, { k: s, r: roleName, SEL });
    for (let i = 0; i < n; i++) {
      lastClick = await p.evaluate(({ k, r, i, SEL }) => {
        role = r; cur = k; build();
        const e = document.querySelectorAll(SEL)[i]; let d = '';
        if (e) { d = k + ':' + i + ' ' + (e.getAttribute('onclick') || e.textContent || '').trim().slice(0, 60); e.click(); }
        closeM(); return d;
      }, { k: s, r: roleName, i, SEL }).catch(e => { console.log('X', s, i, e.message.slice(0, 100)); return ''; });
      total++;
    }
  }
  console.log('кликов:', total);
  await b.close();
})();
