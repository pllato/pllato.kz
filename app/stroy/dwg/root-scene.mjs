import {scene,get} from './cad.mjs?v=0.17.58';
// Re-expand only independently edited model-space INSERTs and their attributes.
// Preserve painter order and every unaffected shape (including cleaned labels).
export function updatedRootScene(doc,drawing,targets){
 const requested=new Set(targets.map(t=>t.id)),roots=new Set();
 for(const s of drawing.shapes)if(requested.has(s.id)||requested.has(s.deviceId)||requested.has(s.entityId))roots.add(s.id);
 const records=doc.entities.filter(r=>roots.has(r.id));
 if(!roots.size)return null;
 if(drawing.limited||records.length!==roots.size||records.some(r=>!['INSERT','TEXT','MTEXT','ATTRIB','ATTDEF','MULTILEADER'].includes(r.type)))return null;
 const handles=new Set(records.map(r=>get(r,5)));
 for(const r of doc.entities)if(r.type==='ATTRIB'&&handles.has(get(r,330))){records.push(r);roots.add(r.id);}
 // A transform does not change entity types. Keep the document's existing
 // unsupported report; unrelated unsupported content must not force a full
 // rebuild of every sheet. A traversal limit still requires the safe path.
 const generated=scene({...doc,entities:records});if(generated.limited)return null;
 const groups=new Map();for(const s of generated.shapes){if(!groups.has(s.id))groups.set(s.id,[]);groups.get(s.id).push(s);}
 const seen=new Set(),shapes=[];
 for(const s of drawing.shapes){if(!roots.has(s.id)){shapes.push(s);continue;}if(!seen.has(s.id)){shapes.push(...groups.get(s.id)||[]);seen.add(s.id);}}
 return {...drawing,shapes};
}
