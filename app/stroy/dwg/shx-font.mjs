// Original SHX files remain user-supplied; no proprietary fonts are bundled.
import {ShxFont} from './vendor/shx-parser/index.mjs';

export function readShx(bytes){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<32||bytes.byteLength>2*1024*1024)throw Error('Неверный размер SHX');
 const font=new ShxFont(bytes);
 if(font.fontData.header.fontType==='bigfont')throw Error('Составные Big Font пока не поддерживаются');
 const cache=new Map();
 const glyph=cp=>{
  if(!Object.hasOwn(font.fontData.content.data,cp))return null;
  if(cache.has(cp))return cache.get(cp);
  const shape=font.getCharShape(cp,1);
  if(!shape)return null;
  const paths=shape.polylines.map(line=>line.map(p=>[p.x,p.y]));
  const advance=shape.lastPoint?.x;
  if(!Number.isFinite(advance)||paths.flat().some(p=>!p.every(Number.isFinite)))throw Error('Некорректная геометрия символа SHX');
  const result={paths,advance};cache.set(cp,result);return result;
 };
 return {type:font.fontData.header.fontType,codes:Object.keys(font.fontData.content.data).map(Number).filter(n=>n>=32),glyph,missing:text=>[...new Set([...text].filter(c=>c!=='\n'&&c!=='\r'&&!glyph(c.codePointAt(0))))],
  layout(text){let x=0;const paths=[];for(const c of text){const g=glyph(c.codePointAt(0));if(!g)throw Error('В выбранном SHX нет символа «'+c+'»');for(const line of g.paths)paths.push(line.map(p=>[p[0]+x,p[1]]));x+=g.advance;}return {paths,width:x};}
 };
}
