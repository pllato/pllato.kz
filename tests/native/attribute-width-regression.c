/* Attribute widths must be valid before a download is returned. */
#include "pllato_executive_engine.c"
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0&&pllato_open(argv[1])<128);
 unsigned count=0;
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object *o=&drawing.object[i];double *width=NULL;
  if(o->fixedtype==DWG_TYPE_ATTRIB)width=&o->tio.entity->tio.ATTRIB->width_factor;
  if(o->fixedtype==DWG_TYPE_ATTDEF)width=&o->tio.entity->tio.ATTDEF->width_factor;
  if(!width)continue;count++;assert(*width==1.0);
  *width=0;assert(pllato_save(argv[2])>=128&&access(argv[2],F_OK)!=0);
  *width=NAN;assert(pllato_save(argv[2])>=128&&access(argv[2],F_OK)!=0);
  *width=1.0;
 }
 assert(count>=3&&pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object *o=&drawing.object[i];
  if(o->fixedtype==DWG_TYPE_ATTRIB)assert(o->tio.entity->tio.ATTRIB->width_factor==1.0);
  if(o->fixedtype==DWG_TYPE_ATTDEF)assert(o->tio.entity->tio.ATTDEF->width_factor==1.0);
 }
 pllato_close();puts("PASS attribute defaults, zero/NaN refusal and round-trip");return 0;
}
