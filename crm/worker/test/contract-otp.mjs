import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleContractOtp,otpPhone,ensureOtpSchema} from '../contract-otp.js';
function fixture() {
 const sql=new DatabaseSync(':memory:');
 sql.exec(`CREATE TABLE contracts(id TEXT PRIMARY KEY,file_hash TEXT,status TEXT);INSERT INTO contracts VALUES('c','hash','draft');
 CREATE TABLE contract_signers(id TEXT PRIMARY KEY,contract_id TEXT,role TEXT,full_name TEXT,contact TEXT,token TEXT,order_index INTEGER,status TEXT,signed_at INTEGER,signed_ip TEXT,created_at INTEGER,updated_at INTEGER);`);
 const db={prepare(q){const s={args:[],bind(...a){this.args=a;return this},async first(){return sql.prepare(q).get(...this.args)||null},async run(){return sql.prepare(q).run(...this.args)}};return s},async batch(stmts){sql.exec('BEGIN');try{const r=[];for(const s of stmts)r.push(await s.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
 const sent=[];const env={CONTRACT_OTP_SECRET:'test-only-secret'};
 const contract={id:'c',file_hash:'hash',title:'Договор',status:'draft',link_mode:'universal'};
 const deps={db,fail:(status,message)=>Object.assign(new Error(message),{status}),send:async(phone,text)=>{sent.push({phone,text});return 'message-id'},sync:async()=>{}};
 const base={name:'Иван',phone:'+7 (777) 123-45-67',fileHash:'hash'};
 async function call(action,extra={},scope='universal',signer) {return handleContractOtp(new Request('https://test/otp/'+action,{method:'POST',headers:{'CF-Connecting-IP':'127.0.0.1'},body:JSON.stringify({...base,...extra})}),env,{contract,scope,action,signer},deps)}
 const code=()=>sent.at(-1).text.match(/Код: (\d{6})/)[1];
 return {sql,db,sent,call,code,base,deps,contract};
}
test('normalizes phone and rejects chat ids/invalid numbers',()=>{assert.equal(otpPhone('8 (777) 123-45-67'),'77771234567');for(const n of ['123','77771234567@g.us','+a77771234567'])assert.throws(()=>otpPhone(n));});
test('sends explanatory code to entered phone, verifies exact document once, saves proof without CMS',async()=>{
 const f=fixture();const c=await f.call('request');assert.equal(f.sent[0].phone,'77771234567');assert.match(f.sent[0].text,/согласие/);assert(!JSON.stringify(c).includes(f.code()));
 const row=f.sql.prepare('SELECT * FROM contract_otp').get();assert.notEqual(row.code_hash,f.code());
 const b={challengeId:c.challengeId,code:f.code(),consent:true};
 const done=await f.call('verify',b);assert.equal(done.signer.signatureMethod,'whatsapp_otp');
 await f.call('verify',b);assert.equal(f.sql.prepare('SELECT count(*) n FROM contract_signers').get().n,1);
 const signer=f.sql.prepare('SELECT * FROM contract_signers').get();const evidence=JSON.parse(signer.confirmation_json);assert.equal(evidence.fileHash,'hash');assert.equal(evidence.phone,'+77771234567');assert(!signer.confirmation_json.includes(f.code()));
});
test('requires consent, matching name/phone/document and caps wrong codes at five',async()=>{
 const f=fixture(), c=await f.call('request'), b={challengeId:c.challengeId,code:f.code(),consent:true};
 for(const change of [{consent:false},{name:'Другой'},{phone:'+77771234568'},{fileHash:'changed'}])await assert.rejects(f.call('verify',{...b,...change}));
 for(let i=0;i<5;i++)await assert.rejects(f.call('verify',{...b,code:f.code()==='000000'?'111111':'000000'}),/Неверный/);
 await assert.rejects(f.call('verify',b),/попытки/);assert.equal(f.sql.prepare('SELECT count(*) n FROM contract_signers').get().n,0);
});
test('expired codes, wrong scope, cancelled contracts cannot confirm',async()=>{
 const f=fixture(),c=await f.call('request'),b={challengeId:c.challengeId,code:f.code(),consent:true};
 await assert.rejects(f.call('verify',b,'other'));
 f.sql.exec('UPDATE contract_otp SET expires_at=0');await assert.rejects(f.call('verify',b));
 f.contract.status='cancelled';await assert.rejects(f.call('request'),/отменён/);
});
test('resend limits, failed provider and concurrent verification are safe',async()=>{
 const f=fixture(),c=await f.call('request');await assert.rejects(f.call('request'),/много|минут/);
 const b={challengeId:c.challengeId,code:f.code(),consent:true};
 await Promise.allSettled([f.call('verify',b),f.call('verify',b)]);assert.equal(f.sql.prepare('SELECT count(*) n FROM contract_signers').get().n,1);
 const g=fixture();g.deps.send=async()=>{throw new Error('secret provider details')};await assert.rejects(g.call('request'),/Не удалось отправить/);assert.equal(g.sql.prepare('SELECT status FROM contract_otp').get().status,'failed');
});
test('named recipient updates only its pending row',async()=>{
 const f=fixture();f.sql.exec("INSERT INTO contract_signers(id,contract_id,status) VALUES('named','c','pending')");
 const signer={id:'named',status:'pending'},c=await f.call('request',{},'named',signer);
 const done=await f.call('verify',{challengeId:c.challengeId,code:f.code(),consent:true},'named',signer);
 assert.equal(done.signer.status,'signed');assert.equal(f.sql.prepare('SELECT count(*) n FROM contract_signers').get().n,1);
});
