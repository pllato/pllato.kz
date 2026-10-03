import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const app = path.join(root, 'app');
const out = path.join(root, 'output', 'pdf');
fs.mkdirSync(out, { recursive: true });

const jobs = [
  ['kp-apteka-flow-yerlan.html', 'Pllato_KP_APTEKA_FLOW_Yerlan.pdf', 'Pllato_KP_APTEKA_FLOW_Yerlan.pdf'],
  ['dogovor-bipharm.html', 'Dogovor_BIPHARM_BIP-2026-01.pdf', 'dogovor-bipharm.pdf'],
  ['schet-bipharm-1.html', 'Pllato_Schet_BIPHARM_Advance_230000.pdf', 'schet-bipharm-1.pdf'],
];

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

for (const [htmlName, outputName, publicName] of jobs) {
  await page.goto(pathToFileURL(path.join(app, htmlName)).href, { waitUntil: 'networkidle' });
  const outputPath = path.join(out, outputName);
  await page.pdf({ path: outputPath, printBackground: true, preferCSSPageSize: true });
  fs.copyFileSync(outputPath, path.join(app, publicName));
  console.log(`${htmlName} -> ${outputName}`);
}

await browser.close();
