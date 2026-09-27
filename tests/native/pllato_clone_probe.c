/* Experimental native clone probe. Not linked into the released writer. */
#include "pllato_web.c"
#include "encode.h"
#include "decode.h"
#include "hash.h"
extern int dwg_encode_add_object(Dwg_Object *,Bit_Chain *,size_t);

/* Native executive metadata proof: UTF-8 bytes in bounded XRECORD chunks. */
API int pllato_executive_metadata(const unsigned char *bytes, int length)
{
 if(!loaded||!bytes||length<1||length>4*1024*1024)return 1;
 if(dwg_find_dictionary(&drawing,"PLLATO_EXECUTIVE_V1"))return 5;
 Dwg_Object_DICTIONARY *dict=dwg_add_DICTIONARY(&drawing,"PLLATO_EXECUTIVE_V1",NULL,0);
 if(!dict)return 2;
 int error=0;
 Dwg_Object *dictObject=dwg_obj_generic_to_object(dict,&error);
 if(!dictObject||error)return 2;
 BITCODE_HV owner=dictObject->handle.value;
 Dwg_Object_XRECORD *record=dwg_add_XRECORD(dict,"PROJECT");
 if(!record)return 3;
 Dwg_Object *recordObject=dwg_obj_generic_to_object(record,&error);
 if(!recordObject||error)return 3;
 recordObject->tio.object->ownerhandle=dwg_add_handleref(&drawing,4,owner,NULL);
 for(int i=0;i<length;i+=127){int n=length-i;if(n>127)n=127;
  if(!dwg_add_XRECORD_binary(record,310,n,bytes+i))return 4;
 }
 return 0;
}

API int pllato_clone_probe(const char *handle)
{
 Dwg_Object *source=entity(handle);
 Bit_Chain bits={0},handles={0};
 if(!source||source->fixedtype!=DWG_TYPE_LINE)return 1;
 const unsigned originalIndex=source->index,copyIndex=drawing.num_objects;
 const BITCODE_HV oldHandle=source->handle.value,newHandle=dwg_next_handle(&drawing);
 const unsigned refStart=drawing.num_object_refs;
 bit_chain_init(&bits,65536);
 bits.version=drawing.header.version;bits.from_version=drawing.header.from_version;
 int err=dwg_encode_add_object(source,&bits,16);
 if(err>=128){free(bits.chain);return 1000+err;}
 handles=bits;bits.byte=16;bits.bit=0;
 err=dwg_decode_add_object(&drawing,&bits,&handles,16);
 free(bits.chain);
 if(err>=128||drawing.num_objects!=copyIndex+1)return 2000+err;
 Dwg_Object *copy=&drawing.object[copyIndex];
 copy->handle.value=newHandle;copy->handle.size=0;
 for(BITCODE_HV x=newHandle;x;x>>=8)copy->handle.size++;
 hash_set(drawing.object_map,oldHandle,originalIndex);
 hash_set(drawing.object_map,newHandle,copyIndex);
 for(unsigned i=refStart;i<drawing.num_object_refs;i++){
  Dwg_Object_Ref *r=drawing.object_ref[i];
  r->obj=NULL;
  if(r->handleref.code>=6){r->handleref.code=5;r->handleref.value=r->absolute_ref;r->handleref.size=0;for(BITCODE_HV x=r->absolute_ref;x;x>>=8)r->handleref.size++;}
 }
 Dwg_Object *model=dwg_model_space_object(&drawing);
 Dwg_Object_BLOCK_HEADER *b=model->tio.object->tio.BLOCK_HEADER;
 b->entities=realloc(b->entities,(b->num_owned+1)*sizeof(BITCODE_H));
 b->entities[b->num_owned++]=dwg_add_handleref(&drawing,4,newHandle,NULL);
 b->last_entity=b->entities[b->num_owned-1];
 copy->tio.entity->ownerhandle=dwg_add_handleref(&drawing,4,model->handle.value,NULL);
 copy->tio.entity->entmode=2;
 copy->tio.entity->tio.LINE->start.x+=1000;
 copy->tio.entity->tio.LINE->end.x+=1000;
 return 0;
}

/* Prototype graph cloning. Source DWG is never overwritten by this probe.
   Opaque payloads and unsupported object dependencies fail closed. */
static int clone_shared(Dwg_Object *o)
{
 switch(o->fixedtype){
 case DWG_TYPE_LAYER:case DWG_TYPE_STYLE:case DWG_TYPE_LTYPE:
 case DWG_TYPE_DIMSTYLE:case DWG_TYPE_APPID:case DWG_TYPE_BLOCK_CONTROL:
 case DWG_TYPE_LAYER_CONTROL:case DWG_TYPE_STYLE_CONTROL:case DWG_TYPE_LTYPE_CONTROL:
 case DWG_TYPE_DIMSTYLE_CONTROL:case DWG_TYPE_APPID_CONTROL:return 1;
 default:return 0;
 }
}
static void clone_ref_value(BITCODE_H r,BITCODE_HV value)
{
 r->absolute_ref=value;r->obj=NULL;
 if(r->handleref.code>=6)r->handleref.code=5;
 r->handleref.value=value;r->handleref.size=0;
 for(BITCODE_HV h=value;h;h>>=8)r->handleref.size++;
}
API int pllato_clone_graph(const char *root,double dx,double dy)
{
 const unsigned limit=20000;
 BITCODE_HV *queue=calloc(limit,sizeof(BITCODE_HV)),*mapped=calloc(limit,sizeof(BITCODE_HV));
 unsigned *indices=calloc(limit,sizeof(unsigned)),count=1,done=0;
 const unsigned firstRef=drawing.num_object_refs;
 Dwg_Object *model=dwg_model_space_object(&drawing),*start=entity(root);
 if(!queue||!mapped||!indices||!model||!start){free(queue);free(mapped);free(indices);return 1;}
 const BITCODE_HV modelHandle=model->handle.value;
 queue[0]=start->handle.value;int error=0;
 while(done<count){
  Dwg_Object *source=dwg_resolve_handle(&drawing,queue[done]);
  if(!source||source->num_unknown_bits||source->num_unknown_rest){error=10;break;}
  if(source->supertype!=DWG_SUPERTYPE_ENTITY && source->fixedtype!=DWG_TYPE_BLOCK_HEADER
     &&source->fixedtype!=DWG_TYPE_DICTIONARY&&source->fixedtype!=DWG_TYPE_XRECORD){error=11;break;}
  unsigned originalIndex=source->index,newIndex=drawing.num_objects,refs=drawing.num_object_refs;
  BITCODE_HV handle=dwg_next_handle(&drawing);
  Bit_Chain bits={0},hdl={0};bit_chain_init(&bits,65536);
  bits.version=drawing.header.version;bits.from_version=drawing.header.from_version;
  int e=dwg_encode_add_object(source,&bits,16);hdl=bits;
  if(e<128)e=dwg_decode_add_object(&drawing,&bits,&hdl,16);
  free(bits.chain);
  if(e>=128||drawing.num_objects!=newIndex+1){error=12;break;}
  Dwg_Object *copy=&drawing.object[newIndex];
  copy->handle.value=handle;copy->handle.size=0;for(BITCODE_HV h=handle;h;h>>=8)copy->handle.size++;
  hash_set(drawing.object_map,queue[done],originalIndex);hash_set(drawing.object_map,handle,newIndex);
  mapped[done]=handle;indices[done]=newIndex;
  for(unsigned j=refs;j<drawing.num_object_refs;j++){
   BITCODE_H ref=drawing.object_ref[j];BITCODE_HV value=ref->absolute_ref;
   if(!value||value==modelHandle)continue;
   if(copy->supertype==DWG_SUPERTYPE_ENTITY){Dwg_Object_Entity *ent=copy->tio.entity;if(ref==ent->prev_entity||ref==ent->next_entity)continue;}
   if(copy->fixedtype==DWG_TYPE_BLOCK_HEADER){
    Dwg_Object_BLOCK_HEADER *b=copy->tio.object->tio.BLOCK_HEADER;int back=0;
    for(unsigned k=0;k<b->num_inserts;k++)if(b->inserts[k]==ref)back=1;
    if(back)continue;
   }
   Dwg_Object *target=dwg_resolve_handle(&drawing,value);
   if(!target){error=13;break;}if(clone_shared(target))continue;
   unsigned k;for(k=0;k<count;k++)if(queue[k]==value)break;
   if(k==count){if(count==limit){error=14;break;}queue[count++]=value;}
  }
  if(error)break;done++;
 }
 if(!error){
  for(unsigned j=firstRef;j<drawing.num_object_refs;j++){
   BITCODE_H ref=drawing.object_ref[j];BITCODE_HV value=ref->absolute_ref;
   for(unsigned k=0;k<count;k++)if(queue[k]==value){value=mapped[k];break;}
   clone_ref_value(ref,value);
  }
  // This probe copies a complete top-level INSERT only. The independent
  // definition is registered separately, not exploded into visible primitives.
  for(unsigned k=0;k<count;k++){
   Dwg_Object *o=&drawing.object[indices[k]];
   if(o->fixedtype==DWG_TYPE_BLOCK_HEADER){
    Dwg_Object_BLOCK_HEADER *b=o->tio.object->tio.BLOCK_HEADER;
    char name[80];snprintf(name,sizeof(name),"PLL_COPY_%llX",(unsigned long long)o->handle.value);
    free(b->name);b->name=dwg_add_u8_input(&drawing,name);
    Dwg_Object *begin=dwg_ref_object(&drawing,b->block_entity);
    if(!begin||begin->fixedtype!=DWG_TYPE_BLOCK){error=18;break;}
    free(begin->tio.entity->tio.BLOCK->name);
    begin->tio.entity->tio.BLOCK->name=dwg_add_u8_input(&drawing,name);
    fprintf(stderr,"CLONE block %llX -> %s\n",(unsigned long long)o->handle.value,name);
    fprintf(stderr,"CLONE begin ref %llX\n",(unsigned long long)(b->block_entity?b->block_entity->absolute_ref:0));
    free(b->inserts);b->inserts=NULL;b->num_inserts=0;
    Dwg_Object *control=dwg_ref_object(&drawing,o->tio.object->ownerhandle);
    if(!control||control->fixedtype!=DWG_TYPE_BLOCK_CONTROL){error=15;break;}
    Dwg_Object_BLOCK_CONTROL *bc=control->tio.object->tio.BLOCK_CONTROL;
    bc->entries=realloc(bc->entries,(bc->num_entries+1)*sizeof(BITCODE_H));
    bc->entries[bc->num_entries++]=dwg_add_handleref(&drawing,2,o->handle.value,NULL);
   }
  }
  if(!error){
   model=dwg_model_space_object(&drawing);Dwg_Object_BLOCK_HEADER *b=model->tio.object->tio.BLOCK_HEADER;
   Dwg_Object *copy=&drawing.object[indices[0]];
   if(copy->fixedtype!=DWG_TYPE_INSERT)error=16;
   else{
    b->entities=realloc(b->entities,(b->num_owned+1)*sizeof(BITCODE_H));
    b->entities[b->num_owned++]=dwg_add_handleref(&drawing,4,mapped[0],NULL);b->last_entity=b->entities[b->num_owned-1];
    copy->tio.entity->tio.INSERT->ins_pt.x+=dx;copy->tio.entity->tio.INSERT->ins_pt.y+=dy;
    // Rebuild reverse INSERT lists solely within cloned definitions.
    for(unsigned k=0;k<count;k++){Dwg_Object *o=&drawing.object[indices[k]];if(o->fixedtype!=DWG_TYPE_INSERT)continue;
     Dwg_Object *bo=dwg_ref_object(&drawing,o->tio.entity->tio.INSERT->block_header);
     if(!bo||bo->fixedtype!=DWG_TYPE_BLOCK_HEADER){error=17;break;}
     Dwg_Object_BLOCK_HEADER *bh=bo->tio.object->tio.BLOCK_HEADER;
     bh->inserts=realloc(bh->inserts,(bh->num_inserts+1)*sizeof(BITCODE_H));bh->inserts[bh->num_inserts++]=dwg_add_handleref(&drawing,4,o->handle.value,NULL);
    }
   }
  }
 }
 free(queue);free(mapped);free(indices);return error;
}
