// Structural sharing: unchanged CAD records and display primitives are reused.
// Callers list every original record they will mutate before doing so.
// After a native transaction those scenes can never take the fast undo path:
// restoration uses file + recovery. Do not retain entire obsolete DWG graphs.
export function releaseObsoleteViews(entries,currentDoc){
 return entries.map(entry=>entry.viewState&&entry.viewState.doc!==currentDoc&&entry.recovery&&entry.file
  ?{file:entry.file,name:entry.name,recovery:entry.recovery}:entry);
}
export function captureView(doc,drawing,records=[]){
 return {doc,drawing,textStyles:structuredClone(doc.textStyles),layers:structuredClone(doc.layers),records:[...doc.records],entities:[...doc.entities],blockMap:new Map(doc.blocks),blocks:[...doc.blocks.values()].map(b=>[b,b.records]),patches:records.map(r=>[r,structuredClone(r.pairs)]),ops:structuredClone(doc.nativeOps||[]),project:structuredClone(doc.executiveProject||null)};
}
export function restoreView(state){
 const doc=state.doc;doc.records=state.records;doc.entities=state.entities;doc.layers=structuredClone(state.layers);doc.textStyles=structuredClone(state.textStyles);
 if(state.blockMap)doc.blocks=new Map(state.blockMap);
 for(const [block,records] of state.blocks)block.records=records;
 for(const [record,pairs] of state.patches)record.pairs=structuredClone(pairs);
 doc.nativeOps=structuredClone(state.ops);doc.executiveProject=structuredClone(state.project);
 return state.drawing;
}
