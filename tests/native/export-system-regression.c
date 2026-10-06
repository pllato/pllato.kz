/* Required drawing context survives a closed-graph export. */
#include <assert.h>
#include <unistd.h>
static char supportPath[4096];
#define PLLATO_EXPORT_SUPPORT_PATH supportPath
#include "pllato_executive_engine.c"
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);snprintf(supportPath,sizeof(supportPath),"%s.support.txt",argv[2]);
 assert(pllato_open(argv[1])<128);BITCODE_H acad=dwg_find_tablehandle(&drawing,"ACAD","APPID");assert(acad);
 BITCODE_H scales=dwg_find_dictionary(&drawing,"ACAD_SCALELIST");BITCODE_H vars=dwg_find_dictionary(&drawing,"AcDbVariableDictionary");
 BITCODE_HV a=acad->absolute_ref,s=scales?scales->absolute_ref:0,v=vars?vars->absolute_ref:0;char root[32]={0};
 for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].fixedtype==DWG_TYPE_INSERT&&export_root(&drawing.object[i])){snprintf(root,sizeof(root),"%llX",(unsigned long long)drawing.object[i].handle.value);break;}
 assert(*root&&pllato_export_selection(root)==0&&pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 assert(dwg_resolve_handle(&drawing,a));if(s)assert(dwg_resolve_handle(&drawing,s));if(v)assert(dwg_resolve_handle(&drawing,v));
 assert(dwg_find_tablehandle(&drawing,"ACAD","APPID"));if(s)assert(dwg_find_dictionary(&drawing,"ACAD_SCALELIST"));if(v)assert(dwg_find_dictionary(&drawing,"AcDbVariableDictionary"));
 pllato_close();puts("PASS retained ACAD registration, scales and persisted variables");return 0;
}
