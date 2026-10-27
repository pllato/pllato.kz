import {greenApiHost} from './green-api-host.js';
// A send API receipt confirms queue acceptance only, never delivery.
export async function waDeliveryStatus(channel, chatId, messageId, fetcher=fetch) {
  const base=`${greenApiHost(channel.api_url)}/waInstance${channel.id_instance}`;
  const call=async(method,body)=>{
    const r=await fetcher(`${base}/${method}/${channel.api_token_instance}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
    if(!r.ok)return null;
    return r.json();
  };
  let message=null;
  try{message=await call('getMessage',{chatId,idMessage:messageId});}catch{}
  const status=message?.idMessage===messageId&&message?.chatId===chatId?message.statusMessage:null;
  if(['sent','delivered','read','failed'].includes(status))return {status};
  let state=null;
  try{state=await call('getStateInstance');}catch{}
  if(state?.stateInstance==='blocked')return {status:'blocked'};
  if(['notAuthorized','sleepMode'].includes(state?.stateInstance))return {status:'disconnected'};
  if(status==='yellowCard')return {status:'restricted'};
  return {status:state?.stateInstance==='authorized'?'pending':'unknown'};
}
