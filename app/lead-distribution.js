export async function openLeadDistribution({pipelineId,stageId,stageName,users,baseUrl,getToken}) {
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog=document.createElement('dialog');dialog.className='lead-distribution-dialog';
  dialog.innerHTML=`<style>
    .lead-distribution-dialog{box-sizing:border-box;width:min(760px,calc(100vw - 24px));max-height:90dvh;padding:22px;border:1px solid var(--b1,#ddd);border-radius:16px;background:var(--s1,#fff);color:var(--t1,#17202c)}
    .lead-distribution-dialog::backdrop{background:#10182880}
    .lead-distribution-dialog header,.ld-footer{display:flex;gap:12px;align-items:center;justify-content:space-between}
    .lead-distribution-dialog h2{margin:0;font-size:20px}.lead-distribution-dialog p{font-size:13px;line-height:1.5;color:var(--t2,#586174)}
    .lead-distribution-dialog button,.lead-distribution-dialog select,.lead-distribution-dialog input[type=number]{font:inherit;box-sizing:border-box;min-height:40px;border:1px solid var(--b1,#ddd);border-radius:8px;padding:8px;background:var(--s2,#f8f9fb);color:inherit}
    .ld-row{display:grid;grid-template-columns:minmax(0,1fr) 85px minmax(0,1fr) 40px;gap:10px;padding:12px 0;border-bottom:1px solid var(--b1,#ddd)}
    .ld-row label{font-size:12px;display:flex;flex-direction:column;gap:5px;min-width:0}.ld-row select{width:100%}.ld-row small{color:var(--t2,#586174)}
    .ld-footer{position:sticky;bottom:-22px;background:var(--s1,#fff);padding:16px 0 4px;margin-top:12px}.ld-error{color:#bd2436;min-height:20px;font-size:13px}
    @media(max-width:540px){.lead-distribution-dialog{padding:16px}.ld-row{grid-template-columns:minmax(0,1fr) 75px 40px}.ld-row label:nth-child(3){grid-row:2;grid-column:1/3}.ld-row button{grid-column:3;grid-row:1}.ld-footer{bottom:-16px}}
  </style><header><h2>Распределение лидов</h2><button data-close aria-label="Закрыть">×</button></header>
  <p>${esc(stageName)} · настройки этой воронки</p><div data-content>Загрузка…</div>`;
  document.body.append(dialog);dialog.showModal();dialog.addEventListener('close',()=>dialog.remove());dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  const api=async(method,body)=>{
    const response=await fetch(`${baseUrl}/api/pipelines/${encodeURIComponent(pipelineId)}/lead-distribution`,{method,headers:{Authorization:`Bearer ${await getToken()}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Не удалось сохранить');return data;
  };
  try {
    const {config}=await api('GET');if(!dialog.isConnected)return;
    const list=Object.entries(users||{}).filter(([,u])=>u.active!==false&&u.active!==0).map(([uid,u])=>({uid,name:[u.lastName,u.name].filter(Boolean).join(' ')||u.email||uid})).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
    const options=(value,empty)=>`<option value="">${empty}</option>`+list.map(u=>`<option value="${esc(u.uid)}" ${u.uid===value?'selected':''}>${esc(u.name)}</option>`).join('');
    dialog.querySelector('[data-content]').innerHTML=`<label><input type="checkbox" data-enabled ${config.enabled?'checked':''}> Автоматически назначать менеджеров новым лидам</label>
      <p>В каждой строке выберите менеджера по лидам и менеджера КЭПов, который будет назначаться вместе с ним. Правило применяется к новым карточкам в этой стадии из всех источников. Старые назначения не меняются.</p>
      <label>Распределение <select data-mode><option value="equal">Поровну, по очереди</option><option value="weighted">По пропорциям</option></select></label>
      <div data-rows></div><button data-add style="margin-top:12px">+ Вариант назначения</button>
      <p>Можно указать одного менеджера по лидам в нескольких строках с разными менеджерами КЭПов. В режиме «Поровну» пары назначаются по очереди. Доли 2 и 1 означают ⅔ и ⅓ новых лидов.</p>
      <div class="ld-error" role="status" data-status></div><div class="ld-footer"><button data-cancel>Отмена</button><button data-save>Сохранить настройки</button></div>`;
    const mode=dialog.querySelector('[data-mode]');mode.value=config.mode;
    const rowsEl=dialog.querySelector('[data-rows]');
    const sync=()=>{
      const rows=[...rowsEl.children],weighted=mode.value==='weighted';
      const total=rows.reduce((n,row)=>n+(weighted?Number(row.querySelector('input').value)||0:1),0);
      rows.forEach(row=>{const inp=row.querySelector('input');inp.disabled=!weighted;row.querySelector('small').textContent=total?`${Math.round((weighted?Number(inp.value)||0:1)/total*1000)/10}% лидов`:'';});
    };
    const add=(r={})=>{
      const row=document.createElement('div');row.className='ld-row';row.innerHTML=`<label>Менеджер по лидам<select data-lead>${options(r.leadUid,'Выберите сотрудника')}</select></label><label>Доля<input aria-label="Доля лидов" type="number" min="1" max="100" step="1" value="${esc(r.weight||1)}"><small></small></label><label>Менеджер КЭПов<select data-kep>${options(r.kepUid,'Не назначать')}</select></label><button data-remove aria-label="Убрать менеджера">×</button>`;
      row.querySelector('[data-remove]').onclick=()=>{row.remove();sync();};row.querySelector('input').oninput=sync;rowsEl.append(row);sync();
    };
    (config.rows.length?config.rows:[{}]).forEach(add);mode.onchange=sync;
    dialog.querySelector('[data-add]').onclick=()=>{if(rowsEl.children.length<30)add();};dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
    dialog.querySelector('[data-save]').onclick=async()=>{
      const button=dialog.querySelector('[data-save]'),status=dialog.querySelector('[data-status]');button.disabled=true;status.textContent='Сохранение…';
      try {
        await api('PUT',{enabled:dialog.querySelector('[data-enabled]').checked,stageId,mode:mode.value,rows:[...rowsEl.children].filter(row=>dialog.querySelector('[data-enabled]').checked||row.querySelector('[data-lead]').value).map(row=>({leadUid:row.querySelector('[data-lead]').value,kepUid:row.querySelector('[data-kep]').value,weight:Number(row.querySelector('input').value)}))});
        dialog.close();
      }catch(e){status.textContent=e.message;button.disabled=false;}
    };
  }catch(e){dialog.querySelector('[data-content]').textContent=e.message;}
}
