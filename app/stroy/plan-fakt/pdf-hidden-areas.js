/* Reversible presentation regions, stored in page-normalized coordinates. */
(function(){
'use strict';
const layer=document.createElementNS(SVGNS,'g');layer.id='pdfHiddenAreas';svg.append(layer);
const button=document.createElement('button');button.type='button';button.className='tool';button.id='hidePdfArea';button.dataset.tool='hide-area';button.title='Скрыть примечания или условные обозначения рамкой';button.textContent='Скрыть область';$('toolbar').append(button);
const manage=document.createElement('button');manage.type='button';manage.className='tool';manage.id='managePdfAreas';manage.textContent='Скрытые области';$('toolbar').append(manage);
let drag=null,resolveExport=null;
function enabled(){return !!S.standalonePdf&&!S.linkedLkDocId;}
function areas(pn=S.pageNum){return S.data?.pages[pn]?.hiddenAreas||[];}
function rect(a,preview=false){const r=document.createElementNS(SVGNS,'rect');r.setAttribute('x',a.x*S.W);r.setAttribute('y',a.y*S.H);r.setAttribute('width',a.w*S.W);r.setAttribute('height',a.h*S.H);r.setAttribute('fill',preview?'rgba(232,147,35,.18)':'#fff');if(preview){r.setAttribute('stroke','#db871f');r.setAttribute('stroke-width',2/S.scale);}return r;}
function draw(){layer.replaceChildren();button.hidden=manage.hidden=!enabled();if(!enabled())return;areas().forEach(a=>layer.append(rect(a)));if(drag?.area)layer.append(rect(drag.area,true));manage.textContent='Скрытые · '+areas().length;manage.disabled=!areas().length;}
function save(){redrawAll();lkQueueDrawingSave();}
// Recognise a separate right reference column, never a single isolated heading.
function referenceColumn(items,view){
 const text=items.filter(t=>t.str.trim()).map(t=>{const p=view.convertToViewportPoint(t.transform[4],t.transform[5]);return {s:t.str.trim(),x:p[0],y:p[1],h:t.height||10};});
 const notes=text.find(t=>/^примечания?\s*:?$/i.test(t.s)&&t.x>view.width*.65),legend=text.find(t=>/^условные\s+обозначения\s*:?$/i.test(t.s)&&t.x>view.width*.65);
 if(!notes||!legend||legend.y<=notes.y||Math.abs(notes.x-legend.x)>view.width*.18)return null;
 const left=Math.min(notes.x,legend.x)-view.width*.03,right=view.width*.985;
 const scheme=text.find(t=>/^схема\s+блокировки/i.test(t.s)&&t.x>=left&&t.y<notes.y);
 const top=Math.max(0,(scheme||notes).y-(scheme||notes).h-12);
 const rows=text.filter(t=>t.x>=left&&t.x<right&&t.y>=legend.y).sort((a,b)=>a.y-b.y);let bottom=legend.y;
 for(const t of rows){if(t.y-bottom>Math.max(45,view.height*.045))break;bottom=Math.max(bottom,t.y);}
 if(bottom<=legend.y)return null;
 return {x:left/view.width,y:top/view.height,w:(right-left)/view.width,h:(bottom+14-top)/view.height,automatic:true};
}
const prepareBeforeAreas=prepareStandalonePdfVectors;
prepareStandalonePdfVectors=async function(pn,source){const result=await prepareBeforeAreas(pn,source),src=source||S.standalonePdf,live=S._pdfScene,pg=S.data?.pages[pn];
 if(!pg||pg.referenceAreasChecked||!live||live.src!==src||live.pn!==pn||pn!==S.pageNum)return result;
 try{const page=live.scene.page,content=await page.getTextContent();if(S.standalonePdf!==src||S.data?.pages[pn]!==pg)return result;
 const area=referenceColumn(content.items,page.getViewport({scale:1}));pg.referenceAreasChecked=true;
 if(area&&!pg.hiddenAreas?.length){pg.hiddenAreas=[area];if(S.pageNum===pn){draw();toast('Примечания и легенда скрыты. Вернуть: «Скрытые области».');}lkQueueDrawingSave();}
 }catch(e){console.warn('Reference areas:',e.message);}return result;
};

button.onclick=()=>{if(!enabled())return;hideGuide();closeMobileDrawers();setTool('hide-area');toast('Обведите рамкой область, которую нужно скрыть');};
const panel=document.createElement('div');panel.className='scale-dialog';panel.id='hiddenAreasDialog';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.innerHTML='<div class="scale-card"><h3>Скрытые области этого листа</h3><p>Вернуть область — снова показать её содержимое в редакторе.</p><div id="hiddenAreasList"></div><div class="scale-actions"><button id="hiddenAreasClose">Закрыть</button></div></div>';document.body.append(panel);
function list(){const host=$('hiddenAreasList');host.replaceChildren();areas().forEach((a,i)=>{const row=document.createElement('div');row.style.cssText='display:flex;justify-content:space-between;gap:12px;margin:8px 0';const label=document.createElement('span');label.textContent='Область '+(i+1);const restore=document.createElement('button');restore.type='button';restore.textContent='Вернуть';restore.onclick=()=>{pushHistory();S.data.pages[S.pageNum].hiddenAreas=areas().filter(v=>v!==a);save();list();};row.append(label,restore);host.append(row);});if(!areas().length)host.textContent='Скрытых областей нет.';}
manage.onclick=()=>{list();panel.style.display='flex';$('hiddenAreasClose').focus();};$('hiddenAreasClose').onclick=()=>panel.style.display='none';
const exportDialog=document.createElement('div');exportDialog.id='hiddenAreasExport';exportDialog.className='scale-dialog';exportDialog.setAttribute('role','dialog');exportDialog.setAttribute('aria-modal','true');exportDialog.innerHTML='<div class="scale-card"><h3>Скрытые области в PDF</h3><p>Включить примечания и другие области, скрытые в редакторе? Выбор действует на все листы экспортируемого PDF. В редакторе они останутся скрытыми.</p><div class="scale-actions"><button data-hidden-export="cancel">Отмена</button><button data-hidden-export="include">Включить в PDF</button><button class="primary" data-hidden-export="hide">Оставить скрытыми</button></div></div>';document.body.append(exportDialog);
function finish(choice){exportDialog.style.display='none';const resolve=resolveExport;resolveExport=null;if(resolve)resolve(choice);}
exportDialog.querySelectorAll('button').forEach(b=>b.onclick=()=>finish(b.dataset.hiddenExport));
for(const el of [panel,exportDialog]){el.addEventListener('click',e=>{if(e.target===el){if(el===exportDialog)finish('cancel');else el.style.display='none';}});el.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){if(el===exportDialog)finish('cancel');else el.style.display='none';}if(e.key==='Tab'){const bs=[...el.querySelectorAll('button')],first=bs[0],last=bs[bs.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});}
const css=document.createElement('style');css.textContent='#hidePdfArea,#managePdfAreas{font-size:10px;line-height:1.3;white-space:normal;min-height:46px}#hidePdfArea[hidden],#managePdfAreas[hidden]{display:none}#hiddenAreasDialog .scale-card,#hiddenAreasExport .scale-card{max-height:85dvh;overflow:auto}#hiddenAreasExport .scale-actions{flex-wrap:wrap}#hiddenAreasList button{padding:8px 12px}';document.head.append(css);
function point(e){const p=toImg(e.clientX,e.clientY);return {x:Math.max(0,Math.min(1,p.x/S.W)),y:Math.max(0,Math.min(1,p.y/S.H))};}
// Capture before source picking/erasing so covered content cannot be edited accidentally.
window.addEventListener('pointerdown',e=>{if(!enabled()||!vp.contains(e.target)||e.button!==0)return;if(e.pointerType==='touch'&&!e.isPrimary){drag=null;draw();e.stopPropagation();return;}if(S.tool!=='hide-area'){if(e.target.closest('#pdfHiddenAreas')){e.stopPropagation();bgPan(e,null);}return;}if(!inBase(e.clientX,e.clientY))return;e.stopPropagation();const src=S.standalonePdf,pn=S.pageNum,a=point(e);drag={area:null};pointerDrag(e,ev=>{if(S.standalonePdf!==src||S.pageNum!==pn||!drag)return;const b=point(ev);drag.area={x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};draw();},ev=>{const area=drag?.area;drag=null;if(ev.type!=='pointercancel'&&S.standalonePdf===src&&S.pageNum===pn&&area&&area.w*S.W*S.scale>8&&area.h*S.H*S.scale>8){pushHistory();S.data.pages[pn].hiddenAreas=[...areas(),area];S.selected=null;save();toast('Область скрыта. Вернуть её можно кнопкой «Скрытые».');}draw();setTool('select');});},{capture:true});
for(const name of ['redrawAll','applyTransform']){const old=window[name];window[name]=function(...args){const result=old.apply(this,args);draw();return result;};}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.tool==='hide-area'){drag=null;draw();setTool('select');}});
const oldPage=goPage;goPage=function(...args){drag=null;layer.replaceChildren();panel.style.display='none';finish('cancel');return oldPage(...args);};
const oldClose=closeStandalonePdf;closeStandalonePdf=function(...args){drag=null;layer.replaceChildren();panel.style.display='none';finish('cancel');const r=oldClose(...args);draw();return r;};
const hasAreas=()=>enabled()&&S.pageList.some(pn=>areas(pn).length);
const oldVector=buildVectorPdf;buildVectorPdf=async function(){if(hasAreas()&&S.data.hiddenAreasExport!=='include')return null;return oldVector();};
const oldOutput=outputEditedPdf;outputEditedPdf=async function(mode){if(!hasAreas())return oldOutput(mode);if(resolveExport)return;const data=S.data;exportDialog.style.display='flex';exportDialog.querySelector('[data-hidden-export="hide"]').focus();const choice=await new Promise(resolve=>resolveExport=resolve);if(choice==='cancel'||S.data!==data)return;S.data.hiddenAreasExport=choice;return oldOutput(mode);};
window.PdfHiddenAreas={paint(cc,pn,w,h){if(S.data.hiddenAreasExport==='include')return;cc.save();cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.fillStyle='#fff';for(const a of areas(pn))cc.fillRect(a.x*w,a.y*h,a.w*w,a.h*h);cc.restore();}};
draw();
})();
