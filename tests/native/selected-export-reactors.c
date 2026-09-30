/* Bit-level unit test of opaque TABLESTYLE reactor editing. The arbitrary
   payload is deliberately not interpreted or emitted as a DWG fixture. */
#include "pllato_executive_engine.c"
#include <assert.h>
static void check(unsigned oldCount,unsigned newCount){
 BITCODE_HV owner=drawing.header_vars.DICTIONARY_NAMED_OBJECT->absolute_ref,layer=drawing.header_vars.CLAYER->absolute_ref;
 Dwg_Object o={0};Dwg_Object_Object c={0};o.parent=&drawing;o.fixedtype=DWG_TYPE_TABLESTYLE;o.tio.object=&c;o.handle.value=dwg_next_handle(&drawing);
 c.ownerhandle=dwg_add_handleref(&drawing,4,owner,NULL);c.num_reactors=oldCount;c.reactors=calloc(oldCount?oldCount:1,sizeof(BITCODE_H));
 Bit_Chain raw={0};bit_chain_init(&raw,8192);raw.version=raw.from_version=drawing.header.version;
 for(unsigned i=0;i<53;i++)bit_write_B(&raw,(i*7+3)%5==0); /* Opaque payload + unaligned string/data tail. */
 Dwg_Handle h=c.ownerhandle->handleref;bit_write_H(&raw,&h);
 for(unsigned i=0;i<oldCount;i++){c.reactors[i]=dwg_add_handleref(&drawing,4,owner,NULL);h=c.reactors[i]->handleref;bit_write_H(&raw,&h);}
 BITCODE_H tail=dwg_add_handleref(&drawing,5,layer,NULL);h=tail->handleref;bit_write_H(&raw,&h);
 while(raw.bit)bit_write_B(&raw,0);o.num_unknown_bits=bit_position(&raw);o.size=16+o.num_unknown_bits/8;o.bitsize=16*8+53;o.handlestream_size=o.size*8-o.bitsize;
 unsigned char prefix[7];memcpy(prefix,raw.chain,sizeof(prefix));pack_raw_tail(raw.chain,o.num_unknown_bits);o.unknown_bits=raw.chain;
 BITCODE_H *next=calloc(newCount?newCount:1,sizeof(BITCODE_H));for(unsigned i=0;i<newCount;i++)next[i]=dwg_add_handleref(&drawing,4,owner,NULL);
 assert(export_raw_style_reactors(&o,next,newCount));assert(c.num_reactors==newCount);
 unsigned char *out=raw_chain(&o);for(unsigned i=0;i<53;i++)assert(((out[i/8]>>(7-i%8))&1)==((prefix[i/8]>>(7-i%8))&1));free(out);
 TableRef *refs=NULL;unsigned n=0;assert(opaque_handle_refs(&o,o.handle.value,&refs,&n));assert(n==newCount+2&&refs[0].value==owner&&refs[n-1].value==layer);
 free(refs);free(c.reactors);free(o.unknown_bits);
}
int main(int argc,char **argv){assert(argc==2&&pllato_open(argv[1])<128);check(3,1);check(1,0);check(0,3);check(256,1);check(1,256);pllato_close();puts("PASS opaque reactor prefix/suffix/handles and count-width boundaries");}
