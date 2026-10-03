import test from 'node:test';import assert from 'node:assert/strict';
import {dwgVersion,requireWritableVersion} from '../app/stroy/dwg/dwg-version.mjs';
const bytes=s=>new TextEncoder().encode(s).buffer;
test('DWG 2007 is identified and rejected before expensive write with actionable reason',()=>{assert.equal(dwgVersion(bytes('AC1021')).needsConversion,true);assert.throws(()=>requireWritableVersion(bytes('AC1021')),/копия DWG 2013 или 2018/);});
test('other versions retain native validation, without a promise of compatibility',()=>{for(const s of ['AC1015','AC1018','AC1024','AC1027','AC1032']){assert.equal(dwgVersion(bytes(s)).signature,s);assert.doesNotThrow(()=>requireWritableVersion(bytes(s)));}assert.doesNotThrow(()=>dwgVersion(bytes('')));});
