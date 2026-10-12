// Conservative retained-scene estimate, cached for immutable display scenes.
// This is a history budget, not a measurement of the browser's entire heap.
const sceneCosts=new WeakMap();
function sceneBytes(drawing){
 if(!drawing||typeof drawing!=='object')return 0;
 if(sceneCosts.has(drawing))return sceneCosts.get(drawing);
 let bytes=0;for(const shape of drawing.shapes||[])bytes+=320+(shape?.pts?.length||0)*32;
 sceneCosts.set(drawing,bytes);return bytes;
}
function stateBytes(state){
 if(!state)return 0;
 return 8*((state.records?.length||0)+(state.entities?.length||0)+(state.blocks?.length||0)*2)+
  (state.patches||[]).reduce((sum,[,pairs])=>sum+64+(pairs?.length||0)*48,0);
}
// Count shared File/Blob snapshots once; patch-only undo entries share their file.
// Always retain the latest operation, even when that single file exceeds budget.
export function boundedUndo(entries,{bytes=96*1024*1024,count=15}={}){
 const kept=[],files=new Set(),scenes=new Set();let used=0;
 for(let i=entries.length-1;i>=0;i--){
  const entry=entries[i],file=entry?.file||entry?.sourceFile;
  const drawing=entry?.viewState?.drawing;
  const extra=(file&&!files.has(file)?Math.max(0,Number(file.size)||0):0)+stateBytes(entry?.viewState)+(drawing&&!scenes.has(drawing)?sceneBytes(drawing):0);
  if(kept.length&&(kept.length>=count||(extra>0&&used+extra>bytes)))break;
  kept.push(entry);used+=extra;if(file)files.add(file);if(drawing)scenes.add(drawing);
 }
 return kept.reverse();
}
