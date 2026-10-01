// The SDK maps both aligned and rotated dimensions to the same display class.
// Preserve their actual CAD subtype and rotation before releasing native data.
export function readDimensionDefinitions(sdk,pointer,database){
 const seen=new Set(),locked=new Set();
 for(let i=0;i<sdk.dwg_get_num_objects(pointer);i++){const o=sdk.dwg_get_object(pointer,i);if(sdk.dwg_object_get_fixedtype(o)!==626)continue;const a=sdk.dwg_object_to_object_tio(o);if(sdk.dwg_dynapi_entity_data(a,'associativity')&2){const ref=sdk.dwg_dynapi_entity_data(a,'dimensionobj');if(ref)locked.add(sdk.dwg_ref_get_id(ref));}}
 for(const list of [database.entities,...database.tables.BLOCK_RECORD.entries.map(b=>b.entities||[])])for(const e of list){
  if(e.type!=='DIMENSION'||seen.has(e.handle))continue;seen.add(e.handle);
  const object=sdk.dwg_resolve_handle(pointer,parseInt(e.handle,16));
  if(!object)continue;
  const type=sdk.dwg_object_get_fixedtype(object),entity=sdk.dwg_object_to_entity_tio(object);
  if(type===21||type===22){e.linearKind=type===21?0:1;e.dimensionRotation=type===21?sdk.dwg_dynapi_entity_data(entity,'dim_rotation'):0;e.dimensionEndLocked=locked.has(e.handle);}
 }
}
