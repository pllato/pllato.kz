// Полный прогон демо: все экраны под ролью-владельцем, все кнопки, все роли, сценарий ▶, старт по ?s=.
// Использование:
//   node tools/sales-kit/scripts/demo-test.js <имя-демо> "<роль-владельца>" "<действия через ;>"
//   node tools/sales-kit/scripts/demo-test.js kvarta-sanzhar "Руководитель" "act('x');card('newreq')"
// Цель — последняя строка «BAD: 0» и «--- ошибки --- нет».
const { launch, url, demoPath } = require('./lib');
const name = process.argv[2], ownerRole = process.argv[3], acts = process.argv[4] || '';
if (!name || !ownerRole) { console.log('Нужно: <имя-демо> "<роль>" ["действия;…"]'); process.exit(1); }
const URL = url(demoPath(name));
(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1560, height: 960 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' && !/CERT|fonts\.g|Failed to load resource/.test(m.text())) errs.push('CONSOLE: ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.goto(URL, { waitUntil: 'networkidle' });
  const roles = await p.$$eval('.role b', n => n.map(x => x.textContent));
  console.log('Роли:', roles.join(' | '));
  await p.click('.role'); await p.waitForTimeout(500);
  const screens = await p.evaluate(() => Object.keys(SUBN));
  const scDef = await p.evaluate(() => Object.keys(SC));
  console.log('Экранов SUBN:', screens.length, 'SC:', scDef.length,
    'нет SC:', screens.filter(s => !scDef.includes(s)).join(',') || '-',
    'лишние SC:', scDef.filter(s => !screens.includes(s)).join(',') || '-');
  let bad = 0;
  for (const s of screens) {
    await p.evaluate(({ k, r }) => { role = r; cur = k; build(); }, { k: s, r: ownerRole });
    await p.waitForTimeout(60);
    const r = await p.evaluate(() => {
      const t = document.getElementById('content').innerText; const bad = [];
      if (/undefined/.test(t)) bad.push('undefined'); if (/\bNaN\b/.test(t)) bad.push('NaN');
      if (/\[object Object\]/.test(t)) bad.push('[object Object]'); if (/&lt;|&gt;/.test(t)) bad.push('escaped');
      if (t.length < 400) bad.push('short');
      return { len: t.length, bad, h: document.getElementById('ttl').textContent };
    });
    if (r.bad.length) bad++;
    console.log(r.bad.length ? '✗' : '✓', s.padEnd(10), String(r.len).padStart(6), r.h, r.bad.join(','));
  }
  console.log('--- действия ---');
  for (const a of acts.split(';').filter(Boolean)) {
    try { await p.evaluate(a); await p.waitForTimeout(250); console.log('✓', a); } catch (e) { console.log('✗', a, e.message); bad++; }
  }
  let clicks = 0;
  for (const s of screens) {
    await p.evaluate(({ k, r }) => { role = r; cur = k; build(); }, { k: s, r: ownerRole });
    const n = await p.$$eval('#content button, #content .dl, #content .pc, #content a[onclick]', els => els.length);
    for (let i = 0; i < n; i++) {
      try {
        await p.evaluate(({ k, r, i }) => {
          role = r; cur = k; build();
          const els = document.querySelectorAll('#content button, #content .dl, #content .pc, #content a[onclick]');
          if (els[i]) els[i].click(); closeM();
        }, { k: s, r: ownerRole, i });
        clicks++;
      } catch (e) { console.log('✗ клик', s, i, e.message); bad++; }
    }
  }
  console.log('кликов:', clicks);
  console.log('--- роли ---');
  const rs = await p.evaluate(() => Object.keys(ROLES));
  for (const r of rs) {
    const n = await p.evaluate(k => {
      switchRole(k); const bad = [];
      for (const s of ROLES[k].s) { cur = s; build(); const t = document.getElementById('content').innerText; if (/undefined|\bNaN\b|\[object Object\]/.test(t)) bad.push(s); }
      return { n: ROLES[k].s.length, vis: document.querySelectorAll('.ri').length, bad: bad.join(',') };
    }, r);
    console.log(n.bad ? '✗' : '✓', r.padEnd(24), 'экранов:', String(n.n).padStart(2), 'разделов:', n.vis, n.bad);
    if (n.bad) bad++;
  }
  await p.evaluate(() => { switchRole(Object.keys(ROLES)[0]); tour(); }); await p.waitForTimeout(300);
  await p.evaluate(() => stopTour());
  await p.goto(URL + '&s=' + screens[Math.min(3, screens.length - 1)], { waitUntil: 'networkidle' });
  const st = await p.evaluate(() => ({ cur, gate: document.getElementById('gate').classList.contains('hidden') }));
  console.log('старт ?s=:', st.cur, 'гейт скрыт:', st.gate);
  console.log('--- ошибки ---'); console.log(errs.length ? errs.join('\n') : 'нет');
  console.log('BAD:', bad + errs.length);
  await b.close();
})();
