import {test} from 'node:test';
import assert from 'node:assert/strict';
import {greenApiHost} from './green-api-host.js';
test('legacy universal host switches; dedicated hosts remain unchanged',()=>{
 assert.equal(greenApiHost('https://api.green-api.com/'),'https://api.greenapi.com');
 assert.equal(greenApiHost(),'https://api.greenapi.com');
 assert.equal(greenApiHost('https://7107.api.greenapi.com/'),'https://7107.api.greenapi.com');
});
