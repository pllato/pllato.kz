// SPDX-License-Identifier: GPL-3.0-or-later
// Missing CAD fonts are explicitly substituted, never advertised as originals.
export function cadFont(file='',inline=''){
 const name=(inline||file).split(/[\\/]/).pop().toLowerCase();
 const italic=/italic|oblique|\|i1/.test(name),bold=/bold|\|b1/.test(name);
 const family=/^arial(?:\.ttf|\||$)/.test(name)?'Arial':/^(?:times|times new roman)(?:\.ttf|\||$)/.test(name)?'Times New Roman':/courier/.test(name)?'Courier New':'Pllato CAD';
 return {family,italic,bold,substituted:family==='Pllato CAD',source:inline||file||'Standard'};
}
export async function loadCadFont(){
 const font=new FontFace('Pllato CAD','url('+new URL('./vendor/osifont/osifont.ttf',import.meta.url)+')');
 await font.load();document.fonts.add(font);return font;
}
