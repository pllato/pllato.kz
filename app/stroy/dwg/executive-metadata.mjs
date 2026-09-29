import {createExecutiveProject,createExecutive,addRoute,addLeader} from './executive-project.mjs?v=0.17.20';
const handles=a=>{if(!Array.isArray(a)||a.length>100000||a.some(h=>typeof h!=='string'||!/^[0-9a-f]{1,16}$/i.test(h)))throw Error('Повреждены ссылки исполнительной');return [...a];};
export function validateExecutiveProject(value){
 if(!value||value.version!==1||!Array.isArray(value.sheets)||value.sheets.length>100)throw Error('Неподдерживаемые данные исполнительных');
 const p=createExecutiveProject();p.generatedHandles=handles(value.generatedHandles||[]);
 for(const input of value.sheets){
  const s=createExecutive(p,{...input,nativeHandles:handles(input.nativeHandles)});
  if(typeof input.title!=='string'||input.title.length>1000||!Number.isFinite(input.angle))throw Error('Повреждены параметры листа');
  s.angle=input.angle;
  for(const key of ['project','object','drawing','contractor','date','sheet','sheets']){const text=input.stamp?.[key];if(text!==undefined){if(typeof text!=='string'||text.length>1000)throw Error('Повреждён штамп');s.stamp[key]=text;}}
  if(!Array.isArray(input.routes)||input.routes.length>10000)throw Error('Слишком много трасс');
  for(const r of input.routes){
   if(!Array.isArray(r.points)||r.points.length>10000||!Array.isArray(r.leaders)||r.leaders.length>1000)throw Error('Повреждена трасса');
   addRoute(p,s.id,r);for(const l of r.leaders)addLeader(p,s.id,r.id,l);
  }
 }
 return p;
}
export function readExecutiveMetadata(db){
 const dictionaries=db.objects?.DICTIONARY||[],root=dictionaries.find(d=>d.entries?.PLLATO_EXECUTIVE_V1);
 if(!root)return null;
 const dictionary=dictionaries.find(d=>d.handle===root.entries.PLLATO_EXECUTIVE_V1);
 const record=db.objects?.XRECORD?.find(x=>x.handle===dictionary?.entries?.PROJECT);
 if(!record)throw Error('Не прочитаны данные исполнительных; сохранение отменено');
 let length=0;const parts=[];
 for(const item of record.data){if(item.code!==310||!(item.value instanceof Uint8Array)||item.value.length>127)throw Error('Повреждены данные исполнительных');length+=item.value.length;if(length>4*1024*1024)throw Error('Слишком большой проект исполнительных');parts.push(item.value);}
 const bytes=new Uint8Array(length);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
 return validateExecutiveProject(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
}
