const fs=require('fs'), vm=require('vm'), assert=require('assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../meet.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];

let resolveReady, created=0, sent=0, stopped=0, cleared=0;
const profileCode=script.slice(script.indexOf('const MOBILE_MEDIA'),script.indexOf('const LOGO_URL'));
for(const [navigator,expected] of [
  [{userAgent:'iPhone',platform:'iPhone',maxTouchPoints:5},540],
  [{userAgent:'Mozilla Macintosh',platform:'MacIntel',maxTouchPoints:5},540],
  [{userAgent:'Mozilla Macintosh',platform:'MacIntel',maxTouchPoints:0},720],
]) {
  const device=vm.createContext({navigator});
  vm.runInContext(profileCode+';globalThis.profile=MEDIA_PROFILE',device);
  assert.equal(device.profile.height,expected);
}
const timers=[];
const ctx={drawImage(){},clearRect(){},getImageData(x,y,w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){},save(){},restore(){},createLinearGradient(){return{addColorStop(){}}},fillRect(){}};
function canvas(){return{width:0,height:0,getContext(){return ctx},captureStream(fps){return{fps,getTracks(){return[{stop(){stopped++}}]}}}}};
const context=vm.createContext({Uint8ClampedArray,Math,Promise,MEDIA_PROFILE:{backgroundFps:15},logoImg:null,ensureMediaPipe:()=>new Promise(r=>resolveReady=r),document:{createElement(tag){return tag==='canvas'?canvas():{readyState:2,videoWidth:960,videoHeight:540,play:()=>Promise.resolve(),pause(){}}}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){cleared++},SelfieSegmentation:class{constructor(){created++}setOptions(){}onResults(cb){this.cb=cb}async send(){sent++}close(){return Promise.resolve()}}});
vm.runInContext(script.slice(script.indexOf('function refinePersonAlpha('),script.indexOf('/* ============================================================\n   OUTGOING STREAM')),context);
vm.runInContext('globalThis.Pipeline=BgPipeline',context);
(async()=>{
const stream={getVideoTracks:()=>[{enabled:true,readyState:'live'}]};
const dead=new context.Pipeline(stream,canvas(),'logo');dead.stop();resolveReady(true);await new Promise(setImmediate);assert.equal(created,0,'stopped preview cannot resurrect model');
const c=canvas(), p=new context.Pipeline(stream,c,'logo');resolveReady(true);await new Promise(setImmediate);assert.equal(sent,1);assert.ok(timers.at(-1).ms>=1000/15);assert.equal(p.getStream().fps,15);
p.onResults({image:{width:960,height:540},segmentationMask:{}});assert.equal(p.mask.width,256);assert.equal(p.mask.height,144);assert.equal(c.width,960);assert.equal(c.height,540);
p.stop();await p.loop();assert.equal(sent,1);assert.equal(stopped,1);assert.ok(cleared>=2);
console.log('PASS: bounded frame scheduling, compact mask/full output, stop-during-init, capture track cleanup');
})();
