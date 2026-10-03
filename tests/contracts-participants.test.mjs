import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visibleParticipants, participantTypeLabel, signatureCountLabel} from '../contracts/participants.js';
const pending={id:'placeholder',role:'owner',status:'pending'};
const company={id:'company',role:'employee',status:'signed',signerType:'ip'};
const creator={id:'creator',role:'owner',status:'signed',signerType:'individual'};
test('universal link includes every real signature regardless of side, without phantom sender',()=>{
 const list=[pending,company,creator];
 assert.deepEqual(visibleParticipants(list,true),[company,creator]);
 assert.equal(signatureCountLabel(list,true),'Получено подписей: 2');
 assert.equal(participantTypeLabel(company),'компания');
 assert.equal(participantTypeLabel(creator),'физлицо');
 assert.equal(list.length,3);
});
test('no signatures does not imply an expected company signature',()=>{
 assert.deepEqual(visibleParticipants([pending],true),[]);
 assert.equal(signatureCountLabel([pending],true),'Получено подписей: 0');
});
test('legacy named invitations retain pending participants and counts',()=>{
 assert.deepEqual(visibleParticipants([pending,company],false),[pending,company]);
 assert.equal(signatureCountLabel([pending,company],false),'1 из 2');
});
test('declined records are retained, without counting as signatures',()=>{
 const declined={role:'owner',status:'declined'};
 assert.deepEqual(visibleParticipants([declined,company],true),[declined,company]);
 assert.equal(signatureCountLabel([declined,company],true),'Получено подписей: 1');
});
