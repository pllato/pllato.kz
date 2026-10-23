/* Пульт: тревоги */
SC.alarm=()=>`<div class="hd"><div><h2>Тревоги сейчас</h2><p>Срабатывание тревожной кнопки или датчика приходит с оборудования на пульте прямо в систему: объект, адрес, тип тревоги, ключи и контакты. Дежурный назначает экипаж одной кнопкой — экипажу в приложение приходит вызов с координатами и маршрутом.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Объект</th><th>Тревога</th><th>Статус</th><th>Экипаж</th><th></th></tr></thead><tbody>${ALR.map((a,i)=>{const s=SD(a.sub);return `<tr class="${a.st==='new'?'rowbad':''}"><td class="mono"><b>${a.t}</b></td><td><b>${s.n}</b><br><small>${s.obj}</small></td><td>${a.type}</td><td>${tag(...AST[a.st])}</td><td>${a.crew||'—'}</td><td>${a.st==='new'?`<button class="bt p sm" onclick="aSend(${i})">Отправить ГБР-2</button>`:a.st==='arr'?`<button class="bt sm" onclick="aClose(${i})">Закрыть</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>
 ${tip('Оборудование','Тревожные кнопки и приборы на объектах уже передают сигналы на ваш пульт. Подключаем систему к пультовому ПО или к его выгрузке событий — способ уточним по вашему оборудованию.')}
 ${said('Тревожные кнопки должны быть все сведены в систему, чтобы проходили уведомления, где какой был сигнал, по какому адресу')}`;
function aSend(i){const a=ALR[i];a.st='go';a.crew='ГБР-2';toast(`Вызов ${a.id} отправлен ГБР-2: адрес, координаты ${a.lat}, ${a.lon} и кнопка маршрута в 2ГИС — в приложении экипажа.`);render()}
function aClose(i){const a=ALR[i];a.st='closed';toast(`Тревога ${a.id} закрыта, отчёт экипажа сохранён в журнале и в карточке абонента.`);render()}

SC.map=()=>`<div class="hd"><div><h2>Карта объектов и экипажей</h2><p>Объекты под охраной и экипажи на одной схеме: где тревога, кто свободен и кто ближе. Положение экипажа — по телефону в приложении.</p></div></div>
 <div class="g2 g21"><div class="pan"><svg viewBox="0 0 100 90" class="oxmap" role="img" aria-label="Схема города с объектами и экипажами">
  <rect width="100" height="90" fill="var(--card2)"/><path d="M0 30H100M0 58H100M25 0V90M55 0V90M80 0V90" stroke="var(--line2)" stroke-width="1.6"/><path d="M0 80L100 12" stroke="var(--line2)" stroke-width="2.4"/>
  ${SUB.map((s,i)=>`<circle cx="${10+i*11}" cy="${18+(i*23)%60}" r="1.6" fill="var(--muted2)"/>`).join('')}
  ${ALR.filter(a=>a.st!=='closed').map(a=>`<g><circle cx="${a.x}" cy="${a.y}" r="4.5" fill="none" stroke="var(--bad)" stroke-width=".8"/><circle cx="${a.x}" cy="${a.y}" r="2" fill="var(--bad)"/><text x="${a.x+5}" y="${a.y+1}" font-size="3" fill="var(--text)">${SD(a.sub).n}</text></g>`).join('')}
  ${CREWS.map(c=>`<g><rect x="${c[2]-3.5}" y="${c[3]-2.2}" width="7" height="4.4" rx="1" fill="${c[1]==='свободен'?'var(--ok)':'var(--brand)'}"/><text x="${c[2]}" y="${c[3]+1}" font-size="2.4" fill="#fff" text-anchor="middle">${c[0].slice(4)}</text></g>`).join('')}
 </svg></div>
 <div class="pan"><h3>Экипажи</h3>${CREWS.map(c=>`<div class="kv"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('')}<h3 style="margin-top:12px">Объекты</h3><div class="kv"><span>Под охраной</span><b>${fmt(TOT.all-TOT.cut)}</b></div><div class="kv"><span>Тревог сегодня</span><b>${ALR.length+19}</b></div><div class="kv"><span>Среднее время прибытия</span><b>7 мин 40 с</b></div></div></div>
 ${tip('Карта','Схема в демо условная. В системе — бесплатная карта с объектами и экипажами; карты 2ГИС внутри системы подключаются по их платному API, а маршрут для экипажа открывается в приложении 2ГИС бесплатно.')}`;

SC.crew=()=>{const a=ALR.find(x=>x.st==='go'&&x.crew==='ГБР-3')||ALR[1],s=SD(a.sub);
 return `<div class="hd"><div><h2>Приложение экипажа · ГБР-3</h2><p>Экипаж получает вызов в телефоне: объект, адрес, тип тревоги, контакт и где ключи. Кнопка «Маршрут» открывает 2ГИС с построенным маршрутом до координат — без ввода адреса. На месте экипаж отмечает «Прибыл» и пишет итог.</p></div></div>
 <div class="oxph-wrap"><div class="oxph"><div class="oxph-top"><small>ВЫЗОВ ${a.id} · ${a.t}</small><b>${a.type}</b></div>
 <div class="kv"><span>Объект</span><b>${s.n}</b></div><div class="kv"><span>Адрес</span><b>${s.obj}</b></div><div class="kv"><span>Координаты</span><b class="mono">${a.lat}, ${a.lon}</b></div><div class="kv"><span>Контакт</span><b>${s.ph}</b></div><div class="kv"><span>Ключи</span><b>на пульте, ячейка 41</b></div>
 <button class="bt p oxbig" onclick="act('Откроется 2ГИС с маршрутом до точки ${a.lat}, ${a.lon}. Карты 2ГИС в самой системе — платный API; переход в приложение 2ГИС по координатам — бесплатно.')">Маршрут в 2ГИС</button>
 <button class="bt oxbig" onclick="crewArr()">Прибыл на объект</button></div>
 ${said('Чтобы экипажу заявка поступала автоматически в приложение и были указаны координаты в 2ГИС — нажали на кнопку, и маршрут сразу построился')}</div>`};
function crewArr(){const a=ALR.find(x=>x.crew==='ГБР-3');if(a)a.st='arr';toast('Отмечено: ГБР-3 на объекте в '+NOW+'. Дежурный и директор видят время прибытия.');render()}

SC.journal=()=>`<div class="hd"><div><h2>Журнал событий</h2><p>Всё, что произошло на пульте, — с временем до секунды: тревога, кто принял, какой экипаж, когда выехал и прибыл, чем закончилось. Отчёт для клиента и для разбора спорных случаев.</p></div><div class="btns"><button class="bt" onclick="act('Журнал выгружен в Excel.')">Excel</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Событие</th><th>Объект</th><th>Кто</th></tr></thead><tbody>${[['10:31:07','Тревожная кнопка','ТОО «Алем Маркет»','прибор → пульт'],['10:18:44','ГБР-3 выехал','ТОО «Нур Строй»','дежурный Айдана'],['10:18:02','Проникновение · зона 2','ТОО «Нур Строй»','прибор → пульт'],['09:55:30','ГБР-1 прибыл · 8 мин','Школа «Зерде»','экипаж'],['09:47:12','Пожарный датчик','Школа «Зерде»','прибор → пульт'],['09:20:00','Восстановлена связь','ИП Касымова','прибор'],['08:02:15','Снят с охраны · по графику','ТЦ «Арена»','клиент']].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Кабинет клиента */
SC.lk=()=>`<div class="hd"><div><h2>Личный кабинет клиента · ТОО «Алем Маркет»</h2><p>Клиент входит по логину и паролю — на вашем сайте или в приложении. Все документы готовы: счета, акты, ЭСФ, договор. Оплата по кнопке, заявки на монтаж и обслуживание, события по своим объектам.</p></div></div>
 <div class="g2"><div class="pan"><h3>Документы</h3>${[['Счёт № 10-0412 за октябрь','65 000 ₸','оплачен'],['Акт за сентябрь','65 000 ₸','подписан'],['ЭСФ за сентябрь','65 000 ₸','в ИС ЭСФ'],['Договор ОХ-0412 и приложения','','подписан ЭЦП']].map(r=>`<div class="kv"><span>${r[0]}${r[1]?' · '+r[1]:''}</span><b>${r[2]} · <a href="#" onclick="act('Документ скачан в PDF.');return false">PDF</a></b></div>`).join('')}
 <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('Откроется оплата Kaspi с суммой и номером счёта.')">Оплатить</button><button class="bt" onclick="act('Заявка на обслуживание принята — менеджер свяжется сегодня.')">Заявка: монтаж, ремонт, новый объект</button></div></div>
 <div class="pan"><h3>Мои объекты</h3><div class="kv"><span>Магазин · мкр Самал-2, 58</span><b>${tag('под охраной','g')}</b></div><div class="kv"><span>Тревожных кнопок</span><b>2</b></div>
 <h3 style="margin-top:12px">События</h3>${[['сегодня 10:31','Тревожная кнопка · экипаж направлен'],['вчера 21:02','Поставлен на охрану'],['вчера 09:00','Снят с охраны']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div></div>
 ${said('У клиентов должен быть личный кабинет, куда они заходят по логину и паролю и получают все документы — акты, счета на оплату, ЭСФ — уже в готовом виде')}`;

/* Персонал */
SC.staff=()=>`<div class="hd"><div><h2>Кадровый учёт</h2><p>124 сотрудника: должность, пост, график, документы и сроки (удостоверение, медкомиссия, обучение). Система заранее напоминает о сроках и считает табель по графику. Рассчитано на рост до 200+ человек.</p></div><div class="btns"><button class="bt p" onclick="act('Приём на работу: анкета, документы, пост — заявление сразу уходит на визу директору.')">+ Сотрудник</button></div></div>
 <div class="wid"><div><small>Сотрудников</small><b class="a">124</b><span>охранники 112 · ГБР 8 · офис 4</span></div><div><small>На постах сейчас</small><b>86</b><span>по графику 86</span></div><div><small>Отпуск · больничный</small><b>3 · 2</b><span></span></div><div><small>Истекают документы</small><b>5</b><span>в ближайшие 30 дней</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Должность</th><th>Пост</th><th>График</th><th>Документы</th></tr></thead><tbody>${[['Нурлан Ж.','Охранник','ТЦ «Арена» · пост 2','сутки через двое','в порядке'],['Ержан К.','Старший ГБР-3','мобильная группа','12 ч · день','медкомиссия до 14.11'],['Талгат С.','Водитель ГБР-3','мобильная группа','12 ч · день','в порядке'],['Айдана М.','Дежурный пульта','пульт','12 ч · ночь','в порядке'],['Бауыржан А.','Охранник','Школа «Зерде»','5/2','удостоверение до 02.11']].map(r=>`<tr class="${/до/.test(r[4])?'rowwarn':''}"><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div></div>`;

let APPS=[['З-301','Нурлан Ж.','Отпуск 10–24.11',0],['З-302','Талгат С.','Аванс 50 000 ₸',0],['З-303','Бауыржан А.','Перевод на пост ТЦ «Арена»',1],['З-299','Айдана М.','Отгул 28.10',3]];
const APST=['ждёт визы директора','виза ЭЦП · в бухгалтерии','в работе у бухгалтерии','исполнено'];
SC.apps=()=>`<div class="hd"><div><h2>Заявления и визы</h2><p>Сотрудник подаёт заявление с телефона — без бумаги и подписи от руки. Директор ставит визу ЭЦП, бухгалтерия видит и исполняет. Каждый видит, на каком шаге его заявление.</p></div>${role==='Сотрудник'?`<div class="btns"><button class="bt p" onclick="act('Заявление подано директору: отпуск, аванс, отгул, перевод, увольнение — по шаблону.')">+ Заявление</button></div>`:''}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Сотрудник</th><th>Заявление</th><th>Шаг</th><th></th></tr></thead><tbody>${APPS.map((a,i)=>`<tr><td class="mono">${a[0]}</td><td><b>${a[1]}</b></td><td>${a[2]}</td><td>${tag(APST[a[3]],a[3]===3?'g':a[3]===0?'w':'')}</td><td>${a[3]===0&&role==='Директор'?`<button class="bt p sm" onclick="visa(${i})">Виза ЭЦП</button>`:a[3]>0&&a[3]<3&&role==='Бухгалтерия'?`<button class="bt sm" onclick="apDone(${i})">Исполнено</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Заявления писать — всё через систему: подали, видит директор, ставит свою визу электронную, бухгалтерия отрабатывает')}`;
function visa(i){APPS[i][3]=1;toast(`Виза поставлена ЭЦП. Заявление ${APPS[i][0]} ушло в бухгалтерию, сотрудник получил уведомление.`);render()}
function apDone(i){APPS[i][3]=3;toast(`Заявление ${APPS[i][0]} исполнено.`);render()}

/* Внедрение */
SC.onec=()=>`<div class="hd"><div><h2>Обмен с 1С</h2><p>Документы формируем в системе, в 1С уходит только то, что нужно бухгалтерии. 1С перестаёт быть местом, где работают отделы, и больше не зависает от объёма.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Данные</th><th>Направление</th></tr></thead><tbody>${[['Контрагенты · 4 000+','перенос из 1С и Excel при старте, дальше — из системы в 1С'],['Реализации (акты) за месяц','система → 1С'],['ЭСФ','выписываются в 1С по реализациям'],['Оплаты из банка','банк → система (или 1С → система)'],['Заработная плата','остаётся в 1С; табель — из системы']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('1С не справляется с объёмом, Excel не справляется — надо исключить ручные операции полностью')}`;

SC.site=()=>`<div class="hd"><div><h2>Сайт и кабинет</h2><p>Дизайн сайта у вас готов. Делаем рабочую часть: личный кабинет клиента (документы, оплата, заявки, события) и формы заявок на подключение и монтаж, которые сразу попадают в воронку. С Tilda переносим на свою площадку, чтобы кабинет и сайт были одним целым.</p></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Вёрстка по вашему готовому макету','Личный кабинет клиента: вход, документы, оплата, заявки, события','Формы заявок → воронка в системе','Базовая SEO-оптимизация, мобильная версия'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Стоимость</h3><div class="kv"><span>Сайт с кабинетом</span><b>800 000 ₸</b></div><div class="kv"><span>Срок</span><b>параллельно с порталом</b></div></div></div>`;

SC.server=()=>`<div class="hd"><div><h2>Ваш сервер и безопасность</h2><p>Разработку ведём на облачном сервере, к запуску переносим систему на ваш выделенный сервер. Требования небольшие — главное стабильность.</p></div></div>
 <div class="g2"><div class="pan"><h3>Минимум под 200 сотрудников и 4 000+ абонентов</h3>${[['Виртуальная машина','Ubuntu или Debian — без разницы'],['Процессор','4 ядра'],['Память','8–16 ГБ'],['Диск','100 ГБ SSD на старте'],['Сеть','статический IP, постоянный интернет'],['Питание','ИБП — без него сервер уязвим при отключении света'],['Резервные копии','ежедневно — у вас уже настроено зеркалирование']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Безопасность</h3>${[['NDA','подписываем до начала работ'],['Доступ','по ролям: каждый видит только своё'],['Журнал','все действия с данными записываются'],['Доступ разработчиков','по VPN/SSH, который выдаёте вы'],['Данные','на вашем сервере, на территории Казахстана']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div></div>
 ${said('У нас есть свой сервер, бэкап уже настроен, зеркалится — какие у вас системные требования?')}`;

SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Всё, что обсудили, входит в стандартный пакет разработки портала. 1С и сайт с кабинетом — отдельными блоками. Три этапа: старт, база на сервере, полировка с вашей командой до полной сдачи.</p></div></div>
 <div class="pk1"><div><small>Портал</small><b>2 500 000 ₸</b><span>абоненты, пульт, кабинет, персонал, дашборды</span></div><div><small>+ 1С и сайт</small><b>1 600 000 ₸</b><span>800 000 ₸ + 800 000 ₸</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>250 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 125 000 ₸</b><span>база развёрнута на сервере</span></div><div><small>Сдача · 45%</small><b>1 125 000 ₸</b><span>после полировки и приёмки</span></div></div>
 <div class="g2"><div class="pan"><h3>Срок</h3><div class="kv"><span>Весь проект</span><b>4–6 недель</b></div><div class="kv"><span>База на сервере</span><b>около недели после старта</b></div><div class="kv"><span>Полировка</span><b>версии с правками, ответ от вас — за 1–2 дня</b></div></div>
 <div class="pan"><h3>После сдачи</h3><div class="kv"><span>Исправление ошибок</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Доработки</span><b>по часам или ежемесячный договор сопровождения</b></div><div class="kv"><span>Карты 2ГИС внутри системы</span><b>по тарифу 2ГИС (опция)</b></div></div></div>`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const x=SUB.find(s=>(s.id+s.n+s.obj).toLowerCase().includes(v));if(x&&v){curSub=x.id;go('card');return}toast('Ищите по абоненту, адресу или номеру: «Алем», «Самал», «А-0933».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ОХРАНА</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='alarm'?'<em>'+ALR.filter(a=>a.st==='new').length+'</em>':x[0]==='apps'?'<em>'+APPS.filter(a=>a[3]===0).length+'</em>':x[0]==='cut'?'<em>'+SUB.filter(s=>s.st==='cutq').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Цифры'],['subs','Абоненты'],['alarm','Тревоги'],['apps','Заявления'],['crew','Вызов'],['lk','Кабинет']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ОХРАНА';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт директоров: абоненты, оплаты, долги, отключения — готовые цифры в телефоне.'],
 ['subs','2 · База абонентов вместо Excel.'],
 ['billing','3 · Счета и акты за месяц формируются сами.'],
 ['remind','4 · Напоминания об оплате и отключении — по правилам.'],
 ['cut','5 · Отключение по решению директора, включение после оплаты — само.'],
 ['funnel','6 · Новые клиенты: заявка → договор с ЭЦП → монтаж → пульт.'],
 ['alarm','7 · Тревожные кнопки сведены в систему.'],
 ['crew','8 · Экипажу — вызов с координатами и маршрутом в 2ГИС.'],
 ['lk','9 · Кабинет клиента: документы, оплата, заявки.'],
 ['apps','10 · Заявления сотрудников с визой директора ЭЦП.'],
 ['launch','11 · Портал 2,5 млн ₸ + 1С и сайт по 800 тыс., 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
