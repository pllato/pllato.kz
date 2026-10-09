/* Private fixture regression: root must contain a raw table/array/lookup body. */
#include <assert.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
static char resultPath[4096];
static FILE *regression_fopen(const char *p,const char *mode){return fopen(!strcmp(p,"/clone-result.txt")?resultPath:p,mode);}
#define fopen regression_fopen
#include "pllato_executive_engine.c"
#undef fopen
int main(int argc,char **argv){
 assert(argc==4&&access(argv[3],F_OK)!=0);
 snprintf(resultPath,sizeof(resultPath),"%s.clone.txt",argv[3]);
 assert(pllato_open(argv[1])<128);
 unsigned first=drawing.num_objects;assert(pllato_clone_selection(argv[2],0,0,100000,100000,0)==0);
 unsigned checked=0;
 for(unsigned i=first;i<drawing.num_objects;i++){
  Dwg_Object *o=&drawing.object[i];if(!raw_table(o))continue;
  TableRef *refs=NULL;unsigned count=0;
  assert(table_refs(o,o->handle.value,&refs,&count));
  for(unsigned j=0;j<count;j++)if(refs[j].value)assert(dwg_resolve_handle(&drawing,refs[j].value));
  free(refs);assert(o->handle.size>=4);checked++;
 }
 assert(checked&&pllato_save(argv[3])<128);
 pllato_close();assert(pllato_open(argv[3])<128);
 puts("PASS opaque handle-width growth, valid remapped references, save/reopen");pllato_close();
}
