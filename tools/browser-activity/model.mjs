export const HOUR=3600000, RETENTION=180*24*HOUR;
export const BASE='https://pllato-comm.uurraa.workers.dev/production-activity';
export function pageSource(url){
  try{const u=new URL(url);if(u.protocol!=='https:')return null;
    if(u.hostname==='claude.ai')return 'claude';
    if(u.hostname==='chatgpt.com'&&/^\/codex(?:\/|$)/.test(u.pathname))return 'codex';
  }catch{} return null;
}
// Only submission endpoints, never task polling, feedback, telemetry or history.
// Websites can change these paths: unknown endpoints deliberately do not count.
export function requestSource(d){
  if(d.method!=='POST'||d.tabId<0||d.type!=='xmlhttprequest')return null;
  try{const u=new URL(d.url);if(u.protocol!=='https:')return null;
    if(u.hostname==='claude.ai'&&/^\/api\/organizations\/[^/]+\/chat_conversations\/[^/]+\/completion\/?$/.test(u.pathname))return 'claude';
    if(u.hostname==='chatgpt.com'&&/^\/backend-api\/(?:wham|codex)\/tasks(?:\/[^/]+\/(?:turns|messages))?\/?$/.test(u.pathname))return 'codex';
  }catch{}return null;
}
export function cleanName(name){
  const value=String(name||'').trim().replace(/\s+/g,' ');
  if(value.length<2||value.length>70||/[\x00-\x1f<>]/.test(value))throw Error('Введите имя и фамилию, от 2 до 70 символов.');
  return value;
}
export function addCount(state,source,id,at){
  if(!['codex','claude'].includes(source)||!Number.isFinite(at))return false;
  state.seen??={};if(state.seen[id])return false;
  state.seen[id]=at;
  for(const [key,time] of Object.entries(state.seen))if(time<at-24*HOUR)delete state.seen[key];
  const item=state.services[source],hour=Math.floor(at/HOUR)*HOUR;
  item.buckets??={};item.buckets[hour]=(item.buckets[hour]||0)+1;
  for(const key of Object.keys(item.buckets))if(Number(key)<at-RETENTION)delete item.buckets[key];
  item.lastEvent=at;state.revision=(state.revision||0)+1;return true;
}
export function snapshot(state,source,now=Date.now()){
  return {available:true,observedAt:now,coverageStart:Math.max(state.startedAt,now-RETENTION),buckets:Object.entries(state.services[source].buckets||{}).filter(([at])=>Number(at)>=Math.floor(Math.max(state.startedAt,now-RETENTION)/HOUR)*HOUR).map(([at,count])=>({at:Number(at),count})).sort((a,b)=>a.at-b.at)};
}
export function pairRequest(request,intents){
  // A user action can account for only one accepted request, even if the page retries.
  return intents.filter(i=>!i.used&&i.tabId===request.tabId&&i.source===request.source&&request.at>=i.at-1000&&request.at-i.at<=15000).sort((a,b)=>b.at-a.at)[0];
}
