// Cable quantities are properties of routes, never inferred from labels.
export function routeLength(points,metresPerUnit){
 if(!Array.isArray(points)||points.length<2||!Number.isFinite(metresPerUnit)||metresPerUnit<=0)throw Error('Нужны точки трассы и масштаб в метрах');
 if(points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw Error('Неверные координаты трассы');
 return points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0)*metresPerUnit;
}
export function cableLedger(routes,{sheetId}={}){
 const groups=new Map(),unassigned=[],withoutLeaders=[],ids=new Set();
 for(const route of routes){
  if(sheetId!==undefined&&route.sheetId!==sheetId)continue;
  if(!route.id||ids.has(route.id))throw Error('Повторяющийся или пустой идентификатор трассы');ids.add(route.id);
  const length=route.paths?route.paths.reduce((n,points)=>n+routeLength(points,route.metresPerUnit),0):routeLength(route.points,route.metresPerUnit);
  if(!Number.isFinite(route.extraMetres??0)||(route.extraMetres??0)<0)throw Error('Дополнительная длина должна быть неотрицательной');
  const quantity=length+(route.extraMetres??0);
  const brand=String(route.brand||'').trim(),section=String(route.section||'').trim();
  if(!route.leaders?.length)withoutLeaders.push(route.id);
  if(!brand||!section){unassigned.push({id:route.id,length:quantity});continue;}
  const key=JSON.stringify([brand,section]);
  const row=groups.get(key)||{brand,section,length:0,routeIds:[]};
  row.length+=quantity;row.routeIds.push(route.id);groups.set(key,row);
 }
 return {rows:[...groups.values()].sort((a,b)=>a.brand.localeCompare(b.brand,'ru')||a.section.localeCompare(b.section,'ru')),unassigned,withoutLeaders};
}
export function rotatePoints(points,angle,centre=[0,0]){
 if(!Number.isFinite(angle)||!centre.every(Number.isFinite))throw Error('Неверный поворот');
 const c=Math.cos(angle),s=Math.sin(angle);
 return points.map(([x,y])=>{x-=centre[0];y-=centre[1];return [centre[0]+x*c-y*s,centre[1]+x*s+y*c];});
}
