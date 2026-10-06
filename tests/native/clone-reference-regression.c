/* Relative soft refs must not become hard pointers after cloning. */
#include <assert.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
static char clonePath[4096];
static FILE *regression_fopen(const char *p,const char *mode){return fopen(!strcmp(p,"/clone-result.txt")?clonePath:p,mode);}
#define fopen regression_fopen
#include "pllato_executive_engine.c"
#undef fopen
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);snprintf(clonePath,sizeof(clonePath),"%s.clone.txt",argv[2]);
 assert(pllato_open(argv[1])<128);char root[32]={0};
 for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].fixedtype==DWG_TYPE_INSERT&&export_root(&drawing.object[i])){snprintf(root,sizeof(root),"%llX",(unsigned long long)drawing.object[i].handle.value);break;}
 assert(*root);unsigned first=drawing.num_objects;
 assert(pllato_clone_selection(root,0,0,1000,1000,0)==0);
 unsigned checked=0;
 for(unsigned i=first;i<drawing.num_objects;i++){Dwg_Object *o=&drawing.object[i];if(o->fixedtype!=DWG_TYPE_BLOCK_HEADER)continue;
  BITCODE_H owner=o->tio.object->ownerhandle;assert(owner&&owner->handleref.code!=5);
  Dwg_Object *c=dwg_ref_object(&drawing,owner);assert(c&&c->fixedtype==DWG_TYPE_BLOCK_CONTROL);checked++;
 }
 assert(checked>=3&&pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 for(unsigned i=0;i<drawing.num_objects;i++){Dwg_Object *o=&drawing.object[i];if(o->fixedtype==DWG_TYPE_BLOCK_HEADER){BITCODE_H owner=o->tio.object->ownerhandle;assert(owner&&owner->handleref.code!=5);}}
 pllato_close();puts("PASS cloned block owners preserve soft reference semantics");
}
