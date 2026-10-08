// Shared, deterministic planning arithmetic. Never evaluates JavaScript from cells.
export const WEEK = 7 * 86400000;
export function weekStart(now=Date.now()) {
  const d=new Date(now+5*3600000); d.setUTCHours(14,0,0,0);
  d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+3)%7));
  let t=d.getTime()-5*3600000; if(t>now)t-=WEEK; return t;
}
export function weeksFrom(start,count=52){return Array.from({length:count},(_,i)=>({start:start+i*WEEK,end:start+(i+1)*WEEK}));}
export function defaultPlan(now=Date.now()) {return {revision:0,schemaVersion:2,start:weekStart(now)-8*WEEK,viewers:[],editors:[],cells:{},rules:{},rows:[
 {id:'income',name:'Доход из кассы',unit:'₸',kind:'income'},
 {id:'advertising',name:'Реклама',unit:'₸',kind:'expense'},
 {id:'promotion',name:'Продвижение',unit:'%',kind:'percentage',rate:10},
 {id:'tax',name:'Налоги',unit:'%',kind:'percentage',rate:2},
 {id:'accounting',name:'Бухгалтерское обслуживание',unit:'₸',kind:'expense'},
 {id:'ai_subscriptions',name:'Закупка подписок ИИ',unit:'₸',kind:'expense'},
 {id:'servers',name:'Сервера',unit:'₸',kind:'expense'},
 {id:'sales',name:'Выплаты продавцам',unit:'₸',kind:'expenseGroup'},
 {id:'profit',name:'Чистая прибыль',unit:'₸',kind:'profit'}]};}
// Rewrite references by row identity, including SUM ranges, when rows move.
export function remapPlanRows(plan,rows){
 const map=new Map(plan.rows.map((r,i)=>[i+1,rows.findIndex(n=>n.id===r.id)+1]));
 const reference=(col,n)=>map.get(+n)?col+map.get(+n):'#REF!';
 const cells={};for(const row of rows){const values=plan.cells[row.id];if(!values)continue;cells[row.id]={};
  for(const [key,raw] of Object.entries(values)){
   if(!String(raw).startsWith('=')){cells[row.id][key]=raw;continue;}
   const ranges=[];
   let formula=raw.toUpperCase().replace(/([A-Z]+)([1-9]\d*):\1([1-9]\d*)/g,(_,col,from,to)=>{
    if(+to<+from||+to-from>200)return '#REF!';
    const refs=[];for(let i=+from;i<=+to;i++)refs.push(reference(col,i));
    ranges.push(refs.join(','));return '@'+(ranges.length-1)+'@';
   }).replace(/([A-Z]+)([1-9]\d*)/g,(_,col,n)=>reference(col,n));
   cells[row.id][key]=formula.replace(/@(\d+)@/g,(_,i)=>ranges[+i]);
  }
 }const ruleCells=Object.fromEntries(Object.entries(plan.rules||{}).map(([id,values])=>[id,Object.fromEntries(Object.entries(values).map(([key,rule])=>[key,rule.mode==='formula'?rule.value:'']))]));
 const remappedRules=Object.keys(ruleCells).length?remapPlanRows({...plan,rules:{},cells:ruleCells},rows).cells:{};
 const rules=Object.fromEntries(rows.filter(r=>plan.rules?.[r.id]).map(r=>[r.id,Object.fromEntries(Object.entries(plan.rules[r.id]).map(([key,rule])=>[key,{...rule,...(rule.mode==='formula'?{value:remappedRules[r.id]?.[key]??rule.value}:{})}]))]));
 return {...plan,rows,cells,rules};
}
export function migratePlan(plan){
 if(plan.schemaVersion===2)return plan;
 const defaults=defaultPlan().rows,removed=new Set(['paid','planned','forecast','payoutPaid','payoutPlanned']);
 let rows=plan.rows.filter(r=>!removed.has(r.kind)).map(r=>['promotion','tax'].includes(r.id)?defaults.find(d=>d.id===r.id):r);
 for(const id of ['accounting','ai_subscriptions','servers','sales'])if(!rows.some(r=>r.id===id)){const i=rows.findIndex(r=>r.kind==='profit');rows.splice(i<0?rows.length:i,0,defaults.find(r=>r.id===id));}
 const next=remapPlanRows(plan,rows);delete next.cells.promotion;delete next.cells.tax;
 return {...next,schemaVersion:2,legacyRows:plan.rows,legacyCells:plan.cells};
}
export function payoutTotals(items,weeks){
  return weeks.map(w=>items.filter(p=>!p.deleted && Date.parse(p.date+'T00:00:00+05:00')>=w.start && Date.parse(p.date+'T00:00:00+05:00')<w.end)
    .reduce((a,p)=>{if(p.status==='paid'||p.status==='planned'){a[p.status]+=Number(p.amount)||0;const role=p.role||'Прочие выплаты';a.byRole??={};a.byRole[role]??={paid:0,planned:0};a.byRole[role][p.status]+=Number(p.amount)||0;}return a;},{paid:0,planned:0}));
}
export function columnName(index){let out='';for(let n=index+1;n;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out;}
export function formulaValue(raw,resolve){
  if(raw==null||raw==='')return 0;
  if(typeof raw==='number')return raw;
  let source=String(raw).trim();
  if(!source.startsWith('=')){const n=Number(source.replace(/\s/g,'').replace(',','.'));if(!Number.isFinite(n))throw Error('Введите число или формулу');return n;}
  source=source.slice(1).toUpperCase().replace(/\s/g,'');
  const tokens=source.match(/(?:\d+(?:\.\d*)?|\.\d+)|[A-Z]+[1-9]\d*|SUM|[+*/():,;%-]/g)||[];
  if(tokens.join('')!==source||tokens.length>200)throw Error('Некорректная формула');
  let i=0;
  const take=t=>tokens[i]===t?(i++,true):false;
  const expr=()=>{let n=term();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],v=term();n=op==='+'?n+v:n-v;}return n;};
  const term=()=>{let n=factor();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],v=factor();if(op==='/'&&v===0)throw Error('Деление на ноль');n=op==='*'?n*v:n/v;}return n;};
  const factor=()=>{let n;if(take('+'))n=factor();else if(take('-'))n=-factor();else if(take('(')){n=expr();if(!take(')'))throw Error('Закройте скобку');}
    else if(take('SUM')){if(!take('('))throw Error('SUM(...)');n=0;do{const a=tokens[i],b=tokens[i+2];if(tokens[i+1]===':'&&/^[A-Z]+\d+$/.test(a||'')&&/^[A-Z]+\d+$/.test(b||'')){i+=3;const x=a.match(/^([A-Z]+)(\d+)$/),y=b.match(/^([A-Z]+)(\d+)$/);if(x[1]!==y[1]||+y[2]<+x[2]||+y[2]-x[2]>200)throw Error('Диапазон должен быть в одном столбце');for(let r=+x[2];r<=+y[2];r++)n+=resolve(x[1]+r);}else n+=expr();}while(take(',')||take(';'));if(!take(')'))throw Error('Закройте SUM');}
    else {const t=tokens[i++];if(/^[A-Z]+[1-9]\d*$/.test(t||''))n=resolve(t);else if(t!=null&&/^\d|^\./.test(t))n=Number(t);else throw Error('Ожидалось число или ссылка');}
    if(take('%'))n/=100;return n;};
  const value=expr();if(i!==tokens.length||!Number.isFinite(value)||Math.abs(value)>1e15)throw Error('Некорректный результат');return value;
}
export function planCalculator(plan, income, payouts){
  const cache=new Map(),active=new Set();
  function value(rowIndex,col){
    const key=rowIndex+':'+col;if(cache.has(key))return cache.get(key);
    if(active.has(key)||active.size>200)throw Error('Циклическая формула');
    const row=plan.rows[rowIndex];if(!row||col<0||col>52)throw Error('Ссылка вне таблицы');active.add(key);
    try {let n=0;const cellKey=col===0?'benchmark':String(plan.start+(col-1)*WEEK);
      const raw=plan.cells[row.id]?.[cellKey];
      const resolve=ref=>{const [,letters,num]=ref.match(/^([A-Z]+)(\d+)$/);let c=0;for(const l of letters)c=c*26+l.charCodeAt(0)-64;return value(+num-1,letters==='R'?col:c-2);};
      const rule=col>0?effectiveRule(plan,row.id,+cellKey):null;
      if(row.kind==='expenseGroup'&&col>0){n=rule?formulaValue(rule.value,resolve):formulaValue(raw,resolve);if(rule?.mode==='percent')n=(income[col-1]||0)*n/100;plan.rows.forEach((r,i)=>{if(r.parentId===row.id)n+=value(i,col);});}
      else if(rule){n=formulaValue(rule.value,resolve);if(rule.mode==='percent')n=(income[col-1]||0)*n/100;}
      else if(row.kind==='percentage')n=col===0?row.rate:(income[col-1]||0)*row.rate/100;
      else if(col===0)n=formulaValue(raw,resolve);
      else if(row.kind==='expenseGroup'){plan.rows.forEach((r,i)=>{if(r.parentId===row.id)n+=value(i,col);});}
      else if(row.kind==='income')n=income[col-1]||0;
      else if(row.kind==='paid'||row.kind==='planned')n=payouts[col-1]?.[row.kind]||0;
      else if(row.kind==='payoutPaid'||row.kind==='payoutPlanned')n=payouts[col-1]?.byRole?.[row.sourceRole]?.[row.kind==='payoutPaid'?'paid':'planned']||0;
      else if(row.kind==='profit'||row.kind==='forecast'){
        n=value(plan.rows.findIndex(r=>r.kind==='income'),col);
        const paidIndex=plan.rows.findIndex(r=>r.kind==='paid');if(paidIndex>=0)n-=value(paidIndex,col);
        plan.rows.forEach((r,i)=>{if(r.parentId)return;if(r.kind==='expense'||r.kind==='tax'||r.kind==='percentage'||r.kind==='expenseGroup')n-=value(i,col);else if(r.kind==='extraIncome')n+=value(i,col);});
        if(row.kind==='forecast')n-=value(plan.rows.findIndex(r=>r.kind==='planned'),col);
      }else {n=formulaValue(raw==null&&row.kind==='tax'?plan.cells[row.id]?.benchmark:raw,resolve);
        if(row.kind==='tax')n=value(plan.rows.findIndex(r=>r.kind==='income'),col)*n/100;}
      if(!Number.isFinite(n)||Math.abs(n)>1e15)throw Error('Некорректный результат');cache.set(key,n);return n;
    } finally{active.delete(key);}
  }return value;
}

export function appendPayoutArticles(plan,entries){
 const rows=[...plan.rows];
 for(const role of [...new Set(entries.filter(e=>!e.deleted).map(e=>e.role||'Прочие выплаты'))].sort()){
  let hash=2166136261;for(const c of role)hash=Math.imul(hash^c.codePointAt(0),16777619)>>>0;
  for(const kind of ['payoutPaid','payoutPlanned'])if(!rows.some(r=>r.kind===kind&&r.sourceRole===role)&&rows.length<150)rows.push({id:kind+'_'+hash.toString(36),name:role+' · '+(kind==='payoutPaid'?'оплачено':'план'),unit:'₸',kind,sourceRole:role});
 }return {...plan,rows};
}

// Cash calculation mirrors the portal: paid receipts, USD rate and weekly overrides.
export function planningIncome(raw={},weeks){
 const sums=weeks.map(()=>0),rate=Math.max(1,Math.min(Number(raw.rate)||530,1000000));
 for(const [id,item] of Object.entries(raw.money||{}).slice(0,500)){
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id.trim()))continue;
  for(const pay of (Array.isArray(item?.pays)?item.pays:[]).slice(0,1000)){
   const amount=Math.max(0,Math.min(Number(pay?.sum)||0,1e12));
   const exact=Number.isFinite(Number(pay?.at))?Math.max(0,Number(pay.at)):0;
   const time=exact||(/^\d{4}-\d{2}-\d{2}$/.test(pay?.d||'')?Date.parse(pay.d+'T12:00:00+05:00'):0);
   const i=weeks.findIndex(w=>time>=w.start&&time<w.end);
   if(i>=0)sums[i]+=Math.round(amount*(item.cur==='USD'?rate:1));
  }
 }
 const overrides=Object.fromEntries(Object.entries(raw.chartOverrides||{}).slice(0,100));
 return weeks.map((w,i)=>{const key=new Date(w.end+5*3600000).toISOString().slice(0,10),v=overrides[key]?.cash;return Number.isFinite(Number(v))?Math.max(0,Math.round(Number(v))):sums[i];});
}

export function movePlanRow(plan,id,direction){
 const row=plan.rows.find(r=>r.id===id);if(!row)return plan;
 const siblings=plan.rows.filter(r=>(r.parentId||'')===(row.parentId||''));
 const i=siblings.findIndex(r=>r.id===id),j=i+direction;if(j<0||j>=siblings.length)return plan;
 [siblings[i],siblings[j]]=[siblings[j],siblings[i]];
 const top=row.parentId?plan.rows.filter(r=>!r.parentId):siblings;
 const rows=top.flatMap(r=>[r,...(r.id===row.parentId?siblings:plan.rows.filter(c=>c.parentId===r.id))]);
 return remapPlanRows(plan,rows);
}

// Change points apply forward only; later rules form the next boundary.
export function effectiveRule(plan,rowId,start){
 const times=Object.keys(plan.rules?.[rowId]||{}).map(Number).filter(t=>t<=start).sort((a,b)=>b-a);
 return times.length?{...plan.rules[rowId][times[0]],start:times[0]}:null;
}
export function setPlanRule(plan,rowId,start,rule){return {...plan,rules:{...(plan.rules||{}),[rowId]:{...(plan.rules?.[rowId]||{}),[start]:rule}}};}
