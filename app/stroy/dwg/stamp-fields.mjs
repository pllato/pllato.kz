export const stampLabels={code:'Обозначение документа',project:'Проект',object:'Объект',drawing:'Название схемы',organization:'Организация',stage:'Стадия',contractorRole:'Роль · выполнил',contractor:'ФИО · выполнил',contractorSignature:'Подпись · выполнил',date:'Дата · выполнил',checkedRole:'Роль · проверил',checkedBy:'ФИО · проверил',checkedSignature:'Подпись · проверил',checkedDate:'Дата · проверил',approvedRole:'Роль · согласовал',approvedBy:'ФИО · согласовал',approvedSignature:'Подпись · согласовал',approvedDate:'Дата · согласовал',sheet:'Лист',sheets:'Листов'};
export const stampDefaults={contractorRole:'Выполнил',checkedRole:'Проверил',approvedRole:'',stage:'ИД'};
for(let row=1;row<=4;row++)['Изм.','Кол.уч.','Лист','№док.','Подпись','Дата'].forEach((label,col)=>stampLabels[`revision${row}_${col}`]=`Изменения · строка ${row} · ${label}`);
for(let row=4;row<=6;row++)for(const [key,label]of [['role','Роль'],['person','ФИО'],['signature','Подпись'],['date','Дата']])stampLabels[key+row]=`${label} · строка ${row}`;
export const stampDateKeys=new Set(['date','checkedDate','approvedDate']);
for(let row=1;row<=4;row++)stampDateKeys.add(`revision${row}_5`);for(let row=4;row<=6;row++)stampDateKeys.add('date'+row);
export function stampChoices(key,sheets){
 const people=['contractor','checkedBy','approvedBy','person4','person5','person6'],keys=people.includes(key)?people:[key];
 const defaults=key.endsWith('Role')||/^role\d$/.test(key)?['Выполнил','Проверил','Согласовал']:key==='stage'?['ИД','Р','П']:[];
 return [...new Set([...defaults,...sheets.flatMap(s=>keys.map(k=>s.stamp?.[k]||''))].filter(Boolean))];
}
