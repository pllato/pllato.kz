// Fit the entire source without cropping or changing its aspect ratio.
export function containRect(sw,sh,x,y,w,h){
 if(!(sw>0&&sh>0&&w>0&&h>0))return null;
 const scale=Math.min(w/sw,h/sh),width=sw*scale,height=sh*scale;
 return {x:x+(w-width)/2,y:y+(h-height)/2,width,height};
}
export function recordingLayout(cameras,screens){
 const width=1280,height=668,gap=8,result=[];
 function grid(count,x,y,w,h,kind){
  if(!count)return;
  const cols=Math.min(count,Math.ceil(Math.sqrt(count*w/h))),rows=Math.ceil(count/cols);
  const cw=w/cols,ch=h/rows;
  for(let i=0;i<count;i++)result.push({kind,index:i,x:x+i%cols*cw+gap/2,y:y+Math.floor(i/cols)*ch+gap/2,w:cw-gap,h:ch-gap});
 }
 if(screens){
  const strip=cameras?136:0;
  grid(screens,0,0,width,height-strip,'screen');
  const cameraWidth=Math.min(width,cameras*220);
  grid(cameras,(width-cameraWidth)/2,height-strip,cameraWidth,strip,'camera');
 }else grid(cameras,0,0,width,height,'camera');
 return result;
}
