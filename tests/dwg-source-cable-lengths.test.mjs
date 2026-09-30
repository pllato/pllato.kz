import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceCableLengths,cableLayer} from '../app/stroy/dwg/source-cable-lengths.mjs';
const shape=(id,pts,extra={})=>({id,entityId:id,entityKey:id,entityType:'LINE',layer:'ЭЛ_кабель 0.4',color:5,text:null,pts,bounds:[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))],...extra});
test('Untouched connected cables get one length, no duplicate geometry or wall/device labels',()=>{
 const shapes=[shape('a',[[0,0],[3,0]]),shape('b',[[3,0],[3,4]]),shape('copy',[[0,0],[3,0]]),shape('wall',[[0,10],[3,10]],{layer:'Стены'}),shape('socket',[[0,20],[3,20]],{deviceId:'socket'})];
 const rows=[...sourceCableLengths(shapes,{devices:new Set(['socket'])})];assert.equal(rows.length,1);assert.equal(rows[0].length,7);
 assert.equal([...sourceCableLengths(shapes,{hidden:new Set(['ЭЛ_кабель 0.4'])})].length,0);
});
test('Assigned cable has no second label; known layer/color also finds untouched cables',()=>{
 const shapes=[shape('a',[[0,0],[3,0]],{layer:'Линии рабочие'}),shape('b',[[0,2],[4,2]],{layer:'Линии рабочие'})];
 const rows=[...sourceCableLengths(shapes,{routes:[{sourceIds:['a']}]})];assert.equal(rows.length,1);assert.equal(rows[0].length,4);assert.deepEqual(rows[0].ids,['b']);
});
test('Branches and separate block instances are not merged',()=>{
 const shapes=[shape('a',[[0,0],[3,0]]),shape('b',[[3,0],[3,4]]),shape('c',[[3,0],[6,0]])];
 assert.equal([...sourceCableLengths(shapes)].length,3);
 const copies=[shape('a',[[0,0],[3,0]],{deviceId:'plan',entityMatrix:[1,0,0,1,0,0]}),shape('b',[[3,0],[6,0]],{deviceId:'plan',entityMatrix:[1,0,0,1,10,0]})];
 assert.equal([...sourceCableLengths(copies)].length,2);
 assert.equal(cableLayer('EL-SS_Марки кабельных лотков'),false);assert.equal(cableLayer('ЭЛ_Текст'),false);assert.equal(cableLayer('ЭЛ'),true);
});
