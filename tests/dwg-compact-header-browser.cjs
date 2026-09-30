// Presentation regression: no private DWG or working user tab is touched.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
  await page.goto((process.env.DWG_TEST_ORIGIN||'http://127.0.0.1:8817')+'/app/stroy/dwg/');
  await page.locator('#guideButton').waitFor();
  await page.evaluate(()=>{document.querySelector('#guideWelcome').hidden=true;document.querySelector('#filename').textContent='Очень длинное название чертежа с изменениями.dwg';document.querySelector('#autosaveStatus').textContent='Сохранено на устройстве · 11:02:49';});
  const rows=[];
  for(const width of [1920,1440,1280,1024,850,390]){
   await page.setViewportSize({width,height:900});
   const measure=await page.evaluate(()=>{
    const box=s=>document.querySelector(s).getBoundingClientRect();
    return {width:innerWidth,header:box('header').height,tools:box('#drawingToolbar').height,top:box('#viewport').top,overflow:document.documentElement.scrollWidth>innerWidth};
   });rows.push(measure);
   assert.ok(measure.tools<=43,JSON.stringify(measure));
   if(width>=1280)assert.ok(measure.top<=86,JSON.stringify(measure));
   assert.equal(measure.overflow,false,JSON.stringify(measure));
   await page.locator('#executiveExports>summary').click();
   assert.equal(await page.locator('#exportExecutivesDwg').isVisible(),true);
   const exportBox=await page.locator('#executiveExports>div').boundingBox();
   assert.ok(exportBox.x>=0&&exportBox.x+exportBox.width<=width+1,JSON.stringify(exportBox));
   await page.locator('#executiveExports>summary').click();
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#guideButton').click();assert.equal(await page.locator('#dwgGuide').isVisible(),true);await page.locator('#guideClose').click();
  await page.locator('#historyButton').click();await page.locator('#recoveryDialog').waitFor({state:'visible'});await page.locator('#recoveryDialog button').last().click();
  await page.locator('#panel').click();assert.equal(await page.locator('#sidebar').isVisible(),true);await page.locator('.sidebarClose').click();
  await page.locator('#focusWorkspace').click();assert.equal(await page.locator('header').isVisible(),false);await page.locator('#focusWorkspace').click();
  assert.equal(await page.locator('footer #autosaveStatus').count(),1);
  assert.match(await page.locator('#autosaveStatus').getAttribute('title'),/Сохранено/);
  await page.locator('#fit').click();
  assert.equal(await page.locator('footer #autosaveStatus').count(),1,'Status updates must not remove recovery feedback');
  await page.screenshot({path:'/private/tmp/dwg-compact-header.png'});
  assert.deepEqual(errors,[]);console.log('PASS compact header, export/help/history/layers/focus',JSON.stringify(rows));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
