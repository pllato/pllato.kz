// SPDX-License-Identifier: GPL-3.0-or-later
import {cadFont} from './fonts.mjs?v=0.17.68';
// DXF остаётся источником истины: неизвестные записи не вырезаются при экспорте.
export const get=(r,c,d='')=>{const pairs=r._pairs||(r.raw===undefined?r.pairs:null);if(pairs){for(const p of pairs)if(p[0]===c)return p[1];}else{for(const p of groups(r.raw||''))if(p[0]===c)return p[1];}return d;};
export const num=(r,c,d=0)=>Number(get(r,c,d));
export function set(r,c,v){const p=r.pairs.find(p=>p[0]===c);if(p)p[1]=String(v);else r.pairs.push([c,String(v)]);}
export const decode=s=>String(s).replace(/\\U\+([0-9a-f]{4})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
// Проход по строкам без массива из миллионов строк. Неизвестные записи
// остаются исходным текстом; пары материализуются только для редактирования.
function* groups(text){let pos=text.charCodeAt(0)===0xFEFF?1:0;while(pos<text.length){const start=pos;let end=text.indexOf('\n',pos);if(end<0){if(text.slice(pos).trim())throw Error('Неполная пара DXF.');break;}const codeText=text.slice(pos,end).trim(),code=Number(codeText);pos=end+1;end=text.indexOf('\n',pos);if(end<0)end=text.length;const value=text.slice(pos,end).replace(/\r$/,'');pos=end+1;if(!codeText||!Number.isInteger(code))throw Error('Повреждён DXF: неверный код группы.');yield [code,value,start,Math.min(pos,text.length)];}}
function record(type,id,raw,pairs){return {type,id,raw,_pairs:pairs,get pairs(){return this._pairs??=Array.from(groups(this.raw),p=>p.slice(0,2));}};}
function indexDoc(records){
 const blocks=new Map(),entities=[],layers=new Map(),textStyles=new Map();let section='',block=null,hasEntities=false;
 for(const r of records){
  if(r.type==='SECTION'){section=get(r,2).trim();if(section==='ENTITIES')hasEntities=true;}
  else if(r.type==='ENDSEC'){section='';block=null;}
  else if(section==='ENTITIES'){if(num(r,67)!==1)entities.push(r);}
  else if(section==='BLOCKS'){
   if(r.type==='BLOCK'){block={base:[num(r,10),num(r,20)],records:[],flags:num(r,70)};blocks.set(get(r,2),block);}
   else if(r.type==='ENDBLK')block=null;else if(block)block.records.push(r);
  }else if(section==='TABLES'&&r.type==='LAYER')layers.set(get(r,2),{color:num(r,62,7),rgb:get(r,420)===''?undefined:num(r,420),flags:num(r,70)});
  else if(section==='TABLES'&&r.type==='STYLE')textStyles.set(get(r,2),{font:get(r,3),width:num(r,41,1),oblique:num(r,50)});
 }
 if(!hasEntities)throw Error('В файле нет раздела ENTITIES.');
 return {records,entities,blocks,layers,textStyles};
}
// Native DWG adapter supplies records directly; no intermediate DXF file.
export function fromRecords(records){return indexDoc(records);}
function* scanDxf(text){
 if(text.startsWith('AutoCAD Binary DXF'))throw Error('Бинарный DXF пока не поддерживается. Нужен текстовый DXF.');
 if(text.length>256*1024*1024)throw Error('DXF больше 256 МБ: превышен безопасный объём этого браузерного редактора.');
 const records=[];let start=0,type='PREAMBLE',id=0,count=0;
 for(const [code,value,offset,end] of groups(text)){if(code===0){if(offset>start)records.push(record(type,String(id++),text.slice(start,offset)));start=offset;type=value.trim();}if(++count%20000===0)yield end/text.length;}
 if(start<text.length)records.push(record(type,String(id++),text.slice(start)));
 if(!records.some(r=>r.type==='EOF'))throw Error('DXF не завершён: нет EOF.');
 return indexDoc(records);
}
export function parseDxf(text){const it=scanDxf(text);let step;do{step=it.next();}while(!step.done);return step.value;}
export async function parseDxfAsync(text,progress=()=>{},cancelled=()=>false){const it=scanDxf(text);for(;;){if(cancelled())throw Error('Загрузка отменена.');const step=it.next();if(step.done)return step.value;progress(Math.round(step.value*100));await new Promise(r=>setTimeout(r,0));}}
export function cloneDoc(doc){const copy=indexDoc(doc.records.map(r=>{const c=record(r.type,r.id,r.raw,r._pairs?.map(p=>[...p])||(r.raw===undefined?r.pairs.map(p=>[...p]):undefined));if(r.parts)c.parts=r.parts;if(r.hatch)c.hatch=r.hatch;return c;}));if(doc.native){copy.native=true;copy.nativeUnknown=doc.nativeUnknown;copy.recoveredBlocks=doc.recoveredBlocks;copy.nativeOps=doc.nativeOps.map(o=>({...o}));}if(doc.executiveProject)copy.executiveProject=structuredClone(doc.executiveProject);copy.sourceFile=doc.sourceFile;return copy;}
const point=(r,x=10)=>[num(r,x),num(r,x+10)];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const apply=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
// Рациональная B-spline: контрольный многоугольник не выдаём за кривую.
export function spline(r){
 const degree=num(r,71),cp=[],knots=[],weights=[];let p;
 for(const [c,v] of r.pairs){const n=Number(v);if(c===10){p=[n,0];cp.push(p);}else if(c===20&&p)p[1]=n;else if(c===40)knots.push(n);else if(c===41)weights.push(n);}
 const n=cp.length-1;if(!Number.isInteger(degree)||degree<1||degree>10||n<degree||knots.length!==n+degree+2||knots.some((v,i)=>!Number.isFinite(v)||(i&&v<knots[i-1]))||cp.some(p=>!p.every(Number.isFinite))||(weights.length&&weights.length!==cp.length))return null;
 const start=knots[degree],end=knots[n+1];if(!(end>start))return null;const result=[],steps=Math.min(2048,Math.max(32,cp.length*12));
 for(let s=0;s<=steps;s++){const t=start+(end-start)*s/steps;let k=n;if(s<steps){let lo=degree,hi=n+1;while(hi-lo>1){const mid=(lo+hi)>>1;if(t<knots[mid])hi=mid;else lo=mid;}k=lo;}
  const d=[];for(let j=0;j<=degree;j++){const i=k-degree+j,w=weights[i]??1;if(!Number.isFinite(w)||w<=0)return null;d.push([cp[i][0]*w,cp[i][1]*w,w]);}
  for(let a=1;a<=degree;a++)for(let j=degree;j>=a;j--){const i=k-degree+j,den=knots[i+degree-a+1]-knots[i],f=den?(t-knots[i])/den:0;d[j]=d[j].map((v,c)=>(1-f)*d[j-1][c]+f*v);}
  const v=d[degree];result.push([v[0]/v[2],v[1]/v[2]]);
 }return result;
}
export function scene(doc){const steps=sceneSteps(doc);let result;do{result=steps.next();}while(!result.done);return result.value;}
export async function sceneAsync(doc,onProgress=()=>{},cancelled=()=>false){const steps=sceneSteps(doc);let start=performance.now();for(;;){if(cancelled())throw Error('Построение отменено');const result=steps.next();if(result.done)return result.value;if(performance.now()-start>12){onProgress(result.value);await new Promise(r=>setTimeout(r,0));start=performance.now();}}}
// One small scratch index per scene, not a Map on every CAD record. First
// occurrence wins exactly as get(); repeated DXF groups retain their order.
// Raw DXF stays lazy. This cache never survives an edit or a scene build.
function sceneReader(){
 const stamps=new Uint32Array(1072),values=[];let last=null,generation=0;
 return (r,c,d='')=>{
  if(r.raw!==undefined&&!r._pairs)return get(r,c,d);
  if(r!==last){last=r;if(++generation===0xffffffff){stamps.fill(0);generation=1;}for(const [code,value] of r._pairs||r.pairs){if(code>=0&&code<1072&&stamps[code]!==generation){stamps[code]=generation;values[code]=value;}}}
  return c>=0&&c<1072?(stamps[c]===generation?values[c]:d):get(r,c,d);
 };
}
function* sceneSteps(doc){
 const read=sceneReader(),number=(r,c,d=0)=>Number(read(r,c,d)),coordinates=(r,c=10)=>[number(r,c),number(r,c+10)];
 const shapes=[],unsupported=new Map();let visited=0,limited=false;
 const skip=t=>unsupported.set(t,(unsupported.get(t)||0)+1);
 function* walk(records,m=[1,0,0,1,0,0],owner=null,inherited='0',depth=0,blockColor={color:7},device=null,semantic=null){
  for(let ri=0;ri<records.length;ri++){const r=records[ri];if(++visited%2000===0)yield visited;if(visited>3000000){limited=true;return;}const root=owner||r,layer=read(r,8,'0')==='0'?inherited:read(r,8);
   if(number(r,60)===1)continue;
   const aci=Math.abs(number(r,62,256)),layerStyle=doc.layers.get(layer),trueColor=read(r,420);
   const style={...(trueColor!==''?{rgb:'#'+(Number(trueColor)&0xffffff).toString(16).padStart(6,'0')}:aci===0?blockColor:aci===256?(layerStyle?.rgb!==undefined?{rgb:'#'+(layerStyle.rgb&0xffffff).toString(16).padStart(6,'0')}:{color:Math.abs(layerStyle?.color||7)}):{color:aci}),lineweight:Math.max(0,number(r,370,0))};
   const ex=[number(r,210),number(r,220),number(r,230,1)],wcs=['LINE','POINT','ELLIPSE','3DFACE','SPLINE','DIMENSION'].includes(r.type)||(r.type==='POLYLINE'&&(number(r,70)&8));
   if(!wcs&&(ex[0]||ex[1]||![-1,1].includes(ex[2]))){skip(r.type+' наклонная OCS');continue;}
   if(ex[2]===-1&&['TEXT','MTEXT','ATTRIB','ATTDEF'].includes(r.type)){skip(r.type+' зеркальный текст OCS');continue;}
   let pts=[],text=null;const entity=semantic||{id:r.id,matrix:m},identity={entityId:entity.id,entityType:semantic?'COMPOSITE':r.type,entityMatrix:entity.matrix,entityKey:root.id+'|'+entity.id+'|'+entity.matrix.join(',')};
   if(r.type==='HATCH'&&r.hatch){const matrix=ex[2]===-1?mul(m,[-1,0,0,1,0,0]):m,all=r.hatch.loops.flat().map(p=>apply(matrix,p)),bounds=[Infinity,Infinity,-Infinity,-Infinity];for(const [x,y] of all){bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);}shapes.push({id:root.id,...identity,deviceId:device?.id,deviceMatrix:device?.matrix,layer,pts:all,bounds,text:null,hatch:r.hatch,matrix,...style});continue;}
   if(r.type==='LINE')pts=[coordinates(r),coordinates(r,11)];
   else if(r.type==='LWPOLYLINE'||r.type==='POLYLINE'){
    if(r.type==='POLYLINE'){
     const flags=number(r,70);while(records[ri+1]?.type==='VERTEX'){const v=records[++ri];pts.push([number(v,10),number(v,20),number(v,42)]);}if(records[ri+1]?.type==='SEQEND')ri++;
     if(flags&(2|4|16|64)){skip('POLYLINE mesh / fitted');continue;}
     if(flags&8)for(const p of pts)p[2]=0;
    }else{let cur;for(const [c,v] of r.pairs){if(c===10){cur=[Number(v),0,0];pts.push(cur);}else if(c===20&&cur)cur[1]=Number(v);else if(c===42&&cur)cur[2]=Number(v);}}
    const vs=pts;pts=[];const closed=number(r,70)&1;
    for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length];pts.push(a.slice(0,2));if((i+1<vs.length||closed)&&a[2]&&b){
      const bulge=a[2],theta=4*Math.atan(bulge),dx=b[0]-a[0],dy=b[1]-a[1],cx=(a[0]+b[0])/2-dy*(1-bulge*bulge)/(4*bulge),cy=(a[1]+b[1])/2+dx*(1-bulge*bulge)/(4*bulge),rad=Math.hypot(a[0]-cx,a[1]-cy),start=Math.atan2(a[1]-cy,a[0]-cx),n=Math.max(4,Math.ceil(Math.abs(theta)*20));
      for(let j=1;j<n;j++){const t=start+theta*j/n;pts.push([cx+rad*Math.cos(t),cy+rad*Math.sin(t)]);}
    }}if(closed&&pts.length)pts.push(pts[0]);
   }else if(r.type==='CIRCLE'||r.type==='ARC'){
    const center=coordinates(r),rad=number(r,40),start=r.type==='CIRCLE'?0:number(r,50)*Math.PI/180;let span=r.type==='CIRCLE'?Math.PI*2:(number(r,51)*Math.PI/180-start+Math.PI*2)%(Math.PI*2);
    const n=Math.max(8,Math.ceil(span*24));for(let j=0;j<=n;j++)pts.push([center[0]+rad*Math.cos(start+span*j/n),center[1]+rad*Math.sin(start+span*j/n)]);
   }else if(r.type==='SPLINE'){
    pts=spline(r);if(!pts){skip('SPLINE неподдерживаемые параметры');continue;}
   }else if(r.type==='ELLIPSE'){
    const center=coordinates(r),major=[number(r,11),number(r,21),number(r,31)],normal=ex,nn=Math.hypot(...normal);if(!nn){skip('ELLIPSE normal');continue;}
    const ratio=number(r,40),minor=[(normal[1]*major[2]-normal[2]*major[1])*ratio/nn,(normal[2]*major[0]-normal[0]*major[2])*ratio/nn];
    const a=number(r,41),end=number(r,42,Math.PI*2);let span=end-a;if(span<0)span+=Math.PI*2;if(!Number.isFinite(span)||span<0||span>Math.PI*2+1e-8||!Number.isFinite(ratio)||ratio<=0){skip('ELLIPSE неверные параметры');continue;}const count=Math.max(8,Math.ceil(span*24));
    for(let j=0;j<=count;j++){const t=a+span*j/count;pts.push([center[0]+major[0]*Math.cos(t)+minor[0]*Math.sin(t),center[1]+major[1]*Math.cos(t)+minor[1]*Math.sin(t)]);}
   }else if(['SOLID','TRACE','3DFACE'].includes(r.type)){
    pts=[coordinates(r),coordinates(r,11),coordinates(r,12),coordinates(r,13)];if(r.type!=='3DFACE')[pts[2],pts[3]]=[pts[3],pts[2]];pts.push(pts[0]);
   }else if(r.type==='MULTILEADER'){
    if(r.parts?.length&&depth<12)yield* walk(r.parts,m,root,layer,depth+1,style,device,entity);else skip('MULTILEADER без отображаемого содержимого');continue;
   }else if(r.type==='DIMENSION'){
    const block=doc.blocks.get(read(r,2));if(!block||depth>=12){skip('DIMENSION без графического блока');continue;}yield* walk(block.records,m,root,layer,depth+1,style,device,entity);continue;
   }else if(r.type==='TEXT'||r.type==='MTEXT'||r.type==='ATTRIB'||r.type==='ATTDEF'){
    // Center/right/vertical alignment uses the second alignment point.
    // Fit/aligned text needs separate two-point layout, not this anchor rule.
    const useAlignment=r.type!=='MTEXT'&&read(r,11)!==''&&read(r,21)!==''&&![3,5].includes(number(r,72))&&(number(r,72)!==0||number(r,73)!==0);
    pts=[coordinates(r,useAlignment?11:10)];text=decode(r.pairs.filter(p=>p[0]===3||p[0]===1).map(p=>p[1]).join('')).replace(/\\P/g,'\n').replace(/\\~/g,' ').replace(/\\[LlOoKk]/g,'').replace(/\\S([^;]*);/g,(_,s)=>s.replace(/[\^#]/g,'/')).replace(/\\[ACFfHQTWpq][^;]*;/g,'').replace(/[{}]/g,'');
   }else if(r.type==='INSERT'){
    const name=read(r,2),block=doc.blocks.get(name);if(!block){skip('INSERT: ссылка на блок не прочитана');continue;}if(depth>=12||block.flags&12){skip('INSERT / внешняя ссылка');continue;}
    if(number(r,70,1)>1||number(r,71,1)>1){skip('MINSERT');continue;}
    const t=number(r,50)*Math.PI/180,c=Math.cos(t),s=Math.sin(t),sx=number(r,41,1),sy=number(r,42,1),local=[c*sx,s*sx,-s*sy,c*sy,number(r,10),number(r,20)];
    local[4]-=local[0]*block.base[0]+local[2]*block.base[1];local[5]-=local[1]*block.base[0]+local[3]*block.base[1];
    if(ex[2]===-1){local[0]*=-1;local[2]*=-1;local[4]*=-1;}
    yield* walk(block.records,mul(m,local),root,layer,depth+1,style,{id:r.id,matrix:m},semantic);continue;
   }else {if(!['SEQEND','ENDBLK'].includes(r.type))skip(r.type);continue;}
   // Empty attributes may retain far-away anchors and huge text heights in DWG.
   // Keep the CAD records for export, but they have no visible/selectable geometry.
   if(text!==null&&!text.trim())continue;
   if(!wcs&&ex[2]===-1)pts=pts.map(([x,y])=>[-x,y]);
   pts=pts.map(p=>apply(m,p));if(!pts.length||pts.some(p=>!p.every(Number.isFinite)))continue;
   const color=number(r,62,256),height=Math.abs(number(r,40,2.5)*Math.hypot(m[0],m[1]));
   const ts=doc.textStyles?.get(read(r,7,'Standard')),rawText=read(r,1),inline=rawText.match(/\\[fF]([^;]+);/),font=text!==null?cadFont(ts?.font,inline?.[1]):undefined;
   const textFormat=text!==null?{font,textScale:r.type==='MTEXT'?1:number(r,41,ts?.width||1),oblique:number(r,51,ts?.oblique||0)*Math.PI/180,halign:number(r,72),valign:number(r,73)}:{};
   const bounds=[Infinity,Infinity,-Infinity,-Infinity];for(const [x,y] of pts){bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);}if(text!==null){const pad=height*(text.length+2);bounds[0]-=pad;bounds[1]-=pad;bounds[2]+=pad;bounds[3]+=pad;}
   shapes.push({id:root.id,...identity,deviceId:device?.id,deviceMatrix:device?.matrix,layer,pts,bounds,text,fill:['SOLID','TRACE'].includes(r.type),height,multiline:r.type==='MTEXT',textWidth:r.type==='MTEXT'?number(r,41)*Math.hypot(m[0],m[1]):0,attachment:number(r,71,1),angle:Math.atan2(m[1],m[0])+number(r,50)*Math.PI/180,...style,...textFormat});
  }
 }
 yield* walk(doc.entities);return {shapes,unsupported:[...unsupported],limited};
}
export function move(r,dx,dy){
 if(num(r,210)||num(r,220)||num(r,230,1)!==1)throw Error('Перемещение объекта в нестандартной OCS пока отключено.');
 if(!['LINE','LWPOLYLINE','CIRCLE','ARC','TEXT','MTEXT','INSERT','ATTRIB'].includes(r.type))throw Error('Этот тип пока нельзя перемещать.');
 const aligned=['LINE','TEXT','ATTRIB'].includes(r.type);
 for(const p of r.pairs){const delta=p[0]===10||(aligned&&p[0]===11)?dx:p[0]===20||(aligned&&p[0]===21)?dy:null;if(delta!==null&&!Number.isFinite(Number(p[1])+delta))throw Error('Сдвиг выходит за допустимый диапазон координат.');}
 for(const p of r.pairs){if(p[0]===10||(aligned&&p[0]===11))p[1]=String(Number(p[1])+dx);if(p[0]===20||(aligned&&p[0]===21))p[1]=String(Number(p[1])+dy);}
}
const unicode=s=>String(s).replace(/[\u0080-\uFFFF]/g,c=>'\\U+'+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0'));
export function* serializeChunks(doc){for(const r of doc.records){if(r.raw!==undefined&&!r._pairs){const raw=unicode(r.raw);yield raw.endsWith('\n')?raw:raw+'\r\n';continue;}let chunk='';for(const [c,v] of r.pairs){chunk+=c+'\r\n'+unicode(v)+'\r\n';if(chunk.length>65536){yield chunk;chunk='';}}if(chunk)yield chunk;}}
export function serialize(doc){return [...serializeChunks(doc)].join('');}
const appendState=new WeakMap();
export function addEntity(doc,type,pairs){
 let state=appendState.get(doc);
 if(!state||state.records!==doc.records||state.length!==doc.records.length){let section='',end=-1,max=0;for(let i=0;i<doc.records.length;i++){const r=doc.records[i];max=Math.max(max,parseInt(get(r,5,'0'),16)||0);if(r.type==='SECTION')section=get(r,2);if(r.type==='ENDSEC'&&section==='ENTITIES')end=i;}state={records:doc.records,length:doc.records.length,end,max};appendState.set(doc,state);}
 const end=state.end;
 if(end<0)throw Error('Нет раздела объектов.');
 const max=state.max,handle=(max+1).toString(16).toUpperCase();state.max++;state.end++;state.length++;
 const header=doc.records.find(r=>r.type==='SECTION'&&get(r,2)==='HEADER');
 const vi=header?.pairs.findIndex(p=>p[0]===9&&p[1]==='$ACADVER');
 const modern=vi>=0&&String(header.pairs[vi+1]?.[1])>='AC1012';
 const r={id:'new-'+handle,type,pairs:[[0,type],[5,handle],...(modern?[[100,'AcDbEntity']]:[]),[8,'0'],...(modern?[[100,type==='LINE'?'AcDbLine':type==='LWPOLYLINE'?'AcDbPolyline':'AcDbText']]:[]),...pairs.filter(p=>modern||p[0]!==100)]};
 if(state.owner===undefined)state.owner=doc.entities.find(r=>get(r,330))?get(doc.entities.find(r=>get(r,330)),330):'';
 const owner=state.owner;if(owner)r.pairs.splice(2,0,[330,owner]);
 if(header){const i=header.pairs.findIndex(p=>p[0]===9&&p[1]==='$HANDSEED');if(i>=0)header.pairs[i+1][1]=(max+2).toString(16).toUpperCase();}
 doc.records.splice(end,0,r);doc.entities.push(r);return r;
}
export function demo(){return parseDxf('0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n8\nPLAN\n90\n4\n70\n1\n10\n0\n20\n0\n10\n12000\n20\n0\n10\n12000\n20\n8000\n10\n0\n20\n8000\n0\nLINE\n8\nCABLE\n62\n3\n10\n1000\n20\n4000\n11\n11000\n21\n4000\n0\nCIRCLE\n8\nDEVICES\n62\n2\n10\n2000\n20\n2000\n40\n400\n0\nTEXT\n8\nTEXT\n10\n1000\n20\n6500\n40\n350\n1\nДемонстрационный чертёж\n0\nENDSEC\n0\nEOF\n');}
