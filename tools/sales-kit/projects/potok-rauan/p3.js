/* Номенклатура */
let CAT=[
 ['PNM-PT900','Переносной ультразвуковой расходомер жидкости TransPort PT900','Panametrics',14800,'USD','03.2026'],
 ['PNM-XGF868','Расходомер факельного газа DigitalFlow XGF868i','Panametrics',27500,'USD','03.2026'],
 ['PNM-PFZ3','Ультразвуковой расходомер газа PanaFlow Z3','Panametrics',21900,'USD','03.2026'],
 ['PNM-AUR','Анализатор влажности природного газа Aurora H2O','Panametrics',38400,'USD','03.2026'],
 ['PNM-MIS2','Анализатор влажности MIS-2','Panametrics',9600,'USD','03.2026'],
 ['CN-DP310','Датчик давления DP-310, 4–20 мА + HART','Производитель из Китая',4600,'CNY','07.2026'],
 ['KV-BPP','Блок подготовки пробы газа','«Квалитет»',1240000,'RUB','по запросу'],
 ['KV-SMP','Пробоотборник газа высокого давления','«Квалитет»',386000,'RUB','по запросу']
];
SC.catalog=()=>`<div class="hd"><div><h2>Номенклатура и прайсы</h2><p>Вся номенклатура трёх производителей и разовых поставщиков: артикул, цена, валюта, дата прайса. Производитель обновил цены (раз в полгода-год) — сотрудник перетаскивает Excel и нажимает «Импорт»: цены обновятся, новые позиции добавятся, изменения покажутся списком.</p></div><div class="btns"><button class="bt" onclick="act('Выгрузка номенклатуры в Excel.')">Excel</button><button class="bt p" onclick="catImport()">⇪ Импорт прайса из Excel</button></div></div>
 <div class="seg"><a class="on">Все · ${CAT.length}</a><a onclick="act('Фильтр по производителю.')">Panametrics</a><a onclick="act('Фильтр по производителю.')">Китай · КИП</a><a onclick="act('Фильтр по производителю.')">«Квалитет»</a></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Артикул</th><th>Наименование</th><th>Производитель</th><th style="text-align:right">Цена</th><th style="text-align:right">В тенге сегодня</th><th>Прайс от</th><th></th></tr></thead><tbody>${CAT.map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="mono" style="text-align:right">${money(r[3],r[4])}</td><td class="mono" style="text-align:right">${tg(r[3]*RATE[r[4]])}</td><td class="mono">${r[5]}</td><td>${r[0]==='PNM-XGF868'?`<button class="bt sm" onclick="go('config')">Подбор опций</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Последний импорт · Panametrics, прайс 03.2026</h3><div class="kv"><span>Обновлено цен</span><b>1 214</b></div><div class="kv"><span>Новых позиций</span><b>38</b></div><div class="kv"><span>Снято с производства</span><b>12 — помечены</b></div><div class="kv"><span>В открытых КП затронуто</span><b class="neg">3 КП — пересчитать?</b></div></div>
 <div class="pan"><h3>Как попадают цены</h3><div class="kv"><span>Прайс производителя</span><b>импорт Excel</b></div><div class="kv"><span>Предложение без прайса (разовый поставщик)</span><b>PDF → ИИ → позиции</b></div><div class="kv"><span>Ручной ввод</span><b>всегда можно</b></div></div></div>
 ${said('Цены меняются раз в полгода, раз в год. Мы получаем Excel-файлы')}`;
function catImport(){toast('Импорт: 1 214 цен обновлено, 38 новых позиций. 3 открытых КП помечены — «цены изменились».')}

/* Подбор по опциям */
const OPT=[
 ['Исполнение',[['1','Общепромышленное',0],['E','Взрывозащищённое Ex d',3800]]],
 ['Каналы измерения',[['1','Один канал',0],['2','Два канала',4200]]],
 ['Датчики',[['T5','T5 · до DN300',0],['T17','T17 · DN300–DN900',2600],['T21','T21 · высокая температура',5400]]],
 ['Питание',[['A','100–240 В AC',0],['D','24 В DC',300]]],
 ['Выходы',[['H','4–20 мА + HART',0],['M','Modbus RS-485',450],['F','Foundation Fieldbus',1900]]]
];
let OS=[1,0,1,0,0];
SC.config=()=>{const base=27500,add=OPT.reduce((a,o,i)=>a+o[1][OS[i]][2],0),code='XGF868i-'+OPT.map((o,i)=>o[1][OS[i]][0]).join('-');
 return `<div class="hd"><div><h2>Подбор по опциям · DigitalFlow XGF868i</h2><p>Как в системе производителя, только у вас: инженер отмечает опции под опросный лист — меняются код модели, характеристики и цена. Подобранная позиция одним нажатием уходит в КП проекта, в валюте производителя и в тенге по курсу.</p></div></div>
 <div class="g2 g21"><div class="pan">${OPT.map((o,i)=>`<div class="bz-opt"><small>${o[0]}</small><div>${o[1].map((v,j)=>`<a class="${OS[i]===j?'on':''}" onclick="OS[${i}]=${j};render()"><b>${v[0]}</b>${v[1]}${v[2]?`<em>+ $ ${fmt(v[2])}</em>`:''}</a>`).join('')}</div></div>`).join('')}</div>
 <div class="pan"><h3>Модель</h3><div class="bz-code">${code}</div><div class="kv"><span>Базовая цена</span><b>$ ${fmt(base)}</b></div><div class="kv"><span>Опции</span><b>$ ${fmt(add)}</b></div><div class="kv on"><span><strong>Цена производителя</strong></span><b>$ ${fmt(base+add)}</b></div><div class="kv"><span>В тенге по курсу ${RATE.USD}</span><b>${tg((base+add)*RATE.USD)}</b></div><div class="kv"><span>Срок изготовления</span><b>8–10 недель</b></div>
  <div class="btns l"><button class="bt p" onclick="act('Позиция ${code} добавлена в КП-2026-031 · П-021, тег FT-115.')">В КП проекта</button><button class="bt" onclick="act('Спецификация с опциями — PDF для заказчика.')">Спецификация PDF</button></div></div></div>
 ${said('Галочками опции подбираем — меняется буквенная индексация, меняется цена и характеристики')}`};

/* PDF поставщика → позиции */
let AIP=[['Блок подготовки пробы газа БПП-2, исп. для взрывоопасной зоны',1,1240000,'KV-BPP','есть',99],['Пробоотборник ПГО-25 высокого давления',2,386000,'KV-SMP','есть',99],['Обогреваемая импульсная линия 10 м',2,148500,'—','новая',96],['Шкаф обогреваемый для анализатора',1,512000,'—','новая',97],['Комплект ЗИП на 2 года',1,96400,'—','новая',94],['Пусконаладочные работы',1,280000,'—','услуга',92]];
let aiDone=true;
SC.aipdf=()=>`<div class="hd"><div><h2>PDF поставщика → позиции (ИИ)</h2><p>Разовый поставщик прислал предложение в PDF — 50 позиций, переносить руками около 4 часов. Перетаскиваете файл — ИИ вытаскивает наименования, количество, цены и валюту, сопоставляет с номенклатурой. Человек проверяет таблицу и одним нажатием добавляет в КП или в номенклатуру.</p></div><div class="btns"><button class="bt p" onclick="aiRun()">⇪ Загрузить PDF</button></div></div>
 <div class="g2 g21"><div class="pan"><h3>КП_Квалитет_418.pdf · 6 позиций · рубли · распознано за 40 секунд</h3><div class="tw"><table class="t"><thead><tr><th>Позиция из PDF</th><th>Кол-во</th><th style="text-align:right">Цена, ₽</th><th>В номенклатуре</th><th>Точность</th></tr></thead><tbody>${AIP.map(r=>`<tr class="${r[5]<95?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono" style="text-align:right">${fmt(r[2])}</td><td>${r[4]==='есть'?tag(r[3],'g'):r[4]==='услуга'?tag('услуга','i'):tag('новая позиция','w')}</td><td class="mono">${r[5]}%</td></tr>`).join('')}</tbody></table></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('6 позиций добавлены в КП-2026-031 по курсу RUB ${RATE.RUB}.')">Добавить в КП</button><button class="bt" onclick="act('3 новые позиции заведены в номенклатуру «Квалитет».')">Создать новые позиции</button></div></div>
 <div class="pan"><h3>Что экономит</h3><div class="kv"><span>50 позиций вручную</span><b class="neg">≈ 4 часа</b></div><div class="kv"><span>С ИИ + проверка человеком</span><b class="pos">≈ 10 минут</b></div><div class="kv"><span>Строки с точностью ниже 95%</span><b>подсвечены — проверить</b></div>${tip('Уже работает у вас вручную','Сейчас ребята отдают PDF Claude и копируют результат в Excel. В системе то же самое — но сразу в номенклатуру и КП, без копирования. Подключаем по API, платите за токены по факту.')}</div></div>
 ${said('Мы просто скармливаем приложению ценовое предложение: сделай на основании этого. Бывает 50 позиций — это может съесть четыре часа рабочего времени')}`;
function aiRun(){toast('Файл загружен. ИИ распознаёт позиции…');setTimeout(()=>toast('Готово: 6 позиций, 2 найдены в номенклатуре, 1 строка требует проверки.'),1600)}

/* Коммерческое предложение */
let qCur='KZT',qMk=28;
const QL=[['FT-101…108','PanaFlow Z3, DN200','PNM-PFZ3',8,21900,'USD'],['FT-115','DigitalFlow XGF868i-E-1-T17-A-H','PNM-XGF868',2,33900,'USD'],['AT-201','Анализатор влажности Aurora H2O','PNM-AUR',3,38400,'USD'],['—','Блок подготовки пробы газа','KV-BPP',3,1240000,'RUB']];
SC.quote=()=>{const rows=QL.map(r=>{const kzt=r[4]*RATE[r[5]]*(1+qMk/100);return [...r,kzt]});const tot=rows.reduce((a,r)=>a+r[6]*r[3],0);
 return `<div class="hd"><div><h2>КП-2026-031 · П-021 · ГПЗ 2,5 млрд м³</h2><p>КП собирается из номенклатуры, подбора по опциям и распознанного PDF. Цены поставщиков — в их валютах, пересчёт по курсу Нацбанка на сегодня, наценка — общая или по строке. Валюта КП — любая. Готовое КП — PDF или Word по вашему шаблону, отправка письмом из системы.</p></div><div class="btns"><div class="seg">${['KZT','USD','EUR','RUB'].map(c=>`<a class="${qCur===c?'on':''}" onclick="qCur='${c}';render()">${c}</a>`).join('')}</div></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Тег</th><th>Позиция</th><th>Кол-во</th><th style="text-align:right">Цена поставщика</th><th style="text-align:right">Цена, ${qCur}</th><th style="text-align:right">Сумма, ${qCur}</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b><br><small class="mono">${r[2]}</small></td><td class="mono">${r[3]}</td><td class="mono" style="text-align:right">${money(r[4],r[5])}</td><td class="mono" style="text-align:right">${fmt(r[6]/RATE[qCur])}</td><td class="mono" style="text-align:right">${fmt(r[6]*r[3]/RATE[qCur])}</td></tr>`).join('')}<tr><td colspan="5"><b>Итого, ${qCur} · без НДС</b></td><td class="mono" style="text-align:right"><b>${money(Math.round(tot/RATE[qCur]),qCur)}</b></td></tr></tbody></table></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('КП-2026-031 — PDF по вашему шаблону, отправлено письмом с вашей почты; копия в проекте.')">PDF и отправить</button><button class="bt" onclick="act('КП в Word — можно поправить перед отправкой.')">Word</button><button class="bt" onclick="act('Договор создан из КП: позиции, суммы и валюта перенесены.')">Создать договор</button></div></div>
 <div class="pan"><h3>Курсы НБ РК · ${TODAY}</h3>${['USD','EUR','RUB','CNY'].map(c=>`<div class="kv"><span>${c}</span><b class="mono">${RATE[c]}</b></div>`).join('')}<p class="hint">Курсы подтягиваются с сайта Нацбанка каждое утро сами.</p>
  <h3 style="margin-top:12px">Наценка</h3><div class="seg">${[20,28,35].map(m=>`<a class="${qMk===m?'on':''}" onclick="qMk=${m};render()">${m}%</a>`).join('')}</div><div class="kv"><span>Себестоимость</span><b>${tg(tot/(1+qMk/100))}</b></div><div class="kv"><span>Маржа</span><b class="pos">${tg(tot-tot/(1+qMk/100))}</b></div><div class="kv"><span>Версии КП</span><b>028 → 031</b></div></div></div>
 ${said('Курс всегда актуальный — брали с Нацбанка, цены и договоры пересчитывали в разных валютах. Это было очень удобно')}`};
