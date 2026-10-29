const $=id=>document.getElementById(id);let paused=false;
const time=t=>t?new Date(t).toLocaleString('ru-RU'):'ещё не отправлено';
function render(s){
  if(!s.ok){$('error').textContent=s.error;return;}
  $('setup').hidden=!!s.name;$('connected').hidden=!s.name;$('person').textContent=s.name;
  paused=s.paused;$('state').textContent=paused?'Учёт на паузе':'Учёт включён';$('pause').textContent=paused?'Продолжить учёт':'Пауза';
  for(const kind of ['codex','claude'])$(kind).textContent=s.services[kind].count;
  $('synced').textContent=`Отправлено на сервер: Codex — ${time(s.services.codex.lastSync)}; Claude — ${time(s.services.claude.lastSync)}.`;
  $('error').textContent=s.error;
}
async function send(message){
  const buttons=[...document.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  try{render(await chrome.runtime.sendMessage(message));}catch{$('error').textContent='Расширение перезапускается. Закройте и откройте это окно.';}finally{buttons.forEach(b=>b.disabled=false);}
}
$('setup').onsubmit=e=>{e.preventDefault();send({type:'setup',name:$('name').value});};
$('sync').onclick=()=>send({type:'sync'});$('pause').onclick=()=>send({type:'pause',paused:!paused});
send({type:'status'});
