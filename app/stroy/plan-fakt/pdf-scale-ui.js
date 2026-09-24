/* Each suggestion belongs to one source/page. Applying always requires a review. */
(function(){
'use strict';
const old={prepare:prepareStandalonePdfVectors,pill:updateScalePill,start:startCalibration,page:goPage,close:closeStandalonePdf};
const cache=new WeakMap();let active=null,request=0;
const style=document.createElement('style');style.textContent=`
#pdfScaleHint{position:absolute;z-index:26;left:12px;bottom:64px;max-width:calc(100% - 24px);padding:10px 14px;border:1px solid #9ab8aa;background:#f2faf5;color:#174836;border-radius:6px;font:600 13px var(--sans);cursor:pointer;text-align:left}
#pdfScaleReview .scale-card{max-height:90dvh;overflow:auto;width:min(520px,100%)}
#pdfScaleReview select{width:100%;padding:9px;margin:5px 0 12px;font:inherit}
#pdfScaleReview canvas{display:block;width:100%;height:180px;border:1px solid #ddd;margin:8px 0;background:white}
#pdfScaleReview canvas[hidden]{display:none}
#pdfScaleReview .scale-actions{flex-wrap:wrap}#pdfScaleReview .scale-actions button{min-height:42px}
#pdfScaleReview .scale-actions .primary:disabled{opacity:.45}
`;document.head.append(style);
const hint=document.createElement('button');hint.id='pdfScaleHint';hint.type='button';hint.hidden=true;hint.onclick=()=>startCalibration(null);$('cwrap').append(hint);
const dialog=document.createElement('div');dialog.id='pdfScaleReview';dialog.className='scale-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','pdfScaleTitle');dialog.innerHTML=`<div class="scale-card"><h3 id="pdfScaleTitle">Масштаб листа</h3><p id="pdfScaleInfo" aria-live="polite"></p><select id="pdfScaleChoice" aria-label="Найденные масштабы"></select><canvas id="pdfScaleControl" width="900" height="360" hidden></canvas><p id="pdfScaleEvidence"></p><p id="pdfScaleExisting"></p><div class="scale-actions"><button id="pdfScaleCancel" type="button">Отмена</button><button id="pdfScaleManual" type="button">По двум точкам</button><button id="pdfScaleUse" class="primary" type="button" disabled>Применить к листу</button></div></div>`;document.body.append(dialog);
function src(){return S.linkedLkDocId?null:S.standalonePdf;}
function valid(a){return a&&a.src===src()&&a.pn===S.pageNum;}
function close(){request++;active=null;dialog.style.display='none';}
function known(){const s=src(),map=s&&cache.get(s);return map&&map.get(S.pageNum);}
function refresh(){const r=known();hint.hidden=!src()||!!S.cal[S.pageNum]||!r||!r.choices.length;hint.textContent=r&&r.choices.length>1?'Найдено несколько масштабов · выбрать':'Найден масштаб · проверить';}
async function detect(source,pn){let map=cache.get(source);if(!map)cache.set(source,map=new Map());if(map.has(pn))return map.get(pn);
  const current=S._pdfScene;if(!current||current.src!==source||current.pn!==pn)return null;
  const page=current.scene.page,text=await page.getTextContent(),view=page.getViewport({scale:1}),result=PdfScale.analyse(text.items,view,current.scene.objects,page.userUnit||1);
  const choices=[...result.dimensions];for(const label of result.labels){const same=choices.find(c=>Math.abs(c.mPerPoint/label.mPerPoint-1)<.02);if(same)same.printed=label.label;else choices.push(label);}
  const r={...result,choices,width:view.width,height:view.height};map.set(pn,r);return r;
}
prepareStandalonePdfVectors=function(pn,source){const s=source||src();return Promise.resolve(old.prepare(pn,source)).then(async value=>{if(s&&src()===s&&S.pageNum===pn){try{await detect(s,pn);refresh();}catch(e){console.warn('PDF scale:',e);}}return value;});};
updateScalePill=function(){old.pill();refresh();};
goPage=function(pn){close();hint.hidden=true;old.page(pn);};
closeStandalonePdf=function(){close();hint.hidden=true;old.close();};
function chosen(){const value=$('pdfScaleChoice').value;return value===''?null:active&&active.result&&active.result.choices[+value];}
function evidence(){const c=chosen(),canvas=$('pdfScaleControl');canvas.hidden=true;$('pdfScaleUse').disabled=!c;if(!c){$('pdfScaleEvidence').textContent='Выберите масштаб нужного плана. Для листа с разными масштабами автоматический расчёт всего листа не подходит.';return;}
  if(c.kind==='dimensions'){
    const control=c.controls.find(q=>Math.abs(q.b[0]-q.a[0])>Math.abs(q.b[1]-q.a[1]))||c.controls[0];
    const metres=Math.hypot(control.b[0]-control.a[0],control.b[1]-control.a[1])*c.mPerPoint;
    $('pdfScaleEvidence').textContent='Согласуются '+c.count+' размеров. Контроль: подпись '+control.mm+' мм → расчёт '+(metres*1000).toFixed(0)+' мм. Проверьте отмеченные концы. Размеры без единиц считаются миллиметрами.';
    const r=active.result,sx=S.W/r.width,sy=S.H/r.height,pad=25,x0=Math.max(0,Math.min(control.a[0],control.b[0])-pad),y0=Math.max(0,Math.min(control.a[1],control.b[1])-pad),w=Math.min(r.width-x0,Math.abs(control.a[0]-control.b[0])+2*pad),h=Math.min(r.height-y0,Math.abs(control.a[1]-control.b[1])+2*pad),k=Math.min(canvas.width/w,canvas.height/h),ox=(canvas.width-w*k)/2,oy=(canvas.height-h*k)/2,cc=canvas.getContext('2d');
    cc.fillStyle='#fff';cc.fillRect(0,0,canvas.width,canvas.height);cc.drawImage(baseimg,x0*sx,y0*sy,w*sx,h*sy,ox,oy,w*k,h*k);cc.strokeStyle='#00805a';cc.lineWidth=3;cc.setLineDash([8,5]);cc.beginPath();cc.moveTo(ox+(control.a[0]-x0)*k,oy+(control.a[1]-y0)*k);cc.lineTo(ox+(control.b[0]-x0)*k,oy+(control.b[1]-y0)*k);cc.stroke();cc.setLineDash([]);for(const p of [control.a,control.b]){cc.beginPath();cc.arc(ox+(p[0]-x0)*k,oy+(p[1]-y0)*k,7,0,Math.PI*2);cc.stroke();}canvas.hidden=false;
  }else $('pdfScaleEvidence').textContent='Найдена подпись «'+c.source+'». Расчёт по физическому размеру страницы PDF; изменение размера при экспорте нарушает этот масштаб. Если размерная линия известна, проверьте по двум точкам.';
}
startCalibration=async function(nextTool){if(!src())return old.start(nextTool);close();closeMobileDrawers();hideGuide();const ticket=request,a={src:src(),pn:S.pageNum,next:nextTool||null,result:null};active=a;dialog.style.display='flex';$('pdfScaleTitle').textContent='Масштаб · лист '+a.pn;$('pdfScaleInfo').textContent='Ищу подпись масштаба и размерные линии…';$('pdfScaleChoice').replaceChildren();$('pdfScaleChoice').hidden=true;$('pdfScaleControl').hidden=true;$('pdfScaleUse').disabled=true;$('pdfScaleEvidence').textContent='';$('pdfScaleExisting').textContent=S.cal[a.pn]?'На листе уже задан масштаб. Он изменится только после нажатия «Применить к листу».':'';$('pdfScaleCancel').focus();
  try{let r=await detect(a.src,a.pn);if(!r){await prepareStandalonePdfVectors(a.pn,a.src);r=await detect(a.src,a.pn);}if(ticket!==request||!valid(a))return;a.result=r;
    if(!r||!r.choices.length){$('pdfScaleInfo').textContent='Надёжный масштаб не найден. Укажите две точки известного размера и его длину в миллиметрах.';return;}
    $('pdfScaleInfo').textContent=r.choices.length>1?'Найдены разные варианты. Выберите масштаб нужного плана; он будет применён ко всему этому листу.':'Найден предполагаемый масштаб. Проверьте основание расчёта перед применением.';
    const select=$('pdfScaleChoice');select.hidden=false;select.replaceChildren(new Option('Выберите масштаб',''),...r.choices.map((c,i)=>new Option(c.label+(c.printed?' · '+c.printed:'')+(c.kind==='dimensions'?' · примерно 1:'+Math.round(c.mPerPoint/(25.4/72000*(S._pdfScene.scene.page.userUnit||1))):''),String(i))));select.value=r.choices.length===1?'0':'';evidence();
  }catch(e){if(ticket===request&&valid(a))$('pdfScaleInfo').textContent='Не удалось прочитать масштаб. Используйте две точки известного размера.';console.warn(e);}
};
$('pdfScaleChoice').onchange=evidence;
$('pdfScaleCancel').onclick=close;
$('pdfScaleManual').onclick=()=>{if(!valid(active))return close();const next=active.next;close();old.start(next);};
$('pdfScaleUse').onclick=()=>{const a=active,c=chosen();if(!valid(a)||!c||!baseimg.complete||!S.W)return;const r=a.result,rx=S.W/r.width,ry=S.H/r.height;if(Math.abs(rx/ry-1)>.005){toast('Лист растянут: задайте масштаб вручную');return;}
  S.cal[a.pn]=c.mPerPoint/rx;S.data.pages[a.pn].scaleCalibration={method:c.kind,mPerPoint:c.mPerPoint,label:c.label,control:c.controls&&c.controls[0],confirmed:true};const next=a.next;close();S.calPts=null;S.calPx=0;S.afterCalTool=null;buildStrip();updateScalePill();redrawAll();renderSide();lkQueueDrawingSave();if(next==='line'&&isCoarsePointer())S.penMode=true;setTool(next||'select');toast('Масштаб сохранён для листа '+a.pn);};
dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
dialog.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.stopPropagation();close();}if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('button,select')].filter(n=>!n.hidden&&!n.disabled),first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
})();
