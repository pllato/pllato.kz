logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#4a1418"><rect x="16" y="32" width="68" height="36" rx="18" fill="#fff"/><path d="M32 43v14M44 43v14M56 43v14M68 43v14" stroke="#c98a1e" stroke-width="5" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-myaso-vitaliy.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · мясокомбинат · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%234a1418'/><rect x='18' y='34' width='64' height='32' rx='16' fill='%23e0a33a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#4a1418;--ink2:#5e1c21;--y:#c98a1e;--y2:#9c6a12;--y3:#f4d79a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#faf1e2'),('#cfe4d5','#f0dcb8'),('#b9cbbd','#d6c3c4'),('#93a898','#a18a8c'),('#d8dce1','#ece3e3'),('rgba(238,193,112,.2)','rgba(201,138,30,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.10) 20px 27px);border:0}
.paytab tr.cur td{background:#faf1e2}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
