logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#0e3b4a"><path d="M24 32c0-11 9-16 18-13l8 3 8-3c9-3 18 2 18 13 0 13-5 20-7 33-2 11-5 18-9 18-5 0-5-14-10-14s-5 14-10 14c-4 0-7-7-9-18-2-13-7-20-7-33z" fill="#ffffff"/><circle cx="70" cy="28" r="8" fill="#3fc1b0"/></svg>'
build({'out':ROOT+'/app/kp-stom-ademi.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · единая система сети стоматологий · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230e3b4a'/><path d='M24 32c0-11 9-16 18-13l8 3 8-3c9-3 18 2 18 13 0 13-5 20-7 33-2 11-5 18-9 18-5 0-5-14-10-14s-5 14-10 14c-4 0-7-7-9-18-2-13-7-20-7-33z' fill='%23ffffff'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#0e3b4a;--ink2:#16505f;--y:#14998a;--y2:#0d7064;--y3:#a8e6dd;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e6f5f2'),('#cfe4d5','#cbe9e3'),('#b9cbbd','#c6d5d9'),('#93a898','#8aa0a8'),('#d8dce1','#dfe8ea'),('rgba(238,193,112,.2)','rgba(20,153,138,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-50px;top:-60px;width:220px;height:320px;border-radius:50%;background:rgba(95,211,195,.10);border:0}
.paytab tr.cur td{background:#e6f5f2}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
