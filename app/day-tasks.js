// Срок дела важнее недели, в которой оно находится. Исходный массив не меняем.
export function tasksForDay(tasks,date){
 return (Array.isArray(tasks)?tasks:[]).filter(task=>task.dueDate===date&&!task.deleted&&!task.__deleted&&!task.movedToTaskId&&!Number(task.movedToStart))
  .slice().sort((a,b)=>String(a.dueTime||'').localeCompare(String(b.dueTime||''))||Number(a.createdAt||0)-Number(b.createdAt||0));
}
