export const TASK_COMMENTS_COLLECTION='_chart_task_comments_private';
export function sharedTaskEditable(task,allowed){return Boolean(task&&!task.deleted&&!task.__deleted&&allowed);}
export async function handleTaskDiscussion(request,env,actor,taskId,deps){
 const {getTask,canAccess,db,teamId,HttpError}=deps;
 const task=await getTask(taskId);
 if(!task||task.deleted||task.__deleted)throw new HttpError(404,'Дело не найдено');
 if(!await canAccess(task))throw new HttpError(403,'Нет доступа к этому делу');
 const prefix=encodeURIComponent(task.discussionId||taskId)+':';
 if(request.method==='GET'){
  const before=new URL(request.url).searchParams.get('before');
  if(before&&!before.startsWith(prefix))throw new HttpError(400,'Некорректный курсор');
  const {results}=await db.prepare('SELECT id,data FROM store WHERE team_id=? AND collection=? AND id>=? AND id<? ORDER BY id DESC LIMIT 51')
   .bind(teamId,TASK_COMMENTS_COLLECTION,prefix,before||prefix+'~').all();
  const rows=(results||[]).slice(0,50);
  return {ok:true,items:rows.map(r=>JSON.parse(r.data)).reverse(),nextCursor:(results||[]).length>50?rows.at(-1).id:null};
 }
 if(request.method!=='POST')throw new HttpError(405,'Метод не поддерживается');
 let body;try{body=await request.json();}catch{throw new HttpError(400,'Некорректный запрос');}
 const text=String(body?.text||'').trim();
 if(!text||text.length>4000)throw new HttpError(400,'Напишите комментарий до 4000 символов');
 const mentions=Array.isArray(body.mentions)?[...new Set(body.mentions.filter(x=>typeof x==='string').map(x=>x.trim().toLowerCase()))]:[];
 if(mentions.length>10)throw new HttpError(400,'Можно упомянуть до 10 сотрудников');
 const now=Date.now();
 const item={id:prefix+String(now).padStart(13,'0')+':'+crypto.randomUUID(),taskId,text,mentions,author:String(actor.email||''),authorName:String(actor.user?.name||actor.email||''),createdAt:now};
 await db.prepare('INSERT INTO store(team_id,collection,id,data,created_at,updated_at) VALUES(?,?,?,?,?,?)')
  .bind(teamId,TASK_COMMENTS_COLLECTION,item.id,JSON.stringify(item),now,now).run();
 if(deps.notify)await deps.notify(task,item);
 return {ok:true,item};
}

// Один ограниченный запрос вместо загрузки переписки для каждой строки списка.
export async function handleTaskDiscussionSummaries(request,actor,deps){
 const {getTasks,canAccess,db,teamId,HttpError}=deps;
 if(request.method!=='POST')throw new HttpError(405,'Метод не поддерживается');
 let body;try{body=await request.json();}catch{throw new HttpError(400,'Некорректный запрос');}
 if(!Array.isArray(body?.ids)||body.ids.length>40||body.ids.some(id=>typeof id!=='string'||!id||id.length>500))throw new HttpError(400,'Укажите до 40 дел');
 const ids=[...new Set(body.ids)];if(!ids.length)return {ok:true,items:[]};
 const allowed=[];
 for(const task of await getTasks(ids))if(ids.includes(task.id)&&sharedTaskEditable(task,await canAccess(task)))allowed.push(task);
 if(!allowed.length)return {ok:true,items:[]};
 const values=allowed.map(()=>'(?,?)').join(',');
 const args=allowed.flatMap(task=>[task.id,encodeURIComponent(task.discussionId||task.id)+':']);
 const {results}=await db.prepare(`WITH threads(task_id,prefix) AS (VALUES ${values}) SELECT task_id,(SELECT data FROM store WHERE team_id=? AND collection=? AND id>=threads.prefix AND id<threads.prefix||'~' ORDER BY id DESC LIMIT 1) AS data FROM threads`)
  .bind(...args,teamId,TASK_COMMENTS_COLLECTION).all();
 return {ok:true,items:(results||[]).map(row=>{
  const c=row.data?JSON.parse(row.data):null;
  return {taskId:row.task_id,latest:c?{id:c.id,text:String(c.text||'').slice(0,240),author:c.author,authorName:c.authorName,createdAt:c.createdAt}:null};
 })};
}
