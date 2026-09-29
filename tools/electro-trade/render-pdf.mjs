import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const base = process.env.ELECTRO_BASE || 'http://localhost:8765';
const root = new URL('../../', import.meta.url).pathname;
const outputDir = `${root}output/pdf`;
const appOutput = `${root}app/Pllato_KP_ElectroTrade_Control.pdf`;
const archiveOutput = `${outputDir}/Pllato_KP_ElectroTrade_Control.pdf`;
fs.mkdirSync(outputDir, { recursive: true });

function hash(value) {
  let x = 7;
  for (let i = 0; i < value.length; i += 1) x = ((x * 31) + value.charCodeAt(i)) >>> 0;
  return x.toString(36);
}
const exp = String(Date.now() + 60 * 60 * 1000);
const token = Buffer.from(`${exp}.${hash(`${exp}pllato-nan-dan-2026`)}`).toString('base64').replace(/=+$/, '');

const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('pageerror', err => console.error('PAGE', err.message));
await page.goto(`${base}/app/kp-electro-trade.html?k=${encodeURIComponent(token)}`, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: archiveOutput, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
fs.copyFileSync(archiveOutput, appOutput);
await browser.close();
console.log(archiveOutput);
