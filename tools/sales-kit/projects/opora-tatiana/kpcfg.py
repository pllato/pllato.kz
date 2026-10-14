logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 10 88 30v8H12v-8z" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/><path d="M22 42v34M40 42v34M60 42v34M78 42v34" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M10 86h80" stroke="#e2b04a" stroke-width="8" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-opora-tatiana.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Опора · выход на пенсию · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%234a1f38'/><path d='M34 52l11 11 22-24' fill='none' stroke='%23e2b04a' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#4a1f38;--ink2:#5a2845;--y:#b07a1a;--y2:#8a5e12;--y3:#f0cd7c;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f6edf1'),('#cfe4d5','#e6d6dd'),('#b9cbbd','#d9ccc6'),('#93a898','#9a8890'),('#d8dce1','#ece3df'),('rgba(238,193,112,.2)','rgba(226,176,74,.18)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(226,176,74,.16) 20px 27px);border:0}
.paytab tr.cur td{background:#f6edf1}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
