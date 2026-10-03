import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = path.resolve(import.meta.dirname, '..');
const app = path.join(root, 'app');
const out = path.join(root, 'output', 'pdf');
fs.mkdirSync(out, { recursive: true });

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

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
await page.route('**/app/gate.js', route => route.fulfill({
  status: 200,
  contentType: 'text/javascript; charset=utf-8',
  body: '/* access gate intentionally disabled for trusted PDF rendering */',
}));

for (const [htmlName, outputName, publicName] of jobs) {
  await page.goto(`http://127.0.0.1:${port}/app/${htmlName}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
  const outputPath = path.join(out, outputName);
  await page.pdf({ path: outputPath, printBackground: true, preferCSSPageSize: true });
  fs.copyFileSync(outputPath, path.join(app, publicName));
  console.log(`${htmlName} -> ${outputName}`);
}

await browser.close();
await new Promise(resolve => server.close(resolve));
