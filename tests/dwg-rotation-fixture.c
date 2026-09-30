/* Independent synthetic fixture: nested device without attributes. */
#include <assert.h>
#include <stdlib.h>
#include <unistd.h>
#include "dwg.h"
#include "dwg_api.h"
int main(int argc,char **argv){
 assert(argc==2&&access(argv[1],F_OK)!=0);
 Dwg_Data *d=dwg_new_Document(R_2018,0,0);assert(d);
 dwg_point_3d a={0,0,0},b={20,0,0},c={20,10,0};
 Dwg_Object_BLOCK_HEADER *inner=dwg_add_BLOCK_HEADER(d,"DEVICE");assert(inner);
 assert(dwg_add_BLOCK(inner,"DEVICE"));assert(dwg_add_LINE(inner,&a,&b));assert(dwg_add_LINE(inner,&b,&c));assert(dwg_add_ENDBLK(inner));
 Dwg_Object_BLOCK_HEADER *outer=dwg_add_BLOCK_HEADER(d,"PLAN");assert(outer);
 assert(dwg_add_BLOCK(outer,"PLAN"));assert(dwg_add_INSERT(outer,&a,"DEVICE",1,1,1,0));assert(dwg_add_ENDBLK(outer));
 Dwg_Object *m=dwg_model_space_object(d);assert(dwg_add_INSERT(m->tio.object->tio.BLOCK_HEADER,&a,"PLAN",1,1,1,0));
 assert(dwg_write_file(argv[1],d)<128);dwg_free(d);free(d);return 0;
}
