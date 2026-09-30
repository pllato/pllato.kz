export function titleBox(sheet,screen,measure){
 const style={x:210,y:275,height:5,...sheet.titleStyle},p=screen([sheet.origin[0]+style.x*sheet.paperUnit,sheet.origin[1]+style.y*sheet.paperUnit]),h=Math.abs(screen([sheet.origin[0],sheet.origin[1]+style.height*sheet.paperUnit])[1]-screen(sheet.origin)[1]),w=Math.max(12,measure(sheet.title||'',h));
 return {x:p[0]-w/2,y:p[1]-h,w,h,style};
}
export function titleHit(sheets,p,screen,measure){return [...sheets].reverse().find(s=>{const b=titleBox(s,screen,measure);return p[0]>=b.x-6&&p[0]<=b.x+b.w+6&&p[1]>=b.y-6&&p[1]<=b.y+b.h+6;});}
export function mountTitleWorkbench(api){
 const viewport=document.getElementById('viewport'),panel=document.createElement('section');panel.id='titleWorkbench';panel.hidden=true;panel.setAttribute('aria-label','Заголовок исполнительной');panel.style.cssText='position:absolute;z-index:7;background:#fff;border:1px solid #618aa0;border-radius:5px;padding:5px;color:#111;box-shadow:0 2px 8px #0002';
 panel.innerHTML='<input id="twText" aria-label="Название исполнительной" maxlength="1000" style="display:block;width:100%;box-sizing:border-box;background:white;color:black;text-align:center"><div style="display:flex;align-items:center;gap:6px;margin-top:5px"><button id="twMove" title="Перетащить заголовок" aria-label="Перетащить заголовок" style="cursor:move">↔</button><label style="display:flex;align-items:center;gap:5px;margin:0">Размер, мм <input id="twHeight" type="number" min="0.2" max="50" step="0.2" style="width:76px;background:white;color:black"></label><button id="twClose" title="Закрыть редактор заголовка" aria-label="Закрыть редактор заголовка">×</button></div><small id="twError" role="alert" style="color:#a21c12"></small>';
 viewport.append(panel);const $=id=>panel.querySelector('#'+id);let id=null,drag=null,focusPending=false;
 const resolve=()=>api.project()?.sheets.find(s=>s.id===id);
 const measure=(text,h)=>{const c=api.context();c.save();c.font=h+'px "Pllato CAD"';const w=c.measureText(text).width;c.restore();return w;};
 const edit=values=>{try{if(api.busy())return;api.edit(id,values);$('twError').textContent='';api.draw();}catch(e){$('twError').textContent=e.message;}};
 $('twText').onchange=()=>edit({title:$('twText').value});$('twHeight').onchange=()=>edit({height:Number($('twHeight').value)});
 function cancel(){id=null;drag=null;focusPending=false;panel.hidden=true;}
 $('twClose').onclick=()=>{cancel();api.draw();};panel.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();cancel();api.draw();}else if(e.key==='Enter'){e.preventDefault();e.target.blur();}};
 function begin(p){const s=resolve();drag={start:api.world(p),end:api.world(p),style:{x:210,y:275,height:5,...s.titleStyle}};}
 function down(p){if(api.busy()||!api.selecting())return false;const s=titleHit(api.project()?.sheets||[],p,api.screen,measure);if(!s){cancel();return false;}id=s.id;api.clearSelection();begin(p);focusPending=true;api.draw();return true;}
 function move(p){if(!drag)return false;drag.end=api.world(p);api.draw();return true;}
 function position(){const s=resolve();return {x:Math.max(0,Math.min(420,drag.style.x+(drag.end[0]-drag.start[0])/s.paperUnit)),y:Math.max(0,Math.min(297,drag.style.y+(drag.end[1]-drag.start[1])/s.paperUnit))};}
 function up(){if(!drag)return false;if(Math.hypot(...api.screen(drag.end).map((v,i)=>v-api.screen(drag.start)[i]))>=3){edit(position());focusPending=false;}drag=null;api.draw();return true;}
 const local=e=>{const b=viewport.getBoundingClientRect();return [e.clientX-b.x,e.clientY-b.y];};
 $('twMove').onpointerdown=e=>{if(api.busy())return;e.preventDefault();begin(local(e));e.target.setPointerCapture(e.pointerId);};$('twMove').onpointermove=e=>{if(drag)move(local(e));};$('twMove').onpointerup=up;$('twMove').onpointercancel=()=>{drag=null;api.draw();};
 function paint(){const s=resolve();panel.hidden=!s||!api.selecting()||api.busy();if(panel.hidden)return;const shown=drag?{...s,titleStyle:{...drag.style,...position()}}:s,b=titleBox(shown,api.screen,measure),w=Math.min(viewport.clientWidth-16,Math.max(300,b.w+12));panel.style.width=w+'px';panel.style.boxSizing='border-box';panel.style.left=Math.max(8,Math.min(viewport.clientWidth-w-8,b.x+b.w/2-w/2))+'px';panel.style.top=Math.max(8,Math.min(viewport.clientHeight-panel.offsetHeight-8,b.y-5))+'px';$('twText').style.font=Math.max(14,Math.min(36,b.h))+'px "Pllato CAD"';if(document.activeElement!==$('twText'))$('twText').value=s.title;if(document.activeElement!==$('twHeight'))$('twHeight').value=b.style.height;if(focusPending&&!drag){focusPending=false;$('twText').focus();$('twText').select();}}
 return {down,move,up,paint,cancel,active:()=>!!resolve()};
}
