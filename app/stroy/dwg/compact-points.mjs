// SPDX-License-Identifier: GPL-3.0-or-later
// Float64 preserves every tessellated coordinate. Expand a temporary path only
// while rendering/hit-testing, rather than retaining millions of tiny arrays.
const points={enumerable:true,configurable:true,get(){
 if(this._points)return this._points;
 const a=this._pointData,out=new Array(a.length/2);
 const m=this._pointMatrix;for(let i=0;i<out.length;i++){const x=a[i*2],y=a[i*2+1];out[i]=m?[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]:[x,y];}
 return out;
},set(value){this._points=value;this._pointData=undefined;this._pointMatrix=undefined;}};
const pointPrototype={};Object.defineProperty(pointPrototype,'pts',points);
export function compactShapePoints(shape,localPoints=null,matrix=null,cache=null,key=null){
 const path=localPoints||shape.pts;if(path.length<(cache?2:16))return shape;
 let data=cache?.get(key);if(!data){data=new Float64Array(path.length*2);
 for(let i=0;i<path.length;i++){data[i*2]=path[i][0];data[i*2+1]=path[i][1];}if(cache)cache.set(key,data);}
 if(shape.entityKey&&shape.hatch===undefined){
  // A shared prototype keeps hundreds of thousands of curve instances in
  // ordinary object layouts; a per-instance accessor forces dictionary mode.
  const packed={__proto__:pointPrototype,id:shape.id,entityId:shape.entityId,
   entityType:shape.entityType,entityMatrix:shape.entityMatrix,entityKey:shape.entityKey,
   deviceId:shape.deviceId,deviceMatrix:shape.deviceMatrix,layer:shape.layer,
   bounds:shape.bounds,text:shape.text,fill:shape.fill,height:shape.height,
   multiline:shape.multiline,textWidth:shape.textWidth,attachment:shape.attachment,
   angle:shape.angle,_pointData:data,_pointMatrix:matrix};
  if(shape.rgb!==undefined)packed.rgb=shape.rgb;else packed.color=shape.color;
  packed.lineweight=shape.lineweight;return packed;
 }
 shape._pointData=data;shape._pointMatrix=matrix;Object.defineProperty(shape,'pts',points);return shape;
}
