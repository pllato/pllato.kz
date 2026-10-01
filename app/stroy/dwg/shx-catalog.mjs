import {importShx,restoreShx,localShxNames,fontKey} from './local-shx.mjs';
import {importTtf,restoreTtf,localTtfNames} from './local-ttf.mjs';
export function shxCatalog({onChange,status,styles,applyDocument}){
 const button=document.createElement('button');button.id='shxFonts';button.textContent='Шрифты';document.querySelector('header').append(button);
 const dialog=document.createElement('dialog');dialog.id='shxDialog';dialog.setAttribute('aria-labelledby','shxHeading');
 dialog.innerHTML='<h2 id="shxHeading">Шрифт документа</h2><label for="shxChoice">Выберите шрифт</label><select id="shxChoice"></select><button id="shxLoad" type="button">Загрузить шрифт…</button><input id="shxUpload" type="file" accept=".shx,.ttf" multiple hidden><p id="shxStatus" role="status"></p><small>Шрифт хранится на этом устройстве. Выбор сохраняется при сохранении DWG.</small><form method="dialog"><button>Закрыть</button></form>';
 dialog.style.width='min(420px,95vw)';document.body.append(dialog);
 const select=dialog.querySelector('select'),input=dialog.querySelector('input'),load=dialog.querySelector('#shxLoad'),output=dialog.querySelector('#shxStatus');let pending=false;
 function refresh(){
  const names=[...localShxNames(),...localTtfNames()],fonts=[...new Set(styles().map(s=>fontKey(s.font)))],current=fonts.length===1?fonts[0]:'';
  const placeholder=new Option(current&&!names.includes(current)?'Текущий: '+current:fonts.length>1?'Разные шрифты — выберите один':'Выберите или загрузите шрифт','');placeholder.disabled=true;
  select.replaceChildren(placeholder,...names.map(n=>new Option(n,n)));select.value=names.includes(current)?current:'';select.disabled=pending||!names.length||!styles().length;load.disabled=pending;
 }
 select.onchange=async()=>{const font=select.value;pending=true;refresh();output.textContent='Применяю шрифт…';try{await applyDocument(font);output.textContent='Применён '+font+'. Сохраните DWG. MTEXT с собственным шрифтом и Big Font не изменяются.';}catch(e){output.textContent=e.message;}finally{pending=false;refresh();}};
 load.onclick=()=>input.click();
 input.onchange=async()=>{pending=true;refresh();const messages=[];try{for(const file of input.files){output.textContent='Загружаю '+file.name+'…';try{await (/\.ttf$/i.test(file.name)?importTtf(file):importShx(file));}catch(e){messages.push(file.name+': '+e.message);}}output.textContent=messages.length?messages.join('. '):'Шрифты загружены. Выберите нужный в списке.';onChange();}finally{input.value='';pending=false;refresh();}};
 dialog.addEventListener('keydown',e=>e.stopPropagation());button.onclick=()=>{output.textContent='';refresh();dialog.showModal();};
 const ready=Promise.all([restoreShx(),restoreTtf()]).then(()=>{onChange();if(dialog.open)refresh();}).catch(()=>status('Локальный каталог шрифтов недоступен. Проверьте разрешение браузера на хранение данных.'));
 return {ready};
}
