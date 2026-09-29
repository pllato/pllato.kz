/* Public synthetic training plan. Never use a customer drawing for guide assets. */
#include <assert.h>
#include <stdlib.h>
#include <unistd.h>
#include "dwg.h"
#include "dwg_api.h"
static void line(Dwg_Object_BLOCK_HEADER *m,double x,double y,double xx,double yy,int color){
 dwg_point_3d a={x,y,0},b={xx,yy,0};Dwg_Entity_LINE *l=dwg_add_LINE(m,&a,&b);assert(l);l->parent->color.index=color;
}
static void text(Dwg_Object_BLOCK_HEADER *m,const char *s,double x,double y,double h){dwg_point_3d p={x,y,0};assert(dwg_add_TEXT(m,s,&p,h));}
int main(int argc,char **argv){
 assert(argc==2&&access(argv[1],F_OK)!=0);Dwg_Data *d=dwg_new_Document(R_2018,0,0);assert(d);Dwg_Object_BLOCK_HEADER *m=dwg_model_space_object(d)->tio.object->tio.BLOCK_HEADER;
 line(m,0,0,12000,0,8);line(m,12000,0,12000,8000,8);line(m,12000,8000,0,8000,8);line(m,0,8000,0,0,8);
 line(m,100,100,11900,100,8);line(m,11900,100,11900,7900,8);line(m,11900,7900,100,7900,8);line(m,100,7900,100,100,8);
 line(m,6000,0,6000,2500,8);line(m,6000,3400,6000,8000,8);line(m,6000,5000,8800,5000,8);line(m,9700,5000,12000,5000,8);
 text(m,"Учебный план · не рабочий проект",500,7200,280);text(m,"Комната",1400,5500,250);text(m,"Кухня",8200,6200,250);text(m,"Коридор",7900,3200,250);
 Dwg_Object_BLOCK_HEADER *b=dwg_add_BLOCK_HEADER(d,"TRAINING_DEVICE");assert(b);assert(dwg_add_BLOCK(b,"TRAINING_DEVICE"));
 line(b,-140,-100,140,-100,4);line(b,140,-100,140,100,4);line(b,140,100,-140,100,4);line(b,-140,100,-140,-100,4);assert(dwg_add_ENDBLK(b));
 dwg_point_3d p={1200,1400,0};assert(dwg_add_INSERT(m,&p,"TRAINING_DEVICE",1,1,1,0));p.x=10800;p.y=6700;assert(dwg_add_INSERT(m,&p,"TRAINING_DEVICE",1,1,1,0));
 line(m,1200,1400,1200,4500,5);line(m,1200,4500,5200,4500,5);line(m,5200,4500,5200,6500,5);
 line(m,10800,6700,10800,4100,5);line(m,10800,4100,7200,4100,5);
 text(m,"Щит",700,900,220);text(m,"Линии исходного плана",1900,1900,200);
 assert(dwg_write_file(argv[1],d)<128);dwg_free(d);free(d);return 0;
}
