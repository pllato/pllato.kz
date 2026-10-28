const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
  try {
    const context = await browser.newContext();
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/auth/google') return route.fulfill({json: {token: 'test-token', exp: Math.floor(Date.now()/1000)+3600, user: {email:'test@example.com', name:'Test'}}});
      if (url.pathname === '/app.config.js') return route.fulfill({contentType:'text/javascript', body:`window.PLLATO_API_BASE='https://login.test';window.PLLATO_GOOGLE_CLIENT_ID='test';window.google={accounts:{id:{initialize: o=>window.testLogin=o.callback, renderButton:()=>{}}}};`});
      if (url.pathname === '/app.html') return route.fulfill({contentType:'text/html',body:'<!doctype html><title>App destination</title>'});
      if (['/login.html','/pllato-kz-shared/pllato-api.js'].includes(url.pathname)) return route.fulfill({contentType:url.pathname.endsWith('.js')?'text/javascript':'text/html',body:fs.readFileSync(path.join(__dirname,'..',url.pathname))});
      return route.fulfill({body:''});
    });
    const page = await context.newPage();
    await page.goto('https://login.test/app.html');
    await context.addInitScript(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (this === localStorage && localStorage.getItem('test-full') === 'yes' && key !== 'test-full') {
          throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
        }
        return set.call(this, key, value);
      };
    });
    await page.evaluate(() => {
      localStorage.setItem('important-draft','keep');
      localStorage.setItem('test-full','yes');
    });
    await page.goto('https://login.test/login.html');
    await page.waitForFunction(()=>typeof window.testLogin==='function');
    await page.evaluate(()=>window.testLogin({credential:'mock'}));
    await page.waitForURL('**/app.html');
    const read = () => page.evaluate(async()=> (await import('/pllato-kz-shared/pllato-api.js')).getSession());
    assert.equal((await read()).user.email,'test@example.com');
    await page.reload();
    assert.equal((await read()).token,'test-token');
    assert.equal(await page.evaluate(()=>localStorage.getItem('important-draft')),'keep');
    await page.evaluate(async()=> (await import('/pllato-kz-shared/pllato-api.js')).signOut());
    assert.equal(await read(),null);
    await page.evaluate(()=>localStorage.removeItem('test-full'));
    await page.goto('https://login.test/login.html');
    await page.waitForFunction(()=>typeof window.testLogin==='function');
    await page.evaluate(()=>window.testLogin({credential:'mock'}));
    await page.waitForURL('**/app.html');
    assert.ok(await page.evaluate(()=>localStorage.getItem('pllato_session')));
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('pllato_session')),null);
    console.log('PASS: full localStorage login, navigation/reload, draft preservation, sign-out, normal persistent login');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
