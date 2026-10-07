// Header reads may complete out of order. Only the latest request in the
// unchanged workspace may proceed or display an error.
export function latestOpeningPreflight(check,currentRevision){
 let generation=0;
 return async file=>{
  const request=++generation,revision=currentRevision();
  const current=()=>request===generation&&revision===currentRevision();
  try{await check(file);}catch(error){if(current())throw error;return false;}
  return current();
 };
}
