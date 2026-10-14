logo='<img src="/app/img/tucino/logo.jpg" width="52" height="52" style="border-radius:50%;display:block" alt="TUCINO">'
build({'out':ROOT+'/app/kp-tucino-rustem.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · TUCINO · обувные магазины · Pllato',
 'fav':"<link rel=\"icon\" href=\"/app/img/tucino/logo.jpg\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#151515;--ink2:#2a2a2a;--y:#c8202f;--y2:#9e1824;--y3:#ff8a93;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f3efee'),('#cfe4d5','#e2dcd8'),('#b9cbbd','#d2ccc6'),('#93a898','#95918c'),('#d8dce1','#e7e3df'),('rgba(238,193,112,.2)','rgba(200,32,47,.14)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(200,32,47,.14) 20px 27px);border:0}
.paytab tr.cur td{background:#f3efee}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
