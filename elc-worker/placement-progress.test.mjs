import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../app/elc/placement-test.html',import.meta.url),'utf8');
const code=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
function fixture(fetch=async()=>Response.json({ok:true,resultId:'r1'})){
 const storage=new Map(),nodes=new Map();const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',isConnected:true,focus(){},addEventListener(){},prepend(){}});return nodes.get(id)},createElement(){return {}},querySelectorAll(){return []}};
 const c=vm.createContext({console,URL,URLSearchParams,AbortController,Blob,Date,fetch,document:doc,window:{addEventListener(){}},location:{search:''},navigator:{},sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},setTimeout,clearTimeout,setInterval,clearInterval,alert(){}});
 vm.runInContext(code,c);return {c,nodes,storage,run:s=>vm.runInContext(s,c)};
}
test('all 28 answers reach results; completed progress restores after reload',()=>{
 const f=fixture();f.run("student.name='Тест';start();while(idx<QUESTIONS.length)gradeTyped(QUESTIONS[idx].accept[0]);");assert.equal(f.run('idx'),28);assert.equal(f.run('computePlacement().graduated'),true);assert.match(f.nodes.get('app').innerHTML,/Теоретическая часть завершена/);
 f.run('idx=0;answers=[]');assert.equal(f.run('resumeProgress()'),true);assert.equal(f.run('answers.length'),28);
});
test('all wrong answers complete without crashing; invalid saved progress is rejected',()=>{
 const f=fixture();f.run("student.name='Тест';start();while(idx<QUESTIONS.length)gradeTyped('wrong');");assert.equal(f.run('computePlacement().rec'),1);
 f.run("sessionStorage.setItem(PROGRESS_KEY,JSON.stringify({time:Date.now(),branch:'',student:{name:'X'},idx:1,answers:[{level:99,correct:true}]}))");assert.equal(f.run('resumeProgress()'),false);
});
test('failed audio upload is visible and retry reuses the saved theory result',async()=>{
 const requests=[];let audioCalls=0;const f=fixture(async(url)=>{requests.push(url);if(url.includes('/audio/'))return new Response('',{status:++audioCalls===1?503:200});return Response.json({ok:true,resultId:'r1'});});
 f.run("BRANCH={code:'test'};student.contactId='c1';recBlob=new Blob(['audio']);");await assert.rejects(f.run('submitToCRM(true)'),/503/);await f.run('submitToCRM(true)');assert.equal(requests.filter(u=>u.endsWith('/submit')).length,1);assert.equal(audioCalls,2);
});
test('denied microphone leaves a retry action instead of an unhandled rejection',async()=>{
 const f=fixture();f.c.navigator.mediaDevices={getUserMedia:async()=>{throw Error('denied')}};await f.run('startRec()');assert.match(f.nodes.get('rec').innerHTML,/Разреши доступ/);assert.equal(f.run('recStarting'),false);
});
test('a stalled request times out with a retry message and preserves answers',async()=>{
 const f=fixture((url,opts)=>new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>{const e=new Error('aborted');e.name='AbortError';reject(e);})));f.c.setTimeout=fn=>setTimeout(fn,1);f.run("student.name='Тест';start();gradeTyped('am')");await assert.rejects(f.run("placementFetch('/fixture')"),/ответы сохранены/);assert.equal(f.run('answers.length'),1);
});

test('student screens hide scores and placement while staff payload retains the full result',()=>{
 const f=fixture();f.run("student.name='Тест';start();while(idx<QUESTIONS.length)gradeTyped(QUESTIONS[idx].accept[0]);");
 const privateResult=/28 из 28|Upper-Intermediate|CEFR|Предварительный уровень|Рекомендуемый уровень|Разбивка по уровням|Верно|Выше Upper/;
 assert.doesNotMatch(f.nodes.get('app').innerHTML,privateResult);
 assert.equal(f.run('buildTheoryPayload().correct'),28);assert.equal(f.run('buildTheoryPayload().levelN'),8);assert.equal(f.run('Object.keys(buildTheoryPayload().breakdown).length'),7);
 f.run('renderSpeaking()');assert.doesNotMatch(f.nodes.get('app').innerHTML,privateResult);
 f.run('renderSubmitted(true)');assert.doesNotMatch(f.nodes.get('app').innerHTML,privateResult);assert.match(f.nodes.get('app').innerHTML,/переданы преподавателю/);
});
test('downstream student lesson and certificate never render placement results',()=>{
 const lesson=readFileSync(new URL('../elc-lesson-assets/lesson.html',import.meta.url),'utf8');
 assert.doesNotMatch(lesson,/theoryBox|\$\{th\.correct\}|\$\{testLine\}|\$\{e\(levelStr\)\}|Ваш уровень —|Предварительный уровень|\$\{tr\.score\}/);
 assert.match(lesson,/requestCheck\('level-set'\)/);
});
