import {routeLength,rotatePoints,cableLedger} from './cable-ledger.mjs?v=0.17.62';
import {executiveLayout} from './executive-layout.mjs?v=0.17.62';
import {validateTable,tablePages} from './table-paste.mjs?v=0.17.62';

// Serializable editing model. Cable data belongs to a route, not its leaders.
// Native block handles are retained; source geometry is never flattened here.
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const requirePoint=p=>{if(!point(p))throw Error('Неверная точка');};
const sheet=(project,id)=>{const s=project.sheets.find(s=>s.id===id);if(!s)throw Error('Исполнительная не найдена');return s;};
const route=(s,id)=>{const r=s.routes.find(r=>r.id===id);if(!r)throw Error('Трасса не найдена');return r;};
const unique=(items,id)=>{if(typeof id!=='string'||!id||items.some(x=>x.id===id))throw Error('Идентификатор уже существует или пуст');};
export const createExecutiveProject=()=>({version:1,sheets:[]});
export function createExecutive(project,{id,title='',font='times.ttf',titleStyle={x:210,y:275,height:5},tableRows,table,dimensionLinks,origin=[0,0],planCentre=[0,0],nativeHandles=[],metresPerUnit,paperUnit=.1/metresPerUnit}){
 unique(project.sheets,id);requirePoint(origin);requirePoint(planCentre);
 if(!Number.isFinite(metresPerUnit)||metresPerUnit<=0)throw Error('Укажите единицы чертежа');
 if(!Number.isFinite(paperUnit)||paperUnit<=0)throw Error('Неверный масштаб листа');
 if(!Array.isArray(nativeHandles)||nativeHandles.some(h=>typeof h!=='string'||!/^[0-9a-f]+$/i.test(h)))throw Error('Неверные ссылки CAD');
 if(new Set(nativeHandles.map(h=>h.toUpperCase())).size!==nativeHandles.length)throw Error('Повторяющиеся ссылки CAD');
 // Caller supplies VERIFIED copied handles, never the original selection.
 const s={id,title:String(title),origin:[...origin],planCentre:[...planCentre],nativeHandles:[...nativeHandles],metresPerUnit,paperUnit,angle:0,stamp:{},routes:[],notes:[]};
 if(!/^[^/\\\x00-\x1f]{1,116}\.(shx|ttf)$/i.test(font))throw Error('Неверный шрифт исполнительной');s.font=font;
 if(![titleStyle.x,titleStyle.y,titleStyle.height].every(Number.isFinite)||titleStyle.height<.2||titleStyle.height>50||titleStyle.x<0||titleStyle.x>420||titleStyle.y<0||titleStyle.y>297)throw Error('Неверное положение или размер названия');s.titleStyle={...titleStyle};
 if(tableRows!==undefined){if(!Array.isArray(tableRows)||tableRows.length>1000||tableRows.some(r=>typeof r.brand!=='string'||typeof r.section!=='string'||r.brand.length>1000||r.section.length>1000||!Number.isFinite(r.length)||r.length<0))throw Error('Неверная таблица');s.tableRows=structuredClone(tableRows);}
 if(table!==undefined){s.table=validateTable(table);tablePages(s.table);}
 if(dimensionLinks!==undefined){if(!Array.isArray(dimensionLinks)||dimensionLinks.length>10000||dimensionLinks.some(l=>!l||!['dimension','device'].every(k=>typeof l[k]==='string'&&/^[0-9a-f]{1,16}$/i.test(l[k])))||new Set(dimensionLinks.map(l=>l.dimension)).size!==dimensionLinks.length)throw Error('Неверные привязки размеров');s.dimensionLinks=dimensionLinks.map(({dimension,device})=>({dimension,device}));}
 project.sheets.push(s);return s;
}
export function addRoute(project,sheetId,{id,points,brand='',section='',extraMetres=0,paths,sourceIds,color=7,rgb,controls,smooth=false,lineweight}){
 const s=sheet(project,sheetId);unique(project.sheets.flatMap(s=>s.routes),id);routeLength(points,s.metresPerUnit);
 if(!Number.isFinite(extraMetres)||extraMetres<0)throw Error('Неверная дополнительная длина');
 const r={id,sheetId,points:points.map(p=>[...p]),brand:String(brand).trim(),section:String(section).trim(),extraMetres,metresPerUnit:s.metresPerUnit,leaders:[]};
 if(paths){if(!Array.isArray(paths)||paths.length>10000||!Array.isArray(sourceIds)||sourceIds.some(id=>typeof id!=='string'))throw Error('Неверная привязка кабеля');for(const p of paths)routeLength(p,s.metresPerUnit);r.paths=structuredClone(paths);r.sourceIds=[...sourceIds];}
 if(!Number.isInteger(color)||color<1||color>255)throw Error('Неверный цвет кабеля');r.color=color;
 if(rgb!==undefined){if(!Number.isInteger(rgb)||rgb<0||rgb>0xffffff)throw Error('Неверный RGB цвет');r.rgb=rgb;}
 if(lineweight!==undefined){if(![0,5,9,13,15,18,20,25,30,35,40,50,53,60,70,80,90,100,106,120,140,158,200,211].includes(lineweight))throw Error('Неверная толщина линии');r.lineweight=lineweight;}
 if(controls){routeLength(controls,s.metresPerUnit);r.controls=structuredClone(controls);r.smooth=!!smooth;}
 s.routes.push(r);return r;
}
export function setCable(project,sheetId,routeId,{brand,section,extraMetres}){
 const r=route(sheet(project,sheetId),routeId);
 if(typeof brand!=='string'||typeof section!=='string'||!Number.isFinite(extraMetres)||extraMetres<0)throw Error('Неверные свойства кабеля');
 Object.assign(r,{brand:brand.trim(),section:section.trim(),extraMetres});
}
export function addLeader(project,sheetId,routeId,{id,anchor,elbow,label,textHeight=1.4}){
 const s=sheet(project,sheetId),r=route(s,routeId);
 unique(s.routes.flatMap(r=>r.leaders),id);[anchor,elbow,label].forEach(requirePoint);
 if(textHeight!==undefined&&(!Number.isFinite(textHeight)||textHeight<.2||textHeight>50))throw Error('Высота текста: от 0,2 до 50 мм на листе');
 r.leaders.push({id,anchor:[...anchor],elbow:[...elbow],label:[...label],...(textHeight!==undefined?{textHeight}:{})});
}
export function removeLeader(project,sheetId,leaderId){
 const s=sheet(project,sheetId),r=s.routes.find(r=>r.leaders.some(l=>l.id===leaderId));
 if(!r)throw Error('Выноска не найдена');r.leaders=r.leaders.filter(l=>l.id!==leaderId);
}
export function moveLeader(project,sheetId,leaderId,delta){
 requirePoint(delta);const s=sheet(project,sheetId),l=s.routes.flatMap(r=>r.leaders).find(l=>l.id===leaderId);
 if(!l)throw Error('Выноска не найдена');
 const elbow=[l.elbow[0]+delta[0],l.elbow[1]+delta[1]],label=[l.label[0]+delta[0],l.label[1]+delta[1]];
 [elbow,label].forEach(requirePoint);l.elbow=elbow;l.label=label;
}
export function calibrateExecutive(project,sheetId,start,end,metres){
 [start,end].forEach(requirePoint);const distance=Math.hypot(end[0]-start[0],end[1]-start[1]);
 if(!Number.isFinite(metres)||metres<=0||!Number.isFinite(distance)||distance<=0)throw Error('Укажите разные точки и положительную известную длину');
 const factor=metres/distance;if(!Number.isFinite(factor)||factor<=0)throw Error('Неверный масштаб');
 const s=sheet(project,sheetId);s.metresPerUnit=factor;for(const r of s.routes)r.metresPerUnit=factor;
}
export function removeRoute(project,sheetId,routeId){const s=sheet(project,sheetId);route(s,routeId);s.routes=s.routes.filter(r=>r.id!==routeId);}
export function moveRoute(project,sheetId,routeId,delta){
 requirePoint(delta);const r=route(sheet(project,sheetId),routeId),move=p=>[p[0]+delta[0],p[1]+delta[1]];
 if(r.sourceIds)throw Error('Это исходный объект: перемещайте его через выбор объекта и свойства.');
 const points=r.points.map(move),leaders=r.leaders.map(l=>({...l,anchor:move(l.anchor),elbow:move(l.elbow),label:move(l.label)}));
 [...points,...leaders.flatMap(l=>[l.anchor,l.elbow,l.label])].forEach(requirePoint);
 r.points=points;r.leaders=leaders;
 if(r.controls)r.controls=r.controls.map(move);
}
export function rotateExecutive(project,sheetId,angle){
 const s=sheet(project,sheetId);if(!Number.isFinite(angle))throw Error('Неверный угол');
 const delta=angle-s.angle;if(!Number.isFinite(delta))throw Error('Неверный угол');
 const routes=s.routes.map(r=>({...r,points:rotatePoints(r.points,delta,s.planCentre),leaders:r.leaders.map(l=>{const [anchor,elbow,label]=rotatePoints([l.anchor,l.elbow,l.label],delta,s.planCentre);return {...l,anchor,elbow,label};})}));
 routes.flatMap(r=>[...r.points,...r.leaders.flatMap(l=>[l.anchor,l.elbow,l.label])]).forEach(requirePoint);
 for(const r of routes)if(r.paths)r.paths=r.paths.map(points=>rotatePoints(points,delta,s.planCentre));
 for(const r of routes)if(r.controls)r.controls=rotatePoints(r.controls,delta,s.planCentre);
 s.routes=routes;s.angle=angle;
 // Native handles require a matching native transform transaction before commit.
 return {handles:[...s.nativeHandles],centre:[...s.planCentre],angle:delta};
}
export function executiveLedger(project,sheetId){return cableLedger(project.sheets.flatMap(s=>s.routes),{sheetId});}
export function executiveEntities(project,sheetId){
 const s=sheet(project,sheetId),ledger=executiveLedger(project,sheetId);
 // Layout is in paper mm. Default 1:100 physical scale; route geometry is not scaled.
 const unit=s.paperUnit;
 const rows=s.tableRows||ledger.rows;
 const pages=s.table?tablePages(s.table):null;
 const pageCount=pages?.length||Math.max(1,Math.ceil(rows.length/10)),stamp=page=>({sheet:String(page+1),sheets:String(pageCount),...s.stamp});
 const layout=executiveLayout({origin:s.origin,title:s.title,titleStyle:s.titleStyle,stamp:stamp(0),rows:rows.slice(0,10),tablePage:pages?.[0],unit,northAngle:s.angle});
 const items=[...layout.items];
 const pageRanges=[{start:0,end:items.length,origin:s.origin}];
 for(let page=1;page<pageCount;page++){const origin=[s.origin[0],s.origin[1]-page*310*unit],start=items.length;items.push(...executiveLayout({origin,title:s.title+' — ведомость, продолжение '+page,titleStyle:s.titleStyle,stamp:stamp(page),rows:rows.slice(page*10,page*10+10),tablePage:pages?.[page],unit,northAngle:s.angle}).items);pageRanges.push({start,end:items.length,origin});}
 const decorationEnd=items.length;
 for(const r of s.routes){
  if(!r.sourceIds)items.push({type:'LWPOLYLINE',points:r.points.flat(),closed:false,routeId:r.id,color:r.color||7,...(r.rgb===undefined?{}:{rgb:r.rgb}),...(r.lineweight===undefined?{}:{lineweight:r.lineweight})});
  for(const l of r.leaders){
   items.push({type:'LWPOLYLINE',points:[...l.anchor,...l.elbow,...l.label],closed:false});
   const dx=l.elbow[0]-l.anchor[0],dy=l.elbow[1]-l.anchor[1],length=Math.hypot(dx,dy);
   if(length){const size=Math.min(3*unit,length/3),ux=dx/length,uy=dy/length;for(const side of [-1,1])items.push({type:'LINE',values:[...l.anchor,l.anchor[0]+size*(ux+side*uy*.4),l.anchor[1]+size*(uy-side*ux*.4)]});}
   const textHeight=l.textHeight??1.4;if(!Number.isFinite(textHeight)||textHeight<.2||textHeight>50)throw Error('Неверный размер текста выноски');
   items.push({type:'TEXT',text:[r.brand,r.section].filter(Boolean).join(' ')||'Кабель не назначен',values:[...l.label,textHeight*unit,0]});
  }
 }
 for(const item of items)if(item.type==='TEXT')item.font=s.font||'times.ttf';
 return {items,ledger,planBounds:layout.planBounds,pageRanges,decorationEnd};
}
export function executiveTransaction(project,edit){const next=structuredClone(project);edit(next);return next;}
