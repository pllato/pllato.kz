// Project expense ledger. Kept out of generic store sync; all reads enforce project ACL.
export const PAYOUT_COLLECTION = '_project_payouts_private';
export const payoutAdmin = actor => Boolean(actor?.isRoot || actor?.user?.isSuperAdmin);
const email = value => String(value || '').trim().toLowerCase();
export async function handleProjectPayouts(request, env, actor, deps) {
  const {get, put, list, HttpError} = deps;
  const url = new URL(request.url), admin = payoutAdmin(actor);
  const fail = (status, message) => { throw new HttpError(status, message); };
  if (url.pathname === '/project-payouts/access' && request.method === 'GET') {
    if (admin) return {admin:true, projects:[]};
    const settings = await list(env, 'access');
    return {admin:false, projects:settings.filter(s=>(s.viewers||[]).includes(email(actor.email))).map(s=>s.projectId)};
  }
  const projectId = url.searchParams.get('projectId') || '';
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(projectId)) fail(400,'Некорректный проект');
  const accessId = 'access:'+projectId;
  const access = await get(env,PAYOUT_COLLECTION,accessId);
  if (request.method === 'GET') {
    if (!admin && !(access?.viewers||[]).includes(email(actor.email))) fail(403,'Нет доступа к выплатам этого проекта');
    const items = await list(env,'entry',projectId);
    return {admin, items:items.filter(i=>!i.deleted), viewers:admin?(access?.viewers||[]):[]};
  }
  if (!admin) fail(403,'Вести выплаты и менять доступ может только супер-админ');
  const body = await request.json();
  if (request.method === 'PUT' && url.pathname === '/project-payouts/access') {
    if (!Array.isArray(body.viewers) || body.viewers.length>200) fail(400,'Укажите список сотрудников');
    const viewers = [...new Set(body.viewers.map(email))];
    if(viewers.some(v=>!/^\S+@\S+\.\S+$/.test(v)||v.length>254))fail(400,'Некорректный email');
    await put(env,PAYOUT_COLLECTION,{id:accessId,kind:'access',projectId,viewers,updatedAt:Date.now()},actor.email);
    return {ok:true};
  }
  if(request.method!=='POST')fail(405,'Метод не поддерживается');
  const id = String(body.id||'');
  if(!/^[a-zA-Z0-9_-]{8,80}$/.test(id))fail(400,'Некорректный идентификатор записи');
  const key = 'entry:'+projectId+':'+id, old = await get(env,PAYOUT_COLLECTION,key);
  if(body.deleted){
    if(!old)fail(404,'Запись не найдена');
    await put(env,PAYOUT_COLLECTION,{...old,deleted:true,updatedAt:Date.now(),updatedBy:actor.email},actor.email);
    return {ok:true};
  }
  const recipient=String(body.recipient||'').trim(), role=String(body.role||'').trim(), note=String(body.note||'').trim();
  const amount=Number(body.amount), date=String(body.date||''),status=body.status;
  if(!recipient||recipient.length>160||role.length>80||note.length>1000)fail(400,'Проверьте получателя и назначение');
  if(!Number.isFinite(amount)||amount<=0||amount>1e12||Math.abs(amount*100-Math.round(amount*100))>0.001)fail(400,'Укажите положительную сумму, не более двух знаков после запятой');
  if(!['planned','paid'].includes(status))fail(400,'Некорректный статус');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)fail(400,'Укажите корректную дату');
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Almaty'});
  if(status==='paid'&&date>today)fail(400,'Дата фактической выплаты не может быть в будущем');
  const item={id:key,entryId:id,kind:'entry',projectId,recipient,role,note,amount:Math.round(amount*100)/100,currency:'KZT',date,status,createdAt:old?.createdAt||Date.now(),updatedAt:Date.now(),createdBy:old?.createdBy||actor.email,updatedBy:actor.email};
  await put(env,PAYOUT_COLLECTION,item,actor.email);
  return {ok:true,item};
}
