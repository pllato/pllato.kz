/* Closed-graph extraction, used only on the disposable export database.
   Native records and handles are preserved; display primitives are not used.
   Registry membership is filtered, but semantic dependencies are never cut. */
extern const Dwg_DYNAPI_field *dwg_dynapi_header_fields(void);
#ifndef PLLATO_EXPORT_SUPPORT_PATH
#define PLLATO_EXPORT_SUPPORT_PATH "/export-support.txt"
#endif
typedef struct {
 unsigned char *mark,*roots; unsigned *queue,count,done,capacity; int error;
} ExportGraph;
static int export_dictionary(Dwg_Object *o){return o&&(o->fixedtype==DWG_TYPE_DICTIONARY||o->fixedtype==DWG_TYPE_DICTIONARYWDFLT);}
static int export_layout_block(Dwg_Object *o){
 return o&&o->fixedtype==DWG_TYPE_BLOCK_HEADER&&(o==dwg_model_space_object(&drawing)
  ||(drawing.header_vars.BLOCK_RECORD_PSPACE&&o->handle.value==drawing.header_vars.BLOCK_RECORD_PSPACE->absolute_ref)
  ||(drawing.header_vars.BLOCK_RECORD_MSPACE&&o->handle.value==drawing.header_vars.BLOCK_RECORD_MSPACE->absolute_ref)
  ||(o->tio.object->tio.BLOCK_HEADER->layout&&o->tio.object->tio.BLOCK_HEADER->layout->absolute_ref));
}
static int export_root(Dwg_Object *o){
 if(!o||o->supertype!=DWG_SUPERTYPE_ENTITY||dwg_obj_is_subentity(o)||o->fixedtype==DWG_TYPE_BLOCK||o->fixedtype==DWG_TYPE_ENDBLK)return 0;
 Dwg_Object_Entity *e=o->tio.entity;
 return e->entmode==1||e->entmode==2||export_layout_block(dwg_ref_object(&drawing,e->ownerhandle));
}
static void export_mark(ExportGraph *g,BITCODE_HV h,int mode){
 if(g->error||!h)return;Dwg_Object *o=dwg_resolve_handle(&drawing,h);
 if(!o||o->type==DWG_TYPE_FREED||o->type==DWG_TYPE_UNUSED){fprintf(stderr,"EXPORT_REJECT missing=%llX\n",(unsigned long long)h);g->error=2;return;}
 if(export_root(o)&&!g->roots[o->index]){
  if(o->fixedtype==DWG_TYPE_VIEWPORT)g->roots[o->index]=2;
  else{fprintf(stderr,"EXPORT_REJECT unselected_root=%llX type=%s\n",(unsigned long long)h,o->name);g->error=3;return;}
 }
 if(dwg_obj_is_control(o)||export_layout_block(o)||global_assoc_network(o))mode=1;
 else if(export_dictionary(o)){
  Dwg_Object *nod=dwg_ref_object(&drawing,drawing.header_vars.DICTIONARY_NAMED_OBJECT);
  if(o==nod)mode=1;
 }
 else mode=2;
 if(g->mark[o->index]>=mode)return;
 if(g->count>=g->capacity){g->error=4;return;}
 g->mark[o->index]=mode;g->queue[g->count++]=o->index;
}
static int export_in_refs(BITCODE_H ref,BITCODE_H *refs,unsigned n){
 for(unsigned i=0;refs&&i<n;i++)if(refs[i]==ref)return 1;return 0;
}
static int export_table(Dwg_Object *o){return o&&o->type>=500&&o->type-500<drawing.num_classes&&!strcmp(drawing.dwg_class[o->type-500].dxfname,"ACAD_TABLE");}
static int export_membership_reactor(Dwg_Object *o,BITCODE_H ref){
 if(!ref||o->supertype!=DWG_SUPERTYPE_OBJECT)return 0;
 Dwg_Object *target=dwg_resolve_handle(&drawing,ref->absolute_ref);BITCODE_H style=NULL;
 if(o->fixedtype==DWG_TYPE_TABLESTYLE&&export_table(target)){
  TableRef *refs=NULL;unsigned n=0;int found=0;
  if(!opaque_handle_refs(target,target->handle.value,&refs,&n))return 0;
  for(unsigned i=0;i<n;i++)if(refs[i].value==o->handle.value)found=1;free(refs);return found;
 }
 if(o->fixedtype!=DWG_TYPE_DIMSTYLE&&o->fixedtype!=DWG_TYPE_MLEADERSTYLE)return 0;
 return target&&target->supertype==DWG_SUPERTYPE_ENTITY
  &&dwg_dynapi_entity_value(target->tio.entity->tio.LINE,target->name,o->fixedtype==DWG_TYPE_DIMSTYLE?"dimstyle":"mleaderstyle",&style,NULL)
  &&style&&style->absolute_ref==o->handle.value;
}
static int export_sort_registry(Dwg_Object *o){return o->fixedtype==DWG_TYPE_SORTENTSTABLE&&export_layout_block(dwg_ref_object(&drawing,o->tio.object->tio.SORTENTSTABLE->block_owner));}
static int export_skip_ref(Dwg_Object *o,BITCODE_H ref,int mode){
 if(export_membership_reactor(o,ref)&&export_in_refs(ref,o->tio.object->reactors,o->tio.object->num_reactors))return 1;
 if(o->supertype==DWG_SUPERTYPE_ENTITY){Dwg_Object_Entity *e=o->tio.entity;if(ref==e->prev_entity||ref==e->next_entity)return 1;}
 if(o->fixedtype==DWG_TYPE_BLOCK_HEADER){
  Dwg_Object_BLOCK_HEADER *b=o->tio.object->tio.BLOCK_HEADER;
  if(export_in_refs(ref,b->inserts,b->num_inserts))return 1;
  /* The scratch record belongs to a different Dwg_Data: use mode, not identity. */
  if(mode==1&&(ref==b->first_entity||ref==b->last_entity||export_in_refs(ref,b->entities,b->num_owned)))return 1;
 }
 if(dwg_obj_is_control(o)){
  Dwg_Object_BLOCK_CONTROL *c=o->tio.object->tio.BLOCK_CONTROL;
  if(export_in_refs(ref,c->entries,c->num_entries))return 1;
 }
 if(mode==1&&export_dictionary(o)){
  Dwg_Object_DICTIONARY *d=o->tio.object->tio.DICTIONARY;
  if(export_in_refs(ref,d->itemhandles,d->numitems))return 1;
 }
 if(mode==1&&o->fixedtype==DWG_TYPE_ASSOCNETWORK){
  Dwg_Object_ASSOCNETWORK *n=o->tio.object->tio.ASSOCNETWORK;
  for(unsigned i=0;i<n->num_actions;i++)if(n->actions[i].dep==ref)return 1;
  if(export_in_refs(ref,n->owned_actions,n->num_owned_actions))return 1;
 }
 return 0;
}
/* Decode an isolated encoded native record to enumerate its complete handle
   stream, including nested schema fields. No mutation of the source graph. */
static int export_visit(ExportGraph *g,Dwg_Object *o,int verify){
 int rawLookup=lookup_owner_stream(o,o->handle.value,0),rawTable=raw_table(o),typed=0;
 if(o->num_unknown_rest){fprintf(stderr,"EXPORT_REJECT unknown_rest %s\n",o->name);return 5;}
 if(o->num_unknown_bits&&!rawLookup&&!rawTable){
  char h[32];snprintf(h,sizeof(h),"%llX",(unsigned long long)o->handle.value);
  /* Unlike cloning, extraction keeps original handles. A complete separately
     bounded raw handle stream can therefore be preserved byte-for-byte. */
  TableRef *refs=NULL;unsigned count=0;
  if(opaque_handle_refs(o,o->handle.value,&refs,&count)){rawTable=1;free(refs);}
  else if(o->fixedtype==DWG_TYPE_UNKNOWN_ENT||o->fixedtype==DWG_TYPE_UNKNOWN_OBJ||pllato_probe_opaque(h)){fprintf(stderr,"EXPORT_REJECT opaque %s %s\n",h,o->name);return 5;}else typed=1;
 }
 if(rawTable){
  TableRef *refs=NULL;unsigned n=0;if(!opaque_handle_refs(o,o->handle.value,&refs,&n))return 5;
  for(unsigned i=0;i<n&&!g->error;i++){
   if(!verify&&o->fixedtype==DWG_TYPE_TABLESTYLE&&i>0&&i<=o->tio.object->num_reactors
      &&o->tio.object->reactors[i-1]&&refs[i].value==o->tio.object->reactors[i-1]->absolute_ref
      &&export_membership_reactor(o,o->tio.object->reactors[i-1]))continue;
   Dwg_Object *target=refs[i].value?dwg_resolve_handle(&drawing,refs[i].value):NULL;
   if(verify&&refs[i].value&&(!target||!g->mark[target->index]))g->error=6;
   else if(!verify){BITCODE_H owner=o->supertype==DWG_SUPERTYPE_ENTITY?o->tio.entity->ownerhandle:o->tio.object->ownerhandle;export_mark(g,refs[i].value,owner&&owner->absolute_ref==refs[i].value?1:2);if(g->error)fprintf(stderr,"EXPORT_EDGE_RAW %llX %s -> %llX\n",(unsigned long long)o->handle.value,o->name,(unsigned long long)refs[i].value);}
  }
  for(unsigned i=0;i<o->tio.object->num_eed&&!g->error;i++){
   Dwg_Eed *e=&o->tio.object->eed[i];if(e->handle.code>5){g->error=6;break;}BITCODE_HV values[2]={e->handle.value,e->data&&e->data->code==5?e->data->u.eed_5.entity:0};
   for(unsigned j=0;j<2;j++)if(values[j]){Dwg_Object *t=dwg_resolve_handle(&drawing,values[j]);if(verify&&(!t||!g->mark[t->index]))g->error=6;else if(!verify)export_mark(g,values[j],2);}
  }free(refs);return g->error;
 }
 Dwg_Data scratch={0};scratch.header.version=drawing.header.version;scratch.header.from_version=drawing.header.from_version;
 scratch.num_classes=drawing.num_classes;scratch.dwg_class=drawing.dwg_class;scratch.object_map=hash_new(16);
 Bit_Chain bits={0},hdl={0};bit_chain_init(&bits,65536);bits.version=drawing.header.version;bits.from_version=drawing.header.from_version;
 /* O(1) registry masking avoids encoding/scanning hundreds of thousands of
    excluded model roots. Restore every field immediately after encoding. */
 Dwg_Object_BLOCK_HEADER blockSaved;Dwg_Object_BLOCK_CONTROL controlSaved;
 Dwg_Object_DICTIONARY dictionarySaved;Dwg_Object_ASSOCNETWORK networkSaved;unsigned sortCount=0;
 int blockMask=!verify&&o->fixedtype==DWG_TYPE_BLOCK_HEADER;
 int controlMask=!verify&&dwg_obj_is_control(o);
 int dictionaryMask=!verify&&g->mark[o->index]==1&&export_dictionary(o);
 int networkMask=!verify&&g->mark[o->index]==1&&o->fixedtype==DWG_TYPE_ASSOCNETWORK;
 int sortMask=!verify&&export_sort_registry(o);
 if(blockMask){Dwg_Object_BLOCK_HEADER *b=o->tio.object->tio.BLOCK_HEADER;blockSaved=*b;b->num_inserts=0;
  if(g->mark[o->index]==1){b->num_owned=0;b->first_entity=b->last_entity=NULL;}}
 if(controlMask){Dwg_Object_BLOCK_CONTROL *c=o->tio.object->tio.BLOCK_CONTROL;memcpy(&controlSaved,c,offsetof(Dwg_Object_BLOCK_CONTROL,model_space));c->num_entries=0;}
 if(dictionaryMask){Dwg_Object_DICTIONARY *d=o->tio.object->tio.DICTIONARY;dictionarySaved=*d;d->numitems=0;}
 if(networkMask){Dwg_Object_ASSOCNETWORK *a=o->tio.object->tio.ASSOCNETWORK;networkSaved=*a;a->num_actions=a->num_owned_actions=0;}
 if(sortMask){sortCount=o->tio.object->tio.SORTENTSTABLE->num_ents;o->tio.object->tio.SORTENTSTABLE->num_ents=0;}
 Dwg_Object saved=*o;if(typed)o->num_unknown_bits=0;
 int error=dwg_encode_add_object(o,&bits,16);*o=saved;hdl=bits;
 if(blockMask)*o->tio.object->tio.BLOCK_HEADER=blockSaved;
 if(controlMask)memcpy(o->tio.object->tio.BLOCK_CONTROL,&controlSaved,offsetof(Dwg_Object_BLOCK_CONTROL,model_space));
 if(dictionaryMask)*o->tio.object->tio.DICTIONARY=dictionarySaved;
 if(networkMask)*o->tio.object->tio.ASSOCNETWORK=networkSaved;
 if(sortMask)o->tio.object->tio.SORTENTSTABLE->num_ents=sortCount;
 if(error<128)error=dwg_decode_add_object(&scratch,&bits,&hdl,16);free(bits.chain);
 if(error>=128||scratch.num_objects!=1){fprintf(stderr,"EXPORT_REJECT decode %s code=%d\n",o->name,error);error=7;}
 else{
  error=0;Dwg_Object *copy=&scratch.object[0];
  for(unsigned i=0;i<scratch.num_object_refs&&!g->error;i++){
   BITCODE_H ref=scratch.object_ref[i];if(!ref||!ref->absolute_ref)continue;
   /* Sort handles are draw-order keys, not object references (DWG code 0). */
   if(copy->fixedtype==DWG_TYPE_SORTENTSTABLE&&export_in_refs(ref,copy->tio.object->tio.SORTENTSTABLE->sort_ents,copy->tio.object->tio.SORTENTSTABLE->num_ents))continue;
   if(!verify&&export_skip_ref(copy,ref,g->mark[o->index]))continue;
   Dwg_Object *target=dwg_resolve_handle(&drawing,ref->absolute_ref);
   if(verify){if(!target||!g->mark[target->index]){fprintf(stderr,"EXPORT_REJECT dangling %s %llX -> %llX\n",o->name,(unsigned long long)o->handle.value,(unsigned long long)ref->absolute_ref);g->error=6;}}
   else {BITCODE_H owner=copy->supertype==DWG_SUPERTYPE_ENTITY?copy->tio.entity->ownerhandle:copy->tio.object->ownerhandle;export_mark(g,ref->absolute_ref,ref==owner?1:2);if(g->error)fprintf(stderr,"EXPORT_EDGE %llX %s -> %llX\n",(unsigned long long)o->handle.value,o->name,(unsigned long long)ref->absolute_ref);}
  }
  /* XDATA 1005 is a scalar handle, outside the ordinary reference stream. */
  for(unsigned i=0;i<copy->tio.object->num_eed&&!g->error;i++){
   Dwg_Eed *e=&copy->tio.object->eed[i];Dwg_Object_Ref app={0};app.handleref=e->handle;
   if(e->handle.value&&!dwg_resolve_handleref(&app,copy)){g->error=6;break;}
   Dwg_Eed_Data *d=e->data;BITCODE_HV values[2]={app.absolute_ref,d&&d->code==5?d->u.eed_5.entity:0};
   for(unsigned j=0;j<2;j++)if(values[j]){Dwg_Object *target=dwg_resolve_handle(&drawing,values[j]);if(verify&&(!target||!g->mark[target->index]))g->error=6;else if(!verify)export_mark(g,values[j],2);}
  }
 }
 scratch.dwg_class=NULL;scratch.num_classes=0;dwg_free(&scratch);return error?error:g->error;
}
static int export_kept(ExportGraph *g,BITCODE_H ref){Dwg_Object *o=ref?dwg_resolve_handle(&drawing,ref->absolute_ref):NULL;return o&&g->mark[o->index];}
static unsigned export_filter(ExportGraph *g,BITCODE_H *refs,unsigned n){unsigned count=0;for(unsigned i=0;refs&&i<n;i++)if(export_kept(g,refs[i]))refs[count++]=refs[i];return count;}
static unsigned export_bl_bits(unsigned n){return n==0?2:n<=255?10:34;}
/* TABLESTYLE's cell-style data is not fully decoded. Rebuild ONLY its proven
   common reactor segment, retaining every other raw bit and every handle.
   Old/new boundaries and every common reactor are checked before mutation. */
static int export_raw_style_reactors(Dwg_Object *o,BITCODE_H *next,unsigned count){
 Dwg_Object_Object *c=o->tio.object;TableRef *refs=NULL;unsigned n=0,oldCount=c->num_reactors;
 if(o->fixedtype!=DWG_TYPE_TABLESTYLE||!opaque_handle_refs(o,o->handle.value,&refs,&n)||n<c->num_reactors+1){free(refs);return 0;}
 if(refs[0].value!=(c->ownerhandle?c->ownerhandle->absolute_ref:0)){free(refs);return 0;}
 for(unsigned i=0;i<c->num_reactors;i++)if(!c->reactors[i]||refs[i+1].value!=c->reactors[i]->absolute_ref){free(refs);return 0;}
 size_t first=refs[0].offset+8+8*refs[0].encoded.size,last=first;
 if(c->num_reactors){TableRef *r=&refs[c->num_reactors];last=r->offset+8+8*r->encoded.size;}
 Bit_Chain out={0};bit_chain_init(&out,(o->num_unknown_bits+7)/8+count*9+64);out.version=out.from_version=drawing.header.version;
 unsigned char *original=raw_chain(o);if(!original){free(refs);free(out.chain);return 0;}
 for(size_t p=0;p<first;p++)bit_write_B(&out,(original[p/8]>>(7-p%8))&1);
 for(unsigned i=0;i<count;i++){Dwg_Handle h=next[i]->handleref;bit_write_H(&out,&h);}
 size_t after=bit_position(&out);
 for(size_t p=last;p<o->num_unknown_bits;p++)bit_write_B(&out,(original[p/8]>>(7-p%8))&1);
 long delta=(long)after-(long)last,common=(long)export_bl_bits(c->num_reactors)-(long)export_bl_bits(count);
 size_t total=bit_position(&out);
 if(delta%8||common%8||(long)o->size+(delta-common)/8<=0||(long)o->bitsize-common<0){free(original);free(refs);free(out.chain);return 0;}
 pack_raw_tail(out.chain,total);free(o->unknown_bits);o->unknown_bits=out.chain;o->num_unknown_bits=total;
 o->size+=(delta-common)/8;o->bitsize-=common;o->handlestream_size+=delta;
 free(c->reactors);c->reactors=next;c->num_reactors=count;
 TableRef *proof=NULL;unsigned proofCount=0;int ok=opaque_handle_refs(o,o->handle.value,&proof,&proofCount);
 if(ok){
  if(proofCount!=n-oldCount+count||proof[0].value!=refs[0].value)ok=0;
  for(unsigned i=0;i<count;i++)if(i+1>=proofCount||proof[i+1].value!=next[i]->absolute_ref)ok=0;
  for(unsigned i=oldCount+1;ok&&i<n;i++){TableRef *a=&refs[i],*b=&proof[i-oldCount+count];if(a->value!=b->value||a->encoded.code!=b->encoded.code||a->encoded.size!=b->encoded.size||a->encoded.value!=b->encoded.value)ok=0;}
 }
 free(proof);free(original);free(refs);return ok;
}
API int pllato_export_selection(const char *roots){
 selected_export_validated=0;
 if(!loaded||!roots||!*roots||drawing.header.version<R_2010||drawing.header.version!=drawing.header.from_version)return 1;
 ExportGraph g={0};unsigned n=drawing.num_objects;g.capacity=n*2;
 g.mark=calloc(n,1);g.roots=calloc(n,1);g.queue=calloc(g.capacity,sizeof(unsigned));
 if(!g.mark||!g.roots||!g.queue){g.error=4;goto done;}
 for(const char *p=roots;*p;){
  char *end;BITCODE_HV h=strtoull(p,&end,16);Dwg_Object *o=dwg_resolve_handle(&drawing,h);
  if(end==p||(*end&&*end!=',')||!o||!export_root(o)){g.error=1;goto done;}
  g.roots[o->index]=1;p=*end?end+1:end;
 }
 for(unsigned i=0;i<n;i++)if(g.roots[i])export_mark(&g,drawing.object[i].handle.value,2);
 /* Header defaults and global registries are retained as containers. Their
    unreferenced contents do not make an unselected plan part of the export. */
 for(const Dwg_DYNAPI_field *f=dwg_dynapi_header_fields();f->name;f++){
  if(!strcmp(f->type,"H")&&strcmp(f->name,"HANDSEED")){
   BITCODE_H ref=*(BITCODE_H*)((char*)&drawing.header_vars+f->offset);if(ref)export_mark(&g,ref->absolute_ref,1);
  }else if(!strcmp(f->type,"CMC")){
   Dwg_Color *c=(Dwg_Color*)((char*)&drawing.header_vars+f->offset);if(c->handle)export_mark(&g,c->handle->absolute_ref,2);
  }
 }
 BITCODE_H metadata=dwg_find_dictionary(&drawing,"PLLATO_EXECUTIVE_V1");if(metadata)export_mark(&g,metadata->absolute_ref,2);
 while(!g.error&&g.done<g.count){unsigned index=g.queue[g.done++];g.error=export_visit(&g,&drawing.object[index],0);}
 if(g.error)goto done;
 /* Membership-only edges may be filtered; all other edges were followed. */
 for(unsigned i=0;i<n;i++)if(g.mark[i]){
  Dwg_Object *o=&drawing.object[i];
  if(o->fixedtype==DWG_TYPE_DIMSTYLE||o->fixedtype==DWG_TYPE_MLEADERSTYLE){Dwg_Object_Object *c=o->tio.object;unsigned k=0;
   for(unsigned j=0;j<c->num_reactors;j++)if(export_kept(&g,c->reactors[j])||!export_membership_reactor(o,c->reactors[j]))c->reactors[k++]=c->reactors[j];c->num_reactors=k;}
  if(o->fixedtype==DWG_TYPE_TABLESTYLE){
   Dwg_Object_Object *c=o->tio.object;unsigned k=0,tableCount=0;for(unsigned j=0;j<n;j++)if(g.mark[j]&&export_table(&drawing.object[j]))tableCount++;
   BITCODE_H *next=calloc(tableCount+c->num_reactors+1,sizeof(BITCODE_H));if(!next){g.error=4;goto done;}
   for(unsigned j=0;j<c->num_reactors;j++)if(export_kept(&g,c->reactors[j])||!export_membership_reactor(o,c->reactors[j]))next[k++]=c->reactors[j];
   /* New independent table copies must be registered too. */
   for(unsigned j=0;j<n;j++)if(g.mark[j]&&export_table(&drawing.object[j])){
    Dwg_Object_Ref ref={0};ref.absolute_ref=drawing.object[j].handle.value;
    if(!export_membership_reactor(o,&ref))continue;int exists=0;for(unsigned q=0;q<k;q++)if(next[q]->absolute_ref==ref.absolute_ref)exists=1;
    if(!exists)next[k++]=dwg_add_handleref(&drawing,4,ref.absolute_ref,NULL);
   }
   if(o->num_unknown_bits){if(!export_raw_style_reactors(o,next,k)){fprintf(stderr,"EXPORT_REJECT TABLESTYLE reactor preservation\n");g.error=9;goto done;}}
   else{free(c->reactors);c->reactors=next;c->num_reactors=k;}
  }
  if(o->fixedtype==DWG_TYPE_BLOCK_HEADER){
   Dwg_Object_BLOCK_HEADER *b=o->tio.object->tio.BLOCK_HEADER;
   b->num_inserts=export_filter(&g,b->inserts,b->num_inserts);
   if(export_layout_block(o)){b->num_owned=export_filter(&g,b->entities,b->num_owned);b->first_entity=b->num_owned?b->entities[0]:NULL;b->last_entity=b->num_owned?b->entities[b->num_owned-1]:NULL;}
  }
  if(dwg_obj_is_control(o)){Dwg_Object_BLOCK_CONTROL *c=o->tio.object->tio.BLOCK_CONTROL;c->num_entries=export_filter(&g,c->entries,c->num_entries);}
  if(g.mark[i]==1&&export_dictionary(o)){
   Dwg_Object_DICTIONARY *d=o->tio.object->tio.DICTIONARY;unsigned k=0;
   for(unsigned j=0;j<d->numitems;j++)if(export_kept(&g,d->itemhandles[j])){d->texts[k]=d->texts[j];d->itemhandles[k++]=d->itemhandles[j];}else free(d->texts[j]);d->numitems=k;
  }
  if(global_assoc_network(o)){
   Dwg_Object_ASSOCNETWORK *a=o->tio.object->tio.ASSOCNETWORK;unsigned k=0;
   for(unsigned j=0;j<a->num_actions;j++)if(export_kept(&g,a->actions[j].dep))a->actions[k++]=a->actions[j];a->num_actions=k;
   a->num_owned_actions=export_filter(&g,a->owned_actions,a->num_owned_actions);
  }
  if(export_sort_registry(o)){
   Dwg_Object_SORTENTSTABLE *s=o->tio.object->tio.SORTENTSTABLE;unsigned k=0;
   for(unsigned j=0;j<s->num_ents;j++)if(export_kept(&g,s->ents[j])){s->ents[k]=s->ents[j];s->sort_ents[k++]=s->sort_ents[j];}s->num_ents=k;
  }
 }
 /* Validate the resulting closure BEFORE discarding excluded records. */
 for(unsigned i=0;!g.error&&i<n;i++)if(g.mark[i])g.error=export_visit(&g,&drawing.object[i],1);
 if(g.error)goto done;
 {FILE *f=fopen(PLLATO_EXPORT_SUPPORT_PATH,"w");if(!f){g.error=8;goto done;}
  unsigned kept=0;
  for(unsigned i=0;i<n;i++)if(g.mark[i]){kept++;if(g.roots[i]==2)fprintf(f,"%llX\n",(unsigned long long)drawing.object[i].handle.value);}else dwg_free_object(&drawing.object[i]);
  fclose(f);fprintf(stderr,"EXPORT_GRAPH kept=%u total=%u\n",kept,n);selected_export_validated=1;
 }
 done:free(g.mark);free(g.roots);free(g.queue);return g.error;
}
