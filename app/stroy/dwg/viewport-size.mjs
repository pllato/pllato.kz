export const usableViewport=(width,height)=>Number.isFinite(width)&&Number.isFinite(height)&&width>=1&&height>=1;
// Keep the same CAD point at the centre when browser chrome/orientation changes.
export function resizeView(view,oldWidth,oldHeight,width,height){
 if(!oldWidth||!oldHeight||!width||!height)return {...view};
 const factor=Math.min(width/oldWidth,height/oldHeight);
 return {s:view.s*factor,x:width/2+(view.x-oldWidth/2)*factor,y:height/2+(view.y-oldHeight/2)*factor};
}
