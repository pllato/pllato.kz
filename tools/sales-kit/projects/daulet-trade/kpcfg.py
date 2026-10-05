logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M10 88h80" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M22 88V44l28-22 28 22v44" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><rect x="38" y="56" width="24" height="32" fill="#e8674a"/></svg>'
build({'out':ROOT+'/app/kp-daulet-trade.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Опора · оптовая торговля · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2324324a'/><path d='M24 84V46l26-20 26 20v38' fill='none' stroke='%23fff' stroke-width='8'/><rect x='39' y='56' width='22' height='28' fill='%23e8674a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700;800&display=swap',
 'root':'--ink:#1d2a3e;--ink2:#2a3b55;--y:#c4512f;--y2:#9a3d22;--y3:#f08a6c;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fcebe5'),('#cfe4d5','#f3cfc3'),('#b9cbbd','#b9c3cf'),('#93a898','#8e98a6'),('#d8dce1','#dfe4ea'),('rgba(238,193,112,.2)','rgba(240,138,108,.18)'),('--green:#1f7a5a','--green:#2f7a52')],
 'extra':'''
h1{font-weight:800;font-size:30px;text-transform:none;letter-spacing:-.02em}.cover h1{font-size:26px}h2{font-weight:800;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-60px;top:-60px;width:260px;height:260px;border-radius:0;background:none;border:30px solid rgba(240,138,108,.11);transform:rotate(45deg)}
.paytab tr.cur td{background:#fcebe5}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
@media print{h1{font-size:28px}.cover h1{font-size:24px}}
'''})
