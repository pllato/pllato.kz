// Run as an async function in a same-origin browser page (no camera required).
async function testGuidedEdge() {
  const {EdgeMaskRenderer}=await import('/meet-edge-mask.js');
  const mask=document.createElement('canvas');mask.width=32;mask.height=32;
  const m=mask.getContext('2d');m.fillStyle='white';m.fillRect(16,0,16,32);
  const guide=document.createElement('canvas');guide.width=320;guide.height=320;
  const g=guide.getContext('2d');g.fillStyle='#101010';g.fillRect(0,0,320,320);g.fillStyle='#e0b090';g.fillRect(163,0,157,320);
  const renderer=new EdgeMaskRenderer(),out=document.createElement('canvas');out.width=320;out.height=320;
  const ctx=out.getContext('2d');ctx.drawImage(renderer.render(mask,guide,320,320),0,0);
  const guided=ctx.getImageData(0,0,320,320).data;
  ctx.clearRect(0,0,320,320);ctx.drawImage(mask,0,0,320,320);
  const baseline=ctx.getImageData(0,0,320,320).data;
  let oldError=0,newError=0;
  for(let x=145;x<180;x++){const expected=x>=163?255:0;oldError+=Math.abs(baseline[(160*320+x)*4+3]-expected);newError+=Math.abs(guided[(160*320+x)*4+3]-expected);}
  if(newError>=oldError)throw new Error('Guided alpha did not follow source edge');
  if(guided[(160*320+100)*4+3]!==0 || guided[(160*320+220)*4+3]!==255)throw new Error('Interior/exterior changed');
  renderer.dispose();if(renderer.gl!==null)throw new Error('GPU not released');
  const html=await(await fetch('/meet.html')).text();
  const style=document.createElement('style');style.textContent=html.match(/<style>([\s\S]*?)<\/style>/)[1];document.head.append(style);
  const tile=document.createElement('div');tile.className='tile local office-background';
  const video=document.createElement('video');tile.append(video);document.body.append(tile);
  const mirrored=getComputedStyle(video).transform.startsWith('matrix(-1');
  tile.classList.remove('local');const remoteUnchanged=getComputedStyle(video).transform==='none';
  tile.remove();style.remove();
  if(!mirrored||!remoteUnchanged)throw new Error('Local/remote mirroring mismatch');
  return {oldError,newError,mirrored,remoteUnchanged};
}
