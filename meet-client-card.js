export function createClientCardLoader({fetcher=fetch,onChange}){
  let generation=0,controller;
  function clear(){generation++;controller?.abort();onChange({status:'hidden'});}
  async function load({room,host,token}){
    clear();if(!host||!room)return;
    if(!token){onChange({status:'error',message:'Для просмотра данных войдите в панель команды и снова откройте встречу.'});return;}
    const current=generation;controller=new AbortController();
    const requestController=controller;
    const timer=setTimeout(()=>requestController.abort(),8000);
    onChange({status:'loading'});
    try{
      const response=await fetcher('https://pllato-elc-worker.uurraa.workers.dev/api/zoom/meetings/'+encodeURIComponent(room)+'/client-context',{
        headers:{Authorization:'Bearer '+token},cache:'no-store',signal:requestController.signal});
      if(current!==generation)return;
      if([401,403].includes(response.status)){clear();return;}
      if(!response.ok)throw Error('request');
      const data=await response.json();if(current!==generation)return;
      onChange({status:data.client?'ready':'empty',client:data.client});
    }catch{if(current===generation)onChange({status:'error',message:'Не удалось загрузить данные клиента. Видеовстреча продолжается.'});}
    finally{clearTimeout(timer);}
  }
  return {load,clear};
}
export function renderClientCard(root,result,{retry,close}){
  root.replaceChildren();
  const add=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;root.append(el);return el;};
  const closeButton=add('button','Свернуть','btn btn-ghost');closeButton.onclick=close;
  if(result.status==='loading'){add('p','Загружаем сведения о клиенте…');return;}
  if(result.status==='error'){add('p',result.message);add('button','Повторить','btn').onclick=retry;return;}
  if(result.status==='empty'){add('p','У этой встречи нет связанной сделки.');return;}
  if(result.status!=='ready')return;
  const c=result.client;add('div','ДАННЫЕ КЛИЕНТА · ТОЛЬКО ДЛЯ ВЕДУЩИХ','client-eyebrow');add('h2',c.title||'Клиент');
  const fields=[['Контакт',c.contactName],['Телефон',c.phone],['Воронка',c.pipeline],['Стадия',c.stage],['Ответственный',c.responsible]];
  const date=value=>{if(!value)return '';const d=new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value)?value:value+'+05:00');return Number.isNaN(d.getTime())?'':d.toLocaleString('ru-RU',{timeZone:'Asia/Almaty',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});};
  const start=date(c.startTime),end=date(c.endTime);if(start)fields.push(['Встреча',start+(end?' — '+end:'')]);
  for(const [label,value]of fields){if(!value)continue;const row=add('div','','client-field');const name=document.createElement('span');name.textContent=label;const val=document.createElement('strong');val.textContent=value;row.append(name,val);}
  if(typeof c.dealId==='string'&&c.dealId){const link=add('a','Открыть сделку ↗','btn');link.href='/team.html#deal/'+encodeURIComponent(c.dealId.replace(/^deal_/,''));link.target='_blank';link.rel='noopener';}
}
