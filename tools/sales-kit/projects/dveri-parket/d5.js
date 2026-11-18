/* ===== По присланным скриншотам Битрикс24: лиды, мультиворонки с правами, документация и таймлайн, выплаты, автоматизации ===== */
(function(){
 const sale=SEC.find(s=>s.k==='sale');sale.sub.splice(0,0,['leads','Лиды']);
 const ap=SEC.find(s=>s.k==='appr');ap.sub.push(['auto','Автоматизации']);
 SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
 ['leads','auto'].forEach(k=>{if(ALL.indexOf(k)<0)ALL.push(k)});
 const add=(r,ks)=>ks.forEach(k=>{if(ROLES[r].s.indexOf(k)<0)ROLES[r].s.push(k)});
 add('Руководитель',['leads','auto']);add('Специалист CRM',['leads','auto']);add('Оператор КЦ',['leads']);add('Финансист',['appr']);
})();
const BXQ='Канбан как канбан — внутри настроены бизнес-процессы: от распределения сделок до присвоения источников.';
/* --- Лиды --- */
const LST=[['onl','Новый онлайн-лид'],['touch','Касание (совершён звонок)'],['noans','Нет ответа (3 звонка и 1 SMS)'],['work','В работе'],['fin','В работе — итог'],['deal','Сделка создана'],['junk','Брак']];
const LSRC=['Facebook','Сайт','Внесён вручную','Telegram','Instagram','WhatsApp'];
const LPOINT=['Студия дверей','ТГ салон 1','ТГ салон 2','Дизайнер','Сайт','Входные двери'];
let BL=[
 {id:'Л-5120',n:'Новый лид с Facebook',ph:'+7 701 220 41 18',src:'Facebook',pt:'Студия дверей',op:'Оператор КЦ',st:'onl',t:'1 мин назад',calls:0,sms:0},
 {id:'Л-5119',n:'Бауыржан',ph:'+7 705 118 30 44',src:'Внесён вручную',pt:'ТГ салон 1',op:'Оператор КЦ',st:'touch',t:'сегодня 18:46',calls:1,sms:0},
 {id:'Л-5118',n:'Ерасыл, Астана',ph:'+7 777 403 15 62',src:'Сайт',pt:'Студия дверей',op:'Оператор КЦ',st:'touch',t:'сегодня 18:20',calls:2,sms:0},
 {id:'Л-5117',n:'1 звонок',ph:'+7 708 551 72 90',src:'Внесён вручную',pt:'Студия дверей',op:'Оператор КЦ',st:'noans',t:'сегодня 18:51',calls:3,sms:1},
 {id:'Л-5116',n:'Аружан',ph:'+7 747 210 63 05',src:'Instagram',pt:'Дизайнер',op:'Оператор КЦ',st:'noans',t:'вчера',calls:3,sms:1},
 {id:'Л-5115',n:'Нурлан, Усть-Каменогорск',ph:'+7 702 330 18 77',src:'Внесён вручную',pt:'ТГ салон 2',op:'Менеджер Асель',st:'work',t:'сегодня 16:28',calls:2,sms:0},
 {id:'Л-5114',n:'Ильяс, Астана',ph:'+7 701 744 09 31',src:'WhatsApp',pt:'Входные двери',op:'Менеджер Асель',st:'work',t:'сегодня 14:47',calls:1,sms:0},
 {id:'Л-5113',n:'Ардак, Алматы',ph:'+7 705 662 48 13',src:'Telegram',pt:'ТГ салон 1',op:'Менеджер Асель',st:'fin',t:'15 ноября',calls:4,sms:1}
];
let LDRAG=null;
function blMove(id,st){const l=BL.find(x=>x.id===id);if(!l)return;l.st=st;
 if(st==='deal'){PD.unshift({id:'Сд-'+(4200+PD.length),p:'r1',n:l.n,sum:0,rep:false,ct:'Клиенты',src:l.pt,resp:'Руслан',obs:['Руководитель салона'],st:'inv',dref:'D-1187'});toast('Лид <b>'+esc(l.n)+'</b> сконвертирован в сделку воронки «Розница · салон 1». Ответственный назначен автоматически.')}
 else if(st==='junk')toast('Лид закрыт как брак, причина сохраняется.');else toast('Лид → «'+LST.find(x=>x[0]===st)[1]+'».');render()}
function blCall(id){const l=BL.find(x=>x.id===id);l.calls++;if(l.st==='onl')l.st='touch';blRule(l,'Звонок '+l.calls+' из 3: не дозвонились.')}
function blSms(id){const l=BL.find(x=>x.id===id);l.sms++;blRule(l,'SMS отправлено клиенту.')}
function blRule(l,msg){if(l.calls>=3&&l.sms>=1&&['onl','touch'].includes(l.st)){l.st='noans';toast('Правило сработало: 3 звонка и 1 SMS — лид <b>'+esc(l.n)+'</b> автоматически в «Нет ответа».')}else toast(msg);render()}
function blAdd(){BL.unshift({id:'Л-'+(5121+BL.length),n:'Новый лид с сайта',ph:'+7 7__ ___ __ __',src:'Сайт',pt:'Студия дверей',op:'Оператор КЦ',st:'onl',t:'только что',calls:0,sms:0});toast('Быстрый лид создан. Источник «Сайт» присвоен автоматически по каналу.');render()}
SC.leads=()=>`<div class="hd"><div><h2>Лиды</h2><p>Как у вас сейчас в Битрикс24: стадии от «Нового онлайн-лида» до итога. Карточки перетаскиваются; на телефоне — кнопки. Правило: после 3 звонков и 1 SMS лид сам уходит в «Нет ответа».</p></div><div class="btns"><button class="bt p" onclick="blAdd()">+ Быстрый лид</button><button class="bt" onclick="go('auto')">Автоматизации</button></div></div>
<div class="kanban lk">${LST.map(([k,n])=>{const L=BL.filter(l=>l.st===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="if(LDRAG)blMove(LDRAG,'${k}')"><div class="kh"><b>${n}</b><span>${L.length}</span></div><div class="ksum">0 ₸</div>${L.map(l=>`<div class="kc" draggable="true" ondragstart="LDRAG='${l.id}'"><code>${l.id} · ${esc(l.t)}</code><b>${esc(l.n)}</b><span>Источник: ${esc(l.src)}</span><span>Ответственный: ${esc(l.op)}</span><span>Источник звонка: <strong>${esc(l.pt)}</strong></span><span class="mut">Звонков ${l.calls}/3 · SMS ${l.sms}/1</span><div class="kact"><button class="bt sm" onclick="blCall('${l.id}')">Звонок</button><button class="bt sm" onclick="blSms('${l.id}')">SMS</button>${k!=='deal'&&k!=='junk'?`<button class="bt sm" onclick="blMove('${l.id}','deal')">В сделку</button>`:''}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
${said(BXQ,'Стадии, поле «Источник звонка (обращения)» и правило «3 звонка + 1 SMS» — перенесены как у вас. Ничего лишнего.','Айкера, по скриншотам системы')}`;
/* --- Мультиворонки --- */
const PIPES=[['r1','Розница · салон 1','ret'],['r2','Розница · салон 2','ret'],['r3','Розница · Шымкент','ret'],['r4','Розница · салон 4','ret'],['std','Студия дверей','ret'],['prod','Производство','prod'],['part','Перегородки','ret'],['okk','ОКК','okk'],['ent','Входные двери','ret'],['corp','Корпоратив','ret'],['diz','Дизайнеры','ret'],['arch','Архив','arch'],['all','Общая','ret']];
const PST={ret:[['inv','Клиент приглашён в салон'],['vis','Клиент посетил салон'],['hold','Отложка'],['zam','Заявка на замер'],['calc','Расчёт и КП'],['dog','Договор и предоплата'],['fab','Заказ на производстве'],['out','Заказ вышел с производства'],['wh','Заказ на складе'],['mont','Доставка и монтаж'],['done','Закрыто']],
 prod:[['acc','Заказ принят'],['work','В производстве'],['out','Заказ вышел с производства'],['wh','Заказ на складе'],['ship','Отгружено']],
 okk:[['call','Звонок качества'],['claim','Рекламация'],['fix','Устранение'],['ok','Клиент доволен']],arch:[['arch','В архиве']]};
const PIPE_ROLE={'Руководитель':PIPES.map(p=>p[0]),'Специалист CRM':PIPES.map(p=>p[0]),'Менеджер салона':['r1','all'],'Финансист':['prod','okk','corp','all'],'Оператор КЦ':['all']};
let PIPE='r1';
const PEOPLE=['Руслан','Асель','Тимур','Жанна','Бекзат','Руководитель салона','Алексей'];
let PD=[
 {id:'Сд-4188',p:'r1',n:'Карина, дизайнер',sum:0,rep:true,ct:'Дизайнер',src:'Дизайнер',resp:'Руслан',obs:['Алексей'],st:'inv',dref:'D-1185'},
 {id:'Сд-4187',p:'r1',n:'Анна, дизайнер-комплектатор',sum:1,rep:true,ct:'Дизайнер',src:'Дизайнер',resp:'Руслан',obs:['Асель','Руководитель салона'],st:'vis',dref:'D-1185'},
 {id:'Сд-4186',p:'r1',n:'Даулет',sum:500000,rep:false,ct:'Клиенты',src:'ТГ салон 1',resp:'Тимур',obs:['Руководитель салона','Алексей','Тимур'],st:'hold',dref:'D-1182'},
 {id:'Сд-4185',p:'r1',n:'Семья Сейткали · дизайнер Дана',sum:2960500,rep:false,ct:'Клиенты',src:'Дизайнер',resp:'Руслан',obs:['Руководитель салона','Асель','Жанна','Бекзат'],st:'zam',dref:'D-1187'},
 {id:'Сд-4184',p:'r1',n:'Мадияр, ЖК на Сатпаева',sum:1806900,rep:false,ct:'Клиенты',src:'Студия дверей',resp:'Руслан',obs:['Руководитель салона'],st:'calc',dref:'D-1187'},
 {id:'Сд-4183',p:'r1',n:'Гаухар',sum:2310000,rep:true,ct:'Клиенты',src:'Сайт',resp:'Руслан',obs:['Финансист'],st:'out',dref:'D-1181'},
 {id:'Сд-4182',p:'r1',n:'Олжас',sum:640000,rep:false,ct:'Клиенты',src:'Входные двери',resp:'Руслан',obs:[],st:'wh',dref:'D-1182'},
 {id:'Сд-4181',p:'r2',n:'Студия «Лофт»',sum:3410000,rep:true,ct:'Дизайнер',src:'Дизайнер',resp:'Асель',obs:['Руководитель салона'],st:'calc',dref:'D-1185'},
 {id:'Сд-4180',p:'r3',n:'Сауле Б.',sum:2050000,rep:false,ct:'Клиенты',src:'Сайт',resp:'Бекзат',obs:[],st:'zam',dref:'D-1184'},
 {id:'Сд-4179',p:'prod',n:'Заказ 11 дверей · Гульнара Ж.',sum:7920000,rep:false,ct:'Клиенты',src:'Сайт',resp:'Производство',obs:['Тимур'],st:'work',dref:'D-1183'},
 {id:'Сд-4178',p:'corp',n:'ТОО «Нур Девелопмент» · 48 дверей',sum:14400000,rep:true,ct:'Клиенты',src:'Корпоратив',resp:'Тимур',obs:['Алексей','Финансист'],st:'mont',dref:'D-1180'},
 {id:'Сд-4177',p:'okk',n:'Рекламация: перекос коробки',sum:0,rep:false,ct:'Клиенты',src:'ОКК',resp:'Жанна',obs:['Руководитель салона'],st:'claim',dref:'D-1179'},
 {id:'Сд-4176',p:'diz',n:'Дизайнер Айым · комиссия',sum:420000,rep:true,ct:'Дизайнер',src:'Дизайнер',resp:'Асель',obs:['Финансист'],st:'calc',dref:'D-1181'},
 {id:'Сд-4175',p:'all',n:'Общий запрос: паркет 200 м²',sum:6140000,rep:false,ct:'Клиенты',src:'Сайт',resp:'Тимур',obs:[],st:'calc',dref:'D-1186'}
];
let PDRAG=null;
const pipeOK=()=>PIPE_ROLE[role]||['all'];
function pdMove(id,st){const d=PD.find(x=>x.id===id);d.st=st;const n=(PST[PIPES.find(p=>p[0]===d.p)[2]].find(s=>s[0]===st)||['',''])[1];toast('Сделка '+d.id+' → «'+n+'». Наблюдатели ('+(d.obs.length||0)+') получили уведомление.');render()}
function pdQuick(st){PD.unshift({id:'Сд-'+(4189+PD.length),p:PIPE,n:'Быстрая сделка',sum:0,rep:false,ct:'Клиенты',src:'Внесён вручную',resp:ROLES[role].n.split(' ·')[0],obs:[],st,dref:'D-1187'});toast('Быстрая сделка создана. Ответственный — вы, источник можно поправить.');render()}
SC.funnel=()=>{const ok=pipeOK();if(ok.indexOf(PIPE)<0)PIPE=ok[0];const P=PIPES.find(p=>p[0]===PIPE);const ST=PST[P[2]];const D=PD.filter(d=>d.p===PIPE);
return `<div class="hd"><div><h2>Сделки · ${esc(P[1])}</h2><p>${PIPES.length} воронок, как у вас: салоны, студия, производство, перегородки, ОКК, входные двери, корпоратив, дизайнеры, архив, общая. Каждый видит только разрешённые ему воронки — сейчас роли «${esc(role)}» доступно ${ok.length}.</p></div><div class="btns"><select class="sel" onchange="PIPE=this.value;render()">${PIPES.filter(p=>ok.indexOf(p[0])>=0).map(p=>`<option value="${p[0]}" ${p[0]===PIPE?'selected':''}>${esc(p[1])}</option>`).join('')}</select><button class="bt" onclick="go('auto')">Роботы</button></div></div>
<div class="kanban pk" style="grid-template-columns:repeat(${ST.length},minmax(190px,1fr))">${ST.map(([k,n])=>{const L=D.filter(d=>d.st===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="if(PDRAG)pdMove(PDRAG,'${k}')"><div class="kh"><b>${n}</b><span>${L.length}</span></div><div class="ksum">${tg(L.reduce((a,d)=>a+d.sum,0))}</div><button class="bt sm full" onclick="pdQuick('${k}')">+ Быстрая сделка</button>${L.map(d=>`<div class="kc" draggable="true" ondragstart="PDRAG='${d.id}'" onclick="DEAL='${d.dref}';go('deal')"><code>${d.id}</code><b>${esc(d.n)}</b>${d.rep?'<span class="mut">повторное обращение</span>':''}<em>${tg(d.sum)}</em><span>Ответственный: <strong>${esc(d.resp)}</strong></span>${d.obs.length?`<span>Наблюдатели: ${d.obs.map(esc).join(', ')}</span>`:''}<span>Источник: ${esc(d.src)} · ${esc(d.ct)}</span></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
<div class="g2"><div class="pan"><h3>Права на воронки</h3><div class="tw"><table class="t sm"><thead><tr><th>Роль</th><th>Видит воронки</th></tr></thead><tbody>${Object.entries(PIPE_ROLE).map(([r,ps])=>`<tr><td>${esc(r)}</td><td>${ps.length===PIPES.length?'все '+PIPES.length:ps.map(x=>esc(PIPES.find(p=>p[0]===x)[1])).join(', ')}</td></tr>`).join('')}</tbody></table></div><p class="mut">Переключите роль справа вверху — список воронок сократится.</p></div>
${said(BXQ,'Воронки, стадии, суммы по колонкам, наблюдатели и разделение прав — один в один с вашей схемой. Роботы — на экране «Автоматизации».','Айкера, по скриншотам системы')}</div>`};
/* --- Карточка сделки: основная документация + таймлайн --- */
const DOCF=[['zam','Бланк замера PDF скан',[['бланк.pdf','PDF']]],['kp','КП клиенту скан PDF',[['Просчёт для клиента.xlsx','XLSX'],['Перегородка расчёт.xlsx','XLSX'],['счёт подписанный.pdf','PDF']]],['dog','Договор',[['Договор_подписан.pdf','PDF']]],['act','Акт выполненных работ',[]],['foto','Фото объекта',[['проём_1.jpg','JPG'],['проём_2.jpg','JPG']]]];
let DOCV='tile';
let TL=[{k:'st',t:'16:14',d:'сегодня',a:'Заказ вышел с производства',b:'Заказ на складе'},{k:'wa',t:'14:53',d:'12 ноября',who:'Клиент',txt:'Хорошо',pin:false},{k:'wa',t:'14:53',d:'12 ноября',who:'Дизайнер Дана',txt:'Только нашли, отправляю размеры проёмов',pin:false},{k:'task',t:'11:20',d:'12 ноября',txt:'Дело: замер 13.11 в 11:00 — замерщик Ерлан'}];
function docUp(k){const f=DOCF.find(x=>x[0]===k);f[2].push([k==='foto'?'фото_'+(f[2].length+1)+'.jpg':'файл_'+(f[2].length+1)+'.pdf',k==='foto'?'JPG':'PDF']);toast('Файл загружен в поле «'+f[1]+'». Он виден всем участникам сделки.');render()}
function tlPin(i){TL[i].pin=!TL[i].pin;toast(TL[i].pin?'Комментарий закреплён вверху таймлайна.':'Откреплено.');render()}
function tlAdd(){const v=(document.getElementById('tlc')||{}).value;if(!v)return;TL.unshift({k:'cm',t:NOW,d:'сегодня',who:ROLES[role].n.split(' ·')[0],txt:v,pin:false});render()}
const docBlock=()=>`<div class="pan"><h3>Основная документация</h3><div class="seg sm">${[['tile','Плитка'],['list','Список'],['wide','По ширине']].map(([k,n])=>`<button class="${DOCV===k?'on':''}" onclick="DOCV='${k}';render()">${n}</button>`).join('')}</div>
${DOCF.map(([k,n,fs])=>`<div class="docf"><small>${esc(n)}</small><div class="docs ${DOCV}">${fs.map(f=>`<a class="dfile" onclick="toast('Файл открыт: ${esc(f[0])}')"><i class="ft ${f[1]}">${f[1]}</i><span>${esc(f[0])}</span></a>`).join('')}<a class="dfile up" onclick="docUp('${k}')"><i class="ft">+</i><span>Загрузить</span></a></div></div>`).join('')}</div>`;
const tlBlock=()=>{const L=TL.map((x,i)=>[x,i]).sort((a,b)=>(b[0].pin?1:0)-(a[0].pin?1:0));return `<div class="pan"><h3>Таймлайн</h3><div class="mrow"><input class="sel" id="tlc" placeholder="Комментарий, @упоминание"><button class="bt" onclick="tlAdd()">Добавить</button></div><div class="tl2">${L.map(([x,i])=>x.k==='st'?`<div class="tli2"><code>${x.d} · ${x.t} · Стадия изменена</code><span class="tag">${esc(x.a)}</span> → <span class="tag g">${esc(x.b)}</span></div>`:x.k==='task'?`<div class="tli2"><code>${x.d} · ${x.t} · Дело</code>${esc(x.txt)}</div>`:`<div class="tli2 ${x.pin?'pin':''}"><code>${x.d} · ${x.t} · ${x.k==='wa'?'Комментарий из WhatsApp':'Комментарий'}</code><b>${esc(x.who)}:</b> ${esc(x.txt)}<div><button class="bt sm" onclick="tlPin(${i})">${x.pin?'Открепить':'Закрепить'}</button></div></div>`).join('')}</div></div>`};
const _deal=SC.deal;
SC.deal=()=>{let h=_deal();h=h.replace(/<div class="pan"><h3>Документы<\/h3>[\s\S]*?(\n<\/div><div>\n <div class="pan"><h3>Сделка<\/h3>)/,(m,g)=>docBlock()+tlBlock()+g);if(h.indexOf('Основная документация')<0)h=h.replace('<div class="g21"><div>','<div class="g21"><div>'+docBlock()+tlBlock());
 return h.replace('<h3>Согласования по сделке</h3>','<h3>Согласования по сделке</h3><button class="bt sm" onclick="startPayout(\''+DEAL+'\')">Заявка на выплату</button> ')};
/* --- Согласование выплат: 5 участников --- */
ATYPE.payout='Выплата';RT.init='Инициатор';
TPL.push({id:'payout',n:'Выплата (поставщику, дизайнеру, монтажнику)',cond:'любая выплата; срок на шаг — 1 рабочий день',steps:['zav','fin','dir','buh']});
APPR.unshift({id:'СГ-319',type:'payout',title:'Выплата комиссии дизайнеру · сделка D-1185',deal:'D-1185',sum:341000,init:'Асель · менеджер салона',st:'run',d:'18.11 09:20',
 steps:[{r:'zav',who:'Руководитель салона',st:'ok',d:'18.11 09:45',c:'Сделка оплачена, комиссия 10% по договору с дизайнером'},{r:'fin',who:'Мадина',st:'now',c:''},{r:'dir',who:'Алексей',st:'wait'},{r:'buh',who:'Бухгалтер',st:'wait'}],
 msgs:[{who:'Асель',t:'09:20',txt:'Дизайнер привела клиента, сделка закрыта и оплачена. Прошу выплатить комиссию 10%. Срок — до 20.11.'},{who:'Руководитель салона',t:'09:45',txt:'Подтверждаю.'}],files:['Договор_агентский_дизайнер.pdf','Оплата_клиента_D-1185.pdf']});
APS='СГ-319';
function startPayout(id){const d=DL(id);const n='СГ-'+(320+APPR.length);APPR.unshift({id:n,type:'payout',title:'Выплата по сделке '+id,deal:id,sum:Math.round(d.sum*0.1),init:MN(d.m)+' · менеджер',st:'run',d:TODAY.slice(0,5)+' '+NOW,steps:['zav','fin','dir','buh'].map((r,i)=>({r,who:{zav:'Руководитель салона',fin:'Мадина',dir:'Алексей',buh:'Бухгалтер'}[r],st:i?'wait':'now'})),msgs:[{who:MN(d.m),t:NOW,txt:'Заявка на выплату: комиссия / поставщик / монтажник.'}],files:[]});APS=n;toast('Заявка на выплату <b>'+n+'</b> запущена: руководитель салона → финансист → директор → бухгалтер. Срок на каждый шаг — 1 рабочий день.');go('appr')}
const _apAct=apAct;
apAct=function(k){const a=AP();const i=a.steps.findIndex(s=>s.st==='now');const last=a.type==='payout'&&k==='ok'&&i===a.steps.length-1;_apAct(k);if(last){a.files.push('Платёжное_поручение_'+a.id+'.pdf');toast('Бухгалтер отметил «Оплачено» и приложил платёжку. Инициатор и наблюдатели получили уведомление.');render()}};
const _appr=SC.appr;
SC.appr=()=>{const a=AP();let h=_appr();if(a.type==='payout')h=h.replace('<div class="g21">',`<div class="pan"><h3>Выплата по шагам</h3><div class="tw"><table class="t sm"><thead><tr><th>Шаг</th><th>Исполнитель</th><th>Срок</th><th>Уведомление</th></tr></thead><tbody>${[['Инициатор','менеджер салона','—','—']].concat(a.steps.map(s=>[RT[s.r],s.who,'1 рабочий день',s.st==='now'?'отправлено сейчас':s.st==='ok'?'решение принято':'придёт по очереди'])).map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}<tr><td>Итог</td><td>Бухгалтер</td><td>после директора</td><td>«Оплачено» + платёжка в процессе и в сделке</td></tr></tbody></table></div></div><div class="g21">`);return h};
/* --- Автоматизации --- */
let AUTO=[
 {on:true,w:'Создан лид',c:'канал: номер WhatsApp или форма',a:'присвоить «Источник звонка (обращения)» по номеру/каналу (Студия дверей, ТГ салон, Дизайнер…)'},
 {on:true,w:'Создан лид',c:'любой',a:'распределить на оператора КЦ по очереди; задача «перезвонить за 15 минут»'},
 {on:true,w:'Звонок без ответа',c:'3 звонка и 1 SMS',a:'перевести лид в «Нет ответа (3 звонка и 1 SMS)»'},
 {on:true,w:'Лид → сделка',c:'город и тип запроса',a:'распределить в воронку салона и на менеджера по графику'},
 {on:true,w:'Смена стадии сделки',c:'любая',a:'уведомить ответственного и наблюдателей'},
 {on:true,w:'Сделка → «Заявка на замер»',c:'—',a:'задача замерщику с адресом и временем'},
 {on:true,w:'Скидка в сделке',c:'больше 10%',a:'запустить согласование «Скидка клиенту»'},
 {on:true,w:'Сделка закрыта и оплачена',c:'тип контакта — Дизайнер',a:'запустить «Выплата» комиссии дизайнеру'},
 {on:false,w:'Сделка в «Отложке»',c:'больше 30 дней без действий',a:'перевести в воронку «Архив»'},
 {on:true,w:'Заказ вышел с производства',c:'—',a:'стадия «Заказ на складе» после приёмки, SMS клиенту'}
];
function autoT(i){AUTO[i].on=!AUTO[i].on;toast('Правило '+(AUTO[i].on?'включено':'выключено')+': «'+AUTO[i].w+'».');render()}
SC.auto=()=>`<div class="hd"><div><h2>Автоматизации</h2><p>Ваши роботы и бизнес-процессы Битрикс24 — в одном списке: когда → условие → действие. Включаются одним кликом, без программиста.</p></div><div class="btns"><button class="bt p" onclick="AUTO.push({on:true,w:'Новое событие',c:'условие',a:'действие'});render()">+ Правило</button></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th style="width:70px">Вкл.</th><th>Когда</th><th>Условие</th><th>Действие</th></tr></thead><tbody>${AUTO.map((r,i)=>`<tr><td><button class="bt sm ${r.on?'p':''}" onclick="autoT(${i})">${r.on?'вкл':'выкл'}</button></td><td><b>${esc(r.w)}</b></td><td>${esc(r.c)}</td><td>${esc(r.a)}</td></tr>`).join('')}</tbody></table></div></div>
${said(BXQ,'Распределение лидов и сделок, присвоение источников, «нет ответа», уведомления наблюдателям, архив, выплаты — всё на этом экране.','Айкера, по скриншотам системы')}`;
/* --- Переезд: карта соответствия --- */
const _move=SC.move;
SC.move=()=>_move()+`<div class="pan"><h3>Карта соответствия: ваш Битрикс24 → новая система</h3><div class="tw"><table class="t sm"><thead><tr><th>В Битрикс24</th><th>Здесь</th><th>Как переносим</th></tr></thead><tbody>${[
['Лиды, стадии «Новый онлайн-лид … итог»','Продажи → Лиды','стадии 1 в 1, лиды — через API'],
['13 воронок сделок (розница, студия, производство, ОКК…)','Продажи → Сделки, переключатель воронок','воронки, стадии, суммы; права на воронки — по ролям'],
['Поля «Источник звонка», «Тип контакта», наблюдатели','поля карточки','значения справочников переносим'],
['Файловые поля «Бланк замера», «КП клиенту скан»','Основная документация в сделке','файлы — через API'],
['Таймлайн: стадии, комментарии WhatsApp','Таймлайн сделки','история — по возможности API'],
['Бизнес-процесс согласования выплат','Согласования → маршрут «Выплата»','собираем заново по вашей схеме'],
['Роботы: распределение, источники, уведомления','Согласования → Автоматизации','собираем заново, включаем по одному']
].map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
/* --- Сценарий --- */
TOUR.splice(1,0,['leads','2 · Лиды: ваши стадии, источник звонка, правило «3 звонка + 1 SMS».']);
TOUR.splice(3,0,['funnel','3 · Сделки: 13 воронок с правами, суммы по колонкам, наблюдатели.']);
TOUR.push(['appr','Выплата: руководитель салона → финансист → директор → бухгалтер с платёжкой.'],['auto','Автоматизации: ваши роботы — когда → условие → действие.']);
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
