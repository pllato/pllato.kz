// User-provided TrueType files remain in this browser; never uploaded.
const fonts=new Map();
const key=name=>String(name||'').split(/[\\/]/).pop().split('|')[0].toLowerCase();
export const localTtf=name=>fonts.get(key(name))||[...fonts.values()].find(f=>f.aliases.includes(key(name)));
export const localTtfNames=()=>[...fonts.keys()].sort();
export function ttfMetadata(bytes){
 const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),u=o=>d.getUint16(o),l=o=>d.getUint32(o),tables={};
 if(bytes.length<12||l(0)!==0x10000)throw Error('Нужен TrueType (.ttf), не коллекция или OpenType CFF');
 for(let i=0;i<u(4);i++){const p=12+16*i,start=l(p+8),size=l(p+12);if(start+size>bytes.length)throw Error('Повреждённый шрифт');tables[String.fromCharCode(...bytes.slice(p,p+4))]={start,size};}
 for(const t of ['head','hhea','hmtx','cmap','glyf','loca','name'])if(!tables[t])throw Error('Неполный TrueType: '+t);
 const rights=tables['OS/2']?u(tables['OS/2'].start+8):0;if(rights&0x202)throw Error('Этот шрифт запрещает встраивание контуров в PDF');
 const names={},p=tables.name.start;for(let i=0;i<u(p+2);i++){const o=p+6+12*i,platform=u(o),id=u(o+6),start=p+u(p+4)+u(o+10),size=u(o+8);if(start+size>bytes.length)throw Error('Повреждены имена шрифта');if(platform!==0&&platform!==3)continue;let value='';for(let j=0;j<size;j+=2)value+=String.fromCharCode(u(start+j));if(!names[id]||u(o+4)===1033)names[id]=value;}
 const family=names[1]||names[4];if(!family)throw Error('Шрифт без названия');
 return {family,postscript:(names[6]||family).replace(/[^a-zA-Z0-9_-]/g,''),aliases:/^Times New Roman$/i.test(family)&&/^(regular|normal|roman)$/i.test(names[2]||'Regular')?['times.ttf','times new roman.ttf','times new roman']:[]};
}
async function stored(mode,action){const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('pllato_local_ttf',1);r.onupgradeneeded=()=>r.result.createObjectStore('fonts',{keyPath:'name'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise((resolve,reject)=>{const tx=db.transaction('fonts',mode),r=action(tx.objectStore('fonts'));tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
async function install(name,bytes){const metadata=ttfMetadata(bytes),family='Pllato local '+key(name),face=new FontFace(family,bytes);await face.load();document.fonts.add(face);const font={...metadata,family,bytes,name:key(name)};fonts.set(font.name,font);return font;}
export async function importTtf(file){if(!/^[^/\\|\x00-\x1f]{1,116}\.ttf$/i.test(file.name)||file.size<32||file.size>16*1024*1024)throw Error('Выберите TTF размером до 16 МБ');const bytes=new Uint8Array(await file.arrayBuffer()),font=await install(file.name,bytes);await stored('readwrite',s=>s.put({name:font.name,bytes}));return font;}
export async function restoreTtf(){for(const r of await stored('readonly',s=>s.getAll()))await install(r.name,r.bytes);}
