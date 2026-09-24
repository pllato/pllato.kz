const assert=require('node:assert/strict');
const {analyse}=require('../app/stroy/plan-fakt/pdf-scale.js');
const view={width:800,height:600,transform:[1,0,0,1,0,0]};
const item=(str,x,y,width=24)=>({str,width,height:8,transform:[8,0,0,8,x,y]});
const line=(a,b,id)=>({id,paths:[[a,b]],style:{stroke:'#000',fill:null,dash:[]}});
function drawing(factor=1){const items=[],objects=[];let i=0;for(const [mm,y] of [[6000,50],[4000,100],[3000,150]]){const x=30,len=mm/1000/.0352777777778;items.push(item(String(mm),(x+len/2-12)*factor,(y-3)*factor,24*factor));objects.push(line([(x-4)*factor,y*factor],[(x+len+4)*factor,y*factor],String(i++)));for(const t of [x,x+len])objects.push(line([(t-2)*factor,(y-2)*factor],[(t+2)*factor,(y+2)*factor],String(i++)));}return {items,objects};}
const d=drawing(),r=analyse(d.items,view,d.objects);assert.equal(r.dimensions.length,1);assert.equal(r.dimensions[0].count,3);assert.ok(Math.abs(r.dimensions[0].mPerPoint-.0352777777778)<1e-10);
const resized=drawing(1.3);assert.ok(Math.abs(analyse(resized.items,view,resized.objects).dimensions[0].mPerPoint*1.3-r.dimensions[0].mPerPoint)<1e-10);
assert.equal(analyse(d.items.slice(0,1),view,d.objects).dimensions.length,0);
assert.equal(analyse(d.items,view,d.objects.filter(o=>Number(o.id)%3===0)).dimensions.length,0);
assert.equal(analyse([item('6000',20,20)],view,[]).dimensions.length,0);
assert.equal(analyse([],view,[]).labels.length,0);
let a=analyse([item('М 1:100',20,20)],view,[],2);assert.equal(a.labels[0].mPerPoint,100*25.4/72000*2);
a=analyse([item('1',20,20,5),item(':',26,20,3),item('200',30,20,15)],view);assert.equal(a.labels[0].denominator,200);
a=analyse([item('1:100',20,20),item('1:50',20,40)],view);assert.equal(a.labels.length,2);
assert.equal(analyse([item('1/100',20,20),item('6000',50,30)],view).labels.length,0);
// Rotate every text baseline and segment by 90 degrees: the measured scale must not change.
const rotated={items:d.items.map(t=>({...t,transform:[0,8,-8,0,600-t.transform[5],t.transform[4]]})),objects:d.objects.map(o=>({...o,paths:o.paths.map(p=>p.map(([x,y])=>[600-y,x]))}))};
assert.ok(Math.abs(analyse(rotated.items,view,rotated.objects).dimensions[0].mPerPoint-r.dimensions[0].mPerPoint)<1e-10);
console.log('PASS: ticks, consensus, resized export, rotation, no bare-number guessing, UserUnit, split labels, multiple scales, scan fallback');
