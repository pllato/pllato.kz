import test from 'node:test';
import assert from 'node:assert/strict';
import {latestOpeningPreflight} from '../app/stroy/dwg/opening-preflight.mjs';
const pending=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('slow first file cannot supersede the latest chosen file',async()=>{
 const a=pending(),b=pending(),check=latestOpeningPreflight(f=>f.promise,()=>0);
 const first=check(a),second=check(b);b.resolve();assert.equal(await second,true);
 a.resolve();assert.equal(await first,false);
});
test('obsolete header failure cannot replace the current file with an error dialog',async()=>{
 const a=pending(),b=pending(),check=latestOpeningPreflight(f=>f.promise,()=>0);
 const first=check(a),second=check(b);a.reject(Error('old format'));assert.equal(await first,false);
 b.resolve();assert.equal(await second,true);
});
test('cancel, demo adoption or another operation invalidates pending header read',async()=>{
 for(const reject of [false,true]){
  let revision=0;const file=pending(),check=latestOpeningPreflight(f=>f.promise,()=>revision);
  const result=check(file);revision++;reject?file.reject(Error('old format')):file.resolve();assert.equal(await result,false);
 }
});
test('current invalid file still reports the actionable error',async()=>{
 const check=latestOpeningPreflight(async()=>{throw Error('DWG 2018');},()=>0);
 await assert.rejects(check({}),/DWG 2018/);
});
