let releasePrevious=()=>{};
export function downloadLink(blob,name,{document:doc=globalThis.document,url=URL}={}){
 const href=url.createObjectURL(blob),anchor=doc.createElement('a');
 anchor.href=href;anchor.download=name;anchor.textContent='Скачать файл';
 return {anchor,release:()=>{anchor.remove();url.revokeObjectURL(href);}};
}
// Safari needs a fresh user gesture after asynchronous CAD preparation.
export function offerDownload(blob,name,{onStart=()=>{},touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0}={}){
 releasePrevious();
 const file=downloadLink(blob,name);
 if(!touch){document.body.append(file.anchor);file.anchor.click();onStart();const timer=setTimeout(file.release,60000);releasePrevious=()=>{clearTimeout(timer);file.release();};return;}
 const dialog=document.createElement('dialog');dialog.className='downloadReady';
 const title=document.createElement('h2');title.textContent='Файл готов';
 const text=document.createElement('p');text.textContent=name;
 const help=document.createElement('p');help.textContent='Нажмите «Скачать файл». Файл появится в загрузках браузера; оттуда его можно сохранить в «Файлы».';
 const close=document.createElement('button');close.textContent='×';close.className='formatClose';close.setAttribute('aria-label','Закрыть');close.onclick=()=>dialog.close();
 file.anchor.className='downloadReadyLink';file.anchor.onclick=onStart;
 dialog.append(close,title,text,help,file.anchor);document.body.append(dialog);
 let released=false;releasePrevious=()=>{if(released)return;released=true;file.release();dialog.remove();};
 dialog.addEventListener('close',()=>releasePrevious(),{once:true});dialog.showModal();
}
