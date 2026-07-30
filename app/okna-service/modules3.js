'use strict';

/* Полный демонстрационный контур по ТЗ «Окна Сервис».
   Все цифры и люди вымышлены; действия сохраняются в localStorage. */
const OS_STAGES=[
  ['sales','Продажи'],['measure','Замер'],['prepay','Предоплата'],['design','Проектирование'],
  ['purchase','Закупка'],['warehouse','Склад'],['production','Производство'],['quality','ОТК'],
  ['delivery','Доставка'],['install','Монтаж'],['balance','Остаток оплаты'],['closed','Закрыт']
];
const OS_CHECKS={
  sales:['Клиент создан','Телефон указан','Адрес указан','Точка на карте подтверждена','Вид продукции указан','Требования записаны','Замер согласован'],
  measure:['Прибыл на объект','Замер выполнен','Размеры внесены','Фото загружены','Особенности указаны','Эскиз приложен','Данные проверены'],
  prepay:['Договор подписан','Сумма договора указана','Предоплата поступила','Способ оплаты указан'],
  design:['Замер проверен','Конструкции спроектированы','Профиль и цвет выбраны','Стеклопакет выбран','Фурнитура выбрана','Чертежи готовы','Спецификация готова','Проект утверждён'],
  purchase:['Спецификация получена','Остатки проверены','Дефицит рассчитан','Поставщик определён','Материалы заказаны','Срок подтверждён','Транспорт назначен','Материалы получены'],
  warehouse:['Материал принят','Количество проверено','Номенклатура проверена','Резерв создан','Комплект собран','Комплект проверен','Выдача в производство выполнена'],
  production:['Задание принято','Материалы получены','Чертежи получены','Производство начато','Изделие изготовлено','Стеклопакет установлен','Фурнитура установлена','Комплектация завершена'],
  quality:['Размеры проверены','Профиль и цвет проверены','Стеклопакет проверен','Фурнитура и механизмы проверены','Внешний вид проверен','Комплектация проверена','Фото загружено'],
  delivery:['Дата назначена','Автомобиль и водитель назначены','Маршрут построен','Груз подготовлен','Комплектность проверена','Загружено','Доставлено','Фото загружено'],
  install:['Бригада назначена','Дата назначена','Бригада прибыла','Монтаж выполнен','Регулировка выполнена','Объект очищен','Фото загружено','Клиент проверил','Акт подписан'],
  balance:['Монтаж завершён','Остаток оплаты поступил'],
  closed:['Проект закрыт']
};
function osBootstrap(){
  if(DB.os) return;
  DB.os={
    project:{id:'OS-1050',client:'Азамат Нурбеков',phone:'+996 700 44-18-20',object:'Частный дом, 18 конструкций',address:'Бишкек, ул. Токтогула 184',coords:'42.8728, 74.5934',product:'ПВХ Rehau Grazio 70 · графит',sum:2480000,prepay:1240000,stage:'design',deadline:'12 августа',area:82.4,manager:'Айпери Токтосунова',surveyor:'Руслан Абдраев',designer:'Азамат Т.','checks':{}},
    objects:[
      {id:'OS-1050',name:'Азамат Нурбеков',x:42,y:34,stage:'Проектирование',who:'Азамат Т.',due:'сегодня 18:00',kind:'active'},
      {id:'OS-1048',name:'ЖК «Ала-Тоо»',x:68,y:24,stage:'Доставка',who:'Тимур Асанов',due:'15:30',kind:'delivery'},
      {id:'OS-1053',name:'Айжан Иманова',x:28,y:61,stage:'Замер',who:'Руслан Абдраев',due:'14:00',kind:'measure'},
      {id:'OS-1045',name:'ТОО «Эталон»',x:72,y:68,stage:'Монтаж',who:'Бригада №2',due:'до 17:00',kind:'install'},
      {id:'OS-1039',name:'Школа №18',x:51,y:75,stage:'Просрочено',who:'Производство',due:'−2 дня',kind:'late'}
    ],
    purchases:[
      {id:'ZK-218',supplier:'Rehau Central Asia',items:'Профиль Grazio 70 · 420 пог.м',truck:'01 KG 442 ABE',status:'В пути',eta:'сегодня 16:40'},
      {id:'ZK-219',supplier:'Maco Кыргызстан',items:'Фурнитура · 74 комплекта',truck:'назначается',status:'Срок подтверждён',eta:'завтра 11:00'},
      {id:'ZK-220',supplier:'СтеклоПак',items:'Стеклопакет 40 мм · 112 м²',truck:'02 KG 918 ADP',status:'На загрузке',eta:'сегодня 19:10'}
    ],
    qc:[
      {id:'OS-1048',result:'Принято',checked:9,all:9,photo:true,defect:'—'},
      {id:'OS-1046',result:'С замечаниями',checked:8,all:9,photo:true,defect:'регулировка створки'},
      {id:'OS-1042',result:'Возврат',checked:9,all:9,photo:true,defect:'цвет профиля не по спецификации'}
    ],
    trips:[
      {id:'R-88',type:'Доставка',project:'OS-1048',driver:'Бакыт С.',car:'Mercedes Sprinter',status:'В пути',km:18,eta:'15:30'},
      {id:'R-89',type:'Монтаж',project:'OS-1045',driver:'Бригада №2',car:'Ford Transit',status:'На объекте',km:11,eta:'17:00'},
      {id:'R-90',type:'Закупка',project:'ZK-218',driver:'Эрмек Т.',car:'MAN TGL',status:'На загрузке',km:34,eta:'16:40'}
    ],
    rates:[
      {employee:'Азамат Т.',dept:'Проектирование',work:'Проектирование конструкций',unit:'м²',rate:420,from:'01.07.2026'},
      {employee:'Бауыржан Омаров',dept:'Производство',work:'Сборка изделия',unit:'м²',rate:680,from:'01.06.2026'},
      {employee:'Бригада №2',dept:'Монтаж',work:'Стандартный монтаж',unit:'м²',rate:950,from:'01.07.2026'}
    ],
    accruals:[
      {project:'OS-1050',employee:'Руслан Абдраев',dept:'Замер',work:'Замер объекта',volume:82.4,unit:'м²',rate:95,kpi:98,status:'Подтверждено руководителем',total:7671},
      {project:'OS-1048',employee:'Азамат Т.',dept:'Проектирование',work:'Проектирование',volume:64.2,unit:'м²',rate:420,kpi:94,status:'Финансы проверили',total:25344},
      {project:'OS-1045',employee:'Бригада №2',dept:'Монтаж',work:'Монтаж',volume:51.8,unit:'м²',rate:950,kpi:97,status:'Ожидает руководителя',total:47736}
    ],
    payroll:{period:'Июль 2026',status:'Подтверждение руководителей',fund:1284500,closed:false},
    audit:[
      ['14:36','Азамат Т.','Подтвердил объём 64,2 м²','OS-1048'],
      ['13:58','Алина Жумабаева','Проверила начисление 25 344 сом','OS-1048'],
      ['12:42','Руслан Абдраев','Загрузил 12 фото замера','OS-1050'],
      ['11:15','Система','Создала задачу «Проектирование»','OS-1050'],
      ['10:54','Айпери Токтосунова','Подтвердила предоплату 1 240 000 сом','OS-1050']
    ]
  };
  saveDB();
}
osBootstrap();

const osStage=i=>OS_STAGES.find(x=>x[0]===i);
const osMoney=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n))+' сом';
function osProgress(stage){
  const i=Math.max(0,OS_STAGES.findIndex(x=>x[0]===stage));
  return Math.round(i/(OS_STAGES.length-1)*100);
}
function osStatusTag(s){
  const cls=/проср|возврат|брак/i.test(s)?'red':/в пути|работ|ожида|назнач/i.test(s)?'amber':'green';
  return `<span class="tag ${cls}">${s}</span>`;
}
function renderProject(){
  const p=DB.os.project, idx=OS_STAGES.findIndex(x=>x[0]===p.stage), list=OS_CHECKS[p.stage]||[];
  p.checks[p.stage]=p.checks[p.stage]||[];
  const done=p.checks[p.stage];
  const flow=OS_STAGES.map((s,i)=>`<div class="os-step ${i<idx?'done':i===idx?'now':''}"><i>${i<idx?'✓':i+1}</i><span>${s[1]}</span></div>`).join('');
  const checks=list.map((x,i)=>`<button class="os-check ${done.includes(i)?'on':''}" data-act="os-check" data-i="${i}"><b>${done.includes(i)?'✓':'○'}</b><span>${x}</span></button>`).join('');
  const remaining=Math.max(0,p.sum-p.prepay);
  return `<div class="os-hero">
    <div><div class="muted2">СКВОЗНАЯ КАРТОЧКА ПРОЕКТА</div><h2>${p.id} · ${p.client}</h2><p>${p.object} · ${p.address}</p></div>
    <div class="os-score"><b>${osProgress(p.stage)}%</b><span>готовность проекта</span></div>
  </div>
  <div class="os-flow">${flow}</div>
  <div class="os-grid">
    <div class="panel"><div class="panel-h"><h3>Текущий этап · ${osStage(p.stage)[1]}</h3><span class="ph-sub">${done.length}/${list.length}</span></div>
      <div class="panel-b"><div class="os-checks">${checks}</div>
      <button class="btn green" data-act="os-next" ${done.length<list.length?'disabled':''}>Завершить этап и передать дальше →</button>
      <p class="muted2" style="margin-top:10px">CRM проверит поля, зафиксирует исполнителя и объём, создаст начисление, задачу следующему отделу, срок и уведомление.</p></div></div>
    <div class="panel"><div class="panel-h"><h3>Паспорт проекта</h3><span class="tag blue">единый источник данных</span></div>
      <div class="panel-b os-facts">
        <div><span>Телефон</span><b>${p.phone}</b></div><div><span>Продукция</span><b>${p.product}</b></div>
        <div><span>Координаты</span><b>${p.coords}</b></div><div><span>Плановый срок</span><b>${p.deadline}</b></div>
        <div><span>Менеджер</span><b>${p.manager}</b></div><div><span>Замерщик</span><b>${p.surveyor}</b></div>
        <div><span>Площадь</span><b>${p.area} м²</b></div><div><span>Проектировщик</span><b>${p.designer}</b></div>
      </div></div>
    <div class="panel"><div class="panel-h"><h3>Финансовый результат</h3><span class="tag violet">только директор</span></div>
      <div class="panel-b">${state.user.role==='director'?`
        <div class="cards-row" style="grid-template-columns:1fr 1fr">
          ${kpi({icon:'money',label:'Договор',value:osMoney(p.sum),color:'#2563eb'})}
          ${kpi({icon:'wallet',label:'Получено',value:osMoney(p.prepay),color:'#16a34a'})}
          ${kpi({icon:'trend',label:'Себестоимость',value:osMoney(1586000),color:'#dc2626'})}
          ${kpi({icon:'finance',label:'Прогноз прибыли',value:osMoney(894000),color:'#7c3aed',sub:'36% рентабельность'})}
        </div><div class="stat-line"><span>Остаток оплаты</span><b>${osMoney(remaining)}</b></div>
        <div class="stat-line"><span>Зарплата в себестоимости</span><b>${osMoney(214300)}</b></div>`:
        `<div class="empty" style="padding:34px">${icon('shield')}<h3>Финансы проекта скрыты</h3><p>Роль видит рабочие данные, но не прибыль и итоговую зарплату.</p></div>`}</div></div>
    <div class="panel"><div class="panel-h"><h3>Документы, фото и история</h3></div><div class="panel-b">
      <div class="os-files"><button>📄 Договор.pdf</button><button>📐 Замер.dwg</button><button>🧾 Спецификация.xlsx</button><button>📷 12 фото</button></div>
      ${DB.os.audit.slice(0,4).map(a=>`<div class="stat-line"><span>${a[0]} · ${a[1]}<small>${a[2]}</small></span><b>${a[3]}</b></div>`).join('')}
    </div></div>
  </div>`;
}

function renderObjectMap(){
  const pins=DB.os.objects.map(o=>`<button class="os-pin ${o.kind}" style="left:${o.x}%;top:${o.y}%" data-act="os-object" data-id="${o.id}" title="${o.id} · ${o.stage}"><i></i><span>${o.id}</span></button>`).join('');
  return `<div class="cards-row" style="grid-template-columns:repeat(4,1fr)">
    ${kpi({icon:'pin',label:'Активные объекты',value:26,color:'#2563eb',sub:'на карте сейчас'})}
    ${kpi({icon:'ruler',label:'Замеры сегодня',value:5,color:'#7c3aed'})}
    ${kpi({icon:'truck',label:'Доставки и монтажи',value:7,color:'#16a34a'})}
    ${kpi({icon:'alert',label:'Требуют внимания',value:3,color:'#dc2626'})}
  </div><div class="os-map"><div class="os-map-grid"></div>${pins}<div class="os-map-live">● LIVE · геолокация только в активной задаче</div></div>
  <div class="panel"><div class="panel-h"><h3>Выездные задачи</h3><span class="ph-sub">Кликните объект на карте</span></div>
  <table class="tbl"><thead><tr><th>Проект</th><th>Клиент</th><th>Этап</th><th>Ответственный</th><th>Срок</th><th></th></tr></thead><tbody>
  ${DB.os.objects.map(o=>`<tr><td><b>${o.id}</b></td><td>${o.name}</td><td>${osStatusTag(o.stage)}</td><td>${o.who}</td><td>${o.due}</td><td><button class="btn sm" data-act="os-route" data-id="${o.id}">Маршрут ↗</button></td></tr>`).join('')}</tbody></table></div>`;
}

function renderProcurement(){
  const cols=['Ожидает','Назначен','На загрузке','В пути','Прибыл'];
  return `<div class="os-warn"><b>🤖 Автоплан:</b> по проекту OS-1050 не хватает 38 пог.м профиля. CRM объединила потребность с OS-1052 и предложила один рейс — экономия 14 800 сом.</div>
  <div class="kanban">${cols.map(c=>`<div class="kcol"><div class="kcol-h"><span class="kc-name">${c}</span><span class="kc-count">${DB.os.purchases.filter(x=>x.status===c).length}</span></div><div class="kcol-b">
    ${DB.os.purchases.filter(x=>x.status===c).map(x=>`<div class="kcard"><div class="kc-client">${x.id} · ${x.supplier}</div><div class="kc-addr">${x.items}</div><div class="kc-meta"><span>${x.truck}</span><b>${x.eta}</b></div><button class="btn sm" data-act="os-purchase" data-id="${x.id}">Следующий статус →</button></div>`).join('')||'<div class="muted2" style="padding:20px;text-align:center">нет поставок</div>'}
  </div></div>`).join('')}</div>
  <div class="panel" style="margin-top:16px"><div class="panel-h"><h3>Синхронизация с «Мой Склад»</h3><span class="tag green">● подключено</span></div><div class="panel-b os-sync">
    <div><b>Приход</b><span>18 операций</span></div><div><b>Резерв</b><span>11 проектов</span></div><div><b>Выдача</b><span>7 сегодня</span></div><div><b>Расхождения</b><span class="up">0 позиций</span></div>
  </div></div>`;
}

function renderQuality(){
  return `<div class="cards-row" style="grid-template-columns:repeat(4,1fr)">
    ${kpi({icon:'shield',label:'Проверено сегодня',value:38,color:'#16a34a'})}
    ${kpi({icon:'check',label:'Принято с первого раза',value:'92%',color:'#2563eb'})}
    ${kpi({icon:'alert',label:'На исправлении',value:2,color:'#d97706'})}
    ${kpi({icon:'refresh',label:'Повторные работы',value:1,color:'#dc2626',sub:'без двойной оплаты'})}
  </div><div class="panel"><div class="panel-h"><h3>Контроль качества</h3><span class="ph-sub">дефект фиксируется до доставки</span></div>
  <table class="tbl"><thead><tr><th>Проект</th><th>Чек-лист</th><th>Фото</th><th>Результат</th><th>Причина / виновный этап</th><th></th></tr></thead><tbody>
  ${DB.os.qc.map(x=>`<tr><td><b>${x.id}</b></td><td>${x.checked}/${x.all}</td><td>${x.photo?'✓ есть':'—'}</td><td>${osStatusTag(x.result)}</td><td>${x.defect}</td><td><button class="btn sm" data-act="os-qc" data-id="${x.id}">Открыть акт</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="os-warn" style="margin-top:16px"><b>Правило оплаты:</b> исправление собственной ошибки не создаёт повторное начисление. Если причина внешняя — руководитель может разрешить отдельную оплату.</div>`;
}

function renderLogistics(){
  return `<div class="os-route-line"><div>Завод</div><i></i><div>Загрузка</div><i></i><div>Доставка</div><i></i><div>Монтаж</div></div>
  <div class="cards-row" style="grid-template-columns:repeat(3,1fr)">${DB.os.trips.map(x=>`<div class="panel"><div class="panel-b"><div class="tag blue">${x.type}</div><h3 style="margin:12px 0">${x.project} · ${x.car}</h3><p class="muted">${x.driver} · ${x.km} км</p><div class="stat-line"><span>Статус</span>${osStatusTag(x.status)}</div><div class="stat-line"><span>Расчётное прибытие</span><b>${x.eta}</b></div><button class="btn primary" data-act="os-trip" data-id="${x.id}">Следующий статус →</button></div></div>`).join('')}</div>
  <div class="panel"><div class="panel-h"><h3>Мобильный чек-лист бригады</h3><span class="tag green">работает с телефона</span></div><div class="panel-b os-mobile-list">
    <button>✓ Маршрут открыт</button><button>✓ Комплектность проверена</button><button>✓ Фото до монтажа</button><button>○ Акт клиента</button><button>○ Остаток оплаты</button>
  </div></div>`;
}

function renderPayroll(){
  const director=state.user.role==='director', finance=state.user.role==='finance', head=state.user.role==='head';
  const canTotals=director||finance;
  return `<div class="os-period">
    <div><span>Расчётный период</span><h2>${DB.os.payroll.period}</h2></div>
    <div class="os-period-track">${['Открыт','Сбор данных','Подтверждение руководителей','Проверка финансов','Утверждение директора','Закрыт'].map(x=>`<span class="${x===DB.os.payroll.status?'on':''}">${x}</span>`).join('')}</div>
    <button class="btn primary" data-act="os-period">${director||finance?'Перевести период →':'Только просмотр'}</button>
  </div>
  <div class="cards-row" style="grid-template-columns:repeat(4,1fr)">
    ${kpi({icon:'production',label:'Подтверждённый объём',value:'1 284 м²',color:'#2563eb'})}
    ${kpi({icon:'trend',label:'Средний KPI',value:'96,1%',color:'#16a34a'})}
    ${kpi({icon:'clock',label:'Ждут руководителя',value:7,color:'#d97706'})}
    ${kpi({icon:'wallet',label:'Фонд зарплаты',value:canTotals?osMoney(DB.os.payroll.fund):'Скрыто',color:'#7c3aed',sub:canTotals?'включён в себестоимость':'нет доступа к итогам'})}
  </div><div class="panel"><div class="panel-h"><h3>Начисления из выполненных работ</h3><span class="tag violet">без ручного дублирования</span></div>
  <table class="tbl"><thead><tr><th>Проект / сотрудник</th><th>Работа</th><th>Объём</th><th>Расценка</th><th>KPI</th><th>Статус</th>${canTotals?'<th>Итог</th>':''}<th></th></tr></thead><tbody>
  ${DB.os.accruals.map((x,i)=>`<tr><td><b>${x.project}</b><br><span class="muted2">${x.employee} · ${x.dept}</span></td><td>${x.work}</td><td>${x.volume} ${x.unit}</td><td>${canTotals?osMoney(x.rate):'по справочнику'}</td><td><b>${x.kpi}%</b></td><td>${osStatusTag(x.status)}</td>${canTotals?`<td><b>${osMoney(x.total)}</b></td>`:''}<td>${head&&/Ожидает/.test(x.status)?`<button class="btn sm green" data-act="os-approve" data-i="${i}">Подтвердить</button>`:'—'}</td></tr>`).join('')}</tbody></table></div>
  <div class="os-grid" style="margin-top:16px">
    <div class="panel"><div class="panel-h"><h3>Справочник индивидуальных расценок</h3></div><div class="panel-b">${DB.os.rates.map(x=>`<div class="stat-line"><span><b>${x.employee}</b><small>${x.work} · с ${x.from}</small></span><b>${canTotals?osMoney(x.rate):'скрыто'} / ${x.unit}</b></div>`).join('')}</div></div>
    <div class="panel"><div class="panel-h"><h3>Настраиваемый KPI</h3></div><div class="panel-b">${[['Срок',25,98],['Качество',30,96],['Объём',20,101],['Без переделок',15,92],['Дисциплина',10,97]].map(x=>`<div class="os-kpi-row"><span>${x[0]} · вес ${x[1]}%</span><div><i style="width:${Math.min(100,x[2])}%"></i></div><b>${x[2]}%</b></div>`).join('')}</div></div>
  </div>`;
}

function renderAudit(){
  return `<div class="os-grid"><div class="panel"><div class="panel-h"><h3>Неизменяемый журнал действий</h3><span class="tag green">● аудит включён</span></div><div class="panel-b">
  ${DB.os.audit.map(a=>`<div class="os-audit"><time>${a[0]}</time><div><b>${a[1]}</b><span>${a[2]}</span></div><strong>${a[3]}</strong></div>`).join('')}</div></div>
  <div class="panel"><div class="panel-h"><h3>Контроль целостности</h3></div><div class="panel-b">
    ${[['Двойные начисления','0','green'],['Изменения закрытого периода','0','green'],['Операции без автора','0','green'],['Корректировки с причиной','4','amber']].map(x=>`<div class="stat-line"><span>${x[0]}</span><span class="tag ${x[2]}">${x[1]}</span></div>`).join('')}
    <div class="os-warn"><b>Начисления не удаляются.</b> Доступны статусы «Аннулировано» и «Корректировка» с обязательной причиной.</div>
  </div></div></div>`;
}

function osAdvanceStage(){
  const p=DB.os.project, i=OS_STAGES.findIndex(x=>x[0]===p.stage);
  if(i<OS_STAGES.length-1){
    const prev=osStage(p.stage)[1], next=OS_STAGES[i+1]; p.stage=next[0]; p.checks[p.stage]=[];
    DB.os.audit.unshift([new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),'Система',`Закрыла этап «${prev}», создала задачу «${next[1]}»`,p.id]);
    if(prev==='Проектирование'&&!DB.os.accruals.some(x=>x.project===p.id&&x.dept==='Проектирование')) DB.os.accruals.unshift({project:p.id,employee:p.designer,dept:'Проектирование',work:'Проектирование',volume:p.area,unit:'м²',rate:420,kpi:100,status:'Ожидает руководителя',total:Math.round(p.area*420)});
    saveDB(); renderModule(); toast(`Этап завершён. Задача «${next[1]}» создана автоматически`);
  }
}
function osToggleCheck(i){
  const p=DB.os.project, arr=p.checks[p.stage]||(p.checks[p.stage]=[]), n=Number(i);
  const pos=arr.indexOf(n); pos>=0?arr.splice(pos,1):arr.push(n); saveDB(); renderModule();
}
function osCycle(arr,id,seq,field='status'){
  const x=arr.find(y=>y.id===id); if(!x)return; const i=seq.indexOf(x[field]); x[field]=seq[(i+1)%seq.length]; saveDB(); renderModule(); toast(`Статус обновлён: ${x[field]}`);
}
