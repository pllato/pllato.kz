// Opt-in private-file smoke test; never print geometry or copy fixtures to repo.
const {chromium}=require('playwright'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}});page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));page.on('crash',()=>console.log('CRASH'));page.on('dialog',d=>d.accept());
 await page.exposeFunction('stageLog',entry=>console.log('STAGE',entry));
 if(process.env.DWG_REUSE_DEBUG){page.on('console',m=>{if(m.text().startsWith('REUSE_FALLBACK'))console.log(m.text());});await page.route('**/scene-reuse.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/return null/g,(_,offset)=>`return (console.log('REUSE_FALLBACK',${offset}),null)`)});});}
 await page.addInitScript(()=>{const Original=Worker;globalThis.Worker=class extends Original{constructor(url,options){super(url,options);const start=performance.now();this.addEventListener('message',({data})=>{if((data?.progress&&!data.progress.startsWith('Подготавливаю объекты:'))||data?.buffer||data?.nativeComplete)globalThis.stageLog({worker:String(url).split('/').pop(),ms:Math.round(performance.now()-start),progress:data.progress,done:!!(data.buffer||data.nativeComplete)});});}};});
 if(process.env.DWG_CREATE_BASELINE)for(const name of ['native-reader.mjs','native-adapter.mjs','cad.mjs'])await page.context().route('**/'+name+'*',r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','e693bbc:app/stroy/dwg/'+name],{encoding:'utf8'})}));
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(process.env.DWG_CREATE_BASELINE?execFileSync('git',['show','e693bbc:app/stroy/dwg/editor.mjs'],{encoding:'utf8'}):await response.text()).replace('const built=read.doc', 'globalThis.reuseStats={base:reuse?.base.length,roots:reuse?.doc.entities.length};const built=read.doc')+'\nglobalThis.userTest={state:()=>doc,shapes:()=>drawing.shapes,commit:commitExecutive,source:()=>sourceFile,focusArea:b=>{view.s=Math.min((width-80)/(b[2]-b[0]),(height-80)/(b[3]-b[1]));view.x=width/2-(b[0]+b[2])/2*view.s;view.y=height/2+(b[1]+b[3])/2*view.s;draw();return [b[0]*view.s+view.x,view.y-b[3]*view.s,b[2]*view.s+view.x,view.y-b[1]*view.s];}};'});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');const start=Date.now();await page.locator('#file').setInputFiles(process.env.DWG_USER_FIXTURE);await page.waitForFunction(()=>document.querySelector('#busy').hidden,null,{timeout:180000});
 console.log('OPEN',Date.now()-start,await page.evaluate(()=>({records:userTest.state().records.length,shapes:userTest.shapes().length,unknown:userTest.state().nativeUnknown,sheets:userTest.state().executiveProject?.sheets.length||0})));
 console.log('LABEL_TYPES',await page.evaluate(()=>{const counts={};for(const r of userTest.state().records)if(r.pairs.some(p=>p[0]===1&&p[1].trim()==='N1'))counts[r.type]=(counts[r.type]||0)+1;return counts;}));
 if(!await page.locator('#exSheet option').count()){
 await page.locator('#panel').click();await page.locator('#units').selectOption('.001');await page.locator('#exCreateIcon').click();const b=await page.locator('#canvas').boundingBox();let rect=JSON.parse(process.env.DWG_CREATE_RECT||'[0.002,0.002,0.998,0.998]');
 if(process.env.DWG_DENSE_AREA){
  const dense=await page.evaluate(()=>{
   const types=new Map(userTest.state().entities.map(r=>[r.id,r.type])),bounds=new Map(),all=[Infinity,Infinity,-Infinity,-Infinity];
   for(const s of userTest.shapes()){if(!types.has(s.id))continue;const b=bounds.get(s.id)||[Infinity,Infinity,-Infinity,-Infinity];for(const [x,y]of s.pts){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}bounds.set(s.id,b);}
   for(const b of bounds.values())for(let i=0;i<4;i++)all[i]=i<2?Math.min(all[i],b[i]):Math.max(all[i],b[i]);
   let best;
   for(const n of [4,8,16,32,64]){const dx=(all[2]-all[0])/n,dy=(all[3]-all[1])/n,cells=new Map();
    for(const [id,r]of bounds){const x=Math.floor(((r[0]+r[2])/2-all[0])/dx),y=Math.floor(((r[1]+r[3])/2-all[1])/dy),area=[all[0]+x*dx,all[1]+y*dy,all[0]+(x+1)*dx,all[1]+(y+1)*dy];if(r[0]<area[0]||r[1]<area[1]||r[2]>area[2]||r[3]>area[3])continue;const key=x+','+y,c=cells.get(key)||{area,count:0,inserts:0};c.count++;if(types.get(id)==='INSERT')c.inserts++;cells.set(key,c);}
    for(const c of cells.values())if(c.count>=1000&&c.count<=12000&&c.inserts>=10&&(!best||Math.abs(c.count-8000)<Math.abs(best.count-8000)))best=c;
   }
   if(!best)throw Error('No representative dense area found');return {...best,pixels:userTest.focusArea(best.area)};
  });console.log('DENSE_SELECTION',{roots:dense.count,inserts:dense.inserts});rect=[dense.pixels[0]/b.width,dense.pixels[1]/b.height,dense.pixels[2]/b.width,dense.pixels[3]/b.height];
 }
 const createStart=Date.now();await page.mouse.move(b.x+b.width*rect[0],b.y+b.height*rect[1]);await page.mouse.down();await page.mouse.move(b.x+b.width*rect[2],b.y+b.height*rect[3],{steps:8});await page.mouse.up();await page.waitForFunction(()=>document.querySelector('#busy').hidden,null,{timeout:300000});console.log('CREATE',Date.now()-createStart,await page.locator('#status').textContent(),await page.evaluate(()=>globalThis.reuseStats));
 }
 if(process.env.DWG_CAPTURE_CREATED){
  const pending=page.waitForEvent('download');await page.evaluate(async()=>{const blob=await userTest.source(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='created.dwg';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);});await (await pending).saveAs(process.env.DWG_CAPTURE_CREATED);
 }
 if(process.env.DWG_CREATE_ONLY){console.log('CREATE_RESULT',{sheets:await page.locator('#exSheet option').count(),status:await page.locator('#status').textContent(),responsive:await page.evaluate(()=>document.readyState==='complete')});return;}
 if(!await page.locator('#exSheet option').count())throw Error('No executive created');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dwg-private-check-'));let download;page.on('download',d=>download=d);
 await page.locator('#executiveExports summary').click();await page.locator('#exportScope').selectOption('selected');await page.locator('#exportExecutivesDwg').click();await page.waitForFunction(()=>document.querySelector('#busy').hidden,null,{timeout:300000});await page.waitForTimeout(500);
 console.log('EXPORT',await page.locator('#status').textContent());if(!download)throw Error('DWG not downloaded');const output=path.join(dir,'selected.dwg');await download.saveAs(output);await page.locator('#file').setInputFiles(output);await page.waitForFunction(()=>document.querySelector('#busy').hidden,null,{timeout:180000});console.log('READBACK',await page.evaluate(()=>({sheets:userTest.state().executiveProject?.sheets.length,shapes:userTest.shapes().length})),output);
 }finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
