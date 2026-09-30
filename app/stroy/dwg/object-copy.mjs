import {get,num} from './cad.mjs?v=0.17.49';
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export function copyTransform(doc,sheet,parentMatrix,centre,position){
 const r=doc.entities.find(r=>get(r,5)===sheet.nativeHandles[0]),block=r&&doc.blocks.get(get(r,2));if(!block)throw Error('Не найдена CAD-группа исполнительной');
 const a=num(r,50)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),sx=num(r,41,1),sy=num(r,42,1),m=[c*sx,s*sx,-s*sy,c*sy,num(r,10),num(r,20)];m[4]-=m[0]*block.base[0]+m[2]*block.base[1];m[5]-=m[1]*block.base[0]+m[3]*block.base[1];
 const det=m[0]*m[3]-m[1]*m[2];if(Math.abs(det)<1e-12)throw Error('Вырожденный масштаб листа');
 const inv=[m[3]/det,-m[1]/det,-m[2]/det,m[0]/det,(m[2]*m[5]-m[3]*m[4])/det,(m[1]*m[4]-m[0]*m[5])/det],world=[...parentMatrix];world[4]+=position[0]-centre[0];world[5]+=position[1]-centre[1];
 const local=mul(inv,world),scaleX=Math.hypot(local[0],local[1]),scaleY=(local[0]*local[3]-local[1]*local[2])/scaleX;
 if(!local.every(Number.isFinite)||scaleX<1e-12||Math.abs(scaleY)<1e-12||Math.abs(local[0]*local[2]+local[1]*local[3])>1e-8*scaleX*Math.abs(scaleY))throw Error('Копирование с перекосом пока не поддерживается');
 return [local[4],local[5],Math.atan2(local[1],local[0]),scaleX,scaleY];
}
