import {guideSteps} from './onboarding-steps.mjs?v=0.17.33';
document.getElementById('printGuide').onclick=()=>window.print();
for(const [i,step]of guideSteps.entries()){
 const link=document.createElement('a');link.href='#'+step.id;link.textContent=`${i+1}. ${step.title}`;document.getElementById('guideContents').append(link);
 const chapter=document.createElement('section');chapter.id=step.id;
 const title=document.createElement('h2');title.textContent=`${i+1}. ${step.title}`;const intro=document.createElement('p');intro.textContent=step.intro;
 const img=document.createElement('img');img.src=`guide-assets/${step.image}.jpg`;img.alt=`Учебный скриншот: ${step.title}`;img.loading='eager';img.width=1200;img.height=760;
 const list=document.createElement('ol');for(const text of step.steps){const li=document.createElement('li');li.textContent=text;list.append(li);}
 const result=document.createElement('p');result.className='guideResult';result.textContent='Результат: '+step.result;chapter.append(title,intro,img,list,result);
 if(step.note){const note=document.createElement('p');note.className='guideCaution';note.textContent='Важно: '+step.note;chapter.append(note);}document.getElementById('guideChapters').append(chapter);
}
