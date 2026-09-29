import {cableChain} from './cable-chain.mjs?v=0.17.16';
export function shapePaths(shapes){return shapes.filter(s=>s.text===null&&!s.hatch&&!s.fill&&s.pts.length>1).map(s=>s.pts.map(p=>[...p]));}
export function pathLength(paths){return paths.reduce((total,points)=>total+points.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0),0);}
export function syncLinkedRoutes(project,shapes){
 const routes=project?.sheets.flatMap(s=>s.routes).filter(r=>r.sourceIds)||[];if(!routes.length)return false;
 const ids=new Set(routes.flatMap(r=>r.sourceIds)),byId=new Map();for(const s of shapes)if(ids.has(s.entityId||s.id)){const id=s.entityId||s.id;if(!byId.has(id))byId.set(id,[]);byId.get(id).push(s);}
 for(const r of routes){const shapes=r.sourceIds.flatMap(id=>byId.get(id)||[]),paths=[],seen=new Set();for(const s of shapes){if(seen.has(s))continue;const chain=cableChain(shapes,s);if(chain.length){paths.push(...(chain.paths||shapePaths(chain)));for(const part of [...chain,...chain.coincident||[]])seen.add(part);}else{paths.push(...shapePaths([s]));seen.add(s);}}if(!paths.length)throw Error('Не найдена геометрия назначенного кабеля. Сначала снимите назначение в списке трасс.');r.paths=paths;r.points=paths[0];}return true;
}
