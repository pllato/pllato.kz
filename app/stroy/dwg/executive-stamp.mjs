// Same cell topology as plan-fakt/pdf-sheet-layout.js, in native CAD entities.
export function executiveStamp({x,y,width=180,height=45,stamp={},title='',line,text,rect}){
 const left=width*.36,right=width-left,rx=x+left;
 rect(x,y,width,height);line(rx,y,rx,y+height);
 const grid=(top,h,rows,fractions)=>{
  const widths=(fractions||rows[0].map(()=>1/rows[0].length)).map(f=>f*left),rh=h/rows.length;
  let px=x;for(const w of widths.slice(0,-1)){px+=w;line(px,top-h,px,top);}
  rows.forEach((row,i)=>{if(i)line(x,top-i*rh,rx,top-i*rh);let px=x;row.forEach((v,j)=>{text(px+.6,top-(i+.7)*rh,v,1.8);px+=widths[j];});});
 };
 grid(y+height,height*.30,[['Изм.','Кол.','Лист','№ док.','Подп.','Дата'],['','','','','',''],['','','','','','']]);
 line(x,y+height*.7,rx,y+height*.7);
 grid(y+height*.7,height*.7,[['Роль','ФИО','Подп.','Дата'],['Выполнил',stamp.contractor||'','',stamp.date||''],['Проверил',stamp.checkedBy||'','',''],['Согласовал',stamp.approvedBy||'','','']],[.30,.34,.18,.18]);
 for(const v of [.18,.51,.72])line(rx,y+height*(1-v),x+width,y+height*(1-v));
 line(rx+right*.76,y,rx+right*.76,y+height*.49);
 text(rx+2,y+height*.875,stamp.code||'',2.5);
 const name=[stamp.project,stamp.object].filter(Boolean).join('\n')||'Наименование объекта';
 const lines=name.split('\n').flatMap(s=>s.match(/.{1,55}/gu)||['']),font=Math.min(2.5,height*.28/lines.length/1.4);
 lines.forEach((v,i)=>text(rx+2,y+height*.79-font*(i+1)*1.4,v,font));
 text(rx+2,y+height*.36,stamp.drawing||'Исполнительная схема',2.5);
 text(rx+right*.78,y+height*.36,'Лист '+(stamp.sheet||'1')+'/'+(stamp.sheets||'1'),2.3);
 text(rx+2,y+height*.11,stamp.organization||'Организация',2.8);
 text(rx+right*.79,y+height*.11,stamp.stage||'ИД',2.8);
}
