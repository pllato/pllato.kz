// SPDX-License-Identifier: GPL-3.0-or-later
// DXF остаётся источником истины: неизвестные записи не вырезаются при экспорте.
export const get=(r,c,d='')=>r.pairs.find(p=>p[0]===c)?.[1]??d;
export const num=(r,c,d=0)=>Number(get(r,c,d));
export function set(r,c,v){const p=r.pairs.find(p=>p[0]===c);if(p)p[1]=String(v);else r.pairs.push([c,String(v)]);}
export const decode=s=>String(s).replace(/\\U\+([0-9a-f]{4})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
export function parseDxf(text){
 if(text.startsWith('AutoCAD Binary DXF'))throw Error('Бинарный DXF пока не поддерживается. Нужен текстовый DXF.');
 if(text.length>64*1024*1024)throw Error('После преобразования файл больше 64 МБ. Откройте отдельный лист или уменьшите DWG.');
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/),records=[];let r={type:'PREAMBLE',pairs:[]},section='',block=null,id=0;
 const blocks=new Map(),entities=[],layers=new Map();let hasEntities=false;
 for(let i=0;i+1<lines.length;i+=2){const code=Number(lines[i].trim());if(!Number.isInteger(code)||lines[i].trim()==='')throw Error('Повреждён DXF: неверный код группы.');
 const value=lines[i+1];if(code===0){if(r.pairs.length)records.push(r);r={type:value.trim(),pairs:[],id:String(id++)};}r.pairs.push([code,value]);}
 if(r.pairs.length)records.push(r);
 if(!records.some(r=>r.type==='EOF'))throw Error('DXF не завершён: нет EOF.');
 for(const r of records){
  if(r.type==='SECTION'){section=get(r,2).trim();if(section==='ENTITIES')hasEntities=true;}
  else if(r.type==='ENDSEC'){section='';block=null;}
  else if(section==='ENTITIES'){if(num(r,67)!==1)entities.push(r);}
  else if(section==='BLOCKS'){
   if(r.type==='BLOCK'){block={base:[num(r,10),num(r,20)],records:[],flags:num(r,70)};blocks.set(get(r,2),block);}
   else if(r.type==='ENDBLK')block=null;else if(block)block.records.push(r);
  }else if(section==='TABLES'&&r.type==='LAYER')layers.set(get(r,2),{color:num(r,62,7),flags:num(r,70)});
 }
 if(!hasEntities)throw Error('В файле нет раздела ENTITIES.');
 return {records,entities,blocks,layers};
}
const point=(r,x=10)=>[num(r,x),num(r,x+10)];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const apply=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
export function scene(doc){
 const shapes=[],unsupported=new Map();let visited=0,limited=false;
 const skip=t=>unsupported.set(t,(unsupported.get(t)||0)+1);
 function walk(records,m=[1,0,0,1,0,0],owner=null,inherited='0',depth=0){
  for(const r of records){if(++visited>150000){limited=true;return;}const root=owner||r,layer=get(r,8,'0')==='0'?inherited:get(r,8);
   if(num(r,60)===1)continue;
   const ex=[num(r,210),num(r,220),num(r,230,1)];if(ex[0]||ex[1]||ex[2]!==1){skip(r.type+' OCS');continue;}
   let pts=[],text=null;
   if(r.type==='LINE')pts=[point(r),point(r,11)];
   else if(r.type==='LWPOLYLINE'){
    let cur;for(const [c,v] of r.pairs){if(c===10){cur=[Number(v),0,0];pts.push(cur);}else if(c===20&&cur)cur[1]=Number(v);else if(c===42&&cur)cur[2]=Number(v);}
    const vs=pts;pts=[];const closed=num(r,70)&1;
    for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length];pts.push(a.slice(0,2));if((i+1<vs.length||closed)&&a[2]&&b){
      const bulge=a[2],theta=4*Math.atan(bulge),dx=b[0]-a[0],dy=b[1]-a[1],cx=(a[0]+b[0])/2-dy*(1-bulge*bulge)/(4*bulge),cy=(a[1]+b[1])/2+dx*(1-bulge*bulge)/(4*bulge),rad=Math.hypot(a[0]-cx,a[1]-cy),start=Math.atan2(a[1]-cy,a[0]-cx),n=Math.max(4,Math.ceil(Math.abs(theta)*20));
      for(let j=1;j<n;j++){const t=start+theta*j/n;pts.push([cx+rad*Math.cos(t),cy+rad*Math.sin(t)]);}
    }}if(closed&&pts.length)pts.push(pts[0]);
   }else if(r.type==='CIRCLE'||r.type==='ARC'){
    const center=point(r),rad=num(r,40),start=r.type==='CIRCLE'?0:num(r,50)*Math.PI/180;let span=r.type==='CIRCLE'?Math.PI*2:(num(r,51)*Math.PI/180-start+Math.PI*2)%(Math.PI*2);
    const n=Math.max(8,Math.ceil(span*24));for(let j=0;j<=n;j++)pts.push([center[0]+rad*Math.cos(start+span*j/n),center[1]+rad*Math.sin(start+span*j/n)]);
   }else if(r.type==='TEXT'||r.type==='MTEXT'||r.type==='ATTRIB'||r.type==='ATTDEF'){
    pts=[point(r)];text=decode(r.pairs.filter(p=>p[0]===3||p[0]===1).map(p=>p[1]).join('')).replace(/\\P/g,' · ').replace(/\\[A-Za-z][^;]*;/g,'').replace(/[{}]/g,'');
   }else if(r.type==='INSERT'){
    const name=get(r,2),block=doc.blocks.get(name);if(!block||depth>=12||block.flags&12){skip('INSERT / внешняя ссылка');continue;}
    if(num(r,70,1)>1||num(r,71,1)>1){skip('MINSERT');continue;}
    const t=num(r,50)*Math.PI/180,c=Math.cos(t),s=Math.sin(t),sx=num(r,41,1),sy=num(r,42,1),local=[c*sx,s*sx,-s*sy,c*sy,num(r,10),num(r,20)];
    local[4]-=local[0]*block.base[0]+local[2]*block.base[1];local[5]-=local[1]*block.base[0]+local[3]*block.base[1];
    walk(block.records,mul(m,local),root,layer,depth+1);continue;
   }else {if(!['SEQEND','ENDBLK'].includes(r.type))skip(r.type);continue;}
   pts=pts.map(p=>apply(m,p));if(!pts.length||pts.some(p=>!p.every(Number.isFinite)))continue;
   const color=num(r,62,256),height=Math.abs(num(r,40,2.5)*Math.hypot(m[0],m[1]));
   shapes.push({id:root.id,layer,pts,text,height,angle:Math.atan2(m[1],m[0])+num(r,50)*Math.PI/180,color:color===256?Math.abs(doc.layers.get(layer)?.color||7):Math.abs(color)});
  }
 }
 walk(doc.entities);return {shapes,unsupported:[...unsupported],limited};
}
export function move(r,dx,dy){
 if(!['LINE','LWPOLYLINE','CIRCLE','ARC','TEXT','MTEXT','INSERT'].includes(r.type))throw Error('Этот тип пока нельзя перемещать.');
 const aligned=['LINE','TEXT'].includes(r.type);
 for(const p of r.pairs){if(p[0]===10||(aligned&&p[0]===11))p[1]=String(Number(p[1])+dx);if(p[0]===20||(aligned&&p[0]===21))p[1]=String(Number(p[1])+dy);}
}
const unicode=s=>String(s).replace(/[\u0080-\uFFFF]/g,c=>'\\U+'+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0'));
export function serialize(doc){
 // Никакой фильтрации неизвестных объектов, листов, таблиц и блоков.
 return doc.records.flatMap(r=>r.pairs.flatMap(([c,v])=>[String(c),unicode(v)])).join('\r\n')+'\r\n';
}
export function addEntity(doc,type,pairs){
 const end=doc.records.findIndex((r,i)=>r.type==='ENDSEC'&&doc.records.slice(0,i).filter(t=>t.type==='SECTION').at(-1)?.pairs.some(p=>p[0]===2&&p[1]==='ENTITIES'));
 if(end<0)throw Error('Нет раздела объектов.');
 const max=doc.records.reduce((n,r)=>Math.max(n,parseInt(get(r,5,'0'),16)||0),0),handle=(max+1).toString(16).toUpperCase();
 const header=doc.records.find(r=>r.type==='SECTION'&&get(r,2)==='HEADER');
 const vi=header?.pairs.findIndex(p=>p[0]===9&&p[1]==='$ACADVER');
 const modern=vi>=0&&String(header.pairs[vi+1]?.[1])>='AC1012';
 const r={id:'new-'+handle,type,pairs:[[0,type],[5,handle],...(modern?[[100,'AcDbEntity']]:[]),[8,'0'],...(modern?[[100,type==='LINE'?'AcDbLine':'AcDbText']]:[]),...pairs.filter(p=>modern||p[0]!==100)]};
 const owner=doc.entities.map(r=>get(r,330)).find(Boolean);if(owner)r.pairs.splice(2,0,[330,owner]);
 if(header){const i=header.pairs.findIndex(p=>p[0]===9&&p[1]==='$HANDSEED');if(i>=0)header.pairs[i+1][1]=(max+2).toString(16).toUpperCase();}
 doc.records.splice(end,0,r);doc.entities.push(r);return r;
}
export function demo(){return parseDxf('0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n8\nPLAN\n90\n4\n70\n1\n10\n0\n20\n0\n10\n12000\n20\n0\n10\n12000\n20\n8000\n10\n0\n20\n8000\n0\nLINE\n8\nCABLE\n62\n3\n10\n1000\n20\n4000\n11\n11000\n21\n4000\n0\nCIRCLE\n8\nDEVICES\n62\n2\n10\n2000\n20\n2000\n40\n400\n0\nTEXT\n8\nTEXT\n10\n1000\n20\n6500\n40\n350\n1\nДемонстрационный чертёж\n0\nENDSEC\n0\nEOF\n');}
