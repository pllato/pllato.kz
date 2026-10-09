import {get} from './cad.mjs?v=0.17.90';
// Rendering references original CAD records. It does not replace/export CAD
// geometry; the native writer materializes and validates it on DWG download.
const installed=new WeakMap();
export function previewRecords(doc,project){
 for(const name of installed.get(doc)||[])doc.blocks.delete(name);
 const names=[],result=[],roots=new Map(doc.entities.filter(r=>!r.id.startsWith('executive-')).map(r=>[get(r,5),r]));
 for(const sheet of project.sheets){
  if(!sheet.sourcePlan)continue;
  const {handles,centre}=sheet.sourcePlan,selected=new Set(handles),records=[];
  for(let i=0;i<doc.entities.length;i++){
   const r=doc.entities[i];if(!selected.has(get(r,5)))continue;
   records.push(r);
   if(r.type==='POLYLINE'){while(['VERTEX','SEQEND'].includes(doc.entities[i+1]?.type)){const part=doc.entities[++i];records.push(part);if(part.type==='SEQEND')break;}}
  }
  if(handles.some(h=>!roots.has(h)))throw Error('Исходные объекты исполнительной не найдены. Восстановите предыдущую версию.');
  for(const r of doc.records)if(r.type==='ATTRIB'&&selected.has(get(r,330)))records.push(r);
  const name='_PLLATO_PREVIEW_'+sheet.id;if(doc.blocks.has(name))throw Error('Конфликт имени предварительного плана');
  doc.blocks.set(name,{base:[...centre],records,flags:0});names.push(name);
  const pairs=[[2,name],[10,sheet.planCentre[0]],[20,sheet.planCentre[1]],[41,1],[42,1],[50,sheet.angle*180/Math.PI],[62,256]];
  result.push({id:'executive-preview-'+sheet.id,type:'INSERT',pairs,executivePreview:true});
 }
 installed.set(doc,names);return result;
}
export function deferPlan(project,request){
 const sheet=project.sheets.find(s=>s.id===request.sheetId);
 if(!sheet||sheet.nativeHandles.length||sheet.sourcePlan)throw Error('Неверный новый лист');
 if(!Array.isArray(request.handles)||!request.handles.length||request.handles.length>20000||request.handles.some(h=>!/^[0-9a-f]{1,16}$/i.test(h))||new Set(request.handles).size!==request.handles.length||![request.centre,request.position].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))throw Error('Неверная выбранная область');
 sheet.sourcePlan={handles:[...request.handles],centre:[...request.centre]};
 sheet.planCentre=[...request.position];return sheet;
}
