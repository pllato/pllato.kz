/* Run against a synthetic fixture; exercises the actual writer wrapper. */
#include "pllato_executive_engine.c"
#include <assert.h>
/* This host-only test does not call the clone/opaque encoder probes. */
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==2);assert(pllato_open(argv[1])<128);
 Dwg_Object *o=NULL;
 for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].fixedtype==DWG_TYPE_INSERT&&drawing.object[i].tio.entity->tio.INSERT->num_owned){o=&drawing.object[i];break;}
 assert(o);Dwg_Entity_INSERT *in=o->tio.entity->tio.INSERT;
 Dwg_Entity_ATTRIB *a=dwg_ref_object(&drawing,in->attribs[0])->tio.entity->tio.ATTRIB;
 char h[32];snprintf(h,sizeof h,"%llX",(unsigned long long)o->handle.value);
 a->mtext_type=1;double ix=in->ins_pt.x,ax=a->ins_pt.x;
 assert(pllato_move(h,12,34)==0);assert(in->ins_pt.x==ix+12);assert(a->ins_pt.x==ax+12);
 a->mtext_type=2;ix=in->ins_pt.x;ax=a->ins_pt.x;
 assert(pllato_move(h,12,34)==3);assert(in->ins_pt.x==ix);assert(a->ins_pt.x==ax);
 pllato_close();puts("PASS single-line ATTRIB moves; multiline rejection is atomic");return 0;
}
