const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function messageToolsHtml(m){
 const quote=m.quote?`<blockquote class="dw-quote"><b>${esc(m.quote.author)}</b><span>${esc(m.quote.text)}</span></blockquote>`:'';
 const editable=m.direction==='out'&&!m.mediaKind&&!!m.text&&Date.now()-Number(m.ts)<900000;
 return {quote,actions:m.waMessageId?`<div class="dw-message-tools"><button type="button" data-dw-reply="${esc(m.waMessageId)}" title="Ответить с цитатой">Ответить</button>${editable?`<button type="button" data-dw-edit="${esc(m.waMessageId)}" title="Изменить текст (до 15 минут)">Изменить</button>`:''}</div>`:'',edited:m.editedAt?' · изменено':''};
}
export function bindDealWaTools({pane,input,sendBtn,laterBtn,getState,request,refresh,status}){
 const bar=document.createElement('div');bar.className='dw-context';bar.hidden=true;bar.setAttribute('role','status');
 const emojis=document.createElement('div');emojis.className='dw-emojis';emojis.hidden=true;emojis.setAttribute('aria-label','Смайлики');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='dc-wa-attach';toggle.textContent='☺';toggle.title='Выбрать смайлик';toggle.setAttribute('aria-expanded','false');input.before(toggle);
 input.closest('.dc-wa-input-wrap').before(bar,emojis);
 for(const emoji of ['😀','😊','🙂','😉','😂','😍','🤔','😔','👍','👎','👏','🙌','🙏','🤝','❤️','✅','❗','🎉','📞','📅','⏰','📍','💬','🔥']){const b=document.createElement('button');b.type='button';b.textContent=emoji;b.setAttribute('aria-label',emoji);b.onclick=()=>{const start=input.selectionStart,end=input.selectionEnd;input.setRangeText(emoji,start,end,'end');input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();emojis.hidden=true;toggle.setAttribute('aria-expanded','false');};emojis.append(b);}
 toggle.onclick=()=>{emojis.hidden=!emojis.hidden;toggle.setAttribute('aria-expanded',String(!emojis.hidden));};
 function draw(){const s=getState();bar.replaceChildren();bar.hidden=!s?.reply&&!s?.edit;toggle.disabled=!s||!!s.sending;sendBtn.textContent=s?.edit?'Сохранить':'Отправить';laterBtn.disabled=!s||!!s.sending||!!s.edit||!!s.reply;const voice=pane.querySelector('#dc-wa-voice'),attach=pane.querySelector('#dc-wa-attach');if(voice)voice.disabled=!s||!!s.sending||!!s.edit||!!s.reply;if(attach)attach.disabled=!s||!!s.sending||!!s.edit;
  if(bar.hidden)return;const text=document.createElement('span');text.textContent=s.edit?'Редактирование сообщения':`Ответ ${s.reply.author||'клиенту'}: ${s.reply.text||'Вложение'}`;const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Отмена';cancel.onclick=()=>{if(s.edit){input.value=s.beforeEdit||'';s.draft=input.value;}s.edit=null;s.reply=null;draw();input.focus();};bar.append(text,cancel);
 }
 pane.addEventListener('click',e=>{const b=e.target.closest('[data-dw-reply],[data-dw-edit]');if(!b)return;const s=getState();if(!s||s.sending)return;const id=b.dataset.dwReply||b.dataset.dwEdit,m=s.messages?.get(id);if(!m)return;
  if(b.dataset.dwEdit){if(s.file){status.textContent='Уберите вложение перед редактированием.';return;}if(!s.edit)s.beforeEdit=input.value;s.edit=m;s.reply=null;input.value=m.text||'';}
  else{if(s.edit)input.value=s.beforeEdit||'';s.edit=null;s.reply={id,text:m.text||m.caption||m.mediaFileName||'Вложение',author:m.direction==='out'?'Вы':m.senderName||'Клиент'};}
  draw();input.focus();
 });
 pane.addEventListener('keydown',e=>{if(e.key==='Escape'&&!bar.hidden){bar.querySelector('button')?.click();e.stopPropagation();}});
 return {draw,reply:()=>getState()?.reply,clearReply(s){s.reply=null;draw();},async submitEdit(){const s=getState();if(!s?.edit)return false;if(s.sending)return true;const submitted=input.value,text=submitted.trim();if(!text){status.textContent='Введите текст сообщения';return true;}s.sending=true;draw();sendBtn.disabled=true;
  try{await request('/api/wa/edit',{chatId:s.canonicalChatId,messageId:s.edit.waMessageId,text});s.edit=null;s.draft=s.beforeEdit||'';if(getState()===s){if(input.value===submitted)input.value=s.draft;else s.draft=input.value;status.textContent='Запрос на изменение принят WhatsApp';await refresh();}}
  catch(e){status.textContent=e.message;}finally{s.sending=false;if(getState()===s){sendBtn.disabled=false;draw();input.focus();}}return true;}
 };
}
