/* Штрафы */
let FINES=[
 {id:'ШТ-2291',car:'024',dr:'Азамат Т.',what:'Превышение скорости на 22 км/ч · пр. Туран',d:'27.10 23:41',sum:29525,st:'sent',c:'ast'},
 {id:'ШТ-2290',car:'119',dr:'Айдос Р.',what:'Проезд на красный · ул. Абая — Байзакова',d:'27.10 18:05',sum:59050,st:'new',c:'alm'},
 {id:'ШТ-2287',car:'031',dr:'Бауыржан С.',what:'Превышение на 15 км/ч · ш. Алаш',d:'21.10 09:12',sum:14763,st:'iin',c:'ast'},
 {id:'ШТ-2281',car:'127',dr:'Максат Е.',what:'Стоянка в запрещённом месте',d:'14.10 13:30',sum:14763,st:'over',c:'alm'},
 {id:'ШТ-2276',car:'046',dr:'Данияр М.',what:'Превышение на 12 км/ч · пр. Кабанбай батыра',d:'11.10 22:48',sum:8858,st:'paid',c:'ast'}
];
const FS={new:['Новый — протокол не отправлен','warn'],sent:['Протокол у водителя','info'],over:['Не оплачен > 10 дней','bad'],iin:['Перевод на ИИН подан','violet'],paid:['Оплачен','ok']};
SC.fines=()=>{const fs=FINES.filter(inCity);return `<div class="hd"><div><h2>Штрафы по камерам</h2><p>Каждое утро в 9:00 система проверяет штрафы по госномеру и номеру техпаспорта каждой машины. Новый штраф сразу ставится на водителя, который был за рулём в это время, протокол уходит ему в WhatsApp. Дальше система следит за оплатой; не оплатил — заявление о переводе на ИИН или блокировка по правилу.</p></div>${citySw()}</div>
 <div class="wid"><div><small>Новых за ночь</small><b class="a">5</b><span>проверка в 9:00</span></div><div><small>Не оплачены</small><b>${fs.filter(f=>f.st!=='paid').length+18}</b><span>на сумму ${tg(412000)}</span></div><div><small>Переведено на ИИН за месяц</small><b>14</b><span>штраф не на компании</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Штраф</th><th>Машина · водитель</th><th>Нарушение</th><th>Когда</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${fs.map(f=>`<tr class="${f.st==='over'?'rowwarn':''}"><td class="mono">${f.id}</td><td><b>№${f.car}</b> · ${f.dr}</td><td>${f.what}</td><td>${f.d}</td><td class="r">${tg(f.sum)}</td><td>${tag(FS[f.st][0],FS[f.st][1])}</td><td>${f.st==='new'?`<button class="bt p sm" onclick="fineSend('${f.id}')">Протокол в WhatsApp</button>`:f.st==='over'?`<button class="bt p sm" onclick="fineIin('${f.id}')">Перевести на ИИН</button>`:f.st==='sent'?`<button class="bt sm" onclick="finePaid('${f.id}')">Показать: оплатил</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Кто был за рулём','Штраф сопоставляется с водителем по дате и времени нарушения и периоду аренды машины — даже если водитель уже сменился.')}
 ${said('Головная боль — штрафы по камерам: выгружаем вручную, протокол скачиваем и отправляем водителю в WhatsApp, потом перекидываем на ИИН через заявление')}`};
function fineSend(id){const f=FINES.find(x=>x.id===id);f.st='sent';toast(`${f.dr}: в WhatsApp ушёл протокол ${f.id} (PDF), сумма ${tg(f.sum)}, срок оплаты со скидкой 50 % — 7 дней. Вопросов «где, когда, какой штраф» больше нет.`);render()}
function fineIin(id){const f=FINES.find(x=>x.id===id);f.st='iin';toast(`${f.id}: собран пакет — протокол, договор аренды, заявление водителя о переводе на ИИН. Юристу осталось подать его в «Комкор» под ЭЦП компании.`);render()}
function finePaid(id){const f=FINES.find(x=>x.id===id);f.st='paid';toast(`${f.id} оплачен — проверка в 9:00 подтвердила, что штраф закрыт.`);render()}

/* Робот */
SC.robot=()=>`<div class="hd"><div><h2>Сбор штрафов: робот</h2><p>Два пути. Если государственный сервис даст доступ через Smart Bridge за разумные деньги — подключаемся официально. Если нет — робот на облачном сервере сам заходит на портал проверки штрафов, вводит госномер и техпаспорт по каждой машине, скачивает новые протоколы и разносит их в систему.</p></div></div>
 <div class="g2"><div class="pan"><h3>Вариант А · официально</h3><div class="kv"><span>Сервис</span><b>Smart Bridge · «поиск штрафов ЕРАП»</b></div><div class="kv"><span>Запрос</span><b>госномер + номер техпаспорта</b></div><div class="kv"><span>Стоимость</span><b>уточняем у оператора</b></div><div class="kv"><span>Плюс</span><b>самый надёжный путь</b></div></div>
 <div class="pan"><h3>Вариант Б · робот</h3><div class="kv"><span>Где работает</span><b>облачный сервер, ≈ 30 € в месяц</b></div><div class="kv"><span>Когда</span><b>каждый день 9:00</b></div><div class="kv"><span>ИИ-агент</span><b>≈ 10–15 $ в месяц</b></div><div class="kv"><span>Плюс</span><b>не нужен ничей компьютер</b></div></div></div>
 <div class="pan"><h3>Сегодня, 9:00 — журнал робота</h3>${[['09:00','Старт: 216 машин в очереди'],['09:14','Проверено 124 машины Астаны · новых штрафов 3'],['09:26','Проверено 92 машины Алматы · новых штрафов 2'],['09:27','5 протоколов скачано и привязано к водителям'],['09:28','Протоколы отправлены водителям в WhatsApp']].map(r=>`<div class="kv"><span class="mono">${r[0]}</span><b style="font-weight:500">${r[1]}</b></div>`).join('')}
 <div style="margin-top:10px"><button class="bt p" onclick="robotRun()">Запустить проверку сейчас</button></div></div>
 ${said('Сторонние сервисы просят 2 500–3 000 ₸ за машину в месяц — на 200 машин это 600 тысяч, мне легче сотрудника нанять','Робот или Smart Bridge — десятки долларов в месяц на весь парк, без оплаты за машину.')}`;
function robotRun(){toast('Робот запущен: 216 машин, около 25 минут. Новые штрафы появятся в «Штрафах по камерам», протоколы уйдут водителям сами.')}

/* WhatsApp */
let WAT=[['Оплата не поступила','Оплата за сегодня не поступила. Оплатите по коду машины {код} до 21:30, иначе машина будет заблокирована.','21:00 · автоматически'],['Оплата получена','Оплата {сумма} получена, аренда продлена до {дата} 21:00. Спасибо!','после каждой оплаты'],['Новый штраф','Новый штраф по машине {код}: {нарушение}, {сумма}. Протокол во вложении. Со скидкой 50 % — 7 дней.','утром, если штраф новый'],['Машина заблокирована','Машина заблокирована за неоплату. Долг {сумма}. Оплатите — разблокировка автоматически.','при блокировке']];
SC.wa=()=>`<div class="hd"><div><h2>WhatsApp-рассылки</h2><p>Системные сообщения водителям — с номера своего города: астанинские водители получают сообщения с астанинского номера, алматинские — с алматинского. Водитель отвечает — переписка ложится в его карточку, менеджер отвечает из системы.</p></div>${citySw()}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Шаблон</th><th>Текст</th><th>Когда уходит</th></tr></thead><tbody>${WAT.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
 <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="bt p" onclick="act('Рассылка «Оплата не поступила» ушла 9 водителям ${city==='alm'?'Алматы':'Астаны'} с номера своего города.')">Отправить должникам ${city==='alm'?'Алматы':'Астаны'}</button><button class="bt" onclick="act('Новый шаблон: название, текст с полями {код}, {сумма}, {дата}.')">+ Шаблон</button></div></div>
 <div class="g2"><div class="pan"><h3>Канал</h3><div class="kv"><span>Подключение</span><b>Green API</b></div><div class="kv"><span>Стоимость</span><b>≈ 5 000 ₸ в месяц за номер</b></div><div class="kv"><span>Вместо</span><b>36 000 ₸ в месяц у официальных провайдеров</b></div><div class="kv"><span>Номеров</span><b>2 — Астана и Алматы</b></div></div>
 <div class="pan"><h3>Ответы водителей сегодня</h3><div class="rf" onclick="card('car','024')"><i></i><div><b>Азамат Т. · №024</b><span>«Брат, завтра утром закину, сегодня мало заказов»</span></div></div><div class="rf" onclick="card('car','031')"><i></i><div><b>Бауыржан С. · №031</b><span>«Разблокируйте, оплачу половину сейчас»</span></div></div></div></div>
 ${said('Мы пишем, что такая-то задолженность, они начинают возражать, обсуждать — то есть отвечают в любом случае')}`;

/* Интеграции */
SC.integr=()=>`<div class="hd"><div><h2>Интеграции</h2><p>Что подключаем на старте, через что и сколько это стоит в месяц. Все платные сервисы — по тарифам владельцев, напрямую на вас.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Что</th><th>Как</th><th>В месяц</th></tr></thead><tbody>${[['Оплаты аренды','Каспий Платежи с кодом машины → письма-подтверждения на почту → разбор','0 ₸'],['GPS лизингодателя','API трекера: координаты, скорость, блокировка','по договору лизинга'],['Свои GPS-трекеры','API трекера: координаты, скорость, блокировка','текущий тариф'],['Штрафы','Smart Bridge (официально) или робот на облачном сервере','≈ 30 € + 10–15 $'],['WhatsApp','Green API, номер на каждый город','≈ 5 000 ₸ за номер'],['Подписание','ЭЦП (NCALayer) и eGov Mobile по ссылке','0 ₸'],['Сервер','облачный сервер на ваше имя','≈ 15–30 $']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Каспий-API','Если позже найдём партнёра с API Каспия по фиксированной цене (≈ 10 000 ₸ в месяц, без процента от оборота), подключим — оплаты будут приходить мгновенно, а не через письма.')}
 ${said('Ребята просили 3 % от оборота — с 30 миллионов это 900 тысяч в месяц; я так платить не готов')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки и второй город с отдельной базой, номером WhatsApp и юрлицом в договорах. Система ваша: код, ключи и сервер — у вас, без абонплаты.</p></div></div>
 <div class="pk1"><div><small>Пакет + второй город</small><b>2 875 000 ₸</b><span>2 500 000 ₸ + 15 % за филиал (375 000 ₸)</span></div><div><small>Срок</small><b>4–6 недель</b><span>первая версия через 7–10 дней</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>287 500 ₸</b><span>поднимаем интеграции: GPS, Каспий, WhatsApp</span></div><div><small>2 · Первая версия · 45%</small><b>1 293 750 ₸</b><span>всё обговорённое работает на сервере, вы утвердили</span></div><div><small>3 · Полировка и сдача · 45%</small><b>1 293 750 ₸</b><span>договоры, воронки, кнопки, отчёты; ключи и код — ваши</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Ежедневные оплаты и автоблокировка','Карта и реестр машин из двух GPS-сервисов','Воронка водителей, договоры ЭЦП / eGov / бумага','Штрафы: сбор, протокол в WhatsApp, перевод на ИИН','Ремонт и ДТП','Астана и Алматы: раздельные базы, номера, юрлица','3 месяца сопровождения после сдачи'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно, напрямую владельцам</h3><div class="kv"><span>WhatsApp (Green API)</span><b>≈ 5 000 ₸ в месяц за номер</b></div><div class="kv"><span>Сервер</span><b>≈ 15–30 $ в месяц</b></div><div class="kv"><span>Робот штрафов</span><b>≈ 30 € + 10–15 $ в месяц</b></div><div class="kv"><span>Smart Bridge</span><b>по тарифу, если выберем</b></div><div class="kv"><span>Доработки после сдачи</span><b>20 $ в час</b></div></div></div>
 ${tip('Сравните','Готовые решения на рынке — 2 500–3 000 ₸ за машину в месяц плюс до 3 % от оборота за оплаты. На 216 машинах это больше 1,5 млн ₸ каждый месяц. Здесь — один раз.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const c=CARS.find(x=>(x.id+x.p+x.m+x.dr).toLowerCase().includes(v));if(c&&v){if(!allowed('cars')){toast('Нет доступа к реестру машин.');return}go('cars');card('car',c.id);return}toast('Ищите по коду, госномеру, модели или водителю: «031», «ABK», «Camry», «Ерлан».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Управляющий';city=role==='Менеджер парка'?'ast':'all';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;city=role==='Менеджер парка'?'ast':'all';document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ДРАЙВ АРЕНДА</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='debt'?'<em>'+CARS.filter(c=>c.st==='debt'||c.st==='block').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['map','Карта'],['pays','Оплаты'],['debt','Долги'],['fines','Штрафы'],['repair','Ремонт']].filter(x=>allowed(x[0])).slice(0,5).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ДРАЙВ АРЕНДА';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: машины на линии, оплаты сегодня, должники, штрафы.'],
 ['pays','2 · Оплата в Каспий Платежах по коду машины — продление на сутки само.'],
 ['debt','3 · Не оплатил к 21:00 — блокировка через GPS без людей.'],
 ['map','4 · Все машины на карте из двух GPS-сервисов.'],
 ['dfunnel','5 · Воронка водителей с индивидуальной ставкой.'],
 ['contracts','6 · Договор: ЭЦП, eGov Mobile или бумага со сканом.'],
 ['fines','7 · Штрафы каждое утро — протокол водителю в WhatsApp.'],
 ['branches','8 · Астана и Алматы: раздельные базы и номера.'],
 ['launch','9 · 2 875 000 ₸, 4–6 недель, без абонплаты.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
