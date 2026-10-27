import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../meet.html',import.meta.url),'utf8');const source=html.slice(html.indexOf('async function reconcileRecordingOwner(){'),html.indexOf('async function prepareRecordingTransfer(){'));
test('reconnecting old recorder stops after another admin has taken over',async()=>{
 let stopped=0;const ctx=vm.createContext({state:{isHost:true,admitted:true,recording:true,recorderPeer:'new'},peerId:'old',clearTimeout(){},recordingRetryTimer:null,recStarting:null,recSaving:null,stopRecording:async()=>stopped++,recordingProblem:assert.fail});
 vm.runInContext(source,ctx);await ctx.reconcileRecordingOwner();assert.equal(stopped,1);
});
test('takeover waits for previous segment upload before restarting recording',async()=>{
 let finish,started=0;const ctx=vm.createContext({state:{isHost:true,admitted:true,recording:false,recorderPeer:'self'},peerId:'self',clearTimeout(){},recordingRetryTimer:null,recStarting:null,recSaving:new Promise(r=>finish=r),retryRecording:async()=>started++,recordingProblem:assert.fail});
 vm.runInContext(source,ctx);const task=ctx.reconcileRecordingOwner();assert.equal(started,0);finish();await task;assert.equal(started,1);
});
