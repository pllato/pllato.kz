logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#23402f"><circle cx="50" cy="60" r="17" fill="#d9692a"/><circle cx="27" cy="38" r="8" fill="#fff"/><circle cx="43" cy="25" r="8" fill="#fff"/><circle cx="59" cy="25" r="8" fill="#fff"/><circle cx="74" cy="38" r="8" fill="#fff"/></svg>'
build({'out':ROOT+'/app/kp-prokorm-nurzhan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · производство кормов · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2323402f'/><circle cx='50' cy='60' r='17' fill='%23d9692a'/><circle cx='27' cy='38' r='8' fill='%23fff'/><circle cx='43' cy='25' r='8' fill='%23fff'/><circle cx='59' cy='25' r='8' fill='%23fff'/><circle cx='74' cy='38' r='8' fill='%23fff'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#23402f;--ink2:#2e5240;--y:#d9692a;--y2:#b0521c;--y3:#f7c9a8;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fbefe6'),('#cfe4d5','#f2d9c6'),('#b9cbbd','#c9d6cf'),('#93a898','#8aa094'),('#d8dce1','#e2e8e4'),('rgba(238,193,112,.2)','rgba(217,105,42,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.12) 20px 27px);border:0}
.paytab tr.cur td{background:#fbefe6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
