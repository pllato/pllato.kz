import {get,set} from './cad.mjs?v=0.17.63';
export function documentFontRecords(doc){return doc.records.filter(r=>r.type==='STYLE'&&!get(r,4));}
export function applyDocumentFont(doc,font,snapshot){
 if(!/^[^/\\\x00-\x1f]{1,116}\.(shx|ttf)$/i.test(font))throw Error('Выберите загруженный SHX или TTF');
 const records=documentFontRecords(doc);
 if(!records.length)throw Error('В документе нет доступных текстовых стилей');
 for(const r of records)if(!doc.textStyles.has(get(r,2))||(doc.native&&!/^[0-9a-f]+$/i.test(get(r,5))))throw Error('Стиль не поддерживает сохранение');
 snapshot(records);
 for(const sheet of doc.executiveProject?.sheets||[])sheet.font=font;
 for(const r of records){set(r,3,font);doc.textStyles.get(get(r,2)).font=font;if(doc.native)(doc.nativeOps||=[]).push({handle:get(r,5),styleFont:font});}
 return records.length;
}
