import {routeDrops,normalizeDrops,dropsTotal} from './cable-drops.mjs?v=0.17.74';
export function mountCableDrops(api){
 const viewport=document.getElementById('viewport'),button=document.createElement('button'),dialog=document.createElement('dialog');
 button.id='cwDrops';button.hidden=true;button.title='Отпуски / спуски кабеля';button.setAttribute('aria-label',button.title);button.textContent='↧+';
 dialog.id='cableDropsDialog';dialog.style.cssText='width:520px;max-width:calc(100vw - 32px);max-height:85vh;overflow:auto;box-sizing:border-box';
 dialog.innerHTML='<h2>Отпуски / спуски</h2><p>Добавляются к длине кабеля в ведомости, не меняя линию на плане.</p><div class="dropRows"></div><button type="button" id="addCableDrop">Добавить спуск</button><p class="dropTotal"></p><p role="alert"></p><div><button type="button" id="cancelCableDrops">Отмена</button> <button type="button" id="saveCableDrops">Сохранить</button></div>';
 viewport.append(button);document.body.append(dialog);const rows=dialog.querySelector('.dropRows'),total=dialog.querySelector('.dropTotal'),error=dialog.querySelector('[role=alert]');let selectedKey='';
 const key=()=>api.selectionKey()||api.route()?.id||'';
 const values=()=>[...rows.children].map(row=>{const input=row.querySelector('input[type=number]');return {name:row.querySelector('input[type=text]').value,metres:input.value.trim()===''?NaN:Number(input.value)};});
 function update(){try{total.textContent='Добавочная длина: '+dropsTotal(values()).toLocaleString('ru-RU')+' м';error.textContent='';}catch(e){error.textContent=e.message;}}
 function add(d={name:'Спуск '+(rows.children.length+1),metres:0}){const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) 100px 40px;gap:8px;margin:8px 0';const name=document.createElement('input'),metres=document.createElement('input'),remove=document.createElement('button');name.type='text';name.maxLength=200;name.setAttribute('aria-label','Название спуска');name.value=d.name;metres.type='number';metres.min=0;metres.step='any';metres.setAttribute('aria-label','Длина спуска, м');metres.value=d.metres;remove.textContent='×';remove.setAttribute('aria-label','Удалить спуск');remove.onclick=()=>{row.remove();update();};row.append(name,metres,remove);rows.append(row);row.oninput=update;update();}
 button.onclick=()=>{if(api.busy()||!api.selecting())return;selectedKey=key();rows.replaceChildren();routeDrops(api.route()).forEach(add);update();dialog.showModal();};
 dialog.querySelector('#addCableDrop').onclick=()=>add();dialog.querySelector('#cancelCableDrops').onclick=()=>dialog.close();
 dialog.querySelector('#saveCableDrops').onclick=()=>{try{if(selectedKey!==key()||api.busy())throw Error('Выбор кабеля изменился — откройте меню заново');api.setDrops(normalizeDrops(values()));dialog.close();api.draw();}catch(e){error.textContent=e.message;}};
 dialog.addEventListener('keydown',e=>e.stopPropagation());
 return {refresh(cap,drag,anchor){button.hidden=!!drag||!api.selecting()||!cap.leader||api.isDevice();button.disabled=api.busy();button.style.left=Math.max(8,Math.min(viewport.clientWidth-40,anchor.x))+'px';button.style.top=anchor.y+'px';}};
}
