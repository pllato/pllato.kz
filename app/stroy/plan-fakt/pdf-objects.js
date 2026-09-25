/* Stable IDs identify PDF paint operations/subpaths, never pixels or colours.
   Original operator lists remain immutable, including clipping, fonts and images. */
(function(root){
'use strict';
const pending=new WeakMap();
const arity={moveTo:2,lineTo:2,curveTo:6,curveTo2:4,curveTo3:4,rectangle:4,closePath:0};
function analyse(ol,viewport,lib,layerNames={}){
  const O=lib.OPS,U=lib.Util,names=new Map(Object.keys(arity).map(n=>[O[n],n]));
  let matrix=[1,0,0,1,0,0],stroke='#000000',fill='#000000',width=1,dash=[],dashOffset=0,cap=0,join=0,alpha=1;
  let stack=[],layers=[],paths=[],path=null,parts=[],part=-1,clip=false,x=0,y=0,startX=0,startY=0;
  const objects=[],paints=new Map();
  const point=(a,b)=>U.applyTransform([a,b],U.transform(viewport.transform,matrix));
  const rgb=a=>{if(typeof a[0]==='string')return a[0];const s=Math.max(...a)<=1?255:1;return '#'+Array.from(a).slice(0,3).map(v=>Math.round(v*s).toString(16).padStart(2,'0')).join('');};
  function start(a,b){part++;path={p:[],d:'',part};paths.push(path);startX=a;startY=b;const q=point(a,b);path.p.push(q);path.d='M'+q.join(' ');x=a;y=b;}
  function line(a,b){if(!path)start(x,y);const q=point(a,b);path.p.push(q);path.d+='L'+q.join(' ');x=a;y=b;}
  function curve(a,b,c,d,e,f){if(!path)start(x,y);const p0=[x,y],p1=point(a,b),p2=point(c,d),p3=point(e,f);path.d+='C'+[...p1,...p2,...p3].join(' ');
    for(let k=1;k<=16;k++){const t=k/16,u=1-t;path.p.push(point(u*u*u*p0[0]+3*u*u*t*a+3*u*t*t*c+t*t*t*e,u*u*u*p0[1]+3*u*u*t*b+3*u*t*t*d+t*t*t*f));}x=e;y=f;}
  function close(){if(path){path.d+='Z';path.p.push(point(startX,startY));x=startX;y=startY;}}
  function construct(args,index){const ops=Array.from(args[0]),vals=Array.from(args[1]),tokens=[];let j=0;
    for(const op of ops){const n=names.get(op);if(!n)throw Error('Неизвестная команда контура PDF');const a=vals.slice(j,j+arity[n]);j+=arity[n];
      if(n==='moveTo')start(...a);else if(n==='lineTo')line(...a);else if(n==='curveTo')curve(...a);else if(n==='curveTo2')curve(x,y,...a);else if(n==='curveTo3')curve(a[0],a[1],a[2],a[3],a[2],a[3]);
      else if(n==='rectangle'){start(a[0],a[1]);line(a[0]+a[2],a[1]);line(a[0]+a[2],a[1]+a[3]);line(a[0],a[1]+a[3]);close();}else if(n==='closePath')close();
      tokens.push({op,a,part});}
    parts.push({index,tokens});}
  function paint(index,hasStroke,hasFill,evenOdd){
    if(!clip&&!layers.some(g=>g&&g.visible===false)&&(hasStroke||hasFill)&&paths.length){const m=U.transform(viewport.transform,matrix),scale=Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]))||1;
      const style={stroke:hasStroke?stroke:null,fill:hasFill?fill:null,width:width*scale,dash:dash.map(v=>v*scale),dashOffset:dashOffset*scale,cap,join,alpha,evenOdd};
      const groups=hasFill?[paths]:paths.map(p=>[p]);
      for(const ps of groups){if(!ps.some(p=>p.p.length>1))continue;const id=index+':'+(hasFill?'*':ps[0].part);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
        for(const p of ps)for(const q of p.p){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1]);}
        objects.push({id,paint:index,part:hasFill?'*':ps[0].part,p:ps[0].p,paths:ps.map(q=>q.p),d:ps.map(q=>q.d).join(''),style,layer:layers.filter(Boolean).map(g=>typeof g==='object'?g.name:g).join(' / ')||'Без слоя',box:[x0,y0,x1,y1]});}
      paints.set(index,{parts,hasFill});}
    paths=[];path=null;parts=[];part=-1;clip=false;}
  for(let i=0;i<ol.fnArray.length;i++){const fn=ol.fnArray[i],a=ol.argsArray[i]||[];
    if(fn===O.save||fn===O.paintFormXObjectBegin){stack.push({matrix:matrix.slice(),stroke,fill,width,dash:dash.slice(),dashOffset,cap,join,alpha});if(fn===O.paintFormXObjectBegin&&a[0])matrix=U.transform(matrix,a[0]);}
    else if(fn===O.restore||fn===O.paintFormXObjectEnd){const s=stack.pop();if(s)({matrix,stroke,fill,width,dash,dashOffset,cap,join,alpha}=s);}
    else if(fn===O.transform)matrix=U.transform(matrix,a);
    else if(fn===O.setStrokeRGBColor)stroke=rgb(a);else if(fn===O.setFillRGBColor)fill=rgb(a);
    else if(fn===O.setLineWidth)width=a[0];else if(fn===O.setDash){dash=a[0];dashOffset=a[1];}else if(fn===O.setLineCap)cap=a[0];else if(fn===O.setLineJoin)join=a[0];
    else if(fn===O.setGState)for(const [k,v] of a[0]||[]){if(k==='LW')width=v;else if(k==='CA')alpha=v;else if(k==='D'){dash=v[0];dashOffset=v[1];}}
    else if(fn===O.beginMarkedContentProps)layers.push(layerNames[a[1]&&a[1].id]||'');else if(fn===O.beginMarkedContent)layers.push('');else if(fn===O.endMarkedContent)layers.pop();
    else if(fn===O.constructPath)construct(a,i);
    else if(fn===O.clip||fn===O.eoClip)clip=true;
    else if(fn===O.closeStroke){close();paint(i,true,false,false);}
    else if(fn===O.stroke)paint(i,true,false,false);
    else if(fn===O.closeFillStroke||fn===O.closeEOFillStroke){close();paint(i,true,true,fn===O.closeEOFillStroke);}
    else if(fn===O.fillStroke||fn===O.eoFillStroke)paint(i,true,true,fn===O.eoFillStroke);
    else if(fn===O.fill||fn===O.eoFill)paint(i,false,true,fn===O.eoFill);
    else if(fn===O.endPath)paint(i,false,false,false);
  }
  return {objects,paints,ol,layerNames,width:viewport.width,height:viewport.height};
}
function filtered(scene,ids,lib){
  const O=lib.OPS,fnArray=scene.ol.fnArray.slice(),argsArray=scene.ol.argsArray.slice(),byPaint=new Map();
  for(const id of ids){const [p,s]=id.split(':');if(!byPaint.has(+p))byPaint.set(+p,new Set());byPaint.get(+p).add(s);}
  for(const [i,set] of byPaint){const paint=scene.paints.get(i);if(!paint)continue;
    if(paint.hasFill||set.has('*')){fnArray[i]=O.endPath;argsArray[i]=[];continue;}
    const finalPart=paint.parts.at(-1)?.tokens.at(-1)?.part;if(fnArray[i]===O.closeStroke&&set.has(String(finalPart)))fnArray[i]=O.stroke;
    for(const chunk of paint.parts){const keep=chunk.tokens.filter(t=>!set.has(String(t.part))),old=argsArray[chunk.index];
      argsArray[chunk.index]=[keep.map(t=>t.op),keep.flatMap(t=>t.a),...old.slice(2)];}
  }
  if(![...ids].some(id=>id.startsWith('text:')))return {...scene.ol,fnArray,argsArray,lastChunk:true};
  // Invisible text still advances the text cursor: following glyphs do not shift.
  const f=[],a=[];let mode=0;const modes=[];for(let i=0;i<fnArray.length;i++){const fn=fnArray[i];if(fn===O.save)modes.push(mode);if(fn===O.restore&&modes.length)mode=modes.pop();if(fn===O.setTextRenderingMode)mode=argsArray[i][0];const hide=ids.has('text:'+i);if(hide){f.push(O.setTextRenderingMode);a.push([3]);}f.push(fn);a.push(argsArray[i]);if(hide){f.push(O.setTextRenderingMode);a.push([mode]);}}
  return {...scene.ol,fnArray:f,argsArray:a,lastChunk:true};
}
async function render(page,scene,ids,params,lib){
  // Dedicated document and queue: thumbnails never share the temporary display state.
  const previous=pending.get(page)||Promise.resolve();
  const job=previous.catch(()=>{}).then(async()=>{
    if(lib.version!=='3.11.174'||!(page._intentStates instanceof Map))throw Error('Версия PDF-движка не поддерживает объектное редактирование');
    const annotationMode=lib.AnnotationMode.DISABLE,info=page._transport.getRenderingIntent('display',annotationMode),key=info.cacheKey,old=page._intentStates.get(key);
    page._intentStates.set(key,{displayReadyCapability:{promise:Promise.resolve(true)},operatorList:filtered(scene,ids,lib),renderTasks:new Set()});
    try{await page.render({...params,intent:'display',annotationMode}).promise;}finally{if(old)page._intentStates.set(key,old);else page._intentStates.delete(key);}
  });pending.set(page,job);return job;
}
root.PdfObjects={analyse,filtered,render};
if(typeof module!=='undefined')module.exports=root.PdfObjects;
})(typeof window==='undefined'?globalThis:window);
