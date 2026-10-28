import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {MEET_BACKGROUNDS,hostBackground} from '../meet-backgrounds.js';
test('four hosts get distinct backgrounds regardless of presence order',()=>{
 const ids=['host-c','host-a','host-d','host-b'];
 assert.equal(new Set(ids.map(id=>hostBackground(id,ids))).size,4);
 for(const id of ids)assert.equal(hostBackground(id,ids),hostBackground(id,[...ids].reverse()));
 for(const {url} of Object.values(MEET_BACKGROUNDS))assert(existsSync(new URL('..'+url,import.meta.url)));
});
