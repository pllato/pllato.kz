/* Synthetic export closure regression; never ships customer drawings. */
static char supportPath[4096];
#define PLLATO_EXPORT_SUPPORT_PATH supportPath
#include "pllato_executive_engine.c"
#include <assert.h>
#include <unistd.h>
static BITCODE_HV first_insert(void){
 for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].fixedtype==DWG_TYPE_INSERT&&export_root(&drawing.object[i]))return drawing.object[i].handle.value;
 assert(0);return 0;
}
static BITCODE_HV add_line(void){assert(!pllato_add_line(1,2,3,4));return strtoull(pllato_last_handle(),NULL,16);}
static BITCODE_HV attach_dictionary(BITCODE_HV h){
 Dwg_Object_DICTIONARY *d=dwg_add_DICTIONARY(&drawing,NULL,NULL,0);assert(d);int error=0;
 Dwg_Object *dict=dwg_obj_generic_to_object(d,&error);assert(dict&&!error);BITCODE_HV result=dict->handle.value;
 dict->tio.object->ownerhandle=dwg_add_handleref(&drawing,4,h,NULL);
 Dwg_Object *o=dwg_resolve_handle(&drawing,h);o->tio.entity->xdicobjhandle=dwg_add_handleref(&drawing,3,result,NULL);o->tio.entity->is_xdic_missing=0;
 Dwg_Object_XRECORD *x=dwg_add_XRECORD(d,"test");assert(x);
 const unsigned char value[]={1,2,3,4,255};assert(dwg_add_XRECORD_binary(x,310,sizeof(value),value));return result;
}
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);snprintf(supportPath,sizeof(supportPath),"%s.support",argv[2]);
 assert(pllato_open(argv[1])<128);BITCODE_HV root=first_insert(),other=add_line();char roots[32];snprintf(roots,sizeof(roots),"%llX",(unsigned long long)root);
 Dwg_Object *o=dwg_resolve_handle(&drawing,root);o->tio.entity->num_reactors=1;o->tio.entity->reactors=calloc(1,sizeof(BITCODE_H));o->tio.entity->reactors[0]=dwg_add_handleref(&drawing,4,other,NULL);
 assert(pllato_export_selection(roots)==3); /* Semantic cross-root link cannot be silently severed. */
 pllato_close();assert(pllato_open(argv[1])<128);root=first_insert();other=add_line();
 BITCODE_HV excludedDict=attach_dictionary(other),keptDict=attach_dictionary(root);
 BITCODE_HV orphan=add_line();o=dwg_resolve_handle(&drawing,orphan);o->tio.entity->entmode=0;o->tio.entity->ownerhandle=dwg_add_handleref(&drawing,4,UINT32_MAX,NULL);
 Dwg_Object_BLOCK_HEADER *model=dwg_model_space_object(&drawing)->tio.object->tio.BLOCK_HEADER;
 assert(model->entities[model->num_owned-1]->absolute_ref==orphan);model->num_owned--;model->last_entity=model->entities[model->num_owned-1];
 assert(!pllato_export_selection(roots));assert(pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 assert(dwg_resolve_handle(&drawing,root));assert(dwg_resolve_handle(&drawing,keptDict));
 assert(!dwg_resolve_handle(&drawing,other));assert(!dwg_resolve_handle(&drawing,excludedDict));assert(!dwg_resolve_handle(&drawing,orphan));
 unsigned count=0;for(unsigned i=0;i<drawing.num_objects;i++)if(export_root(&drawing.object[i])&&drawing.object[i].fixedtype!=DWG_TYPE_VIEWPORT){assert(drawing.object[i].handle.value==root);count++;}
 assert(count==1);pllato_close();puts("PASS selected native graph: nested/color/metadata preserved, excluded owners isolated, cross-root dependency rejected");return 0;
}
