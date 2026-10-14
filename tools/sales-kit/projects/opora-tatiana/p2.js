
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
