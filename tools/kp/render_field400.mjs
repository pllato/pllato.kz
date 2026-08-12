import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: chrome, headless: true });
for (const [source, output] of [
  ['/Users/platontsay/tmp/worktrees/publish-okna-kp/tools/kp/kp_field400.html','/Users/platontsay/tmp/worktrees/publish-okna-kp/output/pdf/Pllato_KP_FIELD400_CRM.pdf'],
  ['/Users/platontsay/tmp/worktrees/publish-okna-kp/tools/kp/kp_yarx.html','/Users/platontsay/tmp/worktrees/publish-okna-kp/output/pdf/Pllato_KP_YARX_Control.pdf']
]) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(source).href, { waitUntil: 'load' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({path:output,printBackground:true,preferCSSPageSize:true,margin:{top:'0',right:'0',bottom:'0',left:'0'}});
  await page.close();
}
await browser.close();
