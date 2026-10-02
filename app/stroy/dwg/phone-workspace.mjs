// Presentation only. Move existing controls so event handlers and values survive.
export function mountPhoneWorkspace(){
 const media=matchMedia('(max-width:600px), (max-height:500px) and (pointer:coarse)'),nav=document.querySelector('#drawingToolbar>nav'),more=document.querySelector('#moreTools>.moreToolsBody');
 const menu=document.createElement('details');menu.id='phoneTools';menu.innerHTML='<summary>Инструменты</summary><div class="phoneToolsBody"></div>';nav.append(menu);
 const body=menu.lastElementChild,slots=[];
 for(const button of nav.querySelectorAll('button'))if(button.querySelector('svg')&&!button.textContent.trim()){const label=document.createElement('span'),title=button.getAttribute('aria-label')||button.title;label.className='phoneToolName';label.textContent=button.id==='exCreateIcon'?'Исполнительная':({line:'Прямая',poly3:'Ломаная',curve4:'Кривая',select:'Выделить рамкой',device:'Прибор'})[button.dataset.tool]||(/Плавный кабель/.test(title)?'Плавный кабель':/прибор целиком/.test(title)?'Выбрать прибор':title.split('·')[0].slice(0,48));button.append(label);}
 const move=(el,target)=>{if(!el)return;const slot=document.createComment('phone-control');el.before(slot);slots.push([el,slot]);target.append(el);};
 function layout(){
  for(const [el,slot]of slots){slot.replaceWith(el);}slots.length=0;menu.open=false;
  if(!media.matches)return;
  for(const el of [...nav.children])if(el!==menu&&!el.matches('[data-tool="object"]'))move(el,body);
  for(const id of ['historyButton','save'])move(document.getElementById(id),more);
  move(document.querySelector('.notice'),more);
 }
 media.addEventListener('change',layout);layout();
 body.addEventListener('click',e=>{if(e.target.closest('button'))menu.open=false;});
 document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.open=false;});
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.open=false;menu.firstElementChild.focus();e.stopPropagation();}});
 const catalog=document.getElementById('cableNavigator');
 if(catalog){const toggle=document.createElement('button');toggle.type='button';toggle.className='phonePanelToggle';toggle.textContent='Кабели / ведомость';toggle.setAttribute('aria-expanded','false');catalog.classList.add('phoneCollapsed');toggle.onclick=()=>{const collapsed=catalog.classList.toggle('phoneCollapsed');toggle.setAttribute('aria-expanded',String(!collapsed));};catalog.prepend(toggle);}
 // A large automatic properties panel must not cover the selected dimension.
 const panel=document.getElementById('dimensionWorkbench');
 if(panel){const toggle=document.createElement('button');toggle.type='button';toggle.className='phonePanelToggle';toggle.textContent='Параметры отступа';toggle.setAttribute('aria-expanded','false');panel.classList.add('phoneCollapsed');toggle.onclick=()=>{const collapsed=panel.classList.toggle('phoneCollapsed');toggle.setAttribute('aria-expanded',String(!collapsed));};panel.prepend(toggle);}
}
