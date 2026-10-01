export const stampLabels={code:'Обозначение документа',project:'Проект',object:'Объект',drawing:'Название схемы',organization:'Организация',stage:'Стадия',contractorRole:'Роль · выполнил',contractor:'ФИО · выполнил',contractorSignature:'Подпись · выполнил',date:'Дата · выполнил',checkedRole:'Роль · проверил',checkedBy:'ФИО · проверил',checkedSignature:'Подпись · проверил',checkedDate:'Дата · проверил',approvedRole:'Роль · согласовал',approvedBy:'ФИО · согласовал',approvedSignature:'Подпись · согласовал',approvedDate:'Дата · согласовал',sheet:'Лист',sheets:'Листов'};
export const stampDefaults={contractorRole:'Выполнил',checkedRole:'Проверил',approvedRole:'Согласовал'};
export const stampDateKeys=new Set(['date','checkedDate','approvedDate']);
export function stampChoices(key,sheets){
 const keys=['contractor','checkedBy','approvedBy'].includes(key)?['contractor','checkedBy','approvedBy']:[key];
 return [...new Set([...(key.endsWith('Role')?Object.values(stampDefaults):[]),...sheets.flatMap(s=>keys.map(k=>s.stamp?.[k]||''))].filter(Boolean))];
}
