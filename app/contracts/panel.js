import { apiFetch, getSession } from '../../pllato-kz-shared/pllato-api.js';
import { listContracts, getContract, createContract, fileToBase64, contractLink } from '../../contracts/api.js?v=20260916-2';
import { signatureCountLabel } from '../../contracts/participants.js?v=20261003-4';
import { projectContractsService } from './service.js?v=20261003-1';

const service = projectContractsService(apiFetch);
const allowed = () => String(getSession()?.user?.email || '').toLowerCase() === 'uurraa@gmail.com';
const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pendingKey = id => 'pllato.pending-project-contract:' + id;
let links = [];
let panel;
function remember(id, contract) {
  try { sessionStorage.setItem(pendingKey(id), JSON.stringify({id:contract.id, title:contract.title})); } catch {}
}
function forget(id) { try { sessionStorage.removeItem(pendingKey(id)); } catch {} }
function pending(id) {
  try { return JSON.parse(sessionStorage.getItem(pendingKey(id))); } catch { return null; }
}
function updateButtons() {
  document.querySelectorAll('[data-project-contracts]').forEach(button => {
    const count = links.filter(row => row.projectId === button.dataset.projectContracts).length;
    button.textContent = count ? `Договоры · ${count}` : 'Договор';
  });
}
export function installProjectContracts() {
  if (!allowed()) return;
  document.querySelectorAll('.tool-card[data-app-id][data-group="Работа с клиентами"]').forEach(card => {
    if (card.querySelector('[data-project-contracts]')) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'project-contract-button';
    button.dataset.projectContracts = card.dataset.appId; button.textContent = 'Договор';
    button.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      openProjectContracts(card.dataset.appId, card.querySelector('h3')?.textContent?.trim() || card.dataset.appId);
    });
    card.append(button);
  });
  service.links().then(rows => { links=rows; updateButtons(); }).catch(() => { /* окно покажет ошибку и повторит загрузку */ });
}
async function openProjectContracts(projectId, projectName) {
  if (!allowed() || panel) return;
  const dialog = document.createElement('dialog'); panel = dialog;
  dialog.className = 'project-contract-dialog';
  dialog.innerHTML = `<header><div><h2>Договоры</h2><p>${esc(projectName)}</p></div><button type="button" data-close aria-label="Закрыть">×</button></header>
    <p>Загрузите договор — он сохранится в реестре и будет прикреплён к этому проекту. Одну ссылку могут подписать все стороны.</p>
    <div data-status role="status" aria-live="polite">Загрузка…</div>
    <div data-list></div>
    <form data-upload><h3>Новый договор</h3>
      <label>Файл PDF или Word, до 15 МБ<input name="file" type="file" accept=".pdf,.doc,.docx" required></label>
      <label>Название<input name="title" maxlength="300" required placeholder="Название договора"></label>
      <button type="submit">Загрузить и получить ссылку</button>
    </form>
    <form data-attach><h3>Уже есть в реестре</h3><label>Договор<select name="contract" required><option value="">Выберите договор</option></select></label><button type="submit">Прикрепить к проекту</button></form>
    <footer><button type="button" data-refresh>Обновить</button><a href="/contracts.html" target="_blank" rel="noopener">Общий реестр договоров</a></footer>`;
  document.body.append(dialog); dialog.showModal();
  let busy = false, ready = false, contracts = [], recovery = pending(projectId);
  const message = (text, error=false) => { const node=dialog.querySelector('[data-status]'); node.textContent=text; node.className=error?'pc-error':''; };
  function controls() {
    dialog.querySelectorAll('button,input,select').forEach(node => { node.disabled = busy || (!ready && !node.matches('[data-close],[data-refresh]')); });
  }
  function close() { if (busy) return; dialog.close(); dialog.remove(); panel=null; }
  dialog.querySelector('[data-close]').onclick = close;
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  const upload = dialog.querySelector('[data-upload]');
  upload.elements.file.onchange = () => {
    const file=upload.elements.file.files[0];
    if (file) upload.elements.title.value=file.name.replace(/\.[^.]+$/, '').slice(0,300);
  };
  function render() {
    const attached = links.filter(row => row.projectId === projectId);
    dialog.querySelector('[data-list]').innerHTML = attached.length ? attached.map(row => {
      const contract=contracts.find(c => c.id===row.contractId);
      if (!contract) return `<article><h3>${esc(row.title)}</h3><p>Договор недоступен в реестре.</p></article>`;
      const url=contract.publicToken && contract.linkMode !== 'named' ? contractLink(contract.publicToken) : '';
      return `<article><h3>${esc(contract.title)}</h3><p>${esc(contract.fileName)} · ${contract.status==='cancelled'?'Отменён':signatureCountLabel(contract.signers,true)}</p>
        ${url ? `<label>Общая ссылка<input readonly value="${esc(url)}" aria-label="Ссылка на договор"></label><div class="pc-actions"><button type="button" data-copy="${esc(contract.id)}">Копировать ссылку</button><a href="${esc(url)}" target="_blank" rel="noopener">Открыть и подписать</a></div>` : '<p>Для именных ссылок откройте общий реестр.</p>'}</article>`;
    }).join('') : '<p class="pc-empty">К этому проекту ещё не прикреплены договоры.</p>';
    const select=dialog.querySelector('[data-attach] select');
    const previous=select.value;
    select.innerHTML='<option value="">Выберите договор</option>'+contracts.filter(c=>!attached.some(row=>row.contractId===c.id)).map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
    if(recovery && !attached.some(row=>row.contractId===recovery.id)) {
      select.value=recovery.id;
      message(`Договор «${recovery.title}» уже загружен. Нажмите «Прикрепить к проекту», чтобы завершить сохранение.`,true);
    } else { select.value=previous; recovery=null; forget(projectId); }
    updateButtons(); controls();
  }
  async function refresh() {
    if(busy) return;
    busy=true; controls(); message('Загрузка…');
    try {
      const [rows, result]=await Promise.all([service.links(),listContracts()]);
      links=rows; contracts=result.contracts || [];
      // Привязка живёт дольше последних 500 строк реестра.
      const missing=[...new Set([...rows.filter(r=>r.projectId===projectId).map(r=>r.contractId), ...(recovery?[recovery.id]:[])])].filter(id=>!contracts.some(c=>c.id===id));
      for(const id of missing) {
        try { const data=await getContract(id); contracts.push({...data.contract,signers:data.signers}); }
        catch(error) { if(error.status!==404) throw error; }
      }
      ready=true; message(''); render();
    } catch(error) { ready=false; message(error.message || 'Не удалось загрузить договоры. Нажмите «Обновить».',true); }
    finally { busy=false; controls(); }
  }
  async function attach(contract) {
    const relation=await service.attach(projectId,contract);
    links=links.filter(row=>row.id!==relation.id).concat(relation);
    recovery=null; forget(projectId); render();
    message('Договор прикреплён к проекту. Ссылку можно скопировать выше.');
  }
  upload.onsubmit=async event => {
    event.preventDefault(); if(busy || !ready) return;
    if(recovery) return message('Сначала прикрепите уже загруженный договор через список ниже.',true);
    const file=upload.elements.file.files[0]; const title=upload.elements.title.value.trim();
    if(!file || !title) return message('Выберите файл и укажите название.',true);
    if(!/\.(pdf|docx?)$/i.test(file.name) || !file.size || file.size>15*1024*1024) return message('Нужен непустой PDF или Word размером до 15 МБ.',true);
    busy=true; controls(); message('Загружаю договор…');
    try {
      const result=await createContract({title,fileName:file.name,fileMime:file.type || 'application/octet-stream',fileBase64:await fileToBase64(file)});
      if(!result.contract?.id) throw new Error('Сервер не вернул созданный договор. Проверьте общий реестр перед повторной загрузкой.');
      const contract={...result.contract,signers:result.signers || []};
      contracts.unshift(contract); recovery=contract; remember(projectId,contract);
      upload.reset();
      await attach(contract);
    } catch(error) {
      render(); message(recovery ? `Файл уже в реестре, но привязка не сохранена: ${error.message}. Выберите «Прикрепить к проекту» ниже — повторно загружать файл не нужно.` : `Не удалось подтвердить загрузку: ${error.message}. Нажмите «Обновить» и проверьте список договоров перед повторной загрузкой.`,true);
      if (!recovery) ready=false;
    } finally { busy=false; controls(); }
  };
  dialog.querySelector('[data-attach]').onsubmit=async event => {
    event.preventDefault(); if(busy || !ready) return;
    const contract=contracts.find(c=>c.id===event.target.elements.contract.value);
    if(!contract) return message('Выберите договор.',true);
    busy=true; controls();
    try { await attach(contract); } catch(error) { message(error.message,true); }
    finally { busy=false; controls(); }
  };
  dialog.addEventListener('click',async event => {
    const button=event.target.closest('[data-copy]'); if(!button) return;
    const contract=contracts.find(c=>c.id===button.dataset.copy); if(!contract?.publicToken) return;
    try { await navigator.clipboard.writeText(contractLink(contract.publicToken)); message('Ссылка скопирована.'); }
    catch { message('Не удалось скопировать автоматически. Выделите и скопируйте ссылку из поля.',true); }
  });
  dialog.querySelector('[data-refresh]').onclick=refresh;
  await refresh();
}
