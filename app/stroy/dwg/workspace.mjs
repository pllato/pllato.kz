// Presentation only: never changes the drawing or recovery state.
import './tool-help.mjs?v=0.17.61';
import {mountSheetNavigator} from './sheet-navigator.mjs?v=0.17.61';
import {mountCableCatalog} from './cable-catalog.mjs?v=0.17.61';
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
