#include "pllato_executive_engine.c"
#include <assert.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3);assert(pllato_open(argv[1])<128);
 char handles[32][32];unsigned count=0,geometry=0;
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object *o=&drawing.object[i];if(o->fixedtype==DWG_TYPE_CIRCLE||o->fixedtype==DWG_TYPE_ARC)geometry++;
  if(o->fixedtype!=DWG_TYPE_ATTDEF&&o->fixedtype!=DWG_TYPE_ATTRIB)continue;
  assert(count<32);snprintf(handles[count],32,"%llX",(unsigned long long)o->handle.value);
  assert(pllato_text(handles[count],"")==0);count++;
 }
 assert(count>=2);assert(pllato_save(argv[2])<128);pllato_close();assert(pllato_open(argv[2])<128);
 unsigned after=0;for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].fixedtype==DWG_TYPE_CIRCLE||drawing.object[i].fixedtype==DWG_TYPE_ARC)after++;
 assert(after==geometry);
 for(unsigned i=0;i<count;i++){Dwg_Object *o=entity(handles[i]);assert(o);BITCODE_T t=o->fixedtype==DWG_TYPE_ATTDEF?o->tio.entity->tio.ATTDEF->default_value:o->tio.entity->tio.ATTRIB->text_value;assert(t&&!*t);}
 pllato_close();puts("PASS blank ATTRIB/ATTDEF roundtrip; device geometry preserved");
}
