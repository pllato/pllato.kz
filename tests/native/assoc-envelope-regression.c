/* Private fixture: complete owned association envelopes and registry boundaries.
   Usage: input.dwg selected-root-handles new-output.dwg. Never overwrite input. */
#include <assert.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
static char resultPath[4096];
static FILE *regression_fopen(const char*p,const char*m){return fopen(!strcmp(p,"/clone-result.txt")?resultPath:p,m);}
#define fopen regression_fopen
#include "pllato_executive_engine.c"
#undef fopen
static int association_envelope(Dwg_Object*o){return o->fixedtype==DWG_TYPE_ASSOCROTATEDDIMACTIONBODY||o->fixedtype==DWG_TYPE_ASSOCOSNAPPOINTREFACTIONPARAM||o->fixedtype==DWG_TYPE_ASSOCEDGEACTIONPARAM||(o->fixedtype==DWG_TYPE_UNKNOWN_OBJ&&raw_table(o));}
static unsigned bit_at(unsigned char*p,size_t bit){return (p[bit/8]>>(7-bit%8))&1;}
int main(int argc,char**argv){
 assert(argc==4&&access(argv[3],F_OK)!=0);snprintf(resultPath,sizeof(resultPath),"%s.clone.txt",argv[3]);
 assert(pllato_open(argv[1])<128&&pllato_preserve_source(argv[1])==0);
 unsigned first=drawing.num_objects,originalEnvelopes=0;
 for(unsigned i=0;i<first;i++){Dwg_Object*o=drawing.object+i;if(!association_envelope(o))continue;
  TableRef*r=NULL;unsigned n=0;assert(table_refs(o,o->handle.value,&r,&n));free(r);originalEnvelopes++;
  Dwg_Object bad=*o;bad.handlestream_size++;assert(!table_refs(&bad,o->handle.value,&r,&n));
  Dwg_Object_Object common=*o->tio.object;Dwg_Object_Ref owner=*common.ownerhandle;owner.absolute_ref^=1;common.ownerhandle=&owner;bad=*o;bad.tio.object=&common;assert(!table_refs(&bad,o->handle.value,&r,&n));
 }
 assert(originalEnvelopes);
 BITCODE_HV offset=dwg_next_handle(&drawing);for(unsigned i=0;i<first;i++)if(drawing.object[i].handle.value>=offset)offset=drawing.object[i].handle.value+1;
 assert(pllato_clone_selection(argv[2],0,0,100000,0,0)==0);
 unsigned copied=0,registrations=0,sorts=0;
 for(unsigned i=first;i<drawing.num_objects;i++){Dwg_Object*c=drawing.object+i,*s=c->handle.value>=offset?dwg_resolve_handle(&drawing,c->handle.value-offset):NULL;if(!s||s->index>=first)continue;
  if(association_envelope(c)){
   assert(s->fixedtype==c->fixedtype);TableRef*r=NULL;unsigned n=0;assert(table_refs(c,c->handle.value,&r,&n));for(unsigned j=0;j<n;j++)if(r[j].value)assert(dwg_resolve_handle(&drawing,r[j].value));free(r);
   unsigned char*a=raw_chain(s),*b=raw_chain(c);size_t prefix=s->num_unknown_bits-s->handlestream_size;assert(prefix==c->num_unknown_bits-c->handlestream_size);
   for(size_t j=0;j<prefix;j++)assert(bit_at(a,j)==bit_at(b,j));assert(s->handlestream_size%8==c->handlestream_size%8);
   for(unsigned j=0;j<s->handlestream_size%8;j++)assert(bit_at(a,s->num_unknown_bits-1-j)==bit_at(b,c->num_unknown_bits-1-j));free(a);free(b);copied++;
  }
  if(c->fixedtype==DWG_TYPE_ASSOCACTION||c->fixedtype==DWG_TYPE_ASSOCNETWORK){Dwg_Object*parent=dwg_ref_object(&drawing,assoc_network_ref(c));if(global_assoc_network(parent)){unsigned count=parent->tio.object->tio.ASSOCNETWORK->num_actions;assert(register_assoc_copy(s,c)==0);assert(count==parent->tio.object->tio.ASSOCNETWORK->num_actions);registrations++;}}
  if(c->fixedtype==DWG_TYPE_SORTENTSTABLE){Dwg_Object_SORTENTSTABLE*x=s->tio.object->tio.SORTENTSTABLE,*y=c->tio.object->tio.SORTENTSTABLE;assert(x->num_ents==y->num_ents);for(unsigned j=0;j<x->num_ents;j++)assert(x->sort_ents[j]->absolute_ref==y->sort_ents[j]->absolute_ref);sorts++;}
 }
 assert(copied&&registrations);assert(pllato_save(argv[3])<128);pllato_close();assert(pllato_open(argv[3])<128);
 printf("PASS envelopes=%u copied=%u registry duplicate rejection=%u sort tables=%u exact payload/padding, refs, save/reopen\n",originalEnvelopes,copied,registrations,sorts);pllato_close();
}
