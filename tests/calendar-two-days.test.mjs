import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const extract=n=>{const i=source.indexOf('function '+n+'(');return source.slice(i,source.indexOf('\n}',i)+2);};
function setup(events){
 const boxes=Object.fromEntries(['calWidget','calTomorrowWidget'].map(id=>[id,{querySelector:()=>null,classList:{remove(){}},innerHTML:''}]));
 const bound=[];
 const c=vm.createContext({Date,URLSearchParams,CAL_ERROR:false,renderCalendarTaskColumn:()=>{},CAL_EVENTS:events,document:{getElementById:id=>boxes[id]},calCanSee:()=>true,calCanSeeWidget:()=>false,calDayKey:d=>d.toDateString(),escapeHtml:s=>s,calZoomUrl:s=>s||'',calBindTips:(box,items)=>bound.push(items),calPositionList:()=>{}});
 vm.runInContext(['calTimeLabel','renderCalendarDay','renderTodayCalendar'].map(extract).join('\n'),c);
 return {c,boxes,bound};
}
const event=(offset,title)=>{const d=new Date();d.setDate(d.getDate()+offset);d.setHours(12,0,0,0);return {at:+d,end:+d+3600000,title,kind:'meet',href:'#deal',zoomUrl:'https://zoom.us/j/123'};};
test('today and tomorrow have separate events, links and tooltip data',()=>{
 const a=event(0,'Today client'),b=event(1,'Tomorrow client');
 const {c,boxes,bound}=setup([a,b,event(2,'Later client')]);c.renderTodayCalendar();
 assert.match(boxes.calWidget.innerHTML,/Сегодня/);assert.match(boxes.calWidget.innerHTML,/Today client/);assert.doesNotMatch(boxes.calWidget.innerHTML,/Tomorrow client/);
 assert.match(boxes.calTomorrowWidget.innerHTML,/Завтра/);assert.match(boxes.calTomorrowWidget.innerHTML,/Tomorrow client/);assert.match(boxes.calTomorrowWidget.innerHTML,/https:\/\/zoom.us\/j\/123/);assert.doesNotMatch(boxes.calTomorrowWidget.innerHTML,/Today client|Later client/);
 assert.equal(bound[1][0],b);
});
test('tomorrow displays explicit empty and loading states',()=>{
 let state=setup([]);state.c.renderTodayCalendar();assert.match(state.boxes.calTomorrowWidget.innerHTML,/Завтра встреч нет/);
 state=setup(null);state.c.renderTodayCalendar();assert.match(state.boxes.calTomorrowWidget.innerHTML,/Завтра.*загружаю встречи/);
});
test('fetch uses one shared upcoming endpoint for today and tomorrow',async()=>{
 const {c}=setup([]),calls=[];c.getSession=()=>({token:'test'});c.CAL_WORKER='https://example.test';
 c.calFetch=async(url,timeout,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ok:true,items:[event(0,'day 0'),event(1,'day 1')]})};};
 vm.runInContext('async '+extract('calFetchToday'),c);
 const items=await c.calFetchToday();assert.deepEqual(Array.from(items,e=>e.title),['day 0','day 1']);assert.equal(calls.length,1);assert.match(calls[0].url,/api\/calendar\/upcoming/);assert.equal(calls[0].options.headers.Authorization,'Bearer test');
});
