// One mono 16kHz PCM minute (~1.9 MB). No neural model/video encoding on device.
class MeetPCM extends AudioWorkletProcessor {
 constructor(){super();this.samples=new Int16Array(960000);this.used=0;this.sum=0;this.n=0;this.phase=0;this.stopped=false;this.port.onmessage=e=>{if(e.data==='stop'){this.flush();this.stopped=true;this.port.postMessage({stopped:true});}};}
 flush(){if(this.used){const samples=this.samples.slice(0,this.used);this.port.postMessage({samples},[samples.buffer]);this.used=0;}}
 process(inputs){
  if(this.stopped)return false;
  const channels=inputs[0];if(!channels?.length)return true;
  for(let i=0;i<channels[0].length;i++){
   let sample=0;for(const c of channels)sample+=c[i];this.sum+=sample/channels.length;this.n++;this.phase+=16000;
   if(this.phase>=sampleRate){this.phase-=sampleRate;const v=Math.max(-1,Math.min(1,this.sum/this.n));this.samples[this.used++]=Math.round(v*(v<0?32768:32767));this.sum=0;this.n=0;if(this.used===this.samples.length)this.flush();}
  }
  return true;
 }
}
registerProcessor('meet-pcm',MeetPCM);
