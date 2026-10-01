// SPDX-License-Identifier: GPL-3.0-or-later
import {parseDxfAsync,scene,sceneAsync,serializeChunks,cloneDoc,demo,get,num,set,decode,move,addEntity} from './cad.mjs?v=0.17.54';
import {paintShapes,paintShapeSteps,previewTransform} from './renderer.mjs?v=0.17.54';
import {renderTask} from './render-task.mjs?v=0.17.54';
import {nativeTransferReceiver} from './native-transfer.mjs?v=0.17.54';
import {reusableScene,mergeReusedScene} from './scene-reuse.mjs?v=0.17.54';
import {updatedRootScene} from './root-scene.mjs?v=0.17.54';
import {translatedScene,translatedDeviceScene} from './scene-translation.mjs?v=0.17.54';
import {captureView,restoreView,releaseObsoleteViews} from './view-history.mjs?v=0.17.54';
import {socketLabels,clearSocketLabels} from './socket-labels.mjs?v=0.17.54';
import {paintLength} from './length-overlay.mjs?v=0.17.54';
import {mountTitleWorkbench} from './title-workbench.mjs?v=0.17.54';
import {dimensionDefinition,planDimensionEdit,applyDimensionPlan} from './dimension-edit.mjs';
import {mountDimensionWorkbench} from './dimension-workbench.mjs';
import {sourceCableLengths} from './source-cable-lengths.mjs?v=0.17.54';
import {repaintDamage} from './damage-preview.mjs?v=0.17.54';
import {loadCadFont} from './fonts.mjs?v=0.17.54';
import {shxCatalog} from './shx-catalog.mjs?v=0.17.54';
import {applyDocumentFont} from './document-font.mjs?v=0.17.54';
import {clampProgress,warningText} from './progress.mjs?v=0.17.54';
import {isNew,additions} from './authoring.mjs?v=0.17.54';
import {mountExecutiveUI} from './executive-ui.mjs?v=0.17.54';
import {captureRecovery,replayRecovery,recoveryStore} from './recovery.mjs?v=0.17.54';
import {shapePaths,pathLength,syncLinkedRoutes} from './selection-metrics.mjs?v=0.17.54';
import {prepareNewCopies} from './new-object-copy.mjs?v=0.17.54';
import {prepareDeferredCopy,addDeferredCopy} from './deferred-copy.mjs?v=0.17.54';
import {cableChain} from './cable-chain.mjs?v=0.17.54';
import {executivePdf,executiveLooseRoots} from './executive-export.mjs?v=0.17.54';
import {selectionSubset,toggleSelectionPart,canRefinePart} from './selection-subset.mjs?v=0.17.54';
import {drawingPreset,presetPairs,presetColor,extendDrawingPalette} from './drawing-presets.mjs?v=0.17.54';
import {deviceInstances,wholeDevice} from './device-selection.mjs?v=0.17.54';
import {mountExportMenu} from './export-menu.mjs?v=0.17.54';
import {spatialIndex,viewportShapes,deriveSpatialIndex} from './spatial-index.mjs?v=0.17.54';
import {RASTER_THRESHOLD,canvasResolution} from './render-policy.mjs?v=0.17.54';
import {areaDrag} from './area-drag.mjs?v=0.17.54';
import {boxedObjects,mountBoxSelection} from './box-selection.mjs?v=0.17.54';
let boxSelection;
let executiveUI;
let titleWorkbench;
let dimensionWorkbench;
let pendingDimensionLink=null;
let rejectWorker=null;
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let doc=demo(),view={x:0,y:0,s:1},drawing,selected=null,hidden=new Set(),tool='object',draft=null,history=[],future=[],dirty=false,name='demo',worker=null,loadTimer=null,loadId=0;
let width=1,height=1,pointers=new Map(),gesture=null,sourceFile=null;
let polyPoints=[],selectedMatrix=null,selectedShapeKey=null,sharedSelectedId=null,pickedDevice=null;
let draftHover=null,selectedChain=null;
let lengthVisibility;
let sourceLengthsCache,sourceLengthsJob=0;
function refreshSourceLengths(){
 const key=[drawing,doc.executiveProject,[...hidden].join('\0')];
 if(sourceLengthsCache?.key.every((v,i)=>v===key[i]))return;
 const token=++sourceLengthsJob,cache=sourceLengthsCache={key,rows:[]};
 if(deviceCache?.drawing!==drawing)deviceCache={drawing,instances:deviceInstances(doc)};
 const iterator=sourceCableLengths(drawing.shapes,{routes:doc.executiveProject?.sheets.flatMap(s=>s.routes)||[],devices:deviceCache.instances,hidden:new Set(hidden),cooperative:true});
 function batch(){if(token!==sourceLengthsJob||!$('showCableLengths')?.checked)return;const start=performance.now();let next;do{next=iterator.next();if(!next.done&&next.value)cache.rows.push(next.value);}while(!next.done&&performance.now()-start<4);cache.done=next.done;draw();if(!next.done)setTimeout(batch,0);}
 setTimeout(batch,0);
}
const renderSelection=()=>pickedDevice?.id===selected?new Set(selectedShapes().map(s=>s.entityKey)):selectedChain?.anchor===selected?selectedChain.keys:selectedShapeKey?.includes('|'+selected+'|')?selectedShapeKey:selected;
import {aciColors as colors} from './colors.mjs?v=0.17.54';
import {mountCableWorkbench} from './cable-workbench.mjs?v=0.17.54';
import {mountLeaderWorkbench} from './leader-workbench.mjs?v=0.17.54';
import {editObjects} from './object-edit.mjs?v=0.17.54';
import {cableCurve,joinCablePaths} from './cable-edit.mjs?v=0.17.54';
import {addRoute} from './executive-project.mjs?v=0.17.54';
import {splineControls,setSplineControl,movableSpline,previewSpline} from './control-edit.mjs?v=0.17.54';
import {entityControls,setEntityVertex,previewEntity} from './control-edit.mjs?v=0.17.54';
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
function recordById(id){if(recordIndex?.records!==doc.records||recordIndex.length!==doc.records.length){const map=new Map(),attributes=new Map();let header;for(const r of doc.records){map.set(r.id,r);if(r.type==='ATTRIB'){const owner=get(r,330);if(!attributes.has(owner))attributes.set(owner,[]);attributes.get(owner).push(r);}else if(r.type==='SECTION'&&get(r,2)==='HEADER')header=r;}recordIndex={records:doc.records,length:doc.records.length,map,attributes,header};}return recordIndex.map.get(id);}
function current(){return recordById(selected);}
function sameDevice(s){return s.deviceId===pickedDevice.id&&s.id===pickedDevice.root&&String(s.deviceMatrix)===pickedDevice.matrix;}
let selectedShapeCache,deviceCache,overlayCache;
function selectedShapes(){if(!selected)return [];const key=[drawing,selected,pickedDevice,selectedChain,selectedShapeKey];if(selectedShapeCache?.key.every((v,i)=>v===key[i]))return selectedShapeCache.shapes;const shapes=drawing.shapes.filter(s=>pickedDevice?.id===selected?sameDevice(s):selectedChain?.anchor===selected?selectedChain.measureKeys.has(s.entityKey):selectedShapeKey?s.entityKey===selectedShapeKey:s.deviceId===selected||s.entityId===selected||s.id===selected);selectedShapeCache={key,shapes};return shapes;}
function selectedOverlay(){const key=[drawing,selected,pickedDevice,selectedChain,selectedShapeKey];if(overlayCache?.key.every((v,i)=>v===key[i]))return overlayCache;const selection=renderSelection(),shapes=!selected?[]:selection instanceof Set?drawing.shapes.filter(s=>selection.has(s.entityKey)):selectedShapes();return overlayCache={key,selection,shapes};}
let selectionCache;
function selectionPaths(){
 if(!selected)return {paths:[],ids:[],allIds:[],coincident:0,roots:[],shared:false};
 if(selectionCache?.drawing===drawing&&selectionCache.selected===selected&&selectionCache.chain===selectedChain&&selectionCache.key===selectedShapeKey&&selectionCache.device===pickedDevice)return selectionCache.value;
 const shapes=selectedShapes(),counts=new Map(),chain=selectedChain?.anchor===selected?selectedChain:null,allIds=new Set();
 for(const s of shapes){const id=s.entityId||s.id;counts.set(id,(counts.get(id)||0)+1);allIds.add(id);}
 for(const s of drawing.shapes){const id=s.entityId||s.id;if(counts.has(id))counts.set(id,counts.get(id)-1);if(chain?.keys.has(s.entityKey))allIds.add(id);}
 const value={paths:chain?.paths||shapePaths(shapes),ids:[...counts.keys()],allIds:[...allIds],coincident:chain?.coincident||0,roots:[...new Set(shapes.map(s=>s.id))],shared:[...counts.values()].some(n=>n<0)};
 selectionCache={device:pickedDevice,drawing,selected,chain:selectedChain,key:selectedShapeKey,value};return value;
}
function lengthLabel(paths){const u=$('units').value,f=u==='m'?1:Number(u);return 'Длина ≈ '+(pathLength(paths)*f).toLocaleString('ru-RU',{maximumFractionDigits:3})+(u==='1'?' ед.':' м');}
function rebuild(kind='geometry'){
 const generated=new Set(doc.executiveProject?.generatedHandles||[]),decorationChanged=executiveUI?.rebuild();
 for(const s of doc.executiveProject?.sheets||[]){const r=doc.entities.find(r=>get(r,5)===s.nativeHandles[0]);if(r)set(r,50,s.angle*180/Math.PI);}
 if(kind==='decoration'&&drawing){
  if(decorationChanged&&(generated.size||doc.executiveProject?.sheets.length)){
  const previous=drawing.shapes,removed=new Set(),base=previous.filter(s=>{const keep=!s.id.startsWith('executive-')&&!generated.has(s.id.replace('dwg-',''));if(!keep)removed.add(s);return keep;});
  const added=scene({...doc,entities:doc.entities.filter(r=>r.id.startsWith('executive-'))}).shapes;
  if(removed.size||added.length){drawing={...drawing,shapes:base.concat(added)};deriveSpatialIndex(previous,drawing.shapes,removed,added);}
  }
 }else drawing=scene(doc);
 if(drawing.shapes.length>RASTER_THRESHOLD){spatialIndex(drawing.shapes);deviceCache={drawing,instances:deviceInstances(doc)};recordById(null);}
 if(drawing.limited)status('Предел отображения: 3 000 000 записей. Часть чертежа не показана.');$('report').textContent=drawing.shapes.length+' видимых примитивов. Не отображаются: '+(drawing.unsupported.map(([t,n])=>t+' × '+n).join(', ')||'нет известных пропусков')+(doc.nativeUnknown?' · не разобрано движком: '+doc.nativeUnknown:'')+(drawing.limited?' · достигнут предел объёма':'')+'. Только пространство модели.';renderLayers();properties();draw();
}
function setLayerVisible(layer,visible){
 const record=doc.records.find(r=>r.type==='LAYER'&&get(r,2)===layer);
 if(!record){status('Слой не найден в таблице DWG');return;}
 snapshot([record]);const color=Math.abs(num(record,62,7))||7;set(record,62,visible?color:-color);doc.layers.get(layer).color=visible?color:-color;
 if(doc.native)doc.nativeOps.push({handle:get(record,5),dx:0,dy:0,layerOff:!visible});visible?hidden.delete(layer):hidden.add(layer);if(!visible){selected=null;selectedChain=null;pickedDevice=null;}dirty=true;cached=null;renderLayers();draw();checkpoint('Видимость слоя').catch(()=>{});
}
let renderedLayerSignature;
function renderLayers(){const names=doc.layers.size?[...doc.layers.keys()].sort():[...new Set(drawing.shapes.map(s=>s.layer))].sort(),signature=JSON.stringify(names.map(name=>[name,hidden.has(name)]));if(signature===renderedLayerSignature)return;renderedLayerSignature=signature;$('layers').replaceChildren();for(const layer of names){const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.checked=!hidden.has(layer);i.onchange=()=>setLayerVisible(layer,i.checked);l.append(i,document.createTextNode(decode(layer)));$('layers').append(l);}}
const editable=r=>r.id!==sharedSelectedId&&!r.id.startsWith('executive-')&&['LINE','LWPOLYLINE','CIRCLE','ARC','TEXT','MTEXT','INSERT'].includes(r.type)&&!num(r,210)&&!num(r,220)&&num(r,230,1)===1;
const deletable=r=>(editable(r)||(r.type==='SPLINE'&&r.id!==sharedSelectedId))&&r.type!=='MTEXT'&&!doc.executiveProject?.sheets.some(s=>s.nativeHandles.includes(get(r,5)));
function properties(){const r=current();$('props').hidden=!r;$('selection').textContent=r?r.type+' · '+(get(r,5)||r.id)+(editable(r)?'':' · только просмотр'):'Нажмите на объект на чертеже.';if(r){$('layer').value=decode(get(r,8,'0'));$('text').value=r.type==='TEXT'?decode(get(r,1)):'';$('text').disabled=r.type!=='TEXT'||!editable(r);$('dx').value=0;$('dy').value=0;$('props').querySelector('button[type=submit]').disabled=!editable(r);$('delete').disabled=!deletable(r);}}
function changed(kind='geometry',prepared=null){dirty=true;$('filename').textContent=name+' · изменён';checkpoint().catch(()=>{});if(prepared)drawing=prepared;rebuild(prepared?'decoration':kind);if(kind==='geometry'&&selectedChain){const seed=drawing.shapes.find(s=>selectedChain.measureKeys.has(s.entityKey));if(seed){if(selectedChain.manual)selectedChain={...selectionSubset(drawing.shapes,selectedChain.keys,selectedChain.universe),anchor:selected};else{const chain=cableChain(drawing.shapes,seed,hidden);selectedChain={anchor:selected,keys:new Set([...chain,...chain.coincident||[]].map(s=>s.entityKey)),measureKeys:new Set(chain.map(s=>s.entityKey)),paths:chain.paths,overlaps:chain.overlaps,coincident:chain.coincident?.length||0};}}else selectedChain=null;}if(kind==='geometry'&&syncLinkedRoutes(doc.executiveProject,drawing.shapes)){rebuild('decoration');checkpoint('Обновление длин').catch(()=>{});}}
// A new independent model-space entity cannot change existing block geometry.
// Keep the immutable scene for history and append only the new entity's shapes.
function addedEntity(record){
 const before=drawing,oldCache=cached,added=scene({...doc,entities:[record]}).shapes;
 drawing={...before,shapes:before.shapes.concat(added)};
 deriveSpatialIndex(before.shapes,drawing.shapes,new Set(),added);
 extendDrawingPalette(before.shapes,drawing.shapes,added);
 selectedShapeCache={key:[drawing,selected,pickedDevice,selectedChain,selectedShapeKey],shapes:added};
 selectionCache={device:pickedDevice,drawing,selected,chain:selectedChain,key:selectedShapeKey,value:{paths:shapePaths(added),ids:[record.id],allIds:[record.id],coincident:0,roots:[record.id],shared:false}};
 if(recordIndex?.records===doc.records)recordIndex.map.set(record.id,record);
 if(deviceCache?.drawing===before)deviceCache={...deviceCache,drawing};
 const saved=history.at(-1);if(saved?.viewState)saved.viewState.damage=added;
 if(oldCache?.drawing===before&&oldCache.hiddenKey===[...hidden].join('\0')&&preview.width===canvas.width&&preview.height===canvas.height&&repaintDamage(previewContext,drawing.shapes,added,{view:oldCache.view,width,height,hidden,colors}))cached={...oldCache,drawing};
 dirty=true;$('filename').textContent=name+' · изменён';checkpoint().catch(()=>{});properties();draw();
}
function snapshot(records=[]){
 if(doc.native){
  const changed=new Set([...records,current()].filter(Boolean));
  for(const sheet of doc.executiveProject?.sheets||[]){const r=recordById('dwg-'+sheet.nativeHandles[0]);if(r)changed.add(r);}
  const owners=new Set([...changed].filter(r=>r.type==='INSERT').map(r=>get(r,5)));
  for(const owner of owners)for(const r of recordIndex.attributes.get(owner)||[])changed.add(r);
  if(recordIndex.header)changed.add(recordIndex.header);
  history.push({viewState:captureView(doc,drawing,[...changed]),file:sourceFile,name,recovery:captureRecovery(doc)});
 }else history.push(remember());
 while(history.length>(doc.records.length>200000?5:15))history.shift();future=[];syncUndo();
}
function syncUndo(){history=releaseObsoleteViews(history,doc);future=releaseObsoleteViews(future,doc);$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
async function undo(redo=false){if(!$('busy').hidden)return;const src=redo?future:history,dest=redo?history:future;if(!src.length)return;pendingDimensionLink=null;const saved=src.at(-1),oldHistory=history,oldFuture=future;
 boxSelection?.reset();
 if(saved.viewState?.doc===doc&&saved.file===sourceFile){
  const oldCache=cached,before=drawing;
  const redoState={viewState:captureView(doc,drawing,saved.viewState.patches.map(([r])=>r)),file:sourceFile,name,recovery:captureRecovery(doc)};
  redoState.viewState.damage=saved.viewState.damage;
  drawing=restoreView(saved.viewState);hidden=new Set([...doc.layers].filter(([,l])=>l.color<0).map(([n])=>n));selected=null;selectedChain=null;pickedDevice=null;selectedShapeKey=null;recordIndex=null;
  rebuild('decoration');if(drawing===saved.viewState.drawing&&saved.viewState.damage&&oldCache?.drawing===before&&oldCache.hiddenKey===[...hidden].join('\0')&&preview.width===canvas.width&&preview.height===canvas.height&&repaintDamage(previewContext,drawing.shapes,saved.viewState.damage,{view:oldCache.view,width,height,hidden,colors}))cached={...oldCache,drawing};src.pop();dest.push(redoState);dirty=true;syncUndo();checkpoint(redo?'Вперёд':'Назад').catch(()=>{});return;
 }
 const current=remember();
 if(saved.recovery){if(!await openFile(saved.file,{state:saved.recovery,name:saved.name}))return;history=oldHistory;future=oldFuture;}else{doc=saved;sourceFile=doc.sourceFile||sourceFile;rebuild();}
 src.pop();dest.push(current);selected=null;dirty=true;checkpoint(redo?'Повтор':'Отмена').catch(()=>{});syncUndo();}
function fit(){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const s of drawing.shapes){if(hidden.has(s.layer))continue;for(const p of s.pts){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}}if(!Number.isFinite(minX)){status('Нет поддерживаемых видимых объектов. Исходный файл не изменён.');return;}
 view.s=Math.min((width-60)/Math.max(maxX-minX,1),(height-80)/Math.max(maxY-minY,1));view.x=width/2-(minX+maxX)/2*view.s;view.y=height/2+(minY+maxY)/2*view.s;draw();}
let pendingFrame=0;
const preview=document.createElement('canvas'),previewContext=preview.getContext('2d');
const raster=document.createElement('canvas'),rasterContext=raster.getContext('2d'),rasterTask=renderTask();
let rasterGeneration=0;
let cached=null,interactionUntil=0,settleTimer;
const shxFonts=shxCatalog({shapes:()=>drawing.shapes,onChange:()=>{rasterGeneration++;rasterTask.stop();cached=null;draw();},status,
 applyDocument:async(font)=>{if(!$('busy').hidden)throw Error('Дождитесь завершения текущей операции');const count=applyDocumentFont(doc,font,snapshot);rebuild();dirty=true;$('filename').textContent=name+' · изменён';await checkpoint('Шрифт документа');return count;},
 styles:()=>doc.records.filter(r=>r.type==='STYLE'&&!get(r,4)).map(r=>({name:get(r,2),font:get(r,3)})),
 applyStyle:async(styleName,font)=>{if(!$('busy').hidden)throw Error('Дождитесь завершения текущей операции');const r=doc.records.find(r=>r.type==='STYLE'&&get(r,2)===styleName);if(!r||get(r,4))throw Error('Стиль с Big Font не поддерживается');if(!/^[^/\\\x00-\x1f]{1,116}\.shx$/i.test(font))throw Error('Выберите загруженный SHX');const style=doc.textStyles.get(styleName);if(!style)throw Error('Стиль не найден');snapshot([r]);set(r,3,font);style.font=font;if(doc.native)(doc.nativeOps||=[]).push({handle:get(r,5),styleFont:font});rebuild();dirty=true;$('filename').textContent=name+' · изменён';await checkpoint('Смена шрифта '+styleName);}
});
loadCadFont().then(()=>{rasterGeneration++;rasterTask.stop();cached=null;draw();}).catch(()=>status('Не удалось загрузить встроенный CAD-шрифт. Проверьте соединение и обновите страницу.'));
function markInteraction(){rasterTask.stop();interactionUntil=performance.now()+160;clearTimeout(settleTimer);settleTimer=setTimeout(()=>{interactionUntil=0;draw();},170);}
function draw(){if(!pendingFrame)pendingFrame=requestAnimationFrame(()=>{pendingFrame=0;paint();});}
document.addEventListener('visibilitychange',()=>{if(document.hidden)rasterTask.stop();else draw();});
function paint(){if(document.hidden||!$('busy').hidden){rasterTask.stop();return;}if(!width||!height||!canvas.width||!canvas.height)return;ctx.clearRect(0,0,width,height);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);if($('grid').getAttribute('aria-pressed')==='true'){ctx.lineWidth=1;ctx.strokeStyle='#e8edf1';for(let x=0;x<width;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}for(let y=0;y<height;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}}
 const large=(drawing?.shapes.length||0)>RASTER_THRESHOLD,hiddenKey=[...hidden].join('\0');
 if(large){
  const valid=cached&&cached.drawing===drawing&&cached.hiddenKey===hiddenKey&&preview.width===canvas.width&&preview.height===canvas.height;
  if(!(valid&&(performance.now()<interactionUntil||(cached.view.x===view.x&&cached.view.y===view.y&&cached.view.s===view.s)))){
   const target={drawing,hiddenKey,view:{...view},w:canvas.width,h:canvas.height,generation:rasterGeneration};
   const same=t=>t&&t.drawing===drawing&&t.hiddenKey===[...hidden].join('\0')&&t.view.x===view.x&&t.view.y===view.y&&t.view.s===view.s&&t.w===canvas.width&&t.h===canvas.height&&t.generation===rasterGeneration;
   if(!same(rasterTask.key)){
    rasterTask.stop();if(raster.width!==canvas.width||raster.height!==canvas.height){raster.width=canvas.width;raster.height=canvas.height;}else{rasterContext.setTransform(1,0,0,1,0,0);rasterContext.clearRect(0,0,raster.width,raster.height);}
    rasterContext.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
    const options={view:target.view,width,height,hidden:new Set(hidden),selected:null,colors};
    rasterTask.start(target,paintShapeSteps(rasterContext,viewportShapes(drawing.shapes,view,width,height),options,matchMedia('(pointer:coarse)').matches?4:8),()=>{
     if(!same(target))return;
     if(preview.width!==target.w||preview.height!==target.h){preview.width=target.w;preview.height=target.h;}else{previewContext.setTransform(1,0,0,1,0,0);previewContext.clearRect(0,0,preview.width,preview.height);}previewContext.drawImage(raster,0,0);previewContext.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
     cached={drawing:target.drawing,hiddenKey:target.hiddenKey,view:target.view};draw();
    },error=>status('Ошибка отрисовки: '+error.message));
   }
  }
  if(cached){const transform=previewTransform(view,cached.view);ctx.save();ctx.translate(transform.x,transform.y);ctx.scale(transform.scale,transform.scale);ctx.drawImage(preview,0,0,width,height);ctx.restore();}const overlay=selectedOverlay();if(overlay.shapes.length)paintShapes(ctx,overlay.shapes,{view,width,height,hidden,selected:overlay.selection,colors});
 }else{rasterTask.stop();cached=null;paintShapes(ctx,drawing?.shapes||[],{view,width,height,hidden,selected:renderSelection(),colors});}
 if(tool==='executive'){const preview=executiveUI?.preview();if(preview?.points.length){let pts=[...preview.points];if(preview.hoverPoint)pts.push(preview.hoverPoint);if(preview.mode==='area'&&pts.length>1){const a=pts[0],b=pts.at(-1);pts=[a,[b[0],a[1]],b,[a[0],b[1]],a];}const cable=['route3','straight','broken'].includes(preview.mode);ctx.save();ctx.strokeStyle=cable?presetColor():'#ffbe6c';ctx.lineWidth=cable?Math.max(1,drawingPreset.lineweight/100*96/25.4):2;ctx.setLineDash(cable?[]:[6,4]);ctx.beginPath();(preview.mode==='route3'?cableCurve(pts):pts).map(screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));if(preview.mode==='area'){ctx.fillStyle='#ffbe6c22';ctx.fill();}ctx.stroke();ctx.restore();}}
 if(draft){const p=screen(draft);ctx.fillStyle='#ffbe6c';ctx.beginPath();ctx.arc(...p,5,0,7);ctx.fill();if(draftHover&&['line','poly3','curve4','measure'].includes(tool)){const pts=cableCurve(['poly3','curve4'].includes(tool)?[...polyPoints,draftHover]:[draft,draftHover],tool==='curve4').map(screen);ctx.save();ctx.strokeStyle=tool==='measure'?'#ffbe6c':presetColor();ctx.lineWidth=tool==='measure'?1:Math.max(1,drawingPreset.lineweight/100*96/25.4);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.restore();}}
 cableWorkbench?.paint(ctx);
 executiveUI?.paintTableEntry();
 titleWorkbench?.paint();
 if(draft&&draftHover&&['line','poly3','curve4'].includes(tool)){const paths=[cableCurve(['poly3','curve4'].includes(tool)?[...polyPoints,draftHover]:[draft,draftHover],tool==='curve4')];paintLength(ctx,paths,lengthLabel(paths),screen,width,height);}
 if(tool==='executive'){const p=executiveUI?.preview();if(p?.points.length&&p.hoverPoint&&['route3','straight','broken','route'].includes(p.mode)){const paths=[cableCurve([...p.points,p.hoverPoint],p.mode==='route3')];paintLength(ctx,paths,lengthLabel(paths),screen,width,height);}}
 leaderWorkbench?.paint(ctx);
 boxSelection?.paint(ctx);
 dimensionWorkbench?.paint(ctx);
 if($('showCableLengths')?.checked){
  refreshSourceLengths();
  const units=$('units').value,factor=units==='m'?1:Number(units);
  for(const row of sourceLengthsCache?.rows||[]){const [x,y]=screen(row.point);if(x<0||y<0||x>width||y>height)continue;const owner=doc.executiveProject?.sheets.find(s=>s.nativeHandles.includes(row.root.replace('dwg-',''))),f=owner?.metresPerUnit||factor,key=f+'|'+!!owner+'|'+units;if(row.labelKey!==key){row.labelKey=key;row.label=(row.length*f).toLocaleString('ru',{maximumFractionDigits:2})+(owner||units!=='1'?' м':' ед.');}paintLength(ctx,[[row.point]],row.label,screen,width,height);}
  if(hidden.size&&(lengthVisibility?.drawing!==drawing||lengthVisibility.hiddenKey!==hiddenKey)){const ids=new Set();for(const s of drawing.shapes)if(!hidden.has(s.layer)){ids.add(s.entityId||s.id);ids.add(s.id);}lengthVisibility={drawing,hiddenKey,ids};}
  for(const sheet of doc.executiveProject?.sheets||[])for(const r of sheet.routes){if(r.sourceIds?hidden.size&&!r.sourceIds.some(id=>lengthVisibility.ids.has(id)):hidden.has('0'))continue;const paths=r.paths||[r.points],length=pathLength(paths)*r.metresPerUnit+(r.extraMetres||0);paintLength(ctx,paths,length.toLocaleString('ru',{maximumFractionDigits:2})+' м',screen,width,height);}
 }
 else if(selected&&['object','device'].includes(tool)&&!pickedDevice)paintLength(ctx,selectionPaths().paths,lengthLabel(selectionPaths().paths),screen,width,height);
}
let dimensionInfoCache;
function selectedDimensionInfo(){
 const r=current(),definition=dimensionDefinition(r);if(!definition||!$('busy').hidden||!['object','select'].includes(tool))return null;
 const key=[drawing,r,selectedMatrix];if(dimensionInfoCache?.key.every((v,i)=>v===key[i]))return dimensionInfoCache.value;
 const matrices=new Set(drawing.shapes.filter(s=>s.entityId===r.id).map(s=>String(s.entityMatrix)));
 const value=matrices.size===1?{id:r.id,definition,matrix:selectedMatrix||[1,0,0,1,0,0]}:null;dimensionInfoCache={key,value};return value;
}
function changeDimension(values){
 if(!selectedDimensionInfo())throw Error('Выберите независимый линейный размер');
 const r=current(),plan=planDimensionEdit(doc,r,values);snapshot(plan.patches.map(p=>p.record));applyDimensionPlan(plan);
 if(doc.native)doc.nativeOps.push({handle:get(r,5),dimension:values});
 changed('geometry',updatedRootScene(doc,drawing,[{id:r.id}]));status('Размер изменён. Сохраните новую копию DWG.');
}
dimensionWorkbench=mountDimensionWorkbench({info:selectedDimensionInfo,apply:changeDimension,world,screen,draw,status,bind:()=>{const info=selectedDimensionInfo(),shape=selectedShapes()[0],sheet=doc.executiveProject?.sheets.find(s=>s.nativeHandles.includes(shape?.id.replace('dwg-','')));if(!info||!sheet)throw Error('Выберите размер внутри исполнительной');if(current().dimensionEndLocked)throw Error('Этот размер уже связан средствами AutoCAD');planDimensionEdit(doc,current(),{length:info.definition.length,offset:info.definition.offset});pendingDimensionLink={dimension:get(current(),5),sheetId:sheet.id,owner:get(current(),330)};status('Теперь выберите розетку: размер будет следовать за её перемещением.');}});
boxSelection=mountBoxSelection({enabled:()=>tool==='box'&&$('busy').hidden,world,screen,draw,status,
 select:box=>{if(deviceCache?.drawing!==drawing)deviceCache={drawing,instances:deviceInstances(doc)};return boxedObjects(drawing.shapes,box,s=>wholeDevice(s,deviceCache.instances)?{id:s.deviceId,matrix:s.deviceMatrix}:{id:s.entityId||s.id,matrix:s.entityMatrix},hidden);},
 paint:(context,shapes)=>paintShapes(context,shapes,{view,width,height,hidden,selected:new Set(shapes.map(s=>s.entityKey)),colors}),
 commit:(groups,delta)=>{
  if(groups.some(g=>g.shared))throw Error('В рамке есть общий элемент повторяющегося блока. Перенос отменён целиком, чтобы не изменить другие экземпляры.');
  if(groups.some(g=>g.id.startsWith('executive-')))throw Error('В рамке есть оформление или созданная трасса исполнительной. Перемещайте их штатным инструментом; групповое перемещение пока доступно для CAD-объектов.');
  const ids=new Set(groups.map(g=>g.id));
  // A linked cable must move as a whole so leader anchors stay meaningful.
  for(const sheet of doc.executiveProject?.sheets||[])for(const route of sheet.routes)if(route.sourceIds?.some(id=>ids.has(id))&&!route.sourceIds.every(id=>ids.has(id)))throw Error('Кабель попал в рамку не целиком. Обведите всю трассу для совместного переноса с выносками.');
  applyObjectEdit({delta},groups.map(g=>({id:g.id,matrix:g.matrix})));status('Перемещено объектов: '+groups.length+'. Назад — отменить перенос.');
 }
});
function zoom(f,p=[width/2,height/2]){const w=world(p),s=Math.max(1e-8,Math.min(1e8,view.s*f));view.s=s;view.x=p[0]-w[0]*s;view.y=p[1]+w[1]*s;markInteraction();draw();}
const distance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);};
function refineSelection(p){
 if(!selectedChain)return status('Сначала выберите кабель. Затем нажимайте участки, чтобы добавить или убрать их из выделения.');
 const seed=drawing.shapes.find(s=>selectedChain.keys.has(s.entityKey)),w=world(p),pad=14/view.s;let hit=null,best=14;
 for(const s of spatialIndex(drawing.shapes).query([w[0]-pad,w[1]-pad,w[0]+pad,w[1]+pad])){if(!canRefinePart(seed,s)||hidden.has(s.layer))continue;const pts=s.pts.map(screen);for(let i=1;i<pts.length;i++){const d=distance(p,pts[i-1],pts[i]);if(d<best){best=d;hit=s;}}}
 if(!hit)return status('Нажмите нужный участок кабеля: невыбранный добавится, выбранный исключится.');
 const next=toggleSelectionPart(drawing.shapes,selectedChain,hit);
 if(!next.keys.size)return status('Это последний участок. Escape снимает весь выбор.');
 const first=drawing.shapes.find(s=>next.measureKeys.has(s.entityKey));selected=first.entityId||first.id;
 selectedChain={...next,anchor:selected};selectedShapeKey=first.entityKey;selectedMatrix=first.entityMatrix;sharedSelectedId=selected;
 executiveUI.selectObject('',[]);properties();draw();
 status('Выбрано: '+next.measureKeys.size+' участков · '+lengthLabel(next.paths)+'. Клик добавляет или исключает участок. Геометрия не изменена.');
}
function pick(p){
 let best=18,id=null,leaf=false,hit=null,whole=false;selectedChain=null;selectedMatrix=null;selectedShapeKey=null;sharedSelectedId=null;
 pickedDevice=null;if(deviceCache?.drawing!==drawing)deviceCache={drawing,instances:deviceInstances(doc)};const devices=deviceCache.instances;
 const roots=new Set((doc.executiveProject?.sheets||[]).flatMap(sheet=>sheet.nativeHandles.map(h=>'dwg-'+h)));
 const w=world(p),pad=18/view.s;
 for(const s of spatialIndex(drawing.shapes).query([w[0]-pad,w[1]-pad,w[0]+pad,w[1]+pad])){
  const executive=roots.has(s.id);
  const pendingCopy=isNew({id:s.id})&&!!recordById(s.id)?.deferredCopy;
  if(tool==='device'&&!wholeDevice(s,devices)&&!pendingCopy)continue;
  const b=s.bounds;if(hidden.has(s.layer)||b[2]<w[0]-pad||b[0]>w[0]+pad||b[3]<w[1]-pad||b[1]>w[1]+pad)continue;
  const pts=s.pts.map(screen);let d=Infinity;
  if(s.text!==null){const a=pts[0];d=distance(p,a,[a[0]+Math.max(10,s.height*view.s*s.text.length*.5),a[1]]);}
  else for(let i=1;i<pts.length;i++)d=Math.min(d,distance(p,pts[i-1],pts[i]));
  if(d<best){hit=s;best=d;whole=!pendingCopy&&recordById(s.entityId)?.type!=='DIMENSION'&&wholeDevice(s,devices);leaf=!whole&&executive&&!!s.entityId;id=whole?s.deviceId:leaf?s.entityId:s.id;selectedMatrix=whole?s.deviceMatrix:leaf?s.entityMatrix:null;selectedShapeKey=leaf?s.entityKey:null;}
 }
 selected=id;
 if(pendingDimensionLink&&current()?.type==='INSERT'){
  const pending=pendingDimensionLink,r=current();pendingDimensionLink=null;
  if(!whole||get(r,330)!==pending.owner){status('Размер и прибор должны находиться в одном блоке исполнительной');draw();return;}
  snapshot();doc.executiveProject=structuredClone(doc.executiveProject);const sheet=doc.executiveProject.sheets.find(s=>s.id===pending.sheetId);
  sheet.dimensionLinks=[...(sheet.dimensionLinks||[]).filter(l=>l.dimension!==pending.dimension),{dimension:pending.dimension,device:get(r,5)}];
  changed('decoration');status('Привязка сохранена: перенос прибора изменяет размер.');return;
 }
 if(whole&&hit){pickedDevice={id,root:hit.id,matrix:String(hit.deviceMatrix)};if(drawing.shapes.some(s=>s.deviceId===id&&!sameDevice(s)))sharedSelectedId=id;}
 if(!selected)executiveUI?.selectObject('',[]);
 if(leaf&&drawing.shapes.filter(s=>s.entityId===id).length>1)sharedSelectedId=id;
 if(tool==='object'&&hit&&!whole&&!current()?.deferredCopy){const chain=cableChain(drawing.shapes,hit,hidden);if(chain.length>=1||chain.coincident?.length){selectedChain={anchor:id,keys:new Set([...chain,...chain.coincident||[]].map(s=>s.entityKey)),measureKeys:new Set(chain.map(s=>s.entityKey)),paths:chain.paths,overlaps:chain.overlaps,coincident:chain.coincident?.length||0};sharedSelectedId=id;}}
 properties();draw();
 if(selected){const info=selectionPaths(),label=lengthLabel(info.paths);status(label);$('selection').textContent+=' · '+label+(info.coincident?' · без совпадающих копий':'');executiveUI.selectObject(selected,info.allIds);}
 if(selectedChain)status('Кабель: '+selectedChain.measureKeys.size+' участков · '+lengthLabel(selectionPaths().paths)+(selectedChain.overlaps?' · стыков с нахлёстом: '+selectedChain.overlaps+' (без двойного метража)':'')+(selectedChain.coincident?' · совпадающих копий: '+selectedChain.coincident+' (длина без повторов)':'')+'. На разветвлении выбор останавливается. Выбирается связанная линия целиком.');
 else if(sharedSelectedId)status('Объект входит в повторяющийся блок. Изменение общей геометрии затронет несколько экземпляров; пока доступен просмотр. Для перемещения прибора используйте «Выбрать прибор».');
}
function setTool(t){pendingDimensionLink=null;boxSelection?.reset();areaSelection.reset();dimensionWorkbench?.cancel();titleWorkbench?.cancel();pickedDevice=null;leaderWorkbench?.cancel();cableWorkbench?.cancel();if(t==='select')t='object';selectedChain=null;draftHover=null;tool=t;draft=null;polyPoints=[];selected=null;selectedMatrix=null;selectedShapeKey=null;sharedSelectedId=null;properties();const areaMode=t==='executive'&&executiveUI?.preview().mode==='area';canvas.style.cursor=areaMode||t==='box'?'crosshair':t==='pan'?'grab':'';$('exCreateIcon')?.setAttribute('aria-pressed',String(areaMode));document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)));$('cwDraw')?.setAttribute('aria-pressed',String(t==='curve4'||t==='executive'&&executiveUI?.preview().mode==='route3'));$('hint').textContent=({box:'Обведите объекты рамкой целиком. Затем потяните внутри выделенной рамки: переместятся объекты, а не вид. Escape — снять выбор.',object:'Нажмите на провод: выбирается вся связанная линия с поворотами, до разветвления. Приборы и другие объекты выбираются целиком.',select:'Нажмите на отдельный объект исполнительной. Перемещение — в свойствах; перетаскивание двигает вид.',pan:'Перетаскивайте чертёж. Масштаб — колесом или двумя пальцами.',executive:'Указывайте точки на чертеже. Настройки и завершение — в панели исполнительных. Escape — отменить.',device:'Нажмите на любой штрих прибора: выбирается весь блок.', curve4:'Плавная линия: начало → два изгиба → конец. Escape — отменить.', poly3:'Укажите четыре точки полилинии. Escape — отменить.',line:'Укажите начало и конец линии. Escape — отменить.',text:'Нажмите в точке вставки текста.',measure:'Укажите две точки. Единицы выбираются в панели справа.'})[t]||'Выберите инструмент.';if(areaMode)$('hint').textContent='Зажмите мышь, обведите план рамкой и отпустите. Escape — отмена.';draw();}
function tap(p){const w=world(p);if(!$('busy').hidden)return;if(tool==='executive'){try{executiveUI.tap(w);}catch(e){status(e.message);}return;}if(tool==='select'||tool==='device'||tool==='object'){pick(p);return;}if(tool==='pan')return;
 if(['poly3','curve4'].includes(tool)){
  polyPoints.push(w);draft=w;draw();
  if(polyPoints.length<4){status('Полилиния: точка '+polyPoints.length+' из 4');return;}
  const points=cableCurve(polyPoints,tool==='curve4');
  snapshot();selected=addEntity(doc,'LWPOLYLINE',[[90,points.length],[70,0],...presetPairs(),...points.flatMap(p=>[[10,p[0]],[20,p[1]]])]).id;
  const length=pathLength([points]);
  polyPoints=[];draft=null;addedEntity(doc.entities.at(-1));status('Полилиния создана · длина '+(length*($('units').value==='m'?1:Number($('units').value))).toFixed(3)+($('units').value==='1'?' ед.':' м'));return;
 }
 if(tool==='text'){const text=prompt('Текст подписи:');if(!text)return;snapshot();const r=addEntity(doc,'TEXT',[[10,w[0]],[20,w[1]],[30,0],[40,18/view.s],[1,text],[50,0],[100,'AcDbText']]);selected=r.id;changed();return;}
 if(!draft){draft=w;draw();return;}const start=draft;draft=null;
 if(tool==='measure'){const n=Math.hypot(w[0]-start[0],w[1]-start[1]),u=$('units').value,f=u==='m'?1:Number(u);status('Расстояние: '+(n*f).toLocaleString('ru-RU',{maximumFractionDigits:3})+(u==='1'?' ед. чертежа':' м')+' · прямая между точками');draw();return;}
 if(Math.hypot(w[0]-start[0],w[1]-start[1])<1e-9)return;snapshot();const added=addEntity(doc,'LINE',[[10,start[0]],[20,start[1]],[30,0],[11,w[0]],[21,w[1]],[31,0],...presetPairs()]);selected=added.id;addedEntity(added);status(lengthLabel([[start,w]]));}
canvas.onpointerdown=e=>{canvas.focus();if(areaSelection.down(e.pointerId,local(e),e.button)){canvas.setPointerCapture(e.pointerId);return;}if(e.shiftKey&&tool==='object'&&$('busy').hidden){refineSelection(local(e));return;}if(dimensionWorkbench?.down(local(e))||titleWorkbench?.down(local(e))||leaderWorkbench?.down(local(e))||cableWorkbench?.down(local(e))){canvas.setPointerCapture(e.pointerId);return;}canvas.setPointerCapture(e.pointerId);const p=local(e);pointers.set(e.pointerId,p);gesture={view:{...view},points:[...pointers.values()].map(p=>[...p]),start:p,moved:false,multi:pointers.size>1};};
canvas.onpointermove=e=>{if(areaSelection.move(e.pointerId,local(e)))return;if(dimensionWorkbench?.move(local(e))||titleWorkbench?.move(local(e))||leaderWorkbench?.move(local(e))||cableWorkbench?.move(local(e)))return;if(!pointers.has(e.pointerId)){if(draft&&['line','poly3','curve4','measure'].includes(tool)){const w=world(local(e));draftHover=w;draw();status(lengthLabel([cableCurve(['poly3','curve4'].includes(tool)?[...polyPoints,w]:[draft,w],tool==='curve4')]));}if(tool==='executive')executiveUI?.hover(world(local(e)));return;}pointers.set(e.pointerId,local(e));const ps=[...pointers.values()],g=gesture;if(!g)return;
 if(ps.length>=2&&g.points.length>=2){const mid=a=>[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2],dist=a=>Math.hypot(a[1][0]-a[0][0],a[1][1]-a[0][1]);view={...g.view};zoom(dist(ps)/Math.max(dist(g.points),1),mid(g.points));const a=mid(ps),b=mid(g.points);view.x+=a[0]-b[0];view.y+=a[1]-b[1];g.moved=true;draw();}
 else if(ps.length===1&&g.points.length===1){const p=ps[0],a=g.points[0];if(Math.hypot(p[0]-a[0],p[1]-a[1])>4)g.moved=true;if(g.moved){view.x=g.view.x+p[0]-a[0];view.y=g.view.y+p[1]-a[1];markInteraction();draw();}}};
canvas.onpointerup=e=>{if(areaSelection.up(e.pointerId,local(e)))return;if(dimensionWorkbench?.up()||titleWorkbench?.up()||leaderWorkbench?.up()||cableWorkbench?.up())return;const g=gesture;pointers.delete(e.pointerId);if(g&&!g.moved&&!g.multi)tap(local(e));gesture=pointers.size?{view:{...view},points:[...pointers.values()],moved:true,multi:true}:null;};
canvas.onpointercancel=()=>{areaSelection.reset();dimensionWorkbench?.cancel();titleWorkbench?.cancel();leaderWorkbench?.cancel();cableWorkbench?.cancel();pointers.clear();gesture=null;};
canvas.onlostpointercapture=()=>{if(areaSelection.active())areaSelection.reset();};
canvas.onwheel=e=>{e.preventDefault();if(areaSelection.active())return;zoom(Math.exp(-e.deltaY*.001),local(e));};canvas.addEventListener('wheel',()=>{},{passive:false});
// Group gestures own pointer capture, and never fall through into viewport pan.
for(const [event,method] of [['pointerdown','down'],['pointermove','move'],['pointerup','up']])canvas.addEventListener(event,e=>{if(boxSelection[method](e.pointerId,local(e),e.button)){if(event==='pointerdown')canvas.setPointerCapture(e.pointerId);e.stopImmediatePropagation();e.preventDefault();}},{capture:true});
canvas.addEventListener('pointercancel',()=>boxSelection.reset(),{capture:true});
canvas.addEventListener('lostpointercapture',()=>{if(boxSelection.active())boxSelection.reset();});
canvas.addEventListener('wheel',e=>{if(boxSelection.active()){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('fit').onclick=fit;$('plus').onclick=()=>zoom(1.3);$('minus').onclick=()=>zoom(1/1.3);$('panel').onclick=()=>$('sidebar').classList.toggle('open');$('undo').onclick=()=>undo();$('redo').onclick=()=>undo(true);
$('grid').onclick=()=>{$('grid').setAttribute('aria-pressed',String($('grid').getAttribute('aria-pressed')!=='true'));draw();};
$('props').onsubmit=e=>{e.preventDefault();if(!$('busy').hidden)return;const r=current();if(!r||!editable(r))return;if(r.type==='INSERT'){try{applyObjectEdit({delta:[Number($('dx').value),Number($('dy').value)]});status('Прибор и связанные размеры перемещены');}catch(e){status(e.message);}return;}let dx=Number($('dx').value),dy=Number($('dy').value);if(selectedMatrix){const [a,b,c,d]=selectedMatrix,det=a*d-b*c;if(Math.abs(det)<1e-12)return status('Невозможно преобразовать координаты прибора');[dx,dy]=[(d*dx-c*dy)/det,(-b*dx+a*dy)/det];}if(!Number.isFinite(dx)||!Number.isFinite(dy))return status('Введите числовой сдвиг.');const op={handle:get(r,5),dx,dy};if(r.type==='TEXT'&&$('text').value!==decode(get(r,1)))op.text=$('text').value;snapshot();try{move(r,dx,dy);if(r.type==='INSERT')for(const a of doc.records.filter(a=>a.type==='ATTRIB'&&get(a,330)===get(r,5)))move(a,dx,dy);if(op.text!==undefined)set(r,1,op.text);if(doc.native&&!isNew(r))doc.nativeOps.push(op);changed();status('Изменения внесены. Скачайте копию '+(doc.native?'DWG':'DXF')+' для сохранения.');}catch(e){undo();status(e.message);}};
$('delete').onclick=()=>{const r=current();if(!$('busy').hidden||!r||!deletable(r))return;const ids=new Set(selectionPaths().ids);if(doc.executiveProject?.sheets.some(s=>s.routes.some(route=>route.sourceIds?.some(id=>ids.has(id)))))return status('Сначала снимите назначение кабеля через «Удалить трассу» — затем удалите объект.');if(!confirm('Удалить выбранный объект?'))return;snapshot();if(doc.native&&!isNew(r))doc.nativeOps.push({handle:get(r,5),dx:0,dy:0,remove:true});if(r.type==='INSERT')doc.records=doc.records.filter(a=>!(a.type==='ATTRIB'&&get(a,330)===get(r,5)));for(const b of doc.blocks.values())b.records=b.records.filter(x=>x!==r&&!(r.type==='INSERT'&&x.type==='ATTRIB'&&get(x,330)===get(r,5)));doc.entities=doc.entities.filter(x=>x!==r);doc.records=doc.records.filter(x=>x!==r);selected=null;changed();};
function adopt(next,fileName,file=null,prepared=null){
 rasterTask.stop();cached=null;recordIndex=null;selectedShapeCache=deviceCache=overlayCache=selectionCache=null;
 sourceLengthsJob++;sourceLengthsCache=lengthVisibility=null;workCopy=null;
 doc=next;doc.sourceFile=file;sourceFile=file;name=fileName;history=[];future=[];hidden=new Set([...doc.layers].filter(([,l])=>l.color<0).map(([n])=>n));selected=null;draft=null;dirty=false;$('filename').textContent=name;$('save').textContent='Скачать изменения · '+(doc.native?'DWG':'DXF');for(const b of document.querySelectorAll('[data-tool="line"],[data-tool="text"]')){b.disabled=false;b.title="";}setTool('select');syncUndo();if(prepared)drawing=prepared;rebuild(prepared?'decoration':'geometry');fit();const h=doc.records.find(r=>r.type==='SECTION'&&get(r,2)==='HEADER'),i=h?.pairs.findIndex(p=>p[0]===9&&p[1]==='$INSUNITS');const u=i>=0?Number(h.pairs[i+1]?.[1]):0;$('units').value=({4:'.001',5:'.01',6:'m'})[u]||'1';}
function stopLoad(){loadId++;if(worker)worker.terminate();worker=null;clearTimeout(loadTimer);clearInterval(progressClock);const reject=rejectWorker;rejectWorker=null;reject?.(Error('Операция отменена'));$('busy').hidden=true;$('file').disabled=false;$('save').disabled=false;draw();}
$('cancel').onclick=()=>{stopLoad();status('Загрузка отменена. Предыдущий чертёж сохранён.');};
async function openFile(file,restore=null){if(!restore&&dirty&&!confirm('Есть несохранённые изменения. Открыть другой файл?'))return;const limit=/\.dwg$/i.test(file.name)?128:256;if(file.size>limit*1024*1024)return status('Предел: DWG 128 МБ, DXF 256 МБ. На телефоне объём зависит от доступной памяти.');stopLoad();const token=loadId;$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;status('Читаю файл…');
 try{const bytes=await file.arrayBuffer();if(token!==loadId)return;let text,warnings=[],next;$('save').disabled=true;
 if(/\.dwg$/i.test(file.name)){
  if(!/^AC10\d\d/.test(new TextDecoder().decode(bytes.slice(0,6))))throw Error('Это не распознанный DWG.');
  const converted=await new Promise((resolve,reject)=>{rejectWorker=reject;worker=new Worker(new URL('./native-reader.mjs?v=0.17.54',import.meta.url),{type:'module'});const receive=nativeTransferReceiver(worker,progress);worker.onmessage=e=>{if(token!==loadId)return;try{if(e.data.progress)progress(e.data.progress,e.data.percent);else if(e.data.error)reject(Error(e.data.error));else{const result=receive(e.data);if(result)resolve(result);}}catch(error){reject(error);}};worker.onerror=()=>reject(Error('Не удалось запустить DWG-движок. Возможно, недостаточно памяти. Попробуйте меньший файл на компьютере.'));loadTimer=setTimeout(()=>reject(Error('Чтение заняло больше 5 минут. Попробуйте отдельный лист.')),300000);worker.postMessage({buffer:bytes,compact:true},[bytes]);});
  if(token!==loadId)return;worker.terminate();worker=null;clearTimeout(loadTimer);
  warnings=converted.messages;next=converted.doc;
 }else{try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1251').decode(bytes);}}
 if(token!==loadId)return;if(!next)next=await parseDxfAsync(text,n=>progress('Разбираю DXF: '+n+'%',5+n*.85),()=>token!==loadId);if(token!==loadId)return;progress('Строю изображение…',95);await new Promise(r=>setTimeout(r,0));if(token!==loadId)return;
 if(restore?.state)replayRecovery(next,restore.state);
 const prepared=next.records.length>20000?await sceneAsync(next,n=>progress('Строю изображение: '+n.toLocaleString('ru')+' объектов',95),()=>token!==loadId):null;if(token!==loadId)return;
 adopt(next,restore?.name||file.name.replace(/\.(dwg|dxf)$/i,''),next.native?file:null,prepared);recoveryReady=true;
 if(restore?.units)$('units').value=restore.units;if(restore?.view){view={...restore.view};draw();}dirty=!!restore;
 if(!restore){const labels=socketLabels(doc);if(labels.length){snapshot(labels);clearSocketLabels(doc,labels);const ids=new Set(labels.map(r=>r.id)),previous=drawing.shapes,removed=new Set();const shapes=previous.filter(s=>{const keep=!ids.has(s.entityId||s.id);if(!keep)removed.add(s);return keep;});deriveSpatialIndex(previous,shapes,removed);changed('decoration',{...drawing,shapes});}}
 await checkpoint(restore?'Восстановление':'Открытие файла');progress('Готово',100);status('Открыт '+file.name+'. '+(warnings.length?'Движок сообщил предупреждения: '+warnings.slice(0,2).join(' · '):'Проверьте список неподдерживаемых объектов справа.'));return true;
 }catch(e){if(token===loadId)status('Не удалось открыть: '+e.message);}finally{if(token===loadId)stopLoad();}}
$('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)openFile(f);};
$('demo').onclick=()=>{if(!dirty||confirm('Заменить несохранённый чертёж демо?')){stopLoad();adopt(demo(),'demo');status('Демонстрационный чертёж.');}};
$('save').onclick=()=>{$('exportReport').textContent=$('report').textContent;$('exportDialog').querySelector('h2').textContent='Сохранить копию в '+(doc.native?'DWG':'DXF')+'?';$('exportDescription').textContent=doc.native?'Записывается новая копия исходного DWG с изменениями. Проверка движком не заменяет проверку в AutoCAD. Новые линии, тексты и полилинии записываются в DWG. В исполнительных сохраняются оформление, трассы, выноски и поддерживаемые удаления. Исходный файл на диске не изменяется.':'Скачивается изменённый DXF. Проверьте результат в AutoCAD.';$('confirmExport').textContent='Скачать '+(doc.native?'DWG':'DXF');$('exportDialog').showModal();};
function download(blob,extension){progress('Готово',100);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-edited.'+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);dirty=false;$('filename').textContent=name;status(extension.toUpperCase()+' подготовлен к скачиванию. Проверьте копию в AutoCAD.');}
$('confirmExport').onclick=async()=>{if(doc.executiveProject?.sheets.length){await commitExecutive(doc.executiveProject,null,true);return;}if(!doc.native){download(new Blob([...serializeChunks(doc)],{type:'application/dxf'}),'dxf');return;}if(!sourceFile)return status('Нет исходного DWG для сохранения.');stopLoad();const token=loadId,ops=doc.nativeOps.map(o=>({...o}));$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;status('Готовлю сохранение DWG…');try{const buffer=await sourceFile.arrayBuffer();if(token!==loadId)return;const saved=await new Promise((resolve,reject)=>{rejectWorker=reject;worker=new Worker(new URL('./native-writer.mjs?v=0.17.54',import.meta.url),{type:'module'});worker.onmessage=e=>e.data.progress?progress(e.data.progress,e.data.percent):e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Не удалось записать DWG. Возможно, недостаточно памяти.'));loadTimer=setTimeout(()=>reject(Error('Запись заняла больше 5 минут.')),300000);worker.postMessage({buffer,ops,added:additions(doc)},[buffer]);});if(token!==loadId)return;download(new Blob([saved.buffer],{type:'application/acad'}),'dwg');}catch(e){if(token===loadId)status(e.message);}finally{if(token===loadId)stopLoad();}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='Escape'){dimensionWorkbench?.cancel();cableWorkbench?.cancel();executiveUI?.cancel();draft=null;setTool('select');}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo(e.shiftKey);}});
new ResizeObserver(()=>{const r=canvas.parentElement.getBoundingClientRect(),initial=width===1;const [w,h]=canvasResolution(r.width,r.height,devicePixelRatio,matchMedia('(pointer:coarse)').matches);if(!initial&&width===r.width&&height===r.height&&canvas.width===w&&canvas.height===h)return;width=r.width;height=r.height;canvas.width=w;canvas.height=h;ctx.setTransform(w/Math.max(1,width),0,0,h/Math.max(1,height),0,0);initial?fit():draw();}).observe(canvas.parentElement);
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
  const receive=nativeTransferReceiver(worker,progress,data?.compact?doc:null);
  worker.onmessage=e=>{if(token!==loadId)return;try{if(e.data.progress)progress(e.data.progress,e.data.percent);else if(e.data.error)reject(Error(e.data.error));else{const result=receive(e.data);if(result)resolve(result);}}catch(error){reject(error);}};
  worker.onerror=()=>reject(Error('Ошибка DWG-движка; изменения не применены'));
  loadTimer=setTimeout(()=>reject(Error('Операция превысила 5 минут')),300000);worker.postMessage(data,transfer);
 });
 try{
  const buffer=await sourceFile.arrayBuffer();if(token!==loadId)return;
  const sheetIds=new Set(project.sheets.map(s=>s.id)),loose=exportOnly?new Map([...executiveLooseRoots(doc.executiveProject,drawing.shapes)].filter(([,id])=>sheetIds.has(id))):new Map();
  const keep=new Set([...project.sheets.flatMap(s=>s.nativeHandles),...(project.generatedHandles||[]),...[...loose.keys()].filter(id=>id.startsWith('dwg-')).map(id=>id.slice(4))]);
  const keepRoots=[...keep].filter(h=>!project.generatedHandles?.includes(h));
  const routeSources=new Set(project.sheets.flatMap(s=>s.routes.flatMap(r=>r.sourceIds||[])));
  const saved=await run('./executive-worker.mjs?v=0.17.54',{buffer,ops:doc.nativeOps,added:additions(doc).filter(item=>!exportOnly||routeSources.has(item.sourceId)||loose.has(item.sourceId)||(item.type==='COPY'&&keep.has(item.parent))),project,cloneRequest,copyRequest,exportOnly,keepRoots},[buffer]);
  if(token!==loadId)return;worker.terminate();worker=null;clearTimeout(loadTimer);
  const file=new File([saved.buffer],previousName+'.dwg',{type:'application/acad'}),readBuffer=saved.buffer;
  const read=await run('./native-reader.mjs?v=0.17.54',{buffer:readBuffer,compact:true},[readBuffer]);
  if(exportOnly){if(token!==loadId)return;const allowed=new Set(keepRoots.concat(saved.project.generatedHandles,saved.addedHandles||[],saved.supportRoots||[])),actual=new Set(saved.exportRootHandles),removed=new Set(doc.nativeOps.filter(o=>o.remove).map(o=>o.handle));if([...actual].some(h=>!allowed.has(h))||[...allowed].some(h=>!removed.has(h)&&!actual.has(h))||read.doc.executiveProject?.sheets.length!==project.sheets.length)throw Error('Проверка отдельного DWG не пройдена: состав объектов не совпал.');downloadExecutives(file,'dwg');status('DWG только исполнительных скачан. Рабочий чертёж не изменён. Проверьте копию в CAD.');return true;}
  if(token!==loadId)return;worker.terminate();worker=null;clearTimeout(loadTimer);
  const reuse=cloneRequest?reusableScene(doc,read.doc,drawing):null;
  const built=read.doc.records.length>20000?await sceneAsync(reuse?.doc||read.doc,n=>progress('Строю исполнительную: '+n.toLocaleString('ru')+' объектов',95),()=>token!==loadId):null;
  const prepared=built&&reuse?mergeReusedScene(reuse,built):built;
  if(token!==loadId)return;adopt(read.doc,previousName,file,prepared);history=[...previousHistory,before].slice(-15);future=[];syncUndo();dirty=true;await checkpoint('Операция DWG завершена');
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
$('exportExecutivesPdf').onclick=async()=>{if(!$('busy').hidden)return;let choice;try{choice=exportControls.selection();}catch(e){return status(e.message);}if(drawing.limited)return status('PDF остановлен: превышен предел отображения, часть чертежа не загружена.');exportsMenu.open=false;stopLoad();const token=loadId;$('busy').hidden=false;beginProgress();try{await loadCadFont();const pdf=await executivePdf(doc.executiveProject,drawing.shapes,(i,total)=>{if(token!==loadId)throw Error('Экспорт отменён');progress('PDF: страница '+(i+1)+' из '+total,5+90*i/total);},{...choice,hiddenLayers:[...hidden]});if(token===loadId){downloadExecutives(pdf,'pdf',choice.whole?'drawing':'executives');status((choice.whole?'PDF всего чертежа скачан.':'PDF скачан: каждая выбранная исполнительная на отдельной странице.')+(drawing.unsupported.length||doc.nativeUnknown?' Внимание: неподдерживаемая редактором геометрия в PDF не отображается.':''));}}catch(e){if(token===loadId)status(e.message);}finally{if(token===loadId)stopLoad();}};
function focusExecutive(sheet){
 if(!sheet)return;
 const [x,y]=sheet.origin,w=420*sheet.paperUnit,h=297*sheet.paperUnit;
 view.s=Math.max(.000001,Math.min((width-40)/w,(height-40)/h));
 view.x=width/2-(x+w/2)*view.s;view.y=height/2+(y+h/2)*view.s;draw();
}
executiveUI=mountExecutiveUI({
 screen,
 consumeNewSelection:()=>{doc.records=doc.records.filter(r=>r.id!==selected);doc.entities=doc.entities.filter(r=>r.id!==selected);selected=null;},selectionPaths,getDoc:()=>doc,setDoc:next=>{doc=next;},snapshot,changed,status,lastStatus:()=>$('status').textContent,setTool,draw,commit:commitExecutive,focus:focusExecutive,shapes:()=>drawing.shapes,
 metresPerUnit:()=>$('units').value==='1'?null:$('units').value==='m'?1:Number($('units').value),
 checkpoint,previewRotation:()=>focusExecutive(executiveUI.sheet()),busy:()=>!$('busy').hidden
});
titleWorkbench=mountTitleWorkbench({project:()=>doc.executiveProject,context:()=>ctx,screen,world,draw,busy:()=>!$('busy').hidden,selecting:()=>tool==='object'&&!cableWorkbench?.exclusive(),clearSelection:()=>{selected=null;selectedChain=null;selectedShapeKey=null;selectedMatrix=null;pickedDevice=null;leaderWorkbench?.cancel();cableWorkbench?.cancel();},edit:(id,values)=>executiveUI.editTitle(id,values)});
rebuild();
const objectButton=document.createElement('button');objectButton.title='Выбор · Escape';objectButton.setAttribute('aria-label','Выбор · Escape');objectButton.className='drawingIcon';objectButton.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 3l14 10-7 1-3 7z"/></svg>';objectButton.dataset.tool='object';objectButton.onclick=()=>setTool('object');document.querySelector('nav').prepend(objectButton);document.querySelector('[data-tool="select"]').remove();setTool('object');
$('historyButton').onclick=async()=>{try{await recoveryQueue.catch(()=>{});const rows=await recovery.list(),list=$('recoveryList');list.replaceChildren();for(const row of rows){const button=document.createElement('button');button.textContent=row.name+' · '+new Date(row.time).toLocaleString()+' · '+row.label;button.onclick=async()=>{if(!$('busy').hidden)return;if(dirty&&!confirm('Восстановить эту версию? Текущие правки останутся в истории.'))return;try{await checkpoint('Перед восстановлением');const file=await recovery.source(row.sourceId);if(!file)throw Error('Исходный файл не найден');$('recoveryDialog').close();await openFile(file,await recovery.revision(row.id));}catch(e){status(e.message);}};list.append(button);}if(!rows.length)list.textContent='Сохранённых версий пока нет.';$('recoveryDialog').showModal();}catch(e){status('История недоступна: '+e.message);}};
recovery.hasRevisions().then(has=>{if(has)$('autosaveStatus').textContent='Есть сохранённая работа — откройте «История / восстановить»';}).catch(e=>{$('autosaveStatus').textContent='Локальное сохранение недоступно: '+e.message;});

function editTargets(removing=false){
 if(!selected)throw Error('Выберите объект на чертеже');
 if(!selectedChain){if(!current()||!(editable(current())||((removing?current().type==='SPLINE':movableSpline(current()))&&selected!==sharedSelectedId)))throw Error('Общая геометрия блока недоступна для независимого редактирования');return [{id:selected,matrix:selectedMatrix}];}
 const shapes=drawing.shapes.filter(s=>selectedChain.keys.has(s.entityKey)),ids=new Set(shapes.map(s=>s.entityId||s.id));
 if(drawing.shapes.some(s=>ids.has(s.entityId||s.id)&&!selectedChain.keys.has(s.entityKey)))throw Error('Линия входит в несколько экземпляров блока; независимое редактирование недоступно');
 return [...ids].map(id=>({id,matrix:shapes.find(s=>(s.entityId||s.id)===id).entityMatrix}));
}
function applyObjectEdit(options,explicitTargets=null){
 const before=drawing,oldCache=cached;
 const targets=explicitTargets||editTargets(!!options.remove),ids=new Set(targets.map(t=>t.id));
 const dimensionPlans=[];
 if(options.delta)for(const sheet of doc.executiveProject?.sheets||[])for(const link of sheet.dimensionLinks||[]){const target=targets.find(t=>t.id==='dwg-'+link.device);if(!target)continue;const r=recordById('dwg-'+link.dimension),f=dimensionDefinition(r);if(!f)throw Error('Связанный размер не поддерживается');const [a,b,c,d]=target.matrix||[1,0,0,1],det=a*d-b*c;if(Math.abs(det)<1e-12)throw Error('Вырожденный масштаб');const v=[(d*options.delta[0]-c*options.delta[1])/det,(-b*options.delta[0]+a*options.delta[1])/det],endNormal=v[0]*f.n[0]+v[1]*f.n[1],length=Math.abs(f.signed+v[0]*f.d[0]+v[1]*f.d[1]),values={length,offset:f.offset-endNormal/2,endNormal};if((f.signed+v[0]*f.d[0]+v[1]*f.d[1])*f.signed<=0)throw Error('Конец размера нельзя перенести через его начало');dimensionPlans.push({r,values,plan:planDimensionEdit(doc,r,values)});}
 const removed=new Set();let prepared=options.remove?{...drawing,shapes:drawing.shapes.filter(s=>{const keep=!ids.has(s.entityId||s.id)&&!ids.has(s.deviceId)&&!ids.has(s.id);if(!keep)removed.add(s);return keep;})}:options.delta&&options.color===undefined?(translatedScene(drawing,targets,options.delta)||translatedDeviceScene(doc,drawing,targets,options.delta,recordById)):null;
 if(options.remove)deriveSpatialIndex(drawing.shapes,prepared.shapes,removed);
 const movedShapes=[];
 if(prepared&&options.delta){for(let i=0;i<drawing.shapes.length;i++)if(drawing.shapes[i]!==prepared.shapes[i]){removed.add(drawing.shapes[i]);movedShapes.push(prepared.shapes[i]);}deriveSpatialIndex(drawing.shapes,prepared.shapes,removed,movedShapes);}
 snapshot([...targets.map(t=>recordById(t.id)),...dimensionPlans.flatMap(p=>p.plan.patches.map(p=>p.record))]);try{editObjects(doc,targets,options);for(const p of dimensionPlans){applyDimensionPlan(p.plan);if(doc.native)doc.nativeOps.push({handle:get(p.r,5),dimension:p.values});}if(dimensionPlans.length)prepared=updatedRootScene(doc,drawing,[...targets,...dimensionPlans.map(p=>({id:p.r.id}))]);else if(!prepared&&options.delta&&options.color===undefined)prepared=updatedRootScene(doc,drawing,targets);if(options.delta){for(const s of doc.executiveProject?.sheets||[])for(const r of s.routes)if(r.sourceIds?.every(id=>ids.has(id)))for(const l of r.leaders)for(const key of ['anchor','elbow','label'])l[key]=l[key].map((v,i)=>v+options.delta[i]);}if(options.remove){for(const s of doc.executiveProject?.sheets||[])if(s.dimensionLinks)s.dimensionLinks=s.dimensionLinks.filter(l=>!ids.has('dwg-'+l.device));selected=null;selectedChain=null;}changed('geometry',prepared);}catch(e){history.pop();syncUndo();throw e;}
 if((options.remove||options.delta)&&drawing===prepared){const damage=[...removed,...movedShapes];if(history.at(-1)?.viewState)history.at(-1).viewState.damage=damage;if(oldCache?.drawing===before&&oldCache.hiddenKey===[...hidden].join('\0')&&preview.width===canvas.width&&preview.height===canvas.height&&repaintDamage(previewContext,drawing.shapes,damage,{view:oldCache.view,width,height,hidden,colors}))cached={...oldCache,drawing};}
}
let workCopy=null,handleCache;
leaderWorkbench=mountLeaderWorkbench({project:()=>doc.executiveProject,screen,world,draw,status,busy:()=>!$('busy').hidden,selecting:()=>!titleWorkbench?.active()&&tool==='object'&&!cableWorkbench?.exclusive(),clearCableSelection:()=>{selected=null;selectedChain=null;selectedShapeKey=null;selectedMatrix=null;sharedSelectedId=null;cached=null;},edit:(ref,values)=>executiveUI.editLeader(ref.sheetId,ref.routeId,ref.id,values)});
function nativeHandles(){
 if(handleCache?.drawing===drawing&&handleCache.selected===selected&&handleCache.chain===selectedChain&&handleCache.key===selectedShapeKey&&handleCache.device===pickedDevice)return handleCache.handles;
 let handles=[];if(selected)try{handles=editTargets(true).flatMap(t=>entityControls(recordById(t.id),t.matrix||[1,0,0,1,0,0]));}catch{}
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
  const newLines=records.every(r=>isNew(r)&&(['LINE','LWPOLYLINE'].includes(r.type)||r.deferredCopy));
  value={move,remove,color:move,copy:move&&(newLines||!!s&&!!doc.native&&targets.every(t=>t.id.startsWith('dwg-'))),cut:move&&!!s&&records.every(r=>['LINE','ARC','CIRCLE','LWPOLYLINE','SPLINE'].includes(r.type)),leader:!!r||leader,rotate:move&&records.length===1&&records[0].type==='INSERT'&&!num(records[0],66)};
 }catch{}
 if(r)value.leader=true;
 capabilityCache={key,value};return value;
}
cableWorkbench=mountCableWorkbench({
 setCableValues:values=>{if(!values.brand.trim()||!values.section.trim())throw Error('Выберите кабель и сечение');if(workRoute())executiveUI.editRoute(r=>Object.assign(r,values));else{for(const [key,id]of [['brand','exBrand'],['section','exSection']])$(id).value=values[key];if(!executiveUI.assignSelection())throw Error('Назначение кабеля отменено');}status('Кабель и сечение сохранены. Выноски и ведомость обновлены.');},
 selectedLayer:()=>selectedShapes()[0]?.layer||'',hideLayer:()=>{const layer=selectedShapes()[0]?.layer;if(layer)setLayerVisible(layer,false);},
 routes:all=>all?(doc.executiveProject?.sheets||[]).flatMap(s=>s.routes):executiveUI.sheet()?.routes||[],sheetId:()=>executiveUI.sheet()?.id||'',
 focusCable:ids=>{const r=workRoute(),paths=ids?(doc.executiveProject?.sheets||[]).flatMap(s=>s.routes).filter(r=>ids.includes(r.id)).flatMap(r=>r.paths||[r.points]):r?(r.paths||[r.points]):selectionPaths().paths,pts=paths.flat();if(!pts.length)return;let x=Infinity,y=Infinity,X=-Infinity,Y=-Infinity;for(const p of pts){x=Math.min(x,p[0]);y=Math.min(y,p[1]);X=Math.max(X,p[0]);Y=Math.max(Y,p[1]);}const available=Math.max(160,width-320),scale=Math.min(available*.75/Math.max(X-x,1),height*.65/Math.max(Y-y,1));view={s:scale,x:available/2-(x+X)*scale/2,y:height/2+(y+Y)*scale/2};cached=null;draw();},
 canRefine:()=>!!selectedChain,refine:refineSelection,
 capabilities:selectionCapabilities,shapes:()=>drawing?.shapes,
 busy:()=>!$('busy').hidden,draw,status,world,screen,route:()=>workRoute(),beginCable:()=>executiveUI.sheet()?executiveUI.beginCable():setTool('curve4'),selecting:()=>!titleWorkbench?.active()&&!leaderWorkbench?.active()&&['object','device'].includes(tool),drawing:()=>['line','poly3','curve4'].includes(tool)||(tool==='executive'&&['route','route3','straight','broken'].includes(executiveUI.preview().mode)),
 hasSelection:()=>!!selected,selectionKey:()=>selected||'',colorValue:()=>{const r=current(),c=r?num(r,62):0;return c>=1&&c<=8?c:0;},
 paths:()=>{const r=workRoute();return r?(r.paths||[r.points]):selectionPaths().paths;},
 length:paths=>{const r=workRoute();return paths?lengthLabel(paths):r?`${r.brand||'Без марки'} ${r.section||'Без сечения'} · ${lengthLabel(r.paths||[r.points])}${r.extraMetres?' + '+r.extraMetres+' м запас':''}`:selected?lengthLabel(selectionPaths().paths):'Выберите кабель или прибор';},
 move:delta=>{const r=workRoute();if(r&&!r.sourceIds)executiveUI.moveRoute(delta);else applyObjectEdit({delta});},
 nodes:controls=>executiveUI.editRoute(r=>{if(r.controls)r.controls=controls;r.points=cableCurve(controls,r.smooth);}),
 cut:(a,b)=>executiveUI.cutRoute(a,b),
 leaderAt:(p,elbow,label)=>executiveUI.beginLeaderAt(p,elbow,label),
 leaderNode:(id,key,point)=>executiveUI.editRoute(r=>{const leader=r.leaders.find(l=>l.id===id);if(!leader||!['label','elbow'].includes(key))throw Error('Выноска не найдена');leader[key]=point;}),
 isDevice:()=>current()?.type==='INSERT',
 rotation:()=>{const targets=editTargets(),r=current();return targets.length===1&&r?.type==='INSERT'?{pivot:[num(r,10),num(r,20)],matrix:targets[0].matrix}:null;},
 rotate:delta=>{const targets=editTargets(),r=current();if(targets.length!==1||r?.type!=='INSERT')throw Error('Выберите прибор');if(num(r,66))throw Error('Поворот прибора с атрибутами пока недоступен');if(!Number.isFinite(delta)||Math.abs(delta)<1e-8)return;const angle=num(r,50)+delta;snapshot();set(r,50,angle);if(!isNew(r))doc.nativeOps.push({handle:get(r,5),dx:0,dy:0,angle:angle*Math.PI/180});changed('geometry',updatedRootScene(doc,drawing,targets));},
 nativeHandles,
 nativePreview:(h,p)=>previewEntity(recordById(h.id),h,p),
 nativeNode:(h,p)=>{editTargets(true);const [a,b,c,d,e,f]=h.matrix,det=a*d-b*c;if(Math.abs(det)<1e-12)throw Error('Вырожденный масштаб');const x=(d*(p[0]-e)-c*(p[1]-f))/det,y=(-b*(p[0]-e)+a*(p[1]-f))/det,r=recordById(h.id);snapshot([r]);(h.vertex?setEntityVertex:setSplineControl)(r,h.index,x,y);if(doc.native&&!isNew(r))doc.nativeOps.push({handle:get(r,5),dx:0,dy:0,[h.vertex?'vertex':'node']:{index:h.index,x,y}});changed();},
 convert:()=>{const s=executiveUI.sheet();if(!s)throw Error('Выберите исполнительную');const targets=editTargets(),points=joinCablePaths(selectionPaths().paths),previous=workRoute();if(points.length>10000)throw Error('Слишком много точек для правки формы');const next=structuredClone(doc.executiveProject),id=crypto.randomUUID();const route=addRoute(next,s.id,{id,points,brand:previous?.brand||$('exBrand').value,section:previous?.section||$('exSection').value,color:previous?.color||7,extraMetres:previous?.extraMetres||0});route.leaders=structuredClone(previous?.leaders||[]);const ids=new Set(targets.map(t=>t.id));for(const sheet of next.sheets)sheet.routes=sheet.routes.filter(r=>!r.sourceIds?.some(id=>ids.has(id)));snapshot();editObjects(doc,targets,{remove:true});doc.executiveProject=next;selected=null;selectedChain=null;changed();executiveUI.selectRoute(id);},
 color:color=>{const r=workRoute();if(r&&!r.sourceIds)executiveUI.editRoute(r=>{r.color=color;delete r.rgb;});else{applyObjectEdit({color});if(r)executiveUI.editRoute(r=>{r.color=color;delete r.rgb;});}},
 remove:()=>{const r=workRoute();if(r&&!r.sourceIds)executiveUI.removeRoute();else applyObjectEdit({remove:true});},
 copy:()=>{const r=workRoute();if(r&&!r.sourceIds){workCopy={route:structuredClone(r),file:sourceFile};return;}
  const targets=editTargets(),paths=selectionPaths().paths,pts=paths.flat();if(!pts.length)throw Error('Нет геометрии');const centre=[0,1].map(k=>pts.reduce((n,p)=>n+p[k],0)/pts.length);
  if(targets.length===1&&current()?.deferredCopy){const source=current(),data=structuredClone(source.deferredCopy),angle=num(source,50)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);data.matrix=[c*num(source,41,1),s*num(source,41,1),-s*num(source,42,1),c*num(source,42,1),num(source,10),num(source,20)];data.wrapperColor=num(source,62,256);workCopy={deferred:data,centre,file:sourceFile};return;}
  if(targets.every(t=>isNew(recordById(t.id)))){if(targets.some(t=>t.matrix&&t.matrix.some((v,i)=>v!==[1,0,0,1,0,0][i])))throw Error('Новая линия внутри блока не поддерживается');const records=targets.map(t=>recordById(t.id));prepareNewCopies(records,[0,0]);workCopy={records:structuredClone(records),centre,file:sourceFile};return;}
  if(targets.some(t=>!/^dwg-/.test(t.id)))throw Error('Выберите отдельно исходные либо новые линии');workCopy={deferred:prepareDeferredCopy(doc,targets,executiveUI.sheet()),centre,file:sourceFile};},
 paste:async (position,selectCopy=false)=>{if(!workCopy||workCopy.file!==sourceFile)throw Error('Скопируйте объект из текущего файла');
  if(workCopy.deferred){snapshot();const r=addDeferredCopy(doc,workCopy.deferred,position.map((v,i)=>v-workCopy.centre[i]));selected=r.id;selectedChain=null;selectedShapeKey=null;selectedMatrix=null;pickedDevice=null;sharedSelectedId=null;addedEntity(r);status('Независимая копия создана без перечитывания файла. Проверка CAD — при сохранении DWG.');return;}
  if(workCopy.records){const copies=prepareNewCopies(workCopy.records,position.map((v,i)=>v-workCopy.centre[i]));snapshot();selectedChain=null;selectedShapeKey=null;selectedMatrix=null;pickedDevice=null;for(const copy of copies){const r=addEntity(doc,copy.type,copy.pairs);selected=r.id;addedEntity(r);}status('Копия линии создана. Можно перетаскивать; отмена доступна.');return;}
  const sheet=executiveUI.sheet();if(!sheet)throw Error('Выберите исполнительную');
  if(workCopy.route){const r=structuredClone(workCopy.route),delta=position.map((v,i)=>v-r.points[0][i]);r.id=crypto.randomUUID();r.sheetId=sheet.id;r.metresPerUnit=sheet.metresPerUnit;r.points=r.points.map(p=>p.map((v,i)=>v+delta[i]));if(r.controls)r.controls=r.controls.map(p=>p.map((v,i)=>v+delta[i]));r.leaders=r.leaders.map(l=>({...l,id:crypto.randomUUID(),...Object.fromEntries(['anchor','elbow','label'].map(k=>[k,l[k].map((v,i)=>v+delta[i])]))}));snapshot();sheet.routes.push(r);selected=null;selectedChain=null;selectedShapeKey=null;selectedMatrix=null;pickedDevice=null;changed();executiveUI.selectRoute(r.id);return;}
  throw Error('Выберите объект и скопируйте заново');
 }
});
const cableDrawButton=$('cwDraw');document.querySelector('nav').insertBefore(cableDrawButton,document.querySelector('[data-tool="line"]'));
const lengthToggle=document.createElement('label');lengthToggle.className='lengthToggle';lengthToggle.title='Показать длины назначенных и исходных кабелей на слоях проводки. Подписи только для просмотра, в файл не добавляются.';lengthToggle.innerHTML='<input id="showCableLengths" type="checkbox"> Длины кабелей';lengthToggle.querySelector('input').onchange=()=>{sourceLengthsCache=null;sourceLengthsJob++;draw();};document.querySelector('nav [data-tool="pan"]').replaceWith(lengthToggle);
const boxButton=document.createElement('button');boxButton.id='boxSelection';boxButton.dataset.tool='box';boxButton.className='drawingIcon';boxButton.title='Выделение рамкой: обведите целые объекты, затем потяните внутри рамки для совместного переноса';boxButton.setAttribute('aria-label','Выделение рамкой');boxButton.setAttribute('aria-pressed','false');boxButton.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="4" y="4" width="16" height="16" stroke-dasharray="3 2"/></svg>';boxButton.onclick=()=>setTool('box');objectButton.after(boxButton);
$('delete').onclick=()=>$('cwDelete').click();
document.querySelector('[data-tool="line"]').onclick=()=>{if(executiveUI.sheet())executiveUI.beginCable('straight');else setTool('line');};
document.querySelector('[data-tool="poly3"]').onclick=()=>{if(executiveUI.sheet())executiveUI.beginCable('broken');else setTool('poly3');};
for(const [button,label,path]of [[cableDrawButton,'Плавный кабель · 4 точки','M3 19Q7 1 21 5'],[document.querySelector('[data-tool="line"]'),'Прямая · 2 точки','M3 19L21 5'],[document.querySelector('[data-tool="poly3"]'),'Полилиния · 4 точки','M3 19L10 5L21 13']]){button.title=label;button.setAttribute('aria-label',label);button.classList.add('drawingIcon');button.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="${path}"/><circle cx="3" cy="19" r="2"/></svg>`;}
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||!$('busy').hidden)return;if((e.ctrlKey||e.metaKey)&&['c','v'].includes(e.key.toLowerCase())){e.preventDefault();$(e.key.toLowerCase()==='c'?'cwCopy':'cwPaste').click();}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();if(leaderWorkbench?.active())leaderWorkbench.remove();else $('cwDelete').click();}});
import('./workspace.mjs?v=0.17.54');
