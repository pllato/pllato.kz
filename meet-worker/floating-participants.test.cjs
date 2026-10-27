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
