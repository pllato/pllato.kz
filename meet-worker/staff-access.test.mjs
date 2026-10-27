import test from 'node:test';
import assert from 'node:assert/strict';
import {storeMeetStaffAccess,readMeetStaffAccess} from '../meet-staff-access.js';
test('CRM-only session transfers scoped host access without changing the public URL',()=>{
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k),removeItem:k=>data.delete(k)};
 const room='crm-11111111-1111-1111-1111-111111111111';
 const access={hostKey:'hk_22222222-2222-2222-2222-222222222222',hostUrl:'https://pllato.kz/m/d111111111111'};
 storeMeetStaffAccess(storage,room,access,1000);
 assert.equal(readMeetStaffAccess(storage,room,2000).hostKey,access.hostKey);
 assert.equal(readMeetStaffAccess(storage,room+'x',2000),null);
 assert.equal(readMeetStaffAccess(storage,room,301001),null);
 assert.equal(data.size,0);
 assert.throws(()=>storeMeetStaffAccess(storage,room,{hostKey:'fake'},1000));
});
