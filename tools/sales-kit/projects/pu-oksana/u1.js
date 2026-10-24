/* ПУ ДЕТАЛЬ — CRM и учёт производства изделий из полиуретана: все обращения (WhatsApp, звонки, сайт, площадки) сразу к менеджеру, воронка заказного изделия от чертежа до отгрузки, расчёт цены по чертежу, КП, счёт и договор одной кнопкой с отправкой в WhatsApp, источники рекламы, KPI, производство по этапам, пресс-формы, склад сырья и готовой продукции. Название, клиенты, изделия и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='27.10.2026',NOW='14:30';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="38" fill="currentColor"/><circle cx="50" cy="50" r="22" fill="var(--brand2,#f07b16)"/><circle cx="50" cy="50" r="10" fill="currentColor"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const SC={},CARD={};
const SEC=[
 {k:'top',n:'Руководителю',sub:[['dash','Пульт РОПа'],['ads','Источники и реклама'],['kpi','KPI менеджеров']]},
 {k:'sl',n:'Продажи',sub:[['inbox','Все обращения'],['funnel','Воронка заказа'],['calc','Расчёт по чертежу'],['docs','КП, счёт, договор'],['clients','Клиенты']]},
 {k:'pr',n:'Производство',sub:[['prod','Заказы в производстве'],['molds','Пресс-формы']]},
 {k:'wh',n:'Склады',sub:[['raw','Склад сырья'],['fg','Готовая продукция и отгрузки']]},
 {k:'sys',n:'Внедрение',sub:[['onec','1С — позже'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'РОП':{av:'ОК',n:'Оксана',note:'Воронка, менеджеры, источники, KPI, документы',s:ALL.slice()},
 'Директор':{av:'АШ',n:'Александр',note:'Пульт, продажи, производство, склады',s:['dash','ads','kpi','funnel','prod','raw','fg','launch']},
 'Менеджер':{av:'МН',n:'Светлана',note:'Свои обращения, расчёты, КП, счета',s:['inbox','funnel','calc','docs','clients']},
 'Производство':{av:'ТХ',n:'Технолог · цех',note:'Заказы по этапам, пресс-формы, сырьё',s:['prod','molds','raw']},
 'Склад':{av:'СК',n:'Кладовщик',note:'Сырьё, готовая продукция, отгрузки',s:['raw','fg']}
};
let role='РОП',cur='dash',theme='light';
const SRC={ig:['Instagram','#c13584'],gg:['Google','#4285f4'],st:['Сайт','#1e2228'],kp:['Kaspi / площадки','#e5332a'],ph:['Звонок','#6b7280'],rf:['Рекомендация','#1f8a5b']};
const srcTag=k=>`<span class="srct" style="--sc:${SRC[k][1]}">${SRC[k][0]}</span>`;
const FST=[['new','Новое обращение'],['tz','Фото, чертёж, размеры'],['calc','Расчёт'],['kp','КП отправлено'],['inv','Счёт · ждём оплату'],['prod','В производстве'],['ship','Отгрузка'],['done','Завершено']];
let DL=[
 {id:'С-1184',cl:'ТОО «АвтоПарк Логистик»',it:'Сайлентблоки рычага · 120 шт',src:'gg',st:'calc',sum:0,mgr:'Светлана',d:'сегодня'},
 {id:'С-1183',cl:'СТО «Ходовая+»',it:'Втулки стабилизатора · 400 шт',src:'ig',st:'kp',sum:1240000,mgr:'Светлана',d:'вчера'},
 {id:'С-1181',cl:'ТОО «КазМашЗавод»',it:'Футеровка бункера · по чертежу',src:'st',st:'tz',sum:0,mgr:'Светлана',d:'вчера'},
 {id:'С-1179',cl:'ИП Ахметов (фура)',it:'Отбойники · 8 шт',src:'ph',st:'inv',sum:186000,mgr:'Светлана',d:'22.10'},
 {id:'С-1176',cl:'ТОО «Горный Сервис»',it:'Ролики конвейера · 60 шт',src:'rf',st:'prod',sum:2310000,mgr:'Светлана',d:'20.10'},
 {id:'С-1172',cl:'СТО «Мастер Подвеска»',it:'Втулки рессор · 200 шт',src:'kp',st:'ship',sum:540000,mgr:'Светлана',d:'17.10'},
 {id:'С-1185',cl:'Новый · +7 777 *** 41 20',it:'«Нужны втулки на Камаз, сколько стоит?»',src:'ig',st:'new',sum:0,mgr:'—',d:'14:22'}
];
