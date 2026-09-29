import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base=process.env.REHAB_BASE||'http://localhost:8317';
const token='MTgxNjg2MTk1Njc0OS52NzQzZjM=';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1440,height:980}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
await page.goto(`${base}/app/rehab-timur.html?k=${encodeURIComponent(token)}`,{waitUntil:'networkidle'});
const views=await page.locator('.nav-item').evaluateAll(xs=>xs.map(x=>x.dataset.view));
for(const view of views){await page.locator(`.nav-item[data-view="${view}"]`).click();if(!await page.locator(`.view[data-page="${view}"]`).isVisible())throw new Error(`view ${view} is hidden`)}
await page.locator('.nav-item[data-view="sales"]').click();await page.locator('.lead-card[data-id="marina"]').click();if(!await page.locator('#drawer.open').isVisible())throw new Error('lead drawer did not open');await page.locator('#drawerClose').click();
await page.locator('#tourBtn').click();if(!await page.locator('#modalShade.open').isVisible())throw new Error('tour did not open');await page.locator('#modalClose').click();
await page.setViewportSize({width:390,height:844});await page.locator('#mobileMenu').click();if(!await page.locator('#sidebar.open').isVisible())throw new Error('mobile nav did not open');
console.log(JSON.stringify({views:views.length,errors,bodyWidth:await page.locator('body').evaluate(x=>x.scrollWidth),viewport:390}));
await browser.close();if(errors.length)process.exitCode=1;
