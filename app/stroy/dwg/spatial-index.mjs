// Broad-phase only: exact CAD hit-testing still runs on returned candidates.
// Wide objects live once in overflow, avoiding unbounded cell duplication.
const indexes=new WeakMap();
// Filter-only edits retain painter order; generated decorations are appended.
// Reuse the immutable broad phase instead of re-bucketing a million primitives.
export function deriveSpatialIndex(previous,next,removed,added=[]){
 const base=indexes.get(previous);if(!base||(base.depth||0)>=8)return;
 const intersects=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
 const index={depth:(base.depth||0)+1,query(b){return base.query(b).filter(s=>!removed.has(s)).concat(added.filter(s=>intersects(s.bounds,b)));},viewport(b){const candidates=base.viewport(b);return candidates===previous?next:candidates.filter(s=>!removed.has(s)).concat(added.filter(s=>intersects(s.bounds,b)));}};
 indexes.set(next,index);
}
export function spatialIndex(shapes){
 if(indexes.has(shapes))return indexes.get(shapes);
 const bounds=[Infinity,Infinity,-Infinity,-Infinity];for(const s of shapes){const b=s.bounds;bounds[0]=Math.min(bounds[0],b[0]);bounds[1]=Math.min(bounds[1],b[1]);bounds[2]=Math.max(bounds[2],b[2]);bounds[3]=Math.max(bounds[3],b[3]);}
 const n=Math.max(1,Math.min(256,Math.ceil(Math.sqrt(shapes.length/24)))),sx=(bounds[2]-bounds[0])/n||1,sy=(bounds[3]-bounds[1])/n||1,cells=new Map(),wide=[];
 const range=b=>[Math.max(0,Math.min(n-1,Math.floor((b[0]-bounds[0])/sx))),Math.max(0,Math.min(n-1,Math.floor((b[1]-bounds[1])/sy))),Math.max(0,Math.min(n-1,Math.floor((b[2]-bounds[0])/sx))),Math.max(0,Math.min(n-1,Math.floor((b[3]-bounds[1])/sy)))];
 for(let i=0;i<shapes.length;i++){const [x,y,X,Y]=range(shapes[i].bounds);if((X-x+1)*(Y-y+1)>16){wide.push(i);continue;}for(let a=x;a<=X;a++)for(let b=y;b<=Y;b++){const key=a*n+b,items=cells.get(key);if(items)items.push(i);else cells.set(key,[i]);}}
 const intersects=(q,b)=>q[0]<=b[2]&&q[2]>=b[0]&&q[1]<=b[3]&&q[3]>=b[1];
 const index={viewport(b){const [x,y,X,Y]=range(b);return (X-x+1)*(Y-y+1)>n*n/4?shapes:this.query(b);},query(b){if(!shapes.length)return [];if(!intersects(bounds,b))return [];const [x,y,X,Y]=range(b);
 // Overview queries should not allocate/sort a Set containing the entire file.
 if((X-x+1)*(Y-y+1)>n*n/4)return shapes.filter(s=>intersects(s.bounds,b));
 const found=new Set(wide);for(let a=x;a<=X;a++)for(let c=y;c<=Y;c++)for(const i of cells.get(a*n+c)||[])found.add(i);return [...found].sort((a,b)=>a-b).filter(i=>intersects(shapes[i].bounds,b)).map(i=>shapes[i]);}};
 indexes.set(shapes,index);return index;
}
// Same 20 CSS-pixel margin as the renderer, including text/hatch bounds.
export function viewportShapes(shapes,view,width,height){
 return spatialIndex(shapes).viewport([(-20-view.x)/view.s,(view.y-height-20)/view.s,(width+20-view.x)/view.s,(view.y+20)/view.s]);
}
