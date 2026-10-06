/* SPDX-License-Identifier: GPL-3.0-or-later
 * Read-only independent-reference test for AC1021 page coding.
 * Links the existing LibreDWG decompressor, NOT its RS deinterleaver.
 * Never writes a DWG. Customer file paths are supplied at runtime.
 */
#include "r2007-pages.h"
#include <stdio.h>
#include <stdlib.h>
#include <inttypes.h>

size_t pllato_encoded_payload_end;
extern int decompress_r2007(uint8_t *,unsigned,uint8_t *,unsigned,const uint8_t *);

static void require(int ok,const char *why) {
  if(!ok) { fprintf(stderr,"FAIL: %s\n",why); exit(1); }
}
static uint64_t u64(const uint8_t *p) {
  uint64_t v=0; for(unsigned i=0;i<8;i++) v|=(uint64_t)p[i]<<(i*8); return v;
}
static uint32_t u32(const uint8_t *p) {
  uint32_t v=0; for(unsigned i=0;i<4;i++) v|=(uint32_t)p[i]<<(i*8); return v;
}
static uint8_t *alloc(size_t n) {
  require(n>0&&n<=128*1024*1024,"allocation limit");
  uint8_t *p=calloc(n,1); require(p!=NULL,"allocation"); return p;
}
static size_t checked_blocks(uint64_t comp,uint64_t repeat,unsigned k) {
  require(comp>0&&comp<128*1024*1024&&repeat>0&&repeat<1024,"page bounds");
  uint64_t bytes=((comp+7)&~UINT64_C(7))*repeat;
  require(bytes<128*1024*1024,"page capacity");
  return (size_t)((bytes+k-1)/k);
}
static uint8_t *unpack(const uint8_t *file,size_t len,uint64_t pos,
                       uint64_t comp,uint64_t plain,uint64_t repeat,unsigned k) {
  size_t blocks=checked_blocks(comp,repeat,k), n=blocks*k, m=blocks*255;
  require(pos<=len&&m<=len-pos,"encoded page inside file");
  require(plain>0&&plain<128*1024*1024,"decoded page size");
  uint8_t *raw=alloc(n), *again=alloc(m), *out=alloc(plain);
  if(!r21_decode(file+pos,m,k,blocks,raw,n)) {
    fprintf(stderr,"page offset=%" PRIu64 " k=%u blocks=%zu\n",pos,k,blocks);
    require(0,"original page parity");
  }
  require(r21_encode(raw,n,k,blocks,again,m),"page re-encode");
  require(!memcmp(again,file+pos,m),"exact original codeword reproduction");
  if(comp<plain)
    require(decompress_r2007(out,(unsigned)plain,raw,(unsigned)comp,out+plain)<128,
            "page decompression");
  else { require(plain<=n,"uncompressed page capacity"); memcpy(out,raw,plain); }
  free(raw); free(again); return out;
}

int main(int argc,char **argv) {
  require(argc==2,"pass one AC1021 input path");
  FILE *f=fopen(argv[1],"rb"); require(f!=NULL,"open input");
  require(!fseek(f,0,SEEK_END),"seek"); long length=ftell(f);
  require(length>=0x480&&length<=128*1024*1024,"file size");
  rewind(f); size_t len=(size_t)length; uint8_t *file=alloc(len);
  require(fread(file,1,len,f)==len,"read input"); fclose(f);
  require(!memcmp(file,"AC1021",6),"DWG 2007 signature");
  uint8_t pre[717], header[272];
  require(r21_decode(file+0x80,765,239,3,pre,sizeof pre),"header parity");
  int32_t comp=(int32_t)u32(pre+24);
  if(comp>0) {
    require(comp<=685,"header compressed size");
    require(decompress_r2007(header,sizeof header,pre+32,(unsigned)comp,
                            header+sizeof header)<128,"header decompression");
  } else memcpy(header,pre+32,sizeof header);
  uint64_t map_pos=0x480+u64(header+7*8), map_comp=u64(header+10*8),
           map_len=u64(header+11*8);
  uint8_t *map=unpack(file,len,map_pos,map_comp,map_len,u64(header+3*8),239);
  require(map_len%16==0,"page map record alignment");
  size_t count=map_len/16; uint64_t *offsets=(uint64_t *)alloc(count*sizeof(uint64_t));
  uint64_t pos=0x480, sections_pos=0;
  for(size_t i=0;i<count;i++) {
    uint64_t size=u64(map+i*16), id=u64(map+i*16+8);
    require(pos<=len&&size<=len-pos,"page extent"); offsets[i]=pos;
    if(id==u64(header+24*8)) sections_pos=pos;
    pos+=size;
  }
  require(sections_pos!=0,"section map found");
  uint64_t sections_len=u64(header+25*8);
  uint8_t *sections=unpack(file,len,sections_pos,u64(header+22*8),sections_len,
                          u64(header+27*8),239);
  size_t cursor=0, verified=0, raw_pages=0, section_count=0;
  while(cursor<sections_len) {
    require(sections_len-cursor>=64,"section header extent");
    uint8_t *s=sections+cursor;
    uint64_t name_len=u64(s+32), pages=u64(s+56), encoded=u64(s+48);
    require(name_len<=sections_len-cursor-64&&!(name_len&1),"section name extent");
    cursor+=64+name_len;
    require(pages<=(sections_len-cursor)/56,"section page records extent");
    for(uint64_t j=0;j<pages;j++,cursor+=56) {
      uint8_t *p=sections+cursor; uint64_t id=u64(p+16);
      size_t index=0; while(index<count&&u64(map+index*16+8)!=id) index++;
      require(index<count,"data page found");
      if(encoded && u64(p+32)!=u64(p+24)) {
        require(encoded==4,"unsupported compressed page layout");
        uint8_t *data=unpack(file,len,offsets[index],u64(p+32),u64(p+24),1,251);
        free(data); verified++;
      } else {
        require(u64(p+24)<=u64(map+index*16),"raw page extent");
        raw_pages++;
      }
    }
    section_count++;
  }
  printf("PASS original AC1021: %zu sections, %zu data pages; parity and exact re-encoding\n",
         section_count,verified);
  printf("%zu uncompressed pages: extent checked only, parity not verified\n",raw_pages);
  puts("NOT a DWG export test: CRC64, container writing and object editing remain separate gates.");
  free(sections); free(offsets); free(map); free(file); return 0;
}
