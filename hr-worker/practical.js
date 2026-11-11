import {emptyAnswers,cleanAnswers,completion} from '../app/hr/practical/tasks.js';
const iso=()=>new Date().toISOString();
const output=(data,status=200)=>({data,status});
export async function expirePractical(env){
 await env.DB.prepare("UPDATE submissions SET status='review',submitted_at=(SELECT deadline FROM hr_practical_sessions WHERE id=submissions.id) WHERE status='in_progress' AND id IN (SELECT id FROM hr_practical_sessions WHERE deadline<=?)").bind(iso()).run();
}
export async function practicalRoute(request,env,authorized,onComplete){
 const path=new URL(request.url).pathname;
 if(!path.startsWith('/api/hr/practical/'))return null;
 if(path.endsWith('/key')){
  if(!authorized)return output({error:'Нужен пароль команды'},401);
  let text=env.HR_PRACTICAL_KEY||'Ключ ещё не настроен';
  if(env.HR_PRACTICAL_KEY_GZIP){const bytes=Uint8Array.from(atob(env.HR_PRACTICAL_KEY_GZIP),x=>x.charCodeAt(0));text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
  return output({text});
 }
 if(request.method!=='POST')return output({error:'Метод не поддерживается'},405);
 if(Number(request.headers.get('content-length'))>450000)return output({error:'Слишком большой запрос'},413);
 const raw=await request.text();if(raw.length>450000)return output({error:'Слишком большой запрос'},413);
 let b;try{b=JSON.parse(raw)}catch{return output({error:'Некорректный JSON'},400)}
 if(path.endsWith('/start')){
  const c=b.cand||{},phone=String(c.phone||'').replace(/\D/g,'');
  if(!String(c.name||'').trim()||phone.length<10||phone.length>15||!Number.isInteger(c.age)||c.age<1||c.age>120||b.consent!==true)return output({error:'Укажите имя, телефон, возраст и подтвердите правила'},400);
  const id='practical_'+crypto.randomUUID(),token=crypto.randomUUID(),started=iso(),deadline=new Date(Date.now()+40*60000).toISOString();
  const cand={name:String(c.name).trim().slice(0,120),phone,age:c.age,email:String(c.email||'').slice(0,160),formVersion:2};
  const data={stage:'practical',fam:'sales',cand,ans:{practical:emptyAnswers()},practical:{started,deadline,signals:{},revision:0}};
  await env.DB.batch([
   env.DB.prepare('INSERT INTO hr_practical_sessions(id,token,deadline,created_at) VALUES(?,?,?,?)').bind(id,token,deadline,started),
   env.DB.prepare("INSERT INTO submissions(id,name,phone,email,fam,stage,status,code,submitted_at,updated_at) VALUES(?,?,?,?,'sales','practical','in_progress',?,?,?)").bind(id,cand.name,phone,cand.email,globalThis.HR.encodeResult(data),started,started)
  ]);
  return output({ok:true,id,token,deadline,serverNow:iso(),revision:0,answers:data.ans.practical});
 }
 if(path.endsWith('/grade')){
  if(!authorized)return output({error:'Нужен пароль команды'},401);
  const max=[4,3,4,3,3,3],scores=b.scores;
  if(!Array.isArray(scores)||scores.length!==6||scores.some((v,i)=>!Number.isInteger(v)||v<0||v>max[i])||!['','hire','reserve','reject'].includes(b.decision||''))return output({error:'Проверьте баллы и решение'},400);
  const row=await env.DB.prepare("SELECT id FROM submissions WHERE id=? AND stage='practical' AND status<>'in_progress'").bind(String(b.id)).first();
  if(!row)return output({error:'Завершённый результат не найден'},404);
  const total=scores.reduce((x,y)=>x+y,0);
  await env.DB.prepare('UPDATE submissions SET fit=?,interview=?,notes=?,decision=?,reviewed_at=?,updated_at=? WHERE id=?').bind(total,JSON.stringify({practical:{scores,total}}),String(b.notes||'').slice(0,8000),b.decision||null,iso(),iso(),b.id).run();
  return output({ok:true,total});
 }
 if(!['/api/hr/practical/save','/api/hr/practical/status'].includes(path))return output({error:'Не найдено'},404);
 const row=await env.DB.prepare('SELECT s.*,p.token,p.deadline,p.revision FROM submissions s JOIN hr_practical_sessions p ON p.id=s.id WHERE s.id=? AND p.token=?').bind(String(b.id||''),String(b.token||'')).first();
 if(!row)return output({error:'Сессия не найдена'},401);
 const data=globalThis.HR.decodeResult(row.code).data;
 if(row.status!=='in_progress')return output({ok:true,finished:true,timedOut:!data.practical.finishedAt,deadline:row.deadline,revision:row.revision,answers:data.ans.practical,serverNow:iso()});
 if(Date.now()>=Date.parse(row.deadline)){
  await env.DB.prepare("UPDATE submissions SET status='review',submitted_at=?,updated_at=? WHERE id=? AND status='in_progress'").bind(row.deadline,iso(),row.id).run();
  onComplete(row.id);return output({ok:true,finished:true,timedOut:true,answers:data.ans.practical,revision:row.revision,deadline:row.deadline,serverNow:iso()});
 }
 if(path.endsWith('/status'))return output({ok:true,finished:false,answers:data.ans.practical,signals:data.practical.signals,revision:row.revision,deadline:row.deadline,serverNow:iso()});
 if(!Number.isInteger(b.revision)||b.revision!==row.revision+1)return output({error:'Анкета открыта в другой вкладке. Обновите страницу для синхронизации.',conflict:true},409);
 let answers;try{answers=cleanAnswers(b.answers)}catch(e){return output({error:e.message},400)}
 const signals={};for(const k of ['awayCount','awayMs','pasteCount','pasteChars','quotePasteCount'])signals[k]=Math.max(Number(data.practical.signals?.[k])||0,Math.min(10000000,Math.max(0,Math.floor(Number(b.signals?.[k])||0))));
 data.ans.practical=answers;data.practical={...data.practical,signals,revision:b.revision,completedTasks:completion(answers).filter(Boolean).length};
 if(b.finish===true)data.practical.finishedAt=iso();
 const updated=await env.DB.batch([
  env.DB.prepare("UPDATE submissions SET code=?,status=?,submitted_at=?,updated_at=? WHERE id=? AND status='in_progress' AND EXISTS(SELECT 1 FROM hr_practical_sessions WHERE id=? AND revision=?)").bind(globalThis.HR.encodeResult(data),b.finish===true?'review':'in_progress',b.finish===true?iso():row.submitted_at,iso(),row.id,row.id,row.revision),
  env.DB.prepare('UPDATE hr_practical_sessions SET revision=? WHERE id=? AND revision=?').bind(b.revision,row.id,row.revision)
 ]);
 if(!updated[0].meta?.changes)return output({error:'Ответы обновлены в другой вкладке. Обновите страницу.',conflict:true},409);
 if(b.finish===true)onComplete(row.id);
 return output({ok:true,finished:b.finish===true,revision:b.revision,deadline:row.deadline,serverNow:iso()});
}
