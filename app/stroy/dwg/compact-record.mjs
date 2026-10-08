// SPDX-License-Identifier: GPL-3.0-or-later
// Lossless geometry storage. Pair arrays are allocated only for an edited
// record; ordinary rendering uses short-lived decoded pairs and a scratch index.
class CompactRecord{
 constructor(type,id,encoded){this.type=type;this.id=id;this._encoded=encoded;}
 get pairs(){if(!this._pairs){this._pairs=JSON.parse(this._encoded);this._encoded=undefined;}return this._pairs;}
 set pairs(value){this._pairs=value;this._encoded=undefined;}
}
export function compactRecord(type,id,encoded,extra={}){return Object.assign(new CompactRecord(type,id,encoded),extra);}
export function restoreCompactRecord(record){
 if(record._encoded!==undefined&&!Object.hasOwn(record,'pairs'))Object.setPrototypeOf(record,CompactRecord.prototype);
 if(record.parts)for(const part of record.parts)restoreCompactRecord(part);return record;
}
export function pairsOf(record){return Object.hasOwn(record,'pairs')?record.pairs:record._encoded!==undefined?JSON.parse(record._encoded):record._pairs||record.pairs;}
export function cloneRecord(record){return {...record,_encoded:undefined,_pairs:undefined,pairs:structuredClone(pairsOf(record))};}
