import {offsetGeometry} from './dimension-create.mjs?v=0.17.60';
export function mountOffsetTool(api){
 const button=document.createElement('button');button.textContent='Отступ';button.title='Поставить горизонтальный или вертикальный размер';button.onclick=()=>{api.activate();points=[];hover=null;api.draw();};
 document.querySelector('[data-tool="measure"]').before(button);
 const panel=document.createElement('div');panel.hidden=true;panel.style.cssText='position:absolute;right:12px;top:48px;z-index:6;background:#14283a;color:white;padding:12px;border:1px solid #789;max-width:270px';
 panel.innerHTML='<strong>Поставить отступ</strong><label>Направление<select aria-label="Направление отступа"><option value="horizontal">Горизонтальный ↔</option><option value="vertical">Вертикальный ↕</option></select></label><p>1. Точка стены<br>2. Точка прибора<br>3. Положение размерной линии</p><small>После постановки можно ввести точное расстояние или передвинуть размер. Escape — отмена.</small>';
 document.getElementById('viewport').append(panel);let points=[],hover=null;const axis=()=>panel.querySelector('select').value;
 panel.querySelector('select').onchange=()=>{points=[];hover=null;api.draw();};
 return {
  paint(ctx){const active=api.active();panel.hidden=!active;button.setAttribute('aria-pressed',String(active));if(!active){points=[];hover=null;return;}if(!points.length)return;ctx.save();ctx.strokeStyle='#bd7200';ctx.fillStyle='#bd7200';ctx.lineWidth=2;const line=pts=>{ctx.beginPath();pts.map(api.screen).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();};for(const p of points){ctx.beginPath();ctx.arc(...api.screen(p),5,0,Math.PI*2);ctx.stroke();}if(hover){if(points.length===1)line([points[0],hover]);else try{const f=offsetGeometry(...points,hover,axis(),api.height());f.lines.forEach(line);ctx.font='16px serif';ctx.fillText(f.text,...api.screen(f.t));}catch{}}ctx.restore();},
  tap(w){if(!api.active())return false;if(points.length<2){points.push(w);api.status(points.length===1?'Укажите вторую точку отступа':'Укажите положение размерной линии');api.draw();return true;}try{api.create(points[0],points[1],w,axis(),api.height());points=[];hover=null;}catch(e){api.status(e.message);points=[];}api.draw();return true;},
  hover(w){if(!api.active())return;hover=w;api.draw();}
 };
}
