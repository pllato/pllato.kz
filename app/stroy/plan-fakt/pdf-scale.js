/* Scale suggestions: PDF coordinates, never raster pixels or arbitrary bare numbers. */
(function(root){
'use strict';
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1], sub=(a,b)=>[a[0]-b[0],a[1]-b[1]], dist=(a,b)=>Math.hypot(...sub(a,b));
function textItems(items,view){const m=view.transform,point=p=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];return items.filter(i=>i.str&&i.transform).map(i=>{const t=i.transform,l=Math.hypot(t[0],t[1])||1,p=point([t[4],t[5]]),end=point([t[4]+t[0]/l*i.width,t[5]+t[1]/l*i.width]),v=sub(end,p),n=Math.hypot(...v)||1;return {text:i.str.trim(),p,end,u:v.map(x=>x/n),center:p.map((x,k)=>(x+end[k])/2),height:Math.max(1,i.height||l),width:dist(p,end)};});}
function ratios(texts,userUnit){
  // Combine neighbouring text runs only along the same baseline (split "1", ":", "100").
  const rows=[];for(const t of texts){let row=rows.find(r=>Math.abs(dot(sub(t.p,r[0].p),[-r[0].u[1],r[0].u[0]]))<Math.max(2,t.height*.2)&&dot(t.u,r[0].u)>.99);if(!row)rows.push(row=[]);row.push(t);}
  const found=new Map();for(const row of rows){const u=row[0].u;row.sort((a,b)=>dot(a.p,u)-dot(b.p,u));let chunks=[],s='';for(const t of row){if(s&&dot(sub(t.p,chunks[chunks.length-1].end),u)>Math.max(12,t.height*2)){scan(s,chunks);s='';chunks=[];}s+=' '+t.text;chunks.push(t);}scan(s,chunks);}
  function scan(s,parts){for(const match of s.matchAll(/(?:^|[^\d\w/])(\d{1,4})\s*[:：]\s*(\d{1,6})(?![\d/])/g)){const a=+match[1],b=+match[2];if(a!==1||b<1||b>10000)continue;const key=b;if(!found.has(key))found.set(key,{kind:'label',denominator:b,mPerPoint:b*25.4/72000*userUnit,label:'1:'+b,source:s.trim().slice(0,160),point:parts[0].p});}}
  return [...found.values()];
}
function dimensions(texts,objects){
  const segments=[],ticks=new Map(),cell=16;
  const key=p=>Math.floor(p[0]/cell)+','+Math.floor(p[1]/cell);
  for(const o of objects||[]){if(!o.style.stroke||o.style.fill||o.style.dash.length)continue;for(const p of o.paths){if(p.length!==2)continue;const len=dist(p[0],p[1]);if(len<2)continue;const s={a:p[0],b:p[1],len,u:sub(p[1],p[0]).map(x=>x/len),id:o.id};if(len>=30)segments.push(s);if(len<=14){const k=key(p[0].map((x,i)=>(x+p[1][i])/2));if(!ticks.has(k))ticks.set(k,[]);ticks.get(k).push(s);}}}
  function endTick(line,end){let best=null,score=Infinity;const cx=Math.floor(end[0]/cell),cy=Math.floor(end[1]/cell);for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)for(const t of ticks.get(x+','+y)||[]){const parallel=Math.abs(dot(line.u,t.u));if(parallel<.25||parallel>.9)continue;const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],v=sub(t.b,t.a),w=sub(t.a,line.a),den=cross(line.u,v),d=cross(w,v)/den,q=cross(w,line.u)/den;if(q<.15||q>.85)continue;const p=line.a.map((a,k)=>a+line.u[k]*d),gap=dist(p,end);if(gap<Math.min(9,line.len*.15)&&gap<score){best=p;score=gap;}}return best;}
  const matches=[];for(const t of texts){if(!/^\d{3,6}(?:[.,]\d+)?(?:\s*мм)?$/i.test(t.text))continue;const mm=parseFloat(t.text.replace(',','.'));if(mm<100||mm>200000)continue;let best=null,score=Infinity;
    for(const s of segments){if(Math.abs(dot(t.u,s.u))<.995)continue;const delta=sub(t.center,s.a),along=dot(delta,s.u),off=Math.abs(dot(delta,[-s.u[1],s.u[0]]));if(along<0||along>s.len||off>Math.max(5,t.height*1.5)||Math.abs(along-s.len/2)>Math.max(t.width,s.len*.12))continue;const rank=off+Math.abs(along-s.len/2)*.2;if(rank>=score)continue;const a=endTick(s,s.a),b=endTick(s,s.b);if(!a||!b)continue;const length=dist(a,b),mPerPoint=mm/1000/length;if(length<75||mPerPoint<.001||mPerPoint>10)continue;best={mm,a,b,mPerPoint,id:s.id};score=rank;}
    if(best&&!matches.some(m=>m.id===best.id))matches.push(best);
  }
  const groups=[];for(const m of matches){let g=groups.find(g=>Math.abs(m.mPerPoint/g[0].mPerPoint-1)<.01);if(!g)groups.push(g=[]);g.push(m);}
  return groups.filter(g=>g.length>=3&&new Set(g.map(m=>m.mm)).size>=2).sort((a,b)=>b.length-a.length).map(g=>{const sorted=g.map(m=>m.mPerPoint).sort((a,b)=>a-b),mPerPoint=sorted[Math.floor(sorted.length/2)];return {kind:'dimensions',mPerPoint,count:g.length,controls:g.sort((a,b)=>b.mm-a.mm),label:'По '+g.length+' размерам'};});
}
function analyse(items,view,objects=[],userUnit=1){const texts=textItems(items,view);return {labels:ratios(texts,userUnit),dimensions:dimensions(texts,objects)};}
const api={analyse,textItems};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PdfScale=api;
})(typeof window!=='undefined'?window:globalThis);
