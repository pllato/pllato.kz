import {routeLength} from './cable-ledger.mjs?v=0.17.71';

export function cableLengthLabel(route){
 const length=(route.paths||[route.points]).reduce((sum,path)=>sum+routeLength(path,route.metresPerUnit),0);
 const extra=route.extraMetres||0,format=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:3});
 return `Длина ≈ ${format(length)} м`+(extra>0?`\nС учётом отпусков ≈ ${format(length+extra)} м (+${format(extra)} м)`:'');
}
