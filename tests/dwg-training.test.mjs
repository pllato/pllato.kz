import test from 'node:test';import assert from 'node:assert/strict';
import {lessons,questions,grade} from '../app/stroy/dwg/training-content.mjs';
test('training covers current workflow, every quiz explanation links to a lesson',()=>{
 assert.equal(new Set(lessons.map(l=>l.id)).size,18);
 for(const id of ['fonts','table','lengths','layers','device','select','history','export'])assert.ok(lessons.some(l=>l.id===id));
 assert.equal(questions.length,10);for(const q of questions){assert.ok(lessons.some(l=>l.id===q.lesson));assert.ok(q.options[q.answer]);assert.ok(q.why);}
 assert.equal(grade([]).score,0);assert.equal(grade(questions.map(q=>q.answer)).score,10);
 const answers=questions.map(q=>q.answer);answers[0]=-1;answers[1]=-1;assert.equal(grade(answers).passed,true);answers[2]=-1;assert.equal(grade(answers).passed,false);
});
