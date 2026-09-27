// Sheet decoration uses native editable LINE/TEXT entities, not a bitmap.
// Coordinates are drawing units; scale never changes cable quantities.
export function executiveLayout({origin=[0,0],width=420,height=297,title='',stamp={},rows=[],unit=1,northAngle=0}={}){
 if(!origin.every(Number.isFinite)||origin.length!==2||!Number.isFinite(unit)||unit<=0||!Number.isFinite(northAngle)||width<300||height<200||![width,height].every(Number.isFinite))throw Error('Неверные размеры исполнительной');
 if(rows.length>10)throw Error('Ведомость требует дополнительного листа: больше 10 строк');
 const items=[],p=(x,y)=>[origin[0]+x*unit,origin[1]+y*unit];
 const line=(x,y,x2,y2)=>items.push({type:'LINE',values:[...p(x,y),...p(x2,y2)]});
 const text=(x,y,value,size=3)=>items.push({type:'TEXT',text:String(value??''),values:[...p(x,y),size*unit,0]});
 const rect=(x,y,w,h)=>{line(x,y,x+w,y);line(x+w,y,x+w,y+h);line(x+w,y+h,x,y+h);line(x,y+h,x,y);};
 rect(0,0,width,height);rect(10,5,width-15,height-10);
 text(65,height-22,title,5);
 // Compass rotates with plan while text and sheet stay upright.
 const cx=32,cy=height-35,c=Math.cos(northAngle),s=Math.sin(northAngle);
 const cp=(x,y)=>[cx+x*c-y*s,cy+x*s+y*c];
 for(const [x,y,label] of [[0,13,'С'],[13,0,'В'],[0,-13,'Ю'],[-13,0,'З']]){
  const end=cp(x,y);line(cx,cy,...end);text(end[0]-1,end[1]+2,label);
 }
 const star=Array.from({length:16},(_,i)=>{const angle=i*Math.PI/8,r=i%2?2: i%4?7:11;return cp(Math.cos(angle)*r,Math.sin(angle)*r);});
 for(let i=0;i<star.length;i++)line(...star[i],...star[(i+1)%star.length]);
 const sx=width-185,sy=5;rect(sx,sy,180,45);
 for(const y of [15,25,35])line(sx,sy+y,sx+180,sy+y);
 line(sx+120,sy,sx+120,sy+35);line(sx+150,sy,sx+150,sy+25);
 text(sx+3,sy+38,stamp.project||'Проект');text(sx+3,sy+28,stamp.object||'Объект');
 text(sx+3,sy+18,stamp.drawing||'Исполнительная схема');
 text(sx+3,sy+8,stamp.contractor||'Исполнитель');
 text(sx+122,sy+28,stamp.date||'Дата');text(sx+122,sy+18,'Лист');text(sx+152,sy+18,'Листов');
 text(sx+122,sy+8,stamp.sheet||'1');text(sx+152,sy+8,stamp.sheets||'1');
 const tx=15,ty=5,tw=Math.min(150,sx-20),rh=7,th=(rows.length+1)*rh;
 rect(tx,ty,tw,th);line(tx+tw*.5,ty,tx+tw*.5,ty+th);line(tx+tw*.78,ty,tx+tw*.78,ty+th);
 text(tx+2,ty+th-5,'Кабель');text(tx+tw*.5+2,ty+th-5,'Сечение');text(tx+tw*.78+2,ty+th-5,'Длина, м');
 rows.forEach((row,i)=>{if(!Number.isFinite(row.length)||row.length<0)throw Error('Неверный метраж');const y=ty+th-(i+1)*rh;line(tx,y,tx+tw,y);text(tx+2,y-5,row.brand);text(tx+tw*.5+2,y-5,row.section);text(tx+tw*.78+2,y-5,row.length.toFixed(2));});
 return {items,planBounds:[...p(20,Math.max(65,th+15)),...p(width-20,height-55)]};
}
