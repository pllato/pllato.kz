import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../meet.html',import.meta.url),'utf8');
const code=['toggleCamera','currentCamVideoTrack','applyCameraVideoToPeers'].map(n=>{const start=html.search(new RegExp('(?:async )?function '+n+'\\('));return html.slice(start,html.indexOf('\n}',start)+2);}).join('\n');
function fixture(){
 const camera={readyState:'live',enabled:true},audio={enabled:true},processed={enabled:true};const replacements=[],patches=[];
 const button={disabled:false};
 const c=vm.createContext({state:{camOn:true,bgMode:'office-host',rawStream:{getVideoTracks:()=>[camera],getAudioTracks:()=>[audio]}},outBg:{getStream:()=>({getVideoTracks:()=>[processed]})},$:()=>button,peers:new Map([['p',{camSender:{replaceTrack:async t=>replacements.push(t)}}]]),tuneCamSender:async()=>{},selfPatch:p=>patches.push(p),setLocalTileStream(){},refreshControlIcons(){},toast:msg=>{throw Error(msg);}});
 vm.runInContext(code,c);return {c,camera,audio,processed,replacements,patches,button};
}
test('camera off detaches composite from peers and preserves microphone, on restores it',async()=>{
 const {c,camera,audio,processed,replacements,button}=fixture();
 await c.toggleCamera();assert.equal(c.state.camOn,false);assert.equal(camera.enabled,false);assert.equal(processed.enabled,false);assert.equal(replacements[0],null);assert.equal(audio.enabled,true);assert.equal(button.disabled,false);
 await c.toggleCamera();assert.equal(c.state.camOn,true);assert.equal(camera.enabled,true);assert.equal(processed.enabled,true);assert.equal(replacements[1],processed);
});
test('new peers get no camera track while camera is off',()=>{
 const {c}=fixture();c.state.camOn=false;assert.equal(c.currentCamVideoTrack(),null);
});
test('camera acquisition denial leaves camera off and microphone untouched',async()=>{
 const {c,camera,audio}=fixture();c.state.camOn=false;camera.readyState='ended';c.MEDIA_PROFILE={};c.captureMedia=async()=>{throw Error('denied');};let error;c.toast=m=>error=m;
 await c.toggleCamera();assert.equal(c.state.camOn,false);assert.equal(audio.enabled,true);assert.match(error,/denied/);
});
