logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-width="7"/><path d="M50 18c-9 8 9 14 0 22s9 14 0 22-9 14 0 20" fill="none" stroke="#f26a3d" stroke-width="8" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-bubnovsky-timur.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Центр Бубновского · Уральск · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23173f6e'/><path d='M50 16c-10 9 10 15 0 24s10 15 0 24-10 15 0 20' fill='none' stroke='%23f26a3d' stroke-width='9' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#173f6e;--ink2:#1f4f86;--y:#e0562a;--y2:#b8441f;--y3:#ffb08f;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e8eef7'),('#cfe4d5','#d3deee'),('#b9cbbd','#c9d6df'),('#93a898','#8a9aa8'),('#d8dce1','#e0e8ee'),('rgba(238,193,112,.2)','rgba(242,106,61,.16)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(242,106,61,.16) 20px 27px);border:0}
.paytab tr.cur td{background:#e8eef7}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
