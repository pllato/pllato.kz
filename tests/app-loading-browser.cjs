const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.html','utf8');
const css=[...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(x=>x[1]).join('\n');
const fn=name=>{const start=source.indexOf('function '+name+'(');return source.slice(start,source.indexOf('\n}',start)+2);};
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 for(const width of [1440,800,390]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.setContent(`<style>${css}</style><div style="padding:20px"><div id="calWidget" class="cal-widget"></div><div id="after">Проекты</div></div>`);
 await page.addScriptTag({content:`var CAL_EVENTS=null;const calCanSee=()=>true,calCanSeeWidget=()=>true,escapeHtml=s=>String(s),calBindTips=()=>{};${fn('calTimeLabel')}\n${fn('calZoomUrl')}\n${fn('renderTodayCalendar')}`});
 await page.evaluate(()=>renderTodayCalendar());const before=await page.locator('#after').boundingBox();
 for(const count of [0,1,8]){
 await page.evaluate(count=>{CAL_EVENTS=Array.from({length:count},(_,i)=>({at:Date.now()+i*3600000,end:Date.now()+(i+1)*3600000,title:'Встреча с клиентом длинное название',kind:'meet',href:'#'}));renderTodayCalendar();},count);
 assert.equal((await page.locator('#after').boundingBox()).y,before.y,`${width}px / ${count} events shifted projects`);
 await page.evaluate(()=>{CAL_EVENTS.forEach(e=>e.zoomUrl='https://zoom.us/j/123');renderTodayCalendar();});
 assert.equal((await page.locator('#after').boundingBox()).y,before.y,'Zoom links shifted layout');
 }
 await page.addScriptTag({content:source.match(/<script>([\s\S]*?)<\/script>/)[1]});
 await page.evaluate(()=>{document.body.style.minHeight='3000px';window.scrollTo(0,600);window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:false}));});
 assert.equal(await page.evaluate(()=>window.scrollY),0,'Fresh visit starts at top');
 await page.screenshot({path:`/tmp/app-loading-${width}.png`});await page.close();
 }
 console.log('Calendar loading/empty/events/Zoom geometry stable: desktop, tablet, mobile');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
