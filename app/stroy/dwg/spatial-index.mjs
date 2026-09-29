// Broad-phase only: exact CAD hit-testing still runs on returned candidates.
// Wide objects live once in overflow, avoiding unbounded cell duplication.
const indexes=new WeakMap();
export function spatialIndex(shapes){
 if(indexes.has(shapes))return indexes.get(shapes);
 const bounds=[Infinity,Infinity,-Infinity,-Infinity];for(const s of shapes){const b=s.bounds;bounds[0]=Math.min(bounds[0],b[0]);bounds[1]=Math.min(bounds[1],b[1]);bounds[2]=Math.max(bounds[2],b[2]);bounds[3]=Math.max(bounds[3],b[3]);}
 const n=Math.max(1,Math.min(256,Math.ceil(Math.sqrt(shapes.length/24)))),sx=(bounds[2]-bounds[0])/n||1,sy=(bounds[3]-bounds[1])/n||1,cells=new Map(),wide=[];
 const range=b=>[Math.max(0,Math.min(n-1,Math.floor((b[0]-bounds[0])/sx))),Math.max(0,Math.min(n-1,Math.floor((b[1]-bounds[1])/sy))),Math.max(0,Math.min(n-1,Math.floor((b[2]-bounds[0])/sx))),Math.max(0,Math.min(n-1,Math.floor((b[3]-bounds[1])/sy)))];
 for(let i=0;i<shapes.length;i++){const [x,y,X,Y]=range(shapes[i].bounds);if((X-x+1)*(Y-y+1)>16){wide.push(i);continue;}for(let a=x;a<=X;a++)for(let b=y;b<=Y;b++){const key=a*n+b,items=cells.get(key);if(items)items.push(i);else cells.set(key,[i]);}}
 const index={query(b){if(!shapes.length)return [];const [x,y,X,Y]=range(b),found=new Set(wide);for(let a=x;a<=X;a++)for(let c=y;c<=Y;c++)for(const i of cells.get(a*n+c)||[])found.add(i);return [...found].sort((a,b)=>a-b).filter(i=>{const q=shapes[i].bounds;return q[0]<=b[2]&&q[2]>=b[0]&&q[1]<=b[3]&&q[3]>=b[1];}).map(i=>shapes[i]);}};
 indexes.set(shapes,index);return index;
}
