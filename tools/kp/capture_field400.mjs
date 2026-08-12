import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = process.env.DEMO_PORT || '4179';
const base = `http://127.0.0.1:${port}/app/field400.html`;
const token = 'MTgwMTkxNTkzODA5My5nYXNnNnY=';
const out = new URL('./assets/field400/', import.meta.url).pathname;

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });

async function enterIfNeeded(target, role) {
  const button = target.locator('.role', { hasText: role }).first();
  if (await button.isVisible({ timeout: 400 }).catch(() => false)) await button.click();
}

const shots = new Set(['pulse', 'map', 'recovery', 'analytics']);
for (const screen of ['pulse', 'map', 'inbox', 'clients', 'missions', 'recovery', 'team', 'analytics', 'integrations']) {
  const errors = [];
  page.removeAllListeners('pageerror');
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}?k=${token}&s=${screen}`, { waitUntil: 'domcontentloaded' });
  await enterIfNeeded(page, 'Руководитель');
  await page.waitForTimeout(300);
  if (shots.has(screen)) await page.screenshot({ path: `${out}${screen}.png`, fullPage: false });
  if (errors.length) throw new Error(`${screen}: ${errors.join('; ')}`);
}

await page.goto(`${base}?k=${token}&s=visit`, { waitUntil: 'domcontentloaded' });
await enterIfNeeded(page, 'Руководитель');
await page.getByRole('button', { name: /CHECK-IN/ }).click();
await page.getByRole('button', { name: /Фото сделано/ }).click();
await page.getByRole('button', { name: /Остановить/ }).click();
await page.waitForTimeout(250);
await page.screenshot({ path: `${out}visit.png`, fullPage: false });

const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await phone.goto(`${base}?k=${token}&s=visit`, { waitUntil: 'domcontentloaded' });
await enterIfNeeded(phone, 'Агент');
await phone.waitForTimeout(250);
await phone.screenshot({ path: `${out}mobile-visit.png`, fullPage: false });

await browser.close();
