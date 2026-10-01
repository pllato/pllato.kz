// Shared cell geometry for CAD/PDF and editable preview. Coordinates from top left, mm.
export const STAMP_WIDTH=185,STAMP_HEIGHT=55;
export function stampCells(){
 const cells=[],add=(x,y,w,h,key,label,options={})=>cells.push({x,y,w,h,key,label,...options});
 const cols=[10,10,10,10,15,10],labels=['Изм.','Кол.уч.','Лист','№док.','Подпись','Дата'];
 for(let row=0;row<5;row++){let x=0;cols.forEach((w,col)=>{add(x,row*5,w,5,row<4?`revision${row+1}_${col}`:null,labels[col],row===4?{fixed:labels[col],size:2.1}:{});x+=w;});}
 const roles=[['contractorRole','contractor','contractorSignature','date'],['checkedRole','checkedBy','checkedSignature','checkedDate'],['approvedRole','approvedBy','approvedSignature','approvedDate'],... [4,5,6].map(i=>[`role${i}`,`person${i}`,`signature${i}`,`date${i}`])];
 roles.forEach((keys,row)=>{let x=0;[20,20,15,10].forEach((w,col)=>{add(x,25+row*5,w,5,keys[col],['Роль','ФИО','Подпись','Дата'][col],{size:2.2});x+=w;});});
 add(65,0,120,10,'code','Обозначение документа',{align:'center',size:2.5});
 add(65,10,120,15,'project','Проект / адрес',{size:2.3,multiline:true});
 add(65,25,70,15,'object','Объект',{align:'center',size:2.5,multiline:true});
 let x=135;[15,15,20].forEach((w,i)=>{add(x,25,w,5,null,['Стадия','Лист','Листов'][i],{fixed:['Стадия','Лист','Листов'][i],align:'center',size:2.1});add(x,30,w,10,['stage','sheet','sheets'][i],['Стадия','Лист','Листов'][i],{align:'center',size:2.5});x+=w;});
 add(65,40,70,15,'drawing','Название схемы / план',{size:2.5,multiline:true});
 add(135,40,50,15,'organization','Организация',{align:'center',size:3,multiline:true});return cells;
}
export function stampValue(cell,stamp){return cell.fixed??stamp[cell.key]??({contractorRole:'Выполнил',checkedRole:'Проверил',stage:'ИД',sheet:'1',sheets:'1'}[cell.key]||'');}
export function fitStampText(value,cell){
 value=String(value);const wrap=size=>{const limit=Math.max(1,Math.floor((cell.w-1.6)/(size*.58))),out=[];for(const paragraph of value.split('\n')){let row='';for(const word of paragraph.split(/\s+/)){if(!word)continue;for(let i=0;i<word.length;i+=limit){const part=word.slice(i,i+limit);if(row&&row.length+1+part.length>limit){out.push(row);row='';}row+=(row?' ':'')+part;}}out.push(row);}return out;};
 let size=cell.size||2;if(!cell.multiline)size=Math.max(.6,Math.min(size,(cell.w-1.6)/(Math.max(1,...value.split('\n').map(s=>s.length))*.58)));let lines=wrap(size);while(size>.6&&lines.length*size*1.25>cell.h-1){size=Math.max(.6,size-.1);lines=wrap(size);}return {size,lines};
}
export function executiveStamp({x,y,width=STAMP_WIDTH,height=STAMP_HEIGHT,stamp={},line,text}){
 const sx=width/STAMP_WIDTH,sy=height/STAMP_HEIGHT,edges=new Set();
 for(const cell of stampCells()){
  const {x:cx,y:cy,w,h}=cell;
  for(const e of [[cx,cy,cx+w,cy],[cx,cy+h,cx+w,cy+h],[cx,cy,cx,cy+h],[cx+w,cy,cx+w,cy+h]]){const key=e.join(',');if(!edges.has(key)){edges.add(key);line(x+e[0]*sx,y+(STAMP_HEIGHT-e[1])*sy,x+e[2]*sx,y+(STAMP_HEIGHT-e[3])*sy);}}
  const value=stampValue(cell,stamp);if(!value)continue;const fitted=fitStampText(value,cell),font=fitted.size,step=font*1.25,top=cy+(h-fitted.lines.length*step)/2;
  if(fitted.lines.length*step>h-1)throw Error('Слишком длинное поле штампа: '+cell.label+'. Сократите текст.');
  fitted.lines.forEach((value,i)=>{const tx=cell.align==='center'?cx+w/2:cx+.8;text(x+tx*sx,y+(STAMP_HEIGHT-top-(i+1)*step+font*.18)*sy,value,font*Math.min(sx,sy),cell.align);});
 }
}
