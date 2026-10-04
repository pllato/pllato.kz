
/* ===== Общие ===== */
const SC={};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const dirm=k=>`<span class="dirm" style="--c:${DIRS[k].c}">${esc(DIRS[k].s)}</span>`;
const rst=k=>{const s=RSTOF(k);return `<span class="st" style="--sc:${s.c}">${esc(s.n)}</span>`};
const clL=id=>`<a class="lk" onclick="event.stopPropagation();pickCl('${id}')">${esc(CL(id).sh)}</a>`;
const ava=(t,c)=>`<span class="ava" style="--c:${c||'var(--brand)'}">${esc(t)}</span>`;
const ini=n=>n.replace(/ТОО|ИП|«|»/g,'').trim().split(/[\s-]+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const myDir=()=>ROLES[role].dir||null;
const vis=r=>!myDir()||r.dir===myDir();
function slaLeft(r){if(r.st==='done')return '<span class="pos">в срок</span>';if(r.st==='wait')return '<span class="mini">срок на паузе</span>';const [d,t]=r.sla.split(' ');const mins=daysBetween(TODAY,d)*1440+(+t.slice(0,2)*60+ +t.slice(3))-(+NOW.slice(0,2)*60+ +NOW.slice(3));if(mins<0)return `<span class="neg">просрочено ${Math.round(-mins/60)} ч</span>`;if(mins<240)return `<span class="warnt">${Math.floor(mins/60)} ч ${mins%60} мин</span>`;return `<span class="mini">${mins<1440?Math.round(mins/60)+' ч':Math.round(mins/1440)+' дн.'}</span>`}
function pickCl(id){if(!CL(id))return;curCl=id;CL(id).un=0;if(!SECK[SECOF[cur]].list||['inbox','board','clients'].includes(cur)){if(allowed('ws'))cur='ws'}build();toast(`Клиент: ${esc(CL(id).n)}. Всё рабочее место переключилось на него.`)}
function openReq(id){if(!RQ(id))return;curReq=id;curCl=RQ(id).cl;if(allowed('req')){cur='req';build()}else card('req',id)}
function reqSt(id,st){const r=RQ(id);r.st=st;if(st==='work'&&!r.msgs.some(m=>m[0]==='me'))r.msgs.push(['me',STAFF[r.resp],'Взял(а) в работу, вернусь с ответом в срок',NOW]);render();toast({work:'Заявка в работе — клиент видит статус в кабинете и приложении.',wait:'Статус «ждём клиента»: срок на паузе, клиенту — уведомление, что нужно от него.',check:'На проверке у руководителя направления.',done:'Готово: клиенту — уведомление и документы в кабинете. Попросим оценку.'}[st]||'')}
function sendMsg(id){const i=document.getElementById('msgin');if(!i||!i.value.trim())return;const r=RQ(id);r.msgs.push(['me',STAFF[ROLES[role].p]||'Сотрудник',i.value.trim(),NOW]);if(r.st==='new')r.st='work';render();toast('Отправлено — клиент получит push в приложении и сообщение в кабинете.')}

/* ===== Входящие ===== */
let inF='all',inDir='all';
SC.inbox=()=>{let L=REQS.filter(vis);if(inDir!=='all')L=L.filter(r=>r.dir===inDir);const F=L.filter(r=>inF==='all'?r.st!=='done':inF==='mine'?r.resp===ROLES[role].p:r.st===inF);
 const late=L.filter(r=>r.st!=='done'&&slaLeft(r).indexOf('просрочено')>=0).length;
 return `<div class="hd"><div><h2>Входящие заявки${myDir()?' · '+DIRS[myDir()].n:''}</h2><p>Каждый запрос клиента — заявка с направлением, ответственным и сроком ответа, а не сообщение в чьём-то WhatsApp. Клиент пишет из кабинета или приложения; ответ, документы и звонок — внутри заявки.</p></div><div class="btns"><button class="bt" onclick="go('board')">Доска</button><button class="bt p" onclick="card('newreq')">+ Заявка</button></div></div>
 <div class="wid"><div><small>Новые</small><b class="a">${L.filter(r=>r.st==='new').length}</b><span>ждут первого ответа</span></div><div><small>В работе</small><b>${L.filter(r=>r.st==='work').length}</b></div><div><small>Ждём клиента</small><b>${L.filter(r=>r.st==='wait').length}</b><span>срок на паузе</span></div><div><small>Просрочено</small><b class="${late?'r':'g'}">${late}</b></div><div><small>Первый ответ</small><b class="g">38 мин</b><span>в среднем за сентябрь</span></div></div>
 <div class="filt">${[['all','Открытые'],['mine','Мои'],['new','Новые'],['wait','Ждём клиента'],['done','Готово']].map(f=>`<button class="${inF===f[0]?'on':''}" onclick="inF='${f[0]}';render()">${f[1]}</button>`).join('')}${myDir()?'':`<span class="fsep"></span><button class="${inDir==='all'?'on':''}" onclick="inDir='all';render()">Все направления</button>${Object.keys(DIRS).map(k=>`<button class="${inDir===k?'on':''}" onclick="inDir='${k}';render()"><i class="sq" style="background:${DIRS[k].c}"></i>${DIRS[k].s}</button>`).join('')}`}</div>
 <div class="rql">${F.map(r=>{const c=CL(r.cl);return `<div class="rq ${r.pri?'pri':''}" style="--c:${DIRS[r.dir].c}" onclick="openReq('${r.id}')">${ava(ini(c.sh),DIRS[r.dir].c)}<div class="rqb"><div class="rqh"><b>${esc(r.t)}</b>${rst(r.st)}</div><span>${esc(c.n)} · <span class="mono">${r.id}</span> · ${esc(r.from)} · ${dd(r.d)} ${r.tm}</span>${r.msgs.length?`<em>${esc(r.msgs[r.msgs.length-1][2].slice(0,110))}</em>`:''}</div><div class="rqr">${dirm(r.dir)}<span>${STAFF[r.resp]}</span><b>${slaLeft(r)}</b></div></div>`}).join('')||'<p class="mini">Нет заявок по фильтру.</p>'}</div>
 ${said('«Каждый месяц бывают запросы. Мы хотим этим сервисом закрыть именно фактор WhatsApp — сейчас всё через WhatsApp, Telegram.»')}`};

/* ===== Заявка ===== */
const FLOWR=['new','work','wait','check','done'];
SC.req=()=>{let r=RQ(curReq);if(!r||!vis(r))r=REQS.find(vis);curReq=r.id;const c=CL(r.cl);
 return `<div class="crumb"><a onclick="go('inbox')">Входящие</a> / ${esc(c.sh)} / ${r.id}</div>
 <div class="hd"><div><h2>${esc(r.t)}</h2><p>${esc(c.n)} · ${dirm(r.dir)} · ответственный ${STAFF[r.resp]} · из «${esc(r.from)}» ${dl(r.d)} ${r.tm} · срок ответа: ${slaLeft(r)}</p></div><div class="btns"><button class="bt" onclick="callNow('audio','${c.id}')">Аудиозвонок</button><button class="bt" onclick="callNow('video','${c.id}')">Видео</button></div></div>
 <div class="steps">${FLOWR.map((k,i)=>`<div class="stp ${FLOWR.indexOf(r.st)>i?'done':r.st===k?'on':''}" onclick="reqSt('${r.id}','${k}')"><i>${i+1}</i>${RSTOF(k).n}</div>`).join('')}</div>
 <div class="g21"><div class="pan chatp"><h3>Переписка по заявке</h3><div class="chat">${r.msgs.map(m=>m[0]==='sys'?`<div class="msg sys">${esc(m[2])}<small>${m[3]}</small></div>`:`<div class="msg ${m[0]==='me'?'out':m[0]==='in'?'note':'in'}"><b>${esc(m[1])}</b>${esc(m[2])}<small>${m[3]}</small></div>`).join('')||'<p class="mini">Сообщений нет — заявка создана из формы.</p>'}</div>
  <div class="chs"><input id="msgin" placeholder="Ответ клиенту…" onkeydown="if(event.key==='Enter')sendMsg('${r.id}')"><button class="bt" onclick="toast('Внутренняя заметка видна только команде.')">Заметка</button><button class="bt p" onclick="sendMsg('${r.id}')">Отправить</button></div></div>
 <div><div class="pan"><h3>Документы</h3>${r.docs.map(f=>`<div class="file"><i>${f.split('.').pop().toUpperCase().slice(0,4)}</i><div><b>${esc(f)}</b><span>${f.indexOf('Замечания')===0||f.indexOf('Расчёт')===0||f.indexOf('Приказ')===0?'от команды':'от клиента'}</span></div></div>`).join('')||'<p class="mini">Пока нет.</p>'}<div class="btns l" style="margin-top:8px"><button class="bt p" onclick="aiFor('${r.id}')">Документ из шаблона с ИИ</button></div></div>
 <div class="pan"><h3>Клиент</h3>${[['Компания',esc(c.n)],['БИН/ИИН',`<span class="mono">${c.bin}</span>`],['Руководитель',esc(c.boss)],['Тариф',esc(c.tariff)],['Сотрудников',c.staff]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<button class="bt" style="margin-top:8px" onclick="pickCl('${c.id}')">Рабочее место клиента</button></div></div></div>`};

/* ===== Доска ===== */
SC.board=()=>{const L=REQS.filter(vis);
 return `<div class="hd"><div><h2>Доска заявок</h2><p>Все заявки по статусам; цвет полоски — направление. Перетаскивать не нужно: статус меняется кнопкой в заявке, клиент видит его сразу.</p></div></div>
 <div class="legend">${Object.values(DIRS).map(d=>`<span><i style="background:${d.c}"></i>${d.n}</span>`).join('')}</div>
 <div class="board">${RST.map(s=>{const C=L.filter(r=>r.st===s.k);return `<div class="bcol"><div class="bh" style="--c:${s.c}"><b>${s.n}</b><span>${C.length}</span></div>${C.map(r=>`<div class="oc" style="--c:${DIRS[r.dir].c}" onclick="openReq('${r.id}')"><div class="ocb">${dirm(r.dir)}<span class="mono">${r.id}</span></div><b>${esc(r.t)}</b><span>${esc(CL(r.cl).sh)} · ${STAFF[r.resp]}</span><div class="ocf"><em>${esc(r.from)}</em>${slaLeft(r)}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>`};
