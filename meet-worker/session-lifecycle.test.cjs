const {readFileSync}=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=readFileSync(__dirname+'/worker.js','utf8');
let now=100000;const store=new Map(),sockets=[];let deadline=null;
const ctx={storage:{async get(k){return structuredClone(store.get(k))},async put(k,v){store.set(k,structuredClone(v))},async setAlarm(v){deadline=v},async deleteAlarm(){deadline=null}},getWebSockets:()=>sockets.filter(s=>s.readyState===1)};
const sandbox=vm.createContext({Date:{now:()=>now},verifyUser:async()=>null,crmMeeting:async()=>({host_key:'secret'}),JSON,Response});
const MeetRoom=vm.runInContext(source.slice(source.indexOf('export class MeetRoom')).replace('export class','class')+';MeetRoom',sandbox);
const room=new MeetRoom(ctx,{});room._roomId='crm-11111111-1111-1111-1111-111111111111';
const socket=()=>{const s={readyState:1,messages:[],a:null,send(v){this.messages.push(JSON.parse(v))},serializeAttachment(v){this.a=v},deserializeAttachment(){return this.a},close(){this.readyState=3}};sockets.push(s);return s};
(async()=>{
 // A stale persisted open state must never admit guests without a live host.
 store.set('room',{status:'open',locked:false});
 const guest=socket();await room.onJoin(guest,{peer:'guest'});assert.equal(guest.a.info.admitted,false);
 const host=socket();await room.onJoin(host,{peer:'host',hostKey:'secret'});assert.equal(host.a.info.admitted,true);assert.equal(guest.a.info.admitted,true);
 host.close();await room.onGone(host);assert.equal(deadline,now+30000);
 const late=socket();await room.onJoin(late,{peer:'late'});assert.equal(late.a.info.admitted,false);
 const reconnect=socket();await room.onJoin(reconnect,{peer:'host',hostKey:'secret'});assert.equal(deadline,null);assert.equal(late.a.info.admitted,true);
 await room.scheduleEnd(true);const end=deadline;now+=10000;await room.onGone(guest);assert.equal(deadline,end);
 const earlyHost=socket();await room.onJoin(earlyHost,{peer:'early',hostKey:'secret'});assert.equal(earlyHost.a.info.admitted,false);
 now=end;await room.alarm();assert.equal(reconnect.readyState,3);assert.equal((await room.getRoom()).status,'waiting');
 await room.alarm(); // Idempotent alarm retry.
 const nextGuest=socket();await room.onJoin(nextGuest,{peer:'nextGuest'});assert.equal(nextGuest.a.info.admitted,false);
 const nextHost=socket();await room.onJoin(nextHost,{peer:'nextHost',hostKey:'secret'});assert.equal(nextGuest.a.info.admitted,true);assert.equal(nextHost.a.info.admitted,true);
 // Only the first admitted host owns the recorder; guest cannot transfer it.
 assert.equal((await room.getRoom()).recorderPeer,'nextHost');
 const second=socket();await room.onJoin(second,{peer:'second',hostKey:'secret'});
 assert.equal((await room.getRoom()).recorderPeer,'nextHost');
 const send=(sock,m)=>room.webSocketMessage(sock,JSON.stringify(m));
 await send(nextGuest,{t:'recording-transfer',target:'second'});
 assert.equal((await room.getRoom()).pendingRecorder,null);
 await send(nextHost,{t:'recording-transfer',target:'nextGuest'});
 assert.equal((await room.getRoom()).recorderPeer,'nextHost');
 await send(nextHost,{t:'recording-transfer',target:'second'});
 assert.equal((await room.getRoom()).recorderPeer,'nextHost');
 assert.equal(second.messages.at(-1).t,'recording-prepare');
 await send(nextGuest,{t:'recording-ready'});
 assert.equal((await room.getRoom()).recorderPeer,'nextHost');
 await send(second,{t:'recording-ready'});
 assert.equal((await room.getRoom()).recorderPeer,'second');
 assert.equal((await room.getRoom()).recordingActive,true);
 // Failed/late preparation leaves the old recorder running.
 await send(second,{t:'recording-transfer',target:'nextHost'});
 now+=20001;await room.alarm();
 assert.equal((await room.getRoom()).recorderPeer,'second');
 assert.equal((await room.getRoom()).pendingRecorder,null);
 await send(nextHost,{t:'recording-ready'});
 assert.equal((await room.getRoom()).recorderPeer,'second');
 await send(second,{t:'recording-transfer',target:'nextHost'});
 await send(nextHost,{t:'recording-failed'});
 assert.equal((await room.getRoom()).recorderPeer,'second');
 // Abrupt departure promotes the remaining admin and does not end the room.
 second.close();await room.onGone(second);
 assert.equal((await room.getRoom()).recorderPeer,'nextHost');
 assert.equal((await room.getRoom()).recordingActive,false);
 assert.equal((await room.getRoom()).endAt,null);
 console.log('PASS: sole recorder, host-only acknowledged transfer, timeout, failure and automatic takeover');
 console.log('PASS: waiting without host, automatic admission, reconnect grace, explicit 30s end, alarm retry, reusable room');
})().catch(e=>{console.error(e);process.exitCode=1});
