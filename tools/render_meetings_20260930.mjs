import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outDir = path.join(root, 'output', 'pdf');
const reviewDir = path.join(root, 'tmp', 'meetings-20260930-review');
const screenDir = path.join(root, 'app', 'assets', 'kp-20261001');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });
fs.mkdirSync(screenDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: chrome });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const item of [
  { demo: 'rashit-pack.html', kp: 'kp-rashit-pack.html', pdf: 'Pllato_KP_Rashit_Pack_Recycle.pdf', shot: 'rashit-dashboard.png', shots: [['desk','rashit-desk.png'],['routes','rashit-routes.png'],['orders','rashit-orders.png']] },
  { demo: 'eventflow-inna.html', kp: 'kp-eventflow-inna.html', pdf: 'Pllato_KP_EventFlow_Inna.pdf', shot: 'eventflow-dashboard.png', shots: [['desk','event-desk.png'],['estimate','event-estimate.png'],['projects','event-projects.png']] },
]) {
  const demoUrl = pathToFileURL(path.join(root, 'app', item.demo)).href;
  await page.goto(demoUrl, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(reviewDir, item.shot), fullPage: true });
  for (const [section, file] of item.shots) {
    await page.goto(demoUrl, { waitUntil: 'networkidle' });
    await page.evaluate((section) => {
      document.querySelectorAll('.screen').forEach((node) => node.classList.remove('on'));
      document.querySelector(`#s-${section}`)?.classList.add('on');
      document.querySelectorAll('.nav button').forEach((node) => node.classList.toggle('on', node.dataset.s === section));
    }, section);
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(screenDir, file), fullPage: false });
  }

  await page.goto(pathToFileURL(path.join(root, 'app', item.kp)).href, { waitUntil: 'networkidle' });
  const pdfPath = path.join(outDir, item.pdf);
  await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });
  fs.copyFileSync(pdfPath, path.join(root, 'app', item.pdf));
}

await browser.close();
console.log('rendered demos and PDFs');
