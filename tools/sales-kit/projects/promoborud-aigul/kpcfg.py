logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="22" fill="none" stroke="#f08a1c" stroke-width="9"/><path d="M50 10v14M50 76v14M10 50h14M76 50h14M22 22l10 10M68 68l10 10M78 22 68 32M32 68 22 78" stroke="#f08a1c" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="50" r="8" fill="#f08a1c"/></svg>'
build({'out':ROOT+'/app/kp-promoborud-aigul.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Степь Индастриал · поставки промышленного оборудования · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%231f2428'/><path d='M50 18v64M24 30h52' stroke='%23f08a1c' stroke-width='8' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
 'root':'--ink:#1f2428;--ink2:#2f3a42;--y:#d0700c;--y2:#a85808;--y3:#f08a1c;',
 'mono':'IBM Plex Mono','body':'IBM Plex Sans','head':'IBM Plex Sans Condensed','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f3ede6'),('#cfe4d5','#e6dcc4'),('#b9cbbd','#9fb0c0'),('#93a898','#8a9aaa'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6a5a')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#f3ede6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#1f2428;background:#f3ede6}
.strip div:last-child b{color:#f08a1c}
.shot img{object-fit:contain!important;object-position:left top;background:#fff}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
