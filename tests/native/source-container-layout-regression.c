/* Sparse ACIS pages and CRC-terminated handle maps with allocated tails.
   Run with a local input and a new output; never publish customer fixtures. */
#include <assert.h>
#include <unistd.h>
#include "pllato_executive_engine.c"
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);assert(pllato_open(argv[1])<128);assert(!pllato_preserve_source(argv[1]));
 PP_Section *objects=pp_find(pp_source.sections,pp_source.nsections,"AcDb:AcDbObjects"),*map=pp_find(pp_source.sections,pp_source.nsections,"AcDb:Handles");assert(objects&&map);
 /* An unchanged empty table in an unchanged orphan dictionary is retained,
    never repaired. A modified table/dictionary must still be rejected. */
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object *o=drawing.object+i;if(o->fixedtype!=DWG_TYPE_SORTENTSTABLE)continue;
  Dwg_Object_SORTENTSTABLE *q=o->tio.object->tio.SORTENTSTABLE;
  Dwg_Object *d=dwg_ref_object(&drawing,o->tio.object->ownerhandle);
  if(q->num_ents||!q->block_owner||!d||d->fixedtype!=DWG_TYPE_DICTIONARY||!d->tio.object->ownerhandle||d->tio.object->ownerhandle->absolute_ref!=q->block_owner->absolute_ref||dwg_ref_object(&drawing,q->block_owner))continue;
  assert(pp_keep_source_sort(o));q->num_ents=1;assert(!pp_keep_source_sort(o));q->num_ents=0;
  BITCODE_HV owner=d->tio.object->ownerhandle->absolute_ref;d->tio.object->ownerhandle->absolute_ref=owner+1;assert(!pp_keep_source_sort(o));d->tio.object->ownerhandle->absolute_ref=owner;
 }
 /* An inactive tail is not a new object; active CRC/inventory remain mandatory. */
 unsigned char *tail=malloc(map->size+7);assert(tail);memcpy(tail,map->bytes,map->size);memset(tail+map->size,0x5a,7);PP_Section extended=*map;extended.bytes=tail;extended.size+=7;assert(pp_map_source(&extended,objects));
 unsigned char saved=tail[2];tail[2]^=1;assert(!pp_map_source(&extended,objects));tail[2]=saved;assert(pp_map_source(&extended,objects));free(tail);
 unsigned char frame=objects->bytes[pp_source.records[0].address];objects->bytes[pp_source.records[0].address]^=1;size_t n;assert(!pp_frame(objects,pp_source.records[0].address,drawing.header.version,&n));objects->bytes[pp_source.records[0].address]=frame;
 assert(pllato_save(argv[2])<128);Dwg_Data check={0};assert(dwg_read_file(argv[2],&check)<128);assert(pp_verify_retained(&check,argv[2]));
 unsigned char *file=NULL;size_t size;PP_Section output[PP_SECTIONS]={0};unsigned count=0;assert(pp_file(argv[2],&file,&size));assert(pp_load_sections(&check,file,size,output,&count));
 for(unsigned i=0;i<pp_source.nsections;i++){PP_Section *s=pp_source.sections+i;if(!strcmp(s->name,"AcDb:Header")||!strcmp(s->name,"AcDb:AcDbObjects")||!strcmp(s->name,"AcDb:Handles"))continue;PP_Section *o=pp_find(output,count,s->name);assert(o&&o->size==s->size&&!memcmp(o->bytes,s->bytes,s->size));}
 pp_clear_sections(output,count);free(file);dwg_free(&check);pllato_close();assert(pllato_open(argv[2])<128);assert(!pllato_preserve_source(argv[2]));pllato_close();puts("PASS source layout, inactive map tail, CRC rejection, all auxiliary sections byte-exact, save/reopen");return 0;
}
