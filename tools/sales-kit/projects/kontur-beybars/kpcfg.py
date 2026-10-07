logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 86V30l36-18 36 18v56" fill="none" stroke="#e8edf2" stroke-width="7" stroke-linejoin="round"/><path d="M54 30L40 56h14l-6 24 18-32H52l8-18z" fill="#f2b705"/></svg>'
build({'out':ROOT+'/app/kp-kontur-beybars.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Контур · система генподрядчика · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%231d2329'/><path d='M18 84V34l32-16 32 16v50' fill='none' stroke='%23e8edf2' stroke-width='8'/><path d='M54 32L40 58h14l-6 22 18-30H52l8-18z' fill='%23f2b705'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
 'root':'--ink:#1d2329;--ink2:#2b333b;--y:#9a6c00;--y2:#7a5500;--y3:#f2b705;',
 'mono':'IBM Plex Mono','body':'IBM Plex Sans','head':'IBM Plex Sans','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fdf3d6'),('#cfe4d5','#f6e3a6'),('#b9cbbd','#c4ccd2'),('#93a898','#8a949d'),('#d8dce1','#dde2e6'),('rgba(238,193,112,.2)','rgba(242,183,5,.16)'),('--green:#1f7a5a','--green:#2e7a4f')],
 'extra':'''
h1{font-weight:700;font-size:29px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:25px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 22px,rgba(242,183,5,.12) 22px 30px);border:0}
.paytab tr.cur td{background:#fdf3d6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:2px}
@media print{h1{font-size:27px}.cover h1{font-size:23px}}
'''})
