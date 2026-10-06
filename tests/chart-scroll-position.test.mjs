import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const code=['captureFinanceChartPosition','restoreFinanceChartPosition','paintFinanceCharts'].map(name=>{
 const start=source.search(new RegExp('(?:async )?function '+name+'\\('));
 return source.slice(start,source.indexOf('\n}',start)+2);
}).join('\n');
function setup(){
 const list={scrollTop:260},history={scrollTop:45};
 const section={dataset:{taskKind:'cash'},scrollTop:90,matches:()=>true,querySelector:s=>s==='.fc-week-tasks-list'?list:s==='.fc-week-history-list'?history:null};
 const grid={scrollLeft:820};
 const root={matches:()=>false,querySelector:s=>s==='.fc-grid'?grid:null,querySelectorAll:()=>[section]};
 Object.defineProperty(root,'innerHTML',{set(){grid.scrollLeft=0;section.scrollTop=0;list.scrollTop=0;history.scrollTop=0;}});
 const window={scrollX:0,scrollY:420,scrollTo({left,top}){this.scrollX=left;this.scrollY=top;}};
 const c=vm.createContext({window,console,document:{getElementById:()=>null},CHART_ALLOWED:{},CHART_VISIBILITY:{},CHART_SCALE:{},FINANCE_CHART_PERIOD:'week',financeChartKinds:()=>['cash'],loadProjectManagers:async()=>{},loadFinanceChartComments:async()=>{},loadFinanceWeekTasks:async()=>{},ensureInitialFinanceComment:async()=>{},loadGlobalSalesQuickLink:async()=>{},financeChartsHeader:()=>'',financeChartCard:()=>'',applyFinanceChartsFold:()=>{},restorePortalPosition:()=>{throw Error('Must not restore stale portal position during edit');}});
 vm.runInContext(code,c);return {c,root,section,list,history,grid,window};
}
test('full chart repaint preserves latest horizontal, page and task scroll after async loading',async()=>{
 const {c,root,grid,list,section,history,window}=setup();
 c.loadGlobalSalesQuickLink=async()=>{grid.scrollLeft=1240;window.scrollY=530;list.scrollTop=320;};
 await c.paintFinanceCharts(root,{charts:{cash:[]}});
 assert.equal(grid.scrollLeft,1240);assert.equal(window.scrollY,530);assert.equal(list.scrollTop,320);assert.equal(section.scrollTop,90);assert.equal(history.scrollTop,45);
});
test('task-only replacement preserves list/history/fullscreen panel offsets',()=>{
 const {c,section,list,history,window}=setup();
 const saved=c.captureFinanceChartPosition(section);
 section.scrollTop=0;list.scrollTop=0;history.scrollTop=0;window.scrollY=0;
 c.restoreFinanceChartPosition(section,saved);
 assert.equal(section.scrollTop,90);assert.equal(list.scrollTop,260);assert.equal(history.scrollTop,45);assert.equal(window.scrollY,420);
});
