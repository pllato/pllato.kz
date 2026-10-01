import {cableChain} from './cable-chain.mjs?v=0.17.54';
import {pathLength} from './selection-metrics.mjs?v=0.17.54';
import {midpoint} from './length-overlay.mjs?v=0.17.54';
// Classification is for a read-only overlay, never changes cable assignments.
export function cableLayer(name){
 if(/текст|вынос|размер|штамп|марки|лотк|оборуд|зазем|молни|гребен|отверст/i.test(name))return false;
 // Electrical circuit layers often contain both device INSERTs and the wires
 // connecting them (e.g. ЭЛ-розетки). Device geometry is excluded separately.
 if(/^(?:ЭОМ|ЭОА|ЭЛ|ЭО)(?:$|[-_ .])/i.test(name))return true;
 if(/розет|щит/i.test(name))return false;
 return /кабел|провод|cable|wiring|wire/i.test(name);
}
const style=s=>JSON.stringify([s.layer,s.color,s.rgb]);
const eligible=s=>s.text===null&&!s.fill&&!s.hatch&&['LINE','ARC','LWPOLYLINE','POLYLINE','SPLINE'].includes(s.entityType)&&s.pts.length>1;
export function* sourceCableLengths(shapes,{routes=[],devices=new Set(),hidden=new Set(),cooperative=false}={}){
 const assigned=new Set(routes.flatMap(r=>r.sourceIds||[])),known=new Set(),groups=new Map();
 let visited=0;
 if(assigned.size)for(const s of shapes){if(cooperative&&++visited%1024===0)yield null;if(assigned.has(s.entityId||s.id)&&eligible(s))known.add(style(s));}
 for(const s of shapes){
  if(cooperative&&++visited%1024===0)yield null;
  if(!eligible(s)||hidden.has(s.layer)||devices.has(s.deviceId)||assigned.has(s.entityId||s.id)||s.id.startsWith('executive-'))continue;
  if(!cableLayer(s.layer)&&!known.has(style(s))&&!s.id.startsWith('new-'))continue;
  const key=JSON.stringify([style(s),s.deviceId?[s.id,s.deviceId,...(s.entityMatrix||[])]:null]);
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);
 }
 for(const group of groups.values()){
  const seen=new Set();for(const seed of group){if(seen.has(seed))continue;const chain=cableChain(group,seed),paths=chain.paths||chain.map(s=>s.pts);
   for(const s of [...chain,...chain.coincident||[]])seen.add(s);
   const length=pathLength(paths),point=midpoint(paths);if(length>0&&point)yield {point,length,layer:seed.layer,root:seed.id,ids:chain.map(s=>s.entityId||s.id)};
  }
 }
}
