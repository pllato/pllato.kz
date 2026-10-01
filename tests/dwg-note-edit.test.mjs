import test from 'node:test';
import assert from 'node:assert/strict';
import {noteValue,notePatch,applyNotePatch,isNote} from '../app/stroy/dwg/note-edit.mjs';
import {captureView,restoreView} from '../app/stroy/dwg/view-history.mjs';
import {get} from '../app/stroy/dwg/cad.mjs';
import {textHitDistance} from '../app/stroy/dwg/renderer.mjs';
test('MTEXT joins chunks, preserves formatting and converts newlines for native write',()=>{
 const r={type:'MTEXT',pairs:[[5,'AB'],[3,'{\\C7;Труба '],[1,'ПНД\\Pпол}'],[40,250]]};
 assert.equal(noteValue(r),'{\\C7;Труба ПНД\nпол}');
 const op=notePatch(r,'{\\C7;Труба %%C16мм\nв полу}',300);applyNotePatch(r,op);
 assert.equal(get(r,40),'300');assert.equal(r.pairs.filter(p=>p[0]===3).length,0);
 assert.equal(get(r,1),'{\\C7;Труба %%C16мм\\Pв полу}');
});
test('note edits reject invalid height, NUL and multiline TEXT',()=>{
 const r={type:'TEXT',pairs:[[5,'B'],[1,'hello']]};
 assert.throws(()=>notePatch(r,'a\nb',2));assert.throws(()=>notePatch(r,'a\0',2));assert.throws(()=>notePatch(r,'a',NaN));assert.throws(()=>notePatch(r,'a',0));
 assert.equal(notePatch(r,'Новая запись',5).text,'Новая запись');
});
test('text picking covers multiline lines and does not use broad scene bounds',()=>{
 const ctx={save(){},restore(){},measureText:t=>({width:t.length*5})},s={pts:[[100,100]],height:10,text:'1234\n5678',multiline:true,attachment:1,textWidth:0,angle:0},v={x:0,y:200,s:1};
 assert.equal(textHitDistance(ctx,s,[110,117],v),0);assert.ok(textHitDistance(ctx,s,[50,50],v)>50);
 const rotated={...s,angle:Math.PI/2};assert.equal(textHitDistance(ctx,rotated,[117,90],v),0);
});
test('leader text patches preserve geometry and participate in undo',()=>{
 const text={type:'MTEXT',pairs:[[1,'old'],[40,'2']]},line={type:'LINE',pairs:[[10,'0'],[11,'10']]},r={type:'MULTILEADER',pairs:[[5,'A'],[1,'old'],[40,'2']],parts:[line,text]};
 const doc={records:[r],entities:[r],blocks:new Map(),textStyles:new Map(),layers:new Map()};const saved=captureView(doc,{},[r,...r.parts]);
 assert.equal(isNote(r),true);applyNotePatch(r,notePatch(r,'new\nline',3));assert.equal(get(text,1),'new\\Pline');assert.equal(get(line,11),'10');restoreView(saved);assert.equal(get(r,1),'old');assert.equal(get(text,1),'old');
 for(const type of ['ATTRIB','ATTDEF'])assert.equal(isNote({type}),true);
});
