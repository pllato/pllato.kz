// Передаём существующий ключ только соседнему DWG-редактору.
// Проверка подписи и срока остаётся в /app/gate.js; здесь доступ не выдаётся.
(()=>{
  const key=new URLSearchParams(location.search).get('k');
  if(!key)return;
  function update(a){
    if(!a)return;
    const u=new URL(a.getAttribute('href'),location.href);
    if(u.origin!==location.origin||u.pathname!=='/app/stroy/dwg/')return;
    u.searchParams.set('k',key);a.href=u.href;
  }
  document.querySelectorAll('a[href]').forEach(update);
  // Навигация Линейки создаётся динамически. Обрабатываем также среднюю
  // кнопку и контекстное меню «Открыть в новой вкладке».
  for(const event of ['pointerdown','focusin','click','auxclick','contextmenu']){
    document.addEventListener(event,e=>update(e.target.closest?.('a[href]')),true);
  }
})();
