const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
export function leaderHit(project,p,screen){
 let best=null,score=Infinity;
 for(const s of project?.sheets||[])for(const r of s.routes)for(const l of r.leaders){
  const a=screen(l.anchor),e=screen(l.elbow),b=screen(l.label),height=Math.abs(screen([l.label[0],l.label[1]+(l.textHeight??3)*s.paperUnit])[1]-b[1]);
  const width=Math.max(height,([r.brand,r.section].filter(Boolean).join(' ')||'Кабель не назначен').length*height*.65);
  let part='move',d=Math.min(distance(p,a,e),distance(p,e,b));
  if(p[0]>=b[0]-4&&p[0]<=b[0]+width+4&&p[1]>=b[1]-height-4&&p[1]<=b[1]+4)d=0;
  for(const key of ['elbow','label'])if(Math.hypot(...screen(l[key]).map((v,i)=>v-p[i]))<8){part=key;d=0;break;}
  // Do not steal clicks at the cable attachment point.
  if(d<8&&d<score&&Math.hypot(p[0]-a[0],p[1]-a[1])>10){best={sheetId:s.id,routeId:r.id,id:l.id,part};score=d;}
 }
 return best;
}
export function mountLeaderWorkbench(api){
 const panel=document.createElement('section');panel.id='leaderWorkbench';panel.hidden=true;panel.setAttribute('aria-label','Редактирование выноски');
 panel.innerHTML='<strong>Выноска</strong><button id="lwDelete" title="Удалить только выноску" aria-label="Удалить только выноску">×</button><label>Марка кабеля<input id="lwBrand" maxlength="1000"></label><label>Сечение<input id="lwSection" maxlength="1000"></label><label>Высота текста, мм на листе<input id="lwHeight" type="number" min="0.2" max="50" step="0.2"></label><small>Тяните подпись или линию. Голубые точки — изгиб и конец. Марка и сечение общие для кабеля и ведомости.</small>';
 document.querySelector('#viewport').append(panel);
 const $=id=>panel.querySelector('#'+id);let selected=null,drag=null,shown=null;
 $('lwDelete').innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg>';
 panel.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();e.target.blur();}});
 const resolve=()=>{const s=api.project()?.sheets.find(s=>s.id===selected?.sheetId),r=s?.routes.find(r=>r.id===selected?.routeId),l=r?.leaders.find(l=>l.id===selected?.id);return l?{s,r,l}:null;};
 const edit=(ref,values)=>{try{if(!api.busy()){api.edit(ref,values);api.draw();}}catch(e){api.status(e.message);}};
 for(const [id,key] of [['lwBrand','brand'],['lwSection','section'],['lwHeight','textHeight']])$(id).onchange=()=>{if(selected)edit({...selected},{[key]:key==='textHeight'?Number($(id).value):$(id).value});};
 const remove=()=>{if(resolve()){edit({...selected},{remove:true});selected=null;panel.hidden=true;api.draw();}};$('lwDelete').onclick=remove;
 function down(p){if(api.busy()||!api.selecting())return false;const hit=leaderHit(api.project(),p,api.screen);if(!hit){selected=null;shown=null;panel.hidden=true;return false;}
  selected=hit;api.clearCableSelection();const {l}=resolve();drag={start:api.world(p),end:api.world(p),leader:structuredClone(l),part:hit.part};api.draw();return true;
 }
 function move(p){if(!drag)return false;drag.end=api.world(p);api.draw();return true;}
 function positions(){const l=drag.leader,delta=drag.end.map((v,i)=>v-drag.start[i]);return Object.fromEntries(['elbow','label'].map(key=>[key,drag.part==='move'||drag.part===key?l[key].map((v,i)=>v+delta[i]):l[key]]));}
 function up(){if(!drag)return false;const delta=Math.hypot(...api.screen(drag.end).map((v,i)=>v-api.screen(drag.start)[i]));if(delta>=3)edit({...selected},positions());drag=null;api.draw();return true;}
 function paint(ctx){const state=resolve();panel.hidden=!state||!api.selecting()||api.busy();if(panel.hidden)return;
  const {s,r,l}=state,key=JSON.stringify([s.id,r.id,l.id,r.brand,r.section,l.textHeight??3]);if(shown!==key){shown=key;$('lwBrand').value=r.brand;$('lwSection').value=r.section;$('lwHeight').value=l.textHeight??3;}
  const points=drag?{...l,...positions()}:l,base=api.screen(points.label),viewport=panel.parentElement;
  panel.style.left=Math.max(8,Math.min(viewport.clientWidth-panel.offsetWidth-8,base[0]+20))+'px';panel.style.top=Math.max(8,Math.min(viewport.clientHeight-panel.offsetHeight-8,base[1]+24))+'px';
  ctx.save();ctx.strokeStyle='#9edcff';ctx.fillStyle='#9edcff';ctx.lineWidth=2;ctx.beginPath();['anchor','elbow','label'].map(k=>api.screen(points[k])).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();for(const k of ['elbow','label']){const p=api.screen(points[k]);ctx.fillRect(p[0]-4,p[1]-4,8,8);}
  if(drag){const h=Math.abs(api.screen([points.label[0],points.label[1]+(l.textHeight??3)*s.paperUnit])[1]-base[1]);ctx.font=h+'px Arial';ctx.fillText([r.brand,r.section].filter(Boolean).join(' '),...base);}ctx.restore();
 }
 return {down,move,up,paint,remove,active:()=>!!resolve(),cancel:()=>{selected=null;shown=null;drag=null;panel.hidden=true;}};
}
