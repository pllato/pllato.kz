const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--disable-gpu'],executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
 await page.evaluate(async()=>{
  document.body.innerHTML='<div id="viewport" style="position:relative;width:1000px;height:700px"></div>';
  const {mountStampWorkbench}=await import('./stamp-workbench.mjs');
  window.stampSheet={id:'test',origin:[0,0],paperUnit:1,stamp:{contractor:'Иванов'}};
  window.stampUI=mountStampWorkbench({sheet:()=>stampSheet,project:()=>({sheets:[stampSheet]}),busy:()=>false,screen:([x,y])=>[x*2,600-y*2],edit:(id,stamp)=>{if(id!=='test')throw Error('wrong sheet');stampSheet.stamp=stamp;}});stampUI.paint();
 });
 await page.locator('#executiveStampTarget').click();
 for(const size of [{width:1200,height:900},{width:1280,height:854},{width:800,height:1280},{width:390,height:844}]){
  await page.setViewportSize(size);
  const layout=await page.locator('#stampDialog').evaluate(d=>{const b=d.getBoundingClientRect(),form=d.querySelector('form'),buttons=[...d.querySelectorAll('.stampActions button')];return {width:b.width,left:b.left,right:b.right,overflow:d.scrollWidth>d.clientWidth+1,display:getComputedStyle(form).display,buttons:buttons.map(x=>({height:x.getBoundingClientRect().height,bottom:x.getBoundingClientRect().bottom}))};});
  assert.equal(layout.display,'flex');assert.equal(layout.buttons.length,2);assert.equal(layout.overflow,false);assert.ok(layout.left>=0&&layout.right<=size.width);assert.ok(layout.buttons.every(b=>b.height>=44&&b.height<70&&b.bottom<=size.height));
  console.log('Layout',size.width,layout);await page.screenshot({path:'/private/tmp/dwg-stamp-fixed-'+size.width+'.png'});
 }
 await page.setViewportSize({width:1200,height:900});
 await page.locator('#stampFieldSelect').selectOption('organization');
 await page.locator('#stampEdit_organization').fill('Тестовая организация');
 await page.locator('#stampFieldSelect').selectOption('checkedBy');
 assert.equal(await page.locator('#stampSavedValue option').nth(1).getAttribute('value'),'Иванов');
 await page.locator('#stampEdit_checkedBy').fill('Петров');
 await page.locator('#stampFieldSelect').selectOption('checkedSignature');
 await page.locator('#stampEdit_checkedSignature').fill('П.П.');
 await page.locator('#stampFieldSelect').selectOption('checkedDate');
 await page.getByLabel('Календарь · Дата · проверил',{exact:true}).fill('2026-10-01');
 assert.equal(await page.locator('#stampEdit_checkedDate').inputValue(),'01.10.2026');
 await page.getByRole('button',{name:'Сохранить',exact:true}).click();
 assert.equal(await page.evaluate(()=>stampSheet.stamp.checkedSignature),'П.П.');
 await page.locator('#editExecutiveStamp').click();
 await page.locator('#stampFieldSelect').selectOption('organization');
 assert.equal(await page.locator('#stampEdit_organization').inputValue(),'Тестовая организация');
 await page.locator('#stampEdit_organization').fill('Не сохранять');await page.getByRole('button',{name:'Отмена',exact:true}).click();
 assert.equal(await page.evaluate(()=>stampSheet.stamp.organization),'Тестовая организация');assert.deepEqual(errors,[]);console.log('Stamp browser: click, suggestions, date, save, reopen, cancel PASS');
 const integrated=await browser.newPage({viewport:{width:1400,height:1000}});
 await integrated.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await integrated.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+'\nwindow.stampTest={doc:()=>doc,init:p=>{doc.executiveProject=p;rebuild();focusExecutive(p.sheets[0]);}};'});});
 await integrated.goto('http://127.0.0.1:8817/app/stroy/dwg/');await integrated.waitForFunction(()=>window.stampTest&&document.querySelector('#canvas').width>1);await integrated.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await integrated.evaluate(async()=>{const m=await import('./executive-project.mjs'),p=m.createExecutiveProject();m.createExecutive(p,{id:'integration',metresPerUnit:1,paperUnit:1});stampTest.init(p);});
 await integrated.locator('#editExecutiveStamp').click();await integrated.locator('#stampFieldSelect').selectOption('organization');await integrated.locator('#stampEdit_organization').fill('Интеграция');await integrated.getByRole('button',{name:'Сохранить',exact:true}).click();
 assert.equal(await integrated.evaluate(()=>stampTest.doc().executiveProject.sheets[0].stamp.organization),'Интеграция');
 await integrated.locator('#undo').click();assert.equal(await integrated.evaluate(()=>stampTest.doc().executiveProject.sheets[0].stamp.organization),undefined);
 await integrated.locator('#redo').click();assert.equal(await integrated.evaluate(()=>stampTest.doc().executiveProject.sheets[0].stamp.organization),'Интеграция');
 console.log('Editor integration: stamp save, undo, redo PASS');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
