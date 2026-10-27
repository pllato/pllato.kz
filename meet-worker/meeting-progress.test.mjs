import test from 'node:test';
import assert from 'node:assert/strict';
import {meetingProgress} from '../app/meeting-progress.js';
test('saved video does not hide unfinished transcript',()=>{
 assert.equal(meetingProgress([{extension:'WEBM',kind:'recording',status:'stored'},{extension:'TXT',kind:'transcript',status:'processing'}]),'Видео: сохранено · Расшифровка: в обработке');
});
test('failed and missing material cannot look ready',()=>{
 assert.equal(meetingProgress([{extension:'WEBM',kind:'recording',status:'failed'},{extension:'TXT',kind:'transcript',status:'stored',deleted_at:'today'}]),'Видео: требуется проверка · Расшифровка: пока нет');
});
