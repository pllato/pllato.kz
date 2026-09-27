import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeDocument} from '../app/stroy/dwg/native-adapter.mjs';
import {scene} from '../app/stroy/dwg/cad.mjs';
import {aciColors} from '../app/stroy/dwg/colors.mjs';
test('full indexed palette, including blue, magenta and intermediate colors',()=>{
 assert.equal(aciColors.length,256);assert.equal(aciColors[5],'#0000ff');assert.equal(aciColors[6],'#ff00ff');assert.equal(aciColors[30],'#ff7f00');assert.equal(aciColors[250],'#333333');
});
test('native layer, explicit RGB and nested BYBLOCK colors reach scene',()=>{
 const line=(handle,extra={})=>({type:'LINE',handle,layer:'0',startPoint:{x:0,y:0},endPoint:{x:1,y:1},...extra});
 const db={header:{ACADVER:'AC1032'},tables:{LAYER:{entries:[{name:'wire',colorIndex:6},{name:'rgb',colorIndex:256,color:0x123456}]},BLOCK_RECORD:{entries:[{name:'A',handle:'A',basePoint:{x:0,y:0},entities:[line('1',{colorIndex:0}),line('2',{colorIndex:256}),line('3',{colorIndex:5}),line('4',{colorIndex:0,color:0})]}]}},entities:[{type:'INSERT',handle:'I',layer:'wire',name:'A',color:0xabcdef,xScale:1,yScale:1,insertionPoint:{x:0,y:0}},line('5',{layer:'rgb'})]};
 const shapes=scene(nativeDocument(db)).shapes;
 assert.equal(shapes[0].rgb,'#abcdef');assert.equal(shapes[1].color,6);assert.equal(shapes[2].color,5);assert.equal(shapes[3].rgb,'#000000');assert.equal(shapes[4].rgb,'#123456');
});
