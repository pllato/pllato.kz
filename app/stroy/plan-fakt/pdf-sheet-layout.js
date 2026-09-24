/* Non-destructive sheet composition. Source/editor coordinates remain unchanged. */
(function(){
'use strict';
let choosing=false,dragRect=null,cropDraft=null;
const config=pn=>S.data?.pages[pn??S.pageNum]?.sheetLayout;
const active=()=>!choosing&&!S.linkedLkDocId&&S.standalonePdf&&config()?.crop?config():null;
const ns='http://www.w3.org/2000/svg';
function el(tag,attrs={},text){const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!=null)n.textContent=text;return n;}
const paper=el('svg',{id:'pdfSheetPaper'});paper.style.cssText='position:absolute;left:0;top:0;overflow:visible;pointer-events:none';stack.prepend(paper);
const outline=el('g',{id:'pdfSheetCropPreview'});outline.style.pointerEvents='none';svg.append(outline);
function geometry(c,W,H){const r={x:c.crop.x*W,y:c.crop.y*H,w:c.crop.w*W,h:c.crop.h*H},q=((c.rotation||0)%4+4)%4,rw=q%2?r.h:r.w,rh=q%2?r.w:r.h,m=rw*.025,header=rw*.075,footer=rw*.23;
 const w=rw+2*m,h=rh+header+footer+3*m,tx=m,ty=header+m;
 const matrices=[[1,0,0,1,tx-r.x,ty-r.y],[0,1,-1,0,tx+r.h+r.y,ty-r.x],[-1,0,0,-1,tx+r.w+r.x,ty+r.h+r.y],[0,-1,1,0,tx-r.y,ty+r.w+r.x]];
 return {r,q,w,h,m,header,footer,rw,rh,matrix:matrices[q],bottom:ty+rh+m};
}
function map(p,g){const[a,b,c,d,e,f]=g.matrix;return{x:a*p.x+c*p.y+e,y:b*p.x+d*p.y+f};}
function sourcePoint(p,g){const[a,b,c,d,e,f]=g.matrix;return{x:a*(p.x-e)+b*(p.y-f),y:c*(p.x-e)+d*(p.y-f)};}
function textFit(s,max,font){s=String(s??'');const n=Math.max(2,Math.floor(max/(font*.58)));return s.length>n?s.slice(0,n-1)+'…':s;}
function decorations(c,g){const out=el('g'),font=g.w*.014,stroke=g.w*.0006;
 out.append(el('rect',{x:0,y:0,width:g.w,height:g.h,fill:'#fff',stroke:'#777','stroke-width':stroke}));
 const title=String(c.title||'Название чертежа');out.append(el('text',{x:g.w/2,y:g.header*.62,'text-anchor':'middle','font-family':'Arial, sans-serif','font-size':Math.min(g.w*.022,g.w*.9/Math.max(1,title.length*.6)),fill:'#152b40'},title));
 function table(x,y,w,h,rows){const cols=Math.max(1,...rows.map(r=>r.length)),rh=h/rows.length,cw=w/cols;
  out.append(el('rect',{x,y,width:w,height:h,fill:'white',stroke:'#273444','stroke-width':stroke}));
  for(let i=1;i<rows.length;i++)out.append(el('line',{x1:x,y1:y+i*rh,x2:x+w,y2:y+i*rh,stroke:'#273444','stroke-width':stroke}));
  for(let i=1;i<cols;i++)out.append(el('line',{x1:x+i*cw,y1:y,x2:x+i*cw,y2:y+h,stroke:'#273444','stroke-width':stroke}));
  rows.forEach((r,ri)=>r.forEach((v,ci)=>out.append(el('text',{x:x+ci*cw+font*.35,y:y+(ri+.5)*rh+font*.33,'font-family':'Arial, sans-serif','font-size':Math.min(font,rh*.55),fill:'#17202b'},textFit(v,cw-font*.7,Math.min(font,rh*.55))))));
 }
 const y=g.bottom,h=g.footer,w=(g.w-3*g.m)*.52,rightX=2*g.m+w,rightW=g.w-g.m-rightX;
 if(/^data:image\/(png|jpeg|webp);base64,/.test(c.tableImage||'')){out.append(el('rect',{x:g.m,y,width:w,height:h,fill:'#fff',stroke:'#273444','stroke-width':stroke}));out.append(el('image',{x:g.m+stroke,y:y+stroke,width:w-2*stroke,height:h-2*stroke,href:c.tableImage,preserveAspectRatio:'xMidYMid meet'}));}
 else if(c.table?.length)table(g.m,y,w,h,c.table);
 else{out.append(el('rect',{x:g.m,y,width:w,height:h,fill:'white',stroke:'#7d8894','stroke-width':stroke,'stroke-dasharray':g.w*.003}));out.append(el('text',{x:g.m+font,y:y+font*2,'font-family':'Arial, sans-serif','font-size':font,fill:'#687785'},'Место для таблицы'));}
 table(rightX,y,rightW,h,[['Роль','ФИО','Подпись','Дата'],...(c.signatures||[['Выполнил','','',''],['Проверил','','',''],['Согласовал','','','']])]);
 return out;
}
function draw(){const c=active();$('optbar').style.visibility=c&&S.tool==='select'&&!S.selected?'hidden':'';paper.replaceChildren();paper.style.display=c?'block':'none';
 for(const n of[baseimg,svg]){n.style.transformOrigin='0 0';n.style.transform='';n.style.clipPath='';}baseimg.style.boxShadow='';
 if(!c||!S.W||!S.H)return;
 const g=geometry(c,S.W,S.H),z=S.scale,[a,b,d,e,x,y]=g.matrix;
 paper.setAttribute('viewBox',`0 0 ${g.w} ${g.h}`);paper.style.width=g.w*z+'px';paper.style.height=g.h*z+'px';paper.append(decorations(c,g));
 const r=g.r,clip=`inset(${r.y/S.H*100}% ${(S.W-r.x-r.w)/S.W*100}% ${(S.H-r.y-r.h)/S.H*100}% ${r.x/S.W*100}%)`;
 for(const n of[baseimg,svg]){n.style.transform=`matrix(${a},${b},${d},${e},${x*z},${y*z})`;n.style.clipPath=clip;}baseimg.style.boxShadow='none';
}
const oldFit=fitPage;fitPage=function(){const c=active();if(!c)return oldFit();const g=geometry(c,S.W,S.H),w=$('cwrap');S.fitScale=Math.min((w.clientWidth-44)/g.w,(w.clientHeight-44)/g.h);S.scale=S.fitScale;S.pan.x=(w.clientWidth-g.w*S.scale)/2;S.pan.y=(w.clientHeight-g.h*S.scale)/2;};
const oldPoint=toImg;toImg=function(cx,cy){const c=active();if(!c)return oldPoint(cx,cy);const r=vp.getBoundingClientRect();return sourcePoint({x:(cx-r.left-S.pan.x)/S.scale,y:(cy-r.top-S.pan.y)/S.scale},geometry(c,S.W,S.H));};
const oldIn=inBase;inBase=function(cx,cy){const c=active();if(!c)return oldIn(cx,cy);const p=toImg(cx,cy),r=geometry(c,S.W,S.H).r;return p.x>=r.x&&p.y>=r.y&&p.x<=r.x+r.w&&p.y<=r.y+r.h;};
for(const name of ['applyTransform','redrawAll','renderOpt']){const old=window[name];window[name]=function(...args){const r=old.apply(this,args);draw();return r;};}
const oldCenter=center;center=function(id){const c=active();if(!c)return oldCenter(id);const o=getObj(id);if(!o)return;const b=bbox(o),p=map({x:b.x+b.w/2,y:b.y+b.h/2},geometry(c,S.W,S.H)),w=$('cwrap');S.scale=Math.max(S.scale,S.fitScale*2.2);S.pan.x=w.clientWidth/2-p.x*S.scale;S.pan.y=w.clientHeight/2-p.y*S.scale;applyTransform();};
function refresh(){fitPage();applyTransform();redrawAll();lkQueueDrawingSave();}
function cancelCrop(){choosing=false;dragRect=null;cropDraft=null;outline.replaceChildren();setTool('select');refresh();}
function beginCrop(){dialog.style.display='none';choosing=true;S.selected=null;S.cluster=[];setTool('sheet-crop');hideGuide();closeMobileDrawers();fitPage();applyTransform();toast('Обведите только область чертежа. Остальное будет скрыто.');}
window.addEventListener('pointerdown',e=>{if(!choosing||!vp.contains(e.target)||e.button!==0||!inBase(e.clientX,e.clientY))return;e.stopImmediatePropagation();const src=S.standalonePdf,pn=S.pageNum,a=toImg(e.clientX,e.clientY);pointerDrag(e,ev=>{if(!choosing||S.pageNum!==pn)return;const p=toImg(ev.clientX,ev.clientY),b={x:Math.max(0,Math.min(S.W,p.x)),y:Math.max(0,Math.min(S.H,p.y))};dragRect={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};outline.replaceChildren(el('rect',{x:dragRect.x,y:dragRect.y,width:dragRect.w,height:dragRect.h,fill:'rgba(20,130,255,.12)',stroke:'#1284ff','stroke-width':2/S.scale}));},ev=>{if(src!==S.standalonePdf||pn!==S.pageNum)return;const r=dragRect;if(ev.type==='pointercancel'||!r||r.w*S.scale<20||r.h*S.scale<20){cancelCrop();return;}pushHistory();const prior=config()||{};S.data.pages[pn].sheetLayout={...prior,...cropDraft,crop:{x:r.x/S.W,y:r.y/S.H,w:r.w/S.W,h:r.h/S.H},rotation:prior.rotation||0};cancelCrop();show();});},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&choosing)cancelCrop();});
for(const name of ['goPage','closeStandalonePdf']){const old=window[name];window[name]=function(...args){choosing=false;dragRect=null;outline.replaceChildren();dialog.style.display='none';const out=old.apply(this,args);draw();return out;};}
const button=document.createElement('button');button.className=$('btnHelp').className;button.id='pdfSheetLayoutButton';button.textContent='Оформить лист';$('btnHelp').before(button);button.onclick=()=>{if(!S.standalonePdf||S.linkedLkDocId){toast('Сначала откройте PDF в графическом формате');return;}show();};
const dialog=document.createElement('div');dialog.id='pdfSheetLayoutDialog';dialog.className='scale-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.innerHTML=`<div class="scale-card"><h3>Оформление листа</h3><div class="sheet-actions"><button id="sheetCrop">Выбрать область чертежа</button><button id="sheetLeft">↶ 90°</button><button id="sheetRight">↷ 90°</button><button id="sheetCenter">По центру</button></div><p id="sheetStatus"></p><label>Название сверху<input id="sheetTitle" maxlength="180" placeholder="Например: Исполнительная схема освещения"></label><label>Таблица снизу слева<textarea id="sheetTable" rows="5" placeholder="Скопируйте ячейки из Excel и вставьте сюда (до 8 столбцов и 12 строк)"></textarea></label><label>Или картинка таблицы<input id="sheetImage" type="file" accept="image/png,image/jpeg,image/webp"></label><button id="sheetClearImage">Убрать картинку</button><div id="sheetImageStatus"></div><h4>Подписи снизу справа</h4><div id="sheetSignatures"></div><p id="sheetError" role="alert"></p><div class="sheet-actions"><button id="sheetReset">Вернуть исходный лист</button><button id="sheetCancel">Отмена</button><button class="primary" id="sheetSave">Применить</button></div></div>`;document.body.append(dialog);
const css=document.createElement('style');css.textContent='#pdfSheetLayoutDialog .scale-card{max-width:760px;max-height:90dvh;overflow:auto}#pdfSheetLayoutDialog label{display:block;margin:12px 0}#pdfSheetLayoutDialog input:not([type=file]),#pdfSheetLayoutDialog textarea{width:100%;box-sizing:border-box;padding:8px;border:1px solid #b8c2cb;border-radius:5px;font:14px system-ui}#sheetSignatures{display:grid;grid-template-columns:1.1fr 1.5fr 1fr 1fr;gap:5px}#sheetSignatures input{min-width:0}#sheetError{color:#b3261e}.sheet-actions{display:flex;gap:8px;flex-wrap:wrap}.sheet-actions button{padding:9px 12px}';document.head.append(css);
let imageDraft=null;
function show(){const c=config()||{};imageDraft=c.tableImage||null;$('sheetTitle').value=c.title||'';$('sheetTable').value=(c.table||[]).map(r=>r.join('\t')).join('\n');$('sheetImage').value='';$('sheetImageStatus').textContent=imageDraft?'Картинка таблицы добавлена':'';$('sheetError').textContent='';$('sheetStatus').textContent=c.crop?'Область выбрана. Поворот: '+((c.rotation||0)*90)+'°.':'Сначала выберите область чертежа.';for(const id of ['sheetLeft','sheetRight','sheetCenter','sheetSave'])$(id).disabled=!c.crop;
 const host=$('sheetSignatures');host.replaceChildren();['Роль','ФИО','Подпись','Дата'].forEach(t=>{const n=document.createElement('span');n.textContent=t;host.append(n);});(c.signatures||[['Выполнил','','',''],['Проверил','','',''],['Согласовал','','','']]).forEach((r,ri)=>r.forEach((v,ci)=>{const n=document.createElement('input');n.value=v;n.maxLength=80;n.dataset.row=ri;n.dataset.col=ci;n.setAttribute('aria-label',['Роль','ФИО','Подпись','Дата'][ci]+' '+(ri+1));host.append(n);}));dialog.style.display='flex';$('sheetTitle').focus();}
function fields(){const raw=$('sheetTable').value.trim(),rows=raw?raw.split(/\r?\n/).map(r=>r.split('\t')):[];if(rows.length>12||rows.some(r=>r.length>8)){throw new Error('В таблице допускается до 12 строк и 8 столбцов. Для большей таблицы вставьте картинку.');}const signatures=[[],[],[]];$('sheetSignatures').querySelectorAll('input').forEach(n=>signatures[+n.dataset.row][+n.dataset.col]=n.value);return{title:$('sheetTitle').value.trim(),table:rows,tableImage:imageDraft,signatures};}
function commit(extra={}){try{const values=fields();pushHistory();S.data.pages[S.pageNum].sheetLayout={...config(),...values,...extra};refresh();return true;}catch(e){$('sheetError').textContent=e.message;return false;}}
$('sheetCrop').onclick=()=>{try{cropDraft=fields();}catch(e){$('sheetError').textContent=e.message;return;}if(config()?.crop&&!commit())return;beginCrop();};
$('sheetLeft').onclick=()=>{if(commit({rotation:((config()?.rotation||0)+3)%4}))show();};$('sheetRight').onclick=()=>{if(commit({rotation:((config()?.rotation||0)+1)%4}))show();};
$('sheetCenter').onclick=()=>{if(commit()){dialog.style.display='none';refresh();}};
$('sheetSave').onclick=()=>{if(commit()){dialog.style.display='none';toast('Оформление листа сохранено');}};
$('sheetCancel').onclick=()=>dialog.style.display='none';$('sheetReset').onclick=()=>{pushHistory();delete S.data.pages[S.pageNum].sheetLayout;dialog.style.display='none';refresh();};
$('sheetClearImage').onclick=()=>{imageDraft=null;$('sheetImage').value='';$('sheetImageStatus').textContent='';};
$('sheetImage').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>5*1024*1024){$('sheetError').textContent='Нужна картинка PNG, JPG или WebP до 5 МБ.';return;}const reader=new FileReader();reader.onload=()=>{imageDraft=reader.result;$('sheetImageStatus').textContent='Картинка: '+f.name;$('sheetError').textContent='';};reader.readAsDataURL(f);};
dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')dialog.style.display='none';});
const oldVector=buildVectorPdf;buildVectorPdf=async function(){if(Object.values(S.data?.pages||{}).some(p=>p.sheetLayout?.crop))return null;return oldVector();};
const oldUndo=undoLast;undoLast=function(){oldUndo();refresh();};$('btnUndo').onclick=undoLast;
window.PdfSheetLayout={geometry,map,sourcePoint,active,async compose(source,pn,wpt,hpt){const c=config(pn);if(!c?.crop)return{canvas:source,wpt,hpt};const g=geometry(c,source.width,source.height),ratio=Math.min(1,4096/g.w,4096/g.h,Math.sqrt(12000000/(g.w*g.h))),out=document.createElement('canvas');out.width=Math.ceil(g.w*ratio);out.height=Math.ceil(g.h*ratio);const cc=out.getContext('2d');
 const doc=el('svg',{xmlns:ns,width:g.w,height:g.h,viewBox:`0 0 ${g.w} ${g.h}`});doc.append(decorations(c,g));const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(doc));await img.decode();cc.drawImage(img,0,0,out.width,out.height);cc.save();cc.scale(ratio,ratio);cc.transform(...g.matrix);cc.beginPath();cc.rect(g.r.x,g.r.y,g.r.w,g.r.h);cc.clip();cc.drawImage(source,0,0);cc.restore();return{canvas:out,wpt:g.w/source.width*wpt,hpt:g.h/source.height*hpt};}};
})();
