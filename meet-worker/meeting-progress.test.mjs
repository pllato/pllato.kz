import test from 'node:test';
import assert from 'node:assert/strict';
import {meetingProgress} from '../app/meeting-progress.js';
test('saved video does not hide unfinished transcript',()=>{
 assert.equal(meetingProgress([{extension:'WEBM',kind:'recording',status:'stored'},{extension:'TXT',kind:'transcript',status:'processing'}]),'Видео: сохранено · Расшифровка: в обработке');
});
test('failed and missing material cannot look ready',()=>{
 assert.equal(meetingProgress([{extension:'WEBM',kind:'recording',status:'failed'},{extension:'TXT',kind:'transcript',status:'stored',deleted_at:'today'}]),'Видео: требуется проверка · Расшифровка: пока нет');
});

import {visibleMeetings} from '../app/meeting-progress.js';
test('closed history shows only unfinished transcripts, regardless of video status',()=>{
 const video=status=>({kind:'recording',extension:'WEBM',status});
 const transcript=status=>({kind:'transcript',extension:'TXT',status});
 const rows=[
  {id:'ready',files:[video('stored'),transcript('stored')]},
  {id:'video-error-text-ready',files:[video('failed'),transcript('stored')]},
  {id:'processing',files:[video('stored'),transcript('processing')]},
  {id:'failed',files:[video('stored'),transcript('failed')]},
  {id:'missing',files:[video('stored')]},
  {id:'deleted',files:[{...transcript('failed'),deleted_at:'today'}]},
 ];
 assert.deepEqual(visibleMeetings(rows).map(m=>m.id),['processing','failed','missing']);
 assert.equal(visibleMeetings(rows,true),rows);
 rows[2].files[1].status='stored';
 assert.deepEqual(visibleMeetings(rows).map(m=>m.id),['failed','missing']);
});
