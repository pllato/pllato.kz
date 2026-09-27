/* Executive engine candidate; release gated by round-trip integration tests. */
#define pllato_save pllato_legacy_save
#define pllato_move pllato_legacy_move
#include "pllato_web.c"
#undef pllato_save
#undef pllato_move
#include "encode.h"
#include "decode.h"
#include "hash.h"
extern int dwg_encode_add_object(Dwg_Object *,Bit_Chain *,size_t);
extern size_t pllato_encoded_payload_end;

/* Native executive metadata proof: UTF-8 bytes in bounded XRECORD chunks. */
API int pllato_executive_metadata(const unsigned char *bytes, int length)
{
 if(!loaded||!bytes||length<1||length>4*1024*1024)return 1;
 BITCODE_H existing=dwg_find_dictionary(&drawing,"PLLATO_EXECUTIVE_V1");
 Dwg_Object *existingObject=existing?dwg_ref_object(&drawing,existing):NULL;
 if(existingObject&&existingObject->fixedtype!=DWG_TYPE_DICTIONARY)return 5;
 Dwg_Object_DICTIONARY *dict=existingObject?existingObject->tio.object->tio.DICTIONARY:dwg_add_DICTIONARY(&drawing,"PLLATO_EXECUTIVE_V1",NULL,0);
 if(!dict)return 2;
 int error=0;
 Dwg_Object *dictObject=dwg_obj_generic_to_object(dict,&error);
 if(!dictObject||error)return 2;
 BITCODE_HV owner=dictObject->handle.value;
 BITCODE_H entry=existing?dwg_find_dicthandle(&drawing,existing,"PROJECT"):NULL;
 Dwg_Object *old=entry?dwg_ref_object(&drawing,entry):NULL;
 if(old&&old->fixedtype!=DWG_TYPE_XRECORD)return 5;
 Dwg_Object_XRECORD *record=old?old->tio.object->tio.XRECORD:dwg_add_XRECORD(dict,"PROJECT");
 if(!record)return 3;
 Dwg_Object *recordObject=dwg_obj_generic_to_object(record,&error);
 if(!recordObject||error)return 3;
 recordObject->tio.object->ownerhandle=dwg_add_handleref(&drawing,4,owner,NULL);
 for(Dwg_Resbuf *p=record->xdata;p;p=p->nextrb)if(p->type!=310)return 5;
 Dwg_Resbuf *p=record->xdata;while(p){Dwg_Resbuf *next=p->nextrb;free(p->value.str.u.data);free(p);p=next;}
 record->xdata=NULL;record->num_xdata=0;record->xdata_size=0;
 for(int i=0;i<length;i+=127){int n=length-i;if(n>127)n=127;
  if(!dwg_add_XRECORD_binary(record,310,n,bytes+i))return 4;
 }
 return 0;
}

/* Prototype graph cloning. Source DWG is never overwritten by this probe.
   Opaque payloads and unsupported object dependencies fail closed. */
static int clone_shared(Dwg_Object *o)
{
 switch(o->fixedtype){
 case DWG_TYPE_LAYER:case DWG_TYPE_STYLE:case DWG_TYPE_LTYPE:
 case DWG_TYPE_DIMSTYLE:case DWG_TYPE_MLEADERSTYLE:case DWG_TYPE_APPID:case DWG_TYPE_DBCOLOR:case DWG_TYPE_BLOCK_CONTROL:
 case DWG_TYPE_LAYER_CONTROL:case DWG_TYPE_STYLE_CONTROL:case DWG_TYPE_LTYPE_CONTROL:
 case DWG_TYPE_DIMSTYLE_CONTROL:case DWG_TYPE_APPID_CONTROL:return 1;
 case DWG_TYPE_IMAGEDEF:return 1; /* Immutable shared raster definition; not its reactor. */
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
/* Bounded opaque preservation: lookup table bytes have no decoded replacement.
   Accept only a separately delimited handle stream containing its sole owner.
   No guessed offsets, extra references, variable-size rewrites or dropped data. */
static int lookup_owner_stream(Dwg_Object *o,BITCODE_HV original,BITCODE_HV replacement)
{
 if(!o||o->fixedtype!=DWG_TYPE_BLOCKLOOKUPACTION||!o->unknown_bits||!o->num_unknown_bits||o->num_unknown_bits%8||o->num_unknown_rest||o->handlestream_size!=16||o->tio.object->num_eed||o->tio.object->num_reactors)return 0;
 if(o->tio.object->xdicobjhandle&&o->tio.object->xdicobjhandle->absolute_ref)return 0;
 size_t sizeBits=(size_t)o->size*8;if(sizeBits<o->num_unknown_bits)return 0;
 size_t start=sizeBits-o->num_unknown_bits;if(o->bitsize<start)return 0;
 size_t offset=o->bitsize-start;if(offset+16!=o->num_unknown_bits)return 0;
 Bit_Chain bits={0};bits.chain=o->unknown_bits;bits.size=o->num_unknown_bits/8;bits.version=bits.from_version=o->parent->header.version;bit_set_position(&bits,offset);
 Dwg_Handle h={0};if(bit_read_H(&bits,&h)||h.size!=1||(h.code!=10&&h.code!=12)||bit_position(&bits)!=o->num_unknown_bits)return 0;
 if((h.code==12&&h.value>original)||(h.code==10&&original>UINT64_MAX-h.value))return 0;
 BITCODE_HV owner=h.code==12?original-h.value:original+h.value;
 if(!replacement)return o->tio.object->ownerhandle&&o->tio.object->ownerhandle->absolute_ref==owner;
 BITCODE_HV delta=replacement>o->handle.value?replacement-o->handle.value:o->handle.value-replacement;
 if(!delta||delta>255)return 0;
 h.code=replacement>o->handle.value?10:12;h.size=1;h.value=delta;bit_set_position(&bits,offset);bit_write_H(&bits,&h);
 return bit_position(&bits)==o->num_unknown_bits;
}
/* Read-only diagnostic of typed decode coverage; never enables opaque cloning. */
API int pllato_probe_opaque(const char *handle)
{
 if(!loaded||!handle)return 1;
 int trace=strncmp(handle,"trace:",6)==0;if(trace)handle+=6;
 Dwg_Object *o=dwg_resolve_handle(&drawing,strtoull(handle,NULL,16));
 if(!o)return 2;
 if(o->type>=500&&o->type-500<drawing.num_classes)fprintf(stderr,"OPAQUE_CLASS %u %s\n",o->type,drawing.dwg_class[o->type-500].dxfname);
 fprintf(stderr,"OPAQUE %s bits=%u rest=%u common=%zu data=%u size=%u handlebits=%llu\n",o->name,o->num_unknown_bits,o->num_unknown_rest,o->common_size,o->bitsize,o->size,(unsigned long long)o->handlestream_size);
 if(o->fixedtype==DWG_TYPE_EVALUATION_GRAPH){
  Dwg_Object_EVALUATION_GRAPH *g=o->tio.object->tio.EVALUATION_GRAPH;
  fprintf(stderr,"OPAQUE_GRAPH nodes=%u edges=%u\n",g->num_nodes,g->num_edges);
 }
 Dwg_Object saved=*o;
 Bit_Chain raw={0},typed={0};bit_chain_init(&raw,65536);bit_chain_init(&typed,65536);
 raw.version=typed.version=drawing.header.version;raw.from_version=typed.from_version=drawing.header.from_version;
 int a=dwg_encode_add_object(o,&raw,16);size_t rawAddress=o->address,rawData=o->bitsize?o->bitsize:saved.bitsize;*o=saved;o->num_unknown_bits=0;
 extern unsigned int loglevel;unsigned previousLog=loglevel;if(trace)loglevel=9;
 pllato_encoded_payload_end=0;int b=dwg_encode_add_object(o,&typed,16);loglevel=previousLog;size_t payloadEnd=pllato_encoded_payload_end,typedAddress=o->address,typedData=o->bitsize;*o=saved;
 size_t ar=bit_position(&raw),bt=bit_position(&typed),n=(ar<bt?ar:bt)/8,first=0;
 while(first<n&&raw.chain[first]==typed.chain[first])first++;
 fprintf(stderr,"OPAQUE_ROUNDTRIP raw=%zu typed=%zu first_difference_byte=%zu errors=%d/%d\n",ar,bt,first,a,b);
 size_t full=payloadEnd/8;unsigned partial=payloadEnd%8;
 int equal=a<128&&b<128&&ar==bt&&payloadEnd>128&&payloadEnd<=bt-16&&memcmp(raw.chain,typed.chain,full)==0&&(!partial||((raw.chain[full]^typed.chain[full])&(0xffu<<(8-partial)))==0);
 fprintf(stderr,"OPAQUE_COVERAGE payload_end=%zu equal=%d\n",payloadEnd,equal);
 size_t dataBits=rawData<typedData?rawData:typedData,firstBit=0;
 for(;firstBit<dataBits;firstBit++){size_t ra=rawAddress*8+firstBit,ta=typedAddress*8+firstBit;if(((raw.chain[ra/8]>>(7-ra%8))&1)!=((typed.chain[ta/8]>>(7-ta%8))&1))break;}
 fprintf(stderr,"OPAQUE_DATA raw=%zu typed=%zu first_difference_bit=%zu\n",rawData,typedData,firstBit);
 if(trace){
  for(unsigned which=0;which<2;which++){
   Bit_Chain *chain=which?&typed:&raw;size_t address=which?typedAddress:rawAddress,end=which?typedData:rawData;
   fprintf(stderr,"OPAQUE_TAIL %s ",which?"typed":"raw");
   for(size_t p=end>80?end-80:0;p<end;p++){size_t at=address*8+p;fputc('0'+((chain->chain[at/8]>>(7-at%8))&1),stderr);}fputc('\n',stderr);
  }
 }
 free(raw.chain);free(typed.chain);return equal?0:3;
}
API int pllato_clone_selection(const char *roots,double cx,double cy,double x,double y,double angle)
{
 /* Each source object can enter the dependency graph at most once. */
 const unsigned limit=drawing.num_objects ? drawing.num_objects : 1;
 BITCODE_HV *queue=calloc(limit,sizeof(BITCODE_HV)),*mapped=calloc(limit,sizeof(BITCODE_HV));
 unsigned *indices=calloc(limit,sizeof(unsigned)),count=0,done=0;
 dwg_inthash *seen=hash_new(limit*2);
 const unsigned firstRef=drawing.num_object_refs;
 Dwg_Object *model=dwg_model_space_object(&drawing);
 if(!loaded||!roots||!isfinite(cx)||!isfinite(cy)||!isfinite(x)||!isfinite(y)||!isfinite(angle)){free(queue);free(mapped);free(indices);hash_free(seen);return 1;}
 if(!queue||!mapped||!indices||!seen||!model){free(queue);free(mapped);free(indices);hash_free(seen);return 1;}
 const BITCODE_HV modelHandle=model->handle.value;
 int error=0;
 const char *cursor=roots;
 while(*cursor){
  char *end;BITCODE_HV h=strtoull(cursor,&end,16);
  if(end==cursor||(*end&&*end!=',')||!h||count==limit){error=1;break;}
  Dwg_Object *o=dwg_resolve_handle(&drawing,h);
  if(!o||o->supertype!=DWG_SUPERTYPE_ENTITY){fprintf(stderr,"CLONE_REJECT_ROOT %llX %s\n",(unsigned long long)h,o?o->name:"missing");error=2;break;}
  if(hash_get(seen,h)==HASH_NOT_FOUND){hash_set(seen,h,count+1);queue[count++]=h;}
  cursor=*end?end+1:end;
 }
 /* Rectangle selection can contain a top-level INSERT and its ATTRIBs.
    Attributes are owned children, copied through INSERT.attribs, never roots.
    Accept a redundant child only when its verified parent is also selected. */
 unsigned rootsCount=0;
 for(unsigned i=0;!error&&i<count;i++){
  Dwg_Object *o=dwg_resolve_handle(&drawing,queue[i]);Dwg_Object_Entity *ent=o->tio.entity;
  if(o->fixedtype!=DWG_TYPE_ATTRIB&&(ent->entmode==2||(ent->ownerhandle&&ent->ownerhandle->absolute_ref==modelHandle))){queue[rootsCount++]=queue[i];continue;}
  int attached=0;
  if(o->fixedtype==DWG_TYPE_ATTRIB&&ent->ownerhandle){
   Dwg_Object *parent=dwg_ref_object(&drawing,ent->ownerhandle);
   if(parent&&parent->fixedtype==DWG_TYPE_INSERT&&hash_get(seen,parent->handle.value)!=HASH_NOT_FOUND){
    Dwg_Object_Entity *pe=parent->tio.entity;
    if(pe->entmode==2||(pe->ownerhandle&&pe->ownerhandle->absolute_ref==modelHandle)){
     Dwg_Entity_INSERT *in=pe->tio.INSERT;
     for(unsigned j=0;j<in->num_owned;j++)if(in->attribs[j]&&in->attribs[j]->absolute_ref==o->handle.value){attached=1;break;}
    }
   }
  }
  if(!attached){fprintf(stderr,"CLONE_REJECT_ROOT %llX %s owner=%llX\n",(unsigned long long)o->handle.value,o->name,(unsigned long long)(ent->ownerhandle?ent->ownerhandle->absolute_ref:0));error=2;}
 }
 count=rootsCount;
 if(!error){hash_free(seen);seen=hash_new(limit*2);if(!seen)error=1;else for(unsigned i=0;i<count;i++)hash_set(seen,queue[i],i+1);}
 if(error||!count){free(queue);free(mapped);free(indices);hash_free(seen);return error?error:1;}
 BITCODE_HV nextHandle=dwg_next_handle(&drawing);
 for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].handle.value>=nextHandle)nextHandle=drawing.object[i].handle.value+1;
 while(done<count){
  Dwg_Object *source=dwg_resolve_handle(&drawing,queue[done]);
  /* WIPEOUT stores a raw backup even when its fields are decoded. Raw bytes
     contain handles and cannot be copied: force the typed encoder below. */
  int typedWipeout=source&&source->fixedtype==DWG_TYPE_WIPEOUT;
  int rawLookup=lookup_owner_stream(source,queue[done],0);
  int typedBackup=0;
  /* Admit a raw-backup class only when its typed encoder reproduces EVERY
     semantic bit. CRC and precisely measured padding are not object fields. */
  if(!rawLookup&&source&&source->num_unknown_bits&&source->fixedtype!=DWG_TYPE_UNKNOWN_OBJ&&source->fixedtype!=DWG_TYPE_UNKNOWN_ENT){char h[32];snprintf(h,sizeof(h),"%llX",(unsigned long long)source->handle.value);typedBackup=pllato_probe_opaque(h)==0;}
  if(!source||(!rawLookup&&!typedBackup&&source->num_unknown_bits)||source->num_unknown_rest){fprintf(stderr,"CLONE_REJECT %llX %s bits=%u rest=%u\n",(unsigned long long)queue[done],source?source->name:"missing",source?source->num_unknown_bits:0,source?source->num_unknown_rest:0);if(source&&source->type>=500&&source->type-500<drawing.num_classes)fprintf(stderr,"CLONE_REJECT_CLASS %llX %s\n",(unsigned long long)queue[done],drawing.dwg_class[source->type-500].dxfname);error=10;break;}
  if(typedWipeout){Dwg_Entity_WIPEOUT *w=source->tio.entity->tio.WIPEOUT;if(w->class_version>10||!w->clip_verts||w->num_clip_verts<2||w->num_clip_verts>5000){error=25;break;}}
  int blockDependency=source->name&&strncmp(source->name,"BLOCK",5)==0;
  if(!typedBackup&&!blockDependency&&source->supertype!=DWG_SUPERTYPE_ENTITY && source->fixedtype!=DWG_TYPE_BLOCK_HEADER
     &&source->fixedtype!=DWG_TYPE_DICTIONARY&&source->fixedtype!=DWG_TYPE_XRECORD&&source->fixedtype!=DWG_TYPE_IMAGEDEF_REACTOR&&source->fixedtype!=DWG_TYPE_BLOCKREPRESENTATION&&source->fixedtype!=DWG_TYPE_EVALUATION_GRAPH&&source->fixedtype!=DWG_TYPE_SORTENTSTABLE&&source->fixedtype!=DWG_TYPE_FIELD){fprintf(stderr,"CLONE_REJECT_TYPE %s\n",source->name);error=11;break;}
  unsigned originalIndex=source->index,newIndex=drawing.num_objects,refs=drawing.num_object_refs;
  unsigned originalHandleSize=source->handle.size;
  BITCODE_HV handle=nextHandle++;
  Bit_Chain bits={0},hdl={0};bit_chain_init(&bits,65536);
  bits.version=drawing.header.version;bits.from_version=drawing.header.from_version;
  Dwg_Object sourceHeader=*source;if(typedBackup)source->num_unknown_bits=0;
  int e=dwg_encode_add_object(source,&bits,16);*source=sourceHeader;hdl=bits;
  if(e<128)e=dwg_decode_add_object(&drawing,&bits,&hdl,16);
  free(bits.chain);
  if(e>=128||drawing.num_objects!=newIndex+1){error=12;break;}
  Dwg_Object *copy=&drawing.object[newIndex];
  if(typedBackup){free(copy->unknown_bits);copy->unknown_bits=NULL;copy->num_unknown_bits=0;}
  copy->handle.value=handle;copy->handle.size=0;for(BITCODE_HV h=handle;h;h>>=8)copy->handle.size++;
  if(rawLookup&&copy->handle.size!=originalHandleSize){error=26;break;}
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
   if(target->fixedtype==DWG_TYPE_EVALUATION_GRAPH||copy->fixedtype==DWG_TYPE_BLOCKREPRESENTATION)
    fprintf(stderr,"CLONE_EDGE %llX %s -> %llX %s\n",(unsigned long long)queue[done],copy->name,(unsigned long long)value,target->name);
   if(hash_get(seen,value)==HASH_NOT_FOUND){if(count==limit){error=14;break;}hash_set(seen,value,count+1);queue[count++]=value;}
  }
  /* XDATA 1005 handles are scalar integers, not object_ref entries. */
  for(unsigned j=0;!error&&j<copy->tio.object->num_eed;j++){
   Dwg_Eed_Data *d=copy->tio.object->eed[j].data;if(!d||d->code!=5||!d->u.eed_5.entity)continue;
   BITCODE_HV value=d->u.eed_5.entity;Dwg_Object *target=dwg_resolve_handle(&drawing,value);
   if(!target){error=13;break;}if(value==modelHandle||clone_shared(target))continue;
   if(hash_get(seen,value)==HASH_NOT_FOUND){if(count==limit){error=14;break;}hash_set(seen,value,count+1);queue[count++]=value;}
  }
  if(error)break;done++;
 }
 if(!error){
  for(unsigned k=0;k<count;k++){
   Dwg_Object *o=&drawing.object[indices[k]];if(o->fixedtype!=DWG_TYPE_BLOCKLOOKUPACTION||!o->num_unknown_bits)continue;
   BITCODE_H ref=o->tio.object->ownerhandle;uint64_t found=ref?hash_get(seen,ref->absolute_ref):HASH_NOT_FOUND;
   if(found==HASH_NOT_FOUND||!lookup_owner_stream(o,queue[k],mapped[found-1])){error=27;break;}
   fprintf(stderr,"CLONE_RAW_LOOKUP %llX preserved\n",(unsigned long long)queue[k]);
  }
 }
 if(!error){
  for(unsigned k=0;k<count;k++){
   Dwg_Object_Object *common=drawing.object[indices[k]].tio.object;unsigned section=0;
   for(unsigned j=0;j<common->num_eed;j++){
    Dwg_Eed *eed=&common->eed[j];if(eed->size)section=j;
    if(!eed->data||eed->data->code!=5)continue;
    uint64_t found=hash_get(seen,eed->data->u.eed_5.entity);if(found==HASH_NOT_FOUND)continue;
    eed->data->u.eed_5.entity=mapped[found-1];free(common->eed[section].raw);common->eed[section].raw=NULL;
   }
  }
  for(unsigned j=firstRef;j<drawing.num_object_refs;j++){
   BITCODE_H ref=drawing.object_ref[j];BITCODE_HV value=ref->absolute_ref;
   uint64_t found=hash_get(seen,value);if(found!=HASH_NOT_FOUND)value=mapped[found-1];
   clone_ref_value(ref,value);
  }
  // This probe copies a complete top-level INSERT only. The independent
  // definition is registered separately, not exploded into visible primitives.
  for(unsigned k=0;k<count;k++){
   Dwg_Object *o=&drawing.object[indices[k]];
   if(o->fixedtype==DWG_TYPE_BLOCK_HEADER){
    Dwg_Object_BLOCK_HEADER *b=o->tio.object->tio.BLOCK_HEADER;
    char name[80];unsigned long long suffix=o->handle.value;
    do{snprintf(name,sizeof(name),b->anonymous?"*U%llu":"PLL_COPY_%llu",suffix++);}while(dwg_find_tablehandle(&drawing,name,"BLOCK"));
    free(b->name);b->name=dwg_add_u8_input(&drawing,name);
    Dwg_Object *begin=dwg_ref_object(&drawing,b->block_entity);
    if(!begin||begin->fixedtype!=DWG_TYPE_BLOCK){error=18;break;}
    free(begin->tio.entity->tio.BLOCK->name);
    begin->tio.entity->tio.BLOCK->name=dwg_add_u8_input(&drawing,name);
    free(b->inserts);b->inserts=NULL;b->num_inserts=0;
    Dwg_Object *control=dwg_ref_object(&drawing,o->tio.object->ownerhandle);
    if(!control||control->fixedtype!=DWG_TYPE_BLOCK_CONTROL){error=15;break;}
    Dwg_Object_BLOCK_CONTROL *bc=control->tio.object->tio.BLOCK_CONTROL;
    BITCODE_H *entries=realloc(bc->entries,(bc->num_entries+1)*sizeof(BITCODE_H));if(!entries){error=21;break;}bc->entries=entries;
    bc->entries[bc->num_entries++]=dwg_add_handleref(&drawing,2,o->handle.value,NULL);
   }
  }
  if(!error){
   char name[80];snprintf(name,sizeof(name),"PLL_SHEET_%llX",(unsigned long long)dwg_next_handle(&drawing));
   Dwg_Object_BLOCK_HEADER *group=dwg_add_BLOCK_HEADER(&drawing,name);
   if(!group||!dwg_add_BLOCK(group,name)){error=20;}
   else{
    int e=0;Dwg_Object *go=dwg_obj_generic_to_object(group,&e);
    if(!go||e)error=20;
    else{
     BITCODE_HV groupHandle=go->handle.value;
     group->base_pt.x=cx;group->base_pt.y=cy;
     for(unsigned k=0;k<count;k++){
      Dwg_Object *o=&drawing.object[indices[k]];
      if(o->supertype!=DWG_SUPERTYPE_ENTITY)continue;
      Dwg_Object_Entity *ent=o->tio.entity;
      if(ent->entmode==2||(ent->ownerhandle&&ent->ownerhandle->absolute_ref==modelHandle)){
       BITCODE_H *next=realloc(group->entities,(group->num_owned+1)*sizeof(BITCODE_H));if(!next){error=21;break;}
       group->entities=next;group->entities[group->num_owned++]=dwg_add_handleref(&drawing,4,o->handle.value,NULL);
       ent->ownerhandle=dwg_add_handleref(&drawing,4,groupHandle,NULL);ent->entmode=0;
      }
     }
     if(!error){
      if(group->num_owned){group->first_entity=group->entities[0];group->last_entity=group->entities[group->num_owned-1];}
      if(!dwg_add_ENDBLK(group))error=22;
      else{
       model=dwg_model_space_object(&drawing);dwg_point_3d p={x,y,0};
       Dwg_Entity_INSERT *insert=dwg_add_INSERT(model->tio.object->tio.BLOCK_HEADER,&p,name,1,1,1,angle);
       Dwg_Object *io=insert?dwg_obj_generic_to_object(insert,&e):NULL;
       if(!io||e)error=23;
       else{FILE *f=fopen("/clone-result.txt","w");if(!f)error=24;else{fprintf(f,"%llX",(unsigned long long)io->handle.value);fclose(f);}}
      }
     }
    }
   }
   // Rebuild reverse INSERT lists solely within cloned definitions.
   for(unsigned k=0;!error&&k<count;k++){Dwg_Object *o=&drawing.object[indices[k]];if(o->fixedtype!=DWG_TYPE_INSERT)continue;
    Dwg_Object *bo=dwg_ref_object(&drawing,o->tio.entity->tio.INSERT->block_header);
    if(!bo||bo->fixedtype!=DWG_TYPE_BLOCK_HEADER){error=17;break;}
    Dwg_Object_BLOCK_HEADER *bh=bo->tio.object->tio.BLOCK_HEADER;
    BITCODE_H *next=realloc(bh->inserts,(bh->num_inserts+1)*sizeof(BITCODE_H));if(!next){error=21;break;}
    bh->inserts=next;bh->inserts[bh->num_inserts++]=dwg_add_handleref(&drawing,4,o->handle.value,NULL);
   }
  }
 }
 free(queue);free(mapped);free(indices);hash_free(seen);return error;
}


API const char *pllato_last_handle(void){static char value[32];if(!loaded||!drawing.num_objects)return "";snprintf(value,sizeof(value),"%llX",(unsigned long long)drawing.object[drawing.num_objects-1].handle.value);return value;}
API int pllato_move(const char *handle,double dx,double dy){
 Dwg_Object *o=entity(handle);
 if(!o||o->fixedtype!=DWG_TYPE_INSERT||!o->tio.entity->tio.INSERT->has_attribs)return pllato_legacy_move(handle,dx,dy);
 Dwg_Entity_INSERT *in=o->tio.entity->tio.INSERT;
 if(!isfinite(dx)||!isfinite(dy)||in->extrusion.x||in->extrusion.y||in->extrusion.z!=1||!isfinite(in->ins_pt.x+dx)||!isfinite(in->ins_pt.y+dy))return 1;
 for(unsigned i=0;i<in->num_owned;i++){
  Dwg_Object *a=dwg_ref_object(&drawing,in->attribs[i]);if(!a||a->fixedtype!=DWG_TYPE_ATTRIB)return 2;
  Dwg_Entity_ATTRIB *t=a->tio.entity->tio.ATTRIB;
  if(t->mtext_type||t->extrusion.x||t->extrusion.y||t->extrusion.z!=1||!isfinite(t->ins_pt.x+dx)||!isfinite(t->ins_pt.y+dy)||!isfinite(t->alignment_pt.x+dx)||!isfinite(t->alignment_pt.y+dy))return 3;
 }
 in->ins_pt.x+=dx;in->ins_pt.y+=dy;
 for(unsigned i=0;i<in->num_owned;i++){Dwg_Entity_ATTRIB *t=dwg_ref_object(&drawing,in->attribs[i])->tio.entity->tio.ATTRIB;t->ins_pt.x+=dx;t->ins_pt.y+=dy;t->alignment_pt.x+=dx;t->alignment_pt.y+=dy;}
 return 0;
}
API int pllato_insert_angle(const char *handle,double angle){Dwg_Object *o=entity(handle);if(!o||o->fixedtype!=DWG_TYPE_INSERT||o->tio.entity->tio.INSERT->has_attribs||!isfinite(angle))return 1;o->tio.entity->tio.INSERT->rotation=angle;return 0;}

/* Delete only self-contained editable entities; dependency-bearing objects reject. */
API int pllato_remove(const char *handle){
 Dwg_Object *o=entity(handle);if(!o)return 1;
 if(o->fixedtype!=DWG_TYPE_LINE&&o->fixedtype!=DWG_TYPE_TEXT&&o->fixedtype!=DWG_TYPE_LWPOLYLINE&&o->fixedtype!=DWG_TYPE_INSERT)return 2;
 Dwg_Object_Entity *ent=o->tio.entity;
 if(ent->num_reactors||ent->xdicobjhandle&&ent->xdicobjhandle->absolute_ref)return 3;
 Dwg_Object *owner=ent->entmode==2?dwg_model_space_object(&drawing):dwg_ref_object(&drawing,ent->ownerhandle);
 if(!owner||owner->fixedtype!=DWG_TYPE_BLOCK_HEADER)return 4;
 Dwg_Object_BLOCK_HEADER *b=owner->tio.object->tio.BLOCK_HEADER;
 unsigned pos=b->num_owned;for(unsigned i=0;i<b->num_owned;i++)if(b->entities[i]->absolute_ref==o->handle.value){pos=i;break;}
 if(pos==b->num_owned)return 5;
 if(o->fixedtype==DWG_TYPE_INSERT){
  Dwg_Entity_INSERT *in=ent->tio.INSERT;
  for(unsigned i=0;i<in->num_owned;i++){Dwg_Object *a=dwg_ref_object(&drawing,in->attribs[i]);if(!a||a->fixedtype!=DWG_TYPE_ATTRIB||a->tio.entity->num_reactors)return 6;}
  Dwg_Object *definition=dwg_ref_object(&drawing,in->block_header);if(!definition||definition->fixedtype!=DWG_TYPE_BLOCK_HEADER)return 6;
  Dwg_Object_BLOCK_HEADER *db=definition->tio.object->tio.BLOCK_HEADER;
  for(unsigned i=0;i<db->num_inserts;i++)if(db->inserts[i]->absolute_ref==o->handle.value){for(unsigned j=i+1;j<db->num_inserts;j++)db->inserts[j-1]=db->inserts[j];db->num_inserts--;break;}
  for(unsigned i=0;i<in->num_owned;i++)dwg_free_object(dwg_ref_object(&drawing,in->attribs[i]));
  if(in->seqend){Dwg_Object *seq=dwg_ref_object(&drawing,in->seqend);if(seq&&seq->fixedtype==DWG_TYPE_SEQEND)dwg_free_object(seq);}
 }
 for(unsigned i=pos+1;i<b->num_owned;i++)b->entities[i-1]=b->entities[i];b->num_owned--;
 b->first_entity=b->num_owned?b->entities[0]:NULL;b->last_entity=b->num_owned?b->entities[b->num_owned-1]:NULL;
 dwg_free_object(o);return 0;
}
/* Compare every typed semantic bit, including preserved data-stream tails and
   remapped handles, after a save/read cycle. Padding and CRC are not fields. */
static int same_typed_record(Dwg_Object *a,Dwg_Object *b){
 Bit_Chain bits[2]={{0},{0}};size_t ends[2]={0,0};int errors[2]={0,0};
 Dwg_Object *objects[2]={a,b};
 for(unsigned i=0;i<2;i++){
  Dwg_Object *o=objects[i],saved=*o;bit_chain_init(&bits[i],65536);
  bits[i].version=o->parent->header.version;bits[i].from_version=o->parent->header.from_version;
  o->num_unknown_bits=0;pllato_encoded_payload_end=0;
  errors[i]=dwg_encode_add_object(o,&bits[i],16);ends[i]=pllato_encoded_payload_end;*o=saved;
 }
 size_t n=ends[0]/8;unsigned partial=ends[0]%8;
 int equal=errors[0]<128&&errors[1]<128&&ends[0]>128&&ends[0]==ends[1]
  &&ends[0]<=bit_position(&bits[0])&&ends[1]<=bit_position(&bits[1])
  &&!memcmp(bits[0].chain,bits[1].chain,n)
  &&(!partial||!((bits[0].chain[n]^bits[1].chain[n])&(0xffu<<(8-partial))));
 free(bits[0].chain);free(bits[1].chain);return equal;
}
API int pllato_save(const char *path){
 if(!loaded||drawing.header.version==R_2007||drawing.header.version!=drawing.header.from_version)return DWG_ERR_INVALIDDWG;
 unsigned expected=0;for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].type!=DWG_TYPE_FREED&&drawing.object[i].type!=DWG_TYPE_UNUSED)expected++;
 int error=dwg_write_file(path,&drawing);fprintf(stderr,"SAVE_WRITTEN code=%d\n",error);if(error>=128)return error;
 Dwg_Data check={0};error=dwg_read_file(path,&check);
 fprintf(stderr,"SAVE_CHECK expected=%u actual=%u read=%d\n",expected,check.num_objects,error);
 if(error<128&&check.num_objects!=expected)error|=DWG_ERR_INVALIDDWG;
 for(unsigned i=0;error<128&&i<drawing.num_objects;i++){
  Dwg_Object *a=&drawing.object[i],*b=dwg_resolve_handle(&check,a->handle.value);
  if(a->type==DWG_TYPE_FREED||a->type==DWG_TYPE_UNUSED){if(b)error|=DWG_ERR_INVALIDDWG;continue;}
  if(!b||b->fixedtype!=a->fixedtype){fprintf(stderr,"SAVE_REJECT_TYPE %llX %s\n",(unsigned long long)a->handle.value,a->name);error|=DWG_ERR_INVALIDDWG;break;}
  if(a->fixedtype==DWG_TYPE_BLOCKLOOKUPACTION&&a->num_unknown_bits){
   if(a->num_unknown_bits!=b->num_unknown_bits||!b->unknown_bits||memcmp(a->unknown_bits,b->unknown_bits,a->num_unknown_bits/8))error|=DWG_ERR_INVALIDDWG;
   BITCODE_H ah=a->tio.object->ownerhandle,bh=b->tio.object->ownerhandle;if(!ah||!bh||ah->absolute_ref!=bh->absolute_ref)error|=DWG_ERR_INVALIDDWG;
   if(error>=128){size_t n=a->num_unknown_bits<b->num_unknown_bits?a->num_unknown_bits:b->num_unknown_bits,j=0;for(;b->unknown_bits&&j<n/8&&a->unknown_bits[j]==b->unknown_bits[j];j++){/* Find the first differing raw byte. */}fprintf(stderr,"SAVE_LOOKUP bits=%u/%u first=%zu owner=%llX/%llX\n",a->num_unknown_bits,b->num_unknown_bits,j,(unsigned long long)(ah?ah->absolute_ref:0),(unsigned long long)(bh?bh->absolute_ref:0));}
  }
  if(a->tio.object->num_eed!=b->tio.object->num_eed){fprintf(stderr,"SAVE_REJECT_EED %llX %s %u/%u\n",(unsigned long long)a->handle.value,a->name,a->tio.object->num_eed,b->tio.object->num_eed);error|=DWG_ERR_INVALIDDWG;break;}
  for(unsigned j=0;j<a->tio.object->num_eed;j++){
   Dwg_Eed_Data *ad=a->tio.object->eed[j].data,*bd=b->tio.object->eed[j].data;
   if(ad&&ad->code==5&&(!bd||bd->code!=5||ad->u.eed_5.entity!=bd->u.eed_5.entity)){error|=DWG_ERR_INVALIDDWG;break;}
  }
  if(a->fixedtype==DWG_TYPE_INSERT){BITCODE_H ar=a->tio.entity->tio.INSERT->block_header,br=b->tio.entity->tio.INSERT->block_header;if(!ar||!br||ar->absolute_ref!=br->absolute_ref)error|=DWG_ERR_INVALIDDWG;}
  if(a->fixedtype==DWG_TYPE_MULTILEADER&&!same_typed_record(a,b))error|=DWG_ERR_INVALIDDWG;
  if(a->fixedtype==DWG_TYPE_DIMASSOC){
   Dwg_Object_DIMASSOC *ar=a->tio.object->tio.DIMASSOC,*br=b->tio.object->tio.DIMASSOC;
   BITCODE_H ah=a->tio.object->ownerhandle,bh=b->tio.object->ownerhandle;
   if(!ah||!bh||ah->absolute_ref!=bh->absolute_ref||!ar->dimensionobj||!br->dimensionobj||ar->dimensionobj->absolute_ref!=br->dimensionobj->absolute_ref||ar->associativity!=br->associativity||!ar->ref||!br->ref)error|=DWG_ERR_INVALIDDWG;
   for(unsigned j=0;error<128&&j<6;j++){
    Dwg_DIMASSOC_Ref *ap=&ar->ref[j],*bp=&br->ref[j];
    if(ap->has_lastpt_ref!=bp->has_lastpt_ref||ap->osnap_type!=bp->osnap_type||ap->num_xrefs!=bp->num_xrefs||ap->num_intsectobj!=bp->num_intsectobj||ap->osnap_dist!=bp->osnap_dist||memcmp(&ap->osnap_pt,&bp->osnap_pt,sizeof(ap->osnap_pt))){error|=DWG_ERR_INVALIDDWG;break;}
    if((ap->num_xrefs&&(!ap->xrefs||!bp->xrefs))||(ap->num_intsectobj&&(!ap->intsectobj||!bp->intsectobj))){error|=DWG_ERR_INVALIDDWG;break;}
    for(unsigned k=0;k<ap->num_xrefs;k++)if(!ap->xrefs[k]||!bp->xrefs[k]||ap->xrefs[k]->absolute_ref!=bp->xrefs[k]->absolute_ref)error|=DWG_ERR_INVALIDDWG;
    for(unsigned k=0;k<ap->num_intsectobj;k++)if(!ap->intsectobj[k]||!bp->intsectobj[k]||ap->intsectobj[k]->absolute_ref!=bp->intsectobj[k]->absolute_ref)error|=DWG_ERR_INVALIDDWG;
   }
  }
  if(a->fixedtype==DWG_TYPE_BLOCKREPRESENTATION){
   Dwg_Object_BLOCKREPRESENTATION *ar=a->tio.object->tio.BLOCKREPRESENTATION,*br=b->tio.object->tio.BLOCKREPRESENTATION;
   if(ar->flag!=br->flag||!ar->block||!br->block||ar->block->absolute_ref!=br->block->absolute_ref)error|=DWG_ERR_INVALIDDWG;
  }
  if(a->fixedtype==DWG_TYPE_WIPEOUT){
   Dwg_Entity_WIPEOUT *ar=a->tio.entity->tio.WIPEOUT,*br=b->tio.entity->tio.WIPEOUT;
   if(ar->class_version!=br->class_version||memcmp(&ar->pt0,&br->pt0,sizeof(ar->pt0))||memcmp(&ar->uvec,&br->uvec,sizeof(ar->uvec))||memcmp(&ar->vvec,&br->vvec,sizeof(ar->vvec))||memcmp(&ar->image_size,&br->image_size,sizeof(ar->image_size))||ar->num_clip_verts!=br->num_clip_verts||ar->clip_boundary_type!=br->clip_boundary_type||ar->clip_mode!=br->clip_mode||ar->clipping!=br->clipping||ar->display_props!=br->display_props||ar->brightness!=br->brightness||ar->contrast!=br->contrast||ar->fade!=br->fade)error|=DWG_ERR_INVALIDDWG;
   if(error<128&&ar->num_clip_verts&&memcmp(ar->clip_verts,br->clip_verts,ar->num_clip_verts*sizeof(BITCODE_2RD)))error|=DWG_ERR_INVALIDDWG;
   if((ar->imagedef?ar->imagedef->absolute_ref:0)!=(br->imagedef?br->imagedef->absolute_ref:0)||(ar->imagedefreactor?ar->imagedefreactor->absolute_ref:0)!=(br->imagedefreactor?br->imagedefreactor->absolute_ref:0))error|=DWG_ERR_INVALIDDWG;
  }
  if(error>=128)fprintf(stderr,"SAVE_REJECT_FIELDS %llX %s\n",(unsigned long long)a->handle.value,a->name);
 }
 dwg_free(&check);return error;
}
