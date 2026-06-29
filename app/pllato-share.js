/* =============================================================
   Pllato — демо-ссылки с ограничением по времени.
   Подключение в любом демо:  <script src="../pllato-share.js" defer></script>
   (путь относительно app/<slug>/index.html)

   Как работает:
   - Внутренний режим (открыли без токена): в углу кнопка «Поделиться» —
     генерирует ссылку с выбранным сроком (1 ч / 24 ч / 3 дня / 7 дней).
   - Клиент открывает ссылку с токеном ?s=… : доступ работает до срока,
     внизу — плашка «доступ до …». После срока — экран «ссылка истекла».

   Срок и подпись зашиты в сам токен (HMAC-подобная подпись по секрету).
   Это «мягкая» защита для продаж: токен проверяется на стороне браузера,
   сервер не участвует. Для демо этого достаточно.
   ============================================================= */
(function () {
  "use strict";
  var SECRET = "pllato-demo-2026-7c";              // соль подписи (клиентская, мягкая защита)
  var BRAND = "Pllato";
  var CONTACT = "+7 701 123 99 99";

  /* --- подпись/токен --- */
  function fnv(s){var x=0x811c9dc5;for(var i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193);}return (x>>>0).toString(36);}
  function sign(exp){return fnv(exp+":"+SECRET);}
  function b64u(s){return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function ub64u(s){s=s.replace(/-/g,'+').replace(/_/g,'/');return atob(s);}
  function makeToken(exp){return b64u(exp+"."+sign(exp));}
  function parseToken(t){try{var p=ub64u(t).split(".");var exp=parseInt(p[0],10);if(!exp||sign(exp)!==p[1])return null;return exp;}catch(e){return null;}}

  function fmt(ts){
    var d=new Date(ts), p=function(n){return (n<10?"0":"")+n;};
    return p(d.getDate())+"."+p(d.getMonth()+1)+"."+d.getFullYear()+" "+p(d.getHours())+":"+p(d.getMinutes());
  }
  function left(ms){
    var m=Math.max(0,Math.round(ms/60000));
    if(m<60) return m+" мин";
    var h=Math.round(m/60); if(h<48) return h+" ч";
    return Math.round(h/24)+" дн";
  }

  /* --- стили --- */
  var css = ""
  + ".pls-btn{position:fixed;right:18px;bottom:18px;z-index:400;background:#0a1628;color:#fff;border:1px solid #b8895a;border-radius:30px;padding:11px 18px;font:600 13.5px/1 -apple-system,'Segoe UI',Roboto,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(10,22,40,.35);display:flex;align-items:center;gap:8px}"
  + ".pls-btn:hover{background:#142339}"
  + ".pls-pill{position:fixed;right:18px;bottom:18px;z-index:400;background:#142339;color:#cdd7e3;border:1px solid #2a3a55;border-radius:24px;padding:8px 14px;font:600 12px/1 -apple-system,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;gap:7px;box-shadow:0 6px 18px rgba(10,22,40,.3)}"
  + ".pls-pill .d{width:7px;height:7px;border-radius:50%;background:#3f7d52}"
  + ".pls-ov{position:fixed;inset:0;z-index:9998;background:rgba(10,22,40,.6);backdrop-filter:blur(4px);display:none;align-items:flex-start;justify-content:center;padding:48px 16px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif}"
  + ".pls-ov.open{display:flex}"
  + ".pls-modal{background:#fff;border-radius:16px;max-width:480px;width:100%;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.4)}"
  + ".pls-h{background:#0a1628;color:#fff;padding:20px 24px;position:relative}"
  + ".pls-h h2{font-size:18px;margin:0 0 5px}.pls-h p{margin:0;color:#9fb0c4;font-size:12.5px}"
  + ".pls-x{position:absolute;top:14px;right:16px;background:rgba(255,255,255,.12);border:none;color:#fff;width:30px;height:30px;border-radius:50%;font-size:18px;cursor:pointer}"
  + ".pls-b{padding:20px 24px}"
  + ".pls-lab{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7585;margin-bottom:8px}"
  + ".pls-seg{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}"
  + ".pls-seg button{flex:1;min-width:70px;background:#f7f6f1;border:1px solid #e6e3da;border-radius:9px;padding:10px;font:600 13px/1 inherit;color:#1d2630;cursor:pointer}"
  + ".pls-seg button.on{background:#b8895a;color:#fff;border-color:#b8895a}"
  + ".pls-link{display:flex;gap:8px;margin-bottom:14px}"
  + ".pls-link input{flex:1;border:1px solid #e6e3da;border-radius:9px;padding:10px 12px;font:13px/1.3 ui-monospace,Menlo,monospace;color:#1d2630;background:#fafaf6}"
  + ".pls-act{display:flex;gap:8px}"
  + ".pls-act button{flex:1;border:none;border-radius:9px;padding:11px;font:600 13px/1 inherit;cursor:pointer}"
  + ".pls-copy{background:#0a1628;color:#fff}.pls-wa{background:#25d366;color:#fff}"
  + ".pls-note{font-size:11.5px;color:#8a909c;margin-top:14px;line-height:1.5}"
  + ".pls-gate{position:fixed;inset:0;z-index:9999;background:radial-gradient(900px 520px at 70% -10%,#16324a,#0a1628 60%);color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;text-align:center}"
  + ".pls-gate .in{max-width:420px}"
  + ".pls-gate .br{font-size:26px;font-weight:800;color:#d4a978;margin-bottom:28px}.pls-gate .br span{color:#fff}"
  + ".pls-gate .ic{font-size:44px;margin-bottom:14px}"
  + ".pls-gate h1{font-size:24px;margin:0 0 12px}"
  + ".pls-gate p{color:#aebccd;font-size:14px;line-height:1.6;margin:0 0 8px}"
  + ".pls-gate .c{margin-top:20px;color:#86a0b6;font-size:13px}";

  function injectCSS(){var s=document.createElement("style");s.textContent=css;document.head.appendChild(s);}

  /* --- экран «ссылка истекла» --- */
  function showGate(){
    var g=document.createElement("div");
    g.className="pls-gate";
    g.innerHTML='<div class="in">'
      +'<div class="br">'+BRAND+'<span>.</span></div>'
      +'<div class="ic">⏳</div>'
      +'<h1>Срок действия ссылки истёк</h1>'
      +'<p>Эта демо-ссылка была ограничена по времени и больше недоступна.</p>'
      +'<p>Запросите новую ссылку — откроем доступ снова.</p>'
      +'<div class="c">'+BRAND+' · '+CONTACT+'</div></div>';
    document.body.appendChild(g);
    document.documentElement.style.overflow="hidden";
  }

  /* --- плашка «доступ до …» --- */
  function showPill(exp){
    var p=document.createElement("div");
    p.className="pls-pill";
    p.innerHTML='<span class="d"></span>Демо-доступ до '+fmt(exp)+' · осталось '+left(exp-Date.now());
    document.body.appendChild(p);
  }

  /* --- модалка «поделиться» --- */
  var DURS=[["1 час",3600e3],["24 часа",86400e3],["3 дня",259200e3],["7 дней",604800e3]];
  var curDur=86400e3;
  function baseUrl(){return location.origin+location.pathname;}
  function genLink(){return baseUrl()+"?s="+makeToken(Date.now()+curDur);}

  function buildModal(){
    var ov=document.createElement("div");
    ov.className="pls-ov";ov.id="pls-ov";
    ov.innerHTML=''
      +'<div class="pls-modal">'
      +'<div class="pls-h"><button class="pls-x" id="pls-close">×</button>'
      +'<h2>Отправить демо клиенту</h2><p>Ссылка перестанет открываться после выбранного срока.</p></div>'
      +'<div class="pls-b">'
      +'<div class="pls-lab">Срок действия</div>'
      +'<div class="pls-seg" id="pls-seg">'+DURS.map(function(d,i){return '<button data-ms="'+d[1]+'" class="'+(d[1]===curDur?'on':'')+'">'+d[0]+'</button>';}).join('')+'</div>'
      +'<div class="pls-lab">Ссылка</div>'
      +'<div class="pls-link"><input id="pls-url" readonly></div>'
      +'<div class="pls-act"><button class="pls-copy" id="pls-copy">Копировать</button><button class="pls-wa" id="pls-wa">Отправить в WhatsApp</button></div>'
      +'<div class="pls-note" id="pls-note"></div>'
      +'</div></div>';
    document.body.appendChild(ov);

    function refresh(){
      var url=genLink();
      document.getElementById("pls-url").value=url;
      document.getElementById("pls-note").textContent="Действует до "+fmt(Date.now()+curDur)+". После этого клиент увидит экран «ссылка истекла».";
    }
    ov.addEventListener("click",function(e){if(e.target===ov)ov.classList.remove("open");});
    document.getElementById("pls-close").onclick=function(){ov.classList.remove("open");};
    document.getElementById("pls-seg").onclick=function(e){
      var b=e.target.closest("button");if(!b)return;
      curDur=parseInt(b.dataset.ms,10);
      [].forEach.call(this.querySelectorAll("button"),function(x){x.classList.remove("on");});
      b.classList.add("on");refresh();
    };
    document.getElementById("pls-copy").onclick=function(){
      var inp=document.getElementById("pls-url");inp.select();
      try{navigator.clipboard.writeText(inp.value);}catch(e){document.execCommand("copy");}
      this.textContent="Скопировано ✓";var t=this;setTimeout(function(){t.textContent="Копировать";},1500);
    };
    document.getElementById("pls-wa").onclick=function(){
      var msg="Здравствуйте! Демо системы от "+BRAND+" (доступ ограничен по времени): "+genLink();
      window.open("https://wa.me/?text="+encodeURIComponent(msg),"_blank");
    };
    refresh();
    return ov;
  }

  function showShareButton(){
    var btn=document.createElement("button");
    btn.className="pls-btn";
    btn.innerHTML='🔗 Поделиться';
    document.body.appendChild(btn);
    var ov=null;
    btn.onclick=function(){if(!ov)ov=buildModal();document.getElementById("pls-url").value=genLink();ov.classList.add("open");};
  }

  /* --- старт --- */
  function init(){
    injectCSS();
    var token=new URLSearchParams(location.search).get("s");
    if(token){
      var exp=parseToken(token);
      if(exp===null||Date.now()>exp){ showGate(); return; }   // нет/битый/просрочен → блок
      showPill(exp);                                           // валидный клиентский доступ
      return;                                                  // у клиента кнопку «поделиться» не показываем
    }
    showShareButton();                                         // внутренний режим
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
