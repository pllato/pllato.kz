import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connectionQuality,microphoneStatus,audioRms} from '../meet-media-status.js';
const track={readyState:'live',muted:false};
test('microphone distinguishes mute, silence, actual sound, unavailable and suspended meter',()=>{
 assert.equal(microphoneStatus(track,false,.5).state,'off');
 assert.equal(microphoneStatus(track,true,0).state,'quiet');
 assert.equal(microphoneStatus(track,true,.05).state,'active');
 assert.equal(microphoneStatus(null,true,0).state,'error');
 assert.equal(microphoneStatus({...track,muted:true},true,.5).state,'error');
 assert.equal(microphoneStatus({...track,readyState:'ended'},true,.5).state,'error');
 assert.equal(microphoneStatus(track,true,.5,false).state,'unknown');
 assert.equal(audioRms(new Uint8Array(256).fill(128)),0);
 assert.ok(audioRms(new Uint8Array(256).fill(140))>.012);
});
const pair=rtt=>({type:'candidate-pair',state:'succeeded',nominated:true,currentRoundTripTime:rtt});
const inbound=(received,lost)=>({id:'a',type:'inbound-rtp',packetsReceived:received,packetsLost:lost,jitter:.01});
test('quality uses interval packet loss, not lifetime loss; counters reset safely',()=>{
 const first=connectionQuality([pair(.1),inbound(1000,500)]);
 const next=connectionQuality([pair(.1),inbound(1100,500)],first.samples);assert.equal(next.state,'good');
 assert.equal(connectionQuality([pair(.1),inbound(1190,520)],next.samples).state,'bad');
 assert.equal(connectionQuality([pair(.1),inbound(5,0)],next.samples).state,'good');
});
test('RTT, jitter, remote loss and disconnected/unknown states',()=>{
 assert.equal(connectionQuality([]).state,'unknown');
 assert.equal(connectionQuality([pair(.1)],undefined,'connecting').state,'unknown');
 assert.equal(connectionQuality([pair(.1)],undefined,'disconnected').state,'bad');
 assert.equal(connectionQuality([pair(.4)]).state,'warn');
 assert.equal(connectionQuality([pair(1)]).state,'bad');
 assert.equal(connectionQuality([{type:'inbound-rtp',jitter:.15}]).state,'bad');
 assert.equal(connectionQuality([{type:'remote-inbound-rtp',fractionLost:.2,roundTripTime:.1}]).state,'bad');
});

import vm from 'node:vm';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../meet.html',import.meta.url),'utf8');
test('quality polling has one in-flight batch and cannot restart after cleanup',async()=>{
 const source=html.slice(html.indexOf('let qualityTimer=null'),html.indexOf('function setLocalTileStream()'));
 let resolveStats,scheduled=0,reads=0;const node={dataset:{},setAttribute(){}};
 const context=vm.createContext({connectionQuality,peers:new Map([['p',{pc:{connectionState:'connected',getStats:()=>{reads++;return new Promise(r=>resolveStats=r);}},tile:{querySelector:()=>node}}]]),state:{},$:()=>node,document:{hidden:false},clearTimeout(){},setTimeout(){scheduled++;return 1;}});
 vm.runInContext(source,context);context.startQualityMonitor();assert.equal(reads,1);assert.equal(scheduled,0);
 context.stopQualityMonitor();resolveStats([pair(.1)]);await new Promise(setImmediate);
 assert.equal(scheduled,0);assert.equal(node.dataset.quality,undefined);
});
