import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const code=['calNearestEventIndex','calPositionList'].map(n=>{const i=source.indexOf('function '+n+'(');return source.slice(i,source.indexOf('\n}',i)+2);}).join('\n');
const c=vm.createContext({Date});vm.runInContext(code,c);
test('ongoing meeting wins; task deadlines never count as running',()=>{
 assert.equal(c.calNearestEventIndex([{at:1,end:200,kind:'task'},{at:50,end:150,kind:'meet'},{at:120,end:200}],100),1);
 assert.equal(c.calNearestEventIndex([{at:1,end:200,kind:'task'},{at:120,end:200,kind:'task'},{at:130,end:200}],100),1);
});
test('after last event select last, before first select first, empty safe',()=>{
 assert.equal(c.calNearestEventIndex([{at:10,end:20},{at:30,end:40}],100),1);
 assert.equal(c.calNearestEventIndex([{at:110,end:120}],100),0);
 assert.equal(c.calNearestEventIndex([],100),-1);
});
test('initial load scrolls only list; refresh retains chosen position; next day recenters',()=>{
 const now=Date.now(),events=[{at:now+100,end:now+200}];
 const list={scrollTop:0,getBoundingClientRect:()=>({top:100}),querySelector:()=>({closest:()=>({getBoundingClientRect:()=>({top:400})})})};
 const box={dataset:{},querySelector:()=>list};
 c.calPositionList(box,events,now,{top:0});assert.equal(list.scrollTop,300);
 list.scrollTop=0;c.calPositionList(box,events,now,{top:55});assert.equal(list.scrollTop,55);
 list.scrollTop=0;c.calPositionList(box,events,now+86400000,{top:55});assert.equal(list.scrollTop,300);
});
