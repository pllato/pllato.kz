const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/worker.js','utf8');
let calls=0;
const sandbox=vm.createContext({Date,JSON,console,issueTurnCredentials:async()=>{calls++;return{available:true,iceServers:[{urls:'turn:test'}]}}});
const Room=vm.runInContext(source.slice(source.indexOf('export class MeetRoom')).replace('export class','class')+';MeetRoom',sandbox);
const room=new Room({storage:{}},{});
function socket(admitted){return{a:{peer:'test',info:{admitted}},messages:[],deserializeAttachment(){return this.a},serializeAttachment(a){this.a=a},send(m){this.messages.push(JSON.parse(m))}}}
(async()=>{
 const waiting=socket(false);await room.webSocketMessage(waiting,JSON.stringify({t:'ice-servers'}));assert.equal(calls,0);
 const admitted=socket(true);await room.webSocketMessage(admitted,JSON.stringify({t:'ice-servers'}));await room.webSocketMessage(admitted,JSON.stringify({t:'ice-servers'}));
 assert.equal(calls,1);assert.equal(admitted.messages[0].available,true);
 console.log('PASS: TURN restricted to admitted participants, repeated requests throttled');
})();
