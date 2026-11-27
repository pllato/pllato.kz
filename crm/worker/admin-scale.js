export const ADMIN_SCALE_COLLECTION='_admin_scale_private';
export const ADMIN_SCALE_TITLES=['Долгосрочные цели','Цели','Оргполитика','Планы','Программы','Проекты','Приказы','Идеальные картины','Статистики','Ценные конечные продукты'];
export function defaultAdminScale(){return {revision:0,title:'Админ Шкала',sections:ADMIN_SCALE_TITLES.map((title,i)=>({id:'section_'+i,title,archived:false,items:[]})),updatedAt:null,updatedBy:null};}
export function canUseAdminScale(actor){return Boolean(actor?.user&&(actor.isRoot||actor.isAdmin||actor.user.apps?.admin_scale===true));}
export function validateAdminScale(body){
 if(!body||!Number.isSafeInteger(body.revision)||body.revision<0||!Array.isArray(body.sections)||body.sections.length>40)throw Error('Проверьте разделы шкалы (до 40 разделов)');
 const ids=new Set();let count=0;
 const id=x=>{if(typeof x!=='string'||!(/^[a-zA-Z0-9_-]{1,70}$/).test(x)||ids.has(x))throw Error('Некорректный или повторяющийся идентификатор');ids.add(x);return x;};
 return body.sections.map(s=>{if(!s||typeof s.title!=='string'||!s.title.trim()||s.title.length>160||typeof s.archived!=='boolean'||!Array.isArray(s.items)||s.items.length>100)throw Error('Название раздела: 1–160 символов; до 100 пунктов');
 return {id:id(s.id),title:s.title.trim(),archived:s.archived,items:s.items.map(item=>{if(++count>500||!item||typeof item.text!=='string'||item.text.length>10000||typeof item.archived!=='boolean')throw Error('До 500 пунктов, текст до 10 000 символов');return {id:id(item.id),text:item.text,archived:item.archived};})};});
}
export async function handleAdminScale(request,env,actor,{get,save,HttpError}){
 if(!canUseAdminScale(actor))throw new HttpError(403,'Нет доступа к Админ Шкале');
 if(request.method!=='GET'&&request.method!=='PUT')throw new HttpError(405,'Метод не поддерживается');
 const doc=await get(env,ADMIN_SCALE_COLLECTION,'scale')||defaultAdminScale();
 if(request.method==='GET')return {ok:true,scale:doc};
 if(Number(request.headers.get('content-length'))>250000)throw new HttpError(413,'Шкала слишком большая');
 const raw=await request.text();if(raw.length>250000)throw new HttpError(413,'Шкала слишком большая');
 let body,sections;try{body=JSON.parse(raw);sections=validateAdminScale(body);}catch(e){throw new HttpError(400,e.message||'Проверьте данные');}
 if(body.revision!==doc.revision)throw new HttpError(409,'Шкала изменена в другом окне. Ваш черновик сохранён на этом устройстве.');
 const next={...doc,sections,revision:doc.revision+1,updatedAt:Date.now(),updatedBy:actor.email};
 if(!await save(env,next,doc.revision))throw new HttpError(409,'Шкала изменена в другом окне. Ваш черновик сохранён на этом устройстве.');
 return {ok:true,revision:next.revision,updatedAt:next.updatedAt,updatedBy:next.updatedBy};
}
