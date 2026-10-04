/* SPDX-License-Identifier: GPL-3.0-or-later */
#include "r2007-pages.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

static void synthetic(unsigned k,size_t blocks) {
  uint8_t src[8*251], encoded[8*255], back[8*251], saved[8*251];
  size_t n=blocks*k, m=blocks*255;
  for(size_t i=0;i<n;i++) src[i]=(uint8_t)(i*73+i/19);
  memcpy(saved,src,n);
  assert(r21_encode(src,n,k,blocks,encoded,m));
  assert(!memcmp(src,saved,n));
  assert(r21_decode(encoded,m,k,blocks,back,n));
  assert(!memcmp(src,back,n));
  /* Every symbol, including every parity symbol, is protected. */
  for(size_t i=0;i<m;i++) {
    encoded[i]^=1; memset(back,0xa5,n);
    assert(!r21_decode(encoded,m,k,blocks,back,n));
    for(size_t j=0;j<n;j++) assert(back[j]==0xa5);
    encoded[i]^=1;
  }
  assert(!r21_encode(src,n-1,k,blocks,encoded,m));
  assert(!r21_encode(src,n,k,blocks,encoded,m-1));
  assert(!r21_decode(encoded,m-1,k,blocks,back,n));
  assert(!r21_decode(encoded,m,k,blocks,back,n-1));
}

int main(int argc,char **argv) {
  for(unsigned k=239;k<=251;k+=12)
    for(size_t blocks=1;blocks<=8;blocks*=2) synthetic(k,blocks);
  size_t a,b;
  assert(!r21_sizes(SIZE_MAX,239,&a,&b));
  assert(!r21_sizes(1,240,&a,&b));
  assert(!r21_sizes(0,239,&a,&b));
  puts("PASS synthetic RS239/RS251, interleaving, corruption and bounds");
  if(argc==2) {
    /* Read-only independent reference: a real AC1021 file header, not our
     * own generated fixture. Do not copy customer bytes into the repository. */
    FILE *f=fopen(argv[1],"rb"); assert(f);
    uint8_t signature[6], input[3*255], data[3*239], rebuilt[3*255];
    assert(fread(signature,1,6,f)==6 && !memcmp(signature,"AC1021",6));
    assert(!fseek(f,0x80,SEEK_SET));
    assert(fread(input,1,sizeof input,f)==sizeof input); fclose(f);
    assert(r21_decode(input,sizeof input,239,3,data,sizeof data));
    assert(r21_encode(data,sizeof data,239,3,rebuilt,sizeof rebuilt));
    assert(!memcmp(input,rebuilt,sizeof input));
    puts("PASS original AC1021 header: all 765 bytes reproduced exactly");
  }
  return 0;
}
