const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});try{
const html=fs.readFileSync('meet.html','utf8');
const code=html.slice(html.indexOf('let localMeterCleanup=null;'),html.indexOf('function setLocalTileStream()'));
const micOn=html.match(/const MIC_ON=([^\n]+);/)[1],micOff=html.match(/const MIC_OFF=([^\n]+);/)[1];
const style=html.match(/<style>([\s\S]*?)<\/style>/)[1];
for(const width of [1280,390]){
 const page=await browser.newPage({viewport:{width,height:800}});
 await page.route('https://media.test/**',r=>r.fulfill({contentType:r.request().url().includes('.js')?'text/javascript':'text/html',body:r.request().url().includes('.js')?fs.readFileSync('meet-media-status.js','utf8'):`<!doctype html><style>${style}</style><div class="tile local" id="tile_local" style="width:300px;height:200px"><div class="tile-name"><span class="local-mic"></span><span>Вы</span></div></div><div class="controls" style="display:flex"><button class="cb" id="cb-mic"><span id="cb-mic-ic"></span><span id="mic-level-bars"><i></i><i></i><i></i></span><span id="mic-state-label"></span></button><button class="cb connection-quality" id="connection-quality"><span class="signal-bars">▂▄▆</span><span>Связь</span></button></div>`}));
 await page.goto('https://media.test/');
 await page.addScriptTag({type:'module',content:`import {microphoneStatus,audioRms,connectionQuality} from './meet-media-status.js';
 const $=id=>document.getElementById(id),MIC_ON=${micOn},MIC_OFF=${micOff};
 const ac=new AudioContext();await ac.resume();const getMixAudioContext=()=>ac;
 let localTile=$('tile_local');const peers=new Map();
 const dest=ac.createMediaStreamDestination(),osc=ac.createOscillator(),gain=ac.createGain();osc.connect(gain);gain.connect(dest);gain.gain.value=.15;osc.start();
 const state={rawStream:dest.stream,micOn:true};$('cb-mic-ic').innerHTML=MIC_ON;
 ${code}
 monitorLocalAudio();
 window.testMedia={state,gain,ac,monitorLocalAudio,paintLocalMic,stop:()=>localMeterCleanup(),quality:(v)=>paintQuality($('connection-quality'),v)};`});
 await page.waitForFunction(()=>document.querySelector('#cb-mic').dataset.micState==='active');
 await page.evaluate(()=>testMedia.gain.gain.value=0);
 await page.waitForFunction(()=>document.querySelector('#cb-mic').dataset.micState==='quiet');
 await page.evaluate(()=>{testMedia.state.micOn=false;testMedia.paintLocalMic();});
 assert.equal(await page.locator('#cb-mic').getAttribute('data-mic-state'),'off');
 await page.evaluate(()=>{testMedia.state.micOn=true;testMedia.state.rawStream.getAudioTracks()[0].stop();});
 await page.waitForFunction(()=>document.querySelector('#cb-mic').dataset.micState==='error');
 await page.evaluate(()=>testMedia.quality({state:'warn',title:'Связь нестабильна · Задержка 400 мс'}));
 assert.equal(await page.locator('#connection-quality').getAttribute('data-quality'),'warn');
 await page.evaluate(()=>testMedia.stop());
 console.log('PASS real AudioContext sound/silence/mute/ended track/quality, viewport',width);
 await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
