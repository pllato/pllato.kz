/* Private fixture regression: accept only a complete owned MTEXT context
   with a canonical shared annotation scale. No fixture geometry is included. */
#include "pllato_executive_engine.c"
#include <assert.h>
size_t pllato_encoded_payload_end;
int main(int argc,char**argv){
 assert(argc==2);assert(pllato_open(argv[1])<128);unsigned found=0;
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object*o=drawing.object+i;if(o->fixedtype!=DWG_TYPE_MTEXTOBJECTCONTEXTDATA)continue;
  Dwg_Object*text=annotation_text_owner(o);assert(text);
  Dwg_Object_MTEXTOBJECTCONTEXTDATA*c=o->tio.object->tio.MTEXTOBJECTCONTEXTDATA;
  unsigned version=c->class_version;c->class_version=99;assert(!annotation_text_owner(o));c->class_version=version;
  unsigned column=c->column_type;c->column_type=99;assert(!annotation_text_owner(o));c->column_type=column;
  BITCODE_H scale=c->scale;c->scale=NULL;assert(!annotation_text_owner(o));c->scale=scale;
  Dwg_Object*dict=dwg_ref_object(&drawing,o->tio.object->ownerhandle);
  Dwg_Object_DICTIONARY*d=dict->tio.object->tio.DICTIONARY;
  for(unsigned j=0;j<d->numitems;j++)if(d->itemhandles[j]->absolute_ref==o->handle.value){BITCODE_H item=d->itemhandles[j];d->itemhandles[j]=NULL;assert(!annotation_text_owner(o));d->itemhandles[j]=item;break;}
  Dwg_Object*sc=dwg_ref_object(&drawing,scale);assert(clone_shared(sc));BITCODE_H owner=sc->tio.object->ownerhandle;sc->tio.object->ownerhandle=NULL;assert(!canonical_scale(sc));assert(!annotation_text_owner(o));sc->tio.object->ownerhandle=owner;
  assert(annotation_text_owner(o)==text);
  Dwg_Object*root=dwg_ref_object(&drawing,text->tio.entity->xdicobjhandle);
  assert(shifted_mtext_context(root,text,3,5,0,17)==13);
  unsigned bits=o->num_unknown_bits;o->num_unknown_bits=1;assert(shifted_mtext_context(root,text,3,5,0,0)==13);o->num_unknown_bits=bits;
  double x=c->ins_pt.x,y=c->ins_pt.y;
  assert(!shifted_mtext_context(root,text,3,5,0,0));assert(c->ins_pt.x==x&&c->ins_pt.y==y);
  assert(!shifted_mtext_context(root,text,3,5,1,0));assert(c->ins_pt.x==x+3&&c->ins_pt.y==y+5);
  assert(!shifted_mtext_context(root,text,-3,-5,1,0));
  found++;
 }
 assert(found);pllato_close();printf("PASS %u MTEXT contexts, version/column/scale/membership/owner rejection guards\n",found);
}
