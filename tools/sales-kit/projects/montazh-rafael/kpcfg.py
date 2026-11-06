logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 34h72M14 50h72M14 66h72" stroke="#7fc4e0" stroke-width="7" stroke-linecap="round"/><circle cx="74" cy="26" r="10" fill="#e8833a"/></svg>'
build({'out':ROOT+'/app/kp-montazh-rafael.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · АэроСтрой Монтаж · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2316324a'/><circle cx='72' cy='28' r='10' fill='%23e8833a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#16324a;--ink2:#1f6390;--y:#c0652a;--y2:#9a4f1f;--y3:#e8833a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e3eff7'),('#cfe4d5','#c9dcea'),('#b9cbbd','#a9bccb'),('#93a898','#8ea3b3'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6390')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#fcebdc}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#1f6390;background:#fcebdc}
.strip div:last-child b{color:#e8833a}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
