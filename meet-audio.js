export function pcmWav(samples){
 const buffer=new ArrayBuffer(44+samples.length*2),v=new DataView(buffer);
 const str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
 str(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,samples[i],true);
 return new Blob([buffer],{type:'audio/wav'});
}
export async function captureTranscriptAudio(ac,stream,onChunk){
 await ac.audioWorklet.addModule('/meet-audio-worklet.js?v=20261027-delivery');
 const source=ac.createMediaStreamSource(stream),node=new AudioWorkletNode(ac,'meet-pcm'),mute=ac.createGain();mute.gain.value=0;
 source.connect(node);node.connect(mute);mute.connect(ac.destination);
 let stopped,stopPromise;
 node.port.onmessage=e=>{if(e.data.samples)onChunk(pcmWav(e.data.samples));if(e.data.stopped){source.disconnect();node.disconnect();mute.disconnect();stopped?.();}};
 return {stop(){if(!stopPromise)stopPromise=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{source.disconnect();node.disconnect();mute.disconnect();reject(new Error('Не завершено сохранение звука'));},10000);stopped=()=>{clearTimeout(timer);resolve();};node.port.postMessage('stop');});return stopPromise;}};
}
