/* 101kz · Медиа-хранилище товаров — демо по ТЗ заказчика */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const kb=n=>n<1024?fmt(n)+' КБ':num(n/1024)+' МБ';
const CDN='https://img.101kz.kz';

/* ===== РОЛИ ===== */
const ROLES={
 'Администратор хранилища':{av:'АД',n:'Администратор',r:'медиа-сервис',note:'Загрузка, обработка, ошибки, ключи API и бэкапы',
  s:['dash','upload','catalog','pipeline','api','keys','c1','shop','mp','logs','backup','perf','stack','users']},
 'Контент-менеджер':{av:'КМ',n:'Асель',r:'карточки товаров',note:'Загружает фото по артикулу, следит за покрытием каталога',
  s:['upload','catalog','pipeline','logs']},
 'Программист 1С':{av:'1С',n:'Ерлан',r:'1С:Управление торговлей',note:'API, ключи, обмен с 1С и разбор ошибок передачи',
  s:['api','keys','c1','logs','stack','perf']},
 'Менеджер интернет-магазина':{av:'ИМ',n:'Дана',r:'магазин и площадки',note:'Фото на витрине, выгрузка на Kaspi и другие площадки',
  s:['shop','mp','catalog','api']},
 'Руководитель':{av:'РК',n:'Руководитель',r:'101kz',note:'Покрытие каталога фотографиями, объёмы, сроки и стоимость',
  s:['dash','catalog','perf','backup','stack']}
};
let role='Администратор хранилища',cur='dash',theme='light';

const NAV=[
 ['РАБОТА С ФОТО',[['dash','◧','Сводка'],['upload','⇧','Загрузка'],['catalog','▦','Каталог по SKU'],['pipeline','⚙','Очередь обработки',2]]],
 ['ИНТЕГРАЦИИ',[['api','⌘','API'],['keys','⚿','Ключи и доступ'],['c1','⇄','Обмен с 1С'],['shop','⌸','Интернет-магазин'],['mp','◈','Торговые площадки']]],
 ['ЭКСПЛУАТАЦИЯ',[['logs','☰','Журнал',3],['backup','⛁','Резервные копии'],['perf','⏱','Производительность'],['stack','⛭','Архитектура'],['users','◍','Пользователи']]]
];
const TITLES={
 dash:['Сводка','Сколько товаров с фотографиями, что обработано и где ошибки'],
 upload:['Загрузка фотографий','Перетащите файл — обработка и WebP считаются прямо в браузере'],
 catalog:['Каталог по артикулам','Товары и их фотографии; идентификатор — SKU, не название'],
 pipeline:['Очередь обработки','Стадии конвейера, воркеры, ошибки и повторная обработка'],
 api:['API','Эндпоинты, примеры запросов и ответов, коды ошибок'],
 keys:['Ключи и доступ','Авторизация API: ключи, права, ограничение по IP и лимиты'],
 c1:['Обмен с 1С:Управление торговлей','1С хранит ссылку, файлы лежат здесь. Лог обмена и повтор'],
 shop:['Интернет-магазин','Витрина берёт фото из хранилища по стабильному URL'],
 mp:['Торговые площадки','Kaspi и другие: каркас коннекторов и требования площадок'],
 logs:['Журнал','Загрузка, обработка, ошибки API и ошибки передачи в 1С'],
 backup:['Резервные копии','Что бэкапится, как часто, где хранится и как восстанавливается'],
 perf:['Производительность','Скорость обработки, параллельность и пределы системы'],
 stack:['Архитектура и стек','Из чего собрана система и почему именно так'],
 users:['Пользователи','Роли и права в административной части']
};

/* ===== ДАННЫЕ ===== */
const CAT=['Садовый инвентарь','Электроинструмент','Полив','Хозтовары','Малярный инструмент'];
const GOODS=[
 {sku:'OP-5',   n:'Опрыскиватель садовый 5 л',        c:0,ph:4,main:1,st:'ok',   upd:'02.09 09:14',w:'#2f6fed'},
 {sku:'SH-20',  n:'Шланг поливочный 20 м, 1/2"',      c:2,ph:3,main:1,st:'ok',   upd:'02.09 08:41',w:'#0ea5a5'},
 {sku:'TR-1200',n:'Триммер электрический 1200 Вт',    c:1,ph:6,main:1,st:'ok',   upd:'01.09 17:22',w:'#7c3aed'},
 {sku:'DR-750', n:'Дрель ударная 750 Вт',             c:1,ph:5,main:1,st:'ok',   upd:'01.09 16:03',w:'#d98324'},
 {sku:'SEK-22', n:'Секатор садовый 220 мм',           c:0,ph:2,main:1,st:'proc', upd:'02.09 09:31',w:'#1f9d55'},
 {sku:'LST-4',  n:'Стремянка алюминиевая, 4 ступени', c:3,ph:0,main:0,st:'none', upd:'—',          w:'#5f6b7f'},
 {sku:'NAS-800',n:'Насос погружной 800 Вт',           c:2,ph:4,main:1,st:'ok',   upd:'31.08 12:55',w:'#2f6fed'},
 {sku:'KRP-3',  n:'Краскопульт пневматический 3 л',   c:4,ph:1,main:1,st:'err',  upd:'02.09 09:28',w:'#dc3d43'},
 {sku:'TCH-125',n:'Углошлифмашина 125 мм, 900 Вт',    c:1,ph:5,main:1,st:'ok',   upd:'30.08 14:10',w:'#7c3aed'},
 {sku:'GRB-60', n:'Грабли веерные 60 см',             c:0,ph:0,main:0,st:'none', upd:'—',          w:'#5f6b7f'}
];
/* плейсхолдер вместо реального фото товара */
function ph(sku,i,color){const c=color||'#2f6fed';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
 <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".18"/><stop offset="1" stop-color="${c}" stop-opacity=".05"/></linearGradient></defs>
 <rect width="320" height="240" fill="url(#g)"/>
 <rect x="96" y="66" width="128" height="96" rx="10" fill="none" stroke="${c}" stroke-width="3" stroke-opacity=".55"/>
 <circle cx="130" cy="98" r="12" fill="${c}" fill-opacity=".5"/>
 <path d="M104 152 L146 112 L176 142 L200 122 L216 152 Z" fill="${c}" fill-opacity=".45"/>
 <text x="160" y="196" font-family="monospace" font-size="19" font-weight="700" fill="${c}" fill-opacity=".85" text-anchor="middle">${sku}</text>
 <text x="160" y="214" font-family="monospace" font-size="12" fill="${c}" fill-opacity=".6" text-anchor="middle">фото ${i}</text></svg>`;
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
let QUEUE=[
 {id:'JOB-88421',sku:'SEK-22', f:'sek-22_1.jpg', size:4820,st:'run',  stage:2,t:'09:31:12',err:''},
 {id:'JOB-88420',sku:'SEK-22', f:'sek-22_2.jpg', size:5210,st:'wait', stage:0,t:'09:31:12',err:''},
 {id:'JOB-88419',sku:'KRP-3',  f:'krp-3_2.tiff', size:38400,st:'err', stage:1,t:'09:28:40',err:'Формат TIFF не поддерживается. Допустимые: JPEG, PNG, WebP, HEIC'},
 {id:'JOB-88418',sku:'KRP-3',  f:'krp-3_3.jpg',  size:71300,st:'err', stage:1,t:'09:28:39',err:'Файл больше лимита 25 МБ (71,3 МБ)'},
 {id:'JOB-88417',sku:'OP-5',   f:'op-5_4.jpg',   size:6180,st:'done', stage:5,t:'09:14:07',err:''},
 {id:'JOB-88416',sku:'OP-5',   f:'op-5_3.jpg',   size:5940,st:'done', stage:5,t:'09:14:06',err:''},
 {id:'JOB-88415',sku:'SH-20',  f:'sh-20_1.png',  size:9120,st:'done', stage:5,t:'08:41:55',err:''}
];
const STAGES=['проверка','оригинал','сжатие','WebP и размеры','превью','запись в БД'];
const VARIANTS=[
 {k:'original',n:'Оригинал',      d:'как загрузили, хранится всегда',       w:'4032×3024',s:6180,f:'JPEG'},
 {k:'main',    n:'Основное WebP', d:'для карточки товара и 1С',            w:'1600×1200',s:186, f:'WebP'},
 {k:'medium',  n:'Средний',       d:'для списка товаров и каталога',       w:'800×600',  s:64,  f:'WebP'},
 {k:'thumb',   n:'Превью',        d:'для корзины, поиска и подсказок',     w:'400×300',  s:21,  f:'WebP'},
 {k:'micro',   n:'Микро',         d:'для мобильной выдачи и placeholder',  w:'120×90',   s:4,   f:'WebP'}
];
const KEYS=[
 {n:'1С:Управление торговлей',   k:'sk_live_1c_••••••4f2a', sc:'read, write',       ip:'92.46.∗.∗ (офис)', rps:20,last:'02.09 09:40',st:'активен'},
 {n:'Интернет-магазин',          k:'sk_live_shop_••••9c11', sc:'read',              ip:'сервер магазина',            rps:120,last:'02.09 09:41',st:'активен'},
 {n:'Выгрузка на Kaspi',         k:'sk_live_kaspi_••••31b7',sc:'read',              ip:'сервер выгрузки',            rps:30,last:'02.09 08:10',st:'активен'},
 {n:'Ключ подрядчика (фотограф)',k:'sk_live_photo_••••7d05',sc:'write (только upload)',ip:'без ограничения',         rps:10,last:'28.08 19:22',st:'ограничен'}
];
const EXCH=[
 {t:'02.09 09:14',dir:'→ 1С',obj:'OP-5',   what:'4 фото, порядок изменён',res:'ok',  ms:180},
 {t:'02.09 08:41',dir:'→ 1С',obj:'SH-20',  what:'3 фото, новое основное',  res:'ok',  ms:164},
 {t:'02.09 08:12',dir:'← 1С',obj:'—',      what:'запрос изменений с 07:00',res:'ok',  ms:96},
 {t:'01.09 17:22',dir:'→ 1С',obj:'TR-1200',what:'6 фото',                  res:'ok',  ms:210},
 {t:'01.09 16:41',dir:'→ 1С',obj:'KRP-3',  what:'1 фото',                  res:'err', ms:0, e:'1С вернула 401: истёк токен HTTP-сервиса. Повтор через 5 мин — успешно'}
];
const LOGS=[
 {t:'02.09 09:31:12',u:'Асель',ev:'upload',  o:'SEK-22 / sek-22_1.jpg',d:'Загружен файл 4,7 МБ, поставлен в очередь',lv:'i'},
 {t:'02.09 09:28:40',u:'Асель',ev:'error',   o:'KRP-3 / krp-3_2.tiff', d:'Формат TIFF не поддерживается',lv:'e'},
 {t:'02.09 09:28:39',u:'Асель',ev:'error',   o:'KRP-3 / krp-3_3.jpg',  d:'Файл больше лимита 25 МБ',lv:'e'},
 {t:'02.09 09:14:08',u:'система',ev:'process',o:'OP-5 / main.webp',    d:'Создано 5 вариантов, экономия 96,9%',lv:'i'},
 {t:'02.09 09:14:08',u:'система',ev:'1c',     o:'OP-5',                d:'Ссылки переданы в 1С, ответ 200',lv:'i'},
 {t:'02.09 08:55:02',u:'Дана',  ev:'replace', o:'SH-20 / main.webp',   d:'Заменено фото, URL сохранён, версия 3',lv:'w'},
 {t:'01.09 16:41:30',u:'система',ev:'1c',     o:'KRP-3',               d:'Ошибка передачи в 1С: 401, поставлено на повтор',lv:'e'},
 {t:'01.09 12:04:11',u:'Ерлан', ev:'api',     o:'GET /v1/products/XX-1/images',d:'404: товар не найден (ключ магазина)',lv:'w'},
 {t:'01.09 09:00:00',u:'система',ev:'backup', o:'ежедневная копия',    d:'БД 340 МБ, файлы 214 ГБ (инкремент 1,8 ГБ)',lv:'i'}
];
const MARKET=[
 {n:'Kaspi.kz',    st:'готовим',  req:'JPEG/PNG, до 5 МБ, белый фон, от 400×400, до 8 фото',how:'выгрузка XML-фида со ссылками на варианты 1200×1200'},
 {n:'Halyk Market',st:'в очереди',req:'JPEG, до 8 МБ, от 600×600',                       how:'REST API площадки, ссылки из хранилища'},
 {n:'Wildberries', st:'в очереди',req:'JPEG/PNG, до 32 МБ, от 900×1200, вертикальные',    how:'отдельный вариант 900×1200 в конвейере'},
 {n:'Ozon',        st:'в очереди',req:'JPEG/PNG, до 10 МБ, от 200×200',                   how:'REST API, ссылки из хранилища'},
 {n:'Собственный B2B-каталог',st:'входит',req:'без ограничений',                          how:'тот же API, что и у магазина'}
];

/* ===== ЭКРАНЫ ===== */
const SC={};
const withPh=GOODS.filter(g=>g.ph>0).length;
const totalPh=GOODS.reduce((a,g)=>a+g.ph,0);

SC.dash=()=>`
 <div class="head"><div><h2>Сводка</h2><p>Одно окно по всему медиа-контенту: сколько товаров с фотографиями, что сейчас в обработке, где ошибки и сколько весит хранилище. Цифры на этом экране — из демо-каталога 12 480 товаров.</p></div>
 <div class="btns"><button class="btn" onclick="go('perf')">Производительность</button><button class="btn acc" onclick="go('upload')">Загрузить фото</button></div></div>
 <div class="strip">
  <div><small>ТОВАРОВ В КАТАЛОГЕ</small><b>12 480</b><span>идентификатор — артикул</span></div>
  <div><small>С ФОТОГРАФИЯМИ</small><b class="a">9 864</b><span>79% каталога</span></div>
  <div><small>БЕЗ ЕДИНОГО ФОТО</small><b class="r">2 616</b><span>их не видно на витрине</span></div>
  <div><small>ИЗОБРАЖЕНИЙ ВСЕГО</small><b>38 940</b><span>с вариантами — 194 700 файлов</span></div>
  <div><small>ЭКОНОМИЯ ВЕСА</small><b class="g">71%</b><span>WebP против исходных JPEG</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Покрытие каталога фотографиями</div><div class="ph-sub">товары без фото не продаются — это первое, что видно руководителю</div></div>
   <button class="btn" onclick="go('catalog')">Открыть каталог →</button></div>
   ${[['Садовый инвентарь',2140,1980,'var(--acc)'],['Электроинструмент',3260,2910,'var(--cyan)'],['Полив',1180,1044,'var(--violet)'],['Хозтовары',4210,2860,'var(--amber)'],['Малярный инструмент',1690,1070,'var(--red)']].map(r=>
    `<div class="fr"><span>${r[0]}<div class="sub">${fmt(r[2])} из ${fmt(r[1])} товаров</div></span>
     <div class="bar"><i style="--w:${Math.round(r[2]/r[1]*100)}%;background:${r[3]}"></i></div>
     <b>${Math.round(r[2]/r[1]*100)}%</b></div>`).join('')}
   <div class="hint"><b>Зачем это на первом экране.</b> Пока фотографии лежат по папкам и у менеджеров в мессенджерах, никто не может ответить, у скольких товаров вообще нет фото. Здесь это одна цифра, и она обновляется в момент загрузки.</div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Сейчас в системе</div>
    <div class="kv"><span>В очереди на обработку</span><b>${QUEUE.filter(q=>q.st==='wait'||q.st==='run').length}</b></div>
    <div class="kv"><span>Ошибок, требуют решения</span><b style="color:var(--red)">${QUEUE.filter(q=>q.st==='err').length}</b></div>
    <div class="kv"><span>Обработано за сутки</span><b>1 284 файла</b></div>
    <div class="kv"><span>Среднее время обработки</span><b class="mono">0,7 с</b></div>
    <div class="kv"><span>Объём хранилища</span><b class="mono">214 ГБ</b></div>
    <div class="kv"><span>Последняя резервная копия</span><b>сегодня 03:00</b></div>
    <button class="btn acc" style="width:100%;margin-top:9px" onclick="go('pipeline')">Очередь обработки</button>
   </div>
   <div class="panel"><div class="ph-title">Интеграции</div>
    ${[['1С:Управление торговлей','обмен по расписанию, 5 мин','g'],['Интернет-магазин','читает по API','g'],['Kaspi','каркас готов, подключение — этап 2','a'],['Другие площадки','по одному коннектору','b']].map(r=>
     `<div class="kv"><span>${r[0]}<div class="sub">${r[1]}</div></span><span class="badge ${r[2]}">${r[2]==='g'?'работает':r[2]==='a'?'в плане':'позже'}</span></div>`).join('')}
   </div>
  </div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Последние события</div>
   ${LOGS.slice(0,5).map(l=>`<div class="kv"><span class="mono" style="font-size:9.4px">${l.t}</span><span style="flex:1;font-size:10px;text-align:left">${esc(l.d)}</span>
    <span class="badge ${l.lv==='e'?'r':l.lv==='w'?'a':'g'}">${l.ev}</span></div>`).join('')}
   <button class="btn" style="width:100%;margin-top:9px" onclick="go('logs')">Весь журнал</button>
  </div>
  <div class="panel"><div class="ph-title">Что даёт единое хранилище</div>
   <div class="note" style="--tone:var(--acc)"><b>Фото загружается один раз</b><p>Дальше его берут 1С, магазин и площадки — по ссылке. Не нужно раскладывать копии по папкам и заливать одно и то же в разные системы.</p></div>
   <div class="note" style="--tone:var(--green)"><b>База 1С не растёт</b><p>В 1С хранится только ссылка и порядок фотографий. Файлы лежат отдельно, поэтому база не распухает и не тормозит.</p></div>
   <div class="note" style="--tone:var(--cyan)"><b>Замена не ломает ссылки</b><p>Поменяли фотографию — URL остался прежним. Ни в 1С, ни в магазине ничего править не нужно.</p></div>
  </div>
 </div>`;

SC.upload=()=>`
 <div class="head"><div><h2>Загрузка фотографий</h2><p>Пункт 3 ТЗ целиком: проверка формата и размера, сохранение оригинала, сжатие, WebP, превью и запись в базу. Файл привязывается к товару по артикулу — из имени файла или выбором вручную.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Пакетная загрузка: выбираете папку, система разбирает имена вида <b>OP-5_1.jpg</b> — артикул до подчёркивания, номер после. Так заливаются тысячи файлов за один раз.')">Пакетная загрузка</button>
 <button class="btn acc" onclick="go('pipeline')">Очередь обработки</button></div></div>
 <div class="panel">
  <div class="drop" id="drop" onclick="document.getElementById('fi').click()">
   <div class="di">⇧</div>
   <b>Перетащите сюда фотографию товара</b>
   <span>JPEG, PNG, WebP или HEIC · до 25 МБ · имя вида OP-5_1.jpg привяжет фото к артикулу автоматически</span>
   <span style="color:var(--acc);font-weight:700;margin-top:7px">В демо обработка идёт прямо в браузере: файл никуда не отправляется, но сжатие, WebP и превью — настоящие</span>
  </div>
  <input type="file" id="fi" accept="image/*" multiple style="display:none" onchange="handleFiles(this.files)">
  <div class="upgrid" id="ugrid"></div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что происходит с файлом после загрузки</div>
   ${STAGES.map((s,i)=>`<div class="chk"><i>${i+1}</i><span><b>${s}</b><span class="sub">${[
    'формат из белого списка, размер до 25 МБ, картинка не битая, EXIF-поворот применяется сразу',
    'оригинал кладётся в хранилище неизменным — он нужен для перегенерации вариантов в будущем',
    'сжатие без видимой потери качества, у JPEG вырезаются лишние метаданные',
    'создаётся WebP и все размеры из настроек: 1600, 800, 400 и 120 пикселей по большей стороне',
    'превью для списков и корзины, плюс микро-версия для мобильной выдачи',
    'в базу пишутся SKU, порядок, размеры, хеш файла, версия и время — по ним работает API'][i]}</span></span></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Правила, которые проверяются на входе</div>
   <div class="tw"><table class="data"><thead><tr><th>Проверка</th><th>Значение</th><th>Если не проходит</th></tr></thead><tbody>
   ${[['Формат','JPEG, PNG, WebP, HEIC','отклоняется с понятной ошибкой'],
      ['Размер файла','до 25 МБ','отклоняется, файл не теряется'],
      ['Минимальный размер','от 600×600 px','предупреждение, загрузка разрешена'],
      ['Дубликат','сверка по хешу','предлагается заменить, а не плодить копии'],
      ['Артикул','должен существовать','фото уходит в «неопознанные», не пропадает']]
    .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mini">${r[2]}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--amber)"><b>Ошибка не теряет файл</b><p>Неудачная загрузка остаётся в очереди с причиной. Исправили — нажали «Повторить», обработка идёт заново без повторной отправки файла.</p></div>
  </div>
 </div>`;

SC.catalog=()=>`
 <div class="head"><div><h2>Каталог по артикулам</h2><p>Идентификатор товара — артикул, как и требует ТЗ. Название может меняться сколько угодно: ссылки на фотографии от него не зависят.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Фильтр «без фото»: ${fmt(2616)} товаров, которые не видно на витрине. Это рабочий список для контент-менеджера и фотографа.')">Показать без фото</button>
 <button class="btn acc" onclick="go('upload')">Загрузить фото</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Артикул</th><th>Товар</th><th>Категория</th><th class="right">Фото</th><th>Основное</th><th>Статус</th><th>Изменено</th><th>URL основного</th></tr></thead><tbody>
 ${GOODS.map(g=>`<tr onclick="openItem('${g.sku}')">
  <td class="mono"><b>${g.sku}</b></td><td>${esc(g.n)}</td><td class="mini">${CAT[g.c]}</td>
  <td class="right mono">${g.ph||'—'}</td>
  <td>${g.main?'<span class="badge g">есть</span>':'<span class="badge r">нет</span>'}</td>
  <td>${g.st==='ok'?'<span class="badge g">обработано</span>':g.st==='proc'?'<span class="badge b">в обработке</span>':g.st==='err'?'<span class="badge r">ошибка</span>':'<span class="badge">нет фото</span>'}</td>
  <td class="mono">${g.upd}</td>
  <td class="mono" style="font-size:9px;color:var(--muted)">${g.ph?`/products/${g.sku}/main.webp`:'—'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Почему не по названию товара.</b> «Опрыскиватель садовый 5 л» сегодня может стать «Опрыскиватель ранцевый 5 л» — и все ссылки поедут. Артикул не меняется, поэтому вся структура хранилища построена на нём: <span class="mono">/products/OP-5/main.webp</span>.</div>`;

function openItem(sku){const g=GOODS.find(x=>x.sku===sku);const n=g.ph||0;
 openD(`${g.sku} · ${esc(g.n)}`,`${CAT[g.c]} · ${n} фотографий · изменено ${g.upd}`,
 [['Фотографии',`itemTab('${sku}','ph')`,true],['Ссылки и варианты',`itemTab('${sku}','ur')`],['Версии',`itemTab('${sku}','vr')`]],
 itemBody(sku,'ph'))}
function itemTab(sku,t){const g=GOODS.find(x=>x.sku===sku);
 document.getElementById('dtabs').innerHTML=[['Фотографии','ph'],['Ссылки и варианты','ur'],['Версии','vr']]
  .map(x=>`<button class="dtab ${x[1]===t?'on':''}" onclick="itemTab('${sku}','${x[1]}')">${x[0]}</button>`).join('');
 document.getElementById('db').innerHTML=itemBody(sku,t)}
function itemBody(sku,t){const g=GOODS.find(x=>x.sku===sku);const n=g.ph||0;
 if(t==='ph')return `
  ${n?`<div class="pgrid">${Array.from({length:n},(_,i)=>`
   <div class="pcard" onclick="toast('Фото ${i+1} товара ${sku}. Перетаскиванием меняется порядок; первое фото — основное и именно оно уходит в 1С как главное.')">
    <div class="pim"><img src="${ph(sku,i+1,g.w)}" alt=""><span class="tag">${i===0?'ОСНОВНОЕ':'№'+(i+1)}</span></div>
    <div class="pb"><div class="pn">${sku}_${i+1}</div><div class="pu">/products/${sku}/${i===0?'main':'img-'+(i+1)}.webp</div></div>
   </div>`).join('')}</div>`
   :`<div class="note" style="--tone:var(--red)"><b>У товара нет ни одной фотографии</b><p>Такие позиции собраны в отдельный список — по нему работают контент-менеджер и фотограф.</p></div>`}
  <div class="btns" style="margin-top:11px">
   <button class="btn acc" onclick="toast('Загрузка фото к товару ${sku}: файл попадёт в очередь и через секунду будет доступен по постоянной ссылке.')">Добавить фото</button>
   <button class="btn" onclick="replacePhoto('${sku}')">Заменить основное</button>
   <button class="btn" onclick="toast('Порядок фотографий изменён. Новый порядок уходит в 1С при ближайшем обмене — в течение пяти минут.')">Изменить порядок</button>
   <button class="btn r" onclick="toast('Удаление требует подтверждения и остаётся в журнале: кто удалил, когда и какой файл. Оригинал держится в корзине 30 дней.')">Удалить</button>
  </div>
  <div class="note" style="--tone:var(--acc)"><b>Первое фото = основное</b><p>Именно оно отдаётся как <span class="mono">main.webp</span>, попадает в 1С как основное и используется на витрине в списках товаров.</p></div>`;
 if(t==='ur')return `
  <div class="panel"><div class="ph-title">Постоянные ссылки товара ${sku}</div>
   <div class="tw"><table class="data"><thead><tr><th>Вариант</th><th>Размер</th><th class="right">Вес</th><th>Формат</th><th>URL</th></tr></thead><tbody>
   ${VARIANTS.map(v=>`<tr style="cursor:default"><td><b>${v.n}</b><div class="sub">${v.d}</div></td><td class="mono">${v.w}</td>
    <td class="right mono">${v.s} КБ</td><td><span class="badge ${v.f==='WebP'?'c':'b'}">${v.f}</span></td>
    <td class="mono" style="font-size:9px">/products/${sku}/${v.k==='original'?'original.jpg':v.k+'.webp'}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--green)"><b>Экономия по этому товару</b><p>Исходные 6,2 МБ против 186 КБ основного WebP — страница товара грузится быстрее в разы, а трафик на витрине падает на порядок.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Как это выглядит в ответе API</div>
   <div class="code"><span class="c">GET</span> ${CDN.replace('https://','')}/v1/products/${sku}/images
{
  <span class="k">"sku"</span>: <span class="s">"${sku}"</span>,
  <span class="k">"updated_at"</span>: <span class="s">"2026-09-02T09:14:08+05:00"</span>,
  <span class="k">"main"</span>: <span class="s">"${CDN}/products/${sku}/main.webp"</span>,
  <span class="k">"images"</span>: [
    { <span class="k">"order"</span>: <span class="n">1</span>, <span class="k">"url"</span>: <span class="s">"${CDN}/products/${sku}/main.webp"</span>, <span class="k">"thumb"</span>: <span class="s">"${CDN}/products/${sku}/thumb.webp"</span>, <span class="k">"version"</span>: <span class="n">3</span> },
    { <span class="k">"order"</span>: <span class="n">2</span>, <span class="k">"url"</span>: <span class="s">"${CDN}/products/${sku}/img-2.webp"</span>, <span class="k">"thumb"</span>: <span class="s">"${CDN}/products/${sku}/img-2-thumb.webp"</span>, <span class="k">"version"</span>: <span class="n">1</span> }
  ]
}</div>
  </div>`;
 return `
  <div class="panel"><div class="ph-title">История версий основного фото</div>
   <div class="tw"><table class="data"><thead><tr><th>Версия</th><th>Когда</th><th>Кто</th><th>Что изменилось</th><th>URL</th></tr></thead><tbody>
   ${[[3,'02.09 09:14','Асель','заменено фото на студийное'],[2,'14.08 11:02','Асель','перефотографировано, убран фон'],[1,'03.06 16:40','Дана','первая загрузка']]
    .map(r=>`<tr style="cursor:default"><td class="mono"><b>v${r[0]}</b></td><td class="mono">${r[1]}</td><td>${r[2]}</td><td class="mini">${r[3]}</td>
    <td class="mono" style="font-size:9px">/products/${sku}/main.webp</td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--cyan)"><b>URL один и тот же во всех версиях</b><p>Меняется содержимое, а не адрес. Внутри система хранит версию и хеш файла: по ним сбрасывается кэш CDN и браузера, а 1С и магазин продолжают использовать прежнюю ссылку.</p></div>
   <div class="btns"><button class="btn" onclick="toast('Откат к версии 2: файл возвращается из архива, URL не меняется, кэш сбрасывается автоматически.')">Откатить к версии 2</button></div>
  </div>`;
}
function replacePhoto(sku){
 toast(`Фото товара <b>${sku}</b> заменено. URL остался прежним — <span class="mono">/products/${sku}/main.webp</span>, версия увеличена до 4, кэш CDN сброшен, в 1С и магазине править ничего не нужно.`);
 sparks()}

/* --- ОЧЕРЕДЬ --- */
SC.pipeline=()=>`
 <div class="head"><div><h2>Очередь обработки</h2><p>Конвейер из пункта 3 ТЗ в работе. Загрузка не ждёт обработки: файл принимается сразу, а варианты создаются фоновыми воркерами. Любую ошибку можно повторить одной кнопкой.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Настройки конвейера: форматы, лимит размера, набор вариантов (1600/800/400/120), качество WebP и число воркеров — меняются без переписывания кода.')">Настройки конвейера</button>
 <button class="btn acc" onclick="retryAll()">Повторить все ошибки</button></div></div>
 <div class="strip">
  <div><small>В ОЧЕРЕДИ</small><b>${QUEUE.filter(q=>q.st==='wait').length}</b><span>ждут воркера</span></div>
  <div><small>В РАБОТЕ</small><b class="a">${QUEUE.filter(q=>q.st==='run').length}</b><span>из 8 параллельных</span></div>
  <div><small>ОШИБОК</small><b class="r">${QUEUE.filter(q=>q.st==='err').length}</b><span>файл сохранён, можно повторить</span></div>
  <div><small>ОБРАБОТАНО ЗА СУТКИ</small><b class="g">1 284</b><span>среднее время 0,7 с</span></div>
  <div><small>ВОРКЕРОВ</small><b>8</b><span>масштабируется числом процессов</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:960px"><thead><tr>
  <th>Задача</th><th>Артикул</th><th>Файл</th><th class="right">Размер</th><th>Стадия</th><th>Статус</th><th>Время</th><th></th></tr></thead><tbody>
 ${QUEUE.map(q=>`<tr onclick="openJob('${q.id}')">
  <td class="mono"><b>${q.id}</b></td><td class="mono">${q.sku}</td><td class="mini">${q.f}</td>
  <td class="right mono">${kb(q.size)}</td>
  <td class="mini">${q.st==='err'?'<span style="color:var(--red)">остановлено на «'+STAGES[q.stage]+'»</span>':STAGES[q.stage]||'—'}</td>
  <td>${q.st==='done'?'<span class="badge g">готово</span>':q.st==='run'?'<span class="badge b">обрабатывается</span>':q.st==='wait'?'<span class="badge">в очереди</span>':'<span class="badge r">ошибка</span>'}</td>
  <td class="mono">${q.t}</td>
  <td class="right">${q.st==='err'?`<button class="btn" onclick="event.stopPropagation();retry('${q.id}')">Повторить</button>`:''}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Стадии конвейера</div>
   <div class="chain">${STAGES.map((s,i)=>`<span class="cs ${i<3?'on':''}">${i+1}. ${s}</span>${i<STAGES.length-1?'<span class="ca">→</span>':''}`).join('')}</div>
   <div class="note" style="--tone:var(--acc)"><b>Почему очередь, а не обработка «на лету»</b><p>Менеджер загружает 300 фотографий и уходит работать дальше — интерфейс не висит. Пиковая загрузка не роняет сервер: задачи выполняются ровно с той скоростью, которую тянет машина.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Повторная обработка без повторной загрузки</b><p>Оригинал уже в хранилище. Изменили набор размеров или качество — перегенерация всех вариантов запускается по кнопке, файлы заново никто не заливает.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Ошибки и что с ними делать</div>
   ${QUEUE.filter(q=>q.st==='err').map(q=>`<div class="note" style="--tone:var(--red)"><b>${q.sku} · ${q.f}</b><p>${esc(q.err)}</p></div>`).join('')}
   <div class="kv" style="margin-top:9px"><span>Хранение отклонённых файлов</span><b>30 дней</b></div>
   <div class="kv"><span>Уведомление об ошибке</span><b>на почту администратора</b></div>
   <div class="kv"><span>Повтор при сбое сервиса</span><b>автоматически, 3 попытки</b></div>
  </div>
 </div>`;
function openJob(id){const q=QUEUE.find(x=>x.id===id);
 openD(q.id,`${q.sku} · ${q.f} · ${kb(q.size)}`,[],
 `<div class="panel"><div class="ph-title">Стадии</div>
  ${STAGES.map((s,i)=>`<div class="chk ${i<=q.stage&&q.st!=='err'||i<q.stage?'':'no'}"><i>${i<q.stage||q.st==='done'?'✓':i===q.stage&&q.st==='err'?'×':'•'}</i>
   <span>${s}${i===q.stage&&q.st==='err'?`<span class="sub" style="color:var(--red)">${esc(q.err)}</span>`:''}</span></div>`).join('')}
 </div>
 ${q.st==='done'?`<div class="panel"><div class="ph-title">Результат</div>
  <div class="tw"><table class="data"><thead><tr><th>Вариант</th><th>Размер</th><th class="right">Вес</th></tr></thead><tbody>
  ${VARIANTS.map(v=>`<tr style="cursor:default"><td>${v.n}</td><td class="mono">${v.w}</td><td class="right mono">${v.s} КБ</td></tr>`).join('')}
  </tbody></table></div></div>`:''}
 <div class="btns">${q.st==='err'?`<button class="btn acc" onclick="closeD();retry('${q.id}')">Повторить обработку</button>`:''}
 <button class="btn" onclick="toast('Полный технический лог задачи: время каждой стадии, версия библиотеки обработки, хеш файла и параметры сжатия.')">Технический лог</button></div>`)}
function retry(id){const q=QUEUE.find(x=>x.id===id);if(!q)return;
 q.st='run';q.stage=1;render();
 toast(`Задача <b>${id}</b> отправлена на повторную обработку. Оригинал уже в хранилище — файл заново загружать не нужно.`);
 setTimeout(()=>{q.st='done';q.stage=5;if(cur==='pipeline')render()},1400)}
function retryAll(){QUEUE.filter(q=>q.st==='err').forEach(q=>{q.st='run';q.stage=1});render();
 toast('Все ошибочные задачи поставлены в очередь заново. Те, у которых причина не устранена (формат, размер), снова остановятся с той же ошибкой — это видно сразу.');
 setTimeout(()=>{QUEUE.forEach(q=>{if(q.st==='run'){q.st='done';q.stage=5}});if(cur==='pipeline')render()},1600)}

/* --- API --- */
const EP=[
 {m:'GET',p:'/v1/products/{sku}/images',d:'все фотографии товара с вариантами и порядком',
  res:`{
  <span class="k">"sku"</span>: <span class="s">"OP-5"</span>,
  <span class="k">"main"</span>: <span class="s">"${CDN}/products/OP-5/main.webp"</span>,
  <span class="k">"count"</span>: <span class="n">4</span>,
  <span class="k">"updated_at"</span>: <span class="s">"2026-09-02T09:14:08+05:00"</span>,
  <span class="k">"images"</span>: [
    { <span class="k">"order"</span>: <span class="n">1</span>, <span class="k">"is_main"</span>: <span class="n">true</span>,
      <span class="k">"url"</span>: <span class="s">"${CDN}/products/OP-5/main.webp"</span>,
      <span class="k">"thumb"</span>: <span class="s">"${CDN}/products/OP-5/thumb.webp"</span>,
      <span class="k">"original"</span>: <span class="s">"${CDN}/products/OP-5/original.jpg"</span>,
      <span class="k">"width"</span>: <span class="n">1600</span>, <span class="k">"height"</span>: <span class="n">1200</span>,
      <span class="k">"version"</span>: <span class="n">3</span>, <span class="k">"hash"</span>: <span class="s">"9f2a…c41"</span> }
  ]
}`},
 {m:'GET',p:'/v1/products/{sku}/main',d:'только основное фото — самый частый запрос из 1С',
  res:`{
  <span class="k">"sku"</span>: <span class="s">"OP-5"</span>,
  <span class="k">"url"</span>: <span class="s">"${CDN}/products/OP-5/main.webp"</span>,
  <span class="k">"version"</span>: <span class="n">3</span>,
  <span class="k">"updated_at"</span>: <span class="s">"2026-09-02T09:14:08+05:00"</span>
}`},
 {m:'GET',p:'/v1/products?updated_since=',d:'что изменилось с указанного времени — для обмена с 1С',
  res:`{
  <span class="k">"updated_since"</span>: <span class="s">"2026-09-02T07:00:00+05:00"</span>,
  <span class="k">"total"</span>: <span class="n">2</span>,
  <span class="k">"items"</span>: [
    { <span class="k">"sku"</span>: <span class="s">"OP-5"</span>,  <span class="k">"images"</span>: <span class="n">4</span>, <span class="k">"main"</span>: <span class="s">"${CDN}/products/OP-5/main.webp"</span> },
    { <span class="k">"sku"</span>: <span class="s">"SH-20"</span>, <span class="k">"images"</span>: <span class="n">3</span>, <span class="k">"main"</span>: <span class="s">"${CDN}/products/SH-20/main.webp"</span> }
  ]
}`},
 {m:'POST',p:'/v1/products/{sku}/images',d:'загрузка файла (multipart) — для 1С, фотографа или скрипта',
  res:`{
  <span class="k">"job_id"</span>: <span class="s">"JOB-88421"</span>,
  <span class="k">"status"</span>: <span class="s">"queued"</span>,
  <span class="k">"sku"</span>: <span class="s">"OP-5"</span>,
  <span class="k">"url"</span>: <span class="s">"${CDN}/products/OP-5/img-5.webp"</span>,
  <span class="c">// URL известен сразу, до окончания обработки</span>
}`},
 {m:'PUT',p:'/v1/products/{sku}/images/order',d:'порядок фотографий и выбор основного',
  res:`{
  <span class="k">"sku"</span>: <span class="s">"OP-5"</span>,
  <span class="k">"order"</span>: [<span class="n">3</span>, <span class="n">1</span>, <span class="n">2</span>, <span class="n">4</span>],
  <span class="k">"main"</span>: <span class="s">"${CDN}/products/OP-5/main.webp"</span>,
  <span class="k">"result"</span>: <span class="s">"ok"</span>
}`},
 {m:'GET',p:'/v1/jobs/{job_id}',d:'статус обработки конкретного файла',
  res:`{
  <span class="k">"job_id"</span>: <span class="s">"JOB-88421"</span>,
  <span class="k">"status"</span>: <span class="s">"processing"</span>,
  <span class="k">"stage"</span>: <span class="s">"webp"</span>,
  <span class="k">"progress"</span>: <span class="n">0.6</span>,
  <span class="k">"error"</span>: <span class="n">null</span>
}`},
 {m:'DELETE',p:'/v1/products/{sku}/images/{id}',d:'удаление фотографии (с записью в журнал)',
  res:`{
  <span class="k">"result"</span>: <span class="s">"deleted"</span>,
  <span class="k">"restorable_until"</span>: <span class="s">"2026-10-02"</span>
}`}
];
let epI=0;
SC.api=()=>`
 <div class="head"><div><h2>API</h2><p>Пункт 5 ТЗ. REST, JSON, документация OpenAPI со страницей Swagger — её можно открыть в браузере и выполнить запрос, не написав ни строчки кода. Все ответы ниже — реальные схемы из документации.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Документация OpenAPI 3.1: описание всех методов, кодов ошибок и примеров. Открывается по адресу <span class=\\'mono\\'>${CDN}/docs</span> и доступна вашему программисту 1С.')">Документация</button>
 <button class="btn acc" onclick="go('keys')">Ключи и доступ</button></div></div>
 <div class="g12">
  <div>
   <div class="panel"><div class="ph-title">Эндпоинты</div>
    ${EP.map((e,i)=>`<div class="ep ${i===epI?'on':''}" onclick="epI=${i};render()">
     <span class="m ${e.m==='POST'?'post':e.m==='DELETE'?'del':e.m==='PUT'?'put':''}">${e.m}</span>
     <span><span class="p">${esc(e.p)}</span><div class="d">${e.d}</div></span>
     <span class="badge ${e.m==='GET'?'g':'b'}">${e.m==='GET'?'чтение':'запись'}</span></div>`).join('')}
   </div>
  </div>
  <div>
   <div class="panel"><div class="ph"><div><div class="ph-title">${EP[epI].m} ${esc(EP[epI].p)}</div><div class="ph-sub">${EP[epI].d}</div></div>
    <button class="btn acc" onclick="toast('Запрос выполнен: 200 OK за 34 мс. В Swagger такой же запрос делается прямо в браузере — программисту 1С не нужно писать тестовый код.')">Выполнить</button></div>
    <div class="mini" style="margin-bottom:4px">Запрос</div>
    <div class="code">curl -H <span class="s">"Authorization: Bearer sk_live_1c_••••4f2a"</span> \\
     <span class="s">"${CDN}${esc(EP[epI].p)}"</span></div>
    <div class="mini" style="margin:10px 0 4px">Ответ · <span class="mono">200 OK</span></div>
    <div class="code">${EP[epI].res}</div>
   </div>
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Коды ответов</div>
   ${[['200','запрос выполнен'],['201','файл принят, обработка в очереди'],['400','неверные параметры'],['401','ключ отсутствует или недействителен'],['404','товар или фото не найдены'],['413','файл больше лимита'],['415','формат не поддерживается'],['429','превышен лимит запросов']]
    .map(r=>`<div class="kv"><span class="mono">${r[0]}</span><span style="font-size:10px;color:var(--muted)">${r[1]}</span></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Формат ошибки</div>
   <div class="code">{
  <span class="k">"error"</span>: {
    <span class="k">"code"</span>: <span class="s">"unsupported_format"</span>,
    <span class="k">"message"</span>: <span class="s">"Формат TIFF не поддерживается"</span>,
    <span class="k">"allowed"</span>: [<span class="s">"jpeg"</span>,<span class="s">"png"</span>,<span class="s">"webp"</span>,<span class="s">"heic"</span>],
    <span class="k">"job_id"</span>: <span class="s">"JOB-88419"</span>
  }
}</div>
   <div class="note" style="--tone:var(--acc)"><b>Ошибка всегда машиночитаемая</b><p>1С получает код, а не текст в свободной форме — и может корректно обработать ситуацию сама.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Вебхуки — по желанию</div>
   <p class="mini">Вместо опроса «что изменилось» система сама сообщает в 1С или магазин о событии.</p>
   ${[['image.processed','фото обработано, ссылки готовы'],['image.replaced','фото заменено, версия выросла'],['image.failed','ошибка обработки'],['product.images.reordered','изменён порядок фото']]
    .map(r=>`<div class="kv"><span class="mono" style="font-size:9.4px">${r[0]}</span><span style="font-size:9.6px;color:var(--muted)">${r[1]}</span></div>`).join('')}
   <div class="note" style="--tone:var(--cyan)"><b>Подпись запроса</b><p>Каждый вебхук подписывается HMAC-SHA256 — принимающая сторона проверяет, что запрос действительно от хранилища.</p></div>
  </div>
 </div>`;

SC.keys=()=>`
 <div class="head"><div><h2>Ключи и доступ</h2><p>Пункт 5 ТЗ — авторизация API. У каждой системы свой ключ со своими правами: магазину и Kaspi достаточно чтения, 1С нужна запись. Ключ можно отозвать, не трогая остальные.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Новый ключ создан. Значение показывается один раз — дальше в интерфейсе видны только последние символы. Права и лимиты настраиваются отдельно.')">+ Новый ключ</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Кому выдан</th><th>Ключ</th><th>Права</th><th>Разрешённые адреса</th><th class="right">Лимит</th><th>Последний запрос</th><th>Статус</th></tr></thead><tbody>
 ${KEYS.map(k=>`<tr onclick="toast('Ключ «${esc(k.n)}»: журнал запросов, ротация без остановки работы (старый ключ живёт 24 часа), мгновенный отзыв при утечке.')">
  <td><b>${esc(k.n)}</b></td><td class="mono">${k.k}</td>
  <td><span class="badge ${k.sc.includes('write')?'b':'g'}">${k.sc}</span></td>
  <td class="mini">${k.ip}</td><td class="right mono">${k.rps} r/s</td><td class="mono">${k.last}</td>
  <td><span class="badge ${k.st==='активен'?'g':'a'}">${k.st}</span></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Как защищён API</div>
   ${['Только HTTPS, соединение шифруется','Ключ в заголовке Authorization, не в адресе','Права на уровне ключа: чтение, запись, только загрузка','Ограничение по IP для серверных ключей','Лимит запросов в секунду на каждый ключ','Все запросы пишутся в журнал с ключом и адресом','Ротация и мгновенный отзыв при утечке','Загрузка проверяет реальный тип файла, а не расширение']
    .map(t=>`<div class="chk"><i>✓</i><span>${t}</span></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Публичные картинки — отдельная история</div>
   <p class="mini" style="margin-top:3px">Сами файлы отдаются без ключа: их должен видеть каждый посетитель магазина. Ключ нужен для управляющих операций — загрузки, удаления, изменения порядка и получения служебных данных.</p>
   <div class="kv" style="margin-top:8px"><span>Отдача файлов</span><b>публично, через CDN</b></div>
   <div class="kv"><span>Управление</span><b>только по ключу</b></div>
   <div class="kv"><span>Защита от «горячих ссылок»</span><b>по домену, опционально</b></div>
   <div class="note" style="--tone:var(--amber)"><b>Оригиналы можно закрыть</b><p>Если не хотите отдавать наружу исходники в полном разрешении — доступ к <span class="mono">original.jpg</span> оставляем только по ключу.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Кто и сколько запрашивает</div>
   ${[['Интернет-магазин',184200,'var(--acc)'],['1С:УТ',8640,'var(--cyan)'],['Выгрузка на Kaspi',3120,'var(--violet)'],['Админка',1840,'var(--amber)']].map(r=>
    `<div class="fr" style="grid-template-columns:150px 1fr 86px"><span>${r[0]}</span>
    <div class="bar"><i style="--w:${r[1]/184200*100}%;background:${r[2]}"></i></div><b>${fmt(r[1])}</b></div>`).join('')}
   <div class="mini">запросов за последние сутки</div>
   <div class="kv" style="margin-top:8px"><span>Ошибок 4xx</span><b>18</b></div>
   <div class="kv"><span>Ошибок 5xx</span><b style="color:var(--green)">0</b></div>
  </div>
 </div>`;

SC.c1=()=>`
 <div class="head"><div><h2>Обмен с 1С:Управление торговлей</h2><p>Пункт 6 ТЗ. Главный принцип соблюдён: <b>1С хранит ссылку, а файл лежит в хранилище</b>. Картинки в базу 1С не загружаются, поэтому база не растёт и не тормозит.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Обмен запущен вручную. Обычно он идёт по расписанию — регламентным заданием раз в 5 минут, ночью реже.')">Запустить обмен</button>
 <button class="btn acc" onclick="go('api')">Смотреть API</button></div></div>
 <div class="strip">
  <div><small>РЕЖИМ</small><b>по расписанию</b><span>каждые 5 минут</span></div>
  <div><small>ЗА СУТКИ</small><b>288 обменов</b><span>287 успешных</span></div>
  <div><small>СРЕДНЕЕ ВРЕМЯ</small><b class="a">0,18 с</b><span>на товар</span></div>
  <div><small>ОШИБОК</small><b class="r">1</b><span>устранена повтором</span></div>
  <div><small>РАЗМЕР БАЗЫ 1С</small><b class="g">не растёт</b><span>файлы хранятся отдельно</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph-title">Что именно передаётся в 1С</div>
   <div class="tw"><table class="data"><thead><tr><th>Поле</th><th>Пример</th><th>Где в 1С</th></tr></thead><tbody>
   ${[['Артикул','OP-5','реквизит «Артикул» номенклатуры'],
      ['URL основного фото',CDN+'/products/OP-5/main.webp','доп. реквизит «ОсновноеФото»'],
      ['URL дополнительных','img-2.webp, img-3.webp, img-4.webp','табличная часть «Фотографии»'],
      ['Порядок','1, 2, 3, 4','реквизит «Порядок» в строке'],
      ['Превью','thumb.webp','доп. реквизит «Превью»'],
      ['Дата изменения','2026-09-02T09:14:08','реквизит «ФотоИзменено»']]
    .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mono" style="font-size:9px">${r[1]}</td><td class="mini">${r[2]}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--acc)"><b>Как это сделано технически</b><p>В 1С добавляются дополнительные реквизиты и небольшая обработка, которая по расписанию спрашивает у хранилища «что изменилось с прошлого раза» и обновляет ссылки. Обмен идёт по HTTP, работает и в клиент-серверном, и в файловом варианте.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Если файлы всё-таки нужны в 1С</b><p>Например, для печатных форм и прайсов. Тогда по кнопке подтягивается только превью нужных товаров — точечно, а не всё подряд.</p></div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Схема обмена</div>
    <div class="chain" style="flex-direction:column;align-items:stretch">
     <span class="cs on">1С: регламентное задание, раз в 5 минут</span><span class="ca" style="text-align:center">↓</span>
     <span class="cs">GET /v1/products?updated_since=…</span><span class="ca" style="text-align:center">↓</span>
     <span class="cs">хранилище отдаёт список изменившихся SKU</span><span class="ca" style="text-align:center">↓</span>
     <span class="cs on">1С обновляет ссылки у номенклатуры</span>
    </div>
    <div class="kv" style="margin-top:9px"><span>Объём одного обмена</span><b class="mono">10–60 КБ</b></div>
    <div class="kv"><span>Нагрузка на 1С</span><b>минимальная</b></div>
    <div class="kv"><span>При недоступности сервиса</span><b>повтор, данные не теряются</b></div>
   </div>
   <div class="panel"><div class="ph-title">Обратное направление</div>
    <p class="mini">Если фотографии удобнее заводить прямо из 1С — работает и так: 1С отправляет файл методом POST, хранилище возвращает ссылку и само её обрабатывает.</p>
    <div class="code" style="font-size:9px">POST /v1/products/OP-5/images
Authorization: Bearer sk_live_1c_…
Content-Type: multipart/form-data

→ 201 { "url": "…/img-5.webp" }</div>
   </div>
  </div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px"><thead><tr>
  <th>Время</th><th>Направление</th><th>Объект</th><th>Что передано</th><th class="right">Длительность</th><th>Результат</th></tr></thead><tbody>
 ${EXCH.map(e=>`<tr onclick="toast('${e.e?esc(e.e):'Обмен прошёл штатно: '+esc(e.what)+'. В журнале хранится тело запроса и ответа — разбирать спорные ситуации можно без догадок.'}')">
  <td class="mono">${e.t}</td><td><span class="badge ${e.dir.includes('→')?'b':'c'}">${e.dir}</span></td>
  <td class="mono">${e.obj}</td><td class="mini">${e.what}</td>
  <td class="right mono">${e.ms?e.ms+' мс':'—'}</td>
  <td>${e.res==='ok'?'<span class="badge g">успешно</span>':'<span class="badge r">ошибка</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>`;

SC.shop=()=>`
 <div class="head"><div><h2>Интернет-магазин</h2><p>Пункт 7 ТЗ. Витрина берёт фотографии из хранилища по постоянным ссылкам. Заменили фото — на сайте оно обновилось само, руками карточки никто не трогает.</p></div>
 <div class="btns"><button class="btn" onclick="replacePhoto('OP-5')">Заменить фото товара</button></div></div>
 <div class="g21">
  <div class="panel"><div class="ph-title">Так карточка товара получает картинки</div>
   <div class="code">&lt;<span class="k">img</span>
  <span class="k">src</span>=<span class="s">"${CDN}/products/OP-5/main.webp"</span>
  <span class="k">srcset</span>=<span class="s">"${CDN}/products/OP-5/thumb.webp 400w,
          ${CDN}/products/OP-5/medium.webp 800w,
          ${CDN}/products/OP-5/main.webp 1600w"</span>
  <span class="k">sizes</span>=<span class="s">"(max-width: 640px) 100vw, 50vw"</span>
  <span class="k">loading</span>=<span class="s">"lazy"</span> <span class="k">alt</span>=<span class="s">"Опрыскиватель садовый 5 л"</span>&gt;</div>
   <div class="note" style="--tone:var(--acc)"><b>Телефон грузит маленькую картинку, десктоп — большую</b><p>Браузер сам выбирает нужный размер из списка. Это заметно ускоряет мобильную версию — а именно с телефонов приходит основная часть покупателей.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Ничего не нужно обновлять вручную</b><p>Магазин не хранит копии картинок. Он хранит ссылку — точно такую же, как в 1С. Замена фотографии в хранилище видна на витрине сразу после сброса кэша.</p></div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Что это даёт витрине</div>
    <div class="kv"><span>Вес карточки товара</span><b>было 6,2 МБ → стало 0,2 МБ</b></div>
    <div class="kv"><span>Загрузка на 4G</span><b>&lt; 1 секунды</b></div>
    <div class="kv"><span>Трафик магазина</span><b class="mono" style="color:var(--green)">−71%</b></div>
    <div class="kv"><span>Оценка скорости</span><b>выше в поиске</b></div>
    <div class="kv"><span>Кэш CDN</span><b>файлы отдаются с ближайшего узла</b></div>
   </div>
   <div class="panel"><div class="ph-title">Карточка на витрине</div>
    <div class="pgrid" style="grid-template-columns:1fr 1fr">
     ${[1,2,3,4].map(i=>`<div class="pcard"><div class="pim"><img src="${ph('OP-5',i,'#2f6fed')}" alt=""></div></div>`).join('')}
    </div>
    <div class="mini" style="margin-top:7px">Опрыскиватель садовый 5 л · артикул OP-5 · 4 фотографии из хранилища</div>
   </div>
  </div>
 </div>
 <div class="hint"><b>Как решается вопрос кэша.</b> Ссылка постоянная, поэтому браузер и CDN кэшируют файл надолго. При замене фотографии система сама сбрасывает кэш CDN и меняет внутреннюю версию — посетитель видит новую картинку в течение минуты, а адрес остаётся прежним. Если нужна мгновенная смена, магазин может добавлять к ссылке метку версии: <span class="mono">main.webp?v=3</span> — базовый URL от этого не меняется.</div>`;

SC.mp=()=>`
 <div class="head"><div><h2>Торговые площадки</h2><p>Пункт 8 ТЗ. На первом этапе делаем архитектуру: единый слой выгрузки, к которому подключаются площадки по одной. Хранилище уже умеет отдавать варианты под требования каждой из них.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Проверка требований Kaspi: из 12 480 товаров под правила площадки подходят 9 210. Остальным нужен другой размер или фон — список выгружается отдельно.')">Проверить под Kaspi</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Площадка</th><th>Требования к фото</th><th>Как подключается</th><th>Статус</th></tr></thead><tbody>
 ${MARKET.map(m=>`<tr onclick="toast('${esc(m.n)}: ${esc(m.how)}. Коннектор — отдельный этап работ, архитектура под него готова заранее.')">
  <td><b>${esc(m.n)}</b></td><td class="mini">${esc(m.req)}</td><td class="mini">${esc(m.how)}</td>
  <td><span class="badge ${m.st==='входит'?'g':m.st==='готовим'?'a':'b'}">${m.st}</span></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Почему архитектура важнее первого коннектора</div>
   <div class="note" style="--tone:var(--acc)"><b>Площадки требуют разного</b><p>Кому-то нужен белый фон и квадрат, кому-то вертикальный кадр 900×1200, у всех свои лимиты по весу. Если хранилище умеет собирать любой вариант из оригинала, подключение новой площадки — это настройка, а не пересъёмка товаров.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Оригинал хранится всегда</b><p>Поэтому под новое требование варианты просто перегенерируются: 12 480 товаров пересчитываются за ночь, без участия людей.</p></div>
   <div class="note" style="--tone:var(--violet)"><b>Один слой выгрузки</b><p>Коннектор площадки берёт данные из того же API. Появится ещё один маркетплейс — добавляется коннектор, ядро не переписывается.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Как выглядит подключение площадки</div>
   ${[['1. Требования','размеры, фон, формат, лимит веса, количество фото'],
      ['2. Вариант в конвейере','добавляем нужный размер, старые товары пересчитываются'],
      ['3. Сопоставление','артикул хранилища ↔ идентификатор товара на площадке'],
      ['4. Коннектор','фид или API площадки, расписание выгрузки'],
      ['5. Контроль','отчёт: что ушло, что отклонено и почему']]
    .map(r=>`<div class="kv"><span>${r[0]}<div class="sub">${r[1]}</div></span></div>`).join('')}
   <div class="kv" style="margin-top:6px"><span>Срок одного коннектора</span><b>1–2 недели</b></div>
  </div>
 </div>`;

/* --- ЖУРНАЛ --- */
SC.logs=()=>`
 <div class="head"><div><h2>Журнал</h2><p>Пункт 10 ТЗ. Фиксируется всё: загрузка, обработка, замена, ошибки API и ошибки передачи в 1С. Записи не удаляются, у каждой — время, автор и объект.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Фильтр по типу события, пользователю, артикулу и периоду. Выгрузка в CSV для разбора инцидентов.')">Фильтры</button>
 <button class="btn" onclick="toast('Журнал выгружен в CSV за выбранный период.')">Выгрузить</button></div></div>
 <div class="strip">
  <div><small>СОБЫТИЙ ЗА СУТКИ</small><b>2 940</b><span>включая обмены с 1С</span></div>
  <div><small>ОШИБОК ОБРАБОТКИ</small><b class="r">2</b><span>формат и размер файла</span></div>
  <div><small>ОШИБОК API</small><b class="am">18</b><span>все 4xx, разбираются</span></div>
  <div><small>ОШИБОК ОБМЕНА С 1С</small><b class="am">1</b><span>устранена автоповтором</span></div>
  <div><small>ГЛУБИНА ХРАНЕНИЯ</small><b>12 месяцев</b><span>дальше — в архив</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Время</th><th>Кто</th><th>Событие</th><th>Объект</th><th>Что произошло</th></tr></thead><tbody>
 ${LOGS.map(l=>`<tr onclick="toast('${esc(l.d)}. В записи журнала хранится полный контекст: параметры запроса, ответ сервиса и идентификатор задачи — по нему можно повторить обработку.')">
  <td class="mono">${l.t}</td><td>${l.u}</td>
  <td><span class="badge ${l.lv==='e'?'r':l.lv==='w'?'a':l.ev==='backup'?'c':'g'}">${l.ev}</span></td>
  <td class="mono" style="font-size:9.4px">${esc(l.o)}</td><td class="mini">${esc(l.d)}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Зачем это нужно в реальной работе.</b> Вопрос «почему у товара пропало фото» решается за минуту: видно, кто и когда его заменил или удалил, прошла ли обработка и дошла ли ссылка до 1С. Без журнала такие разборы занимают день и заканчиваются ничем.</div>`;

SC.backup=()=>`
 <div class="head"><div><h2>Резервные копии</h2><p>Пункт 11 ТЗ. Копируется и база данных, и сами файлы, и конфигурация сервиса. Периодичность и срок хранения фиксируются до начала работ — ниже наше предложение.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Тестовое восстановление: копия разворачивается на отдельный сервер и проверяется автоматикой. Это единственный способ убедиться, что бэкап рабочий.')">Проверить восстановление</button>
 <button class="btn acc" onclick="toast('Резервная копия создана вручную: база 340 МБ и изменившиеся файлы за сегодня.')">Сделать копию сейчас</button></div></div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px"><thead><tr>
   <th>Что копируется</th><th>Как часто</th><th>Хранится</th><th>Где</th><th class="right">Объём</th></tr></thead><tbody>
  ${[['База данных (полная)','ежедневно 03:00','30 дней','сервер + внешнее хранилище','340 МБ'],
     ['База данных (журнал)','непрерывно','7 дней','внешнее хранилище','~40 МБ/сут'],
     ['Оригиналы фотографий','ежедневно, инкремент','90 дней','внешнее хранилище','214 ГБ'],
     ['Обработанные варианты','еженедельно','30 дней','внешнее хранилище','96 ГБ'],
     ['Настройки сервиса и ключи','при изменении','бессрочно','репозиторий + хранилище','&lt; 1 МБ']]
   .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td><td class="mono">${r[2]}</td><td class="mini">${r[3]}</td><td class="right mono">${r[4]}</td></tr>`).join('')}
  </tbody></table></div>
   <div class="note" style="--tone:var(--acc)"><b>Варианты можно не хранить долго</b><p>Они восстанавливаются из оригиналов автоматически. Поэтому основная ценность копии — база данных и оригиналы: они невосстановимы.</p></div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Последние копии</div>
    ${[['02.09 03:00','полная','успешно'],['01.09 03:00','полная','успешно'],['31.08 03:00','полная','успешно'],['28.08 04:10','тест восстановления','успешно']]
     .map(r=>`<div class="kv"><span>${r[0]}<div class="sub">${r[1]}</div></span><span class="badge g">${r[2]}</span></div>`).join('')}
   </div>
   <div class="panel"><div class="ph-title">Сколько времени займёт восстановление</div>
    <div class="kv"><span>База данных</span><b>10–15 минут</b></div>
    <div class="kv"><span>Файлы (полный объём)</span><b>3–5 часов</b></div>
    <div class="kv"><span>Сервис целиком с нуля</span><b>до 6 часов</b></div>
    <div class="note" style="--tone:var(--green)"><b>Инструкция по восстановлению передаётся вам</b><p>Пошаговая, с командами. Восстановить сервис сможет любой системный администратор, не только мы.</p></div>
   </div>
  </div>
 </div>`;

SC.perf=()=>`
 <div class="head"><div><h2>Производительность и пределы</h2><p>Ответы на вопросы 13 и 14 вашего запроса: сколько фотографий обрабатывается одновременно и на какой объём каталога рассчитана система. Цифры даны для базовой конфигурации сервера.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Нагрузочный тест входит в этап тестирования: заливаем 10 000 файлов и замеряем время обработки, отдачу API и поведение при пиковой нагрузке. Отчёт передаётся вам.')">Нагрузочный тест</button></div></div>
 <div class="strip">
  <div><small>ОДНОВРЕМЕННО В ОБРАБОТКЕ</small><b class="a">8 файлов</b><span>по числу воркеров</span></div>
  <div><small>СКОРОСТЬ</small><b>5–8 фото/сек</b><span>исходники 12 Мп</span></div>
  <div><small>10 000 ФОТО</small><b class="c">25–35 минут</b><span>пакетная заливка</span></div>
  <div><small>РАСЧЁТ КАТАЛОГА</small><b>500 000 SKU</b><span>до 5 млн изображений</span></div>
  <div><small>ОТДАЧА КАРТИНКИ</small><b class="g">&lt; 60 мс</b><span>через CDN — быстрее</span></div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Из чего складывается скорость</div>
   <div class="tw"><table class="data"><thead><tr><th>Операция</th><th class="right">Время</th><th>Комментарий</th></tr></thead><tbody>
   ${[['Проверка и приём файла','15 мс','формат, размер, хеш'],
      ['Сохранение оригинала','25 мс','запись в хранилище'],
      ['Сжатие и поворот по EXIF','90 мс','библиотека libvips'],
      ['WebP 1600 px','110 мс','основной вариант'],
      ['Остальные размеры','120 мс','800, 400, 120 px'],
      ['Запись в базу','8 мс','SKU, версия, хеш, размеры']]
    .map(r=>`<tr style="cursor:default"><td>${r[0]}</td><td class="right mono">${r[1]}</td><td class="mini">${r[2]}</td></tr>`).join('')}
   <tr class="" style="cursor:default"><td><b>Итого на файл</b></td><td class="right mono"><b>≈ 0,37 с</b></td><td class="mini">на одном ядре</td></tr>
   </tbody></table></div>
   <div class="note" style="--tone:var(--acc)"><b>Почему libvips, а не ImageMagick</b><p>На типичных фотографиях товаров libvips работает в разы быстрее и потребляет в разы меньше памяти. Это разница между «ночь на пересчёт каталога» и «полчаса».</p></div>
  </div>
  <div class="panel"><div class="ph-title">Что происходит при росте</div>
   ${[['Больше загрузок в час','добавляем воркеры — обработка ускоряется линейно'],
      ['Больше товаров','база рассчитана на миллионы записей, схема не меняется'],
      ['Больше трафика на витрине','файлы отдаёт CDN, сервер не нагружается'],
      ['Кончается место','хранилище расширяется без переезда: оригиналы можно вынести в объектное хранилище'],
      ['Пиковая заливка 50 000 фото','очередь растянет обработку, но сервис продолжит отвечать']]
    .map(r=>`<div class="kv"><span>${r[0]}<div class="sub">${r[1]}</div></span></div>`).join('')}
   <div class="hint">Базовая конфигурация: 4 vCPU, 8 ГБ памяти, SSD. Этого хватает для каталога в десятки тысяч товаров. Расширение — вопрос тарифа сервера, а не переписывания системы.</div>
  </div>
 </div>`;

SC.stack=()=>`
 <div class="head"><div><h2>Архитектура и стек</h2><p>Ответы на вопросы 5–7 вашего запроса. Система собирается на проверенных инструментах: ничего экзотического, чтобы её мог поддерживать любой backend-разработчик.</p></div></div>
 <div class="arch">
  <div class="ab on"><code>ИСТОЧНИКИ</code><b>Загрузка</b><p>Админка, пакетная заливка папкой, POST из 1С, загрузка подрядчиком-фотографом</p></div>
  <div class="ab"><code>ЯДРО</code><b>API-сервис</b><p>Node.js 22 + Fastify. Принимает файлы, проверяет, ставит задачи в очередь, отдаёт данные</p></div>
  <div class="ab"><code>ОБРАБОТКА</code><b>Воркеры</b><p>Очередь Redis + BullMQ, обработка изображений через libvips (sharp)</p></div>
  <div class="ab"><code>ХРАНЕНИЕ</code><b>Файлы и база</b><p>S3-совместимое хранилище для файлов, PostgreSQL 16 для метаданных</p></div>
  <div class="ab on"><code>ПОТРЕБИТЕЛИ</code><b>1С, магазин, площадки</b><p>Читают по HTTPS. Файлы отдаются через Nginx и CDN</p></div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Стек</div>
   ${[['Язык и платформа','Node.js 22, TypeScript'],['Веб-фреймворк','Fastify'],['Обработка изображений','sharp / libvips'],['Очередь задач','Redis + BullMQ'],['База данных','PostgreSQL 16'],['Хранилище файлов','S3-совместимое (MinIO или облако)'],['Отдача файлов','Nginx + CDN'],['Документация API','OpenAPI 3.1 + Swagger UI'],['Развёртывание','Docker Compose']]
    .map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Почему такой выбор</div>
   <div class="note" style="--tone:var(--acc)"><b>libvips — про скорость</b><p>Обработка изображений здесь основная нагрузка. libvips даёт лучший результат по времени и памяти среди доступных библиотек.</p></div>
   <div class="note" style="--tone:var(--cyan)"><b>PostgreSQL — про надёжность</b><p>Метаданные, версии и связи с артикулами. Проверенная база, которую умеет обслуживать любой администратор.</p></div>
   <div class="note" style="--tone:var(--violet)"><b>S3-совместимое хранилище</b><p>Можно поднять на вашем сервере (MinIO) или взять облачное. Переезд между ними не меняет код.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Docker — про передачу</b><p>Сервис поднимается одной командой. Передать проект другому разработчику можно без «а как это у вас запускается».</p></div>
  </div>
  <div class="panel"><div class="ph-title">Где будет сервер</div>
   <div class="kv"><span>Вариант 1 · рекомендуем</span><b>хостинг в Казахстане</b></div>
   <p class="mini">Ближе к покупателям и к вашей 1С, оплата в тенге, поддержка на русском. Ориентировочно 15 000–25 000 ₸ в месяц для стартового объёма.</p>
   <div class="kv" style="margin-top:6px"><span>Вариант 2</span><b>ваш собственный сервер</b></div>
   <p class="mini">Если у вас уже есть инфраструктура — разворачиваем там. Доступы остаются только у вас.</p>
   <div class="kv" style="margin-top:6px"><span>Вариант 3</span><b>европейское облако + CDN</b></div>
   <p class="mini">Дешевле по объёму хранения, скорость выравнивается за счёт CDN.</p>
   <div class="note" style="--tone:var(--amber)"><b>Решение за вами</b><p>Мы разворачиваем там, где скажете, и передаём все доступы. Привязки к нашей инфраструктуре нет.</p></div>
  </div>
 </div>`;

SC.users=()=>`
 <div class="head"><div><h2>Пользователи</h2><p>Пункт 9 ТЗ — административная часть. Простой интерфейс: поиск по артикулу, просмотр, загрузка, замена, удаление, URL, статус обработки и ошибки. Права разграничены по ролям.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Пользователь добавлен: вход по логину и паролю, роль определяет доступные разделы и действия.')">+ Пользователь</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px"><thead><tr>
  <th>Роль</th><th>Сотрудник</th><th>Загрузка</th><th>Замена и удаление</th><th>Ключи API</th><th>Настройки сервиса</th></tr></thead><tbody>
 ${[['Администратор хранилища','Администратор',1,1,1,1],['Контент-менеджер','Асель',1,1,0,0],['Программист 1С','Ерлан',1,0,1,0],['Менеджер интернет-магазина','Дана',1,0,0,0],['Руководитель','—',0,0,0,0]]
  .map(r=>`<tr onclick="toast('Права роли «${r[0]}» настраиваются по каждому действию отдельно.')">
  <td><b>${r[0]}</b></td><td class="mini">${r[1]}</td>
  ${[2,3,4,5].map(i=>`<td>${r[i]?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td>`).join('')}</tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что умеет административная часть</div>
   ${['Поиск товара по артикулу и части названия','Просмотр всех фотографий товара и их вариантов','Загрузка фото — по одному и пакетно','Замена фотографии с сохранением URL','Удаление с подтверждением и записью в журнал','Просмотр всех ссылок и копирование в один клик','Статус обработки и текст ошибки','Повторная обработка после ошибки','Список товаров без фотографий','Выгрузка списков и журнала в CSV']
    .map(t=>`<div class="chk"><i>✓</i><span>${t}</span></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Интерфейс намеренно простой</div>
   <div class="note" style="--tone:var(--acc)"><b>Работать в нём будет контент-менеджер, а не программист</b><p>Никаких настроек конвейера на главном экране: поиск по артикулу, перетащил файл, увидел ссылку. Всё остальное — в разделе администратора.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Обучение — полчаса</b><p>Инструкция администратора и инструкция контент-менеджера передаются вместе с системой, обучение входит в стоимость.</p></div>
   <div class="kv" style="margin-top:8px"><span>Вход</span><b>логин и пароль</b></div>
   <div class="kv"><span>Журнал действий</span><b>по каждому пользователю</b></div>
  </div>
 </div>`;

/* ===== РЕАЛЬНАЯ ОБРАБОТКА В БРАУЗЕРЕ ===== */
let UP=[];
function handleFiles(files){
 const list=[...files].filter(f=>/^image\//.test(f.type)).slice(0,6);
 if(!list.length){toast('Это не изображение. Принимаются JPEG, PNG, WebP и HEIC — ровно как в системе.');return}
 list.forEach(f=>processFile(f));
}
function skuFromName(name){const m=name.replace(/\.[^.]+$/,'').match(/^([A-Za-zА-Яа-я0-9]+-?[A-Za-z0-9]*)[_-](\d+)$/);
 return m?{sku:m[1].toUpperCase(),i:+m[2]}:{sku:'НЕ РАСПОЗНАН',i:1}}
async function processFile(file){
 const id='u'+Math.random().toString(36).slice(2,8);
 const {sku,i}=skuFromName(file.name);
 UP.unshift({id,name:file.name,sku,i,size:file.size,stage:0,res:null});
 renderUp();
 const t0=performance.now();
 const setStage=n=>{const u=UP.find(x=>x.id===id);if(u){u.stage=n;renderUp()}};
 try{
  setStage(1);
  const bmp=await createImageBitmap(file);
  await new Promise(r=>setTimeout(r,180));setStage(2);
  const mk=async(max,q,type)=>{
   const sc=Math.min(1,max/Math.max(bmp.width,bmp.height));
   const w=Math.round(bmp.width*sc),h=Math.round(bmp.height*sc);
   const c=document.createElement('canvas');c.width=w;c.height=h;
   c.getContext('2d').drawImage(bmp,0,0,w,h);
   const blob=await new Promise(res=>c.toBlob(res,type||'image/webp',q));
   return {w,h,size:blob?blob.size:0,url:blob?URL.createObjectURL(blob):''};
  };
  const main=await mk(1600,.82);await new Promise(r=>setTimeout(r,150));setStage(3);
  const medium=await mk(800,.8);
  const thumb=await mk(400,.78);await new Promise(r=>setTimeout(r,130));setStage(4);
  const micro=await mk(120,.7);
  await new Promise(r=>setTimeout(r,120));setStage(5);
  const u=UP.find(x=>x.id===id);
  u.res={src:{w:bmp.width,h:bmp.height,size:file.size},main,medium,thumb,micro,ms:Math.round(performance.now()-t0)};
  u.stage=6;renderUp();
  const save=Math.round((1-main.size/file.size)*100);
  toast(`<b>${esc(file.name)}</b> обработан за ${u.res.ms} мс: ${bmp.width}×${bmp.height}, ${kb(file.size/1024)} → WebP ${kb(main.size/1024)} — <b>минус ${save}% веса</b>. Созданы варианты 1600, 800, 400 и 120 px. Это настоящий результат, посчитанный вашим браузером.`);
 }catch(e){
  const u=UP.find(x=>x.id===id);if(u){u.stage=-1;u.err='Не удалось прочитать файл: '+e.message;renderUp()}
 }
}
function renderUp(){const el=document.getElementById('ugrid');if(!el)return;
 el.innerHTML=UP.map(u=>{
  const r=u.res;
  return `<div class="ucard">
   <div class="uimg">${r?`<img src="${r.main.url}" alt="">`:'<span class="mini">обработка…</span>'}</div>
   <div class="ub">
    <div class="un">${esc(u.name)}</div>
    <div class="um">SKU ${esc(u.sku)} · фото ${u.i} · ${kb(u.size/1024)}</div>
    ${u.stage===-1?`<div class="note" style="--tone:var(--red);margin-top:6px"><p>${esc(u.err)}</p></div>`:`
    <div class="steps">${STAGES.map((s,i)=>`<div class="stp ${u.stage>i+0?'on':''} ${u.stage===i?'run':''}"><i>${u.stage>i?'✓':i+1}</i>${s}</div>`).join('')}</div>`}
    ${r?`<div style="margin-top:8px">
     <div class="kv" style="padding:5px 0"><span>Оригинал</span><b class="mono">${r.src.w}×${r.src.h} · ${kb(r.src.size/1024)}</b></div>
     <div class="kv" style="padding:5px 0"><span>WebP 1600</span><b class="mono">${r.main.w}×${r.main.h} · ${kb(r.main.size/1024)}</b></div>
     <div class="kv" style="padding:5px 0"><span>Превью 400</span><b class="mono">${kb(r.thumb.size/1024)}</b></div>
     <div class="kv" style="padding:5px 0"><span>Экономия</span><b style="color:var(--green)">−${Math.round((1-r.main.size/r.src.size)*100)}%</b></div>
     <div class="kv" style="padding:5px 0"><span>Время</span><b class="mono">${r.ms} мс</b></div>
     <div class="um" style="margin-top:6px">/products/${esc(u.sku)}/${u.i===1?'main':'img-'+u.i}.webp</div>
    </div>`:''}
   </div></div>`}).join('');
}
function bindDrop(){const d=document.getElementById('drop');if(!d)return;
 d.ondragover=e=>{e.preventDefault();d.classList.add('over')};
 d.ondragleave=()=>d.classList.remove('over');
 d.ondrop=e=>{e.preventDefault();d.classList.remove('over');handleFiles(e.dataTransfer.files)};
}

/* ===== МЕХАНИКА ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>
 `<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;
 document.getElementById('rname').textContent=r.n;
 document.getElementById('rrole').textContent=r.r;
 const sel=document.getElementById('rsel');
 sel.innerHTML=Object.keys(ROLES).map(x=>`<option ${x===n?'selected':''}>${x}</option>`).join('');
 sel.onchange=()=>enter(sel.value);
 if(!r.s.includes(cur))cur=r.s[0];
 buildNav();render();
 toast(`Роль <b>${n}</b> — так система выглядит у этого сотрудника. Разделы и права ограничены его задачами.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{
  const av=items.filter(i=>al.includes(i[0]));if(!av.length)return '';
  return `<div class="nav-g">${g}</div>`+av.map(i=>
   `<a class="${cur===i[0]?'on':''}" onclick="go('${i[0]}')"><i>${i[1]}</i>${i[2]}${i[3]?`<span class="b">${i[3]}</span>`:''}</a>`).join('')}).join('')}
const PREF={upload:'Контент-менеджер',catalog:'Контент-менеджер',pipeline:'Контент-менеджер',
 api:'Программист 1С',keys:'Программист 1С',c1:'Программист 1С',stack:'Программист 1С',
 shop:'Менеджер интернет-магазина',mp:'Менеджер интернет-магазина'};
const ownerOf=s=>(PREF[s]&&ROLES[PREF[s]].s.includes(s))?PREF[s]:(Object.entries(ROLES).find(([n,r])=>r.s.includes(s))||['Администратор хранилища'])[0];
function go(s){if(!ROLES[role].s.includes(s))enter(ownerOf(s));
 cur=s;buildNav();render();document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`;
 const t=TITLES[cur]||['',''];document.getElementById('ttl').textContent=t[0];document.getElementById('sub').textContent=t[1];
 if(cur==='upload'){bindDrop();renderUp()}}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=(tabs||[]).map(x=>`<button class="dtab ${x[2]?'on':''}" onclick="${x[1]}">${x[0]}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const el=document.getElementById('toast');el.innerHTML=h;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),6000)}
function sparks(){const c=['#2f6fed','#0ea5a5','#7c3aed','#1f9d55','#ffffff','#d98324'];
 for(let i=0;i<52;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function healthPing(){toast('Проверка сервиса: API отвечает за 34 мс, очередь обработки жива, место на диске 214 ГБ из 500 ГБ, последняя резервная копия — сегодня в 03:00. Мониторинг присылает уведомление, если что-то из этого перестаёт быть правдой.')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('ih-theme',theme)}catch(e){}applyTheme()}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark');
 const b=document.getElementById('themeBtn');if(b)b.textContent=theme==='dark'?'☀ Светлая':'◐ Тёмная'}
(function(){try{const t=localStorage.getItem('ih-theme');if(t)theme=t}catch(e){}
 const q=new URLSearchParams(location.search).get('theme');if(q)theme=q;applyTheme()})();

/* ===== СЦЕНАРИЙ ===== */
const TOUR=[
 ['Контент-менеджер','upload','<b>Шаг 1.</b> Фотография загружается один раз. Имя файла <span class="mono">OP-5_1.jpg</span> само привязывает её к артикулу. Перетащите сюда свой снимок — обработка посчитается по-настоящему.',7000],
 ['Контент-менеджер','pipeline','<b>Шаг 2.</b> Конвейер: проверка, оригинал, сжатие, WebP, превью, запись в базу. Ошибки не теряют файл — их повторяют одной кнопкой.',6400],
 ['Контент-менеджер','catalog','<b>Шаг 3.</b> Каталог построен на артикулах, а не на названиях. Откройте товар — увидите все фото, их порядок и ссылки на каждый вариант.',6400],
 ['Программист 1С','api','<b>Шаг 4.</b> API: получить фото по артикулу, список, основное, статус обработки. Документация OpenAPI открывается в браузере — тестовый код писать не нужно.',6600],
 ['Программист 1С','keys','<b>Шаг 5.</b> Авторизация: свой ключ каждой системе, права, ограничение по IP и лимит запросов. Ключ отзывается мгновенно.',6200],
 ['Программист 1С','c1','<b>Шаг 6.</b> Обмен с 1С:УТ. В базу передаются артикул, ссылки, порядок и дата изменения — файлы в 1С не попадают, база не растёт.',6600],
 ['Менеджер интернет-магазина','shop','<b>Шаг 7.</b> Витрина берёт картинки по постоянной ссылке. Заменили фото — обновилось везде, править карточки вручную не нужно.',6400],
 ['Менеджер интернет-магазина','mp','<b>Шаг 8.</b> Площадки: единый слой выгрузки. Kaspi первым, остальные подключаются по одному — ядро не переписывается.',6200],
 ['Администратор хранилища','backup','<b>Шаг 9.</b> Резервные копии базы, оригиналов и настроек, с проверкой восстановления и инструкцией, которую мы передаём вам.',6200],
 ['Руководитель','dash','<b>Итог.</b> Одно фото — один раз, дальше его берут 1С, магазин и площадки. И главная цифра для руководителя: у скольких товаров каталога вообще нет фотографий.',7000]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();
  toast('<b>Демо собрано по вашему техническому заданию — по пунктам 1–11.</b> Коммерческое предложение с ответами на все 20 вопросов приложено отдельным файлом.');return}
 const [r,s,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(s);toast(txt)},role!==r?380:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q&&SC[q]){enter(ownerOf(q));go(q)}})();
