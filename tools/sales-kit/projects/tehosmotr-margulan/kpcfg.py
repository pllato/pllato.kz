logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34" fill="none" stroke="#3fbf6e" stroke-width="10"/><path d="M33 51l12 12 22-26" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>'
build({'out':ROOT+'/app/kp-tehosmotr-margulan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · ТехКонтроль · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%2322272b'/><circle cx='50' cy='50' r='30' fill='none' stroke='%233fbf6e' stroke-width='9'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1d2226;--ink2:#1f8a4c;--y:#1f8a4c;--y2:#176b3a;--y3:#3fbf6e;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e3f3e9'),('#cfe4d5','#cfe8d8'),('#b9cbbd','#b9c4bd'),('#93a898','#8b949a'),('#d8dce1','#e0e3df'),('rgba(238,193,112,.2)','rgba(63,191,110,.16)'),('--green:#1f7a5a','--green:#1f8a4c')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#e3f3e9}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#1f8a4c;background:#e3f3e9}
.strip div:last-child b{color:#1f8a4c}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
