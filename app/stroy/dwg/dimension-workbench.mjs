export function mountDimensionWorkbench(api){
 const panel=document.createElement('form');panel.id='dimensionWorkbench';panel.hidden=true;
 panel.style.cssText='position:absolute;right:12px;top:48px;z-index:5;background:#14283a;color:white;padding:12px;border:1px solid #789;max-width:270px';
 panel.innerHTML='<strong>Размер до прибора</strong><label>Расстояние, ед. чертежа<input name="length" type="number" min="0.001" step="any" required></label><label>Вынос размерной линии<input name="offset" type="number" step="any" required></label><button type="submit">Применить размер</button><p style="font-size:12px">Перенос целиком: тяните число, линию или зелёную точку. Значение не меняется. Оранжевая точка меняет длину, голубая — вынос.</p>';
 const bind=document.createElement('button');bind.type='button';bind.textContent='Связать с прибором';bind.onclick=()=>{try{api.bind();}catch(e){api.status(e.message);}};panel.append(bind);
 document.getElementById('viewport').append(panel);let key='',drag=null;
 panel.addEventListener('keydown',e=>e.stopPropagation());
 function commit(values){try{api.apply(values);key='';api.draw();}catch(e){api.status(e.message);}}
 panel.onsubmit=e=>{e.preventDefault();commit({length:Number(panel.elements.namedItem('length').value),offset:Number(panel.elements.namedItem('offset').value)});};
 const transform=(p,m)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
 function local(p,m){const w=api.world(p),det=m[0]*m[3]-m[1]*m[2];return [(m[3]*(w[0]-m[4])-m[2]*(w[1]-m[5]))/det,(-m[1]*(w[0]-m[4])+m[0]*(w[1]-m[5]))/det];}
 function values(p,info,kind){const q=local(p,info.matrix),f=info.definition;return {length:kind==='length'?Math.abs((q[0]-f.a[0])*f.d[0]+(q[1]-f.a[1])*f.d[1]):f.length,offset:kind==='offset'?q[0]*f.n[0]+q[1]*f.n[1]-(f.a[0]*f.n[0]+f.a[1]*f.n[1]+f.b[0]*f.n[0]+f.b[1]*f.n[1])/2:f.offset};}
 function handles(info){const f=info.definition,list=[{kind:'length',point:f.b,color:'#bd7200'},{kind:'offset',point:f.q,color:'#219ac0'}].map(h=>({...h,screen:api.screen(transform(h.point,info.matrix))}));const p=list[1].screen;list.push({kind:'move',color:'#19835c',screen:[p[0]+38,p[1]-26]});return list;}
 const delta=d=>api.world(d.p).map((v,i)=>v-api.world(d.start)[i]);
 return {
  paint(ctx){const info=api.info();panel.hidden=!info;if(!info){key='';drag=null;return;}const next=JSON.stringify([info.id,info.definition.length,info.definition.offset]);if(key!==next&&!panel.contains(document.activeElement)){panel.elements.namedItem('length').value=Number(info.definition.length.toFixed(3));panel.elements.namedItem('offset').value=Number(info.definition.offset.toFixed(3));key=next;}if(drag?.kind==='move')api.preview?.(ctx,delta(drag));ctx.save();for(const h of handles(info)){ctx.beginPath();ctx.arc(...h.screen,7,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();ctx.strokeStyle=h.color;ctx.lineWidth=3;ctx.stroke();if(h.kind==='move'){ctx.font='12px Arial';ctx.fillStyle=h.color;ctx.fillText('Перенести',h.screen[0]+12,h.screen[1]+4);}}ctx.restore();},
  down(p){const info=api.info();if(!info)return false;const h=handles(info).find(h=>Math.hypot(p[0]-h.screen[0],p[1]-h.screen[1])<13);if(!h&&!api.hit?.(p))return false;drag={info,kind:h?.kind||'move',p,start:p};return true;},
  move(p){if(!drag)return false;drag.p=p;if(drag.kind==='move'){api.status('Перенос размера целиком — расстояние не меняется');api.draw();return true;}const v=values(p,drag.info,drag.kind);panel.elements.namedItem('length').value=Number(v.length.toFixed(3));panel.elements.namedItem('offset').value=Number(v.offset.toFixed(3));api.status('Размер: '+v.length.toFixed(1)+' · вынос: '+v.offset.toFixed(1));return true;},
  up(){if(!drag)return false;const d=drag;drag=null;if(d.kind==='move'){try{if(Math.hypot(d.p[0]-d.start[0],d.p[1]-d.start[1])>=3)api.translate(delta(d));}catch(e){api.status(e.message);}api.draw();}else commit(values(d.p,d.info,d.kind));return true;},
  cancel(){drag=null;key='';api.draw();}
 };
}
