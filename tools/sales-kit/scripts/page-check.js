// Проверка документа из листов A4 (КП, договор, счёт, ТЗ): высота каждой .page и запас до подвала.
// Использование: node tools/sales-kit/scripts/page-check.js app/kp-x.html
// - «ПЕРЕПОЛНЕНИЕ» — лист выше 1123px (297 мм), в PDF он разъедется на две страницы.
// - «!!!» — содержимое ближе 8px к подвалу .runfoot / .foot (листы фиксированной высоты переполнение прячут).
// - битые ресурсы — картинки и файлы, которые не загрузились (Google Fonts не считаются: в песочнице их нет).
const { launch, url } = require('./lib');
const F = process.argv[2];
if (!F) { console.log('Нужно: <путь к html от корня репозитория>'); process.exit(1); }
(async () => {
  const b = await launch(); const p = await b.newPage();
  const errs = [];
  p.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) errs.push('НЕ ЗАГРУЗИЛОСЬ ' + r.url()); });
  p.on('response', r => { if (r.status() >= 400 && !/fonts\.g/.test(r.url())) errs.push(r.status() + ' ' + r.url()); });
  await p.goto(url(F), { waitUntil: 'networkidle' });
  await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(700);
  const rows = await p.$$eval('.page', els => els.map((e, i) => {
    const pr = e.getBoundingClientRect();
    const rf = e.querySelector('.runfoot, .foot');
    const rfTop = rf ? rf.getBoundingClientRect().top - pr.top : pr.height;
    // зазор важен только для подвала, прижатого к низу листа (договор, счёт); в КП подвал идёт следом за текстом
    const abs = !!rf && getComputedStyle(rf).position === 'absolute';
    let mx = 0;
    [...e.children].forEach(c => {
      if (c === rf || getComputedStyle(c).position === 'absolute') return;
      const bt = c.getBoundingClientRect().bottom - pr.top; if (bt > mx) mx = bt;
    });
    return [i + 1, Math.round(pr.height), Math.round(mx), Math.round(rfTop), e.scrollHeight, abs];
  }));
  let bad = 0;
  for (const [n, h, mx, rf, sh, abs] of rows) {
    const over = h > 1124 || sh > 1124, tight = abs && rf - mx < 8;
    if (over || tight) bad++;
    console.log(`стр.${n}: высота ${h}px` + (abs ? `, контент до ${mx}px, подвал ${rf}px, запас ${rf - mx}px` : '') + `${over ? '  ПЕРЕПОЛНЕНИЕ' : ''}${tight ? '  !!!' : ''}`);
  }
  console.log(errs.length ? errs.join('\n') : 'битых ресурсов нет');
  console.log('страниц:', rows.length, 'BAD:', bad + errs.length);
  await b.close();
})();
