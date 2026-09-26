// SPDX-License-Identifier: GPL-3.0-or-later
import {parseDxf,scene,serialize,demo,get,num,set,decode,move,addEntity} from './cad.mjs';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
let doc=demo(),view={x:0,y:0,s:1},drawing,selected=null,hidden=new Set(),tool='select',draft=null,history=[],future=[],dirty=false,name='demo',worker=null,loadTimer=null,loadId=0;
let width=1,height=1,pointers=new Map(),gesture=null;
const colors=['#eee','#ff7373','#e3ca63','#62d79a','#69d8e3','#72a7ff','#d19aff','#dbe5f0'];
const status=s=>$('status').textContent=s;
const world=p=>[(p[0]-view.x)/view.s,(view.y-p[1])/view.s],screen=p=>[p[0]*view.s+view.x,view.y-p[1]*view.s];
const local=e=>{const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];};
function current(){return doc.entities.find(r=>r.id===selected);}
function rebuild(){drawing=scene(doc);if(drawing.limited)status('Предел отображения: 150 000 записей. Часть чертежа не показана.');$('report').textContent=drawing.shapes.length+' видимых примитивов. Не отображаются: '+(drawing.unsupported.map(([t,n])=>t+' × '+n).join(', ')||'нет известных пропусков')+(drawing.limited?' · достигнут предел объёма':'')+'. Только пространство модели.';renderLayers();properties();draw();}
function renderLayers(){const names=[...new Set(drawing.shapes.map(s=>s.layer))].sort();$('layers').replaceChildren();for(const layer of names){const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.checked=!hidden.has(layer);i.onchange=()=>{i.checked?hidden.delete(layer):hidden.add(layer);draw();};l.append(i,document.createTextNode(decode(layer)));$('layers').append(l);}}
function properties(){const r=current();$('props').hidden=!r;$('selection').textContent=r?r.type+' · '+(get(r,5)||r.id):'Нажмите на объект на чертеже.';if(r){$('layer').value=decode(get(r,8,'0'));$('text').value=r.type==='TEXT'?decode(get(r,1)):'';$('text').disabled=r.type!=='TEXT';$('dx').value=0;$('dy').value=0;$('delete').disabled=r.type==='INSERT';}}
function changed(){dirty=true;$('filename').textContent=name+' · изменён';rebuild();}
function snapshot(){history.push(serialize(doc));while(history.length>1&&(history.length>15||history.reduce((n,s)=>n+s.length,0)>32*1024*1024))history.shift();future=[];syncUndo();}
function syncUndo(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function undo(redo=false){const src=redo?future:history,dest=redo?history:future;if(!src.length)return;dest.push(serialize(doc));doc=parseDxf(src.pop());selected=null;dirty=true;rebuild();syncUndo();}
function fit(){const pts=drawing.shapes.filter(s=>!hidden.has(s.layer)).flatMap(s=>s.pts);if(!pts.length){status('Нет поддерживаемых видимых объектов. Исходные данные сохранены в DXF.');return;}
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const p of pts){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}
 view.s=Math.min((width-60)/Math.max(maxX-minX,1),(height-80)/Math.max(maxY-minY,1));view.x=width/2-(minX+maxX)/2*view.s;view.y=height/2+(minY+maxY)/2*view.s;draw();}
function draw(){ctx.clearRect(0,0,width,height);ctx.lineWidth=1;ctx.strokeStyle='#17283a';for(let x=0;x<width;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}for(let y=0;y<height;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
 for(const s of drawing?.shapes||[]){if(hidden.has(s.layer))continue;const ps=s.pts.map(screen);ctx.strokeStyle=s.id===selected?'#ffbe6c':colors[s.color]||'#a9bed5';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=s.id===selected?2.5:1;
 if(s.text!==null){const p=ps[0],size=s.height*view.s;if(size<2||size>2000||p[0]<-2000||p[0]>width+2000||p[1]<-2000||p[1]>height+2000)continue;ctx.save();ctx.translate(...p);ctx.rotate(-s.angle);ctx.font=Math.max(2,size)+'px Arial';ctx.fillText(s.text,0,0);ctx.restore();}
 else{ctx.beginPath();ps.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}}
 if(draft){const p=screen(draft);ctx.fillStyle='#ffbe6c';ctx.beginPath();ctx.arc(...p,5,0,7);ctx.fill();}
}
function zoom(f,p=[width/2,height/2]){const w=world(p),s=Math.max(1e-8,Math.min(1e8,view.s*f));view.s=s;view.x=p[0]-w[0]*s;view.y=p[1]+w[1]*s;draw();}
const distance=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1)));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*y);};
function pick(p){let best=18,id=null;for(const s of drawing.shapes){if(hidden.has(s.layer))continue;const pts=s.pts.map(screen);let d=Infinity;if(s.text!==null){const a=pts[0];d=distance(p,a,[a[0]+Math.max(10,s.height*view.s*s.text.length*.5),a[1]]);}else for(let i=1;i<pts.length;i++)d=Math.min(d,distance(p,pts[i-1],pts[i]));if(d<best){best=d;id=s.id;}}selected=id;properties();draw();}
function setTool(t){tool=t;draft=null;document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)));$('hint').textContent=({select:'Нажмите на объект. Перемещение — в свойствах; перетаскивание двигает вид.',pan:'Перетаскивайте чертёж. Масштаб — колесом или двумя пальцами.',line:'Укажите начало и конец линии. Escape — отменить.',text:'Нажмите в точке вставки текста.',measure:'Укажите две точки. Единицы выбираются в панели справа.'})[t];draw();}
function tap(p){const w=world(p);if(tool==='select'){pick(p);return;}if(tool==='pan')return;
 if(tool==='text'){const text=prompt('Текст подписи:');if(!text)return;snapshot();const r=addEntity(doc,'TEXT',[[10,w[0]],[20,w[1]],[30,0],[40,18/view.s],[1,text],[50,0],[100,'AcDbText']]);selected=r.id;changed();return;}
 if(!draft){draft=w;draw();return;}const start=draft;draft=null;
 if(tool==='measure'){const n=Math.hypot(w[0]-start[0],w[1]-start[1]),u=$('units').value,f=u==='m'?1:Number(u);status('Расстояние: '+(n*f).toLocaleString('ru-RU',{maximumFractionDigits:3})+(u==='1'?' ед. чертежа':' м')+' · прямая между точками');draw();return;}
 if(Math.hypot(w[0]-start[0],w[1]-start[1])<1e-9)return;snapshot();selected=addEntity(doc,'LINE',[[10,start[0]],[20,start[1]],[30,0],[11,w[0]],[21,w[1]],[31,0]]).id;changed();}
canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);const p=local(e);pointers.set(e.pointerId,p);gesture={view:{...view},points:[...pointers.values()].map(p=>[...p]),start:p,moved:false,multi:pointers.size>1};};
canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,local(e));const ps=[...pointers.values()],g=gesture;if(!g)return;
 if(ps.length>=2&&g.points.length>=2){const mid=a=>[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2],dist=a=>Math.hypot(a[1][0]-a[0][0],a[1][1]-a[0][1]);view={...g.view};zoom(dist(ps)/Math.max(dist(g.points),1),mid(g.points));const a=mid(ps),b=mid(g.points);view.x+=a[0]-b[0];view.y+=a[1]-b[1];g.moved=true;draw();}
 else if(ps.length===1&&g.points.length===1){const p=ps[0],a=g.points[0];if(Math.hypot(p[0]-a[0],p[1]-a[1])>4)g.moved=true;if(g.moved){view.x=g.view.x+p[0]-a[0];view.y=g.view.y+p[1]-a[1];draw();}}};
canvas.onpointerup=e=>{const g=gesture;pointers.delete(e.pointerId);if(g&&!g.moved&&!g.multi)tap(local(e));gesture=pointers.size?{view:{...view},points:[...pointers.values()],moved:true,multi:true}:null;};
canvas.onpointercancel=()=>{pointers.clear();gesture=null;};
canvas.onwheel=e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.001),local(e));};canvas.addEventListener('wheel',()=>{},{passive:false});
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
$('fit').onclick=fit;$('plus').onclick=()=>zoom(1.3);$('minus').onclick=()=>zoom(1/1.3);$('panel').onclick=()=>$('sidebar').classList.toggle('open');$('undo').onclick=()=>undo();$('redo').onclick=()=>undo(true);
$('props').onsubmit=e=>{e.preventDefault();const r=current();if(!r)return;const dx=Number($('dx').value),dy=Number($('dy').value);if(!Number.isFinite(dx)||!Number.isFinite(dy))return status('Введите числовой сдвиг.');snapshot();try{move(r,dx,dy);if(r.type==='TEXT')set(r,1,$('text').value);changed();status('Изменения внесены. Скачайте DXF для сохранения.');}catch(e){undo();status(e.message);}};
$('delete').onclick=()=>{const r=current();if(!r||r.type==='INSERT')return;if(!confirm('Удалить выбранный объект?'))return;snapshot();doc.entities=doc.entities.filter(x=>x!==r);doc.records=doc.records.filter(x=>x!==r);selected=null;changed();};
function adopt(next,fileName){doc=next;name=fileName;history=[];future=[];hidden.clear();selected=null;draft=null;dirty=false;$('filename').textContent=name;syncUndo();rebuild();fit();const h=doc.records.find(r=>r.type==='SECTION'&&get(r,2)==='HEADER'),i=h?.pairs.findIndex(p=>p[0]===9&&p[1]==='$INSUNITS');const u=i>=0?Number(h.pairs[i+1]?.[1]):0;$('units').value=({4:'.001',5:'.01',6:'m'})[u]||'1';}
function stopLoad(){loadId++;if(worker)worker.terminate();worker=null;clearTimeout(loadTimer);$('busy').hidden=true;$('file').disabled=false;}
$('cancel').onclick=()=>{stopLoad();status('Загрузка отменена. Предыдущий чертёж сохранён.');};
async function openFile(file){if(dirty&&!confirm('Есть несохранённые изменения. Открыть другой файл?'))return;if(file.size>20*1024*1024)return status('Для прототипа максимум 20 МБ. На телефоне лучше отдельный лист до 5 МБ.');stopLoad();const token=loadId;$('busy').hidden=false;$('file').disabled=true;status('Читаю файл…');
 try{const bytes=await file.arrayBuffer();let text,warnings=[];
 if(/\.dwg$/i.test(file.name)){
  if(!/^AC10\d\d/.test(new TextDecoder().decode(bytes.slice(0,6))))throw Error('Это не распознанный DWG.');
  const converted=await new Promise((resolve,reject)=>{worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});worker.onmessage=e=>e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('Не удалось запустить DWG-движок. Возможно, недостаточно памяти. Попробуйте меньший файл на компьютере.'));loadTimer=setTimeout(()=>reject(Error('Чтение заняло больше 90 секунд. Используйте меньший файл.')),90000);worker.postMessage(bytes,[bytes]);});
  warnings=converted.messages;text=new TextDecoder().decode(converted.buffer);
 }else{try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1251').decode(bytes);}}
 if(token!==loadId)return;const next=parseDxf(text);adopt(next,file.name.replace(/\.(dwg|dxf)$/i,''));status('Открыт '+file.name+'. '+(warnings.length?'Движок сообщил предупреждения: '+warnings.slice(0,2).join(' · '):'Проверьте список неподдерживаемых объектов справа.'));
 }catch(e){if(token===loadId)status('Не удалось открыть: '+e.message);}finally{if(token===loadId)stopLoad();}}
$('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)openFile(f);};
$('demo').onclick=()=>{if(!dirty||confirm('Заменить несохранённый чертёж демо?')){stopLoad();adopt(demo(),'demo');status('Демонстрационный чертёж.');}};
$('save').onclick=()=>{$('exportReport').textContent=$('report').textContent;$('exportDialog').showModal();};
$('confirmExport').onclick=()=>{const blob=new Blob([serialize(doc)],{type:'application/dxf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-edited.dxf';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);dirty=false;$('filename').textContent=name;status('DXF подготовлен к скачиванию. Проверьте его в AutoCAD.');};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='Escape'){draft=null;setTool('select');}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo(e.shiftKey);}});
new ResizeObserver(()=>{const r=canvas.parentElement.getBoundingClientRect(),initial=width===1;width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx.setTransform(d,0,0,d,0,0);initial?fit():draw();}).observe(canvas.parentElement);
rebuild();
