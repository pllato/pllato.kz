import test from 'node:test';
import assert from 'node:assert/strict';
import {titleBox,titleHit} from '../app/stroy/dwg/title-workbench.mjs';
test('title hit uses centered text, sheet origin and zoom',()=>{
 const sheet={id:'a',origin:[100,200],paperUnit:2,title:'Title'},screen=p=>[p[0]*3,-p[1]*3],measure=(t,h)=>t.length*h/2;
 const box=titleBox(sheet,screen,measure);
 assert.equal(box.h,30);assert.equal(box.x+box.w/2,1560);
 assert.equal(titleHit([sheet],[1560,box.y+15],screen,measure),sheet);
 assert.equal(titleHit([sheet],[0,0],screen,measure),undefined);
 const upper={...sheet,id:'b',titleStyle:{height:8}};
 assert.equal(titleHit([sheet,upper],[1560,box.y],screen,measure),upper);
});
