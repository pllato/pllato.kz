/* Screen-resolution PDF crop. Editing coordinates and stored previews never change. */
(function(){
'use strict';
const layer=document.createElementNS(SVGNS,'g');layer.id='pdfSharpLayer';layer.style.pointerEvents='none';gMask.after(layer);
let timer=null,running=false,dirty=false,ticket=0;
function source(){return S.linkedLkDocId?null:S.standalonePdf;}
function invalidate(){ticket++;clearTimeout(timer);layer.replaceChildren();delete layer.dataset.ready;}
function schedule(){invalidate();dirty=true;timer=setTimeout(paint,140);}
function snapshot(){const live=S._pdfScene,src=source(),pn=S.pageNum;if(!src||!live||live.src!==src||live.pn!==pn||S.vectorLayer||!S.W||!S.H||!S.scale||!baseimg.complete||!vp.clientWidth||!vp.clientHeight)return null;
  const layout=window.PdfSheetLayout?.active(),scene=live.scene,z=S.scale*(layout?PdfSheetLayout.geometry(layout,S.W,S.H).scale:1),margin=32/z,r=vp.getBoundingClientRect(),corners=[[r.left,r.top],[r.right,r.top],[r.right,r.bottom],[r.left,r.bottom]].map(p=>toImg(...p)),x=Math.max(0,Math.min(...corners.map(p=>p.x))-margin),y=Math.max(0,Math.min(...corners.map(p=>p.y))-margin),right=Math.min(S.W,Math.max(...corners.map(p=>p.x))+margin),bottom=Math.min(S.H,Math.max(...corners.map(p=>p.y))+margin),w=right-x,h=bottom-y;if(w<=0||h<=0)return null;
  // Bound allocation by visible area, even at 2400% zoom. Cap high-DPI screens at 8 MP.
  const desired=z*Math.min(window.devicePixelRatio||1,3),ratio=Math.min(desired,Math.sqrt(8000000/(w*h)),4096/w,4096/h);
  return {src,pn,scene,x,y,w,h,ratio,W:S.W,H:S.H,ticket,dim:S.dim==null?1:S.dim,ids:new Set((S.objects[pn]||[]).flatMap(o=>o._pdfIds||[]))};
}
async function paint(){if(running)return;dirty=false;const s=snapshot();if(!s)return;running=true;const canvas=document.createElement('canvas');
  try{canvas.width=Math.max(1,Math.ceil(s.w*s.ratio));canvas.height=Math.max(1,Math.ceil(s.h*s.ratio));const viewport=s.scene.page.getViewport({scale:s.ratio*s.W/s.scene.width});
    await PdfObjects.render(s.scene.page,s.scene,s.ids,{canvasContext:canvas.getContext('2d'),viewport,transform:[1,0,0,(s.H/s.scene.height)/(s.W/s.scene.width),-s.x*s.ratio,-s.y*s.ratio],background:'#ffffff'},pdfjsLib);
    if(s.ticket!==ticket||source()!==s.src||S.pageNum!==s.pn)return;
    if(s.dim<1){const cc=canvas.getContext('2d');cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1-s.dim;cc.fillStyle=getComputedStyle($('cwrap')).backgroundColor;cc.fillRect(0,0,canvas.width,canvas.height);}
    const image=document.createElementNS(SVGNS,'image');image.setAttribute('x',s.x);image.setAttribute('y',s.y);image.setAttribute('width',canvas.width/s.ratio);image.setAttribute('height',canvas.height/s.ratio);image.setAttribute('preserveAspectRatio','none');image.setAttribute('href',canvas.toDataURL('image/png'));layer.setAttribute('opacity','1');layer.replaceChildren(image);layer.dataset.ready=String(s.ticket);layer.dataset.pixels=canvas.width+'x'+canvas.height;layer.dataset.page=String(s.pn);
  }catch(e){if(s.ticket===ticket)console.warn('PDF zoom render:',e);}finally{canvas.width=canvas.height=1;running=false;if(dirty){clearTimeout(timer);timer=setTimeout(paint,140);}}
}
for(const name of ['applyTransform','redrawAll','redrawOne','applyUnderlay']){const old=window[name];window[name]=function(...args){const result=old.apply(this,args);schedule();return result;};}
const oldPrepare=prepareStandalonePdfVectors;prepareStandalonePdfVectors=function(...args){return Promise.resolve(oldPrepare(...args)).then(r=>{schedule();return r;});};
const oldPage=goPage;goPage=function(...args){invalidate();dirty=false;return oldPage(...args);};
const oldClose=closeStandalonePdf;closeStandalonePdf=function(...args){invalidate();dirty=false;return oldClose(...args);};
})();
