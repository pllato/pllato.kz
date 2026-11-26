import test from 'node:test';import assert from 'node:assert/strict';import {stagePalette} from '../app/elc/stage-colors.js';
test('configured stage colors are preserved with readable text, including white/yellow/black',()=>{
 for(const color of ['#ffffff','#80fffd','#ef9025','#fbff1a','#000000','#4b4950','#f00000','#267416']){
  const p=stagePalette({color});assert.equal(p.color,color);assert.match(p.border,/^#[0-9a-f]{6}$/i);
 }
 assert.equal(stagePalette({color:'#ffffff'}).text,'#111827');assert.equal(stagePalette({color:'#fbff1a'}).text,'#111827');assert.equal(stagePalette({color:'#000000'}).text,'#ffffff');
 assert.notEqual(stagePalette({color:'#ffffff'}).border,'#ffffff');
});
test('invalid CSS never passes through and semantic fallbacks remain valid',()=>{
 assert.equal(stagePalette({color:'red;display:none',semantics:'F'}).color,'#f05975');assert.equal(stagePalette({semantics:'S'}).color,'#3fd88e');assert.equal(stagePalette().color,'#a87fff');
});
