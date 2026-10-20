const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});let sends=[],empty=false,fail=false;
 await page.route('https://local.test/**',r=>r.fulfill({body:fs.readFileSync('app/'+new URL(r.request().url()).pathname.slice(1)),contentType:'text/javascript'}));
 await page.route('https://pllato-elc-worker.uurraa.workers.dev/**',async r=>{
  const url=r.request().url();
  if(url.endsWith('/send')){sends.push(r.request().postDataJSON());return r.fulfill({status:fail?502:200,json:fail?{error:'Provider unavailable'}:{ok:true,idMessage:'test-id'}});}
  if(url.includes('/channels/public'))return r.fulfill({json:{items:[{idInstance:'123',displayName:'Рабочий Pllato'}]}});
  return r.fulfill({json:{chats:empty?[]:[{id:'wa:123:one@g.us',chat_id:'one@g.us',instance_id:'123',name:'Клиент — проект'},{id:'wa:123:two@g.us',chat_id:'two@g.us',instance_id:'123',name:'Клиент — другая группа'}]}});
 });
 await page.goto('https://local.test/proposal-whatsapp.js');
 await page.evaluate(async()=>{
  document.body.innerHTML='<article class="tool-card" data-app-id="demo"><h3>Демо клиента</h3><a href="https://pllato.kz/app/KP_test.pdf">КП PDF</a><a href="https://pllato.kz/app/contract.pdf">Договор PDF</a></article>';
  const {initProposalWhatsApp}=await import('https://local.test/proposal-whatsapp.js');initProposalWhatsApp({getToken:()=> 'test',getDeals:()=>window.noDeal?[]:[{id:'deal1',title:'Клиент'}]});
 });
 await page.locator('[data-proposal-wa]').click();await page.waitForFunction(()=>document.querySelector('[name=recipient]').options.length===3);
 assert(await page.locator('[data-send]').isDisabled());assert.equal(sends.length,0);
 await page.locator('[name=recipient]').selectOption('wa:123:one@g.us');
 assert.equal(await page.locator('[name=caption]').inputValue(),'В продолжение встречи, высылаем вам подготовленное КП.');
 await page.screenshot({path:'/tmp/proposal-whatsapp.png'});
 await page.locator('[data-send]').click();await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('Отправлено'));
 assert.equal(sends.length,1);assert.equal(sends[0].chatId,'wa:123:one@g.us');assert.equal(sends[0].instanceId,'123');assert.equal(sends[0].mediaUrl,'https://pllato.kz/app/KP_test.pdf');assert.equal(sends[0].fileName,'KP_test.pdf');assert(await page.locator('[data-send]').isDisabled());assert.equal(await page.locator('[data-proposal-wa]').count(),1);
 await page.keyboard.press('Escape');empty=true;await page.locator('[data-proposal-wa]').click();await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('не найдена'));assert(await page.locator('[data-send]').isDisabled());
 await page.keyboard.press('Escape');empty=false;fail=true;await page.locator('[data-proposal-wa]').click();await page.waitForFunction(()=>document.querySelector('[name=recipient]').options.length===3);await page.locator('[name=recipient]').selectOption('wa:123:two@g.us');await page.locator('[data-send]').click();await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('Provider unavailable'));assert(!await page.locator('[data-send]').isDisabled());
 await page.keyboard.press('Escape');await page.evaluate(()=>window.noDeal=true);await page.locator('[data-proposal-wa]').click();assert((await page.locator('[role=status]').textContent()).includes('Сначала привяжите'));assert(await page.locator('[data-send]').isDisabled());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS: explicit recipient, correct channel/PDF/caption, single send, no group, provider failure, mobile');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
