let releasePrevious=()=>{};
export function downloadLink(blob,name,{document:doc=globalThis.document,url=URL}={}){
 // Use a generic download MIME instead of a CAD application association.
 // Change only the transport MIME, never the DWG bytes or filename.
 const payload=new Blob([blob],{type:'application/octet-stream'});
 const href=url.createObjectURL(payload),anchor=doc.createElement('a');
 anchor.href=href;anchor.download=name;anchor.textContent='Скачать файл';
 return {anchor,release:()=>{anchor.remove();url.revokeObjectURL(href);}};
}
export function shareFile(blob,name,{navigator:nav=globalThis.navigator,File:FileType=globalThis.File}={}){
 if(!nav?.share||!nav.canShare||!FileType)return null;
 const file=new FileType([blob],name,{type:'application/octet-stream'});
 try{if(!nav.canShare({files:[file]}))return null;}catch{return null;}
 return ()=>nav.share({files:[file]});
}
// Fresh user gesture after asynchronous CAD preparation; retain output for retry.
export function offerDownload(blob,name,{onStart=()=>{},touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0}={}){
 releasePrevious();const file=downloadLink(blob,name);
 if(!touch){document.body.append(file.anchor);file.anchor.click();onStart();const timer=setTimeout(file.release,60000);releasePrevious=()=>{clearTimeout(timer);file.release();};return;}
 const dialog=document.createElement('dialog');dialog.className='downloadReady';
 const title=document.createElement('h2');title.textContent='Файл готов, сохраните его';
 const text=document.createElement('p');text.textContent=name+' · '+(blob.size/1048576).toFixed(2)+' МБ';
 const help=document.createElement('p');help.setAttribute('role','status');help.textContent='Подготовка завершена. Файл ещё не сохранён на устройстве. Нажмите «Скачать файл» и проверьте загрузки браузера.';
 const close=document.createElement('button');close.textContent='×';close.className='formatClose';close.setAttribute('aria-label','Закрыть');close.onclick=()=>dialog.close();
 file.anchor.className='downloadReadyLink';file.anchor.onclick=()=>{help.textContent='Запрос скачивания передан браузеру. Если файла нет в загрузках, '+(share?'используйте системное меню ниже или повторите скачивание.':'проверьте разрешение загрузок в браузере и повторите скачивание.');onStart();};
 const retry=document.createElement('button');retry.className='downloadRetry';retry.textContent='Готовый файл · сохранить';retry.onclick=()=>{if(!dialog.open)dialog.showModal();};
 dialog.append(close,title,text,help,file.anchor);
 const share=shareFile(blob,name);
 if(share){const button=document.createElement('button');button.textContent='Сохранить через системное меню';button.className='downloadReadyShare';button.onclick=async()=>{
  button.disabled=true;
  try{await share();help.textContent='Файл передан выбранному приложению. Проверьте сохранение в нём.';}
  catch(error){help.textContent=error.name==='AbortError'?'Сохранение отменено. Готовый файл остаётся доступен.':'Системное сохранение не выполнено: '+error.message+'. Можно повторить скачивание.';}
  finally{button.disabled=false;}
 };dialog.append(button);}
 document.body.append(dialog,retry);
 let released=false;releasePrevious=()=>{if(released)return;released=true;file.release();dialog.remove();retry.remove();};
 // Closing the dialog must not discard a large output or revoke an ongoing download.
 dialog.showModal();
}
export function outputFailure(message){
 const dialog=document.createElement('dialog');dialog.className='downloadReady';
 const title=document.createElement('h2');title.textContent='Файл не сохранён';
 const text=document.createElement('p');text.textContent=message;
 const help=document.createElement('p');help.textContent='Подготовка файла не завершилась. Исходник не изменён. Правки остаются в редакторе; не закрывайте вкладку до сохранения.';
 const close=document.createElement('button');close.textContent='Закрыть';close.onclick=()=>dialog.close();
 dialog.append(title,text,help,close);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
}
export function notifyExecutiveCreated(save,{touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0}={}){
 if(!touch)return;
 document.getElementById('executiveSaveNotice')?.remove();
 const notice=document.createElement('div');notice.id='executiveSaveNotice';notice.className='executiveSaveNotice';
 const text=document.createElement('strong');text.textContent='Исполнительная создана. DWG ещё не скачан.';
 const button=document.createElement('button');button.textContent='Скачать весь DWG';button.onclick=()=>{notice.remove();save();};
 const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Закрыть сообщение');close.onclick=()=>notice.remove();
 notice.append(text,button,close);document.body.append(notice);
}
