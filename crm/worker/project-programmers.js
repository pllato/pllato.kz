import {PAYOUT_COLLECTION} from './project-payouts.js';
export async function handleProjectProgrammers(request, env, actor, {put,list,HttpError}) {
  const canManage = Boolean(actor.isRoot || actor.user?.isSuperAdmin || actor.user?.isAdmin);
  if(request.method==='GET') return {canManage,programmers:Object.fromEntries((await list(env,'programmer')).map(row=>[row.projectId,row.programmerEmail||'']))};
  if(request.method!=='PUT') throw new HttpError(405,'Метод не поддерживается');
  if(!canManage) throw new HttpError(403,'Назначать программиста может администратор');
  const body=await request.json();
  const projectId=String(body.projectId||'').trim(), programmerEmail=String(body.programmerEmail||'').trim().toLowerCase();
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(projectId)||programmerEmail.length>254||(programmerEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(programmerEmail))) throw new HttpError(400,'Некорректный программист или проект');
  await put(env,PAYOUT_COLLECTION,{id:'programmer:'+projectId,kind:'programmer',projectId,programmerEmail,updatedAt:Date.now(),updatedBy:actor.email},actor.email);
  return {ok:true};
}
