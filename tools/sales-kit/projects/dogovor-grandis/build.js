// Сборка договора Grandis: DOCX (docx) + HTML → PDF (Chrome). Запуск: NODE_PATH=~/.local/sales-kit/node_modules node build.js
const fs = require('fs'), path = require('path');
const D = require('docx');
const { B, NUM } = require('./content');
const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'app');
const FONT = 'Arial', SZ = 20; // 10pt
const W = 9638; // ширина текста A4 при полях 2 см
const runs = (s, o = {}) => s.split(/(<b>.*?<\/b>)/).filter(Boolean).map(t => t.startsWith('<b>') ? new D.TextRun({ text: t.slice(3, -4), bold: true, font: FONT, size: o.size || SZ }) : new D.TextRun({ text: t, bold: !!o.bold, font: FONT, size: o.size || SZ, color: o.color }));
const para = (s, o = {}) => new D.Paragraph({ children: runs(s, o), alignment: o.align || D.AlignmentType.JUSTIFIED, spacing: { after: o.after ?? 80, before: o.before || 0, line: 264 }, indent: o.indent, keepNext: o.keepNext });
const cell = (s, w, o = {}) => new D.TableCell({ width: { size: w, type: D.WidthType.DXA }, shading: o.fill ? { type: D.ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined, margins: { top: 60, bottom: 60, left: 90, right: 90 }, children: [para(s, { align: o.r ? D.AlignmentType.RIGHT : D.AlignmentType.LEFT, after: 0, bold: o.bold, size: o.size || 18 })] });
const brd = { style: D.BorderStyle.SINGLE, size: 4, color: 'BFC7CF' };
function table(b) {
  const ws = b.w.map(x => Math.round(W * x / 100)); ws[ws.length - 1] += W - ws.reduce((a, x) => a + x, 0);
  const isR = (i) => b.head[i] && /Сумма|Доля|Стоимость/.test(b.head[i]);
  const rows = [];
  if (!b.nohead) rows.push(new D.TableRow({ tableHeader: true, children: b.head.map((x, i) => cell(x, ws[i], { bold: true, fill: 'E8EEF2', r: isR(i) })) }));
  b.rows.forEach(r => rows.push(new D.TableRow({ children: r.map((x, i) => cell(x, ws[i], { r: isR(i), bold: b.nohead && i === 0 })) })));
  if (b.total) rows.push(new D.TableRow({ children: b.total.map((x, i) => cell(x, ws[i], { bold: true, fill: 'F3F5F7', r: isR(i) })) }));
  return new D.Table({ width: { size: W, type: D.WidthType.DXA }, columnWidths: ws, rows, borders: { top: brd, bottom: brd, left: brd, right: brd, insideHorizontal: brd, insideVertical: brd } });
}
const noB = { top: { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideHorizontal: { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideVertical: { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' } };
const two = (L, R) => new D.Table({ layout: D.TableLayoutType.FIXED, width: { size: W, type: D.WidthType.DXA }, columnWidths: [W / 2, W / 2], borders: noB, rows: [new D.TableRow({ children: [L, R].map(col => new D.TableCell({ width: { size: W / 2, type: D.WidthType.DXA }, borders: noB, margins: { right: 200 }, children: col })) })] });
const sig = (lbl, name, short) => [para(lbl, { bold: true, after: 40, align: D.AlignmentType.LEFT }), para(name, { after: 260, align: D.AlignmentType.LEFT }), para('_______________ / ' + short + ' /', { after: 20, align: D.AlignmentType.LEFT }), para('М.П.', { size: 16, color: '6B7B88', align: D.AlignmentType.LEFT })];
const kids = [];
for (const b of B) {
  if (b.t === 'title') { kids.push(para(b.x, { bold: true, size: 30, align: D.AlignmentType.CENTER, after: 40 }), para(b.y, { bold: true, size: 22, align: D.AlignmentType.CENTER, after: 40 }), para(b.z, { size: 20, color: '4A5560', align: D.AlignmentType.CENTER, after: 200 })); }
  else if (b.t === 'place') { kids.push(two([para(b.l, { align: D.AlignmentType.LEFT, after: 0 })], [para(b.r, { align: D.AlignmentType.RIGHT, after: 0 })])); kids.push(para('', { after: 120 })); }
  else if (b.t === 'h') kids.push(para(b.x, { bold: true, size: 22, before: 180, after: 100, align: D.AlignmentType.LEFT, keepNext: true }));
  else if (b.t === 'sub') kids.push(para(b.x, { bold: true, before: 60, align: D.AlignmentType.LEFT, keepNext: true }));
  else if (b.t === 'cl') kids.push(new D.Paragraph({ children: [new D.TextRun({ text: b.n + '\t', bold: true, font: FONT, size: SZ }), ...runs(b.x)], alignment: D.AlignmentType.JUSTIFIED, tabStops: [{ type: D.TabStopType.LEFT, position: 680 }], indent: { left: 680, hanging: 680 }, spacing: { after: 80, line: 264 } }));
  else if (b.t === 'p') kids.push(para(b.x));
  else if (b.t === 'table') { kids.push(table({ ...b, nohead: b.head.every(x => !x) })); kids.push(para('', { after: 60 })); }
  else if (b.t === 'pb') kids.push(new D.Paragraph({ children: [new D.PageBreak()] }));
  else if (b.t === 'req') { kids.push(two([para('Исполнитель', { bold: true, after: 40, align: D.AlignmentType.LEFT }), ...b.ex.map((x, i) => para(x, { bold: i === 0, after: 20, size: 18, align: D.AlignmentType.LEFT })), para('', { after: 260 }), para('_______________ / ' + b.exs + ' /', { after: 20, align: D.AlignmentType.LEFT }), para('М.П.', { size: 16, color: '6B7B88', align: D.AlignmentType.LEFT })], [para('Заказчик', { bold: true, after: 40, align: D.AlignmentType.LEFT }), ...b.cu.map((x, i) => para(x, { bold: i === 0, after: 20, size: 18, align: D.AlignmentType.LEFT })), para('', { after: 260 }), para('_______________ / ' + b.cus + ' /', { after: 20, align: D.AlignmentType.LEFT }), para('М.П.', { size: 16, color: '6B7B88', align: D.AlignmentType.LEFT })])); }
  else if (b.t === 'apptitle') kids.push(para(b.k, { size: 18, color: '4A5560', align: D.AlignmentType.RIGHT, after: 120 }), para(b.x, { bold: true, size: 28, align: D.AlignmentType.CENTER, after: 40 }), para(b.y, { size: 20, color: '4A5560', align: D.AlignmentType.CENTER, after: 200 }));
  else if (b.t === 'tzh') kids.push(para(b.x, { bold: true, size: 22, before: 160, after: 80, align: D.AlignmentType.LEFT, keepNext: true }));
  else if (b.t === 'tzm') kids.push(para(b.m, { bold: true, after: 30, align: D.AlignmentType.LEFT, keepNext: true }), para(b.x, { after: 90 }));
  else if (b.t === 'act') kids.push(para(b.x, { bold: true, align: D.AlignmentType.CENTER, after: 100 }), para(b.y, { after: 160 }));
  else if (b.t === 'signs2') { kids.push(para('', { after: 120 })); kids.push(two(sig('Исполнитель', b.ex, b.exs), sig('Заказчик', b.cu, b.cus))); }
}
const doc = new D.Document({
  creator: 'Pllato', title: 'Договор № ' + NUM,
  styles: { default: { document: { run: { font: FONT, size: SZ } } } },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, children: [new D.TextRun({ text: 'Договор № ' + NUM + ' · стр. ', font: FONT, size: 16, color: '6B7B88' }), new D.TextRun({ children: [D.PageNumber.CURRENT], font: FONT, size: 16, color: '6B7B88' }), new D.TextRun({ text: ' из ', font: FONT, size: 16, color: '6B7B88' }), new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: '6B7B88' })] })] }) },
    children: kids }]
});
D.Packer.toBuffer(doc).then(buf => { fs.writeFileSync(path.join(OUT, 'dogovor-grandis.docx'), buf); console.log('docx ok', buf.length); });
// ---------- HTML для PDF ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');
const ht = [];
const thtml = b => { const isR = i => b.head[i] && /Сумма|Доля|Стоимость/.test(b.head[i]); const nh = b.head.every(x => !x); return `<table>${nh ? '' : `<thead><tr>${b.head.map((x, i) => `<th style="width:${b.w[i]}%" class="${isR(i) ? 'r' : ''}">${x}</th>`).join('')}</tr></thead>`}<tbody>${b.rows.map(r => `<tr>${r.map((x, i) => `<td style="width:${b.w[i]}%" class="${isR(i) ? 'r' : ''}${nh && i === 0 ? ' k' : ''}">${esc(x)}</td>`).join('')}</tr>`).join('')}${b.total ? `<tr class="tot">${b.total.map((x, i) => `<td class="${isR(i) ? 'r' : ''}">${x}</td>`).join('')}</tr>` : ''}</tbody></table>`; };
const sigh = (lbl, name, short) => `<div><div class="sl">${lbl}</div><div>${esc(name)}</div><div class="ln">_______________ / ${esc(short)} /</div><div class="mp">М.П.</div></div>`;
for (const b of B) {
  if (b.t === 'title') ht.push(`<h1>${b.x}</h1><div class="h1b">${b.y}</div><div class="h1c">${b.z}</div>`);
  else if (b.t === 'place') ht.push(`<div class="place"><span>${b.l}</span><span>${b.r}</span></div>`);
  else if (b.t === 'h') ht.push(`<h2>${b.x}</h2>`);
  else if (b.t === 'sub') ht.push(`<h3>${b.x}</h3>`);
  else if (b.t === 'cl') ht.push(`<div class="cl"><span class="n">${b.n}</span><span>${esc(b.x)}</span></div>`);
  else if (b.t === 'p') ht.push(`<p>${esc(b.x)}</p>`);
  else if (b.t === 'table') ht.push(thtml(b));
  else if (b.t === 'pb') ht.push('<div class="pb"></div>');
  else if (b.t === 'req') ht.push(`<div class="req"><div><div class="sl">Исполнитель</div>${b.ex.map((x, i) => `<div class="${i ? '' : 'nm'}">${esc(x)}</div>`).join('')}<div class="ln">_______________ / ${b.exs} /</div><div class="mp">М.П.</div></div><div><div class="sl">Заказчик</div>${b.cu.map((x, i) => `<div class="${i ? '' : 'nm'}">${esc(x)}</div>`).join('')}<div class="ln">_______________ / ${b.cus} /</div><div class="mp">М.П.</div></div></div>`);
  else if (b.t === 'apptitle') ht.push(`<div class="ak">${b.k}</div><h1 class="ah">${b.x}</h1><div class="h1c">${b.y}</div>`);
  else if (b.t === 'tzh') ht.push(`<h2>${b.x}</h2>`);
  else if (b.t === 'tzm') ht.push(`<div class="tzm"><b>${b.m}</b><p>${esc(b.x)}</p></div>`);
  else if (b.t === 'act') ht.push(`<div class="act"><b>${b.x}</b><p>${esc(b.y)}</p></div>`);
  else if (b.t === 'signs2') ht.push(`<div class="req s2">${sigh('Исполнитель', b.ex, b.exs)}${sigh('Заказчик', b.cu, b.cus)}</div>`);
}
const css = `@page{size:A4;margin:20mm 20mm 18mm}body{font:10pt/1.42 Arial,'Helvetica Neue',sans-serif;color:#1b2229;margin:0}
h1{font-size:15pt;text-align:center;margin:0 0 2px}.h1b{text-align:center;font-weight:700;font-size:11pt}.h1c{text-align:center;color:#4a5560;margin:2px 0 14px}
.place{display:flex;justify-content:space-between;margin-bottom:12px}h2{font-size:11pt;margin:14px 0 6px;break-after:avoid}h3{font-size:10pt;margin:8px 0 4px;break-after:avoid}
p{margin:0 0 6px;text-align:justify}.cl{display:grid;grid-template-columns:12mm 1fr;margin:0 0 5px;text-align:justify;break-inside:avoid}.cl .n{font-weight:700}
table{width:100%;border-collapse:collapse;margin:4px 0 8px;font-size:9pt;break-inside:avoid}th,td{border:1px solid #bfc7cf;padding:4px 6px;vertical-align:top;text-align:left}th{background:#e8eef2}td.r,th.r{text-align:right}tr.tot td{font-weight:700;background:#f3f5f7}td.k{font-weight:700;width:26%}
.pb{break-after:page}.ak{text-align:right;color:#4a5560;font-size:9pt;margin-bottom:8px}.ah{margin-top:0}
.tzm{margin:0 0 7px;break-inside:avoid}.tzm b{display:block;margin-bottom:2px}.req{display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:9pt;break-inside:avoid;margin-top:6px}.req .nm{font-weight:700}.sl{font-weight:700;font-size:10pt;margin-bottom:3px}.ln{margin-top:22px}.mp{color:#6b7b88;font-size:8pt}.s2{margin-top:16px}
.act{border:1px solid #bfc7cf;padding:8px 10px;margin:4px 0}.act b{display:block;text-align:center;margin-bottom:6px}`;
fs.writeFileSync(path.join(OUT, 'dogovor-grandis.html'), `<!doctype html><html lang="ru"><head><script src="/app/gate.js"></script><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Договор № ${NUM} · ИП «Grandis» × Pllato</title><style>${css}@media screen{body{max-width:180mm;margin:20px auto;padding:0 12px}}</style></head><body>${ht.join('\n')}</body></html>`);
console.log('html ok');
