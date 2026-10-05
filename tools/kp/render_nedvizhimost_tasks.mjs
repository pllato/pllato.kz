import { createRequire } from 'module';
import path from 'path';
const require=createRequire(import.meta.url);
const { chromium }=require('/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage();await page.goto('file://'+path.resolve('tools/kp/kp_nedvizhimost_tasks.html'),{waitUntil:'networkidle'});await page.pdf({path:'output/pdf/Pllato_Dop_KP_Nedvizhimost_Task_Manager_commercial.pdf',format:'A4',printBackground:true,margin:{top:'0',right:'0',bottom:'0',left:'0'}});await browser.close();})();
