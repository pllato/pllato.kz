const fs=require('fs'), vm=require('vm'), assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../meet.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];

let resolveReady, created=0, sent=0, stopped=0, cleared=0;
const profileCode=script.slice(script.indexOf('const MOBILE_MEDIA'),script.indexOf('const LOGO_URL'));
for(const [navigator,expected] of [
  [{userAgent:'iPhone',platform:'iPhone',maxTouchPoints:5},360],
  [{userAgent:'Mozilla Macintosh',platform:'MacIntel',maxTouchPoints:5},360],
  [{userAgent:'Mozilla Macintosh',platform:'MacIntel',maxTouchPoints:0},720],
]) {
  const device=vm.createContext({navigator});
  vm.runInContext(profileCode+';globalThis.profile=MEDIA_PROFILE',device);
  assert.equal(device.profile.height,expected);
}
const timers=[];
const ctx={drawImage(){},clearRect(){},getImageData(x,y,w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){},save(){},restore(){},createLinearGradient(){return{addColorStop(){}}},fillRect(){}};
function canvas(){return{width:0,height:0,getContext(){return ctx},captureStream(fps){return{fps,getTracks(){return[{stop(){stopped++}}]}}}}};
const context=vm.createContext({performance,Uint8ClampedArray,Math,Promise,MEDIA_PROFILE:{backgroundFps:15,maskWidth:384},logoImg:null,loadOfficeBackground:async()=>null,ensureMediaPipe:()=>new Promise(r=>resolveReady=r),document:{createElement(tag){return tag==='canvas'?canvas():{readyState:2,videoWidth:960,videoHeight:540,play:()=>Promise.resolve(),pause(){}}}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){cleared++},SelfieSegmentation:class{constructor(){created++}setOptions(){}onResults(cb){this.cb=cb}async send(){sent++}close(){return Promise.resolve()}}});
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../meet-temporal-mask.js'),'utf8').replace('export class','class'),context);
vm.runInContext(script.slice(script.indexOf('function refinePersonAlpha('),script.indexOf('/* ============================================================\n   OUTGOING STREAM')),context);
vm.runInContext('globalThis.Pipeline=BgPipeline',context);
(async()=>{
const stream={getVideoTracks:()=>[{enabled:true,readyState:'live'}]};
const dead=new context.Pipeline(stream,canvas(),'logo');await new Promise(setImmediate);dead.stop();resolveReady(true);await new Promise(setImmediate);assert.equal(created,0,'stopped preview cannot resurrect model');
const c=canvas(), p=new context.Pipeline(stream,c,'logo');await new Promise(setImmediate);resolveReady(true);await new Promise(setImmediate);assert.equal(sent,1);assert.ok(timers.at(-1).ms>=1000/15);assert.equal(p.getStream().fps,15);
p.onResults({image:{width:960,height:540},segmentationMask:{}});assert.equal(p.mask.width,384);assert.equal(p.mask.height,216);assert.equal(c.width,960);assert.equal(c.height,540);
p.stop();await p.loop();assert.equal(sent,1);assert.equal(stopped,1);assert.ok(cleared>=2);
console.log('PASS: bounded frame scheduling, compact mask/full output, stop-during-init, capture track cleanup');
})();


// Receiver-aware limits prevent a desktop sender from feeding HD30 to phones.
(async()=>{
const applied=[];
const {groupVideoBudget}=await import('../meet-group-budget.js');
const tune=vm.createContext({groupVideoBudget,peers:new Map(),MOBILE_MEDIA:false,MEDIA_PROFILE:{bitrate:2_000_000,cameraFps:30}});
vm.runInContext(script.slice(script.indexOf('async function tuneVideoSender('),script.indexOf('// заменить исходящий видео-трек')),tune);
const sender={track:{getSettings:()=>({width:1280,height:720})},getParameters:()=>({encodings:[{}]}),setParameters:async p=>applied.push(p)};
await tune.tuneCamSender(sender,{info:{mobileMedia:true}});
assert.equal(applied[0].encodings[0].maxFramerate,15);
assert.equal(applied[0].encodings[0].maxBitrate,600000);
assert.equal(applied[0].encodings[0].scaleResolutionDownBy,2);
assert.equal(applied[0].degradationPreference,'balanced');
await tune.tuneCamSender(sender,{info:{mobileMedia:false}});
assert.equal(applied[1].encodings[0].scaleResolutionDownBy,1);
assert.equal(applied[1].encodings[0].maxFramerate,30);
const mobile=vm.createContext({navigator:{userAgent:'Android',platform:'Linux',maxTouchPoints:5}});
vm.runInContext(profileCode,mobile);
assert.equal(mobile.deviceBackground('office-host'),'none');
assert.equal(mobile.deviceBackground('blur'),'none');
console.log('PASS: mobile backgrounds disabled and receiver-aware camera limits');
})().catch(e=>{console.error(e);process.exitCode=1;});

(async()=>{
  const camera={kind:'video'},mic={kind:'audio'};
  class Stream{constructor(){this.tracks=[]}addTrack(t){this.tracks.push(t)}getVideoTracks(){return this.tracks.filter(t=>t.kind==='video')}getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio')}}
  const c=vm.createContext({MOBILE_MEDIA:true,previewBg:null,state:{bgMode:'office-host',rawStream:{getVideoTracks:()=>[camera],getAudioTracks:()=>[mic]}},MediaStream:Stream,$:()=>({pause(){},srcObject:null}),BgPipeline:class{constructor(){throw new Error('Mobile must never initialize segmentation')}},document:{createElement(){throw new Error('Mobile must not create a compositing canvas')}}});
  vm.runInContext(script.slice(script.indexOf('let outBg=null'),script.indexOf('// текущий исходящий видео-трек')),c);
  await c.buildOutStream();assert.equal(c.state.outStream.getVideoTracks()[0],camera);assert.equal(c.state.outStream.getAudioTracks()[0],mic);
  console.log('PASS: mobile sends original tracks even with stale background setting');
})().catch(e=>{console.error(e);process.exitCode=1;});
