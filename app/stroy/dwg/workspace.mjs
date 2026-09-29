// Presentation only: never changes the drawing or recovery state.
import './tool-help.mjs?v=0.17.17';
const panel=document.getElementById('panel'),sidebar=document.getElementById('sidebar');
panel.textContent='Листы / слои';panel.setAttribute('aria-controls','sidebar');panel.setAttribute('aria-expanded','false');
panel.onclick=()=>{const open=sidebar.classList.toggle('open');panel.setAttribute('aria-expanded',String(open));};
document.querySelector('header').append(panel);
const close=document.createElement('button');close.className='sidebarClose';close.textContent='Закрыть панель';close.onclick=()=>{sidebar.classList.remove('open');panel.setAttribute('aria-expanded','false');panel.focus();};sidebar.prepend(close);
const focus=document.createElement('button');focus.id='focusWorkspace';focus.textContent='Развернуть поле';focus.setAttribute('aria-pressed','false');
focus.onclick=()=>{const active=document.body.classList.toggle('focusWorkspace');focus.textContent=active?'Вернуть панели':'Развернуть поле';focus.setAttribute('aria-pressed',String(active));};document.getElementById('viewport').append(focus);
document.querySelector('header').append(document.getElementById('autosaveStatus'));
