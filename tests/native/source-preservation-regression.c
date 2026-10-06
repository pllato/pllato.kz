/* Unchanged record bytes, edited record growth, and source CRC rejection. */
#include <assert.h>
#include <unistd.h>
#include "pllato_executive_engine.c"
int main(int argc,char**argv){
 assert(argc==3&&access(argv[2],F_OK)!=0);assert(pllato_open(argv[1])<128);assert(pllato_preserve_source(argv[1])==0);
 unsigned count=drawing.num_objects;Dwg_Object*line=NULL,*text=NULL;
 for(unsigned i=0;i<count;i++){Dwg_Object*o=drawing.object+i;if(o->fixedtype==DWG_TYPE_LINE&&!line)line=o;if(o->fixedtype==DWG_TYPE_TEXT&&!text)text=o;}
 assert(line&&text);BITCODE_HV lh=line->handle.value,th=text->handle.value;char handle[32];snprintf(handle,sizeof(handle),"%llX",(unsigned long long)lh);assert(!pllato_move(handle,10,0));snprintf(handle,sizeof(handle),"%llX",(unsigned long long)th);assert(!pllato_text(handle,"Source preservation: a longer changed text tests record relocation and handle-map deltas."));
 assert(pllato_save(argv[2])<128);assert(!pp_retained[line->index]&&!pp_retained[text->index]);
 unsigned char*original=NULL;size_t originalSize=0;assert(pp_file(argv[1],&original,&originalSize));assert(originalSize==pp_source.filesize&&!memcmp(original,pp_source.file,originalSize));free(original);assert(pp_verify_retained(&(Dwg_Data){0},argv[2])==0);/* A false inventory cannot certify preserved bytes. */
 pllato_close();assert(pllato_open(argv[2])<128);assert(drawing.num_objects==count);Dwg_Object*l=dwg_resolve_handle(&drawing,lh),*t=dwg_resolve_handle(&drawing,th);assert(l&&t);int owned=0;char*value=dwg_ent_get_UTF8(t->tio.entity->tio.TEXT,"text_value",&owned);assert(value&&strstr(value,"a longer changed text"));if(owned)free(value);assert(!pllato_preserve_source(argv[2]));
 PP_Section*objects=pp_find(pp_source.sections,pp_source.nsections,"AcDb:AcDbObjects");assert(objects);PP_Record*r=pp_source.records;objects->bytes[r->address]^=1;size_t length;assert(!pp_frame(objects,r->address,drawing.header.version,&length));
 pllato_close();assert(!pp_source.ready&&!pp_source.file&&!pp_retained);puts("PASS original bytes, edited relocation, readback and CRC guard");return 0;
}
