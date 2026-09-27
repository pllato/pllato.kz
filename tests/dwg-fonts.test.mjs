import test from 'node:test';import assert from 'node:assert/strict';
import {cadFont} from '../app/stroy/dwg/fonts.mjs';
import {nativeDocument} from '../app/stroy/dwg/native-adapter.mjs';
import {scene,cloneDoc} from '../app/stroy/dwg/cad.mjs';
test('CAD font fallback is explicit and keeps italic/bold',()=>{
 assert.equal(cadFont('cyrilstd.shx').family,'Pllato CAD');assert.equal(cadFont('GOST Common Italic.ttf').italic,true);assert.equal(cadFont('','Arial|b1|i0').bold,true);assert.equal(cadFont('arial.ttf').substituted,false);
});
test('native STYLE and TEXT width/oblique survive adapter and history',()=>{
 const db={header:{ACADVER:'AC1032'},tables:{LAYER:{entries:[]},BLOCK_RECORD:{entries:[]},STYLE:{entries:[{name:'GOST',font:'GOST Common Italic.ttf',widthFactor:.8}]}},entities:[{type:'TEXT',handle:'1',text:'Чертёж ЁЭ',styleName:'GOST',textHeight:3,xScale:.7,obliqueAngle:.2,startPoint:{x:0,y:0}}]};
 const doc=nativeDocument(db),s=scene(cloneDoc(doc)).shapes[0];assert.equal(s.font.family,'Pllato CAD');assert.equal(s.font.italic,true);assert.equal(s.textScale,.7);assert.ok(Math.abs(s.oblique-.2)<1e-12);
});
