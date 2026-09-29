import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const base = process.env.REHAB_BASE || 'http://localhost:8317';
const token = 'MTgxNjg2MTk1Njc0OS52NzQzZjM=';
const output = new URL('../../app/Pllato_KP_RECOVERY_Control_Timur.pdf', import.meta.url).pathname;
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', err => console.error('PAGE', err.message));
await page.goto(`${base}/app/kp-rehab-timur.html?k=${encodeURIComponent(token)}`, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: output, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
await browser.close();
console.log(output);
