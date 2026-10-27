import test from 'node:test';import assert from 'node:assert/strict';
import {waDeliveryStatus} from './wa-delivery-status.js';
const channel={api_url:'https://api.greenapi.com',id_instance:'123',api_token_instance:'test'};
const response=x=>new Response(JSON.stringify(x));
test('queue receipt without provider message is not sent',async()=>{const r=await waDeliveryStatus(channel,'g','m',async u=>u.includes('/getMessage/')?new Response('',{status:404}):response({stateInstance:'authorized'}));assert.equal(r.status,'pending');});
test('blocked connection is explicit, never sent',async()=>{assert.equal((await waDeliveryStatus(channel,'g','m',async u=>u.includes('/getMessage/')?new Response('',{status:404}):response({stateInstance:'blocked'}))).status,'blocked');});
test('only matching provider message confirms sent/delivered/read or failure',async()=>{for(const status of ['sent','delivered','read','failed'])assert.equal((await waDeliveryStatus(channel,'g','m',async()=>response({idMessage:'m',chatId:'g',statusMessage:status}))).status,status);assert.equal((await waDeliveryStatus(channel,'g','m',async()=>response({idMessage:'other',chatId:'g',statusMessage:'sent'}))).status,'unknown');});
test('provider errors do not become failure or success',async()=>{assert.equal((await waDeliveryStatus(channel,'g','m',async()=>{throw Error('network');})).status,'unknown');});
