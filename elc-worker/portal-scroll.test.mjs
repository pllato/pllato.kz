import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
test('unchanged card order performs no DOM moves on star refresh',()=>{
 const cards=[3,2,1].map(date=>({dataset:{date:String(date)}}));let moves=0;
 const grid={querySelectorAll:()=>cards,insertBefore(card,before){moves++;cards.splice(cards.indexOf(card),1);cards.splice(before?cards.indexOf(before):cards.length,0,card);},appendChild(){throw Error('must not detach every card')}};
 const ctx=vm.createContext({document:{querySelectorAll:()=>[grid]},PROJECT_DATE_FILTERS:{sort:'created_desc'},projectCardDate:c=>c.dataset.date});
 vm.runInContext(source.slice(source.indexOf('function sortProjectCards(){'),source.indexOf('function syncProjectDateFilterControls')),ctx);
 ctx.sortProjectCards();ctx.sortProjectCards();assert.equal(moves,0);
 ctx.PROJECT_DATE_FILTERS.sort='created_asc';ctx.sortProjectCards();assert.deepEqual(cards.map(c=>c.dataset.date),['1','2','3']);
 const after=moves;ctx.sortProjectCards();assert.equal(moves,after);
});
test('star refresh restores current offset, not a previous stored position',()=>{
 let restored;
 const ctx=vm.createContext({window:{scrollX:0,scrollY:4200,scrollTo:p=>restored=p},document:{querySelectorAll:()=>[]},GROUPS_INIT:true,applyProjectFilters(){ctx.window.scrollY=0;}});
 vm.runInContext(source.slice(source.indexOf('function refreshFavsUi(){'),source.indexOf('async function syncFavsFromServer')),ctx);
 ctx.refreshFavsUi();assert.equal(restored.top,4200);
 ctx.window.scrollY=5100;ctx.refreshFavsUi();assert.equal(restored.top,5100);
});
