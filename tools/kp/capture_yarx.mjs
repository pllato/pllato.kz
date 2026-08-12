import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/platontsay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const token = 'MTgwMTkxNTkzODA5My5nYXNnNnY=';
const port = process.env.DEMO_PORT || '4179';
const base = `http://127.0.0.1:${port}/app/yarx-control.html`;
const out = new URL('./assets/yarx/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });
const shots = new Set(['command','project','production','weekly','meeting','finance']);

async function enter(target, role = 'Собственник') {
  const button = target.locator('.role', { hasText: role }).first();
  if (await button.isVisible({ timeout: 450 }).catch(() => false)) await button.click();
}

for (const screen of ['command','portfolio','project','production','weekly','meeting','tasks','chat','finance','calendar','risks','contractors','reports']) {
  const errors = [];
  page.removeAllListeners('pageerror');
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}?k=${token}&s=${screen}`, { waitUntil: 'domcontentloaded' });
  await enter(page);
  await page.waitForTimeout(220);
  if (shots.has(screen)) await page.screenshot({ path: `${out}${screen}.png`, fullPage: false });
  if (errors.length) throw new Error(`${screen}: ${errors.join('; ')}`);
}

const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await phone.goto(`${base}?k=${token}&s=weekly`, { waitUntil: 'domcontentloaded' });
await enter(phone, 'Руководитель проекта');
await phone.waitForTimeout(250);
await phone.screenshot({ path: `${out}mobile-weekly.png`, fullPage: false });
await browser.close();
