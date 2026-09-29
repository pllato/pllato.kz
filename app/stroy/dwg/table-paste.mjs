// Plain clipboard TSV from Excel; never evaluate formulas or HTML.
export function parseCableTable(text){
 const lines=String(text).trim().split(/\r?\n/);if(lines.length>1001)throw Error('Не более 1000 строк');
 if(/(?:марка|кабель)/i.test(lines[0])&&/(?:длина|метр)/i.test(lines[0]))lines.shift();
 if(!lines.length)throw Error('Вставьте три столбца: марка, сечение, длина');
 return lines.map((line,i)=>{const cells=line.split('\t');if(cells.length!==3)throw Error('Строка '+(i+1)+': нужны 3 столбца из Excel');const [brand,section,raw]=cells.map(s=>s.trim()),length=Number(raw.replace(/\s/g,'').replace(',','.'));if(!brand||!section||!raw||!Number.isFinite(length)||length<0||brand.length>1000||section.length>1000)throw Error('Строка '+(i+1)+': проверьте марку, сечение и числовую длину');return {brand,section,length};});
}
