/* Conservative connected components on electrical device layers. No edits until picked. */
(function(){
'use strict';
const cache=new WeakMap(), layer=document.createElementNS(SVGNS,'g');
layer.id='pdfAutoDevices';svg.insertBefore(layer,gObj);
const deviceLayer=n=>/розет|выключ|socket|switch|эл.*(?:оборуд|щит)|electrical.*(?:fixture|equipment)/i.test(n||'');
function detect(sc){
 if(cache.has(sc))return cache.get(sc);
 const objects=sc.objects.filter(o=>deviceLayer(o.layer)&&o.box.every(Number.isFinite)&&Math.max(o.box[2]-o.box[0],o.box[3]-o.box[1])<=45);
 const parent=objects.map((_,i)=>i),grid=new Map(),step=16,tol=.25;
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 objects.forEach((o,i)=>{const b=o.box,near=new Set();
  for(let x=Math.floor((b[0]-tol)/step);x<=Math.floor((b[2]+tol)/step);x++)for(let y=Math.floor((b[1]-tol)/step);y<=Math.floor((b[3]+tol)/step);y++){
   const key=o.layer+'|'+x+','+y,cell=grid.get(key)||[];cell.forEach(j=>near.add(j));cell.push(i);grid.set(key,cell);
  }
  for(const j of near){const a=objects[j].box;if(b[0]<=a[2]+tol&&a[0]<=b[2]+tol&&b[1]<=a[3]+tol&&a[1]<=b[3]+tol)parent[root(i)]=root(j);}
 });
 const sets=new Map();objects.forEach((o,i)=>{const k=root(i);if(!sets.has(k))sets.set(k,[]);sets.get(k).push(o);});
 const groups=[];
 for(const parts of sets.values()){
  const b=[Math.min(...parts.map(o=>o.box[0])),Math.min(...parts.map(o=>o.box[1])),Math.max(...parts.map(o=>o.box[2])),Math.max(...parts.map(o=>o.box[3]))],w=b[2]-b[0],h=b[3]-b[1];
  if(parts.length>128||Math.min(w,h)<2||Math.max(w,h)>45||Math.max(w,h)/Math.min(w,h)>6)continue;
  if(!parts.some(o=>o.style.fill||/[CQZ]/i.test(o.d)))continue;
  groups.push({parts,box:b});
 }
 cache.set(sc,groups);return groups;
}
function live(){const s=S._pdfScene;return s&&s.src===S.standalonePdf&&s.pn===S.pageNum&&!S.linkedLkDocId?s.scene:null;}
function draw(){
 layer.replaceChildren();const sc=live();if(!sc||!S.W||S.tool!=='select')return;
 const taken=new Set((cur()||[]).flatMap(o=>o._pdfIds||[])),sx=S.W/sc.width,sy=S.H/sc.height;
 for(const group of detect(sc)){
  if(group.parts.some(o=>taken.has(o.id))||S.pdfPickLayer&&group.parts[0].layer!==S.pdfPickLayer)continue;
  const b=group.box,r=document.createElementNS(SVGNS,'rect');r.setAttribute('x',b[0]*sx);r.setAttribute('y',b[1]*sy);r.setAttribute('width',(b[2]-b[0])*sx);r.setAttribute('height',(b[3]-b[1])*sy);r.setAttribute('fill','transparent');r.style.cursor='move';r.style.touchAction='none';
  const title=document.createElementNS(SVGNS,'title');title.textContent='Прибор · нажмите и перетащите';r.append(title);
  r.addEventListener('pointerdown',e=>{
   if(e.button!==0||e.altKey||ptrs.size>1||e.pointerType==='touch'&&!e.isPrimary)return;
   e.stopPropagation();e.preventDefault();const src=S.standalonePdf,pn=S.pageNum,start=toImg(e.clientX,e.clientY),ids=PdfDevices.group(group.parts.map(raw=>({raw}))),orig=ids.map(id=>JSON.parse(JSON.stringify(getObj(id))));
   pointerDrag(e,ev=>{if(S.standalonePdf!==src||S.pageNum!==pn)return;const p=toImg(ev.clientX,ev.clientY);ids.forEach((id,i)=>{const o=getObj(id);if(o){moveObjBy(o,orig[i],p.x-start.x,p.y-start.y);redrawOne(o);}});drawSelUI();},ev=>{
    if(S.standalonePdf!==src||S.pageNum!==pn)return;
    if(ev.type==='pointercancel')ids.forEach((id,i)=>{const o=getObj(id);if(o)moveObjBy(o,orig[i],0,0);});
    redrawAll();renderSide();lkQueueDrawingSave();
   });
  });layer.append(r);
 }
}
const before=prepareStandalonePdfVectors;prepareStandalonePdfVectors=async function(...args){const out=await before(...args);draw();return out;};
for(const name of ['redrawAll','renderOpt']){const old=window[name];window[name]=function(...args){const out=old.apply(this,args);draw();return out;};}
const oldPage=goPage;goPage=function(...args){layer.replaceChildren();return oldPage(...args);};
const oldClose=closeStandalonePdf;closeStandalonePdf=function(...args){layer.replaceChildren();return oldClose(...args);};
document.addEventListener('change',e=>{if(e.target.id==='pdfLayerSelect')draw();});
window.PdfAutoDevices={detect};
})();
