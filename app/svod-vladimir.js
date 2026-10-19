/* СВОД — внутренний документооборот и архив производственной компании: реестр и папки с поиском, карточка документа с версиями и следом, маршруты согласования, поручения с исполнением, продлением и снятием, журналы регистрации, права доступа, настраиваемые руководителем, журнал действий и персональные данные, хранение и резервные копии на своих серверах. Все документы, контрагенты и люди вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='20.10.2026',NOW='12:00';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 14h34l16 16v56H26z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/><path d="M38 50h26M38 62h26M38 74h16" stroke="var(--brand2,#d08442)" stroke-width="7" stroke-linecap="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;

const SEC=[
 {k:'top',n:'Главное',sub:[['dash','Пульт руководителя']]},
 {k:'dc',n:'Документы',sub:[['registry','Реестр документов'],['nav','Архив по папкам'],['doc','Карточка документа'],['newdoc','Новый документ']]},
 {k:'ap',n:'Согласование и поручения',sub:[['approve','Мои согласования'],['routes','Маршруты согласования'],['tasks','Поручения'],['control','Контроль исполнения']]},
 {k:'rg',n:'Регистрация',sub:[['journals','Журналы регистрации']]},
 {k:'sc',n:'Безопасность',sub:[['access','Права доступа'],['audit','Журнал действий и ПДн'],['backup','Хранение и резервные копии']]},
 {k:'sys',n:'Запуск',sub:[['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'РК',n:'генеральный директор',note:'Всё: документы, согласования, поручения, права доступа',s:ALL.slice()},
 'Юрист':{av:'ЮР',n:'Владимир',note:'Договоры, согласования, корпоративные документы, права',s:['dash','registry','nav','doc','newdoc','approve','routes','tasks','journals','access','audit']},
 'Делопроизводитель':{av:'ДП',n:'Айгерим',note:'Регистрация входящих и исходящих, журналы, архив',s:['registry','nav','doc','newdoc','journals','tasks']},
 'Сотрудник':{av:'СТ',n:'Ерлан · отдел снабжения',note:'Свои документы, согласования и поручения',s:['registry','nav','doc','newdoc','approve','tasks']},
 'Администратор':{av:'АД',n:'ИТ',note:'Пользователи, резервные копии, журнал',s:['access','audit','backup']}
};
let role='Руководитель',cur='dash',theme='light';

const TYP={dog:['Договор','#2f6fb0'],in:['Входящее письмо','#1f8a5b'],out:['Исходящее письмо','#0a8aa0'],prk:['Приказ','#8a5a2b'],prot:['Протокол','#6b5bd3'],resh:['Решение участника','#b0413e'],sz:['Служебная записка','#6b7682'],pol:['Положение','#4f6f52']};
const TN=k=>TYP[k][0];
const STS={draft:['черновик',''],route:['на согласовании','w'],rework:['на доработке','r'],sign:['на подписании','i'],done:['подписан','g'],reg:['зарегистрирован','g'],exec:['на исполнении','w']};
let DOCS=[
 {id:'ДОГ-2026-118',t:'dog',n:'Договор поставки кабеля ВВГнг(А)-LS, 42 км',ca:'ТОО «ЭнергоМонтаж»',a:'Ерлан',d:'14.10',st:'route',fold:'Договоры / Поставка',acc:'Договорной отдел, руководство',pd:false,v:3},
 {id:'ДОГ-2026-117',t:'dog',n:'Договор купли-продажи медной катанки 8 мм',ca:'ТОО «МедьПром»',a:'Ерлан',d:'08.10',st:'done',fold:'Договоры / Купля-продажа',acc:'Договорной отдел, бухгалтерия, руководство',pd:false,v:2},
 {id:'ДОГ-2026-115',t:'dog',n:'Договор на поверку испытательного оборудования',ca:'ТОО «МетрологияСервис»',a:'Гульнара',d:'02.10',st:'rework',fold:'Договоры / Услуги',acc:'Договорной отдел, ОТК',pd:false,v:2},
 {id:'ВХ-2026-0342',t:'in',n:'Претензия по качеству партии кабеля КГ 3×2,5',ca:'ТОО «СтройИнвест»',a:'Айгерим',d:'16.10',st:'exec',fold:'Корреспонденция / Входящие',acc:'Руководство, ОТК, юрист',pd:false,v:1},
 {id:'ИСХ-2026-0211',t:'out',n:'Ответ на запрос сертификатов соответствия',ca:'АО «РегионЭнерго»',a:'Айгерим',d:'15.10',st:'reg',fold:'Корреспонденция / Исходящие',acc:'Все сотрудники',pd:false,v:1},
 {id:'ПР-2026-065',t:'prk',n:'О проведении годовой инвентаризации',ca:'—',a:'Гульнара',d:'19.10',st:'sign',fold:'Распорядительные / Основная деятельность',acc:'Все сотрудники',pd:false,v:1},
 {id:'ПР-2026-064',t:'prk',n:'Об утверждении графика отпусков на 2027 год',ca:'—',a:'Отдел кадров',d:'12.10',st:'done',fold:'Распорядительные / Личный состав',acc:'Отдел кадров, руководство',pd:true,v:1},
 {id:'ПРОТ-2026-12',t:'prot',n:'Протокол производственного совещания',ca:'—',a:'Гульнара',d:'13.10',st:'done',fold:'Корпоративные / Протоколы совещаний',acc:'Участники совещания',pd:false,v:1},
 {id:'РЕШ-2026-04',t:'resh',n:'Решение участника об утверждении годового бюджета',ca:'—',a:'Владимир',d:'05.10',st:'done',fold:'Корпоративные / Решения участника',acc:'Руководство, юрист',pd:false,v:2},
 {id:'СЗ-2026-0088',t:'sz',n:'О закупке изоляционного ПВХ-пластиката',ca:'—',a:'Ерлан',d:'17.10',st:'route',fold:'Внутренние / Служебные записки',acc:'Снабжение, руководство',pd:false,v:1},
 {id:'ПОЛ-2026-03',t:'pol',n:'Положение о защите персональных данных',ca:'—',a:'Владимир',d:'01.09',st:'done',fold:'Внутренние / Положения и регламенты',acc:'Все сотрудники',pd:false,v:4}
];
const DC=id=>DOCS.find(d=>d.id===id);
let curDoc='ДОГ-2026-118';
let AUDIT=[];
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
/* Мои согласования */
let APQ=[['ДОГ-2026-118','Договор поставки кабеля ВВГнг(А)-LS, 42 км','Ерлан','21.10','подписание после финдиректора'],['ПР-2026-065','О проведении годовой инвентаризации','Гульнара','21.10','подписание'],['СЗ-2026-0088','О закупке изоляционного ПВХ-пластиката','Ерлан','22.10','согласование']];
SC.approve=()=>`<div class="hd"><div><h2>Мои согласования</h2><p>Всё, что ждёт вашего решения, в одном списке со сроками. Согласовать, вернуть на доработку с замечанием или отклонить — решение и комментарий сохраняются в следе документа навсегда.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Автор</th><th>Срок</th><th>Этап</th><th>Решение</th></tr></thead><tbody>${APQ.map((r,i)=>`<tr><td><a class="clk" onclick="openDoc('${r[0]}')"><b class="mono">${r[0]}</b></a><br>${esc(r[1])}</td><td>${r[2]}</td><td class="mono">${r[3]}</td><td>${r[4]}</td><td>${r[5]?tag(r[5],r[5]==='согласовано'?'g':'r'):`<button class="bt sm p" onclick="apDo(${i},'согласовано')">Согласовать</button> <button class="bt sm" onclick="apDo(${i},'на доработку')">На доработку</button>`}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Как согласует руководитель</h3><div class="kv"><span>С компьютера и с телефона</span><b>да</b></div><div class="kv"><span>Подпись ЭЦП при согласовании</span><b>по желанию</b></div><div class="kv"><span>Напоминание, если срок подходит</span><b>за день</b></div><div class="kv"><span>Замещение на время отпуска</span><b>назначается</b></div></div>
 <div class="pan"><h3>Согласовано за октябрь</h3>${bars([['В срок',41],['С замечаниями',9],['Просрочено',2]])}</div></div>`;
function apDo(i,v){APQ[i][5]=v;render();toast(v==='согласовано'?'Согласовано. Документ ушёл на следующий этап, автор получил уведомление.':'Возвращено автору с замечанием. Комментарий сохранён в следе документа.')}

/* Маршруты */
SC.routes=()=>`<div class="hd"><div><h2>Маршруты согласования</h2><p>Для каждого вида документа — свой маршрут: кто и в каком порядке согласует, сколько дней на этап. Руководитель или юрист меняют маршрут сами, без программиста. Можно согласовывать последовательно или параллельно.</p></div><div class="btns"><button class="bt p" onclick="act('Новый маршрут: вид документа, этапы, сроки.')">+ Маршрут</button></div></div>
 <div class="pan">${[['Договор · поставка, купля-продажа',['Автор','Юрист · 2 дн.','Главный бухгалтер · 1 дн.','Финансовый директор · 2 дн.','Руководитель · подпись']],['Договор · услуги, аренда',['Автор','Юрист · 2 дн.','Руководитель · подпись']],['Приказ',['Автор','Юрист · 1 дн.','Руководитель · подпись','Ознакомление сотрудников']],['Исходящее письмо',['Исполнитель','Руководитель отдела','Делопроизводитель · регистрация']],['Решение участника',['Юрист','Участник · подпись','Ограниченный доступ']],['Служебная записка',['Автор','Руководитель отдела','Руководитель']]].map(r=>`<div class="bz-rrow"><b>${r[0]}</b><div class="bz-chain">${r[1].map(x=>`<span>${x}</span>`).join('<i>→</i>')}</div><a class="mvb" onclick="act('Маршрут открыт для правки: перетащите этапы, поменяйте сроки.')">изменить</a></div>`).join('')}</div>`;

/* Поручения */
const TCOL=[['new','Поставлено'],['work','В работе'],['ext','Продлено'],['done','Исполнено'],['off','Снято']];
let TASKS=[
 {id:'ПОР-301',n:'Подготовить ответ на претензию «СтройИнвест»',doc:'ВХ-2026-0342',who:'ОТК · Мурат',by:'Руководитель',due:'24.10',st:'work',late:false},
 {id:'ПОР-298',n:'Согласовать с поставщиком график отгрузки меди',doc:'ДОГ-2026-117',who:'Снабжение · Ерлан',by:'Руководитель',due:'15.10',st:'work',late:true},
 {id:'ПОР-295',n:'Провести инвентаризацию склада готовой продукции',doc:'ПР-2026-065',who:'Склад · Арман',by:'Руководитель',due:'01.11',st:'new',late:false},
 {id:'ПОР-290',n:'Обновить сертификаты на кабель КГ',doc:'ПРОТ-2026-12',who:'ОТК · Мурат',by:'Совещание 13.10',due:'10.11',st:'ext',late:false,ext:'было 20.10 → 10.11 · ждём лабораторию'},
 {id:'ПОР-287',n:'Ознакомить сотрудников с положением о ПДн',doc:'ПОЛ-2026-03',who:'Отдел кадров',by:'Юрист',due:'30.09',st:'done',late:false},
 {id:'ПОР-284',n:'Подобрать второго поставщика пластиката',doc:'ПРОТ-2026-12',who:'Снабжение · Ерлан',by:'Совещание 13.10',due:'16.10',st:'work',late:true},
 {id:'ПОР-280',n:'Арендовать дополнительный склад',doc:'СЗ-2026-0071',who:'АХО',by:'Руководитель',due:'—',st:'off',late:false,ext:'снято: склад не нужен после инвентаризации'}
];
SC.tasks=()=>`<div class="hd"><div><h2>Поручения</h2><p>Поручение ставится из документа, протокола или отдельно: исполнитель, срок, текст. Исполнитель отмечает исполнение и прикладывает результат. Срок можно продлить или снять поручение — с причиной. Всё остаётся в следе.</p></div><div class="btns"><button class="bt p" onclick="act('Новое поручение: исполнитель, срок, документ-основание.')">+ Поручение</button></div></div>
 <div class="kb k5">${TCOL.map(c=>`<div class="kc" style="--sc:${c[0]==='done'?'#1f8a5b':c[0]==='off'?'#7a8792':c[0]==='ext'?'#b0731a':'#2f6fb0'}"><div class="kh"><b>${c[1]}</b><span>${TASKS.filter(t=>t.st===c[0]).length}</span></div>${TASKS.filter(t=>t.st===c[0]).map(t=>`<div class="kd ${t.late?'alarm':''}" onclick="${t.doc.startsWith('СЗ-2026-0071')?'':`openDoc('${t.doc}')`}"><div class="kt"><b>${t.id}</b><span class="src mono ${t.late?'neg':''}">до ${t.due}</span></div><div class="kr">${esc(t.n)}</div><div class="km">${t.who} · от: ${t.by}</div>${t.ext?`<div class="km">${esc(t.ext)}</div>`:''}${['new','work','ext'].includes(t.st)?`<div class="kf"><a class="mvb" onclick="event.stopPropagation();tkDo('${t.id}','done')">исполнено</a><a class="mvb" onclick="event.stopPropagation();tkDo('${t.id}','ext')">продлить</a><a class="mvb" onclick="event.stopPropagation();tkDo('${t.id}','off')">снять</a></div>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>
 ${said('Функция поручения выполнения задания — тоже с сохранением следов, с отметками об исполнении, продлении срока или снятии')}`;
function tkDo(id,s){const t=TASKS.find(x=>x.id===id);t.st=s;t.late=false;if(s==='ext'){t.ext='продлено на 7 дней · причина записана';}if(s==='off')t.ext='снято · причина записана';render();toast(s==='done'?'Отмечено исполнение. Постановщик получил уведомление.':s==='ext'?'Срок продлён, причина сохранена в следе.':'Поручение снято, причина сохранена.')}

/* Контроль исполнения */
SC.control=()=>`<div class="hd"><div><h2>Контроль исполнения</h2><p>По каждому исполнителю и отделу: сколько поручений в работе, исполнено в срок, просрочено, продлено. Руководитель видит, где буксует, не собирая отчёты.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Исполнитель</th><th>В работе</th><th>Исполнено в срок</th><th>Просрочено</th><th>Продлено</th><th>Снято</th></tr></thead><tbody>${[['Снабжение · Ерлан',4,12,2,1,0],['ОТК · Мурат',3,9,0,1,0],['Склад · Арман',2,6,0,0,0],['Отдел кадров',1,8,0,0,0],['АХО',1,3,0,0,1],['Бухгалтерия',2,10,0,1,0]].map(r=>`<tr class="${r[3]?'rowbad':''}"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono ${r[3]?'neg':''}">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono">${r[5]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Просрочено</h3>${TASKS.filter(t=>t.late).map(t=>`<div class="fc r"><b>${t.id} · ${esc(t.n)}</b><span>${t.who} · срок был ${t.due}</span></div>`).join('')||'<p class="hint">Просрочек нет.</p>'}</div><div class="pan"><h3>Исполнение в срок, %</h3>${bars([['Август',91,'91%'],['Сентябрь',88,'88%'],['Октябрь',93,'93%']])}</div></div>`;

/* Журналы */
SC.journals=()=>`<div class="hd"><div><h2>Журналы регистрации</h2><p>Входящие, исходящие, приказы, договоры, протоколы — каждый со своей нумерацией. Делопроизводитель регистрирует входящее письмо: скан, отправитель, дата, кому — и сразу ставит поручение. Номер исходящего присваивается при отправке.</p></div><div class="btns"><button class="bt p" onclick="act('Регистрация входящего: скан, отправитель, исх. № и дата, адресат, резолюция.')">+ Зарегистрировать входящее</button></div></div>
 <div class="seg"><a class="on">Входящие</a><a onclick="act('Журнал исходящих.')">Исходящие</a><a onclick="act('Журнал приказов.')">Приказы</a><a onclick="act('Журнал договоров.')">Договоры</a><a onclick="act('Журнал протоколов и решений.')">Протоколы и решения</a></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Рег. №</th><th>Дата</th><th>Отправитель</th><th>Исх. № отправителя</th><th>Краткое содержание</th><th>Резолюция</th></tr></thead><tbody>${[['ВХ-2026-0342','16.10','ТОО «СтройИнвест»','№ 118 от 15.10','Претензия по качеству партии КГ 3×2,5','ОТК — ответ до 24.10'],['ВХ-2026-0341','16.10','Департамент госдоходов','№ 4-12/880','Уведомление о камеральном контроле','Бухгалтерия — до 30.10'],['ВХ-2026-0340','15.10','АО «РегионЭнерго»','№ 77','Запрос сертификатов соответствия','ОТК — исполнено'],['ВХ-2026-0339','15.10','ТОО «МедьПром»','№ 312','Изменение графика поставки катанки','Снабжение — к сведению'],['ВХ-2026-0338','14.10','Акимат района','№ 01-08/2214','Приглашение на встречу производителей','Руководитель']].map(r=>`<tr><td class="mono"><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td>${r[2]}</td><td class="mono">${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Переписка, которая поступает извне и уходит вовне, — официальная, не WhatsApp. Договоры, решения органов управления, протоколы, приказы')}`;
/* Права доступа */
const GR=['Руководство','Юрист','Бухгалтерия','Договорной отдел','Снабжение','ОТК','Отдел кадров','Все сотрудники'];
const FD=['Договоры','Корреспонденция','Приказы по основной деятельности','Приказы по личному составу','Решения участника','Протоколы совещаний','Служебные записки','Кадры · личные дела'];
let MX={};const L0={'Руководство':'w','Юрист':'w'};
FD.forEach((f,i)=>GR.forEach(g=>{let v=L0[g]||'';if(!v){if(g==='Все сотрудники')v=['Служебные записки','Приказы по основной деятельности'].includes(f)?'r':'';else if(g==='Бухгалтерия')v=['Договоры','Корреспонденция'].includes(f)?'r':'';else if(g==='Договорной отдел')v=f==='Договоры'?'w':f==='Корреспонденция'?'r':'';else if(g==='Снабжение')v=['Договоры','Служебные записки'].includes(f)?'r':'';else if(g==='ОТК')v=f==='Корреспонденция'?'r':'';else if(g==='Отдел кадров')v=['Приказы по личному составу','Кадры · личные дела'].includes(f)?'w':''}if(g==='Юрист'&&f==='Кадры · личные дела')v='r';MX[f+'|'+g]=v}));
const MXN={'':['—','нет доступа'],r:['👁','просмотр'],w:['✎','просмотр и правка']};
SC.access=()=>`<div class="hd"><div><h2>Права доступа</h2><p>Руководитель сам решает, кто что видит: нажатие по клетке переключает «нет доступа → просмотр → правка». Без программиста и без настроек в коде. Права можно задать на папку, на вид документа или на один конкретный документ. Каждое изменение прав — в журнале.</p></div><div class="btns"><button class="bt" onclick="act('Пользователи: добавить сотрудника, назначить отдел, отключить уволенного — его документы остаются в архиве.')">Пользователи · 23</button></div></div>
 <div class="pan"><div class="tw"><table class="t mx bz-mx"><thead><tr><th>Папка</th>${GR.map(g=>`<th class="c">${g}</th>`).join('')}</tr></thead><tbody>${FD.map(f=>`<tr><td><b>${['Приказы по личному составу','Решения участника','Кадры · личные дела'].includes(f)?'🔒 ':''}${f}</b></td>${GR.map(g=>{const v=MX[f+'|'+g];return `<td class="c"><a class="bz-cell ${v}" title="${MXN[v][1]}" onclick="mxT('${f}','${g}')">${MXN[v][0]}</a></td>`}).join('')}</tr>`).join('')}</tbody></table></div><p class="hint">👁 просмотр · ✎ просмотр и правка · — нет доступа. Скачивание и печать можно запретить отдельно.</p></div>
 ${said('Права доступа мог определять руководитель — не внутренними настройками программирования, а с помощью интерфейса: предоставлять или исключать права доступа')}`;
function mxT(f,g){const k=f+'|'+g,c=['','r','w'];MX[k]=c[(c.indexOf(MX[k])+1)%3];render();toast(`${g} · «${f}»: ${MXN[MX[k]][1]}. Изменение записано в журнал.`)}

/* Журнал и ПДн */
SC.audit=()=>`<div class="hd"><div><h2>Журнал действий и персональные данные</h2><p>Каждое действие с документом записывается: кто открыл, скачал, изменил, согласовал, поменял права. Документы с персональными данными помечены — их открытие видно отдельно. Журнал нельзя изменить или удалить даже администратору.</p></div><div class="btns"><button class="bt" onclick="act('Журнал за период — выгрузка в Excel для проверки.')">Выгрузить журнал</button></div></div>
 <div class="wid"><div><small>Документов с ПДн</small><b>148</b><span>кадры, личный состав</span></div><div><small>Открытий ПДн за неделю</small><b>12</b><span>все — отдел кадров и руководитель</span></div><div><small>Попыток без доступа</small><b class="a">1</b><span>отклонено · руководитель уведомлён</span></div><div><small>Изменений прав</small><b>3</b><span>за октябрь</span></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Документ</th></tr></thead><tbody>${[['20.10 11:42','Владимир','согласовал с замечанием','ДОГ-2026-118'],['20.10 11:05','Отдел кадров','открыл (ПДн)','Личное дело · Сериков А.'],['20.10 10:31','Ерлан','попытка открыть — нет доступа','Кадры · личные дела'],['20.10 09:58','Руководитель','изменил права: Снабжение → просмотр','Договоры'],['20.10 09:40','Айгерим','зарегистрировала','ВХ-2026-0342'],['19.10 18:22','Финдиректор','скачал','ДОГ-2026-117'],['19.10 03:00','Система','резервная копия на второй сервер','весь архив']].map(r=>`<tr class="${r[2].startsWith('попытка')?'rowbad':''}"><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Защита персональных данных</h3><div class="kv"><span>Доступ к ПДн — только по правам</span><b class="pos">✓</b></div><div class="kv"><span>Метка «ПДн» на документе и папке</span><b class="pos">✓</b></div><div class="kv"><span>Журнал каждого открытия ПДн</span><b class="pos">✓</b></div><div class="kv"><span>Запрет скачивания и печати</span><b class="pos">по выбору</b></div><div class="kv"><span>Хранение на серверах компании</span><b class="pos">✓</b></div><div class="kv"><span>Шифрованное соединение и резервные копии</span><b class="pos">✓</b></div><div class="kv"><span>Вход с подтверждением кодом</span><b class="pos">по выбору</b></div><p class="hint">Помогает выполнять требования закона РК «О персональных данных и их защите»; это можно показывать партнёрам как преимущество.</p></div></div>
 ${said('Защита персональных данных через права доступа — и чтобы было видно, что есть элементы, которые обеспечивают сохранность персональных данных')}`;

/* Хранение */
SC.backup=()=>`<div class="hd"><div><h2>Хранение и резервные копии</h2><p>Система стоит на серверах, которые принадлежат компании. Основной сервер и резервный — в разных местах, копия каждую ночь. Раз в месяц проверяем, что из копии всё восстанавливается. Своей серверной в офисе не нужно — без затрат на железо, свет и интернет.</p></div></div>
 <div class="g2"><div class="pan"><h3>Серверы компании</h3><div class="bz-srv"><div><b>Основной</b><span>облачный сервер на вашу компанию</span><em class="pos">работает · 4,2 ГБ из 10 ГБ</em></div><i>⇄</i><div><b>Резервный</b><span>второй сервер у другого провайдера</span><em class="pos">копия 20.10 в 03:00 ✓</em></div></div>
  <div class="kv"><span>Резервное копирование</span><b>каждую ночь · храним 30 копий</b></div><div class="kv"><span>Проверка восстановления</span><b>ежемесячно · последняя 01.10 ✓</b></div><div class="kv"><span>Можно перенести на свой сервер в офисе</span><b>в любой момент</b></div></div>
 <div class="pan"><h3>Расходы на хранение</h3><div class="kv"><span>Сервер до 10 ГБ</span><b>бесплатно</b></div><div class="kv"><span>Если документов станет больше</span><b>5–10 $ в месяц</b></div><div class="kv"><span>Абонплата за систему</span><b>нет</b></div><div class="kv"><span>Если не заплатили — данные пропадут?</span><b class="pos">нет, система ваша</b></div>${tip('Почему не Битрикс','В подписочных системах при задержке оплаты доступ прерывается. Здесь программа и данные принадлежат компании: ничего не отключится.')}</div></div>
 ${said('Размещение на внутренних системах и серверах корпорации, и как альтернатива — коннектор с облаком')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки: документооборот и архив пишем с нуля под компанию. Не коробка — код и данные принадлежат вам. Каждый экран утверждаем вместе; 20–30% объёма оставляем в запасе на ваши идеи на этапе полировки.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>1 500 000 ₸</b><span>один раз · без абонплаты · код ваш</span></div><div><small>Срок</small><b>4–6 недель</b><span>демо → ядро → полировка</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>150 000 ₸</b><span>при подписании</span></div><div><small>Ядро · 45%</small><b>675 000 ₸</b><span>после утверждения основного</span></div><div><small>Сдача · 45%</small><b>675 000 ₸</b><span>после полировки и запуска</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3><div class="kv"><span>Реестр, папки, поиск, карточка с версиями и следом</span><b>✓</b></div><div class="kv"><span>Согласование, маршруты, поручения, контроль</span><b>✓</b></div><div class="kv"><span>Журналы регистрации, права доступа, журнал действий, ПДн</span><b>✓</b></div><div class="kv"><span>Два сервера и резервные копии</span><b>✓</b></div><div class="kv"><span>Обучение, пилотный период, прямая линия</span><b>✓</b></div></div>
 <div class="pan"><h3>Второй этап, по желанию</h3><div class="kv"><span>Обмен с 1С: договоры и документы — в бухгалтерию</span><b>800 000 ₸</b></div><div class="kv"><span>Новые модули на основе системы</span><b>предложим, решаете вы</b></div><p class="hint">3 месяца после сдачи — бесплатно исправляем ошибки.</p></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const d=DOCS.find(x=>(x.id+x.n+x.ca).toLowerCase().includes(v));if(d&&v){openDoc(d.id);return}toast('Ищите по номеру, названию или контрагенту: «ДОГ-2026-118», «претензия», «МедьПром».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">СВОД</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='approve'?'<em>'+APQ.filter(r=>!r[5]).length+'</em>':x[0]==='tasks'&&TASKS.some(t=>t.late)?'<em>'+TASKS.filter(t=>t.late).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['registry','Реестр'],['nav','Архив'],['approve','Согласовать'],['tasks','Поручения']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'СВОД';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: что ждёт решения, просроченные поручения, динамика договоров.'],
 ['registry','2 · Реестр всех документов с поиском по тексту.'],
 ['nav','3 · Архив по папкам — путеводитель, замок на закрытых папках.'],
 ['doc','4 · Карточка документа: маршрут, версии, комментарии, след.'],
 ['approve','5 · Мои согласования: согласовать или вернуть с замечанием.'],
 ['tasks','6 · Поручения: исполнено, продлено, снято — со следом.'],
 ['journals','7 · Журналы регистрации входящих и исходящих.'],
 ['access','8 · Права доступа — руководитель меняет сам, нажатием.'],
 ['audit','9 · Журнал действий и персональные данные.'],
 ['backup','10 · Два сервера компании и резервные копии каждую ночь.'],
 ['launch','11 · Стоимость: 1,5 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
