const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../meet.html'),'utf8');
test('inference receives a frozen frame while the live camera advances',async()=>{
 const sandbox={setTimeout:()=>0,MEDIA_PROFILE:{backgroundFps:20}};
 vm.createContext(sandbox);
 vm.runInContext(source.slice(source.indexOf('class BgPipeline'),source.indexOf('/* ============================================================\n   OUTGOING STREAM'))+'\nthis.Pipeline=BgPipeline;',sandbox);
 const camera={readyState:2,videoWidth:1280,videoHeight:720,pixel:1};
 const input={width:0,height:0};
 let captured;
 const pipeline=Object.assign(Object.create(sandbox.Pipeline.prototype),{
  running:true,video:camera,frame:input,frameCtx:{drawImage(video){input.pixel=video.pixel;}},
  stream:{getVideoTracks:()=>[{enabled:true,readyState:'live'}]},
  seg:{async send({image}){camera.pixel=2;captured=image.pixel;}}
 });
 await pipeline.loop();
 assert.equal(captured,1,'inference input must not advance with camera');
 assert.equal(input.width,1280);assert.equal(input.height,720);
});
