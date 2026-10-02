/* A retained semantic reference must not expand the visible selection. */
#include <stdio.h>
#include <string.h>
static char resultPath[1024];
static FILE *test_fopen(const char *path,const char *mode){return fopen(!strcmp(path,"/clone-result.txt")?resultPath:path,mode);}
#define fopen test_fopen
#include "pllato_executive_engine.c"
#undef fopen
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);snprintf(resultPath,sizeof(resultPath),"%s.result",argv[2]);assert(pllato_open(argv[1])<128);
 Dwg_Data *d=&drawing;Dwg_Object *model=dwg_model_space_object(d);
 dwg_point_3d a={900000,900000,0},b={901000,900000,0};
 Dwg_Entity_LINE *line=dwg_add_LINE(model->tio.object->tio.BLOCK_HEADER,&a,&b);assert(line);
 int e=0;BITCODE_HV dependency=dwg_obj_generic_to_object(line,&e)->handle.value;
 Dwg_Object_APPID *app=dwg_add_APPID(d,"PLL_VISIBILITY_TEST");assert(app);
 Dwg_Handle appHandle=dwg_obj_generic_to_object(app,&e)->handle;
 Dwg_Object *root=NULL;for(unsigned i=0;i<d->num_objects;i++)if(d->object[i].fixedtype==DWG_TYPE_INSERT&&d->object[i].tio.entity->entmode==2){root=&d->object[i];break;}assert(root);
 assert(!root->tio.entity->num_eed);
 root->tio.entity->num_eed=1;root->tio.entity->eed=calloc(1,sizeof(Dwg_Eed));
 Dwg_Eed *eed=root->tio.entity->eed;eed->size=9;eed->handle=appHandle;eed->handle.code=5;
 eed->data=calloc(1,sizeof(Dwg_Eed_Data));eed->data->code=5;eed->data->u.eed_5.entity=dependency;
 char handle[32];snprintf(handle,sizeof(handle),"%llX",(unsigned long long)root->handle.value);
 assert(!pllato_clone_selection(handle,0,0,10000,0,0));
 FILE *f=fopen(resultPath,"r");assert(f);unsigned long long result;assert(fscanf(f,"%llX",&result)==1);fclose(f);
 Dwg_Object *wrapper=dwg_resolve_handle(d,result);
 Dwg_Object_BLOCK_HEADER *group=dwg_ref_object(d,wrapper->tio.entity->tio.INSERT->block_header)->tio.object->tio.BLOCK_HEADER;
 unsigned hidden=0,selected=0;BITCODE_HV hiddenHandle=0;
 for(unsigned i=0;i<group->num_owned;i++){Dwg_Object *o=dwg_ref_object(d,group->entities[i]);if(o->fixedtype==DWG_TYPE_LINE){assert(o->tio.entity->invisible&1);hidden++;hiddenHandle=o->handle.value;}if(o->fixedtype==DWG_TYPE_INSERT){assert(!(o->tio.entity->invisible&1));selected++;}}
 assert(hidden==1&&selected==1);assert(!(dwg_resolve_handle(d,dependency)->tio.entity->invisible&1));
 assert(pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 assert(dwg_resolve_handle(&drawing,hiddenHandle)->tio.entity->invisible&1);
 assert(!(dwg_resolve_handle(&drawing,dependency)->tio.entity->invisible&1));
 pllato_close();puts("PASS referenced geometry retained, unselected dependency not plotted, original unchanged");
}
