/* Non-destructive sheet composition. Source/editor coordinates remain unchanged. */
(function(){
'use strict';
let choosing=false,dragRect=null,cropDraft=null,drawingEdit=false,regionCallback=null,selectedSeal=null;
const config=pn=>S.data?.pages[pn??S.pageNum]?.sheetLayout;
const active=()=>!choosing&&!S.linkedLkDocId&&S.standalonePdf&&config()?.crop?config():null;
const ns='http://www.w3.org/2000/svg';
function el(tag,attrs={},text){const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!=null)n.textContent=text;return n;}
const paper=el('svg',{id:'pdfSheetPaper'});paper.style.cssText='position:absolute;left:0;top:0;overflow:visible;pointer-events:none';stack.prepend(paper);
const marks=el('svg',{id:'pdfSheetMarks'});marks.style.cssText='position:absolute;left:0;top:0;overflow:visible;pointer-events:none';stack.append(marks);
const outline=el('g',{id:'pdfSheetCropPreview'});outline.style.pointerEvents='none';svg.append(outline);
function geometry(c,W,H){const r={x:c.crop.x*W,y:c.crop.y*H,w:c.crop.w*W,h:c.crop.h*H},q=((c.rotation||0)%4+4)%4,rw=q%2?r.h:r.w,rh=q%2?r.w:r.h;
 const w=Math.max(rw/.82,rh/.40),h=w/Math.SQRT2,m=w*.025,header=w*.075,footer=w*.20,tx=(w-rw)/2,ty=header+(h-header-footer-m-rh)/2;
 const matrices=[[1,0,0,1,tx-r.x,ty-r.y],[0,1,-1,0,tx+r.h+r.y,ty-r.x],[-1,0,0,-1,tx+r.w+r.x,ty+r.h+r.y],[0,-1,1,0,tx-r.y,ty+r.w+r.x]];
 const scale=Math.max(.1,Math.min(4,Number(c.drawingScale)||1)),cx=tx+rw/2,cy=ty+rh/2,matrix=matrices[q].map((v,i)=>i<4?v*scale:v*scale+(i===4?cx:cy)*(1-scale)+(i===4?(c.drawingOffset?.x||0)*w:(c.drawingOffset?.y||0)*h));
 return {r,q,w,h,m,header,footer,rw:rw*scale,rh:rh*scale,scale,matrix,bottom:h-m-footer};
}
function map(p,g){const[a,b,c,d,e,f]=g.matrix;return{x:a*p.x+c*p.y+e,y:b*p.x+d*p.y+f};}
function sourcePoint(p,g){const[a,b,c,d,e,f]=g.matrix;const det=a*d-b*c;return{x:(d*(p.x-e)-c*(p.y-f))/det,y:(a*(p.y-f)-b*(p.x-e))/det};}
function textFit(s,max,font){s=String(s??'');const n=Math.max(2,Math.floor(max/(font*.58)));return s.length>n?s.slice(0,n-1)+'…':s;}
function decorations(c,g,interactive=false){const out=el('g'),stroke=g.w*.00045,ink='#111',imageOK=v=>/^data:image\/(png|jpeg|webp);base64,/.test(v||'');
 function hit(x,y,w,h,path,value){if(!interactive)return;const n=el('rect',{x,y,width:w,height:h,fill:'transparent','pointer-events':'all','data-sheet-edit':JSON.stringify(path),'data-value':value??'',tabindex:0,role:'button','aria-label':path[0]==='table'?'Ячейка таблицы '+(path[1]+1)+', '+(path[2]+1):'Редактировать '+path.join(' ')});n.style.cursor='text';out.append(n);}
 function box(x,y,w,h){out.append(el('rect',{x,y,width:w,height:h,fill:'white',stroke:ink,'stroke-width':stroke}));}
 function line(x,y,x2,y2){out.append(el('line',{x1:x,y1:y,x2,y2,stroke:ink,'stroke-width':stroke}));}
 function text(t,x,y,size,max,attrs={}){out.append(el('text',{x,y,'font-family':'Arial, sans-serif','font-size':size,fill:ink,...attrs},textFit(t,max,size)));}
 function grid(x,y,w,h,rows,widths,maxFont=g.w*.010,kind){const n=Math.max(1,...rows.map(r=>r.length)),weights=widths||Array(n).fill(1/n),rh=h/rows.length;box(x,y,w,h);let cx=x;
  for(let i=0;i<n;i++){if(i)line(cx,y,cx,y+h);rows.forEach((r,j)=>text(r[i]||'',cx+w*.007,y+(j+.68)*rh,Math.min(maxFont,rh*.55),w*weights[i]-w*.014));cx+=w*weights[i];}
  for(let j=1;j<rows.length;j++)line(x,y+j*rh,x+w,y+j*rh);if(kind){let hx=x;for(let i=0;i<n;i++){rows.forEach((r,j)=>hit(hx,y+j*rh,w*weights[i],rh,kind==='signatures'?(j?['signatures',j-1,i]:['signatureHeaders',i]):[kind,j,i],r[i]||''));hx+=w*weights[i];}}
 }
 out.append(el('rect',{width:g.w,height:g.h,fill:'white'}));box(g.w*.012,g.w*.010,g.w*.976,g.h-g.w*.020);box(g.m,g.m*.65,g.w-2*g.m,g.h-g.m*1.65);
 const title=String(c.title||'Исполнительная схема');text(title,g.w*.56,g.header*.65,Math.min(g.w*.019,g.w*.70/Math.max(1,title.length*.52)),g.w*.76,{'text-anchor':'middle','font-family':'Times New Roman, serif','font-style':'italic'});hit(g.w*.18,g.header*.25,g.w*.77,g.header*.55,['title'],c.title||'');
 if(c.compass?.enabled){const cp=c.compass,x=(cp.x??.10)*g.w,y=(cp.y??.13)*g.h,size=g.w*.042,grp=el('g',{'data-sheet-compass':'1',transform:`translate(${x} ${y}) rotate(${Number(cp.angle)||0})`});
  grp.append(el('circle',{r:size*1.4,fill:'transparent',stroke:'none','pointer-events':'all'}));
  for(let i=0;i<8;i++){const arm=el('g',{transform:`rotate(${i*45})`}),len=i%2?size*.52:size;arm.append(el('path',{d:`M 0 ${-len} L ${size*.15} 0 L 0 ${size*.10} Z`,fill:'white',stroke:ink,'stroke-width':stroke}),el('path',{d:`M 0 ${-len} L ${-size*.15} 0 L 0 ${size*.10} Z`,fill:ink,stroke:ink,'stroke-width':stroke}));grp.append(arm);}
  [['С',0,-size*1.2],['Ю',0,size*1.45],['З',-size*1.32,size*.1],['В',size*1.32,size*.1]].forEach(([v,px,py])=>grp.append(el('text',{x:px,y:py,'text-anchor':'middle','font-family':'Arial','font-size':size*.30,fill:ink},v)));out.append(grp);
 }
 const leftW=g.w*.43,tableRows=c.table?.length?c.table:[['№','Наименование','Сечение','Ед. изм.','Кол-во'],['','','','','']],tableH=Math.min(g.footer,Math.max(g.w*.055,tableRows.length*g.w*.020)),tableY=g.h-g.m-tableH;
 if(imageOK(c.tableImage)){box(g.m,g.bottom,leftW,g.footer);out.append(el('image',{x:g.m,y:g.bottom,width:leftW,height:g.footer,href:c.tableImage,preserveAspectRatio:'xMinYMax meet'}));hit(g.m,g.bottom,leftW,g.footer,['table',0,0],c.table?.[0]?.[0]||'');}
 else grid(g.m,tableY,leftW,tableH,tableRows,tableRows[0]?.length===5&&tableRows.every(r=>r.length<=5)?[.10,.40,.18,.14,.18]:null,g.w*.010,'table');
 if(interactive){const by=(c.tableImage?g.bottom:tableY)-g.w*.025;out.append(el('rect',{x:g.m,y:by,width:leftW,height:g.w*.022,fill:'#eef5fc',stroke:'#91b0cf','stroke-width':stroke,'data-sheet-table':'1','pointer-events':'all',tabindex:0,role:'button','aria-label':'Вставить таблицу из Excel целиком',style:'cursor:pointer'}));text('Вставить таблицу из Excel целиком',g.m+g.w*.005,by+g.w*.015,g.w*.009,leftW-g.w*.01,{'pointer-events':'none',fill:'#203d59'});}
 // Main inscription resembles the supplied engineering sheet; blank fields are editable.
 if(c.originalStamp&&window.PdfSheetStamp){out.append(PdfSheetStamp.render(c,g,interactive));return out;}
 const sw=g.w*.32,sh=g.w*.105,sx=g.w-g.m-sw,sy=g.h-g.m-sh,lw=sw*.36,rw=sw-lw,meta=c.stamp||{};
 box(sx,sy,sw,sh);line(sx+lw,sy,sx+lw,sy+sh);
 grid(sx,sy,lw,sh*.30,c.revisions||[['Изм.','Кол.','Лист','№ док.','Подп.','Дата'],['','','','','',''],['','','','','','']],null,g.w*.0045,'revisions');
 grid(sx,sy+sh*.30,lw,sh*.70,[c.signatureHeaders||['Роль','ФИО','Подп.','Дата'],...(c.signatures||[['Выполнил','','',''],['Проверил','','',''],['Согласовал','','','']])],[.30,.34,.18,.18],g.w*.0047,'signatures');
 const rx=sx+lw;[.18,.51,.72].forEach(v=>line(rx,sy+sh*v,sx+sw,sy+sh*v));
 text(meta.code||'',rx+rw/2,sy+sh*.125,g.w*.006,rw*.95,{'text-anchor':'middle'});
 const projectLines=String(meta.project||'Наименование объекта').split(/\n/).slice(0,3);projectLines.forEach((v,i)=>text(v,rx+rw/2,sy+sh*(.27+i*.09),g.w*.0064,rw*.95,{'text-anchor':'middle'}));
 text(meta.drawing||c.title||'Исполнительная схема',rx+rw*.02,sy+sh*.64,g.w*.0064,rw*.72);line(rx+rw*.76,sy+sh*.51,rx+rw*.76,sy+sh);text('Лист '+(meta.sheet||S.pageNum||1),rx+rw*.78,sy+sh*.64,g.w*.006,rw*.20);
 text(meta.organization||'Организация',rx+rw*.02,sy+sh*.89,g.w*.007,rw*.72);text(meta.stage||'ИД',rx+rw*.79,sy+sh*.89,g.w*.007,rw*.19);
 for(const [key,x,y,w,h]of [['code',rx,sy,rw,sh*.18],['project',rx,sy+sh*.18,rw,sh*.33],['drawing',rx,sy+sh*.51,rw*.76,sh*.21],['sheet',rx+rw*.76,sy+sh*.51,rw*.24,sh*.21],['organization',rx,sy+sh*.72,rw*.76,sh*.28],['stage',rx+rw*.76,sy+sh*.72,rw*.24,sh*.28]])hit(x,y,w,h,['stamp',key],meta[key]||'');
 out.append(renderSeal(c,g,{x:sx+sw*.60,y:sy-sh*.40,w:sw*.38,h:sw*.38,placeholderY:sy-sh*.52,placeholderH:sh*.46},interactive));
 return out;
}
function draw(){const c=active();$('optbar').style.visibility=c&&S.tool==='select'&&!S.selected?'hidden':'';paper.replaceChildren();marks.replaceChildren();marks.style.display=c?'block':'none';paper.style.display=c?'block':'none';if(document.getElementById('sheetQuickActions'))$('sheetQuickActions').hidden=!c;
 for(const n of[baseimg,svg]){n.style.transformOrigin='0 0';n.style.transform='';n.style.clipPath='';}baseimg.style.boxShadow='';
 if(!c||!S.W||!S.H)return;
 window.PdfSheetStamp?.ensure();
 const g=geometry(c,S.W,S.H),z=S.scale,[a,b,d,e,x,y]=g.matrix;
 paper.setAttribute('viewBox',`0 0 ${g.w} ${g.h}`);paper.style.width=g.w*z+'px';paper.style.height=g.h*z+'px';paper.append(decorations(c,g,true));marks.setAttribute('viewBox',`0 0 ${g.w} ${g.h}`);marks.style.width=g.w*z+'px';marks.style.height=g.h*z+'px';const compass=paper.querySelector('[data-sheet-compass]');if(compass)marks.append(compass);const seal=paper.querySelector('[data-sheet-seal-object]');if(seal)marks.append(seal);bindCompass(g);bindSeal(c,g);drawDrawingControls(c,g);
 const r=g.r,clip=`inset(${r.y/S.H*100}% ${(S.W-r.x-r.w)/S.W*100}% ${(S.H-r.y-r.h)/S.H*100}% ${r.x/S.W*100}%)`;
 for(const n of[baseimg,svg]){n.style.transform=`matrix(${a},${b},${d},${e},${x*z},${y*z})`;n.style.clipPath=clip;}baseimg.style.boxShadow='none';
}
const oldFit=fitPage;fitPage=function(){const c=active();if(!c)return oldFit();const g=geometry(c,S.W,S.H),w=$('cwrap');S.fitScale=Math.min((w.clientWidth-44)/g.w,(w.clientHeight-44)/g.h);S.scale=S.fitScale;S.pan.x=(w.clientWidth-g.w*S.scale)/2;S.pan.y=(w.clientHeight-g.h*S.scale)/2;};
const oldPoint=toImg;toImg=function(cx,cy){const c=active();if(!c)return oldPoint(cx,cy);const r=vp.getBoundingClientRect();return sourcePoint({x:(cx-r.left-S.pan.x)/S.scale,y:(cy-r.top-S.pan.y)/S.scale},geometry(c,S.W,S.H));};
const oldIn=inBase;inBase=function(cx,cy){const c=active();if(!c)return oldIn(cx,cy);const p=toImg(cx,cy),r=geometry(c,S.W,S.H).r;return p.x>=r.x&&p.y>=r.y&&p.x<=r.x+r.w&&p.y<=r.y+r.h;};
for(const name of ['applyTransform','redrawAll','renderOpt']){const old=window[name];window[name]=function(...args){const r=old.apply(this,args);draw();return r;};}
const oldCenter=center;center=function(id){const c=active();if(!c)return oldCenter(id);const o=getObj(id);if(!o)return;const b=bbox(o),p=map({x:b.x+b.w/2,y:b.y+b.h/2},geometry(c,S.W,S.H)),w=$('cwrap');S.scale=Math.max(S.scale,S.fitScale*2.2);S.pan.x=w.clientWidth/2-p.x*S.scale;S.pan.y=w.clientHeight/2-p.y*S.scale;applyTransform();};
function refresh(){fitPage();applyTransform();redrawAll();lkQueueDrawingSave();}
function cancelCrop(){regionCallback=null;choosing=false;dragRect=null;cropDraft=null;outline.replaceChildren();setTool('select');refresh();}
function beginCrop(){regionCallback=null;drawingEdit=false;dialog.style.display='none';choosing=true;S.selected=null;S.cluster=[];setTool('sheet-crop');hideGuide();closeMobileDrawers();fitPage();applyTransform();toast('Обведите только область чертежа. Остальное будет скрыто.');}
window.addEventListener('pointerdown',e=>{if(!choosing||!vp.contains(e.target)||e.button!==0||!inBase(e.clientX,e.clientY))return;e.stopImmediatePropagation();const src=S.standalonePdf,pn=S.pageNum,a=toImg(e.clientX,e.clientY);pointerDrag(e,ev=>{if(!choosing||S.pageNum!==pn)return;const p=toImg(ev.clientX,ev.clientY),b={x:Math.max(0,Math.min(S.W,p.x)),y:Math.max(0,Math.min(S.H,p.y))};dragRect={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};outline.replaceChildren(el('rect',{x:dragRect.x,y:dragRect.y,width:dragRect.w,height:dragRect.h,fill:'rgba(20,130,255,.12)',stroke:'#1284ff','stroke-width':2/S.scale}));},ev=>{if(src!==S.standalonePdf||pn!==S.pageNum)return;const r=dragRect;if(ev.type==='pointercancel'||!r||r.w*S.scale<20||r.h*S.scale<20){cancelCrop();return;}if(regionCallback){const callback=regionCallback,region={x:r.x/S.W,y:r.y/S.H,w:r.w/S.W,h:r.h/S.H};cancelCrop();callback(region);return;}pushHistory();const prior=config()||{};S.data.pages[pn].sheetLayout={...prior,...cropDraft,crop:{x:r.x/S.W,y:r.y/S.H,w:r.w/S.W,h:r.h/S.H},rotation:prior.rotation||0};cancelCrop();show();});},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(choosing)cancelCrop();if(drawingEdit){drawingEdit=false;draw();}}});
for(const name of ['goPage','closeStandalonePdf']){const old=window[name];window[name]=function(...args){selectedSeal=null;regionCallback=null;drawingEdit=false;choosing=false;dragRect=null;outline.replaceChildren();dialog.style.display='none';const out=old.apply(this,args);draw();return out;};}
const button=document.createElement('button');button.className=$('btnHelp').className;button.id='pdfSheetLayoutButton';button.textContent='Оформить лист';$('btnHelp').before(button);button.onclick=()=>{if(!S.standalonePdf||S.linkedLkDocId){toast('Сначала откройте PDF в графическом формате');return;}show();};
const dialog=document.createElement('div');dialog.id='pdfSheetLayoutDialog';dialog.className='scale-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.innerHTML=`<div class="scale-card"><h3>Оформление листа</h3><div class="sheet-actions"><button id="sheetCrop">Выбрать область чертежа</button><button id="sheetLeft">↶ 90°</button><button id="sheetRight">↷ 90°</button><button id="sheetCenter">По центру</button></div><p id="sheetStatus"></p><label>Название сверху<input id="sheetTitle" maxlength="180" placeholder="Например: Исполнительная схема освещения"></label><label>Таблица снизу слева<textarea id="sheetTable" rows="5" placeholder="Скопируйте ячейки из Excel и вставьте сюда (до 26 столбцов и 100 строк)"></textarea></label><label>Или картинка таблицы<input id="sheetImage" type="file" accept="image/png,image/jpeg,image/webp"></label><button id="sheetClearImage">Убрать картинку</button><div id="sheetImageStatus"></div><h4>Подписи снизу справа</h4><div id="sheetSignatures"></div><p id="sheetError" role="alert"></p><div class="sheet-actions"><button id="sheetReset">Вернуть исходный лист</button><button id="sheetCancel">Отмена</button><button class="primary" id="sheetSave">Применить</button></div></div>`;document.body.append(dialog);
const extra=document.createElement('div');extra.innerHTML='<h4>Знак сторон света</h4><label><input type="checkbox" id="sheetCompassEnabled"> Добавить знак С–Ю–З–В</label><label>Поворот знака, градусы<input id="sheetCompassAngle" type="number" step="15"></label><p>Знак можно перетаскивать отдельно на листе.</p><h4>Основная надпись / штамп</h4><label>Обозначение документа<input id="stamp_code" maxlength="100"></label><label>Наименование объекта (до 3 строк)<textarea id="stamp_project" rows="3"></textarea></label><label>Название чертежа в штампе<input id="stamp_drawing" maxlength="140"></label><label>Организация<input id="stamp_organization" maxlength="100"></label><label>Номер листа<input id="stamp_sheet" maxlength="12"></label><label>Стадия<input id="stamp_stage" maxlength="12" placeholder="ИД"></label><label>Изображение вашей печати (необязательно)<input type="file" id="sheetSealImage" accept="image/png,image/jpeg,image/webp"></label><button id="sheetClearSeal">Убрать печать</button><span id="sheetSealStatus"></span>';$('sheetSignatures').after(extra);
const quick=document.createElement('div');quick.id='sheetQuickActions';quick.hidden=true;quick.style.cssText='position:absolute;left:10px;top:10px;z-index:26;display:flex;gap:4px;flex-wrap:wrap;max-width:90%';quick.innerHTML='<button id="sheetQuickDrawing" aria-pressed="false">Чертёж</button><span id="sheetDrawingTools" hidden><button id="sheetDrawingCenter">По центру</button><button id="sheetDrawingReset">Размер 100%</button><button id="sheetDrawingDone">Готово</button></span><button id="sheetQuickLeft" title="Повернуть чертёж налево">↶ Чертёж</button><button id="sheetQuickRight" title="Повернуть чертёж направо">↷ Чертёж</button><button id="sheetQuickCompass">Стороны света</button><button id="sheetQuickCompassTurn" title="Повернуть знак сторон света на 15 градусов">↻ Знак</button><button id="sheetQuickTable">Таблица</button><button id="sheetQuickStamp">Штамп</button>';$('cwrap').append(quick);

const css=document.createElement('style');css.textContent='#sheetDrawingTools[hidden]{display:none}#sheetQuickDrawing[aria-pressed=true]{background:#203d59;color:white}#sheetQuickActions[hidden]{display:none!important}#sheetQuickActions button{padding:7px 10px;border:1px solid #bac4cd;background:#fff;color:#203d59;border-radius:5px;cursor:pointer}#pdfSheetLayoutDialog input[type=checkbox]{width:auto!important}'+'#pdfSheetLayoutDialog .scale-card{max-width:760px;max-height:90dvh;overflow:auto}#pdfSheetLayoutDialog label{display:block;margin:12px 0}#pdfSheetLayoutDialog input:not([type=file]),#pdfSheetLayoutDialog textarea{width:100%;box-sizing:border-box;padding:8px;border:1px solid #b8c2cb;border-radius:5px;font:14px system-ui}#sheetSignatures{display:grid;grid-template-columns:1.1fr 1.5fr 1fr 1fr;gap:5px}#sheetSignatures input{min-width:0}#sheetError{color:#b3261e}.sheet-actions{display:flex;gap:8px;flex-wrap:wrap}.sheet-actions button{padding:9px 12px}';document.head.append(css);
let imageDraft=null,sealDraft=null;
function show(){const c=config()||{};imageDraft=c.tableImage||null;sealDraft=c.sealImage||null;$('sheetCompassEnabled').checked=!!c.compass?.enabled;$('sheetCompassAngle').value=c.compass?.angle||0;$('sheetSealImage').value='';$('sheetSealStatus').textContent=sealDraft?'Изображение печати добавлено':'';for(const key of ['code','project','drawing','organization','sheet','stage'])$('stamp_'+key).value=c.stamp?.[key]||'';$('sheetTitle').value=c.title||'';$('sheetTable').value=(c.table||[]).map(r=>r.join('\t')).join('\n');$('sheetImage').value='';$('sheetImageStatus').textContent=imageDraft?'Картинка таблицы добавлена':'';$('sheetError').textContent='';$('sheetStatus').textContent=c.crop?'Область выбрана. Поворот: '+((c.rotation||0)*90)+'°.':'Сначала выберите область чертежа.';for(const id of ['sheetLeft','sheetRight','sheetCenter','sheetSave'])$(id).disabled=!c.crop;
 const host=$('sheetSignatures');host.replaceChildren();['Роль','ФИО','Подпись','Дата'].forEach(t=>{const n=document.createElement('span');n.textContent=t;host.append(n);});(c.signatures||[['Выполнил','','',''],['Проверил','','',''],['Согласовал','','','']]).forEach((r,ri)=>r.forEach((v,ci)=>{const n=document.createElement('input');n.value=v;n.maxLength=80;n.dataset.row=ri;n.dataset.col=ci;n.setAttribute('aria-label',['Роль','ФИО','Подпись','Дата'][ci]+' '+(ri+1));host.append(n);}));dialog.style.display='flex';$('sheetTitle').focus();}
function fields(){const raw=$('sheetTable').value,rows=raw.trim()?raw.split(/\r?\n/).map(r=>r.split('\t')):[];if(rows.length>100||rows.some(r=>r.length>26)){throw new Error('В таблице допускается до 100 строк и 26 столбцов. Для большей таблицы вставьте картинку.');}const signatures=[[],[],[]];$('sheetSignatures').querySelectorAll('input').forEach(n=>signatures[+n.dataset.row][+n.dataset.col]=n.value);const stamp={};for(const key of ['code','project','drawing','organization','sheet','stage'])stamp[key]=$('stamp_'+key).value.trim();return{title:$('sheetTitle').value.trim(),table:rows,tableImage:imageDraft,signatures,stamp,sealImage:sealDraft,compass:{...(config()?.compass||{}),enabled:$('sheetCompassEnabled').checked,angle:Number($('sheetCompassAngle').value)||0}};}
function commit(extra={}){try{const values=fields();pushHistory();S.data.pages[S.pageNum].sheetLayout={...config(),...values,...extra};refresh();return true;}catch(e){$('sheetError').textContent=e.message;return false;}}
$('sheetCrop').onclick=()=>{try{cropDraft=fields();}catch(e){$('sheetError').textContent=e.message;return;}if(config()?.crop&&!commit())return;beginCrop();};
$('sheetLeft').onclick=()=>{if(commit({rotation:((config()?.rotation||0)+3)%4}))show();};$('sheetRight').onclick=()=>{if(commit({rotation:((config()?.rotation||0)+1)%4}))show();};
$('sheetCenter').onclick=()=>{if(commit({drawingOffset:{x:0,y:0}})){dialog.style.display='none';refresh();}};
$('sheetSave').onclick=()=>{if(commit()){dialog.style.display='none';toast('Оформление листа сохранено');}};
$('sheetCancel').onclick=()=>dialog.style.display='none';$('sheetReset').onclick=()=>{pushHistory();delete S.data.pages[S.pageNum].sheetLayout;dialog.style.display='none';refresh();};
$('sheetClearImage').onclick=()=>{imageDraft=null;$('sheetImage').value='';$('sheetImageStatus').textContent='';};
$('sheetImage').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>5*1024*1024){$('sheetError').textContent='Нужна картинка PNG, JPG или WebP до 5 МБ.';return;}const reader=new FileReader();reader.onload=()=>{imageDraft=reader.result;$('sheetImageStatus').textContent='Картинка: '+f.name;$('sheetError').textContent='';};reader.readAsDataURL(f);};
function change(values){if(!config()?.crop)return;pushHistory();Object.assign(config(),values);refresh();}

$('sheetQuickDrawing').onclick=()=>{drawingEdit=!drawingEdit;S.selected=null;S.cluster=[];setTool('select');hideGuide();redrawAll();if(drawingEdit)toast('Перетащите чертёж. Потяните за угол рамки, чтобы изменить размер.');};
$('sheetDrawingDone').onclick=()=>{drawingEdit=false;draw();};
$('sheetDrawingCenter').onclick=()=>change({drawingOffset:{x:0,y:0}});
$('sheetDrawingReset').onclick=()=>change({drawingScale:1});
function drawDrawingControls(c,g){
 $('sheetQuickDrawing').setAttribute('aria-pressed',String(drawingEdit));$('sheetDrawingTools').hidden=!drawingEdit;
 if(!drawingEdit)return;
 const points=[[g.r.x,g.r.y],[g.r.x+g.r.w,g.r.y],[g.r.x+g.r.w,g.r.y+g.r.h],[g.r.x,g.r.y+g.r.h]].map(([x,y])=>map({x,y},g)),
 x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=g.rw,h=g.rh,z=S.scale;
 const group=el('g',{'data-sheet-drawing':'1'});
 const body=el('rect',{x,y,width:w,height:h,fill:'rgba(18,132,255,.035)',stroke:'#1284ff','stroke-width':2/z,'stroke-dasharray':6/z,'pointer-events':'all',style:'cursor:move','data-drawing-move':'1'});
 group.append(body);
 function bind(n,corner){n.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();e.stopPropagation();
  const pn=S.pageNum,src=S.standalonePdf,oldScale=c.drawingScale,oldOffset=c.drawingOffset?{...c.drawingOffset}:undefined,start={x:e.clientX,y:e.clientY},offset={x:c.drawingOffset?.x||0,y:c.drawingOffset?.y||0};
  const center={x:x+w/2,y:y+h/2},anchor=corner?{x:corner[0]?x:x+w,y:corner[1]?y:y+h}:null,v=corner?{x:(corner[0]?1:-1)*w,y:(corner[1]?1:-1)*h}:null;
  pushHistory();
  pointerDrag(e,ev=>{
   if(S.pageNum!==pn||S.standalonePdf!==src)return;
   const dx=(ev.clientX-start.x)/z,dy=(ev.clientY-start.y)/z;
   if(!corner)c.drawingOffset={x:offset.x+dx/g.w,y:offset.y+dy/g.h};
   else{
    const ratio=Math.max(.1/g.scale,Math.min(4/g.scale,1+(dx*v.x+dy*v.y)/(v.x*v.x+v.y*v.y)));
    c.drawingScale=g.scale*ratio;
    c.drawingOffset={x:offset.x+(anchor.x+(center.x-anchor.x)*ratio-center.x)/g.w,y:offset.y+(anchor.y+(center.y-anchor.y)*ratio-center.y)/g.h};
   }
   applyTransform();
  },ev=>{if(S.pageNum!==pn||S.standalonePdf!==src)return;if(ev.type==='pointercancel'){c.drawingScale=oldScale;c.drawingOffset=oldOffset;}applyTransform();lkQueueDrawingSave();});
 });}
 bind(body);
 for(const [i,j]of [[0,0],[1,0],[1,1],[0,1]]){const n=el('rect',{x:x+i*w-6/z,y:y+j*h-6/z,width:12/z,height:12/z,fill:'white',stroke:'#1284ff','stroke-width':2/z,'pointer-events':'all','data-drawing-corner':i+','+j,style:'cursor:'+((i===j)?'nwse-resize':'nesw-resize')});group.append(n);bind(n,[i,j]);}
 marks.prepend(group);
}

$('sheetQuickLeft').onclick=()=>change({rotation:((config().rotation||0)+3)%4});$('sheetQuickRight').onclick=()=>change({rotation:((config().rotation||0)+1)%4});
$('sheetQuickCompass').onclick=()=>{if(!config().compass?.enabled)change({compass:{enabled:true,angle:0,x:.10,y:.13}});else{show();$('sheetCompassAngle').scrollIntoView({block:'center'});$('sheetCompassAngle').focus();}};
$('sheetQuickCompassTurn').onclick=()=>{const c=config().compass||{};change({compass:{...c,enabled:true,angle:((c.angle||0)+15)%360}});};
$('sheetQuickTable').onclick=()=>{show();$('sheetTable').scrollIntoView({block:'center'});$('sheetTable').focus();};$('sheetQuickStamp').onclick=()=>{if(config()?.originalStamp&&window.PdfSheetStamp){PdfSheetStamp.controls();return;}show();$('stamp_code').scrollIntoView({block:'center'});$('stamp_code').focus();};
$('sheetClearSeal').onclick=()=>{sealDraft=null;$('sheetSealImage').value='';$('sheetSealStatus').textContent='';};
$('sheetSealImage').onchange=e=>{const f=e.target.files[0];if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>5*1024*1024){$('sheetError').textContent='Нужна картинка PNG, JPG или WebP до 5 МБ.';return;}const reader=new FileReader();reader.onload=()=>{sealDraft=reader.result;$('sheetSealStatus').textContent=f.name;};reader.readAsDataURL(f);};

function renderSeal(c,g,b,interactive){
 const out=el('g'),has=/^data:image\/(png|jpeg|webp);base64,/.test(c.sealImage||'');
 if(!has){if(interactive){out.append(el('rect',{x:b.x,y:b.placeholderY??b.y,width:b.w,height:b.placeholderH??b.h,fill:'transparent',stroke:'#718399','stroke-width':g.w*.0004,'stroke-dasharray':g.w*.002,'pointer-events':'all','data-sheet-seal':'1',tabindex:0,role:'button','aria-label':'Выбрать печать',style:'cursor:pointer'}),el('text',{x:b.x+b.w/2,y:(b.placeholderY??b.y)+(b.placeholderH??b.h)*.6,'text-anchor':'middle','font-family':'Arial','font-size':g.w*.008,fill:'#5f7388','pointer-events':'none'},'Печать ▾'));}return out;}
 const w=Number.isFinite(c.sealSize?.w)&&c.sealSize.w>0?c.sealSize.w*g.w:b.w,h=Number.isFinite(c.sealSize?.h)&&c.sealSize.h>0?c.sealSize.h*g.h:b.h;
 const x=Number.isFinite(c.sealPosition?.x)?c.sealPosition.x*g.w:b.x,y=Number.isFinite(c.sealPosition?.y)?c.sealPosition.y*g.h:b.y;
 out.setAttribute('data-sheet-seal-object','1');out.setAttribute('data-x',x);out.setAttribute('data-y',y);out.setAttribute('data-width',w);out.setAttribute('data-height',h);
 out.append(el('image',{x,y,width:w,height:h,href:c.sealImage,preserveAspectRatio:'xMidYMid meet'}));
 if(interactive){out.append(el('rect',{x,y,width:w,height:h,fill:'transparent','pointer-events':'all','data-seal-move':'1',style:'cursor:move;touch-action:none',tabindex:0,role:'button','aria-label':'Печать: выделить и переместить'}));
 if(selectedSeal===c){const z=S.scale;out.append(el('rect',{x,y,width:w,height:h,fill:'none',stroke:'#1284ff','stroke-width':1.5/z,'pointer-events':'none',class:'sheet-seal-selection'}));const actions=el('g',{class:'sheet-seal-actions','data-sheet-seal':'1',style:'cursor:pointer','pointer-events':'all',tabindex:0,role:'button','aria-label':'Заменить или убрать печать'});actions.append(el('rect',{x,y:y-28/z,width:100/z,height:24/z,rx:3/z,fill:'white',stroke:'#1284ff','stroke-width':1/z}),el('text',{x:x+50/z,y:y-12/z,'text-anchor':'middle','font-family':'Arial','font-size':12/z,fill:'#203d59'},'Заменить / убрать'));out.append(actions);for(const [corner,cx,cy]of [['nw',x,y],['ne',x+w,y],['sw',x,y+h],['se',x+w,y+h]])out.append(el('rect',{x:cx-5/z,y:cy-5/z,width:10/z,height:10/z,fill:'white',stroke:'#1284ff','stroke-width':1.5/z,'pointer-events':'all','data-seal-resize':corner,class:'sheet-seal-handle',style:'cursor:'+(['nw','se'].includes(corner)?'nwse':'nesw')+'-resize;touch-action:none'}));}}
 return out;
}
function clearSealSelection(){selectedSeal=null;marks.querySelectorAll('.sheet-seal-selection,.sheet-seal-actions,.sheet-seal-handle').forEach(n=>n.remove());}
document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-sheet-seal-object],.sheet-seal-picker'))clearSealSelection();},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape')clearSealSelection();});
function bindSeal(c,g){
 const n=marks.querySelector('[data-sheet-seal-object]'),hit=n?.querySelector('[data-seal-move]');if(!hit)return;
 n.querySelectorAll('[data-seal-resize]').forEach(handle=>handle.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;e.preventDefault();e.stopPropagation();
 const pn=S.pageNum,src=S.standalonePdf,oldPos=c.sealPosition?{...c.sealPosition}:undefined,oldSize=c.sealSize?{...c.sealSize}:undefined,x=+n.dataset.x,y=+n.dataset.y,w=+n.dataset.width,h=+n.dataset.height,z=S.scale,corner=handle.dataset.sealResize,sx=corner.includes('w')?-1:1,sy=corner.includes('n')?-1:1,ax=sx<0?x+w:x,ay=sy<0?y+h:y,start={x:e.clientX,y:e.clientY};let moved=false;
 const valid=()=>config()===c&&S.pageNum===pn&&S.standalonePdf===src;
 pointerDrag(e,ev=>{if(!valid())return;const dx=(ev.clientX-start.x)/z,dy=(ev.clientY-start.y)/z;if(!moved&&Math.hypot(dx,dy)*z<3)return;if(!moved){pushHistory();moved=true;}
 const max=Math.min((sx<0?ax:g.w-ax)/w,(sy<0?ay:g.h-ay)/h),min=Math.min(max,Math.max(g.w*.01/w,g.h*.01/h)),factor=Math.max(min,Math.min(max,1+(sx*w*dx+sy*h*dy)/(w*w+h*h))),nw=w*factor,nh=h*factor;
 c.sealSize={w:nw/g.w,h:nh/g.h};c.sealPosition={x:(sx<0?ax-nw:ax)/g.w,y:(sy<0?ay-nh:ay)/g.h};draw();
 },ev=>{if(!valid())return;if(ev.type==='pointercancel'){c.sealPosition=oldPos;c.sealSize=oldSize;}draw();if(moved)lkQueueDrawingSave();});
 }));
 hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectedSeal=c;draw();}});
 hit.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();const pn=S.pageNum,src=S.standalonePdf,old=c.sealPosition?{...c.sealPosition}:undefined,x=Number(n.dataset.x),y=Number(n.dataset.y),w=Number(n.dataset.width),h=Number(n.dataset.height),z=S.scale,start={x:e.clientX,y:e.clientY};let moved=false;selectedSeal=c;draw();
 const valid=()=>config()===c&&S.pageNum===pn&&S.standalonePdf===src;
 pointerDrag(e,ev=>{if(!valid())return;const dx=ev.clientX-start.x,dy=ev.clientY-start.y;if(!moved&&Math.hypot(dx,dy)<3)return;if(!moved){pushHistory();moved=true;}c.sealPosition={x:Math.max(0,Math.min(g.w-w,x+dx/z))/g.w,y:Math.max(0,Math.min(g.h-h,y+dy/z))/g.h};draw();},ev=>{if(!valid())return;if(ev.type==='pointercancel')c.sealPosition=old;draw();if(moved)lkQueueDrawingSave();});
 });
}
function bindCompass(g){const n=marks.querySelector('[data-sheet-compass]');if(!n)return;n.style.pointerEvents='all';n.style.cursor='move';n.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.stopPropagation();e.preventDefault();const pn=S.pageNum,c=config(),old={...c.compass},start={x:e.clientX,y:e.clientY};pushHistory();pointerDrag(e,ev=>{if(S.pageNum!==pn)return;c.compass.x=Math.max(.05,Math.min(.95,(old.x??.1)+(ev.clientX-start.x)/S.scale/g.w));c.compass.y=Math.max(.07,Math.min(.93,(old.y??.13)+(ev.clientY-start.y)/S.scale/g.h));draw();},ev=>{if(S.pageNum!==pn)return;if(ev.type==='pointercancel')c.compass=old;draw();lkQueueDrawingSave();});});}
dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')dialog.style.display='none';});
const oldVector=buildVectorPdf;buildVectorPdf=async function(){if(Object.values(S.data?.pages||{}).some(p=>p.sheetLayout?.crop))return null;return oldVector();};
const oldUndo=undoLast;undoLast=function(){oldUndo();refresh();};$('btnUndo').onclick=undoLast;
window.PdfSheetLayout={renderSeal,selectRegion(callback){beginCrop();regionCallback=callback;toast('Обведите исходный штамп целиком, включая внешнюю рамку.');},geometry,map,sourcePoint,active,async compose(source,pn,wpt,hpt){const c=config(pn);if(!c?.crop)return{canvas:source,wpt,hpt};const g=geometry(c,source.width,source.height),ratio=Math.min(1,4096/g.w,4096/g.h,Math.sqrt(12000000/(g.w*g.h))),out=document.createElement('canvas');out.width=Math.ceil(g.w*ratio);out.height=Math.ceil(g.h*ratio);const cc=out.getContext('2d');
 const doc=el('svg',{xmlns:ns,width:g.w,height:g.h,viewBox:`0 0 ${g.w} ${g.h}`});doc.append(decorations({...c,stamp:{...c.stamp,sheet:c.stamp?.sheet||pn}},g));const overlays=[...doc.querySelectorAll('[data-sheet-compass],[data-sheet-seal-object]')];overlays.forEach(n=>n.remove());const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(doc));await img.decode();cc.drawImage(img,0,0,out.width,out.height);cc.save();cc.scale(ratio,ratio);cc.transform(...g.matrix);cc.beginPath();cc.rect(g.r.x,g.r.y,g.r.w,g.r.h);cc.clip();cc.drawImage(source,0,0);cc.restore();if(overlays.length){doc.replaceChildren(...overlays);const markImg=new Image();markImg.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(doc));await markImg.decode();cc.drawImage(markImg,0,0,out.width,out.height);}return{canvas:out,wpt:g.w/source.width*wpt,hpt:g.h/source.height*hpt};}};
})();
