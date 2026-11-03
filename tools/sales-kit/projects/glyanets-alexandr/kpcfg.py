logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><circle cx="44" cy="54" r="26" fill="none" stroke="#ffffff" stroke-width="8"/><circle cx="44" cy="54" r="8" fill="#ffffff"/><path d="M76 12v20M66 22h20" stroke="#f2c230" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-glyanets-alexandr.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Глянец · CRM и склад · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%230e7c86'/><circle cx='44' cy='54' r='24' fill='none' stroke='%23fff' stroke-width='8'/><circle cx='44' cy='54' r='7' fill='%23fff'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1d252c;--ink2:#0e7c86;--y:#0e7c86;--y2:#0a6168;--y3:#f2c230;',
 'mono':'IBM Plex Mono','body':'Rubik','head':'Rubik','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e1f1f2'),('#cfe4d5','#f0dca8'),('#b9cbbd','#a89e94'),('#93a898','#9a928a'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#3d6b4f')],
 'extra':'''
h1{font-weight:600;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:600;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#e1f1f2}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#0e7c86;background:#e1f1f2}
.strip div:last-child b{color:#f2c230}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
