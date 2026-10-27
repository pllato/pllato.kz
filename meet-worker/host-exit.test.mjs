import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../meet.html',import.meta.url),'utf8');
const leave=html.slice(html.indexOf('async function leaveRoom(){'),html.indexOf("window.addEventListener('beforeunload'"));
function setup(){
 let resolve,reject;const upload=new Promise((a,b)=>{resolve=a;reject=b;});const events=[];
 const ctx={state:{isHost:true,recording:true},wsSend:m=>events.push(m.t),showMeetingEnding:()=>events.push('countdown'),showHostExit:()=>events.push('hidden'),showHostExitError:()=>events.push('error'),stopMeetingMedia:()=>events.push('media-stopped'),
 clearTimeout(){},clearInterval(){},setTimeout:()=>{events.push('delay');},recordingRetryTimer:null,timerInt:null,wsReconnectTimer:null,meetingEndTimer:null,
 floatingParticipants:{close(){}},$:()=>({disabled:false,remove(){}}),document:{},stopRecognition(){},recStarting:null,recSaving:null,recUpload:{},recordingSaved:false,wsClosedByUser:false,ws:{close(){}},peers:new Map(),toast(){},stopRecording:()=>{events.push('upload');return upload;},window:{close:()=>events.push('closed')},location:{},outBg:null,previewBg:null};
 vm.createContext(ctx);vm.runInContext(leave,ctx);return {ctx,events,resolve,reject};
}
test('host hides call and starts final upload immediately; closes only after acknowledgement',async()=>{
 const s=setup();const done=s.ctx.leaveRoom();
 assert.ok(s.events.includes('hidden'));assert.ok(s.events.includes('upload'));assert.ok(!s.events.includes('delay'));assert.ok(!s.events.includes('closed'));assert.equal(s.ctx.location.href,undefined);
 s.resolve();await done;assert.ok(s.events.includes('closed'));
});
test('failed final upload retains page and offers retry',async()=>{
 const s=setup();const done=s.ctx.leaveRoom();s.reject(new Error('offline'));await done;
 assert.ok(!s.events.includes('closed'));assert.equal(s.ctx.location.href,undefined);assert.ok(s.events.includes('error'));assert.equal(s.ctx.state._leaving,false);
});
