const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.route('http://127.0.0.1:8816/app/gate.js',r=>r.fulfill({body:'',contentType:'application/javascript'}));
  await page.goto('http://127.0.0.1:8816/app/stroy/dwg/');
  const start=Date.now();await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);
  await page.waitForFunction(()=>document.querySelector('#busy').hidden,{},{timeout:300000});
  const status=await page.locator('#status').textContent();if(!status.startsWith('Открыт'))throw Error(status);
  const openedMs=Date.now()-start;
  const render=await page.evaluate(async()=>{
   const samples=[];
   for(let i=0;i<12;i++){const t=performance.now();document.querySelector(i%2?'#minus':'#plus').click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));samples.push(performance.now()-t);}
   return samples;
  });
  console.log(JSON.stringify({openedMs,zoomMedianMs:render.sort((a,b)=>a-b)[6],zoomMaxMs:Math.max(...render),report:await page.locator('#report').textContent()}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
