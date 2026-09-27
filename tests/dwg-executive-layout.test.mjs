import {test} from 'node:test';
import assert from 'node:assert/strict';
import {executiveLayout} from '../app/stroy/dwg/executive-layout.mjs';
test('Executive decoration remains editable native geometry',()=>{
 const result=executiveLayout({title:'Освещение',rows:[{brand:'ВВГнг',section:'3×2,5',length:12.345}]});
 assert.ok(result.items.every(i=>['LINE','TEXT'].includes(i.type)&&i.values.every(Number.isFinite)));
 assert.ok(result.items.some(i=>i.text==='12.35'));
 assert.ok(result.items.some(i=>i.text==='Освещение'));
});
test('Sheet placement and unit scaling preserve quantities',()=>{
 const config={rows:[{brand:'Кабель',section:'3×1,5',length:100}]};
 const a=executiveLayout(config),b=executiveLayout({...config,origin:[1000,2000],unit:100});
 assert.equal(a.items.length,b.items.length);
 for(let i=0;i<a.items.length;i++){assert.equal(b.items[i].values[0],1000+a.items[i].values[0]*100);assert.equal(b.items[i].values[1],2000+a.items[i].values[1]*100);assert.equal(b.items[i].text,a.items[i].text);}
});
test('Reject overflow instead of silently losing cable rows',()=>{
 assert.throws(()=>executiveLayout({rows:Array(11).fill({length:1})}));
 assert.throws(()=>executiveLayout({unit:0}));
});
