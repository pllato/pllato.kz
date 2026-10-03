// Presentation only: never changes the drawing or recovery state.
import './tool-help.mjs?v=0.17.73';
import {mountSheetNavigator} from './sheet-navigator.mjs?v=0.17.73';
import {mountCableCatalog} from './cable-catalog.mjs?v=0.17.73';
mountCableCatalog();
mountSheetNavigator(document.getElementById('exSheet'));
const panel=document.getElementById('panel'),sidebar=document.getElementById('sidebar');
panel.textContent='Листы / слои';panel.setAttribute('aria-controls','sidebar');panel.setAttribute('aria-expanded','false');
panel.onclick=()=>{const open=sidebar.classList.toggle('open');panel.setAttribute('aria-expanded',String(open));};
document.querySelector('header').append(panel);
const close=document.createElement('button');close.className='sidebarClose';close.textContent='Закрыть панель';close.onclick=()=>{sidebar.classList.remove('open');panel.setAttribute('aria-expanded','false');panel.focus();};sidebar.prepend(close);
const focus=document.createElement('button');focus.id='focusWorkspace';focus.textContent='Развернуть поле';focus.setAttribute('aria-pressed','false');
focus.onclick=()=>{const active=document.body.classList.toggle('focusWorkspace');focus.textContent=active?'Вернуть панели':'Развернуть поле';focus.setAttribute('aria-pressed',String(active));};document.getElementById('viewport').append(focus);
// Recovery feedback belongs to the status bar, not a full row above the canvas.
document.querySelector('footer').append(document.getElementById('autosaveStatus'));
const recoveryStatus=document.getElementById('autosaveStatus');
const recoveryTitle=()=>{recoveryStatus.title=recoveryStatus.textContent;};
new MutationObserver(recoveryTitle).observe(recoveryStatus,{childList:true,characterData:true,subtree:true});recoveryTitle();
document.querySelector('header strong').title=document.querySelector('header strong').textContent;
// Move actual controls, preserving their handlers and current values.
const toolbar=document.getElementById('drawingToolbar'),history=document.createElement('div');
history.id='historyActions';history.setAttribute('aria-label','История изменений');history.append(document.getElementById('undo'),document.getElementById('redo'));toolbar.prepend(history);
const more=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div');
more.id='moreTools';summary.textContent='⋯';summary.setAttribute('aria-label','Дополнительные инструменты');summary.title='Дополнительные инструменты';body.className='moreToolsBody';more.append(summary,body);document.querySelector('header').append(more);
body.append(document.getElementById('shxFonts'));
for(const group of document.querySelectorAll('#executiveToolbar>details'))if(['Лист','Калибровка длины','Масштаб'].includes(group.querySelector('summary').textContent))body.append(group);
body.append(panel,document.querySelector('[data-tool="text"]'),document.querySelector('[data-tool="measure"]'));
body.addEventListener('click',e=>{if(e.target.closest('button'))more.open=false;});
document.addEventListener('pointerdown',e=>{if(!more.contains(e.target))more.open=false;});
more.addEventListener('keydown',e=>{if(e.key==='Escape'){more.open=false;summary.focus();e.stopPropagation();}});
import {mountPhoneWorkspace} from './phone-workspace.mjs?v=0.17.73';
mountPhoneWorkspace();
