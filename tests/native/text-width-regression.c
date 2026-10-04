/* New TEXT must not carry the zero width rejected by AutoCAD AUDIT. */
#include "pllato_executive_engine.c"
#include <assert.h>
#include <unistd.h>
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);
 assert(pllato_open(argv[1])<128);
 assert(pllato_add_text("Width regression",0,0,5,0)==0);
 Dwg_Object *o=&drawing.object[drawing.num_objects-1];
 assert(o->fixedtype==DWG_TYPE_TEXT);
 BITCODE_HV handle=o->handle.value;
 Dwg_Entity_TEXT *t=o->tio.entity->tio.TEXT;
 assert(t->width_factor==1.0);
 t->width_factor=0;assert(pllato_save(argv[2])>=128&&access(argv[2],F_OK)!=0);
 t->width_factor=-1;assert(pllato_save(argv[2])>=128&&access(argv[2],F_OK)!=0);
 t->width_factor=NAN;assert(pllato_save(argv[2])>=128&&access(argv[2],F_OK)!=0);
 t->width_factor=0.75;assert(pllato_save(argv[2])<128);
 pllato_close();assert(pllato_open(argv[2])<128);
 t=dwg_resolve_handle(&drawing,handle)->tio.entity->tio.TEXT;
 assert(t->width_factor==0.75);
 pllato_close();puts("PASS new TEXT width, invalid-width rejection, custom-width round-trip");
}
