// A room-scoped server-issued credential, passed by authenticated CRM/app.
// Never put it in the public invitation URL or persistent localStorage.
const prefix='pllato-meet-staff:';
export function storeMeetStaffAccess(storage,room,access,now=Date.now()){
  if(!/^crm-[a-f0-9-]{36}$/.test(room)||!/^hk_[a-f0-9-]{36}$/.test(access?.hostKey||''))throw Error('Некорректный доступ организатора');
  storage.setItem(prefix+room,JSON.stringify({hostKey:access.hostKey,hostUrl:access.hostUrl,expires:now+300000}));
}
export function readMeetStaffAccess(storage,room,now=Date.now()){
  try{const value=JSON.parse(storage.getItem(prefix+room)||'null');
    if(value?.expires>now&&/^hk_[a-f0-9-]{36}$/.test(value.hostKey||''))return value;
    storage.removeItem(prefix+room);
  }catch{}return null;
}
