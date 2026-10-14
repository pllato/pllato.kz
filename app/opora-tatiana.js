/* ОПОРА — система компании, которая помогает людям выйти на пенсию: заявки из Instagram, TikTok, сайтов и WhatsApp, 10 воронок по услугам (расчёт, сопровождение, практикум, страхование жизни), карточка клиента с перепиской и документами вместо Google Диска, расчёт пенсии, очередь расчётчиков, сдельная оплата, статистики должностей, контроль качества, переезд из Битрикса, расходы в месяц. Все имена и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='15.10.2026',NOW='14:00';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 10 88 30v8H12v-8z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/><path d="M22 42v34M40 42v34M60 42v34M78 42v34" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M10 86h80" stroke="var(--brand2,#e2b04a)" stroke-width="8" stroke-linecap="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;

const SEC=[
 {k:'top',n:'Главное',sub:[['dash','Пульт собственника'],['stats','Статистики должностей']]},
 {k:'cl',n:'Клиенты',sub:[['leads','Заявки'],['funnels','Воронки'],['client','Карточка клиента'],['chat','WhatsApp — все номера']]},
 {k:'wk',n:'Работа',sub:[['calc','Расчёт пенсии'],['queue','Расчёты в работе'],['soprov','Сопровождение'],['quality','Контроль качества']]},
 {k:'mn',n:'Деньги',sub:[['pay','Оплаты'],['salary','Сдельная оплата']]},
 {k:'st',n:'Переход',sub:[['move','Переезд из Битрикса'],['costs','Расходы в месяц'],['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'СБ',n:'Собственник',note:'Пульт, статистики, деньги — с телефона, без погружения в детали',s:['dash','stats','pay','salary','costs','launch','leads','funnels','client']},
 'Исполнительный директор':{av:'ТД',n:'Татьяна',note:'Всё: воронки, люди, качество, деньги, переезд',s:ALL.slice()},
 'Менеджер по продажам':{av:'МП',n:'Айгерим',note:'Свои заявки и клиенты, WhatsApp, договоры',s:['leads','funnels','client','chat']},
 'Расчётчик':{av:'РС',n:'Ольга',note:'Очередь расчётов, расчёт пенсии, отправка клиенту',s:['queue','calc','client']},
 'Сопровождающий':{av:'СП',n:'Марина',note:'Клиенты на сопровождении: шаги, документы, сроки',s:['soprov','client','chat']}
};
let role='Исполнительный директор',cur='dash',theme='light';

const SRC=[['ig','Instagram','#c13584'],['tt','TikTok','#111111'],['site','Сайт','#2a7de1'],['wa','WhatsApp','#1f9a56'],['ref','Рекомендация','#8a6d3b']];
const SRN=k=>(SRC.find(s=>s[0]===k)||['',k])[1];
const MGR=['Айгерим','Дана','Сауле','Жанна','Ерлан'];
const CALCS=['Ольга','Наталья','Гульнара'];
/* Воронки: у каждой свои этапы — меняются кнопкой */
let FUN={
 lead:{n:'Заявки (бесплатная консультация)',st:['Новая','Связались','Консультация','Думает','Готов оплатить']},
 calc:{n:'Расчёт пенсии',st:['Оплачен','Документы собраны','В расчёте','Расчёт готов','Разобран с клиентом']},
 sopr:{n:'Сопровождение',st:['Договор','Документы','Подача','Ожидание ответа','Пенсия назначена']},
 prak:{n:'Практикум',st:['Записался','Оплатил','Учится','Закончил','Отзыв']},
 ins:{n:'Страхование жизни (КСЖ)',st:['Интерес','Подбор компании','Договор КСЖ','Первая выплата','Завершено']}
};
const FUNX=['Повторные обращения','Наследство и вклады','Перерасчёт','Иностранный стаж','Партнёры'];
let curFun='calc';
/* Клиенты */
const NAMES=['Галина Петровна','Сергей Иванович','Айгуль Касымовна','Людмила Сергеевна','Бахыт Жумабекович','Нина Алексеевна','Ерлан Маратович','Татьяна Викторовна','Роза Мухтаровна','Владимир Олегович','Светлана Борисовна','Куаныш Серикович','Валентина Николаевна','Марат Ахметович','Ольга Дмитриевна','Гульсара Ерболовна'];
let CL=NAMES.map((n,i)=>{const f=['lead','calc','calc','sopr','sopr','prak','ins','lead','calc','sopr','lead','ins','calc','prak','sopr','lead'][i];
 return {id:'К-'+(10412+i*7),n,age:[57,61,55,59,62,58,60,56,54,63,57,58,59,61,56,55][i],ph:'+7 7'+['01','05','07','47','77','02'][i%6]+' *** '+String(10+i*3)+' '+String(30+i*4),src:SRC[i%5][0],f,st:(i*3)%5,mg:MGR[i%5],calc:CALCS[i%3],
  sum:{lead:0,calc:45000,sopr:180000,prak:25000,ins:120000}[f],paid:{lead:0,calc:45000,sopr:i%2?90000:180000,prak:25000,ins:i%2?0:120000}[f],
  last:['15.10','15.10','14.10','14.10','13.10','12.10','10.10','15.10'][i%8],drive:'drive.google.com/…/'+n.split(' ')[0].toLowerCase()}});
const CB=id=>CL.find(c=>c.id===id);
let curCl=CL[2].id;
let NOTES={};CL.forEach(c=>NOTES[c.id]=[[c.last+' 11:'+String(10+c.age%40),c.mg,{lead:'Спрашивает, когда может выйти на пенсию и сколько будет получать. Записала на бесплатную консультацию.',calc:'Оплатила расчёт. Ждём справку о стаже и выписку из ЕНПФ — отправила список в WhatsApp.',sopr:'Подписали договор сопровождения, документы у Марины.',prak:'Записалась на практикум «Сам себе пенсионный консультант».',ins:'Интересуется пенсионным аннуитетом, нужен подбор компании.'}[c.f]]]);
NOTES[CL[2].id]=[['15.10 11:40','Ольга','Расчёт готов: три варианта — выход в 58, 60 и 61 год. Отправила PDF клиенту в WhatsApp.'],['14.10 16:20','Ольга','Получила выписку ЕНПФ и справку о стаже. Взяла в расчёт.'],['13.10 10:05','Айгерим','Оплата 45 000 ₸ через Kaspi. Передала расчётчику.'],['12.10 18:30','Айгерим','Бесплатная консультация 20 минут: стаж 34 года, хочет понять, выгодно ли выходить раньше.']];
let MSGS={};MSGS[CL[2].id]=[['12.10 18:02','in','Здравствуйте! Увидела ваше видео в Instagram. Мне 55, когда я могу выйти на пенсию?'],['12.10 18:05','out','Здравствуйте, Айгуль Касымовна! Давайте созвонимся на 20 минут — бесплатно расскажем ваши варианты. Вам удобно сегодня в 18:30?'],['13.10 10:01','in','Решила заказать расчёт, оплатила'],['15.10 11:41','out','Ваш расчёт готов, отправляю файл. Завтра в 11:00 разберём его вместе по телефону.'],['15.10 11:52','in','Спасибо большое! Жду звонка']];
/* Статистики должностей — по неделям */
const STATS=[
 ['Продажи','Заключённые договоры','Айгерим, Дана, Сауле, Жанна, Ерлан',[42,47,39,51,55,49,58,62]],
 ['Расчёты','Сданные расчёты','Ольга, Наталья, Гульнара',[31,34,36,33,40,44,41,47]],
 ['Сопровождение','Назначенные пенсии','Марина, Алия',[6,8,7,9,8,11,12,10]],
 ['Маркетинг','Заявки','таргет, контент',[812,890,760,940,1010,980,1065,1120]],
 ['Практикум','Ученики, закончившие курс','кураторы',[18,22,25,21,27,30,28,33]],
 ['Финансы','Поступления, тыс. ₸','бухгалтерия',[2840,3120,2690,3380,3610,3290,3870,4120]]
];
let AUDIT=[];

const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const srcTag=k=>{const s=SRC.find(x=>x[0]===k)||['',k,'#999'];return `<span class="srct" style="--sc:${s[2]}">${s[1]}</span>`};
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
function spark(v){const w=220,h=54,mx=Math.max(...v)*1.08,mn=Math.min(...v)*0.9,st=w/(v.length-1),P=v.map((x,i)=>[i*st,h-(x-mn)/(mx-mn)*h]);const d=P.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');const up=v[v.length-1]>=v[v.length-2];
 return `<svg class="spk ${up?'up':'down'}" viewBox="0 -4 ${w} ${h+8}" preserveAspectRatio="none"><path d="${d}"/>${P.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3"/>`).join('')}</svg>`}

SC.dash=()=>`<div class="hd"><div><h2>Пульт собственника · ${TODAY}</h2><p>Главные цифры компании на одном экране — с телефона, без погружения в детали. Всё считается само из работы сотрудников.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('leads')"><small>Заявок сегодня</small><b>132</b><span>Instagram 61 · TikTok 38 · сайт 19 · WhatsApp 14</span></div>
  <div class="clk" onclick="go('funnels')"><small>Договоров на неделе</small><b class="g">62</b><span>+4 к прошлой неделе</span></div>
  <div class="clk" onclick="go('pay')"><small>Поступило за неделю</small><b class="a">${tg(4120000)}</b><span>+6% к прошлой неделе</span></div>
  <div class="clk" onclick="go('queue')"><small>Расчётов в работе</small><b>27</b><span>2 просрочены</span></div>
  <div class="clk" onclick="go('soprov')"><small>На сопровождении</small><b>184</b><span>10 пенсий назначено за неделю</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Статистики должностей · 8 недель</h3><div class="sgr">${STATS.slice(0,4).map(s=>`<div class="sg clk" onclick="go('stats')"><small>${s[0]} · ${s[1]}</small><b>${fmt(s[3][7])}</b>${spark(s[3])}</div>`).join('')}</div></div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('leads')"><i></i><div><b>9 заявок без ответа больше 15 минут</b><span>человек написал и ждёт — передано свободному менеджеру</span></div></div>
  <div class="rf bad" onclick="go('queue')"><i></i><div><b>2 расчёта просрочены</b><span>клиентам обещали к сегодняшнему дню</span></div></div>
  <div class="rf" onclick="go('quality')"><i></i><div><b>Проверка качества: 3 разговора ниже нормы</b><span>менеджер не объяснил, что входит в расчёт</span></div></div>
  <div class="rf" onclick="go('pay')"><i></i><div><b>Рассрочка: 6 клиентов не внесли платёж</b><span>напоминание в WhatsApp ушло автоматически</span></div></div></div></div>
 <div class="g2"><div class="pan"><h3>Договоры по услугам, октябрь</h3>${bars([['Расчёт пенсии',148],['Сопровождение',61],['Практикум',72],['Страхование жизни',23]])}</div>
 <div class="pan"><h3>Откуда клиенты, октябрь</h3>${bars([['Instagram',1840],['TikTok',1120],['Сайт',540],['WhatsApp',420],['Рекомендации',96]])}</div></div>
 ${said('Владельцы не владеют цифрами… для них это прям спасение','Собственник открывает пульт и видит главное: заявки, договоры, деньги и статистики — растёт или падает.')}`;

SC.stats=()=>`<div class="hd"><div><h2>Статистики должностей</h2><p>У каждой должности — своя главная цифра и график по неделям. Сразу видно, где рост, а где падение, и чья это зона. Цифры не вносятся руками — система считает их из работы.</p></div></div>
 <div class="sgr big">${STATS.map(s=>{const v=s[3],d=v[7]-v[6];return `<div class="pan sg2"><div class="sgh"><div><small>${s[0]}</small><b>${s[1]}</b><span>${s[2]}</span></div><em class="${d>=0?'pos':'neg'}">${d>=0?'▲':'▼'} ${fmt(Math.abs(d))}</em></div><div class="sgv">${fmt(v[7])}</div>${spark(v)}<div class="sgl"><span>8 недель назад</span><span>эта неделя</span></div></div>`}).join('')}</div>
 ${said('Это может видно, что вот — может что-то по цифрам. И это очень продающий элемент')}`;

/* Заявки */
let LQ='';
const LEADS=[['15.10 13:58','Нурлан Асетович','+7 701 *** 12 40','ig','Хочу узнать, когда смогу выйти на пенсию','Айгерим','новая',0],['15.10 13:55','Елена Викторовна','+7 777 *** 09 17','tt','Сколько я буду получать? Стаж 30 лет','Дана','связались',3],['15.10 13:51','Асель Каримовна','+7 705 *** 33 81','site','Заявка с сайта: расчёт пенсии','Сауле','консультация',7],['15.10 13:40','Виктор Павлович','+7 701 *** 76 02','wa','Можно ли выйти раньше через страхование?','Жанна','связались',2],['15.10 13:32','Зауре Сериковна','+7 747 *** 55 18','ig','Мама выходит на пенсию, нужна помощь с документами','—','новая',26],['15.10 13:20','Олег Николаевич','+7 702 *** 41 90','tt','Иностранный стаж, Россия','Ерлан','консультация',4],['15.10 13:05','Мадина Ержановна','+7 707 *** 18 26','ref','От Галины Петровны','Айгерим','готов оплатить',1]];
SC.leads=()=>`<div class="hd"><div><h2>Заявки</h2><p>Instagram, TikTok, сайты и все номера WhatsApp — в один список. Каждая заявка сразу у свободного менеджера. Если человеку не ответили за 15 минут — заявка подсвечивается и уходит другому.</p></div><div class="btns"><button class="bt p" onclick="act('Новая заявка: имя, телефон, вопрос, откуда — за полминуты.')">+ Заявка</button></div></div>
 <div class="wid"><div><small>Сегодня</small><b>132</b><span>в среднем 100–150 в день</span></div><div><small>Ответили за 15 минут</small><b class="g">93%</b><span>9 ждали дольше</span></div><div><small>Записались на консультацию</small><b>41</b><span>31% от заявок</span></div><div><small>Оплатили</small><b class="a">14</b><span>сегодня</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Человек</th><th>Откуда</th><th>Что спрашивает</th><th>Менеджер</th><th>Ждёт ответа</th><th>Этап</th></tr></thead><tbody>${LEADS.map(l=>`<tr class="${l[7]>15?'rowbad':''}"><td class="mono">${l[0]}</td><td><b>${l[1]}</b><br><small>${l[2]}</small></td><td>${srcTag(l[3])}</td><td>${esc(l[4])}</td><td>${l[5]}</td><td class="mono ${l[7]>15?'neg':''}">${l[7]?l[7]+' мин':'—'}</td><td>${tag(l[6],l[6]==='готов оплатить'?'g':l[6]==='новая'?'w':'i')}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Лидогенерация… где-то сто — сто пятьдесят лидов в день падает, привязано к Instagram, TikTok, сайтам')}`;

/* Воронки */
SC.funnels=()=>{const F=FUN[curFun];const L=CL.filter(c=>c.f===curFun);
 return `<div class="hd"><div><h2>Воронки</h2><p>Каждая услуга — своя воронка со своими этапами. Клиента переносят с этапа на этап одним нажатием. Этапы и воронки вы меняете сами, без программиста: добавить, переименовать, поменять местами.</p></div><div class="btns"><button class="bt" onclick="editStages()">✎ Изменить этапы</button><button class="bt" onclick="act('Новая воронка: название и этапы — появится в списке сразу.')">+ Воронка</button></div></div>
 <div class="seg">${Object.keys(FUN).map(k=>`<a class="${curFun===k?'on':''}" onclick="curFun='${k}';render()">${FUN[k].n}</a>`).join('')}${FUNX.map(x=>`<a class="muted" onclick="act('Воронка «${x}» — так же, со своими этапами.')">${x}</a>`).join('')}</div>
 <div class="kb k5">${F.st.map((s,i)=>{const C=L.filter(c=>c.st===i);return `<div class="kc"><div class="kh"><b>${s}</b><span>${C.length}</span></div>${C.map(c=>`<div class="kd" onclick="openCl('${c.id}')"><div class="kt"><b>${esc(c.n)}</b>${srcTag(c.src)}</div><div class="km">${c.age} лет · ${c.mg}</div><div class="kf"><span>${c.sum?tg(c.sum):'консультация'}</span>${i<F.st.length-1?`<a class="mv" onclick="event.stopPropagation();moveCl('${c.id}')">дальше →</a>`:''}</div></div>`).join('')||'<div class="kempty">пусто</div>'}</div>`}).join('')}</div>
 ${said('У меня уже десять воронок, потому что у нас разные пакеты услуг: расчёты, сопровождение, практикум, страхование жизни')}`};
function moveCl(id){const c=CB(id);if(c.st<FUN[c.f].st.length-1){c.st++;NOTES[id].unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,'Этап: '+FUN[c.f].st[c.st]]);render();toast(`${esc(c.n)} → «${FUN[c.f].st[c.st]}».`)}}
function editStages(){const F=FUN[curFun];const v=prompt('Этапы через запятую — как вам удобно:',F.st.join(', '));if(!v)return;const a=v.split(',').map(x=>x.trim()).filter(Boolean);if(a.length<2){toast('Нужно хотя бы два этапа.');return}F.st=a;CL.forEach(c=>{if(c.f===curFun&&c.st>=a.length)c.st=a.length-1});render();toast('Этапы сохранены — так их видят все сотрудники.')}
function openCl(id){curCl=id;go('client')}

/* Карточка клиента */
SC.client=()=>{const c=CB(curCl),F=FUN[c.f];
 return `<div class="hd"><div><h2>${esc(c.n)} · ${c.id}</h2><p>${c.age} лет · ${c.ph} · пришла из ${SRN(c.src)} · менеджер ${c.mg}${c.f==='calc'?' · расчётчик '+c.calc:''}</p></div><div class="btns"><button class="bt" onclick="go('funnels')">← К воронке</button><button class="bt" onclick="act('Звонок с записью разговора — запись попадёт в карточку.')">☎ Позвонить</button><button class="bt p" onclick="go('chat')">WhatsApp</button></div></div>
 <div class="stp">${F.st.map((s,i)=>`<div class="${i===c.st?'on':i<c.st?'ok':''}" onclick="CB('${c.id}').st=${i};render()"><i>${i+1}</i>${s}</div>`).join('')}</div>
 <div class="g2 g21"><div>
  <div class="pan"><h3>Что происходит</h3><div class="cms">${NOTES[c.id].map(n=>`<div class="cm"><small>${n[0]} · ${esc(n[1])}</small>${esc(n[2])}</div>`).join('')}</div><div class="qin"><input id="ntIn" placeholder="Комментарий: о чём договорились, что дальше"><button class="bt p" onclick="addNote('${c.id}')">Добавить</button></div></div>
  <div class="pan"><h3>Переписка WhatsApp</h3><div class="msgs">${(MSGS[c.id]||[[c.last+' 10:00','in','Здравствуйте, хочу узнать про пенсию']]).map(m=>`<div class="mg ${m[1]==='out'?'mout':''}"><small>${m[0]}</small>${esc(m[2])}</div>`).join('')}</div></div>
 </div><div>
  <div class="pan"><h3>Услуги и оплата</h3><div class="kv"><span>Воронка</span><b>${F.n}</b></div><div class="kv"><span>Этап</span><b>${F.st[c.st]}</b></div><div class="kv"><span>Стоимость</span><b>${c.sum?tg(c.sum):'бесплатная консультация'}</b></div><div class="kv"><span>Оплачено</span><b class="pos">${tg(c.paid)}</b></div>${c.sum>c.paid?`<div class="kv on"><span><strong>Осталось</strong></span><b>${tg(c.sum-c.paid)}</b></div>`:''}</div>
  <div class="pan"><h3>Документы клиента</h3>${[['PDF','Расчёт пенсии · 3 варианта'],['JPG','Удостоверение личности'],['PDF','Выписка ЕНПФ'],['PDF','Справка о стаже'],['DOC','Договор на услуги']].map(d=>`<div class="cdoc"><i>${d[0]}</i><span>${d[1]}</span></div>`).join('')}<p class="hint">Файлы хранятся прямо в карточке — не нужно искать ссылку на Google Диск. Старые ссылки на Диск при переезде сохраняются.</p><div class="kv"><span>Папка на Google Диске</span><b class="mono">${c.drive}</b></div></div>
  <div class="pan"><h3>Другие услуги клиента</h3><div class="kv"><span>Практикум</span><b>не покупала</b></div><div class="kv"><span>Страхование жизни</span><b>интерес · спросить на разборе</b></div><button class="bt sm" onclick="act('Клиента добавили в воронку «Сопровождение» — менеджер получит задачу.')">+ Предложить сопровождение</button></div>
 </div></div>
 ${said('К каждому клиенту привязана ссылка на Google Диск, чтобы я могла поднять и переписку видеть, и работу саму, контролировать качество')}`};
function addNote(id){const v=(document.getElementById('ntIn').value||'').trim();if(!v){toast('Напишите комментарий.');return}NOTES[id].unshift([TODAY.slice(0,5)+' '+NOW,ROLES[role].n,v]);render();toast('Комментарий сохранён.')}

/* WhatsApp */
let WAN='1';
SC.chat=()=>{const c=CB(curCl);return `<div class="hd"><div><h2>WhatsApp — все номера в одном окне</h2><p>Три номера компании, включая российский, — в одном окне. Переписка сразу в карточке клиента, ответ видит руководитель. Подключение — за 5 000 ₸ в месяц за номер вместо 36 000 ₸.</p></div></div>
 <div class="seg">${[['1','Номер 1 · +7 7** · KZ'],['2','Номер 2 · +7 7** · KZ'],['3','Номер 3 · +7 9** · RU']].map(n=>`<a class="${WAN===n[0]?'on':''}" onclick="WAN='${n[0]}';render()">${n[1]}</a>`).join('')}</div>
 <div class="wa"><div class="wal">${CL.slice(0,8).map(x=>`<div class="wac ${x.id===curCl?'on':''}" onclick="curCl='${x.id}';render()"><b>${esc(x.n)}</b><span>${x.last} · ${FUN[x.f].n}</span></div>`).join('')}</div>
 <div class="pan"><h3>${esc(c.n)} <small>· ${FUN[c.f].st[c.st]}</small></h3><div class="msgs">${(MSGS[c.id]||[[c.last+' 10:00','in','Здравствуйте, хочу узнать про пенсию']]).map(m=>`<div class="mg ${m[1]==='out'?'mout':''}"><small>${m[0]}</small>${esc(m[2])}</div>`).join('')}</div>
  <div class="tpls">${['Записать на консультацию','Список документов для расчёта','Расчёт готов','Напомнить об оплате'].map(t=>`<a onclick="document.getElementById('waIn').value='${t}: '">${t}</a>`).join('')}</div>
  <div class="qin"><input id="waIn" placeholder="Сообщение клиенту"><button class="bt p" onclick="waSend()">Отправить</button></div></div></div>
 ${said('Мне самое главное, чтобы WhatsApp стабильно работал')}`};
function waSend(){const v=(document.getElementById('waIn').value||'').trim();if(!v)return;(MSGS[curCl]=MSGS[curCl]||[]).push([TODAY.slice(0,5)+' '+NOW,'out',v]);render();toast('Сообщение ушло с номера '+WAN+' и сохранено в карточке клиента.')}

/* Расчёт пенсии — пример; формулы и тексты заводятся ваши */
let CI={age:55,stag:34,s98:6,zp:420000,enpf:6800000};
function calcRes(){const base=Math.round(36000+Math.min(CI.stag,35)*400);const sol=Math.round(Math.min(CI.zp,600000)*0.6*Math.min(CI.s98,20)/20*0.25);const enpf=Math.round(CI.enpf/12/18);return {base,sol,enpf,tot:base+sol+enpf}}
SC.calc=()=>{const r=calcRes();
 return `<div class="hd"><div><h2>Расчёт пенсии</h2><p>Расчётчик вводит данные клиента — система сразу считает по формулам компании и собирает понятный файл для клиента. Его можно отправить в WhatsApp одной кнопкой. Здесь — упрощённый пример, при запуске заведём ваши формулы.</p></div></div>
 <div class="g2"><div class="pan"><h3>Данные клиента · ${esc(CB(curCl).n)}</h3><div class="form">${[['age','Возраст',CI.age],['stag','Общий стаж, лет',CI.stag],['s98','Стаж до 1998 года, лет',CI.s98],['zp','Средняя зарплата, ₸',CI.zp],['enpf','Накопления в ЕНПФ, ₸',CI.enpf]].map(f=>`<label>${f[1]}<input type="number" value="${f[2]}" onchange="CI.${f[0]}=+this.value||0;render()"></label>`).join('')}</div><p class="hint">Данные берутся из выписки ЕНПФ и справки о стаже, которые клиент прислал в WhatsApp — файлы уже в карточке.</p></div>
 <div class="pan"><h3>Результат</h3><div class="kv"><span>Базовая пенсия (пример)</span><b>${tg(r.base)}</b></div><div class="kv"><span>Солидарная пенсия (пример)</span><b>${tg(r.sol)}</b></div><div class="kv"><span>Выплаты из ЕНПФ (пример)</span><b>${tg(r.enpf)}</b></div><div class="kv on"><span><strong>Всего в месяц</strong></span><b>${tg(r.tot)}</b></div>
  <h3 style="margin-top:14px">Варианты выхода</h3>${bars([['В 58 лет',r.tot*0.9,tg(r.tot*0.9)],['В 60 лет',r.tot,tg(r.tot)],['В 61 год',r.tot*1.06,tg(r.tot*1.06)]])}
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="calcSend()">Отправить клиенту в WhatsApp</button><button class="bt" onclick="act('PDF «Ваш расчёт пенсии» с логотипом компании скачан.')">⇩ PDF</button></div></div></div>
 ${said('У расчётчиков — сданный расчёт','Расчёт хранится в карточке клиента, сданный расчёт сам попадает в статистику и сдельную оплату расчётчика.')}`};
function calcSend(){const c=CB(curCl);(MSGS[c.id]=MSGS[c.id]||[]).push([TODAY.slice(0,5)+' '+NOW,'out','Ваш расчёт пенсии готов — файл во вложении.']);toast(`Файл расчёта отправлен ${esc(c.n)} в WhatsApp и сохранён в карточке. Расчёт засчитан ${c.calc}.`)}

/* Очередь расчётов */
let QUEUE=[['К-10426','Айгуль Касымовна','Ольга','14.10','15.10','готов'],['К-10433','Людмила Сергеевна','Наталья','13.10','15.10','в расчёте'],['К-10468','Роза Мухтаровна','Гульнара','12.10','14.10','просрочен'],['К-10496','Валентина Николаевна','Ольга','14.10','16.10','ждём документы'],['К-10503','Марат Ахметович','Наталья','15.10','17.10','в расчёте'],['К-10510','Ольга Дмитриевна','Гульнара','11.10','14.10','просрочен'],['К-10517','Гульсара Ерболовна','Ольга','15.10','18.10','новый']];
SC.queue=()=>`<div class="hd"><div><h2>Расчёты в работе</h2><p>Очередь расчётчиков: у каждого расчёта — срок, который обещали клиенту. Просроченные видны сразу. Новый расчёт приходит к расчётчику сам, когда клиент оплатил.</p></div></div>
 <div class="wid">${CALCS.map(n=>`<div><small>${n}</small><b>${QUEUE.filter(q=>q[2]===n&&q[5]!=='готов').length} в работе</b><span>сдано за неделю: ${{Ольга:18,Наталья:16,Гульнара:13}[n]}</span></div>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Расчётчик</th><th>Оплачен</th><th>Обещали к</th><th>Статус</th></tr></thead><tbody>${QUEUE.map(q=>`<tr class="${q[5]==='просрочен'?'rowbad':''} clk" onclick="openCl('${q[0]}')"><td><b>${q[1]}</b><br><small>${q[0]}</small></td><td>${q[2]}</td><td class="mono">${q[3]}</td><td class="mono">${q[4]}</td><td>${tag(q[5],q[5]==='готов'?'g':q[5]==='просрочен'?'r':q[5]==='ждём документы'?'w':'i')}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Сопровождение */
const SOPR=['Договор подписан','Документы собраны','Заявление подано','Ответ получен','Пенсия назначена'];
SC.soprov=()=>`<div class="hd"><div><h2>Сопровождение</h2><p>Клиенты, которых ведут до назначения пенсии. По каждому — шаги, документы и ближайший срок. Клиенту автоматически уходит сообщение, когда шаг пройден: он спокоен, а сопровождающему меньше звонков.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th>${SOPR.map(s=>`<th>${s}</th>`).join('')}<th>Следующий шаг</th></tr></thead><tbody>${CL.filter(c=>c.f==='sopr').map((c,i)=>`<tr class="clk" onclick="openCl('${c.id}')"><td><b>${esc(c.n)}</b><br><small>Марина</small></td>${SOPR.map((s,j)=>`<td class="ck">${j<=c.st?'<span class="okd">✓</span>':'<span class="nod">·</span>'}</td>`).join('')}<td>${['Собрать справку о стаже до 20.10','Подать заявление 17.10','Ждём ответ до 24.10','Проверить первую выплату','—'][c.st]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Есть услуга сопровождения — отдельная воронка, отдельно людей ведём')}`;

/* Контроль качества */
SC.quality=()=>`<div class="hd"><div><h2>Контроль качества</h2><p>Каждый день система выбирает несколько разговоров и расчётов для проверки. Руководитель слушает запись, смотрит переписку и расчёт, ставит оценку по чек-листу — без поиска по Google Диску.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Что проверяем</th><th>Сотрудник</th><th>Клиент</th><th>Чек-лист</th><th>Оценка</th></tr></thead><tbody>${[['Консультация · запись 18 мин','Дана','Елена Викторовна','поздоровалась по имени ✓ · выяснила стаж ✓ · объяснила, что входит в расчёт ✗',7],['Расчёт пенсии','Ольга','Айгуль Касымовна','все источники ✓ · три варианта ✓ · файл понятный ✓',10],['Переписка WhatsApp','Ерлан','Олег Николаевич','ответ за 5 минут ✓ · список документов ✓',9],['Консультация · запись 11 мин','Жанна','Виктор Павлович','выяснила цель ✗ · предложила расчёт ✓',6],['Сопровождение','Марина','Людмила Сергеевна','клиент знает следующий шаг ✓ · сроки ✓',9]].map(r=>`<tr class="${r[4]<8?'rowwarn':''}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="cmt">${r[3]}</td><td class="mono"><b>${r[4]}/10</b></td></tr>`).join('')}</tbody></table></div><button class="bt sm" onclick="act('Пункты чек-листа вы задаёте сами — для продаж, расчётов и сопровождения свои.')">Изменить чек-лист</button></div>
 ${said('Контролировать качество… видеть, чтобы предоставили услугу качественно')}`;

/* Оплаты */
SC.pay=()=>`<div class="hd"><div><h2>Оплаты</h2><p>Кто, за что и сколько заплатил — Kaspi, перевод, рассрочка. Если в рассрочке пропущен платёж, клиенту уходит напоминание, а менеджеру — задача.</p></div><div class="btns"><button class="bt" onclick="act('Excel с оплатами скачан.')">⇩ Excel</button></div></div>
 <div class="wid"><div><small>Сегодня</small><b class="g">${tg(612000)}</b><span>14 оплат</span></div><div><small>Неделя</small><b>${tg(4120000)}</b><span>Kaspi 71% · перевод 22% · рассрочка 7%</span></div><div><small>Рассрочки</small><b>38 клиентов</b><span>6 пропустили платёж</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Клиент</th><th>Услуга</th><th>Сумма</th><th>Как</th><th>Менеджер</th></tr></thead><tbody>${CL.filter(c=>c.paid).slice(0,9).map((c,i)=>`<tr class="clk" onclick="openCl('${c.id}')"><td class="mono">${c.last} ${10+i}:${String(5+i*6).padStart(2,'0')}</td><td>${esc(c.n)}</td><td>${FUN[c.f].n}</td><td class="mono pos">${tg(c.paid)}</td><td>${['Kaspi','перевод','Kaspi','рассрочка'][i%4]}</td><td>${c.mg}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Сдельная оплата */
SC.salary=()=>`<div class="hd"><div><h2>Сдельная оплата · октябрь</h2><p>Вы платите за результат — система считает его сама. Продавцам — за заключённые договоры, расчётчикам — за сданные расчёты, сопровождающим — за назначенные пенсии. Ставки задаёте вы.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>За что платим</th><th>Результат</th><th>Ставка</th><th>Начислено</th></tr></thead><tbody>${[['Айгерим','Продажи','договоры',38,6000],['Дана','Продажи','договоры',31,6000],['Сауле','Продажи','договоры',27,6000],['Ольга','Расчёты','сданные расчёты',41,4500],['Наталья','Расчёты','сданные расчёты',36,4500],['Гульнара','Расчёты','сданные расчёты',29,4500],['Марина','Сопровождение','назначенные пенсии',14,15000]].map(r=>`<tr><td><b>${r[0]}</b><br><small>${r[1]}</small></td><td>${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${tg(r[4])}</td><td class="mono"><b>${tg(r[3]*r[4])}</b></td></tr>`).join('')}</tbody></table></div><p class="hint">Ставки и суммы — пример. При запуске заведём ваши правила, включая проценты и бонусы.</p></div>
 ${said('У нас сдельщина, и мы не платим людям за время, которое они просидели, — мы платим за результат')}`;

/* Переезд из Битрикса */
let MV=0;
const MVS=[['Выгрузка','Забираем из Битрикса всё: лиды, сделки, клиентов, комментарии, файлы и ссылки на Google Диск'],['Проверка','Сверяем количество: сколько было в Битриксе — столько стало у вас'],['Воронки','Раскладываем сделки по вашим 10 воронкам и этапам'],['Параллельно','Неделю можно работать и там, и там — ничего не теряется'],['Готово','Битрикс больше не нужен; он оплачен до января — успеваем']];
SC.move=()=>`<div class="hd"><div><h2>Переезд из Битрикса</h2><p>Боитесь потерять базу — это нормально. Переезд занимает 2–3 дня, и мы сверяем каждую цифру: сколько было в Битриксе, столько будет у вас. Битрикс оплачен до января — переезжаем спокойно, без спешки.</p></div></div>
 <div class="mvs">${MVS.map((s,i)=>`<div class="mv ${i<MV?'ok':i===MV?'on':''}" onclick="MV=${i};render()"><i>${i<MV?'✓':i+1}</i><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
 <div class="pan"><h3>Сверка после переноса</h3><div class="tw"><table class="t"><thead><tr><th>Что</th><th>В Битриксе</th><th>У вас</th><th></th></tr></thead><tbody>${[['Лиды в архиве','25 140','25 140'],['Клиенты','10 386','10 386'],['Сделки','14 902','14 902'],['Комментарии и история','312 480','312 480'],['Ссылки на Google Диск','10 211','10 211'],['Сотрудники и доступы','25','25']].map(r=>`<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${MV>=2?r[2]:'—'}</td><td>${MV>=2?tag('совпадает ✓','g'):tag('после проверки','')}</td></tr>`).join('')}</tbody></table></div><button class="bt sm p" onclick="MV=Math.min(4,MV+1);render()">Следующий шаг переезда →</button></div>
 ${said('У меня страх: столько лидов, в архиве двадцать пять тысяч, база клиентов больше десяти тысяч — как это всё плавно перенести, чтобы не потерять','Недавно перенесли из Битрикса компанию со 150 000 клиентов — перенос занял 2–3 дня.')}`;

/* Расходы в месяц */
SC.costs=()=>`<div class="hd"><div><h2>Расходы в месяц: сейчас и после</h2><p>Свою программу вы оплачиваете один раз. Дальше остаются только мелкие ежемесячные расходы — без абонплаты за систему и без доплат за сотрудников и память.</p></div></div>
 <div class="g2"><div class="pan cmp bad"><h3>Сейчас</h3><div class="kv"><span>Битрикс24, тариф «Профессиональный»</span><b>по вашему счёту</b></div><div class="kv"><span>WhatsApp: 3 номера × ~36 000 ₸</span><b>≈ 108 000 ₸</b></div><div class="kv"><span>Интегратор Битрикса</span><b>≈ 10 часов в год</b></div><div class="kv"><span>Не хватает памяти — переход на тариф выше</span><b>дороже</b></div><div class="kv on"><span><strong>Всего, по вашим словам</strong></span><b>≈ 300 000 ₸ в месяц</b></div></div>
 <div class="pan cmp good"><h3>После</h3><div class="kv"><span>Своя программа — абонплаты нет</span><b>0 ₸</b></div><div class="kv"><span>WhatsApp: 3 номера × 5 000 ₸</span><b>15 000 ₸</b></div><div class="kv"><span>Сервер (где хранится программа и база)</span><b>≈ 5–10 $ ≈ 2 500–5 000 ₸</b></div><div class="kv"><span>Звонки с записью — если подключите</span><b>по тарифу оператора</b></div><div class="kv"><span>Сотрудники и память</span><b>без ограничений</b></div><div class="kv on"><span><strong>Всего</strong></span><b>≈ 20 000–30 000 ₸ в месяц</b></div></div></div>
 <div class="pan"><h3>Поддержка после запуска</h3><div class="kv"><span>Первые 3 месяца</span><b>бесплатно: исправляем всё, что работает не так, как договорились</b></div><div class="kv"><span>Потом — только когда нужно</span><b>20 $ в час · без ежемесячной платы</b></div><div class="kv"><span>Если, как сейчас с Битриксом, нужно ~10 часов в год</span><b>≈ 200 $ в год</b></div><div class="kv"><span>Где хранятся программа, база и доступы</span><b>на сервере, оформленном на вашу компанию; ключи — у вас</b></div></div>
 ${said('Чтобы мы понимали: вместо трёхсот тысяч мы уйдём на тридцать')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Один платёж за программу, сделанную под вашу компанию. Сначала — основное за 2 недели, потом доводим вместе с вами: что удобно, что неудобно. Программа, база и код — ваши.</p></div></div>
 <div class="pk1"><div><small>Стоимость</small><b>2 000 000 ₸</b><span>один раз · без абонплаты</span></div><div><small>Срок</small><b>4–6 недель</b><span>основное — около 2 недель</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>200 000 ₸</b><span>после подписания договора</span></div><div><small>Основное готово · 45%</small><b>900 000 ₸</b><span>заявки, воронки, карточка, WhatsApp</span></div><div><small>Всё готово · 45%</small><b>900 000 ₸</b><span>после доводки, переезда и обучения</span></div></div>
 <div class="mvs"><div class="mv ok"><i>1</i><b>Демо</b><span>четверг, 14:00 — с собственником</span></div><div class="mv on"><i>2</i><b>Основное · 2 недели</b><span>заявки, воронки, карточка клиента, WhatsApp</span></div><div class="mv"><i>3</i><b>Доводка с вами</b><span>расчёт, сопровождение, оплаты, статистики</span></div><div class="mv"><i>4</i><b>Переезд · 2–3 дня</b><span>вся база из Битрикса со сверкой</span></div><div class="mv"><i>5</i><b>Обучение</b><span>каждого сотрудника по его работе</span></div></div>`;

/* Карточки, каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей программе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase();const c=CL.find(x=>(x.n+x.ph+x.id).toLowerCase().includes(v));if(c){openCl(c.id)}else toast('Ищите по имени, телефону или номеру клиента.')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Исполнительный директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ОПОРА</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='leads'?'<em>9</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['leads','Заявки'],['funnels','Воронки'],['chat','WhatsApp'],['costs','Расходы']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Опора';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();const a=document.getElementById('addBtn');if(a)a.style.display=allowed('leads')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт собственника: заявки, договоры, деньги и статистики — на одном экране.'],
 ['stats','2 · Статистики должностей: растёт или падает, по неделям.'],
 ['leads','3 · Заявки из Instagram, TikTok, сайтов и WhatsApp — в один список.'],
 ['funnels','4 · Воронки по услугам. Этапы меняете сами.'],
 ['client','5 · Карточка клиента: переписка, документы, оплата — вместо ссылок на Диск.'],
 ['chat','6 · Все номера WhatsApp в одном окне.'],
 ['calc','7 · Расчёт пенсии — сразу файл клиенту.'],
 ['salary','8 · Сдельная оплата считается сама.'],
 ['move','9 · Переезд из Битрикса за 2–3 дня, со сверкой.'],
 ['costs','10 · Расходы: было ~300 тыс. в месяц — станет ~20–30 тыс.'],
 ['launch','11 · Стоимость: 2 млн один раз, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
