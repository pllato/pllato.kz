import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root=path.resolve(import.meta.dirname,'..');
const app=path.join(root,'app');
const shots=path.join(app,'assets','kp-20261001');
const review=path.join(root,'tmp','pharmacy-yerlan-review');
const out=path.join(root,'output','pdf');
for(const dir of [shots,review,out]) fs.mkdirSync(dir,{recursive:true});

const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const demo=pathToFileURL(path.join(app,'apteka-flow-yerlan.html')).href;
for(const [section,file] of [['desk','yerlan-desk.png'],['orders','yerlan-orders.png'],['catalog','yerlan-catalog.png']]){
  await page.goto(demo,{waitUntil:'networkidle'});
  await page.evaluate(section=>{
    document.querySelectorAll('.screen').forEach(node=>node.classList.remove('on'));
    document.querySelector(`#s-${section}`)?.classList.add('on');
    document.querySelectorAll('.nav button').forEach(node=>node.classList.toggle('on',node.dataset.s===section));
  },section);
  await page.screenshot({path:path.join(shots,file),fullPage:false});
}
await page.goto(pathToFileURL(path.join(app,'kp-apteka-flow-yerlan.html')).href,{waitUntil:'networkidle'});
const pdf=path.join(out,'Pllato_KP_APTEKA_FLOW_Yerlan.pdf');
await page.pdf({path:pdf,printBackground:true,preferCSSPageSize:true});
fs.copyFileSync(pdf,path.join(app,'Pllato_KP_APTEKA_FLOW_Yerlan.pdf'));
await page.goto(demo,{waitUntil:'networkidle'});
await page.screenshot({path:path.join(review,'demo.png'),fullPage:false});
await browser.close();
console.log('rendered APTEKA FLOW screenshots and PDF');
