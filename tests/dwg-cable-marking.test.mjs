import test from 'node:test';
import assert from 'node:assert/strict';
import {markingComplete,markingIndex,unmarkedSource} from '../app/stroy/dwg/cable-marking.mjs';
test('marking requires both nonblank fields',()=>{
 for(const r of [{},{brand:'ВВГ'},{section:'3×2,5'},{brand:' ',section:'3'}])assert.equal(markingComplete(r),false);
 assert.equal(markingComplete({brand:'ВВГ',section:'3×2,5'}),true);
});
test('original unassigned cables are included, symbols and non-cable layers excluded',()=>{
 const s={id:'dwg-1',text:null,pts:[[0,0],[1,1]],entityType:'LINE',layer:'ЭЛ-кабели'};
 const index=markingIndex([]),devices=new Set(['socket']),hidden=new Set();
 assert.equal(unmarkedSource(s,index,devices,hidden),true);
 for(const change of [{layer:'Стены'},{deviceId:'socket'},{text:'note'},{fill:true},{entityType:'DIMENSION'},{id:'executive-1'}])assert.equal(unmarkedSource({...s,...change},index,devices,hidden),false);
 assert.equal(unmarkedSource(s,markingIndex([{sourceIds:['dwg-1']}]),devices,hidden),false);
 assert.equal(unmarkedSource(s,index,devices,new Set([s.layer])),false);
});
