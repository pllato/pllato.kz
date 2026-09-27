// Fit the selected geometry, not the user's selection rectangle. Reserve a
// new sheet beyond every visible object (including hidden layers and sheets).
export function executivePlacement(shapes,ids){
 const selected=new Set(ids),bounds=[Infinity,Infinity,-Infinity,-Infinity];
 let right=-Infinity;
 for(const shape of shapes){
  if(shape.bounds?.every(Number.isFinite))right=Math.max(right,shape.bounds[2]);
  for(const [x,y] of shape.pts){
   if(!Number.isFinite(x)||!Number.isFinite(y))continue;
   right=Math.max(right,x);
   if(selected.has(shape.id)){bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);}
  }
 }
 if(!bounds.every(Number.isFinite))throw Error('Не найдены границы выбранного плана');
 const unit=Math.max((bounds[2]-bounds[0])/380,(bounds[3]-bounds[1])/177,1e-6)*1.04;
 const origin=[right+20*unit,bounds[1]-65*unit];
 const centre=[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2];
 const position=[origin[0]+210*unit,origin[1]+153.5*unit];
 if(![...origin,...position,unit].every(Number.isFinite))throw Error('Слишком большие координаты листа');
 return {origin,centre,position,unit,bounds};
}
