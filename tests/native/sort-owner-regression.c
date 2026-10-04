#include "pllato_executive_engine.c"
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);assert(pllato_open(argv[1])<128);
 Dwg_Data *d=&drawing;int err=0;
 Dwg_Object_BLOCK_HEADER *bh=dwg_add_BLOCK_HEADER(d,"SORT_OWNER_TEST");assert(bh);
 assert(dwg_add_BLOCK(bh,"SORT_OWNER_TEST"));assert(dwg_add_ENDBLK(bh));
 BITCODE_HV block=dwg_obj_generic_to_object(bh,&err)->handle.value;
 Dwg_Object_DICTIONARY *dict=dwg_add_DICTIONARY(d,NULL,NULL,0);assert(dict);
 BITCODE_HV owner=dwg_obj_generic_to_object(dict,&err)->handle.value;
 dict->parent->ownerhandle=dwg_add_handleref(d,4,block,NULL);
 Dwg_Object *b=dwg_resolve_handle(d,block);b->tio.object->xdicobjhandle=dwg_add_handleref(d,3,owner,NULL);b->tio.object->is_xdic_missing=0;
 unsigned index=d->num_objects;BITCODE_HV handle=dwg_next_handle(d);
 assert(dwg_add_object(d)>=-1);Dwg_Object *o=&d->object[index];assert(!dwg_setup_SORTENTSTABLE(o));
 o->type=dwg_add_class(d,"SORTENTSTABLE","AcDbSortentsTable","ObjectDBX Classes",false);assert(o->type>=500);
 dwg_add_handle(&o->handle,0,handle,o);hash_set(d->object_map,handle,index);
 o->tio.object->is_xdic_missing=1;o->tio.object->ownerhandle=dwg_add_handleref(d,4,owner,NULL);
 Dwg_Object_SORTENTSTABLE *s=o->tio.object->tio.SORTENTSTABLE;
 assert(validate_sort_owners()>=128); /* Not registered in the dictionary. */
 assert(dwg_add_DICTIONARY_item(dict,"ACAD_SORTENTS",handle));
 s->num_ents=1;assert(validate_sort_owners()>=128);s->num_ents=0;
 s->block_owner=dwg_add_handleref(d,4,owner,NULL);assert(validate_sort_owners()>=128);
 s->block_owner=NULL;assert(validate_sort_owners()==0);assert(s->block_owner->absolute_ref==block);
 assert(validate_sort_owners()==0); /* Idempotent. */
 assert(pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 o=dwg_resolve_handle(&drawing,handle);assert(o&&o->tio.object->tio.SORTENTSTABLE->block_owner->absolute_ref==block);
 assert(validate_sort_owners()==0);pllato_close();puts("PASS SORTENTSTABLE owner repair, rejection and round-trip");
}
