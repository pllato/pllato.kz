export const CALLBACK_PIPELINE='pipeline_r22lrm';
export const CALLBACK_MARK='callback_call';
export function callbackEvents(items,userLabel){
 return items.filter(t=>t.mark===CALLBACK_MARK&&Number.isFinite(Date.parse(t.startDatePlan))).map(t=>({
  type:'callback',mark:CALLBACK_MARK,kindLabel:'Звонок-перезвон',date:new Date(t.startDatePlan),endDate:new Date(t.endDatePlan),
  title:'☎ '+t.title,rawTitle:t.title,dealTitle:t.dealTitle,dealRecordId:t.dealRecordId,
  taskId:t.id,bitrixId:t.bitrixId,source:'task',subtype:'meeting',uid:'task:'+t.id,isMeeting:true,
  scheduledByUid:t.createdByUid,scheduledByName:userLabel(t.createdByUid),createdByUid:t.createdByUid,
  responsibleUid:t.responsibleUid,accomplices:t.accomplices||[],eventPublic:!!t.eventPublic,
 }));
}
