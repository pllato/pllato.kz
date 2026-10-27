import {zoomClient} from './zoom-crm.js?v=20261027-clear';
const BASE='https://pllato-elc-worker.uurraa.workers.dev';
const panels=new Set(),queue=[],clients=new WeakMap();let active=0;
// Only visible cards fetch links, at most two at a time. Videos load on play.
function enqueue(work){queue.push(work);drain();}
function drain(){while(active<2 && queue.length){active++;Promise.resolve().then(queue.shift()).catch(()=>{}).finally(()=>{active--;drain();});}}
window.addEventListener('focus',()=>{
  for(const panel of panels){
    if(!panel.root.isConnected){panels.delete(panel);continue;}
    if(panel.details.open)panel.refresh();
  }
});
export function mountProjectMeetings(root,dealId,getToken){
  root.classList.add('project-meetings');
  if(!clients.has(getToken))clients.set(getToken,zoomClient({base:BASE,getToken,compact:true}));
  const client=clients.get(getToken);
  const room=document.createElement('div'),details=document.createElement('details'),summary=document.createElement('summary'),files=document.createElement('div');
  room.textContent='Постоянная ссылка встречи';summary.textContent='Записи и расшифровки всех встреч';
  details.append(summary,files);root.append(room,details);
  let loading=false;
  const refresh=async()=>{if(loading)return;loading=true;try{await client.files(files,dealId);}finally{loading=false;}};
  const panel={root,details,refresh};panels.add(panel);
  details.addEventListener('toggle',()=>{if(details.open)refresh();else for(const v of files.querySelectorAll('video,audio'))v.pause();});
  const load=()=>enqueue(async()=>{if(root.isConnected)await client.dealRoom(room,dealId);});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}else if(!root.isConnected)observer.disconnect();},{rootMargin:'100px'});observer.observe(root);}else load();
}
