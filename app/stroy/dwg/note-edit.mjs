import {get,num,set,decode} from './cad.mjs?v=0.17.77';
export const isNote=r=>!!r&&(['TEXT','MTEXT','ATTRIB','ATTDEF'].includes(r.type)||r.type==='MULTILEADER'&&r.parts?.some(p=>p.type==='MTEXT'));
const multiline=r=>['MTEXT','MULTILEADER'].includes(r.type);
export function noteValue(r){return decode(r.pairs.filter(p=>p[0]===1||r.type==='MTEXT'&&p[0]===3).map(p=>p[1]).join('')).replace(/\\P/g,'\n');}
export function notePatch(r,value,height){
 if(!isNote(r))throw Error('Текст этого объекта пока недоступен для изменения.');
 if(typeof value!=='string'||value.length>2000||value.includes('\0'))throw Error('Допустимо до 2000 символов.');
 if(!Number.isFinite(height)||height<=0)throw Error('Высота текста должна быть больше нуля.');
 if(!multiline(r)&&/[\r\n]/.test(value))throw Error('Эта однострочная подпись не поддерживает переносы строк.');
 return {handle:get(r,5),dx:0,dy:0,text:multiline(r)?value.replace(/\r\n?|\n/g,'\\P'):value,textHeight:height};
}
export function applyNotePatch(r,op){
 if(op.text!==undefined){if(r.type==='MTEXT')r.pairs=r.pairs.filter(p=>p[0]!==3);set(r,1,op.text);}
 if(op.textHeight!==undefined)set(r,40,op.textHeight);
 if(r.type==='MULTILEADER')for(const part of r.parts||[])if(part.type==='MTEXT')applyNotePatch(part,op);
}
export function mountNoteEditor(apply){
 const dialog=document.createElement('dialog');dialog.id='noteDialog';dialog.setAttribute('aria-labelledby','noteHeading');
 dialog.innerHTML='<form><h2 id="noteHeading">Редактировать надпись</h2><label>Текст<textarea id="noteValue" rows="6" maxlength="2000"></textarea></label><label>Высота в единицах чертежа<input id="noteHeight" type="number" step="any" min="0.000001" required></label><p class="muted">Enter — новая строка для MTEXT. Коды оформления DWG сохраняются; %%c обозначает диаметр. Встроенные коды высоты \\H могут переопределять высоту отдельных слов.</p><p role="alert" id="noteError"></p><div class="noteActions"><button type="button" id="noteCancel">Отмена</button><button class="primary">Применить</button></div></form>';
 document.body.append(dialog);const value=dialog.querySelector('#noteValue'),height=dialog.querySelector('#noteHeight'),error=dialog.querySelector('#noteError');let record;
 dialog.querySelector('#noteCancel').onclick=()=>dialog.close();
 dialog.querySelector('form').onsubmit=e=>{e.preventDefault();try{apply(record,notePatch(record,value.value,Number(height.value)));dialog.close();}catch(e){error.textContent=e.message;}};
 return r=>{record=r;value.value=noteValue(r);height.value=num(r,40,1);error.textContent='';dialog.showModal();value.focus();};
}
