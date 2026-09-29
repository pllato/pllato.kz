import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const base = process.env.REHAB_BASE || 'http://localhost:8317';
const token = 'MTgxNjg2MTk1Njc0OS52NzQzZjM=';
const out = new URL('../../app/rehab-timur-assets/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
page.on('console', msg => { if (msg.type() === 'error') console.error('BROWSER', msg.text()); });
page.on('pageerror', err => console.error('PAGE', err.message));

for (const [name, section] of [['dashboard','dashboard'],['sales','sales'],['patient','patients'],['warehouse','warehouse']]) {
  await page.goto(`${base}/app/rehab-timur.html?k=${encodeURIComponent(token)}&s=${section}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await mobile.goto(`${base}/app/rehab-timur.html?k=${encodeURIComponent(token)}&s=dashboard`, { waitUntil: 'networkidle' });
await mobile.screenshot({ path: `${out}/mobile.png`, fullPage: true });

await browser.close();
