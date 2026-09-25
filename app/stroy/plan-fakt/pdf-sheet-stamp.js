/* Preserve the source inscription; editable cell contents and reusable local directories. */
(function(){
'use strict';
const ns='http://www.w3.org/2000/svg',cfg=()=>S.data?.pages[S.pageNum]?.sheetLayout;
const names={person:'ФИО',company:'Компании',logo:'Логотипы',signature:'Подписи'};
const imageKind=k=>k==='logo'||k==='signature';
const imageOK=s=>/^data:image\/(png|jpeg|webp);base64,/.test(s||'');
function node(tag,attrs={},text){const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!=null)n.textContent=text;return n;}
function save(){redrawAll();lkQueueDrawingSave();}
function segments(scene){const hs=[],vs=[];for(const o of scene.objects){if(!o.style.stroke)continue;for(const path of o.paths||[])for(let i=1;i<path.length;i++){const [x,y]=path[i-1],[xx,yy]=path[i];if(Math.abs(y-yy)<.15&&Math.abs(x-xx)>2)hs.push({a:Math.min(x,xx),b:Math.max(x,xx),v:(y+yy)/2});if(Math.abs(x-xx)<.15&&Math.abs(y-yy)>2)vs.push({a:Math.min(y,yy),b:Math.max(y,yy),v:(x+xx)/2});}}return{hs,vs};}
function detect(scene){
 const W=scene.width,H=scene.height,{hs,vs}=segments(scene);
 const tops=hs.filter(l=>l.a>W*.4&&l.b>W*.9&&l.b-l.a>W*.20&&l.v>H*.72&&l.v<H*.96).sort((a,b)=>(b.b-b.a)-(a.b-a.a)||a.v-b.v);
 for(const top of tops){const bottom=hs.find(l=>Math.abs(l.a-top.a)<1&&Math.abs(l.b-top.b)<1&&l.v>H*.94&&l.v>top.v+H*.04);
 if(!bottom)continue;if([top.a,top.b].every(x=>vs.some(l=>Math.abs(l.v-x)<1&&l.a<=top.v+1&&l.b>=bottom.v-1)))return{x:top.a/W,y:top.v/H,w:(top.b-top.a)/W,h:(bottom.v-top.v)/H};}
 return null;
}
function cellsFor(scene,region,items){
 const W=scene.width,H=scene.height,r={x:region.x*W,y:region.y*H,w:region.w*W,h:region.h*H},all=segments(scene),hs=all.hs.filter(l=>l.b-l.a>r.w*.15),vs=all.vs.filter(l=>l.b-l.a>r.h*.20),eps=.8;
 const uniq=a=>a.sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>eps);
 const ys=uniq([r.y,r.y+r.h,...hs.filter(l=>l.v>r.y&&l.v<r.y+r.h&&l.b>r.x+1&&l.a<r.x+r.w-1).map(l=>l.v)]);
 const cells=[];
 for(let j=0;j<ys.length-1;j++){const y=ys[j],bottom=ys[j+1],mid=(y+bottom)/2;
 const xs=uniq([r.x,r.x+r.w,...vs.filter(l=>l.v>r.x&&l.v<r.x+r.w&&l.a<=mid&&l.b>=mid).map(l=>l.v)]);
 for(let i=0;i<xs.length-1;i++){const x=xs[i],right=xs[i+1];if(right-x<2||bottom-y<2)continue;
 const above=cells.find(c=>Math.abs(c.x-x)<eps&&Math.abs(c.w-(right-x))<eps&&Math.abs(c.y+c.h-y)<eps);
 const divider=hs.some(l=>Math.abs(l.v-y)<eps&&l.a<=(x+right)/2&&l.b>=(x+right)/2);
 if(above&&!divider)above.h=bottom-above.y;else cells.push({x,y,w:right-x,h:bottom-y});}}
 const viewport=scene.page.getViewport({scale:1});
 const text=items.filter(t=>t.str?.trim()).map(t=>{const m=pdfjsLib.Util.transform(viewport.transform,t.transform);return {text:t.str,start:m[4],x:m[4]+t.width/2,y:m[5]-Math.hypot(m[2],m[3])*.35,baseline:m[5]};});
 // A logo and company often share the last cell without a printed separator.
 const regions=cells.flatMap(c=>{const inside=text.filter(t=>t.x>=c.x&&t.x<c.x+c.w&&t.y>=c.y&&t.y<c.y+c.h),left=Math.min(...inside.map(t=>t.start)),cut=left-r.w*.006;
 if(c.x>r.x+r.w*.65&&Math.abs(c.x+c.w-r.x-r.w)<eps&&Math.abs(c.y+c.h-r.y-r.h)<eps&&inside.length&&cut>c.x+c.w*.20&&cut<c.x+c.w*.65)return[{...c,w:cut-c.x,kind:'logo'},{...c,x:cut,w:c.x+c.w-cut,kind:'company'}];
 return[c];});
 const result=regions.slice(0,250).map(c=>{const inside=text.filter(t=>t.x>=c.x&&t.x<c.x+c.w&&t.y>=c.y&&t.y<c.y+c.h).sort((a,b)=>Math.abs(a.baseline-b.baseline)>2?a.baseline-b.baseline:a.x-b.x);let lines=[];for(const t of inside){let line=lines.at(-1);if(!line||Math.abs(line.y-t.baseline)>2){line={y:t.baseline,parts:[]};lines.push(line);}line.parts.push(t.text);}return{kind:c.kind||'',x:(c.x-r.x)/r.w,y:(c.y-r.y)/r.h,w:c.w/r.w,h:c.h/r.h,text:lines.map(l=>l.parts.join(' ')).join('\n'),originalText:lines.map(l=>l.parts.join(' ')).join('\n')};});
 const signatureHeader=result.find(c=>/^Подпис[ьи]/i.test(c.text));if(signatureHeader)for(const c of result)if(c.y>signatureHeader.y&&Math.abs(c.x-signatureHeader.x)<.003&&Math.abs(c.w-signatureHeader.w)<.003)c.kind='signature';
 return result;
}

async function signatureData(scene,t){
 const region=t.region;if(!region)return{signatureVersion:1,signatureLayers:[]};
 const head=t.cells.find(c=>/^Подпис[ьи]/i.test(c.originalText||c.text||''));
 if(!head)return{signatureVersion:1,signatureLayers:[]};
 const rows=t.cells.map((c,i)=>({...c,index:i})).filter(c=>c.y>head.y&&Math.abs(c.x-head.x)<.003&&Math.abs(c.w-head.w)<.003);
 const r={x:region.x*scene.width,y:region.y*scene.height,w:region.w*scene.width,h:region.h*scene.height},layers=[],ids=new Set();
 for(const o of scene.objects){
  if(!o.style.stroke||!o.paths?.some(p=>p.length>3))continue;
  const [x,y,right,bottom]=o.box,cx=((x+right)/2-r.x)/r.w,cy=((y+bottom)/2-r.y)/r.h;
  if(cx<head.x-head.w*.25||cx>head.x+head.w*1.25||right-x>head.w*r.w*1.6||bottom-y>r.h*.22)continue;
  const row=rows.reduce((best,c)=>!best||Math.abs(c.y+c.h/2-cy)<Math.abs(best.y+best.h/2-cy)?c:best,null);
  if(!row||cy<row.y-row.h*.35||cy>row.y+row.h*1.35)continue;
  ids.add(o.id);layers.push({cell:row.index,d:o.d,style:o.style});
 }
 if(!layers.length)return{signatureVersion:1,signatureLayers:[]};
 const ratio=Math.min(4,2400/r.w,1000/r.h),cv=document.createElement('canvas');cv.width=Math.ceil(r.w*ratio);cv.height=Math.ceil(r.h*ratio);
 await PdfObjects.render(scene.page,scene,ids,{canvasContext:cv.getContext('2d'),viewport:scene.page.getViewport({scale:ratio}),transform:[1,0,0,1,-r.x*ratio,-r.y*ratio],background:'#fff'},pdfjsLib);
 return{signatureVersion:1,signatureLayers:layers,signatureBounds:r,signatureBaseImage:cv.toDataURL('image/png')};
}
async function upgradeSignatures(c,scene){const t=c.originalStamp;if(!t||t.signatureVersion)return;const data=await signatureData(scene,t);if(c.originalStamp===t)Object.assign(t,data);}
const attempted=new WeakSet(),pending=new WeakMap();
async function capture(c,region,manual=false){
 const live=S._pdfScene,pn=S.pageNum,src=S.standalonePdf;
 if(!live||live.pn!==pn||live.src!==src)throw Error('Подождите, пока загрузится PDF.');
 const scene=live.scene,W=scene.width,H=scene.height,ratio=Math.min(4,2400/(region.w*W),1000/(region.h*H)),cv=document.createElement('canvas');
 cv.width=Math.ceil(region.w*W*ratio);cv.height=Math.ceil(region.h*H*ratio);
 const content=await scene.page.getTextContent();
 await scene.page.render({canvasContext:cv.getContext('2d'),viewport:scene.page.getViewport({scale:ratio}),transform:[1,0,0,1,-region.x*W*ratio,-region.y*H*ratio],background:'#fff',annotationMode:pdfjsLib.AnnotationMode.DISABLE}).promise;
 if(cfg()!==c||S.pageNum!==pn||S.standalonePdf!==src)return false;
 const cells=cellsFor(scene,region,content.items),stamp={image:cv.toDataURL('image/png'),aspect:region.w*W/(region.h*H),region,cells};Object.assign(stamp,await signatureData(scene,stamp));
 if(cfg()!==c||S.pageNum!==pn||S.standalonePdf!==src)return false;if(manual)pushHistory();c.originalStamp=stamp;
 attempted.add(c);save();return true;
}
function ensure(){
 const c=cfg(),live=S._pdfScene;if(!c?.crop||pending.has(c)||!live||live.pn!==S.pageNum||live.src!==S.standalonePdf)return;
 if(c.originalStamp){if(c.originalStamp.signatureVersion)return;const job=upgradeSignatures(c,live.scene).then(()=>{if(cfg()===c)save();}).catch(e=>console.warn('Stamp signature update:',e)).finally(()=>pending.delete(c));pending.set(c,job);return;}if(attempted.has(c))return;
 attempted.add(c);const r=detect(live.scene);if(!r)return;
 const job=capture(c,r).catch(e=>console.warn('Original stamp:',e)).finally(()=>pending.delete(c));pending.set(c,job);
}
function render(c,g,interactive){
 const t=c.originalStamp,out=node('g'),w=g.w*.34,h=w/t.aspect,x=g.w-g.m-w,y=g.h-g.m-h;
 out.append(node('image',{x,y,width:w,height:h,href:t.signatureBaseImage||t.image,preserveAspectRatio:'none'}));
 t.cells.forEach((cell,i)=>{const cx=x+cell.x*w,cy=y+cell.y*h,cw=cell.w*w,ch=cell.h*h,pad=Math.min(g.w*.001,cw*.08,ch*.08);
 if(cell.changed){out.append(node('rect',{x:cx+pad,y:cy+pad,width:Math.max(0,cw-2*pad),height:Math.max(0,ch-2*pad),fill:'white'}));
 if(imageOK(cell.image))out.append(node('image',{x:cx+pad*2,y:cy+pad*2,width:cw-pad*4,height:ch-pad*4,href:cell.image,preserveAspectRatio:'xMidYMid meet'}));
 else {const lines=String(cell.text||'').split('\n'),size=Math.min(ch/(lines.length+1)*.85,g.w*.007,cw/Math.max(1,...lines.map(l=>l.length))/.56*.94);lines.forEach((line,j)=>out.append(node('text',{x:cx+cw/2,y:cy+ch/2+(j-(lines.length-1)/2)*size*1.2+size*.35,'text-anchor':'middle','font-family':'Arial, sans-serif','font-size':size,fill:'#111'},line)));}}
 if(interactive)out.append(node('rect',{x:cx,y:cy,width:cw,height:ch,fill:'transparent','pointer-events':'all','data-stamp-cell':i,tabindex:0,role:'button','aria-label':'Ячейка штампа: '+(cell.text||'пустая'),style:'cursor:pointer'}));});
 const bounds=t.signatureBounds;
 if(bounds){const layer=node('g',{transform:`translate(${x} ${y}) scale(${w/bounds.w} ${h/bounds.h}) translate(${-bounds.x} ${-bounds.y})`,'pointer-events':'none'});
 for(const item of t.signatureLayers||[]){if(t.cells[item.cell]?.changed)continue;const st=item.style;layer.append(node('path',{d:item.d,fill:st.fill||'none',stroke:st.stroke||'none','stroke-width':st.width||.1,'stroke-linecap':['butt','round','square'][st.cap]||'round','stroke-linejoin':['miter','round','bevel'][st.join]||'round',opacity:st.alpha??1,'stroke-dasharray':(st.dash||[]).join(' ')}));}out.append(layer);}
 out.append(PdfSheetLayout.renderSeal(c,g,{x:x+w*.66,y:y-h*.55,w:w*.32,h:w*.32,placeholderY:y-h*.55,placeholderH:h*.45},interactive));
 if(interactive){out.append(node('text',{x,y:y-g.w*.006,'font-family':'Arial','font-size':g.w*.008,fill:'#5f7388','pointer-events':'none'},'Исходный штамп · нажмите ячейку для изменения'));}
 return out;
}
let dbPromise;
function db(){return dbPromise ||= new Promise((resolve,reject)=>{const r=indexedDB.open('planfakt-stamp-directories',1);r.onupgradeneeded=()=>r.result.createObjectStore('entries',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>{dbPromise=null;reject(r.error);};});}
async function entries(){const d=await db();return new Promise((ok,no)=>{const r=d.transaction('entries').objectStore('entries').getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}
async function write(value,remove=false){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction('entries','readwrite');if(remove)tx.objectStore('entries').delete(value.id);else tx.objectStore('entries').put(value);tx.oncomplete=ok;tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error);});}
const css=document.createElement('style');css.textContent='[data-stamp-cell]:hover{fill:rgba(18,132,255,.12)}.stamp-panel{position:fixed;z-index:10010;inset:10vh auto auto 50%;transform:translateX(-50%);width:460px;max-width:92vw;max-height:80vh;overflow:auto;box-sizing:border-box;background:white;color:#172d43;border:1px solid #9aabba;border-radius:8px;box-shadow:0 8px 40px #0005;padding:20px;font:14px Arial}.stamp-panel h3{margin:0 0 15px}.stamp-panel label{display:block;margin:10px 0}.stamp-panel input,.stamp-panel textarea,.stamp-panel select{box-sizing:border-box;width:100%;padding:8px;font:14px Arial;border:1px solid #b8c2cb;border-radius:4px}.stamp-panel button{padding:8px;margin:4px 4px 4px 0;cursor:pointer}.stamp-panel small{display:block;color:#607080}.stamp-panel img{max-width:160px;max-height:90px}.stamp-panel [role=alert]{color:#a12820}';document.head.append(css);
let panel=null;
function close(){panel?.remove();panel=null;}
function dialog(title,html){close();const n=document.createElement('section');n.className='stamp-panel';n.setAttribute('role','dialog');n.innerHTML='<h3></h3>'+html;n.querySelector('h3').textContent=title;document.body.append(n);panel=n;n.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();});return n;}
function options(n){for(const[k,v]of Object.entries(names))n.add(new Option(v,k));}
async function fileData(f){if(!f||!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>5*1024*1024)throw Error('Нужна картинка PNG, JPG или WebP до 5 МБ.');const url=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f);});const im=new Image();im.src=url;await im.decode();return url;}
function controls(){
 const c=cfg();if(!c)return;const n=dialog('Исходный штамп','<p>Разметка, подписи и логотип остаются как в PDF. Нажмите любую ячейку на листе для изменения её содержимого.</p><button id="stampSourceSelect">Выбрать штамп в исходном PDF</button><button id="stampDirectories">Справочники</button><button id="stampClose">Закрыть</button><small>Справочники хранятся в этом браузере. Выбранные значения и изображения включаются в проект.</small>');
 n.querySelector('#stampSourceSelect').onclick=()=>{close();PdfSheetLayout.selectRegion(async r=>{try{if(cfg()===c&&await capture(c,r,true))toast('Исходный штамп добавлен. Нажмите ячейку для изменения.');}catch(e){toast(e.message);}});};
 n.querySelector('#stampDirectories').onclick=()=>manager();
 n.querySelector('#stampClose').onclick=close;
}
async function editCell(index){
 const c=cfg(),pn=S.pageNum,cell=c?.originalStamp?.cells[index];if(!cell)return;
 const n=dialog('Ячейка исходного штампа','<label>Текст<textarea id="stampCellText" rows="4"></textarea></label><label>Справочник<select id="stampCategory"></select></label><label>Вставить из базы<select id="stampEntry"><option value="">Выберите запись…</option></select></label><img id="stampCellImage" hidden><p><button id="stampCellClear">Убрать изображение</button><button id="stampManage">Добавить / редактировать базу</button></p><p role="alert"></p><button id="stampCellApply">Применить</button><button id="stampCellOriginal">Вернуть оригинал ячейки</button><button id="stampCellCancel">Отмена</button>');
 n.id='stampCellDialog';const text=n.querySelector('textarea'),category=n.querySelector('#stampCategory'),select=n.querySelector('#stampEntry'),preview=n.querySelector('img'),error=n.querySelector('[role=alert]');text.value=cell.text||'';options(category);category.value=cell.kind||'person';let image=cell.image||null,data=[];
 const valid=()=>panel===n&&cfg()===c&&S.pageNum===pn;
 const showImage=()=>{preview.hidden=!image;preview.src=image||'';};showImage();text.oninput=()=>{image=null;showImage();};
 const fill=()=>{select.replaceChildren(new Option('Выберите запись…',''));for(const row of data.filter(v=>v.kind===category.value))select.add(new Option(row.name,row.id));};category.onchange=fill;
 select.onchange=()=>{const row=data.find(v=>v.id===select.value);if(!row)return;image=row.image||null;if(!image)text.value=row.value||row.name;showImage();};
 n.querySelector('#stampCellClear').onclick=()=>{image=null;showImage();};
 n.querySelector('#stampManage').onclick=()=>manager(category.value,()=>{if(cfg()===c&&S.pageNum===pn)editCell(index);});
 n.querySelector('#stampCellCancel').onclick=close;
 n.querySelector('#stampCellApply').onclick=()=>{if(!valid())return;pushHistory();Object.assign(cell,{text:text.value,image,kind:category.value,changed:true});close();save();};
 n.querySelector('#stampCellOriginal').onclick=()=>{if(!valid())return;pushHistory();cell.changed=false;cell.text=cell.originalText??cell.text;cell.image=null;close();save();};
 try{data=await entries();if(valid())fill();}catch(e){error.textContent='Не удалось открыть справочник.';}
}
async function manager(kind='person',back=controls){
 const n=dialog('Справочники штампа','<label>Раздел<select id="directoryKind"></select></label><label>Запись<select id="directoryEntry"><option value="">Новая запись</option></select></label><label>Название записи<input id="directoryName" maxlength="200"></label><label id="directoryValueLabel">Текст для вставки<textarea id="directoryValue" rows="3"></textarea></label><label id="directoryFileLabel">Изображение<input id="directoryFile" type="file" accept="image/png,image/jpeg,image/webp"></label><img id="directoryPreview" hidden><p role="alert"></p><button id="directorySave">Сохранить запись</button><button id="directoryDelete">Удалить запись</button><button id="directoryBack">Назад</button><small>Данные сохраняются в этом браузере. Изменение записи не меняет уже оформленные листы.</small>');
 n.id='stampDirectoryDialog';const k=n.querySelector('#directoryKind'),select=n.querySelector('#directoryEntry'),name=n.querySelector('#directoryName'),value=n.querySelector('#directoryValue'),error=n.querySelector('[role=alert]'),preview=n.querySelector('img');options(k);k.value=kind;let data=[],image=null;
 const show=()=>{n.querySelector('#directoryValueLabel').hidden=imageKind(k.value);n.querySelector('#directoryFileLabel').hidden=!imageKind(k.value);preview.hidden=!image;preview.src=image||'';n.querySelector('#directoryDelete').disabled=!select.value;};
 const load=()=>{const row=data.find(v=>v.id===select.value);name.value=row?.name||'';value.value=row?.value||'';image=row?.image||null;n.querySelector('#directoryFile').value='';show();};
 const fill=()=>{select.replaceChildren(new Option('Новая запись',''));data.filter(v=>v.kind===k.value).forEach(v=>select.add(new Option(v.name,v.id)));load();};
 k.onchange=fill;select.onchange=load;
 n.querySelector('#directoryFile').onchange=async e=>{try{const selectedKind=k.value,id=select.value,url=await fileData(e.target.files[0]);if(panel!==n||k.value!==selectedKind||select.value!==id)return;image=url;if(!name.value)name.value=e.target.files[0].name;show();error.textContent='';}catch(e){error.textContent=e.message;}};
 n.querySelector('#directorySave').onclick=async()=>{if(!name.value.trim()){error.textContent='Укажите название записи.';return;}if(imageKind(k.value)&&!image){error.textContent='Загрузите изображение.';return;}const row={id:select.value||crypto.randomUUID(),kind:k.value,name:name.value.trim(),value:imageKind(k.value)?'':value.value||name.value.trim(),image:imageKind(k.value)?image:null};
 error.textContent='Сохраняю…';try{await write(row);if(panel!==n)return;data=await entries();fill();select.value=row.id;load();error.textContent='Сохранено';}catch(e){error.textContent='Не удалось сохранить запись. Проверьте место в браузере.';}};
 n.querySelector('#directoryDelete').onclick=async()=>{const row=data.find(v=>v.id===select.value);if(!row)return;try{await write(row,true);if(panel!==n)return;data=await entries();fill();error.textContent='Запись удалена';}catch(e){error.textContent='Не удалось удалить запись.';}};
 n.querySelector('#directoryBack').onclick=back;show();const loading=[...n.querySelectorAll('input,select,textarea,button:not(#directoryBack)')];loading.forEach(el=>el.disabled=true);
 try{data=await entries();if(panel===n){loading.forEach(el=>el.disabled=false);fill();}}catch(e){error.textContent='Не удалось открыть справочники.';}
}
document.addEventListener('pointerdown',e=>{const cell=e.target.closest('[data-stamp-cell]');if(cell){e.preventDefault();e.stopImmediatePropagation();editCell(+cell.dataset.stampCell);}},true);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-stamp-cell]')){e.preventDefault();editCell(+e.target.dataset.stampCell);}});
for(const name of ['goPage','closeStandalonePdf']){const old=window[name];window[name]=function(...args){close();return old.apply(this,args);};}
const prepare=prepareStandalonePdfVectors;prepareStandalonePdfVectors=function(...args){return Promise.resolve(prepare.apply(this,args)).then(r=>{ensure();return r;});};
const directoryButton=document.createElement('button');directoryButton.id='sheetQuickDirectories';directoryButton.textContent='Справочники';directoryButton.onclick=()=>manager();$('sheetQuickActions').append(directoryButton);
const sourceButton=document.createElement('button');sourceButton.id='sheetOriginalStamp';sourceButton.textContent='Взять штамп из исходного PDF';sourceButton.onclick=()=>{$('pdfSheetLayoutDialog').style.display='none';controls();};$('stamp_code').closest('label').before(sourceButton);
window.PdfSheetStamp={prepareForExport:upgradeSignatures,ensure,render,controls,detect,cellsFor,capture};
})();
