logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 24h48l-5 60H31z" fill="#d9a441"/><path d="M26 24h48v9H26z" fill="#e9d9a8"/><path d="M37 50h26M37 62h18" stroke="#2f3520" stroke-width="5" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-gurme-esen.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Сапар Гурме · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%232f3520'/><path d='M28 30h44l-4 50H32z' fill='%23d9a441'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#2f3520;--ink2:#4f5a32;--y:#a26a0b;--y2:#7d5208;--y3:#d9a441;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#ecefe1'),('#cfe4d5','#d8dcc6'),('#b9cbbd','#b9bea4'),('#93a898','#8f957a'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#4f5a32')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#f8edd5}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#2f3520;background:#f8edd5}
.strip div:last-child b{color:#a26a0b}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
