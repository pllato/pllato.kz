import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {channelCreatesLeads,requiredGroupAdmins,PLLATO_TECH_INSTANCE} from './wa-channel-policy.js';
test('технический канал не создаёт лиды при сохранённой привязке к воронке',()=>{
 const technical={id_instance:PLLATO_TECH_INSTANCE,default_pipeline_id:'pipeline_r22lrm'};
 assert.equal(channelCreatesLeads(technical),false);
 assert.deepEqual(requiredGroupAdmins(technical).map(p=>p.chatId),['77064261516@c.us','77011239999@c.us']);
 assert.equal(channelCreatesLeads({id_instance:'720122810934',default_pipeline_id:'astana'}),true);
 assert.deepEqual(requiredGroupAdmins({id_instance:'720122810934'}),[]);
 assert.equal(channelCreatesLeads({id_instance:'other'}),false);
});
test('создание сделки техническим каналом останавливается до запросов в БД',async()=>{
 const src=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
 const body=src.slice(src.indexOf('async function ensureDealForWaContact('),src.indexOf('// GREEN-API',src.indexOf('async function ensureDealForWaContact(')));
 // Извлекаем только функцию с балансировкой фигурных скобок через следующий именованный блок.
 const end=body.indexOf('\n}\n')+3;
 const context=vm.createContext({channelCreatesLeads});vm.runInContext(body.slice(0,end),context);
 const env={DB:{prepare(){throw Error('Не должно быть обращений к базе');}}};
 assert.equal(await context.ensureDealForWaContact(env,{id_instance:PLLATO_TECH_INSTANCE,default_pipeline_id:'p'},'c','Клиент','77010000000'),null);
 assert.match(src,/evt.direction === 'in' && contactId && channelCreatesLeads\(channel\)/);
 assert.match(src,/if \(!channelCreatesLeads\(channel\)\) continue;/);
 const backfill=src.slice(src.indexOf('async function handleWaChannelBackfillDeals('),src.indexOf('// каналов клиентов'));
 assert.match(backfill,/if \(!channelCreatesLeads\(channel\)\) return json/);
});
