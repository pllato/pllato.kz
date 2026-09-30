// Device-local fonts. No font bytes are sent to a server or embedded in DWG.
const fonts=new Map();
export const fontKey=name=>String(name||'').split(/[\\/]/).pop().split('|')[0].toLowerCase();
export function installShx(name,glyphs){
 const key=fontKey(name);if(!/^[^\x00-\x1f]{1,120}\.shx$/.test(key))throw Error('Нужно выбрать файл .shx');
 const cache=new Map();
 const font={name:key,glyphs,missing:text=>[...new Set([...text].filter(c=>!/[\r\n]/.test(c)&&!glyphs[c.codePointAt(0)]))],layout(text){
  if(cache.has(text))return cache.get(text);let width=0;const paths=[];
  for(const c of text){const g=glyphs[c.codePointAt(0)];if(!g)throw Error(key+': нет символа «'+c+'»');for(const p of g.paths)paths.push(p.map(([x,y])=>[x+width,y]));width+=g.advance;}
  const result={width,paths};if(cache.size>=1000)cache.clear();cache.set(text,result);return result;
 }};fonts.set(key,font);return font;
}
export const localShx=name=>fonts.get(fontKey(name))||fonts.get(fontKey(name)+'.shx');
export const localShxNames=()=>[...fonts.keys()].sort();
function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open('pllato_local_shx',1);r.onupgradeneeded=()=>r.result.createObjectStore('fonts',{keyPath:'name'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function stored(mode,action){const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('fonts',mode),r=action(tx.objectStore('fonts'));tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Не удалось сохранить шрифт'));});}finally{db.close();}}
export async function restoreShx(){const rows=await stored('readonly',s=>s.getAll());for(const r of rows)installShx(r.name,r.glyphs);return rows.length;}
export async function importShx(file){
 if(file.size<32||file.size>2*1024*1024||!file.name.toLowerCase().endsWith('.shx'))throw Error('Выберите SHX размером до 2 МБ');
 if(!/^[^/\\|\x00-\x1f]{1,116}\.shx$/i.test(file.name))throw Error('Неверное имя SHX');
 const bytes=await file.arrayBuffer(),worker=new Worker(new URL('./shx-worker.mjs',import.meta.url),{type:'module'});
 const glyphs=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker.terminate();reject(Error('Шрифт слишком сложный или повреждён'));},15000);const finish=(fn,v)=>{clearTimeout(timer);worker.terminate();fn(v);};worker.onmessage=e=>e.data.error?finish(reject,Error(e.data.error)):finish(resolve,e.data.glyphs);worker.onerror=()=>finish(reject,Error('Не удалось прочитать SHX'));worker.postMessage(bytes,[bytes]);});
 const name=fontKey(file.name);await stored('readwrite',s=>s.put({name,glyphs}));return installShx(name,glyphs);
}
export async function removeShx(name){await stored('readwrite',s=>s.delete(fontKey(name)));fonts.delete(fontKey(name));}
