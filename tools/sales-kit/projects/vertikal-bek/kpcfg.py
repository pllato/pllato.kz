logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="26" fill="#ff7a1a"/><path d="M50 18v64M34 82h32M38 34h24M38 50h24M38 66h24" stroke="#2b1200" stroke-width="8" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-vertikal-bek.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Вертикаль · учёт проектов и времени · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='26' fill='%23ff7a1a'/><path d='M50 18v64M34 82h32M38 34h24M38 50h24M38 66h24' stroke='%232b1200' stroke-width='9' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#0e1116;--ink2:#171d27;--y:#ff7a1a;--y2:#c74e00;--y3:#ffa055;',
 'mono':'IBM Plex Mono','body':'Onest','head':'Onest','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fff1e6'),('#cfe4d5','#ffd3b0'),('#b9cbbd','#5f6b7e'),('#93a898','#93a0b4'),('#d8dce1','#e3e7ed'),('rgba(238,193,112,.2)','rgba(255,122,26,.16)'),('--green:#1f7a5a','--green:#16a34a')],
 'extra':'''
h1{font-weight:800;font-size:32px;text-transform:none;letter-spacing:-.025em}.cover h1{font-size:28px}h2{font-weight:800;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-60px;top:-60px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(255,122,26,.22),transparent 65%)}
.paytab tr.cur td{background:#fff1e6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:12px}
.said{border-left-color:#ff7a1a;background:#fff1e6}
.strip div:last-child b{color:#ffa055}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
