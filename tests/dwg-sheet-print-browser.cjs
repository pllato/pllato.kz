const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();await page.route('**/app/gate.js',r=>r.fulfill({body:''}));await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
 const bytes=await page.evaluate(async()=>{
  const {executiveLayout}=await import('./executive-layout.mjs'),{vectorPdf}=await import('./vector-pdf.mjs');
  const layout=executiveLayout({title:'Исполнительная — проверка печати',rows:[{brand:'ВВГнг(А)-LS',section:'3×2,5',length:9.72}],stamp:{code:'ИД-01',project:'Жилой комплекс',object:'Квартира',organization:'RLS',contractor:'Иванов',checkedBy:'Петров',date:'30.09.26'}});
  const shapes=layout.items.map(i=>({text:i.type==='TEXT'?i.text:null,pts:i.type==='TEXT'?[i.values.slice(0,2)]:[i.values.slice(0,2),i.values.slice(2,4)],color:7,angle:0,height:i.values[2],halign:i.align||0,layer:'Оформление'}));
  for(const [index,lineweight]of [undefined,25,50].entries()){const y=200-index*25;shapes.push({text:null,pts:[[25,y],[200,y],[300,y-10]],color:5,layer:'ЭЛ-розетки',lineweight});shapes.push({text:['Исходный кабель','Новый кабель 0,25 мм','Кабель 0,5 мм'][index],pts:[[25,y+5]],height:4,angle:0,color:7});}
  return [...new Uint8Array(await(await vectorPdf([{shapes,bounds:[0,0,420,297]}])).arrayBuffer())];
 });
 const buffer=Buffer.from(bytes);assert.ok(buffer.includes(Buffer.from('/FontFile2')));const dir=fs.mkdtempSync('/private/tmp/dwg-sheet-print-');fs.writeFileSync(dir+'/sheet.pdf',buffer);console.log(dir);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
