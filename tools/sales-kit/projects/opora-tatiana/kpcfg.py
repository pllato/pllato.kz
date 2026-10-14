logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 86 22v26c0 22-15 37-36 44C29 85 14 70 14 48V22z" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><path d="M34 50l11 11 22-24" fill="none" stroke="#ff7a3d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
build({'out':ROOT+'/app/kp-barier-arsen.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Барьер · служба дезинсекции · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23103b3a'/><path d='M34 52l11 11 22-24' fill='none' stroke='%23ff7a3d' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#103b3a;--ink2:#174c4a;--y:#e0652a;--y2:#b84f1d;--y3:#ffb08a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e6f1ef'),('#cfe4d5','#cddfdb'),('#b9cbbd','#c6d5d2'),('#93a898','#879896'),('#d8dce1','#dfe8e6'),('rgba(238,193,112,.2)','rgba(255,122,61,.16)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,122,61,.14) 20px 27px);border:0}
.paytab tr.cur td{background:#e6f1ef}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
