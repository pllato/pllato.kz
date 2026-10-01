import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outDir = path.join(root, 'output', 'pdf');
const reviewDir = path.join(root, 'tmp', 'meetings-20260930-review');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: chrome });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });

for (const item of [
  { demo: 'rashit-pack.html', kp: 'kp-rashit-pack.html', pdf: 'Pllato_KP_Rashit_Pack_Recycle.pdf', shot: 'rashit-dashboard.png' },
  { demo: 'eventflow-inna.html', kp: 'kp-eventflow-inna.html', pdf: 'Pllato_KP_EventFlow_Inna.pdf', shot: 'eventflow-dashboard.png' },
]) {
  await page.goto(pathToFileURL(path.join(root, 'app', item.demo)).href, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(reviewDir, item.shot), fullPage: true });

  await page.goto(pathToFileURL(path.join(root, 'app', item.kp)).href, { waitUntil: 'networkidle' });
  const pdfPath = path.join(outDir, item.pdf);
  await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });
  fs.copyFileSync(pdfPath, path.join(root, 'app', item.pdf));
}

await browser.close();
console.log('rendered demos and PDFs');
