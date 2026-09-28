// SPDX-License-Identifier: GPL-3.0-or-later
import {parseDxfAsync,scene,serializeChunks,cloneDoc,demo,get,num,set,decode,move,addEntity} from './cad.mjs?v=0.14.3';
import {paintShapes,previewTransform} from './renderer.mjs?v=0.14.3';
import {loadCadFont} from './fonts.mjs?v=0.14.3';
import {clampProgress,warningText} from './progress.mjs?v=0.14.3';
import {isNew,additions} from './authoring.mjs?v=0.14.3';
import {mountExecutiveUI} from './executive-ui.mjs?v=0.14.3';
import {captureRecovery,replayRecovery,recoveryStore} from './recovery.mjs?v=0.14.3';
import {shapePaths,pathLength,syncLinkedRoutes} from './selection-metrics.mjs?v=0.14.3';
import {copyTransform} from './object-copy.mjs?v=0.14.3';
import {cableChain} from './cable-chain.mjs?v=0.14.3';
let executiveUI;
let rejectWorker=null;
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let doc=demo(),view={x:0,y:0,s:1},drawing,selected=null,hidden=new Set(),tool='select',draft=null,history=[],future=[],dirty=false,name='demo',worker=null,loadTimer=null,loadId=0;
let width=1,height=1,pointers=new Map(),gesture=null,sourceFile=null;
let polyPoints=[],selectedMatrix=null,selectedShapeKey=null,sharedSelectedId=null;
let clipboard=null,draftHover=null,selectedChain=null;
const renderSelection=()=>selectedChain?.anchor===selected?selectedChain.keys:selectedShapeKey?.includes('|'+selected+'|')?selectedShapeKey:selected;
import {aciColors as colors} from './colors.mjs?v=0.14.3';
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
function current(){return doc.records.find(r=>r.id===selected);}
function selectedShapes(){return drawing.shapes.filter(s=>selectedChain?.anchor===selected?selectedChain.measureKeys.has(s.entityKey):selectedShapeKey?s.entityKey===selectedShapeKey:s.deviceId===selected||s.entityId===selected||s.id===selected);}
function selectionPaths(){
 const shapes=selectedShapes(),counts=new Map(),chain=selectedChain?.anchor===selected?selectedChain:null,allIds=new Set();
 for(const s of shapes){const id=s.entityId||s.id;counts.set(id,(counts.get(id)||0)+1);allIds.add(id);}
 for(const s of drawing.shapes){const id=s.entityId||s.id;if(counts.has(id))counts.set(id,counts.get(id)-1);if(chain?.keys.has(s.entityKey))allIds.add(id);}
 return {paths:shapePaths(shapes),ids:[...counts.keys()],allIds:[...allIds],coincident:chain?.coincident||0,roots:[...new Set(shapes.map(s=>s.id))],shared:[...counts.values()].some(n=>n<0)};
}
function lengthLabel(paths){const u=$('units').value,f=u==='m'?1:Number(u);return 'Длина ≈ '+(pathLength(paths)*f).toLocaleString('ru-RU',{maximumFractionDigits:3})+(u==='1'?' ед.':' м');}
function rebuild(kind='geometry'){const generated=new Set(doc.executiveProject?.generatedHandles||[]);executiveUI?.rebuild();for(const s of doc.executiveProject?.sheets||[]){const r=doc.entities.find(r=>get(r,5)===s.nativeHandles[0]);if(r)set(r,50,s.angle*180/Math.PI);}drawing=kind==='decoration'&&drawing?{...drawing,shapes:[...drawing.shapes.filter(s=>!s.id.startsWith('executive-')&&!generated.has(s.id.replace('dwg-',''))),...scene({...doc,entities:doc.entities.filter(r=>r.id.startsWith('executive-'))}).shapes]}:scene(doc);if(drawing.limited)status('Предел отображения: 3 000 000 записей. Часть чертежа не показана.');$('report').textContent=drawing.shapes.length+' видимых примитивов. Не отображаются: '+(drawing.unsupported.map(([t,n])=>t+' × '+n).join(', ')||'нет известных пропусков')+(doc.nativeUnknown?' · не разобрано движком: '+doc.nativeUnknown:'')+(drawing.limited?' · достигнут предел объёма':'')+'. Только пространство модели.';renderLayers();properties();draw();}
function renderLayers(){const names=[...new Set(drawing.shapes.map(s=>s.layer))].sort();$('layers').replaceChildren();for(const layer of names){const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.checked=!hidden.has(layer);i.onchange=()=>{i.checked?hidden.delete(layer):hidden.add(layer);draw();};l.append(i,document.createTextNode(decode(layer)));$('layers').append(l);}}
const editable=r=>r.id!==sharedSelectedId&&!r.id.startsWith('executive-')&&['LINE','LWPOLYLINE','CIRCLE','ARC','TEXT','MTEXT','INSERT'].includes(r.type)&&!num(r,210)&&!num(r,220)&&num(r,230,1)===1&&!(doc.native&&!doc.executiveProject?.sheets.length&&r.type==='INSERT'&&num(r,66));
const deletable=r=>editable(r)&&(isNew(r)||!doc.native||!!doc.executiveProject?.sheets.length)&&(!doc.native||isNew(r)||['LINE','TEXT','LWPOLYLINE','INSERT'].includes(r.type))&&!doc.executiveProject?.sheets.some(s=>s.nativeHandles.includes(get(r,5)))&&(r.type!=='INSERT'||!!doc.executiveProject?.sheets.length);
function properties(){const r=current();$('props').hidden=!r;$('selection').textContent=r?r.type+' · '+(get(r,5)||r.id)+(editable(r)?'':' · только просмотр'):'Нажмите на объект на чертеже.';if(r){$('layer').value=decode(get(r,8,'0'));$('text').value=r.type==='TEXT'?decode(get(r,1)):'';$('text').disabled=r.type!=='TEXT'||!editable(r);$('dx').value=0;$('dy').value=0;$('props').querySelector('button[type=submit]').disabled=!editable(r);$('delete').disabled=!deletable(r);}}
function changed(kind='geometry'){dirty=true;$('filename').textContent=name+' · изменён';checkpoint().catch(()=>{});rebuild(kind);if(kind==='geometry'&&syncLinkedRoutes(doc.executiveProject,drawing.shapes)){rebuild('decoration');checkpoint('Обновление длин').catch(()=>{});}}
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
function paint(){ctx.clearRect(0,0,width,height);ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);if($('grid').getAttribute('aria-pressed')==='true'){ctx.lineWidth=1;ctx.strokeStyle='#17283a';for(let x=0;x<width;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}for(let y=0;y<height;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}}
 const large=(drawing?.shapes.length||0)>20000,hiddenKey=[...hidden].join('\0');
 if(large){
  const valid=cached&&cached.drawing===drawing&&cached.selected===selected&&cached.hiddenKey===hiddenKey&&preview.width===canvas.width&&preview.height===canvas.height;
  if(!(valid&&performance.now()<interactionUntil)){
   if(preview.width!==canvas.width||preview.height!==canvas.height){preview.width=canvas.width;preview.height=canvas.height;}
   previewContext.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);previewContext.clearRect(0,0,width,height);
   paintShapes(previewContext,drawing.shapes,{view,width,height,hidden,selected:renderSelection(),colors});
   cached={drawing,selected,hiddenKey,view:{...view}};
  }
  const transform=previewTransform(view,cached.view);ctx.save();ctx.translate(transform.x,transform.y);ctx.scale(transform.scale,transform.scale);ctx.drawImage(preview,0,0,width,height);ctx.restore();
 }else{cached=null;paintShapes(ctx,drawing?.shapes||[],{view,width,height,hidden,selected:renderSelection(),colors});}
 if(tool==='executive'){const preview=executiveUI?.preview();if(preview?.points.length){let pts=[...preview.points];if(preview.hoverPoint)pts.push(preview.hoverPoint);if(preview.mode==='area'&&pts.length>1){const a=pts[0],b=pts.at(-1);pts=[a,[b[0],a[1]],b,[a[0],b[1]],a];}ctx.save();ctx.strokeStyle='#ffbe6c';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();pts.map(screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.restore();}}
 if(draft){const p=screen(draft);ctx.fillStyle='#ffbe6c';ctx.beginPath();ctx.arc(...p,5,0,7);ctx.fill();if(draftHover&&['line','poly3','measure'].includes(tool)){const pts=(tool==='poly3'?[...polyPoints,draftHover]:[draft,draftHover]).map(screen);ctx.strokeStyle='#ffbe6c';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}}
}
function zoom(f,p=[width/2,height/2]){const w=world(p),s=Math.max(1e-8,Math.min(1e8,view.s*f));view.s=s;view.x=p[0]-w[0]*s;view.y=p[1]+w[1]*s;markInteraction();draw();}
const distance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);};
function pick(p){
 let best=18,id=null,leaf=false,hit=null;selectedChain=null;selectedMatrix=null;selectedShapeKey=null;sharedSelectedId=null;
 const roots=new Set((doc.executiveProject?.sheets||[]).flatMap(sheet=>sheet.nativeHandles.map(h=>'dwg-'+h)));
 const w=world(p),pad=18/view.s;
 for(const s of drawing.shapes){
  const executive=roots.has(s.id);
  if(tool==='device'&&(!s.deviceId||s.deviceId===s.id||!executive))continue;
  const b=s.bounds;if(hidden.has(s.layer)||b[2]<w[0]-pad||b[0]>w[0]+pad||b[3]<w[1]-pad||b[1]>w[1]+pad)continue;
  const pts=s.pts.map(screen);let d=Infinity;
  if(s.text!==null){const a=pts[0];d=distance(p,a,[a[0]+Math.max(10,s.height*view.s*s.text.length*.5),a[1]]);}
  else for(let i=1;i<pts.length;i++)d=Math.min(d,distance(p,pts[i-1],pts[i]));
  if(d<best){hit=s;best=d;const whole=tool==='device'||tool==='object'&&s.deviceId&&s.deviceId!==s.id;leaf=!whole&&executive&&!!s.entityId;id=whole?s.deviceId:leaf?s.entityId:s.id;selectedMatrix=whole?s.deviceMatrix:leaf?s.entityMatrix:null;selectedShapeKey=leaf?s.entityKey:null;}
 }
 selected=id;
 if(leaf&&drawing.shapes.filter(s=>s.entityId===id).length>1)sharedSelectedId=id;
 if(tool==='object'&&hit){const chain=cableChain(drawing.shapes,hit,hidden);if(chain.length>1||chain.coincident?.length){selectedChain={anchor:id,keys:new Set([...chain,...chain.coincident||[]].map(s=>s.entityKey)),measureKeys:new Set(chain.map(s=>s.entityKey)),coincident:chain.coincident?.length||0};sharedSelectedId=id;}}
 cached=null;properties();draw();
 if(selected){const info=selectionPaths(),label=lengthLabel(info.paths);status(label);$('selection').textContent+=' · '+label+(info.coincident?' · без совпадающих копий':'');executiveUI.selectObject(selected,info.allIds);}
 if(selectedChain)status('Кабель: '+selectedChain.measureKeys.size+' участков · '+lengthLabel(selectionPaths().paths)+(selectedChain.coincident?' · совпадающих копий: '+selectedChain.coincident+' (длина без повторов)':'')+'. Для правки отдельной части выберите «Участок».');
 else if(sharedSelectedId)status('Объект входит в повторяющийся блок. Изменение общей геометрии затронет несколько экземпляров; пока доступен просмотр. Для перемещения прибора используйте «Выбрать прибор».');
}
function setTool(t){selectedChain=null;draftHover=null;tool=t;draft=null;polyPoints=[];selected=null;selectedMatrix=null;selectedShapeKey=null;sharedSelectedId=null;cached=null;properties();document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)));$('hint').textContent=({select:'Нажмите на отдельный объект исполнительной. Перемещение — в свойствах; перетаскивание двигает вид.',pan:'Перетаскивайте чертёж. Масштаб — колесом или двумя пальцами.',executive:'Указывайте точки на чертеже. Настройки и завершение — в панели исполнительных. Escape — отменить.',device:'Нажмите на прибор внутри исполнительной. Перемещение — в свойствах справа.', poly3:'Укажите три точки полилинии. Escape — отменить.',line:'Укажите начало и конец линии. Escape — отменить.',text:'Нажмите в точке вставки текста.',measure:'Укажите две точки. Единицы выбираются в панели справа.'})[t]||'Выберите инструмент.';draw();}
function tap(p){const w=world(p);if(!$('busy').hidden)return;if(tool==='paste'){const sheet=executiveUI.sheet();if(!clipboard||clipboard.file!==sourceFile||!sheet)return status('Выберите исполнительную и заново скопируйте объект');try{const request={handle:clipboard.handle,parent:sheet.nativeHandles[0],transform:copyTransform(doc,sheet,clipboard.matrix,clipboard.centre,w)};setTool('select');commitExecutive(doc.executiveProject,null,false,request).then(ok=>{if(ok)status('Независимая копия объекта вставлена в исполнительную и сохранена локально.');});}catch(e){status(e.message);}return;}if(tool==='executive'){try{executiveUI.tap(w);}catch(e){status(e.message);}return;}if(tool==='select'||tool==='device'||tool==='object'){pick(p);return;}if(tool==='pan')return;
 if(tool==='poly3'){
  polyPoints.push(w);draft=w;draw();
  if(polyPoints.length<3){status('Полилиния: точка '+polyPoints.length+' из 3');return;}
  snapshot();selected=addEntity(doc,'LWPOLYLINE',[[90,3],[70,0],...polyPoints.flatMap(p=>[[10,p[0]],[20,p[1]]])]).id;
  const length=polyPoints.slice(1).reduce((s,p,i)=>s+Math.hypot(p[0]-polyPoints[i][0],p[1]-polyPoints[i][1]),0);
  polyPoints=[];draft=null;changed();status('Полилиния создана · длина '+(length*($('units').value==='m'?1:Number($('units').value))).toFixed(3)+($('units').value==='1'?' ед.':' м'));return;
 }
 if(tool==='text'){const text=prompt('Текст подписи:');if(!text)return;snapshot();const r=addEntity(doc,'TEXT',[[10,w[0]],[20,w[1]],[30,0],[40,18/view.s],[1,text],[50,0],[100,'AcDbText']]);selected=r.id;changed();return;}
 if(!draft){draft=w;draw();return;}const start=draft;draft=null;
 if(tool==='measure'){const n=Math.hypot(w[0]-start[0],w[1]-start[1]),u=$('units').value,f=u==='m'?1:Number(u);status('Расстояние: '+(n*f).toLocaleString('ru-RU',{maximumFractionDigits:3})+(u==='1'?' ед. чертежа':' м')+' · прямая между точками');draw();return;}
 if(Math.hypot(w[0]-start[0],w[1]-start[1])<1e-9)return;snapshot();selected=addEntity(doc,'LINE',[[10,start[0]],[20,start[1]],[30,0],[11,w[0]],[21,w[1]],[31,0]]).id;changed();status(lengthLabel([[start,w]]));}
canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);const p=local(e);pointers.set(e.pointerId,p);gesture={view:{...view},points:[...pointers.values()].map(p=>[...p]),start:p,moved:false,multi:pointers.size>1};};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId)){if(draft&&['line','poly3','measure'].includes(tool)){const w=world(local(e));draftHover=w;draw();status(lengthLabel([tool==='poly3'?[...polyPoints,w]:[draft,w]]));}if(tool==='executive')executiveUI?.hover(world(local(e)));return;}pointers.set(e.pointerId,local(e));const ps=[...pointers.values()],g=gesture;if(!g)return;
 if(ps.length>=2&&g.points.length>=2){const mid=a=>[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2],dist=a=>Math.hypot(a[1][0]-a[0][0],a[1][1]-a[0][1]);view={...g.view};zoom(dist(ps)/Math.max(dist(g.points),1),mid(g.points));const a=mid(ps),b=mid(g.points);view.x+=a[0]-b[0];view.y+=a[1]-b[1];g.moved=true;draw();}
 else if(ps.length===1&&g.points.length===1){const p=ps[0],a=g.points[0];if(Math.hypot(p[0]-a[0],p[1]-a[1])>4)g.moved=true;if(g.moved){view.x=g.view.x+p[0]-a[0];view.y=g.view.y+p[1]-a[1];markInteraction();draw();}}};
canvas.onpointerup=e=>{const g=gesture;pointers.delete(e.pointerId);if(g&&!g.moved&&!g.multi)tap(local(e));gesture=pointers.size?{view:{...view},points:[...pointers.values()],moved:true,multi:true}:null;};
canvas.onpointercancel=()=>{pointers.clear();gesture=null;};
canvas.onwheel=e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.001),local(e));};canvas.addEventListener('wheel',()=>{},{passive:false});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('fit').onclick=fit;$('plus').onclick=()=>zoom(1.3);$('minus').onclick=()=>zoom(1/1.3);$('panel').onclick=()=>$('sidebar').classList.toggle('open');$('undo').onclick=()=>undo();$('redo').onclick=()=>undo(true);
$('grid').onclick=()=>{$('grid').setAttribute('aria-pressed',String($('grid').getAttribute('aria-pressed')!=='true'));draw();};
$('props').onsubmit=e=>{e.preventDefault();if(!$('busy').hidden)return;const r=current();if(!r||!editable(r))return;let dx=Number($('dx').value),dy=Number($('dy').value);if(selectedMatrix){const [a,b,c,d]=selectedMatrix,det=a*d-b*c;if(Math.abs(det)<1e-12)return status('Невозможно преобразовать координаты прибора');[dx,dy]=[(d*dx-c*dy)/det,(-b*dx+a*dy)/det];}if(!Number.isFinite(dx)||!Number.isFinite(dy))return status('Введите числовой сдвиг.');const op={handle:get(r,5),dx,dy};if(r.type==='TEXT'&&$('text').value!==decode(get(r,1)))op.text=$('text').value;snapshot();try{move(r,dx,dy);if(r.type==='INSERT')for(const a of doc.records.filter(a=>a.type==='ATTRIB'&&get(a,330)===get(r,5)))move(a,dx,dy);if(op.text!==undefined)set(r,1,op.text);if(doc.native&&!isNew(r))doc.nativeOps.push(op);changed();status('Изменения внесены. Скачайте копию '+(doc.native?'DWG':'DXF')+' для сохранения.');}catch(e){undo();status(e.message);}};
$('delete').onclick=()=>{const r=current();if(!$('busy').hidden||!r||!deletable(r))return;const ids=new Set(selectionPaths().ids);if(doc.executiveProject?.sheets.some(s=>s.routes.some(route=>route.sourceIds?.some(id=>ids.has(id)))))return status('Сначала снимите назначение кабеля через «Удалить трассу» — затем удалите объект.');if(!confirm('Удалить выбранный объект?'))return;snapshot();if(doc.native&&!isNew(r))doc.nativeOps.push({handle:get(r,5),dx:0,dy:0,remove:true});if(r.type==='INSERT')doc.records=doc.records.filter(a=>!(a.type==='ATTRIB'&&get(a,330)===get(r,5)));for(const b of doc.blocks.values())b.records=b.records.filter(x=>x!==r&&!(r.type==='INSERT'&&x.type==='ATTRIB'&&get(x,330)===get(r,5)));doc.entities=doc.entities.filter(x=>x!==r);doc.records=doc.records.filter(x=>x!==r);selected=null;changed();};
function adopt(next,fileName,file=null){doc=next;doc.sourceFile=file;sourceFile=file;name=fileName;history=[];future=[];hidden.clear();selected=null;draft=null;dirty=false;$('filename').textContent=name;$('save').textContent='Скачать изменения · '+(doc.native?'DWG':'DXF');for(const b of document.querySelectorAll('[data-tool="line"],[data-tool="text"]')){b.disabled=false;b.title="";}setTool('select');syncUndo();rebuild();fit();const h=doc.records.find(r=>r.type==='SECTION'&&get(r,2)==='HEADER'),i=h?.pairs.findIndex(p=>p[0]===9&&p[1]==='$INSUNITS');const u=i>=0?Number(h.pairs[i+1]?.[1]):0;$('units').value=({4:'.001',5:'.01',6:'m'})[u]||'1';}
function stopLoad(){loadId++;if(worker)worker.terminate();worker=null;clearTimeout(loadTimer);clearInterval(progressClock);const reject=rejectWorker;rejectWorker=null;reject?.(Error('Операция отменена'));$('busy').hidden=true;$('file').disabled=false;$('save').disabled=false;}
$('cancel').onclick=()=>{stopLoad();status('Загрузка отменена. Предыдущий чертёж сохранён.');};
async function openFile(file,restore=null){if(!restore&&dirty&&!confirm('Есть несохранённые изменения. Открыть другой файл?'))return;const limit=/\.dwg$/i.test(file.name)?128:256;if(file.size>limit*1024*1024)return status('Предел: DWG 128 МБ, DXF 256 МБ. На телефоне объём зависит от доступной памяти.');stopLoad();const token=loadId;$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;status('Читаю файл…');
 try{const bytes=await file.arrayBuffer();if(token!==loadId)return;let text,warnings=[],next;$('save').disabled=true;
 if(/\.dwg$/i.test(file.name)){
  if(!/^AC10\d\d/.test(new TextDecoder().decode(bytes.slice(0,6))))throw Error('Это не распознанный DWG.');
  const converted=await new Promise((resolve,reject)=>{rejectWorker=reject;worker=new Worker(new URL('./native-reader.mjs?v=0.14.3',import.meta.url),{type:'module'});worker.onmessage=e=>e.data.progress?progress(e.data.progress,e.data.percent):e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Не удалось запустить DWG-движок. Возможно, недостаточно памяти. Попробуйте меньший файл на компьютере.'));loadTimer=setTimeout(()=>reject(Error('Чтение заняло больше 5 минут. Попробуйте отдельный лист.')),300000);worker.postMessage(bytes,[bytes]);});
  if(token!==loadId)return;worker.terminate();worker=null;clearTimeout(loadTimer);
  warnings=converted.messages;next=converted.doc;
 }else{try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1251').decode(bytes);}}
 if(token!==loadId)return;if(!next)next=await parseDxfAsync(text,n=>progress('Разбираю DXF: '+n+'%',5+n*.85),()=>token!==loadId);if(token!==loadId)return;progress('Строю изображение…',95);await new Promise(r=>setTimeout(r,0));if(token!==loadId)return;
 if(restore?.state)replayRecovery(next,restore.state);
 adopt(next,restore?.name||file.name.replace(/\.(dwg|dxf)$/i,''),next.native?file:null);recoveryReady=true;
 if(restore?.units)$('units').value=restore.units;if(restore?.view){view={...restore.view};draw();}dirty=!!restore;
 await checkpoint(restore?'Восстановление':'Открытие файла');progress('Готово',100);status('Открыт '+file.name+'. '+(warnings.length?'Движок сообщил предупреждения: '+warnings.slice(0,2).join(' · '):'Проверьте список неподдерживаемых объектов справа.'));return true;
 }catch(e){if(token===loadId)status('Не удалось открыть: '+e.message);}finally{if(token===loadId)stopLoad();}}
$('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)openFile(f);};
$('demo').onclick=()=>{if(!dirty||confirm('Заменить несохранённый чертёж демо?')){stopLoad();adopt(demo(),'demo');status('Демонстрационный чертёж.');}};
$('save').onclick=()=>{$('exportReport').textContent=$('report').textContent;$('exportDialog').querySelector('h2').textContent='Сохранить копию в '+(doc.native?'DWG':'DXF')+'?';$('exportDescription').textContent=doc.native?'Записывается новая копия исходного DWG с изменениями. Проверка движком не заменяет проверку в AutoCAD. Новые линии, тексты и полилинии записываются в DWG. В исполнительных сохраняются оформление, трассы, выноски и поддерживаемые удаления. Исходный файл на диске не изменяется.':'Скачивается изменённый DXF. Проверьте результат в AutoCAD.';$('confirmExport').textContent='Скачать '+(doc.native?'DWG':'DXF');$('exportDialog').showModal();};
function download(blob,extension){progress('Готово',100);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-edited.'+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);dirty=false;$('filename').textContent=name;status(extension.toUpperCase()+' подготовлен к скачиванию. Проверьте копию в AutoCAD.');}
$('confirmExport').onclick=async()=>{if(doc.executiveProject?.sheets.length){await commitExecutive(doc.executiveProject,null,true);return;}if(!doc.native){download(new Blob([...serializeChunks(doc)],{type:'application/dxf'}),'dxf');return;}if(!sourceFile)return status('Нет исходного DWG для сохранения.');stopLoad();const token=loadId,ops=doc.nativeOps.map(o=>({...o}));$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;status('Готовлю сохранение DWG…');try{const buffer=await sourceFile.arrayBuffer();if(token!==loadId)return;const saved=await new Promise((resolve,reject)=>{rejectWorker=reject;worker=new Worker(new URL('./native-writer.mjs?v=0.14.3',import.meta.url),{type:'module'});worker.onmessage=e=>e.data.progress?progress(e.data.progress,e.data.percent):e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Не удалось записать DWG. Возможно, недостаточно памяти.'));loadTimer=setTimeout(()=>reject(Error('Запись заняла больше 5 минут.')),300000);worker.postMessage({buffer,ops,added:additions(doc)},[buffer]);});if(token!==loadId)return;download(new Blob([saved.buffer],{type:'application/acad'}),'dwg');}catch(e){if(token===loadId)status(e.message);}finally{if(token===loadId)stopLoad();}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='Escape'){executiveUI?.cancel();draft=null;setTool('select');}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo(e.shiftKey);}});
new ResizeObserver(()=>{const r=canvas.parentElement.getBoundingClientRect(),initial=width===1;width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);initial?fit():draw();}).observe(canvas.parentElement);
async function commitExecutive(project,cloneRequest=null,exportFile=false,copyRequest=null){
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
  const saved=await run('./executive-worker.mjs?v=0.14.3',{buffer,ops:doc.nativeOps,added:additions(doc),project,cloneRequest,copyRequest},[buffer]);
  if(token!==loadId)return;worker.terminate();worker=null;clearTimeout(loadTimer);
  const file=new File([saved.buffer],previousName+'.dwg',{type:'application/acad'}),readBuffer=saved.buffer;
  const read=await run('./native-reader.mjs?v=0.14.3',readBuffer,[readBuffer]);
  if(token!==loadId)return;adopt(read.doc,previousName,file);history=[...previousHistory,before].slice(-15);future=[];syncUndo();dirty=true;await checkpoint('Операция DWG завершена');
  if(exportFile)download(file,'dwg');else status('Исполнительная создана. Локальная копия сохранена. Для архива скачайте DWG.');
  const notices=[warningText(saved.warnings||0),...(read.messages||[])].filter(Boolean);
  if(notices.length)status((exportFile?'DWG подготовлен к скачиванию. ':'Исполнительная создана; скачайте DWG для сохранения. ')+'Предупреждения: '+[...new Set(notices)].join(' · '));
  if(cloneRequest)focusExecutive(doc.executiveProject?.sheets.find(s=>s.id===cloneRequest.sheetId));
  return true;
 }catch(e){if(token===loadId)status(e.message);return false;}finally{if(token===loadId)stopLoad();}
}
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
const objectButton=document.createElement('button');objectButton.textContent='Объект / кабель';objectButton.dataset.tool='object';objectButton.onclick=()=>setTool('object');document.querySelector('nav').prepend(objectButton);document.querySelector('[data-tool="select"]').textContent='Участок';
const copyButton=document.createElement('button'),pasteButton=document.createElement('button');copyButton.textContent='Копировать';pasteButton.textContent='Вставить';document.querySelector('nav').append(copyButton,pasteButton);
copyButton.onclick=()=>{if(selectedChain?.anchor===selected)return status("Для копирования отдельного CAD-объекта выберите «Участок» или «Прибор». Цепочка не преобразуется в один объект.");const r=current();if(!doc.native||!r||!/^dwg-/.test(r.id)||!['LINE','LWPOLYLINE','ARC','CIRCLE','TEXT','MTEXT','INSERT'].includes(r.type))return status('Выберите исходный CAD-объект: прибор, линию, полилинию, дугу или текст. Новые объекты сначала сохраните в DWG.');const shapes=selectedShapes();let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const s of shapes)for(const p of s.pts){a=Math.min(a,p[0]);b=Math.min(b,p[1]);c=Math.max(c,p[0]);d=Math.max(d,p[1]);}if(!Number.isFinite(a))return;clipboard={handle:get(r,5),matrix:selectedMatrix||[1,0,0,1,0,0],centre:[(a+c)/2,(b+d)/2],file:sourceFile};status('Объект скопирован. Нажмите «Вставить» и укажите место в исполнительной.');};
pasteButton.onclick=()=>{if(!clipboard)return status('Сначала скопируйте объект');setTool('paste');status('Укажите центр копии в выбранной исполнительной. Исходный объект останется на месте.');};
$('historyButton').onclick=async()=>{try{await recoveryQueue.catch(()=>{});const rows=await recovery.list(),list=$('recoveryList');list.replaceChildren();for(const row of rows){const button=document.createElement('button');button.textContent=row.name+' · '+new Date(row.time).toLocaleString()+' · '+row.label;button.onclick=async()=>{if(!$('busy').hidden)return;if(dirty&&!confirm('Восстановить эту версию? Текущие правки останутся в истории.'))return;try{await checkpoint('Перед восстановлением');const file=await recovery.source(row.sourceId);if(!file)throw Error('Исходный файл не найден');$('recoveryDialog').close();await openFile(file,await recovery.revision(row.id));}catch(e){status(e.message);}};list.append(button);}if(!rows.length)list.textContent='Сохранённых версий пока нет.';$('recoveryDialog').showModal();}catch(e){status('История недоступна: '+e.message);}};
recovery.list().then(rows=>{if(rows.length)$('autosaveStatus').textContent='Есть сохранённая работа — откройте «История / восстановить»';}).catch(e=>{$('autosaveStatus').textContent='Локальное сохранение недоступно: '+e.message;});
