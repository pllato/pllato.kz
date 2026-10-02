// SPDX-License-Identifier: GPL-3.0-or-later
// Geometry view only. The original DWG remains the source for saving.
import {fromRecords} from './cad.mjs?v=0.17.63';
import {leaderParts} from './mleader.mjs?v=0.17.63';
import {hatchGeometry} from './hatch.mjs?v=0.17.63';
export function nativeDocument(db,index=true){
 const blockNames=new Map(db.tables.BLOCK_RECORD.entries.map(b=>[b.handle,b.name||'@'+b.handle]));
 const textStyles=db.tables.STYLE?.entries||[],styleNames=new Map(textStyles.map(s=>[s.handle,s.name]));
 let serial=0;
 const record=(type,pairs=[],id)=>({type,id:id||'native-'+serial++,pairs:[[0,type],...pairs].map(([c,v])=>[c,String(v)])});
 const point=(pairs,code,p)=>{if(p){pairs.push([code,p.x],[code+10,p.y]);if(p.z!==undefined)pairs.push([code+20,p.z]);}};
 const degrees=r=>(r||0)*180/Math.PI;
 function entities(list){const attached=new Set(list.flatMap(e=>(e.attribs||[]).map(a=>a.handle)));return list.filter(e=>!attached.has(e.handle)).flatMap(e=>{
  const type=e.type==='POLYLINE2D'||e.type==='POLYLINE3D'?'POLYLINE':e.type;
  const p=[[5,e.handle],[8,e.layer||'0'],[62,e.colorIndex??256],[330,e.ownerBlockRecordSoftId||'0']];
  if(Number.isInteger(e.color))p.push([420,e.color]);
  // SDK exposes DWG's 5-bit enum; DXF 370 uses hundredths of a millimetre.
  if(Number.isInteger(e.lineweight)&&e.lineweight>=0&&e.lineweight<32)p.push([370,[0,5,9,13,15,18,20,25,30,35,40,50,53,60,70,80,90,100,106,120,140,158,200,211,0,0,0,0,0,-1,-2,-3][e.lineweight]]);
  if(e.isVisible===false)p.push([60,1]);if(e.type!=='LWPOLYLINE'||(e.flag&1))point(p,210,e.extrusionDirection);
  switch(e.type){
   case 'LINE':point(p,10,e.startPoint);point(p,11,e.endPoint);break;
   case 'POINT':point(p,10,e.position||e.point);break;
   case 'CIRCLE':case 'ARC':point(p,10,e.center);p.push([40,e.radius],[50,degrees(e.startAngle)],[51,degrees(e.endAngle)]);break;
   case 'LWPOLYLINE':p.push([70,(e.flag&512?1:0)|(e.flag&256?128:0)],[90,e.vertices.length]);for(const v of e.vertices){point(p,10,v);p.push([42,v.bulge||0]);}break;
   case 'TEXT':case 'ATTRIB':case 'ATTDEF':{const t=typeof e.text==='object'?e.text:e;point(p,10,t.startPoint);point(p,11,t.endPoint);p.push([1,t.text],[7,t.styleName||'Standard'],[40,t.textHeight],[41,t.xScale||1],[51,degrees(t.obliqueAngle)],[72,t.halign||0],[73,t.valign||0],[50,degrees(t.rotation)]);break;}
   case 'MTEXT':point(p,10,e.insertionPoint);p.push([1,e.text],[7,e.styleName||'Standard'],[40,e.textHeight],[41,e.rectWidth||0],[71,e.attachmentPoint||1],[50,degrees(e.rotation)]);break;
   case 'INSERT':point(p,10,e.insertionPoint);p.push([2,blockNames.get(e.blockRecordId)||blockNames.get(e.recoveredBlockRecordId)||e.name],[41,e.xScale],[42,e.yScale],[50,degrees(e.rotation)],[70,e.columnCount||1],[71,e.rowCount||1],[66,e.attribs?.length?1:0]);break;
   case 'ELLIPSE':point(p,10,e.center);point(p,11,e.majorAxisEndPoint);p.push([40,e.axisRatio],[41,e.startAngle],[42,e.endAngle]);break;
   case 'SPLINE':p.push([71,e.degree],[74,e.fitPoints?.length||0]);for(const v of e.controlPoints)point(p,10,v);for(const n of e.knots)p.push([40,n]);for(const n of e.weights||[])p.push([41,n]);for(const v of e.fitPoints||[])point(p,11,v);break;
   case 'SOLID':case 'TRACE':case '3DFACE':for(let i=1;i<=4;i++)point(p,9+i,e['corner'+i]||e.corner3);break;
   case 'DIMENSION':
    p.push([2,e.name],[70,e.linearKind??e.dimensionType??-1],[1,e.text||''],[3,e.styleName||'Standard']);
    point(p,10,e.definitionPoint);point(p,11,e.textPoint);
    point(p,13,e.subDefinitionPoint1);point(p,14,e.subDefinitionPoint2);
    if(Number.isFinite(e.measurement))p.push([42,e.measurement]);
    if(Number.isFinite(e.dimensionRotation))p.push([50,degrees(e.dimensionRotation)]);
    break;
   case 'POLYLINE2D':case 'POLYLINE3D':p.push([70,e.flag|(e.type==='POLYLINE3D'?8:0)]);break;
  }
  const result=[record(type,p,'dwg-'+e.handle)];
  if(['ATTRIB','ATTDEF'].includes(type)&&e.mtextFlag>1)result[0].noteReadOnly=true;
  if(e.dimensionEndLocked)result[0].dimensionEndLocked=true;
  if(e.dimensionMoveLocked)result[0].dimensionMoveLocked=true;
  if(e.type==='MULTILEADER'){result[0].parts=leaderParts({...e,textStyleName:styleNames.get(e.textStyleId)||'Standard'},record);if(e.hasMText)result[0].pairs.push([1,e.textContent||''],[40,String(e.textHeight||1)]);}
  if(e.type==='HATCH')result[0].hatch=hatchGeometry(e);
  if(type==='POLYLINE'){for(const v of e.vertices||[]){const q=[[42,v.bulge||0]];point(q,10,v);result.push(record('VERTEX',q));}result.push(record('SEQEND'));}
  if(e.type==='INSERT'&&e.attribs?.length)result.push(...entities(e.attribs));
  return result;
 });}
 const records=[record('SECTION',[[2,'HEADER'],[9,'$ACADVER'],[1,db.header.ACADVER],[9,'$INSUNITS'],[70,db.header.INSUNITS||0]]),record('ENDSEC'),record('SECTION',[[2,'TABLES']])];
 for(const l of db.tables.LAYER.entries)records.push(record('LAYER',[[5,l.handle],[2,l.name],[62,l.off?-Math.abs(l.colorIndex):l.colorIndex],[70,l.standardFlag],...(Number.isInteger(l.color)?[[420,l.color]]:[])]));
 for(const s of textStyles)records.push(record('STYLE',[[5,s.handle],[2,s.name],[3,s.font||''],[4,s.bigFont||''],[41,s.widthFactor||1],[50,degrees(s.obliqueAngle)]]));
 records.push(record('ENDSEC'),record('SECTION',[[2,'BLOCKS']]));
 const paper=new Set();
 for(const b of db.tables.BLOCK_RECORD.entries){
  if(/^\*paper_space/i.test(b.name))paper.add(b.handle);
  // Model entities are already supplied below; paper space is not displayed.
  if(/^\*(model_space|paper_space)/i.test(b.name))continue;
  const p=[[2,blockNames.get(b.handle)],[70,b.flags]];point(p,10,b.basePoint);
  records.push(record('BLOCK',p));for(const r of entities(b.entities))records.push(r);records.push(record('ENDBLK'));
 }
 records.push(record('ENDSEC'),record('SECTION',[[2,'ENTITIES']]));
 for(const r of entities(db.entities.filter(e=>!e.isInPaperSpace&&!paper.has(e.ownerBlockRecordSoftId))))records.push(r);
 records.push(record('ENDSEC'),record('EOF'));
 const doc=index?fromRecords(records):{records};doc.recoveredBlocks=db.entities.filter(e=>e.type==='INSERT'&&e.recoveredBlockRecordId).length;return doc;
}
