import {guideSteps} from './onboarding-steps.mjs?v=0.17.39';
const storageKey='pllato_dwg_guide_v1';
export function mountOnboarding(){
 const $=selector=>document.querySelector(selector);let index=0,seen=false;
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');index=Math.max(0,Math.min(guideSteps.length-1,Number.isInteger(saved?.index)?saved.index:0));seen=!!saved?.seen;}catch{}
 const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify({index,seen:true}));}catch{}};
 const entry=document.createElement('button');entry.id='guideButton';entry.textContent='?';entry.title='Как работать: пошаговая инструкция от DWG до готовой исполнительной';entry.setAttribute('aria-label','Как работать');entry.setAttribute('aria-controls','dwgGuide');entry.setAttribute('aria-expanded','false');$('header').append(entry);
 const panel=document.createElement('section');panel.id='dwgGuide';panel.hidden=true;panel.setAttribute('aria-label','Пошаговое обучение DWG');
 panel.innerHTML=`<div class="guideTop"><strong>От плана до исполнительной</strong><button id="guideMinimize" title="Свернуть, чтобы работать на чертеже" aria-label="Свернуть обучение">−</button><button id="guideClose" title="Закрыть обучение" aria-label="Закрыть обучение">×</button></div><div class="guideBody"><label for="guideIndex">Перейти к шагу</label><select id="guideIndex"></select><p id="guideProgress" role="status"></p><h2 id="guideTitle" tabindex="-1"></h2><p id="guideIntro"></p><button id="guideImageButton" title="Увеличить учебный скриншот"><img id="guideImage" alt="" loading="lazy" width="1200" height="760"></button><small>Учебный пример · нажмите скриншот, чтобы увеличить</small><ol id="guideInstructions"></ol><p class="guideResult" id="guideResult"></p><details id="guideNote"><summary>Важно знать</summary><p></p></details><button id="guideAction" class="primary"></button><p id="guideActionStatus" role="status"></p><div class="guideNavigation"><button id="guidePrev">← Предыдущий</button><button id="guideNext">Следующий →</button></div><a href="guide.html" target="_blank" rel="noopener">Вся инструкция со скриншотами · печать</a><small>Шаги переключаются вручную. Обучение не проверяет качество чертежа и не выполняет правки вместо вас.</small></div>`;
 document.body.append(panel);
 const resume=document.createElement('button');resume.id='guideResume';resume.hidden=true;document.body.append(resume);
 const welcome=document.createElement('div');welcome.id='guideWelcome';welcome.hidden=seen;welcome.innerHTML='<strong>Впервые в редакторе?</strong><span>Пройдите путь от DWG до готовой исполнительной.</span><button class="primary">Начать обучение</button><button aria-label="Скрыть приглашение">Позже</button>';document.body.append(welcome);
 const zoom=document.createElement('dialog');zoom.id='guideZoom';zoom.innerHTML='<form method="dialog"><button>Закрыть скриншот</button></form><img alt="">';document.body.append(zoom);
 const select=$('#guideIndex');guideSteps.forEach((step,i)=>select.add(new Option(`${i+1}. ${step.title}`,String(i))));
 let highlighted=null,highlightTimer;
 function clearHighlight(){highlighted?.classList.remove('guideHighlight');highlighted=null;clearTimeout(highlightTimer);}
 function render(){const step=guideSteps[index];select.value=String(index);$('#guideProgress').textContent=`Шаг ${index+1} из ${guideSteps.length}`;$('#guideTitle').textContent=step.title;$('#guideIntro').textContent=step.intro;
  const img=$('#guideImage');img.src=`guide-assets/${step.image}.jpg`;img.alt=`Учебный скриншот: ${step.title}`;
  $('#guideInstructions').replaceChildren(...step.steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));$('#guideResult').textContent='Результат: '+step.result;
  $('#guideNote').hidden=!step.note;$('#guideNote').open=false;$('#guideNote p').textContent=step.note||'';$('#guidePrev').disabled=index===0;$('#guideNext').textContent=index===guideSteps.length-1?'Завершить обучение':'Следующий →';$('#guideAction').textContent=step.action;$('#guideActionStatus').textContent='';resume.textContent=`Обучение · ${index+1}/${guideSteps.length} · продолжить`;
  panel.querySelector('.guideBody').scrollTop=0;clearHighlight();save();
 }
 function open(){welcome.hidden=true;panel.hidden=false;resume.hidden=true;entry.setAttribute('aria-expanded','true');render();$('#guideTitle').focus({preventScroll:true});}
 function close(){panel.hidden=true;resume.hidden=true;welcome.hidden=true;entry.setAttribute('aria-expanded','false');clearHighlight();save();entry.focus({preventScroll:true});}
 function minimize(){panel.hidden=true;resume.hidden=false;entry.setAttribute('aria-expanded','false');$('#canvas').focus({preventScroll:true});}
 entry.onclick=()=>panel.hidden?open():close();resume.onclick=open;$('#guideMinimize').onclick=minimize;$('#guideClose').onclick=close;
 welcome.querySelector('.primary').onclick=open;welcome.querySelector('[aria-label]').onclick=()=>{welcome.hidden=true;save();};
 select.onchange=()=>{index=Number(select.value);render();};$('#guidePrev').onclick=()=>{if(index>0){index--;render();}};$('#guideNext').onclick=()=>{if(index===guideSteps.length-1){close();return;}index++;render();};
 $('#guideImageButton').onclick=()=>{zoom.querySelector('img').src=$('#guideImage').src;zoom.querySelector('img').alt=$('#guideImage').alt;zoom.showModal();};
 // Navigation only: never auto-click delete/export/undo, change values or replace a drawing.
 $('#guideAction').onclick=()=>{if(!$('#busy').hidden){$('#guideActionStatus').textContent='Дождитесь завершения операции или отмените загрузку на чертеже.';return;}
  const step=guideSteps[index],target=$(step.target);if(!target){$('#guideActionStatus').textContent='Инструмент пока недоступен. Выполните предыдущие шаги.';return;}
  document.body.classList.remove('focusWorkspace');const fieldButton=$('#focusWorkspace');fieldButton.textContent='Развернуть поле';fieldButton.setAttribute('aria-pressed','false');
  if(step.id==='open'){$('#file').click();minimize();return;}
  if(target.closest('#sidebar')){$('#sidebar').classList.add('open');$('#panel').setAttribute('aria-expanded','true');}
  for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  if(step.id==='export')target.parentElement.open=true;
  if(step.id==='history'){target.click();minimize();return;}
  if(['create','draw','device'].includes(step.id)&&!target.disabled)target.click();
  clearHighlight();highlighted=target.closest('label.button')||target;highlighted.classList.add('guideHighlight');target.scrollIntoView({block:'nearest',inline:'nearest'});highlightTimer=setTimeout(clearHighlight,8000);
  minimize();if(!target.disabled)target.focus({preventScroll:true});
 };
 // Do not let Delete/Cmd+Z/Escape from tutorial controls edit the document underneath.
 for(const surface of [panel,zoom,welcome,resume])surface.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'&&surface===panel){e.preventDefault();close();}});
}
