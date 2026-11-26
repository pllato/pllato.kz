/* ===== Аптечный склад «Шипагер»: единая модель — номенклатура, партии, документы, журнал =====
   Все данные вымышленные. Любая операция меняет партии, пересчитывает остатки и пишет строку в журнал. */
const W={today:new Date('2026-11-26T12:00:00'),C:7,PHME:2,
 L:['№1 Центр','№2 Береке','№3 Ынтымак','№4 Жаңа Жол','№5 Базар','№6 Самал','№7 Достық','Центр. склад'],
 PF:[1.6,0.8,0.7,0.85,1.3,0.55,0.6],
 SUP:['ТОО «СТОФАРМ»','ТОО «Медсервис Плюс»','ТОО «Аманат»','ТОО «Казфарм-Дистрибуция»','ТОО «Келун-Казфарм»'],
 DEP:['Процедурный кабинет','Гинекология','Дневной стационар','Кабинет УЗИ'],
 I:[],B:[],J:[],IN:[],OUT:[],MV:[],INV:[],REQ:[],PO:[],
 f:{loc:'all',grp:'',q:'',rx:false,gob:false,low:false,cold:false,dead:0,all:false},
 inCur:'ПН-0413',outTab:'wo',invTab:'cur',repTab:'abc',expB:'all',expLoc:'all',jf:{t:'',loc:'all',q:''},card:'INS',
 seq:{pn:414,ap:27,sp:32,vz:9,vp:118,pm:114,inv:19,zk:56,zp:21,ch:3051}};
let wSeed=20261126;const wr=()=>{wSeed=(wSeed*1103515245+12345)%2147483648;return wSeed/2147483648};
const wD=d=>{const x=new Date(W.today);x.setDate(x.getDate()+Math.round(d));return x.toISOString().slice(0,10)};
const wDays=s=>Math.round((new Date(s+'T12:00:00')-W.today)/864e5);
const wF=s=>s.slice(8,10)+'.'+s.slice(5,7)+'.'+s.slice(0,4);
const wIt=k=>W.I.find(x=>x.k===k);
const wUser=()=>role==='Аптека'?'Сауле (зав. №3)':role==='Центральный склад'?'Ерлан (центр)':'Жанболат';
const wMine=()=>role==='Аптека';
const wNow=()=>'26.11 '+String(9+Math.floor(W.J.length/9)%9).padStart(2,'0')+':'+String((W.J.length*7)%60).padStart(2,'0');

/* номенклатура: код|торговое|МНН|форма|производитель|рецепт|ГОБМП|холод|цена|группа|продажи в мес. на 7 аптек|XYZ */
`PAR|Парацетамол 500 мг №20|Paracetamolum|таблетки|Химфарм|0|1|0|420|Анальгетики|420|X
AML|Амлодипин 5 мг №30|Amlodipinum|таблетки|KRKA|1|1|0|1350|Сердце и сосуды|160|X
MET|Метформин 850 мг №60|Metforminum|таблетки|Berlin-Chemie|1|1|0|1900|Диабет|86|X
AMX|Амоксиклав 875/125 мг №14|Amoxicillinum + Ac. clavulanicum|таблетки|Sandoz|1|0|0|3800|Антибиотики|69|Y
OMZ|Омепразол 20 мг №30|Omeprazolum|капсулы|Нобел АФФ|0|0|0|980|ЖКТ|129|X
NUR|Нурофен для детей 100 мг/5 мл 100 мл|Ibuprofenum|суспензия|Reckitt|0|0|0|2600|Детские|63|Y
LOR|Лоратадин 10 мг №10|Loratadinum|таблетки|Химфарм|0|0|0|650|Антигистаминные|100|Y
VIT|Витамин D3 2000 МЕ №60|Colecalciferolum|капсулы|Solgar|0|0|0|4900|Витамины|5|Z
KAG|Кагоцел 12 мг №10|Kagocelum|таблетки|Ниармедик|0|0|0|3200|Противовирусные|4|Z
SHP|Шприц 5 мл 3-комп.|—|изделие|Vogt Medical|0|1|0|60|Расходники|2490|X
ENT|Энтерофурил 200 мг №16|Nifuroxazidum|капсулы|Bosnalijek|0|0|0|2900|ЖКТ|38|Z
FLU|Флюкостат 150 мг №1|Fluconazolum|капсулы|Фармстандарт|0|0|0|1100|Гинекология|45|Y
IBU|Ибупрофен 400 мг №20|Ibuprofenum|таблетки|Химфарм|0|0|0|690|Анальгетики|210|X
KET|Кеторол 10 мг №20|Ketorolacum|таблетки|Dr. Reddy's|1|0|0|1450|Анальгетики|95|Y
DIC|Диклофенак 75 мг/3 мл №5|Diclofenacum|ампулы|Хемофарм|1|1|0|980|Анальгетики|80|Y
NOS|Но-шпа 40 мг №24|Drotaverinum|таблетки|Sanofi|0|0|0|1650|ЖКТ|140|X
ANL|Анальгин 50% 2 мл №10|Metamizolum natrium|ампулы|Карагандинский ФК|1|1|0|720|Анальгетики|70|Y
CIT|Цитрамон П №10|Ac. acetylsalicylicum + Coffeinum|таблетки|Химфарм|0|0|0|190|Анальгетики|260|X
AZI|Азитромицин 500 мг №3|Azithromycinum|таблетки|Нобел АФФ|1|1|0|1250|Антибиотики|88|Y
CEF|Цефтриаксон 1 г №1|Ceftriaxonum|порошок д/инъекций|Абди Ибрахим|1|1|0|620|Антибиотики|210|Y
CIP|Ципрофлоксацин 500 мг №10|Ciprofloxacinum|таблетки|Sandoz|1|0|0|980|Антибиотики|55|Y
AMP|Амоксициллин 500 мг №20|Amoxicillinum|капсулы|Химфарм|1|1|0|890|Антибиотики|92|Y
LIZ|Лизиноприл 10 мг №30|Lisinoprilum|таблетки|Gedeon Richter|1|1|0|1100|Сердце и сосуды|120|X
BIS|Бисопролол 5 мг №30|Bisoprololum|таблетки|Teva|1|1|0|1280|Сердце и сосуды|110|X
ENA|Эналаприл 10 мг №20|Enalaprilum|таблетки|Химфарм|1|1|0|380|Сердце и сосуды|150|X
LOS|Лозартан 50 мг №30|Losartanum|таблетки|KRKA|1|1|0|1550|Сердце и сосуды|98|X
ATO|Аторвастатин 20 мг №30|Atorvastatinum|таблетки|Polpharma|1|1|0|2300|Сердце и сосуды|76|X
KLO|Клопидогрел 75 мг №28|Clopidogrelum|таблетки|Sanofi|1|1|0|3900|Сердце и сосуды|34|X
CAR|Кардиомагнил 75 мг №100|Ac. acetylsalicylicum + Magnesii hydroxidum|таблетки|Takeda|0|1|0|2700|Сердце и сосуды|90|X
IND|Индапамид 2,5 мг №30|Indapamidum|таблетки|Servier|1|1|0|1450|Сердце и сосуды|70|X
VAL|Валидол 60 мг №10|Menthyli isovaleras|таблетки|Химфарм|0|0|0|210|Сердце и сосуды|60|Y
NIT|Нитроглицерин 0,5 мг №40|Nitroglycerinum|таблетки|Озон|1|1|0|520|Сердце и сосуды|22|Y
GLI|Гликлазид МВ 60 мг №30|Gliclazidum|таблетки|Servier|1|1|0|2900|Диабет|52|X
INS|Хумулин НПХ 100 МЕ/мл 3 мл №5|Insulinum isophanum|картриджи|Eli Lilly|1|1|1|14500|Диабет|18|X
INR|НовоРапид ФлексПен 3 мл №5|Insulinum aspartum|шприц-ручки|Novo Nordisk|1|1|1|17800|Диабет|14|X
ACT|Актрапид НМ 100 МЕ/мл 10 мл|Insulinum humanum|флакон|Novo Nordisk|1|1|1|6300|Диабет|10|X
TST|Тест-полоски Акку-Чек Актив №50|—|изделие|Roche|0|1|0|7900|Диабет|28|X
PAN|Пантопразол 40 мг №28|Pantoprazolum|таблетки|Абди Ибрахим|1|0|0|2100|ЖКТ|44|Y
MEZ|Мезим форте №20|Pancreatinum|таблетки|Berlin-Chemie|0|0|0|1500|ЖКТ|120|X
SMK|Смекта 3 г №10|Smectitum dioctaedricum|порошок|Ipsen|0|0|0|1900|ЖКТ|85|Y
LOP|Лоперамид 2 мг №20|Loperamidum|капсулы|Химфарм|0|0|0|340|ЖКТ|70|Y
REG|Регидрон №20|Natrii chloridum + Kalii chloridum|порошок|Orion|0|1|0|2600|ЖКТ|40|Z
DUF|Дюфалак 667 мг/мл 200 мл|Lactulosum|сироп|Abbott|0|0|0|3400|ЖКТ|26|Y
LIN|Линекс №16|Lebenin|капсулы|Sandoz|0|0|0|2800|ЖКТ|60|Y
SUP|Супрастин 25 мг №20|Chloropyraminum|таблетки|Egis|0|0|0|1050|Антигистаминные|90|Y
CET|Цетиризин 10 мг №10|Cetirizinum|таблетки|Нобел АФФ|0|0|0|520|Антигистаминные|85|Y
DEX|Дексаметазон 4 мг/мл №25|Dexamethasonum|ампулы|KRKA|1|1|0|2400|Гормоны|30|Y
PRD|Преднизолон 30 мг/мл №3|Prednisolonum|ампулы|Gedeon Richter|1|1|0|890|Гормоны|28|Y
ERG|Эргоферон №20|—|таблетки|Материа Медика|0|0|0|3600|Противовирусные|6|Z
ARB|Арбидол 100 мг №10|Umifenovirum|капсулы|Фармстандарт|0|0|0|3100|Противовирусные|20|Z
ACY|Ацикловир 400 мг №20|Aciclovirum|таблетки|Химфарм|1|0|0|780|Противовирусные|26|Y
OSC|Осельтамивир 75 мг №10|Oseltamivirum|капсулы|Нобел АФФ|1|0|0|5200|Противовирусные|12|Z
AMB|Амброксол 30 мг №20|Ambroxolum|таблетки|Химфарм|0|0|0|420|Простуда|150|Y
ACC|АЦЦ 600 мг №10|Acetylcysteinum|шипучие таблетки|Sandoz|0|0|0|1950|Простуда|80|Y
STR|Стрепсилс №24|—|пастилки|Reckitt|0|0|0|1800|Простуда|95|Y
NAZ|Називин 0,05% 10 мл|Oxymetazolinum|капли назальные|Merck|0|0|0|1400|Простуда|110|Y
AQM|Аква Марис спрей 30 мл|Aqua maris|спрей|Jadran|0|0|0|2300|Простуда|75|Y
TER|Терафлю лимон №10|—|порошок|GSK|0|0|0|3300|Простуда|60|Z
CAL|Кальций-Д3 Никомед №100|Calcii carbonas + Colecalciferolum|таблетки|Takeda|0|0|0|4200|Витамины|40|Y
FOL|Фолиевая кислота 1 мг №50|Ac. folicum|таблетки|Химфарм|0|1|0|260|Витамины|90|X
FER|Сорбифер Дурулес №50|Ferrosi sulfas + Ac. ascorbinicum|таблетки|Egis|0|1|0|3700|Витамины|55|X
MAG|Магне B6 №50|Magnesii lactas + Pyridoxinum|таблетки|Sanofi|0|0|0|4100|Витамины|60|X
CMB|Компливит №60|—|таблетки|Фармстандарт|0|0|0|1800|Витамины|35|Y
OMG|Омега-3 1000 мг №30|—|капсулы|Solgar|0|0|0|6900|Витамины|4|Z
VTC|Витамин C 500 мг №30|Ac. ascorbinicum|таблетки|Химфарм|0|0|0|390|Витамины|70|Y
UTR|Утрожестан 200 мг №14|Progesteronum|капсулы|Besins|1|0|0|6200|Гинекология|30|X
DUP|Дюфастон 10 мг №20|Dydrogesteronum|таблетки|Abbott|1|0|0|7800|Гинекология|26|X
TRZ|Тержинан №10|—|вагинальные таблетки|Sophartex|1|0|0|4300|Гинекология|22|Y
MTR|Метронидазол 250 мг №20|Metronidazolum|таблетки|Химфарм|1|1|0|360|Гинекология|60|Y
OXT|Окситоцин 5 МЕ/мл №10|Oxytocinum|ампулы|Gedeon Richter|1|1|1|1900|Гинекология|10|Y
PNT|Пантенол спрей 130 г|Dexpanthenolum|аэрозоль|Химфарм|0|0|0|1900|Дерматология|35|Y
LVM|Левомеколь 40 г|Chloramphenicolum + Methyluracilum|мазь|Нижфарм|0|1|0|1100|Дерматология|60|Y
AKR|Акридерм 0,05% 30 г|Betamethasonum|крем|Акрихин|1|0|0|1300|Дерматология|25|Y
CLT|Клотримазол 1% 20 г|Clotrimazolum|крем|Химфарм|0|0|0|450|Дерматология|40|Y
TOB|Тобрекс 0,3% 5 мл|Tobramycinum|капли глазные|Novartis|1|0|0|2300|Глаза и уши|25|Y
VZN|Визин 15 мл|Tetryzolinum|капли глазные|Johnson & Johnson|0|0|0|1900|Глаза и уши|30|Y
OTP|Отипакс 16 г|Phenazonum + Lidocainum|капли ушные|Biocodex|0|0|0|3100|Глаза и уши|35|Y
GLC|Глицин 100 мг №50|Glycinum|таблетки|Биотики|0|0|0|520|Неврология|110|X
AFB|Афобазол 10 мг №60|Fabomotizolum|таблетки|Фармстандарт|0|0|0|3400|Неврология|6|Z
MXD|Мексидол 50 мг/мл 2 мл №10|Ethylmethylhydroxypyridini succinas|ампулы|Фармасофт|1|0|0|4900|Неврология|22|Y
CMG|Комбилипен 2 мл №10|Thiaminum + Pyridoxinum + Cyanocobalaminum|ампулы|Фармстандарт|1|0|0|2600|Неврология|50|Y
NAH|Натрия хлорид 0,9% 200 мл|Natrii chloridum|раствор для инфузий|Келун-Казфарм|1|1|0|380|Инфузии|340|X
GLU|Глюкоза 5% 200 мл|Glucosum|раствор для инфузий|Келун-Казфарм|1|1|0|420|Инфузии|120|X
RIN|Рингер 500 мл|—|раствор для инфузий|Келун-Казфарм|1|1|0|690|Инфузии|60|Y
SIS|Система для инфузий|—|изделие|Vogt Medical|0|1|0|120|Расходники|520|X
SH2|Шприц 2 мл 3-комп.|—|изделие|Vogt Medical|0|1|0|45|Расходники|1800|X
S10|Шприц 10 мл 3-комп.|—|изделие|Vogt Medical|0|1|0|75|Расходники|900|X
PER|Перчатки нитриловые M №100|—|изделие|Dermagrip|0|1|0|3900|Расходники|60|X
BIN|Бинт стерильный 7×14|—|изделие|Нью-Лайф|0|1|0|180|Перевязка|300|X
VAT|Вата хирургическая 100 г|—|изделие|Нью-Лайф|0|0|0|290|Перевязка|140|X
PLS|Пластырь бактерицидный №10|—|изделие|Leiko|0|0|0|350|Перевязка|260|X
SPI|Спирт этиловый 70% 100 мл|Ethanolum|раствор|Келун-Казфарм|1|1|0|450|Перевязка|90|X
HLG|Хлоргексидин 0,05% 100 мл|Chlorhexidinum|раствор|Химфарм|0|1|0|240|Перевязка|200|X
PRK|Перекись водорода 3% 100 мл|Hydrogenii peroxidum|раствор|Химфарм|0|1|0|180|Перевязка|150|X
TRM|Термометр электронный|—|изделие|Microlife|0|0|0|1900|Изделия|25|Y
TON|Тонометр автоматический B3|—|изделие|Microlife|0|0|0|24900|Изделия|3|Z
PMP|Подгузники для взрослых M №10|—|изделие|Seni|0|0|0|5600|Изделия|8|Z
GRP|Гриппол плюс 0,5 мл №1|Vaccinum influenzae|шприц|Петровакс|1|0|1|5900|Вакцины|20|Z
ENG|Энджерикс B 20 мкг/мл №1|Vaccinum hepatitidis B|флакон|GSK|1|0|1|4800|Вакцины|6|Z`.split('\n').forEach((ln,n)=>{const a=ln.split('|');
 const p=+a[8],cost=Math.round(p/(1.22+0.12*wr())/5)*5,v=+a[10];
 const bc=(()=>{const d=('487'+String(100000000+n*7919+Math.floor(wr()*997)).slice(-9)).split('').map(Number);const c=(10-d.reduce((s,x,i)=>s+x*(i%2?3:1),0)%10)%10;return d.join('')+c})();
 const cold=a[7]==='1',big=[0,4];
 const s30=W.PF.map((f,i)=>{if(cold&&a[9]==='Диабет'&&big.indexOf(i)<0)return 0;let q=Math.round(v*f/6.4*(0.75+0.5*wr()));if(v<=6&&wr()<.6)q=0;return q});
 const mn=s30.map(q=>q>0?Math.max(2,Math.ceil(q*0.5)):0);
 W.I.push({k:a[0],n:a[1],mnn:a[2],form:a[3],mfr:a[4],rx:a[5]==='1',gob:a[6]==='1',cold,p,cost,grp:a[9],v,xyz:a[11],bc,s30,mn,
  w:[0,1,2,3].map(()=>{const cv=a[11]==='X'?.08:a[11]==='Y'?.3:.75;return Math.max(0,Math.round(v/4*(1+cv*(wr()*2-1))))}),
  lm:s30.concat([v]).map(q=>q>0?Math.floor(wr()*3):25+Math.floor(wr()*90))})});
const wSer=it=>it.mfr.replace(/[^A-Za-zА-Яа-я]/g,'').slice(0,2).toUpperCase()+String(Math.floor(100000+wr()*899999));
const wExpPool=()=>{const r=wr();return r<.008?-(4+wr()*40):r<.035?8+wr()*21:r<.12?30+wr()*59:r<.25?90+wr()*89:180+wr()*720};
W.I.forEach(it=>{
 it.s30.forEach((q,i)=>{let tgt=q>0?Math.round(q*(0.45+1.55*wr())):(it.v<=6&&!it.cold?3+Math.floor(wr()*9):0);
  if(tgt<=0)return;const two=tgt>3&&wr()<.5,a=two?Math.ceil(tgt*0.35):tgt;
  W.B.push({k:it.k,loc:i,ser:wSer(it),exp:wD(wExpPool()),q:a,cost:it.cost,md:0});
  if(two)W.B.push({k:it.k,loc:i,ser:wSer(it),exp:wD(200+wr()*600),q:tgt-a,cost:it.cost,md:0})});
 const c=Math.round(it.v*1.2*(0.55+0.8*wr()));if(c>0){const a=Math.ceil(c*0.4);
  W.B.push({k:it.k,loc:W.C,ser:wSer(it),exp:wD(120+wr()*300),q:a,cost:it.cost,md:0});
  W.B.push({k:it.k,loc:W.C,ser:wSer(it),exp:wD(380+wr()*500),q:c-a,cost:it.cost,md:0})}});
/* показательные случаи для демо */
(()=>{const set=(k,loc,q,exp,ser)=>{W.B=W.B.filter(b=>!(b.k===k&&b.loc===loc));if(q>0)W.B.push({k,loc,ser:ser||wSer(wIt(k)),exp:wD(exp),q,cost:wIt(k).cost,md:0})};
 const it=wIt('ENT');it.s30[6]=0;it.s30[2]=6;it.mn[2]=3;it.lm[6]=47;set('ENT',6,8,24,'BO552190');set('ENT',2,0);
 set('KAG',5,6,-9,'NI118804');wIt('KAG').lm[5]=88;set('ERG',3,4,-17,'MM300517');wIt('ERG').lm[3]=96;
 set('VIT',1,9,70,'SO771203');wIt('VIT').s30[1]=0;wIt('VIT').lm[1]=64;
 set('NUR',2,2,140,'RB410077');set('AML',2,3,300,'KR880412');set('PAR',2,12,420,'XF100345');
 set('OXT',W.C,30,48,'GR551098');set('GRP',W.C,40,62,'PV902214');})();

/* остатки и резерв */
const wQ=(k,loc)=>W.B.reduce((s,b)=>s+(b.k===k&&b.loc===loc?b.q:0),0);
const wRes=(k,loc)=>W.MV.filter(m=>m.from===loc&&m.st==='создано').reduce((s,m)=>s+m.lines.filter(l=>l.k===k).reduce((x,l)=>x+l.q,0),0);
const wNear=(k,loc)=>{const b=W.B.filter(b=>b.k===k&&(loc==null||b.loc===loc)&&b.q>0).sort((a,c)=>a.exp<c.exp?-1:1)[0];return b?b.exp:null};
const wTot=k=>W.L.reduce((s,_,i)=>s+wQ(k,i),0);
function wLog(t,doc,k,loc,q,ser,sumv){W.J.unshift({t:wNow(),u:wUser(),op:t,doc,k,loc,q,ser:ser||'',s:sumv!=null?sumv:Math.abs(q)*wIt(k).cost});const it=wIt(k);if(it&&loc!=null)it.lm[loc]=0}
/* FEFO: сначала партия с ближайшим сроком; просроченное продавать нельзя */
function wTake(k,loc,q,opt){opt=opt||{};let need=q;const parts=[];
 const bs=W.B.filter(b=>b.k===k&&b.loc===loc&&b.q>0&&(opt.exp?true:wDays(b.exp)>=0)&&(!opt.ser||b.ser===opt.ser)).sort((a,c)=>opt.expFirst?(wDays(a.exp)<0?-1:1)-(wDays(c.exp)<0?-1:1)||(a.exp<c.exp?-1:1):(a.exp<c.exp?-1:1));
 for(const b of bs){if(need<=0)break;const t=Math.min(b.q,need);b.q-=t;need-=t;parts.push({ser:b.ser,exp:b.exp,q:t,cost:b.cost,md:b.md})}
 W.B=W.B.filter(b=>b.q>0);return {parts,short:need}}
function wPut(k,loc,parts){parts.forEach(p=>{const b=W.B.find(x=>x.k===k&&x.loc===loc&&x.ser===p.ser);if(b)b.q+=p.q;else W.B.push({k,loc,ser:p.ser,exp:p.exp,q:p.q,cost:p.cost||wIt(k).cost,md:p.md||0})})}
function wSync(){DR=W.I.map(it=>({k:it.k,n:it.n,p:it.p,min:0,mn:it.mn,st:[0,1,2,3,4,5,6].map(i=>wQ(it.k,i)),s30:it.s30,exp:(()=>{const e=wNear(it.k);return e?e.slice(5,7)+'.'+e.slice(0,4):'—'})()}))}

/* стартовые документы */
(()=>{const mk=(k,qd,qf,exp,ser)=>({k,qd,qf,bad:0,exp:wD(exp),ser:ser||wSer(wIt(k)),cost:wIt(k).cost,t:wIt(k).cold?'':null});
 W.IN.push({id:'ПН-0412',sup:W.SUP[0],no:'СФ-88214',date:'24.11.2026',loc:W.C,st:'проведён',act:'',lines:[mk('PAR',400,400,700),mk('CEF',300,300,520),mk('NAH',600,600,610),mk('SH2',2000,2000,1500),mk('AML',150,150,640),mk('IBU',200,200,560)]});
 const l=[mk('INS',20,null,330),mk('INR',15,null,360),mk('AMX',60,null,420),mk('NOS',120,null,600),mk('SMK',80,null,500),mk('MAG',50,null,540),mk('LIN',40,null,380),mk('CET',100,null,700)];
 W.IN.unshift({id:'ПН-0413',sup:W.SUP[1],no:'СФ-12077',date:'26.11.2026',loc:W.C,st:'на приёмке',act:'',lines:l});
 W.MV.push({id:'ПМ-113',from:W.C,to:3,st:'в пути',date:'26.11',why:'заявка ЗК-055',lines:[{k:'AMX',q:6,parts:[{ser:'SA220871',exp:wD(400),q:6,cost:wIt('AMX').cost}]},{k:'LOS',q:10,parts:[{ser:'KR661023',exp:wD(510),q:10,cost:wIt('LOS').cost}]},{k:'NUR',q:5,parts:[{ser:'RB410290',exp:wD(300),q:5,cost:wIt('NUR').cost}]}]});
 W.MV.push({id:'ПМ-112',from:6,to:2,st:'в пути',date:'25.11',why:'излишек → спрос',lines:[{k:'FLU',q:4,parts:[{ser:'FA300112',exp:wD(160),q:4,cost:wIt('FLU').cost}]}]});
 W.MV.push({id:'ПМ-111',from:W.C,to:2,st:'принято',date:'21.11',why:'заявка ЗК-052',acc:'21.11',lines:[{k:'PAR',q:40,qf:40,parts:[]},{k:'OMZ',q:12,qf:12,parts:[]}]});
 W.OUT.push({id:'СП-031',type:'wo',date:'25.11',loc:2,k:'NUR',q:1,why:'бой',note:'флакон разбит при выкладке',st:'на утверждении',s:wIt('NUR').cost});
 W.OUT.push({id:'ВП-117',type:'dep',date:'25.11',loc:0,k:'SH2',q:60,why:'Процедурный кабинет',st:'проведён',s:60*wIt('SH2').cost});
 W.OUT.push({id:'СП-030',type:'wo',date:'18.11',loc:4,k:'PRK',q:3,why:'порча',note:'протечка упаковки',st:'утверждён',s:3*wIt('PRK').cost});
 W.INV.push({id:'ИНВ-018',loc:0,type:'Полная',date:'01.11.2026',st:'проведена',n:96,minus:3,plus:1,sm:-4200,lines:[]});
 W.INV.push({id:'ИНВ-017',loc:4,type:'По группе «Антибиотики»',date:'14.10.2026',st:'проведена',n:9,minus:1,plus:0,sm:-1250,lines:[]});
 W.REQ.push({id:'ЗК-055',ph:3,date:'25.11',st:'отгружена',lines:[]});
 const seed=[['Приход','ПН-0412','PAR',W.C,400],['Приход','ПН-0412','CEF',W.C,300],['Продажа','Чек 3049','PAR',2,-2],['Продажа','Чек 3048','AML',0,-1],['Выдача в поликлинику','ВП-117','SH2',0,-60],['Перемещение (отгрузка)','ПМ-113','AMX',W.C,-6],['Перемещение (отгрузка)','ПМ-113','LOS',W.C,-10],['Продажа','Чек 3050','NOS',4,-1],['Списание','СП-030','PRK',4,-3],['Перемещение (приёмка)','ПМ-111','PAR',2,40]];
 seed.reverse().forEach((r,i)=>W.J.push({t:(i<4?'25.11 ':'26.11 ')+String(10+i)+':'+String(i*7%60).padStart(2,'0'),u:r[3]===W.C?'Ерлан (центр)':'Сауле (зав. №3)',op:r[0],doc:r[1],k:r[2],loc:r[3],q:r[4],ser:'',s:Math.abs(r[4])*wIt(r[2]).cost}));W.J.reverse();})();
wSync();

/* ===== общие элементы ===== */
document.head.insertAdjacentHTML('beforeend',`<style>
.lnk{color:var(--navy3);cursor:pointer;border-bottom:1px dotted var(--navy3)}.lnk:hover{color:var(--paid)}
.tabs{display:flex;border-bottom:1px solid var(--line2);margin-bottom:12px;overflow-x:auto}.tab{padding:9px 14px;cursor:pointer;white-space:nowrap;border-bottom:3px solid transparent;font-size:13.5px;color:var(--muted)}.tab.on{border-bottom-color:var(--paid);font-weight:700;color:var(--ink)}
.flt{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;padding:10px 14px;border-bottom:1px solid var(--line);background:#faf8f4}.flt .inp{width:auto;min-width:120px}.flt label{font-size:12.5px;display:flex;gap:5px;align-items:center;white-space:nowrap}
.qi{width:74px;text-align:right;padding:4px 6px}.qi.err{border-color:var(--bad);background:var(--badl)}
.cold{display:inline-block;font:700 10px 'JetBrains Mono';background:#e3f0f8;color:#22618f;padding:1px 5px;margin-left:4px}
.rx{display:inline-block;font:700 10px 'JetBrains Mono';background:var(--badl);color:var(--bad);padding:1px 5px;margin-left:4px}
.gb{display:inline-block;font:700 10px 'JetBrains Mono';background:var(--govl);color:var(--gov);padding:1px 5px;margin-left:4px}
.ex{display:inline-block;font:700 11px 'JetBrains Mono';padding:1px 6px}.ex0{background:var(--bad);color:#fff}.ex1{background:var(--badl);color:var(--bad)}.ex2{background:var(--warnl);color:var(--warn)}.ex3{background:#eef3e8;color:#4b6a2a}.ex4{color:var(--muted)}
.lights{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.lt{background:#fff;border:1px solid var(--line);border-top:5px solid;padding:12px 14px;cursor:pointer}.lt.on{outline:2px solid var(--ink)}.lt small{display:block;color:var(--muted);font-size:12.5px}.lt b{display:block;font:700 22px 'Onest';font-variant-numeric:tabular-nums}.lt i{font-style:normal;font-size:12.5px}
.steps{display:flex;gap:3px;flex-wrap:wrap}.steps span{font:600 10.5px 'JetBrains Mono';padding:2px 6px;background:#eee9df;color:var(--muted2)}.steps span.on{background:var(--navy);color:#fff}.steps span.dn{background:var(--okl);color:var(--ok)}
.docl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 14px;font-size:13.5px;padding:12px 14px;border-bottom:1px solid var(--line)}.docl small{display:block;font-size:11.5px;color:var(--muted)}
.mx td.z{color:var(--muted2)}.mx td.lo{color:var(--bad);font-weight:700}.mx td.dd{background:#f4f1ea;color:var(--muted)}
tr.dim td{color:var(--muted2)}tr.hl td{background:#fdf6e6}
.chart{width:100%;height:auto;display:block}
@media (max-width:900px){.lights{grid-template-columns:1fr 1fr}.docl{grid-template-columns:1fr 1fr}.flt .inp{min-width:0;flex:1 1 140px}}
</style>`);
const wNm=it=>`<span class="lnk" onclick="wCard('${it.k}')">${esc(it.n)}</span>${it.rx?'<span class="rx">Rx</span>':''}${it.gob?'<span class="gb">ГОБМП</span>':''}${it.cold?'<span class="cold">+2…+8 °C</span>':''}`;
const wEx=s=>{if(!s)return '<span class="ex ex4">—</span>';const d=wDays(s);const c=d<0?0:d<30?1:d<90?2:d<180?3:4;return `<span class="ex ex${c}">${wF(s)}</span>`};
const wLocOpts=(v,all,cen)=>{const opts=[];if(all)opts.push(['all','Все аптеки + центр']);W.L.forEach((n,i)=>{if(i<7||cen)opts.push([i,n])});return opts.map(([k,n])=>`<option value="${k}" ${String(k)===String(v)?'selected':''}>${esc(n)}</option>`).join('')};
const wLocSel=(v,fn,all,cen)=>wMine()?`<span class="tag">${esc(W.L[W.PHME])}</span>`:`<select class="inp" style="width:auto" onchange="${fn}">${wLocOpts(v,all,cen!==false)}</select>`;
const wItOpts=(sel,loc)=>W.I.filter(it=>loc==null||wQ(it.k,loc)>0).map(it=>`<option value="${it.k}" ${it.k===sel?'selected':''}>${esc(it.n)}${loc!=null?' · ост. '+wQ(it.k,loc):''}</option>`).join('');
const wTabs=(list,curT,fn)=>`<div class="tabs">${list.map(([k,n])=>`<div class="tab ${k===curT?'on':''}" onclick="${fn}('${k}')">${n}</div>`).join('')}</div>`;
const wV=id=>{const e=document.getElementById(id);return e?e.value:''};
const wDone=(m,go2)=>{wSync();closeM();if(go2)cur=go2;build();toast(m)};
const wSum=a=>a.reduce((x,y)=>x+y,0);
function wCard(k){W.card=k;if(allowed('wcard'))go('wcard');else toast('Карточка товара этой роли недоступна.')}

/* ===== ОСТАТКИ ===== */
SC.phd=()=>{const f=W.f;if(wMine())f.loc=W.PHME;
 const locs=f.loc==='all'?null:+f.loc;const grps=[...new Set(W.I.map(i=>i.grp))];
 let items=W.I.filter(it=>(!f.grp||it.grp===f.grp)&&(!f.q||(it.n+' '+it.mnn+' '+it.bc).toLowerCase().includes(f.q.toLowerCase()))&&(!f.rx||it.rx)&&(!f.gob||it.gob)&&(!f.cold||it.cold));
 if(f.low)items=items.filter(it=>locs==null?[0,1,2,3,4,5,6].some(i=>wQ(it.k,i)<it.mn[i]):locs<7&&wQ(it.k,locs)<it.mn[locs]);
 if(f.dead)items=items.filter(it=>(locs==null?[0,1,2,3,4,5,6,7]:[locs]).some(i=>wQ(it.k,i)>0&&it.lm[i]>=f.dead));
 const LS=locs==null?[0,1,2,3,4,5,6,7]:[locs];
 const costV=wSum(W.B.filter(b=>LS.includes(b.loc)).map(b=>b.q*b.cost)),retV=wSum(W.B.filter(b=>LS.includes(b.loc)).map(b=>b.q*wIt(b.k).p*(1-b.md/100)));
 const resV=wSum(W.I.map(it=>wSum(LS.map(i=>wRes(it.k,i)))*it.cost));
 const lows=wSum(W.I.map(it=>LS.filter(i=>i<7&&wQ(it.k,i)<it.mn[i]).length));
 const shown=f.all?items:items.slice(0,40);
 const flt=`<div class="flt">${wLocSel(f.loc,"W.f.loc=this.value;build()",true)}
  <select class="inp" onchange="W.f.grp=this.value;build()"><option value="">Все группы</option>${grps.map(g=>`<option ${g===f.grp?'selected':''}>${esc(g)}</option>`).join('')}</select>
  <input class="inp" placeholder="Название, МНН или штрихкод" value="${esc(f.q)}" onchange="W.f.q=this.value;build()">
  <label><input type="checkbox" ${f.rx?'checked':''} onchange="W.f.rx=this.checked;build()">рецептурные</label>
  <label><input type="checkbox" ${f.gob?'checked':''} onchange="W.f.gob=this.checked;build()">ГОБМП</label>
  <label><input type="checkbox" ${f.cold?'checked':''} onchange="W.f.cold=this.checked;build()">холодильник</label>
  <label><input type="checkbox" ${f.low?'checked':''} onchange="W.f.low=this.checked;build()">ниже минимума</label>
  <select class="inp" onchange="W.f.dead=+this.value;build()">${[[0,'любое движение'],[30,'без движения 30+ дн.'],[60,'без движения 60+ дн.'],[90,'без движения 90+ дн.']].map(([v,n])=>`<option value="${v}" ${v===f.dead?'selected':''}>${n}</option>`).join('')}</select>
  <button class="bt s" onclick="W.f={loc:wMine()?W.PHME:'all',grp:'',q:'',rx:false,gob:false,low:false,cold:false,dead:0,all:false};build()">Сбросить</button></div>`;
 let table;
 if(locs==null){table=tbl(['Препарат',...W.L.map(n=>'>'+n.replace('Центр. склад','Центр')),'>Всего','>Сумма, закуп'],shown.map(it=>`<tr>${'<td>'+wNm(it)+'<br><small class="mono" style="color:var(--muted2)">'+it.bc+'</small></td>'}${W.L.map((_,i)=>{const q=wQ(it.k,i);const lo=i<7&&q<it.mn[i];const dd=q>0&&it.lm[i]>=60;return `<td class="r ${lo?'lo':q?'':'z'} ${dd?'dd':''}" title="${i<7?'мин. '+it.mn[i]+' · продажи 30 дн. '+it.s30[i]:'центральный склад'}">${q}${wRes(it.k,i)?`<small style="color:var(--paid)"> −${wRes(it.k,i)}</small>`:''}</td>`}).join('')}<td class="r"><b>${wTot(it.k)}</b></td><td class="r">${tg(wTot(it.k)*it.cost)}</td></tr>`)).replace('class="t"','class="t mx"')}
 else{table=tbl(['Препарат','Группа','>Остаток','>Мин.','>Резерв','>Доступно','>Партий','Ближайший срок','>Закуп','>Розница','>Без движ., дн.'],shown.map(it=>{const q=wQ(it.k,locs),r=wRes(it.k,locs),mnv=locs<7?it.mn[locs]:'—';return `<tr class="${q===0?'dim':''}"><td>${wNm(it)}</td><td>${esc(it.grp)}</td><td class="r" style="${locs<7&&q<it.mn[locs]?'color:var(--bad);font-weight:700':''}">${q}</td><td class="r">${mnv}</td><td class="r">${r||''}</td><td class="r">${q-r}</td><td class="r">${W.B.filter(b=>b.k===it.k&&b.loc===locs).length}</td><td>${wEx(wNear(it.k,locs))}</td><td class="r">${tg(q*it.cost)}</td><td class="r">${tg(q*it.p)}</td><td class="r" style="${q&&it.lm[locs]>=60?'color:var(--bad)':''}">${q?it.lm[locs]:'—'}</td></tr>`}))}
 return `<div class="hd"><div><h2>Остатки${locs==null?' по 7 аптекам и центру':' · '+esc(W.L[locs])}</h2><p>${W.I.length} позиций, ${W.B.length} партий с сериями и сроками. Остаток меняется сам при каждом приходе, продаже, списании и перемещении — никто не передаёт цифры по телефону.</p></div><div class="btns"><button class="bt" onclick="go('in')">+ Приход</button><button class="bt" onclick="go('inv')">Инвентаризация</button><button class="bt a" onclick="go('order')">Заказ (${lows} строк ниже мин.)</button></div></div>
 <div class="big"><div><small>Товар в закупе</small><b>${mln(costV)}</b><i>${locs==null?'все точки':'эта точка'}</i></div><div><small>В рознице</small><b>${mln(retV)}</b><i>с учётом уценок</i></div><div><small>Ниже минимума</small><b class="dn">${lows}</b><i>строк аптека × товар</i></div><div><small>В резерве</small><b>${tg(resV)}</b><i>под перемещения</i></div></div>
 <div class="pan"><h3>${locs==null?'Матрица остатков':'Остатки точки'} <small>${items.length} позиций · красным — ниже минимума, серым фоном — без движения 60+ дней</small></h3>${flt}${table}
 <div class="pb">${items.length>40?`<button class="bt s" onclick="W.f.all=!W.f.all;build()">${f.all?'Свернуть':'Показать все '+items.length}</button> `:''}<button class="bt s" onclick="xls('Остатки')">Выгрузить в Excel</button><div class="note">Нажмите на название — откроется карточка товара: партии, серии, сроки, история движения и график остатка.</div></div></div>`};

/* ===== КАРТОЧКА ТОВАРА ===== */
SC.wcard=()=>{const it=wIt(W.card)||W.I[0];const LS=wMine()?[W.PHME]:[0,1,2,3,4,5,6,7];
 const tot=wSum(LS.map(i=>wQ(it.k,i))),day=wSum(it.s30)/30;
 const abc=wABC()[it.k];
 // график остатка за 60 дней: восстановлен назад от текущего остатка по продажам и приходам
 let s=[],q=tot;const dd=day*(wMine()?it.s30[W.PHME]/Math.max(1,wSum(it.s30)):1)+(wMine()?0:tot/400);wSeed=it.k.charCodeAt(0)*977+it.k.charCodeAt(1)*31;for(let d=0;d<60;d++){s.unshift(Math.round(q));q=q+dd*(0.4+1.2*wr());if(d%14===6)q=Math.max(1,q-dd*16*(0.9+wr()*0.4))}
 const mx=Math.max(...s,1),pts=s.map((v,i)=>`${(i/59*580+10).toFixed(1)},${(130-v/mx*110).toFixed(1)}`).join(' ');
 const hist=W.J.filter(j=>j.k===it.k&&(!wMine()||j.loc===W.PHME)).slice(0,14);
 return `<div class="hd"><div><h2>${esc(it.n)}</h2><p>${esc(it.mnn)} · ${esc(it.form)} · ${esc(it.mfr)}</p></div><select class="inp" style="width:auto;max-width:100%" onchange="W.card=this.value;build()">${wItOpts(it.k)}</select></div>
 <div class="g21"><div class="pan"><h3>Данные товара</h3><div class="pb kv">
  <span>Штрихкод</span><b class="mono">${it.bc}</b><span>Группа</span><span>${esc(it.grp)}</span>
  <span>Отпуск</span><span>${it.rx?'по рецепту <span class="rx">Rx</span>':'без рецепта'}</span><span>Финансирование</span><span>${it.gob?'ГОБМП/ОСМС и коммерция <span class="gb">ГОБМП</span>':'коммерция'}</span>
  <span>Хранение</span><span>${it.cold?'холодильник +2…+8 °C, контроль при приёмке <span class="cold">холод</span>':'при комнатной температуре до +25 °C'}</span>
  <span>Цена закуп / розница</span><b class="num">${tg(it.cost)} / ${tg(it.p)}</b><span>Наценка</span><span class="num">${Math.round((it.p/it.cost-1)*100)}%</span>
  <span>ABC / XYZ</span><span><b>${abc}</b> / <b>${it.xyz}</b> · ${it.xyz==='X'?'спрос ровный':it.xyz==='Y'?'спрос колеблется':'спрос случайный'}</span>
  <span>Продажи 30 дн.</span><span class="num">${wSum(it.s30)} шт · ≈${day.toFixed(1)} в день по сети</span></div></div>
 <div class="pan"><h3>Остаток за 60 дней <small>${wMine()?esc(W.L[W.PHME]):'вся сеть'} · сейчас ${tot} шт</small></h3><div class="pb"><svg class="chart" viewBox="0 0 600 140" role="img" aria-label="График остатка"><line x1="10" y1="130" x2="590" y2="130" stroke="#cfc8bb"/><polyline points="${pts}" fill="none" stroke="#2a5d8f" stroke-width="2.4"/><polyline points="10,130 ${pts} 590,130" fill="#2a5d8f14" stroke="none"/><text x="10" y="12" font-size="11" fill="#5d6c7c">макс. ${mx}</text><text x="540" y="12" font-size="11" fill="#5d6c7c">сегодня</text></svg><div class="btns" style="margin-top:8px"><button class="bt s" onclick="wQuickMove('${it.k}')">Переместить</button><button class="bt s" onclick="W.outTab='wo';W.outK='${it.k}';go('out')">Списать</button><button class="bt s" onclick="go('order')">В заказ</button></div></div></div></div>
 <div class="pan"><h3>Остатки по точкам</h3>${tbl(['Точка','>Остаток','>Мин.','>Продажи 30 дн.','>Хватит, дней','>Резерв','Ближайший срок','>Без движ., дн.'],LS.map(i=>{const q=wQ(it.k,i),sp=i<7?it.s30[i]:0;return `<tr class="${q===0?'dim':''}"><td>${esc(W.L[i])}</td><td class="r" style="${i<7&&q<it.mn[i]?'color:var(--bad);font-weight:700':''}">${q}</td><td class="r">${i<7?it.mn[i]:'—'}</td><td class="r">${i<7?sp:'—'}</td><td class="r">${i<7?(sp?Math.round(q/(sp/30)):q?'∞':'—'):'—'}</td><td class="r">${wRes(it.k,i)||''}</td><td>${wEx(wNear(it.k,i))}</td><td class="r">${q?it.lm[i]:'—'}</td></tr>`}))}</div>
 <div class="pan"><h3>Партии и серии <small>списание идёт с ближайшего срока (FEFO)</small></h3>${tbl(['Точка','Серия','Годен до','>Дней','>Кол-во','>Закуп','Уценка'],W.B.filter(b=>b.k===it.k&&LS.includes(b.loc)).sort((a,c)=>a.exp<c.exp?-1:1).map(b=>`<tr><td>${esc(W.L[b.loc])}</td><td class="mono">${b.ser}</td><td>${wEx(b.exp)}</td><td class="r">${wDays(b.exp)}</td><td class="r">${b.q}</td><td class="r">${tg(b.q*b.cost)}</td><td>${b.md?'−'+b.md+'%':''}</td></tr>`))}</div>
 <div class="pan"><h3>История движения</h3>${hist.length?tbl(['Когда','Кто','Операция','Документ','Точка','>Кол-во'],hist.map(j=>`<tr><td class="num">${j.t}</td><td>${esc(j.u)}</td><td>${esc(j.op)}</td><td class="num">${esc(j.doc)}</td><td>${esc(W.L[j.loc])}</td><td class="r" style="color:${j.q<0?'var(--bad)':'var(--ok)'}">${j.q>0?'+':''}${j.q}</td></tr>`)):'<div class="pb note">За последние дни движений не было. Проведите продажу на кассе или приход — строка появится здесь.</div>'}</div>`};

/* ===== ПРИХОД ===== */
function wInStat(d){const disc=d.lines.filter(l=>l.qf!=null&&(l.qf!==l.qd||l.bad>0)),scanned=d.lines.filter(l=>l.qf!=null).length,coldBad=d.lines.filter(l=>wIt(l.k).cold&&l.t==='нарушение').length;return {disc,scanned,coldBad,sum:wSum(d.lines.map(l=>(l.qf==null?l.qd:l.qf)*l.cost))}}
SC.in=()=>{const docs=W.IN.filter(d=>!wMine()||d.loc===W.PHME);const d=docs.find(x=>x.id===W.inCur)||docs[0];
 const incoming=W.MV.filter(m=>m.st==='в пути'&&(!wMine()||m.to===W.PHME));
 const list=`<div class="pan"><h3>Приходные накладные <small>${docs.length}</small></h3>${tbl(['№','Поставщик','Накладная','Дата','Куда','>Строк','>Сумма','Статус'],docs.map(x=>`<tr class="cl ${d&&x.id===d.id?'hl':''}" onclick="W.inCur='${x.id}';build()"><td class="num">${x.id}</td><td>${esc(x.sup)}</td><td class="num">${esc(x.no)}</td><td class="num">${x.date}</td><td>${esc(W.L[x.loc])}</td><td class="r">${x.lines.length}</td><td class="r">${tg(wInStat(x).sum)}</td><td>${x.st==='проведён'?dot('ok','проведён'):x.st==='ожидается'?dot('mut','ожидается'):dot('warn',x.st)}</td></tr>`))}</div>`;
 let body='';
 if(d){const S=wInStat(d),ed=d.st!=='проведён';
  body=`<div class="pan"><h3>${d.id} · ${esc(d.sup)} <small>${ed?'приёмка: сканируйте или вводите факт':'проведён · партии на остатках'}</small></h3>
  <div class="docl"><div><small>Поставщик</small>${esc(d.sup)}</div><div><small>Накладная поставщика</small><span class="num">${esc(d.no)} от ${d.date}</span></div><div><small>Куда</small>${esc(W.L[d.loc])}</div><div><small>Статус</small>${d.st}${d.act?' · акт '+d.act:''}</div></div>
  ${ed?`<div class="flt"><button class="bt p" onclick="wScan('${d.id}')">Сканировать штрихкод</button><button class="bt" onclick="wFillIn('${d.id}')">Всё сошлось — заполнить по накладной</button><select class="inp" id="in-k">${wItOpts('VTC')}</select><input class="inp qi" id="in-q" value="10" inputmode="numeric" style="min-width:0;width:70px;flex:0 0 70px"><button class="bt" onclick="wAddLine('${d.id}')">+ Строка (пересорт / не по накладной)</button><span class="note" style="margin:0">Отсканировано ${S.scanned} из ${d.lines.length}</span></div>`:''}
  ${tbl(['Препарат','Серия','Годен до','>По накл.','>Факт','>Бой/брак','>Закуп','>Наценка','>Розница','>Сумма','Холод. цепь'],d.lines.map((l,i)=>{const it=wIt(l.k),diff=l.qf!=null&&l.qf!==l.qd;const mk=Math.round((it.p/l.cost-1)*100);
   return `<tr class="${l.qf==null?'':diff||l.bad?'hl':''}"><td style="min-width:210px">${wNm(it)}${l.extra?' <span class="tag">не по накладной</span>':''}</td><td class="mono">${ed?`<input class="inp" style="width:110px;padding:3px 6px" value="${l.ser}" onchange="W.IN.find(x=>x.id==='${d.id}').lines[${i}].ser=this.value">`:l.ser}</td><td>${ed?`<input class="inp" type="date" style="width:140px;padding:3px 6px" value="${l.exp}" onchange="W.IN.find(x=>x.id==='${d.id}').lines[${i}].exp=this.value;build()">${wDays(l.exp)<365?'<br><small style="color:var(--bad)">короткий срок: '+wDays(l.exp)+' дн.</small>':''}`:wEx(l.exp)}</td><td class="r">${l.qd}</td>
   <td class="r">${ed?`<input class="inp qi ${diff?'err':''}" inputmode="numeric" value="${l.qf==null?'':l.qf}" placeholder="—" onchange="wSetIn('${d.id}',${i},'qf',this.value)">`:l.qf}</td><td class="r">${ed?`<input class="inp qi" inputmode="numeric" value="${l.bad||''}" placeholder="0" onchange="wSetIn('${d.id}',${i},'bad',this.value)">`:l.bad||''}</td>
   <td class="r">${ed?`<input class="inp qi" inputmode="numeric" value="${l.cost}" onchange="wSetIn('${d.id}',${i},'cost',this.value)">`:tg(l.cost)}</td><td class="r" style="${mk>35||mk<15?'color:var(--bad)':''}">${mk}%</td><td class="r">${tg(it.p)}</td><td class="r">${tg((l.qf==null?l.qd:l.qf)*l.cost)}</td>
   <td>${it.cold?(ed?`<select class="inp" style="width:auto;padding:3px" onchange="wSetIn('${d.id}',${i},'t',this.value)">${[['','не проверено'],['ok','+4 °C, норма'],['нарушение','+11 °C, нарушение']].map(([v,n])=>`<option value="${v}" ${l.t===v?'selected':''}>${n}</option>`).join('')}</select>`:(l.t==='ok'?dot('ok','норма'):dot('bad',l.t||'—'))):'<span style="color:var(--muted2)">—</span>'}</td></tr>`}))}
  ${ed?`<div class="pb">${S.disc.length||S.coldBad?`<div class="say" style="margin-bottom:10px"><b>Расхождения: ${S.disc.length+S.coldBad}.</b> ${S.disc.map(l=>{const it=wIt(l.k);return l.extra?`${esc(it.n)} — пришёл без накладной (+${l.qf})`:l.qf<l.qd?`${esc(it.n)} — недовоз ${l.qd-l.qf} шт`:l.qf>l.qd?`${esc(it.n)} — излишек ${l.qf-l.qd} шт`:''}).filter(Boolean).concat(S.disc.filter(l=>l.bad).map(l=>`${esc(wIt(l.k).n)} — бой/брак ${l.bad} шт`)).concat(d.lines.filter(l=>wIt(l.k).cold&&l.t==='нарушение').map(l=>`${esc(wIt(l.k).n)} — нарушен температурный режим, партия в карантин`)).join('; ')}. При проведении создастся <b>акт расхождения</b> для поставщика.</div>`:''}
   <div class="btns"><button class="bt a" onclick="wPostIn('${d.id}')">Провести приход</button><button class="bt" onclick="xls('Акт приёмки ${d.id}')">Печать акта приёмки</button></div>
   <div class="note">Сумма по факту: <b>${tg(S.sum)}</b>. Позиции «холодной цепи» без отметки температуры провести нельзя. Наценка вне 15–35% подсвечена красным — проверьте цену закупа.</div></div>`:`<div class="pb note">Проведено: партии с сериями и сроками легли на остаток ${esc(W.L[d.loc])}, в журнале — строка на каждую позицию.${d.act?` Акт расхождения <b>${d.act}</b> отправлен поставщику.`:''}</div>`}</div>`}
 const newF=`<div class="pan"><h3>Новая накладная от поставщика</h3><div class="flt"><select class="inp" id="nn-s">${W.SUP.map(s=>`<option>${esc(s)}</option>`).join('')}</select>${wMine()?'':`<select class="inp" id="nn-l">${wLocOpts(W.C,false,true)}</select>`}<input class="inp" id="nn-n" placeholder="№ накладной поставщика" value="СФ-${12078+W.IN.length}"><button class="bt p" onclick="wNewIn()">Создать и начать приёмку</button></div><div class="pb note">Обычно товар приходит на центральный склад. Если поставщик везёт сразу в аптеку — выберите аптеку.</div></div>`;
 return `<div class="hd"><div><h2>Приход товара</h2><p>Накладная поставщика → сканер → факт, бой и пересорт → акт расхождения → проведение. Каждая строка становится партией с серией и сроком годности.</p></div><div class="btns"><button class="bt" onclick="go('order')">Заказы поставщикам</button></div></div>
 ${incoming.length?`<div class="pan"><h3>Едет к вам из центра и других аптек <small>${incoming.length}</small></h3>${tbl(['№','Откуда','Куда','Основание','>Позиций',''],incoming.map(m=>`<tr><td class="num">${m.id}</td><td>${esc(W.L[m.from])}</td><td>${esc(W.L[m.to])}</td><td>${esc(m.why)}</td><td class="r">${m.lines.length}</td><td><button class="bt s a" onclick="wAccM('${m.id}')">Принять</button></td></tr>`))}</div>`:''}
 ${body}<div class="g2">${list}${newF}</div>`};
function wSetIn(id,i,f,v){const d=W.IN.find(x=>x.id===id),l=d.lines[i];if(f==='t')l.t=v;else{const n=v===''?null:Math.max(0,Math.round(+v||0));if(f==='qf')l.qf=n;else l[f]=n||0}build()}
function wScan(id){const d=W.IN.find(x=>x.id===id),i=d.lines.findIndex(l=>l.qf==null);if(i<0){toast('Все строки отсканированы. Проверьте расхождения и проведите.');return}const l=d.lines[i],it=wIt(l.k);
 l.qf=i===2?l.qd-4:l.qd;if(it.cold&&!l.t)l.t='ok';build();toast(`Пик! <span class="mono">${it.bc}</span> — <b>${esc(it.n)}</b>: ${l.qf} из ${l.qd}${l.qf<l.qd?' — <b>недовоз '+(l.qd-l.qf)+' шт</b>':''}${it.cold?'. Термодатчик: +4 °C, норма':''}.`)}
function wFillIn(id){const d=W.IN.find(x=>x.id===id);d.lines.forEach(l=>{if(l.qf==null)l.qf=l.qd;if(wIt(l.k).cold&&!l.t)l.t='ok'});build();toast('Факт заполнен по накладной. Если что-то не сошлось — поправьте цифру в строке.')}
function wAddLine(id){const d=W.IN.find(x=>x.id===id),k=wV('in-k'),q=Math.max(1,+wV('in-q')||1),it=wIt(k);d.lines.push({k,qd:0,qf:q,bad:0,exp:wD(400),ser:wSer(it),cost:it.cost,t:it.cold?'':null,extra:1});build();toast(`Добавлена строка «${esc(it.n)}» × ${q} — товар пришёл, но его нет в накладной (пересорт). Попадёт в акт расхождения.`)}
function wNewIn(){const loc=wMine()?W.PHME:+wV('nn-l');const id='ПН-0'+(W.seq.pn++);W.IN.unshift({id,sup:wV('nn-s'),no:wV('nn-n')||'СФ-б/н',date:'26.11.2026',loc,st:'на приёмке',act:'',lines:[]});W.inCur=id;build();toast(`Накладная ${id} создана. Добавляйте строки сканером или вручную.`)}
function wPostIn(id){const d=W.IN.find(x=>x.id===id);if(!d.lines.length){toast('В накладной нет строк.');return}
 if(d.lines.some(l=>l.qf==null)){toast('Не все строки приняты: отсканируйте или нажмите «Всё сошлось».');return}
 if(d.lines.some(l=>wIt(l.k).cold&&!l.t)){toast('Отметьте температуру у позиций холодной цепи — без этого провести нельзя.');return}
 const S=wInStat(d);let n=0;
 d.lines.forEach(l=>{const good=Math.max(0,l.qf-(l.bad||0));if(wIt(l.k).cold&&l.t==='нарушение'){wLog('Карантин: нарушение холодовой цепи',d.id,l.k,d.loc,0,l.ser,0);return}
  if(good>0){wPut(l.k,d.loc,[{ser:l.ser,exp:l.exp,q:good,cost:l.cost}]);wLog('Приход',d.id,l.k,d.loc,good,l.ser,good*l.cost);n++}});
 if(S.disc.length||S.coldBad){d.act='АР-0'+(W.seq.ap++)}d.st='проведён';
 wDone(`Приход ${id} проведён: ${n} партий на остатке ${esc(W.L[d.loc])} на ${tg(S.sum)}.${d.act?` Создан акт расхождения <b>${d.act}</b> — поставщику уходит претензия.`:''}`)}

/* ===== РАСХОД И СПИСАНИЯ ===== */
const wOT={wo:'Списание',ret:'Возврат покупателя',dep:'Выдача в поликлинику',sup:'Возврат поставщику'};
SC.out=()=>{const t=W.outTab,loc=wMine()?W.PHME:(W.outLoc!=null?W.outLoc:(t==='sup'?W.C:t==='dep'?0:2));W.outLoc=loc;
 const k=W.outK&&wQ(W.outK,loc)>0?W.outK:(W.B.find(b=>b.loc===loc)||{}).k;
 const form={
  wo:`<label class="fld"><span>Причина</span><select class="inp" id="o-why">${['просрочка','бой','порча','недостача','пересорт','нарушение хранения'].map(x=>`<option>${x}</option>`).join('')}</select></label><label class="fld"><span>Комментарий для акта</span><input class="inp" id="o-note" placeholder="что случилось"></label><div class="note">Списание проходит утверждение: в аптеке — заведующая, на центральном складе — собственник. До утверждения остаток не меняется.</div>`,
  ret:`<label class="fld"><span>Чек продажи</span><input class="inp" id="o-note" value="Чек ${W.seq.ch-2}"></label><label class="fld"><span>Причина</span><select class="inp" id="o-why"><option>брак товара</option><option>ошибка кассира</option></select></label><div class="note">Лекарства надлежащего качества по закону обмену и возврату не подлежат — возврат только при браке или ошибке кассира. Товар с браком уходит в карантин, а не на полку.</div>`,
  dep:`<label class="fld"><span>Куда</span><select class="inp" id="o-why">${W.DEP.map(x=>`<option>${x}</option>`).join('')}</select></label><label class="fld"><span>Кто получил</span><input class="inp" id="o-note" value="м/с Айнур"></label><div class="note">Расходники и препараты для процедур уходят в поликлинику по требованию — себестоимость попадает в расходы платного приёма.</div>`,
  sup:`<label class="fld"><span>Поставщик</span><select class="inp" id="o-why">${W.SUP.map(x=>`<option>${x}</option>`).join('')}</select></label><label class="fld"><span>Партия (серия)</span><select class="inp" id="o-ser">${W.B.filter(b=>b.k===k&&b.loc===loc).map(b=>`<option value="${b.ser}">${b.ser} · до ${wF(b.exp)} · ${b.q} шт</option>`).join('')}</select></label><label class="fld"><span>Основание</span><input class="inp" id="o-note" value="короткий срок годности"></label>`}[t];
 const docs=W.OUT.filter(d=>(t==='all'||d.type===t)&&(!wMine()||d.loc===W.PHME));
 return `<div class="hd"><div><h2>Расход и списания</h2><p>Всё, что уходит со склада не через кассу: списания по акту с утверждением, возвраты покупателей и поставщикам, выдача в поликлинику. Списание идёт с партии с ближайшим сроком.</p></div><button class="bt" onclick="go('pos')">Продажа — в кассе аптеки →</button></div>
 ${wTabs([['wo','Списание'],['ret','Возврат покупателя'],['dep','Выдача в поликлинику'],['sup','Возврат поставщику'],['all','Все документы']],t,'wOutTab')}
 ${t==='all'?'':`<div class="g21"><div class="pan"><h3>${wOT[t]} · новый документ</h3><div class="pb">
  <label class="fld"><span>Откуда</span>${wLocSel(loc,"W.outLoc=+this.value;build()",false,true)}</label>
  <label class="fld"><span>Товар</span><select class="inp" id="o-k" onchange="W.outK=this.value;${t==='sup'?'build()':''}">${t==='ret'?wItOpts(k):wItOpts(k,loc)}</select></label>
  <label class="fld"><span>Количество</span><input class="inp" id="o-q" value="1" inputmode="numeric"></label>${form}
  <div class="btns l"><button class="bt a" onclick="wOutCreate('${t}')">${t==='wo'?'Создать акт списания':t==='ret'?'Оформить возврат':t==='dep'?'Выдать':'Оформить возврат поставщику'}</button></div></div></div>
  <div class="pan"><h3>Подсказка</h3><div class="pb">${t==='wo'?`Просроченных партий: <b>${W.B.filter(b=>wDays(b.exp)<0&&(!wMine()||b.loc===W.PHME)).length}</b> на ${tg(wSum(W.B.filter(b=>wDays(b.exp)<0&&(!wMine()||b.loc===W.PHME)).map(b=>b.q*b.cost)))}. <button class="bt s" onclick="W.expB='0';go('exp')">Открыть сроки</button>`:t==='dep'?`За ноябрь выдано в поликлинику на <b>${tg(wSum(W.OUT.filter(d=>d.type==='dep').map(d=>d.s)))}</b>.`:t==='sup'?'Возвращайте поставщику товар с коротким сроком заранее — до 3–6 месяцев до истечения, по договору поставки.':'Возврат по чеку: система найдёт, из какой партии был продан товар.'}</div></div></div>`}
 <div class="pan"><h3>Документы <small>${docs.length}</small></h3>${docs.length?tbl(['№','Тип','Дата','Точка','Товар','>Кол-во','>Сумма','Причина / куда','Статус',''],docs.map(d=>`<tr><td class="num">${d.id}</td><td>${wOT[d.type]}</td><td class="num">${d.date}</td><td>${esc(W.L[d.loc])}</td><td>${wNm(wIt(d.k))}</td><td class="r">${d.q}</td><td class="r">${tg(d.s)}</td><td>${esc(d.why)}${d.note?'<br><small style="color:var(--muted)">'+esc(d.note)+'</small>':''}</td><td>${d.st==='на утверждении'?dot('warn','на утверждении'):d.st==='отклонён'?dot('bad','отклонён'):dot('ok',d.st)}</td><td>${d.st==='на утверждении'?`<button class="bt s a" onclick="wApprove('${d.id}')">Утвердить</button> <button class="bt s" onclick="wReject('${d.id}')">Отклонить</button>`:''}</td></tr>`)):'<div class="pb note">Документов этого типа пока нет.</div>'}</div>`};
function wOutTab(t){W.outTab=t;W.outLoc=null;build()}
function wOutCreate(t){const loc=W.outLoc,k=wV('o-k'),q=Math.max(1,Math.round(+wV('o-q')||1)),it=wIt(k),why=wV('o-why'),note=wV('o-note');if(!it){toast('Выберите товар.');return}
 if(t!=='ret'&&wQ(k,loc)<q){toast(`На остатке только ${wQ(k,loc)} шт — больше списать нельзя.`);return}
 if(t==='wo'){const id='СП-0'+(W.seq.sp++);W.OUT.unshift({id,type:'wo',date:'26.11',loc,k,q,why,note,st:'на утверждении',s:q*it.cost});wDone(`Акт ${id} создан и ждёт утверждения ${loc===W.C?'собственника':'заведующей'}. Остаток пока не изменился.`);return}
 if(t==='ret'){const id='ВЗ-0'+(W.seq.vz++);const ser=(W.B.find(b=>b.k===k&&b.loc===loc)||{ser:wSer(it)}).ser;
  if(why==='брак товара'){W.OUT.unshift({id,type:'ret',date:'26.11',loc,k,q,why,note:note+' · в карантин',st:'проведён',s:q*it.p});wLog('Возврат покупателя → карантин',id,k,loc,0,ser,0)}
  else{wPut(k,loc,[{ser,exp:wNear(k,loc)||wD(300),q}]);W.OUT.unshift({id,type:'ret',date:'26.11',loc,k,q,why,note,st:'проведён',s:q*it.p});wLog('Возврат покупателя',id,k,loc,q,ser)}
  wDone(`Возврат ${id}: ${tg(q*it.p)} покупателю. ${why==='брак товара'?'Товар ушёл в карантин и на возврат поставщику.':'Товар вернулся на остаток.'}`);return}
 if(t==='dep'){const id='ВП-'+(W.seq.vp++);const r=wTake(k,loc,q);W.OUT.unshift({id,type:'dep',date:'26.11',loc,k,q,why,note,st:'проведён',s:wSum(r.parts.map(p=>p.q*p.cost))});r.parts.forEach(p=>wLog('Выдача в поликлинику',id,k,loc,-p.q,p.ser,p.q*p.cost));wDone(`${id}: выдано ${q} шт в «${esc(why)}» из партии ${r.parts.map(p=>p.ser).join(', ')}.`);return}
 if(t==='sup'){const id='ВЗ-0'+(W.seq.vz++);const ser=wV('o-ser');const r=wTake(k,loc,q,{ser,exp:true});if(!r.parts.length){toast('В этой партии нет столько товара.');return}W.OUT.unshift({id,type:'sup',date:'26.11',loc,k,q:q-r.short,why,note:note+' · серия '+ser,st:'отправлен',s:wSum(r.parts.map(p=>p.q*p.cost))});r.parts.forEach(p=>wLog('Возврат поставщику',id,k,loc,-p.q,p.ser,p.q*p.cost));wDone(`${id}: ${q-r.short} шт серии ${ser} возвращены в ${esc(why)}. Сумма ${tg(wSum(r.parts.map(p=>p.q*p.cost)))} — в счёт следующей поставки.`)}}
function wApprove(id){const d=W.OUT.find(x=>x.id===id);if(!d||d.st!=='на утверждении')return;const r=wTake(d.k,d.loc,d.q,{exp:true,expFirst:d.why==='просрочка'});
 r.parts.forEach(p=>wLog('Списание: '+d.why,d.id,d.k,d.loc,-p.q,p.ser,p.q*p.cost));d.st='утверждён';d.s=wSum(r.parts.map(p=>p.q*p.cost));
 wDone(`Акт ${id} утверждён (${esc(wUser())}). Списано ${d.q-r.short} шт на ${tg(d.s)}${r.parts.length?', серии '+r.parts.map(p=>p.ser).join(', '):''}.`)}
function wReject(id){const d=W.OUT.find(x=>x.id===id);if(d)d.st='отклонён';wDone(`Акт ${id} отклонён — остаток не изменился.`)}

/* ===== ПЕРЕМЕЩЕНИЯ ===== */
function wSugg(){const out=[];W.I.forEach(it=>{for(let to=0;to<7;to++){const qt=wQ(it.k,to);if(!(it.s30[to]>0&&qt<it.mn[to]))continue;
  let best=null;for(let fr=0;fr<7;fr++){if(fr===to)continue;const q=wQ(it.k,fr)-wRes(it.k,fr);if(q<=0)continue;const cover=it.s30[fr]?q/(it.s30[fr]/30):999;if(cover>45&&(!best||cover>best.cover))best={fr,q,cover}}
  if(best){const need=Math.max(it.mn[to]*2-qt,1);out.push({k:it.k,fr:best.fr,to,q:Math.min(need,Math.max(1,Math.floor(best.q*(it.s30[best.fr]?0.6:1)))),why:it.s30[best.fr]?`лежит на ${Math.round(best.cover)} дн. продаж`:`не продаётся ${it.lm[best.fr]} дн.`,sum:0})}}});
 out.forEach(s=>s.sum=s.q*wIt(s.k).cost);return out.sort((a,b)=>b.sum-a.sum).slice(0,10)}
SC.move=()=>{const mv=W.MV.filter(m=>!wMine()||m.from===W.PHME||m.to===W.PHME);const sg=wSugg().filter(s=>!wMine()||s.fr===W.PHME||s.to===W.PHME);const ST=['создано','собрано','в пути','принято'];
 return `<div class="hd"><div><h2>Перемещения</h2><p>Между аптеками и из центра: создано → собрано (товар списан с отправителя по партиям) → в пути → принято (с проверкой факта). Перед закупкой система ищет товар в соседних аптеках.</p></div></div>
 <div class="pan"><h3>Система предлагает: забрать излишки туда, где заканчивается <small>${sg.length} предложений · ${tg(wSum(sg.map(s=>s.sum)))} не придётся закупать</small></h3>${sg.length?tbl(['Препарат','Откуда','Почему там лишнее','Куда','Там остаток / мин.','>Кол-во',''],sg.map((s,i)=>{const it=wIt(s.k);return `<tr><td>${wNm(it)}</td><td>${esc(W.L[s.fr])}</td><td>${esc(s.why)}</td><td>${esc(W.L[s.to])}</td><td class="r" style="color:var(--bad)">${wQ(s.k,s.to)} / ${it.mn[s.to]}</td><td class="r"><b>${s.q}</b></td><td><button class="bt s a" onclick="wMkMove('${s.k}',${s.fr},${s.to},${s.q},'излишек → спрос')">Создать</button></td></tr>`})):'<div class="pb note">Излишков, которые можно перекинуть, сейчас нет.</div>'}</div>
 <div class="g21"><div class="pan"><h3>Документы перемещения <small>${mv.length}</small></h3>${tbl(['№','Откуда → куда','Основание','Позиции','Этап',''],mv.map(m=>{const si=ST.indexOf(m.st);return `<tr class="${m.st==='принято'?'dim':''}"><td class="num">${m.id}<br><small>${m.date}</small></td><td>${esc(W.L[m.from])} → ${esc(W.L[m.to])}</td><td>${esc(m.why)}</td><td>${m.lines.map(l=>esc(wIt(l.k).n)+' × '+l.q+(l.qf!=null&&l.qf!==l.q?` <b style="color:var(--bad)">(факт ${l.qf})</b>`:'')).join('<br>')}</td><td><div class="steps">${ST.map((x,j)=>`<span class="${j<si?'dn':j===si?'on':''}">${x}</span>`).join('')}</div>${m.act?'<small>акт '+m.act+'</small>':''}</td><td>${m.st==='создано'&&(!wMine()||m.from===W.PHME)?`<button class="bt s p" onclick="wPick('${m.id}')">Собрать</button>`:m.st==='собрано'&&(!wMine()||m.from===W.PHME)?`<button class="bt s p" onclick="wSend('${m.id}')">Отправить</button>`:m.st==='в пути'&&(!wMine()||m.to===W.PHME)?`<button class="bt s a" onclick="wAccM('${m.id}')">Принять</button>`:''}</td></tr>`}))}</div>
 <div class="pan"><h3>Новое перемещение</h3><div class="pb">${wMine()?`<label class="fld"><span>Откуда</span><span class="tag">${esc(W.L[W.PHME])}</span></label>`:`<label class="fld"><span>Откуда</span><select class="inp" id="m-f" onchange="W.mFrom=+this.value;build()">${wLocOpts(W.mFrom!=null?W.mFrom:W.C,false,true)}</select></label>`}
  <label class="fld"><span>Куда</span><select class="inp" id="m-t">${W.L.map((n,i)=>`<option value="${i}" ${i===0?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
  <label class="fld"><span>Товар</span><select class="inp" id="m-k">${wItOpts(null,wMine()?W.PHME:(W.mFrom!=null?W.mFrom:W.C))}</select></label>
  <label class="fld"><span>Количество</span><input class="inp" id="m-q" value="5" inputmode="numeric"></label>
  <div class="btns l"><button class="bt a" onclick="wMkMove(wV('m-k'),${wMine()?W.PHME:"(W.mFrom!=null?W.mFrom:W.C)"},+wV('m-t'),+wV('m-q'),'вручную')">Создать перемещение</button></div>
  <div class="note">Товар сразу встаёт в резерв у отправителя — его не продадут, пока он собирается.</div></div></div></div>`};
function wMkMove(k,fr,to,q,why){q=Math.max(1,Math.round(q||1));if(fr===to){toast('Откуда и куда совпадают.');return}const av=wQ(k,fr)-wRes(k,fr);if(av<q){toast(`Свободного остатка только ${av} шт.`);return}
 const id='ПМ-'+(W.seq.pm++);W.MV.unshift({id,from:fr,to,st:'создано',date:'26.11',why,lines:[{k,q,parts:[]}]});wDone(`Перемещение ${id} создано: ${esc(wIt(k).n)} × ${q}, ${esc(W.L[fr])} → ${esc(W.L[to])}. Товар в резерве.`,'move')}
function wQuickMove(k){const it=wIt(k);let fr=-1,to=-1,mx=-1,mn=1e9;for(let i=0;i<8;i++){const q=wQ(k,i);if(q>mx){mx=q;fr=i}}for(let i=0;i<7;i++){if(i===fr)continue;const sc=wQ(k,i)-it.s30[i];if(sc<mn){mn=sc;to=i}}if(mx<=1){toast('Перемещать нечего — остатки малы.');return}wMkMove(k,fr,to,Math.max(1,Math.min(Math.ceil(mx/3),Math.max(1,it.s30[to]))),'из карточки товара')}
function wPick(id){const m=W.MV.find(x=>x.id===id);let s=0;m.lines.forEach(l=>{const r=wTake(l.k,m.from,l.q);l.parts=r.parts;l.q=l.q-r.short;r.parts.forEach(p=>{wLog('Перемещение (отгрузка)',id,l.k,m.from,-p.q,p.ser,p.q*p.cost);s+=p.q*p.cost})});m.st='собрано';
 wDone(`${id} собрано: товар списан с ${esc(W.L[m.from])} по партиям (${m.lines.map(l=>l.parts.map(p=>p.ser).join(', ')).join('; ')}) на ${tg(s)}.`)}
function wSend(id){const m=W.MV.find(x=>x.id===id);m.st='в пути';wDone(`${id} в пути. ${esc(W.L[m.to])} видит его в «Приходе» и примет по факту.`)}
function wAccM(id){const m=W.MV.find(x=>x.id===id);if(!m)return;openM(`Приёмка ${id}`,`${esc(W.L[m.from])} → ${esc(W.L[m.to])} · ${esc(m.why)}`,`${tbl(['Товар','>Отправлено','>Принято'],m.lines.map((l,i)=>`<tr><td>${esc(wIt(l.k).n)}<br><small class="mono">${(l.parts||[]).map(p=>p.ser+' до '+wF(p.exp)).join(', ')}</small></td><td class="r">${l.q}</td><td class="r"><input class="inp qi" id="acc-${i}" value="${l.q}" inputmode="numeric"></td></tr>`))}<div class="note">Если пришло меньше — система создаст акт расхождения на отправителя.</div><div class="btns l"><button class="bt a" onclick="wAccDo('${id}')">Принять</button></div>`)}
function wAccDo(id){const m=W.MV.find(x=>x.id===id);let disc=0;m.lines.forEach((l,i)=>{const f=Math.max(0,Math.min(l.q,Math.round(+wV('acc-'+i)||0)));l.qf=f;let left=f;const parts=[];(l.parts||[]).forEach(p=>{const t=Math.min(p.q,left);if(t>0)parts.push(Object.assign({},p,{q:t}));left-=t});
 if(!parts.length&&f>0)parts.push({ser:wSer(wIt(l.k)),exp:wD(300),q:f,cost:wIt(l.k).cost});wPut(l.k,m.to,parts);parts.forEach(p=>wLog('Перемещение (приёмка)',id,l.k,m.to,p.q,p.ser,p.q*p.cost));if(f<l.q)disc+=l.q-f});
 m.st='принято';if(disc)m.act='АР-0'+(W.seq.ap++);const rq=W.REQ.find(r=>m.why.includes(r.id));if(rq)rq.st='принята аптекой';
 wDone(`${id} принято в ${esc(W.L[m.to])}. ${disc?`Недостача ${disc} шт — создан акт ${m.act} на отправителя.`:'Всё сошлось, остатки обновлены.'}`)}

/* ===== ИНВЕНТАРИЗАЦИЯ ===== */
SC.inv=()=>{const a=W.INV.find(x=>x.st==='идёт'&&(!wMine()||x.loc===W.PHME));const hist=W.INV.filter(x=>x.st!=='идёт'&&(!wMine()||x.loc===W.PHME));
 let cur2='';
 if(a){const done=a.lines.filter(l=>l.f!=null).length,minus=a.lines.filter(l=>l.f!=null&&l.f<l.b),plus=a.lines.filter(l=>l.f!=null&&l.f>l.b);const sm=wSum(a.lines.filter(l=>l.f!=null).map(l=>(l.f-l.b)*wIt(l.k).cost));
  cur2=`<div class="say"><b>${a.id} · ${esc(W.L[a.loc])} · ${esc(a.type)}.</b> Пересчитано ${done} из ${a.lines.length}. Недостача: ${minus.length} поз., излишек: ${plus.length} поз., итог <b style="color:${sm<0?'var(--bad)':'var(--ok)'}">${sm>0?'+':''}${tg(sm)}</b>. Пока идёт пересчёт, продажи этих позиций фиксируются отдельно и учтутся при проведении.</div>
  <div class="pan"><h3>Лист пересчёта <small>${bar(done/a.lines.length*100,'p').replace('class="bar p"','class="bar p" style="width:160px;display:inline-block"')}</small></h3><div class="flt"><button class="bt p" onclick="wInvScan()">Сканировать следующую</button><button class="bt" onclick="wInvFill()">Остальные — как в учёте</button><button class="bt a" onclick="wInvPost()">Провести инвентаризацию</button><button class="bt" onclick="wInvCancel()">Отменить</button></div>
  ${tbl(['Препарат','Ближайший срок','>В учёте','>Факт','>Разница','>Сумма'],a.lines.map((l,i)=>{const it=wIt(l.k),df=l.f==null?null:l.f-l.b;return `<tr class="${df?'hl':''}"><td>${wNm(it)}</td><td>${wEx(wNear(l.k,a.loc))}</td><td class="r">${l.b}</td><td class="r"><input class="inp qi ${df?'err':''}" id="iv-${i}" inputmode="numeric" value="${l.f==null?'':l.f}" placeholder="—" onchange="wInvSet(${i},this.value)"></td><td class="r" style="color:${df<0?'var(--bad)':df>0?'var(--ok)':'inherit'}">${df==null?'':(df>0?'+':'')+df}</td><td class="r">${df?tg(df*it.cost):''}</td></tr>`}))}</div>`}
 else cur2=`<div class="pan"><h3>Начать инвентаризацию</h3><div class="pb"><label class="fld"><span>Где</span>${wLocSel(W.invLoc!=null?W.invLoc:W.PHME,"W.invLoc=+this.value",false,true)}</label>
  <label class="fld"><span>Вид</span><select class="inp" id="iv-t"><option value="sel">Выборочная — 12 позиций с риском (дорогие, рецептурные, с расхождениями)</option><option value="grp">По группе товаров</option><option value="full">Полная — все позиции точки</option></select></label>
  <label class="fld"><span>Группа (для «по группе»)</span><select class="inp" id="iv-g">${[...new Set(W.I.map(i=>i.grp))].map(g=>`<option>${esc(g)}</option>`).join('')}</select></label>
  <div class="btns l"><button class="bt a" onclick="wInvStart()">Сформировать лист пересчёта</button></div><div class="note">Лист формируется из учётных остатков на момент старта. Пересчитывать можно с телефона — сканер камерой.</div></div></div>`;
 return `<div class="hd"><div><h2>Инвентаризация</h2><p>Полная, выборочная или по группе. Пересчёт со сканером, расхождения в штуках и тенге, проведение — остатки выравниваются по факту, недостача и излишек попадают в журнал.</p></div></div>
 ${cur2}
 <div class="pan"><h3>История инвентаризаций <small>${hist.length}</small></h3>${hist.length?tbl(['№','Дата','Где','Вид','>Позиций','>Недостача','>Излишек','>Итог'],hist.map(x=>`<tr><td class="num">${x.id}</td><td class="num">${x.date}</td><td>${esc(W.L[x.loc])}</td><td>${esc(x.type)}</td><td class="r">${x.n}</td><td class="r">${x.minus}</td><td class="r">${x.plus}</td><td class="r" style="color:${x.sm<0?'var(--bad)':'var(--ok)'}">${x.sm>0?'+':''}${tg(x.sm)}</td></tr>`)):'<div class="pb note">Инвентаризаций ещё не было.</div>'}</div>`};
function wInvStart(){const loc=wMine()?W.PHME:(W.invLoc!=null?W.invLoc:W.PHME),t=wV('iv-t'),g=wV('iv-g');let its=W.I.filter(it=>wQ(it.k,loc)>0);
 if(t==='sel')its=its.sort((a,b)=>(b.rx-a.rx)||(b.p-a.p)).slice(0,12);if(t==='grp')its=its.filter(it=>it.grp===g);if(!its.length){toast('В этой точке нет остатков по выбранному условию.');return}
 W.INV.unshift({id:'ИНВ-0'+(W.seq.inv++),loc,type:t==='full'?'Полная':t==='grp'?'По группе «'+g+'»':'Выборочная',date:'26.11.2026',st:'идёт',lines:its.map(it=>({k:it.k,b:wQ(it.k,loc),f:null}))});build();toast('Лист пересчёта сформирован. Сканируйте полки по порядку.')}
function wInvA(){return W.INV.find(x=>x.st==='идёт'&&(!wMine()||x.loc===W.PHME))}
function wInvSet(i,v){const a=wInvA();a.lines[i].f=v===''?null:Math.max(0,Math.round(+v||0));build()}
function wInvScan(){const a=wInvA(),i=a.lines.findIndex(l=>l.f==null);if(i<0){toast('Все позиции пересчитаны — проведите инвентаризацию.');return}const l=a.lines[i];l.f=i%6===4?Math.max(0,l.b-1):i%11===7?l.b+1:l.b;build();toast(`Пик! ${esc(wIt(l.k).n)}: на полке ${l.f}, в учёте ${l.b}${l.f!==l.b?' — <b>расхождение '+(l.f-l.b)+'</b>':''}.`)}
function wInvFill(){const a=wInvA();a.lines.forEach(l=>{if(l.f==null)l.f=l.b});build();toast('Оставшиеся позиции заполнены учётными остатками.')}
function wInvCancel(){W.INV=W.INV.filter(x=>x!==wInvA());build();toast('Инвентаризация отменена, остатки не менялись.')}
function wInvPost(){const a=wInvA();if(a.lines.some(l=>l.f==null)){toast('Есть непересчитанные позиции. Отсканируйте или нажмите «Остальные — как в учёте».');return}
 let mi=0,pl=0,sm=0;a.lines.forEach(l=>{const d=l.f-l.b;if(!d)return;const it=wIt(l.k);if(d<0){const r=wTake(l.k,a.loc,-d,{exp:true});r.parts.forEach(p=>wLog('Инвентаризация: недостача',a.id,l.k,a.loc,-p.q,p.ser,p.q*p.cost));mi++}else{const b=W.B.filter(x=>x.k===l.k&&x.loc===a.loc).sort((x,y)=>x.exp<y.exp?1:-1)[0];wPut(l.k,a.loc,[{ser:b?b.ser:wSer(it),exp:b?b.exp:wD(300),q:d}]);wLog('Инвентаризация: излишек',a.id,l.k,a.loc,d,b?b.ser:'',d*it.cost);pl++}sm+=d*it.cost});
 Object.assign(a,{st:'проведена',n:a.lines.length,minus:mi,plus:pl,sm});wDone(`${a.id} проведена: недостача ${mi} поз., излишек ${pl} поз., итог ${tg(sm)}. Остатки выровнены по факту.`)}

/* ===== СРОКИ ГОДНОСТИ ===== */
const wBk=d=>d<0?'0':d<30?'1':d<90?'2':d<180?'3':'4';
SC.exp=()=>{const loc=wMine()?W.PHME:W.expLoc;const bs=W.B.filter(b=>(loc==='all'||b.loc===+loc));const BK=[['0','Просрочено','var(--bad)'],['1','До 30 дней','#d86a3a'],['2','30–90 дней','#d1a21f'],['3','90–180 дней','#7c9a4a']];
 const st=BK.map(([k])=>{const x=bs.filter(b=>wBk(wDays(b.exp))===k);return {n:x.length,s:wSum(x.map(b=>b.q*b.cost))}});
 const rows=bs.filter(b=>W.expB==='all'?wDays(b.exp)<90:wBk(wDays(b.exp))===W.expB).sort((a,c)=>a.exp<c.exp?-1:1);
 return `<div class="hd"><div><h2>Сроки годности</h2><p>Каждая партия видна с серией и датой. Светофор: что уже нельзя продавать, что надо срочно переместить туда, где продаётся, уценить или вернуть поставщику — пока не стало убытком.</p></div><div class="btns">${wMine()?'':`<select class="inp" style="width:auto" onchange="W.expLoc=this.value;build()">${wLocOpts(W.expLoc,true,true)}</select>`}</div></div>
 <div class="lights">${BK.map(([k,n,c],i)=>`<div class="lt ${W.expB===k?'on':''}" style="border-top-color:${c}" onclick="W.expB=W.expB==='${k}'?'all':'${k}';build()"><small>${n}</small><b>${st[i].n} парт.</b><i>${tg(st[i].s)} в закупе</i></div>`).join('')}</div>
 ${say(`Под риском (до 90 дней и просрочка): <b>${tg(st[0].s+st[1].s+st[2].s)}</b>. Система считает, успеет ли партия продаться в этой аптеке по текущим продажам, — и если нет, предлагает действие.`)}
 <div class="pan"><h3>${W.expB==='all'?'Под риском: просрочено и до 90 дней':BK.find(x=>x[0]===W.expB)[1]} <small>${rows.length} партий</small></h3>${tbl(['Препарат','Точка','Серия','Годен до','>Дней','>Кол-во','>Сумма','>Продажи 30 дн.','Успеет продаться?','Действия'],rows.map(b=>{const it=wIt(b.k),d=wDays(b.exp),sp=b.loc<7?it.s30[b.loc]:wSum(it.s30),can=d>0?Math.floor(sp/30*d):0,ok=can>=b.q;const i=W.B.indexOf(b);
  return `<tr><td>${wNm(it)}</td><td>${esc(W.L[b.loc])}</td><td class="mono">${b.ser}</td><td>${wEx(b.exp)}</td><td class="r">${d}</td><td class="r">${b.q}</td><td class="r">${tg(b.q*b.cost)}</td><td class="r">${sp}</td><td>${d<0?dot('bad','нельзя продавать'):ok?dot('ok','да'):dot('warn','нет, останется '+(b.q-can))}</td>
  <td><div class="btns">${d<0?`<button class="bt s a" onclick="wExpAct(${i},'wo')">Списать</button>`:`${!ok&&b.loc!==W.C?`<button class="bt s p" onclick="wExpAct(${i},'mv')">Переместить где продаётся</button>`:''}<button class="bt s" onclick="wExpAct(${i},'md')">${b.md?'Уценено −'+b.md+'%':'Уценить −20%'}</button>${d>=30?`<button class="bt s" onclick="wExpAct(${i},'sup')">Вернуть поставщику</button>`:''}`}</div></td></tr>`}))}</div>`};
function wExpAct(i,a){const b=W.B[i];if(!b)return;const it=wIt(b.k);
 if(a==='wo'){const id='СП-0'+(W.seq.sp++);W.OUT.unshift({id,type:'wo',date:'26.11',loc:b.loc,k:b.k,q:b.q,why:'просрочка',note:'серия '+b.ser+', годен до '+wF(b.exp),st:'на утверждении',s:b.q*b.cost});wDone(`Акт списания ${id} на ${b.q} шт серии ${b.ser} создан и ждёт утверждения. Партия заблокирована для продажи.`);return}
 if(a==='md'){if(b.md){toast('Партия уже уценена.');return}b.md=20;wLog('Уценка −20%','УЦ-'+b.ser,b.k,b.loc,0,b.ser,0);wDone(`Партия ${b.ser} уценена на 20%: на кассе ${esc(W.L[b.loc])} цена ${tg(it.p*0.8)} вместо ${tg(it.p)}.`);return}
 if(a==='mv'){let to=-1,best=-1;for(let j=0;j<7;j++){if(j===b.loc)continue;const sc=it.s30[j]-wQ(it.k,j)/2;if(sc>best){best=sc;to=j}}if(to<0||it.s30[to]===0){toast('Нет аптеки, где этот товар продаётся. Лучше уценить или вернуть поставщику.');return}
  const q=Math.min(b.q,Math.max(1,Math.ceil(it.s30[to]/30*Math.max(10,wDays(b.exp)-7))));const id='ПМ-'+(W.seq.pm++);const r=wTake(b.k,b.loc,q,{ser:b.ser});W.MV.unshift({id,from:b.loc,to,st:'собрано',date:'26.11',why:'короткий срок → где продаётся',lines:[{k:it.k,q,parts:r.parts}]});r.parts.forEach(p=>wLog('Перемещение (отгрузка)',id,it.k,b.loc,-p.q,p.ser,p.q*p.cost));
  wDone(`${id}: ${q} шт серии ${b.ser} собраны в ${esc(W.L[to])} — там продаётся ${it.s30[to]} в месяц и успеет уйти до ${wF(b.exp)}.`);return}
 if(a==='sup'){const id='ВЗ-0'+(W.seq.vz++);const q=b.q,ser=b.ser,s=q*b.cost;wTake(b.k,b.loc,q,{ser,exp:true});W.OUT.unshift({id,type:'sup',date:'26.11',loc:b.loc,k:it.k,q,why:W.SUP[0],note:'короткий срок · серия '+ser,st:'отправлен',s});wLog('Возврат поставщику',id,it.k,b.loc,-q,ser,s);wDone(`${id}: партия ${ser} (${q} шт, ${tg(s)}) возвращается поставщику в счёт следующей поставки.`)}}

/* ===== АВТОЗАКАЗ И ЗАКУП ===== */
const wNeed=i=>W.I.map(it=>{const q=wQ(it.k,i),sp=it.s30[i];if(!sp)return null;const cover=q/(sp/30);if(q>=it.mn[i]&&cover>=14)return null;const z=Math.max(0,Math.ceil(sp*0.7)-q);return z>0?{k:it.k,q:z,st:q,mn:it.mn[i],sp,cover:Math.round(cover)}:null}).filter(Boolean);
SC.order=()=>{const PHS=wMine()?[W.PHME]:[0,1,2,3,4,5,6];const reqs=W.REQ.filter(r=>!wMine()||r.ph===W.PHME);
 const blocks=PHS.map(i=>{const n=wNeed(i),sent=W.REQ.find(r=>r.ph===i&&r.st==='отправлена');return `<div class="pan"><h3>${esc(W.L[i])} <small>${n.length} строк · ${tg(wSum(n.map(x=>x.q*wIt(x.k).cost)))}</small></h3>${n.length?tbl(['Препарат','>Остаток','>Мин.','>Продажи 30 дн.','>Хватит, дн.','>Заказать','>В центре'],n.slice(0,wMine()?40:6).map(x=>{const it=wIt(x.k),c=wQ(x.k,W.C);return `<tr><td>${wNm(it)}</td><td class="r" style="color:var(--bad)">${x.st}</td><td class="r">${x.mn}</td><td class="r">${x.sp}</td><td class="r">${x.cover}</td><td class="r"><b>${x.q}</b></td><td class="r" style="${c<x.q?'color:var(--bad)':''}">${c}</td></tr>`}))+(n.length>(wMine()?40:6)?`<div class="pb note">и ещё ${n.length-(wMine()?40:6)} строк — полностью в заявке</div>`:''):'<div class="pb note">Всё выше минимума — заказывать нечего.</div>'}${n.length?`<div class="pb">${sent?dot('warn','заявка '+sent.id+' отправлена, центр собирает'):`<button class="bt a" onclick="wReq(${i})">Отправить заявку в центр</button>`}</div>`:''}</div>`}).join('');
 const cen=wMine()?'':(()=>{const lines=W.I.map(it=>{const c=wQ(it.k,W.C),dem=wSum(it.s30);if(!dem)return null;const tgt=Math.ceil(dem*1.5/10)*10;return c<dem?{k:it.k,c,dem,q:tgt-c}:null}).filter(Boolean);
  return `<div class="pan"><h3>Центральный склад: заказ поставщикам <small>${lines.length} строк · ${tg(wSum(lines.map(l=>l.q*wIt(l.k).cost)))}</small></h3>${tbl(['Препарат','>В центре','>Продажи сети 30 дн.','>Заказать','Поставщик'],lines.slice(0,12).map((l,i)=>`<tr><td>${wNm(wIt(l.k))}</td><td class="r" style="color:var(--bad)">${l.c}</td><td class="r">${l.dem}</td><td class="r"><b>${l.q}</b></td><td>${esc(W.SUP[i%4])}</td></tr>`))}<div class="pb"><button class="bt a" onclick="wPO()">Сформировать заказы поставщикам</button><div class="note">Заказ = запас на 1,5 месяца продаж всей сети минус остаток центра, округление до упаковки. По каждому поставщику создаётся ожидаемая накладная в «Приходе» — при поставке её останется только проверить сканером.</div></div></div>`})();
 return `<div class="hd"><div><h2>Автозаказ и закуп</h2><p>Аптеки не звонят в центр: система сама собирает заявку — всё, что ниже минимума или закончится раньше чем через 2 недели, до запаса на 3 недели по фактическим продажам этой аптеки.</p></div></div>
 ${reqs.length?`<div class="pan"><h3>Заявки аптек в центр <small>${reqs.length}</small></h3>${tbl(['№','Аптека','Дата','>Строк','>Сумма','Статус',''],reqs.map(r=>`<tr><td class="num">${r.id}</td><td>${esc(W.L[r.ph])}</td><td class="num">${r.date}</td><td class="r">${r.lines.length||'—'}</td><td class="r">${r.lines.length?tg(wSum(r.lines.map(l=>l.q*wIt(l.k).cost))):'—'}</td><td>${r.st==='отправлена'?dot('warn','ждёт центр'):dot('ok',r.st)}</td><td>${r.st==='отправлена'&&!wMine()?`<button class="bt s a" onclick="wShip('${r.id}')">Собрать и отгрузить</button>`:''}</td></tr>`))}</div>`:''}
 ${cen}${blocks}`};
function wReq(i){const n=wNeed(i);if(!n.length)return;const id='ЗК-0'+(W.seq.zk++);W.REQ.unshift({id,ph:i,date:'26.11',st:'отправлена',lines:n.map(x=>({k:x.k,q:x.q}))});wDone(`Заявка ${id} из ${esc(W.L[i])} ушла в центр: ${n.length} строк. Центр видит её сверху списка.`)}
function wShip(id){const r=W.REQ.find(x=>x.id===id);const mid='ПМ-'+(W.seq.pm++);const lines=[];let short=0;
 r.lines.forEach(l=>{const tk=wTake(l.k,W.C,l.q);short+=tk.short;if(tk.parts.length){lines.push({k:l.k,q:l.q-tk.short,parts:tk.parts});tk.parts.forEach(p=>wLog('Перемещение (отгрузка)',mid,l.k,W.C,-p.q,p.ser,p.q*p.cost))}});
 W.MV.unshift({id:mid,from:W.C,to:r.ph,st:'в пути',date:'26.11',why:'заявка '+id,lines});r.st='отгружена';
 wDone(`Заявка ${id} собрана: ${mid} едет в ${esc(W.L[r.ph])}, ${lines.length} позиций.${short?` Не хватило ${short} шт — эти строки попадут в заказ поставщику.`:''}`)}
function wPO(){const lines=W.I.map(it=>{const c=wQ(it.k,W.C),dem=wSum(it.s30);return dem&&c<dem?{k:it.k,q:Math.ceil(dem*1.5/10)*10-c}:null}).filter(Boolean);if(!lines.length){toast('Центр обеспечен — заказывать нечего.');return}
 const by={};lines.forEach((l,i)=>{const s=W.SUP[i%4];(by[s]=by[s]||[]).push(l)});let ids=[];
 Object.entries(by).forEach(([s,ls])=>{const id='ПН-0'+(W.seq.pn++);ids.push(id);W.IN.push({id,sup:s,no:'заказ ЗП-0'+(W.seq.zp++),date:'ожид. 28.11',loc:W.C,st:'ожидается',act:'',lines:ls.map(l=>{const it=wIt(l.k);return {k:l.k,qd:l.q,qf:null,bad:0,exp:wD(400+wr()*300),ser:wSer(it),cost:it.cost,t:it.cold?'':null}})})});
 wDone(`Создано ${ids.length} заказа поставщикам (${lines.length} строк). Ожидаемые накладные ${ids.join(', ')} — в «Приходе».`)}

/* ===== КАССА АПТЕКИ ===== */
SC.pos=()=>{const ph=wMine()?W.PHME:CPH;CPH=ph;const q=(W.posQ||'').toLowerCase();
 const its=W.I.filter(it=>wQ(it.k,ph)>0&&(!q||(it.n+' '+it.mnn+' '+it.bc).toLowerCase().includes(q))).slice(0,q?40:24);
 const price=(k)=>{const b=W.B.filter(b=>b.k===k&&b.loc===ph&&b.q>0&&wDays(b.exp)>=0).sort((a,c)=>a.exp<c.exp?-1:1)[0];return b?wIt(k).p*(1-b.md/100):wIt(k).p};
 const t=wSum(CART.map(c=>c.q*price(c.k)));
 return `<div class="hd"><div><h2>Касса аптеки · ${esc(W.L[ph])}</h2><p>Продажа списывает товар с партии с ближайшим сроком (FEFO). Просроченное пробить нельзя, уценённая партия — сразу со скидкой.</p></div>${wMine()?'':`<select class="inp" style="width:auto" onchange="CPH=+this.value;CART=[];build()">${PH.map((p,i)=>`<option value="${i}" ${i===ph?'selected':''}>${p}</option>`).join('')}</select>`}</div>
 <div class="g21"><div class="pan"><h3>Товары <small>в наличии</small></h3><div class="flt"><input class="inp" placeholder="Поиск: название, МНН, штрихкод" value="${esc(W.posQ||'')}" onchange="W.posQ=this.value;build()"><button class="bt" onclick="wPosScan()">Сканер</button></div>${tbl(['Препарат','>Цена','>Остаток','Срок',''],its.map(it=>{const b=W.B.filter(b=>b.k===it.k&&b.loc===ph).sort((a,c)=>a.exp<c.exp?-1:1)[0];return `<tr><td>${wNm(it)}</td><td class="r">${tg(price(it.k))}${b&&b.md?' <small style="color:var(--ok)">−'+b.md+'%</small>':''}</td><td class="r">${wQ(it.k,ph)}</td><td>${wEx(b&&b.exp)}</td><td><button class="bt s" onclick="wCartAdd('${it.k}')">+ в чек</button></td></tr>`}))}</div>
 <div class="pan"><h3>Чек №${W.seq.ch}</h3><div class="pb">${CART.length?CART.map(c=>{const it=wIt(c.k);return `<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px"><span>${esc(it.n)} × ${c.q}${it.rx?' <span class="rx">Rx</span>':''}</span><b class="num">${tg(c.q*price(c.k))}</b></div>`}).join(''):'<p class="note">Добавьте товары слева или отсканируйте.</p>'}
 ${CART.some(c=>wIt(c.k).rx)?'<div class="note">В чеке рецептурный препарат — кассир отмечает рецепт (№ и дата), иначе продажа не пройдёт.</div>':''}
 <div class="cart"><span>Итого</span><span class="num">${tg(t)}</span></div><div class="btns" style="margin-top:10px"><button class="bt a" onclick="wSell('Kaspi QR')">Kaspi QR</button><button class="bt p" onclick="wSell('Наличные')">Наличные</button><button class="bt" onclick="wSell('Карта')">Карта</button>${CART.length?'<button class="bt" onclick="CART=[];build()">Очистить</button>':''}</div>
 <div class="note">Возврат покупателя — в «Расход и списания».</div></div></div></div>`};
function wCartAdd(k){const ph=CPH,inc=CART.find(x=>x.k===k),have=W.B.filter(b=>b.k===k&&b.loc===ph&&wDays(b.exp)>=0).reduce((s,b)=>s+b.q,0);if((inc?inc.q:0)+1>have){toast('Больше нет годного остатка — просроченное продать нельзя.');return}if(inc)inc.q++;else CART.push({k,q:1});build()}
function wPosScan(){const ph=CPH,c=W.I.filter(it=>wQ(it.k,ph)>0);const it=c[(W.seq.ch*7)%c.length];wCartAdd(it.k);toast(`Пик! <span class="mono">${it.bc}</span> — ${esc(it.n)}`)}
function wSell(m){if(!CART.length){toast('Чек пустой — добавьте товар.');return}const ph=CPH,id='Чек '+(W.seq.ch++);let t=0,sers=[];
 CART.forEach(c=>{const it=wIt(c.k),r=wTake(c.k,ph,c.q);r.parts.forEach(p=>{const pr=it.p*(1-(p.md||0)/100);t+=p.q*pr;sers.push(p.ser);wLog('Продажа',id,c.k,ph,-p.q,p.ser,p.q*p.cost)});it.s30[ph]+=c.q});
 CART=[];wDone(`${id}: ${tg(t)} (${m}). Списано по FEFO из партий ${sers.join(', ')}. Остаток аптеки и центр обновились сразу.`)}

/* ===== ЖУРНАЛ ===== */
SC.jrn=()=>{const f=W.jf;const ops=[...new Set(W.J.map(j=>j.op))];const rows=W.J.filter(j=>(!f.t||j.op===f.t)&&(wMine()?j.loc===W.PHME:(f.loc==='all'||j.loc===+f.loc))&&(!f.q||wIt(j.k).n.toLowerCase().includes(f.q.toLowerCase())));
 return `<div class="hd"><div><h2>Журнал движений</h2><p>Каждое изменение остатка — отдельная строка: кто, когда, какой документ, какая партия. Ничего нельзя поменять «тихо».</p></div><button class="bt" onclick="xls('Журнал движений')">Выгрузить в Excel</button></div>
 <div class="pan"><div class="flt"><select class="inp" onchange="W.jf.t=this.value;build()"><option value="">Все операции</option>${ops.map(o=>`<option ${o===f.t?'selected':''}>${esc(o)}</option>`).join('')}</select>${wMine()?'':`<select class="inp" onchange="W.jf.loc=this.value;build()">${wLocOpts(f.loc,true,true)}</select>`}<input class="inp" placeholder="Товар" value="${esc(f.q)}" onchange="W.jf.q=this.value;build()"><span class="note" style="margin:0">${rows.length} строк · приход ${tg(wSum(rows.filter(j=>j.q>0).map(j=>j.s)))} · расход ${tg(wSum(rows.filter(j=>j.q<0).map(j=>j.s)))}</span></div>
 ${tbl(['Когда','Кто','Операция','Документ','Товар','Точка','Серия','>Кол-во','>Сумма, закуп'],rows.slice(0,80).map(j=>`<tr><td class="num">${j.t}</td><td>${esc(j.u)}</td><td>${esc(j.op)}</td><td class="num">${esc(j.doc)}</td><td>${wNm(wIt(j.k))}</td><td>${esc(W.L[j.loc])}</td><td class="mono">${esc(j.ser)}</td><td class="r" style="color:${j.q<0?'var(--bad)':j.q>0?'var(--ok)':'inherit'}">${j.q>0?'+':''}${j.q}</td><td class="r">${tg(j.s)}</td></tr>`))}</div>`};

/* ===== ОТЧЁТЫ СКЛАДА ===== */
function wABC(){const r=W.I.map(it=>({k:it.k,v:wSum(it.s30)*it.p})).sort((a,b)=>b.v-a.v);const tot=wSum(r.map(x=>x.v));let acc=0;const o={};r.forEach(x=>{acc+=x.v;o[x.k]=acc/tot<=.8?'A':acc/tot<=.95?'B':'C'});return o}
SC.abc=()=>{const t=W.repTab,abc=wABC();let body='';
 if(t==='abc'){const m={};['A','B','C'].forEach(a=>['X','Y','Z'].forEach(x=>m[a+x]={n:0,v:0}));W.I.forEach(it=>{const c=m[abc[it.k]+it.xyz];c.n++;c.v+=wSum(it.s30)*it.p});
  body=`<div class="g2"><div class="pan"><h3>Матрица ABC × XYZ <small>выручка 30 дней</small></h3>${tbl(['','X — ровный спрос','Y — колеблется','Z — случайный'],['A','B','C'].map(a=>`<tr><td><b>${a}</b></td>${['X','Y','Z'].map(x=>`<td style="background:${a+x==='AX'?'#e1f1e7':a+x==='CZ'?'#f8e2e2':'#fff'}">${m[a+x].n} поз.<br><small>${tg(m[a+x].v)}</small></td>`).join('')}</tr>`))}<div class="pb note">AX — основа выручки, держим всегда, минимум выше. CZ — кандидаты на вывод из ассортимента или заказ только под запрос.</div></div>
  <div class="pan"><h3>Что это значит для закупа</h3><div class="pb"><p style="margin-bottom:6px"><b>A (80% выручки):</b> ${W.I.filter(i=>abc[i.k]==='A').length} позиций — никогда не должно быть нуля.</p><p style="margin-bottom:6px"><b>CZ:</b> ${W.I.filter(i=>abc[i.k]==='C'&&i.xyz==='Z').map(i=>esc(i.n)).slice(0,6).join(', ')} — держат деньги.</p><p>Минимумы в автозаказе считаются по этим группам и продажам каждой аптеки.</p></div></div></div>
  <div class="pan">${tbl(['Препарат','Группа','>Продано 30 дн.','>Выручка','ABC','XYZ','>Неделя 1–4'],W.I.slice().sort((a,b)=>wSum(b.s30)*b.p-wSum(a.s30)*a.p).map(it=>`<tr><td>${wNm(it)}</td><td>${esc(it.grp)}</td><td class="r">${wSum(it.s30)}</td><td class="r">${tg(wSum(it.s30)*it.p)}</td><td><b>${abc[it.k]}</b></td><td>${it.xyz}</td><td class="r num">${it.w.join(' · ')}</td></tr>`))}</div>`}
 if(t==='turn'){body=`<div class="pan">${tbl(['Аптека','>Запас, закуп','>Продажи в день, закуп','>Оборачиваемость, дн.',''],[0,1,2,3,4,5,6].map(i=>{const st=wSum(W.B.filter(b=>b.loc===i).map(b=>b.q*b.cost)),pd=wSum(W.I.map(it=>it.s30[i]*it.cost))/30,d=pd?Math.round(st/pd):0;return `<tr><td>${esc(W.L[i])}</td><td class="r">${tg(st)}</td><td class="r">${tg(pd)}</td><td class="r" style="${d>45?'color:var(--bad);font-weight:700':''}">${d}</td><td style="width:30%">${bar(d/90*100,d>45?'p':'')}</td></tr>`}))}<div class="pb note">Норма для аптеки — 25–40 дней. Больше — заморожены деньги: смотрите «Неликвид» и предложения перемещений.</div></div>
  <div class="pan"><h3>Самые медленные позиции <small>дней запаса по сети</small></h3>${tbl(['Препарат','>Остаток сети','>Продажи 30 дн.','>Дней запаса','>Сумма'],W.I.map(it=>{const q=wSum([0,1,2,3,4,5,6].map(i=>wQ(it.k,i))),s=wSum(it.s30);return {it,q,s,d:s?Math.round(q/(s/30)):999}}).filter(x=>x.q>0).sort((a,b)=>b.d-a.d).slice(0,12).map(x=>`<tr><td>${wNm(x.it)}</td><td class="r">${x.q}</td><td class="r">${x.s}</td><td class="r" style="color:var(--bad)">${x.d===999?'нет продаж':x.d}</td><td class="r">${tg(x.q*x.it.cost)}</td></tr>`))}</div>`}
 if(t==='dead'){const rows=[];W.I.forEach(it=>[0,1,2,3,4,5,6].forEach(i=>{const q=wQ(it.k,i);if(q>0&&(it.s30[i]===0||it.lm[i]>=45))rows.push({it,i,q,d:it.lm[i]})}));
  body=`${say(`В аптеках лежит без движения 45+ дней: <b>${tg(wSum(rows.map(r=>r.q*r.it.cost)))}</b> в закупе (${rows.length} строк). Это деньги, которые центр отправил «на всякий случай».`)}<div class="pan">${tbl(['Препарат','Аптека','>Остаток','>Без движения, дн.','>Сумма','Где продаётся',''],rows.sort((a,b)=>b.q*b.it.cost-a.q*a.it.cost).map(r=>{const bi=r.it.s30.indexOf(Math.max(...r.it.s30));return `<tr><td>${wNm(r.it)}</td><td>${esc(W.L[r.i])}</td><td class="r">${r.q}</td><td class="r">${r.d}</td><td class="r">${tg(r.q*r.it.cost)}</td><td>${r.it.s30[bi]?esc(W.L[bi])+' · '+r.it.s30[bi]+'/мес':'нигде'}</td><td>${r.it.s30[bi]&&bi!==r.i?`<button class="bt s a" onclick="wMkMove('${r.it.k}',${r.i},${bi},${r.q},'неликвид → спрос')">Переместить</button>`:`<button class="bt s" onclick="W.outTab='sup';go('out')">Вернуть</button>`}</td></tr>`}))}</div>`}
 if(t==='mar'){body=`<div class="pan">${tbl(['Аптека','>Выручка 30 дн.','>Себестоимость','>Валовая прибыль','>Маржа','>Чеков (оценка)'],[0,1,2,3,4,5,6].map(i=>{const rv=wSum(W.I.map(it=>it.s30[i]*it.p)),cs=wSum(W.I.map(it=>it.s30[i]*it.cost));return `<tr><td>${esc(W.L[i])}</td><td class="r">${tg(rv)}</td><td class="r">${tg(cs)}</td><td class="r"><b>${tg(rv-cs)}</b></td><td class="r">${pct(rv-cs,rv)}%</td><td class="r">${Math.round(rv/2400)}</td></tr>`}))}<div class="pb note">Маржа по группам и по каждому товару — в выгрузке. Уценки и списания уменьшают маржу точки и видны отдельной строкой в отчёте собственника.</div></div>
  <div class="pan"><h3>Маржа по группам</h3>${tbl(['Группа','>Выручка','>Валовая прибыль','>Маржа'],[...new Set(W.I.map(i=>i.grp))].map(g=>{const its=W.I.filter(i=>i.grp===g),rv=wSum(its.map(it=>wSum(it.s30)*it.p)),cs=wSum(its.map(it=>wSum(it.s30)*it.cost));return {g,rv,cs}}).sort((a,b)=>b.rv-a.rv).map(x=>`<tr><td>${esc(x.g)}</td><td class="r">${tg(x.rv)}</td><td class="r">${tg(x.rv-x.cs)}</td><td class="r">${pct(x.rv-x.cs,x.rv)}%</td></tr>`))}</div>`}
 if(t==='flow'){body=`<div class="pan"><h3>Оборот склада за 30 дней <small>в закупочных ценах</small></h3>${tbl(['Точка','>Остаток на 27.10','>Приход','>Продажи','>Списания и прочий расход','>Остаток сейчас'],[0,1,2,3,4,5,6,7].map(i=>{const now=wSum(W.B.filter(b=>b.loc===i).map(b=>b.q*b.cost)),sold=i<7?wSum(W.I.map(it=>it.s30[i]*it.cost)):0,oth=wSum(W.J.filter(j=>j.loc===i&&j.q<0&&j.op!=='Продажа').map(j=>j.s))+(i===W.C?wSum(W.I.map(it=>wSum(it.s30)*it.cost))*0.95:Math.round(sold*0.012)),open=Math.round(now*(0.92+((i*37)%17)/100)),inc=now-open+sold+oth;return `<tr><td>${esc(W.L[i])}</td><td class="r">${tg(open)}</td><td class="r" style="color:var(--ok)">${tg(inc)}</td><td class="r">${tg(sold)}</td><td class="r">${tg(oth)}</td><td class="r"><b>${tg(now)}</b></td></tr>`}))}<div class="pb note">У центрального склада «прочий расход» — это отгрузки в аптеки. Остаток на начало + приход − расход = остаток сейчас: сверяется автоматически, расхождение = повод для инвентаризации.</div></div>`}
 return `<div class="hd"><div><h2>Отчёты склада</h2><p>Что приносит деньги, что лежит, сколько дней живёт товар и сколько зарабатывает каждая аптека. Всё считается из тех же партий и журнала — не из таблиц, которые кто-то заполняет вручную.</p></div><button class="bt" onclick="xls('Отчёт склада')">Выгрузить в Excel</button></div>
 ${wTabs([['abc','ABC / XYZ'],['turn','Оборачиваемость'],['dead','Неликвид'],['mar','Маржа по аптекам'],['flow','Оборот склада']],t,'wRep')}${body}`};
function wRep(t){W.repTab=t;build()}

/* сценарий показа: склад после обзора остатков */
(()=>{const i=TOUR.findIndex(x=>x[0]==='phd');TOUR.splice(i+1,0,['in','Приход: сканер, недовоз, холодовая цепь, акт расхождения'],['move','Перемещения: система сама находит излишки в соседней аптеке'],['inv','Инвентаризация со сканером и расхождениями в тенге'],['exp','Сроки годности: светофор и действия по каждой партии'])})();
wSync();
