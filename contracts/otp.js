// Код отправляется в WhatsApp; операторские SMS здесь не используются.
export function readSigningIdentity() {
  const name = document.querySelector('[data-f="name"]').value.trim();
  const input = document.querySelector('[data-f="phone"]');
  let phone = input.value.replace(/[\s()+-]/g,'');
  if (/^8\d{10}$/.test(phone)) phone='7'+phone.slice(1);
  if (!name) throw new Error('Укажите имя подписанта');
  if (!/^[1-9]\d{9,14}$/.test(phone)) throw new Error('Укажите телефон с кодом страны, например +7 777 123 45 67');
  return {name,phone:'+'+phone};
}
export function initOtp({contract,signApi,onDone}) {
  const $=s=>document.querySelector(s);
  const status=$('#sign-form-status');
  let identity,challenge=null,busy=false,retryAt=0;
  const showError=e=>{status.textContent=e.message || String(e);status.classList.add('error');};
  $('#btn-next').onclick=()=>{
    try {
      identity=readSigningIdentity();
      $('[data-f="phone"]').value=identity.phone;
      $('[data-f="name"]').readOnly=true;$('[data-f="phone"]').readOnly=true;
      $('#sign-methods').hidden=false;$('#btn-next').hidden=true;$('#btn-edit-identity').hidden=false;
      status.textContent='Выберите способ подписания';status.classList.remove('error');
    } catch(e){showError(e)}
  };
  $('#btn-edit-identity').onclick=()=>{
    if(busy)return;
    challenge=null;$('#otp-code').value='';$('#otp-consent').checked=false;
    $('#otp-panel').hidden=true;$('#sign-methods').hidden=true;$('#btn-next').hidden=false;$('#btn-edit-identity').hidden=true;
    $('[data-f="name"]').readOnly=false;$('[data-f="phone"]').readOnly=false;status.textContent='';
  };
  $('#btn-otp').onclick=()=>{if(busy)return;$('#otp-panel').hidden=false;$('#otp-recipient').textContent=identity.phone;};
  async function post(action,body) {
    const r=await fetch(signApi('/otp/'+action),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...identity,fileHash:contract.fileHash,...body})});
    const data=await r.json().catch(()=>null);
    if(!r.ok || !data?.ok)throw new Error(data?.error || 'Не удалось выполнить запрос. Попробуйте ещё раз.');
    return data;
  }
  function lock(value) {
    busy=value;
    for(const id of ['btn-otp-send','btn-otp-verify','btn-edit-identity','btn-sign','btn-egov','btn-otp']) $( '#'+id).disabled=value;
    if($('#btn-decline')) $('#btn-decline').disabled=value;
  }
  $('#btn-otp-send').onclick=async()=>{
    if(busy)return;
    if(Date.now()<retryAt)return showError(new Error('Повторная отправка через '+Math.ceil((retryAt-Date.now())/1000)+' сек.'));
    lock(true);status.classList.remove('error');status.textContent='Отправляем код в WhatsApp…';
    try {
      const data=await post('request',{});challenge=data.challengeId;retryAt=Date.now()+data.retryAfter*1000;
      $('#otp-entry').hidden=false;$('#otp-code').value='';$('#otp-code').focus();$('#btn-otp-send').textContent='Отправить повторно';
      status.textContent='Код отправлен в WhatsApp на '+data.phone+'. Действует 10 минут.';
    }catch(e){showError(e)}finally{lock(false)}
  };
  $('#btn-otp-verify').onclick=async()=>{
    if(busy)return;
    if(!challenge)return showError(new Error('Сначала запросите код'));
    if(!$('#otp-consent').checked)return showError(new Error('Подтвердите согласие с условиями договора'));
    const code=$('#otp-code').value.trim();if(!/^\d{6}$/.test(code))return showError(new Error('Введите шестизначный код'));
    lock(true);status.textContent='Проверяем код…';status.classList.remove('error');
    try {const data=await post('verify',{challengeId:challenge,code,consent:true});await onDone(data.signer);}
    catch(e){showError(e);lock(false)}
  };
}
