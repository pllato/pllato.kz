import {stampLabels,stampDefaults,stampChoices,stampDateKeys} from './stamp-fields.mjs?v=0.17.57';
export function mountStampWorkbench(api){
 const viewport=document.getElementById('viewport'),button=document.createElement('button');
 button.id='editExecutiveStamp';button.textContent='Редактировать штамп';button.style.cssText='position:absolute;z-index:4;font-size:12px;padding:5px;min-height:28px';viewport.append(button);
 const dialog=document.createElement('dialog');dialog.id='stampDialog';dialog.setAttribute('aria-labelledby','stampDialogTitle');
 const form=document.createElement('form'),heading=document.createElement('h2'),fields=document.createElement('div'),error=document.createElement('p'),save=document.createElement('button'),cancel=document.createElement('button'),actions=document.createElement('div');heading.id='stampDialogTitle';heading.textContent='Штамп исполнительной';fields.className='stampFields';error.setAttribute('role','alert');save.textContent='Сохранить';save.className='primary';cancel.textContent='Отмена';cancel.type='button';cancel.onclick=()=>dialog.close();actions.className='stampActions';actions.append(cancel,save);form.append(heading,fields,error,actions);dialog.append(form);document.body.append(dialog);
 const inputs=new Map();let sheetId='';
 for(const [key,label]of Object.entries(stampLabels)){
  const wrapper=document.createElement('label'),input=document.createElement('input');wrapper.textContent=label;input.id='stampEdit_'+key;input.maxLength=1000;input.style.cssText='width:100%;box-sizing:border-box';input.setAttribute('aria-label',label);wrapper.append(input);
  if(stampDateKeys.has(key)){
   input.placeholder='дд.мм.гггг';const calendar=document.createElement('input');calendar.type='date';calendar.setAttribute('aria-label','Календарь · '+label);calendar.onchange=()=>{if(calendar.value)input.value=calendar.value.split('-').reverse().join('.');};wrapper.append(calendar);
  }else{const list=document.createElement('datalist');list.id='stampChoices_'+key;input.setAttribute('list',list.id);wrapper.append(list);}
  inputs.set(key,input);fields.append(wrapper);
 }
 function open(){const s=api.sheet();if(!s||api.busy())return;sheetId=s.id;error.textContent='';for(const [key,input]of inputs){input.value=s.stamp?.[key]??stampDefaults[key]??'';const list=document.getElementById('stampChoices_'+key);if(list)list.replaceChildren(...stampChoices(key,api.project().sheets).map(v=>new Option(v,v)));const calendar=input.parentElement.querySelector('[type=date]');if(calendar)calendar.value=/^\d{2}\.\d{2}\.\d{4}$/.test(input.value)?input.value.split('.').reverse().join('-'):'';}dialog.showModal();}
 button.onclick=open;
 form.onsubmit=e=>{e.preventDefault();if(api.busy())return;try{api.edit(sheetId,Object.fromEntries([...inputs].map(([k,i])=>[k,i.value.trim()])));dialog.close();}catch(e){error.textContent=e.message;}};
 // Transparent click target follows the native stamp; it does not rebuild CAD geometry.
 const target=document.createElement('button');target.id='executiveStampTarget';target.setAttribute('aria-label','Изменить поля штампа');target.title='Нажмите, чтобы изменить ФИО, подписи, даты и организацию';target.style.cssText='position:absolute;z-index:3;background:transparent;border:0;border-radius:0;padding:0;min-height:0;cursor:text';target.onclick=open;viewport.append(target);
 return {paint(){const s=api.sheet();if(!s||api.busy()){button.hidden=target.hidden=true;return;}const u=s.paperUnit,[x,y]=api.screen([s.origin[0]+235*u,s.origin[1]+50*u]),[right,bottom]=api.screen([s.origin[0]+415*u,s.origin[1]+5*u]);const left=Math.max(0,x),top=Math.max(0,y),w=Math.min(viewport.clientWidth,right)-left,h=Math.min(viewport.clientHeight,bottom)-top;target.hidden=w<=0||h<=0;button.hidden=target.hidden||y<28;if(!target.hidden){Object.assign(target.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});Object.assign(button.style,{left:left+'px',top:Math.max(0,y-30)+'px'});}}};
}
