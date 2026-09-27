// SPDX-License-Identifier: GPL-3.0-or-later
import {parseDxfAsync,scene,serializeChunks,cloneDoc,demo,get,num,set,decode,move,addEntity} from './cad.mjs?v=0.11';
import {paintShapes,previewTransform} from './renderer.mjs?v=0.11';
import {loadCadFont} from './fonts.mjs?v=0.11';
import {clampProgress} from './progress.mjs?v=0.11';
import {isNew,additions} from './authoring.mjs?v=0.11';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let doc=demo(),view={x:0,y:0,s:1},drawing,selected=null,hidden=new Set(),tool='select',draft=null,history=[],future=[],dirty=false,name='demo',worker=null,loadTimer=null,loadId=0;
let width=1,height=1,pointers=new Map(),gesture=null,sourceFile=null;
let polyPoints=[];
import {aciColors as colors} from './colors.mjs?v=0.11';
const status=s=>{$('status').textContent=s;if(!$('busy').hidden)$('busy').querySelector('strong').textContent=s;};
let progressStarted=0,progressClock;
function progress(s,n){status(s);if(n!==undefined){$('loadProgress').value=clampProgress(n);$('loadPercent').textContent=clampProgress(n)+'%';}}
function beginProgress(){progressStarted=Date.now();clearInterval(progressClock);progress('',0);progressClock=setInterval(()=>{$('loadElapsed').textContent='Прошло '+Math.floor((Date.now()-progressStarted)/1000)+' с · проценты по этапам, не оценка оставшегося времени';},1000);}
const world=p=>[(p[0]-view.x)/view.s,(view.y-p[1])/view.s],screen=p=>[p[0]*view.s+view.x,view.y-p[1]*view.s];
const local=e=>{const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];};
function current(){return doc.entities.find(r=>r.id===selected);}
function rebuild(){drawing=scene(doc);if(drawing.limited)status('Предел отображения: 3 000 000 записей. Часть чертежа не показана.');$('report').textContent=drawing.shapes.length+' видимых примитивов. Не отображаются: '+(drawing.unsupported.map(([t,n])=>t+' × '+n).join(', ')||'нет известных пропусков')+(doc.nativeUnknown?' · не разобрано движком: '+doc.nativeUnknown:'')+(drawing.limited?' · достигнут предел объёма':'')+'. Только пространство модели.';renderLayers();properties();draw();}
function renderLayers(){const names=[...new Set(drawing.shapes.map(s=>s.layer))].sort();$('layers').replaceChildren();for(const layer of names){const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.checked=!hidden.has(layer);i.onchange=()=>{i.checked?hidden.delete(layer):hidden.add(layer);draw();};l.append(i,document.createTextNode(decode(layer)));$('layers').append(l);}}
const editable=r=>['LINE','LWPOLYLINE','CIRCLE','ARC','TEXT','MTEXT','INSERT'].includes(r.type)&&!num(r,210)&&!num(r,220)&&num(r,230,1)===1&&!(doc.native&&r.type==='INSERT'&&num(r,66));
function properties(){const r=current();$('props').hidden=!r;$('selection').textContent=r?r.type+' · '+(get(r,5)||r.id)+(editable(r)?'':' · только просмотр'):'Нажмите на объект на чертеже.';if(r){$('layer').value=decode(get(r,8,'0'));$('text').value=r.type==='TEXT'?decode(get(r,1)):'';$('text').disabled=r.type!=='TEXT'||!editable(r);$('dx').value=0;$('dy').value=0;$('props').querySelector('button[type=submit]').disabled=!editable(r);$('delete').disabled=(doc.native&&!isNew(r))||r.type==='INSERT'||!editable(r);}}
function changed(){dirty=true;$('filename').textContent=name+' · изменён';rebuild();}
function snapshot(){history.push(cloneDoc(doc));while(history.length>(doc.records.length>50000?3:15))history.shift();future=[];syncUndo();}
function syncUndo(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function undo(redo=false){if(!$('busy').hidden)return;const src=redo?future:history,dest=redo?history:future;if(!src.length)return;dest.push(cloneDoc(doc));doc=src.pop();selected=null;dirty=true;rebuild();syncUndo();}
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
   paintShapes(previewContext,drawing.shapes,{view,width,height,hidden,selected,colors});
   cached={drawing,selected,hiddenKey,view:{...view}};
  }
  const transform=previewTransform(view,cached.view);ctx.save();ctx.translate(transform.x,transform.y);ctx.scale(transform.scale,transform.scale);ctx.drawImage(preview,0,0,width,height);ctx.restore();
 }else{cached=null;paintShapes(ctx,drawing?.shapes||[],{view,width,height,hidden,selected,colors});}
 if(draft){const p=screen(draft);ctx.fillStyle='#ffbe6c';ctx.beginPath();ctx.arc(...p,5,0,7);ctx.fill();}
}
function zoom(f,p=[width/2,height/2]){const w=world(p),s=Math.max(1e-8,Math.min(1e8,view.s*f));view.s=s;view.x=p[0]-w[0]*s;view.y=p[1]+w[1]*s;markInteraction();draw();}
const distance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);};
function pick(p){let best=18,id=null;const w=world(p),pad=18/view.s;for(const s of drawing.shapes){const b=s.bounds;if(hidden.has(s.layer)||b[2]<w[0]-pad||b[0]>w[0]+pad||b[3]<w[1]-pad||b[1]>w[1]+pad)continue;const pts=s.pts.map(screen);let d=Infinity;if(s.text!==null){const a=pts[0];d=distance(p,a,[a[0]+Math.max(10,s.height*view.s*s.text.length*.5),a[1]]);}else for(let i=1;i<pts.length;i++)d=Math.min(d,distance(p,pts[i-1],pts[i]));if(d<best){best=d;id=s.id;}}selected=id;properties();draw();}
function setTool(t){tool=t;draft=null;polyPoints=[];document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)));$('hint').textContent=({select:'Нажмите на объект. Перемещение — в свойствах; перетаскивание двигает вид.',pan:'Перетаскивайте чертёж. Масштаб — колесом или двумя пальцами.', poly3:'Укажите три точки полилинии. Escape — отменить.',line:'Укажите начало и конец линии. Escape — отменить.',text:'Нажмите в точке вставки текста.',measure:'Укажите две точки. Единицы выбираются в панели справа.'})[t];draw();}
function tap(p){const w=world(p);if(tool==='select'){pick(p);return;}if(tool==='pan')return;
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
 if(Math.hypot(w[0]-start[0],w[1]-start[1])<1e-9)return;snapshot();selected=addEntity(doc,'LINE',[[10,start[0]],[20,start[1]],[30,0],[11,w[0]],[21,w[1]],[31,0]]).id;changed();}
canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);const p=local(e);pointers.set(e.pointerId,p);gesture={view:{...view},points:[...pointers.values()].map(p=>[...p]),start:p,moved:false,multi:pointers.size>1};};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,local(e));const ps=[...pointers.values()],g=gesture;if(!g)return;
 if(ps.length>=2&&g.points.length>=2){const mid=a=>[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2],dist=a=>Math.hypot(a[1][0]-a[0][0],a[1][1]-a[0][1]);view={...g.view};zoom(dist(ps)/Math.max(dist(g.points),1),mid(g.points));const a=mid(ps),b=mid(g.points);view.x+=a[0]-b[0];view.y+=a[1]-b[1];g.moved=true;draw();}
 else if(ps.length===1&&g.points.length===1){const p=ps[0],a=g.points[0];if(Math.hypot(p[0]-a[0],p[1]-a[1])>4)g.moved=true;if(g.moved){view.x=g.view.x+p[0]-a[0];view.y=g.view.y+p[1]-a[1];markInteraction();draw();}}};
canvas.onpointerup=e=>{const g=gesture;pointers.delete(e.pointerId);if(g&&!g.moved&&!g.multi)tap(local(e));gesture=pointers.size?{view:{...view},points:[...pointers.values()],moved:true,multi:true}:null;};
canvas.onpointercancel=()=>{pointers.clear();gesture=null;};
canvas.onwheel=e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.001),local(e));};canvas.addEventListener('wheel',()=>{},{passive:false});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('fit').onclick=fit;$('plus').onclick=()=>zoom(1.3);$('minus').onclick=()=>zoom(1/1.3);$('panel').onclick=()=>$('sidebar').classList.toggle('open');$('undo').onclick=()=>undo();$('redo').onclick=()=>undo(true);
$('grid').onclick=()=>{$('grid').setAttribute('aria-pressed',String($('grid').getAttribute('aria-pressed')!=='true'));draw();};
$('props').onsubmit=e=>{e.preventDefault();if(!$('busy').hidden)return;const r=current();if(!r||!editable(r))return;const dx=Number($('dx').value),dy=Number($('dy').value);if(!Number.isFinite(dx)||!Number.isFinite(dy))return status('Введите числовой сдвиг.');const op={handle:get(r,5),dx,dy};if(r.type==='TEXT'&&$('text').value!==decode(get(r,1)))op.text=$('text').value;snapshot();try{move(r,dx,dy);if(op.text!==undefined)set(r,1,op.text);if(doc.native&&!isNew(r))doc.nativeOps.push(op);changed();status('Изменения внесены. Скачайте копию '+(doc.native?'DWG':'DXF')+' для сохранения.');}catch(e){undo();status(e.message);}};
$('delete').onclick=()=>{const r=current();if(!$('busy').hidden||!r||(doc.native&&!isNew(r))||r.type==='INSERT'||!editable(r))return;if(!confirm('Удалить выбранный объект?'))return;snapshot();doc.entities=doc.entities.filter(x=>x!==r);doc.records=doc.records.filter(x=>x!==r);selected=null;changed();};
function adopt(next,fileName,file=null){doc=next;sourceFile=file;name=fileName;history=[];future=[];hidden.clear();selected=null;draft=null;dirty=false;$('filename').textContent=name;$('save').textContent='Скачать изменения · '+(doc.native?'DWG':'DXF');for(const b of document.querySelectorAll('[data-tool="line"],[data-tool="text"]')){b.disabled=false;b.title="";}setTool('select');syncUndo();rebuild();fit();const h=doc.records.find(r=>r.type==='SECTION'&&get(r,2)==='HEADER'),i=h?.pairs.findIndex(p=>p[0]===9&&p[1]==='$INSUNITS');const u=i>=0?Number(h.pairs[i+1]?.[1]):0;$('units').value=({4:'.001',5:'.01',6:'m'})[u]||'1';}
function stopLoad(){loadId++;if(worker)worker.terminate();worker=null;clearTimeout(loadTimer);clearInterval(progressClock);$('busy').hidden=true;$('file').disabled=false;$('save').disabled=false;}
$('cancel').onclick=()=>{stopLoad();status('Загрузка отменена. Предыдущий чертёж сохранён.');};
async function openFile(file){if(dirty&&!confirm('Есть несохранённые изменения. Открыть другой файл?'))return;const limit=/\.dwg$/i.test(file.name)?128:256;if(file.size>limit*1024*1024)return status('Предел: DWG 128 МБ, DXF 256 МБ. На телефоне объём зависит от доступной памяти.');stopLoad();const token=loadId;$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;status('Читаю файл…');
 try{const bytes=await file.arrayBuffer();if(token!==loadId)return;let text,warnings=[],next;$('save').disabled=true;
 if(/\.dwg$/i.test(file.name)){
  if(!/^AC10\d\d/.test(new TextDecoder().decode(bytes.slice(0,6))))throw Error('Это не распознанный DWG.');
  const converted=await new Promise((resolve,reject)=>{worker=new Worker(new URL('./native-reader.mjs?v=0.11',import.meta.url),{type:'module'});worker.onmessage=e=>e.data.progress?progress(e.data.progress,e.data.percent):e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Не удалось запустить DWG-движок. Возможно, недостаточно памяти. Попробуйте меньший файл на компьютере.'));loadTimer=setTimeout(()=>reject(Error('Чтение заняло больше 5 минут. Попробуйте отдельный лист.')),300000);worker.postMessage(bytes,[bytes]);});
  if(token!==loadId)return;worker.terminate();worker=null;clearTimeout(loadTimer);
  warnings=converted.messages;next=converted.doc;
 }else{try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1251').decode(bytes);}}
 if(token!==loadId)return;if(!next)next=await parseDxfAsync(text,n=>progress('Разбираю DXF: '+n+'%',5+n*.85),()=>token!==loadId);if(token!==loadId)return;progress('Строю изображение…',95);await new Promise(r=>setTimeout(r,0));if(token!==loadId)return;adopt(next,file.name.replace(/\.(dwg|dxf)$/i,''),next.native?file:null);progress('Готово',100);status('Открыт '+file.name+'. '+(warnings.length?'Движок сообщил предупреждения: '+warnings.slice(0,2).join(' · '):'Проверьте список неподдерживаемых объектов справа.'));
 }catch(e){if(token===loadId)status('Не удалось открыть: '+e.message);}finally{if(token===loadId)stopLoad();}}
$('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)openFile(f);};
$('demo').onclick=()=>{if(!dirty||confirm('Заменить несохранённый чертёж демо?')){stopLoad();adopt(demo(),'demo');status('Демонстрационный чертёж.');}};
$('save').onclick=()=>{$('exportReport').textContent=$('report').textContent;$('exportDialog').querySelector('h2').textContent='Сохранить копию в '+(doc.native?'DWG':'DXF')+'?';$('exportDescription').textContent=doc.native?'Записывается новая копия исходного DWG с изменениями. Проверка движком не заменяет проверку в AutoCAD. Новые линии, тексты и полилинии записываются в DWG. Удаление исходных объектов пока отключено; исходный файл не изменяется.':'Скачивается изменённый DXF. Проверьте результат в AutoCAD.';$('confirmExport').textContent='Скачать '+(doc.native?'DWG':'DXF');$('exportDialog').showModal();};
function download(blob,extension){progress('Готово',100);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-edited.'+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);dirty=false;$('filename').textContent=name;status(extension.toUpperCase()+' подготовлен к скачиванию. Проверьте копию в AutoCAD.');}
$('confirmExport').onclick=async()=>{if(!doc.native){download(new Blob([...serializeChunks(doc)],{type:'application/dxf'}),'dxf');return;}if(!sourceFile)return status('Нет исходного DWG для сохранения.');stopLoad();const token=loadId,ops=doc.nativeOps.map(o=>({...o}));$('busy').hidden=false;beginProgress();$('file').disabled=true;$('save').disabled=true;status('Готовлю сохранение DWG…');try{const buffer=await sourceFile.arrayBuffer();if(token!==loadId)return;const saved=await new Promise((resolve,reject)=>{worker=new Worker(new URL('./native-writer.mjs?v=0.11',import.meta.url),{type:'module'});worker.onmessage=e=>e.data.progress?progress(e.data.progress,e.data.percent):e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Не удалось записать DWG. Возможно, недостаточно памяти.'));loadTimer=setTimeout(()=>reject(Error('Запись заняла больше 5 минут.')),300000);worker.postMessage({buffer,ops,added:additions(doc)},[buffer]);});if(token!==loadId)return;download(new Blob([saved.buffer],{type:'application/acad'}),'dwg');}catch(e){if(token===loadId)status(e.message);}finally{if(token===loadId)stopLoad();}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='Escape'){draft=null;setTool('select');}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo(e.shiftKey);}});
new ResizeObserver(()=>{const r=canvas.parentElement.getBoundingClientRect(),initial=width===1;width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);initial?fit():draw();}).observe(canvas.parentElement);
rebuild();
