const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const phTag=k=>{const p=PH[k];return `<span class="srct" style="--sc:${p[1]}">${p[0]}</span>`};
const insTag=n=>`<span class="srct" style="--sc:${INC(n)}">${esc(n)}</span>`;
const left=p=>12-p.used;
const subBar=p=>`<div class="bz-sb">${Array.from({length:12},(_,i)=>`<i class="${i<p.used?'on':''}"></i>`).join('')}</div>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
function openPat(id){curPat=id;go('patient')}

/* Пульт */
SC.dash=()=>{const L=lost(),end=PAT.filter(p=>p.phase!=='first'&&left(p)<=1);
 return `<div class="hd"><div><h2>Пульт руководителя · суббота, ${TODAY}</h2><p>Без лишней аналитики — только то, что нужно каждый день: сколько пришло, кто записан, у кого заканчивается абонемент, кто пропал и сколько денег в кассе.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('sched')"><small>Записано сегодня</small><b>${Object.values(SLOT).reduce((a,h)=>a+Object.values(h).reduce((x,v)=>x+v[0],0),0)}</b><span>пришли к ${NOW}: 31 · первичных 2</span></div>
  <div class="clk" onclick="go('remind')"><small>Подтвердили на завтра</small><b class="g">41 из 48</b><span>5 не ответили, 2 просят перенести</span></div>
  <div class="clk" onclick="go('subs')"><small>Абонемент заканчивается</small><b class="w">${end.length+4}</b><span>осталось 0–1 занятие — предложить продление</span></div>
  <div class="clk" onclick="go('lost')"><small>Не были ${LOSTDAYS}+ дней</small><b class="a">${L.length}</b><span>позвонить и узнать причину</span></div>
  <div class="clk" onclick="go('pay')"><small>Касса сегодня</small><b>${tg(338000)}</b><span>5 абонементов · 2 первичных · 1 разовое</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Пациенты в работе · ${PAT.length*21} человек</h3>${bars([['Активный курс',148],['Поддерживающая фаза',71],['Первичный приём на неделе',14],['Пауза или пропали',19]])}
  <h3 style="margin-top:14px">Новые за октябрь — откуда пришли</h3>${bars([['Instagram',11],['Рекомендация',9],['2GIS',6],['Звонок',5],['Сайт',3],['Врачи-ортопеды',2]])}</div>
 <div class="pan"><h3>Требует внимания сегодня</h3>
  ${L.slice(0,3).map(p=>`<div class="rf bad" onclick="go('lost')"><i></i><div><b>${esc(p.n)} — не был ${p.gap} дней</b><span>${esc(p.dx)} · ${p.ins} · позвонить</span></div></div>`).join('')}
  <div class="rf" onclick="openPat('0121')"><i></i><div><b>Сагинтаева Г.: абонемент закончился, долг 36 000 ₸</b><span>сегодня на занятии в 12:00 — продлить на ресепшене</span></div></div>
  <div class="rf" onclick="openPat('0133')"><i></i><div><b>Жумабаев Н.: осталось 1 занятие</b><span>напоминание о продлении уйдёт в WhatsApp само</span></div></div>
  <div class="rf" onclick="go('funnel')"><i></i><div><b>2 обращения без ответа</b><span>Утепова С. (звонок), Давлетов Р. не купил абонемент</span></div></div></div></div>
 ${said('Сильно аналитики не надо — мы сами ведём и отслеживаем. Нам базовая программа нужна')}`};

/* Отметка визита */
let ciId='0147',ciDone=false;
SC.checkin=()=>{const p=PT(ciId);const warn=[];
 if(left(p)<=1&&p.phase!=='first')warn.push(['w',left(p)<=0?'Абонемент закончился — продлить сейчас':'Осталось 1 занятие — предложить продление']);
 if(p.debt)warn.push(['r','Долг '+tg(p.debt)]);
 if(p.gap>=LOSTDAYS)warn.push(['r',`Не был ${p.gap} дней — спросить, всё ли в порядке`]);
 if(p.phase==='first')warn.push(['i','Первичный приём: к врачу '+DOC]);
 return `<div class="hd"><div><h2>Отметка визита</h2><p>Пациент пришёл — администратор набирает номер карты или последние цифры телефона. Сразу видно, кто это, какой диагноз, сколько занятий прошёл и сколько осталось. Одно нажатие — визит отмечен, счётчик абонемента уменьшился. Вместо ручной таблицы.</p></div></div>
 <div class="g2 g21"><div class="pan"><div class="bz-ci"><input id="ciq" value="${p.id}" placeholder="Номер карты или телефон" onkeydown="if(event.key==='Enter')ciFind(this.value)"><button class="bt p" onclick="ciFind(document.getElementById('ciq').value)">Найти</button></div>
  <div class="bz-qk">Попробуйте: ${['0147','0121','0133','0061','0158','0098'].map(x=>`<a onclick="ciFind('${x}')">${x}</a>`).join('')}</div>
  <div class="bz-pc"><div class="bz-av">${esc(p.n.split(' ').map(x=>x[0]).join('').slice(0,2))}</div><div><b>${esc(p.n)}</b><span>Карта № ${p.id} · ${p.age} ${p.kid?'лет · ребёнок':'лет'} · ${esc(p.ph)}</span><span>${esc(p.dx)}</span><div style="margin-top:6px">${phTag(p.phase)} ${insTag(p.ins)}</div></div></div>
  ${p.phase==='first'?'':`<div class="bz-left"><div><small>Прошёл</small><b>${p.used}</b></div><div><small>Осталось</small><b class="${left(p)<=1?'w':''}">${left(p)}</b></div><div><small>Абонемент</small><b>${p.subs}-й</b></div><div><small>Курс</small><b>${p.mo[1]?p.mo[0]+' из '+p.mo[1]+' мес.':p.mo[0]+' мес.'}</b></div></div>${subBar(p)}`}
  ${warn.map(w=>`<div class="fc ${w[0]==='i'?'g':w[0]}"><span>${w[1]}</span></div>`).join('')}
  <div class="btns l" style="margin-top:10px">${ciDone?`<button class="bt" disabled>✓ Визит отмечен в ${NOW}</button>`:`<button class="bt p" onclick="ciMark()">✓ Отметить визит</button>`}${left(p)<=1&&p.phase!=='first'?`<button class="bt" onclick="act('Продление: новый абонемент на 12 занятий, оплата Kaspi QR или наличными. Бонус инструктору начислится сам.')">Продлить абонемент</button>`:''}<button class="bt" onclick="openPat('${p.id}')">Открыть карточку</button></div></div>
 <div class="pan"><h3>Пришли сегодня · 31</h3>${[['11:32','Мухамбетова Динара','0152','3 → 4 из 12'],['11:05','Сагинтаева Гульжан','0121','12 из 12 · продлить'],['10:58','Ким Ольга','0061','вернулась после 14 дней'],['10:02','Жумабаев Нурлан','0133','10 → 11 из 12'],['09:55','Нургалиев Бауыржан','0089','8 → 9 из 12'],['09:01','Сериков Аскар','0147','6 → 7 из 12']].map(r=>`<div class="evt clk" onclick="ciFind('${r[2]}')"><span class="mono">${r[0]}</span><b>${r[2]}</b><span>${r[1]} <em>· ${r[3]}</em></span></div>`).join('')}</div></div>
 ${said('Пациент пришёл — по номеру карты или мобильного вышла фамилия, и сразу видно, сколько занятий прошёл и сколько осталось')}`};
function ciFind(v){v=String(v||'').replace(/\D/g,'');const p=PAT.find(x=>x.id===v.padStart(4,'0'))||PAT.find(x=>v.length>=2&&x.ph.replace(/\D/g,'').endsWith(v));if(!p){toast('Не нашли. Попробуйте номер карты: 0147, 0121, 0133.');return}ciId=p.id;ciDone=false;render()}
function ciMark(){const p=PT(ciId);if(p.phase!=='first'){p.used=Math.min(12,p.used+1)}p.gap=0;p.last='17.10';ciDone=true;render();toast(p.phase==='first'?'Первичный приём отмечен. Врач заполнит диагноз и план лечения.':`Визит отмечен: ${esc(p.n)} — ${p.used} из 12, осталось ${left(p)}.${left(p)<=1?' Пациенту уйдёт напоминание о продлении.':''}`)}

/* Расписание и запись */
let slH='12:00',slI='Ерлан';
SC.sched=()=>{const mine=role==='Инструктор';const cols=mine?INS.filter(x=>x[0]==='Ерлан'):INS;
 return `<div class="hd"><div><h2>Расписание и запись · ${TODAY}</h2><p>Пациент звонит или пишет в WhatsApp — администратор записывает в свободное время к инструктору. Видно, сколько мест занято в каждом часе. Запись сразу ставит напоминания: за день и за 3 часа до занятия.${mine?' Инструктор видит только свои занятия.':''}</p></div><div class="btns"><div class="seg"><a class="on">День</a><a onclick="act('Неделя: те же часы по дням, заполненность цветом.')">Неделя</a></div><button class="bt p" onclick="act('Новая запись: пациент (поиск по карте или телефону), день, время, инструктор. Напоминания поставятся сами.')">+ Записать</button></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t bz-sg"><thead><tr><th>Время</th>${cols.map(c=>`<th>${insTag(c[0])}</th>`).join('')}</tr></thead><tbody>${HOURS.map(h=>`<tr><td class="mono">${h}</td>${cols.map(c=>{const v=(SLOT[h]||{})[c[0]];if(!v)return '<td class="bz-free" onclick="act(\'Свободно — нажмите, чтобы записать пациента.\')">свободно</td>';const full=v[0]>=v[1];return `<td class="clk ${h===slH&&c[0]===slI?'on':''}" onclick="slPick('${h}','${c[0]}')"><div class="bz-sl ${full?'full':''}" style="--sc:${c[1]}"><b>${v[0]}/${v[1]}</b>${v[2]?`<em>${v[2]}</em>`:''}<i style="width:${v[0]/v[1]*100}%"></i></div></td>`}).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>${slH} · ${slI}</h3>${slList().map(r=>`<div class="evt clk" onclick="openPat('${r[0]}')"><span class="mono">${r[0]}</span><b>${esc(r[1])}</b><span>${r[2]}</span></div>`).join('')}<div class="btns l"><button class="bt sm" onclick="act('Пациент записан на ${slH} к инструктору ${slI}. В WhatsApp ушло: «Вы записаны…»')">+ Записать сюда</button></div>
  <h3 style="margin-top:14px">Сегодня по залу</h3><div class="kv"><span>Занятий</span><b>${Object.values(SLOT).reduce((a,h)=>a+Object.keys(h).length,0)}</b></div><div class="kv"><span>Заполненность</span><b>78%</b></div><div class="kv"><span>Пустые часы</span><b>13:00 — обед</b></div></div></div>
 ${said('Звонят, записываются на приём — чтобы в таблице было видно, в какое время записались')}`};
function slList(){const base=[['0158','Тлеуов Арман','первичный · подтвердил'],['0121','Сагинтаева Гульжан','12 из 12 · продлить'],['0152','Мухамбетова Динара','3 из 12'],['0089','Нургалиев Бауыржан','9 из 12'],['0102','Бекова Алия','6 из 12 · ребёнок'],['0133','Жумабаев Нурлан','11 из 12']];const v=(SLOT[slH]||{})[slI]||[0];return base.slice(0,Math.max(1,v[0]))}
function slPick(h,i){slH=h;slI=i;render()}

/* Напоминания */
let RM=[
 ['0147','Сериков Аскар','18.10 09:00','Ерлан','ok','ok'],['0152','Мухамбетова Динара','18.10 10:00','Дана','ok','wait'],['0133','Жумабаев Нурлан','18.10 19:00','Айдар','ok','wait'],
 ['0089','Нургалиев Бауыржан','18.10 09:00','Айдар','ok','ok'],['0140','Петрова Марина','18.10 18:00','Ерлан','none','—'],['0098','Ахметов Даулет','18.10 16:00','Руслан','move','—'],['0102','Бекова Алия','18.10 16:00','Руслан','ok','wait']
];
const RMS={ok:['подтвердил','g'],none:['не ответил','r'],move:['просит перенести','w'],wait:['уйдёт за 3 часа',''],'—':['—','']};
SC.remind=()=>`<div class="hd"><div><h2>Напоминания и подтверждения</h2><p>Система сама пишет пациенту в WhatsApp: за день — «Вы записаны на завтра в 18:00, подтвердите: 1 — приду, 2 — перенести». В день занятия — за 3 часа. Ответ ставит отметку в расписании. Кто не ответил — попадает администратору на звонок.</p></div></div>
 <div class="wid"><div><small>Завтра записано</small><b>48</b><span>напоминание ушло всем в 18:00</span></div><div><small>Подтвердили</small><b class="g">41</b><span>ответ «1»</span></div><div><small>Просят перенести</small><b class="w">2</b><span>администратор предложит время</span></div><div><small>Не ответили</small><b class="a">5</b><span>позвонить до 20:00</span></div></div>
 <div class="g2 g21"><div class="pan"><h3>Завтра, 18.10</h3><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Время</th><th>Инструктор</th><th>За день</th><th>За 3 часа</th><th></th></tr></thead><tbody>${RM.map((r,i)=>`<tr class="${r[4]==='none'?'rowwarn':''}"><td><a class="clk" onclick="openPat('${r[0]}')"><b>${esc(r[1])}</b></a></td><td class="mono">${r[2]}</td><td>${insTag(r[3])}</td><td>${tag(RMS[r[4]][0],RMS[r[4]][1])}</td><td>${tag(RMS[r[5]][0],RMS[r[5]][1])}</td><td>${r[4]==='none'?`<button class="bt sm" onclick="rmCall(${i})">☎ Позвонил</button>`:r[4]==='move'?`<button class="bt sm" onclick="act('Перенос: выберите новое время — пациенту уйдёт новое подтверждение.')">Перенести</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Как это видит пациент</h3><div class="phmini"><b>Центр Бубновского · Уральск</b><div class="mg" style="max-width:100%">Аскар, здравствуйте! Вы записаны на завтра, 18.10, в 09:00 к инструктору Ерлану. Подтвердите, пожалуйста: 1 — приду, 2 — нужно перенести.</div><div class="mg mout" style="max-width:60%">1</div><div class="mg" style="max-width:100%">Спасибо, ждём вас! Возьмите сменную обувь и воду.</div></div>
  <h3 style="margin-top:12px">Шаблоны</h3><div class="kv"><span>За день, 18:00</span><b>вкл.</b></div><div class="kv"><span>За 3 часа</span><b>вкл.</b></div><div class="kv"><span>Осталось 1 занятие по абонементу</span><b>вкл.</b></div><div class="kv"><span>Не был 10 дней</span><b>администратору</b></div><div class="kv"><span>С днём рождения</span><b>вкл.</b></div></div></div>
 ${said('Чтобы была возможность отправить пациенту уведомление за день до приёма, потом в день приёма за несколько часов — чтобы подтвердить')}`;
function rmCall(i){RM[i][4]='ok';render();toast('Отметка: дозвонились, придёт. В расписании — «подтвердил».')}
