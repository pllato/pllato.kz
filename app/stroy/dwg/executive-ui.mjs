import {fromRecords,addEntity,get} from './cad.mjs?v=0.15';
import * as projectAPI from './executive-project.mjs?v=0.15';
import {routeLength} from './cable-ledger.mjs?v=0.15';
import {selectExecutiveRoots} from './executive-selection.mjs?v=0.15';
import {executivePlacement} from './executive-placement.mjs?v=0.15';
import {cableCurve,nearestCablePoint} from './cable-edit.mjs?v=0.15';
export function mountExecutiveUI(api){
 const panel=document.createElement('section');panel.id='executives';
 panel.innerHTML=`<h2>Исполнительные</h2><button id="exArea">Выделить план · 2 угла</button><p id="exAreaInfo">Откройте DWG, выберите единицы и выделите план.</p><button id="exCreate" disabled>Создать рядом</button><label>Исполнительная<select id="exSheet"></select></label><label>Заголовок<input id="exTitle" maxlength="1000"></label><label>Поворот плана, °<input id="exAngle" type="number" value="0"></label><details><summary>Редактировать штамп</summary><div id="exStamp"></div></details><button id="exApply">Применить оформление</button><h3>Кабельные трассы</h3><label>Марка<input id="exBrand" value="ВВГнг(А)-LS"></label><label>Сечение<input id="exSection" value="3×2,5"></label><label>Дополнительная длина, м<input id="exExtra" type="number" min="0" value="0" step="any"></label><button id="exRoute">Рисовать трассу</button><button id="exFinish">Завершить трассу</button><label>Трасса<select id="exRouteList"></select></label><button id="exCable">Назначить кабель</button><button id="exLeader">Выноска · 3 точки</button><button id="exRemoveLeader">Удалить выноски</button><button id="exRemoveRoute">Удалить трассу</button><div class="pair"><label>Сдвиг X<input id="exDX" type="number" value="0"></label><label>Сдвиг Y<input id="exDY" type="number" value="0"></label></div><button id="exMoveRoute">Двигать трассу</button><button id="exDevice">Выбрать прибор</button><pre id="exLedger" style="white-space:pre-wrap;font-size:12px"></pre>`;
 document.querySelector('#sidebar').prepend(panel);
 const advanced=document.createElement('div');advanced.innerHTML=`<label>Отдельная выноска<select id="exLeaderList"></select></label><button id="exMoveLeader">Сдвинуть подпись · X/Y выше</button><button id="exDeleteLeader">Удалить выбранную выноску</button><label>Известная длина, м<input id="exKnownMetres" type="number" min="0" step="any" value="1"></label><button id="exCalibrate">Калибровать · 2 точки</button>`;panel.append(advanced);
 const $=id=>document.getElementById(id),stampLabels={project:'Проект',object:'Объект',drawing:'Название схемы',contractor:'Исполнитель',date:'Дата',sheet:'Лист',sheets:'Листов'};
 const showSheet=document.createElement('button');showSheet.id='exShow';showSheet.textContent='Показать исполнительную';$('exSheet').parentElement.after(showSheet);
 const operationError=document.createElement('p');operationError.id='exError';operationError.setAttribute('role','alert');operationError.hidden=true;operationError.style.cssText='color:#ffc38a;overflow-wrap:anywhere';$('exCreate').after(operationError);
 for(const [key,label] of Object.entries(stampLabels)){const l=document.createElement('label');l.textContent=label;const i=document.createElement('input');i.id='exStamp_'+key;i.maxLength=1000;l.append(i);$('exStamp').append(l);}
 let active='',chosen=[],area=null,points=[],mode='',routeId='',selectionSource=null,hoverPoint=null;
 const project=()=>api.getDoc().executiveProject||projectAPI.createExecutiveProject();
 const sheet=()=>project().sheets.find(s=>s.id===active);
 const showCanvas=()=>{if(matchMedia('(max-width:850px)').matches)$('sidebar').classList.remove('open');for(const group of document.querySelectorAll('#executiveToolbar>details'))group.open=false;};
 let acting=false;
 const guard=fn=>async()=>{if(api.busy()||acting)return;acting=true;try{await fn();if(mode)showCanvas();}catch(e){api.status(e.message);}finally{acting=false;}};
 function mutate(fn,geometry=false,afterSnapshot=()=>{}){const next=projectAPI.executiveTransaction(project(),fn);for(const s of next.sheets)projectAPI.executiveEntities(next,s.id);api.snapshot();afterSnapshot();api.getDoc().executiveProject=next;api.changed(geometry?'geometry':'decoration');}
 function refresh(){
  if(selectionSource&&selectionSource!==api.getDoc().sourceFile){chosen=[];area=null;points=[];mode='';selectionSource=null;$('exCreate').disabled=true;operationError.hidden=true;$('exAreaInfo').textContent='Выделите план в текущем DWG.';}
  const p=project(),s=p.sheets.find(s=>s.id===active)||p.sheets[0];active=s?.id||'';
  $('exSheet').replaceChildren(...p.sheets.map(s=>new Option(s.title||s.id,s.id)));$('exSheet').value=active;showSheet.disabled=!s;
  $('exTitle').value=s?.title||'';$('exAngle').value=((s?.angle||0)*180/Math.PI).toFixed(3);
  for(const key of Object.keys(stampLabels))$('exStamp_'+key).value=s?.stamp[key]||'';
  $('exRouteList').replaceChildren(...(s?.routes||[]).map(r=>new Option(`${r.brand||'?'} ${r.section||'?'} · ${((r.paths?r.paths.reduce((n,p)=>n+routeLength(p,r.metresPerUnit),0):routeLength(r.points,r.metresPerUnit))+r.extraMetres).toFixed(2)} м`,r.id)));
  if(!s?.routes.some(r=>r.id===routeId))routeId='';$('exRouteList').value=routeId;
  refreshLeaders();
  const ledger=projectAPI.executiveLedger(p,active),all=projectAPI.executiveLedger(p);
  $('exLedger').textContent=s?'Этот лист:\n'+ledger.rows.map(r=>`${r.brand} ${r.section}: ${r.length.toFixed(2)} м`).join('\n')+`\nБез выносок: ${ledger.withoutLeaders.length}\nБез марки/сечения: ${ledger.unassigned.length}\nВсего по проекту: ${all.rows.reduce((n,r)=>n+r.length,0).toFixed(2)} м`:'';
 }
 function refreshLeaders(){const previous=$('exLeaderList').value,r=sheet()?.routes.find(r=>r.id===routeId);$('exLeaderList').replaceChildren(...(r?.leaders||[]).map((l,i)=>new Option('Выноска '+(i+1),l.id)));if(r?.leaders.some(l=>l.id===previous))$('exLeaderList').value=previous;}
 function rebuild(){
  const doc=api.getDoc(),p=doc.executiveProject;if(!p){refresh();return;}
  const removed=new Set(p.generatedHandles||[]),records=doc.records.filter(r=>!r.id.startsWith('executive-')&&!removed.has(get(r,5)));
  const mini=fromRecords([{id:'section',type:'SECTION',pairs:[[2,'ENTITIES']]},{id:'end',type:'ENDSEC',pairs:[]}]);let i=0;
  for(const s of p.sheets)for(const item of projectAPI.executiveEntities(p,s.id).items){let pairs;
   if(item.type==='LINE')pairs=[[10,item.values[0]],[20,item.values[1]],[11,item.values[2]],[21,item.values[3]]];
   else if(item.type==='TEXT')pairs=[[10,item.values[0]],[20,item.values[1]],[40,item.values[2]],[50,item.values[3]*180/Math.PI],[1,item.text]];
   else pairs=[[90,item.points.length/2],[70,item.closed?1:0],...item.points.flatMap((n,j)=>[[j%2?20:10,n]])];
   if(item.color)pairs.push([62,item.color]);const r=addEntity(mini,item.type,pairs);r.id='executive-'+i++;if(item.routeId)r.routeId=item.routeId;
  }
  const entities=doc.entities.filter(r=>!r.id.startsWith('executive-')&&!removed.has(get(r,5)));
  api.setDoc({...doc,records:[...records,...mini.entities],entities:[...entities,...mini.entities]});refresh();
 }
 $('exArea').onclick=guard(()=>{if(!api.getDoc().native)throw Error('Исполнительные: откройте исходный DWG');points=[];mode='area';api.setTool('executive');api.status('Укажите два противоположных угла вокруг плана. Объекты на границе не включаются.');});
 $('exCreate').onclick=guard(async()=>{
  if(!chosen.length||!area||selectionSource!==api.getDoc().sourceFile)throw Error('Сначала выделите план в текущем DWG');const metres=api.metresPerUnit();if(!metres)throw Error('Выберите миллиметры, сантиметры или метры справа');
  const p=structuredClone(project()),{unit,origin,centre,position}=executivePlacement(api.shapes(),chosen.map(h=>'dwg-'+h));
  const id=crypto.randomUUID();projectAPI.createExecutive(p,{id,title:'Исполнительная схема '+(p.sheets.length+1),origin,planCentre:position,metresPerUnit:metres,paperUnit:unit});
  operationError.hidden=true;operationError.textContent='';
  const previous=active;active=id;const created=await api.commit(p,{sheetId:id,handles:chosen,centre,position});
  if(!created){active=previous;operationError.textContent=api.lastStatus();operationError.hidden=false;return;}
  chosen=[];area=null;$('exCreate').disabled=true;mode='';$('exAreaInfo').textContent='Исполнительная создана на свободном месте справа от всех чертежей и показана на экране.';
 });
 showSheet.onclick=guard(()=>{api.focus(sheet());showCanvas();});
 function cableFields(){const r=sheet()?.routes.find(r=>r.id===routeId);if(r){$('exBrand').value=r.brand;$('exSection').value=r.section;$('exExtra').value=r.extraMetres;}refreshLeaders();}
 $('exSheet').onchange=()=>{active=$('exSheet').value;refresh();api.focus(sheet());};$('exRouteList').onchange=()=>{routeId=$('exRouteList').value;api.setTool('object');cableFields();};
 $('exMoveLeader').onclick=guard(()=>{const id=$('exLeaderList').value;mutate(p=>projectAPI.moveLeader(p,active,id,[Number($('exDX').value),Number($('exDY').value)]));});
 $('exDeleteLeader').onclick=guard(()=>{const id=$('exLeaderList').value;mutate(p=>projectAPI.removeLeader(p,active,id));});
 $('exCalibrate').onclick=guard(()=>{if(!sheet())throw Error('Создайте исполнительную');const metres=Number($('exKnownMetres').value);if(!Number.isFinite(metres)||metres<=0)throw Error('Укажите известную длину в метрах');mode='calibrate';points=[];api.setTool('executive');api.status('Укажите концы известного отрезка. Метраж этого листа будет пересчитан; геометрия останется на месте.');});
 $('exApply').onclick=guard(async()=>{if(!sheet())throw Error('Создайте исполнительную');const title=$('exTitle').value,angle=Number($('exAngle').value)*Math.PI/180,rotated=Math.abs(angle-sheet().angle)>1e-8,stamp=Object.fromEntries(Object.keys(stampLabels).map(k=>[k,$('exStamp_'+k).value]));if(!Number.isFinite(angle))throw Error('Введите числовой угол');await api.checkpoint('Перед поворотом / оформлением');mutate(p=>{if(rotated)projectAPI.rotateExecutive(p,active,angle);const s=p.sheets.find(s=>s.id===active);s.title=title;s.stamp=stamp;},rotated);if(rotated)api.previewRotation(sheet());});
 $('exRoute').onclick=guard(()=>{if(!sheet())throw Error('Создайте исполнительную');mode='route';points=[];api.setTool('executive');api.status('Укажите точки трассы; затем нажмите «Завершить трассу».');});
 $('exFinish').onclick=guard(()=>{if(mode!=='route'||points.length<2)throw Error('Нужно минимум две точки');const id=crypto.randomUUID(),routePoints=points.map(p=>[...p]);mutate(p=>projectAPI.addRoute(p,active,{id,points:routePoints,brand:$('exBrand').value,section:$('exSection').value,extraMetres:Number($('exExtra').value)}));routeId=id;mode='';points=[];api.setTool('select');refresh();});
 $('exCable').onclick=guard(()=>mutate(p=>projectAPI.setCable(p,active,routeId,{brand:$('exBrand').value,section:$('exSection').value,extraMetres:Number($('exExtra').value)})));
 $('exLeader').onclick=guard(()=>{if(!routeId)throw Error('Выберите трассу');mode='leader';points=[];api.setTool('executive');api.status('Укажите точку привязки, изгиб и положение подписи.');});
 $('exRemoveLeader').onclick=guard(()=>mutate(p=>{const s=p.sheets.find(s=>s.id===active),r=s?.routes.find(r=>r.id===routeId);if(!r)throw Error('Выберите трассу');for(const l of [...r.leaders])projectAPI.removeLeader(p,active,l.id);}));
 $('exRemoveRoute').onclick=guard(()=>mutate(p=>projectAPI.removeRoute(p,active,routeId)));
 $('exMoveRoute').onclick=guard(()=>mutate(p=>projectAPI.moveRoute(p,active,routeId,[Number($('exDX').value),Number($('exDY').value)])));
 $('exDevice').onclick=()=>{if(api.busy())return;api.setTool('device');showCanvas();api.status('Нажмите на прибор внутри исполнительной. Сдвиг задаётся в свойствах объекта.');};
 function tap(w){
  if(mode==='leader'&&!points.length){const r=sheet()?.routes.find(r=>r.id===routeId);w=nearestCablePoint(r?.paths||[r?.points||[]],w)||w;}
  points.push(w);
  if(mode==='area'&&points.length===2){
   area=[Math.min(points[0][0],w[0]),Math.min(points[0][1],w[1]),Math.max(points[0][0],w[0]),Math.max(points[0][1],w[1])];
   chosen=selectExecutiveRoots(api.getDoc(),api.shapes(),area);selectionSource=api.getDoc().sourceFile;
   $('exAreaInfo').textContent=`Выбрано объектов: ${chosen.length}. Исходник останется на месте.`;$('exCreate').disabled=!chosen.length;points=[];mode='';api.setTool('select');
  }else if(mode==='calibrate'&&points.length===2){try{mutate(p=>projectAPI.calibrateExecutive(p,active,points[0],points[1],Number($('exKnownMetres').value)));api.status('Масштаб метража обновлён для всех трасс этого листа.');}catch(e){api.status(e.message);}points=[];mode='';api.setTool('select');}
  else if(mode==='route3'&&points.length===3){createCable(points,true);points=[];mode='';api.setTool('object');}
  else if((mode==='route'||mode==='route3')&&points.length>1)api.status('Длина трассы: '+routeLength(cableCurve(points,mode==='route3'),sheet().metresPerUnit).toFixed(3)+' м · точек '+points.length);
  else if(mode==='leader'&&points.length===3){const [anchor,elbow,label]=points;mutate(p=>projectAPI.addLeader(p,active,routeId,{id:crypto.randomUUID(),anchor,elbow,label}));points=[];mode='';api.setTool('select');}
  api.draw();
 }
 function hover(w){hoverPoint=w;if(['route','route3'].includes(mode)&&points.length&&sheet())api.status('Длина трассы: '+routeLength(cableCurve([...points,w],mode==='route3'),sheet().metresPerUnit).toFixed(3)+' м');api.draw();}
 // Действия наверху, параметры — в раскрывающихся группах, без длинной ленты кнопок справа.
 const toolbar=document.createElement('div');toolbar.id='executiveToolbar';toolbar.setAttribute('aria-label','Инструменты исполнительной');
 const groups=[['Лист',['exTitle','exAngle','exApply']],['Кабель',['exBrand','exSection','exExtra','exRoute','exFinish','exRouteList','exCable']],['Выноски',['exLeader','exLeaderList','exMoveLeader','exDeleteLeader','exRemoveLeader']],['Перемещение',['exDX','exDY','exMoveRoute','exDevice','exRemoveRoute']],['Масштаб',['exKnownMetres','exCalibrate']]];
 for(const [title,ids] of groups){const group=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');summary.textContent=title;group.append(summary,body);for(const id of ids){const el=$(id);body.append(el.closest('label')||el);}if(title==='Лист'){const stamp=$('exStamp').closest('details');body.insertBefore(stamp,$('exApply'));}toolbar.append(group);}
 document.querySelector('main').before(toolbar);
 const quick=document.createElement('div');quick.className='executiveQuick';toolbar.prepend(quick);
 for(const [label,id] of [['Прибор','exDevice'],['Кабельная трасса','exRoute'],['Выноска','exLeader']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>$(id).click();quick.append(b);}
 const rename=document.createElement('button');rename.id='exRename';rename.textContent='Изменить название';$('exTitle').parentElement.after(rename);rename.onclick=guard(async()=>{if(!sheet())throw Error('Выберите исполнительную');const title=$('exTitle').value;await api.checkpoint('Перед переименованием');mutate(p=>{p.sheets.find(s=>s.id===active).title=title;});api.status('Название изменено и сохраняется локально.');});
 const assign=document.createElement('button');assign.id='exAssignSelection';assign.textContent='Назначить кабель выделенному объекту';$('exCable').after(assign);
 assign.onclick=guard(()=>{if(!sheet())throw Error('Выберите исполнительную');const selection=api.selectionPaths(),isNew=selection.ids.length&&selection.ids.every(id=>id.startsWith('new-'));if(selection.shared)throw Error('Общая геометрия повторяющихся блоков: сначала создайте независимую копию прибора.');if(!selection.paths.length)throw Error('Выберите линию, полилинию или кабель');if(!isNew&&!selection.roots.every(id=>sheet().nativeHandles.includes(id.replace('dwg-',''))))throw Error('Выберите объект внутри активной исполнительной');if(project().sheets.some(s=>s.routes.some(r=>r.sourceIds?.some(id=>(selection.allIds||selection.ids).includes(id)))))throw Error('Этот объект уже учтён. Выберите его трассу в списке для изменения кабеля.');if(selection.coincident&&!confirm("Найдены совпадающие копии линий: "+selection.coincident+". Учесть выбранный путь как один кабель, без повторения длины? Если здесь проходят несколько кабелей, отмените и учитывайте их отдельно."))return;const id=crypto.randomUUID();mutate(p=>projectAPI.addRoute(p,active,{id,points:selection.paths[0],...(!isNew?{paths:selection.paths,sourceIds:selection.ids}:{}),brand:$('exBrand').value,section:$('exSection').value,extraMetres:Number($('exExtra').value)}),!!isNew,()=>{if(isNew)api.consumeNewSelection();});routeId=id;refresh();api.status('Кабель назначен. Длина кривых рассчитана по отображаемой геометрии (приближённо).');});
 toolbar.addEventListener('click',e=>{const summary=e.target.closest('summary');if(summary?.parentElement.parentElement===toolbar)for(const group of toolbar.children)if(group!==summary.parentElement)group.open=false;});
 document.addEventListener('pointerdown',e=>{if(!toolbar.contains(e.target))for(const group of toolbar.children)group.open=false;});
 $('exMoveLeader').textContent='Сдвинуть выноску (X/Y в «Перемещение»)';$('exMoveRoute').textContent='Сдвинуть выбранную трассу';$('exApply').textContent='Применить поворот и оформление';
 function selectObject(id,ids){const record=api.getDoc().records.find(r=>r.id===id);for(const s of project().sheets){const r=s.routes.find(r=>r.id===record?.routeId||r.sourceIds?.some(source=>ids.includes(source)));if(r){active=s.id;routeId=r.id;refresh();cableFields();return;}}routeId='';$('exRouteList').value='';}
 function createCable(controls,smooth){if(!sheet())throw Error('Выберите исполнительную');const id=crypto.randomUUID();mutate(p=>projectAPI.addRoute(p,active,{id,points:cableCurve(controls,smooth),controls,smooth,brand:$('exBrand').value,section:$('exSection').value,extraMetres:Number($('exExtra').value)}));routeId=id;refresh();api.status('Кабель создан и включён в ведомость. Можно изменить марку, сечение и поставить выноску.');}
 const selectedRoute=()=>sheet()?.routes.find(r=>r.id===routeId);
 return {rebuild,tap,project,hover,selectObject,preview:()=>({mode,points,hoverPoint}),cancel:()=>{points=[];mode='';},sheet,route:selectedRoute,
  selectRoute:id=>{routeId=id;refresh();cableFields();},
  beginCable:()=>{if(!sheet())throw Error('Выберите исполнительную');mode='route3';points=[];api.setTool('executive');api.status('Три точки: начало → изгиб → конец. Длина показывается при рисовании.');},
  editRoute:fn=>mutate(p=>{const r=p.sheets.find(s=>s.id===active)?.routes.find(r=>r.id===routeId);if(!r)throw Error('Выберите кабель');fn(r);}),
  duplicateRoute:delta=>{const r=structuredClone(selectedRoute());if(!r||r.sourceIds)throw Error('Выберите нарисованный кабель');r.id=crypto.randomUUID();r.leaders.forEach(l=>l.id=crypto.randomUUID());mutate(p=>{p.sheets.find(s=>s.id===active).routes.push(r);projectAPI.moveRoute(p,active,r.id,delta);});routeId=r.id;refresh();},
  moveRoute:delta=>mutate(p=>projectAPI.moveRoute(p,active,routeId,delta)),removeRoute:()=>mutate(p=>projectAPI.removeRoute(p,active,routeId))};
}
