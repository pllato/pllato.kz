// Sheet decoration uses native editable LINE/TEXT entities, not a bitmap.
// Coordinates are drawing units; scale never changes cable quantities.
import {tablePages} from './table-paste.mjs?v=0.17.51';
import {executiveStamp} from './executive-stamp.mjs';
export function executiveLayout({origin=[0,0],width=420,height=297,title='',titleStyle={x:210,y:275,height:5},stamp={},rows=[],tablePage,unit=1,northAngle=0}={}){
 if(!origin.every(Number.isFinite)||origin.length!==2||!Number.isFinite(unit)||unit<=0||!Number.isFinite(northAngle)||width<300||height<200||![width,height].every(Number.isFinite))throw Error('Неверные размеры исполнительной');
 if(rows.length>10)throw Error('Ведомость требует дополнительного листа: больше 10 строк');
 const items=[],p=(x,y)=>[origin[0]+x*unit,origin[1]+y*unit];
 const line=(x,y,x2,y2)=>items.push({type:'LINE',values:[...p(x,y),...p(x2,y2)]});
 const text=(x,y,value,size=3)=>items.push({type:'TEXT',text:String(value??''),values:[...p(x,y),size*unit,0]});
 const rect=(x,y,w,h)=>{line(x,y,x+w,y);line(x+w,y,x+w,y+h);line(x+w,y+h,x,y+h);line(x,y+h,x,y);};
 rect(0,0,width,height);rect(10,5,width-15,height-10);
 text(titleStyle.x,titleStyle.y,title,titleStyle.height);items.at(-1).align=1;
 // Compass rotates with plan while text and sheet stay upright.
 const cx=32,cy=height-19,c=Math.cos(northAngle),s=Math.sin(northAngle);
 const cp=(x,y)=>[cx+x*c-y*s,cy+x*s+y*c];
 for(const [x,y,label] of [[0,10,'С'],[10,0,'В'],[0,-10,'Ю'],[-10,0,'З']]){
  const end=cp(x,y);line(cx,cy,...end);text(end[0]-1,end[1]+1,label,2);
 }
 const star=Array.from({length:16},(_,i)=>{const angle=i*Math.PI/8,r=i%2?2: i%4?6:9;return cp(Math.cos(angle)*r,Math.sin(angle)*r);});
 for(let i=0;i<star.length;i++)line(...star[i],...star[(i+1)%star.length]);
 executiveStamp({x:width-185,y:5,stamp,title,line,text,rect});
 for(const row of rows)if(!Number.isFinite(row.length)||row.length<0)throw Error('Неверный метраж');
 const ledgerPages=tablePage?null:tablePages({cells:[['Кабель','Сечение','Длина, м'],...rows.map(r=>[r.brand,r.section,r.length.toFixed(2)])]},{firstPageHeight:60});
 if(ledgerPages?.length>1)throw Error('Ведомость не помещается: используйте вставку таблицы с переносом на дополнительные листы');
 const t=tablePage||ledgerPages[0],tx=15,ty=5;
 rect(tx,ty,t.width,t.height);let x=tx;for(const w of t.widths.slice(0,-1)){x+=w;line(x,ty,x,ty+t.height);}let y=ty+t.height;for(const row of t.rows){let x=tx;row.lines.forEach((lines,i)=>{lines.forEach((value,j)=>text(x+t.padding,y-t.padding-t.font-j*t.font*1.45,value,t.font));x+=t.widths[i];});y-=row.height;line(tx,y,tx+t.width,y);}
 return {items,planBounds:[...p(15,Math.max(65,t.height+10)),...p(width-15,height-32)]};
}
