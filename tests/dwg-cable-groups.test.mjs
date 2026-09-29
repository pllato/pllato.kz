import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cableGroups} from '../app/stroy/dwg/cable-ledger.mjs';
test('Same brand and section aggregate disjoint paths and allowances without merging geometry',()=>{
 const routes=[2.63,3.25,4.56,7.78,5.29].map((n,i)=>({id:String(i),brand:'ВВГнг(А)-LS',section:'3×2,5',points:[[0,i],[n,i]],metresPerUnit:1,extraMetres:i===0?1:0})),before=structuredClone(routes),groups=cableGroups(routes);
 assert.equal(groups.length,1);assert.ok(Math.abs(groups[0].length-24.51)<1e-9);assert.equal(groups[0].routeIds.length,5);assert.deepEqual(routes,before);
 routes.push({...routes[0],id:'other',section:'3×4'});assert.equal(cableGroups(routes).length,2);
});
test('Unnamed cables stay separate; trimming follows ledger grouping',()=>{
 const route={points:[[0,0],[1,0]],metresPerUnit:1,extraMetres:0};assert.equal(cableGroups([{...route,id:'a'},{...route,id:'b'}]).length,2);assert.equal(cableGroups([{...route,id:'a',brand:' X ',section:' 2 '},{...route,id:'b',brand:'X',section:'2'}]).length,1);
});
