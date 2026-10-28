const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync(require('node:path').join(__dirname,'../meet.html'),'utf8');
const code=source.slice(source.indexOf('function preferredLaptopMic(devices){'),source.indexOf('\nfunction mediaErrText'));
const devices=[{kind:'audioinput',deviceId:'default',label:'Default - iPhone Microphone'},{kind:'audioinput',deviceId:'phone',label:'iPhone Microphone'},{kind:'audioinput',deviceId:'laptop',label:'MacBook Pro Microphone'},{kind:'audioinput',deviceId:'headset',label:'USB Headset'}];
function track(kind,id){return{kind,enabled:true,stopped:false,getSettings:()=>({deviceId:id}),stop(){this.stopped=true;}};}
class Stream{constructor(tracks=[]){this.tracks=tracks;}getTracks(){return this.tracks;}getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio');}getVideoTracks(){return this.tracks.filter(t=>t.kind==='video');}addTrack(t){this.tracks.push(t);}removeTrack(t){this.tracks=this.tracks.filter(x=>x!==t);}}
async function check({hidden=false,manual=false,mobile=false,switchFails=false}={}){
 let granted=!hidden;const calls=[];const tracks=[];
 const state={micOn:true,camOn:true,manualMic:manual,selMic:manual?'headset':null};
 const context=vm.createContext({state,MOBILE_MEDIA:mobile,MEDIA_PROFILE:{width:1280,height:720,cameraFps:30},MediaStream:Stream,navigator:{mediaDevices:{enumerateDevices:async()=>granted?devices:devices.map(d=>({...d,label:''}))}},captureMedia:async c=>{
   calls.push(c);granted=true;
   if(switchFails&&!c.video)throw new Error('busy');
   const list=[];if(c.video)list.push(track('video','cam'));
   if(c.audio)list.push(track('audio',c.audio.deviceId?.exact||'phone'));
   tracks.push(...list);return new Stream(list);
 }});
 vm.runInContext(code,context);await context.getLocalMedia();
 const expected=manual?'headset':mobile||switchFails?'phone':'laptop';
 assert.equal(state.rawStream.getAudioTracks()[0].getSettings().deviceId,expected);
 assert.equal(state.rawStream.getVideoTracks().length,1);
 if(hidden&&!manual&&!mobile&&!switchFails)assert.equal(tracks.find(t=>t.kind==='audio').stopped,true,'old phone track stopped');
 if(manual||mobile)assert.equal(calls.length,1,'no unwanted microphone switching');
 assert.equal(context.preferredLaptopMic([{kind:'audioinput',deviceId:'phone',label:'iPhone Built-in Microphone'}]),null);
}
(async()=>{await check();await check({hidden:true});await check({manual:true});await check({mobile:true});await check({hidden:true,switchFails:true});console.log('PASS: laptop preference, hidden labels, manual headset, mobile and busy-input fallback');})();
