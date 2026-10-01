import {paintShapes} from './renderer.mjs?v=0.17.60';
import {spatialIndex} from './spatial-index.mjs?v=0.17.60';
// Screen cache only: redraw the entire painter stack in a small damaged area.
// Never erase the selected line alone: crossing strokes/hatches must reappear.
export function repaintDamage(ctx,shapes,damage,options){
 if(!damage.length||damage.length>5000)return false;
 const {view,width,height}=options,b=[Infinity,Infinity,-Infinity,-Infinity];
 for(const s of damage)for(let i=0;i<4;i++)b[i]=i<2?Math.min(b[i],s.bounds[i]):Math.max(b[i],s.bounds[i]);
 const x=Math.max(0,Math.floor(b[0]*view.s+view.x-32)),y=Math.max(0,Math.floor(view.y-b[3]*view.s-32)),X=Math.min(width,Math.ceil(b[2]*view.s+view.x+32)),Y=Math.min(height,Math.ceil(view.y-b[1]*view.s+32));
 if(X<=x||Y<=y)return true;
 if((X-x)*(Y-y)>width*height*.45)return false;
 const query=[(x-view.x)/view.s,(view.y-Y)/view.s,(X-view.x)/view.s,(view.y-y)/view.s];
 ctx.save();ctx.beginPath();ctx.rect(x,y,X-x,Y-y);ctx.clip();ctx.clearRect(x,y,X-x,Y-y);
 paintShapes(ctx,spatialIndex(shapes).query(query),{...options,selected:null});ctx.restore();return true;
}
