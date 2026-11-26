export function stagePalette(stage={}) {
 const color=/^#[0-9a-f]{6}$/i.test(stage?.color||'')?stage.color:stage?.semantics==='S'?'#3fd88e':stage?.semantics==='F'?'#f05975':'#a87fff';
 const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const luminance=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
 return {color,text:luminance>.179?'#111827':'#ffffff',border:luminance>.8?'#a0a5af':color};
}
