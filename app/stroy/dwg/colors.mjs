// SPDX-License-Identifier: GPL-3.0-or-later
export const rgbHex=n=>'#'+(n&0xffffff).toString(16).padStart(6,'0');
// ACI palette on a dark CAD background (index 7 is foreground white).
export const aciColors=['#ffffff','#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ffffff','#808080','#c0c0c0'];
for(let h=0;h<24;h++)for(let shade=0;shade<10;shade++){
 const v=[255,165,127,76,38][shade>>1],s=shade%2?.5:1,x=h/4,c=v*s,t=c*(1-Math.abs(x%2-1)),m=v-c;
 const rgb=x<1?[c,t,0]:x<2?[t,c,0]:x<3?[0,c,t]:x<4?[0,t,c]:x<5?[t,0,c]:[c,0,t];
 aciColors.push(rgbHex(rgb.reduce((n,a)=>(n<<8)|Math.floor(a+m),0)));
}
aciColors.push(...[51,80,105,130,190,255].map(v=>rgbHex(v*0x10101)));
