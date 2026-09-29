// SPDX-License-Identifier: GPL-3.0-or-later
import {parseDxfAsync,scene,sceneAsync,serializeChunks,cloneDoc,demo,get,num,set,decode,move,addEntity} from './cad.mjs?v=0.17.21';
import {paintShapes,previewTransform} from './renderer.mjs?v=0.17.21';
import {loadCadFont} from './fonts.mjs?v=0.17.21';
import {clampProgress,warningText} from './progress.mjs?v=0.17.21';
import {isNew,additions} from './authoring.mjs?v=0.17.21';
import {mountExecutiveUI} from './executive-ui.mjs?v=0.17.21';
import {captureRecovery,replayRecovery,recoveryStore} from './recovery.mjs?v=0.17.21';
import {shapePaths,pathLength,syncLinkedRoutes} from './selection-metrics.mjs?v=0.17.21';
import {copyTransform} from './object-copy.mjs?v=0.17.21';
import {cableChain} from './cable-chain.mjs?v=0.17.21';
import {executivePdf,executiveLooseRoots} from './executive-export.mjs?v=0.17.21';
import {selectionSubset,toggleSelectionPart} from './selection-subset.mjs?v=0.17.21';
import {drawingPreset,presetPairs,presetColor} from './drawing-presets.mjs?v=0.17.21';
import {deviceInstances,wholeDevice} from './device-selection.mjs?v=0.17.21';
import {mountExportMenu} from './export-menu.mjs?v=0.17.21';
import {spatialIndex,viewportShapes} from './spatial-index.mjs?v=0.17.21';
import {areaDrag} from './area-drag.mjs?v=0.17.21';
let executiveUI;
let rejectWorker=null;
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let doc=demo(),view={x:0,y:0,s:1},drawing,selected=null,hidden=new Set(),tool='object',draft=null,history=[],future=[],dirty=false,name='demo',worker=null,loadTimer=null,loadId=0;
let width=1,height=1,pointers=new Map(),gesture=null,sourceFile=null;
let polyPoints=[],selectedMatrix=null,selectedShapeKey=null,sharedSelectedId=null,pickedDevice=null;
let clipboard=null,draftHover=null,selectedChain=null;
const renderSelection=()=>pickedDevice?.id===selected?new Set(selectedShapes().map(s=>s.entityKey)):selectedChain?.anchor===selected?selectedChain.keys:selectedShapeKey?.includes('|'+selected+'|')?selectedShapeKey:selected;
import {aciColors as colors} from './colors.mjs?v=0.17.21';
import {mountCableWorkbench} from './cable-workbench.mjs?v=0.17.21';
import {mountLeaderWorkbench} from './leader-workbench.mjs?v=0.17.21';
import {editObjects} from './object-edit.mjs?v=0.17.21';
import {cableCurve,joinCablePaths} from './cable-edit.mjs?v=0.17.21';
import {addRoute} from './executive-project.mjs?v=0.17.21';
import {splineControls,setSplineControl,movableSpline,previewSpline} from './control-edit.mjs?v=0.17.21';
let cableWorkbench,leaderWorkbench;
const areaSelection=areaDrag({enabled:()=>tool==='executive'&&executiveUI?.preview().mode==='area'&&$('busy').hidden,start:p=>executiveUI.startArea(world(p)),move:p=>executiveUI.hover(world(p)),cancel:()=>executiveUI?.clearArea(),finish:(a,b)=>{try{executiveUI.finishArea(world(a),world(b));}catch(e){status(e.message);}}});
const status=s=>{$('status').textContent=s;if(!$('busy').hidden)$('busy').querySelector('strong').textContent=s;};
const recovery=recoveryStore();let recoveryQueue=Promise.resolve(),recoveryReady=false,recoveryRevision=0;
function checkpoint(label='Изменение'){
 if(!recoveryReady)return Promise.resolve();
 const file=sourceFile||new File([...serializeChunks(doc)],name+'.dxf'),state=doc.native?captureRecovery(doc):null;
 const meta={name,label,units:$('units').value,view:{...view}};
 const revision=++recoveryRevision;$('autosaveStatus').textContent='Сохраняю локально…';
 const job=recoveryQueue.catch(()=>{}).then(()=>recovery.save(file,state,meta));recoveryQueue=job;
 job.then(()=>{if(revision===recoveryRevision)$('autosaveStatus').textContent='Сохранено на устройстве · '+new Date().toLocaleTimeString();},e=>{$('autosaveStatus').textContent='НЕ СОХРАНЕНО: '+e.message+' — скачайте DWG';});return job;
}
const remember=()=>doc.native?{recovery:captureRecovery(doc),file:sourceFile,name}:cloneDoc(doc);
let progressStarted=0,progressClock;
function progress(s,n){status(s);if(n!==undefined){$('loadProgress').value=clampProgress(n);$('loadPercent').textContent=clampProgress(n)+'%';}}
function beginProgress(){progressStarted=Date.now();clearInterval(progressClock);progress('',0);progressClock=setInterval(()=>{$('loadElapsed').textContent='Прошло '+Math.floor((Date.now()-progressStarted)/1000)+' с · проценты по этапам, не оценка оставшегося времени';},1000);}
const world=p=>[(p[0]-view.x)/view.s,(view.y-p[1])/view.s],screen=p=>[p[0]*view.s+view.x,view.y-p[1]*view.s];
const local=e=>{const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];};
let recordIndex;
function recordById(id){if(recordIndex?.records!==doc.records)recordIndex={records:doc.records,map:new Map(doc.records.map(r=>[r.id,r]))};return recordIndex.map.get(id);}
function current(){return recordById(selected);}
function sameDevice(s){return s.deviceId===pickedDevice.id&&s.id===pickedDevice.root&&String(s.deviceMatrix)===pickedDevice.matrix;}
let selectedShapeCache,deviceCache,overlayCache;
function selectedShapes(){if(!selected)return [];const key=[drawing,selected,pickedDevice,selectedChain,selectedShapeKey];if(selectedShapeCache?.key.every((v,i)=>v===key[i]))return selectedShapeCache.shapes;const shapes=drawing.shapes.filter(s=>pickedDevice?.id===selected?sameDevice(s):selectedChain?.anchor===selected?selectedChain.measureKeys.has(s.entityKey):selectedShapeKey?s.entityKey===selectedShapeKey:s.deviceId===selected||s.entityId===selected||s.id===selected);selectedShapeCache={key,shapes};return shapes;}
function selectedOverlay(){const key=[drawing,selected,pickedDevice,selectedChain,selectedShapeKey];if(overlayCache?.key.every((v,i)=>v===key[i]))return overlayCache;const selection=renderSelection(),shapes=!selected?[]:selection instanceof Set?drawing.shapes.filter(s=>selection.has(s.entityKey)):selectedShapes();return overlayCache={key,selection,shapes};}
let selectionCache;
function selectionPaths(){
 if(selectionCache?.drawing===drawing&&selectionCache.selected===selected&&selectionCache.chain===selectedChain&&selectionCache.key===selectedShapeKey&&selectionCache.device===pickedDevice)return selectionCache.value;
 const shapes=selectedShapes(),counts=new Map(),chain=selectedChain?.anchor===selected?selectedChain:null,allIds=new Set();
 for(const s of shapes){const id=s.entityId||s.id;counts.set(id,(counts.get(id)||0)+1);allIds.add(id);}
 for(const s of drawing.shapes){const id=s.entityId||s.id;if(counts.has(id))counts.set(id,counts.get(id)-1);if(chain?.keys.has(s.entityKey))allIds.add(id);}
 const value={paths:chain?.paths||shapePaths(shapes),ids:[...counts.keys()],allIds:[...allIds],coincident:chain?.coincident||0,roots:[...new Set(shapes.map(s=>s.id))],shared:[...counts.values()].some(n=>n<0)};
 selectionCache={device:pickedDevice,drawing,selected,chain:selectedChain,key:selectedShapeKey,value};return value;
}
function lengthLabel(paths){const u=$('units').value,f=u==='m'?1:Number(u);return 'Длина ≈ '+(pathLength(paths)*f).toLocaleString('ru-RU',{maximumFractionDigits:3})+(u==='1'?' ед.':' м');}
function rebuild(kind='geometry'){const generated=new Set(doc.executiveProject?.generatedHandles||[]);executiveUI?.rebuild();for(const s of doc.executiveProject?.sheets||[]){const r=doc.entities.find(r=>get(r,5)===s.nativeHandles[0]);if(r)set(r,50,s.angle*180/Math.PI);}drawing=kind==='decoration'&&drawing?{...drawing,shapes:[...drawing.shapes.filter(s=>!s.id.startsWith('executive-')&&!generated.has(s.id.replace('dwg-',''))),...scene({...doc,entities:doc.entities.filter(r=>r.id.startsWith('executive-'))}).shapes]}:scene(doc);if(drawing.shapes.length>20000){spatialIndex(drawing.shapes);deviceCache={drawing,instances:deviceInstances(doc)};recordById(null);}if(drawing.limited)status('Предел отображения: 3 000 000 записей. Часть чертежа не показана.');$('report').textContent=drawing.shapes.length+' видимых примитивов. Не отображаются: '+(drawing.unsupported.map(([t,n])=>t+' × '+n).join(', ')||'нет известных пропусков')+(doc.nativeUnknown?' · не разобрано движком: '+doc.nativeUnknown:'')+(drawing.limited?' · достигнут предел объёма':'')+'. Только пространство модели.';renderLayers();properties();draw();}
function renderLayers(){const names=[...new Set(drawing.shapes.map(s=>s.layer))].sort();$('layers').replaceChildren();for(const layer of names){const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.checked=!hidden.has(layer);i.onchange=()=>{i.checked?hidden.delete(layer):hidden.add(layer);draw();};l.append(i,document.createTextNode(decode(layer)));$('layers').append(l);}}
const editable=r=>r.id!==sharedSelectedId&&!r.id.startsWith('executive-')&&['LINE','LWPOLYLINE','CIRCLE','ARC','TEXT','MTEXT','INSERT'].includes(r.type)&&!num(r,210)&&!num(r,220)&&num(r,230,1)===1&&!(doc.native&&!doc.executiveProject?.sheets.length&&r.type==='INSERT'&&num(r,66));
const deletable=r=>(editable(r)||(r.type==='SPLINE'&&r.id!==sharedSelectedId))&&r.type!=='MTEXT'&&!doc.executiveProject?.sheets.some(s=>s.nativeHandles.includes(get(r,5)));
function properties(){const r=current();$('props').hidden=!r;$('selection').textContent=r?r.type+' · '+(get(r,5)||r.id)+(editable(r)?'':' · только просмотр'):'Нажмите на объект на чертеже.';if(r){$('layer').value=decode(get(r,8,'0'));$('text').value=r.type==='TEXT'?decode(get(r,1)):'';$('text').disabled=r.type!=='TEXT'||!editable(r);$('dx').value=0;$('dy').value=0;$('props').querySelector('button[type=submit]').disabled=!editable(r);$('delete').disabled=!deletable(r);}}
function changed(kind='geometry'){dirty=true;$('filename').textContent=name+' · изменён';checkpoint().catch(()=>{});rebuild(kind);if(kind==='geometry'&&selectedChain){const seed=drawing.shapes.find(s=>selectedChain.measureKeys.has(s.entityKey));if(seed){if(selectedChain.manual)selectedChain={...selectionSubset(drawing.shapes,selectedChain.keys,selectedChain.universe),anchor:selected};else{const chain=cableChain(drawing.shapes,seed,hidden);selectedChain={anchor:selected,keys:new Set([...chain,...chain.coincident||[]].map(s=>s.entityKey)),measureKeys:new Set(chain.map(s=>s.entityKey)),paths:chain.paths,overlaps:chain.overlaps,coincident:chain.coincident?.length||0};}}else selectedChain=null;}if(kind==='geometry'&&syncLinkedRoutes(doc.executiveProject,drawing.shapes)){rebuild('decoration');checkpoint('Обновление длин').catch(()=>{});}}
function snapshot(){history.push(remember());while(history.length>15)history.shift();future=[];syncUndo();}
function syncUndo(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
async function undo(redo=false){if(!$('busy').hidden)return;const src=redo?future:history,dest=redo?history:future;if(!src.length)return;const saved=src.at(-1),current=remember(),oldHistory=history,oldFuture=future;
 if(saved.recovery){if(!await openFile(saved.file,{state:saved.recovery,name:saved.name}))return;history=oldHistory;future=oldFuture;}else{doc=saved;sourceFile=doc.sourceFile||sourceFile;rebuild();}
 src.pop();dest.push(current);selected=null;dirty=true;checkpoint(redo?'Повтор':'Отмена').catch(()=>{});syncUndo();}
function fit(){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const s of drawing.shapes){if(hidden.has(s.layer))continue;for(const p of s.pts){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}}if(!Number.isFinite(minX)){status('Нет поддерживаемых видимых объектов. Исходный файл не изменён.');return;}
 view.s=Math.min((width-60)/Math.max(maxX-minX,1),(height-80)/Math.max(maxY-minY,1));view.x=width/2-(minX+maxX)/2*view.s;view.y=height/2+(minY+maxY)/2*view.s;draw();}
let pendingFrame=0;
const preview=document.createElement('canvas'),previewContext=preview.getContext('2d');
let cached=null,interactionUntil=0,settleTimer;
loadCadFont().then(()=>{cached=null;draw();}).catch(()=>status('Не удалось загрузить встроенный CAD-шрифт. Проверьте соединение и обновите страницу.'));
function markInteraction(){interactionUntil=performance.now()+160;clearTimeout(settleTimer);settleTimer=setTimeout(()=>{interactionUntil=0;draw();},170);}
function draw(){if(!pendingFrame)pendingFrame=requestAnimationFrame(()=>{pendingFrame=0;paint();});}
function paint(){if(!width||!height||!canvas.width||!canvas.height)return;ctx.clearRect(0,0,width,height);ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);if($('grid').getAttribute('aria-pressed')==='true'){ctx.lineWidth=1;ctx.strokeStyle='#17283a';for(let x=0;x<width;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}for(let y=0;y<height;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}}
 const large=(drawing?.shapes.length||0)>20000,hiddenKey=[...hidden].join('\0');
 if(large){
  const valid=cached&&cached.drawing===drawing&&cached.hiddenKey===hiddenKey&&preview.width===canvas.width&&preview.height===canvas.height;
  if(!(valid&&(performance.now()<interactionUntil||(cached.view.x===view.x&&cached.view.y===view.y&&cached.view.s===view.s)))){
   if(preview.width!==canvas.width||preview.height!==canvas.height){preview.width=canvas.width;preview.height=canvas.height;}
   previewContext.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);previewContext.clearRect(0,0,width,height);
   paintShapes(previewContext,viewportShapes(drawing.shapes,view,width,height),{view,width,height,hidden,selected:null,colors});
   cached={drawing,selected,hiddenKey,view:{...view}};
  }
  const transform=previewTransform(view,cached.view);ctx.save();ctx.translate(transform.x,transform.y);ctx.scale(transform.scale,transform.scale);ctx.drawImage(preview,0,0,width,height);ctx.restore();const overlay=selectedOverlay();if(overlay.shapes.length)paintShapes(ctx,overlay.shapes,{view,width,height,hidden,selected:overlay.selection,colors});
 }else{cached=null;paintShapes(ctx,drawing?.shapes||[],{view,width,height,hidden,selected:renderSelection(),colors});}
 if(tool==='executive'){const preview=executiveUI?.preview();if(preview?.points.length){let pts=[...preview.points];if(preview.hoverPoint)pts.push(preview.hoverPoint);if(preview.mode==='area'&&pts.length>1){const a=pts[0],b=pts.at(-1);pts=[a,[b[0],a[1]],b,[a[0],b[1]],a];}const cable=['route3','straight','broken'].includes(preview.mode);ctx.save();ctx.strokeStyle=cable?presetColor():'#ffbe6c';ctx.lineWidth=cable?Math.max(1,drawingPreset.lineweight/100*96/25.4):2;ctx.setLineDash(cable?[]:[6,4]);ctx.beginPath();(preview.mode==='route3'?cableCurve(pts):pts).map(screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(preview.mode==='area'){ctx.fillStyle='#ffbe6c22';ctx.fill();}ctx.stroke();ctx.restore();}}
 if(draft){const p=screen(draft);ctx.fillStyle='#ffbe6c';ctx.beginPath();ctx.arc(...p,5,0,7);ctx.fill();if(draftHover&&['line','poly3','measure'].includes(tool)){const pts=(tool==='poly3'?[...polyPoints,draftHover]:[draft,draftHover]).map(screen);ctx.save();ctx.strokeStyle=tool==='measure'?'#ffbe6c':presetColor();ctx.lineWidth=tool==='measure'?1:Math.max(1,drawingPreset.lineweight/100*96/25.4);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.restore();}}
 cableWorkbench?.paint(ctx);
 leaderWorkbench?.paint(ctx);
}
function zoom(f,p=[width/2,height/2]){const w=world(p),s=Math.max(1e-8,Math.min(1e8,view.s*f));view.s=s;view.x=p[0]-w[0]*s;view.y=p[1]+w[1]*s;markInteraction();draw();}
const distance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);};
function refineSelection(p){
 if(!selectedChain)return status('Сначала выберите составной кабель. Уточнение снимает выбор с целых CAD-участков, не разрезая их.');
 const universe=selectedChain.universe||selectedChain.keys;let hit=null,best=14;
 for(const s of drawing.shapes){if(!universe.has(s.entityKey)||hidden.has(s.layer))continue;const pts=s.pts.map(screen);for(let i=1;i<pts.length;i++){const d=distance(p,pts[i-1],pts[i]);if(d<best){best=d;hit=s;}}}
 if(!hit)return status('Нажмите часть ранее выбранного кабеля.');
 const next=toggleSelectionPart(drawing.shapes,selectedChain,hit);
 if(!next.keys.size)return status('Это последний участок. Escape снимает весь выбор.');
 const first=drawing.shapes.find(s=>next.measureKeys.has(s.entityKey));selected=first.entityId||first.id;
 selectedChain={...next,anchor:selected};selectedShapeKey=first.entityKey;selectedMatrix=first.entityMatrix;sharedSelectedId=selected;
 executiveUI.selectObject('',[]);properties();draw();
 status('Выбрано: '+next.measureKeys.size+' участков · '+lengthLabel(next.paths)+'. Повторный клик с Shift возвращает участок. Геометрия не изменена.');
}
function pick(p){
 let best=18,id=null,leaf=false,hit=null,whole=false;selectedChain=null;selectedMatrix=null;selectedShapeKey=null;sharedSelectedId=null;
 pickedDevice=null;if(deviceCache?.drawing!==drawing)deviceCache={drawing,instances:deviceInstances(doc)};const devices=deviceCache.instances;
 const roots=new Set((doc.executiveProject?.sheets||[]).flatMap(sheet=>sheet.nativeHandles.map(h=>'dwg-'+h)));
 const w=world(p),pad=18/view.s;
 for(const s of spatialIndex(drawing.shapes).query([w[0]-pad,w[1]-pad,w[0]+pad,w[1]+pad])){
  const executive=roots.has(s.id);
  if(tool==='device'&&!wholeDevice(s,devices))continue;
  const b=s.bounds;if(hidden.has(s.layer)||b[2]<w[0]-pad||b[0]>w[0]+pad||b[3]<w[1]-pad||b[1]>w[1]+pad)continue;
  const pts=s.pts.map(screen);let d=Infinity;
  if(s.text!==null){const a=pts[0];d=distance(p,a,[a[0]+Math.max(10,s.height*view.s*s.text.length*.5),a[1]]);}
  else for(let i=1;i<pts.length;i++)d=Math.min(d,distance(p,pts[i-1],pts[i]));
  if(d<best){hit=s;best=d;whole=wholeDevice(s,devices);leaf=!whole&&executive&&!!s.entityId;id=whole?s.deviceId:leaf?s.entityId:s.id;selectedMatrix=whole?s.deviceMatrix:leaf?s.entityMatrix:null;selectedShapeKey=leaf?s.entityKey:null;}
 }
 selected=id;
 if(whole&&hit){pickedDevice={id,root:hit.id,matrix:String(hit.deviceMatrix)};if(drawing.shapes.some(s=>s.deviceId===id&&!sameDevice(s)))sharedSelectedId=id;}
 if(!selected)executiveUI?.selectObject('',[]);
 if(leaf&&drawing.shapes.filter(s=>s.entityId===id).length>1)sharedSelectedId=id;
 if(tool==='object'&&hit&&!whole){const chain=cableChain(drawing.shapes,hit,hidden);if(chain.length>1||chain.coincident?.length){selectedChain={anchor:id,keys:new Set([...chain,...chain.coincident||[]].map(s=>s.entityKey)),measureKeys:new Set(chain.map(s=>s.entityKey)),paths:chain.paths,overlaps:chain.overlaps,coincident:chain.coincident?.length||0};sharedSelectedId=id;}}
 properties();draw();
 if(selected){const info=selectionPaths(),label=lengthLabel(info.paths);status(label);$('selection').textContent+=' · '+label+(info.coincident?' · без совпадающих копий':'');executiveUI.selectObject(selected,info.allIds);}
 if(selectedChain)status('Кабель: '+selectedChain.measureKeys.size+' участков · '+lengthLabel(selectionPaths().paths)+(selectedChain.overlaps?' · стыков с нахлёстом: '+selectedChain.overlaps+' (без двойного метража)':'')+(selectedChain.coincident?' · совпадающих копий: '+selectedChain.coincident+' (длина без повторов)':'')+'. На разветвлении выбор останавливается. Выбирается связанная линия целиком.');
 else if(sharedSelectedId)status('Объект входит в повторяющийся блок. Изменение общей геометрии затронет несколько экземпляров; пока доступен просмотр. Для перемещения прибора используйте «Выбрать прибор».');
}
function setTool(t){areaSelection.reset();pickedDevice=null;leaderWorkbench?.cancel();cableWorkbench?.cancel();if(t==='select')t='object';selectedChain=null;draftHover=null;tool=t;draft=null;polyPoints=[];selected=null;selectedMatrix=null;selectedShapeKey=null;sharedSelectedId=null;properties();const areaMode=t==='executive'&&executiveUI?.preview().mode==='area';canvas.style.cursor=areaMode?'crosshair':'';$('exCreateIcon')?.setAttribute('aria-pressed',String(areaMode));document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)));$('hint').textContent=({object:'Нажмите на провод: выбирается вся связанная линия с поворотами, до разветвления. Приборы и другие объекты выбираются целиком.',select:'Нажмите на отдельный объект исполнительной. Перемещение — в свойствах; перетаскивание двигает вид.',pan:'Перетаскивайте чертёж. Масштаб — колесом или двумя пальцами.',executive:'Указывайте точки на чертеже. Настройки и завершение — в панели исполнительных. Escape — отменить.',device:'Нажмите на любой штрих прибора: выбирается весь блок.', poly3:'Укажите три точки полилинии. Escape — отменить.',line:'Укажите начало и конец линии. Escape — отменить.',text:'Нажмите в точке вставки текста.',measure:'Укажите две точки. Единицы выбираются в панели справа.'})[t]||'Выберите инструмент.';if(areaMode)$('hint').textContent='Зажмите мышь, обведите план рамкой и отпустите. Escape — отмена.';draw();}
function tap(p){const w=world(p);if(!$('busy').hidden)return;if(tool==='paste'){const sheet=executiveUI.sheet();if(!clipboard||clipboard.file!==sourceFile||!sheet)return status('Выберите исполнительную и заново скопируйте объект');try{const request={handle:clipboard.handle,parent:sheet.nativeHandles[0],transform:copyTransform(doc,sheet,clipboard.matrix,clipboard.centre,w)};setTool('select');commitExecutive(doc.executiveProject,null,false,request).then(ok=>{if(ok)status('Независимая копия объекта вставлена в исполнительную и сохранена локально.');});}catch(e){status(e.message);}return;}if(tool==='executive'){try{executiveUI.tap(w);}catch(e){status(e.message);}return;}if(tool==='select'||tool==='device'||tool==='object'){pick(p);return;}if(tool==='pan')return;
 if(tool==='poly3'){
  polyPoints.push(w);draft=w;draw();
  if(polyPoints.length<3){status('Полилиния: точка '+polyPoints.length+' из 3');return;}
  snapshot();selected=addEntity(doc,'LWPOLYLINE',[[90,3],[70,0],...presetPairs(),...polyPoints.flatMap(p=>[[10,p[0]],[20,p[1]]])]).id;
  const length=polyPoints.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-polyPoints[i][0],p[1]-polyPoints[i][1]),0);
  polyPoints=[];draft=null;changed();status('Полилиния создана · длина '+(length*($('units').value==='m'?1:Number($('units').value))).toFixed(3)+($('units').value==='1'?' ед.':' м'));return;
 }
 if(tool==='text'){const text=prompt('Текст подписи:');if(!text)return;snapshot();const r=addEntity(doc,'TEXT',[[10,w[0]],[20,w[1]],[30,0],[40,18/view.s],[1,text],[50,0],[100,'AcDbText']]);selected=r.id;changed();return;}
 if(!draft){draft=w;draw();return;}const start=draft;draft=null;
 if(tool==='measure'){const n=Math.hypot(w[0]-start[0],w[1]-start[1]),u=$('units').value,f=u==='m'?1:Number(u);status('Расстояние: '+(n*f).toLocaleString('ru-RU',{maximumFractionDigits:3})+(u==='1'?' ед. чертежа':' м')+' · прямая между точками');draw();return;}
 if(Math.hypot(w[0]-start[0],w[1]-start[1])<1e-9)return;snapshot();selected=addEntity(doc,'LINE',[[10,start[0]],[20,start[1]],[30,0],[11,w[0]],[21,w[1]],[31,0],...presetPairs()]).id;changed();status(lengthLabel([[start,w]]));}
canvas.onpointerdown=e=>{canvas.focus();if(areaSelection.down(e.pointerId,local(e),e.button)){canvas.setPointerCapture(e.pointerId);return;}if(e.shiftKey&&tool==='object'&&$('busy').hidden){refineSelection(local(e));return;}if(leaderWorkbench?.down(local(e))||cableWorkbench?.down(local(e))){canvas.setPointerCapture(e.pointerId);return;}canvas.setPointerCapture(e.pointerId);const p=local(e);pointers.set(e.pointerId,p);gesture={view:{...view},points:[...pointers.values()].map(p=>[...p]),start:p,moved:false,multi:pointers.size>1};};
canvas.onpointermove=e=>{if(areaSelection.move(e.pointerId,local(e)))return;if(leaderWorkbench?.move(local(e))||cableWorkbench?.move(local(e)))return;if(!pointers.has(e.pointerId)){if(draft&&['line','poly3','measure'].includes(tool)){const w=world(local(e));draftHover=w;draw();status(lengthLabel([tool==='poly3'?[...polyPoints,w]:[draft,w]]));}if(tool==='executive')executiveUI?.hover(world(local(e)));return;}pointers.set(e.pointerId,local(e));const ps=[...pointers.values()],g=gesture;if(!g)return;
 if(ps.length>=2&&g.points.length>=2){const mid=a=>[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2],dist=a=>Math.hypot(a[1][0]-a[0][0],a[1][1]-a[0][1]);view={...g.view};zoom(dist(ps)/Math.max(dist(g.points),1),mid(g.points));const a=mid(ps),b=mid(g.points);view.x+=a[0]-b[0];view.y+=a[1]-b[1];g.moved=true;draw();}
 else if(ps.length===1&&g.points.length===1){const p=ps[0],a=g.points[0];if(Math.hypot(p[0]-a[0],p[1]-a[1])>4)g.moved=true;if(g.moved){view.x=g.view.x+p[0]-a[0];view.y=g.view.y+p[1]-a[1];markInteraction();draw();}}};
canvas.onpointerup=e=>{if(areaSelection.up(e.pointerId,local(e)))return;if(leaderWorkbench?.up()||cableWorkbench?.up())return;const g=gesture;pointers.delete(e.pointerId);if(g&&!g.moved&&!g.multi)tap(local(e));gesture=pointers.size?{view:{...view},points:[...pointers.values()],moved:true,multi:true}:null;};
canvas.onpointercancel=()=>{areaSelection.reset();leaderWorkbench?.cancel();cableWorkbench?.cancel();pointers.clear();gesture=null;};
canvas.onlostpointercapture=()=>{if(areaSelection.active())areaSelection.reset();};
canvas.onwheel=e=>{e.preventDefault();if(areaSelection.active())return;zoom(Math.exp(-e.deltaY*.001),local(e));};canvas.addEventListener('wheel',()=>{},{passive:false});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('fit').onclick=fit;$('plus').onclick=()=>zoom(1.3);$('minus').onclick=()=>zoom(1/1.3);$('panel').onclick=()=>$('sidebar').classList.toggle('open');$('undo').onclick=()=>undo();$('redo').onclick=()=>undo(true);
$('grid').onclick=()=>{$('grid').setAttribute('aria-pressed',String($('grid').getAttribute('aria-pressed')!=='true'));draw();};
$('props').onsubmit=e=>{e.preventDefault();if(!$('busy').hidden)return;const r=current();if(!r||!editable(r))return;let dx=Number($('dx').value),dy=Number($('dy').value);if(selectedMatrix){const [a,b,c,d]=selectedMatrix,det=a*d-b*c;if(Math.abs(det)<1e-12)return status('Невозможно преобразовать координаты прибора');[dx,dy]=[(d*dx-c*dy)/det,(-b*dx+a*dy)/det];}if(!Number.isFinite(dx)||!Number.isFinite(dy))return status('Введите числовой сдвиг.');const op={handle:get(r,5),dx,dy};if(r.type==='TEXT'&&$('text').value!==decode(get(r,1)))op.text=$('text').value;snapshot();try{move(r,dx,dy);if(r.type==='INSERT')for(const a of doc.records.filter(a=>a.type==='ATTRIB'&&get(a,330)===get(r,5)))move(a,dx,dy);if(op.text!==undefined)set(r,1,op.text);if(doc.native&&!isNew(r))doc.nativeOps.push(op);changed();status('Изменения внесены. Скачайте копию '+(doc.native?'DWG':'DXF')+' для сохранения.');}catch(e){undo();status(e.message);}};
$('delete').onclick=()=>{const r=current();if(!$('busy').hidden||!r||!deletable(r))return;const ids=new Set(selectionPaths().ids);if(doc.executiveProject?.sheets.some(s=>s.routes.some(route=>route.sourceIds?.some(id=>ids.has(id)))))return status('Сначала снимите назначение кабеля через «Удалить трассу» — затем удалите объект.');if(!confirm('Удалить выбранный объект?'))return;snapshot();if(doc.native&&!isNew(r))doc.nativeOps.push({handle:get(r,5),dx:0,dy:0,remove:true});if(r.type==='INSERT')doc.records=doc.records.filter(a=>!(a.type==='ATTRIB'&&get(a,330)===get(r,5)));for(const b of doc.blocks.values())b.records=b.records.filter(x=>x!==r&&!(r.type==='INSERT'&&x.type==='ATTRIB'&&get(x,330)===get(r,5)));doc.entities=doc.entities.filter(x=>x!==r);doc.records=doc.records.filter(x=>x!==r);selected=null;changed();};
function adopt(next,fileName,file=null,prepared=null){doc=next;doc.sourceFile=file;sourceFile=file;name=fileName;history=[];future=[];hidden.clear();selected=null;draft=null;dirty=false;$('filename').textContent=name;$('save').textContent='Скачать изменения · '+(doc.native?'DWG':'DXF');for(const b of document.querySelectorAll('[data-tool="line"],[data-tool="text"]')){b.disabled=false;b.title="";}setTool('select');syncUndo();if(prepared)drawing=prepared;rebuild(prepared?'decoration':'geometry');fit();const h=doc.records.find(r=>r.type==='SECTION'&&get(r,2)==='HEADER'),i=h?.pairs.findIndex(p=>p[0]===9&&p[1]==='$INSUNITS');const u=i>=0?Number(h.pairs[i+1]?.[1]):0;$('units').value=({4:'.001',5:'.01',6:'m'})[u]||'1';}
function stopLoad(){loadId++;if(worker)worker.terminate();worker=null;clearTimeout(loadTimer);clearInterval(progressClock);const reject=rejectWorker;rejectWorker=null;reject?.(Error('Операция отменена'));$('busy').hidden=true;$('file').disabled=false;$('save').disabled=false;draw();}
$('cancel').onclick=()=>{stopLoad();status('Загрузка отменена. Предыдущий чертёж сохранён.');};
async function openFile(file,restore=null){if(!restore&&dirty&&!confirm('Есть несохранённые изменения. Открыть другой файл?'))return;const limit=/\.dwg$/i.test(file.name)?128:256;if(file.size>limit*1024*1024)return status('Предел: DWG 128 МБ, DXF 256 МБ. На телефоне объём зависит от доступной памяти.');stopLoad();const token=loadId;$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;status('Читаю файл…');
 try{const bytes=await file.arrayBuffer();if(token!==loadId)return;let text,warnings=[],next;$('save').disabled=true;
 if(/\.dwg$/i.test(file.name)){
  if(!/^AC10\d\d/.test(new TextDecoder().decode(bytes.slice(0,6))))throw Error('Это не распознанный DWG.');
  const converted=await new Promise((resolve,reject)=>{rejectWorker=reject;worker=new Worker(new URL('./native-reader.mjs?v=0.17.21',import.meta.url),{type:'module'});worker.onmessage=e=>e.data.progress?progress(e.data.progress,e.data.percent):e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Не удалось запустить DWG-движок. Возможно, недостаточно памяти. Попробуйте меньший файл на компьютере.'));loadTimer=setTimeout(()=>reject(Error('Чтение заняло больше 5 минут. Попробуйте отдельный лист.')),300000);worker.postMessage(bytes,[bytes]);});
  if(token!==loadId)return;worker.terminate();worker=null;clearTimeout(loadTimer);
  warnings=converted.messages;next=converted.doc;
 }else{try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1251').decode(bytes);}}
 if(token!==loadId)return;if(!next)next=await parseDxfAsync(text,n=>progress('Разбираю DXF: '+n+'%',5+n*.85),()=>token!==loadId);if(token!==loadId)return;progress('Строю изображение…',95);await new Promise(r=>setTimeout(r,0));if(token!==loadId)return;
 if(restore?.state)replayRecovery(next,restore.state);
 const prepared=next.records.length>20000?await sceneAsync(next,n=>progress('Строю изображение: '+n.toLocaleString('ru')+' объектов',95),()=>token!==loadId):null;if(token!==loadId)return;
 adopt(next,restore?.name||file.name.replace(/\.(dwg|dxf)$/i,''),next.native?file:null,prepared);recoveryReady=true;
 if(restore?.units)$('units').value=restore.units;if(restore?.view){view={...restore.view};draw();}dirty=!!restore;
 await checkpoint(restore?'Восстановление':'Открытие файла');progress('Готово',100);status('Открыт '+file.name+'. '+(warnings.length?'Движок сообщил предупреждения: '+warnings.slice(0,2).join(' · '):'Проверьте список неподдерживаемых объектов справа.'));return true;
 }catch(e){if(token===loadId)status('Не удалось открыть: '+e.message);}finally{if(token===loadId)stopLoad();}}
$('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)openFile(f);};
$('demo').onclick=()=>{if(!dirty||confirm('Заменить несохранённый чертёж демо?')){stopLoad();adopt(demo(),'demo');status('Демонстрационный чертёж.');}};
$('save').onclick=()=>{$('exportReport').textContent=$('report').textContent;$('exportDialog').querySelector('h2').textContent='Сохранить копию в '+(doc.native?'DWG':'DXF')+'?';$('exportDescription').textContent=doc.native?'Записывается новая копия исходного DWG с изменениями. Проверка движком не заменяет проверку в AutoCAD. Новые линии, тексты и полилинии записываются в DWG. В исполнительных сохраняются оформление, трассы, выноски и поддерживаемые удаления. Исходный файл на диске не изменяется.':'Скачивается изменённый DXF. Проверьте результат в AutoCAD.';$('confirmExport').textContent='Скачать '+(doc.native?'DWG':'DXF');$('exportDialog').showModal();};
function download(blob,extension){progress('Готово',100);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-edited.'+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);dirty=false;$('filename').textContent=name;status(extension.toUpperCase()+' подготовлен к скачиванию. Проверьте копию в AutoCAD.');}
$('confirmExport').onclick=async()=>{if(doc.executiveProject?.sheets.length){await commitExecutive(doc.executiveProject,null,true);return;}if(!doc.native){download(new Blob([...serializeChunks(doc)],{type:'application/dxf'}),'dxf');return;}if(!sourceFile)return status('Нет исходного DWG для сохранения.');stopLoad();const token=loadId,ops=doc.nativeOps.map(o=>({...o}));$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;status('Готовлю сохранение DWG…');try{const buffer=await sourceFile.arrayBuffer();if(token!==loadId)return;const saved=await new Promise((resolve,reject)=>{rejectWorker=reject;worker=new Worker(new URL('./native-writer.mjs?v=0.17.21',import.meta.url),{type:'module'});worker.onmessage=e=>e.data.progress?progress(e.data.progress,e.data.percent):e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Не удалось записать DWG. Возможно, недостаточно памяти.'));loadTimer=setTimeout(()=>reject(Error('Запись заняла больше 5 минут.')),300000);worker.postMessage({buffer,ops,added:additions(doc)},[buffer]);});if(token!==loadId)return;download(new Blob([saved.buffer],{type:'application/acad'}),'dwg');}catch(e){if(token===loadId)status(e.message);}finally{if(token===loadId)stopLoad();}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='Escape'){cableWorkbench?.cancel();executiveUI?.cancel();draft=null;setTool('select');}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo(e.shiftKey);}});
new ResizeObserver(()=>{const r=canvas.parentElement.getBoundingClientRect(),initial=width===1;width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);initial?fit():draw();}).observe(canvas.parentElement);
async function commitExecutive(project,cloneRequest=null,exportFile=false,copyRequest=null,exportOnly=false){
 if(!$('busy').hidden)return false;if(!sourceFile){status('Откройте исходный DWG');return false;}
 const checkpointToken=loadId;$('busy').hidden=false;
 try{await checkpoint('Перед операцией DWG');}catch(e){$('busy').hidden=true;status('Операция остановлена: не удалось сохранить контрольную точку. '+e.message);return false;}
 if(checkpointToken!==loadId)return false;
 const before=remember(),previousHistory=[...history],previousName=name;
 stopLoad();const token=loadId;$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;
 const run=(url,data,transfer)=>new Promise((resolve,reject)=>{
  rejectWorker=reject;
  worker=new Worker(new URL(url,import.meta.url),{type:'module'});
  worker.onmessage=e=>{if(token!==loadId)return;if(e.data.progress)progress(e.data.progress,e.data.percent);else if(e.data.error)reject(Error(e.data.error));else resolve(e.data);};
  worker.onerror=()=>reject(Error('Ошибка DWG-движка; изменения не применены'));
  loadTimer=setTimeout(()=>reject(Error('Операция превысила 5 минут')),300000);worker.postMessage(data,transfer);
 });
 try{
  const buffer=await sourceFile.arrayBuffer();if(token!==loadId)return;
  const sheetIds=new Set(project.sheets.map(s=>s.id)),loose=exportOnly?new Map([...executiveLooseRoots(doc.executiveProject,drawing.shapes)].filter(([,id])=>sheetIds.has(id))):new Map();
  const keep=new Set([...project.sheets.flatMap(s=>s.nativeHandles),...(project.generatedHandles||[]),...[...loose.keys()].filter(id=>id.startsWith('dwg-')).map(id=>id.slice(4))]);
  const keepRoots=[...keep].filter(h=>!project.generatedHandles?.includes(h));
  const routeSources=new Set(project.sheets.flatMap(s=>s.routes.flatMap(r=>r.sourceIds||[])));
  const saved=await run('./executive-worker.mjs?v=0.17.21',{buffer,ops:doc.nativeOps,added:additions(doc).filter(item=>!exportOnly||routeSources.has(item.sourceId)||loose.has(item.sourceId)),project,cloneRequest,copyRequest,exportOnly,keepRoots},[buffer]);
  if(token!==loadId)return;worker.terminate();worker=null;clearTimeout(loadTimer);
  const file=new File([saved.buffer],previousName+'.dwg',{type:'application/acad'}),readBuffer=saved.buffer;
  const read=await run('./native-reader.mjs?v=0.17.21',readBuffer,[readBuffer]);
  if(exportOnly){if(token!==loadId)return;const allowed=new Set(keepRoots.concat(saved.project.generatedHandles,saved.addedHandles||[],saved.supportRoots||[])),actual=new Set(saved.exportRootHandles),removed=new Set(doc.nativeOps.filter(o=>o.remove).map(o=>o.handle));if([...actual].some(h=>!allowed.has(h))||[...allowed].some(h=>!removed.has(h)&&!actual.has(h))||read.doc.executiveProject?.sheets.length!==project.sheets.length)throw Error('Проверка отдельного DWG не пройдена: состав объектов не совпал.');downloadExecutives(file,'dwg');status('DWG только исполнительных скачан. Рабочий чертёж не изменён. Проверьте копию в CAD.');return true;}
  if(token!==loadId)return;adopt(read.doc,previousName,file);history=[...previousHistory,before].slice(-15);future=[];syncUndo();dirty=true;await checkpoint('Операция DWG завершена');
  if(exportFile)download(file,'dwg');else status('Исполнительная создана. Локальная копия сохранена. Для архива скачайте DWG.');
  const notices=[warningText(saved.warnings||0),...(read.messages||[])].filter(Boolean);
  if(notices.length)status((exportFile?'DWG подготовлен к скачиванию. ':'Исполнительная создана; скачайте DWG для сохранения. ')+'Предупреждения: '+[...new Set(notices)].join(' · '));
  if(cloneRequest)focusExecutive(doc.executiveProject?.sheets.find(s=>s.id===cloneRequest.sheetId));
  return true;
 }catch(e){if(token===loadId)status(e.message);return false;}finally{if(token===loadId)stopLoad();}
}
function downloadExecutives(blob,extension,suffix='executives'){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-'+suffix+'.'+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
const exportControls=mountExportMenu(()=>doc.executiveProject),exportsMenu=exportControls.menu;
function exportFailure(message){status(message);let error=$('exportFailure');if(!error){error=document.createElement('p');error.id='exportFailure';error.setAttribute('role','alert');exportsMenu.querySelector('div').append(error);}error.textContent=message;exportsMenu.open=true;}
$('exportExecutivesDwg').onclick=async()=>{if(!$('busy').hidden)return;try{const choice=exportControls.selection();if(!doc.native)return exportFailure('Для сохранения DWG откройте исходный DWG. Текущий DXF можно сохранить верхней кнопкой.');$('exportFailure')?.remove();exportsMenu.open=false;if(choice.whole)$('confirmExport').onclick();else if(!await commitExecutive(choice.project,null,false,null,true))exportFailure($('status').textContent);}catch(e){exportFailure(e.message);}};
$('exportExecutivesPdf').onclick=async()=>{if(!$('busy').hidden)return;let choice;try{choice=exportControls.selection();}catch(e){return status(e.message);}if(drawing.limited)return status('PDF остановлен: превышен предел отображения, часть чертежа не загружена.');exportsMenu.open=false;stopLoad();const token=loadId;$('busy').hidden=false;beginProgress();try{await loadCadFont();const pdf=await executivePdf(doc.executiveProject,drawing.shapes,(i,total)=>{if(token!==loadId)throw Error('Экспорт отменён');progress('PDF: страница '+(i+1)+' из '+total,5+90*i/total);},choice);if(token===loadId){downloadExecutives(pdf,'pdf',choice.whole?'drawing':'executives');status((choice.whole?'PDF всего чертежа скачан.':'PDF скачан: каждая выбранная исполнительная на отдельной странице.')+(drawing.unsupported.length||doc.nativeUnknown?' Внимание: неподдерживаемая редактором геометрия в PDF не отображается.':''));}}catch(e){if(token===loadId)status(e.message);}finally{if(token===loadId)stopLoad();}};
function focusExecutive(sheet){
 if(!sheet)return;
 const [x,y]=sheet.origin,w=420*sheet.paperUnit,h=297*sheet.paperUnit;
 view.s=Math.max(.000001,Math.min((width-40)/w,(height-40)/h));
 view.x=width/2-(x+w/2)*view.s;view.y=height/2+(y+h/2)*view.s;draw();
}
executiveUI=mountExecutiveUI({
 consumeNewSelection:()=>{doc.records=doc.records.filter(r=>r.id!==selected);doc.entities=doc.entities.filter(r=>r.id!==selected);selected=null;},selectionPaths,getDoc:()=>doc,setDoc:next=>{doc=next;},snapshot,changed,status,lastStatus:()=>$('status').textContent,setTool,draw,commit:commitExecutive,focus:focusExecutive,shapes:()=>drawing.shapes,
 metresPerUnit:()=>$('units').value==='1'?null:$('units').value==='m'?1:Number($('units').value),
 checkpoint,previewRotation:()=>focusExecutive(executiveUI.sheet()),busy:()=>!$('busy').hidden
});
rebuild();
const objectButton=document.createElement('button');objectButton.title='Выбор · Escape';objectButton.setAttribute('aria-label','Выбор · Escape');objectButton.className='drawingIcon';objectButton.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 3l14 10-7 1-3 7z"/></svg>';objectButton.dataset.tool='object';objectButton.onclick=()=>setTool('object');document.querySelector('nav').prepend(objectButton);document.querySelector('[data-tool="select"]').remove();setTool('object');
const copyButton=document.createElement('button'),pasteButton=document.createElement('button');copyButton.textContent='Копировать';pasteButton.textContent='Вставить';document.querySelector('nav').append(copyButton,pasteButton);
copyButton.onclick=()=>{if(selectedChain?.anchor===selected)return status("Копирование составной кабельной линии пока недоступно. Для копирования прибора выберите «Прибор».");const r=current();if(!doc.native||!r||!/^dwg-/.test(r.id)||!['LINE','LWPOLYLINE','ARC','CIRCLE','TEXT','MTEXT','INSERT'].includes(r.type))return status('Выберите исходный CAD-объект: прибор, линию, полилинию, дугу или текст. Новые объекты сначала сохраните в DWG.');const shapes=selectedShapes();let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const s of shapes)for(const p of s.pts){a=Math.min(a,p[0]);b=Math.min(b,p[1]);c=Math.max(c,p[0]);d=Math.max(d,p[1]);}if(!Number.isFinite(a))return;clipboard={handle:get(r,5),matrix:selectedMatrix||[1,0,0,1,0,0],centre:[(a+c)/2,(b+d)/2],file:sourceFile};status('Объект скопирован. Нажмите «Вставить» и укажите место в исполнительной.');};
pasteButton.onclick=()=>{if(!clipboard)return status('Сначала скопируйте объект');setTool('paste');status('Укажите центр копии в выбранной исполнительной. Исходный объект останется на месте.');};
$('historyButton').onclick=async()=>{try{await recoveryQueue.catch(()=>{});const rows=await recovery.list(),list=$('recoveryList');list.replaceChildren();for(const row of rows){const button=document.createElement('button');button.textContent=row.name+' · '+new Date(row.time).toLocaleString()+' · '+row.label;button.onclick=async()=>{if(!$('busy').hidden)return;if(dirty&&!confirm('Восстановить эту версию? Текущие правки останутся в истории.'))return;try{await checkpoint('Перед восстановлением');const file=await recovery.source(row.sourceId);if(!file)throw Error('Исходный файл не найден');$('recoveryDialog').close();await openFile(file,await recovery.revision(row.id));}catch(e){status(e.message);}};list.append(button);}if(!rows.length)list.textContent='Сохранённых версий пока нет.';$('recoveryDialog').showModal();}catch(e){status('История недоступна: '+e.message);}};
recovery.list().then(rows=>{if(rows.length)$('autosaveStatus').textContent='Есть сохранённая работа — откройте «История / восстановить»';}).catch(e=>{$('autosaveStatus').textContent='Локальное сохранение недоступно: '+e.message;});

function editTargets(removing=false){
 if(!selected)throw Error('Выберите объект на чертеже');
 if(!selectedChain){if(!current()||!(editable(current())||((removing?current().type==='SPLINE':movableSpline(current()))&&selected!==sharedSelectedId)))throw Error('Общая геометрия блока недоступна для независимого редактирования');return [{id:selected,matrix:selectedMatrix}];}
 const shapes=drawing.shapes.filter(s=>selectedChain.keys.has(s.entityKey)),ids=new Set(shapes.map(s=>s.entityId||s.id));
 if(drawing.shapes.some(s=>ids.has(s.entityId||s.id)&&!selectedChain.keys.has(s.entityKey)))throw Error('Линия входит в несколько экземпляров блока; независимое редактирование недоступно');
 return [...ids].map(id=>({id,matrix:shapes.find(s=>(s.entityId||s.id)===id).entityMatrix}));
}
function applyObjectEdit(options){
 const targets=editTargets(!!options.remove);snapshot();try{editObjects(doc,targets,options);if(options.delta){const ids=new Set(targets.map(t=>t.id));for(const s of doc.executiveProject?.sheets||[])for(const r of s.routes)if(r.sourceIds?.every(id=>ids.has(id)))for(const l of r.leaders)for(const key of ['anchor','elbow','label'])l[key]=l[key].map((v,i)=>v+options.delta[i]);}if(options.remove){selected=null;selectedChain=null;}changed();}catch(e){history.pop();syncUndo();throw e;}
}
let workCopy=null,handleCache;
leaderWorkbench=mountLeaderWorkbench({project:()=>doc.executiveProject,screen,world,draw,status,busy:()=>!$('busy').hidden,selecting:()=>tool==='object'&&!cableWorkbench?.exclusive(),clearCableSelection:()=>{selected=null;selectedChain=null;selectedShapeKey=null;selectedMatrix=null;sharedSelectedId=null;cached=null;},edit:(ref,values)=>executiveUI.editLeader(ref.sheetId,ref.routeId,ref.id,values)});
function nativeHandles(){
 if(handleCache?.drawing===drawing&&handleCache.selected===selected&&handleCache.chain===selectedChain&&handleCache.key===selectedShapeKey&&handleCache.device===pickedDevice)return handleCache.handles;
 let handles=[];if(selected)try{handles=editTargets(true).flatMap(t=>splineControls(recordById(t.id),t.matrix||[1,0,0,1,0,0]));}catch{}
 handleCache={device:pickedDevice,drawing,selected,chain:selectedChain,key:selectedShapeKey,handles};return handles;
}
const workRoute=()=>{if(selectedChain?.manual)return null;const r=executiveUI.route();return selected&&current()?.routeId!==r?.id&&!r?.sourceIds?.includes(selected)?null:r;};
let capabilityCache;
function selectionCapabilities(){
 const r=workRoute(),s=executiveUI.sheet(),key=[drawing,selected,pickedDevice,selectedChain,selectedShapeKey,r,s];
 if(capabilityCache?.key.every((v,i)=>v===key[i]))return capabilityCache.value;
 let value={};
 if(r&&!r.sourceIds)value={move:true,copy:true,remove:true,cut:true,leader:true,color:true};
 else if(selected)try{
  const targets=editTargets(true),records=targets.map(t=>recordById(t.id)),notSheet=records.every(r=>r&&!doc.executiveProject?.sheets.some(s=>s.nativeHandles.includes(get(r,5))));
  const move=notSheet&&records.every(r=>(['LINE','LWPOLYLINE','ARC','CIRCLE','TEXT','MTEXT','INSERT'].includes(r.type)||movableSpline(r))&&!num(r,210)&&!num(r,220)&&num(r,230,1)===1);
  const remove=notSheet&&records.every(r=>['LINE','LWPOLYLINE','ARC','CIRCLE','TEXT','SPLINE','INSERT'].includes(r.type));
  const info=selectionPaths(),leader=!!s&&!info.shared&&!!info.paths.length&&info.roots.every(id=>s.nativeHandles.includes(id.replace('dwg-','')));
  value={move,remove,color:move,copy:move&&!!s&&!!doc.native&&targets.every(t=>t.id.startsWith('dwg-')),cut:move&&!!s&&records.every(r=>['LINE','ARC','CIRCLE','LWPOLYLINE','SPLINE'].includes(r.type)),leader:!!r||leader,rotate:move&&records.length===1&&records[0].type==='INSERT'&&!num(records[0],66)};
 }catch{}
 if(r)value.leader=true;
 capabilityCache={key,value};return value;
}
cableWorkbench=mountCableWorkbench({
 routes:()=>executiveUI.sheet()?.routes||[],sheetId:()=>executiveUI.sheet()?.id||'',
 focusCable:ids=>{const r=workRoute(),paths=ids?(executiveUI.sheet()?.routes||[]).filter(r=>ids.includes(r.id)).flatMap(r=>r.paths||[r.points]):r?(r.paths||[r.points]):selectionPaths().paths,pts=paths.flat();if(!pts.length)return;let x=Infinity,y=Infinity,X=-Infinity,Y=-Infinity;for(const p of pts){x=Math.min(x,p[0]);y=Math.min(y,p[1]);X=Math.max(X,p[0]);Y=Math.max(Y,p[1]);}const available=Math.max(160,width-320),scale=Math.min(available*.75/Math.max(X-x,1),height*.65/Math.max(Y-y,1));view={s:scale,x:available/2-(x+X)*scale/2,y:height/2+(y+Y)*scale/2};cached=null;draw();},
 canRefine:()=>!!selectedChain,refine:refineSelection,
 capabilities:selectionCapabilities,shapes:()=>drawing?.shapes,
 busy:()=>!$('busy').hidden,draw,status,world,screen,route:()=>workRoute(),beginCable:()=>executiveUI.beginCable(),selecting:()=>!leaderWorkbench?.active()&&['object','device'].includes(tool),drawing:()=>['line','poly3'].includes(tool)||(tool==='executive'&&['route','route3','straight','broken'].includes(executiveUI.preview().mode)),
 hasSelection:()=>!!selected,selectionKey:()=>selected||'',colorValue:()=>{const r=current(),c=r?num(r,62):0;return c>=1&&c<=8?c:0;},
 paths:()=>{const r=workRoute();return r?(r.paths||[r.points]):selectionPaths().paths;},
 length:paths=>{const r=workRoute();return paths?lengthLabel(paths):r?`${r.brand||'Без марки'} ${r.section||'Без сечения'} · ${lengthLabel(r.paths||[r.points])}${r.extraMetres?' + '+r.extraMetres+' м запас':''}`:selected?lengthLabel(selectionPaths().paths):'Выберите кабель или прибор';},
 move:delta=>{const r=workRoute();if(r&&!r.sourceIds)executiveUI.moveRoute(delta);else applyObjectEdit({delta});},
 nodes:controls=>executiveUI.editRoute(r=>{if(r.controls)r.controls=controls;r.points=cableCurve(controls,r.smooth);}),
 cut:(a,b)=>executiveUI.cutRoute(a,b),
 leaderAt:(p,elbow,label)=>executiveUI.beginLeaderAt(p,elbow,label),
 leaderNode:(id,key,point)=>executiveUI.editRoute(r=>{const leader=r.leaders.find(l=>l.id===id);if(!leader||!['label','elbow'].includes(key))throw Error('Выноска не найдена');leader[key]=point;}),
 isDevice:()=>current()?.type==='INSERT',
 rotate:()=>{const targets=editTargets(),r=current();if(targets.length!==1||r?.type!=='INSERT')throw Error('Выберите прибор');if(num(r,66))throw Error('Поворот прибора с атрибутами пока недоступен');const angle=num(r,50)+90;snapshot();set(r,50,angle);doc.nativeOps.push({handle:get(r,5),dx:0,dy:0,angle:angle*Math.PI/180});changed();},
 nativeHandles,
 nativePreview:(h,p)=>previewSpline(recordById(h.id),h,p),
 nativeNode:(h,p)=>{editTargets(true);const [a,b,c,d,e,f]=h.matrix,det=a*d-b*c;if(Math.abs(det)<1e-12)throw Error('Вырожденный масштаб');const x=(d*(p[0]-e)-c*(p[1]-f))/det,y=(-b*(p[0]-e)+a*(p[1]-f))/det,r=doc.records.find(r=>r.id===h.id);snapshot();setSplineControl(r,h.index,x,y);doc.nativeOps.push({handle:get(r,5),dx:0,dy:0,node:{index:h.index,x,y}});changed();},
 convert:()=>{const s=executiveUI.sheet();if(!s)throw Error('Выберите исполнительную');const targets=editTargets(),points=joinCablePaths(selectionPaths().paths),previous=workRoute();if(points.length>10000)throw Error('Слишком много точек для правки формы');const next=structuredClone(doc.executiveProject),id=crypto.randomUUID();const route=addRoute(next,s.id,{id,points,brand:previous?.brand||$('exBrand').value,section:previous?.section||$('exSection').value,color:previous?.color||7,extraMetres:previous?.extraMetres||0});route.leaders=structuredClone(previous?.leaders||[]);const ids=new Set(targets.map(t=>t.id));for(const sheet of next.sheets)sheet.routes=sheet.routes.filter(r=>!r.sourceIds?.some(id=>ids.has(id)));snapshot();editObjects(doc,targets,{remove:true});doc.executiveProject=next;selected=null;selectedChain=null;changed();executiveUI.selectRoute(id);},
 color:color=>{const r=workRoute();if(r&&!r.sourceIds)executiveUI.editRoute(r=>{r.color=color;delete r.rgb;});else{applyObjectEdit({color});if(r)executiveUI.editRoute(r=>{r.color=color;delete r.rgb;});}},
 remove:()=>{const r=workRoute();if(r&&!r.sourceIds)executiveUI.removeRoute();else applyObjectEdit({remove:true});},
 copy:()=>{const r=workRoute();if(r&&!r.sourceIds){workCopy={route:structuredClone(r),file:sourceFile};return;}
  const targets=editTargets(),paths=selectionPaths().paths,pts=paths.flat();if(!pts.length)throw Error('Нет геометрии');const centre=[0,1].map(k=>pts.reduce((n,p)=>n+p[k],0)/pts.length);
  if(targets.some(t=>!/^dwg-/.test(t.id)))throw Error('Сначала назначьте новой линии кабель');workCopy={targets,centre,file:sourceFile};},
 paste:async position=>{if(!workCopy||workCopy.file!==sourceFile)throw Error('Скопируйте объект из текущего файла');const sheet=executiveUI.sheet();if(!sheet)throw Error('Выберите исполнительную');
  if(workCopy.route){const r=structuredClone(workCopy.route),delta=position.map((v,i)=>v-r.points[0][i]);r.id=crypto.randomUUID();r.sheetId=sheet.id;r.metresPerUnit=sheet.metresPerUnit;r.points=r.points.map(p=>p.map((v,i)=>v+delta[i]));if(r.controls)r.controls=r.controls.map(p=>p.map((v,i)=>v+delta[i]));r.leaders=r.leaders.map(l=>({...l,id:crypto.randomUUID(),...Object.fromEntries(['anchor','elbow','label'].map(k=>[k,l[k].map((v,i)=>v+delta[i])]))}));snapshot();sheet.routes.push(r);changed();executiveUI.selectRoute(r.id);return;}
  const requests=workCopy.targets.map(t=>({handle:t.id.replace('dwg-',''),parent:sheet.nativeHandles[0],transform:copyTransform(doc,sheet,t.matrix||[1,0,0,1,0,0],workCopy.centre,position)}));
  if(await commitExecutive(doc.executiveProject,null,false,requests))status('Независимая копия объекта вставлена и сохранена локально.');
 }
});
copyButton.onclick=()=>$('cwCopy').click();pasteButton.onclick=()=>$('cwPaste').click();
const cableDrawButton=$('cwDraw');document.querySelector('nav').insertBefore(cableDrawButton,document.querySelector('[data-tool="line"]'));
copyButton.remove();pasteButton.remove();
$('delete').onclick=()=>$('cwDelete').click();
document.querySelector('[data-tool="line"]').onclick=()=>{if(executiveUI.sheet())executiveUI.beginCable('straight');else setTool('line');};
document.querySelector('[data-tool="poly3"]').onclick=()=>{if(executiveUI.sheet())executiveUI.beginCable('broken');else setTool('poly3');};
for(const [button,label,path]of [[cableDrawButton,'Плавный кабель · 3 точки','M3 19Q7 1 21 5'],[document.querySelector('[data-tool="line"]'),'Прямая · 2 точки','M3 19L21 5'],[document.querySelector('[data-tool="poly3"]'),'Полилиния · 3 точки','M3 19L10 5L21 13']]){button.title=label;button.setAttribute('aria-label',label);button.classList.add('drawingIcon');button.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="${path}"/><circle cx="3" cy="19" r="2"/></svg>`;}
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||!$('busy').hidden)return;if((e.ctrlKey||e.metaKey)&&['c','v'].includes(e.key.toLowerCase())){e.preventDefault();$(e.key.toLowerCase()==='c'?'cwCopy':'cwPaste').click();}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();if(leaderWorkbench?.active())leaderWorkbench.remove();else $('cwDelete').click();}});
import('./workspace.mjs?v=0.17.21').then(()=>import('./onboarding.mjs?v=0.17.21')).then(({mountOnboarding})=>mountOnboarding());
