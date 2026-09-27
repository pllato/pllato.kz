export function warningText(code){
 const labels=[[1,'ошибка контрольной суммы'],[2,'неподдерживаемые данные'],[4,'необработанные классы объектов'],[8,'неизвестные типы объектов'],[16,'некорректные ссылки'],[32,'ошибка расширенных данных'],[64,'значения вне ожидаемого диапазона']];
 return labels.filter(([bit])=>code&bit).map(([,label])=>label).join('; ');
}
export function clampProgress(n){return Math.max(0,Math.min(100,Number.isFinite(n)?Math.round(n):0));}
