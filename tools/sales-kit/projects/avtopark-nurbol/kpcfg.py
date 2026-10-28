logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#141d2b"><circle cx="50" cy="50" r="28" fill="#f5b800"/><circle cx="50" cy="50" r="10" fill="#141d2b"/><rect x="47" y="24" width="6" height="16" fill="#141d2b"/><rect x="47" y="60" width="6" height="16" fill="#141d2b"/></svg>'
build({'out':ROOT+'/app/kp-avtopark-nurbol.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · система автопарка аренды под такси · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23141d2b'/><circle cx='50' cy='50' r='28' fill='%23f5b800'/><circle cx='50' cy='50' r='10' fill='%23141d2b'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#141d2b;--ink2:#22304a;--y:#e0a500;--y2:#a87b00;--y3:#ffe08a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fdf5dc'),('#cfe4d5','#f6e3a8'),('#b9cbbd','#c9d0da'),('#93a898','#8f99a8'),('#d8dce1','#e3e7ec'),('rgba(238,193,112,.2)','rgba(224,165,0,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(245,184,0,.22) 22px 34px);border:0}
.paytab tr.cur td{background:#fdf5dc}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
