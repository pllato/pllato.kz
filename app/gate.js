/* Гейт временных ссылок Pllato.
 *
 * Как закрыть новую страницу (демо/КП/мокап) временным доступом:
 *   1. Подключи ПЕРВЫМ тегом внутри <head>:  <script src="/app/gate.js"></script>
 *   2. Добавь страницу в список PAGES в app/linkgen.html — и генерируй ссылки.
 *
 * Страница откроется:
 *   — по ссылке из генератора (?k=токен, до истечения срока), или
 *   — на устройстве, где входили в портал pllato.kz/app (токен выдаётся автоматически).
 * Иначе — редирект на «Срок действия ссылки истёк».
 *
 * Токен: base64(exp + "." + hash(exp + SECRET)). Секрет и хэш общие с
 * linkgen.html, app.html и инлайн-гейтами demo-bakery*.html — не менять порознь.
 */
(function(){
  var SECRET='pllato-nan-dan-2026';
  function h(s){var x=7;for(var i=0;i<s.length;i++){x=((x*31)+s.charCodeAt(i))>>>0}return x.toString(36)}
  var q=new URLSearchParams(location.search),tok=q.get('k')||localStorage.getItem('plk'),ok=false,exp=0;
  if(tok){try{var d=atob(tok).split('.');exp=parseInt(d[0]);if(h(d[0]+SECRET)===d[1]&&Date.now()<exp){ok=true}}catch(e){}}
  if(ok){
    // сохраняем токен, но не затираем более долгий (например, 180-дневный с портала)
    var curExp=0;try{var c=localStorage.getItem('plk');if(c)curExp=parseInt(atob(c).split('.')[0])||0}catch(e){}
    if(exp>curExp)try{localStorage.setItem('plk',tok)}catch(e){}
  }else{
    location.replace('/app/expired.html');
  }
})();
