import {num,spline} from './cad.mjs?v=0.17.6';
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
