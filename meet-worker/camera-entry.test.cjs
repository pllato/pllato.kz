const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync(join(__dirname,'../meet.html'),'utf8');
const getMedia=source.slice(source.indexOf('async function getLocalMedia(){'),source.indexOf('\nfunction mediaErrText'));
const gate=source.slice(source.indexOf('function canEnterWithCamera(){'),source.indexOf('// Permission denial'));
const error=name=>Object.assign(new Error(name),{name});
function track(kind){return{kind,enabled:true,readyState:'live',stop(){this.readyState='ended'},getSettings(){return{}}}}
class Stream{constructor(tracks=[]){this.tracks=tracks}addTrack(t){this.tracks.push(t)}getTracks(){return this.tracks}getVideoTracks(){return this.tracks.filter(t=>t.kind==='video')}getAudioTracks(){return this.tracks.filter(t=>t.kind==='audio')}}
async function check(name,fail,devices,expected,defaultSucceeds=false){
  const state={camOn:false,micOn:true,selCam:'stale',rawStream:null,_joined:true};let defaultCalls=0;
  const context=vm.createContext({state,MediaStream:Stream,MOBILE_MEDIA:false,MEDIA_PROFILE:{width:1280,height:720,cameraFps:30},navigator:{mediaDevices:{
    async getUserMedia(c){if(c.video){if(c.video===true){defaultCalls++;if(defaultSucceeds)return new Stream([track('video')])}throw error(fail)}return new Stream([track('audio')])},
    async enumerateDevices(){return devices.map(kind=>({kind}))},
  }}});
  vm.runInContext(getMedia+'\n'+gate,context);await context.getLocalMedia();assert.equal(!!context.canEnterWithCamera(),expected,name);
  if(defaultSucceeds){assert.equal(defaultCalls,1);assert.equal(state.camOn,true,'reacquired camera must be enabled even during a joined call');assert.equal(state.rawStream.getVideoTracks()[0].enabled,true);state.rawStream.getVideoTracks()[0].stop();assert.equal(!!context.canEnterWithCamera(),false,'ended camera cannot pass entry')}
}
(async()=>{
 await check('denied is not missing hardware','NotAllowedError',[],false);
 await check('busy camera blocks entry','NotReadableError',['videoinput'],false);
 await check('constraints are not missing hardware','OverconstrainedError',[],false);
 await check('actual absence permits audio-only','NotFoundError',[],true);
 await check('listed camera prevents absence bypass','NotFoundError',['videoinput'],false);
 await check('stale selection retries default and enables video','OverconstrainedError',['videoinput'],true,true);
 console.log('PASS: six camera entry cases and ended-track rejection');
})();
