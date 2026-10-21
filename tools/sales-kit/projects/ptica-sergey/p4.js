/* Экран ТСД */
let TS=0;
const TSS=[['Отсканируйте QR паллеты','ПЛ-2210-018 · Тушка охл. · 36 коробов','СКАН'],['Отсканируйте каждый короб','36 из 36 · 498,2 кг','ГОТОВО'],['Поставьте на весы чистой зоны','весы: 498,3 кг · сошлось ✓','ДАЛЕЕ'],['Отвезите в ячейку','Камера 1 · B-05-1 · отсканируйте QR ячейки','СКАН'],['Подтвердите PIN','Сейтов Е. · подпись приёмки','ПОДПИСАТЬ']];
SC.tsd=()=>`<div class="hd"><div><h2>Экран кладовщика (ТСД)</h2><p>Для линейного персонала — максимально просто: одна задача на экране, большая кнопка, понятная подсказка. Нельзя пропустить шаг, нельзя ввести вес руками, нельзя положить паллету не в ту камеру. Сделал не так — экран скажет, что исправить.</p></div></div>
 <div class="g2 g21"><div class="pan"><div class="phmini bz-tsd"><b>Приёмка · шаг ${TS+1} из ${TSS.length}</b><div class="bz-tsdq">${TSS[TS][0]}</div><div class="mg" style="max-width:100%">${TSS[TS][1]}</div><a onclick="tsNext()">${TSS[TS][2]}</a><span>Сейтов Е. · смена 2 · ТСД №3</span></div></div>
 <div class="pan"><h3>Что ТСД не даст сделать</h3>${['Принять паллету, если вес не сошёлся','Отсканировать один короб дважды','Взять свежую паллету, пока есть старая (FIFO)','Положить охлаждённую продукцию в камеру заморозки','Добавить в сборку позицию не из заявки','Подписать за другого сотрудника'].map(x=>`<div class="kv"><span>⛔ ${x}</span><b></b></div>`).join('')}</div></div>
 ${said('Всё должно быть объяснено, как для двенадцатилетнего ребёнка. Он зомбак, который делает по протоколу три вещи: нажал, отсканировал, подписал')}`;
function tsNext(){TS=(TS+1)%TSS.length;render();if(TS===0)toast('Приёмка ПЛ-2210-018 подписана. Остаток обновлён.')}

/* Оборудование */
SC.devices=()=>`<div class="hd"><div><h2>Оборудование и подключение</h2><p>У вас уже есть всё железо — система подключается к нему, а не заменяет. Чем больше данных идёт напрямую с устройств, тем меньше места для человеческого фактора. Точные способы подключения уточним по опроснику с вашим IT-специалистом.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Оборудование</th><th>Что даёт системе</th><th>Как подключаем</th><th>Статус</th></tr></thead><tbody>${[['Весы-этикетировщик на линии упаковки','вес и номер каждого короба','программа весов или этикетка GS1-128 через ТСД','уточнить протокол'],['Паллетные весы в цехе','вес паллеты, шаг 2','сетевой порт / RS-232 → шлюз','уточнить модель'],['Паллетные весы в чистой зоне','вес паллеты, шаг 3','так же','уточнить модель'],['Потоковые весы','вес на линии, выход продукции','по протоколу производителя','позже, блок производства'],['ТСД','сканирование коробов, паллет, ячеек','браузер на Android, Wi-Fi','уточнить модели'],['Камеры','фото пломбы, номер машины','IP-камера + распознавание номеров','уточнить'],['Шлагбаум КПП','открытие по подтверждениям','реле / контроллер с API','уточнить'],['1С','документы, остатки, себестоимость','выгрузка файлом или обмен OData','по опроснику']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${tag(r[3],r[3].startsWith('позже')?'':'w')}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Всё есть: весы паллетные, мелкие, потоковые; ТСД; камеры; QR и штрихкоды — всё с открытыми протоколами, можно подключиться')}`;

/* Пилот */
SC.roadmap=()=>`<div class="hd"><div><h2>Пилот и следующие блоки</h2><p>Начинаем с одного блока — склада готовой продукции: он понятный, оборудование уже стоит, а эффект виден сразу. Сервер разворачиваем сразу под всю систему, дальше блоки добавляются по одному — «лягушку варим по полградуса».</p></div></div>
 <div class="pk1"><div><small>Пилот · склад готовой продукции</small><b>≈ 1 500 000 ₸</b><span>точная сумма — после ответов на опросник</span></div><div><small>Срок</small><b>3–4 недели</b><span>с согласованиями</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>≈ 150 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>≈ 675 000 ₸</b><span>после приёмки базы склада</span></div><div><small>Сдача · 45%</small><b>≈ 675 000 ₸</b><span>после полировки с командой</span></div></div>
 <div class="pan"><h3>Блоки после склада</h3>${[['1','Склад готовой продукции','пилот'],['2','Контрольно-пропускной режим','вы назвали в топ-3'],['3','Учёт рабочего времени','вы назвали в топ-3 · «мёртвые души»'],['4','Убойный цех и выход продукции','потоковые весы'],['5','Инкубатор, площадки выращивания, комбикорм','показатели по птичникам, вода, корм, падёж'],['6','Продажи и работа с клиентами','заявки, договоры, дебиторка'],['7','Дашборд с аномалиями','сравнение с прошлыми посадками за 1,5 года']].map(r=>`<div class="kv"><span><b>${r[0]}.</b> ${r[1]}</span><b>${r[2]}</b></div>`).join('')}<p class="hint">Перед стартом заполните опросник — по нему зафиксируем объём пилота и цену.</p></div>
 ${said('Склад: поступила документация, машина, приёмка, хранение, перемещение, отгрузка, списание, возврат — минимум процессов, и они понятные. Напишите список вопросов — я отвечу')}`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const p=PAL.find(x=>(x.id+PD(x.pr)[1]).toLowerCase().includes(v));if(p&&v){openPal(p.id);return}if(v&&('пл-1910-003'.includes(v)||v.includes('1910'))){go('trace');return}toast('Ищите по паллете (ПЛ-2210-017), позиции (бедро) или партии (1910).')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">СКЛАД ГП</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='incidents'?'<em>'+INC.filter(r=>r[4]==='открыт').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['recv','Приёмка'],['stock','Остатки'],['gate','Выезд'],['tsd','ТСД']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Склад ГП';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: на складе в кг и деньгах, принято, отгружено, расхождения, сроки.'],
 ['recv','2 · Приёмка: четыре веса одной паллеты должны сойтись — иначе стоп.'],
 ['label','3 · Каждый короб с весом и уникальным номером.'],
 ['cells','4 · Камеры и ячейки, температура с датчиков.'],
 ['fefo','5 · Сроки годности и FIFO.'],
 ['pick','6 · Сборка по ТСД против заявки — пересорт не пройдёт.'],
 ['gate','7 · Выезд: все подтверждения — и только тогда шлагбаум.'],
 ['trace','8 · Цифровой след паллеты с фамилиями.'],
 ['incidents','9 · Расхождение — инцидент с ответственными.'],
 ['tsd','10 · Экран кладовщика: одна кнопка, ошибиться нельзя.'],
 ['morning','11 · Утренний отчёт в Excel.'],
 ['roadmap','12 · Пилот — склад, дальше КПП и учёт времени.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
