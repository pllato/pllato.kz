import {move} from './cad.mjs?v=0.17.36';
// New model-space lines are already fully represented by editable CAD records.
// Do not apply this path to imported DWG records or nested block geometry.
export function prepareNewCopies(records,delta){
 if(!records.length||delta.length!==2||!delta.every(Number.isFinite))throw Error('Неверный сдвиг копии');
 return records.map(record=>{
  if(!record.id.startsWith('new-')||!['LINE','LWPOLYLINE'].includes(record.type))throw Error('Быстрое копирование этого объекта не поддерживается');
  const copy={type:record.type,pairs:structuredClone(record.pairs)};
  move(copy,...delta);
  copy.pairs=copy.pairs.filter(([code])=>![0,5,100,330].includes(code));
  return copy;
 });
}
