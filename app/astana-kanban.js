const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function compactAstanaCard(d,{phone,responsible,stageColor,comment,unread=0,missed=0}){
 const id=d.bitrixId||String(d.id||'').replace(/^deal_/,''),cf=d.customFields||{};
 const date=cf.trialLessonAt?new Date(cf.trialLessonAt):null;
 const trial=date&&!isNaN(date)?date.toLocaleString('ru-RU',{timeZone:'Asia/Almaty',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
 const source=cf.astanaSource||d.sourceDescription||'Источник не указан';
 return `<div class="kanban-card astana-compact-card" draggable="true" data-deal-id="${esc(id)}" data-stage="${esc(d.stageId)}" style="border-left:3px solid ${esc(stageColor)}">
 <div class="astana-compact-title"><strong title="${esc(d.title)}">${esc(d.title||'Без имени')}</strong>${missed?`<b class="astana-missed" title="Пропущенные звонки">☎ ${esc(missed)}</b>`:''}${unread?`<b class="astana-unread" title="Непрочитанные сообщения">${esc(unread)}</b>`:''}</div>
 <div class="astana-compact-line"><span>${esc(phone||'Телефон не указан')}</span><span title="Источник: ${esc(source)}">${esc(source)}</span></div>
 <div class="astana-compact-line"><span title="Ответственный: ${esc(responsible)}">${esc(responsible||'Не назначен')}</span>${trial?`<time class="astana-trial" title="Пробный урок · время Алматы">${esc(trial)}</time>`:''}</div>
 ${comment?`<div class="astana-comment" title="${esc(comment.authorName||'')} · ${esc(comment.text)}">${esc(comment.authorName?comment.authorName.split(' ')[0]+': ':'')}${esc(comment.text)}</div>`:''}
 <div class="astana-compact-actions"><button class="kca-btn kca-wa" data-action="wa" data-phone="${esc(phone)}" data-deal-id="${esc(id)}" title="Написать в WhatsApp" aria-label="Написать в WhatsApp">💬</button><button class="kca-btn kca-call" data-action="call" data-phone="${esc(phone)}" data-deal-id="${esc(id)}" title="Позвонить" aria-label="Позвонить">📞</button><button class="kca-btn" data-action="stage" data-deal-id="${esc(id)}" title="Сменить стадию" aria-label="Сменить стадию">→</button></div></div>`;
}
export function fitAstanaBoard(board){
 if(window.__astanaBoardResize)window.removeEventListener('resize',window.__astanaBoardResize);
 const fit=()=>{if(!board.isConnected)return;board.style.setProperty('--astana-board-height',Math.max(260,window.innerHeight-board.getBoundingClientRect().top-24)+'px');};
 window.__astanaBoardResize=fit;window.addEventListener('resize',fit,{passive:true});requestAnimationFrame(fit);
}
