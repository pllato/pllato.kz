/* SPDX-License-Identifier: GPL-3.0-or-later. Synthetic DWG, no project data. */
#include <assert.h>
#include <stdlib.h>
#include <unistd.h>
#include "dwg.h"
#include "dwg_api.h"
int main(int argc,char **argv){
 Dwg_Data *d;Dwg_Object *m;
 dwg_point_3d a={0,0,0},b={100,0,0},p={0,50,0};
 dwg_point_2d points[3]={{20,20},{30,20},{30,30}};
 assert(argc==2&&access(argv[1],F_OK)!=0);
 d=dwg_new_Document(R_2018,0,0);assert(d);
 m=dwg_model_space_object(d);assert(m);
 assert(dwg_add_LINE(m->tio.object->tio.BLOCK_HEADER,&a,&b));
 m=dwg_model_space_object(d);
 assert(dwg_add_TEXT(m->tio.object->tio.BLOCK_HEADER,"DWG test",&p,5));
 m=dwg_model_space_object(d);
 assert(dwg_add_LWPOLYLINE(m->tio.object->tio.BLOCK_HEADER,3,points));
 assert(dwg_write_file(argv[1],d)<DWG_ERR_CRITICAL);
 dwg_free(d);free(d);return 0;
}
