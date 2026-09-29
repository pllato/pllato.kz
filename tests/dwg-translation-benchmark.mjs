// Synthetic geometry-only benchmark; not an end-to-end DWG speed claim.
// Run: node tests/dwg-translation-benchmark.mjs [number of lines]
import {performance} from 'node:perf_hooks';
import {fromRecords,scene} from '../app/stroy/dwg/cad.mjs';
import {translatedScene} from '../app/stroy/dwg/scene-translation.mjs';
const count=Number(process.argv[2]||50000);
if(!Number.isInteger(count)||count<1||count>1000000)throw Error('Use 1..1000000 lines');
const doc=fromRecords([{id:'s',type:'SECTION',pairs:[[2,'ENTITIES']]},...Array.from({length:count},(_,i)=>({id:String(i),type:'LINE',pairs:[[10,String(i)],[20,'0'],[11,String(i+10)],[21,'20']]})),{id:'e',type:'ENDSEC',pairs:[]}]);
const drawing=scene(doc),full=[],incremental=[];
for(let i=0;i<5;i++){
 let t=performance.now();scene(doc);full.push(performance.now()-t);
 t=performance.now();translatedScene(drawing,[{id:'0'}],[1,1]);incremental.push(performance.now()-t);
}
const median=xs=>[...xs].sort((a,b)=>a-b)[2];
console.log(JSON.stringify({count,scope:'geometry only; excludes edit, index, paint and recovery',full,incremental,medianFullMs:median(full),medianIncrementalMs:median(incremental)},null,2));
