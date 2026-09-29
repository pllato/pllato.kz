import {routeLength} from './cable-ledger.mjs?v=0.17.10';
export function mountCableNavigator(api){
 const panel=document.createElement('details');panel.id='cableNavigator';panel.open=true;
 panel.innerHTML='<summary>Кабели <span id="cnCount"></span></summary><div class="cnBody"><div id="cnList"></div><p id="cnLength"></p><div class="cnFields"><label>Марка<input id="cnBrand" maxlength="1000"></label><label>Сечение<input id="cnSection" maxlength="1000"></label></div><label>Добавочная длина, м<input id="cnExtra" type="number" min="0" step="any"></label><div class="cnActions"><button id="cnApply">Применить</button><button id="cnShow">Показать</button></div><small id="cnHint"></small></div>';
 document.getElementById('viewport').append(panel);
 const $=id=>document.getElementById(id),list=$('exRouteList');$('cnList').append(list.closest('label'));
 $('cnExtra').parentElement.firstChild.textContent='Выпуски / отпуски, м';
 const colorLabel=document.createElement('label');colorLabel.textContent='Цвет кабеля';const color=$('cwColor').cloneNode(true);color.id='cnColor';color.options[0].textContent='Исходный — как на чертеже';colorLabel.append(color);$('cnExtra').parentElement.before(colorLabel);
 color.onchange=async()=>{if(api.busy())return;try{await api.color(Number(color.value));api.draw();}catch(e){api.status(e.message);lastColor=null;api.draw();}};
 for(const group of document.querySelectorAll('#executiveToolbar>details'))if(group.querySelector('summary')?.textContent==='Список кабелей')group.hidden=true;
 $('cnApply').onclick=()=>{if(api.busy())return;for(const [a,b]of [['cnBrand','exBrand'],['cnSection','exSection'],['cnExtra','exExtra']])$(b).value=$(a).value;$('cwAssign').click();};
 $('cnShow').onclick=()=>api.focusCable();
 list.addEventListener('change',()=>{api.focusCable();api.draw();});
 let lastKey,lastValues='',lastColor;
 return {refresh(){const r=api.route(),key=r?.id||api.selectionKey(),cap=api.capabilities(),allowed=!api.busy()&&api.selecting();
  $('cnCount').textContent=String(list.options.length);const metres=r?(r.paths||[r.points]).reduce((n,path)=>n+routeLength(path,r.metresPerUnit),0):0;const format=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:3});$('cnLength').textContent=r?`Длина ≈ ${format(metres)} м · итого ${format(metres+r.extraMetres)} м`:api.length();
  const values=[['cnBrand',r?.brand??$('exBrand').value],['cnSection',r?.section??$('exSection').value],['cnExtra',r?.extraMetres??$('exExtra').value]],signature=JSON.stringify(values);
  const actual=r?.sourceIds?api.colorValue():r?.color??api.colorValue();if(key!==lastKey||actual!==lastColor)color.value=String(actual||0);lastColor=actual;color.disabled=!allowed||!cap.color;color.options[0].disabled=!!r&&!r.sourceIds;
  for(const [id,value]of values){if(key!==lastKey||signature!==lastValues)$(id).value=value;$(id).disabled=!allowed||!cap.leader;}lastValues=signature;
  lastKey=key;list.disabled=api.busy()||!list.options.length;$('cnApply').disabled=!allowed||!cap.leader;$('cnApply').textContent=r?'Применить':'Назначить кабель';$('cnShow').disabled=api.busy()||!(r||api.hasSelection());
  $('cnHint').textContent=r?'Итого = трасса + выпуски / отпуски. Правки обновят выноски и ведомость.':api.hasSelection()?'Выбранный объект ещё не назначен кабелем.':'Выберите кабель на чертеже или в списке текущего листа.';
 }};
}
