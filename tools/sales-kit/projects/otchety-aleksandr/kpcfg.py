logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#10202b"><path d="M50 14C40 30 32 42 32 56a18 18 0 0036 0c0-14-8-26-18-42z" fill="#fff"/><path d="M40 60h6l4-9 5 15 4-6h5" stroke="#f2a20c" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
build({'out':ROOT+'/app/kp-otchety-aleksandr.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · портал отчётности из 1С · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2310202b'/><path d='M50 14C40 30 32 42 32 56a18 18 0 0036 0c0-14-8-26-18-42z' fill='%23fff'/><path d='M40 60h6l4-9 5 15 4-6h5' stroke='%23f2a20c' stroke-width='4' fill='none' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#10202b;--ink2:#1c3140;--y:#e08e00;--y2:#b06f00;--y3:#ffd98a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fdf3e0'),('#cfe4d5','#f6e0b4'),('#b9cbbd','#c3d1da'),('#93a898','#87a0b0'),('#d8dce1','#e1e8ed'),('rgba(238,193,112,.2)','rgba(224,142,0,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.10) 20px 27px);border:0}
.paytab tr.cur td{background:#fdf3e0}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
