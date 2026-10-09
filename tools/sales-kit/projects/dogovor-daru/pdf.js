const path=require('path');const {launch,url,ROOT}=require('../../scripts/lib');
(async()=>{const b=await launch();const p=await b.newPage();await p.goto(url('app/dogovor-daru.html'),{waitUntil:'networkidle'});await p.waitForTimeout(600);
await p.pdf({path:path.join(ROOT,'app/dogovor-daru.pdf'),format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font:8px Arial;color:#6b7b88;width:100%;padding:0 20mm;display:flex;justify-content:space-between"><span>Договор № DR-2026-01 · ИП «STUDYSTORIES.APP» × Клиника</span><span>стр. <span class="pageNumber"></span> из <span class="totalPages"></span></span></div>',margin:{top:'20mm',bottom:'18mm',left:'20mm',right:'20mm'}});
await b.close();console.log('pdf ok')})();
