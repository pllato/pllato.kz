logo='<img src="/app/img/tigers/logo.jpg" width="48" height="48" alt="" style="border-radius:50%;border:2px solid #e8862a">'
build({'out':ROOT+'/app/kp-tigers-alibek.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Tigers · товары для отдыха · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23161412'/><path d='M30 34l10 8M70 34l-10 8M36 62c8 8 20 8 28 0' stroke='%23e8862a' stroke-width='8' fill='none' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#1d1a17;--ink2:#2a2622;--y:#d0701a;--y2:#a85812;--y3:#f0a24e;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f6efe7'),('#cfe4d5','#eadccb'),('#b9cbbd','#c9d6df'),('#93a898','#8a9aa8'),('#d8dce1','#e0e8ee'),('rgba(238,193,112,.2)','rgba(232,134,42,.18)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(232,134,42,.18) 20px 27px);border:0}
.paytab tr.cur td{background:#f6efe7}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
