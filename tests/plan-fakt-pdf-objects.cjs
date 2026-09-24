// NODE_PATH points to the development runtime. PDFJS_TEST_MODULE must be PDF.js 3.11.174.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {PDFDocument,PDFName}=require('pdf-lib'),canvas=require('@napi-rs/canvas');
global.DOMMatrix=canvas.DOMMatrix;global.Path2D=canvas.Path2D;
const lib=require(process.env.PDFJS_TEST_MODULE||'pdfjs-dist/legacy/build/pdf.js');
const engine=require('../app/stroy/plan-fakt/pdf-objects.js');
class CanvasFactory{create(w,h){const c=canvas.createCanvas(w,h);return{canvas:c,context:c.getContext('2d')}}reset(t,w,h){t.canvas.width=w;t.canvas.height=h}destroy(t){t.canvas.width=t.canvas.height=0;t.canvas=t.context=null}}
async function fixture(content,rotation=0){const d=await PDFDocument.create(),p=d.addPage([200,160]);if(rotation)p.node.set(PDFName.of('Rotate'),d.context.obj(rotation));p.node.set(PDFName.of('Contents'),d.context.register(d.context.flateStream(content)));const pdf=await lib.getDocument({data:await d.save(),canvasFactory:new CanvasFactory()}).promise;const page=await pdf.getPage(1),vp=page.getViewport({scale:2}),ol=await page.getOperatorList({annotationMode:lib.AnnotationMode.DISABLE});return{pdf,page,vp,scene:engine.analyse(ol,page.getViewport({scale:1}),lib)};}
async function pixels(f,ids=[]){const c=canvas.createCanvas(f.vp.width,f.vp.height),ctx=c.getContext('2d');await engine.render(f.page,f.scene,new Set(ids),{canvasContext:ctx,viewport:f.vp,background:'#fff'},lib);return ctx.getImageData(0,0,c.width,c.height).data;}
const bg='q .8 .9 .7 rg 0 0 200 160 re f Q\n',blue='0 0 1 RG 3 w ',h='20 80 m 180 80 l ',v='100 20 m 100 140 l ';
async function compare(name,source,expected,select,rotation=0){const a=await fixture(bg+source,rotation),b=await fixture(bg+expected,rotation);const before=JSON.stringify(a.scene.ol),ids=select(a.scene.objects).map(o=>o.id);assert(ids.length,name+' target');const actual=await pixels(a,ids),want=await pixels(b);assert.deepEqual(actual,want,name);assert.equal(JSON.stringify(a.scene.ol),before,'operator list immutable');assert.deepEqual(await pixels(a),await pixels(a,[]),'undo repeat deterministic');await a.pdf.destroy();await b.pdf.destroy();console.log('PASS',name);}
(async()=>{
await compare('same-colour crossing in ONE paint operation',blue+h+v+'S',blue+v+'S',a=>a.filter(o=>o.style.stroke&&o.box[1]===o.box[3]));
await compare('coincident objects remain independent',blue+h+'S 1 0 0 RG '+h+'S',blue+h+'S',a=>a.filter(o=>o.style.stroke==='#ff0000'));
await compare('filled object deletion reveals background and underlying line',blue+v+'S 1 0 0 rg 80 60 40 40 re f',blue+v+'S',a=>a.filter(o=>o.style.fill==='#ff0000'));
await compare('clipping is preserved', 'q 50 0 100 160 re W n '+blue+h+v+'S Q','q 50 0 100 160 re W n '+blue+v+'S Q',a=>a.filter(o=>o.style.stroke&&o.box[1]===o.box[3]));
await compare('rotation and transform preserve neighbour', 'q 1 0 0 1 5 7 cm '+blue+h+v+'S Q','q 1 0 0 1 5 7 cm '+blue+v+'S Q',a=>a.filter(o=>o.style.stroke&&o.box[0]===o.box[2]),90);
await compare('deleting last closed subpath does not close previous open path',blue+'20 20 m 80 100 l 140 100 l 130 30 m 150 30 l 150 50 l s',blue+'20 20 m 80 100 l 140 100 l S',a=>a.filter(o=>o.style.stroke&&o.box[0]===130));
await compare('Bezier curve remains after crossing deletion',blue+h+'100 10 m 20 40 180 120 100 150 c S',blue+'100 10 m 20 40 180 120 100 150 c S',a=>a.filter(o=>o.style.stroke&&o.box[1]===o.box[3]));
console.log('ALL PASS');})().catch(e=>{console.error(e);process.exitCode=1});
