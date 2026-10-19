logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="12" y="12" width="76" height="76" rx="6" fill="none" stroke="#fff" stroke-width="7"/><path d="M24 58c10 0 12-16 26-16s16 16 26 16" fill="none" stroke="#f2b01e" stroke-width="8" stroke-linecap="round"/><path d="M24 72h52" stroke="#f2b01e" stroke-width="6" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-potok-rauan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · ПОТОК · дистрибуция оборудования · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2322303a'/><path d='M22 58c10 0 12-16 28-16s18 16 28 16' fill='none' stroke='%23f2b01e' stroke-width='9' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#22303a;--ink2:#2e3f4b;--y:#c98a00;--y2:#9c6b00;--y3:#f2b01e;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#eef1f3'),('#cfe4d5','#dde2e6'),('#b9cbbd','#c9d6df'),('#93a898','#8a9aa8'),('#d8dce1','#e0e8ee'),('rgba(238,193,112,.2)','rgba(242,176,30,.18)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(242,176,30,.18) 20px 27px);border:0}
.paytab tr.cur td{background:#eef1f3}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
