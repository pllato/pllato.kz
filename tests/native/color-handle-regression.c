/* Synthetic C0 color-book handles: both model and block-owned INSERTs.
   No customer geometry. Link against the same patched native archive. */
#include "pllato_executive_engine.c"
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);assert(pllato_open(argv[1])<128);
 Dwg_Data *d=&drawing;unsigned index=d->num_objects;
 BITCODE_HV colorHandle=dwg_next_handle(d);
 assert(dwg_add_object(d)>=-1);Dwg_Object *color=&d->object[index];
 assert(!dwg_setup_DBCOLOR(color));
 int colorClass=dwg_add_class(d,"DBCOLOR","AcDbColor","ObjectDBX Classes",false);
 assert(colorClass>=500);color->type=colorClass;
 dwg_add_handle(&color->handle,0,colorHandle,color);hash_set(d->object_map,colorHandle,index);
 color->tio.object->is_xdic_missing=1;
 color->tio.object->tio.DBCOLOR->color.index=5;
 color->tio.object->tio.DBCOLOR->color.rgb=0xc20000ff;
 color->tio.object->tio.DBCOLOR->color.method=0xc2;
 Dwg_Object_DICTIONARY *dict=dwg_add_DICTIONARY(d,"ACAD_COLOR",NULL,0);assert(dict);
 int error=0;Dwg_Object *dictObject=dwg_obj_generic_to_object(dict,&error);assert(dictObject&&!error);
 color=dwg_resolve_handle(d,colorHandle);assert(color);
 color->tio.object->ownerhandle=dwg_add_handleref(d,4,dictObject->handle.value,NULL);
 assert(dwg_add_DICTIONARY_item(dict,"TEST_BLUE",colorHandle));
 unsigned count=0,model=0,owned=0;BITCODE_HV handles[32],blocks[32],layers[32],owners[32];
 for(unsigned i=0;i<d->num_objects;i++){
  Dwg_Object *o=&d->object[i];if(o->fixedtype!=DWG_TYPE_INSERT)continue;
  assert(count<32);Dwg_Object_Entity *e=o->tio.entity;
  handles[count]=o->handle.value;blocks[count]=e->tio.INSERT->block_header->absolute_ref;
  layers[count]=e->layer->absolute_ref;owners[count]=e->ownerhandle?e->ownerhandle->absolute_ref:0;
  if(e->entmode==2)model++;else owned++;
  e->color.flag=0xc0;e->color.index=5;e->color.handle=dwg_add_handleref(d,5,colorHandle,NULL);count++;
 }
 assert(model&&owned&&count>=2);assert(pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 for(unsigned i=0;i<count;i++){
  Dwg_Object *o=dwg_resolve_handle(&drawing,handles[i]);assert(o&&o->fixedtype==DWG_TYPE_INSERT);
  Dwg_Object_Entity *e=o->tio.entity;
  assert(e->color.flag==0xc0&&e->color.handle&&e->color.handle->absolute_ref==colorHandle);
  assert(dwg_ref_object(&drawing,e->color.handle)->fixedtype==DWG_TYPE_DBCOLOR);
  assert(e->tio.INSERT->block_header->absolute_ref==blocks[i]);
  assert(e->layer->absolute_ref==layers[i]);
  assert((e->ownerhandle?e->ownerhandle->absolute_ref:0)==owners[i]);
 }
 pllato_close();puts("PASS C0 color, owner, layer and nested block references roundtrip");return 0;
}
