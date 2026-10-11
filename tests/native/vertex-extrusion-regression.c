/* No fixture data is stored here. Verify implicit/default OCS and fail-closed guards. */
#include "pllato_executive_engine.c"
#include <assert.h>
size_t pllato_encoded_payload_end;
int main(int argc,char**argv){
 assert(argc==3);assert(pllato_open(argv[1])<128);Dwg_Object*o=entity(argv[2]);assert(o&&o->fixedtype==DWG_TYPE_LWPOLYLINE);
 Dwg_Object_Entity*e=o->tio.entity;Dwg_Entity_LWPOLYLINE*p=e->tio.LWPOLYLINE;assert(!e->num_reactors&&(!e->xdicobjhandle||!e->xdicobjhandle->absolute_ref)&&p->num_points);
 unsigned flag=p->flag;BITCODE_3BD extrusion=p->extrusion;double x=p->points[0].x,y=p->points[0].y;
 p->flag&=~1;p->extrusion.x=p->extrusion.y=p->extrusion.z=0;assert(!pllato_vertex(argv[2],0,x+3,y+5));assert(p->points[0].x==x+3&&p->points[0].y==y+5);
 p->flag|=1;p->extrusion.z=1;assert(!pllato_vertex(argv[2],0,x,y));
 p->extrusion.x=.5;assert(pllato_vertex(argv[2],0,x+9,y+9)==3);assert(p->points[0].x==x&&p->points[0].y==y);
 p->extrusion.x=0;p->extrusion.z=-1;assert(pllato_vertex(argv[2],0,x,y)==3);
 p->extrusion.z=1;assert(pllato_vertex(argv[2],p->num_points,x,y)==3);assert(pllato_vertex(argv[2],-1,x,y)==1);
 unsigned reactors=e->num_reactors;e->num_reactors=1;assert(pllato_vertex(argv[2],0,x,y)==2);e->num_reactors=reactors;
 p->flag=flag;p->extrusion=extrusion;pllato_close();puts("PASS implicit/explicit standard extrusion; tilted, reversed, bounds and dependency rejection");
}
