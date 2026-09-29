import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const base = process.env.ELECTRO_BASE || 'http://localhost:8765';
const out = new URL('../../app/electro-trade-assets/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });
page.on('console', msg => { if (msg.type() === 'error') console.error('BROWSER', msg.text()); });
page.on('pageerror', err => console.error('PAGE', err.message));

async function section(name, slug) {
  await page.goto(`${base}/app/electro-trade.html?s=${slug}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    sessionStorage.setItem('volt-guide', '1');
    document.querySelector('#guide')?.classList.remove('show');
  });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
}

await section('dashboard', 'dash');
await section('sales', 'sales');
await page.locator('[data-deal="D-1048"]').click();
await page.screenshot({ path: `${out}/deal.png`, fullPage: false });
await page.keyboard.press('Escape');
await section('inbox', 'inbox');
await section('stock', 'stock');
await section('purchase', 'purchase');
await section('shipping', 'shipping');
await section('analytics', 'analytics');
await section('sync', 'sync');

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await mobile.goto(`${base}/app/electro-trade.html?s=dash`, { waitUntil: 'networkidle' });
await mobile.evaluate(() => {
  sessionStorage.setItem('volt-guide', '1');
  document.querySelector('#guide')?.classList.remove('show');
});
await mobile.screenshot({ path: `${out}/mobile.png`, fullPage: false });

await browser.close();
console.log(out);
