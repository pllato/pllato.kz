import {cableCurve,nearestCablePoint,bendCable} from './cable-edit.mjs?v=0.15';
export function mountCableWorkbench(api){
 const panel=document.createElement('section');panel.id='cableWorkbench';panel.innerHTML=`<h2>Кабель / объект</h2><p id="cwLength">Выберите кабель или прибор</p><div class="cwActions"><button id="cwDraw">Кабель · 3 точки</button><button id="cwMove">Перетащить</button><button id="cwShape">Изменить форму</button><button id="cwCopy">Копировать выбранное</button><button id="cwPaste">Вставить копию</button><button id="cwDelete">Удалить</button></div><label>Цвет линии<select id="cwColor"><option value="0">Исходный / по слою</option><option value="7">Белый</option><option value="1">Красный</option><option value="2">Жёлтый</option><option value="3">Зелёный</option><option value="4">Голубой</option><option value="5">Синий</option><option value="6">Фиолетовый</option><option value="8">Серый</option></select></label><button id="cwApplyColor">Применить цвет</button><div id="cwCableFields"></div><button id="cwAssign">Сохранить марку и сечение</button><button id="cwLeader">Поставить выноску</button><p id="cwHelp">Кабель учитывается в ведомости и без выноски. Цвет не меняет его марку.</p>`;
 document.querySelector('#sidebar').prepend(panel);
 const $=id=>document.getElementById(id);
 for(const id of ['exBrand','exSection','exExtra'])$('cwCableFields').append($(id).closest('label'));
 let mode='',drag=null,clipboard=false,lastKey='';
 const safe=fn=>async()=>{if(api.busy())return;try{await fn();api.draw();}catch(e){api.status(e.message);}};
 const movable=()=>{const r=api.route();return r&&!r.sourceIds||api.hasSelection();};
 const handles=r=>r.controls?r.controls.map((_,i)=>i):[...new Set([0,.25,.5,.75,1].map(f=>Math.round(f*(r.points.length-1))))];
 $('cwDraw').onclick=safe(()=>{mode='';api.beginCable();});
 $('cwMove').onclick=safe(()=>{if(!movable())throw Error('Сначала выберите объект');mode='move';api.status('Перетащите выбранный объект на чертеже. Escape — отменить.');});
 $('cwShape').onclick=safe(()=>{let r=api.route();if(!r||r.sourceIds){if(!confirm('Для изменения формы заменить выбранную цепочку линий и дуг редактируемой полилинией? Кривые будут приближены точками. Исходный файл на диске не изменится.'))return;api.convert();r=api.route();}lastKey=r.id;mode='nodes';api.status('Перетаскивайте белые точки кабеля. Длина и ведомость обновятся.');});
 $('cwCopy').onclick=safe(()=>{api.copy();clipboard=true;mode='';api.status('Скопировано. Нажмите «Вставить» и укажите место.');});
 $('cwPaste').onclick=safe(()=>{if(!clipboard)throw Error('Сначала скопируйте объект');mode='paste';api.status('Нажмите место для копии. Исходник останется на месте.');});
 $('cwDelete').onclick=safe(async()=>{if(!movable())throw Error('Сначала выберите объект');if(!confirm('Удалить выбранный кабель / объект? Действие можно отменить.'))return;await api.remove();mode='';});
 $('cwApplyColor').onclick=safe(()=>api.color(Number($('cwColor').value)));
 $('cwAssign').onclick=safe(()=>{if(api.route())$('exCable').click();else $('exAssignSelection').click();});
 $('cwLeader').onclick=safe(()=>{if(!api.route())throw Error('Сначала назначьте кабелю марку и сечение');$('exLeader').click();mode='';});
 function refresh(){const r=api.route(),key=r?.id||api.selectionKey();if(key!==lastKey){mode='';lastKey=key;$('cwColor').value=String(r?.color||api.colorValue()||0);}
  $('cwLength').textContent=api.length();$('cwPaste').disabled=!clipboard;
 }
 function down(p){if(api.busy())return false;if(mode==='paste'){safe(()=>api.paste(api.world(p)))();mode='';return true;}
  const r=api.route();if(mode==='nodes'&&r&&!r.sourceIds){const pts=r.controls||r.points;let index=-1;for(const i of handles(r))if(Math.hypot(...api.screen(pts[i]).map((v,k)=>v-p[k]))<12){index=i;break;}if(index<0)return false;drag={start:api.world(p),end:api.world(p),index,points:structuredClone(pts),bend:!r.controls};return true;}
  if(mode==='move'&&movable()){const near=nearestCablePoint(api.paths(),api.world(p));if(!near||Math.hypot(...api.screen(near).map((v,k)=>v-p[k]))>20)return false;drag={start:api.world(p),end:api.world(p)};return true;}return false;
 }
 function move(p){if(!drag)return false;drag.end=api.world(p);api.draw();return true;}
 function up(){if(!drag)return false;const d=drag;drag=null;safe(()=>{if(d.index!==undefined){if(d.bend)d.points=bendCable(d.points,d.index,d.end);else d.points[d.index]=d.end;api.nodes(d.points);}else api.move(d.end.map((v,i)=>v-d.start[i]));})();return true;}
 function paint(ctx){refresh();const r=api.route();ctx.save();ctx.strokeStyle='#ffbe6c';ctx.lineWidth=2;
  if(drag){let paths;if(drag.index!==undefined){const pts=drag.bend?bendCable(drag.points,drag.index,drag.end):structuredClone(drag.points);if(!drag.bend)pts[drag.index]=drag.end;paths=[cableCurve(pts,r?.smooth)];}else paths=api.paths().map(path=>path.map(p=>p.map((v,i)=>v+drag.end[i]-drag.start[i])));for(const path of paths){ctx.beginPath();path.map(api.screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}api.status(api.length(paths));}
  if(mode==='nodes'&&r&&!r.sourceIds){for(const index of handles(r)){const p=(r.controls||r.points)[index];ctx.beginPath();ctx.arc(...api.screen(p),6,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.stroke();}}
  ctx.restore();
 }
 return {down,move,up,paint,cancel:()=>{mode='';drag=null;},refresh};
}
