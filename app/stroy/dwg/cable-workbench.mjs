import {cableCurve,nearestCablePoint,bendCable} from './cable-edit.mjs?v=0.16.3';
export function mountCableWorkbench(api){
 const panel=document.createElement('section');panel.id='cableWorkbench';panel.innerHTML=`<h2>Кабель / объект</h2><p id="cwLength">Выберите кабель или прибор</p><div class="cwActions"><button id="cwDraw">Кабель · 3 точки</button><button id="cwMove">Перетащить</button><button id="cwShape">Изменить форму</button><button id="cwCopy">Копировать выбранное</button><button id="cwPaste">Вставить копию</button><button id="cwDelete">Удалить</button></div><label>Цвет линии<select id="cwColor"><option value="0">Исходный / по слою</option><option value="7">Белый</option><option value="1">Красный</option><option value="2">Жёлтый</option><option value="3">Зелёный</option><option value="4">Голубой</option><option value="5">Синий</option><option value="6">Фиолетовый</option><option value="8">Серый</option></select></label><button id="cwApplyColor">Применить цвет</button><div id="cwCableFields"></div><button id="cwAssign">Сохранить марку и сечение</button><button id="cwLeader">Поставить выноску</button><p id="cwHelp">Кабель учитывается в ведомости и без выноски. Цвет не меняет его марку.</p>`;
 document.querySelector('#viewport').append(panel);
 panel.setAttribute('aria-label','Действия с выбранной линией');
 const cut=document.createElement('button');cut.id='cwCut';cut.textContent='Вырезать часть';panel.querySelector('.cwActions').append(cut);
 const settings=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Марка, сечение и цвет';settings.append(summary);panel.append(settings);
 for(const id of ['cwColor','cwApplyColor','cwCableFields','cwAssign','cwHelp']){const el=panel.querySelector('#'+id);settings.append(el.closest('label')||el);}
 const $=id=>document.getElementById(id);
 for(const id of ['exBrand','exSection','exExtra'])$('cwCableFields').append($(id).closest('label'));
 for(const id of ['exCable','exAssignSelection','exLeader','exMoveRoute','exRemoveRoute','exRoute','exFinish'])$(id).hidden=true;
 for(const details of document.querySelectorAll('#executiveToolbar>details'))if(details.querySelector('summary').textContent==='Кабель')details.querySelector('summary').textContent='Список кабелей';
 for(const button of document.querySelectorAll('.executiveQuick button'))if(button.textContent!=='Прибор')button.remove();
 let mode='',drag=null,clipboard=false,lastKey='',cutStart=null,anchor=null;
 const safe=fn=>async()=>{if(api.busy())return;try{await fn();api.draw();}catch(e){api.status(e.message);}};
 const movable=()=>{const r=api.route();return r&&!r.sourceIds||api.hasSelection();};
 const handles=r=>r.controls?r.controls.map((_,i)=>i):[...new Set([0,.25,.5,.75,1].map(f=>Math.round(f*(r.points.length-1))))];
 $('cwDraw').onclick=safe(()=>{mode='';api.beginCable();});
 $('cwMove').onclick=safe(()=>{if(!movable())throw Error('Сначала выберите объект');mode='move';api.status('Перетащите выбранный объект на чертеже. Escape — отменить.');});
 $('cwShape').onclick=safe(()=>{let r=api.route();if(!r||r.sourceIds){if(!confirm('Для изменения формы заменить выбранную цепочку линий и дуг редактируемой полилинией? Кривые будут приближены точками. Исходный файл на диске не изменится.'))return;api.convert();r=api.route();}lastKey=r.id;mode='nodes';api.status('Перетаскивайте белые точки кабеля. Длина и ведомость обновятся.');});
 $('cwCopy').onclick=safe(()=>{api.copy();clipboard=true;mode='';api.status('Скопировано. Нажмите «Вставить» и укажите место.');});
 $('cwPaste').onclick=safe(()=>{if(!clipboard)throw Error('Сначала скопируйте объект');mode='paste';api.status('Нажмите место для копии. Исходник останется на месте.');});
 $('cwDelete').onclick=safe(async()=>{if(!movable())throw Error('Сначала выберите объект');await api.remove();mode='';api.status('Удалено. Вернуть объект — «Отменить».');});
 $('cwApplyColor').onclick=safe(()=>api.color(Number($('cwColor').value)));
 $('cwAssign').onclick=safe(()=>{if(api.route())$('exCable').click();else $('exAssignSelection').click();});
 $('cwLeader').onclick=safe(()=>{if(!api.route())throw Error('Сначала назначьте кабелю марку и сечение');$('exLeader').click();mode='';});
 cut.onclick=safe(()=>{let r=api.route();if(!r||r.sourceIds){if(!confirm('Вырезание части требует замены выбранной цепочки на приближённую полилинию. Продолжить?'))return;api.convert();}lastKey=api.route().id;mode='cut';cutStart=null;api.status('Укажите на кабеле начало и конец удаляемой части. Escape — отмена.');});
 function refresh(){const r=api.route(),key=r?.id||api.selectionKey();if(key!==lastKey){mode='';lastKey=key;settings.open=false;$('cwColor').value=String(r?.color||api.colorValue()||0);}
  $('cwLength').textContent=api.length();$('cwPaste').disabled=!clipboard;
  $('cwShape').hidden=!!r&&!r.sourceIds;
  const drawing=api.drawing();panel.hidden=api.busy()||(!drawing&&((!movable()&&mode!=='paste')||!api.selecting()));
  panel.querySelector('.cwActions').hidden=drawing;$('cwLeader').hidden=drawing;$('cwAssign').hidden=drawing;$('cwApplyColor').hidden=drawing;if(drawing)settings.open=true;
  if(!panel.hidden){const viewport=document.querySelector('#viewport'),path=api.paths()[0],point=anchor|| (path?.length?api.screen(path[Math.floor(path.length/2)]):[20,20]);panel.style.left=Math.max(8,Math.min(viewport.clientWidth-panel.offsetWidth-8,point[0]+18))+'px';panel.style.top=Math.max(8,Math.min(viewport.clientHeight-panel.offsetHeight-8,point[1]-panel.offsetHeight-20))+'px';}
 }
 function down(p){if(api.busy())return false;if(mode==='paste'){safe(()=>api.paste(api.world(p)))();mode='';return true;}
  if(!api.selecting())return false;anchor=p;
  if(mode==='cut'){const near=nearestCablePoint(api.paths(),api.world(p));if(!near||Math.hypot(...api.screen(near).map((v,k)=>v-p[k]))>16)return false;if(!cutStart){cutStart=near;api.status('Теперь укажите конец удаляемой части');}else{safe(()=>api.cut(cutStart,near))();cutStart=null;mode='';}return true;}
  const r=api.route();if(r&&!r.sourceIds){const pts=r.controls||r.points;let index=-1;for(const i of handles(r))if(Math.hypot(...api.screen(pts[i]).map((v,k)=>v-p[k]))<12){index=i;break;}if(index>=0){drag={start:api.world(p),end:api.world(p),index,points:structuredClone(pts),bend:!r.controls};return true;}}
  if(movable()){const near=nearestCablePoint(api.paths(),api.world(p));if(!near||Math.hypot(...api.screen(near).map((v,k)=>v-p[k]))>10)return false;drag={start:api.world(p),end:api.world(p)};return true;}return false;
 }
 function move(p){if(!drag)return false;drag.end=api.world(p);api.draw();return true;}
 function up(){if(!drag)return false;const d=drag;drag=null;if(Math.hypot(...api.screen(d.start).map((v,i)=>v-api.screen(d.end)[i]))<3){api.draw();return true;}safe(()=>{if(d.index!==undefined){if(d.bend)d.points=bendCable(d.points,d.index,d.end);else d.points[d.index]=d.end;api.nodes(d.points);}else api.move(d.end.map((v,i)=>v-d.start[i]));})();return true;}
 function paint(ctx){refresh();const r=api.route();ctx.save();ctx.strokeStyle='#ffbe6c';ctx.lineWidth=2;
  if(drag){let paths;if(drag.index!==undefined){const pts=drag.bend?bendCable(drag.points,drag.index,drag.end):structuredClone(drag.points);if(!drag.bend)pts[drag.index]=drag.end;paths=[cableCurve(pts,r?.smooth)];}else paths=api.paths().map(path=>path.map(p=>p.map((v,i)=>v+drag.end[i]-drag.start[i])));for(const path of paths){ctx.beginPath();path.map(api.screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}api.status(api.length(paths));}
  if(api.selecting()&&r&&!r.sourceIds){for(const index of handles(r)){const p=(r.controls||r.points)[index];ctx.beginPath();ctx.arc(...api.screen(p),6,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();}}
  ctx.restore();
 }
 return {down,move,up,paint,cancel:()=>{mode='';drag=null;cutStart=null;anchor=null;},refresh};
}
