// Меню вынесено из прокручиваемого списка, чтобы пункты не обрезались его краем.
export function initTaskActionMenus(){
 let pop=null,trigger=null;
 function close(restore=false){pop?.remove();pop=null;trigger?.setAttribute('aria-expanded','false');if(restore&&trigger?.isConnected)trigger.focus({preventScroll:true});trigger=null;}
 function open(button){if(trigger===button){close(true);return;}close();const source=button.parentElement.querySelector('[data-task-menu-content]');if(!source)return;
  trigger=button;button.setAttribute('aria-expanded','true');pop=document.createElement('div');pop.className='task-action-pop';pop.setAttribute('role','menu');pop.setAttribute('aria-label','Действия с делом');
  for(const original of source.querySelectorAll('button')){const item=original.cloneNode(true);item.setAttribute('role','menuitem');pop.append(item);}
  pop.addEventListener('click',event=>{if(event.target.closest('button'))close();});document.body.append(pop);
  const r=button.getBoundingClientRect(),height=pop.getBoundingClientRect().height;pop.style.left=Math.max(8,Math.min(r.right-220,innerWidth-228))+'px';pop.style.top=Math.max(8,Math.min(r.bottom+5,innerHeight-height-8))+'px';pop.querySelector('button')?.focus({preventScroll:true});
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-task-more]');if(button){event.preventDefault();open(button);}else if(pop&&!pop.contains(event.target))close();},true);
 document.addEventListener('keydown',event=>{if(!pop)return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)&&pop.contains(event.target)){event.preventDefault();const options=[...pop.querySelectorAll('button:not(:disabled)')],index=options.indexOf(document.activeElement);options[event.key==='Home'?0:event.key==='End'?options.length-1:(index+(event.key==='ArrowUp'?-1:1)+options.length)%options.length]?.focus();}},true);
 document.addEventListener('scroll',event=>{if(pop&&!pop.contains(event.target))close();},true);window.addEventListener('resize',()=>close());
}
