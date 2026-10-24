logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#1e2228"><circle cx="50" cy="50" r="30" fill="#f07b16"/><circle cx="50" cy="50" r="12" fill="#1e2228"/></svg>'
build({'out':ROOT+'/app/kp-pu-oksana.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · CRM и производство изделий из полиуретана · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231e2228'/><circle cx='50' cy='50' r='30' fill='%23f07b16'/><circle cx='50' cy='50' r='12' fill='%231e2228'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#1e2228;--ink2:#2b3038;--y:#e86f0c;--y2:#b85607;--y3:#ffc996;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fdf0e4'),('#cfe4d5','#f7dcc2'),('#b9cbbd','#c9ced6'),('#93a898','#8f97a3'),('#d8dce1','#e3e6ea'),('rgba(238,193,112,.2)','rgba(232,111,12,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.10) 20px 27px);border:0}
.paytab tr.cur td{background:#fdf0e4}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
