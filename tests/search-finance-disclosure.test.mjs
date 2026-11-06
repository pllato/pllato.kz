import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const extract=n=>{const i=source.indexOf('function '+n+'(');return source.slice(i,source.indexOf('\n}',i)+2);};
function element(){const classes=new Set();return {style:{},dataset:{},classList:{toggle(n,on){on?classes.add(n):classes.delete(n);},contains:n=>classes.has(n)},setAttribute(){},querySelector:()=>null};}
test('search retains disclosure; opening reveals payments without resetting results',()=>{
 const chart=element(),strip=element(),button=element();chart.querySelector=()=>button;
 const match=element(),other=element();match.dataset.searchIndex='дала';other.dataset.searchIndex='other';
 const elements={financeCharts:chart,moneySum:element(),leadAnalyticsSlot:element()};
 const c=vm.createContext({SEARCH_TERM:'дала',ACTIVE_TAB:'fav',FINANCE_DISCLOSURE_OPEN:false,FAVS:new Set(),DEVELOPMENT:new Set(),document:{getElementById:id=>elements[id],querySelectorAll:q=>q==='.money-strip'?[strip]:[match,other]},sortProjectCards(){},normalizeProjectSearch:s=>s,cardAllowed:()=>true,cardMatchesProjectDates:()=>true,syncProjectDateFilterControls(){},updateSectionVisibility(){},updateTabCounts(){},financeChartsPinnedOpen:()=>false,renderSalesQuickLink(){}});
 vm.runInContext(['applyProjectFilters','financeChartsAreOpen','applyFinanceChartsFold','toggleFinanceCharts'].map(extract).join('\n'),c);
 c.applyFinanceChartsFold();c.applyProjectFilters();
 assert.equal(chart.classList.contains('search-hidden'),false);assert.equal(chart.classList.contains('search-active'),true);
 assert.equal(strip.classList.contains('finance-folded'),true);
 c.toggleFinanceCharts();assert.equal(strip.classList.contains('finance-folded'),false);assert.equal(button.textContent,'Свернуть');
 assert.equal(c.SEARCH_TERM,'дала');assert.equal(match.style.display,'');assert.equal(other.style.display,'none');
 c.toggleFinanceCharts();assert.equal(strip.classList.contains('finance-folded'),true);
 c.SEARCH_TERM='';c.applyProjectFilters();assert.equal(chart.classList.contains('search-active'),false);
});
