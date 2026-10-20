logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="20" y="12" width="60" height="76" rx="4" fill="none" stroke="#fff" stroke-width="7"/><path d="M50 30c-8 10-12 16-12 24a12 12 0 0024 0c0-8-4-14-12-24z" fill="#d23a2a"/><path d="M66 46v10" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-korpus-sergey.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · КОРПУС · производство · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%232b3036'/><path d='M50 26c-9 11-13 18-13 26a13 13 0 0026 0c0-8-4-15-13-26z' fill='%23d23a2a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#2b3036;--ink2:#3a4048;--y:#c8352a;--y2:#a02a21;--y3:#ff8a7a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f1efee'),('#cfe4d5','#e2dedc'),('#b9cbbd','#c9d6df'),('#93a898','#8a9aa8'),('#d8dce1','#e0e8ee'),('rgba(238,193,112,.2)','rgba(210,58,42,.16)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(210,58,42,.16) 20px 27px);border:0}
.paytab tr.cur td{background:#f1efee}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
