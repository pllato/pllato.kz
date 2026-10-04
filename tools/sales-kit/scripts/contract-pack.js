// Плотная раскладка договора по листам. Договор пишется в body.html «по смыслу» (раздел — лист),
// листы получаются полупустыми. Скрипт меряет каждый блок и переливает блоки по листам внутри
// каждой части (договор / Приложение 1 / Приложение 2), не отрывая заголовок от следующего блока.
// Использование (из папки проекта договора):
//   python3 build.py                                   # собрать «по смыслу» из body.html
//   node <kit>/scripts/contract-pack.js app/dogovor-x.html body_packed.html [предел=1050]
//   python3 build.py body_packed.html                  # собрать плотную версию
// Подвал договора должен начинаться с «Договор №» (в body.html — RUNFOOT), иначе часть не узнается.
const fs = require('fs');
const { launch, url } = require('./lib');
const [F, OUT] = process.argv.slice(2);
const LIMIT = +(process.argv[4] || 1050);
(async () => {
  const b = await launch(); const p = await b.newPage();
  await p.goto(url(F), { waitUntil: 'networkidle' });
  await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(600);
  const pages = await p.$$eval('.page', els => els.map(e => {
    const rf = e.querySelector('.runfoot');
    const blocks = [...e.children].filter(c => c !== rf).map(c => {
      const cs = getComputedStyle(c), r = c.getBoundingClientRect();
      return { tag: c.tagName, cls: c.className, html: c.outerHTML,
        h: r.height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom),
        h0: r.height + parseFloat(cs.marginBottom) + 5 };
    });
    return { group: rf ? rf.firstElementChild.textContent : '', blocks };
  }));
  await b.close();
  const groups = [];
  for (const pg of pages) {
    const g = pg.group.startsWith('Договор №') ? 'RUNFOOT' : pg.group;
    if (!groups.length || groups[groups.length - 1].g !== g) groups.push({ g, blocks: [] });
    groups[groups.length - 1].blocks.push(...pg.blocks);
  }
  const TOP = 45; let out = '', n = 0;
  const strip = h => h.replace(/^(<h[23][^>]*?) style="margin-top:0"/, '$1');
  const zero = h => /^<h[23]/.test(h) ? strip(h).replace(/^<(h[23])/, '<$1 style="margin-top:0"') : h;
  for (const gr of groups) {
    let cur = [], y = TOP;
    const flush = () => { out += `<section class="page">\n${cur.join('\n')}\n<div class="runfoot"><span>${gr.g}</span><span>стр. {P}</span></div>\n</section>\n\n`; n++; cur = []; y = TOP; };
    const B = gr.blocks;
    for (let i = 0; i < B.length; i++) {
      const bl = B[i], first = !cur.length;
      let need = first ? bl.h0 : bl.h;
      if (/^H[23]$/.test(bl.tag) && B[i + 1]) need += B[i + 1].h; // заголовок не отрываем от текста
      if (!first && y + need > LIMIT) flush();
      const isFirst = !cur.length;
      cur.push(isFirst && !/app-title/.test(bl.cls) ? zero(bl.html) : strip(bl.html));
      y += isFirst ? bl.h0 : bl.h;
    }
    if (cur.length) flush();
  }
  fs.writeFileSync(OUT, out + '</body></html>\n');
  console.log('листов:', n, '→', OUT);
})();
