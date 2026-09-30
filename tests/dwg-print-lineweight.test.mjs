import {test} from 'node:test';
import assert from 'node:assert/strict';
import {printLineweight} from '../app/stroy/dwg/print-lineweight.mjs';
test('original and newly drawn electrical paths have matching minimum print width',()=>{
 const s={text:null,layer:'ЭЛ-розетки'};
 assert.equal(printLineweight(s),printLineweight({...s,lineweight:25}));
 assert.equal(printLineweight({...s,lineweight:9}),.25*72/25.4);
 assert.equal(printLineweight({...s,lineweight:50}),.5*72/25.4);
 assert.equal(printLineweight({...s,layer:'Размеры'}),.18*72/25.4);
});
