const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('team.html','utf8');
const fn=name=>{const start=source.indexOf('async function '+name+'(');return source.slice(start,source.indexOf('\n}',start)+2);};
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();await page.setContent('<html><body></body></html>');
 await page.addScriptTag({content:`
 window.currentUser={role:'admin'};
 const fbAuth={currentUser:{getIdToken:async()=> 'test'}},WORKER_BASE_URL='https://test';
 const escapeHtml=s=>String(s||''),paintAvatarEl=()=>{},showToast=()=>{},renderUsersAdminTable=()=>{};
 window.allow=true;window.fail=false;window.calls=[];window.active=true;
 window.confirm=()=>window.allow;window.alert=()=>{};
 window.fetch=async(url,options={})=>{
  if(options.method==='PATCH'){calls.push({url,body:JSON.parse(options.body)});return {ok:!window.fail,status:409,json:async()=>({error:'last admin'})};}
  return {ok:true,json:async()=>url.endsWith('/profile')?{profile:{uid:'canonical',name:'Test',active:window.active},canEdit:false,isSelf:false}:{items:[]}};
 };
 ${fn('toggleUserActive')}
 ${fn('openEmployeeProfile')}`});
 await page.evaluate(()=>openEmployeeProfile('alias'));
 await page.getByRole('button',{name:'Деактивировать сотрудника'}).click();
 await page.getByRole('button',{name:'Восстановить сотрудника'}).waitFor();
 assert.equal(await page.locator('#ep-active-status').textContent(),' · ⏸ неактивен');
 assert.deepEqual(await page.evaluate(()=>calls[0]),{url:'https://test/api/admin/users/canonical/active',body:{active:false}});
 await page.getByRole('button',{name:'Восстановить сотрудника'}).click();await page.getByRole('button',{name:'Деактивировать сотрудника'}).waitFor();
 assert.equal(await page.evaluate(()=>calls[1].body.active),true);
 await page.evaluate(()=>window.allow=false);await page.locator('#ep-toggle-active').click();assert.equal(await page.evaluate(()=>calls.length),2);
 await page.evaluate(()=>{window.allow=true;window.fail=true;});await page.locator('#ep-toggle-active').click();assert.equal(await page.locator('#ep-active-status').textContent(),'');assert.equal(await page.locator('#ep-toggle-active').isEnabled(),true);
 await page.locator('#ep-close').click();await page.evaluate(()=>{window.currentUser.role='agent';return openEmployeeProfile('alias');});assert.equal(await page.locator('#ep-toggle-active').count(),0);
 console.log('Profile deactivation: admin UI, canonical ID, deactivate/restore, cancel, server rejection, non-admin visibility passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
