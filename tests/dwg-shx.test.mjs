import test from 'node:test';
import assert from 'node:assert/strict';
import {installShx,localShx} from '../app/stroy/dwg/local-shx.mjs';
import {shxLayout} from '../app/stroy/dwg/shx-layout.mjs';
import {fromRecords,get} from '../app/stroy/dwg/cad.mjs';
import {captureRecovery,replayRecovery} from '../app/stroy/dwg/recovery.mjs';
test('SHX style selection is replayed from recovery without changing text or geometry',()=>{
 const make=()=>{const d=fromRecords([{type:'SECTION',pairs:[[2,'TABLES']]},{type:'STYLE',pairs:[[5,'AB'],[2,'Standard'],[3,'old.shx']]},{type:'ENDSEC',pairs:[]},{type:'SECTION',pairs:[[2,'ENTITIES']]},{type:'ENDSEC',pairs:[]}]);d.native=true;return d;};
 const doc=make();doc.nativeOps=[{handle:'AB',styleFont:'romans.shx'}];const restored=replayRecovery(make(),captureRecovery(doc));assert.equal(restored.textStyles.get('Standard').font,'romans.shx');assert.equal(get(restored.records[1],3),'romans.shx');
});
test('local SHX resolves filenames, retains stroke geometry and reports missing glyphs',()=>{
 const glyphs={65:{advance:1,paths:[[[0,0],[.5,1],[1,0]]]},32:{advance:.5,paths:[]}};
 const font=installShx('TEST.shx',glyphs);assert.equal(localShx('C:\\Fonts\\TEST.SHX'),font);assert.equal(localShx('test'),font);
 assert.deepEqual(font.layout('A A'),{width:2.5,paths:[[[0,0],[.5,1],[1,0]],[[1.5,0],[2,1],[2.5,0]]]});
 assert.deepEqual(font.missing('AББ\n'),['Б']);assert.throws(()=>font.layout('Б'),/нет символа/);
 const shape={font:{source:'test.shx'},text:'A',height:2,halign:1,valign:0};assert.deepEqual(shxLayout(shape),[[[-.5,0],[0,-1],[.5,0]]]);
 assert.equal(shxLayout({...shape,font:{source:'absent.shx'}}),null);
 assert.deepEqual(shxLayout({...shape,multiline:true,text:'A A',textWidth:2,attachment:1}),[[[0,1],[.5,0],[1,1]],[[0,2.2],[.5,1.2000000000000002],[1,2.2]]]);
});
