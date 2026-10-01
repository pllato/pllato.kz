import {lessons,questions,grade} from './training-content.mjs?v=0.17.57';
const $=id=>document.getElementById(id),key='pllato_dwg_training_01748';
let completed=new Set();try{completed=new Set(JSON.parse(localStorage.getItem(key)||'[]').filter(id=>lessons.some(l=>l.id===id)));}catch{}
const progress=()=>{$('trainingProgress').textContent=`Прочитано ${completed.size} из ${lessons.length} разделов`;try{localStorage.setItem(key,JSON.stringify([...completed]));}catch{}};
$('printGuide').onclick=()=>window.print();
for(const [i,step]of lessons.entries()){
 const link=document.createElement('a');link.href='#'+step.id;link.textContent=`${i+1}. ${step.title}`;$('guideContents').append(link);
 const chapter=document.createElement('section');chapter.id=step.id;
 const title=document.createElement('h2');title.textContent=`${i+1}. ${step.title}`;
 const intro=document.createElement('p');intro.textContent=step.intro;
 const list=document.createElement('ol');for(const text of step.steps){const li=document.createElement('li');li.textContent=text;list.append(li);}
 const result=document.createElement('p');result.className='result';result.textContent='Проверьте себя: '+step.result;chapter.append(title,intro,list,result);
 if(step.note){const note=document.createElement('p');note.className='caution';note.textContent='Важно: '+step.note;chapter.append(note);}
 const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=completed.has(step.id);check.onchange=()=>{check.checked?completed.add(step.id):completed.delete(step.id);progress();};label.append(check,' Раздел изучен');chapter.append(label);$('guideChapters').append(chapter);
}
progress();
for(const [i,q]of questions.entries()){
 const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=`${i+1}. ${q.q}`;field.append(legend);
 q.options.forEach((text,j)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='q'+i;input.value=String(j);input.required=true;label.append(input,' '+text);field.append(label);});$('quizQuestions').append(field);
}
$('quiz').onsubmit=e=>{e.preventDefault();const answers=questions.map((_,i)=>Number(new FormData(e.target).get('q'+i))),result=grade(answers);
 $('quizResult').replaceChildren();const heading=document.createElement('h3');heading.textContent=`${result.score} из ${result.total} — ${result.passed?'теория пройдена':'повторите отмеченные разделы'}`;$('quizResult').append(heading);
 questions.forEach((q,i)=>{const p=document.createElement('p');p.textContent=`${i+1}. ${result.correct[i]?'Верно.':'Ошибка. Правильный ответ: '+q.options[q.answer]+'.'} ${q.why} `;if(!result.correct[i]){const a=document.createElement('a');a.href='#'+q.lesson;a.textContent='Повторить раздел';p.append(a);}$('quizResult').append(p);});
 $('quizResult').hidden=false;$('quizResult').focus();
};
$('retryQuiz').onclick=()=>{$('quiz').reset();$('quizResult').hidden=true;$('quizQuestions').querySelector('input').focus();};
// Preserve an existing access key only on the two explicit same-origin destinations.
const access=new URLSearchParams(location.search).get('k');if(access)for(const a of document.querySelectorAll('a[data-destination]')){const url=new URL(a.href);if(url.origin===location.origin&&['/app/stroy/dwg/','/app/stroy/plan-fakt/'].includes(url.pathname)){url.searchParams.set('k',access);a.href=url.href;}}
