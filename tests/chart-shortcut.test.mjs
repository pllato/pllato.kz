import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const start=html.indexOf('function financeChartShortcut('),code=html.slice(start,html.indexOf('\n}',start)+2);
function setup({editing=false,modal=false,fullscreen=false,visible=true}={}){
 let opened=0,closed=0,prevented=0;
 const toggle={getClientRects:()=>visible?[{}]:[]};
 const document={activeElement:{closest:()=>null},querySelector:s=>s.startsWith('.money-ovl')?modal:s==='.fc-fullscreen'?(fullscreen?{close:()=>closed++}:null):toggle};
 const c=vm.createContext({document,window:{innerHeight:800},toggleFinanceCharts:()=>opened++});vm.runInContext(code,c);
 return {run:extra=>{c.financeChartShortcut({key:'f',code:'KeyF',target:{closest:()=>editing},preventDefault:()=>prevented++,...extra});return {opened,closed,prevented}}};
}
test('Latin and Russian layouts toggle the entire section without hover',()=>{
 for(const key of ['f','F','а','А'])assert.equal(setup().run({key}).opened,1);
 assert.equal(setup().run({key:'а',code:''}).opened,1);
});
test('same key closes an expanded chart without requiring hover',()=>{
 assert.deepEqual(setup({fullscreen:true,visible:false}).run({key:'а'}),{opened:0,closed:1,prevented:1});
});
test('does not interfere with typing, dialogs, browser shortcuts or repetition',()=>{
 for(const opts of [{editing:true},{modal:true},{visible:false}])assert.equal(setup(opts).run({}).prevented,0);
 for(const extra of [{ctrlKey:true},{metaKey:true},{altKey:true},{repeat:true},{isComposing:true},{defaultPrevented:true},{key:'x',code:'KeyX'}])assert.equal(setup().run(extra).prevented,0);
});

test('successive presses expand and collapse the section',()=>{
 const c=setup();assert.equal(c.run({key:'а'}).opened,1);assert.equal(c.run({key:'а'}).opened,2);
});
