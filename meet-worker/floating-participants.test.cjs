const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../meet-floating.js'), 'utf8');
(async () => {
  let resolve, closed = 0, changes = 0;
  const context = { window: {documentPictureInPicture:{requestWindow:()=>new Promise(r=>resolve=r)}} };
  vm.createContext(context);
  vm.runInContext(source.replace('export class', 'class')+'\nthis.FloatingParticipants=FloatingParticipants;', context);
  const floating = new context.FloatingParticipants({}, ()=>changes++);
  const opening = floating.toggle();
  assert.equal(floating.pending, true);
  floating.close(); // Screen sharing ends before browser resolves requestWindow.
  resolve({close:()=>closed++});
  await opening;
  assert.equal(closed, 1);
  assert.equal(floating.active, false);
  assert.equal(floating.pending, false);
  assert.equal(changes, 1);
  delete context.window.documentPictureInPicture;
  assert.equal(await floating.toggle(), false);
  const html=fs.readFileSync(require('node:path').join(__dirname,'../meet.html'),'utf8');
  assert.ok(html.includes("...meetingGrid.children].filter"), 'Recording must include the adopted grid');
  console.log('PASS: pending open cancellation, unsupported browser, recording grid reference');
})().catch(e=>{console.error(e);process.exitCode=1;});

(async()=>{
  function node(){return {children:[],append(...nodes){this.children.push(...nodes)},appendChild(n){this.append(n)},before(marker){this.marker=marker},replaceWith(n){this.restored=n}};}
  const doc={head:node(),body:node(),createElement:node,createComment:node,querySelectorAll:()=>[]};
  const pip={document:doc,closed:false,addEventListener(){},close(){this.closed=true}};
  const context=vm.createContext({document:doc,window:{documentPictureInPicture:{requestWindow:async()=>pip}}});
  vm.runInContext(source.replace('export class','class')+';this.FloatingParticipants=FloatingParticipants',context);
  const grid=node(),screen=node();const floating=new context.FloatingParticipants(grid,()=>{},screen);
  await floating.toggle();
  assert.ok(doc.body.children.includes(screen),'existing screen area is adopted into floating window');
  assert.ok(doc.body.children.includes(grid),'existing camera grid accompanies screen');
  const screenMarker=screen.marker,gridMarker=grid.marker;
  floating.close();
  assert.equal(screenMarker.restored,screen,'same screen restored without recreating stream');
  assert.equal(gridMarker.restored,grid,'same cameras restored');
  assert.ok(pip.closed);
  console.log('PASS: screen and camera adoption and restoration');
})().catch(e=>{console.error(e);process.exitCode=1;});
