logo='<img src="/app/img/blitz/logo.jpg" width="48" height="48" alt="" style="border-radius:8px;border:2px solid #fff">'
build({'out':ROOT+'/app/kp-blitz-murat.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · FitnessBlitz · сеть клубов · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23980017'/><path d='M50 20l8 22h-16zM34 46l32 0M50 42v22l-12 18M50 64l12 18' stroke='%23fff' stroke-width='7' fill='none' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#7e0a1c;--ink2:#951428;--y:#c8102e;--y2:#9a0c22;--y3:#ffd0d6;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f9ecee'),('#cfe4d5','#f0d4d9'),('#b9cbbd','#c9d6df'),('#93a898','#8a9aa8'),('#d8dce1','#e0e8ee'),('rgba(238,193,112,.2)','rgba(200,16,46,.14)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.12) 20px 27px);border:0}
.paytab tr.cur td{background:#f9ecee}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
