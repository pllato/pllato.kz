/* Native linear dimension: keep its definition, private cache and CAD owners. */
API int pllato_dimension_move(const char *handle,double dx,double dy){
 Dwg_Object *o=entity(handle);if(!o||o->fixedtype!=DWG_TYPE_DIMENSION_LINEAR||!isfinite(dx)||!isfinite(dy))return 1;
 Dwg_Entity_DIMENSION_LINEAR *d=o->tio.entity->tio.DIMENSION_LINEAR;
 if(d->extrusion.x||d->extrusion.y||d->extrusion.z!=1||o->num_unknown_bits||o->num_unknown_rest)return 2;
 Dwg_Object *bo=d->block?dwg_resolve_handle(&drawing,d->block->absolute_ref):NULL;if(!bo||bo->fixedtype!=DWG_TYPE_BLOCK_HEADER)return 3;
 Dwg_Object_BLOCK_HEADER *b=bo->tio.object->tio.BLOCK_HEADER;
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object *other=&drawing.object[i];
  if(other->fixedtype==DWG_TYPE_DIMASSOC){Dwg_Object_DIMASSOC *a=other->tio.object->tio.DIMASSOC;if(a->dimensionobj&&a->dimensionobj->absolute_ref==o->handle.value&&a->associativity)return 5;}
  if(other!=o&&other->supertype==DWG_SUPERTYPE_ENTITY){BITCODE_H ref=NULL;if(other->fixedtype==DWG_TYPE_INSERT)ref=other->tio.entity->tio.INSERT->block_header;else if(other->fixedtype>=DWG_TYPE_DIMENSION_ORDINATE&&other->fixedtype<=DWG_TYPE_DIMENSION_DIAMETER)ref=other->tio.entity->tio.DIMENSION_common->block;if(ref&&ref->absolute_ref==bo->handle.value)return 6;}
 }
 for(unsigned i=0;i<b->num_owned;i++){Dwg_Object *c=dwg_resolve_handle(&drawing,b->entities[i]->absolute_ref);if(!c||c->supertype!=DWG_SUPERTYPE_ENTITY||c->num_unknown_bits||c->num_unknown_rest)return 7;switch(c->fixedtype){case DWG_TYPE_LINE:case DWG_TYPE_INSERT:case DWG_TYPE_MTEXT:case DWG_TYPE_TEXT:case DWG_TYPE_POINT:break;default:return 8;}}
 for(unsigned i=0;i<b->num_owned;i++){
  Dwg_Object *c=dwg_resolve_handle(&drawing,b->entities[i]->absolute_ref);Dwg_Object_Entity *e=c->tio.entity;
  switch(c->fixedtype){
   case DWG_TYPE_LINE:e->tio.LINE->start.x+=dx;e->tio.LINE->start.y+=dy;e->tio.LINE->end.x+=dx;e->tio.LINE->end.y+=dy;break;
   case DWG_TYPE_INSERT:e->tio.INSERT->ins_pt.x+=dx;e->tio.INSERT->ins_pt.y+=dy;break;
   case DWG_TYPE_POINT:e->tio.POINT->x+=dx;e->tio.POINT->y+=dy;break;
   case DWG_TYPE_TEXT:e->tio.TEXT->ins_pt.x+=dx;e->tio.TEXT->ins_pt.y+=dy;e->tio.TEXT->alignment_pt.x+=dx;e->tio.TEXT->alignment_pt.y+=dy;break;
   case DWG_TYPE_MTEXT:e->tio.MTEXT->ins_pt.x+=dx;e->tio.MTEXT->ins_pt.y+=dy;break;
   default:return 8;
  }
 }
 d->xline1_pt.x+=dx;d->xline1_pt.y+=dy;d->xline2_pt.x+=dx;d->xline2_pt.y+=dy;d->def_pt.x+=dx;d->def_pt.y+=dy;d->text_midpt.x+=dx;d->text_midpt.y+=dy;return 0;
}
static void dim_map(double *x,double *y,const double *v){
 double t=(*x*v[0]+*y*v[1]-v[4])/v[5];
 double base=(1-t)*v[6]+t*v[7],den=v[8]-base;
 double weight=fabs(den)>1e-8?(*x*v[2]+*y*v[3]-base)/den:0;
 double normal=(1-weight)*t*v[11]+weight*v[10];
 *x+=v[0]*t*v[9]+v[2]*normal;*y+=v[1]*t*v[9]+v[3]*normal;
}
API int pllato_dimension(const char *handle,double length,double offset,double end_normal){
 Dwg_Object *o=entity(handle);if(!o||o->fixedtype!=DWG_TYPE_DIMENSION_LINEAR||!isfinite(length)||length<=1e-8||!isfinite(offset)||!isfinite(end_normal))return 1;
 Dwg_Entity_DIMENSION_LINEAR *d=o->tio.entity->tio.DIMENSION_LINEAR;
 if(d->extrusion.x||d->extrusion.y||d->extrusion.z!=1)return 2;
 Dwg_Object *bo=d->block?dwg_resolve_handle(&drawing,d->block->absolute_ref):NULL;
 if(!bo||bo->fixedtype!=DWG_TYPE_BLOCK_HEADER)return 3;
 Dwg_Object_BLOCK_HEADER *b=bo->tio.object->tio.BLOCK_HEADER;
 double dx=cos(d->dim_rotation),dy=sin(d->dim_rotation),nx=-dy,ny=dx;
 double signed_length=(d->xline2_pt.x-d->xline1_pt.x)*dx+(d->xline2_pt.y-d->xline1_pt.y)*dy;
 if(fabs(signed_length)<1e-8)return 4;
 double n1=d->xline1_pt.x*nx+d->xline1_pt.y*ny,n2=d->xline2_pt.x*nx+d->xline2_pt.y*ny,qn=d->def_pt.x*nx+d->def_pt.y*ny;
 double dl=copysign(length,signed_length)-signed_length,dn=offset-(qn-(n1+n2)/2)+end_normal/2;
 unsigned anchors=0,first_anchor=0,second_anchor=0;double tolerance=fmax(1e-5,fabs(signed_length)*1e-6);
 for(unsigned i=0;i<b->num_owned;i++){Dwg_Object *c=dwg_resolve_handle(&drawing,b->entities[i]->absolute_ref);if(c&&c->fixedtype==DWG_TYPE_POINT){Dwg_Entity_POINT *p=c->tio.entity->tio.POINT;anchors++;if(hypot(p->x-d->xline1_pt.x,p->y-d->xline1_pt.y)<tolerance)first_anchor=1;if(hypot(p->x-d->xline2_pt.x,p->y-d->xline2_pt.y)<tolerance)second_anchor=1;}}
 if(anchors&&(!first_anchor||!second_anchor))return 10;
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object *other=&drawing.object[i];
  if(other->fixedtype==DWG_TYPE_DIMASSOC){Dwg_Object_DIMASSOC *a=other->tio.object->tio.DIMASSOC;if(a->dimensionobj&&a->dimensionobj->absolute_ref==o->handle.value&&(a->associativity&2)&&(fabs(dl)>1e-8||fabs(end_normal)>1e-8))return 5;}
  if(other!=o&&other->supertype==DWG_SUPERTYPE_ENTITY){BITCODE_H ref=NULL;if(other->fixedtype==DWG_TYPE_INSERT)ref=other->tio.entity->tio.INSERT->block_header;else if(other->fixedtype>=DWG_TYPE_DIMENSION_ORDINATE&&other->fixedtype<=DWG_TYPE_DIMENSION_DIAMETER)ref=other->tio.entity->tio.DIMENSION_common->block;if(ref&&ref->absolute_ref==bo->handle.value)return 6;}
 }
 for(unsigned i=0;i<b->num_owned;i++){Dwg_Object *c=dwg_resolve_handle(&drawing,b->entities[i]->absolute_ref);if(!c||c->supertype!=DWG_SUPERTYPE_ENTITY)return 7;switch(c->fixedtype){case DWG_TYPE_LINE:case DWG_TYPE_INSERT:case DWG_TYPE_MTEXT:case DWG_TYPE_TEXT:case DWG_TYPE_POINT:break;default:return 8;}}
 double v[]={dx,dy,nx,ny,d->xline1_pt.x*dx+d->xline1_pt.y*dy,signed_length,n1,n2,qn,dl,dn,end_normal};
 char label[80];snprintf(label,sizeof(label),"%.3f",length);char *end=label+strlen(label)-1;while(end>label&&*end=='0')*end--=0;if(*end=='.')*end=0;
 for(unsigned i=0;i<b->num_owned;i++){
  Dwg_Object_Entity *e=dwg_resolve_handle(&drawing,b->entities[i]->absolute_ref)->tio.entity;
  Dwg_Object *c=&drawing.object[e->objid];
  switch(c->fixedtype){
   case DWG_TYPE_LINE:dim_map(&e->tio.LINE->start.x,&e->tio.LINE->start.y,v);dim_map(&e->tio.LINE->end.x,&e->tio.LINE->end.y,v);break;
   case DWG_TYPE_INSERT:dim_map(&e->tio.INSERT->ins_pt.x,&e->tio.INSERT->ins_pt.y,v);break;
   case DWG_TYPE_POINT:dim_map(&e->tio.POINT->x,&e->tio.POINT->y,v);break;
   case DWG_TYPE_TEXT:dim_map(&e->tio.TEXT->ins_pt.x,&e->tio.TEXT->ins_pt.y,v);dim_map(&e->tio.TEXT->alignment_pt.x,&e->tio.TEXT->alignment_pt.y,v);{BITCODE_T t=dwg_add_u8_input(&drawing,label);if(!t)return 9;free(e->tio.TEXT->text_value);e->tio.TEXT->text_value=t;}break;
   case DWG_TYPE_MTEXT:dim_map(&e->tio.MTEXT->ins_pt.x,&e->tio.MTEXT->ins_pt.y,v);{BITCODE_T t=dwg_add_u8_input(&drawing,label);if(!t)return 9;free(e->tio.MTEXT->text);e->tio.MTEXT->text=t;}break;
   default:return 8;
  }
 }
 dim_map(&d->text_midpt.x,&d->text_midpt.y,v);d->xline2_pt.x+=dx*dl+nx*end_normal;d->xline2_pt.y+=dy*dl+ny*end_normal;d->def_pt.x+=dx*dl+nx*dn;d->def_pt.y+=dy*dl+ny*dn;d->act_measurement=length;
 BITCODE_T t=dwg_add_u8_input(&drawing,"");if(!t)return 9;free(d->user_text);d->user_text=t;return 0;
}
