logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 14c11 16 22 28 22 41a22 22 0 0 1-44 0c0-13 11-25 22-41z" fill="#ffffff"/><path d="M14 84c12-7 24-7 36 0s24 7 36 0" stroke="#7cc4ff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-skinline-crm.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Skinline · CRM по ТЗ · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231556b8'/><path d='M50 18c10 15 20 26 20 38a20 20 0 0 1-40 0c0-12 10-23 20-38z' fill='%23fff'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#0b2545;--ink2:#1556b8;--y:#1556b8;--y2:#0f449a;--y3:#7cc4ff;',
 'mono':'IBM Plex Mono','body':'IBM Plex Sans','head':'IBM Plex Sans','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e7f0fc'),('#cfe4d5','#f0dca8'),('#b9cbbd','#a89e94'),('#93a898','#9a928a'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#3d6b4f')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#e7f0fc}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#1556b8;background:#e7f0fc}
.strip div:last-child b{color:#7cc4ff}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
