logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 10C50 10 22 42 22 60a28 28 0 0 0 56 0C78 42 50 10 50 10z" fill="#d9b98a"/><path d="M50 78V50M50 60l-11-9M50 67l11-9" stroke="#0f4c45" stroke-width="5" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-clinic-erkin.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Таза Өмір · клиника · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230f4c45'/><path d='M50 16C50 16 26 44 26 60a24 24 0 0 0 48 0C74 44 50 16 50 16z' fill='%23d9b98a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800&family=PT+Serif:wght@700&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#0b302c;--ink2:#0f5c53;--y:#9a7340;--y2:#7a5a30;--y3:#d9b98a;',
 'mono':'JetBrains Mono','body':'Source Sans 3','head':'PT Serif','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e3f0ec'),('#cfe4d5','#cfe3dc'),('#b9cbbd','#b9cbc5'),('#93a898','#8fa39d'),('#d8dce1','#e6e1d6'),('rgba(238,193,112,.2)','rgba(217,185,138,.22)'),('--green:#1f7a5a','--green:#0f5c53')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#f6ecdc}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#0f5c53;background:#f6ecdc}
.strip div:last-child b{color:#9a7340}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
