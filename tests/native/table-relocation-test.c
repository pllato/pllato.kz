/* Synthetic tests only: no customer drawing data. Link as a separate module. */
#include "pllato_executive_engine.c"
#include <assert.h>
API int pllato_test_assoc_registry(void){
 Dwg_Data db={0};Dwg_Object objects[5]={{0}};Dwg_Object_Object common[5]={{0}};
 Dwg_Object_ASSOCNETWORK networks[3]={{0}};
 db.object=objects;db.num_objects=5;db.object_map=hash_new(16);
 for(unsigned i=0;i<5;i++){
  objects[i].parent=&db;objects[i].index=i;objects[i].handle.value=i+1;
  objects[i].supertype=DWG_SUPERTYPE_OBJECT;objects[i].tio.object=&common[i];
  objects[i].fixedtype=i<2?DWG_TYPE_DICTIONARY:DWG_TYPE_ASSOCNETWORK;
  if(i>=2)common[i].tio.ASSOCNETWORK=&networks[i-2];
  hash_set(db.object_map,i+1,i);
 }
 db.header_vars.DICTIONARY_NAMED_OBJECT=dwg_add_handleref(&db,5,1,NULL);
 common[1].ownerhandle=dwg_add_handleref(&db,4,1,NULL);
 common[2].ownerhandle=dwg_add_handleref(&db,4,2,NULL);
 networks[1].owningnetwork=dwg_add_handleref(&db,4,3,NULL);
 networks[2].owningnetwork=dwg_add_handleref(&db,4,3,NULL);
 networks[0].actions=calloc(1,sizeof(Dwg_ASSOCACTION_Deps));networks[0].num_actions=1;
 networks[0].actions[0].dep=dwg_add_handleref(&db,4,4,NULL);
 networks[1].action_index=7;networks[0].network_action_index=8;
 assert(global_assoc_network(&objects[2]));assert(!global_assoc_network(&objects[3]));
 assert(register_assoc_copy(&objects[3],&objects[4]));
 assert(networks[0].num_actions==2&&networks[0].actions[0].dep->absolute_ref==4&&networks[0].actions[1].dep->absolute_ref==5);
 assert(networks[1].action_index==7&&networks[2].action_index==8&&networks[0].network_action_index==9);
 assert(!register_assoc_copy(&objects[3],&objects[4])&&networks[0].num_actions==2);
 free(networks[0].actions);
 for(unsigned i=0;i<db.num_object_refs;i++)free(db.object_ref[i]);free(db.object_ref);hash_free(db.object_map);return 0;
}
API int pllato_test_table_relocation(void){
 assert(loaded&&drawing.num_objects>2);
 BITCODE_HV first=drawing.object[0].handle.value,second=drawing.object[1].handle.value;
 assert(first&&second&&first<256&&second<256);
 Dwg_Class *classes=drawing.dwg_class,klass={0};unsigned classCount=drawing.num_classes;
 klass.dxfname="ACAD_TABLE";drawing.dwg_class=&klass;drawing.num_classes=1;
 Dwg_Object o={0};Dwg_Object_Entity entity={0};entity.entmode=0;
 o.parent=&drawing;o.fixedtype=DWG_TYPE_UNKNOWN_ENT;o.type=500;o.tio.entity=&entity;o.handle.value=100;
 unsigned char bytes[3]={0xa8,0,0};o.unknown_bits=bytes;o.num_unknown_bits=24;o.size=3;o.bitsize=5;o.handlestream_size=19;
 Bit_Chain bits={0};bits.chain=bytes;bits.size=3;bits.version=bits.from_version=drawing.header.version;
 Dwg_Handle h={0};h.code=5;h.size=1;h.value=first;bit_set_position(&bits,5);bit_write_H(&bits,&h);
 TableRef *refs;unsigned count;assert(table_refs(&o,100,&refs,&count)&&count==1&&refs[0].value==first);free(refs);
 dwg_inthash *seen=hash_new(16);hash_set(seen,first,1);BITCODE_HV mapped[]={second};
 assert(relocate_table(&o,100,seen,mapped));assert((bytes[0]&0xf8)==0xa8);
 assert(table_refs(&o,100,&refs,&count)&&count==1&&refs[0].value==second);free(refs);
 mapped[0]=0x10000;h.value=first;bit_set_position(&bits,5);bit_write_H(&bits,&h);
 assert(!relocate_table(&o,100,seen,mapped)); /* Never truncate a wider handle. */
 h.code=15;h.size=0;h.value=0;bit_set_position(&bits,5);bit_write_H(&bits,&h);
 assert(!table_refs(&o,100,&refs,&count)); /* Malformed stream fails closed. */
 entity.entmode=2;assert(!raw_table(&o)); /* Model-space owner needs another layout. */
 entity.entmode=0;mapped[0]=second;
 for(unsigned tail=1;tail<8;tail++){
  memset(bytes,0,sizeof(bytes));o.num_unknown_bits=16+tail;o.bitsize=8;o.handlestream_size=16;
  h.code=5;h.size=1;h.value=first;bit_set_position(&bits,tail);bit_write_H(&bits,&h);pack_raw_tail(bytes,o.num_unknown_bits);
  assert(table_refs(&o,100,&refs,&count)&&count==1&&refs[0].value==first);free(refs);
  assert(relocate_table(&o,100,seen,mapped));
  assert(table_refs(&o,100,&refs,&count)&&count==1&&refs[0].value==second);free(refs);
 }
 hash_free(seen);drawing.dwg_class=classes;drawing.num_classes=classCount;return 0;
}
