import {defaultPlan,weeksFrom,migratePlan} from './financial-model.js';
export const PLAN_COLLECTION='_financial_planning_private';
export async function handleFinancialPlanning(request,env,actor,deps){
 const {get,save,income,payouts,HttpError}=deps, path=new URL(request.url).pathname;
 const fail=(status,message)=>{throw new HttpError(status,message);};
 const email=String(actor.email||'').toLowerCase(),admin=email==='uurraa@gmail.com';
 const plan=migratePlan(await get(env,PLAN_COLLECTION,'plan')||defaultPlan());
 const allowed=admin||(plan.viewers||[]).includes(email),editable=admin||(plan.editors||[]).includes(email);
 if(path.endsWith('/access')&&request.method==='GET')return {allowed,admin,editable};
 if(!allowed)fail(403,'Нет доступа к финансовому планированию');
 if(request.method==='GET'){
  const cash=await income(env,weeksFrom(plan.start));
  const {legacyRows,legacyCells,...publicPlan}=plan;
  return {plan:{...publicPlan,viewers:admin?plan.viewers:[],editors:admin?plan.editors:[]},admin,editable,income:cash,payouts:[],payoutDetails:[]};
 }
 if(request.method!=='PUT')fail(405,'Метод не поддерживается');
 if(Number(request.headers.get('content-length'))>250000)fail(413,'Слишком много данных');
 const text=await request.text();if(text.length>250000)fail(413,'Слишком много данных');
 let body;try{body=JSON.parse(text);}catch{fail(400,'Некорректные данные');}
 if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Некорректные данные');
 if(body.revision!==plan.revision)fail(409,'Таблица изменена другим сотрудником. Обновите данные перед сохранением.');
 let next={...plan};
 if(path.endsWith('/access')){
  if(!admin)fail(403,'Доступ настраивает только владелец');
  for(const field of ['viewers','editors']){if(!Array.isArray(body[field])||body[field].length>200||body[field].some(e=>typeof e!=='string'||!/^\S+@\S+\.\S+$/.test(e)||e.length>254))fail(400,'Проверьте список сотрудников');next[field]=[...new Set(body[field].map(e=>e.trim().toLowerCase()))];}
  if(next.editors.some(e=>!next.viewers.includes(e)))fail(400,'Редактору нужен доступ к просмотру');
 }else{
  if(!editable)fail(403,'Только просмотр');
  if(!Array.isArray(body.rows)||body.rows.length<4||body.rows.length>150)fail(400,'Допустимо до 150 статей');
  const ids=new Set();
  for(const r of body.rows){if(!r||!/^[a-zA-Z0-9_-]{1,60}$/.test(r.id)||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>160||!['₸','%'].includes(r.unit)||!['income','expense','tax','extraIncome','profit','formula','percentage','expenseGroup'].includes(r.kind))fail(400,'Проверьте статьи');if(['payoutPaid','payoutPlanned'].includes(r.kind)&&(typeof r.sourceRole!=='string'||r.sourceRole.length>80))fail(400,'Проверьте статью выплат');ids.add(r.id);}
  for(const kind of ['income','profit'])if(body.rows.filter(r=>r.kind===kind&&r.id===kind).length!==1||body.rows.filter(r=>r.kind===kind).length!==1)fail(400,'Системные строки нельзя удалять');
  for(const [id,rate] of [['promotion',10],['tax',2]]){const row=body.rows.find(r=>r.id===id);if(!row||row.kind!=='percentage'||row.rate!==rate)fail(400,'Продвижение — 10%, налоги — 2%');}
  if(body.rows.some(r=>r.kind==='percentage'&&!['promotion','tax'].includes(r.id)))fail(400,'Неизвестная процентная статья');
  for(const r of body.rows)if(r.parentId&&(r.kind!=='expense'||!body.rows.some(p=>p.id===r.parentId&&p.kind==='expenseGroup'&&!p.parentId)))fail(400,'Подстатья должна быть расходом внутри статьи-группы');
  const cells=body.cells;if(!cells||typeof cells!=='object'||Array.isArray(cells))fail(400,'Проверьте ячейки');
  const keys=new Set(['benchmark',...weeksFrom(plan.start).map(w=>String(w.start))]);
  for(const [id,values]of Object.entries(cells)){if(!ids.has(id)||!values||typeof values!=='object'||Array.isArray(values))fail(400,'Некорректная строка');for(const [key,v]of Object.entries(values)){if(!keys.has(key)||typeof v!=='string'||v.length>500)fail(400,'Некорректная ячейка');}}
  if(body.rules===undefined&&Object.keys(plan.rules||{}).length)fail(409,'Обновите страницу: доступна новая версия финансового планирования');
  const rules=body.rules||{};
  if(typeof rules!=='object'||Array.isArray(rules))fail(400,'Проверьте правила статей');
  for(const [id,values]of Object.entries(rules)){
   const row=body.rows.find(r=>r.id===id);
   if(!row||['income','profit','expenseGroup'].includes(row.kind)||!values||typeof values!=='object'||Array.isArray(values))fail(400,'Некорректная статья правила');
   for(const [key,rule]of Object.entries(values)){
    if(key==='benchmark'||!keys.has(key)||!rule||!['amount','percent','formula'].includes(rule.mode)||typeof rule.value!=='string'||rule.value.length>500)fail(400,'Некорректное правило');
    if(rule.mode!=='formula'){const v=Number(rule.value.replace(',','.'));if(!rule.value.trim()||!Number.isFinite(v)||v<0||v>(rule.mode==='percent'?100:1e12))fail(400,'Проверьте сумму или процент');}
    else if(!rule.value.startsWith('='))fail(400,'Формула должна начинаться с =');
   }
  }
  next.rules=rules;
  next.rows=body.rows.map(({id,name,unit,kind,rate,parentId})=>({id,name:name.trim(),unit,kind,...(parentId?{parentId}:{}),...(kind==='percentage'?{rate}:{})}));next.cells=cells;
 }
 next={...next,id:'plan',revision:plan.revision+1,updatedAt:Date.now(),updatedBy:email};
 if(!await save(env,next,plan.revision))fail(409,'Таблица изменена другим сотрудником. Обновите данные.');
 return {ok:true,revision:next.revision};
}
