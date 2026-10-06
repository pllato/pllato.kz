/* Synthetic nested block fixture; no customer drawing content. */
#include <assert.h>
#include <stdlib.h>
#include <unistd.h>
#include "dwg.h"
#include "dwg_api.h"
int main(int argc,char **argv){
 assert(argc==2&&access(argv[1],F_OK)!=0);
 const char *reference=getenv("DWG_REFERENCE_FIXTURE");
 Dwg_Data *d;
 if(reference){d=calloc(1,sizeof(*d));assert(d&&dwg_read_file(reference,d)<DWG_ERR_CRITICAL);}
 else d=dwg_new_Document(R_2018,0,0);
 assert(d);
 if(!reference){
  Dwg_Object_LAYER *layer=NULL;for(unsigned i=0;i<d->num_objects;i++)if(d->object[i].fixedtype==DWG_TYPE_LAYER){layer=d->object[i].tio.object->tio.LAYER;break;}assert(layer);
  layer->color.index=256;layer->color.rgb=0xC3000007;layer->color.method=0xC3;
 }
 dwg_point_3d a={0,0,0},b={100,0,0};
 Dwg_Object_BLOCK_HEADER *inner=dwg_add_BLOCK_HEADER(d,"DEVICE");assert(inner);
 assert(dwg_add_BLOCK(inner,"DEVICE"));assert(dwg_add_LINE(inner,&a,&b));assert(dwg_add_TEXT(inner,"Прибор",&a,5));
 assert(dwg_add_ATTDEF(inner,5,0,"Марка",&a,"CABLE","ВВГнг"));
 const dwg_point_2d boundary[]={{0,0},{100,0},{100,50},{0,50}};
 Dwg_Entity_LWPOLYLINE *outline=dwg_add_LWPOLYLINE(inner,4,boundary);assert(outline);outline->flag|=512;
 int hatchError=0;const Dwg_Object *paths[]={dwg_obj_generic_to_object(outline,&hatchError)};assert(paths[0]&&!hatchError);
 assert(dwg_add_HATCH(inner,1,"SOLID",true,1,paths));
 assert(dwg_add_ENDBLK(inner));
 Dwg_Object_BLOCK_HEADER *outer=dwg_add_BLOCK_HEADER(d,"PLAN");assert(outer);
 /* XDATA 1005 stores a handle outside the regular object_ref list. */
 Dwg_Object_APPID *app=dwg_add_APPID(d,"PLL_TEST");assert(app);
 int metadataError=0;Dwg_Object *appObject=dwg_obj_generic_to_object(app,&metadataError),*innerObject=dwg_obj_generic_to_object(inner,&metadataError);assert(appObject&&innerObject&&!metadataError);
 outer->parent->num_eed=1;outer->parent->eed=calloc(1,sizeof(Dwg_Eed));assert(outer->parent->eed);
 Dwg_Eed *eed=outer->parent->eed;eed->size=9;eed->handle=appObject->handle;eed->handle.code=5;eed->data=calloc(1,sizeof(Dwg_Eed_Data));assert(eed->data);eed->data->code=5;eed->data->u.eed_5.entity=innerObject->handle.value;
 assert(dwg_add_BLOCK(outer,"PLAN"));Dwg_Entity_INSERT *device=dwg_add_INSERT(outer,&a,"DEVICE",1,1,1,0);assert(device);
 /* GNU add_ATTRIB wrongly replaces the referenced definition with its owner.
    Keep this fixture valid independently of that unrelated constructor bug. */
 BITCODE_H definition=device->block_header;
 Dwg_Entity_ATTRIB *attribute=dwg_add_ATTRIB(device,5,0,&a,"CABLE","ВВГнг 3×2,5");assert(attribute);
 device->block_header=definition;
 int error=0;Dwg_Object *deviceObject=dwg_obj_generic_to_object(device,&error);assert(deviceObject&&!error);
 attribute->parent->ownerhandle=dwg_add_handleref(d,4,deviceObject->handle.value,NULL);
 assert(dwg_add_ENDBLK(outer));
 Dwg_Object *m=dwg_model_space_object(d);Dwg_Entity_INSERT *plan=dwg_add_INSERT(m->tio.object->tio.BLOCK_HEADER,&a,"PLAN",1,1,1,0);assert(plan);
 BITCODE_H planDefinition=plan->block_header;
 Dwg_Entity_ATTRIB *planAttribute=dwg_add_ATTRIB(plan,5,0,&a,"PLAN_TAG","Группа 1");assert(planAttribute);plan->block_header=planDefinition;
 Dwg_Object *planObject=dwg_obj_generic_to_object(plan,&error);assert(planObject&&!error);
 planAttribute->parent->ownerhandle=dwg_add_handleref(d,4,planObject->handle.value,NULL);
 planAttribute->parent->entmode=0;
 assert(dwg_write_file(argv[1],d)<128);dwg_free(d);free(d);return 0;
}
