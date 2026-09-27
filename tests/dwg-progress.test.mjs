import test from 'node:test';import assert from 'node:assert/strict';
import {warningText,clampProgress} from '../app/stroy/dwg/progress.mjs';
import {parseDxf,scene} from '../app/stroy/dwg/cad.mjs';
test('progress is bounded and warning bits decoded',()=>{assert.equal(clampProgress(125),100);assert.equal(clampProgress(NaN),0);assert.equal(clampProgress(-3),0);assert.match(warningText(76),/необработанные классы/);assert.match(warningText(76),/неизвестные типы/);assert.match(warningText(76),/вне ожидаемого/);});
test('centered TEXT uses alignment point instead of insertion point',()=>{const d=parseDxf('0\nSECTION\n2\nENTITIES\n0\nTEXT\n10\n1\n20\n2\n11\n30\n21\n40\n72\n1\n40\n3\n1\nПодпись\n0\nENDSEC\n0\nEOF\n');assert.deepEqual(scene(d).shapes[0].pts[0],[30,40]);});
