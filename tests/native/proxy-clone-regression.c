/* Synthetic opaque proxy dependency: preserve bits, remap explicit object IDs. */
#include <stdio.h>
#include <string.h>
static char resultPath[1024];
static FILE *test_fopen(const char *p,const char *m){return fopen(!strcmp(p,"/clone-result.txt")?resultPath:p,m);}
#define fopen test_fopen
#include "pllato_executive_engine.c"
#undef fopen
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);snprintf(resultPath,sizeof(resultPath),"%s.result",argv[2]);assert(pllato_open(argv[1])<128);
 Dwg_Data *d=&drawing;int e=0;BITCODE_HV rootHandle=0;
 for(unsigned i=0;i<d->num_objects;i++)if(d->object[i].fixedtype==DWG_TYPE_INSERT&&d->object[i].tio.entity->entmode==2){rootHandle=d->object[i].handle.value;break;}assert(rootHandle);
 Dwg_Object_PROXY_OBJECT *p=dwg_add_PROXY_OBJECT(d,"PLL_PROXY_TEST","opaque");assert(p);
 BITCODE_HV proxyHandle=dwg_obj_generic_to_object(p,&e)->handle.value;
 p->proxy_id=513;p->dwg_version=27;p->maint_version=5;p->version=3276827;
 p->data_numbits=19;p->data=calloc(3,1);p->data[0]=0xa5;p->data[1]=0x5a;p->data[2]=5;
 p->num_objids=1;p->objids=calloc(1,sizeof(BITCODE_H));p->objids[0]=dwg_add_handleref(d,4,rootHandle,NULL);
 Dwg_Object_DICTIONARY *extension=dwg_add_DICTIONARY(d,NULL,"opaque",proxyHandle);assert(extension);
 Dwg_Object *dict=dwg_obj_generic_to_object(extension,&e);BITCODE_HV dictHandle=dict->handle.value;
 dict->tio.object->ownerhandle=dwg_add_handleref(d,4,rootHandle,NULL);
 Dwg_Object *proxy=dwg_resolve_handle(d,proxyHandle);
 proxy->tio.object->ownerhandle=dwg_add_handleref(d,4,dictHandle,NULL);
 proxy->tio.object->num_reactors=0;
 Dwg_Object_APPID *app=dwg_add_APPID(d,"PLL_PROXY_APP");assert(app);Dwg_Handle appHandle=dwg_obj_generic_to_object(app,&e)->handle;
 Dwg_Object *root=dwg_resolve_handle(d,rootHandle);assert(!root->tio.entity->num_eed);
 root->tio.entity->num_eed=1;root->tio.entity->eed=calloc(1,sizeof(Dwg_Eed));
 Dwg_Eed *eed=root->tio.entity->eed;eed->size=9;eed->handle=appHandle;eed->handle.code=5;
 eed->data=calloc(1,sizeof(Dwg_Eed_Data));eed->data->code=5;eed->data->u.eed_5.entity=proxyHandle;
 char handle[32];snprintf(handle,sizeof(handle),"%llX",(unsigned long long)rootHandle);
 assert(!pllato_clone_selection(handle,0,0,10000,0,0));
 BITCODE_HV copyHandle=0;
 for(unsigned i=0;i<d->num_objects;i++)if(d->object[i].fixedtype==DWG_TYPE_PROXY_OBJECT&&d->object[i].handle.value!=proxyHandle){
  Dwg_Object_PROXY_OBJECT *copy=d->object[i].tio.object->tio.PROXY_OBJECT;copyHandle=d->object[i].handle.value;
  assert(copy->data_numbits==19&&!memcmp(p->data,copy->data,3));assert(copy->objids[0]->absolute_ref!=rootHandle);
  assert(dwg_resolve_handle(d,copy->objids[0]->absolute_ref)->fixedtype==DWG_TYPE_INSERT);
 }assert(copyHandle);assert(p->objids[0]->absolute_ref==rootHandle);
 assert(pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 Dwg_Object *original=dwg_resolve_handle(&drawing,proxyHandle),*copy=dwg_resolve_handle(&drawing,copyHandle);
 assert(original&&copy&&proxy_envelope(original)&&proxy_envelope(copy));
 assert(!memcmp(original->tio.object->tio.PROXY_OBJECT->data,copy->tio.object->tio.PROXY_OBJECT->data,3));
 /* Bit corruption and incomplete envelopes must fail verification. */
 assert(same_proxy(copy,copy));copy->num_unknown_rest=1;assert(!proxy_envelope(copy));copy->num_unknown_rest=0;
 Dwg_Object_PROXY_OBJECT *cp=copy->tio.object->tio.PROXY_OBJECT;BITCODE_HV mapped=cp->objids[0]->absolute_ref;
 cp->objids[0]->absolute_ref=rootHandle;assert(same_proxy(original,copy));cp->data[2]^=1;assert(!same_proxy(original,copy));cp->data[2]^=1;cp->objids[0]->absolute_ref=mapped;
 pllato_close();puts("PASS proxy bits preserved, references remapped, original independent, malformed envelope rejected");
}
