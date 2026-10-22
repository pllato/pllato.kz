/* FitnessBlitz — единая система сети фитнес-клубов: прозрачные финансы сети по клубам (доходы из кассы и эквайринга, расходы по выпискам банков, наличным и снятиям), выписки и 1С, кабинет инвестора и франчайзи, воронка продаж, клиенты и абонементы на всю сеть, касса ресепшн и бар, склад бара, турникеты по QR, групповые занятия, кабинет тренера, мобильное приложение, клубы и роялти, единое ядро. Все клубы, люди и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n/1e6).toFixed(1).replace('.',',')+' млн';
const TODAY='23.10.2026',NOW='11:30';
const LOGO_I='<img src="/app/img/blitz/logo.jpg" width="28" height="28" alt="" style="border-radius:6px;object-fit:cover;display:block">';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;

const SEC=[
 {k:'top',n:'Сеть',sub:[['dash','Пульт сети'],['clubs','Клубы и франшизы']]},
 {k:'fn',n:'Финансы',sub:[['fin','Финансы по клубам'],['money','Деньги: доходы и расходы'],['bank','Выписки банков и 1С'],['inv','Кабинет инвестора']]},
 {k:'sl',n:'Продажи и клиенты',sub:[['funnel','Воронка отдела продаж'],['members','Клиенты и абонементы']]},
 {k:'cl',n:'Клуб',sub:[['pos','Касса: ресепшн и бар'],['shop','Бар и склад'],['access','Турникеты и посещения'],['classes','Групповые занятия']]},
 {k:'tr',n:'Тренеры и приложение',sub:[['trainer','Кабинет тренера'],['app','Мобильное приложение']]},
 {k:'sys',n:'Система',sub:[['core','Единое ядро и модули'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Управляющая компания':{av:'МР',n:'Мурат',note:'Вся сеть: финансы, клубы, продажи, приложение',s:ALL.slice()},
 'Финансист':{av:'ФН',n:'Айгерим',note:'Доходы, расходы, выписки, 1С, отчёты для инвесторов',s:['dash','fin','money','bank','inv','clubs']},
 'Администратор клуба':{av:'АД',n:'Дана · Самал',note:'Касса, бар, турникеты, запись, клиенты своего клуба',s:['pos','shop','access','classes','members','funnel']},
 'Тренер':{av:'ТР',n:'Арман · Самал',note:'Свои клиенты, программы, питание, групповые занятия',s:['trainer','classes','members']},
 'Инвестор / франчайзи':{av:'ИН',n:'Клуб Астана · Есиль',note:'Только свой клуб: выручка, расходы, прибыль, роялти',s:['inv']}
};
let role='Управляющая компания',cur='dash',theme='light';

/* Клубы: название, город, формат (свой / франшиза), выручка месяц, расходы, активные абонементы, посещений за день, загрузка % */
let CLUBS=[
 ['Самал','Алматы','свой',38.4,27.9,2140,612,78],['Шевченко','Алматы','свой',31.2,23.6,1780,498,71],['Алмагуль','Алматы','свой',26.8,21.4,1460,401,64],['Аль-Фараби','Алматы','свой',34.1,24.8,1910,560,75],
 ['Есиль','Астана','франшиза',29.6,21.2,1640,455,70],['Мангилик Ел','Астана','франшиза',24.3,19.8,1350,372,62],['Сарыарка','Астана','франшиза',18.9,16.7,1080,301,55],
 ['Нурсат','Шымкент','франшиза',17.4,14.1,990,290,58],['Центр','Шымкент','франшиза',14.2,12.9,830,231,49],['Мега','Караганда','франшиза',16.8,13.6,960,276,57],['Майкудук','Караганда','франшиза',11.9,11.2,690,188,44],
 ['14 мкр','Актау','франшиза',15.6,12.4,880,260,60],['Нурсая','Атырау','франшиза',16.1,12.8,900,248,59],['Батыс','Актобе','франшиза',13.7,11.6,780,219,52],
 ['Центр','Уральск','франшиза',10.8,10.1,620,170,46],['Торайгыров','Павлодар','франшиза',11.4,9.8,650,182,48],['Центр','Костанай','франшиза',9.9,9.4,560,151,41],['Ульба','Усть-Каменогорск','франшиза',10.6,9.6,600,166,45]
];
const CL=i=>CLUBS[i];
const rev=()=>CLUBS.reduce((a,c)=>a+c[3],0),exp=()=>CLUBS.reduce((a,c)=>a+c[4],0),mem=()=>CLUBS.reduce((a,c)=>a+c[5],0),vis=()=>CLUBS.reduce((a,c)=>a+c[6],0);
let curClub=4;
/* Клиенты */
let MEM=[
 {id:'BL-04812',n:'Ержан Сатыбалдиев',ph:'+7 701 *** 45 12',ab:'Безлимит 12 мес · вся сеть',to:'14.03.2027',home:'Самал',vis:'вчера, Есиль (Астана)',tr:'Арман',auto:true,debt:0},
 {id:'BL-05107',n:'Алия Нурланова',ph:'+7 777 *** 08 33',ab:'Утро 6 мес · Самал',to:'02.11.2026',home:'Самал',vis:'сегодня 07:12',tr:'—',auto:false,debt:0},
 {id:'BL-05233',n:'Данияр Касымов',ph:'+7 705 *** 77 01',ab:'Безлимит 1 мес · вся сеть',to:'25.10.2026',home:'Шевченко',vis:'сегодня 09:40',tr:'Арман',auto:true,debt:0},
 {id:'BL-03998',n:'Мадина Ахметова',ph:'+7 702 *** 64 18',ab:'Групповые 3 мес',to:'истёк 10.10',home:'Аль-Фараби',vis:'09.10',tr:'—',auto:false,debt:0},
 {id:'BL-05301',n:'Тимур Абенов',ph:'+7 707 *** 50 44',ab:'Пробная неделя',to:'27.10.2026',home:'Алмагуль',vis:'сегодня 10:05',tr:'—',auto:false,debt:0},
 {id:'BL-04477',n:'Сауле Бекова',ph:'+7 747 *** 26 61',ab:'Безлимит 12 мес · вся сеть',to:'01.06.2027',home:'Есиль',vis:'вчера, Самал (Алматы)',tr:'Ольга',auto:true,debt:0}
];
let AUDIT=[];
const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const cn=c=>c[1]+' · '+c[0];
const prof=c=>c[3]-c[4],marg=c=>Math.round(prof(c)/c[3]*100);

/* Пульт сети */
SC.dash=()=>`<div class="hd"><div><h2>Пульт сети · ${TODAY}</h2><p>18 клубов в 11 городах на одном экране: деньги, клиенты, посещения и что требует внимания — сегодня, без звонков управляющим.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('fin')"><small>Выручка сети, октябрь</small><b>${mln(rev()*1e6)} ₸</b><span>прибыль ${mln((rev()-exp())*1e6)} ₸ · ${Math.round((rev()-exp())/rev()*100)}%</span></div>
  <div class="clk" onclick="go('members')"><small>Активных абонементов</small><b>${fmt(mem())}</b><span>автопродление у 41%</span></div>
  <div class="clk" onclick="go('access')"><small>Посещений сегодня</small><b>${fmt(vis())}</b><span>из них в чужом клубе сети — 312</span></div>
  <div class="clk" onclick="go('funnel')"><small>Новые лиды сегодня</small><b class="a">86</b><span>Instagram 41 · сайт 19 · WhatsApp 17 · звонки 9</span></div>
  <div class="clk" onclick="go('money')"><small>Не разнесено</small><b class="w">${tg(1840000)}</b><span>14 операций из выписок</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Выручка по клубам, млн ₸</h3>${bars(CLUBS.map(c=>[cn(c),c[3],c[3].toFixed(1).replace('.',',')]).sort((a,b)=>b[1]-a[1]).slice(0,10))}<p class="hint">Показаны 10 из 18 — полный список в «Клубы и франшизы».</p></div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('money')"><i></i><div><b>Снятие наличных 640 000 ₸ без чеков</b><span>Костанай · ждём закрывающие документы 3 дня</span></div></div>
  <div class="rf bad" onclick="go('clubs')"><i></i><div><b>Костанай: маржа 5%</b><span>загрузка 41% — ниже порога сети</span></div></div>
  <div class="rf" onclick="go('members')"><i></i><div><b>612 абонементов истекают за 7 дней</b><span>напоминание с кнопкой продления ушло в приложение</span></div></div>
  <div class="rf" onclick="go('shop')"><i></i><div><b>Бар Самал: протеиновые батончики закончатся завтра</b><span>заказ поставщику сформирован</span></div></div>
  <div class="rf" onclick="go('inv')"><i></i><div><b>Отчёт инвесторам за сентябрь готов</b><span>14 франчайзи · роялти начислено</span></div></div></div></div>`;

/* Клубы */
SC.clubs=()=>`<div class="hd"><div><h2>Клубы и франшизы</h2><p>Все клубы сети с одинаковыми показателями — свои и франшизы. Видно, кто растёт, у кого падает загрузка и маржа. Роялти франчайзи считается из их фактической выручки, без отчётов «на словах».</p></div><div class="btns"><button class="bt p" onclick="act('Новый клуб: город, адрес, формат, франчайзи — справочники и касса создаются сами.')">+ Клуб</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клуб</th><th>Формат</th><th style="text-align:right">Выручка</th><th style="text-align:right">Расходы</th><th style="text-align:right">Прибыль</th><th>Маржа</th><th>Абонементы</th><th>Загрузка</th><th style="text-align:right">Роялти 6%</th></tr></thead><tbody>${CLUBS.map((c,i)=>`<tr class="clk ${marg(c)<10?'rowwarn':''}" onclick="curClub=${i};go('inv')"><td><b>${c[1]}</b> · ${c[0]}</td><td>${tag(c[2],c[2]==='свой'?'b':'')}</td><td class="mono" style="text-align:right">${c[3].toFixed(1)}</td><td class="mono" style="text-align:right">${c[4].toFixed(1)}</td><td class="mono" style="text-align:right">${prof(c).toFixed(1)}</td><td class="mono ${marg(c)<10?'neg':''}">${marg(c)}%</td><td class="mono">${fmt(c[5])}</td><td><div class="bz-occ"><i style="width:${c[7]}%"></i></div><small class="mono">${c[7]}%</small></td><td class="mono" style="text-align:right">${c[2]==='франшиза'?fmt(c[3]*1e6*.06):'—'}</td></tr>`).join('')}</tbody></table></div><p class="hint">Суммы в млн ₸ за октябрь. Нажмите на клуб — откроется его кабинет.</p></div>
 ${said('18 клубов; это франшизы. Клиент по одной карте или по мобильному может посещать все клубы по Казахстану')}`;

/* Финансы по клубам (P&L) */
let FC=0;
const PL=[['Абонементы',0.71],['Персональные тренировки',0.14],['Бар и магазин',0.09],['Групповые программы',0.04],['Аренда площадей партнёрам',0.02]];
const PE=[['Аренда помещения',0.31],['ФОТ и бонусы тренеров',0.36],['Коммунальные услуги',0.08],['Маркетинг',0.07],['Закуп бара',0.05],['Ремонт и оборудование',0.06],['Налоги',0.07]];
SC.fin=()=>{const c=CL(FC);const r=c[3]*1e6,e=c[4]*1e6;
 return `<div class="hd"><div><h2>Финансы по клубам · октябрь</h2><p>Как у Додо: каждый клуб — открытый отчёт о прибылях и убытках. Доходы приходят из кассы и эквайринга сами, расходы — из выписок банков, кассы и снятий. Ничего не вбивается руками в Excel.</p></div><div class="btns"><select class="bz-sel" onchange="FC=+this.value;render()">${CLUBS.map((x,i)=>`<option value="${i}" ${i===FC?'selected':''}>${cn(x)}</option>`).join('')}</select><button class="bt" onclick="act('P&L клуба в Excel — по месяцам, со статьями и расшифровкой.')">Excel</button></div></div>
 <div class="wid"><div><small>Выручка</small><b>${tg(r)}</b><span>план ${tg(r*1.05)} · ${Math.round(100/1.05)}%</span></div><div><small>Расходы</small><b>${tg(e)}</b><span>${Math.round(e/r*100)}% от выручки</span></div><div><small>Прибыль</small><b class="g">${tg(r-e)}</b><span>маржа ${marg(c)}%</span></div><div><small>Выручка на 1 абонемент</small><b>${tg(r/c[5])}</b><span>в среднем по сети ${tg(rev()*1e6/mem())}</span></div></div>
 <div class="g2"><div class="pan"><h3>Доходы</h3><div class="tw"><table class="t"><tbody>${PL.map(x=>`<tr><td>${x[0]}</td><td class="mono" style="text-align:right">${fmt(r*x[1])}</td><td class="mono" style="text-align:right">${Math.round(x[1]*100)}%</td></tr>`).join('')}<tr><td><b>Итого доходы</b></td><td class="mono" style="text-align:right"><b>${fmt(r)}</b></td><td></td></tr></tbody></table></div></div>
 <div class="pan"><h3>Расходы</h3><div class="tw"><table class="t"><tbody>${PE.map(x=>`<tr><td>${x[0]}</td><td class="mono" style="text-align:right">${fmt(e*x[1])}</td><td class="mono" style="text-align:right">${Math.round(x[1]*100)}%</td></tr>`).join('')}<tr><td><b>Итого расходы</b></td><td class="mono" style="text-align:right"><b>${fmt(e)}</b></td><td></td></tr></tbody></table></div></div></div>
 ${said('Хотели бы разработать модуль, где будут финансы вестись, — на примере Додо, чтобы всё было прозрачно и онлайн')}`};

/* Деньги: 2 канала дохода, 3 канала расхода */
let OPS=[['23.10 09:12','доход','Эквайринг Kaspi · касса Самал','Абонементы, бар',1284000,'авто из кассы','ok'],['23.10 08:50','доход','Онлайн-продажи приложения','12 абонементов',1912000,'авто из эквайринга','ok'],['22.10 17:40','расход','Безнал · Halyk, выписка','Аренда Шевченко · ТОО «Арена Плаза»',4800000,'разнесено по правилу','ok'],['22.10 15:05','расход','Наличные из кассы','Химия для бассейна · Алмагуль',86000,'чек сфотографирован','ok'],['22.10 12:30','расход','Снятие со счёта','Зарплата 3 сотрудникам с заблокированными картами · Костанай',640000,'ждём ведомость','w'],['22.10 10:10','расход','Безнал · Kaspi Business','ИП Ахметов',318000,'не разнесено — выберите статью','r']];
SC.money=()=>`<div class="hd"><div><h2>Деньги: доходы и расходы</h2><p>Два канала дохода и три канала расхода сходятся в одну ленту. Доходы — из кассы и эквайринга автоматически. Безналичные расходы — из выписок банков, разносятся по статьям по правилам. Наличные из кассы — с фото чека. Снятия со счёта — только с ведомостью, иначе висят «к закрытию».</p></div></div>
 <div class="g3 bz-ch">${[['Доход · касса и эквайринг','авто','g'],['Доход · онлайн и приложение','авто','g'],['Расход · безнал по выпискам','по правилам','i'],['Расход · наличные из кассы','с фото чека','w'],['Расход · снятие со счёта','с ведомостью','r']].map(x=>`<div class="pan"><small>${x[0]}</small><b>${tag(x[1],x[2])}</b></div>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Тип</th><th>Канал</th><th>Назначение</th><th style="text-align:right">Сумма</th><th>Статус</th></tr></thead><tbody>${OPS.map((o,i)=>`<tr class="${o[6]==='r'?'rowbad':o[6]==='w'?'rowwarn':''}"><td class="mono">${o[0]}</td><td>${tag(o[1],o[1]==='доход'?'g':'')}</td><td>${o[2]}</td><td>${o[3]}</td><td class="mono" style="text-align:right">${o[1]==='доход'?'+':'−'}${fmt(o[4])}</td><td>${o[6]==='r'?`<select class="bz-sel" onchange="opSet(${i},this.value)"><option>— статья —</option><option>Закуп бара</option><option>Ремонт и оборудование</option><option>Маркетинг</option></select>`:o[6]==='w'?`<button class="bt sm" onclick="opSet(${i},'ведомость приложена')">Приложить ведомость</button>`:tag(o[5],'g')}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('По расходной части: наличные из кассы, безналичные — по выпискам, и снятие со счёта, когда у сотрудника карта заблокирована. Три канала расходов, два канала доходов')}`;
function opSet(i,v){OPS[i][5]=v;OPS[i][6]='ok';render();toast('Операция разнесена: «'+v+'». Правило запомнено — похожие разнесутся сами.')}

/* Выписки и 1С */
SC.bank=()=>`<div class="hd"><div><h2>Выписки банков и 1С</h2><p>Выписки Kaspi Business, Halyk и других банков загружаются автоматически (по API банка) или файлом. Система узнаёт контрагента и разносит по статье и клубу по правилам. Разнесённое уходит в 1С — бухгалтерия не вводит второй раз.</p></div><div class="btns"><button class="bt p" onclick="act('Выписка загружена: 214 операций, 200 разнесены по правилам, 14 ждут решения.')">⇪ Загрузить выписку</button></div></div>
 <div class="g2 g21"><div class="pan"><h3>Правила разнесения</h3><div class="tw"><table class="t"><thead><tr><th>Если в выписке</th><th>Статья</th><th>Клуб</th><th>Сработало</th></tr></thead><tbody>${[['ТОО «Арена Плаза»','Аренда','Шевченко',12],['АО «Алматыэнергосбыт»','Коммунальные','по договору',36],['ТОО «Протеин-Опт»','Закуп бара','по накладной',8],['ИП Тренер · договор ГПХ','ФОТ и бонусы тренеров','по тренеру',41],['Meta Platforms','Маркетинг','распределить по выручке',4]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono">${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Обмен с 1С</h3><div class="kv"><span>Разнесённые расходы и поступления</span><b>→ 1С каждый час</b></div><div class="kv"><span>Контрагенты и статьи</span><b>⇄ общие</b></div><div class="kv"><span>Последний обмен</span><b class="pos">11:00 · 186 операций</b></div><div class="kv"><span>Банки</span><b>Kaspi Business · Halyk · Freedom</b></div></div></div>
 ${said('Много интеграций: 1С, выписки банка, расчёты, аналитика')}`;

/* Кабинет инвестора */
SC.inv=()=>{const c=CL(curClub);const r=c[3]*1e6,e=c[4]*1e6;
 return `<div class="hd"><div><h2>Кабинет инвестора · ${cn(c)}</h2><p>Инвестор или франчайзи видит только свой клуб: выручку, расходы, прибыль, роялти и динамику по месяцам — в любое время, с телефона. Цифры те же, что у управляющей компании, без отдельных отчётов.</p></div><div class="btns"><select class="bz-sel" onchange="curClub=+this.value;render()">${CLUBS.map((x,i)=>`<option value="${i}" ${i===curClub?'selected':''}>${cn(x)}</option>`).join('')}</select></div></div>
 <div class="wid"><div><small>Выручка октябрь</small><b>${tg(r)}</b><span>+6% к сентябрю</span></div><div><small>Прибыль</small><b class="g">${tg(r-e)}</b><span>маржа ${marg(c)}%</span></div><div><small>Роялти УК</small><b>${c[2]==='франшиза'?tg(r*.06):'—'}</b><span>${c[2]==='франшиза'?'6% от выручки':'собственный клуб'}</span></div><div><small>Окупаемость вложений</small><b>${c[2]==='франшиза'?Math.round(180/ Math.max(1,marg(c)))+' мес.':'—'}</b><span>при текущей марже</span></div></div>
 <div class="g2"><div class="pan"><h3>Выручка по месяцам, млн ₸</h3>${bars(['май','июнь','июль','август','сентябрь','октябрь'].map((m,i)=>[m,c[3]*(0.82+i*0.036),(c[3]*(0.82+i*0.036)).toFixed(1).replace('.',',')]))}</div>
 <div class="pan"><h3>Документы</h3>${['P&L за сентябрь.pdf','Акт роялти за сентябрь.pdf','Выписки клуба за октябрь.xlsx'].map(d=>`<div class="kv"><span>${d}</span><b class="mono">${d.endsWith('pdf')?'PDF':'XLSX'}</b></div>`).join('')}<p class="hint">Инвестор не видит другие клубы, клиентов и персональные данные — только цифры своего клуба.</p></div></div>
 ${said('Модуль для инвесторов, где уже будут видны финансовые показатели')}`};
/* Воронка отдела продаж */
const LST=[['new','Новый лид','#7a8792'],['call','Дозвон','#2f6fb0'],['trial','Пробное занятие','#b0731a'],['visit','Пришёл в клуб','#6b5bd3'],['paid','Купил абонемент','#1f8a5b']];
let LEADS=[['Л-9012','Айгерим С.','Instagram','Самал','new','перезвонить за 15 мин',1],['Л-9013','Руслан Т.','Сайт','Аль-Фараби','new','перезвонить за 15 мин',0],['Л-9008','Камила Б.','WhatsApp','Самал','call','пробное на завтра 19:00',0],['Л-9001','Ерлан К.','Звонок','Шевченко','trial','пробное сегодня 18:00',0],['Л-8997','Асель М.','Instagram','Есиль','visit','показать зал, предложить абонемент',0],['Л-8990','Динара О.','Сайт','Самал','paid','безлимит 12 мес · 289 000 ₸',0]];
SC.funnel=()=>`<div class="hd"><div><h2>Воронка отдела продаж</h2><p>Лиды из Instagram, сайта, WhatsApp и звонков (Sipuni) попадают сюда с источником и клубом. Пробное занятие записывается в расписание клуба, визит фиксирует турникет, покупка — касса или приложение. Отдел продаж и клуб видят одно и то же — обмен данными не нужен.</p></div><div class="btns"><button class="bt p" onclick="act('Новый лид: имя, телефон, клуб, источник.')">+ Лид</button></div></div>
 <div class="kb k5">${LST.map(s=>`<div class="kc" style="--sc:${s[2]}"><div class="kh"><b>${s[1]}</b><span>${LEADS.filter(l=>l[4]===s[0]).length}</span></div>${LEADS.filter(l=>l[4]===s[0]).map(l=>`<div class="kd ${l[6]?'alarm':''}"><div class="kt"><b>${l[0]}</b><span class="src">${l[2]}</span></div><div class="kr">${esc(l[1])}</div><div class="km">${l[3]}</div><div class="nx">→ ${l[5]}</div>${s[0]!=='paid'?`<div class="kf"><a class="mvb" onclick="event.stopPropagation();lNext('${l[0]}')">дальше →</a></div>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>
 <div class="pan"><h3>Конверсия за октябрь</h3><div class="bz-fn">${[['Лидов',1842],['Дозвонились',1410],['Пробное',684],['Пришли',521],['Купили',318]].map((r,i,a)=>`<div><small>${r[0]}</small><b>${fmt(r[1])}</b><span>${i?Math.round(r[1]/a[i-1][1]*100)+'%':''}</span></div>`).join('')}</div></div>
 ${said('Интеграция для обмена данными между воронкой и залом, потому что отдел продаж отдельный и обслуживает несколько клубов')}`;
function lNext(id){const l=LEADS.find(x=>x[0]===id),i=LST.findIndex(s=>s[0]===l[4]);l[4]=LST[i+1][0];l[6]=0;render();toast(`${id} → «${LST[i+1][1]}».${l[4]==='trial'?' Пробное записано в расписание клуба, клиенту ушло напоминание.':l[4]==='paid'?' Абонемент оформлен, клиенту отправлена ссылка на приложение.':''}`)}

/* Клиенты */
SC.members=()=>`<div class="hd"><div><h2>Клиенты и абонементы</h2><p>Один клиент — одна карта на всю сеть. Абонемент «вся сеть» пускает в любой из 18 клубов, домашний клуб получает выручку, а визит в чужом клубе учитывается для расчётов между клубами. Автопродление по карте — у клиентов, которые его включили.</p></div><div class="btns"><button class="bt p" onclick="act('Новый клиент: телефон, фото для турникета, абонемент.')">+ Клиент</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Карта</th><th>Клиент</th><th>Абонемент</th><th>До</th><th>Домашний клуб</th><th>Последний визит</th><th>Тренер</th><th>Автопродление</th></tr></thead><tbody>${MEM.map(m=>`<tr class="${/истёк/.test(m.to)?'rowbad':/2[5-7]\.10|02\.11/.test(m.to)?'rowwarn':''}"><td class="mono"><b>${m.id}</b></td><td><b>${m.n}</b><br><small>${m.ph}</small></td><td>${m.ab}</td><td class="mono">${m.to}</td><td>${m.home}</td><td>${m.vis}</td><td>${m.tr}</td><td>${m.auto?tag('вкл.','g'):tag('нет','')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Абонементы сети</h3>${[['Безлимит 12 мес · вся сеть','289 000 ₸'],['Безлимит 1 мес · вся сеть','29 000 ₸'],['Утро 6 мес · один клуб','119 000 ₸'],['Групповые 3 мес','69 000 ₸'],['Пробная неделя','бесплатно']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<p class="hint">Цены для примера — задаёт управляющая компания для всей сети или для клуба.</p></div>
 <div class="pan"><h3>Удержание</h3>${bars([['Продлили в октябре',71,'71%'],['Истекают за 7 дней',612,'612'],['Не были 14+ дней',438,'438']])}</div></div>`;

/* Касса */
let CART=[['Безлимит 1 мес · вся сеть',29000],['Протеиновый коктейль',1800],['Вода 0,5',400]];
SC.pos=()=>{const s=CART.reduce((a,c)=>a+c[1],0);
 return `<div class="hd"><div><h2>Касса: ресепшн и бар · Самал</h2><p>Одна касса для абонементов, персональных тренировок и бара. Моноблок на ресепшн и на баре — один и тот же интерфейс. Оплата Kaspi QR, картой или наличными, чек в онлайн-кассу, продажа сразу в финансах клуба и сети.</p></div></div>
 <div class="g2 g21"><div class="pan"><div class="bz-ci"><input placeholder="Найти клиента по телефону или карте" value="+7 705 *** 77 01 · Данияр Касымов"><button class="bt p" onclick="toast('Клиент найден: BL-05233, абонемент до 25.10 — предложите продление.')">Найти</button></div>
  <div class="tw"><table class="t"><tbody>${CART.map(c=>`<tr><td><b>${c[0]}</b></td><td class="mono" style="text-align:right">${fmt(c[1])}</td></tr>`).join('')}<tr><td><b>К оплате</b></td><td class="mono" style="text-align:right"><b>${tg(s)}</b></td></tr></tbody></table></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="posPay('Kaspi QR')">Kaspi QR</button><button class="bt" onclick="posPay('картой')">Картой</button><button class="bt" onclick="posPay('наличными')">Наличными</button></div></div>
 <div class="pan"><h3>Смена · Дана</h3><div class="kv"><span>Чеков</span><b>48</b></div><div class="kv"><span>Абонементы</span><b>${tg(612000)}</b></div><div class="kv"><span>Бар</span><b>${tg(84600)}</b></div><div class="kv"><span>Наличные в кассе</span><b>${tg(46200)}</b></div><div class="btns l"><button class="bt sm" onclick="act('Смена закрыта: Z-отчёт, сверка наличных, итоги — в финансы клуба.')">Закрыть смену</button></div></div></div>`};
function posPay(m){toast(`Оплачено ${m}: ${tg(CART.reduce((a,c)=>a+c[1],0))}. Абонемент продлён до 25.11, бар списан со склада, чек в онлайн-кассе.`);CART=[];render()}

/* Бар и склад */
SC.shop=()=>`<div class="hd"><div><h2>Бар и склад · Самал</h2><p>Остатки бара и магазина (протеин, батончики, вода, экипировка) по каждому клубу. Продажа списывает со склада, приход — по накладной, инвентаризация — раз в неделю с телефона. Что заканчивается — в заказ поставщику.</p></div><div class="btns"><button class="bt p" onclick="act('Приход по накладной: поставщик, товары, себестоимость.')">+ Приход</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Остаток</th><th>Продано за 7 дней</th><th style="text-align:right">Цена</th><th>Маржа</th></tr></thead><tbody>${[['Протеиновый коктейль (порция)',64,210,1800,'58%'],['Протеиновый батончик',6,88,900,'44%'],['Вода 0,5',140,320,400,'60%'],['Изотоник',22,61,900,'47%'],['Перчатки для зала',9,4,6500,'52%'],['Шейкер FitnessBlitz',31,7,3500,'65%']].map(r=>`<tr class="${r[1]<10?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono ${r[1]<10?'neg':''}">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono" style="text-align:right">${fmt(r[3])}</td><td class="mono">${r[4]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Ещё есть магазин, мы всё-таки продаём товары; остатки, хранение, инвентаризация')}`;

/* Турникеты */
SC.access=()=>`<div class="hd"><div><h2>Турникеты и посещения</h2><p>Клиент проходит по QR из приложения или по карте — в любой клуб сети. Турникет проверяет абонемент онлайн: истёк — не пустит и подскажет продлить. Работает и при перебое интернета: клуб хранит список действующих абонементов локально и досылает визиты позже.</p></div></div>
 <div class="wid"><div><small>Сейчас в клубах</small><b>1 284</b><span>Самал — 146</span></div><div><small>Посещений сегодня</small><b>${fmt(vis())}</b><span>в чужом клубе сети — 312</span></div><div><small>Отказов турникета</small><b class="a">27</b><span>истёк абонемент — 19, заморозка — 8</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Клиент</th><th>Клуб</th><th>Способ</th><th>Результат</th></tr></thead><tbody>${[['11:28','Ержан Сатыбалдиев','Самал','QR приложения','проход · абонемент вся сеть'],['11:26','Мадина Ахметова','Аль-Фараби','карта','отказ · истёк 10.10 — предложено продлить в приложении'],['11:20','Сауле Бекова (Есиль)','Самал','QR приложения','проход · гость из Астаны, визит учтён для расчётов'],['11:12','Тимур Абенов','Алмагуль','карта','проход · пробная неделя']].map(r=>`<tr class="${r[4].startsWith('отказ')?'rowwarn':''}"><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Это должно работать в режиме онлайн: клиент по одной карте или по мобильному может посещать все клубы по Казахстану')}`;

/* Групповые занятия */
SC.classes=()=>`<div class="hd"><div><h2>Групповые занятия · Самал · сегодня</h2><p>Расписание групповых программ клуба. Клиенты записываются из приложения, места считаются сами, лист ожидания поднимается, если кто-то отменил. Тренер отмечает пришедших — визит засчитывается.</p></div><div class="btns"><button class="bt p" onclick="act('Новое занятие: программа, тренер, зал, места, повтор по дням.')">+ Занятие</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Программа</th><th>Тренер</th><th>Зал</th><th>Записано</th><th>Лист ожидания</th></tr></thead><tbody>${[['08:00','Функциональный тренинг','Ольга','Зал 1',[18,20],0],['10:00','Пилатес','Мадина','Зал 2',[12,12],3],['18:00','Сайкл','Арман','Сайкл-студия',[24,24],6],['19:00','Бокс','Ерлан','Зал 1',[14,16],0],['20:00','Стретчинг','Мадина','Зал 2',[9,14],0]].map(r=>`<tr class="${r[4][0]>=r[4][1]?'rowwarn':''}"><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td><td><div class="bz-occ"><i style="width:${r[4][0]/r[4][1]*100}%"></i></div><small class="mono">${r[4][0]} / ${r[4][1]}</small></td><td class="mono">${r[5]||'—'}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Через мобильное приложение покупать абонементы, продлевать, записываться на групповые программы')}`;
/* Кабинет тренера */
let TC=0;
const TCL=[['Ержан Сатыбалдиев','Похудение · 3 тренировки в неделю',[96.4,94.1,92.8,91.5,90.2],'1 900 ккал · белок 140 г'],['Данияр Касымов','Набор массы · 4 тренировки',[71.2,72.0,72.9,73.4,74.1],'3 100 ккал · белок 160 г'],['Алия Нурланова','Тонус · 2 тренировки',[61.0,60.6,60.2,59.9,59.7],'1 700 ккал · белок 110 г']];
SC.trainer=()=>{const c=TCL[TC];
 return `<div class="hd"><div><h2>Кабинет тренера · Арман · Самал</h2><p>Тренер ведёт своих клиентов: цели, замеры и вес, план тренировок и питания. Клиент видит свою программу и прогресс в приложении, отмечает выполненное. Руководитель видит загрузку и удержание клиентов у каждого тренера.</p></div></div>
 <div class="seg">${TCL.map((x,i)=>`<a class="${i===TC?'on':''}" onclick="TC=${i};render()">${x[0]}</a>`).join('')}</div>
 <div class="g2 g21"><div class="pan"><h3>${c[0]} · ${c[1]}</h3><h3 style="margin-top:6px">Вес за 4 недели, кг</h3>${bars(c[2].map((v,i)=>['неделя '+(i+1),v,v.toFixed(1).replace('.',',')]))}
  <h3 style="margin-top:12px">Программа на неделю</h3>${[['Пн','Грудь, трицепс · 6 упражнений','выполнено'],['Ср','Спина, бицепс · 6 упражнений','выполнено'],['Пт','Ноги, плечи · 7 упражнений','сегодня'],['Вс','Кардио 40 минут','—']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]==='выполнено'?tag(r[2],'g'):r[2]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Питание</h3><div class="kv"><span>Норма</span><b>${c[3]}</b></div><div class="kv"><span>План</span><b>5 приёмов · шаблон «${c[1].split(' ·')[0]}»</b></div><div class="btns l"><button class="bt sm" onclick="act('План питания отправлен клиенту в приложение.')">Отправить в приложение</button></div>
  <h3 style="margin-top:12px">Мои показатели · октябрь</h3><div class="kv"><span>Клиентов</span><b>24</b></div><div class="kv"><span>Персональных тренировок</span><b>186</b></div><div class="kv"><span>Продлили персональные</span><b>83%</b></div></div></div>
 ${said('Модуль для тренеров: вести клиентов, записывать результаты, вес, прописывать план питания, программы тренировок')}`};

/* Мобильное приложение */
SC.app=()=>`<div class="hd"><div><h2>Мобильное приложение клиента</h2><p>Одно приложение для всей сети в App Store и Google Play. QR для турникета в любом клубе, абонемент и продление с автоплатежом, запись на групповые занятия, программа и прогресс от тренера, уведомления. Позже — геймификация: баллы за посещения, челленджи между клубами.</p></div></div>
 <div class="g3 bz-phones">${[['Вход в клуб','<div class="bz-qr">▦▦▦<br>▦ ▦<br>▦▦▦</div><b>Покажите QR на турникете</b><span>действует в 18 клубах</span>'],['Абонемент','<b>Безлимит · вся сеть</b><span>до 25.10.2026 · осталось 2 дня</span><a>Продлить · 29 000 ₸</a><span>автопродление по карте: выкл.</span>'],['Запись','<b>Сайкл · 18:00 · Арман</b><span>мест нет · вы 2-й в листе ожидания</span><b style="margin-top:8px">Бокс · 19:00 · Ерлан</b><a>Записаться · 2 места</a>'],['Прогресс','<b>−6,2 кг за 4 недели</b><span>12 тренировок · серия 9 дней</span><span>программа на пятницу: ноги, плечи</span>']].map(p=>`<div class="pan"><h3>${p[0]}</h3><div class="phmini">${p[1]}</div></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Оплаты в приложении</h3><div class="kv"><span>Покупка и продление абонемента</span><b>эквайринг банка</b></div><div class="kv"><span>Автопродление (рекуррентные платежи)</span><b>по согласию клиента</b></div><div class="kv"><span>Персональные тренировки, бар</span><b>по желанию</b></div></div>
 <div class="pan"><h3>Публикация</h3><div class="kv"><span>App Store и Google Play</span><b>2–3 недели на проверку</b></div><div class="kv"><span>Аккаунты разработчика</span><b>на компанию клиента</b></div></div></div>
 ${said('Мобильное приложение: доступ на турникетную систему, эквайринг, рекуррентные платежи, онлайн-продажа, запись на групповые программы')}`;

/* Единое ядро */
SC.core=()=>`<div class="hd"><div><h2>Единое ядро и модули</h2><p>Финансы нельзя делать отдельно от всего остального: деньги рождаются в кассе, приложении и абонементах. Поэтому сначала — единое ядро (клиенты, клубы, абонементы, деньги, права), а модули подключаются к нему и не дублируют данные. Переход с текущих программ — по одному модулю, без остановки клубов.</p></div></div>
 <div class="bz-core"><div class="c"><b>ЯДРО</b><span>клиенты и карты · клубы и франшизы · абонементы · деньги · права и роли · журнал</span></div>${[['Финансы и инвесторы','P&L клубов, выписки, 1С, кабинет инвестора'],['Продажи и клиенты','воронка, Instagram, WhatsApp, Sipuni'],['Клуб','касса, бар и склад, турникеты, занятия'],['Тренеры','программы, питание, прогресс'],['Приложение','QR, оплаты, запись, прогресс'],['Геймификация','баллы, челленджи — позже']].map(m=>`<div class="m"><b>${m[0]}</b><span>${m[1]}</span></div>`).join('')}</div>
 <div class="pan"><h3>Переход с текущих программ</h3><div class="kv"><span>Сейчас: TS Portal (касса, учёт), приложение, Excel по финансам</span><b>работают параллельно</b></div><div class="kv"><span>Шаг 1: ядро + выбранный первый модуль</span><b>данные переносим из TS Portal</b></div><div class="kv"><span>Шаг 2–4: остальные модули по очереди</span><b>старые программы выключаются по мере готовности</b></div></div>
 ${tip('Почему не стыковать с чужой системой','Стыковка с системой, которую подрядчик потом оставит себе и будет продавать как продукт, — это постоянная зависимость и двойной ввод. Своё ядро остаётся вашим: код, данные и развитие.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Каждый блок — стандартный пакет разработки: 4–6 недель с согласованием каждой версии. Начинаем с ядра и одного блока, который нужнее всего, дальше — по очереди. Платите за каждый блок отдельно, без абонплаты.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Блок</th><th>Что входит</th><th>Срок</th><th style="text-align:right">Стоимость</th></tr></thead><tbody>${[['1. Ядро + финансы и инвесторы','клиенты, клубы, абонементы, права; P&L клубов, 2 канала доходов и 3 расходов, выписки банков, кабинет инвестора','4–6 недель','2 500 000 ₸'],['2. Продажи и клуб','воронка с WhatsApp, Instagram, Sipuni; касса ресепшн и бар, склад, турникеты, групповые занятия','4–6 недель','2 500 000 ₸'],['3. Мобильное приложение','QR-вход в 18 клубов, покупка и автопродление, запись, уведомления; публикация в сторах','4–6 недель + 2–3 на публикацию','2 500 000 ₸'],['4. Тренеры и геймификация','программы, питание, прогресс клиента, баллы и челленджи','4–6 недель','2 500 000 ₸'],['Обмен с 1С','расходы, поступления, контрагенты','вместе с блоком 1','800 000 ₸']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono" style="text-align:right">${r[3]}</td></tr>`).join('')}<tr><td colspan="3"><b>Вся система</b></td><td class="mono" style="text-align:right"><b>≈ 10 800 000 ₸</b></td></tr></tbody></table></div></div>
 <div class="pay3"><div><small>Старт блока · 10%</small><b>250 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 125 000 ₸</b><span>после приёмки базы</span></div><div><small>Сдача · 45%</small><b>1 125 000 ₸</b><span>после полировки</span></div></div>
 <p class="hint">Отдельно: эквайринг и комиссии банка, аккаунты разработчика Apple и Google, сервер (бесплатно или 5–10 $), WhatsApp через Green API ≈ 5 000 ₸ за номер, телефония Sipuni — по тарифу. Порядок блоков выбираете вы.</p>
 ${said('Примерно по срокам и по стоимости можете прикинуть?','Блок — 4–6 недель и около 2,5 млн ₸; четыре блока — около 10 млн ₸.')}`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const m=MEM.find(x=>(x.id+x.n+x.ph).toLowerCase().includes(v));if(m&&v){go('members');return}const c=CLUBS.findIndex(x=>(x[0]+x[1]).toLowerCase().includes(v));if(c>=0&&v){curClub=c;go('inv');return}toast('Ищите по клиенту, карте или клубу: «Ержан», «BL-04812», «Есиль».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">FITNESSBLITZ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='money'?'<em>'+OPS.filter(o=>o[6]!=='ok').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Сеть'],['fin','Финансы'],['funnel','Продажи'],['pos','Касса'],['app','Прилож.']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'FitnessBlitz';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт сети: выручка, абонементы, посещения, лиды, неразнесённые деньги.'],
 ['fin','2 · Финансы каждого клуба — прозрачно, как у Додо.'],
 ['money','3 · Два канала доходов и три канала расходов в одной ленте.'],
 ['bank','4 · Выписки банков разносятся по правилам и уходят в 1С.'],
 ['inv','5 · Кабинет инвестора: только свой клуб.'],
 ['clubs','6 · 18 клубов и роялти франшиз.'],
 ['funnel','7 · Воронка отдела продаж и клубы — одни данные.'],
 ['access','8 · Один QR — любой клуб сети.'],
 ['trainer','9 · Кабинет тренера: вес, питание, программа.'],
 ['app','10 · Мобильное приложение клиента.'],
 ['core','11 · Единое ядро, модули — по очереди.'],
 ['launch','12 · Стоимость: блок ≈ 2,5 млн ₸, 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
