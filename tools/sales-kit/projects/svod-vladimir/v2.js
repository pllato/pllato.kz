const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const tTag=k=>`<span class="srct" style="--sc:${TYP[k][1]}">${TYP[k][0]}</span>`;
const sTag=k=>tag(STS[k][0],STS[k][1]);
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
function openDoc(id){curDoc=id;go('doc')}

/* Пульт */
SC.dash=()=>`<div class="hd"><div><h2>Пульт руководителя · ${TODAY}</h2><p>Что ждёт вашего решения, какие поручения просрочены, что пришло и ушло за неделю, как растёт число договоров. Каждая цифра открывает список.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('approve')"><small>Ждут моего решения</small><b class="a">3</b><span>2 договора и приказ</span></div>
  <div class="clk" onclick="go('control')"><small>Поручений в работе</small><b>17</b><span>просрочено 2 · продлено 1</span></div>
  <div class="clk" onclick="go('journals')"><small>Входящих за неделю</small><b>23</b><span>исходящих 18</span></div>
  <div class="clk" onclick="go('registry')"><small>Договоров в октябре</small><b class="g">14</b><span>в сентябре 11 · +27%</span></div>
  <div class="clk" onclick="go('backup')"><small>Резервная копия</small><b class="g">✓ 03:00</b><span>второй сервер · 4,2 ГБ</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Договоры по месяцам</h3>${bars([['Май',8],['Июнь',10],['Июль',9],['Август',12],['Сентябрь',11],['Октябрь',14]])}
  <h3 style="margin-top:14px">Документы по видам за месяц</h3>${bars([['Входящие письма',86],['Исходящие письма',64],['Договоры',14],['Служебные записки',31],['Приказы',9],['Протоколы',4]])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="openDoc('ВХ-2026-0342')"><i></i><div><b>Претензия «СтройИнвест»: ответ до 24.10</b><span>поручение ОТК · ещё не исполнено</span></div></div>
  <div class="rf bad" onclick="go('control')"><i></i><div><b>2 поручения просрочены</b><span>снабжение и ОТК — продлить или снять</span></div></div>
  <div class="rf" onclick="openDoc('ДОГ-2026-118')"><i></i><div><b>ДОГ-2026-118 ждёт вашей подписи после финдиректора</b><span>поставка кабеля · 42 км</span></div></div>
  <div class="rf" onclick="openDoc('ПР-2026-065')"><i></i><div><b>Приказ об инвентаризации — на подписании</b><span>подготовлен 19.10</span></div></div></div></div>
 ${said('Хранение внутренних документов компании в режиме архива с созданием резервных копий, и в динамике — обеспечение внутреннего корпоративного документооборота')}`;

/* Реестр */
let rf='all',rq='';
SC.registry=()=>{let L=DOCS.slice();if(rf!=='all')L=L.filter(d=>d.t===rf);if(rq)L=L.filter(d=>(d.id+d.n+d.ca).toLowerCase().includes(rq.toLowerCase()));
 if(role==='Сотрудник')L=L.filter(d=>d.acc==='Все сотрудники'||d.a==='Ерлан');
 return `<div class="hd"><div><h2>Реестр документов</h2><p>Все документы компании одним списком: вид, номер, контрагент, автор, статус. Фильтр по виду, поиск по номеру, названию и тексту внутри файлов. Каждый видит только документы, к которым у него есть доступ.${role==='Сотрудник'?' Сейчас вы — сотрудник: видны общие документы и ваши.':''}</p></div><div class="btns"><button class="bt p" onclick="go('newdoc')">+ Документ</button></div></div>
 <div class="bz-ci" style="margin-bottom:8px"><input id="rq" value="${esc(rq)}" placeholder="Поиск: номер, название, контрагент, текст внутри документа" onkeydown="if(event.key==='Enter'){rq=this.value;render()}"><button class="bt p" onclick="rq=document.getElementById('rq').value;render()">Найти</button></div>
 <div class="seg"><a class="${rf==='all'?'on':''}" onclick="rf='all';render()">Все</a>${Object.keys(TYP).map(k=>`<a class="${rf===k?'on':''}" onclick="rf='${k}';render()">${TN(k)}</a>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Номер</th><th>Вид</th><th>Название</th><th>Контрагент</th><th>Автор</th><th>Дата</th><th>Статус</th></tr></thead><tbody>${L.map(d=>`<tr class="clk" onclick="openDoc('${d.id}')"><td class="mono"><b>${d.id}</b></td><td>${tTag(d.t)}</td><td><b>${esc(d.n)}</b>${d.pd?' '+tag('ПДн','r'):''}</td><td>${esc(d.ca)}</td><td>${d.a}</td><td class="mono">${d.d}</td><td>${sTag(d.st)}</td></tr>`).join('')||'<tr><td colspan="7" class="kempty">ничего не найдено</td></tr>'}</tbody></table></div></div>`};

/* Архив по папкам */
const TREE=[['Договоры',['Поставка','Купля-продажа','Услуги','Аренда'],0],['Корреспонденция',['Входящие','Исходящие'],0],['Распорядительные',['Основная деятельность','Личный состав'],0],['Корпоративные',['Решения участника','Протоколы совещаний'],1],['Внутренние',['Служебные записки','Положения и регламенты'],0],['Кадры',['Личные дела','Трудовые договоры'],2]];
let tf='Договоры / Поставка';
SC.nav=()=>{const L=DOCS.filter(d=>d.fold===tf);
 return `<div class="hd"><div><h2>Архив по папкам</h2><p>Путеводитель: разделы и папки, как в привычном проводнике. Замок — ограниченный доступ: папку видят только те, кому разрешил руководитель. Поиск работает по всему архиву сразу.</p></div></div>
 <div class="g2 bz-tree-g"><div class="pan bz-tree">${TREE.map(t=>`<div class="bz-tf"><b>${t[2]?'🔒 ':''}${t[0]}</b>${t[1].map(f=>{const p=t[0]+' / '+f;const c=DOCS.filter(d=>d.fold===p).length;return `<a class="${tf===p?'on':''}" onclick="tf='${p}';render()">${f}<em>${c||''}</em></a>`}).join('')}</div>`).join('')}</div>
 <div class="pan"><h3>${tf}</h3>${L.length?L.map(d=>`<div class="bz-file clk" onclick="openDoc('${d.id}')"><i>${d.t==='dog'?'DOC':'PDF'}</i><div><b>${d.id} · ${esc(d.n)}</b><span>${esc(d.ca)} · ${d.d} · версия ${d.v} · доступ: ${d.acc}</span></div>${sTag(d.st)}</div>`).join(''):tf.startsWith('Кадры')?`<div class="fc r"><b>Папка с персональными данными</b><span>доступ: отдел кадров и руководитель</span><em>Каждое открытие документа пишется в журнал.</em></div>`:'<p class="hint">В демо папка пустая.</p>'}
  <p class="hint">Архив хранит и старые документы: можно загрузить сканы пачкой и разложить по папкам.</p></div></div>
 ${said('Чтобы специалист, который имеет право доступа, зашёл и в интерфейсе увидел, как заходить: папка, раздел — какой-то путеводитель. И простейший поисковик')}`};

/* Карточка документа */
SC.doc=()=>{const d=DC(curDoc);
 return `<div class="hd"><div><h2>${d.id} · ${esc(d.n)}</h2><p>${TN(d.t)} · ${esc(d.ca)} · автор ${d.a} · ${d.d}.2026 · папка «${d.fold}» · версия ${d.v}</p></div><div class="btns"><button class="bt" onclick="go('registry')">← Реестр</button><button class="bt" onclick="act('Файл скачан. Скачивание записано в журнал действий.')">⬇ Скачать</button><button class="bt p" onclick="act('Поручение по документу: исполнитель, срок, текст. Исполнитель получит уведомление.')">+ Поручение</button></div></div>
 <div class="g2 g21"><div class="pan"><h3>Маршрут согласования</h3>${[['Автор · '+d.a,'отправил на согласование','14.10 10:12','ok'],['Юрист · Владимир','согласовано с замечанием: п. 6.2 — неустойка 0,1%','15.10 16:40','ok'],['Главный бухгалтер','согласовано','16.10 09:05','ok'],['Финансовый директор','на рассмотрении · срок 21.10','—','now'],['Руководитель','подписание','—','']].map((r,i)=>`<div class="bz-rt ${r[3]}"><i>${r[3]==='ok'?'✓':r[3]==='now'?'●':i+1}</i><div><b>${r[0]}</b><span>${r[1]}</span></div><em class="mono">${r[2]}</em></div>`).join('')}
  <h3 style="margin-top:14px">Версии</h3>${[['v3','16.10 11:20','Ерлан','исправлен п. 6.2 по замечанию юриста'],['v2','15.10 09:40','Ерлан','добавлена спецификация'],['v1','14.10 10:10','Ерлан','первая редакция']].map(v=>`<div class="kv"><span><b class="mono">${v[0]}</b> · ${v[3]}</span><b class="mono">${v[1]} · ${v[2]}</b></div>`).join('')}
  <h3 style="margin-top:14px">Комментарии</h3><div class="cm"><small>15.10 16:40 · Владимир · юрист</small>Пункт 6.2: неустойку снизить до 0,1% в день, не более 10% — как в типовой форме.</div><div class="cm"><small>16.10 11:22 · Ерлан</small>Исправил в версии 3.</div></div>
 <div class="pan"><h3>Доступ к документу</h3><div class="kv"><span>Видят</span><b>${d.acc}</b></div><div class="kv"><span>Могут редактировать</span><b>автор, юрист</b></div><div class="kv"><span>Могут скачивать</span><b>руководство, юрист</b></div><div class="btns l"><button class="bt sm" onclick="go('access')">Изменить доступ</button></div>
  <h3 style="margin-top:12px">След документа</h3>${[['16.10 11:20','Ерлан','загрузил версию 3'],['16.10 09:05','Гл. бухгалтер','согласовал'],['15.10 16:40','Владимир','замечание к п. 6.2'],['15.10 14:02','Финдиректор','открыл документ'],['14.10 10:12','Ерлан','создал и отправил на согласование']].map(e=>`<div class="evt"><span class="mono">${e[0]}</span><b>${e[1]}</b><span>${e[2]}</span></div>`).join('')}</div></div>
 ${said('Функция согласования документа с сохранением следов')}`};

/* Новый документ */
SC.newdoc=()=>`<div class="hd"><div><h2>Новый документ</h2><p>Выбираете вид — система подставляет папку, маршрут согласования и доступ по умолчанию. Можно загрузить свой файл или собрать документ из шаблона, если он есть. Номер присваивается по журналу регистрации сам.</p></div></div>
 <div class="g2 g21"><div class="pan"><div class="form"><label>Вид документа<select>${Object.keys(TYP).map(k=>`<option ${k==='dog'?'selected':''}>${TN(k)}</option>`).join('')}</select></label><label>Подвид<select><option>Поставка</option><option>Купля-продажа</option><option>Услуги</option><option>Аренда</option></select></label><label>Название<input value="Договор поставки кабеля АВВГ 4×16, 18 км"></label><label>Контрагент<input value="ТОО «ЭлектроСтрой-Сервис»"></label><label>Файл<input value="Договор_ЭлектроСтрой.docx  ·  или из шаблона «Поставка»"></label><label>Срок согласования<input value="23.10.2026"></label></div>
  <h3>Маршрут — подставлен для «Договор · Поставка»</h3><div class="bz-chain">${['Автор','Юрист','Главный бухгалтер','Финансовый директор','Руководитель'].map(x=>`<span>${x}</span>`).join('<i>→</i>')}</div>
  <div class="btns l" style="margin-top:12px"><button class="bt p" onclick="act('Документ ДОГ-2026-119 создан и отправлен на согласование. Юрист получил уведомление.')">Создать и отправить на согласование</button><button class="bt" onclick="act('Черновик сохранён — видите только вы.')">Сохранить черновик</button></div></div>
 <div class="pan"><h3>Доступ по умолчанию</h3><div class="kv"><span>Договорной отдел</span><b>просмотр, правка</b></div><div class="kv"><span>Бухгалтерия</span><b>просмотр</b></div><div class="kv"><span>Руководство</span><b>всё</b></div><div class="kv"><span>Остальные сотрудники</span><b class="neg">нет доступа</b></div><p class="hint">Автор может сузить доступ. Расширить — только руководитель или юрист.</p>
  ${tip('Шаблоны — по желанию','Для частых договоров (поставка, купля-продажа) можно завести шаблон с полями: контрагент, сумма, срок — документ соберётся сам. Главное — чтобы любой договор заводился как документ и проходил согласование.')}</div></div>`;
