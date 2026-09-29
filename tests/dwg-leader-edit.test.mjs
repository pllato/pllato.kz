import test from 'node:test';import assert from 'node:assert/strict';
import {createExecutiveProject,createExecutive,addRoute,addLeader,executiveEntities} from '../app/stroy/dwg/executive-project.mjs';
import {validateExecutiveProject} from '../app/stroy/dwg/executive-metadata.mjs';
import {leaderHit} from '../app/stroy/dwg/leader-workbench.mjs';
function fixture(){const p=createExecutiveProject();createExecutive(p,{id:'s',metresPerUnit:1,paperUnit:2});addRoute(p,'s',{id:'r',points:[[0,0],[200,0]],brand:'ABC',section:'3x2.5'});addLeader(p,'s','r',{id:'l',anchor:[0,0],elbow:[30,30],label:[80,30],textHeight:2});return p;}
test('leader size survives metadata and controls generated DWG text height',()=>{const p=validateExecutiveProject(fixture());assert.equal(p.sheets[0].routes[0].leaders[0].textHeight,2);const text=executiveEntities(p,'s').items.find(i=>i.text==='ABC 3x2.5');assert.equal(text.values[2],4);p.sheets[0].routes[0].leaders[0].textHeight=-1;assert.throws(()=>validateExecutiveProject(p));});
test('leader text and line can be selected without selecting cable',()=>{const p=fixture(),screen=([x,y])=>[x,100-y];assert.equal(leaderHit(p,[90,68],screen)?.id,'l');assert.equal(leaderHit(p,[50,70],screen)?.id,'l');assert.equal(leaderHit(p,[0,100],screen),null);assert.equal(leaderHit(p,[300,100],screen),null);});
