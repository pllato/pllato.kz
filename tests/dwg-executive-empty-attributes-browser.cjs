// Private fixture stays local; native clone writes into the worker's memory FS.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();page.setDefaultTimeout(300000);await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`
 globalThis.emptyAttributeTest={async clone(){
  const {selectExecutiveRoots}=await import('./executive-selection.mjs'),{createExecutive}=await import('./executive-project.mjs');
  const sheet=doc.executiveProject.sheets[0],root=recordById('dwg-'+sheet.nativeHandles[0]),block=doc.blocks.get(get(root,2));
  const sockets=block.records.filter(r=>r.type==='INSERT'&&/розет/i.test(get(r,8))),xs=sockets.map(r=>num(r,10)),ys=sockets.map(r=>num(r,20)),area=[Math.min(...xs)-500,Math.min(...ys)-500,Math.max(...xs)+500,Math.max(...ys)+500];
  const handles=selectExecutiveRoots(doc,drawing.shapes,area).filter(h=>{const r=recordById('dwg-'+h);return r.type==='INSERT'&&/розет/i.test(get(r,8));});
  const owners=new Set(handles),empty=doc.entities.filter(r=>r.type==='ATTRIB'&&owners.has(get(r,330))&&!get(r,1).trim()).length;
  if(!empty)throw Error('Fixture must include empty owned attributes');
  const project=structuredClone(doc.executiveProject),id='empty-attribute-regression';createExecutive(project,{id,metresPerUnit:.001,origin:[2000000,0],paperUnit:100});
  const success=await commitExecutive(project,{sheetId:id,handles,centre:[0,0],position:[2000000,0]});if(!success)throw Error($('status').textContent());
  const result=doc.executiveProject.sheets.find(s=>s.id===id),copy=recordById('dwg-'+result.nativeHandles[0]),children=doc.blocks.get(get(copy,2)).records;
  return {expected:handles.length,copied:children.filter(r=>r.type==='INSERT'&&/розет/i.test(get(r,8))).length,emptyAttributes:empty,emptyShapes:drawing.shapes.filter(s=>typeof s.text==='string'&&!s.text.trim()).length};
 }};`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 const result=await page.evaluate(()=>emptyAttributeTest.clone());assert.equal(result.copied,result.expected);assert.ok(result.expected>0);assert.equal(result.emptyShapes,0);console.log('PASS sockets with empty remote attributes survive native executive creation/readback',result);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
