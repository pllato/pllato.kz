import {aciColors,rgbHex} from './colors.mjs?v=0.17.67';
export const drawingPreset={color:5,lineweight:25,brand:'ВВГнг(А)-LS',section:'3×2,5'};
const palettes=new WeakMap();
export function extendDrawingPalette(previous,next,added){
 const before=palettes.get(previous);if(!before)return;
 const entries=new Map(before.map(p=>[p.hex,p]));
 for(const p of drawingPalette(added))if(!entries.has(p.hex)||entries.get(p.hex).rgb!==undefined&&p.rgb===undefined)entries.set(p.hex,p);
 palettes.set(next,[...entries.values()].sort((a,b)=>a.hex.localeCompare(b.hex)));
}
export function drawingPalette(shapes=[]){
 if(palettes.has(shapes))return palettes.get(shapes);
 const entries=new Map(),names={1:'Красный',2:'Жёлтый',3:'Зелёный',4:'Голубой',5:'Синий',6:'Фиолетовый',7:'Белый',8:'Серый',9:'Светло-серый'};
 for(const s of shapes){const rgb=s.rgb?.toLowerCase(),aci=Number.isInteger(s.color)&&s.color>=1&&s.color<=255?s.color:7,hex=rgb||aciColors[aci];if(!hex)continue;const item=rgb?{value:rgb,color:7,rgb:parseInt(rgb.slice(1),16),hex,label:rgb.toUpperCase()}:{value:String(aci),color:aci,hex,label:(names[aci]||'ACI '+aci)+' · '+hex.toUpperCase()};if(!entries.has(hex)||(!rgb&&entries.get(hex).rgb!==undefined))entries.set(hex,item);}
 const result=[...entries.values()].sort((a,b)=>a.hex.localeCompare(b.hex));palettes.set(shapes,result);return result;
}
export const presetPairs=()=>[[62,drawingPreset.color],...(drawingPreset.rgb===undefined?[]:[[420,drawingPreset.rgb]]),[370,drawingPreset.lineweight]];
export const presetColor=()=>drawingPreset.rgb===undefined?aciColors[drawingPreset.color]:rgbHex(drawingPreset.rgb);
export const lineweights=[0,5,9,13,15,18,20,25,30,35,40,50,53,60,70,80,90,100,106,120,140,158,200,211];
export function mountDrawingPresets(onChange=()=>{}){
 const bar=document.createElement('div');bar.id='drawingPresets';bar.hidden=true;bar.setAttribute('aria-label','Параметры новой линии');
 bar.innerHTML='<span>Новая линия</span><label>Цвет<select id="dpColor" title="Цвет новых линий"></select></label><label>Толщина, мм<select id="dpWeight" title="Вес линии в DWG, миллиметры при печати"></select></label><label>Марка<input id="dpBrand" maxlength="1000" aria-label="Марка нового кабеля"></label><label>Сечение<input id="dpSection" maxlength="1000" aria-label="Сечение нового кабеля"></label>';
 document.getElementById('drawingToolbar').after(bar);
 const color=bar.querySelector('#dpColor');color.replaceChildren();let lastShapes;
 const weight=bar.querySelector('#dpWeight');for(const n of lineweights)weight.add(new Option(n===0?'Тонкая':(n/100).toLocaleString('ru-RU'),n));
 function choose(){const v=color.value;delete drawingPreset.rgb;if(v.startsWith('#')){drawingPreset.color=7;drawingPreset.rgb=parseInt(v.slice(1),16);}else if(v)drawingPreset.color=Number(v);color.style.borderColor=presetColor();}
 color.addEventListener('input',()=>{choose();onChange();});
 for(const [id,key] of [['dpWeight','lineweight'],['dpBrand','brand'],['dpSection','section']]){const el=bar.querySelector('#'+id);el.value=drawingPreset[key];el.addEventListener('input',()=>{drawingPreset[key]=el.tagName==='SELECT'?Number(el.value):el.value;onChange();});}
 return {refresh:(active,hasSheet,shapes)=>{if(!active){bar.hidden=true;return;}if(shapes!==lastShapes){lastShapes=shapes;const palette=drawingPalette(shapes),hex=presetColor();color.replaceChildren(...palette.map(p=>{const option=new Option(p.label,p.value);option.style.color=p.hex;return option;}));color.disabled=!palette.length;color.title=palette.length?'Цвета объектов открытого чертежа, включая цвета по слою и блоку':'В чертеже пока нет цветов';const picked=palette.find(p=>p.hex===hex)||palette.find(p=>p.color===5)||palette[0];if(picked){color.value=picked.value;choose();}}bar.hidden=!active;for(const id of ['dpBrand','dpSection']){const el=bar.querySelector('#'+id);el.disabled=!hasSheet;el.title=hasSheet?'Свойство нового кабеля, попадёт в выноску и ведомость':'Для учёта кабеля сначала создайте исполнительную';}}};
}
