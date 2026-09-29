/* Read-only diagnostic. Do not publish its output for private drawings. */
#include "pllato_executive_engine.c"
size_t pllato_encoded_payload_end;
int main(int argc,char **argv){
 if(argc!=2||pllato_open(argv[1])>=128)return 1;
 unsigned bad=0,owned=0;unsigned *membership=calloc(drawing.num_objects,sizeof(unsigned));
 for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].fixedtype==DWG_TYPE_BLOCK_HEADER){Dwg_Object_BLOCK_HEADER *b=drawing.object[i].tio.object->tio.BLOCK_HEADER;for(unsigned j=0;j<b->num_owned;j++){Dwg_Object *child=dwg_ref_object(&drawing,b->entities[j]);if(child)membership[child->index]++;}}
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object *o=&drawing.object[i];if(o->supertype!=DWG_SUPERTYPE_ENTITY||o->type==DWG_TYPE_FREED||dwg_obj_is_subentity(o)||o->fixedtype==DWG_TYPE_BLOCK||o->fixedtype==DWG_TYPE_ENDBLK||o->fixedtype==DWG_TYPE_SEQEND)continue;
  Dwg_Object_Entity *e=o->tio.entity;if(!e||e->entmode)continue;
  Dwg_Object *owner=dwg_ref_object(&drawing,e->ownerhandle);if(owner&&owner->fixedtype==DWG_TYPE_BLOCK_HEADER)continue;
  if(membership[o->index]==1)owned++;
  if(bad++<10)fprintf(stdout,"type=%s ownerType=%s memberships=%u\n",o->name,owner?owner->name:"missing",membership[o->index]);
 }
 printf("invalidRootOwners=%u singleBlockMembership=%u\n",bad,owned);free(membership);pllato_close();return 0;
}
