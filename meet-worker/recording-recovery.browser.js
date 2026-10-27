// Browser regression using the production recorder and real MediaRecorder.
async function testRecordingRecovery(){
  const html=await(await fetch('/meet.html')).text();
  const code=html.slice(html.indexOf('let mixAC=null'),html.indexOf('// собрать метаданные встречи'));
  const elements=new Map();const $=id=>{if(!elements.has(id))elements.set(id,document.createElement('div'));return elements.get(id)};
  const state={roomId:'test-local',rawStream:new MediaStream(),recording:false};
  const uploads=[];const timers=[];
  class Upload{constructor(api,meta){this.meta=meta;this.bytes=0;uploads.push(this)}async init(){}async append(b){this.bytes+=b.size}async finish(){this.saved=true}}
  const make=new Function('state','$','RecordingUpload','timers',`
    const MEDIA_PROFILE={width:640,height:360,recordingFps:8},MOBILE_MEDIA=true;
    const peers=new Map(),meetingGrid=document.createElement('div'),MEET_API='',archiveToken=()=>'',lastCaption=null;
    const buildMeta=id=>({id}),refreshControlIcons=()=>{},toast=()=>{},initials=()=>'';
    const nativeTimeout=window.setTimeout;
    const setTimeout=(fn,ms)=>{if(ms>=5000){timers.push(fn);return 0}return nativeTimeout(fn,ms)};
    ${code}
    return {startRecording,stopRecording,retryRecording,getRecorder:()=>mediaRecorder,cleanup:()=>{clearTimeout(recRAF);mixAC?.close()}};
  `);
  const api=make(state,$,Upload,timers);
  const wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,20))}throw Error('Recording timeout')};
  const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
  try{
    await api.startRecording();assert(state.recording,'automatic start');
    api.getRecorder().pause();await wait(()=>api.getRecorder().state==='recording');
    await new Promise(r=>setTimeout(r,300));api.getRecorder().stop();
    await wait(()=>timers.length===1);assert(uploads[0].saved&&uploads[0].bytes>0,'interrupted segment saved');
    assert(!state.recording,'interruption state');await timers.shift()();
    await wait(()=>state.recording);assert(uploads.length===2,'new segment after restart');
    await new Promise(r=>setTimeout(r,300));state._leaving=true;await api.stopRecording();
    assert(uploads[1].saved&&uploads[1].bytes>0,'final segment saved');assert(!timers.length,'normal leave does not restart');
    return {pass:true,segments:uploads.map(u=>({bytes:u.bytes,saved:u.saved}))};
  }finally{api.cleanup()}
}
