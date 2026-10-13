import assert from 'node:assert/strict';
import {paidProjectIds,developmentChange} from '../crm/worker/portal-project-lists.js';
assert.deepEqual(paidProjectIds({money:{paid:{deal:100,pays:[{sum:100}]},advance:{deal:100,pays:[{sum:10}]},unpaid:{deal:100,pays:[]},zero:{pays:[{sum:0}]}}}),['paid','advance']);
assert.deepEqual(paidProjectIds(null),[]);
assert.equal(developmentChange({projectId:'../bad',enabled:true}),null);
assert.equal(developmentChange({projectId:'one',enabled:'false'}),null);
const records=new Map();
for(const [projectId,enabled] of [['one',true],['two',true],['one',false]]){const row=developmentChange({projectId,enabled});records.set(row.id,row);}
assert.deepEqual([...records.values()].filter(r=>r.enabled).map(r=>r.projectId),['two']);
assert.deepEqual([...new Map().values()],[]);
console.log('Shared lists: paid/advance eligibility, empty initial development, validation, per-project independent updates.');
