logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 88C24 70 14 52 14 36a18 18 0 0 1 36-4 18 18 0 0 1 36 4c0 16-10 34-36 52z" fill="none" stroke="#f4efe6" stroke-width="7" stroke-linejoin="round"/><path d="M50 34v34M33 51h34" stroke="#d08a52" stroke-width="8" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-daru-kunduzay.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Дару · клиника комплексного лечения · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231f4d3f'/><path d='M50 36v30M35 51h30' stroke='%23d08a52' stroke-width='9' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Literata:opsz,wght@7..72,500;7..72,600;7..72,700&family=Commissioner:wght@400;500;600;700&display=swap',
 'root':'--ink:#1f4d3f;--ink2:#2a5f4f;--y:#1f6b55;--y2:#185544;--y3:#e3a877;',
 'mono':'JetBrains Mono','body':'Commissioner','head':'Literata','fallback':'serif',
 'colors':[('#e7f2ea','#e7f1ec'),('#cfe4d5','#c3dccf'),('#b9cbbd','#d0c8b9'),('#93a898','#8d998f'),('#d8dce1','#e4ded2'),('rgba(238,193,112,.2)','rgba(208,138,82,.18)'),('--green:#1f7a5a','--green:#2e7a4f')],
 'extra':'''
h1{font-weight:600;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:25px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 22px,rgba(208,138,82,.14) 22px 30px);border:0}
.paytab tr.cur td{background:#e7f1ec}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:23px}}
'''})
