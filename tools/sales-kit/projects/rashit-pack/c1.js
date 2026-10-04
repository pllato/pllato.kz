/* ЦИКЛ — система для двух направлений: производство и продажа бумажных коробок и сбор вторсырья (картон, плёнка, пластик, ПЭТ, алюминий). Заявки и повторные заказы, расчёт и счёт, производство, отгрузка с подтверждением клиента; рейсы водителей с телефона, приёмка и весы, склад, выплаты в кассе, продажа партий переработчикам, аналитика собственника. Все имена, компании и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const tn=kg=>(Math.round(kg/100)/10).toString().replace('.',',')+' т';
const kgf=kg=>fmt(kg)+' кг';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y};
const TODAY='2026-10-01';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const dayOf=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(s+'T00:00:00').getDay()];

const DIRS={own:{n:'Собственник',c:'#2e3a46'},box:{n:'Коробки',c:'#9a6a32'},raw:{n:'Вторсырьё',c:'#2f7a4f'},sys:{n:'Система',c:'#5b6470'}};
const SEC=[
 {k:'own',sub:[['today','Сводка дня'],['money','Касса и деньги'],['analytics','Аналитика'],['growth','Новый завод · рост']]},
 {k:'box',sub:[['leads','Заявки'],['bfunnel','Воронка заказов'],['border','Карточка заказа'],['bclients','Клиенты и повторы'],['catalog','Изделия и цены'],['calc','Расчёт и счёт'],['prod','Производство'],['bstock','Склад коробок'],['ship','Отгрузки'],['docs','Договоры и счета']]},
 {k:'raw',sub:[['trips','Рейсы и машины'],['trip','Рейс водителя'],['points','Точки и сдатчики'],['schedule','График вывоза'],['intake','Приёмка и весы'],['rawstock','Склад вторсырья'],['sales','Отгрузка переработчикам'],['payouts','Выплаты сдатчикам']]},
 {k:'sys',sub:[['roles','Роли и права'],['mobile','Мобильная версия'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель':{av:'РШ',p:'RS',n:'Рашит',note:'Оба направления: заказы и производство коробок, рейсы и тоннаж, касса, остатки, аналитика',s:ALL.slice()},
 'Менеджер коробок':{av:'ДН',p:'DN',n:'Динара',note:'Заявки, расчёт и счёт, заказы, повторные клиенты, отгрузки и договоры',s:['leads','bfunnel','border','bclients','catalog','calc','bstock','ship','docs','mobile']},
 'Менеджер вторсырья':{av:'ЕБ',p:'EB',n:'Ербол',note:'Точки и сдатчики, цены закупа, график вывоза, продажа партий переработчикам',s:['points','schedule','trips','trip','rawstock','sales','payouts','mobile']},
 'Логист':{av:'СТ',p:'ST',n:'Саят',note:'Машины и рейсы, график вывоза, доставка коробок клиентам',s:['trips','trip','schedule','points','ship','mobile']},
 'Водитель':{av:'КН',p:'KN',n:'Канат · Газель 500',note:'Свой рейс в телефоне: точка, вид сырья, вес, цена, фото',s:['trip','mobile']},
 'Кассир':{av:'ГЛ',p:'GL',n:'Гульнара',note:'Смена кассы: оплаты клиентов, выплаты сдатчикам и водителям, сверка',s:['money','payouts','docs','mobile']},
 'Кладовщик-приёмщик':{av:'НЖ',p:'NZ',n:'Нуржан',note:'Весы и приёмка, засор, остатки, инвентаризация, брак и списание',s:['intake','rawstock','bstock','mobile']},
 'Мастер производства':{av:'ОЛ',p:'OL',n:'Олег',note:'Очередь заказов по сменам, материалы, выпуск, брак',s:['prod','bstock','border','mobile']}
};
let role='Руководитель',cur='today',theme='light';
const STAFF={RS:'Рашит',DN:'Динара',EB:'Ербол',ST:'Саят',KN:'Канат',MR:'Мейрам',AR:'Арман',GL:'Гульнара',NZ:'Нуржан',OL:'Олег'};
