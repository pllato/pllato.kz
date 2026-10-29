logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#262b30"><path d="M50 14l31 18v36L50 86 19 68V32z" fill="#ffffff"/><circle cx="50" cy="50" r="13" fill="#e8731a"/></svg>'
build({'out':ROOT+'/app/kp-zapchasti-sultan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · единая система магазина запчастей для спецтехники · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23262b30'/><path d='M50 14l31 18v36L50 86 19 68V32z' fill='%23ffffff'/><circle cx='50' cy='50' r='13' fill='%23e8731a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#262b30;--ink2:#353b42;--y:#d9661a;--y2:#a84c10;--y3:#f6c49a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fcefe4'),('#cfe4d5','#f6d9c0'),('#b9cbbd','#cfcdc7'),('#93a898','#8f959a'),('#d8dce1','#e3e2de'),('rgba(238,193,112,.2)','rgba(217,102,26,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-50px;top:-60px;width:220px;height:320px;border-radius:50%;background:rgba(243,154,74,.10);border:0}
.paytab tr.cur td{background:#fcefe4}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
