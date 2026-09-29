// Structural sharing: unchanged CAD records and display primitives are reused.
// Callers list every original record they will mutate before doing so.
export function captureView(doc,drawing,records=[]){
 return {doc,drawing,layers:structuredClone(doc.layers),records:[...doc.records],entities:[...doc.entities],blocks:[...doc.blocks.values()].map(b=>[b,b.records]),patches:records.map(r=>[r,structuredClone(r.pairs)]),ops:structuredClone(doc.nativeOps||[]),project:structuredClone(doc.executiveProject||null)};
}
export function restoreView(state){
 const doc=state.doc;doc.records=state.records;doc.entities=state.entities;doc.layers=structuredClone(state.layers);
 for(const [block,records] of state.blocks)block.records=records;
 for(const [record,pairs] of state.patches)record.pairs=structuredClone(pairs);
 doc.nativeOps=structuredClone(state.ops);doc.executiveProject=structuredClone(state.project);
 return state.drawing;
}
