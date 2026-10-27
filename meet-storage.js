// Storage may be full or disabled. Keep room credentials usable without deleting user data.
export function createMeetStorage(persistent, temporary){
  const memory=new Map();
  return {
    getItem(key){
      if(memory.has(key)) return memory.get(key);
      for(const storage of [temporary,persistent]){
        try{ const value=storage().getItem(key); if(value!==null)return value; }catch{}
      }
      return null;
    },
    setItem(key,value){
      value=String(value); memory.set(key,value);
      try{ persistent().setItem(key,value); try{temporary().removeItem(key);}catch{} return; }catch{}
      try{temporary().setItem(key,value);}catch{}
    }
  };
}
