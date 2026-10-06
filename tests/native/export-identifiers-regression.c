/* Regression for AutoCAD's rejected HANDSEED and anonymous table names. */
#include "pllato_executive_engine.c"
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0&&pllato_open(argv[1])<128);
 Dwg_Object_BLOCK_HEADER *block=dwg_add_BLOCK_HEADER(&drawing,"*U500");assert(block);
 block->anonymous=1;block->flag|=1;
 assert(dwg_add_BLOCK(block,"*U500"));
 dwg_point_3d a={0,0,0},b={10,0,0},p={20,0,0};
 assert(dwg_add_LINE(block,&a,&b));assert(dwg_add_ENDBLK(block));
 Dwg_Object_BLOCK_HEADER *model=dwg_model_space_object(&drawing)->tio.object->tio.BLOCK_HEADER;
 assert(dwg_add_INSERT(model,&p,"*U500",1,1,1,0));
 int error=0;BITCODE_HV blockHandle=dwg_obj_generic_to_object(block,&error)->handle.value;assert(!error);
 BITCODE_HV maximum=0;for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].handle.value>maximum)maximum=drawing.object[i].handle.value;
 drawing.header_vars.HANDSEED->absolute_ref=drawing.header_vars.HANDSEED->handleref.value=1;
 assert(!prepare_export_identifiers());assert(drawing.header_vars.HANDSEED->absolute_ref==maximum+1);
 int allocated=0;char *name=dwg_ent_get_UTF8(block,"name",&allocated);assert(!strcmp(name,"*U"));if(allocated)free(name);
 BITCODE_HV high=maximum+1000;drawing.header_vars.HANDSEED->absolute_ref=drawing.header_vars.HANDSEED->handleref.value=high;
 assert(!prepare_export_identifiers());assert(drawing.header_vars.HANDSEED->absolute_ref==high);
 assert(pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 assert(drawing.header_vars.HANDSEED->absolute_ref==high);
 Dwg_Object *obj=dwg_resolve_handle(&drawing,blockHandle);assert(obj&&obj->fixedtype==DWG_TYPE_BLOCK_HEADER);
 block=obj->tio.object->tio.BLOCK_HEADER;
 Dwg_Object *begin=dwg_ref_object(&drawing,block->block_entity);assert(begin&&begin->fixedtype==DWG_TYPE_BLOCK);
 name=dwg_ent_get_UTF8(begin->tio.entity->tio.BLOCK,"name",&allocated);assert(!strcmp(name,"*U500"));if(allocated)free(name);
 free(block->name);block->name=dwg_add_u8_input(&drawing,"*U501");
 assert(prepare_export_identifiers()==DWG_ERR_INVALIDDWG);
 pllato_close();puts("PASS low HANDSEED repair, high seed preservation, anonymous prefix/full name, mismatched definition rejection");return 0;
}
