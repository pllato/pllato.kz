// Explicit buttons also navigate when the active sheet is chosen again.
export function mountSheetNavigator(select){
 const menu=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('div');
 menu.id='sheetNavigator';summary.title='Выберите исполнительную: перейти к ней и показать целиком';list.className='sheetNavigatorList';menu.append(summary,list);select.after(menu);select.hidden=true;
 function refresh(){summary.textContent=select.selectedOptions[0]?.textContent||'Нет исполнительных';summary.setAttribute('aria-disabled',String(select.disabled));list.replaceChildren();
  for(const option of select.options){const button=document.createElement('button');button.type='button';button.textContent=option.textContent;button.disabled=select.disabled;button.setAttribute('aria-current',String(option.selected));button.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));menu.open=false;summary.focus();};list.append(button);}
 }
 summary.onclick=e=>{if(select.disabled)e.preventDefault();};menu.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.open=false;summary.focus();e.stopPropagation();}});
 // The toolbar scrolls horizontally; a normal absolute popup is clipped by it.
 menu.addEventListener('toggle',()=>{if(!menu.open)return;const r=summary.getBoundingClientRect(),w=Math.min(320,innerWidth-16);Object.assign(list.style,{left:Math.max(8,Math.min(r.left,innerWidth-w-8))+'px',top:r.bottom+4+'px',width:w+'px',maxHeight:Math.max(80,innerHeight-r.bottom-16)+'px'});});
 window.addEventListener('resize',()=>{menu.open=false;});
 document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))menu.open=false;});
 new MutationObserver(refresh).observe(select,{childList:true,attributes:true,subtree:true,characterData:true});select.addEventListener('change',refresh);refresh();
}
