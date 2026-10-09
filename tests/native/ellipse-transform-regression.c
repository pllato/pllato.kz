/* Rigid WCS transforms: no approximation and no original-file writes. */
#include <assert.h>
#include "pllato_executive_engine.c"
static int near(double a,double b){return fabs(a-b)<1e-7;}
int main(int argc,char**argv){
 assert(argc==2&&pllato_open(argv[1])<128);
 uv=calloc(drawing.num_objects,1);assert(uv);unsigned count=0;
 sheetAngle=M_PI/2;sheetCos=0;sheetSin=1;
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object*o=drawing.object+i;if(o->fixedtype!=DWG_TYPE_ELLIPSE)continue;
  Dwg_Entity_ELLIPSE*q=o->tio.entity->tio.ELLIPSE,original=*q;
  if(o->num_unknown_bits||o->num_unknown_rest)continue;
  assert(shifted(o,12,34,0,0)==0);assert(shifted(o,12,34,1,0)==0);
  assert(near(q->center.x,12-original.center.y)&&near(q->center.y,34+original.center.x));
  assert(q->center.z==original.center.z&&q->sm_axis.z==original.sm_axis.z);
  assert(near(q->sm_axis.x,-original.sm_axis.y)&&near(q->sm_axis.y,original.sm_axis.x));
  assert(near(q->extrusion.x,-original.extrusion.y)&&near(q->extrusion.y,original.extrusion.x)&&q->extrusion.z==original.extrusion.z);
  assert(q->axis_ratio==original.axis_ratio&&q->start_angle==original.start_angle&&q->end_angle==original.end_angle);
  *q=original;q->axis_ratio=NAN;assert(shifted(o,12,34,0,0)==13);*q=original;count++;
 }
 assert(count);printf("PASS %u exact WCS ellipses, Z/ratio/arc parameters retained, invalid ratio rejected\n",count);
 free(uv);uv=NULL;pllato_close();return 0;
}
