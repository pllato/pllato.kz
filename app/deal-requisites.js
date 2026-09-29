export async function mountDealRequisites(container,{dealId,canEdit,base,getToken}) {
  container.innerHTML='<label style="display:block;margin-bottom:8px">Текст реквизитов<textarea data-text rows="5" maxlength="50000" placeholder="Вставьте реквизиты компании или ИП…" style="display:block;box-sizing:border-box;width:100%;padding:10px;margin-top:6px;border:1px solid var(--b1);border-radius:8px;background:var(--bg2);color:var(--t1);resize:vertical" disabled></textarea></label><div data-actions><button type="button" class="tbtn" data-save hidden>Повторить сохранение</button> <button type="button" class="tbtn" data-upload disabled>Прикрепить файл / изображение</button><input type="file" data-input hidden accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.txt"><div style="font-size:12px;color:var(--t3);margin:6px 0">PNG, JPG, WebP, GIF, PDF, Word, Excel, TXT · до 15 МБ</div></div><div data-save-status role="status"></div><div data-status role="status">Загрузка реквизитов…</div><div data-files></div>';
  const text=container.querySelector('[data-text]'),save=container.querySelector('[data-save]'),upload=container.querySelector('[data-upload]'),input=container.querySelector('[data-input]'),status=container.querySelector('[data-status]'),files=container.querySelector('[data-files]');
  if(!canEdit)container.querySelector('[data-actions]').hidden=true;
  const path=base+'/api/deals/'+encodeURIComponent(dealId)+'/requisites';
  async function api(method='GET',body,headers={}){
    const r=await fetch(path,{method,body,headers:{Authorization:'Bearer '+await getToken(),...headers}});
    const data=await r.json();if(!r.ok)throw new Error(data.error||'Не удалось сохранить реквизиты');return data;
  }
  async function renderFiles(rows){
    const token=await getToken();if(!container.isConnected)return;
    files.replaceChildren();
    for(const f of rows){
      const row=document.createElement('div');row.style.cssText='margin-top:12px;padding:10px;border:1px solid var(--b1);border-radius:8px';
      const link=document.createElement('a');link.href=path+'/files/'+encodeURIComponent(f.id)+'?auth='+encodeURIComponent(token);link.target='_blank';link.rel='noopener noreferrer';link.textContent=f.name+' · '+Math.max(1,Math.round(f.size/1024))+' КБ';
      if(/^image\/(png|jpeg|webp|gif)$/.test(f.mime)){const image=document.createElement('img');image.src=link.href;image.alt=f.name;image.style.cssText='display:block;max-width:100%;max-height:220px;object-fit:contain;margin-bottom:8px';link.prepend(image);}
      row.append(link);files.append(row);
    }
  }
  let rows=[];
  try{const data=await api();if(!container.isConnected)return;text.value=data.text;rows=data.files;await renderFiles(rows);text.disabled=false;text.readOnly=!canEdit;save.disabled=!canEdit;upload.disabled=!canEdit;status.textContent='';}
  catch(e){status.textContent=e.message;return;}
  const saveStatus=container.querySelector('[data-save-status]');
  let savedText=text.value,saving=false,saveTimer;
  async function saveText(){
    clearTimeout(saveTimer);
    if(!canEdit||saving)return;
    if(text.value===savedText){saveStatus.textContent='Реквизиты сохранены';save.hidden=true;return;}
    saving=true;save.hidden=true;save.disabled=true;
    try{
      // Serialize writes: a slower earlier request must not replace newer text.
      while(text.value!==savedText){
        const value=text.value;saveStatus.textContent='Сохраняется…';
        await api('PUT',JSON.stringify({text:value}),{'Content-Type':'application/json'});
        savedText=value;
      }
      saveStatus.textContent='Реквизиты сохранены';
    }catch(e){saveStatus.textContent='Не сохранено: '+e.message;save.hidden=false;}
    finally{saving=false;save.disabled=false;}
  }
  text.addEventListener('input',()=>{
    if(!canEdit)return;
    saveStatus.textContent='Сохраняется…';clearTimeout(saveTimer);
    saveTimer=setTimeout(saveText,500);
  });
  text.addEventListener('blur',saveText);
  save.onclick=saveText;
  upload.onclick=()=>input.click();
  async function attach(file){
    if(!canEdit||!file)return;
    if(!file.size||file.size>15*1024*1024){status.textContent='Файл должен быть от 1 байта до 15 МБ';return;}
    upload.disabled=true;status.textContent='Загружаем '+file.name+'…';
    const types={pdf:'application/pdf',txt:'text/plain',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
    try{const data=await api('POST',file,{'Content-Type':file.type||types[file.name.split('.').pop().toLowerCase()]||'application/octet-stream','X-File-Name':encodeURIComponent(file.name)});rows.push(data.file);await renderFiles(rows);status.textContent='Файл прикреплён';}
    catch(e){status.textContent=e.message;}finally{upload.disabled=false;input.value='';}
  }
  input.onchange=()=>attach(input.files[0]);
  text.addEventListener('paste',e=>{const file=e.clipboardData?.files?.[0];if(file&&canEdit&&!upload.disabled){e.preventDefault();attach(file);}});
}
