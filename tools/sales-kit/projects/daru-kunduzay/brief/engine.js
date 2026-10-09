/* Движок опросника: отрисовка, автосохранение (браузер + сервер Pllato), пересылка раздела, итоговое ТЗ. */
const API='https://pllato-elc-worker.uurraa.workers.dev/api/public/brief/'+BRIEF.id;
const QS=new URLSearchParams(location.search);
const KEY=QS.get('key')||'';
try{if(KEY)localStorage.setItem('brief-key:'+BRIEF.id,KEY)}catch(e){}
const LS='brief:'+BRIEF.id;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let A={},META={},dirty={},saveT=null,srvOK=null,lastSave=null;
let view=QS.get('s')?'sec':(location.hash==='#tz'?'tz':'home'),cur=QS.get('s')||BRIEF.sections[0].k;
const who=()=>{try{return localStorage.getItem(LS+':who')||''}catch(e){return ''}};
const qk=(s,q)=>s.k+'.'+q.id;

function initVal(s,q){if(q.t==='tbl')return (q.rows||[['']]).map(r=>r.slice());if(q.t==='mu')return [];if(q.t==='yn')return {v:'',c:''};return ''}
function val(s,q){const k=qk(s,q);return A[k]!==undefined?A[k]:initVal(s,q)}
function filled(s,q){const v=A[qk(s,q)];if(v===undefined||v===null)return false;
 if(q.t==='tbl')return v.some(r=>r.slice(1).some(c=>String(c).trim()));if(q.t==='mu')return (v.items||v).length>0;if(q.t==='yn')return !!v.v;return String(v).trim().length>0}
function secPct(s){return Math.round(s.qs.filter(q=>filled(s,q)).length/s.qs.length*100)}
function totPct(){let a=0,b=0;BRIEF.sections.forEach(s=>s.qs.forEach(q=>{b++;if(filled(s,q))a++}));return Math.round(a/b*100)}
function totQ(){return BRIEF.sections.reduce((a,s)=>a+s.qs.length,0)}

/* ---- хранение ---- */
function loadLocal(){try{const r=JSON.parse(localStorage.getItem(LS)||'{}');A=r.answers||{};META=r.meta||{}}catch(e){}}
function saveLocal(){try{localStorage.setItem(LS,JSON.stringify({answers:A,meta:META}))}catch(e){}}
async function loadServer(){if(!KEY)return;try{const r=await fetch(API+'?key='+encodeURIComponent(KEY));if(!r.ok)throw 0;const d=await r.json();srvOK=true;
 Object.entries(d.answers||{}).forEach(([k,v])=>{if(A[k]===undefined)A[k]=v});META=Object.assign({},d.meta||{},META);lastSave=d.updatedAt;saveLocal()}catch(e){srvOK=false}}
function setA(k,v){A[k]=v;dirty[k]=v;saveLocal();status('pending');clearTimeout(saveT);saveT=setTimeout(push,1200);live();ring(k.split('.')[0]);const sk=k.split('.')[0],qq=Q(sk,k.split('.')[1]),el=document.getElementById('q_'+sk+'_'+qq.id);if(el)el.classList.toggle('done',filled(S(sk),qq))}
async function push(extraMeta){const patch=dirty;dirty={};
 const m=Object.assign({lastBy:who()||'',lastSection:cur},extraMeta||{});
 if(!KEY){status('local');return}
 try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:KEY,answers:patch,meta:m})});if(!r.ok)throw 0;const d=await r.json();srvOK=true;lastSave=d.updatedAt;status('ok')}
 catch(e){Object.assign(dirty,patch);srvOK=false;status('local')}}
function status(st){const el=document.getElementById('sv');if(!el)return;
 const t=lastSave?new Date(lastSave).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'';
 el.className='sv '+st;el.innerHTML=st==='pending'?'<i></i>Сохраняю…':st==='ok'?`<i></i>Сохранено в Pllato · ${t}`:st==='local'?'<i></i>Сохранено на этом устройстве':'<i></i>Готово к работе'}

/* ---- поля ---- */
function field(s,q){const k=qk(s,q),v=val(s,q),id='f_'+k.replace('.','_');
 if(q.t==='t')return `<input class="in" id="${id}" value="${esc(v)}" placeholder="${esc(q.ph||'')}" oninput="setA('${k}',this.value)">`;
 if(q.t==='ta')return `<textarea class="in ta" id="${id}" rows="3" placeholder="${esc(q.ph||'')}" oninput="setA('${k}',this.value);grow(this)">${esc(v)}</textarea>`;
 if(q.t==='num')return `<input class="in sm" type="number" value="${esc(v)}" oninput="setA('${k}',this.value)">`;
 if(q.t==='ch')return `<div class="chips">${q.o.map(o=>`<a class="chip ${v===o?'on':''}" onclick="setA('${k}',${JSON.stringify(o).replace(/"/g,'&quot;')});rq('${s.k}','${q.id}')">${esc(o)}</a>`).join('')}<input class="in other" placeholder="Свой вариант" value="${q.o.includes(v)?'':esc(v)}" onchange="setA('${k}',this.value);rq('${s.k}','${q.id}')"></div>`;
 if(q.t==='mu'){const arr=Array.isArray(v)?v:[];return `<div class="chips">${q.o.map(o=>`<a class="chip ${arr.includes(o)?'on':''}" onclick="tg('${k}',${JSON.stringify(o).replace(/"/g,'&quot;')},'${s.k}','${q.id}')">${arr.includes(o)?'✓ ':''}${esc(o)}</a>`).join('')}${arr.filter(x=>!q.o.includes(x)).map(x=>`<a class="chip on" onclick="tg('${k}',${JSON.stringify(x).replace(/"/g,'&quot;')},'${s.k}','${q.id}')">✓ ${esc(x)}</a>`).join('')}<input class="in other" placeholder="+ своё, Enter" onkeydown="if(event.key==='Enter'&&this.value.trim()){tg('${k}',this.value.trim(),'${s.k}','${q.id}')}"></div>`}
 if(q.t==='yn'){const o=v||{};return `<div class="chips">${['Да','Нет','Пока не знаю'].map(x=>`<a class="chip ${o.v===x?'on':''}" onclick="setA('${k}',{v:'${x}',c:(A['${k}']||{}).c||''});rq('${s.k}','${q.id}')">${x}</a>`).join('')}</div><input class="in" placeholder="Комментарий" value="${esc(o.c||'')}" oninput="setA('${k}',{v:(A['${k}']||{}).v||'',c:this.value})">`}
 if(q.t==='tbl'){const rows=v;return `<div class="tblw"><table class="tb"><thead><tr>${q.cols.map(c=>`<th>${esc(c)}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr>${q.cols.map((c,j)=>`<td><input value="${esc(r[j]||'')}" oninput="tc('${k}',${i},${j},this.value,'${s.k}','${q.id}')"></td>`).join('')}<td class="x"><a onclick="tr('${k}',${i},'${s.k}','${q.id}')" title="Удалить строку">×</a></td></tr>`).join('')}</tbody></table><a class="addrow" onclick="ta('${k}','${s.k}','${q.id}')">+ строка</a></div>`}
 return ''}
function S(k){return BRIEF.sections.find(s=>s.k===k)}
function Q(sk,id){return S(sk).qs.find(q=>q.id===id)}
function tg(k,o,sk,id){const a=Array.isArray(A[k])?A[k].slice():[];const i=a.indexOf(o);if(i>=0)a.splice(i,1);else a.push(o);setA(k,a);rq(sk,id)}
function tc(k,i,j,v,sk,id){const s=S(sk),q=Q(sk,id);const rows=val(s,q).map(r=>r.slice());while(rows[i].length<q.cols.length)rows[i].push('');rows[i][j]=v;A[k]=rows;setA(k,rows);ring(sk)}
function ta(k,sk,id){const s=S(sk),q=Q(sk,id);const rows=val(s,q).map(r=>r.slice());rows.push(q.cols.map(()=>''));setA(k,rows);rq(sk,id)}
function tr(k,i,sk,id){const s=S(sk),q=Q(sk,id);const rows=val(s,q).map(r=>r.slice());rows.splice(i,1);setA(k,rows.length?rows:[q.cols.map(()=>'')]);rq(sk,id)}
function takePre(sk,id){const s=S(sk),q=Q(sk,id);setA(qk(s,q),q.pre.replace(/^Со встречи:\s*/,'').replace(/^В демо:\s*/,''));rq(sk,id)}
function rq(sk,id){const s=S(sk),q=Q(sk,id);const el=document.getElementById('q_'+sk+'_'+id);if(el)el.outerHTML=qcard(s,q,s.qs.indexOf(q));ring(sk)}
function grow(t){t.style.height='auto';t.style.height=Math.min(400,t.scrollHeight+2)+'px'}
function qcard(s,q,i){const f=filled(s,q);return `<div class="qc ${f?'done':''}" id="q_${s.k}_${q.id}"><div class="qn"><b>${String(i+1).padStart(2,'0')}</b>${f?'<i>✓</i>':''}</div><div class="qb"><h3>${esc(q.q)}</h3>${q.why?`<p class="why">Зачем: ${esc(q.why)}</p>`:''}${q.pre&&q.t!=='tbl'?`<div class="pre"><span>Записали со встречи</span><p>${esc(q.pre.replace(/^Со встречи:\s*/,'').replace(/^В демо:\s*/,''))}</p>${q.t==='ta'||q.t==='t'?`<a onclick="takePre('${s.k}','${q.id}')">Верно — взять в ответ</a>`:''}</div>`:''}${q.pre&&q.t==='tbl'?`<div class="pre"><span>Записали со встречи</span><p>${esc(q.pre.replace(/^Со встречи:\s*/,''))}</p></div>`:''}${field(s,q)}</div></div>`}

/* ---- экраны ---- */
function ringSvg(p,sz){const r=(sz-6)/2,c=2*Math.PI*r;return `<svg class="ring" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}"><circle cx="${sz/2}" cy="${sz/2}" r="${r}" class="rb"/><circle cx="${sz/2}" cy="${sz/2}" r="${r}" class="rf" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p/100)}"/></svg>`}
function ring(sk){const s=S(sk),p=secPct(s);document.querySelectorAll(`[data-ring="${sk}"]`).forEach(el=>{el.innerHTML=ringSvg(p,+el.dataset.sz||34)+`<b>${p}</b>`});const t=totPct();document.querySelectorAll('[data-tot]').forEach(el=>el.textContent=t+'%');const b=document.getElementById('topbar');if(b)b.style.width=t+'%'}
function nav(){return `<aside class="nv"><div class="nvh"><b>Разделы</b><span><b data-tot>${totPct()}%</b> описано</span></div>${BRIEF.sections.map((s,i)=>`<a class="ni ${s.k===cur&&view==='sec'?'on':''}" onclick="openSec('${s.k}')"><span class="rg" data-ring="${s.k}" data-sz="30">${ringSvg(secPct(s),30)}<b>${secPct(s)}</b></span><span class="nt"><b>${i+1}. ${esc(s.n)}</b><em>${esc(s.who)}</em></span></a>`).join('')}<a class="ni fin ${view==='tz'?'on':''}" onclick="openTz()"><span class="rg">★</span><span class="nt"><b>Итоговое ТЗ</b><em>собирается из ответов</em></span></a></aside>`}
function hdr(){return `<header class="hb"><div class="lg">${LOGO}<b>Pllato</b><span>· ${esc(BRIEF.title)}</span></div><div class="hr"><span id="sv" class="sv"></span><a class="bt ghost" onclick="openHome()">Карта отделов</a></div><div class="topbar"><i id="topbar" style="width:${totPct()}%"></i></div></header>`}
function home(){const t=totPct();return `${hdr()}<main class="home"><section class="hero"><div class="hl"><span class="kick">Опросник для технического задания · клиника комплексного лечения</span><h1>${esc(BRIEF.client)}, давайте вместе опишем всю вашу клинику — <em>отдел за отделом</em></h1><p>По этим ответам мы соберём полное техническое задание: система будет устроена так, как работает ваш бизнес, а не наоборот. Часть ответов мы уже записали со встречи — их нужно только проверить. Ответы сохраняются сами; можно делать перерывы, возвращаться по той же ссылке и пересылать разделы руководителям отделов.</p><div class="hs"><div><b>${BRIEF.sections.length}</b><span>разделов</span></div><div><b>${totQ()}</b><span>вопросов</span></div><div><b>~60</b><span>минут на всё</span></div><div><b data-tot>${t}%</b><span>уже описано</span></div></div><div class="hbtns"><a class="bt p" onclick="openSec('${(BRIEF.sections.find(s=>secPct(s)<100)||BRIEF.sections[0]).k}')">${t?'Продолжить':'Начать'} →</a><a class="bt" onclick="openTz()">Посмотреть ТЗ</a></div></div>
 <div class="hr2">${ringSvg(t,190)}<div class="big"><b data-tot>${t}%</b><span>бизнеса описано</span></div></div></section>
 <h2 class="mh">Карта вашей компании</h2><p class="mp">Каждый блок — отдел или процесс. Нажмите, чтобы ответить, или перешлите раздел тому, кто знает лучше.</p>
 <div class="map">${BRIEF.sections.map((s,i)=>`<div class="mc ${secPct(s)===100?'full':''}" onclick="openSec('${s.k}')"><div class="mt"><span class="mi">${s.ic}</span><span class="rg" data-ring="${s.k}" data-sz="40">${ringSvg(secPct(s),40)}<b>${secPct(s)}</b></span></div><b>${i+1}. ${esc(s.n)}</b><span>${s.qs.length} вопросов · отвечает: ${esc(s.who)}</span><a class="fw" onclick="event.stopPropagation();share('${s.k}')">Переслать раздел ↗</a></div>`).join('')}</div></main>`}
function secView(){const s=S(cur),i=BRIEF.sections.indexOf(s),nx=BRIEF.sections[i+1];return `${hdr()}<div class="wrap">${nav()}<main class="sec"><div class="sh"><span class="kick">Раздел ${i+1} из ${BRIEF.sections.length} · отвечает: ${esc(s.who)}</span><h1>${s.ic} ${esc(s.n)}</h1><p>${esc(s.intro)}</p><div class="shb"><span class="rg" data-ring="${s.k}" data-sz="44">${ringSvg(secPct(s),44)}<b>${secPct(s)}</b></span><a class="bt ghost" onclick="share('${s.k}')">Переслать раздел руководителю ↗</a></div></div>
 ${s.qs.map((q,j)=>qcard(s,q,j)).join('')}
 <div class="nx">${i>0?`<a class="bt" onclick="openSec('${BRIEF.sections[i-1].k}')">← ${esc(BRIEF.sections[i-1].n)}</a>`:'<span></span>'}${nx?`<a class="bt p" onclick="push();openSec('${nx.k}')">Дальше: ${esc(nx.n)} →</a>`:`<a class="bt p" onclick="push({done:true});openTz()">Собрать итоговое ТЗ ★</a>`}</div></main>
 <aside class="lv"><div class="lvh"><span class="dot"></span>ТЗ собирается в реальном времени</div><div id="live">${tzSec(s)}</div></aside></div>`}
function fmtAns(q,v){if(v===undefined||v===null)return '';
 if(q.t==='tbl'){const rows=v.filter(r=>r.some(c=>String(c).trim()));if(!rows.length)return '';return `<table class="tzt"><tr>${q.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${q.cols.map((c,j)=>`<td>${esc(r[j]||'')}</td>`).join('')}</tr>`).join('')}</table>`}
 if(q.t==='mu')return (v||[]).length?`<ul>${v.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
 if(q.t==='yn')return v.v?`<p>${esc(v.v)}${v.c?' — '+esc(v.c):''}</p>`:'';
 return String(v).trim()?`<p>${esc(v).replace(/\n/g,'<br>')}</p>`:''}
function tzSec(s){const i=BRIEF.sections.indexOf(s);const items=s.qs.map(q=>{const a=fmtAns(q,A[qk(s,q)]);return a?`<div class="tzi"><b>${esc(q.q)}</b>${a}</div>`:''}).join('');return `<h3>${i+1}. ${esc(s.n)}</h3>${items||'<p class="emp">Пока пусто — начните отвечать, и раздел ТЗ появится здесь.</p>'}`}
function live(){const el=document.getElementById('live');if(el&&view==='sec')el.innerHTML=tzSec(S(cur))}
function tz(){const t=totPct();return `${hdr()}<main class="tzw"><div class="tzd"><div class="tzc"><span class="kick">Техническое задание · черновик из опросника</span><h1>${esc(BRIEF.title)}</h1><p>Заказчик: ${esc(A['about.name']||BRIEF.client)} · Исполнитель: Pllato · ${new Date().toLocaleDateString('ru-RU')}</p><div class="tzs"><div><b>${t}%</b><span>описано</span></div><div><b>${BRIEF.sections.filter(s=>secPct(s)===100).length} / ${BRIEF.sections.length}</b><span>разделов полностью</span></div><div><b>${BRIEF.sections.reduce((a,s)=>a+s.qs.filter(q=>filled(s,q)).length,0)} / ${totQ()}</b><span>ответов</span></div></div><div class="hbtns np"><a class="bt p" onclick="window.print()">Печать / PDF</a><a class="bt" onclick="push({done:true});toastB('ТЗ отправлено в Pllato. Мы получили ответы и вернёмся с вопросами, если что-то уточнить.')">Отправить в Pllato</a></div></div>
 ${BRIEF.sections.map(s=>`<section class="tzsec">${tzSec(s)}</section>`).join('')}</div></main>`}
function render(){document.getElementById('root').innerHTML=view==='home'?home():view==='tz'?tz():secView();status(srvOK===false?'local':srvOK?'ok':'idle');document.querySelectorAll('textarea').forEach(grow);try{history.replaceState(null,'',location.pathname+'?'+(KEY?'key='+KEY+'&':'')+(view==='sec'?'s='+cur:'')+(view==='tz'?'#tz':''))}catch(e){}}
function openSec(k){cur=k;view='sec';render();scrollTo(0,0)}
function openHome(){view='home';render();scrollTo(0,0)}
function openTz(){view='tz';render();scrollTo(0,0)}
function share(sk){const s=S(sk);const u=location.origin+location.pathname+'?'+(KEY?'key='+KEY+'&':'')+'s='+sk;
 const txt=`Здравствуйте! Помогите, пожалуйста, заполнить раздел «${s.n}» для техзадания нашей новой системы: ${u}`;
 try{navigator.clipboard.writeText(txt)}catch(e){}
 modal(`<h3>Переслать раздел «${esc(s.n)}»</h3><p>Ссылка ведёт сразу в этот раздел. Ответы появятся у вас в общем опроснике.</p><textarea class="in ta" rows="4" readonly>${esc(txt)}</textarea><div class="hbtns"><a class="bt p" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank">Отправить в WhatsApp</a><a class="bt" onclick="closeMod()">Скопировано ✓</a></div>`)}
function modal(h){let m=document.getElementById('mod');m.innerHTML=`<div class="mbx">${h}</div>`;m.classList.add('show');m.onclick=e=>{if(e.target===m)closeMod()}}
function closeMod(){document.getElementById('mod').classList.remove('show')}
function toastB(t){const el=document.getElementById('tst');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),5000)}
function askWho(){if(who())return;modal(`<h3>Кто заполняет?</h3><p>Чтобы в ТЗ было видно, кто описал раздел.</p><input class="in" id="whoin" placeholder="Имя и должность"><div class="hbtns"><a class="bt p" onclick="try{localStorage.setItem(LS+':who',document.getElementById('whoin').value.trim()||'—')}catch(e){};closeMod()">Начать</a></div>`)}
window.addEventListener('beforeunload',()=>{if(Object.keys(dirty).length&&KEY){try{navigator.sendBeacon&&fetch(API,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({key:KEY,answers:dirty,meta:{lastBy:who()}})})}catch(e){}}});
(async function(){loadLocal();render();await loadServer();render();if(QS.get('s'))askWho()})();
