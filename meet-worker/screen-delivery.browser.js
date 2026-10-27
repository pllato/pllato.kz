// Run in a same-origin browser page. Uses the production peer/signaling functions
// and real RTCPeerConnections; no camera, server, or customer room is accessed.
async function testScreenDelivery(){
  const html=await (await fetch('/meet.html')).text();
  const code=html.slice(html.indexOf('function ensurePeer('),html.indexOf('/* ============================================================\n   VIDEO TILES'));
  const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
  const wait=async(fn,label)=>{for(let i=0;i<300;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timeout: '+label+' '+errors.join('; '))};
  const sources=[];
  function video(color){const c=document.createElement('canvas');c.width=640;c.height=360;const ctx=c.getContext('2d');let n=0;const timer=setInterval(()=>{ctx.fillStyle=color;ctx.fillRect(0,0,640,360);ctx.fillStyle='white';ctx.fillText(String(n++),20,20)},60);const stream=c.captureStream(15);sources.push(()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop())});return stream;}
  const endpoints={}, errors=[];let descriptions=0;
  function endpoint(id,sharing=false,noCamera=false){
    const state={outStream:noCamera?new MediaStream():video('blue'),sharing,screenStream:sharing?video('red'):null};
    const peers=new Map();
    const make=new Function('state','peers','peerId','wsSend','errors',`
      const $=()=>document.createElement('button');
      const ICE_SERVERS=[],presenceCache=new Map(),connectRecordingAudio=()=>{},tuneCamSender=()=>{},tuneScreenSender=()=>{};
      const currentCamVideoTrack=()=>state.outStream.getVideoTracks()[0];
      const console={warn:(...args)=>errors.push(args.map(String).join(' '))};
      function createPeerTile(){} function attachPeerTile(){}
      function attachScreenTile(id,p){p.visible=true;} function removeScreenTile(p){p.visible=false;}
      ${code}
      return {ensurePeer,handleSignal,syncRemoteScreen};`);
    const api=make(state,peers,id,m=>{if(m.data.description)descriptions++;setTimeout(()=>endpoints[m.to].api.handleSignal(id,m.data),0)},errors);
    return endpoints[id]={state,peers,api};
  }
  async function scenario(noCamera,late){
    const a=endpoint('a',late,noCamera),b=endpoint('b');
    const pa=a.api.ensurePeer('b',{sharing:false}),pb=b.api.ensurePeer('a',{sharing:late});
    await wait(()=>pa.pc.connectionState==='connected'&&pb.pc.connectionState==='connected','connect');
    await wait(()=>pb.screenStream.getVideoTracks().length===1,'reserved screen receiver');
    const before=descriptions,receiver=pb.screenStream.getVideoTracks()[0];
    for(let i=0;i<2;i++){
      const stream=late&&i===0?a.state.screenStream:video('red');
      await pa.screenSender.replaceTrack(stream.getVideoTracks()[0]);
      pb.info.sharing=true;b.api.syncRemoteScreen('a',pb);
      await wait(()=>pb.visible&&!receiver.muted,'screen visible');
      const v=document.createElement('video');v.muted=true;v.srcObject=pb.screenStream;await v.play();
      await wait(()=>v.videoWidth===640,'screen frames');v.srcObject=null;
      assert(noCamera||pb.camStream.getVideoTracks().length===1,'camera retained');
      await pa.screenSender.replaceTrack(null);pb.info.sharing=false;b.api.syncRemoteScreen('a',pb);
      assert(!pb.visible,'screen hidden on stop');assert(pb.screenStream.getVideoTracks()[0]===receiver,'receiver survives stop');
    }
    assert(descriptions===before,'no renegotiation on start/stop');
    pa.pc.close();pb.pc.close();
  }
  try{await scenario(false,false);await scenario(false,true);await scenario(true,false);assert(!errors.length,errors.join('\n'));return {pass:true,scenarios:['start-stop-restart','late join','no host camera'],descriptions};}
  finally{for(const e of Object.values(endpoints))for(const p of e.peers.values())p.pc.close();sources.forEach(f=>f());}
}
