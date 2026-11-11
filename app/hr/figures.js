/* Shared SVG rendering: count is part of a primitive, not an array length. */
(function(){
 function renderShapes(prims){
  if(!prims?.length)return '';
  const figures=prims.flatMap(p=>Array.from({length:p.count??1},()=>p));
  const n=figures.length,scale=Math.min(1,82/(n*60)),sizes={s:14,m:20,l:28};
  const parts=figures.map((p,i)=>{
   const r=(sizes[p.size]||20)*scale,cx=100*(i+.5)/n,cy=50;
   const attrs=`fill="${p.fill?'#0f1620':'none'}" stroke="#0f1620" stroke-width="${n>1?2:3}"`;
   const rotation=`transform="rotate(${Number(p.rot)||0} ${cx} ${cy})"`;
   if(p.shape==='circle')return `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`;
   if(p.shape==='square')return `<rect x="${cx-r}" y="${cy-r}" width="${2*r}" height="${2*r}" ${attrs} ${rotation}/>`;
   if(p.shape==='triangle')return `<polygon points="${cx},${cy-r*1.2} ${cx-r},${cy+r*.7} ${cx+r},${cy+r*.7}" ${attrs} ${rotation}/>`;
   if(p.shape==='arrow')return `<polygon points="${cx},${cy-r} ${cx+r*.65},${cy-r*.15} ${cx+r*.25},${cy-r*.15} ${cx+r*.25},${cy+r} ${cx-r*.25},${cy+r} ${cx-r*.25},${cy-r*.15} ${cx-r*.65},${cy-r*.15}" ${attrs} ${rotation}/>`;
   throw new Error('Unknown shape: '+p.shape);
  });
  return `<svg class="shape" viewBox="0 0 100 100" aria-hidden="true">${parts.join('')}</svg>`;
 }
 globalThis.HR_FIGURES={renderShapes};
})();
