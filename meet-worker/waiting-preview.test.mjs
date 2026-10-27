import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../meet.html',import.meta.url),'utf8');
test('waiting guest sees local call UI without admission or recording',()=>{
 const calls=[],els={};const context={state:{admitted:false,isHost:false},showScreen:s=>calls.push(s),$:id=>els[id]??=( {} ),setupLocalTile:()=>calls.push('preview'),initControls:()=>calls.push('controls'),renderPeopleList(){},updateBadges(){}};
 vm.createContext(context);vm.runInContext(html.slice(html.indexOf('function showWaitingPreview(){'),html.indexOf('function onAdmitted(){')),context);context.showWaitingPreview();
 assert.deepEqual(calls,['screen-room','preview','controls']);assert.equal(context.state.admitted,false);assert.equal(els['timer-pill'].textContent,'Без записи');
});
