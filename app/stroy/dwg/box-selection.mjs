// Whole logical objects only. Never move just one visible fragment of a block.
export function boxedObjects(shapes,box,identity,hidden=new Set()){
 const groups=new Map(),instances=new Map();
 for(const shape of shapes){const target=identity(shape),key=JSON.stringify([target.id,shape.id,target.matrix||null]);let group=groups.get(key);
  if(!group){group={...target,key,shapes:[],bounds:[Infinity,Infinity,-Infinity,-Infinity],hidden:false};groups.set(key,group);instances.set(target.id,(instances.get(target.id)||0)+1);}
  group.shapes.push(shape);group.hidden||=hidden.has(shape.layer);const b=shape.bounds;group.bounds[0]=Math.min(group.bounds[0],b[0]);group.bounds[1]=Math.min(group.bounds[1],b[1]);group.bounds[2]=Math.max(group.bounds[2],b[2]);group.bounds[3]=Math.max(group.bounds[3],b[3]);
 }
 return [...groups.values()].filter(g=>!g.hidden&&g.bounds.every(Number.isFinite)&&g.bounds[0]>=box[0]&&g.bounds[1]>=box[1]&&g.bounds[2]<=box[2]&&g.bounds[3]<=box[3]).map(g=>({...g,shared:instances.get(g.id)>1}));
}
export function mountBoxSelection(api){
 let groups=[],gesture=null;const pointers=new Set();
 const bounds=()=>groups.reduce((b,g)=>[Math.min(b[0],g.bounds[0]),Math.min(b[1],g.bounds[1]),Math.max(b[2],g.bounds[2]),Math.max(b[3],g.bounds[3])],[Infinity,Infinity,-Infinity,-Infinity]);
 const reset=()=>{groups=[];gesture=null;pointers.clear();api.draw();};
 return {reset,active:()=>pointers.size>0,groups:()=>groups,
 down(id,p,button=0){if(!api.enabled())return false;if(button!==0)return true;pointers.add(id);if(pointers.size>1){gesture=null;api.draw();return true;}
  const w=api.world(p),b=bounds(),q=api.world([p[0]+8,p[1]+8]),pad=Math.max(Math.abs(q[0]-w[0]),Math.abs(q[1]-w[1]));gesture={id,start:p,end:p,origin:w,move:groups.length&&w[0]>=b[0]-pad&&w[0]<=b[2]+pad&&w[1]>=b[1]-pad&&w[1]<=b[3]+pad};return true;},
 move(id,p){if(!pointers.has(id))return false;if(gesture){gesture.end=p;api.draw();}return true;},
 up(id,p){if(!pointers.has(id))return false;pointers.delete(id);const g=gesture;gesture=null;if(!g||g.id!==id){api.draw();return true;}
  if(g.move){if(Math.hypot(p[0]-g.start[0],p[1]-g.start[1])>=4){const w=api.world(p),delta=w.map((v,i)=>v-g.origin[i]);try{api.commit(groups,delta);groups=[];}catch(e){api.status(e.message);}}}
  else if(Math.abs(p[0]-g.start[0])>=6&&Math.abs(p[1]-g.start[1])>=6){const a=api.world(g.start),b=api.world(p);groups=api.select([Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]);api.status(groups.length?'Выделено объектов: '+groups.length+'. Потяните внутри рамки, чтобы переместить. Escape — снять выбор.':'В рамку не попали целые объекты. Обведите их полностью.');}else groups=[];api.draw();return true;},
 paint(ctx){if(!api.enabled())return;ctx.save();ctx.strokeStyle='#ffbe6c';ctx.fillStyle='#ffbe6c18';ctx.lineWidth=1;ctx.setLineDash([5,4]);
  if(gesture&&!gesture.move){const a=gesture.start,b=gesture.end;ctx.fillRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);ctx.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);}
  if(groups.length){const delta=gesture?.move?gesture.end.map((v,i)=>v-gesture.start[i]):[0,0];ctx.translate(...delta);api.paint(ctx,groups.flatMap(g=>g.shapes));const b=bounds(),a=api.screen(b.slice(0,2)),z=api.screen(b.slice(2));ctx.strokeRect(a[0],a[1],z[0]-a[0],z[1]-a[1]);}ctx.restore();}
 };
}
