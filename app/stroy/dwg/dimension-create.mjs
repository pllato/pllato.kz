import {addEntity,get,num} from './cad.mjs?v=0.17.64';
export function offsetGeometry(a,b,position,axis,height){
 if(!['horizontal','vertical'].includes(axis)||![...a,...b,...position,height].every(Number.isFinite)||height<=0)throw Error('Некорректные параметры отступа');
 const vertical=axis==='vertical',length=Math.abs(b[vertical?1:0]-a[vertical?1:0]);
 if(length<1e-8)throw Error('Начало и конец должны задавать ненулевое расстояние');
 const p=vertical?[position[0],a[1]]:[a[0],position[1]],q=vertical?[position[0],b[1]]:[b[0],position[1]],tick=height*.3;
 const text=String(Number(length.toFixed(3))),t=vertical?[p[0]-text.length*height*.6-height*.4,(p[1]+q[1])/2-height*.35]:[(p[0]+q[0])/2-text.length*height*.3,p[1]+height*.4];
 return {a,b,q,t,angle:vertical?90:0,height,text,length,lines:[[a,p],[b,q],[p,q],... [p,q].map(v=>[[v[0]-tick,v[1]-tick],[v[0]+tick,v[1]+tick]])]};
}
const record=(id,type,pairs)=>({id,type,pairs:[[0,type],...pairs]});
export function installDimensionBlock(doc,r,records){
 const name=get(r,2);if(doc.blocks.has(name))throw Error('Имя блока размера уже занято');
 const start=record(r.id+'-block','BLOCK',[[100,'AcDbEntity'],[8,'0'],[100,'AcDbBlockBegin'],[2,name],[70,1],[10,0],[20,0],[30,0],[3,name]]),end=record(r.id+'-end','ENDBLK',[[100,'AcDbEntity'],[8,'0'],[100,'AcDbBlockEnd']]);
 let section='',index=-1;for(let i=0;i<doc.records.length;i++){if(doc.records[i].type==='SECTION')section=get(doc.records[i],2);if(section==='BLOCKS'&&doc.records[i].type==='ENDSEC'){index=i;break;}}
 if(index<0){index=doc.records.findIndex(v=>v.type==='SECTION'&&get(v,2)==='ENTITIES');if(index<0)throw Error('Нет раздела объектов');doc.records.splice(index,0,record(r.id+'-section','SECTION',[[2,'BLOCKS']]),record(r.id+'-section-end','ENDSEC',[]));index++;}
 doc.records.splice(index,0,start,...records,end);doc.blocks.set(name,{base:[0,0],flags:1,records});
}
export function createOffsetDimension(doc,a,b,position,axis,height){
 const f=offsetGeometry(a,b,position,axis,height),name='*DPLL_'+crypto.randomUUID().replaceAll('-','');
 const r=addEntity(doc,'DIMENSION',[[2,name],[70,0]]);
 // Use actual CAD DIMENSION, with a private graphics block, not loose lines.
 r.pairs=r.pairs.filter(p=>[0,5,330].includes(p[0]));r.pairs.push([100,'AcDbEntity'],[8,'0'],[100,'AcDbDimension'],[2,name],[70,0],[10,f.q[0]],[20,f.q[1]],[30,0],[11,f.t[0]],[21,f.t[1]],[31,0],[42,f.length],[1,''],[3,'Standard'],[100,'AcDbAlignedDimension'],[13,a[0]],[23,a[1]],[33,0],[14,b[0]],[24,b[1]],[34,0],[50,f.angle],[100,'AcDbRotatedDimension']);
 const records=f.lines.map((line,i)=>record(r.id+'-line-'+i,'LINE',[[100,'AcDbEntity'],[8,'0'],[62,0],[100,'AcDbLine'],[10,line[0][0]],[20,line[0][1]],[30,0],[11,line[1][0]],[21,line[1][1]],[31,0]]));
 records.push(record(r.id+'-text','TEXT',[[100,'AcDbEntity'],[8,'0'],[62,0],[100,'AcDbText'],[10,f.t[0]],[20,f.t[1]],[30,0],[40,height],[1,f.text],[50,0]]));
 installDimensionBlock(doc,r,records);return r;
}
export function dimensionAddition(doc,r){
 const records=doc.blocks.get(get(r,2))?.records,lines=records?.filter(c=>c.type==='LINE'),text=records?.find(c=>c.type==='TEXT');
 if(!records||records.length!==6||lines.length!==5||!text)throw Error('Неподдерживаемое оформление нового размера');
 return {sourceId:r.id,type:'DIMENSION',text:get(text,1),values:[... [13,23,14,24,10,20,11,21].map(c=>num(r,c)),num(r,50)*Math.PI/180,num(text,40),num(text,50)*Math.PI/180,...lines.flatMap(l=>[10,20,11,21].map(c=>num(l,c))),num(text,10),num(text,20)]};
}
