export const SOCIAL_COLLECTION='_social_publications_private';
const email=v=>String(v||'').trim().toLowerCase();
export const socialAdmin=a=>Boolean(a?.isRoot||a?.user?.isSuperAdmin);
export function socialAccess(config,actor){
 const admin=socialAdmin(actor),me=email(actor?.email),edit=admin||(config?.editors||[]).includes(me);
 return {admin,edit,view:edit||(config?.viewers||[]).includes(me)};
}
const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
export function normalizeSocialDay(body,now=Date.now()){
 const date=String(body.date||'');
 if(!validDate(date)||date>new Date(now+5*3600000).toISOString().slice(0,10))throw new Error('Выберите дату не позже сегодняшней');
 const result={date};
 for(const key of ['stories','reels','storiesBefore','reelsBefore']){
  const v=body[key]??0;
  if(typeof v!=='number'||!Number.isInteger(v)||v<0||v>10000)throw new Error('Количество должно быть целым числом от 0 до 10000');
  result[key]=v;
 }
 if(result.storiesBefore>result.stories||result.reelsBefore>result.reels)throw new Error('Количество до 14:00 не может превышать итог дня');
 if(new Date(date).getUTCDay()!==4&&(result.storiesBefore||result.reelsBefore))throw new Error('Разделение до 14:00 используется только в четверг');
 return result;
}
export function socialEntries(records){
 return records.flatMap(r=>{
  const thursday=new Date(r.date).getUTCDay()===4;
  if(!thursday)return [{...r,timestamp:Date.parse(r.date+'T12:00:00+05:00')}];
  return [
   {...r,stories:r.storiesBefore||0,reels:r.reelsBefore||0,timestamp:Date.parse(r.date+'T13:59:59+05:00'),slot:'до 14:00'},
   {...r,stories:r.stories-(r.storiesBefore||0),reels:r.reels-(r.reelsBefore||0),timestamp:Date.parse(r.date+'T14:00:00+05:00'),slot:'с 14:00'},
  ];
 });
}
export function socialSeries(records,buckets){
 const entries=socialEntries(records);
 return ['stories','reels'].map(metric=>({email:metric,name:metric==='stories'?'Сторис':'Рилс',series:buckets.map(({start,end,label,partial})=>({start,end,label,partial,value:entries.filter(r=>r.timestamp>=start&&r.timestamp<end).reduce((n,r)=>n+(Number(r[metric])||0),0)}))}));
}
export function socialTotalSeries(lines){
 return (lines[0]?.series||[]).map((point,index)=>({...point,value:lines.reduce((sum,line)=>sum+(Number(line.series[index]?.value)||0),0)}));
}
export async function handleSocialPublications(request,env,actor,deps){
 const {get,list,save,HttpError}=deps,url=new URL(request.url),config=await get(env,SOCIAL_COLLECTION,'access')||{},access=socialAccess(config,actor);
 const fail=(status,text)=>{throw new HttpError(status,text)};
 if(url.pathname.endsWith('/access')){
  if(!access.admin)fail(403,'Настройки доступны только супер-админу');
  if(request.method==='GET')return {ok:true,...config,revision:config.revision||0};
  if(request.method!=='PUT')fail(405,'Метод не поддерживается');
  const body=await request.json(),next={id:'access',viewers:[],editors:[],scale:{}};
  for(const key of ['viewers','editors']){
   if(!Array.isArray(body[key])||body[key].length>200)fail(400,'Проверьте список сотрудников');
   next[key]=[...new Set(body[key].map(email))];
   if(next[key].some(x=>!/^\S+@\S+\.\S+$/.test(x)||x.length>254))fail(400,'Некорректный email');
  }
  for(const period of ['day','week','month']){const v=Number(body.scale?.[period]||0);if(!Number.isInteger(v)||v<0||v>1000000)fail(400,'Некорректный масштаб');next.scale[period]=v;}
  next.revision=(config.revision||0)+1;next.updatedAt=Date.now();next.updatedBy=actor.email;
  if(body.revision!==(config.revision||0)||!await save(env,next,body.revision))fail(409,'Настройки уже изменены. Откройте их заново.');
  return {ok:true,...next};
 }
 if(!access.view)fail(403,'Нет доступа к графику публикаций');
 if(url.pathname.endsWith('/details')&&request.method==='GET'){
  const start=Number(url.searchParams.get('start')),end=Number(url.searchParams.get('end')),metric=url.searchParams.get('metric');
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>32*86400000||!['stories','reels','total'].includes(metric))fail(400,'Некорректный период');
  const from=new Date(start+5*3600000).toISOString().slice(0,10),to=new Date(end+5*3600000).toISOString().slice(0,10);
  const records=await list(env,from,to),entries=socialEntries(records);
  const measured=metric==='total'?entries.map(r=>({...r,total:r.stories+r.reels})):entries;
  const items=measured.filter(r=>r.timestamp>=start&&r.timestamp<end&&r[metric]>0).map(r=>({title:`${metric==='total'?'Общая':metric==='stories'?'Сторис':'Рилс'}: ${r[metric]}${r.slot?' · '+r.slot:''}`,timestamp:r.timestamp,count:r[metric],responsible:r.updatedBy}));
  return {ok:true,items,actualValue:items.reduce((n,r)=>n+r.count,0)};
 }
 const date=url.searchParams.get('date')||'';
 if(!validDate(date))fail(400,'Выберите дату');
 const id='day:'+date,old=await get(env,SOCIAL_COLLECTION,id);
 if(request.method==='GET')return {ok:true,access,item:old||{date,stories:0,reels:0,storiesBefore:0,reelsBefore:0,revision:0}};
 if(request.method!=='PUT')fail(405,'Метод не поддерживается');
 if(!access.edit)fail(403,'Нет права на ввод данных');
 const body=await request.json();let day;try{day=normalizeSocialDay({...body,date})}catch(e){fail(400,e.message)}
 if(body.revision!==(old?.revision||0))fail(409,'Этот день уже изменён. Выберите дату заново.');
 const now=Date.now(),item={...day,id,revision:(old?.revision||0)+1,updatedAt:now,updatedBy:email(actor.email),createdAt:old?.createdAt||now,
 history:[...(old?.history||[]),{stories:old?.stories??null,reels:old?.reels??null,storiesBefore:old?.storiesBefore||0,reelsBefore:old?.reelsBefore||0,at:now,by:email(actor.email)}].slice(-50)};
 if(!await save(env,item,body.revision))fail(409,'Этот день уже изменён. Выберите дату заново.');
 return {ok:true,access,item};
}
