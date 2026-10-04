// Скриншоты демо для КП → app/img/<папка>/ (JPEG, 1600×1020, масштаб 1.5).
// Использование:
//   node tools/sales-kit/scripts/demo-shots.js <имя-демо> <папка> "<полные>" "<обрезанные>" '<модалки JSON>' <cx> <cy> "<подготовка JS>"
// - полные:     экраны через запятую → <экран>.jpg (весь экран с меню). Плюс всегда gate.jpg (экран входа).
// - обрезанные: экраны → <экран>-c.jpg, обрезка от (cx, cy) — без бокового меню и шапки.
// - модалки:    {"файл":"card('ord','A-1')"} → <файл>-mo.jpg — только окно модалки.
// - экран можно задать как "orders:ordF='kaspi'" — после двоеточия JS, выполняемый перед показом.
// - подготовка: JS после входа (например, "switchRole('Менеджер')").
// Пример: node tools/sales-kit/scripts/demo-shots.js kvarta-sanzhar kp-kvarta "today" "inbox,client" '{"req":"card(\"req\",\"Q-1\")"}' 64 58 ""
const fs = require('fs'), path = require('path');
const { launch, url, demoPath, ROOT } = require('./lib');
const [name, out, full = '', clips = '', modals = '{}', cx = '0', cy = '0', prep = ''] = process.argv.slice(2);
const O = path.join(ROOT, 'app', 'img', out) + '/'; fs.mkdirSync(O, { recursive: true });
(async () => {
  const b = await launch({ args: ['--lang=ru-RU'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1020 }, deviceScaleFactor: 1.5, locale: 'ru-RU' });
  const p = await ctx.newPage();
  await p.goto(url(demoPath(name)), { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  await p.screenshot({ path: O + 'gate.jpg', type: 'jpeg', quality: 84 });
  await p.click('.role'); await p.waitForTimeout(500); if (prep) await p.evaluate(prep);
  const known = await p.evaluate(() => Object.keys(SUBN));
  const show = async s => {
    const i = s.indexOf(':'); const k = i < 0 ? s : s.slice(0, i), ex = i < 0 ? '' : s.slice(i + 1);
    if (!known.includes(k)) { console.log('Нет экрана «' + k + '». Есть:', known.join(',')); await b.close(); process.exit(1); }
    await p.evaluate(({ k, ex }) => { closeM(); if (ex) eval(ex); cur = k; build(); document.getElementById('toast').classList.remove('show'); }, { k, ex });
    await p.waitForTimeout(350); return k;
  };
  for (const s of full.split(',').filter(Boolean)) { const k = await show(s); await p.screenshot({ path: O + k + '.jpg', type: 'jpeg', quality: 84 }); console.log('полный', k); }
  for (const s of clips.split(',').filter(Boolean)) {
    const k = await show(s);
    const h = await p.evaluate(() => Math.round((document.querySelector('.screen') || document.getElementById('content')).getBoundingClientRect().bottom));
    await p.screenshot({ path: O + k + '-c.jpg', type: 'jpeg', quality: 86, clip: { x: +cx, y: +cy, width: 1600 - +cx, height: Math.max(420, Math.min(960, h + 20)) - +cy } });
    console.log('обрезка', k);
  }
  for (const [f, code] of Object.entries(JSON.parse(modals || '{}'))) {
    await p.evaluate(code); await p.waitForTimeout(600);
    const bb = await p.$eval('.modal', e => { const r = e.getBoundingClientRect(); const h = e.querySelector('.mh').offsetHeight + e.querySelector('.mb').scrollHeight + 6; return { x: r.x, y: r.y, w: r.width, h: Math.min(r.height, h) }; });
    await p.screenshot({ path: O + f + '-mo.jpg', type: 'jpeg', quality: 86, clip: { x: bb.x, y: bb.y, width: bb.w, height: Math.min(bb.h, 760) } });
    await p.evaluate(() => closeM()); console.log('модалка', f);
  }
  await b.close();
})();
