// SPDX-License-Identifier: GPL-3.0-or-later
// Read-only screen geometry. Children retain their MULTILEADER selection owner.
export function leaderParts(e,record){
 const colorPairs=raw=>{if(raw==null)return [[62,0]];const method=raw>>>24;return method===194?[[420,raw&0xffffff]]:[[62,method===192?256:method===193?0:method===195?raw&255:raw>=0&&raw<=256?raw:0]];};
 const parts=[],base=[[8,e.layer||'0'],...colorPairs(e.leaderLineColor)],point=(p,c,v)=>{p.push([c,v.x],[c+10,v.y],[c+20,v.z||0]);};
 const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const line=(a,b)=>{if(!valid(a)||!valid(b))return;const p=[...base];point(p,10,a);point(p,11,b);parts.push(record('LINE',p));};
 for(const section of e.leaderSections||[]){
  const last=section.lastLeaderLinePoint;
  for(const branch of section.leaderLines||[]){const points=[...(branch.vertices||[])];if(valid(last))points.push(last);for(let i=1;i<points.length;i++)line(points[i-1],points[i]);
   const a=points[0],b=points[1],size=e.arrowheadSize;
   if(valid(a)&&valid(b)&&size>0&&(!e.arrowheadId||e.arrowheadId==='0')){const len=Math.hypot(b.x-a.x,b.y-a.y);if(len){const ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,p=[...base],left={x:a.x+ux*size-uy*size*.25,y:a.y+uy*size+ux*size*.25},right={x:a.x+ux*size+uy*size*.25,y:a.y+uy*size-ux*size*.25};point(p,10,a);point(p,11,left);point(p,12,right);point(p,13,right);parts.push(record('SOLID',p));}}
  }
  if(valid(last)&&valid(section.doglegVector)&&section.doglegVectorSet&&e.doglegEnabled){const v=section.doglegVector,d=section.doglegLength||0;line(last,{x:last.x+v.x*d,y:last.y+v.y*d,z:(last.z||0)+(v.z||0)*d});}
 }
 if(e.hasMText&&typeof e.textContent==='string'&&valid(e.textAnchor)&&e.textHeight>0){
  const p=[[8,e.layer||'0'],...colorPairs(e.textColor),[1,e.textContent],[40,e.textHeight],[41,e.textWidth||0],[71,e.textAttachmentPoint||1],[50,(e.textRotation||0)*180/Math.PI]];
  point(p,10,e.textAnchor);if(e.normal)point(p,210,e.normal);parts.push(record('MTEXT',p));
 }
 if(e.hasBlock)parts.push(record('MULTILEADER: блок пока не отображается',base));
 if(e.arrowheadId&&e.arrowheadId!=='0')parts.push(record('MULTILEADER: нестандартная стрелка',base));
 if(e.leaderLineType===2||(e.leaderSections||[]).some(s=>s.breaks?.length||s.leaderLines?.some(l=>l.breaks?.length)))parts.push(record('MULTILEADER: сложная линия упрощена',base));
 return parts;
}
