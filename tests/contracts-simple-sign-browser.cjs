const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});let posts=[],stored=false;
 await page.route('https://sign.test/**',r=>{
  const path=new URL(r.request().url()).pathname;
  if(path.endsWith('/ncalayer.js'))return r.fulfill({contentType:'text/javascript',body:'export class NcaLayerError extends Error{};export async function pingNcaLayer(){return true};export async function signBase64(base64){window.signedBytes=base64;window.method="nca";return {cms:"test-signature",signer:{cn:"Certificate name"},tsp:true}}'});
  if(path.endsWith('/egov.js'))return r.fulfill({contentType:'text/javascript',body:'export const pendingEgov=()=>null;export const clearEgov=()=>{};export async function signWithEgov(args){window.signedBytes=args.base64;window.method="egov";window.metadata=args.metadata;return {cms:"test-signature",signer:{cn:"Certificate name"},tsp:true}}'});
  if(path.endsWith('/otp/request')){posts.push(r.request().postDataJSON());return r.fulfill({json:{ok:true,challengeId:'challenge',phone:'+77771234567',retryAfter:60}});}
  if(path.endsWith('/otp/verify')){const b=r.request().postDataJSON();posts.push(b);return r.fulfill({status:b.code==='123456'?200:400,json:b.code==='123456'?{ok:true,signer:{status:'signed',signatureMethod:'whatsapp_otp'}}:{error:'Неверный код'}});}
  if(path.startsWith('/api/sign/')){
   if(path.endsWith('/file'))return r.fulfill({body:'original contract bytes',contentType:'application/pdf'});
   if(r.request().method()==='POST'){posts.push(r.request().postDataJSON());return r.fulfill({json:{ok:true,signer:{status:'signed',signerCn:'Certificate name'}}});}
   return r.fulfill({json:{ok:true,contract:{title:'Договор на разработку CRM',fileName:'contract.pdf',fileMime:'application/pdf',fileHash:'hash'},signer:{status:'pending',fullName:'',...(stored?{signerType:'ip',requisites:{data:{name:'Компания',iinBin:'123456789012',address:'Адрес',iban:'Счёт'}}}:{})},parties:[]}});
  }
  if(path==='/app.config.js')return r.fulfill({body:'window.PLLATO_API_BASE="https://sign.test";',contentType:'text/javascript'});
  const file=path==='/'?'sign.html':path.slice(1);
  if(!fs.existsSync(file))return r.fulfill({status:404,body:''});
  return r.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
 });
 for(const method of ['nca','egov']){
  stored=method==='egov';await page.goto('https://sign.test/sign.html?c=test');await page.waitForSelector('#btn-next');
  assert.equal(await page.locator('#req-form > .fld input').count(),2);assert.equal(await page.locator('#type-seg').count(),0);
  const button=page.locator(method==='nca'?'#btn-sign':'#btn-egov');
  await page.locator('[data-f=name]').fill('');await page.locator('#btn-next').click();assert.equal(posts.length,method==='nca'?0:1);assert((await page.locator('#sign-form-status').textContent()).includes('имя'));
  await page.locator('[data-f=name]').fill('Пётр Иванов');await page.locator('[data-f=phone]').fill('+77771234567');await page.locator('#btn-next').click();
  if(method==='nca')await page.locator('#req-form').screenshot({path:'/tmp/simple-contract-sign.png'});
  await button.click();await page.waitForSelector('.result-box.ok');
  assert.equal(await page.evaluate(()=>window.method),method);assert.equal(await page.evaluate(()=>atob(window.signedBytes)),'original contract bytes');
  const post=posts.at(-1);assert.equal(post.requisites.data.name,'Пётр Иванов');assert.equal(post.cmsBase64,'test-signature');
  if(stored){assert.equal(post.requisites.data.iban,'Счёт');assert.equal(post.requisites.data.iinBin,'123456789012');assert.equal(post.signerType,'ip');}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 stored=false;await page.goto('https://sign.test/sign.html?c=test');await page.waitForSelector('#btn-next');
 assert.equal(await page.locator('#btn-otp').isVisible(),false);
 await page.locator('[data-f=name]').fill('Иван');await page.locator('[data-f=phone]').fill('+77771234567');await page.locator('#btn-next').click();
 await page.locator('#btn-otp').click();assert.equal(await page.locator('#otp-recipient').textContent(),'+77771234567');
 await page.locator('#btn-otp-send').click();await page.waitForSelector('#otp-code');
 assert.equal(posts.at(-1).phone,'+77771234567');assert.equal(posts.at(-1).fileHash,'hash');
 await page.locator('#otp-code').fill('000000');await page.locator('#btn-otp-verify').click();assert.match(await page.locator('#sign-form-status').textContent(),/согласие/);
 await page.locator('#otp-consent').check();await page.locator('#btn-otp-verify').click();await page.waitForFunction(()=>document.querySelector('#sign-form-status').textContent==='Неверный код');
 await page.locator('#req-form').screenshot({path:'/tmp/contract-whatsapp-otp-mobile.png'});
 await page.locator('#otp-code').fill('123456');await page.locator('#btn-otp-verify').click();await page.waitForSelector('.result-box.ok');
 assert.match(await page.locator('.result-box.ok').textContent(),/кодом WhatsApp/);assert.doesNotMatch(await page.locator('.result-box.ok').textContent(),/вашей ЭЦП/);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS: identity step, blank validation, both signing paths, original document bytes, saved requisites, mobile');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
