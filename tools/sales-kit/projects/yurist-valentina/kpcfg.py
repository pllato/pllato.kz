logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 14v70M30 84h40M20 26h60" stroke="#14243a" stroke-width="6" stroke-linecap="round"/><path d="M20 26 8 56h24zM80 26 68 56h24z" fill="none" stroke="#c9a45c" stroke-width="5" stroke-linejoin="round"/></svg>'
build({'out':ROOT+'/app/kp-yurist-valentina.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Аргумент · система юридической компании · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%2314243a'/><path d='M50 18v64M24 30h52' stroke='%23c9a45c' stroke-width='8' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&family=Source+Sans+3:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#14243a;--ink2:#1e3a5f;--y:#9a7a35;--y2:#7a5f28;--y3:#c9a45c;',
 'mono':'JetBrains Mono','body':'Source Sans 3','head':'PT Serif','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f4efe2'),('#cfe4d5','#e6dcc4'),('#b9cbbd','#9fb0c0'),('#93a898','#8a9aaa'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6a5a')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#f4efe2}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#14243a;background:#f4efe2}
.strip div:last-child b{color:#c9a45c}
.shot img{object-fit:contain!important;object-position:left top;background:#fff}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
