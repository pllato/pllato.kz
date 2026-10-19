import {VERSION,SECTIONS} from './written-test-data.js';
const questions=SECTIONS.flatMap(s=>s.questions),keys=new Set(questions.map(q=>q.id));
let ready;
async function ensure(env){
 if(!ready)ready=env.DB.prepare(`CREATE TABLE IF NOT EXISTS written_placement (
 id TEXT PRIMARY KEY, version TEXT NOT NULL, student TEXT NOT NULL, answers TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending', review TEXT, reviewer TEXT, submitted_at TEXT NOT NULL, reviewed_at TEXT
 )`).run().catch(e=>{ready=null;throw e;});
 return ready;
}
const reply=(data,status=200)=>Response.json(data,{status});
function clean(v,max){if(typeof v!=='string')return '';if(v.length>max)throw Error('Превышена допустимая длина поля');return v.trim();}
export function submission(body){
 if(!body||body.version!==VERSION||!/^\w[\w-]{15,79}$/.test(body.id||''))throw Error('Обновите страницу теста');
 const student={name:clean(body.student?.name,160),phone:clean(body.student?.phone,40),email:clean(body.student?.email,254)};
 if(!student.name||student.phone.replace(/\D/g,'').length<7)throw Error('Укажите имя и телефон');
 const answers={};for(const q of questions)answers[q.id]=clean(body.answers?.[q.id],4000);
 return {id:body.id,student,answers};
}
export function reviewData(body){
 if(!body||typeof body!=='object')throw Error('Некорректные данные');
 const marks={};for(const key of keys){const v=body.marks?.[key]||{};marks[key]={verdict:['correct','partial','incorrect','unreviewed'].includes(v.verdict)?v.verdict:'unreviewed',comment:clean(v.comment,2000)};}
 return {marks,comment:clean(body.comment,10000),level:clean(body.level,120)};
}
export async function writtenPlacement(request,env,actor){
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(path==='/api/written-placement/questions'&&method==='GET')return reply({version:VERSION,sections:SECTIONS});
 if(!actor&&!(path==='/api/written-placement/submit'&&method==='POST'))return reply({error:'Нет доступа'},403);
 await ensure(env);
 if(method==='POST'&&path==='/api/written-placement/submit'){
  const raw=await request.text();if(raw.length>220000)return reply({error:'Ответы слишком длинные'},413);
  let data;try{data=submission(JSON.parse(raw));}catch(e){return reply({error:e.message},400);}
  await env.DB.prepare('INSERT OR IGNORE INTO written_placement(id,version,student,answers,submitted_at) VALUES(?,?,?,?,?)').bind(data.id,VERSION,JSON.stringify(data.student),JSON.stringify(data.answers),new Date().toISOString()).run();
  return reply({ok:true,id:data.id});
 }
 if(path==='/api/written-placement'&&method==='GET'){
  const status=url.searchParams.get('status')==='reviewed'?'reviewed':'pending';
  const offset=Math.max(0,Math.min(100000,Math.floor(Number(url.searchParams.get('offset'))||0)));
  const {results}=await env.DB.prepare('SELECT id,student,status,submitted_at,reviewed_at,reviewer FROM written_placement WHERE status=? ORDER BY submitted_at DESC LIMIT 51 OFFSET ?').bind(status,offset).all();
  return reply({items:results.slice(0,50).map(r=>({...r,student:JSON.parse(r.student)})),hasMore:results.length>50});
 }
 const match=path.match(/^\/api\/written-placement\/([\w-]{16,80})$/);if(!match)return reply({error:'Не найдено'},404);
 const row=await env.DB.prepare('SELECT * FROM written_placement WHERE id=?').bind(match[1]).first();if(!row)return reply({error:'Не найдено'},404);
 if(method==='GET')return reply({...row,student:JSON.parse(row.student),answers:JSON.parse(row.answers),review:row.review?JSON.parse(row.review):null,sections:SECTIONS});
 if(method==='PUT'){
  const raw=await request.text();if(raw.length>150000)return reply({error:'Комментарий слишком длинный'},413);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Некорректные данные'},400);}
  let review;try{review=reviewData(body);}catch(e){return reply({error:e.message},400);}const status=body.complete?'reviewed':'pending';
  if(body.complete&&!review.comment&&!review.level)return reply({error:'Добавьте заключение или уровень преподавателя'},400);
  await env.DB.prepare('UPDATE written_placement SET review=?,status=?,reviewer=?,reviewed_at=? WHERE id=?').bind(JSON.stringify(review),status,actor.name||actor.email||actor.uid,new Date().toISOString(),row.id).run();
  return reply({ok:true});
 }
 return reply({error:'Метод не поддерживается'},405);
}
