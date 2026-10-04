// Проверка демо на телефоне (390×844): вход по роли нажимается, ни один экран не шире экрана, нет ошибок.
// Использование:
//   node tools/sales-kit/scripts/demo-mobile.js <имя-демо> [экраны,для,скриншотов] [папка]
//   node tools/sales-kit/scripts/demo-mobile.js kvarta-sanzhar today,orders /tmp/m
const fs = require('fs');
const { launch, url, demoPath } = require('./lib');
const name = process.argv[2], shots = (process.argv[3] || '').split(',').filter(Boolean), out = process.argv[4] || '.';
(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url(demoPath(name)), { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  let gate = 'нет кнопок .role';
  try {
    if (await p.$('.role')) {
      await p.click('.role', { timeout: 4000 }); await p.waitForTimeout(300);
      gate = await p.evaluate(() => document.getElementById('gate').classList.contains('hidden') ? 'вход ок' : 'гейт не скрылся');
    }
  } catch (e) { gate = 'РОЛЬ НЕ НАЖИМАЕТСЯ'; }
  console.log('вход:', gate);
  const scr = await p.evaluate(() => Object.keys(SUBN)); const wide = [];
  for (const s of scr) {
    const w = await p.evaluate(k => { cur = k; build(); return document.documentElement.scrollWidth; }, s);
    if (w > 392) wide.push(s + ':' + w);
  }
  console.log('шире экрана:', wide.join(' ') || 'нет');
  if (shots.length) fs.mkdirSync(out, { recursive: true });
  for (const s of shots) {
    await p.evaluate(k => { cur = k; build(); document.getElementById('toast').classList.remove('show'); }, s);
    await p.waitForTimeout(200); await p.screenshot({ path: `${out}/m-${s}.png` });
  }
  console.log('ошибки:', errs.length ? errs.join(' | ') : 'нет');
  console.log('BAD:', (gate === 'вход ок' ? 0 : 1) + wide.length + errs.length);
  await b.close();
})();
