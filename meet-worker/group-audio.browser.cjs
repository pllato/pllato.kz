// Synthetic audio only; does not enter customer rooms or access microphones.
const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});try{const p=await b.newPage();await p.route('https://meet.test/**',r=>r.fulfill({contentType:'text/html',body:'<body>Test</body>'}));await p.goto('https://meet.test/');const html=fs.readFileSync('meet.html','utf8'),code=html.slice(html.indexOf('function ensurePeer('),html.indexOf('/* ============================================================\n   VIDEO TILES'));
const result=await p.evaluate(async code=>{
const ac=new AudioContext();await ac.resume();const nodes=[],endpoints={},errors=[];
for(let i=0;i<7;i++){
 const id='p'+i,osc=ac.createOscillator(),dest=ac.createMediaStreamDestination();osc.connect(dest);osc.start();nodes.push(osc);const state={outStream:dest.stream},peers=new Map();
 const make=new Function('state','peers','peerId','wsSend','errors',`const $=()=>document.createElement('button');const scheduleGroupBudget=()=>{};const ICE_SERVERS=[],presenceCache=new Map(),connectRecordingAudio=()=>{},tuneCamSender=()=>{},tuneScreenSender=()=>{};const currentCamVideoTrack=()=>null;const console={warn:(...a)=>errors.push(a.map(String).join(' '))};function createPeerTile(){}function attachPeerTile(){}function attachScreenTile(){}function removeScreenTile(){} ${code};return {ensurePeer,handleSignal};`);
 endpoints[id]={state,peers,api:make(state,peers,id,m=>setTimeout(()=>endpoints[m.to].api.handleSignal(id,m.data),Math.random()*30),errors)};
}
for(const [id,e] of Object.entries(endpoints))for(const other of Object.keys(endpoints))if(id!==other)e.api.ensurePeer(other,{});
await new Promise(r=>setTimeout(r,8000));let connected=0,receiving=0;
for(const e of Object.values(endpoints))for(const peer of e.peers.values()){
 if(peer.pc.connectionState==='connected')connected++;
 for(const s of (await peer.pc.getStats()).values())if(s.type==='inbound-rtp'&&s.kind==='audio'&&s.bytesReceived>0)receiving++;
 peer.pc.close();
}
nodes.forEach(n=>n.stop());await ac.close();return {connected,outOf:42,receivingAudio:receiving,errors:errors.slice(0,5)};
},code);console.log(result);assert.equal(result.connected,42);assert.equal(result.receivingAudio,42);assert.deepEqual(result.errors,[]);}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
