/* Fractional MTEXT background scale must survive DWG write/read. */
#include "pllato_executive_engine.c"
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);assert(pllato_open(argv[1])<128);
 Dwg_Object_BLOCK_HEADER *model=dwg_model_space_object(&drawing)->tio.object->tio.BLOCK_HEADER;
 dwg_point_3d at={0,0,0};Dwg_Entity_MTEXT *text=dwg_add_MTEXT(model,&at,200,"Background test");assert(text);
 text->text_height=5;text->bg_fill_flag=3;text->bg_fill_scale=1.5;text->bg_fill_color.index=7;text->bg_fill_color.rgb=0xc3000007;
 int err=0;BITCODE_HV handle=dwg_obj_generic_to_object(text,&err)->handle.value;
 assert(pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 text=dwg_resolve_handle(&drawing,handle)->tio.entity->tio.MTEXT;
 assert(text->bg_fill_flag==3&&text->bg_fill_scale==1.5&&text->bg_fill_color.rgb==0xc3000007);
 pllato_close();puts("PASS MTEXT fractional background scale preserved");
}
