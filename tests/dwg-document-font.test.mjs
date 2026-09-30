import test from 'node:test';
import assert from 'node:assert/strict';
import {fromRecords,get} from '../app/stroy/dwg/cad.mjs';
import {applyDocumentFont} from '../app/stroy/dwg/document-font.mjs';
import {captureRecovery,replayRecovery} from '../app/stroy/dwg/recovery.mjs';
import {captureView,restoreView} from '../app/stroy/dwg/view-history.mjs';
const make=()=>{const doc=fromRecords([{type:'SECTION',pairs:[[2,'TABLES']]},...['Standard','Title','Big'].map((n,i)=>({type:'STYLE',pairs:[[5,String(i+10)],[2,n],[3,'old.shx'],[4,i===2?'big.shx':'']]})),{type:'ENDSEC',pairs:[]},{type:'SECTION',pairs:[[2,'ENTITIES']]},{type:'ENDSEC',pairs:[]}]);doc.native=true;return doc;};
test('document font updates every ordinary style atomically and survives recovery/undo',()=>{
 const doc=make();let state;assert.equal(applyDocumentFont(doc,'romans.shx',records=>state=captureView(doc,{},records)),2);
 assert.equal(doc.textStyles.get('Standard').font,'romans.shx');assert.equal(doc.textStyles.get('Title').font,'romans.shx');assert.equal(doc.textStyles.get('Big').font,'old.shx');
 const replay=replayRecovery(make(),captureRecovery(doc));assert.equal(replay.textStyles.get('Title').font,'romans.shx');assert.equal(get(replay.records[1],3),'romans.shx');
 restoreView(state);assert.equal(doc.textStyles.get('Standard').font,'old.shx');assert.equal(doc.nativeOps.length,0);
 assert.throws(()=>applyDocumentFont(doc,'../bad.shx',()=>assert.fail()),/SHX/);
});
