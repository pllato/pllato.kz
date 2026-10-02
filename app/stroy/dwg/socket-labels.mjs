import {get,set} from './cad.mjs?v=0.17.67';
// Only N1 labels inside leaf symbol definitions (or their attached attributes).
// Standalone text, circuit labels such as N12, and plan/container blocks stay intact.
export function socketLabels(doc){
 const blocks=new Set(),records=new Set();
 for(const [name,b]of doc.blocks){if(b.records.some(r=>r.type==='INSERT')||!b.records.some(r=>r.type==='CIRCLE'||r.type==='ARC'))continue;
  const labels=b.records.filter(r=>['TEXT','ATTDEF'].includes(r.type)&&get(r,1).trim()==='N1');if(labels.length){blocks.add(name);for(const r of labels)records.add(r);}}
 const parents=new Set(doc.records.filter(r=>r.type==='INSERT'&&blocks.has(get(r,2))).map(r=>get(r,5)));
 for(const r of doc.records)if(r.type==='ATTRIB'&&parents.has(get(r,330))&&get(r,1).trim()==='N1')records.add(r);
 return [...records];
}
export function clearSocketLabels(doc,records=socketLabels(doc)){for(const r of records){set(r,1,'');if(doc.native)doc.nativeOps.push({handle:get(r,5),dx:0,dy:0,text:''});}return records.length;}
