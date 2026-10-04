
/* ===== ИИ-шаблоны ===== */
let aiTpl='T1',aiGen=false,aiChecked=false;
function aiFor(rid){const r=RQ(rid);curCl=r.cl;aiTpl={hr:'T1',law:'T4',tax:'T7',buh:'T8'}[r.dir];if(r.id==='R-1032')aiTpl='T1';aiGen=false;aiChecked=false;if(allowed('ai')){cur='ai';build()}else toast('Шаблоны доступны специалистам.')}
const AIVAL={T1:{'ФИО работника':'Ахметова Дана Ериковна','Должность':'Бариста','Оклад':'250 000 ₸','Дата начала':'05.10.2026','Испытательный срок':'3 месяца'},T4:{'Контрагент':'ТОО «Алем Сервис»','Предмет':'уборка помещений','Сумма':'180 000 ₸ в месяц','Сроки':'01.11.2026 – 31.10.2027'},T7:{'Номер уведомления':'№ 4471 от 28.09.2026','Период':'2 квартал 2026','Суть расхождения':'ЭСФ отозваны поставщиками после оплаты'},T8:{'Покупатель':'по клиенту','Услуги':'по заявке','Сумма':'по тарифу'}};
function aiRun(){aiGen=true;aiChecked=false;render();toast('Черновик готов за 6 секунд. Жёлтым — что подставлено из карточки клиента, синим — что предложил ИИ. Проверьте и отметьте «проверено».')}
SC.ai=()=>{const t=TPLS.find(x=>x.id===aiTpl)||TPLS[0],c=CL(curCl)||CLIENTS[0],V=AIVAL[t.id]||{};
 return `<div class="hd"><div><h2>ИИ-шаблоны документов</h2><p>Специалист выбирает шаблон и клиента, пишет в двух словах, что нужно. Реквизиты подставляются из карточки клиента, ИИ дописывает условия под ситуацию. Документ уходит клиенту только после отметки «проверено специалистом».</p></div></div>
 <div class="g12"><div><div class="pan"><h3>1 · Шаблон</h3>${TPLS.map(x=>`<div class="tpr ${x.id===t.id?'on':''}" onclick="aiTpl='${x.id}';aiGen=false;render()">${dirm(x.dir)}<b>${esc(x.n)}</b><em>${x.used}</em></div>`).join('')}</div></div>
 <div><div class="pan"><h3>2 · Клиент и задача</h3><div class="form"><label>Клиент<select onchange="curCl=this.value;aiGen=false;render()">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select></label><label>Из карточки клиента<input value="${esc(c.n)} · БИН ${c.bin} · ${esc(c.boss)}" readonly></label></div>
  <div class="form one"><label>Что нужно — своими словами<textarea id="aiq" rows="2">${t.id==='T1'?'Бариста в кофейню на Абая, сменный график 2/2, испытательный срок 3 месяца, материальная ответственность за кассу':t.id==='T7'?'Объяснить, что ЭСФ отозвали поставщики уже после оплаты, приложить платёжки и акты сверки':'Стандартные условия, оплата ежемесячно до 10 числа'}</textarea></label></div>
  <div class="form">${t.f.map(f=>`<label>${esc(f)}<input value="${esc(V[f]||'')}"></label>`).join('')}</div>
  <button class="bt p" onclick="aiRun()">Сгенерировать черновик</button></div>
 ${aiGen?`<div class="pan"><h3>3 · Черновик · ${esc(t.n)}</h3><div class="doc aidoc"><div class="dh"><div class="dlg">${esc(c.sh).toUpperCase()}<small>${esc(t.n).toUpperCase()}</small></div><div style="text-align:right;font-size:10px">№ 47<br>${dl(TODAY)}</div></div>
  ${t.id==='T7'?`<p><mark>${esc(c.n)}</mark>, БИН <mark>${c.bin}</mark>, в ответ на уведомление <mark>${esc(V['Номер уведомления'])}</mark> о расхождениях за <mark>${esc(V['Период'])}</mark> сообщает следующее.</p><p><span class="ai">Расхождения возникли в связи с тем, что ЭСФ были отозваны поставщиками после поступления оплаты. Факт поставки подтверждается актами сверки и платёжными поручениями (приложения 1–4).</span></p><p><span class="ai">Просим принять пояснения и считать расхождения устранёнными.</span></p>`
  :`<p><mark>${esc(c.n)}</mark>, БИН <mark>${c.bin}</mark>, в лице директора <mark>${esc(c.boss)}</mark>, и <mark>${esc(V['ФИО работника']||V['Контрагент']||'—')}</mark> заключили настоящий договор.</p><p>1. Работник принимается на должность <mark>${esc(V['Должность']||V['Предмет']||'—')}</mark> с <mark>${esc(V['Дата начала']||V['Сроки']||'—')}</mark>, оклад <mark>${esc(V['Оклад']||V['Сумма']||'—')}</mark>.</p><p>2. <span class="ai">Режим работы — сменный, по графику 2/2, с суммированным учётом рабочего времени.</span></p><p>3. <span class="ai">Работник несёт полную материальную ответственность за денежные средства кассы на основании отдельного договора.</span></p><p>4. Испытательный срок — <mark>${esc(V['Испытательный срок']||'не устанавливается')}</mark>.</p>`}
  <div class="legend"><span><i style="background:#fbe7a4"></i>из карточки клиента</span><span><i style="background:#d9e4ff"></i>предложено ИИ — проверить</span></div></div>
  <label class="chkl"><input type="checkbox" ${aiChecked?'checked':''} onchange="aiChecked=this.checked;render()"> Проверено специалистом: ${STAFF[ROLES[role].p]||'Мария'}</label>
  <div class="btns l" style="margin-top:10px"><button class="bt" onclick="toast('Скачан .docx — можно править вручную.')">Скачать .docx</button><button class="bt p ${aiChecked?'':'dis'}" onclick="${aiChecked?`toast('Отправлено клиенту на подпись ЭЦП — в кабинет и приложение.')`:`toast('Сначала отметьте «проверено специалистом».')`}">Отправить на подпись</button></div></div>`:''}</div></div>
 <div class="note"><b>Персональные данные не уходят в ИИ</b><p>ИИ получает обезличенную задачу («бариста, график 2/2, испытательный срок»). ФИО, ИИН, БИН и суммы подставляются уже на вашем сервере в Казахстане.</p></div>
 ${said('«Добавить фактор ИИ… шаблонные какие-то документы, чтобы была помощь для наших специалистов.»','По словам Платона, это входит в стандартный пакет — в портале.')}`};

/* ===== Архив и подпись ===== */
let DOCS=[
 {n:'Трудовой договор № 46 · Ахметов Б.',cl:'C7',dir:'hr',d:'2026-09-30',src:'ИИ-шаблон',sig:'both'},
 {n:'Приказ о приёме № 112-к',cl:'C7',dir:'hr',d:'2026-09-30',src:'ИИ-шаблон',sig:'client'},
 {n:'Замечания к договору аренды',cl:'C9',dir:'law',d:'2026-10-01',src:'Юрист',sig:'none'},
 {n:'Уведомление КГД № 4471',cl:'C3',dir:'tax',d:'2026-10-01',src:'Загружен клиентом',sig:'none'},
 {n:'Претензия № 12 · ТОО «Сункар Снаб»',cl:'C11',dir:'law',d:'2026-09-26',src:'ИИ-шаблон',sig:'both'},
 {n:'ФНО 910.00 · 1 полугодие',cl:'C13',dir:'buh',d:'2026-08-14',src:'Бухгалтер',sig:'both'},
 {n:'Счёт на оплату № 1024 · октябрь',cl:'C4',dir:'buh',d:'2026-10-01',src:'Автоматически',sig:'ours'},
 {n:'Соглашение о расторжении ТД',cl:'C3',dir:'hr',d:'2026-09-28',src:'ИИ-шаблон',sig:'both'}
];
const SIG={both:['Подписан обеими сторонами','#23935f'],client:['Ждёт подписи клиента','#c98a1b'],ours:['Подписан нами','#1f7aa8'],none:['Без подписи','#8a919c']};
function signDoc(i){DOCS[i].sig='both';render();toast('Подписано ЭЦП через NCALayer — документ с подписью сохранён в архиве клиента.')}
SC.docs=()=>{const L=DOCS.filter(d=>!myDir()||d.dir===myDir());
 return `<div class="hd"><div><h2>Архив документов и подпись</h2><p>Все документы клиентов — в одном архиве с поиском: что пришло от клиента, что сделали мы, что подписано ЭЦП и кем. Клиент подписывает в кабинете, без пересылки файлов в мессенджерах.</p></div><div class="btns"><button class="bt" onclick="toast('Поиск по названию, клиенту, типу и тексту документа.')">Поиск по архиву</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Клиент</th><th>Направление</th><th>Дата</th><th>Откуда</th><th>Подпись</th><th></th></tr></thead><tbody>${L.map(d=>{const i=DOCS.indexOf(d);return `<tr onclick="pickCl('${d.cl}')"><td><b>${esc(d.n)}</b></td><td>${esc(CL(d.cl).sh)}</td><td>${dirm(d.dir)}</td><td class="mono">${dd(d.d)}</td><td>${esc(d.src)}</td><td><span class="st" style="--sc:${SIG[d.sig][1]}">${SIG[d.sig][0]}</span></td><td>${d.sig==='client'?`<button class="bt sm p" onclick="event.stopPropagation();signDoc(${i})">Подписан</button>`:''}</td></tr>`}).join('')}</tbody></table></div>`};

/* ===== Библиотека ===== */
SC.tpl=()=>`<div class="hd"><div><h2>Библиотека шаблонов</h2><p>Шаблоны компании по направлениям. Загрузите свой .docx — поля для подстановки система найдёт сама; при изменении закона шаблон обновляется один раз для всех клиентов.</p></div><div class="btns"><button class="bt p" onclick="toast('Загрузите .docx: поля в фигурных скобках станут полями шаблона.')">+ Свой шаблон</button></div></div>
 <div class="tplg">${TPLS.map(t=>`<div class="tplc2" style="--c:${DIRS[t.dir].c}" onclick="aiTpl='${t.id}';aiGen=false;go('ai')">${dirm(t.dir)}<b>${esc(t.n)}</b><span>${t.f.length} ${plural(t.f.length,['поле','поля','полей'])}: ${t.f.join(', ')}</span><em>использован ${t.used} раз</em></div>`).join('')}</div>`;
