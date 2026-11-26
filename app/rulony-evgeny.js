/* СТАЛЬКОИЛ — склад оцинкованных рулонов (Евгений). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const f1=n=>new Intl.NumberFormat('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n);
const f2=n=>new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const tg=n=>fmt(n)+' ₸';
const bar=(w,y)=>`<div class="bar${y?' y':''}"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>ЕВГЕНИЙ, 26.11</b><i>«${q}»</i>${a?`<div class="sa">${a}</div>`:''}</div>`;
const tbl=(h,rows)=>`<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${h.length}" class="note">Пока пусто</td></tr>`}</tbody></table></div>`;
const kpi=a=>`<div class="kpi">${a.map(x=>`<div><small>${x[0]}</small><b>${x[1]}</b>${x[2]?`<i>${x[2]}</i>`:''}</div>`).join('')}</div>`;
const now=()=>{const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};

/* ---------- справочники ---------- */
const SUP=[
 {k:'HX',n:'Хуасинь Стил',city:'Шаньдун',fmt:'таблица 2×7 на английском, штрихкод Code128 внизу',col:'#25608f'},
 {k:'RC',n:'Жунчэн Металл',city:'Тяньцзинь',fmt:'двуязычная CN/EN, номер рулона крупно сверху, без таблицы',col:'#8a6800'},
 {k:'JX',n:'Цзиньсян Коатинг',city:'Хэбэй',fmt:'QR производителя + короткая строка с размерами',col:'#2b7a46'}
];
const COL={'Z':['Оцинковка','#c3ccd1'],'3005':['RAL 3005 вишня','#5e2028'],'8017':['RAL 8017 шоколад','#45322e'],'6005':['RAL 6005 зелёный мох','#114232'],'9003':['RAL 9003 белый','#f2f2ee'],'5005':['RAL 5005 синий','#1e3f78'],'7024':['RAL 7024 графит','#474a51']};
const SHOP=['Цех 1 · профнастил','Цех 2 · металлочерепица','Цех 3 · фасадные кассеты и доборы','Цех 4 · сэндвич-панели'];
const ZN={A:'Зона A · оцинковка',B:'Зона B · окрашенный',C:'Зона C · остатки и сэндвич'};
/* детерминированный генератор */
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
const pick=a=>a[Math.floor(rnd()*a.length)];
const R=[];/* рулоны */
(function gen(){
 const plan=[['A',['Z'],[0.4,0.45,0.5,0.55,0.7],[1250,1250,1000]],['B',['3005','8017','6005','9003','5005','7024'],[0.4,0.45,0.5],[1250,1250,1190]],['C',['Z','9003','7024'],[0.45,0.5,0.6],[1250,1000]]];
 let n=0;
 plan.forEach(([z,cols,ths,wds])=>{
  const fill=z==='C'?22:z==='A'?30:34;
  const used={};
  for(let i=0;i<fill;i++){
   let r,p,key;do{r=1+Math.floor(rnd()*4);p=1+Math.floor(rnd()*10);key=r+'-'+p}while(used[key]);used[key]=1;
   const c=pick(cols),t=pick(ths),w=pick(wds),s=pick(SUP),age=Math.floor(3+rnd()*(z==='C'?240:170));
   const kg=Math.round((z==='C'?900+rnd()*2600:3400+rnd()*4600)/10)*10;
   n++;
   R.push({id:'R-'+String(2600+n),sup:s.k,lot:s.k+'-'+(2600+Math.floor(rnd()*99))+'-'+String(Math.floor(rnd()*9000)+1000),
    grade:c==='Z'?(rnd()>.5?'DX51D+Z275':'DX51D+Z140'):'DX51D+Z · ПЭ',col:c,t,w,kg,age,z,r,p,st:'store',price:c==='Z'?Math.round(505000+t*40000):Math.round(598000+t*45000),hist:[]});
  }
 });
 R.forEach(x=>{x.hist.push([daysAgo(x.age),'Приход',`по этикетке ${x.sup} · ${x.lot}`,x.z+'-'+x.r+'-'+x.p])});
 /* пара рулонов в резерве и выданных */
 R[3].st='res';R[40].st='res';
})();
function daysAgo(d){const x=new Date(2026,10,26);x.setDate(x.getDate()-d);return String(x.getDate()).padStart(2,'0')+'.'+String(x.getMonth()+1).padStart(2,'0')}
const plc=x=>x.z+'-'+x.r+'-'+String(x.p).padStart(2,'0');
const m=x=>Math.round(x.kg/(x.t*x.w/1000*7.85));
const nm=x=>`${x.grade} · ${COL[x.col][0]} · ${f2(x.t)}×${x.w}`;
const sw=c=>`<span class="sw" style="background:${COL[c][1]}"></span>`;
const byId=id=>R.find(x=>x.id===id);
const inStore=()=>R.filter(x=>x.st==='store'||x.st==='res');
const tons=a=>a.reduce((s,x)=>s+x.kg,0)/1000;
const money=a=>a.reduce((s,x)=>s+x.kg/1000*x.price,0);

/* ---------- обмен с 1С и журнал ---------- */
let SYNC=[
 ['10:42','→ 1С','Поступление ПТ-0911 · 6 рулонов, 34,8 т','ok',''],
 ['10:44','← 1С','Заявка ЗН-08812 · Цех 2','ok',''],
 ['11:05','→ 1С','Поступление R-2690 · RAL 6020','err','Номенклатура «RAL 6020 0,45×1250» не найдена в 1С'],
 ['11:20','→ 1С','Перемещение в цех R-2617 → Цех 1','ok','']
];
let LOG=[['11:20','Ерлан','Выдача в цех','R-2617 → Цех 1 · 5,9 т'],['10:42','Ерлан','Приход','ПТ-0911 · 6 рулонов'],['09:58','Сергей','Перемещение','R-2644 B-1-03 → B-3-08'],['09:15','Сергей','Инвентаризация','A-1 · расхождений нет']];
function toLog(a,b){LOG.unshift([now(),role==='Кладовщик'?'Ерлан':'Сергей',a,b])}
function to1C(dir,doc){SYNC.unshift([now(),dir,doc,'ok',''])}
function retry(i){const s=SYNC[i];if(!s||s[3]!=='err'){toast('Эта запись уже передана.');return}s[3]='ok';s[4]='создана номенклатура в 1С и документ проведён';toLog('Обмен 1С','повтор: '+s[2]);build();toast('Повтор прошёл: номенклатура создана в 1С, поступление проведено. Ошибок обмена больше нет.')}

/* ---------- приход по этикетке ---------- */
let INC={sup:0,scanned:false,saved:false,qr:false,place:null,f:{}};
function setSup(i){INC={sup:i,scanned:false,saved:false,qr:false,place:null,f:{}};build()}
function scanLbl(){const s=SUP[INC.sup];INC.scanned=true;INC.f={lot:s.k+'-2611-0'+(418+R.length),grade:INC.sup===1?'DX51D+Z275':'DX51D+Z · ПЭ',col:INC.sup===1?'Z':INC.sup===0?'3005':'8017',t:INC.sup===2?0.5:0.45,w:1250,kg:INC.sup===0?6140:INC.sup===1?7380:5520,heat:'H'+(5120+INC.sup*37)};INC.place=freeFor(INC.f.col==='Z'?'A':'B');build();toast('Этикетка прочитана: 7 полей распознаны, проверьте подсвеченные.')}
function setF(k,v){INC.f[k]=(k==='t'||k==='w'||k==='kg')?(parseFloat(String(v).replace(',','.'))||0):v;build()}
function freeFor(z){for(let r=1;r<=4;r++)for(let p=1;p<=10;p++){if(!R.some(x=>(x.st==='store'||x.st==='res')&&x.z===z&&x.r===r&&x.p===p))return {z,r,p}}return {z:'C',r:4,p:10}}
function printQR(){if(!INC.scanned){toast('Сначала отсканируйте этикетку завода.');return}INC.qr=true;build();toast('QR-ярлык отправлен на принтер этикеток · 100×70 мм.')}
function postInc(){if(!INC.scanned){toast('Сначала отсканируйте этикетку.');return}if(INC.saved){toast('Рулон уже оприходован.');return}if(!INC.qr){toast('Наклейте свой QR-ярлык — без него рулон не найти сканером.');return}
 const f=INC.f,pl=INC.place,id='R-'+String(2600+R.length+1);
 R.push({id,sup:SUP[INC.sup].k,lot:f.lot,grade:f.grade,col:f.col,t:f.t,w:f.w,kg:f.kg,age:0,z:pl.z,r:pl.r,p:pl.p,st:'store',price:f.col==='Z'?525000:618000,hist:[['26.11','Приход','по этикетке '+SUP[INC.sup].n+' · '+f.lot,pl.z+'-'+pl.r+'-'+pl.p]]});
 INC.saved=true;INC.newId=id;to1C('→ 1С','Поступление '+id+' · '+f1(f.kg/1000)+' т');toLog('Приход',id+' → '+pl.z+'-'+pl.r+'-'+pl.p);build();toast(`Рулон <b>${id}</b> на месте ${pl.z}-${pl.r}-${pl.p}. Поступление отправлено в 1С ✓`)}
function otherPlace(){if(!INC.scanned)return;const z=INC.place.z==='A'?'C':INC.place.z==='B'?'C':'A';INC.place=freeFor(z);build();toast('Предложено другое свободное место: '+INC.place.z+'-'+INC.place.r+'-'+INC.place.p)}

/* ---------- контейнер ---------- */
let CONT=[];for(let i=0;i<14;i++)CONT.push({no:'RC-2611-'+(5300+i),kg:5800+((i*373)%1900),got:i<9?true:false,fact:0});
CONT[4].fact=CONT[4].kg-120;CONT[11].miss=true;
let contDone=false;
function scanNext(){const c=CONT.find(x=>!x.got&&!x.miss);if(!c){toast('Все рулоны по упаковочному листу отсканированы.');return}c.got=true;build();toast('Отсканирован '+c.no+' · '+fmt(c.kg)+' кг — совпадает с упаковочным листом.')}
function postCont(){if(contDone){toast('Контейнер уже принят.');return}const left=CONT.filter(x=>!x.got&&!x.miss).length;if(left){toast(`Ещё ${left} рулонов не отсканированы. Отсканируйте или отметьте «нет в контейнере».`);return}contDone=true;to1C('→ 1С','Поступление по контейнеру TGHU 482190-3 · '+CONT.filter(x=>x.got).length+' рулонов');toLog('Приход контейнера','TGHU 482190-3 · акт расхождений');build();toast('Контейнер принят. Акт расхождений (недовес 120 кг, нет 1 рулона) сформирован для поставщика, поступление ушло в 1С ✓')}
function markMiss(i){CONT[i].miss=!CONT[i].miss;if(CONT[i].miss)CONT[i].got=false;build()}

/* ---------- заявки из 1С ---------- */
let REQ=[
 {n:'ЗН-08812',from:1,need:{col:'3005',t:0.45,w:1250},kg:4200,st:'new',when:'10:44',who:'Мастер Цеха 2'},
 {n:'ЗН-08815',from:0,need:{col:'Z',t:0.5,w:1250},kg:6000,st:'new',when:'11:31',who:'Мастер Цеха 1'},
 {n:'РЛ-01944',from:-1,client:'ТОО «КровляСтрой-Юг»',need:{col:'8017',t:0.45,w:1250},kg:5000,st:'new',when:'11:48',who:'Менеджер 1С'},
 {n:'ЗН-08809',from:3,need:{col:'9003',t:0.5,w:1250},kg:3000,st:'done',when:'09:12',who:'Мастер Цеха 4',roll:'R-2617',sh:'09:40'}
];
let cReq=0,cPick=null,scanOk=false;
function cands(q){return inStore().filter(x=>x.st==='store'&&x.col===q.need.col&&Math.abs(x.t-q.need.t)<.001&&x.w===q.need.w).sort((a,b)=>b.age-a.age)}
function openReq(i){cReq=i;const q=REQ[i];const c=cands(q);cPick=c.length?c[0].id:null;scanOk=false;go('pick')}
function choose(id){cPick=id;scanOk=false;build()}
function scanTake(wrong){if(!cPick){toast('Нет подходящего рулона на складе — заявка уйдёт в «дефицит» в 1С.');return}if(wrong){const x=inStore().find(y=>y.id!==cPick&&y.st==='store');toast(`⚠ Отсканирован <b>${x.id}</b>, а нужен <b>${cPick}</b>. Это не тот рулон — выдача заблокирована.`);scanOk=false;build();return}scanOk=true;build();toast('QR совпал: это тот самый рулон '+cPick+'. Можно выдавать.')}
function issue(){const q=REQ[cReq];if(q.st==='done'){toast('Заявка уже закрыта.');return}if(!scanOk){toast('Сначала отсканируйте QR на рулоне — защита от «взял не тот».');return}const x=byId(cPick);x.st='out';x.hist.push(['26.11',q.from<0?'Отгрузка клиенту':'Выдача в цех',q.from<0?q.client:SHOP[q.from],plc(x)]);x.to=q.from;q.st='done';q.roll=x.id;q.sh=now();to1C('→ 1С',(q.from<0?'Реализация ':'Перемещение в цех ')+x.id+' по '+q.n);toLog(q.from<0?'Отгрузка':'Выдача в цех',x.id+' → '+(q.from<0?q.client:SHOP[q.from].split(' ·')[0]));scanOk=false;build();toast(`Рулон <b>${x.id}</b> ${q.from<0?'отгружен клиенту':'выдан в '+esc(SHOP[q.from].split(' ·')[0])}. Списано со склада, документ передан в 1С ✓`)}
function newReq(){REQ.unshift({n:'ЗН-0'+(8816+REQ.length),from:2,need:{col:'7024',t:0.5,w:1250},kg:2500,st:'new',when:now(),who:'Мастер Цеха 3'});SYNC.unshift([now(),'← 1С','Заявка ЗН-0'+(8815+REQ.length)+' · Цех 3','ok','']);build();toast('Из 1С пришла новая заявка Цеха 3: графит 0,5×1250, 2,5 т. Кладовщику ушло уведомление.')}

/* ---------- возврат остатка ---------- */
let RET={id:null,kg:1400,done:false};
function outs(){return R.filter(x=>x.st==='out'&&x.to>=0)}
function setRet(id){RET.id=id;RET.done=false;build()}
function setRetKg(v){RET.kg=Math.max(0,parseInt(v)||0);build()}
function postRet(){const x=byId(RET.id);if(!x){toast('Выберите рулон, выданный в цех.');return}if(RET.done){toast('Остаток уже принят.');return}if(RET.kg<=0||RET.kg>=x.kg){toast('Вес остатка должен быть больше 0 и меньше веса рулона при выдаче.');return}
 const pl=freeFor('C'),id=x.id+'-О1';R.push({id,sup:x.sup,lot:x.lot,grade:x.grade,col:x.col,t:x.t,w:x.w,kg:RET.kg,age:0,z:pl.z,r:pl.r,p:pl.p,st:'store',price:x.price,hist:[['26.11','Возврат остатка из цеха',SHOP[x.to],pl.z+'-'+pl.r+'-'+pl.p]]});
 x.hist.push(['26.11','Израсходовано в цехе',fmt(x.kg-RET.kg)+' кг',SHOP[x.to].split(' ·')[0]]);RET.done=true;RET.newId=id;to1C('→ 1С','Возврат остатка '+id+' · '+fmt(RET.kg)+' кг');toLog('Возврат остатка',id+' → '+pl.z+'-'+pl.r+'-'+pl.p);build();toast(`Остаток принят как <b>${id}</b>, напечатан новый QR, место ${pl.z}-${pl.r}-${pl.p}. Расход цеха ${fmt(x.kg-RET.kg)} кг ушёл в 1С.`)}

/* ---------- схема, поиск, перемещение ---------- */
let MAPF={col:'',t:'',q:''},HL=null;
function setMF(k,v){MAPF[k]=v;build()}
function cellClick(z,r,p){const x=inStore().find(y=>y.z===z&&y.r===r&&y.p===p);if(!x){openM('Место '+z+'-'+r+'-'+String(p).padStart(2,'0'),'свободно','<p class="note">Свободное место. Сюда можно поставить рулон шириной до 1250 мм и весом до 9 т.</p>');return}rollM(x.id)}
function rollM(id){const x=byId(id);openM(`Рулон ${esc(x.id)}`,`${esc(nm(x))} · место ${plc(x)}`,`<div class="kv"><span>Завод</span><b>${esc(SUP.find(s=>s.k===x.sup).n)}</b></div><div class="kv"><span>Партия / плавка</span><b class="mono">${esc(x.lot)}</b></div><div class="kv"><span>Вес</span><b>${fmt(x.kg)} кг · ≈ ${fmt(m(x))} м</b></div><div class="kv"><span>На складе</span><b>${x.age} дн.</b></div><div class="btns"><button class="bt s" onclick="cardOf('${x.id}')">Карточка рулона</button></div>`)}
function cardOf(id){CARD=id;closeM();go('card')}
let CARD='R-2601';
function findRoll(v){MAPF.q=v.trim().toUpperCase();const x=inStore().find(y=>y.id===MAPF.q||y.lot===MAPF.q);HL=x?x.id:null;build();if(v&&!x)toast('Рулон с таким номером не найден на складе.');else if(x)toast(`${x.id} лежит на месте <b>${plc(x)}</b>.`)}
let MV={id:'R-2644',to:'B-3-08',done:false};
function setMv(k,v){MV[k]=v;MV.done=false;build()}
function postMv(){const x=byId(MV.id);if(!x||!(x.st==='store'||x.st==='res')){toast('Выберите рулон, который лежит на складе.');return}const [z,r,p]=MV.to.split('-');const rr=parseInt(r),pp=parseInt(p);if(!ZN[z]||!rr||!pp||rr>4||pp>10){toast('Место в формате Зона-Ряд-Место, например B-3-08.');return}if(inStore().some(y=>y!==x&&y.z===z&&y.r===rr&&y.p===pp)){toast('Место '+MV.to+' занято. Выберите свободное.');return}const from=plc(x);x.z=z;x.r=rr;x.p=pp;x.hist.push(['26.11','Перемещение',from+' → '+plc(x),plc(x)]);MV.done=true;toLog('Перемещение',x.id+' '+from+' → '+plc(x));build();toast(`Рулон ${x.id} перемещён: ${from} → ${plc(x)}.`)}

/* ---------- инвентаризация ---------- */
let INV={zone:'A',row:1,scanned:{},extra:false,done:false};
function invList(){return inStore().filter(x=>x.z===INV.zone&&x.r===INV.row)}
function setInv(k,v){INV[k]=k==='row'?parseInt(v):v;INV.scanned={};INV.extra=false;INV.done=false;build()}
function invScan(){const l=invList().filter(x=>!INV.scanned[x.id]);if(l.length<=1){toast(l.length?'Последний рулон ряда не найден на месте — отметьте «не найден».':'Все рулоны ряда отсканированы.');return}INV.scanned[l[0].id]='ok';build();toast('Найден '+l[0].id+' на месте '+plc(l[0])+'.')}
function invAll(){invList().forEach((x,i,a)=>{if(i<a.length-1)INV.scanned[x.id]='ok'});build();toast('Отсканированы все рулоны ряда, кроме одного.')}
function invMiss(id){INV.scanned[id]=INV.scanned[id]==='miss'?undefined:'miss';build()}
function invExtra(){INV.extra=!INV.extra;build();if(INV.extra)toast('Лишний рулон R-2588 — по базе он числится в зоне C. Система предложит переставить или поправить место.')}
function postInv(){if(INV.done){toast('Инвентаризация ряда уже проведена.');return}const l=invList(),left=l.filter(x=>!INV.scanned[x.id]);if(left.length){toast(`Не проверено ${left.length} рулонов: отсканируйте или отметьте «не найден».`);return}INV.done=true;const miss=l.filter(x=>INV.scanned[x.id]==='miss').length;to1C('→ 1С','Инвентаризация '+INV.zone+'-'+INV.row+' · расхождений '+(miss+(INV.extra?1:0)));toLog('Инвентаризация',INV.zone+'-'+INV.row+' · не найдено '+miss+(INV.extra?', лишний 1':''));build();toast('Инвентаризация ряда проведена. Расхождения переданы в 1С и начальнику склада.')}

/* ---------- экраны ---------- */
const SEC=[
 {k:'own',n:'Руководителю',sub:[['dash','Пульт склада'],['anal','Залежалые и оборот'],['shops','Цеха: что выдано']]},
 {k:'inc',n:'Приход',sub:[['inc','Приход по этикетке'],['cont','Приход контейнера'],['labels','Этикетки 3 заводов'],['qr','Свой QR-ярлык']]},
 {k:'sk',n:'Склад',sub:[['map','Схема склада'],['stock','Остатки'],['card','Карточка рулона'],['move','Перемещения'],['inv','Инвентаризация']]},
 {k:'req',n:'Заявки из 1С',sub:[['req','Лента заявок'],['pick','Подбор и выдача'],['ret','Возврат остатка']]},
 {k:'mob',n:'Кладовщик · телефон',sub:[['mob','Экран кладовщика']]},
 {k:'c1',n:'Обмен с 1С',sub:[['sync','Обмен с 1С'],['log','Журнал действий']]},
 {k:'sys',n:'О системе',sub:[['rights','Роли и права'],['own2','Код и сервер'],['price','Стоимость']]}
];
const SECOF={},SUBN={},ALL=[];SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];ALL.push(x[0])}));
const ROLES={
 'Руководитель':{av:'РК',n:'Евгений',note:'всё: остатки в тоннах и деньгах, залежалые, цеха, обмен с 1С',s:ALL.slice()},
 'Начальник склада':{av:'НС',n:'Сергей',note:'приход, схема, заявки, инвентаризация, обмен с 1С; без цен закупа',s:['map','stock','card','inc','cont','labels','qr','req','pick','ret','move','inv','sync','log','shops','mob','rights']},
 'Кладовщик':{av:'КЛ',n:'Ерлан',note:'с телефона: сканер, приход, где лежит, выдача по заявке, возврат',s:['mob','inc','cont','qr','req','pick','ret','map','card','move','inv']}
};
let role='Руководитель',cur='dash';
const SC={};

SC.dash=()=>{const s=inStore(),slow=s.filter(x=>x.age>120);const done=REQ.filter(q=>q.st==='done').length;
 const byZ=['A','B','C'].map(z=>{const a=s.filter(x=>x.z===z);return `<tr><td><b>${ZN[z]}</b></td><td class="r">${a.length} / 40</td><td style="width:30%">${bar(a.length/40*100,1)}</td><td class="r mono">${f1(tons(a))} т</td><td class="r mono">${role==='Руководитель'?tg(money(a)):'—'}</td></tr>`});
 const byC=Object.keys(COL).map(c=>{const a=s.filter(x=>x.col===c);return a.length?`<tr><td>${sw(c)}${COL[c][0]}</td><td class="r">${a.length}</td><td class="r mono">${f1(tons(a))} т</td><td class="r">${a.filter(x=>x.age>120).length?`<span class="tag bad">${a.filter(x=>x.age>120).length} залежалых</span>`:'<span class="tag ok">ок</span>'}</td></tr>`:''});
 return said('Мне нужно, чтобы рулоны попадали в базу 1С не через бумагу, и чтобы кладовщик видел, откуда взять рулон и в какой цех везти.','Пульт склада: всё, что лежит, — в тоннах, деньгах и по местам. Продажи и заявки остаются в вашей 1С.')+
 kpi([['На складе',f1(tons(s))+' т',s.length+' рулонов'],['В деньгах',role==='Руководитель'?(f1(money(s)/1e6)+' млн'):'скрыто','по закупу'],['Заявок сегодня',REQ.length,done+' выдано'],['Заявка → выдача','24 мин','среднее за неделю'],['Залежалые >120 дн',slow.length,f1(tons(slow))+' т'],['Ошибки обмена',SYNC.filter(x=>x[3]==='err').length,'с 1С']])+
 `<div class="g21"><div class="box"><h3>Заполненность зон <small>40 мест в зоне: 4 ряда × 10</small></h3>${tbl(['Зона','>Мест','Заполнено','>Вес','>Стоимость'],byZ)}<div class="btns"><button class="bt s" onclick="go('map')">Открыть схему склада</button><button class="bt s o" onclick="go('stock')">Остатки</button></div></div>
 <div class="box"><h3>Сейчас в работе <small>из 1С</small></h3>${REQ.filter(q=>q.st==='new').map((q,i)=>`<div class="kv"><span><b class="mono">${q.n}</b> · ${q.from<0?esc(q.client):esc(SHOP[q.from].split(' ·')[0])}<br><small class="note">${sw(q.need.col)}${COL[q.need.col][0]} ${f2(q.need.t)}×${q.need.w} · ${f1(q.kg/1000)} т</small></span><button class="bt s y" onclick="openReq(${REQ.indexOf(q)})">Подобрать</button></div>`).join('')||'<p class="note">Новых заявок нет.</p>'}</div></div>
 <div class="box"><h3>Остатки по покрытиям</h3>${tbl(['Покрытие','>Рулонов','>Вес','>Статус'],byC)}</div>`};

SC.anal=()=>{const s=inStore();const bk=[[0,30,'до 30 дн'],[30,60,'30–60'],[60,120,'60–120'],[120,999,'больше 120']].map(b=>{const a=s.filter(x=>x.age>=b[0]&&x.age<b[1]);return `<tr><td>${b[2]}</td><td class="r">${a.length}</td><td class="r mono">${f1(tons(a))} т</td><td class="r mono">${tg(money(a))}</td><td style="width:28%">${bar(a.length/s.length*100,b[0]>=120)}</td></tr>`});
 const slow=s.filter(x=>x.age>120).sort((a,b)=>b.age-a.age).slice(0,10).map(x=>`<tr class="click" onclick="cardOf('${x.id}')"><td class="mono">${x.id}</td><td>${sw(x.col)}${esc(nm(x))}</td><td class="mono">${plc(x)}</td><td class="r">${x.age} дн</td><td class="r mono">${tg(x.kg/1000*x.price)}</td></tr>`);
 const mon=[['Июль',412,398],['Август',455,431],['Сентябрь',508,476],['Октябрь',534,520],['Ноябрь',489,462]];
 return kpi([['Оборот склада','34 дня','средний срок рулона'],['Залежалые',s.filter(x=>x.age>120).length+' рул.',tg(money(s.filter(x=>x.age>120)))],['Пришло за ноябрь','489 т','3 контейнера'],['Выдано за ноябрь','462 т','в цеха и клиентам'],['Остатки возвратов',s.filter(x=>x.z==='C').length,'частичные рулоны'],['Точность инвент.','99,2%','за 3 месяца']])+
 `<div class="g2"><div class="box"><h3>Сколько лежат рулоны</h3>${tbl(['Срок','>Рулонов','>Вес','>Деньги',''],bk)}<p class="note">Деньги, замороженные в залежалых рулонах, видно сразу — можно предложить их в цеха в первую очередь.</p></div>
 <div class="box"><h3>Приход и расход по месяцам, т</h3>${tbl(['Месяц','>Пришло','>Выдано','Баланс'],mon.map(x=>`<tr><td>${x[0]}</td><td class="r mono">${x[1]}</td><td class="r mono">${x[2]}</td><td style="width:35%">${bar(x[2]/x[1]*100)}</td></tr>`))}</div></div>
 <div class="box"><h3>Залежалые рулоны <small>старше 120 дней · подбор по FIFO выдаст их первыми</small></h3>${tbl(['Рулон','Вид','Место','>Лежит','>Стоимость'],slow)}</div>`};

SC.shops=()=>{const w=[[118,21,'профнастил С8, С21, НС35'],[96,17,'металлочерепица Монтеррей'],[54,12,'кассеты, отливы, планки'],[71,9,'сэндвич-панели 100–150 мм']];
 const out=R.filter(x=>x.st==='out').map(x=>`<tr><td class="mono">${x.id}</td><td>${sw(x.col)}${esc(nm(x))}</td><td>${x.to>=0?esc(SHOP[x.to]):'Клиенту рулоном'}</td><td class="r mono">${fmt(x.kg)} кг</td></tr>`);
 return said('У нас четыре цеха — до того, как рулон довезут до производства, у нас тёмный лес.','Теперь видно, какой рулон, когда и в какой цех ушёл, и сколько вернулось остатком.')+
 `<div class="g2">${SHOP.map((s,i)=>`<div class="box"><h3>${esc(s)} <small>за ноябрь</small></h3><div class="kv"><span>Получено металла</span><b class="mono">${w[i][0]} т</b></div><div class="kv"><span>Рулонов</span><b>${w[i][1]}</b></div><div class="kv"><span>Выпускает</span><b>${w[i][2]}</b></div><div class="kv"><span>Возврат остатков</span><b class="mono">${f1(w[i][0]*0.04)} т</b></div>${bar(w[i][0]/120*100,1)}</div>`).join('')}</div>
 <div class="box"><h3>Выдано сегодня</h3>${tbl(['Рулон','Вид','Куда','>Вес'],out)}<p class="note">Выдача фиксируется сканированием QR — «взял не тот рулон» исключено.</p></div>`};

/* приход */
const lblHtml=(i,f,hit)=>{const s=SUP[i];const H=k=>hit?' class="hit"':'';
 if(i===0)return `<div class="lbl"><div class="lh"><span>HUAXIN STEEL CO.</span><span>${s.city}</span></div><table><tr><td>Coil No.</td><td${H()}>${esc(f.lot||'HX-2611-0418')}</td></tr><tr><td>Grade</td><td${H()}>${esc(f.grade||'DX51D+Z')}</td></tr><tr><td>Color</td><td${H()}>RAL ${esc(f.col&&f.col!=='Z'?f.col:'3005')}</td></tr><tr><td>Thickness</td><td${H()}>${f2(f.t||0.45)} mm</td></tr><tr><td>Width</td><td${H()}>${f.w||1250} mm</td></tr><tr><td>Net weight</td><td${H()}>${fmt(f.kg||6140)} kg</td></tr><tr><td>Heat No.</td><td${H()}>${esc(f.heat||'H5120')}</td></tr></table><div class="bc"></div></div>`;
 if(i===1)return `<div class="lbl"><div class="lh"><span>荣城金属 RONGCHENG</span><span>${s.city}</span></div><div style="padding:8px;font-size:18px;font-weight:700"${H()}>${esc(f.lot||'RC-2611-5301')}</div><div style="padding:0 8px 8px;line-height:1.7"><span${H()}>热镀锌 HDG ${esc(f.grade||'DX51D+Z275')}</span><br><span${H()}>${f2(f.t||0.45)}×${f.w||1250} mm</span> · <span${H()}>净重 ${fmt(f.kg||7380)} kg</span><br>炉号 <span${H()}>${esc(f.heat||'H5157')}</span></div><div class="bc"></div></div>`;
 return `<div class="lbl"><div class="lh"><span>JINXIANG COATING</span><span>${s.city}</span></div><div class="qrm"></div><div style="padding:8px;line-height:1.8"><b${H()}>${esc(f.lot||'JX-2611-0777')}</b><br><span${H()}>PPGI RAL ${esc(f.col&&f.col!=='Z'?f.col:'8017')}</span><br><span${H()}>${f2(f.t||0.5)}/${f.w||1250}</span> · <span${H()}>${fmt(f.kg||5520)}KG</span></div><div style="clear:both"></div></div>`};
SC.inc=()=>{const f=INC.f;const st=[INC.scanned,INC.qr,INC.saved];
 const fld=(k,l,v,o)=>`<div class="fld hit"><span>${l}</span><input class="inp" value="${esc(v)}" onchange="setF('${k}',this.value)" ${o||''}></div>`;
 return said('Сканер какой-то, QR-код какой-то нужно присваивать каждому рулону. У нас три поставщика, у всех свои этикетки.','Кладовщик наводит камеру телефона на этикетку — поля заполняются сами. Затем печатает свой QR и ставит рулон на подсказанное место.')+
 `<div class="steps"><div class="${st[0]?'dn':'on'}">1 · Скан этикетки завода</div><div class="${st[1]?'dn':st[0]?'on':''}">2 · Свой QR-ярлык</div><div class="${st[2]?'dn':st[1]?'on':''}">3 · Место и проведение</div><div class="${st[2]?'dn':''}">4 · Отправлено в 1С</div></div>
 <div class="box"><h3>Завод-поставщик <small>формат этикетки выбирается автоматически по первому скану</small></h3><div class="btns" style="margin-top:0">${SUP.map((s,i)=>`<button class="bt s ${INC.sup===i?'y':'o'}" onclick="setSup(${i})">${esc(s.n)}</button>`).join('')}</div></div>
 <div class="g2"><div class="box"><h3>Камера телефона</h3><div class="cam"><div class="frame"></div>${lblHtml(INC.sup,f,INC.scanned)}<small>${INC.scanned?'✓ распознано 7 полей':'наведите на этикетку…'}</small></div><div class="btns"><button class="bt y" onclick="scanLbl()">Сканировать этикетку</button></div></div>
 <div class="box"><h3>Распознанные поля <small>${INC.scanned?'проверьте подсвеченные':'появятся после скана'}</small></h3>${INC.scanned?fld('lot','№ рулона / партии',f.lot)+fld('grade','Марка стали',f.grade)+`<div class="fld hit"><span>Покрытие</span><select class="inp" onchange="setF('col',this.value)">${Object.keys(COL).map(c=>`<option value="${c}" ${f.col===c?'selected':''}>${COL[c][0]}</option>`).join('')}</select></div>`+fld('t','Толщина, мм',f2(f.t))+fld('w','Ширина, мм',f.w)+fld('kg','Вес нетто, кг',f.kg)+fld('heat','№ плавки',f.heat)+`<div class="kv"><span>Длина (расчёт)</span><b>≈ ${fmt(f.kg/(f.t*f.w/1000*7.85))} м</b></div>`:'<p class="note">Нажмите «Сканировать этикетку» — в демо камера читает образец этикетки выбранного завода.</p><p class="note">Если этикетка повреждена — поля вводятся вручную, а номер рулона берётся из упаковочного листа.</p>'}</div></div>
 <div class="g2"><div class="box"><h3>Свой QR-ярлык</h3>${INC.scanned?`<div class="lbl" style="max-width:300px"><div class="lh"><span>СТАЛЬКОИЛ</span><span>${INC.saved?esc(INC.newId):'R-'+(2600+R.length+1)}</span></div><div class="qrm"></div><div style="padding:8px;line-height:1.7">${esc(f.grade)}<br>${COL[f.col][0]}<br>${f2(f.t)}×${f.w} · ${fmt(f.kg)} кг</div><div style="clear:both"></div></div>`:'<p class="note">Ярлык формируется после скана.</p>'}<div class="btns"><button class="bt ${INC.qr?'o':''}" onclick="printQR()">${INC.qr?'✓ Напечатан':'Печать QR-ярлыка'}</button></div></div>
 <div class="box"><h3>Место хранения <small>подсказка по покрытию, ширине и весу</small></h3>${INC.place?`<div class="kv"><span>Предложено</span><b class="mono" style="font-size:20px">${INC.place.z}-${INC.place.r}-${String(INC.place.p).padStart(2,'0')}</b></div><div class="kv"><span>Зона</span><b>${ZN[INC.place.z]}</b></div><div class="kv"><span>Почему</span><b>ближайшее свободное место в зоне покрытия</b></div>`:'<p class="note">Место появится после скана.</p>'}
 <div class="btns"><button class="bt o s" onclick="otherPlace()">Другое место</button><button class="bt y" onclick="postInc()">${INC.saved?'✓ Проведено · в 1С':'Провести приход → 1С'}</button></div>${INC.saved?`<p class="note">Рулон ${esc(INC.newId)} появился в остатках, на схеме склада и в 1С. <a onclick="cardOf('${INC.newId}')" style="cursor:pointer;text-decoration:underline">Открыть карточку</a></p>`:''}</div></div>`};

SC.cont=()=>{const got=CONT.filter(x=>x.got),miss=CONT.filter(x=>x.miss),diff=CONT.filter(x=>x.fact&&x.got);
 return `<div class="box"><h3>Контейнер TGHU 482190-3 <small>Жунчэн Металл · инвойс RC-INV-2611-07 · упаковочный лист загружен</small></h3>`+
 kpi([['По листу',CONT.length+' рул.',fmt(CONT.reduce((a,x)=>a+x.kg,0))+' кг'],['Отсканировано',got.length,'из '+CONT.length],['Нет в контейнере',miss.length,'отметка кладовщика'],['Расхождение веса',diff.length?'−120 кг':'0','по весам'],['Статус',contDone?'принят':'приёмка',''],['Время приёмки','38 мин','вместо 3 ч на бумаге']])+
 tbl(['№ рулона по листу','>Вес по листу','>Вес факт','Статус',''],CONT.map((x,i)=>`<tr class="${x.miss?'hl':''}"><td class="mono">${x.no}</td><td class="r mono">${fmt(x.kg)}</td><td class="r mono">${x.got?fmt(x.fact||x.kg):'—'}</td><td>${x.miss?'<span class="tag bad">нет в контейнере</span>':x.got?(x.fact?'<span class="tag y">недовес 120 кг</span>':'<span class="tag ok">принят</span>'):'<span class="tag">ждёт скана</span>'}</td><td>${contDone?'':`<button class="bt s o" onclick="markMiss(${i})">${x.miss?'Вернуть':'Нет в контейнере'}</button>`}</td></tr>`))+
 `<div class="btns"><button class="bt y" onclick="scanNext()">Сканировать следующий</button><button class="bt" onclick="postCont()">${contDone?'✓ Принят · в 1С':'Принять контейнер → 1С'}</button></div><p class="note">При проведении создаётся акт расхождений для поставщика: недовес и недостающие рулоны с номерами — для претензии.</p></div>`};

SC.labels=()=>said('У нас три поставщика, три завода, и у всех разные этикетки.','Под каждый завод настраиваем свой шаблон распознавания. Новый завод — новый шаблон, без программиста 1С.')+
 `<div class="g3">${SUP.map((s,i)=>`<div class="box"><h3>${esc(s.n)} <small>${s.city}</small></h3>${lblHtml(i,{},true)}<p class="note">${esc(s.fmt)}</p><div class="kv"><span>Поля, которые читаем</span><b>7</b></div><div class="kv"><span>Точность на тесте</span><b>${[98,96,99][i]}%</b></div></div>`).join('')}</div>
 <div class="box"><h3>Как устроено распознавание</h3><div class="kv"><span>1. Камера телефона или ТСД</span><b>фото этикетки</b></div><div class="kv"><span>2. Определяем завод</span><b>по логотипу и структуре</b></div><div class="kv"><span>3. Читаем поля</span><b>штрихкод / QR / текст</b></div><div class="kv"><span>4. Сверяем со справочником 1С</span><b>марка, покрытие, размер</b></div><div class="kv"><span>5. Сомнительное поле</span><b>подсвечиваем кладовщику</b></div><p class="note">Если у завода есть QR или штрихкод с данными — читаем его, это надёжнее текста. Фото этикетки сохраняется в карточке рулона.</p></div>`;

SC.qr=()=>{const x=byId(CARD)||R[0];return `<div class="g2"><div class="box"><h3>Ярлык СтальКоил <small>100×70 мм, термопринтер</small></h3><div class="lbl" style="max-width:320px"><div class="lh"><span>СТАЛЬКОИЛ</span><span>${esc(x.id)}</span></div><div class="qrm"></div><div style="padding:8px;line-height:1.7">${esc(x.grade)}<br>${COL[x.col][0]}<br>${f2(x.t)}×${x.w} мм · ${fmt(x.kg)} кг<br>Место ${plc(x)}</div><div style="clear:both"></div></div><div class="btns"><button class="bt" onclick="toast('Ярлык ${esc(x.id)} отправлен на печать повторно.')">Перепечатать</button><button class="bt o" onclick="go('stock')">Выбрать другой рулон</button></div></div>
 <div class="box"><h3>Зачем свой QR, если есть этикетка завода</h3><div class="kv"><span>Одинаковый формат</span><b>для всех 3 заводов</b></div><div class="kv"><span>Читается издалека</span><b>с погрузчика, 1–2 м</b></div><div class="kv"><span>Остаток после цеха</span><b>получает свой ярлык</b></div><div class="kv"><span>Внутри QR</span><b>только номер R-…</b></div><div class="kv"><span>Всё остальное</span><b>подтягивается из базы</b></div><p class="note">Ярлык клеится на торец и на упаковку. Принтер этикеток — любой с поддержкой ZPL; ориентир 120–250 тыс. ₸.</p></div></div>`};

/* склад */
SC.map=()=>{const s=inStore();const q=MAPF;
 const match=x=>(!q.col||x.col===q.col)&&(!q.t||Math.abs(x.t-parseFloat(q.t))<.001);
 const zone=z=>`<div class="zone"><h4><span>${ZN[z]}</span><small>${s.filter(x=>x.z===z).length}/40</small></h4>${[1,2,3,4].map(r=>`<div class="row"><span>${z}-${r}</span>${[1,2,3,4,5,6,7,8,9,10].map(p=>{const x=s.find(y=>y.z===z&&y.r===r&&y.p===p);if(!x)return `<div class="cell" title="свободно" onclick="cellClick('${z}',${r},${p})"></div>`;const dim=(q.col||q.t)&&!match(x);return `<div class="cell f ${HL===x.id?'hl':''} ${dim?'dim':''}" style="background:${COL[x.col][1]};color:${['9003','Z'].includes(x.col)?'#333':'#fff'}" title="${x.id}" onclick="cellClick('${z}',${r},${p})">${x.st==='res'?'Р':x.age>120?'!':''}</div>`}).join('')}</div>`).join('')}</div>`;
 return said('Мы должны понимать, в какой зоне этот рулон находится.','Каждое место — Зона-Ряд-Место. Цвет клетки — покрытие, «!» — лежит больше 120 дней, «Р» — в резерве под заявку.')+
 `<div class="box"><div class="g3"><input class="inp" placeholder="Номер рулона или партии: R-2644" value="${esc(q.q)}" onchange="findRoll(this.value)"><select class="inp" onchange="setMF('col',this.value)"><option value="">Все покрытия</option>${Object.keys(COL).map(c=>`<option value="${c}" ${q.col===c?'selected':''}>${COL[c][0]}</option>`).join('')}</select><select class="inp" onchange="setMF('t',this.value)"><option value="">Любая толщина</option>${[0.4,0.45,0.5,0.55,0.6,0.7].map(t=>`<option value="${t}" ${String(q.t)===String(t)?'selected':''}>${f2(t)} мм</option>`).join('')}</select></div><div class="btns"><button class="bt s o" onclick="findRoll('R-2644')">Найти R-2644</button><button class="bt s o" onclick="MAPF={col:'',t:'',q:''};HL=null;build()">Сбросить</button></div></div>
 <div class="leg">${Object.keys(COL).map(c=>`<span>${sw(c)}${COL[c][0]}</span>`).join('')}<span><b>!</b> залежалый</span><span><b>Р</b> резерв</span></div>
 <div class="zones">${['A','B','C'].map(zone).join('')}</div><p class="note">Нажмите на клетку — откроется рулон или «место свободно». Схема строится по вашему реальному складу: зоны, ряды, ярусы.</p>`};

let STF={col:'',z:''};
SC.stock=()=>{const s=inStore().filter(x=>(!STF.col||x.col===STF.col)&&(!STF.z||x.z===STF.z));
 const grp={};s.forEach(x=>{const k=x.grade+'|'+x.col+'|'+x.t+'|'+x.w;(grp[k]=grp[k]||[]).push(x)});
 const rows=Object.values(grp).sort((a,b)=>tons(b)-tons(a)).map(a=>{const x=a[0];return `<tr><td>${sw(x.col)}${esc(x.grade)} · ${COL[x.col][0]}</td><td class="mono">${f2(x.t)}×${x.w}</td><td class="r">${a.length}</td><td class="r mono">${f1(tons(a))} т</td><td class="r mono">≈ ${fmt(a.reduce((s,y)=>s+m(y),0))} м</td><td class="r mono">${role==='Руководитель'?tg(money(a)):'—'}</td><td>${a.slice(0,3).map(y=>`<a class="mono" style="cursor:pointer;text-decoration:underline;margin-right:6px" onclick="cardOf('${y.id}')">${y.id}</a>`).join('')}${a.length>3?'…':''}</td></tr>`});
 return kpi([['Позиций',Object.keys(grp).length,'вид × толщина × ширина'],['Рулонов',s.length,''],['Вес',f1(tons(s))+' т',''],['Длина',fmt(s.reduce((a,x)=>a+m(x),0)/1000)+' км','расчётная'],['В резерве',s.filter(x=>x.st==='res').length,'под заявки'],['Стоимость',role==='Руководитель'?f1(money(s)/1e6)+' млн':'скрыто','по закупу']])+
 `<div class="box"><h3>Остатки <small>сгруппировано по виду рулона</small></h3><div class="g2" style="margin-bottom:10px"><select class="inp" onchange="STF.col=this.value;build()"><option value="">Все покрытия</option>${Object.keys(COL).map(c=>`<option value="${c}" ${STF.col===c?'selected':''}>${COL[c][0]}</option>`).join('')}</select><select class="inp" onchange="STF.z=this.value;build()"><option value="">Все зоны</option>${Object.keys(ZN).map(z=>`<option value="${z}" ${STF.z===z?'selected':''}>${ZN[z]}</option>`).join('')}</select></div>${tbl(['Вид','Размер','>Рулонов','>Вес','>Длина','>Стоимость','Рулоны'],rows)}<p class="note">Остатки совпадают с 1С: каждое движение здесь сразу уходит документом в 1С.</p></div>`};

SC.card=()=>{const x=byId(CARD)||R[0];const s=SUP.find(y=>y.k===x.sup);
 return `<div class="g21"><div class="box"><h3>${esc(x.id)} <small>${x.st==='out'?'выдан':x.st==='res'?'в резерве':'на складе'}</small></h3><div class="kv"><span>Вид</span><b>${sw(x.col)}${esc(nm(x))}</b></div><div class="kv"><span>Завод</span><b>${esc(s.n)} · ${s.city}</b></div><div class="kv"><span>Партия / плавка</span><b class="mono">${esc(x.lot)}</b></div><div class="kv"><span>Вес нетто</span><b class="mono">${fmt(x.kg)} кг</b></div><div class="kv"><span>Длина (расчёт)</span><b class="mono">≈ ${fmt(m(x))} м</b></div><div class="kv"><span>Место</span><b class="mono">${x.st==='out'?'—':plc(x)}</b></div><div class="kv"><span>На складе</span><b>${x.age} дн.${x.age>120?' <span class="tag bad">залежалый</span>':''}</b></div>${role==='Руководитель'?`<div class="kv"><span>Стоимость</span><b class="mono">${tg(x.kg/1000*x.price)}</b></div>`:''}
 <div class="btns"><button class="bt s" onclick="go('qr')">QR-ярлык</button><button class="bt s o" onclick="MV.id='${x.id}';go('move')">Переместить</button><button class="bt s o" onclick="HL='${x.id}';go('map')">Показать на схеме</button></div></div>
 <div class="box"><h3>Фото этикетки завода</h3>${lblHtml(SUP.indexOf(s),{lot:x.lot,grade:x.grade,col:x.col,t:x.t,w:x.w,kg:x.kg},false)}<p class="note">Снято при приходе, хранится в карточке — для претензий заводу.</p></div></div>
 <div class="box"><h3>История рулона</h3>${tbl(['Дата','Событие','Подробности','Место'],x.hist.slice().reverse().map(h=>`<tr><td class="mono">${h[0]}</td><td><b>${esc(h[1])}</b></td><td>${esc(h[2])}</td><td class="mono">${esc(h[3])}</td></tr>`))}<div class="btns">${['R-2601','R-2644','R-2617'].map(id=>`<button class="bt s o" onclick="cardOf('${id}')">${id}</button>`).join('')}</div></div>`};

SC.move=()=>{const opts=inStore().filter(x=>x.st==='store').slice(0,40);
 return `<div class="g2"><div class="box"><h3>Перемещение рулона <small>сканируйте QR или выберите</small></h3><div class="fld"><span>Рулон</span><select class="inp" onchange="setMv('id',this.value)">${opts.map(x=>`<option value="${x.id}" ${MV.id===x.id?'selected':''}>${x.id} · ${plc(x)} · ${COL[x.col][0]}</option>`).join('')}</select></div><div class="fld"><span>Новое место</span><input class="inp" value="${esc(MV.to)}" onchange="setMv('to',this.value.toUpperCase())"></div><div class="btns"><button class="bt s o" onclick="setMv('to','C-4-09')">Свободное в C</button><button class="bt y" onclick="postMv()">${MV.done?'✓ Перемещено':'Переместить'}</button></div><p class="note">Перемещение внутри склада в 1С не передаётся — меняется только адрес. Это ваше решение: можно передавать.</p></div>
 <div class="box"><h3>Последние перемещения</h3>${tbl(['Время','Кто','Что'],LOG.filter(l=>l[2]==='Перемещение').map(l=>`<tr><td class="mono">${l[0]}</td><td>${esc(l[1])}</td><td>${esc(l[3])}</td></tr>`))}<p class="note">Каждое перемещение остаётся в истории рулона и в журнале — видно, кто и когда переставил.</p></div></div>`};

SC.inv=()=>{const l=invList();const ok=l.filter(x=>INV.scanned[x.id]==='ok').length,ms=l.filter(x=>INV.scanned[x.id]==='miss').length;
 return said('','Инвентаризация сканером по ряду: кладовщик идёт вдоль ряда и сканирует QR. Система сама говорит, что не найдено и что лишнее.')+
 `<div class="box"><div class="g3"><select class="inp" onchange="setInv('zone',this.value)">${Object.keys(ZN).map(z=>`<option value="${z}" ${INV.zone===z?'selected':''}>${ZN[z]}</option>`).join('')}</select><select class="inp" onchange="setInv('row',this.value)">${[1,2,3,4].map(r=>`<option value="${r}" ${INV.row===r?'selected':''}>Ряд ${r}</option>`).join('')}</select><div></div></div>`+
 kpi([['По базе',l.length,'рулонов в ряду'],['Найдено',ok,''],['Не найдено',ms,''],['Лишние',INV.extra?1:0,''],['Осталось',l.length-ok-ms,''],['Статус',INV.done?'проведена':'идёт','']])+
 tbl(['Рулон','Место','Вид','Статус',''],l.map(x=>`<tr class="${INV.scanned[x.id]==='miss'?'hl':''}"><td class="mono">${x.id}</td><td class="mono">${plc(x)}</td><td>${sw(x.col)}${COL[x.col][0]} ${f2(x.t)}</td><td>${INV.scanned[x.id]==='ok'?'<span class="tag ok">найден</span>':INV.scanned[x.id]==='miss'?'<span class="tag bad">не найден</span>':'<span class="tag">ждёт</span>'}</td><td>${INV.done?'':`<button class="bt s o" onclick="invMiss('${x.id}')">Не найден</button>`}</td></tr>`).concat(INV.extra?[`<tr class="hl"><td class="mono">R-2588</td><td class="mono">—</td><td>лишний: по базе в зоне C</td><td><span class="tag y">лишний</span></td><td></td></tr>`]:[]))+
 `<div class="btns"><button class="bt y" onclick="invScan()">Сканировать</button><button class="bt o" onclick="invAll()">Сканировать ряд целиком</button><button class="bt o" onclick="invExtra()">Найден лишний</button><button class="bt" onclick="postInv()">${INV.done?'✓ Проведено':'Провести → 1С'}</button></div></div>`};

/* заявки */
SC.req=()=>`${said('Как только поступает заявка, хотелось бы, чтобы складские работники понимали, какой именно рулон нужно отдать на производство.','Заявка создаётся в 1С как сейчас — и через секунду появляется у кладовщика с готовым подбором рулона.')}
 <div class="box"><h3>Пришло из 1С <small>заявки цехов и отгрузки клиентам рулоном</small></h3>${tbl(['Время','Документ 1С','Откуда','Что нужно','>Вес','Статус',''],REQ.map((q,i)=>`<tr class="${q.st==='new'?'hl':''}"><td class="mono">${q.when}</td><td class="mono"><b>${q.n}</b></td><td>${q.from<0?'Клиент · '+esc(q.client):esc(SHOP[q.from])}<br><small class="note">${esc(q.who)}</small></td><td>${sw(q.need.col)}${COL[q.need.col][0]} ${f2(q.need.t)}×${q.need.w}</td><td class="r mono">${fmt(q.kg)} кг</td><td>${q.st==='done'?`<span class="tag ok">выдан ${esc(q.roll)} · ${q.sh}</span>`:'<span class="tag y">новая</span>'}</td><td>${q.st==='new'?`<button class="bt s y" onclick="openReq(${i})">Подобрать</button>`:''}</td></tr>`))}
 <div class="btns"><button class="bt o" onclick="newReq()">Смоделировать заявку из 1С</button></div><p class="note">Заявки мы не создаём заново — читаем их из вашей 1С. Статус «выдан» и номер рулона возвращаются в 1С.</p></div>`;

SC.pick=()=>{const q=REQ[cReq];const c=cands(q);if(!cPick&&q.st==='new'&&c[0])cPick=c[0].id;const x=cPick?byId(cPick):null;
 return `<div class="steps"><div class="dn">1 · Заявка из 1С</div><div class="${cPick?'dn':'on'}">2 · Подбор рулона</div><div class="${scanOk?'dn':cPick?'on':''}">3 · Скан QR при взятии</div><div class="${q.st==='done'?'dn':scanOk?'on':''}">4 · Выдача → 1С</div></div>
 <div class="box"><h3>${esc(q.n)} · ${q.from<0?'отгрузка клиенту '+esc(q.client):esc(SHOP[q.from])} <small>${esc(q.who)} · ${q.when}</small></h3><div class="kv"><span>Нужно</span><b>${sw(q.need.col)}${COL[q.need.col][0]} · ${f2(q.need.t)}×${q.need.w} мм · ${fmt(q.kg)} кг</b></div><div class="kv"><span>Правило подбора</span><b>сначала самый старый (FIFO), вес ≥ заявки</b></div>
 <div class="btns">${REQ.map((r,i)=>`<button class="bt s ${i===cReq?'y':'o'}" onclick="openReq(${i})">${r.n}</button>`).join('')}</div></div>
 <div class="g21"><div class="box"><h3>Подходящие рулоны <small>${c.length} на складе</small></h3>${tbl(['','Рулон','Место','>Вес','>Лежит',''],c.map((y,i)=>`<tr class="${y.id===cPick?'hl':''}"><td>${i===0?'<span class="tag y">FIFO</span>':''}</td><td class="mono">${y.id}</td><td class="mono"><b>${plc(y)}</b></td><td class="r mono">${fmt(y.kg)}</td><td class="r">${y.age} дн</td><td>${q.st==='done'?'':`<button class="bt s o" onclick="choose('${y.id}')">Выбрать</button>`}</td></tr>`))}${c.length?'':'<p class="note">Подходящих рулонов нет — система вернёт в 1С отметку «дефицит» и подскажет ближайшую замену.</p>'}</div>
 <div class="box"><h3>Взять рулон</h3>${x?`<div class="kv"><span>Рулон</span><b class="mono">${x.id}</b></div><div class="kv"><span>Где лежит</span><b class="mono" style="font-size:22px">${plc(x)}</b></div><div class="kv"><span>Зона</span><b>${ZN[x.z]}</b></div><div class="kv"><span>Куда везти</span><b>${q.from<0?'на отгрузку · ворота 2':esc(SHOP[q.from])}</b></div><div class="kv"><span>Проверка</span><b>${scanOk?'<span class="tag ok">QR совпал</span>':'<span class="tag">ждёт скана</span>'}</b></div>`:'<p class="note">Нет рулона для выдачи.</p>'}
 <div class="btns"><button class="bt y" onclick="scanTake()">Скан QR</button><button class="bt o s" onclick="scanTake(true)">Скан не того рулона</button><button class="bt" onclick="issue()">${q.st==='done'?'✓ Выдано':'Выдать → 1С'}</button></div></div></div>`};

SC.ret=()=>{const o=outs();if(!RET.id&&o.length)RET.id=o[0].id;const x=byId(RET.id);
 return said('','Цех использовал рулон частично — остаток взвешивают, клеят новый QR, и он возвращается на склад отдельным рулоном. Расход цеха считается сам.')+
 `<div class="g2"><div class="box"><h3>Возврат остатка из цеха</h3>${o.length?`<div class="fld"><span>Рулон в цехе</span><select class="inp" onchange="setRet(this.value)">${o.map(y=>`<option value="${y.id}" ${RET.id===y.id?'selected':''}>${y.id} · ${esc(SHOP[y.to].split(' ·')[0])} · ${fmt(y.kg)} кг</option>`).join('')}</select></div><div class="fld"><span>Вес остатка, кг</span><input class="inp" value="${RET.kg}" onchange="setRetKg(this.value)"></div>${x?`<div class="kv"><span>Выдано в цех</span><b class="mono">${fmt(x.kg)} кг</b></div><div class="kv"><span>Израсходовано</span><b class="mono">${fmt(Math.max(0,x.kg-RET.kg))} кг</b></div><div class="kv"><span>Остаток ≈ длина</span><b class="mono">${fmt(RET.kg/(x.t*x.w/1000*7.85))} м</b></div>`:''}<div class="btns"><button class="bt y" onclick="postRet()">${RET.done?'✓ Принят · '+esc(RET.newId):'Принять остаток → 1С'}</button></div>`:'<p class="note">Сейчас в цехах нет выданных рулонов. Выдайте рулон по заявке — и он появится здесь.</p><div class="btns"><button class="bt s" onclick="go(\'req\')">К заявкам</button></div>'}</div>
 <div class="box"><h3>Остатки на складе <small>зона C</small></h3>${tbl(['Рулон','Вид','>Вес','Место'],inStore().filter(y=>y.z==='C').slice(0,10).map(y=>`<tr class="click" onclick="cardOf('${y.id}')"><td class="mono">${y.id}</td><td>${sw(y.col)}${COL[y.col][0]} ${f2(y.t)}</td><td class="r mono">${fmt(y.kg)}</td><td class="mono">${plc(y)}</td></tr>`))}<p class="note">Остатки подбор предлагает первыми для небольших заявок — меньше обрезков.</p></div></div>`};

/* телефон */
SC.mob=()=>{const nw=REQ.filter(q=>q.st==='new');
 return `<div class="g2"><div><div class="phone"><div class="ph">09:41 · Ерлан · кладовщик</div>${nw.length?`<div class="task"><b>${esc(nw[0].n)} · ${nw[0].from<0?'клиенту':esc(SHOP[nw[0].from].split(' ·')[0])}</b>${COL[nw[0].need.col][0]} ${f2(nw[0].need.t)}×${nw[0].need.w} · ${fmt(nw[0].kg)} кг<br>Возьмите: <b style="display:inline;font-size:13px">${cands(nw[0])[0]?cands(nw[0])[0].id+' · '+plc(cands(nw[0])[0]):'нет на складе'}</b></div>`:'<div class="task"><b>Новых заявок нет</b>Можно заняться инвентаризацией</div>'}
 <button class="big y" onclick="${nw.length?`openReq(${REQ.indexOf(nw[0])})`:`go('req')`}">Выдать по заявке<small>${nw.length} новых из 1С</small></button>
 <button class="big" onclick="go('inc')">Приход рулона<small>скан этикетки завода → QR → место</small></button>
 <button class="big" onclick="go('cont')">Приход контейнера<small>сверка с упаковочным листом</small></button>
 <button class="big" onclick="go('map')">Где лежит рулон<small>поиск по номеру или скану</small></button>
 <button class="big" onclick="go('ret')">↩ Возврат остатка из цеха<small>взвесить, новый QR</small></button>
 <button class="big" onclick="go('inv')">✓ Инвентаризация ряда<small>скан вдоль ряда</small></button></div></div>
 <div class="box"><h3>Кладовщику — только телефон</h3><div class="kv"><span>Устройство</span><b>свой смартфон или ТСД</b></div><div class="kv"><span>Вход</span><b>логин и пароль</b></div><div class="kv"><span>Без интернета</span><b>скан сохраняется и уходит, когда связь вернётся</b></div><div class="kv"><span>Крупные кнопки</span><b>работа в перчатках</b></div><div class="kv"><span>Уведомление о заявке</span><b>на телефон сразу из 1С</b></div><p class="note">Начальник склада и руководитель работают с компьютера: схема, остатки, отчёты, обмен с 1С.</p></div></div>`};

/* 1С */
SC.sync=()=>{const err=SYNC.filter(x=>x[3]==='err').length;
 return said('Чтобы это садилось сразу в 1С.','Двусторонний обмен: туда — приходы, выдачи, возвраты, инвентаризация; оттуда — заявки, номенклатура, контрагенты. Ваша конфигурация 1С остаётся как есть.')+
 kpi([['Статус','онлайн','обмен каждые 30 с'],['Сегодня передано',SYNC.filter(x=>x[1]==='→ 1С').length,'документов'],['Получено',SYNC.filter(x=>x[1]==='← 1С').length,'заявок'],['Ошибки',err,err?'нужно действие':'нет'],['Последний обмен',SYNC[0][0],''],['Способ','HTTP-сервис','в вашей 1С']])+
 `<div class="box"><h3>Обмен с 1С</h3>${tbl(['Время','Направление','Документ','Статус',''],SYNC.map((s,i)=>`<tr class="${s[3]==='err'?'hl':''}"><td class="mono">${s[0]}</td><td><span class="tag ${s[1]==='→ 1С'?'b':''}">${s[1]}</span></td><td>${esc(s[2])}${s[4]?`<br><small class="note">${esc(s[4])}</small>`:''}</td><td>${s[3]==='ok'?'<span class="tag ok">ок</span>':'<span class="tag bad">ошибка</span>'}</td><td>${s[3]==='err'?`<button class="bt s y" onclick="retry(${i})">Создать в 1С и повторить</button>`:''}</td></tr>`))}</div>
 <div class="box"><h3>Что и куда</h3><div class="g2"><div><div class="kv"><span>→ 1С</span><b>Поступление (приход рулона, контейнера)</b></div><div class="kv"><span>→ 1С</span><b>Перемещение в цех / реализация</b></div><div class="kv"><span>→ 1С</span><b>Возврат остатка, акт расхождений</b></div><div class="kv"><span>→ 1С</span><b>Инвентаризация</b></div></div><div><div class="kv"><span>← 1С</span><b>Заявки цехов и клиентов</b></div><div class="kv"><span>← 1С</span><b>Номенклатура рулонов</b></div><div class="kv"><span>← 1С</span><b>Поставщики, контрагенты</b></div><div class="kv"><span>← 1С</span><b>Отмена / изменение заявки</b></div></div></div><p class="note">Точки обмена согласуем с вашим программистом 1С: HTTP-сервис или OData. Мы не переписываем вашу конфигурацию.</p></div>`};

SC.log=()=>`<div class="box"><h3>Журнал действий <small>кто, когда, что</small></h3>${tbl(['Время','Кто','Действие','Подробности'],LOG.map(l=>`<tr><td class="mono">${l[0]}</td><td>${esc(l[1])}</td><td><b>${esc(l[2])}</b></td><td>${esc(l[3])}</td></tr>`))}<div class="g3" style="margin-top:12px"><div class="kv"><span>Записей за ноябрь</span><b>1 284</b></div><div class="kv"><span>Приходов</span><b>212</b></div><div class="kv"><span>Выдач в цеха</span><b>187</b></div></div><p class="note">Журнал нельзя изменить задним числом. По любому рулону видна вся цепочка: приход → место → перемещения → выдача → возврат остатка.</p><div class="btns"><button class="bt s o" onclick="toast('Журнал выгружен в Excel за ноябрь.')">Выгрузить в Excel</button></div></div>`;

/* о системе */
SC.rights=()=>`<div class="box"><h3>Роли и права</h3>${tbl(['Роль','Что делает','Чего не видит'],[
 ['Руководитель','Пульт, остатки в деньгах, залежалые, цеха, обмен с 1С, журнал','—'],
 ['Начальник склада','Приход, схема, заявки, инвентаризация, перемещения, ошибки обмена','цены закупа и стоимость'],
 ['Кладовщик','С телефона: скан, приход, выдача по заявке, возврат, инвентаризация','деньги, отчёты, настройки'],
 ['Мастер цеха (опция)','Видит, что едет в его цех, подтверждает получение','склад целиком']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`))}<p class="note">Роли переключаются слева внизу — попробуйте «Кладовщик»: останутся только его экраны.</p></div>`;
SC.own2=()=>`<div class="g2"><div class="box"><h3>Код и сервер — ваши</h3><div class="kv"><span>Сервер</span><b>ваш, рядом с 1С или облако в РК</b></div><div class="kv"><span>Исходный код</span><b>передаём полностью</b></div><div class="kv"><span>Абонплата</span><b>0 ₸</b></div><div class="kv"><span>Пользователи</span><b>без ограничений</b></div><div class="kv"><span>Резервные копии</span><b>ежедневно</b></div></div>
 <div class="box"><h3>Что не трогаем</h3><div class="kv"><span>Ваша 1С</span><b>работает как работала</b></div><div class="kv"><span>Заявки и реализация</span><b>остаются в 1С</b></div><div class="kv"><span>Ваш программист 1С</span><b>делает точки обмена вместе с нами</b></div><div class="kv"><span>Номенклатура и цены</span><b>ведутся в 1С</b></div><p class="note">Мы добавляем к 1С то, чего в ней нет: адресный склад, скан этикеток, QR и телефон кладовщика.</p></div></div>`;
SC.price=()=>`<div class="box"><h3>Стоимость <small>по встрече 26.11</small></h3><div class="kv"><span>Стандартный пакет: склад рулонов + интеграция с 1С в обе стороны</span><b class="mono">2 500 000 ₸</b></div><div class="kv"><span>Срок</span><b>6–8 недель, 5–10 версий с вашими правками</b></div><div class="kv"><span>Оплата</span><b class="mono">750 000 / 1 000 000 / 750 000</b></div><div class="kv"><span>Абонплата</span><b>нет</b></div><div class="kv"><span>Поддержка</span><b>3 месяца включено, далее 20 $/час</b></div><div class="kv"><span>Оборудование</span><b>смартфоны или ТСД, принтер этикеток — по вашему выбору</b></div><div class="kv"><span>Что входит</span><b>приход по этикеткам 3 заводов, свои QR, адресное хранение, заявки из 1С, выдача в 4 цеха, возвраты, инвентаризация, отчёты</b></div><p class="note">Точную цену подтвердим после встречи 27.11 и вашего ТЗ.</p></div>`;

/* ---------- каркас ---------- */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${v.av}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');document.getElementById('rsel').innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function goSec(k){const S=SEC.find(x=>x.k===k);const f=S.sub.find(x=>allowed(x[0]));if(f)go(f[0])}
function build(){if(!allowed(cur))cur=ROLES[role].s[0];
 const vis=SEC.filter(s=>s.sub.some(x=>allowed(x[0])));
 document.getElementById('rail').innerHTML=vis.map((s,i)=>`<div class="ri ${s.k===SECOF[cur]?'on':''}" onclick="goSec('${s.k}')"><span>${String(i+1).padStart(2,'0')}</span>${s.n}</div>`).join('');
 const S=SEC.find(s=>s.k===SECOF[cur]);
 document.getElementById('tabs').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')+`<div class="me"><span>${esc(ROLES[role].n)} · ${esc(role)}</span><b>${ROLES[role].av}</b></div>`;
 document.getElementById('ttl').textContent=SUBN[cur];document.getElementById('content').innerHTML=SC[cur]();
 const e=SYNC.filter(x=>x[3]==='err').length;document.getElementById('syncst').textContent='обмен с 1С: '+(e?e+' ошибка':'онлайн');
 try{history.replaceState(null,'','?s='+cur+location.search.replace(/^\?/,'&').replace(/&s=[^&]*/,''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль.');return}cur=k;build();window.scrollTo(0,0)}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(x){const t=document.getElementById('toast');t.innerHTML=x;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6000)}
const TOUR=[['dash','1 · Пульт склада: тонны, деньги, зоны, заявки из 1С.'],['labels','2 · Три завода — три шаблона этикеток.'],['inc','3 · Приход: скан этикетки → свой QR → место → 1С.'],['cont','4 · Контейнер: сверка с упаковочным листом и акт расхождений.'],['map','5 · Схема склада: где лежит каждый рулон.'],['req','6 · Заявка пришла из 1С.'],['pick','7 · Система подобрала рулон по FIFO и показала место.'],['ret','8 · Остаток из цеха — новый QR, расход посчитан.'],['mob','9 · Кладовщик работает с телефона.'],['sync','10 · Всё ушло в 1С — ошибки видно и можно повторить.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,mm]=TOUR[ti];if(!allowed(k))switchRole('Руководитель');cur=k;build();toast('<b>'+mm+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
renderRoles();
(function(){const s=new URLSearchParams(location.search).get('s');if(s&&SUBN[s]){cur=s;enter('Руководитель')}})();
