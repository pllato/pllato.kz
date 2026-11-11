import '../app/hr/core.js';
import '../app/hr/data/cognitive.js';
import '../app/hr/data/abstract.js';
export function assessSubmission(b){
 const parts=String(b.code||'').split('.');
 if(parts.length!==3||parts[0]!=='HR1'||b.code.length>20000)throw new Error('Некорректный код результата');
 const raw=new TextDecoder().decode(Uint8Array.from(atob(parts[2]),x=>x.charCodeAt(0)));
 let hash=5381;for(let i=0;i<raw.length;i++)hash=((hash<<5)+hash+raw.charCodeAt(i))>>>0;
 if(hash.toString(36)!==parts[1])throw new Error('Повреждённый код результата');
 const d=JSON.parse(raw);
 if(!['manager','itr','sales','worker'].includes(d.fam)||d.fam!==b.fam||!d.ans)throw new Error('Некорректная анкета');
 const stage=['personality','iq'].includes(d.stage)?d.stage:b.stage==='personality'?'personality':b.stage==='iq'?'iq':'full';
 if(stage!=='iq')return {stage,status:'review',fit:null};
 const form=['A','B','C'].includes(d.cform)?d.cform:'A';
 const bank=[...globalThis.HR_COGNITIVE.items,...globalThis.HR_ABSTRACT.items.map(x=>({...x,section:'A'}))].filter(x=>x.form===form);
 const rows=d.ans.cognitive;
 if(!Array.isArray(rows)||rows.length!==bank.length||new Set(rows.map(x=>x.id)).size!==bank.length)throw new Error('Неполный набор заданий IQ');
 const byId=new Map(rows.map(x=>[x.id,x]));
 const answers=bank.map(it=>{const row=byId.get(it.id);if(!row||(row.a!==null&&(!Number.isInteger(row.a)||row.a<0||row.a>=it.options.length)))throw new Error('Некорректный ответ IQ');return row.a});
 const fit=globalThis.HR.scoreCognitive(bank,answers).composite.score;
 return {stage,status:fit>=60?'passed':'failed',fit};
}
