const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.route('**/app/gate.js',r=>r.fulfill({body:''}));await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
 const result=await page.evaluate(async fontBytes=>{
 const {importTtf}=await import('./local-ttf.mjs');await importTtf(new File([new Uint8Array(fontBytes)],'times.ttf'));
 const {executiveStamp}=await import('./executive-stamp.mjs'),{vectorPdf}=await import('./vector-pdf.mjs'),{mountStampWorkbench}=await import('./stamp-workbench.mjs');
 const stamp={code:'ТЕСТ-2-ЭОМ',project:'Многоквартирный жилой комплекс со встроенными, встроенно-пристроенными помещениями расположенный по адресу: город, район, микрорайон, улица, участок (без наружных инженерных сетей)',object:'6-этажный жилой дом со встроенными помещениями\nобщественного назначения\nПятно 2',drawing:'Розеточная сеть.\nПлан 6-го этажа на отм. +16,500',organization:'ТОО «Пример»',contractorRole:'Выполнил',contractor:'Иванов И.',checkedRole:'Проверил',checkedBy:'Петров П.',stage:'ИД',sheet:'1',sheets:'2'};
 const shapes=[],items=[];executiveStamp({x:0,y:0,stamp,line:(x,y,x2,y2)=>{items.push({type:'LINE',values:[x,y,x2,y2]});shapes.push({text:null,color:7,pts:[[x,y],[x2,y2]],lineweight:25});},text:(x,y,text,height,align)=>{items.push({type:'TEXT',text,values:[x,y,height,0],...(align==='center'?{align:1}:{})});shapes.push({text,color:7,pts:[[x,y]],height,angle:0,halign:align==='center'?1:0,font:{source:'times.ttf'}});}});
 document.body.innerHTML='<div id="viewport" style="height:800px;width:1400px"></div>';const sheet={id:'reference',stamp,origin:[0,0],paperUnit:1};const ui=mountStampWorkbench({sheet:()=>sheet,project:()=>({sheets:[sheet]}),screen:([x,y])=>[x*2,700-y*2],busy:()=>false,edit:(id,s)=>sheet.stamp=s});ui.paint();document.getElementById('editExecutiveStamp').click();
 return {items,pdf:[...new Uint8Array(await(await vectorPdf([{shapes,bounds:[0,0,185,55]}])).arrayBuffer())]};
 },[...fs.readFileSync('/System/Library/Fonts/Supplemental/Times New Roman.ttf')]);
 fs.writeFileSync('/private/tmp/dwg-stamp-reference.pdf',Buffer.from(result.pdf));fs.writeFileSync('/private/tmp/dwg-stamp-reference-items.json',JSON.stringify(result.items));
 await page.locator('.stampPreview').screenshot({path:'/private/tmp/dwg-stamp-reference-ui.png'});
 await page.locator('.stampPreview button[aria-label="Организация"]').click();assert.equal(await page.locator('#stampFieldSelect').inputValue(),'organization');await page.locator('#stampEdit_organization').fill('Новая организация');
 await page.locator('#stampFieldSelect').selectOption('checkedBy');await page.locator('#stampSavedValue').selectOption('Иванов И.');assert.equal(await page.locator('#stampEdit_checkedBy').inputValue(),'Иванов И.');
 await page.locator('#stampFieldSelect').selectOption('revision1_0');await page.locator('#stampEdit_revision1_0').fill('1');await page.getByRole('button',{name:'Сохранить',exact:true}).click();console.log('PASS reference stamp PDF + preview, cell editing, editable dropdown and revision field');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
