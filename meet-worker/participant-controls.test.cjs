const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/worker.js','utf8');
const Room=vm.runInNewContext(source.slice(source.indexOf('export class MeetRoom')).replace('export class','class')+';MeetRoom',{Date,JSON,console});
function socket(peer,role='guest',canShare=false){return {a:{peer,info:{role,admitted:true,canShare,sharing:false}},messages:[],readyState:1,deserializeAttachment(){return this.a},serializeAttachment(a){this.a=a},send(m){this.messages.push(JSON.parse(m))},close(code){this.code=code;this.readyState=3}};}
(async()=>{
 const host=socket('host','host',true),guest=socket('guest'),other=socket('other');
 const data={recorderPeer:'host'},sockets=[host,guest,other];
 const room=new Room({getWebSockets:()=>sockets,storage:{get:async()=>data,put:async(k,v)=>Object.assign(data,v)}},{});
 room.getRoom=async()=>data;room.saveRoom=async r=>Object.assign(data,r);
 const send=(ws,m)=>room.webSocketMessage(ws,JSON.stringify(m));
 await send(guest,{t:'screen-permission',target:'other',allowed:true});assert.equal(other.a.info.canShare,false);
 await send(guest,{t:'presence',patch:{canShare:true,sharing:true,screenStreamId:'s'}});assert.equal(guest.a.info.canShare,false);assert.equal(guest.a.info.sharing,false);assert.equal(guest.a.info.screenStreamId,null);
 await send(host,{t:'screen-permission',target:'guest',allowed:true});assert.equal(guest.a.info.canShare,true);assert.equal(data.screenPermissions.guest,true);
 await send(guest,{t:'presence',patch:{sharing:true}});assert.equal(guest.a.info.sharing,true);
 await send(host,{t:'screen-permission',target:'guest',allowed:false});assert.equal(guest.a.info.sharing,false);assert.equal(data.screenPermissions.guest,false);
 await send(guest,{t:'kick',target:'other'});assert.ok(other.a);
 await send(host,{t:'kick',target:'host'});assert.ok(host.a);
 await send(host,{t:'kick',target:'guest'});assert.equal(guest.a,null);assert.equal(guest.code,4003);assert.ok(data.removedPeers.guest);assert.ok(other.messages.some(m=>m.t==='peer-leave'&&m.peer==='guest'));
 room.roomId=async()=>'test-room';const retry=socket('retry');await room.onJoin(retry,{peer:'guest'});assert.equal(retry.code,4003);
 await send(host,{t:'screen-permission',target:'other',allowed:true});
 data.recorderPeer='host';await send(other,{t:'kick',target:'host'});assert.ok(host.a);
 other.a.info.role='host';await send(other,{t:'kick',target:'host'});assert.equal(data.recorderPeer,'other');
 const html=fs.readFileSync(__dirname+'/../meet.html','utf8');assert.ok(!/\.tile\.cam-off\{display:none\}/.test(html));assert.ok(html.includes('m.peer!==peerId && m.info.admitted'));
 console.log('PASS participant controls: host authorization, permission grant/revoke, presence enforcement, removal, all camera tiles visible');
})();
