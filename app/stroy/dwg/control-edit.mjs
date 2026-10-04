import {num,spline,set,scene} from './cad.mjs?v=0.17.75';
export function entityControls(record,matrix=[1,0,0,1,0,0]){
 if(record?.type==='SPLINE')return splineControls(record,matrix);
 if(!['LINE','LWPOLYLINE'].includes(record?.type)||num(record,210)||num(record,220)||num(record,230,1)!==1)return [];
 const ys=record.pairs.filter(p=>p[0]===20);
 const points=record.type==='LINE'?[[num(record,10),num(record,20)],[num(record,11),num(record,21)]]:record.pairs.filter(p=>p[0]===10).map((p,i)=>[Number(p[1]),Number(ys[i]?.[1])]);
 const [a,b,c,d,e,f]=matrix;return points.map(([x,y],index)=>({id:record.id,index,matrix,vertex:true,point:[a*x+c*y+e,b*x+d*y+f]})).filter(h=>h.point.every(Number.isFinite));
}
export function setEntityVertex(record,index,x,y){
 if(!Number.isInteger(index)||index<0||![x,y].every(Number.isFinite))throw Error('Неверная точка');
 if(record.type==='LINE'&&index<2){set(record,10+index,x);set(record,20+index,y);return;}
 if(record.type!=='LWPOLYLINE')throw Error('Неподдерживаемая вершина');
 const xs=record.pairs.filter(p=>p[0]===10),ys=record.pairs.filter(p=>p[0]===20);if(!xs[index]||!ys[index])throw Error('Точка не найдена');xs[index][1]=x;ys[index][1]=y;
}
export function previewEntity(record,handle,point){
 if(!handle.vertex)return previewSpline(record,handle,point);
 const copy={...record,pairs:structuredClone(record.pairs)},[a,b,c,d,e,f]=handle.matrix,det=a*d-b*c;if(Math.abs(det)<1e-12)return [];
 setEntityVertex(copy,handle.index,(d*(point[0]-e)-c*(point[1]-f))/det,(-b*(point[0]-e)+a*(point[1]-f))/det);
 return (scene({entities:[copy],blocks:new Map(),layers:new Map()}).shapes[0]?.pts||[]).map(([x,y])=>[a*x+c*y+e,b*x+d*y+f]);
}
export function movableSpline(record){return record?.type==='SPLINE'&&!num(record,74)&&record.pairs.some(p=>p[0]===10);}
export function previewSpline(record,handle,point){
 const copy={...record,pairs:record.pairs.map(p=>[...p])},[a,b,c,d,e,f]=handle.matrix,det=a*d-b*c;
 if(Math.abs(det)<1e-12)return [];
 setSplineControl(copy,handle.index,(d*(point[0]-e)-c*(point[1]-f))/det,(-b*(point[0]-e)+a*(point[1]-f))/det);
 return (spline(copy)||[]).map(([x,y])=>[a*x+c*y+e,b*x+d*y+f]);
}
export function splineControls(record,matrix=[1,0,0,1,0,0]){
 if(!movableSpline(record))return [];
 const xs=record.pairs.filter(p=>p[0]===10),ys=record.pairs.filter(p=>p[0]===20);
 return xs.map((p,index)=>{const x=Number(p[1]),y=Number(ys[index]?.[1]),[a,b,c,d,e,f]=matrix;return {id:record.id,index,matrix,point:[a*x+c*y+e,b*x+d*y+f]};}).filter(h=>h.point.every(Number.isFinite));
}
export function setSplineControl(record,index,x,y){
 if(record?.type!=='SPLINE'||!Number.isInteger(index)||index<0||![x,y].every(Number.isFinite))throw Error('Неверная управляющая точка');
 const xs=record.pairs.filter(p=>p[0]===10),ys=record.pairs.filter(p=>p[0]===20);if(!xs[index]||!ys[index])throw Error('Точка не найдена');xs[index][1]=x;ys[index][1]=y;
}
