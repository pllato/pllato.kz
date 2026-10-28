import test from 'node:test';
import assert from 'node:assert/strict';
import {issueTurnCredentials} from './turn.js';
test('unconfigured relay is explicitly unavailable',async()=>{
 assert.deepEqual(await issueTurnCredentials({},()=>{throw Error('must not call')}),{available:false});
});
test('master key remains server side, short-lived UDP/TLS credentials returned',async()=>{
 const result=await issueTurnCredentials({TURN_KEY_ID:'key',TURN_KEY_TOKEN:'master'},async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer master');assert.equal(JSON.parse(options.body).ttl,21600);
  return Response.json({iceServers:[{urls:['turn:turn.cloudflare.com:3478?transport=udp','turns:turn.cloudflare.com:443?transport=tcp'],username:'temporary',credential:'temporary-password'}]});
 });
 assert.equal(result.available,true);assert.ok(!JSON.stringify(result).includes('master'));
});
test('provider errors and missing relay do not claim success',async()=>{
 await assert.rejects(issueTurnCredentials({TURN_KEY_ID:'key',TURN_KEY_TOKEN:'token'},async()=>new Response('',{status:403})),/403/);
 await assert.rejects(issueTurnCredentials({TURN_KEY_ID:'key',TURN_KEY_TOKEN:'token'},async()=>Response.json({iceServers:[]})),/missing/);
});
