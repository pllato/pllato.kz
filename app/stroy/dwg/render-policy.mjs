// Interaction raster only. CAD coordinates and DWG/PDF precision are unchanged.
export const RASTER_THRESHOLD=2000;
export function canvasResolution(width,height,dpr=1,coarse=false){
 const scale=Math.min(Math.max(1,dpr||1),coarse?1.5:2,Math.sqrt((coarse?2400000:4000000)/Math.max(1,width*height)));
 return [Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale))];
}
