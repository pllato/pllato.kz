export function normalizeDrops(value){
 if(!Array.isArray(value)||value.length>10000)throw Error('Слишком много отпусков / спусков');
 return value.map((d,i)=>{if(!d||typeof d.name!=='string'||d.name.length>200||!Number.isFinite(d.metres)||d.metres<0)throw Error('Укажите неотрицательную длину в метрах');return {name:d.name.trim()||'Спуск '+(i+1),metres:d.metres};});
}
export function dropsTotal(drops){const n=normalizeDrops(drops).reduce((sum,d)=>sum+d.metres,0);if(!Number.isFinite(n))throw Error('Слишком большая длина');return n;}
export function routeDrops(route){return route?.drops?normalizeDrops(route.drops):(route?.extraMetres?[{name:'Ранее заданный отпуск',metres:route.extraMetres}]:[]);}
export function ledgerClipboard(groups){const clean=s=>String(s||'').replace(/[\t\r\n]/g,' ');return ['Кабель\tСечение\tДлина, м',...groups.map(g=>[clean(g.brand),clean(g.section),g.length.toFixed(3).replace('.',',')].join('\t'))].join('\n');}
