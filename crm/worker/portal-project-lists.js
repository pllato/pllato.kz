export function paidProjectIds(finance){
 return Object.entries(finance?.money||{}).filter(([,item])=>(item?.pays||[]).some(p=>Number(p?.sum)>0)).map(([id])=>id);
}
export function developmentChange(body){
 if(!body||typeof body.projectId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(body.projectId)||typeof body.enabled!=='boolean')return null;
 return {id:'development_'+body.projectId,projectId:body.projectId,enabled:body.enabled};
}
