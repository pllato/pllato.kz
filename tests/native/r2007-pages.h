/* SPDX-License-Identifier: GPL-3.0-or-later
 * Experimental AC1021 page coding. Not connected to the production writer.
 * No input mutation and no allocation. Explicit capacities at every boundary.
 */
#ifndef PLLATO_R2007_PAGES_H
#define PLLATO_R2007_PAGES_H
#include <stddef.h>
#include <stdint.h>
#include <string.h>

/* DWG system pages: GF(256)/0x169, k=239; data pages: /0x11d, k=251.
 * Codewords are systematic and interleaved column-first on disk.
 */
static uint8_t r21_mul(uint8_t a, uint8_t b, unsigned polynomial) {
  unsigned x=a, result=0;
  while(b) {
    if(b&1) result^=x;
    b>>=1; x<<=1;
    if(x&256) x^=polynomial;
  }
  return (uint8_t)result;
}

static int r21_sizes(size_t blocks, unsigned k, size_t *data, size_t *encoded) {
  if((k!=239 && k!=251) || !blocks || blocks>SIZE_MAX/255) return 0;
  *data=blocks*k; *encoded=blocks*255;
  return 1;
}

static void r21_generator(unsigned k, uint8_t g[17]) {
  const unsigned polynomial=k==239 ? 0x169 : 0x11d;
  uint8_t root=1;
  memset(g,0,17); g[0]=1;
  for(unsigned i=0;i<k;i++) root=r21_mul(root,2,polynomial);
  for(unsigned degree=0;degree<255-k;degree++) {
    for(unsigned j=degree+1;j>0;j--)
      g[j]^=r21_mul(g[j-1],root,polynomial);
    root=r21_mul(root,2,polynomial);
  }
}

/* Caller supplies distinct buffers. Full source blocks are required: padding
 * is a container-level decision and must not silently replace source bytes. */
static int r21_encode(const uint8_t *src,size_t src_len,unsigned k,size_t blocks,
                      uint8_t *out,size_t out_len) {
  size_t data,encoded;
  if(!src||!out||!r21_sizes(blocks,k,&data,&encoded)
     ||src_len!=data||out_len<encoded) return 0;
  uint8_t g[17]; r21_generator(k,g);
  const unsigned parity=255-k, polynomial=k==239 ? 0x169 : 0x11d;
  for(size_t b=0;b<blocks;b++) {
    uint8_t work[255]={0};
    memcpy(work,src+b*k,k);
    /* Polynomial division; restore the systematic data on output. */
    for(unsigned i=0;i<k;i++) {
      uint8_t factor=work[i];
      for(unsigned j=1;j<=parity;j++)
        work[i+j]^=r21_mul(factor,g[j],polynomial);
    }
    for(unsigned j=0;j<255;j++)
      out[j*blocks+b]=j<k ? src[b*k+j] : work[j];
  }
  return 1;
}

/* Verify all syndromes before writing any output. Unlike LibreDWG's current
 * deinterleaver, this rejects corruption rather than ignoring parity bytes.
 * Error correction is intentionally not attempted. */
static int r21_decode(const uint8_t *src,size_t src_len,unsigned k,size_t blocks,
                      uint8_t *out,size_t out_len) {
  size_t data,encoded;
  if(!src||!out||!r21_sizes(blocks,k,&data,&encoded)
     ||src_len!=encoded||out_len<data) return 0;
  const unsigned polynomial=k==239 ? 0x169 : 0x11d;
  uint8_t first=1;
  for(unsigned i=0;i<k;i++) first=r21_mul(first,2,polynomial);
  for(size_t b=0;b<blocks;b++) {
    uint8_t root=first;
    for(unsigned p=0;p<255-k;p++) {
      uint8_t syndrome=0;
      for(unsigned j=0;j<255;j++)
        syndrome=r21_mul(syndrome,root,polynomial)^src[j*blocks+b];
      if(syndrome) return 0;
      root=r21_mul(root,2,polynomial);
    }
  }
  for(size_t b=0;b<blocks;b++)
    for(unsigned j=0;j<k;j++) out[b*k+j]=src[j*blocks+b];
  return 1;
}
#endif
