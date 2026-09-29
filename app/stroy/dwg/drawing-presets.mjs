export const drawingPreset={color:5,lineweight:25,brand:'ВВГнг(А)-LS',section:'3×2,5'};
export const lineweights=[0,5,9,13,15,18,20,25,30,35,40,50,53,60,70,80,90,100,106,120,140,158,200,211];
export function mountDrawingPresets(onChange=()=>{}){
 const bar=document.createElement('div');bar.id='drawingPresets';bar.hidden=true;bar.setAttribute('aria-label','Параметры новой линии');
 bar.innerHTML='<span>Новая линия</span><label>Цвет<select id="dpColor" title="Цвет новых линий"><option value="5">Синий</option><option value="1">Красный</option><option value="3">Зелёный</option><option value="4">Голубой</option><option value="6">Фиолетовый</option><option value="7">Белый</option><option value="2">Жёлтый</option><option value="8">Серый</option></select></label><label>Толщина, мм<select id="dpWeight" title="Вес линии в DWG, миллиметры при печати"></select></label><label>Марка<input id="dpBrand" maxlength="1000" aria-label="Марка нового кабеля"></label><label>Сечение<input id="dpSection" maxlength="1000" aria-label="Сечение нового кабеля"></label>';
 document.getElementById('drawingToolbar').after(bar);
 const weight=bar.querySelector('#dpWeight');for(const n of lineweights)weight.add(new Option(n===0?'Тонкая':(n/100).toLocaleString('ru-RU'),n));
 for(const [id,key] of [['dpColor','color'],['dpWeight','lineweight'],['dpBrand','brand'],['dpSection','section']]){const el=bar.querySelector('#'+id);el.value=drawingPreset[key];el.addEventListener('input',()=>{drawingPreset[key]=el.tagName==='SELECT'?Number(el.value):el.value;onChange();});}
 return {refresh:(active,hasSheet)=>{bar.hidden=!active;for(const id of ['dpBrand','dpSection']){const el=bar.querySelector('#'+id);el.disabled=!hasSheet;el.title=hasSheet?'Свойство нового кабеля, попадёт в выноску и ведомость':'Для учёта кабеля сначала создайте исполнительную';}}};
}
