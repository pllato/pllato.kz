import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const page = await browser.newPage({viewport:{width:1440,height:900}, deviceScaleFactor:1});
  await page.goto('file://' + path.resolve('app/nedvizhimost.html'));
  await page.click('.role-card');
  await page.waitForTimeout(400);
  await page.screenshot({path:'tools/kp/nedvizhimost-dashboard.png', fullPage:false});
  await page.evaluate(() => showSection('deals', document.querySelectorAll('#navSales .nav-link')[5]));
  await page.waitForTimeout(200);
  await page.screenshot({path:'tools/kp/nedvizhimost-deals.png', fullPage:false});
  await browser.close();
})();
