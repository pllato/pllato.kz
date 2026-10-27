// MediaRecorder's live WebM omits Duration. Add it to the first multipart part
// once recording ends, so browsers can leave metadata loading and seek normally.
export async function finalizeWebmHeader(blob,durationMs){
  if(!Number.isFinite(durationMs)||durationMs<=0)return blob;
  const bytes=new Uint8Array(await blob.slice(0,65536).arrayBuffer());
  if(bytes[0]!==0x1a||bytes[1]!==0x45||bytes[2]!==0xdf||bytes[3]!==0xa3)return blob;
  function vint(at,id=false){
    let width=1;while(width<=8 && !(bytes[at] & (128>>(width-1))))width++;
    if(width>8 || at+width>bytes.length)throw Error('Неполный заголовок WebM');
    let value=id?bytes[at]:bytes[at]&((128>>(width-1))-1);
    for(let i=1;i<width;i++)value=value*256+bytes[at+i];
    return {value,width};
  }
  let at=0,info;
  while(at<bytes.length){
    const id=vint(at,true),size=vint(at+id.width),data=at+id.width+size.width;
    if(id.value===0x1549a966){info={at,size,data};break;}
    at=id.value===0x18538067?data:data+size.value;
  }
  if(!info || info.data+info.size.value>bytes.length)throw Error('Не найден блок времени WebM');
  let scale=1000000;
  for(let p=info.data;p<info.data+info.size.value;){
    const id=vint(p,true),size=vint(p+id.width),data=p+id.width+size.width;
    if(id.value===0x4489)return blob; // Already finalized.
    if(id.value===0x2ad7b1){scale=0;for(let i=0;i<size.value;i++)scale=scale*256+bytes[data+i];}
    p=data+size.value;
  }
  const duration=new Uint8Array(11);duration.set([0x44,0x89,0x88]);new DataView(duration.buffer).setFloat64(3,durationMs*1000000/scale);
  let width=info.size.width,length=info.size.value+duration.length;
  while(length>=2**(7*width)-1)width++;
  const sizeBytes=new Uint8Array(width);let value=length;
  for(let i=width-1;i>=0;i--){sizeBytes[i]=value%256;value=Math.floor(value/256);}sizeBytes[0]|=128>>(width-1);
  return new Blob([blob.slice(0,info.at+4),sizeBytes,blob.slice(info.data,info.data+info.size.value),duration,blob.slice(info.data+info.size.value)],{type:blob.type});
}
