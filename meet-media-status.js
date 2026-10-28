// Passive WebRTC measurements: no speed tests or extra media/network streams.
export function connectionQuality(reports,previous=new Map(),connectionState='connected'){
  const samples=new Map();let rtt=null,jitter=null,loss=null;
  for(const report of reports.values()){
    if(report.type==='candidate-pair' && report.state==='succeeded' && (report.nominated || report.selected) && Number.isFinite(report.currentRoundTripTime))rtt=Math.max(rtt??0,report.currentRoundTripTime);
    if(report.type==='remote-inbound-rtp'){
      if(Number.isFinite(report.roundTripTime))rtt=Math.max(rtt??0,report.roundTripTime);
      if(Number.isFinite(report.fractionLost))loss=Math.max(loss??0,Math.max(0,report.fractionLost));
    }
    if(report.type==='inbound-rtp' && !report.isRemote){
      if(Number.isFinite(report.jitter))jitter=Math.max(jitter??0,report.jitter);
      const received=report.packetsReceived,lost=report.packetsLost;
      if(Number.isFinite(received)&&Number.isFinite(lost)){
        samples.set(report.id,{received,lost});const old=previous.get(report.id);
        if(old && received>=old.received && lost>=old.lost){
          const total=received-old.received+lost-old.lost;
          if(total>0)loss=Math.max(loss??0,(lost-old.lost)/total);
        }
      }
    }
  }
  let state='unknown',label='Проверка связи';
  if(['failed','disconnected','closed'].includes(connectionState)){state='bad';label='Связь прервана';}
  else if(connectionState==='connected' && [rtt,jitter,loss].some(x=>x!==null)){
    state=(rtt>.8||jitter>.1||loss>.1)?'bad':(rtt>.3||jitter>.03||loss>.03)?'warn':'good';
    label={good:'Связь хорошая',warn:'Связь нестабильна',bad:'Связь слабая'}[state];
  }
  const detail=[rtt!==null?`Задержка ${Math.round(rtt*1000)} мс`:'',loss!==null?`Потери ${(loss*100).toFixed(1)}%`:''].filter(Boolean).join(' · ');
  return {state,label,title:label+(detail?' · '+detail:''),samples};
}
export function microphoneStatus(track,enabled,level,available=true){
  if(!enabled)return {state:'off',label:'Микрофон выключен'};
  if(!track || track.readyState==='ended' || track.muted)return {state:'error',label:'Микрофон недоступен'};
  if(!available)return {state:'unknown',label:'Уровень звука недоступен'};
  return level>.012?{state:'active',label:'Микрофон улавливает звук'}:{state:'quiet',label:'Микрофон включён · сейчас тихо'};
}
export function audioRms(samples){
  let sum=0;for(const value of samples){const n=(value-128)/128;sum+=n*n;}
  return Math.sqrt(sum/samples.length);
}
