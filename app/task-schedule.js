export function scheduleValue(date,time=''){
 if(!date)return null;
 const ms=Date.parse(date+'T'+(time||'00:00')+':00+05:00');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(ms)||new Date(ms+5*3600000).toISOString().slice(0,10)!==date||(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))throw Error('Укажите корректные дату и время');
 return ms;
}
export function taskScheduleLabel(task){
 if(!task.dueDate)return '';
 const ms=scheduleValue(task.dueDate,task.dueTime);if(ms===null)return '';
 return new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Almaty',day:'2-digit',month:'2-digit',...(task.dueDate.slice(0,4)!==String(new Date().getFullYear())?{year:'numeric'}:{})}).format(ms)+(task.dueTime?' · '+task.dueTime:'');
}
export function compareTaskSchedule(a,b){return (a.dueDate?scheduleValue(a.dueDate,a.dueTime):Infinity)-(b.dueDate?scheduleValue(b.dueDate,b.dueTime):Infinity)||Number(a.createdAt||0)-Number(b.createdAt||0);}
