const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../meet.html'),'utf8');
const code=html.slice(html.indexOf('async function handleSignal('),html.indexOf('/* ============================================================\n   VIDEO TILES'));
(async()=>{
 const events=[];let release;
 const peer={signalQueue:Promise.resolve(),pendingCandidates:[],polite:true,pc:{signalingState:'stable',remoteDescription:null,
 async setRemoteDescription(d){events.push('description-start');await new Promise(r=>release=r);this.remoteDescription=d;events.push('description-done')},
 async setLocalDescription(){events.push('answer')},async addIceCandidate(c){assert.ok(this.remoteDescription);events.push(c.candidate)}}};
 const context=vm.createContext({peers:new Map([['remote',peer]]),peerId:'self',console,sendDescription(){events.push('send-answer')}});
 vm.runInContext(code,context);
 await context.handleSignal('remote',{candidate:{candidate:'early'}});
 assert.equal(peer.pendingCandidates.length,1);
 const offer=context.handleSignal('remote',{description:{type:'offer'}});
 await Promise.resolve();
 const candidate=context.handleSignal('remote',{candidate:{candidate:'during'}});
 release();await Promise.all([offer,candidate]);
 assert.deepEqual(events,['description-start','description-done','early','answer','send-answer','during']);
 assert.equal(peer.pendingCandidates.length,0);
 console.log('PASS: early ICE buffered; SDP and ICE processing serialized');
})();
