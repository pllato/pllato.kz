import {cableCurve,nearestCablePoint,bendCable} from './cable-edit.mjs?v=0.17.61';
import {mountCableNavigator} from './cable-navigator.mjs?v=0.17.61';
import {mountDrawingPresets} from './drawing-presets.mjs?v=0.17.61';
import {mountCableValues} from './cable-values.mjs?v=0.17.61';
import {rotationFrame,rotationDelta,rotatedPoint} from './rotation-handle.mjs?v=0.17.61';
export function mountCableWorkbench(api){
 const panel=document.createElement('section');panel.id='cableWorkbench';panel.innerHTML=`<h2>Кабель / объект</h2><p id="cwLength">Выберите кабель или прибор</p><div class="cwActions"><button id="cwDraw">Кабель · 4 точки</button><button id="cwMove">Перетащить</button><button id="cwShape">Изменить форму</button><button id="cwCopy">Копировать выбранное</button><button id="cwPaste">Вставить копию</button><button id="cwDelete">Удалить</button></div><label>Цвет линии<select id="cwColor"><option value="0">Исходный / по слою</option><option value="7">Белый</option><option value="1">Красный</option><option value="2">Жёлтый</option><option value="3">Зелёный</option><option value="4">Голубой</option><option value="5">Синий</option><option value="6">Фиолетовый</option><option value="8">Серый</option></select></label><button id="cwApplyColor">Применить цвет</button><div id="cwCableFields"></div><button id="cwAssign">Сохранить марку и сечение</button><button id="cwLeader">Поставить выноску</button><p id="cwHelp">Кабель учитывается в ведомости и без выноски. Цвет не меняет его марку.</p>`;
 const nav=document.querySelector('nav'),toolbar=document.createElement('div');toolbar.id='drawingToolbar';nav.before(toolbar);toolbar.append(panel,nav);
 panel.setAttribute('aria-label','Действия с выбранной линией');
 const cut=document.createElement('button');cut.id='cwCut';cut.textContent='Вырезать часть';panel.querySelector('.cwActions').append(cut);
 const settings=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Марка, сечение и цвет';settings.append(summary);panel.append(settings);
 for(const id of ['cwColor','cwApplyColor','cwCableFields','cwAssign','cwHelp']){const el=panel.querySelector('#'+id);settings.append(el.closest('label')||el);}
 const settingsBody=document.createElement('div');settingsBody.className='cwSettingsBody';for(const el of [...settings.children])if(el!==summary)settingsBody.append(el);settings.append(settingsBody);
 const $=id=>document.getElementById(id);
 const icon=(id,label,paths)=>{const button=$(id);button.title=label;button.setAttribute('aria-label',label);button.innerHTML=`<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;};
 icon('cwMove','Перетащить объект','<path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4"/>');
 icon('cwCopy','Дублировать и разместить копию','<rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V4H4v12h4"/>');
 icon('cwDelete','Удалить · Delete','<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>');
 const quickDelete=document.createElement('button');quickDelete.id='cwQuickDelete';quickDelete.title='Удалить выбранный объект';quickDelete.setAttribute('aria-label','Удалить выбранный объект');quickDelete.innerHTML=$('cwDelete').innerHTML;quickDelete.hidden=true;document.querySelector('#viewport').append(quickDelete);let deletePress=null;quickDelete.onpointerdown=e=>{deletePress=[e.clientX,e.clientY];};quickDelete.onclick=e=>{if(!deletePress||Math.hypot(e.clientX-deletePress[0],e.clientY-deletePress[1])<4)$('cwDelete').click();deletePress=null;};
 const quickCopy=document.createElement('button');quickCopy.id='cwQuickCopy';quickCopy.title='Копировать · сразу создать дубликат рядом';quickCopy.setAttribute('aria-label',quickCopy.title);quickCopy.innerHTML=$('cwCopy').innerHTML;quickCopy.hidden=true;quickDelete.after(quickCopy);
 icon('cwCut','Вырезать часть между двумя точками','<circle cx="5" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><path d="M8 8l12 12M8 16L20 4"/>');
 const refine=document.createElement('button');refine.id='cwRefine';panel.querySelector('.cwActions').append(refine);
 icon('cwRefine','Добавить / убрать участок из выделения · Shift + клик','<path stroke-dasharray="3 3" d="M3 3h14v14H3z"/><path d="M13 20h9M20 3v8m-4-4h8"/>');
 refine.onclick=()=>{lastKey=api.route()?.id||api.selectionKey();mode=mode==='refine'?'':'refine';api.status(mode?'Клик по невыбранному участку добавляет его, по выбранному — исключает. Геометрия не удаляется. Для редактирования выключите «Добавить / убрать участок».':'Уточнение выключено. Можно редактировать выбранные участки.');refresh();api.draw();};
 icon('cwLeader','Выноска · укажите точку на выбранном кабеле','<path d="M3 20l8-9h10M3 15v5h5M13 4h8M13 7h5"/>');
 panel.querySelector('.cwActions').append($('cwLeader'));
 summary.textContent='';summary.title='Марка, сечение и цвет';summary.setAttribute('aria-label','Марка, сечение и цвет');summary.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="19" r="2"/></svg>';
 for(const id of ['exBrand','exSection','exExtra'])$('cwCableFields').append($(id).closest('label'));
 $('exExtra').closest('label').firstChild.textContent='Выпуски / отпуски, м';
 for(const id of ['exCable','exAssignSelection','exLeader','exMoveRoute','exRemoveRoute','exRoute','exFinish'])$(id).hidden=true;
 for(const details of document.querySelectorAll('#executiveToolbar>details'))if(details.querySelector('summary').textContent==='Кабель')details.querySelector('summary').textContent='Список кабелей';
 for(const button of document.querySelectorAll('.executiveQuick button'))if(button.textContent!=='Прибор')button.remove();
 let mode='',drag=null,clipboard=false,lastKey='',cutStart=null,anchor=null,anchorWorld=null;
 summary.addEventListener('click',e=>{if(summary.getAttribute('aria-disabled')==='true')e.preventDefault();});
 const safe=fn=>async()=>{if(api.busy())return;try{await fn();api.draw();}catch(e){api.status(e.message);}};
 let duplicating=false;
 quickCopy.onclick=safe(async()=>{if(duplicating)return;duplicating=true;try{const r=api.route(),pts=api.paths().flat();if(!pts.length)throw Error('Выберите кабель или прибор');const origin=r&&!r.sourceIds?r.points[0]:[0,1].map(k=>pts.reduce((n,p)=>n+p[k],0)/pts.length),p=api.screen(origin);api.copy();await api.paste(api.world([p[0]+32,p[1]+32]),true);mode='';anchor=null;anchorWorld=null;}finally{duplicating=false;}});
 const movable=()=>{const r=api.route();return r&&!r.sourceIds||api.hasSelection();};
 const handles=r=>r.controls?r.controls.map((_,i)=>i):[...new Set([0,.25,.5,.75,1].map(f=>Math.round(f*(r.points.length-1))))];
 $('cwDraw').onclick=safe(()=>{mode='';api.beginCable();});
 $('cwMove').onclick=safe(()=>{if(!movable())throw Error('Сначала выберите объект');mode='move';api.status('Нажмите новое место объекта. Можно также тянуть саму линию без кнопки. Escape — отменить.');});
 $('cwShape').onclick=safe(()=>{let r=api.route();if(!r||r.sourceIds){if(!confirm('Для изменения формы заменить выбранную цепочку линий и дуг редактируемой полилинией? Кривые будут приближены точками. Исходный файл на диске не изменится.'))return;api.convert();r=api.route();}lastKey=r.id;mode='nodes';api.status('Перетаскивайте белые точки кабеля. Длина и ведомость обновятся.');});
 $('cwCopy').onclick=safe(()=>{api.copy();clipboard=true;mode='paste';api.status('Укажите место копии. Escape — отменить.');});
 $('cwPaste').onclick=safe(()=>{if(!clipboard)throw Error('Сначала скопируйте объект');mode='paste';api.status('Нажмите место для копии. Исходник останется на месте.');});
 $('cwDelete').onclick=safe(async()=>{if(!movable())throw Error('Сначала выберите объект');await api.remove();mode='';api.status('Удалено. Вернуть объект — «Отменить».');});
 $('cwApplyColor').onclick=safe(()=>api.color(Number($('cwColor').value)));
 $('cwAssign').onclick=safe(()=>{if(api.route())$('exCable').click();else $('exAssignSelection').click();});
 for(const id of ['exBrand','exSection','exExtra'])$(id).addEventListener('change',()=>{if(api.route()&&!api.busy())$('exCable').click();});
 $('cwLeader').onclick=safe(()=>{lastKey=api.route()?.id||api.selectionKey();mode='leader-anchor';settings.open=false;api.status('Нажмите на выбранном кабеле точку начала выноски. Escape — отмена.');});
 cut.onclick=safe(()=>{let r=api.route();if(!r||r.sourceIds){if(!confirm('Вырезание части требует замены выбранной цепочки на приближённую полилинию. Продолжить?'))return;api.convert();}lastKey=api.route().id;mode='cut';cutStart=null;api.status('Укажите на кабеле начало и конец удаляемой части. Escape — отмена.');});
 const navigator=mountCableNavigator(api);
 const quickValues=mountCableValues(api);
 const presets=mountDrawingPresets(api.draw);
 function refresh(){navigator.refresh();const r=api.route(),key=r?.id||api.selectionKey();if(key!==lastKey){mode='';lastKey=key;settings.open=false;$('cwColor').value=String(r?.color||api.colorValue()||0);}
  const drawing=api.drawing(),enabled=!api.busy()&&api.selecting(),cap=enabled?api.capabilities():{};presets.refresh(drawing,!!api.sheetId(),api.shapes());
  refine.disabled=!enabled||!api.canRefine();refine.setAttribute('aria-pressed',String(mode==='refine'));
  $('cwLength').textContent=enabled?api.length():'Выберите кабель или прибор';$('cwLength').title=$('cwLength').textContent;$('cwPaste').disabled=api.busy()||!clipboard;
  panel.hidden=false;panel.querySelector('.cwActions').hidden=false;$('cwLeader').hidden=false;
  for(const [id,key] of [['cwMove','move'],['cwCopy','copy'],['cwDelete','remove'],['cwCut','cut'],['cwLeader','leader'],['cwApplyColor','color'],['cwAssign','leader']])$(id).disabled=!cap[key];
  const configurable=!api.busy()&&!drawing&&(cap.color||cap.leader);summary.setAttribute('aria-disabled',String(!configurable));summary.tabIndex=configurable?0:-1;if(!configurable)settings.open=false;
  quickDelete.hidden=!cap.remove||!!drag;quickDelete.disabled=!cap.remove;
  quickCopy.hidden=!cap.copy||!!drag;quickCopy.disabled=!cap.copy||duplicating;
  if(!quickDelete.hidden||!quickCopy.hidden){const viewport=document.querySelector('#viewport'),path=api.paths()[0],point=(anchorWorld?api.screen(anchorWorld):anchor)||(path?.length?api.screen(path[Math.floor(path.length/2)]):[20,20]);quickDelete.style.left=Math.max(8,Math.min(viewport.clientWidth-112,point[0]-44))+'px';quickDelete.style.top=Math.max(8,Math.min(viewport.clientHeight-40,point[1]-44))+'px';quickCopy.style.left=(parseFloat(quickDelete.style.left)+36)+'px';quickCopy.style.top=quickDelete.style.top;}
  quickValues.refresh(cap,drag,{x:parseFloat(quickDelete.style.left)+72,y:parseFloat(quickDelete.style.top)});
 }
 function down(p){if(api.busy())return false;if(mode==='leader-anchor'){const near=nearestCablePoint(api.paths(),api.world(p));if(!near||Math.hypot(...api.screen(near).map((v,i)=>v-p[i]))>14){api.status('Нажмите именно на выбранный кабель. Escape — отмена.');return true;}const q=api.screen(near);safe(()=>{api.leaderAt(near,api.world([q[0]+35,q[1]-35]),api.world([q[0]+100,q[1]-35]));mode='';lastKey=api.route()?.id||api.selectionKey();settings.open=true;})();return true;}if(mode==='refine'){api.refine(p);lastKey=api.selectionKey();mode='refine';refresh();api.draw();return true;}if(mode==='paste'){safe(()=>api.paste(api.world(p)))();mode='';return true;}
  if(mode==='move'){const origin=anchorWorld||api.paths()[0]?.[0];if(origin)safe(()=>api.move(api.world(p).map((v,i)=>v-origin[i])))();mode='';return true;}
  if(!api.selecting())return false;
  const rotation=rotationHandle();if(rotation&&Math.hypot(p[0]-rotation.point[0],p[1]-rotation.point[1])<14){drag={start:api.world(p),end:api.world(p),rotation};return true;}
  anchor=p;anchorWorld=api.world(p);
  if(mode==='cut'){const near=nearestCablePoint(api.paths(),api.world(p));if(!near||Math.hypot(...api.screen(near).map((v,k)=>v-p[k]))>16)return false;if(!cutStart){cutStart=near;api.status('Теперь укажите конец удаляемой части');}else{safe(()=>api.cut(cutStart,near))();cutStart=null;mode='';}return true;}
  const r=api.route();for(const leader of r?.leaders||[])for(const key of ['label','elbow'])if(Math.hypot(...api.screen(leader[key]).map((v,k)=>v-p[k]))<10){drag={start:api.world(p),end:api.world(p),leader:structuredClone(leader),key};return true;}
  if(r&&!r.sourceIds){const pts=r.controls||r.points;let index=-1;for(const i of handles(r))if(Math.hypot(...api.screen(pts[i]).map((v,k)=>v-p[k]))<12){index=i;break;}if(index>=0){drag={start:api.world(p),end:api.world(p),index,points:structuredClone(pts),bend:!r.controls};return true;}}
  for(const h of api.nativeHandles())if(Math.hypot(...api.screen(h.point).map((v,k)=>v-p[k]))<10){drag={start:api.world(p),end:api.world(p),native:h};return true;}
  if(movable()){const near=nearestCablePoint(api.paths(),api.world(p));if(!near||Math.hypot(...api.screen(near).map((v,k)=>v-p[k]))>10)return false;drag={start:api.world(p),end:api.world(p)};return true;}return false;
 }
 function rotationHandle(){
  if(api.busy()||!api.selecting()||mode||!api.capabilities().rotate)return null;
  const info=api.rotation(),frame=info&&rotationFrame(info.pivot,info.matrix);if(!frame)return null;
  const points=api.paths().flat().map(api.screen),centre=api.screen(frame.world);if(!points.length)return null;
  const top=points.reduce((v,p)=>Math.min(v,p[1]),centre[1]);
  return {frame,centre,point:[centre[0],top-30]};
 }
 function move(p){if(!drag)return false;drag.end=api.world(p);api.draw();return true;}
 function up(){if(!drag)return false;const d=drag;drag=null;if(Math.hypot(...api.screen(d.start).map((v,i)=>v-api.screen(d.end)[i]))<3){api.draw();return true;}safe(()=>{if(d.rotation)api.rotate(rotationDelta(d.rotation.frame,d.start,d.end));else if(d.leader)api.leaderNode(d.leader.id,d.key,d.end);else if(d.native)api.nativeNode(d.native,d.end);else if(d.index!==undefined){if(d.bend)d.points=bendCable(d.points,d.index,d.end);else d.points[d.index]=d.end;api.nodes(d.points);}else api.move(d.end.map((v,i)=>v-d.start[i]));})();return true;}
 function paint(ctx){refresh();const r=api.route();ctx.save();ctx.strokeStyle='#ffbe6c';ctx.lineWidth=2;
  if(r&&!api.hasSelection())for(const path of api.paths()){ctx.beginPath();path.map(api.screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
  if(drag){let paths;if(drag.rotation)paths=api.paths().map(path=>path.map(p=>rotatedPoint(drag.rotation.frame,p,rotationDelta(drag.rotation.frame,drag.start,drag.end))));else if(drag.leader)paths=[['anchor','elbow','label'].map(k=>k===drag.key?drag.end:drag.leader[k])];else if(drag.native)paths=[api.nativePreview(drag.native,drag.end)];else if(drag.index!==undefined){const pts=drag.bend?bendCable(drag.points,drag.index,drag.end):structuredClone(drag.points);if(!drag.bend)pts[drag.index]=drag.end;paths=[cableCurve(pts,r?.smooth)];}else paths=api.paths().map(path=>path.map(p=>p.map((v,i)=>v+drag.end[i]-drag.start[i])));for(const path of paths){ctx.beginPath();path.map(api.screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}if(drag.rotation)api.status('Поворот: '+rotationDelta(drag.rotation.frame,drag.start,drag.end).toFixed(1)+'° · Escape — отменить');else if(!drag.leader)api.status(api.length(paths));}
  if(api.selecting())for(const l of r?.leaders||[])for(const key of ['elbow','label']){const p=drag?.leader?.id===l.id&&drag.key===key?drag.end:l[key];ctx.fillStyle='#9edcff';const q=api.screen(p);ctx.fillRect(q[0]-4,q[1]-4,8,8);}
  if(api.selecting()&&r&&!r.sourceIds){for(const index of handles(r)){const p=(r.controls||r.points)[index];ctx.beginPath();ctx.arc(...api.screen(p),6,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();}}
  if(api.selecting())for(const h of api.nativeHandles()){ctx.beginPath();ctx.arc(...api.screen(drag?.native?.id===h.id&&drag.native.index===h.index?drag.end:h.point),4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();}
  const rotation=drag?.rotation||rotationHandle();if(rotation){const point=drag?.rotation?api.screen(drag.end):rotation.point;ctx.strokeStyle='#2786b8';ctx.beginPath();ctx.moveTo(...rotation.centre);ctx.lineTo(...point);ctx.stroke();ctx.beginPath();ctx.arc(...point,7,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();ctx.font='12px sans-serif';ctx.fillStyle='#14547a';ctx.fillText('Поворот',point[0]+12,point[1]+4);}
  ctx.restore();
 }
 return {down,move,up,paint,exclusive:()=>['paste','move','cut','refine','leader-anchor'].includes(mode),cancel:()=>{mode='';drag=null;cutStart=null;anchor=null;anchorWorld=null;},refresh};
}
