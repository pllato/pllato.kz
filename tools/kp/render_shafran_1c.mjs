import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source = '/Users/platontsay/tmp/worktrees/publish-okna-kp/tools/kp/kp_shafran_1c.html';
const output = '/Users/platontsay/tmp/worktrees/publish-okna-kp/output/pdf/Pllato_KP_SHAFRAN_1C_Integration.pdf';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
await page.goto(pathToFileURL(source).href, { waitUntil: 'load' });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: output, printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
await browser.close();
