/* SPDX-License-Identifier: GPL-3.0-or-later
   Remove only generated executive wrappers; retain individual CAD types and
   nested device definitions. Unsupported geometry aborts the whole worker. */
static double sheetAngle=0,sheetCos=1,sheetSin=0;
static unsigned char *uv=NULL;
static int uf=0;
#define P2(p) do{double ux=(p).x,uy=(p).y;(p).x=uc*ux-us*uy+dx;(p).y=us*ux+uc*uy+dy;if(!isfinite((p).x)||!isfinite((p).y))uf=1;}while(0)
#define V2(p) do{double ux=(p).x,uy=(p).y;(p).x=uc*ux-us*uy;(p).y=us*ux+uc*uy;}while(0)
static int shifted(Dwg_Object*o,double dx,double dy,int apply,unsigned depth){
 if(depth>12||!o||o->supertype!=DWG_SUPERTYPE_ENTITY||o->num_unknown_rest)return 1;
 if(o->num_unknown_bits){char h[32];snprintf(h,sizeof(h),"%llX",(unsigned long long)o->handle.value);if(pllato_probe_opaque(h))return 2;if(apply){free(o->unknown_bits);o->unknown_bits=NULL;o->num_unknown_bits=0;}}
 if(apply&&uv[o->index])return 0;
 if(apply)uv[o->index]=1;
 Dwg_Object_Entity*e=o->tio.entity;
 BITCODE_3BD normal={0,0,1};
 dwg_dynapi_entity_value(e->tio.LINE,o->name,"extrusion",&normal,NULL);
 /* LWPOLYLINE omits extrusion unless flag 1 is set; its implicit OCS is +Z. */
 if(o->fixedtype==DWG_TYPE_LWPOLYLINE&&!(e->tio.LWPOLYLINE->flag&1))normal=(BITCODE_3BD){0,0,1};
 if(fabs(normal.x)>1e-15||fabs(normal.y)>1e-15||fabs(fabs(normal.z)-1)>1e-15)return 12;
 double ua=sheetAngle,uc=sheetCos,us=sheetSin;
 if(normal.z<0){if(o->fixedtype!=DWG_TYPE_LWPOLYLINE&&o->fixedtype!=DWG_TYPE_TEXT&&o->fixedtype!=DWG_TYPE_ATTRIB&&o->fixedtype!=DWG_TYPE_ARC&&o->fixedtype!=DWG_TYPE_CIRCLE)return 12;dx=-dx;ua=-sheetAngle;uc=cos(ua);us=sin(ua);}
 switch(o->fixedtype){
 case DWG_TYPE_LINE:if(apply){P2(e->tio.LINE->start);P2(e->tio.LINE->end);}break;
 case DWG_TYPE_ARC:if(apply){P2(e->tio.ARC->center);e->tio.ARC->start_angle+=ua;e->tio.ARC->end_angle+=ua;}break;
 case DWG_TYPE_CIRCLE:if(apply)P2(e->tio.CIRCLE->center);break;
 case DWG_TYPE_POINT:if(apply){double px=e->tio.POINT->x,py=e->tio.POINT->y;e->tio.POINT->x=uc*px-us*py+dx;e->tio.POINT->y=us*px+uc*py+dy;}break;
 case DWG_TYPE_TEXT:if(apply){P2(e->tio.TEXT->ins_pt);P2(e->tio.TEXT->alignment_pt);e->tio.TEXT->rotation+=ua;}break;
 case DWG_TYPE_MTEXT:if(apply){P2(e->tio.MTEXT->ins_pt);V2(e->tio.MTEXT->x_axis_dir);}break;
 case DWG_TYPE_ATTRIB:if(e->tio.ATTRIB->mtext_type>1)return 3;if(apply){P2(e->tio.ATTRIB->ins_pt);P2(e->tio.ATTRIB->alignment_pt);e->tio.ATTRIB->rotation+=ua;}break;
 case DWG_TYPE_LWPOLYLINE:if(apply)for(unsigned i=0;i<e->tio.LWPOLYLINE->num_points;i++)P2(e->tio.LWPOLYLINE->points[i]);break;
 case DWG_TYPE_INSERT:{Dwg_Entity_INSERT*in=e->tio.INSERT;for(unsigned i=0;i<in->num_owned;i++)if(shifted(dwg_ref_object(&drawing,in->attribs[i]),dx,dy,apply,depth+1))return 4;if(apply){P2(in->ins_pt);in->rotation+=ua;}break;}
 case DWG_TYPE_DIMENSION_LINEAR:{Dwg_Entity_DIMENSION_LINEAR*d=e->tio.DIMENSION_LINEAR;Dwg_Object*bo=dwg_ref_object(&drawing,d->block);if(!bo||bo->fixedtype!=DWG_TYPE_BLOCK_HEADER)return 5;Dwg_Object_BLOCK_HEADER*b=bo->tio.object->tio.BLOCK_HEADER;for(unsigned i=0;i<b->num_owned;i++)if(shifted(dwg_ref_object(&drawing,b->entities[i]),dx,dy,apply,depth+1))return 6;if(apply){P2(d->def_pt);P2(d->text_midpt);P2(d->xline1_pt);P2(d->xline2_pt);d->dim_rotation+=ua;d->text_rotation+=ua;d->horiz_dir+=ua;}break;}
 case DWG_TYPE_HATCH:{Dwg_Entity_HATCH*h=e->tio.HATCH;if(fabs(h->extrusion.x)>1e-15||fabs(h->extrusion.y)>1e-15||fabs(h->extrusion.z-1)>1e-15)return 7;
 for(unsigned i=0;i<h->num_paths;i++){Dwg_HATCH_Path*p=h->paths+i;if(p->flag&2){if(apply)for(unsigned j=0;j<p->num_segs_or_paths;j++)P2(p->polyline_paths[j].point);}else for(unsigned j=0;j<p->num_segs_or_paths;j++){Dwg_HATCH_PathSeg*s=p->segs+j;if(s->curve_type<1||s->curve_type>4)return 8;if(apply)switch(s->curve_type){case 1:P2(s->first_endpoint);P2(s->second_endpoint);break;case 2:P2(s->center);s->start_angle+=ua;s->end_angle+=ua;break;case 3:P2(s->center);V2(s->endpoint);break;case 4:for(unsigned k=0;k<s->num_control_points;k++)P2(s->control_points[k].point);for(unsigned k=0;k<s->num_fitpts;k++)P2(s->fitpts[k]);V2(s->start_tangent);V2(s->end_tangent);break;}}}
 if(apply){for(unsigned i=0;i<h->num_seeds;i++)P2(h->seeds[i]);for(unsigned i=0;i<h->num_deflines;i++){P2(h->deflines[i].pt0);V2(h->deflines[i].offset);h->deflines[i].angle+=ua;}h->angle+=ua;h->gradient_angle+=ua;}break;}
 case DWG_TYPE_MULTILEADER:{Dwg_MLEADER_AnnotContext*c=&e->tio.MULTILEADER->ctx;if(c->has_content_blk)return 9;if(apply){P2(c->content_base);P2(c->base);V2(c->base_dir);V2(c->base_vert);if(c->has_content_txt){P2(c->content.txt.location);V2(c->content.txt.direction);c->content.txt.rotation+=ua;}for(unsigned i=0;i<c->num_leaders;i++){Dwg_LEADER_Node*n=c->leaders+i;P2(n->lastleaderlinepoint);V2(n->dogleg_vector);for(unsigned j=0;j<n->num_breaks;j++){P2(n->breaks[j].start);P2(n->breaks[j].end);}for(unsigned j=0;j<n->num_lines;j++){Dwg_LEADER_Line*l=n->lines+j;for(unsigned k=0;k<l->num_points;k++)P2(l->points[k]);for(unsigned k=0;k<l->num_breaks;k++){P2(l->breaks[k].start);P2(l->breaks[k].end);}}}}break;}
 default:fprintf(stderr,"UNGROUP_REJECT %s %llX\n",o->name,(unsigned long long)o->handle.value);return 10;
 }return uf?11:0;
}
API int pllato_separate_sheet(const char *handle){
 Dwg_Object *o=entity(handle);if(!o||o->fixedtype!=DWG_TYPE_INSERT)return 1;
 Dwg_Entity_INSERT *in=o->tio.entity->tio.INSERT;
 Dwg_Object *bo=dwg_ref_object(&drawing,in->block_header);
 if(!bo||bo->fixedtype!=DWG_TYPE_BLOCK_HEADER||in->has_attribs||in->scale.x!=1||in->scale.y!=1||in->scale.z!=1||in->extrusion.x||in->extrusion.y||in->extrusion.z!=1||!isfinite(in->rotation)||o->tio.entity->num_reactors||o->tio.entity->xdicobjhandle&&o->tio.entity->xdicobjhandle->absolute_ref)return 2;
 Dwg_Object_BLOCK_HEADER *b=bo->tio.object->tio.BLOCK_HEADER;
 int allocated=0;char *name=dwg_dynapi_handle_name(&drawing,in->block_header,&allocated);int named=name&&!strncmp(name,"PLL_SHEET_",10);if(allocated)free(name);if(!named||!b->num_owned||b->num_owned>20000||b->num_inserts!=1)return 3;
 sheetAngle=in->rotation;sheetCos=cos(sheetAngle);sheetSin=sin(sheetAngle);uf=0;
 double dx=in->ins_pt.x-(sheetCos*b->base_pt.x-sheetSin*b->base_pt.y),dy=in->ins_pt.y-(sheetSin*b->base_pt.x+sheetCos*b->base_pt.y);
 if(!isfinite(dx)||!isfinite(dy))return 4;
 for(unsigned i=0;i<b->num_owned;i++){Dwg_Object *r=dwg_ref_object(&drawing,b->entities[i]);if(!r||r->supertype!=DWG_SUPERTYPE_ENTITY||dwg_obj_is_subentity(r)||!r->tio.entity->ownerhandle||r->tio.entity->ownerhandle->absolute_ref!=bo->handle.value)return 5;int e=shifted(r,dx,dy,0,0);if(e){fprintf(stderr,"UNGROUP_REJECT %s %llX code=%d\n",r->name,(unsigned long long)r->handle.value,e);return e;}}
 Dwg_Object *model=dwg_model_space_object(&drawing);Dwg_Object_BLOCK_HEADER *mb=model->tio.object->tio.BLOCK_HEADER;
 BITCODE_H *roots=realloc(mb->entities,(mb->num_owned+b->num_owned)*sizeof(*roots));if(!roots)return 6;mb->entities=roots;
 uv=calloc(drawing.num_objects,1);if(!uv)return 6;
 FILE *result=fopen("/ungroup-result.txt","w");if(!result){free(uv);uv=NULL;return 6;}
 int code=0;
 for(unsigned i=0;i<b->num_owned;i++){Dwg_Object *r=dwg_ref_object(&drawing,b->entities[i]);code=shifted(r,dx,dy,1,0);if(code)break;r->tio.entity->ownerhandle=dwg_add_handleref(&drawing,4,model->handle.value,NULL);r->tio.entity->entmode=2;mb->entities[mb->num_owned++]=dwg_add_handleref(&drawing,4,r->handle.value,NULL);fprintf(result,"%s%llX",i?",":"",(unsigned long long)r->handle.value);}
 fclose(result);free(uv);uv=NULL;if(code)return code;
 free(b->entities);b->entities=NULL;b->num_owned=0;b->first_entity=b->last_entity=NULL;mb->first_entity=mb->entities[0];mb->last_entity=mb->entities[mb->num_owned-1];return pllato_remove(handle);
}
/* Reopen a separated download as an identity wrapper for browser editing.
   Export unwraps it again; roots are reused, never cloned or rasterized. */
API int pllato_group_sheet(const char *handles,double x,double y){
 if(!loaded||!handles||strlen(handles)>340000||!isfinite(x)||!isfinite(y))return 1;
 BITCODE_HV ids[20000];unsigned count=0;char *list=strdup(handles);if(!list)return 2;
 Dwg_Object *model=dwg_model_space_object(&drawing);if(!model){free(list);return 2;}BITCODE_HV modelHandle=model->handle.value;
 for(char *h=strtok(list,",");h;h=strtok(NULL,",")){Dwg_Object *o=entity(h);if(!o||count>=20000||dwg_obj_is_subentity(o)||!(o->tio.entity->entmode==2||(o->tio.entity->ownerhandle&&o->tio.entity->ownerhandle->absolute_ref==modelHandle))){free(list);return 3;}for(unsigned j=0;j<count;j++)if(ids[j]==o->handle.value){free(list);return 3;}if(o->num_unknown_bits){char id[32];snprintf(id,sizeof(id),"%llX",(unsigned long long)o->handle.value);if(pllato_probe_opaque(id)){free(list);return 7;}}ids[count++]=o->handle.value;}free(list);if(!count)return 3;
 Dwg_Object_BLOCK_HEADER *mb=model->tio.object->tio.BLOCK_HEADER;
 for(unsigned i=0;i<count;i++){unsigned n=0;for(unsigned j=0;j<mb->num_owned;j++)if(mb->entities[j]&&mb->entities[j]->absolute_ref==ids[i])n++;if(n!=1)return 4;}
 char name[80];snprintf(name,sizeof(name),"PLL_SHEET_%llX",(unsigned long long)dwg_next_handle(&drawing));Dwg_Object_BLOCK_HEADER *b=dwg_add_BLOCK_HEADER(&drawing,name);if(!b||!dwg_add_BLOCK(b,name))return 5;
 int e=0;Dwg_Object *bo=dwg_obj_generic_to_object(b,&e);if(!bo||e)return 5;BITCODE_HV owner=bo->handle.value;b->base_pt.x=x;b->base_pt.y=y;b->explodable=1;
 b->entities=calloc(count,sizeof(BITCODE_H));if(!b->entities)return 5;
 for(unsigned i=0;i<count;i++){Dwg_Object *o=dwg_resolve_handle(&drawing,ids[i]);b->entities[b->num_owned++]=dwg_add_handleref(&drawing,4,ids[i],NULL);if(o->num_unknown_bits){free(o->unknown_bits);o->unknown_bits=NULL;o->num_unknown_bits=0;}o->tio.entity->ownerhandle=dwg_add_handleref(&drawing,4,owner,NULL);o->tio.entity->entmode=0;for(unsigned j=0;j<mb->num_owned;j++)if(mb->entities[j]->absolute_ref==ids[i]){memmove(mb->entities+j,mb->entities+j+1,(mb->num_owned-j-1)*sizeof(BITCODE_H));mb->num_owned--;break;}}
 b->first_entity=b->entities[0];b->last_entity=b->entities[count-1];mb->first_entity=mb->num_owned?mb->entities[0]:NULL;mb->last_entity=mb->num_owned?mb->entities[mb->num_owned-1]:NULL;if(!dwg_add_ENDBLK(b))return 5;
 dwg_point_3d point={x,y,0};Dwg_Entity_INSERT *insert=dwg_add_INSERT(mb,&point,name,1,1,1,0);Dwg_Object *io=insert?dwg_obj_generic_to_object(insert,&e):NULL;if(!io||e)return 5;FILE *f=fopen("/clone-result.txt","w");if(!f)return 6;fprintf(f,"%llX",(unsigned long long)io->handle.value);fclose(f);return 0;
}
#undef P2
#undef V2
