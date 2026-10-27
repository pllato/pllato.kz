const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../meet.html'),'utf8');
const context=vm.createContext({Math});
vm.runInContext(source.slice(source.indexOf('function refinePersonAlpha('),source.indexOf('\nclass BgPipeline')),context);
const w=32,h=24,rgba=new Uint8ClampedArray(w*h*4),work={visited:new Uint8Array(w*h),queue:new Int32Array(w*h)};
const set=(x,y,a)=>{const i=(y*w+x)*4;rgba[i]=80;rgba[i+1]=100;rgba[i+2]=120;rgba[i+3]=a;};
// A confident face/body, a connected but uncertain chair, a tiny ear-side island.
for(let y=3;y<22;y++)for(let x=12;x<23;x++)set(x,y,250);
for(let y=16;y<22;y++)for(let x=3;x<12;x++)set(x,y,145);
set(5,8,245);set(6,8,245);set(5,9,245);
// Fine detail attached diagonally must remain connected (8-neighbour connectivity).
set(11,2,245);set(10,1,245);
context.refinePersonAlpha(rgba,w,h,work);
assert.equal(rgba[(18*w+5)*4+3],0,'uncertain attached chair removed');
assert.equal(rgba[(8*w+5)*4+3],0,'detached ear-side speck removed');
assert.equal(rgba[(10*w+15)*4+3],255,'confident person retained');
assert.equal(rgba[(1*w+10)*4+3],255,'attached fine edge retained');
assert.deepEqual([...rgba.slice((10*w+15)*4,(10*w+15)*4+3)],[80,100,120],'source colours unchanged');
const edge=new Uint8ClampedArray([0,0,0,160,0,0,0,190,0,0,0,220]);
context.refinePersonAlpha(edge);
assert.ok(edge[3]>0 && edge[3]<edge[7] && edge[7]<edge[11] && edge[11]<255,'soft edge, not a binary cutout');
console.log('PASS: chair confidence, isolated fragments, connected fine edges, RGB and antialiasing');

// A hard staircase gets subpixel coverage while interior and RGB stay exact.
const size=16, step=new Uint8ClampedArray(size*size*4);
for(let y=0;y<size;y++) for(let x=0;x<size;x++){
 const i=(y*size+x)*4; step[i]=77; step[i+3]=x>=8?255:0;
}
context.smoothPersonEdge(step,size,size,new Float32Array(size*size));
assert.equal(step[(8*size+4)*4+3],0);
assert.equal(step[(8*size+12)*4+3],255);
assert.ok(step[(8*size+7)*4+3]>0 && step[(8*size+8)*4+3]<255);
assert.equal(step[(8*size+8)*4],77,'smoothing never touches skin colours');
console.log('PASS: subpixel edge coverage, opaque interior, transparent exterior, unchanged RGB');
