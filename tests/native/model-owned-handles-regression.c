/* AutoCAD requires hard ownership in the model-space entity inventory.
   A same-reader round-trip accepts soft pointers, so test the encoded code. */
#include <assert.h>
#include "pllato_executive_engine.c"
int main(int n,char**a){assert(n==2&&pllato_open(a[1])<128);Dwg_Object_BLOCK_HEADER*b=dwg_model_space_object(&drawing)->tio.object->tio.BLOCK_HEADER;assert(b->num_owned);for(unsigned i=0;i<b->num_owned;i++){Dwg_Object_Ref*r=b->entities[i];assert(r&&r->handleref.code==3);Dwg_Object*o=dwg_ref_object(&drawing,r);assert(o&&o->supertype==DWG_SUPERTYPE_ENTITY);}printf("PASS %u model roots use hard ownership, every root resolves to a CAD entity\n",b->num_owned);pllato_close();}
