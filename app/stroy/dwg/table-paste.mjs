// Plain clipboard TSV from Excel; never evaluate formulas or HTML.
export function validateTable(table){
 if(!table||!Array.isArray(table.cells)||!table.cells.length||table.cells.length>1000)throw Error('Таблица: от 1 до 1000 строк');
 const columns=table.cells[0]?.length;
 if(!columns||columns>20||table.cells.some(r=>!Array.isArray(r)||r.length!==columns||r.some(c=>typeof c!=='string'||c.length>1000)))throw Error('Таблица: до 20 столбцов, до 1000 символов в ячейке');
 return {cells:table.cells.map(r=>[...r]),header:table.header!==false};
}
// Excel quotes embedded tabs/newlines. Keep those as cell content, not columns.
export function parseTable(text,{header=true}={}){
 text=String(text).replace(/\r\n?/g,'\n');if(text.length>1000000)throw Error('Таблица слишком большая');
 const rows=[],row=[];let cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&(quoted||!cell)){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
 else if(!quoted&&(c==='\t'||c==='\n')){row.push(cell);cell='';if(c==='\n'){rows.push(row.splice(0));}}else cell+=c;}
 if(quoted)throw Error('Незакрытая кавычка в таблице');
 if(cell||row.length) {row.push(cell);rows.push(row);}if(!rows.length)throw Error('Скопируйте ячейки из Excel и вставьте сюда');
 const columns=Math.max(...rows.map(r=>r.length));for(const r of rows)while(r.length<columns)r.push('');return validateTable({cells:rows,header});
}
export function tablePages(table,{firstPageHeight=50}={}){
 const {cells,header}=validateTable(table),font=2.2,padding=.8;
 const desired=cells[0].map((_,i)=>Math.max(1,...cells.map(r=>Math.max(...r[i].split('\n').map(s=>s.length))))*font*.65+padding*2);
 const sum=desired.reduce((a,b)=>a+b,0),width=Math.min(200,sum),widths=desired.map(w=>width*w/sum),wrap=(s,w)=>{const n=Math.max(1,Math.floor((w-2*padding+1e-9)/(font*.65))),out=[];for(const line of s.split('\n')){if(!line)out.push('');else for(let i=0;i<line.length;i+=n)out.push(line.slice(i,i+n));}return out;};
 const rows=cells.map(r=>{const lines=r.map((s,i)=>wrap(s,widths[i]));return {lines,height:Math.max(...lines.map(a=>a.length))*font*1.45+padding*2};});
 if(rows.some(r=>r.height>170))throw Error('Слишком высокая строка: сократите текст или разделите её на несколько строк');
 // The existing plan starts at 65 mm: keep the first table below it.
 const pages=[];let page=[],height=0,limit=firstPageHeight;
 const push=()=>{pages.push({rows:page,widths,font,padding,height,width});page=header&&rows.length>1?[rows[0]]:[];height=page[0]?.height||0;limit=180;};
 for(let i=0;i<rows.length;i++){const r=rows[i];if(height+r.height>limit){push();if(i===0){page=[];height=0;}}if(height+r.height>180)throw Error('Строка не помещается вместе с заголовком');page.push(r);height+=r.height;}
 if(page.length)pages.push({rows:page,widths,font,padding,height,width});return pages;
}

export function parseCableTable(text){
 const lines=String(text).trim().split(/\r?\n/);if(lines.length>1001)throw Error('Не более 1000 строк');
 if(/(?:марка|кабель)/i.test(lines[0])&&/(?:длина|метр)/i.test(lines[0]))lines.shift();
 if(!lines.length)throw Error('Вставьте три столбца: марка, сечение, длина');
 return lines.map((line,i)=>{const cells=line.split('\t');if(cells.length!==3)throw Error('Строка '+(i+1)+': нужны 3 столбца из Excel');const [brand,section,raw]=cells.map(s=>s.trim()),length=Number(raw.replace(/\s/g,'').replace(',','.'));if(!brand||!section||!raw||!Number.isFinite(length)||length<0||brand.length>1000||section.length>1000)throw Error('Строка '+(i+1)+': проверьте марку, сечение и числовую длину');return {brand,section,length};});
}
