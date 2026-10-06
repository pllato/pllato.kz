/* SPDX-License-Identifier: GPL-3.0-or-later
   Full-document saves preserve unedited serialized records and auxiliary
   sections. Selected-object export uses its separate dependency validator. */
#include <stdint.h>
#include <limits.h>
#define PP_LIMIT ((size_t)512 * 1024 * 1024)
#define PP_SECTIONS 64

typedef struct { unsigned char *p; size_t n,cap; } PP_Buffer;
typedef struct { char name[64]; unsigned type,max,unknown,compressed,encrypted;
 unsigned char *bytes; size_t size; unsigned source_payload; } PP_Section;
typedef struct { BITCODE_HV handle; size_t address,length; unsigned char *typed; size_t typedlen; } PP_Record;
typedef struct { unsigned char *file;size_t filesize;unsigned char prefix[256];
 PP_Section sections[PP_SECTIONS];unsigned nsections,nrecords,nclasses;
 PP_Record *records;int ready; } PP_Source;
static PP_Source pp_source;
static unsigned pp_u32(const unsigned char*p){return p[0]|(p[1]<<8)|(p[2]<<16)|((unsigned)p[3]<<24);}
static void pp_w32(unsigned char*p,unsigned v){for(unsigned i=0;i<4;i++)p[i]=(unsigned char)(v>>(8*i));}
static void pp_w64(unsigned char*p,uint64_t v){for(unsigned i=0;i<8;i++)p[i]=(unsigned char)(v>>(8*i));}
static int pp_reserve(PP_Buffer*b,size_t extra){if(extra>PP_LIMIT-b->n)return 0;size_t need=b->n+extra;if(need<=b->cap)return 1;size_t cap=b->cap?b->cap:4096;while(cap<need){if(cap>PP_LIMIT/2){cap=PP_LIMIT;break;}cap*=2;}unsigned char*p=realloc(b->p,cap);if(!p)return 0;b->p=p;b->cap=cap;return 1;}
static int pp_add(PP_Buffer*b,const void*p,size_t n){if(!pp_reserve(b,n))return 0;if(n)memcpy(b->p+b->n,p,n);b->n+=n;return 1;}
static int pp_zero(PP_Buffer*b,size_t n){if(!pp_reserve(b,n))return 0;memset(b->p+b->n,0,n);b->n+=n;return 1;}
static int pp_file(const char*path,unsigned char**bytes,size_t*size){FILE*f=fopen(path,"rb");if(!f)return 0;if(fseek(f,0,SEEK_END)){fclose(f);return 0;}long n=ftell(f);if(n<256||(size_t)n>PP_LIMIT||fseek(f,0,SEEK_SET)){fclose(f);return 0;}unsigned char*p=malloc(n);if(!p){fclose(f);return 0;}int ok=fread(p,1,n,f)==(size_t)n;fclose(f);if(!ok){free(p);return 0;}*bytes=p;*size=n;return 1;}
static void pp_clear_sections(PP_Section*s,unsigned n){for(unsigned i=0;i<n;i++)free(s[i].bytes);}
static void pp_source_clear(void){pp_clear_sections(pp_source.sections,pp_source.nsections);if(pp_source.records)for(unsigned i=0;i<pp_source.nrecords;i++)free(pp_source.records[i].typed);free(pp_source.records);free(pp_source.file);memset(&pp_source,0,sizeof(pp_source));}
static PP_Section*pp_find(PP_Section*s,unsigned n,const char*name){for(unsigned i=0;i<n;i++)if(!strcmp(s[i].name,name))return s+i;return NULL;}
static int pp_load_sections(Dwg_Data*d,const unsigned char*file,size_t filesize,PP_Section*out,unsigned*count){
 *count=0;if(d->header.section_infohdr.num_desc>PP_SECTIONS)return 0;
 for(unsigned i=0;i<d->header.section_infohdr.num_desc;i++){
  Dwg_Section_Info*info=d->header.section_info+i;if(!info->name[0])continue;
  if(!memchr(info->name,0,64)||info->size<0||(uint64_t)info->size>PP_LIMIT||!info->max_decomp_size||info->max_decomp_size>16*1024*1024||(info->encrypted&&!(info->encrypted==1&&!strcmp(info->name,"AcDb:FileDepList")&&info->size==8&&info->compressed==1))||(info->compressed!=1&&info->compressed!=2))return 0;
  PP_Section*s=out+(*count)++;memset(s,0,sizeof(*s));memcpy(s->name,info->name,64);s->type=info->type;s->max=info->max_decomp_size;s->unknown=info->unknown;s->compressed=info->compressed;s->encrypted=info->encrypted;s->size=info->size;s->source_payload=info->num_sections&&info->sections[0]?info->sections[0]->address+32:0;
  s->bytes=calloc(s->size?s->size:1,1);if(!s->bytes)return 0;
  size_t covered=0;
  for(unsigned j=0;j<info->num_sections;j++){
   Dwg_Section*p=info->sections[j];if(!p||p->address>filesize||filesize-p->address<32)return 0;size_t at=p->address;unsigned mask=0x4164536b^(unsigned)at,n=pp_u32(file+at+8)^mask;uint64_t off=(pp_u32(file+at+16)^mask)|((uint64_t)(pp_u32(file+at+20)^mask)<<32);
   if(off!=covered||off>s->size||n>filesize-at-32)return 0;size_t take=s->size-covered;if(take>s->max)take=s->max;
   if(s->compressed==1){if(n<take)return 0;memcpy(s->bytes+covered,file+at+32,take);}
   else {Bit_Chain src={0},dec={0};src.chain=(unsigned char*)file+at+32;src.size=n;dec.size=s->max;dec.chain=calloc(dec.size+16,1);if(!dec.chain)return 0;int e=decompress_R2004_section(&src,&dec);if(!e)memcpy(s->bytes+covered,dec.chain,take);free(dec.chain);if(e)return 0;}
   covered+=take;
  }
  if(covered!=s->size)return 0;
  /* The upstream writer labels its eight-zero empty dependency list as
     encrypted. Admit only that byte-exact empty stub, never encrypted data. */
  if(s->encrypted)for(size_t k=0;k<s->size;k++)if(s->bytes[k])return 0;
 }
 return 1;
}
static int pp_frame(PP_Section*objects,size_t address,Dwg_Version_Type version,size_t*length){
 if(address>=objects->size||objects->size-address<4)return 0;Bit_Chain b={0};b.chain=objects->bytes;b.size=objects->size;b.byte=address;
 unsigned n=bit_read_MS(&b);if(version>=R_2010b)bit_read_UMC(&b);if(b.byte>objects->size||n>objects->size-b.byte||objects->size-b.byte-n<2)return 0;size_t end=b.byte+n+2;unsigned stored=objects->bytes[end-2]|(objects->bytes[end-1]<<8);if(bit_calc_CRC(0xc0c1,objects->bytes+address,end-address-2)!=stored)return 0;*length=end-address;return 1;
}
static int pp_interval_compare(const void*a,const void*b){const PP_Record*x=*(PP_Record*const*)a,*y=*(PP_Record*const*)b;return x->address<y->address?-1:x->address>y->address;}
static int pp_no_overlap(void){PP_Record**sorted=malloc(pp_source.nrecords*sizeof(*sorted));if(!sorted)return 0;for(unsigned i=0;i<pp_source.nrecords;i++)sorted[i]=pp_source.records+i;qsort(sorted,pp_source.nrecords,sizeof(*sorted),pp_interval_compare);int ok=1;for(unsigned i=1;i<pp_source.nrecords;i++)if(sorted[i-1]->address+sorted[i-1]->length>sorted[i]->address){ok=0;break;}free(sorted);return ok;}
static int pp_map_source(PP_Section*map,PP_Section*objects){
 Bit_Chain b={0};b.chain=map->bytes;b.size=map->size;unsigned index=0;
 while(b.byte+4<=b.size){size_t start=b.byte;unsigned n=bit_read_RS_BE(&b);if(n<2||n>2040||n>b.size-start-2)return 0;BITCODE_HV handle=0;int64_t address=0;
  while(b.byte-start<n){size_t before=b.byte;handle+=bit_read_UMC(&b);address+=bit_read_MC(&b);if(b.byte<=before||b.byte-start>n||index>=pp_source.nrecords||address<0)return 0;Dwg_Object*o=drawing.object+index;PP_Record*r=pp_source.records+index++;if(handle!=o->handle.value||o->index!=index-1||!handle)return 0;r->handle=handle;r->address=address;if(!pp_frame(objects,r->address,drawing.header.version,&r->length))return 0;}
  unsigned crc=bit_calc_CRC(0xc0c1,map->bytes+start,n);if(bit_read_RS_BE(&b)!=crc)return 0;if(n==2)return index==pp_source.nrecords&&b.byte==b.size;
 }
 return 0;
}
static int pp_encode_record(Dwg_Object*o,Bit_Chain*tmp){Dwg_Object old=*o;tmp->byte=16;tmp->bit=0;int e=dwg_encode_add_object(o,tmp,16);*o=old;return e;}
API int pllato_preserve_source(const char*path){
 pp_source_clear();if(!loaded||!path||drawing.header.version!=R_2018||drawing.header.version!=drawing.header.from_version)return DWG_ERR_INVALIDDWG;
 int error=DWG_ERR_INVALIDDWG;if(!pp_file(path,&pp_source.file,&pp_source.filesize))goto fail;memcpy(pp_source.prefix,pp_source.file,256);
 if(!pp_load_sections(&drawing,pp_source.file,pp_source.filesize,pp_source.sections,&pp_source.nsections))goto fail;
 PP_Section*objects=pp_find(pp_source.sections,pp_source.nsections,"AcDb:AcDbObjects"),*map=pp_find(pp_source.sections,pp_source.nsections,"AcDb:Handles");if(!objects||!map)goto fail;
 pp_source.nrecords=drawing.num_objects;pp_source.nclasses=drawing.num_classes;if(!pp_source.nrecords||pp_source.nrecords>1000000)goto fail;pp_source.records=calloc(pp_source.nrecords,sizeof(PP_Record));if(!pp_source.records){error=DWG_ERR_OUTOFMEM;goto fail;}
 if(!pp_map_source(map,objects)||!pp_no_overlap())goto fail;
 Bit_Chain tmp={0};bit_chain_init(&tmp,65536);if(!tmp.chain){error=DWG_ERR_OUTOFMEM;goto fail;}tmp.version=tmp.from_version=drawing.header.version;
 for(unsigned i=0;i<pp_source.nrecords;i++){PP_Record*r=pp_source.records+i;int e=pp_encode_record(drawing.object+i,&tmp);if(e>=128||tmp.byte<16){free(tmp.chain);goto fail;}r->typedlen=tmp.byte-16;r->typed=malloc(r->typedlen?r->typedlen:1);if(!r->typed){free(tmp.chain);error=DWG_ERR_OUTOFMEM;goto fail;}memcpy(r->typed,tmp.chain+16,r->typedlen);}
 free(tmp.chain);pp_source.ready=1;return 0;
 fail:fprintf(stderr,"SAVE_REJECT_SOURCE_CACHE code=%d\n",error);pp_source_clear();return error;
}
static int pp_unchanged(Dwg_Object*o){if(!pp_source.ready||o->index>=pp_source.nrecords)return 0;PP_Record*r=pp_source.records+o->index;if(r->handle!=o->handle.value)return 0;Bit_Chain tmp={0};bit_chain_init(&tmp,r->typedlen+64);if(!tmp.chain)return 0;tmp.version=tmp.from_version=drawing.header.version;int e=pp_encode_record(o,&tmp);int equal=e<128&&tmp.byte-16==r->typedlen&&!memcmp(tmp.chain+16,r->typed,r->typedlen);free(tmp.chain);return equal;}

/* Container pages are emitted under the source file's section identifiers.
   Logical object addresses are retained even when a record is moved/grown. */
typedef struct {unsigned id,size;size_t address,offset;} PP_Page;
static unsigned pp_adler(const unsigned char*p,size_t n,unsigned seed){unsigned a=seed&65535,b=seed>>16;for(size_t i=0;i<n;i++){a=(a+p[i])%65521;b=(b+a)%65521;}return (b<<16)|a;}
static unsigned pp_crc32(const unsigned char*p,size_t n){unsigned c=~0u;for(size_t i=0;i<n;i++){c^=p[i];for(unsigned j=0;j<8;j++)c=(c>>1)^((c&1)?0xedb88320:0);}return ~c;}
static void pp_crypt(unsigned char*p,size_t n){unsigned seed=1;for(size_t i=0;i<n;i++){seed=seed*214013+2531011;p[i]^=(seed>>16)&255;}}
static int pp_literal(const unsigned char*p,size_t n,PP_Buffer*out){if(n<=18)return 0;unsigned char z=0,last[3]={17,0,0};if(!pp_add(out,&z,1))return 0;size_t k=n-18;while(k>255){if(!pp_add(out,&z,1))return 0;k-=255;}z=k;return pp_add(out,&z,1)&&pp_add(out,p,n)&&pp_add(out,last,3);}
static int pp_system(PP_Buffer*out,unsigned magic,const unsigned char*p,size_t n){PP_Buffer payload={0};if(!pp_literal(p,n,&payload))return 0;size_t start=out->n;unsigned char h[20]={0};pp_w32(h,magic);pp_w32(h+4,n);pp_w32(h+8,payload.n);pp_w32(h+12,2);pp_w32(h+16,pp_adler(payload.p,payload.n,pp_adler(h,20,0)));int ok=pp_add(out,h,20)&&pp_add(out,payload.p,payload.n)&&pp_zero(out,(32-(out->n-start)%32)%32);free(payload.p);return ok;}
static int pp_container(const char*path,PP_Section*s,unsigned count){
 PP_Buffer file={0},desc={0},map={0};PP_Page*pages=NULL;unsigned npages=0,capacity=0,id=1;int ok=0;unsigned first[PP_SECTIONS]={0};
 if(!pp_add(&file,pp_source.prefix,256))goto end;
 for(unsigned i=0;i<count;i++)for(size_t off=0;off<s[i].size;off+=s[i].max){
  if(npages==capacity){capacity=capacity?capacity*2:128;PP_Page*q=realloc(pages,capacity*sizeof(*q));if(!q)goto end;pages=q;}
  size_t at=file.n,take=s[i].size-off;if(take>s[i].max)take=s[i].max;
  /* Data pages use the independently verified uncompressed representation.
     Do not reuse experimental compression for source-preserving saves. */
  s[i].compressed=1;
  PP_Buffer payload={0};unsigned char*plain=calloc(s[i].max,1);if(!plain)goto end;memcpy(plain,s[i].bytes+off,take);
  int good=pp_add(&payload,plain,s[i].max);free(plain);if(!good){free(payload.p);goto end;}
  unsigned char h[32]={0};pp_w32(h,0x4163043b);pp_w32(h+4,s[i].type);pp_w32(h+8,payload.n);pp_w32(h+12,s[i].max);pp_w64(h+16,off);unsigned dc=pp_adler(payload.p,payload.n,0);pp_w32(h+28,dc);pp_w32(h+24,pp_adler(h,32,dc));
  for(unsigned k=0;k<32;k+=4)pp_w32(h+k,pp_u32(h+k)^0x4164536b^(unsigned)at);
  good=pp_add(&file,h,32)&&pp_add(&file,payload.p,payload.n)&&pp_zero(&file,(32-(file.n-at)%32)%32);free(payload.p);if(!good)goto end;
  pages[npages++]=(PP_Page){id++,(unsigned)(file.n-at),at,off};if(!off)first[i]=at+32;
 }
 unsigned char header[20]={0};pp_w32(header,count+1);pp_w32(header+4,2);pp_w32(header+8,0x7400);unsigned maximum=0;for(unsigned i=0;i<count;i++)if(s[i].type>maximum)maximum=s[i].type;pp_w32(header+16,maximum+1);if(!pp_add(&desc,header,20))goto end;
 unsigned pi=0;for(unsigned i=0;i<=count;i++){
  PP_Section empty={0};empty.max=0x7400;empty.unknown=1;empty.compressed=2;PP_Section*t=i?s+i-1:&empty;
  unsigned num=t->size?(t->size+t->max-1)/t->max:0;unsigned char d[96]={0};pp_w64(d,t->size);pp_w32(d+8,num);pp_w32(d+12,t->max);pp_w32(d+16,t->unknown);pp_w32(d+20,t->compressed);pp_w32(d+24,t->type);pp_w32(d+28,t->encrypted);memcpy(d+32,t->name,64);if(!pp_add(&desc,d,96))goto end;
  for(unsigned j=0;j<num;j++){PP_Page*q=pages+pi++;unsigned char v[16];pp_w32(v,q->id);pp_w32(v+4,t->max);pp_w64(v+8,q->offset);if(!pp_add(&desc,v,16))goto end;}
 }
 unsigned infoId=id+1,mapId=id+2;size_t infoAt=file.n;if(!pp_system(&file,0x4163003b,desc.p,desc.n))goto end;
 for(unsigned i=0;i<npages;i++){unsigned char v[8];pp_w32(v,pages[i].id);pp_w32(v+4,pages[i].size);if(!pp_add(&map,v,8))goto end;}
 unsigned char v[8];pp_w32(v,infoId);pp_w32(v+4,file.n-infoAt);if(!pp_add(&map,v,8))goto end;
 size_t mapAt=file.n;pp_w32(v,mapId);/* Literal overhead is deterministic. */size_t rawSize=map.n+8,litSize=1+(rawSize-18+254)/255+rawSize+3;pp_w32(v+4,((20+litSize+31)/32)*32);if(!pp_add(&map,v,8)||!pp_system(&file,0x41630e3b,map.p,map.n))goto end;
 for(unsigned i=0;i<count;i++){if(!strcmp(s[i].name,"AcDb:Preview"))pp_w32(file.p+13,first[i]);if(!strcmp(s[i].name,"AcDb:SummaryInfo"))pp_w32(file.p+32,first[i]);}
 for(unsigned field=0x2c;field<=0x30;field+=4){unsigned old=pp_u32(pp_source.prefix+field),matches=0;if(!old)continue;for(unsigned i=0;i<pp_source.nsections;i++){PP_Section*t=pp_source.sections+i;/* First page payload address captured before writer changes section metadata. */if(t->source_payload==old){for(unsigned j=0;j<count;j++)if(!strcmp(t->name,s[j].name)){pp_w32(file.p+field,first[j]);matches++;}}}if(matches!=1)goto end;}
 unsigned char h[108];memcpy(h,pp_source.prefix+128,108);pp_crypt(h,108);pp_w32(h+24,0);pp_w32(h+28,0);pp_w32(h+32,0);pp_w32(h+40,mapId);pp_w64(h+44,file.n-256);pp_w64(h+52,file.n+20);pp_w32(h+60,0);pp_w32(h+64,npages+2);pp_w32(h+80,mapId);pp_w64(h+84,mapAt-256);pp_w32(h+92,infoId);pp_w32(h+96,mapId);pp_w32(h+100,0);pp_w32(h+104,0);pp_w32(h+104,pp_crc32(h,108));pp_crypt(h,108);memcpy(file.p+128,h,108);
 unsigned char tail[128]={0};pp_w32(tail,0x41630e3b);pp_w32(tail+12,2);memcpy(tail+20,h,108);if(!pp_add(&file,tail,128))goto end;
 {FILE*f=fopen(path,"wb");if(!f)goto end;ok=fwrite(file.p,1,file.n,f)==file.n;ok=fclose(f)==0&&ok;}
 end:free(file.p);free(desc.p);free(map.p);free(pages);return ok;
}
static int pp_handle_compare(const void*a,const void*b){const Dwg_Object*x=*(Dwg_Object*const*)a,*y=*(Dwg_Object*const*)b;return x->handle.value<y->handle.value?-1:x->handle.value>y->handle.value;}
static unsigned char*pp_retained;
static size_t*pp_addresses;
static int pp_merge_save(const char*path){
 unsigned char*file=NULL;size_t filesize=0;PP_Section generated[PP_SECTIONS]={0};unsigned count=0;int ok=0;PP_Buffer objects={0};Bit_Chain map={0};Dwg_Object**sorted=NULL;unsigned active=0;
 free(pp_retained);free(pp_addresses);pp_retained=calloc(drawing.num_objects,1);pp_addresses=calloc(drawing.num_objects,sizeof(size_t));
 if(!pp_retained||!pp_addresses||!pp_file(path,&file,&filesize)||!pp_load_sections(&drawing,file,filesize,generated,&count))goto end;
 PP_Section*original=pp_find(pp_source.sections,pp_source.nsections,"AcDb:AcDbObjects");if(!original||!pp_add(&objects,original->bytes,original->size))goto end;
 Bit_Chain tmp={0};bit_chain_init(&tmp,65536);if(!tmp.chain)goto end;tmp.version=tmp.from_version=drawing.header.version;
 for(unsigned i=0;i<drawing.num_objects;i++){
  Dwg_Object*o=drawing.object+i;if(o->type==DWG_TYPE_FREED||o->type==DWG_TYPE_UNUSED)continue;PP_Record*r=i<pp_source.nrecords?pp_source.records+i:NULL;
  int e=pp_encode_record(o,&tmp);if(e>=128||tmp.byte<16){free(tmp.chain);goto end;}size_t n=tmp.byte-16;
  if(r&&r->handle==o->handle.value&&n==r->typedlen&&!memcmp(tmp.chain+16,r->typed,n)){pp_retained[i]=1;pp_addresses[i]=r->address;continue;}
  if(r&&r->handle==o->handle.value&&n<=r->length){memcpy(objects.p+r->address,tmp.chain+16,n);memset(objects.p+r->address+n,0,r->length-n);pp_addresses[i]=r->address;}
  else {pp_addresses[i]=objects.n;if(!pp_add(&objects,tmp.chain+16,n)){free(tmp.chain);goto end;}}
 }
 unsigned retained=0;for(unsigned i=0;i<drawing.num_objects;i++)retained+=pp_retained[i];fprintf(stderr,"SOURCE_MERGE retained=%u changed=%u\n",retained,drawing.num_objects-retained);
 free(tmp.chain);
 /* Handle deltas are signed per page. Generate bounded pages with CRC and
    verify every retained source record later against the actual output. */
 bit_chain_init(&map,65536);map.version=map.from_version=drawing.header.version;size_t start=0;bit_write_RS_BE(&map,0);BITCODE_HV prev=0;int64_t addr=0;
 sorted=malloc(drawing.num_objects*sizeof(*sorted));if(!sorted)goto end;for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].type!=DWG_TYPE_FREED&&drawing.object[i].type!=DWG_TYPE_UNUSED)sorted[active++]=drawing.object+i;qsort(sorted,active,sizeof(*sorted),pp_handle_compare);
 for(unsigned k=0;k<active;k++){Dwg_Object*o=sorted[k];unsigned i=o->index;
  if(o->handle.value<=prev||pp_addresses[i]>INT32_MAX)goto end;
  if(map.byte-start>2010){size_t end=map.byte;unsigned n=end-start;map.chain[start]=n>>8;map.chain[start+1]=n;bit_write_RS_BE(&map,bit_calc_CRC(0xc0c1,map.chain+start,n));start=map.byte;bit_write_RS_BE(&map,0);prev=0;addr=0;}
  bit_write_UMC(&map,o->handle.value-prev);int64_t delta=(int64_t)pp_addresses[i]-addr;if(delta<INT32_MIN||delta>INT32_MAX)goto end;bit_write_MC(&map,delta);prev=o->handle.value;addr=pp_addresses[i];
 }
 {unsigned n=map.byte-start;map.chain[start]=n>>8;map.chain[start+1]=n;bit_write_RS_BE(&map,bit_calc_CRC(0xc0c1,map.chain+start,n));start=map.byte;bit_write_RS_BE(&map,2);bit_write_RS_BE(&map,bit_calc_CRC(0xc0c1,map.chain+start,2));}
 int same_map=drawing.num_objects==pp_source.nrecords;for(unsigned i=0;same_map&&i<drawing.num_objects;i++)if(drawing.object[i].type==DWG_TYPE_FREED||drawing.object[i].type==DWG_TYPE_UNUSED||pp_addresses[i]!=pp_source.records[i].address)same_map=0;
 PP_Section sections[PP_SECTIONS];memcpy(sections,pp_source.sections,sizeof(sections));
 for(unsigned i=0;i<pp_source.nsections;i++){PP_Section*s=sections+i;if(!strcmp(s->name,"AcDb:AcDbObjects")){s->bytes=objects.p;s->size=objects.n;}else if(!strcmp(s->name,"AcDb:Handles")){if(!same_map){s->bytes=map.chain;s->size=map.byte;}}else if(!strcmp(s->name,"AcDb:Header")||(!strcmp(s->name,"AcDb:Classes")&&drawing.num_classes!=pp_source.nclasses)){PP_Section*g=pp_find(generated,count,s->name);if(!g)goto end;s->bytes=g->bytes;s->size=g->size;}}
 ok=pp_container(path,sections,pp_source.nsections);
 end:free(sorted);free(objects.p);free(map.chain);free(file);pp_clear_sections(generated,count);if(!ok)fprintf(stderr,"SAVE_REJECT_SOURCE_MERGE\n");return ok;
}
static int pp_verify_map(PP_Section*map,PP_Section*objects){
 unsigned char*seen=calloc(drawing.num_objects,1);if(!seen)return 0;unsigned found=0,expected=0;int ok=0;for(unsigned i=0;i<drawing.num_objects;i++)if(drawing.object[i].type!=DWG_TYPE_FREED&&drawing.object[i].type!=DWG_TYPE_UNUSED)expected++;
 Bit_Chain b={0};b.chain=map->bytes;b.size=map->size;
 while(b.byte+4<=b.size){size_t start=b.byte;unsigned n=bit_read_RS_BE(&b);if(n<2||n>2040||n>b.size-start-2)goto end;BITCODE_HV handle=0;int64_t address=0;
  while(b.byte-start<n){size_t before=b.byte;BITCODE_HV delta=bit_read_UMC(&b);if(!delta||delta>UINT64_MAX-handle)goto end;handle+=delta;address+=bit_read_MC(&b);Dwg_Object*o=dwg_resolve_handle(&drawing,handle);size_t length;if(b.byte<=before||b.byte-start>n||address<0||!o||o->index>=drawing.num_objects||seen[o->index]||o->type==DWG_TYPE_FREED||o->type==DWG_TYPE_UNUSED||pp_addresses[o->index]!=(size_t)address||!pp_frame(objects,address,drawing.header.version,&length))goto end;seen[o->index]=1;found++;}
  unsigned crc=bit_calc_CRC(0xc0c1,map->bytes+start,n);if(bit_read_RS_BE(&b)!=crc)goto end;if(n==2){ok=found==expected&&b.byte==b.size;goto end;}
 }end:free(seen);return ok;
}
static int pp_verify_retained(Dwg_Data*check,const char*path){unsigned char*file=NULL;size_t n=0;PP_Section sections[PP_SECTIONS]={0};unsigned count=0;int ok=0;if(!pp_file(path,&file,&n)||!pp_load_sections(check,file,n,sections,&count))goto end;PP_Section*objects=pp_find(sections,count,"AcDb:AcDbObjects"),*source=pp_find(pp_source.sections,pp_source.nsections,"AcDb:AcDbObjects");PP_Section*map=pp_find(sections,count,"AcDb:Handles");if(!objects||!source||!map||!pp_verify_map(map,objects))goto end;
 for(unsigned i=0;i<pp_source.nrecords;i++)if(pp_retained[i]){PP_Record*r=pp_source.records+i;Dwg_Object*b=dwg_resolve_handle(check,r->handle);/* Decoder address is the body start, not the map prefix. */if(!b||b->address<r->address||b->address-r->address>16||r->address+r->length>objects->size||memcmp(objects->bytes+r->address,source->bytes+r->address,r->length))goto end;}ok=1;
 end:free(file);pp_clear_sections(sections,count);if(!ok)fprintf(stderr,"SAVE_REJECT_SOURCE_BYTES\n");return ok;}
static int pp_keep_empty_sort(Dwg_Object*o){if(!pp_source.ready||selected_export_validated||o->num_unknown_bits||o->num_unknown_rest||!pp_unchanged(o))return 0;Dwg_Object_SORTENTSTABLE*s=o->tio.object->tio.SORTENTSTABLE;if(s->num_ents||(s->block_owner&&s->block_owner->absolute_ref))return 0;Dwg_Object*dict=dwg_ref_object(&drawing,o->tio.object->ownerhandle);
 if(!dict){for(unsigned i=0;i<drawing.num_object_refs;i++)if(drawing.object_ref[i]&&drawing.object_ref[i]->absolute_ref==o->handle.value)return 0;return 1;}
 if(dict->fixedtype!=DWG_TYPE_DICTIONARY)return 0;Dwg_Object*block=dwg_ref_object(&drawing,dict->tio.object->ownerhandle);if(!block||block->fixedtype!=DWG_TYPE_BLOCK_HEADER||dwg_ref_object(&drawing,block->tio.object->xdicobjhandle)!=dict)return 0;unsigned member=0;Dwg_Object_DICTIONARY*d=dict->tio.object->tio.DICTIONARY;for(unsigned j=0;j<d->numitems;j++)if(d->itemhandles&&d->itemhandles[j]&&d->itemhandles[j]->absolute_ref==o->handle.value)member++;return member==1;}
