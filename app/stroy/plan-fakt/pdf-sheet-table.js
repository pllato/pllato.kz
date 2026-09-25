/* Whole-table clipboard replacement, independent of the selected cell. */
(function(){
'use strict';
let panel=null;
const config=()=>S.data?.pages[S.pageNum]?.sheetLayout;
function close(){panel?.remove();panel=null;}
function parse(text){
 const rows=[[]];let value='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else if(quoted||value==='')quoted=!quoted;else value+=ch;}else if(!quoted&&(ch==='\t'||ch==='\n'||ch==='\r')){rows.at(-1).push(value);value='';if(ch!=='\t'){if(ch==='\r'&&text[i+1]==='\n')i++;rows.push([]);}}else value+=ch;}
 rows.at(-1).push(value);if(rows.length>1&&rows.at(-1).length===1&&rows.at(-1)[0]==='')rows.pop();
 const width=Math.max(1,...rows.map(r=>r.length));return rows.map(r=>Array.from({length:width},(_,i)=>r[i]??''));
}
function open(){
 close();const c=config(),pn=S.pageNum;if(!c)return;
 const n=document.createElement('section');n.id='sheetTablePasteDialog';n.className='sheet-table-paste';n.setAttribute('role','dialog');n.innerHTML='<h3>Вставить таблицу из Excel целиком</h3><p>Выделите таблицу в Excel вместе с заголовками, скопируйте и вставьте сюда: ⌘V или Ctrl+V.</p><textarea id="sheetTablePasteInput" rows="5" placeholder="Вставьте скопированную таблицу"></textarea><p id="sheetTablePasteSize"></p><div id="sheetTablePastePreview"></div><p id="sheetTablePasteError" role="alert"></p><button id="sheetTablePasteApply" disabled>Заменить таблицу на листе</button><button id="sheetTablePasteCancel">Отмена</button><button id="sheetTablePasteImage">Вставить картинку таблицы</button><small>Весь диапазон заменяет прежнюю таблицу. После вставки можно редактировать отдельные ячейки. До 100 строк и 26 столбцов.</small>';
 document.body.append(n);panel=n;const q=id=>n.querySelector('#'+id),input=q('sheetTablePasteInput');let rows=[];
 function preview(){
  const raw=input.value;if(raw.length>200000){rows=[];q('sheetTablePasteApply').disabled=true;q('sheetTablePasteError').textContent='Слишком большой объём текста: до 200 000 символов.';q('sheetTablePastePreview').replaceChildren();return;}
  rows=raw.trim()?parse(raw):[];const error=rows.length>100||rows.some(r=>r.length>26);q('sheetTablePasteApply').disabled=!rows.length||error;q('sheetTablePasteError').textContent=error?'Допускается до 100 строк и 26 столбцов.':'';q('sheetTablePasteSize').textContent=rows.length?rows.length+' строк × '+rows[0].length+' столбцов':'';
  const host=q('sheetTablePastePreview');host.replaceChildren();if(error||!rows.length)return;const table=document.createElement('table');rows.forEach((row,i)=>{const tr=document.createElement('tr');row.forEach(value=>{const td=document.createElement(i?'td':'th');td.textContent=value;tr.append(td);});table.append(tr);});host.append(table);
 }
 input.oninput=preview;
 input.addEventListener('paste',e=>{
  const plain=e.clipboardData.getData('text/plain');if(plain)return;
  const html=e.clipboardData.getData('text/html');if(!html)return;const doc=new DOMParser().parseFromString(html,'text/html'),table=doc.querySelector('table');if(!table)return;
  e.preventDefault();input.value=[...table.rows].map(r=>[...r.cells].map(c=>'"'+c.textContent.replace(/"/g,'""')+'"').join('\t')).join('\n');preview();
 });
 q('sheetTablePasteApply').onclick=()=>{if(config()!==c||S.pageNum!==pn||!rows.length||q('sheetTablePasteApply').disabled)return;pushHistory();c.table=rows;c.tableImage=null;close();redrawAll();lkQueueDrawingSave();toast('Таблица из Excel вставлена целиком');};
 q('sheetTablePasteCancel').onclick=close;
 q('sheetTablePasteImage').onclick=()=>{close();$('pdfSheetLayoutButton').click();$('sheetImage').scrollIntoView({block:'center'});$('sheetImage').click();};
 n.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')close();});input.focus();
}
const css=document.createElement('style');css.textContent='.sheet-table-paste{position:fixed;z-index:10020;left:50%;top:6vh;transform:translateX(-50%);width:780px;max-width:94vw;max-height:88vh;overflow:auto;background:#fff;color:#172d43;border:1px solid #aab8c5;border-radius:8px;box-shadow:0 8px 35px #0005;padding:20px;box-sizing:border-box;font:14px Arial}.sheet-table-paste h3{margin:0 0 12px}.sheet-table-paste textarea{width:100%;box-sizing:border-box;padding:10px;font:14px monospace}.sheet-table-paste button{padding:9px;margin:8px 6px 8px 0}.sheet-table-paste small{display:block;color:#637587}#sheetTablePastePreview{max-height:32vh;overflow:auto}#sheetTablePastePreview table{border-collapse:collapse}#sheetTablePastePreview td,#sheetTablePastePreview th{border:1px solid #bac4cd;padding:6px;white-space:pre-wrap;min-width:55px}#sheetTablePasteError{color:#a12820}';document.head.append(css);
$('sheetQuickTable').textContent='Таблица из Excel';$('sheetQuickTable').onclick=open;
document.addEventListener('pointerdown',e=>{if(e.target.closest('[data-sheet-table]')){e.preventDefault();e.stopImmediatePropagation();open();}},true);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-sheet-table]')){e.preventDefault();open();}});
for(const name of ['goPage','closeStandalonePdf']){const old=window[name];window[name]=function(...args){close();return old.apply(this,args);};}
})();
