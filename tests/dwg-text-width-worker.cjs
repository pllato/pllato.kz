// Exercise both real browser writers, including executive-only extraction.
const {chromium}=require('playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage();await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
  await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
  const result=await page.evaluate(async input=>{
   const run=(name,data)=>new Promise((resolve,reject)=>{
    const w=new Worker('./'+name,{type:'module'}),timer=setTimeout(()=>{w.terminate();reject(Error('Worker timeout'));},90000);
    w.onmessage=({data:r})=>{if(r.error||r.buffer){clearTimeout(timer);w.terminate();r.error?reject(Error(r.error)):resolve(r);}};
    w.onerror=e=>{clearTimeout(timer);w.terminate();reject(Error(e.message));};w.postMessage(data);
   });
   const buffer=new Uint8Array(input).buffer;
   const {default:create}=await import('./vendor/pllato-executive-engine.mjs');
   const m=await create({print:()=>{},printErr:()=>{}});m.FS.writeFile('/in.dwg',new Uint8Array(buffer));
   if(m.ccall('pllato_open','number',['string'],['/in.dwg'])>=128)throw Error('Open failed');
   if(m.ccall('pllato_root_manifest','number',[],[]))throw Error('Manifest failed');
   const handles=m.FS.readFile('/root-manifest.txt',{encoding:'utf8'}).trim().split('\n').filter(x=>!x.includes(',viewport')).map(x=>x.split(',')[0]);m._pllato_close();
   const {createExecutiveProject,createExecutive}=await import('./executive-project.mjs');
   const project=createExecutiveProject();createExecutive(project,{id:'test',title:'Width test',metresPerUnit:.001,origin:[1000,1000],planCentre:[1000,1000]});
   const created=await run('executive-worker.mjs',{buffer,project,cloneRequest:{sheetId:'test',handles,centre:[0,0],position:[1000,1000]},exportOnly:true});
   const exported=await run('executive-worker.mjs',{buffer:created.buffer,project:created.project,exportOnly:true});
   const edited=await run('native-writer.mjs',{buffer:exported.buffer,ops:[],added:[{type:'TEXT',text:'Round-trip text',values:[10,20,5,0]}]});
   const reopened=await run('native-writer.mjs',{buffer:edited.buffer,ops:[]});
   return {created:Array.from(new Uint8Array(created.buffer)),exported:Array.from(new Uint8Array(exported.buffer)),edited:Array.from(new Uint8Array(reopened.buffer)),generated:exported.project.generatedHandles.length};
  },Array.from(fs.readFileSync(process.env.DWG_CLONE_FIXTURE)));
  assert.ok(result.generated>0);const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dwg-width-worker-'));
  for(const key of ['created','exported','edited']){assert.ok(result[key].length>100);fs.writeFileSync(path.join(dir,key+'.dwg'),Buffer.from(result[key]));}
  console.log('PASS executive create/export/re-export and ordinary add-text/save/reopen',dir);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
