/* Pllato Pharmacy — демо-данные. Сеть из 3 аптек в Душанбе. */
window.PH = (function(){
  const PHARM = [
    {id:'a1', name:'Аптека №1 «Рудаки»',  addr:'пр. Рудаки, 42'},
    {id:'a2', name:'Аптека №2 «Сомони»',  addr:'ул. И. Сомони, 18'},
    {id:'a3', name:'Аптека №3 «Фирдавси»',addr:'ул. Фирдавси, 7'},
  ];

  const USERS = [
    {id:'u_own', name:'Манучехр',   role:'owner', pin:'1111', initials:'М'},
    {id:'u_adm', name:'Ирина А.',   role:'admin', pin:'2222', initials:'И', pharmacyId:'a1'},
    {id:'u_p1',  name:'Зарина К.',  role:'pharm', pin:'1234', initials:'З', pharmacyId:'a1'},
    {id:'u_p2',  name:'Фаррух Н.',  role:'pharm', pin:'1234', initials:'Ф', pharmacyId:'a2'},
    {id:'u_p3',  name:'Мадина Р.',  role:'pharm', pin:'1234', initials:'М', pharmacyId:'a3'},
  ];

  const CATS = ['Анальгетики','Антибиотики','Витамины','Сердечные','ЖКТ','Простуда','Прочее'];

  // helper: торговое наименование -> карточка
  let _bc = 4600000000000;
  const bc = () => String(++_bc);
  let _pid = 0;
  function P(o){ o.id='p'+(++_pid); if(!o.barcode) o.barcode=bc(); o.margin = Math.round((o.sale-o.buy)/o.sale*100); return o; }

  // ——— Диклофенаки: одна группа МНН, много брендов (демо «50 видов в одной базе») ———
  const PRODUCTS = [
    P({name:'Вольтарен', inn:'Диклофенак', manuf:'Novartis', country:'Швейцария', form:'таблетки', dose:'50 мг', pack:'20 шт', cat:'Анальгетики', rx:true,  buy:38, sale:62}),
    P({name:'Диклофенак-Акос', inn:'Диклофенак', manuf:'Синтез', country:'Россия', form:'таблетки', dose:'50 мг', pack:'20 шт', cat:'Анальгетики', rx:true, buy:6, sale:12}),
    P({name:'Ортофен', inn:'Диклофенак', manuf:'Татхимфарм', country:'Россия', form:'таблетки', dose:'25 мг', pack:'30 шт', cat:'Анальгетики', rx:true, buy:5, sale:11}),
    P({name:'Диклак', inn:'Диклофенак', manuf:'Sandoz', country:'Словения', form:'гель', dose:'5%', pack:'50 г', cat:'Анальгетики', rx:false, buy:24, sale:41}),
    P({name:'Наклофен', inn:'Диклофенак', manuf:'KRKA', country:'Словения', form:'таблетки', dose:'100 мг', pack:'20 шт', cat:'Анальгетики', rx:true, buy:19, sale:33}),
    P({name:'Болтарин', inn:'Диклофенак', manuf:'Nabros Pharma', country:'Индия', form:'таблетки', dose:'50 мг', pack:'20 шт', cat:'Анальгетики', rx:true, buy:4, sale:9}),
    P({name:'Диклофенак-натрий', inn:'Диклофенак', manuf:'Нижфарм', country:'Россия', form:'ампулы', dose:'25 мг/мл', pack:'5 шт', cat:'Анальгетики', rx:true, buy:11, sale:21}),
    P({name:'Вольтарен Эмульгель', inn:'Диклофенак', manuf:'Novartis', country:'Швейцария', form:'гель', dose:'1%', pack:'100 г', cat:'Анальгетики', rx:false, buy:46, sale:78}),
    P({name:'Дикловит', inn:'Диклофенак', manuf:'Нижфарм', country:'Россия', form:'свечи', dose:'50 мг', pack:'10 шт', cat:'Анальгетики', rx:true, buy:9, sale:18}),
    P({name:'Раптен Рапид', inn:'Диклофенак', manuf:'Hemofarm', country:'Сербия', form:'таблетки', dose:'50 мг', pack:'20 шт', cat:'Анальгетики', rx:true, buy:14, sale:25}),

    // ——— Анальгетики прочие ———
    P({name:'Нурофен', inn:'Ибупрофен', manuf:'Reckitt', country:'Великобритания', form:'таблетки', dose:'200 мг', pack:'20 шт', cat:'Анальгетики', rx:false, buy:18, sale:32}),
    P({name:'Ибупрофен', inn:'Ибупрофен', manuf:'Borisov', country:'Беларусь', form:'таблетки', dose:'200 мг', pack:'20 шт', cat:'Анальгетики', rx:false, buy:4, sale:9}),
    P({name:'Парацетамол', inn:'Парацетамол', manuf:'Фармстандарт', country:'Россия', form:'таблетки', dose:'500 мг', pack:'10 шт', cat:'Простуда', rx:false, buy:2, sale:5}),
    P({name:'Панадол', inn:'Парацетамол', manuf:'GSK', country:'Великобритания', form:'таблетки', dose:'500 мг', pack:'12 шт', cat:'Простуда', rx:false, buy:9, sale:17}),
    P({name:'Анальгин', inn:'Метамизол', manuf:'Фармстандарт', country:'Россия', form:'таблетки', dose:'500 мг', pack:'10 шт', cat:'Анальгетики', rx:false, buy:2, sale:6}),
    P({name:'Кеторол', inn:'Кеторолак', manuf:'Dr.Reddys', country:'Индия', form:'таблетки', dose:'10 мг', pack:'20 шт', cat:'Анальгетики', rx:true, buy:13, sale:24}),

    // ——— Антибиотики ———
    P({name:'Сумамед', inn:'Азитромицин', manuf:'Pliva', country:'Хорватия', form:'капсулы', dose:'500 мг', pack:'3 шт', cat:'Антибиотики', rx:true, buy:42, sale:69}),
    P({name:'Азитромицин', inn:'Азитромицин', manuf:'Vertex', country:'Россия', form:'капсулы', dose:'500 мг', pack:'3 шт', cat:'Антибиотики', rx:true, buy:11, sale:22}),
    P({name:'Амоксициллин', inn:'Амоксициллин', manuf:'Hemofarm', country:'Сербия', form:'капсулы', dose:'500 мг', pack:'16 шт', cat:'Антибиотики', rx:true, buy:8, sale:16}),
    P({name:'Аугментин', inn:'Амоксициллин+клав.', manuf:'GSK', country:'Великобритания', form:'таблетки', dose:'875 мг', pack:'14 шт', cat:'Антибиотики', rx:true, buy:54, sale:88}),
    P({name:'Цефтриаксон', inn:'Цефтриаксон', manuf:'Lekhim', country:'Украина', form:'ампулы', dose:'1 г', pack:'1 шт', cat:'Антибиотики', rx:true, buy:7, sale:15}),
    P({name:'Супракс', inn:'Цефиксим', manuf:'Astellas', country:'Япония', form:'капсулы', dose:'400 мг', pack:'6 шт', cat:'Антибиотики', rx:true, buy:48, sale:79}),

    // ——— Витамины ———
    P({name:'Аскорбиновая к-та', inn:'Витамин C', manuf:'Марбиофарм', country:'Россия', form:'драже', dose:'50 мг', pack:'200 шт', cat:'Витамины', rx:false, buy:3, sale:8}),
    P({name:'Аквадетрим', inn:'Витамин D3', manuf:'Medana', country:'Польша', form:'капли', dose:'15000 МЕ', pack:'10 мл', cat:'Витамины', rx:false, buy:21, sale:38}),
    P({name:'Магне B6', inn:'Магний+B6', manuf:'Sanofi', country:'Франция', form:'таблетки', dose:'—', pack:'50 шт', cat:'Витамины', rx:false, buy:34, sale:58}),
    P({name:'Компливит', inn:'Поливитамины', manuf:'Фармстандарт', country:'Россия', form:'таблетки', dose:'—', pack:'60 шт', cat:'Витамины', rx:false, buy:16, sale:29}),
    P({name:'Супрадин', inn:'Поливитамины', manuf:'Bayer', country:'Германия', form:'шип. таблетки', dose:'—', pack:'10 шт', cat:'Витамины', rx:false, buy:27, sale:47}),

    // ——— Сердечные ———
    P({name:'Конкор', inn:'Бисопролол', manuf:'Merck', country:'Германия', form:'таблетки', dose:'5 мг', pack:'30 шт', cat:'Сердечные', rx:true, buy:29, sale:49}),
    P({name:'Каптоприл', inn:'Каптоприл', manuf:'Озон', country:'Россия', form:'таблетки', dose:'25 мг', pack:'40 шт', cat:'Сердечные', rx:true, buy:4, sale:10}),
    P({name:'Аспирин Кардио', inn:'Ацетилсалиц. к-та', manuf:'Bayer', country:'Германия', form:'таблетки', dose:'100 мг', pack:'28 шт', cat:'Сердечные', rx:false, buy:16, sale:29}),
    P({name:'Лозап', inn:'Лозартан', manuf:'Zentiva', country:'Чехия', form:'таблетки', dose:'50 мг', pack:'30 шт', cat:'Сердечные', rx:true, buy:22, sale:39}),
    P({name:'Нитроглицерин', inn:'Нитроглицерин', manuf:'Фармстандарт', country:'Россия', form:'таблетки', dose:'0.5 мг', pack:'40 шт', cat:'Сердечные', rx:true, buy:3, sale:8}),

    // ——— ЖКТ ———
    P({name:'Омепразол', inn:'Омепразол', manuf:'Hemofarm', country:'Сербия', form:'капсулы', dose:'20 мг', pack:'30 шт', cat:'ЖКТ', rx:false, buy:7, sale:15}),
    P({name:'Смекта', inn:'Диосмектит', manuf:'Ipsen', country:'Франция', form:'порошок', dose:'3 г', pack:'10 шт', cat:'ЖКТ', rx:false, buy:18, sale:32}),
    P({name:'Мезим Форте', inn:'Панкреатин', manuf:'Berlin-Chemie', country:'Германия', form:'таблетки', dose:'10000', pack:'20 шт', cat:'ЖКТ', rx:false, buy:14, sale:26}),
    P({name:'Но-Шпа', inn:'Дротаверин', manuf:'Sanofi', country:'Франция', form:'таблетки', dose:'40 мг', pack:'24 шт', cat:'ЖКТ', rx:false, buy:19, sale:34}),
    P({name:'Активированный уголь', inn:'Уголь активир.', manuf:'Фармстандарт', country:'Россия', form:'таблетки', dose:'250 мг', pack:'10 шт', cat:'ЖКТ', rx:false, buy:1, sale:4}),

    // ——— Простуда ———
    P({name:'ТераФлю', inn:'Парацетамол комб.', manuf:'GSK', country:'Швейцария', form:'порошок', dose:'—', pack:'10 шт', cat:'Простуда', rx:false, buy:31, sale:54}),
    P({name:'Ринза', inn:'Парацетамол комб.', manuf:'Unique', country:'Индия', form:'таблетки', dose:'—', pack:'10 шт', cat:'Простуда', rx:false, buy:12, sale:23}),
    P({name:'Лизобакт', inn:'Лизоцим', manuf:'Bosnalijek', country:'Босния', form:'таблетки', dose:'—', pack:'30 шт', cat:'Простуда', rx:false, buy:23, sale:41}),
    P({name:'Граммидин', inn:'Грамицидин', manuf:'Валента', country:'Россия', form:'таблетки', dose:'—', pack:'18 шт', cat:'Простуда', rx:false, buy:21, sale:37}),
    P({name:'Називин', inn:'Оксиметазолин', manuf:'Merck', country:'Германия', form:'капли', dose:'0.05%', pack:'10 мл', cat:'Простуда', rx:false, buy:17, sale:31}),
  ];

  const SUPPLIERS = [
    {id:'s1', name:'ООО «Фармимпорт ДШ»',   inn:'030450012', terms:'отсрочка 30 дней', debt:8420, marginAfter:46},
    {id:'s2', name:'«Дору-Дармон»',          inn:'010220987', terms:'предоплата, скидка 4%', debt:0, marginAfter:51},
    {id:'s3', name:'«Авиценна-Фарм»',        inn:'030411445', terms:'отсрочка 14 дней', debt:3110, marginAfter:39},
    {id:'s4', name:'ИП Рахимов (опт)',       inn:'404550021', terms:'наличные', debt:0, marginAfter:55},
  ];

  // ——— остатки по аптекам + срок годности (партии) ———
  // base[productId] -> разные остатки в a1/a2/a3; некоторые «истекают» и «заканчиваются»
  function seedStock(){
    const stock = {}; // stock[pharmacyId][productId] = {qty, min, expiry}
    PHARM.forEach(ph=>stock[ph.id]={});
    const today = new Date();
    PRODUCTS.forEach((p,i)=>{
      PHARM.forEach((ph,j)=>{
        // псевдослучайно, но детерминированно
        let q = ((i*7 + j*13 + p.sale) % 60);
        // несколько нулевых/низких для алертов
        if((i+j)%17===0) q = 0;
        if((i*j)%11===0 && q>0) q = (q%4);
        const min = [5,8,10,6][(i+j)%4];
        // срок годности
        let days = 90 + ((i*31 + j*17) % 600);
        if(i%13===0) days = 12 + (j*6);      // истекает скоро
        if(i===5 && j===1) days = -4;        // просрочен
        const exp = new Date(today.getTime()+days*864e5);
        stock[ph.id][p.id] = {qty:q, min, expiry:exp.toISOString().slice(0,10)};
      });
    });
    return stock;
  }

  // ——— генерация истории продаж за 14 дней ———
  function seedSales(stock){
    const sales = [];
    const pharmStaff = {a1:'u_p1', a2:'u_p2', a3:'u_p3'};
    let rid = 1000;
    let seed = 7;
    const rnd = ()=>{ seed = (seed*9301+49297)%233280; return seed/233280; };
    const now = new Date();
    for(let d=13; d>=0; d--){
      const day = new Date(now.getTime()-d*864e5);
      PHARM.forEach(ph=>{
        // выручка по точкам разная: a1 топ, a3 слабее
        const base = ph.id==='a1'?22 : ph.id==='a2'?16 : 11;
        const nChecks = Math.max(4, Math.round(base + (rnd()*8-4) - (day.getDay()===0?4:0)));
        for(let c=0;c<nChecks;c++){
          const lines=[];
          const nItems = 1+Math.floor(rnd()*3);
          for(let k=0;k<nItems;k++){
            const p = PRODUCTS[Math.floor(rnd()*PRODUCTS.length)];
            const qty = 1+Math.floor(rnd()*2);
            lines.push({pid:p.id, name:p.name, qty, price:p.sale, buy:p.buy});
          }
          const total = lines.reduce((s,l)=>s+l.qty*l.price,0);
          const cost  = lines.reduce((s,l)=>s+l.qty*l.buy,0);
          const pays=['cash','cash','cash','card','transfer'];
          const hh = 9+Math.floor(rnd()*12), mm=Math.floor(rnd()*60);
          const ts = new Date(day); ts.setHours(hh,mm,0,0);
          const isReturn = rnd()<0.02;
          sales.push({
            id:'R'+(++rid), pharmacyId:ph.id, userId:pharmStaff[ph.id],
            ts:ts.toISOString(), lines, total: isReturn?-total:total, cost: isReturn?-cost:cost,
            pay:pays[Math.floor(rnd()*pays.length)], type:isReturn?'return':'sale'
          });
        }
      });
    }
    sales.sort((a,b)=>a.ts.localeCompare(b.ts));
    return sales;
  }

  function fresh(){
    const stock = seedStock();
    const sales = seedSales(stock);
    return {
      version: 4,
      pharmacies: PHARM,
      users: USERS,
      cats: CATS,
      products: PRODUCTS,
      suppliers: SUPPLIERS,
      stock,
      sales,
      log: [
        {ts:new Date(Date.now()-3600e3).toISOString(), userId:'u_p1', text:'Открыта смена · Аптека №1'},
        {ts:new Date(Date.now()-1800e3).toISOString(), userId:'u_adm', text:'Принята поставка от «Дору-Дармон» (14 позиций)'},
      ],
      competitors: [
        {pid:'p2', name:'Диклофенак-Акос', our:12, comp:11, who:'Аптека «Шифо» (через дорогу)'},
        {pid:'p17', name:'Сумамед', our:69, comp:64, who:'Дискаунтер «Аптека+»'},
        {pid:'p24', name:'Аквадетрим', our:38, comp:40, who:'Аптека «Шифо»'},
        {pid:'p13', name:'Панадол', our:17, comp:15, who:'Дискаунтер «Аптека+»'},
      ],
    };
  }

  return { fresh };
})();
