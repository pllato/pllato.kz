// Exclusive rectangle gesture: a click, cancellation or second finger never creates a sheet.
export function areaDrag(api){
 const pointers=new Set();let start=null,blocked=false;
 const reset=()=>{pointers.clear();start=null;blocked=false;api.cancel();};
 return {
  reset,
  active:()=>pointers.size>0,
  down(id,p,button=0){if(!api.enabled())return false;if(button!==0)return true;
   if(pointers.size){blocked=true;start=null;api.cancel();}else{start=[...p];blocked=false;api.start(p);}
   pointers.add(id);return true;
  },
  move(id,p){if(!pointers.has(id))return false;if(start&&!blocked)api.move(p);return true;},
  up(id,p){if(!pointers.has(id))return false;pointers.delete(id);
   const a=start,valid=a&&!blocked&&Math.abs(p[0]-a[0])>=6&&Math.abs(p[1]-a[1])>=6;
   start=null;if(valid){blocked=false;api.finish(a,p);}else api.cancel();
   if(!pointers.size)blocked=false;return true;
  }
 };
}
