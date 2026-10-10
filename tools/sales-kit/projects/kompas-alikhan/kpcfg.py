logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-width="8"/><path d="M50 18 62 50 50 82 38 50z" fill="#ff6b4a"/><circle cx="50" cy="50" r="6" fill="#fff"/></svg>'
build({'out':ROOT+'/app/kp-kompas-alikhan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Компас · турагентство · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230b4f6c'/><circle cx='50' cy='50' r='32' fill='none' stroke='%23fff' stroke-width='8'/><path d='M50 22 60 50 50 78 40 50z' fill='%23ff6b4a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Rubik:wght@400;500;600;700&display=swap',
 'root':'--ink:#0b4f6c;--ink2:#0f6185;--y:#d2412c;--y2:#a8321f;--y3:#ffb39f;',
 'mono':'JetBrains Mono','body':'Rubik','head':'Rubik','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e6f0f4'),('#cfe4d5','#c7dbe5'),('#b9cbbd','#c7d3db'),('#93a898','#8697a3'),('#d8dce1','#dfe7ec'),('rgba(238,193,112,.2)','rgba(255,107,74,.16)'),('--green:#1f7a5a','--green:#2e7a4f')],
 'extra':'''
h1{font-weight:700;font-size:29px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:25px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 22px,rgba(255,107,74,.16) 22px 30px);border:0}
.paytab tr.cur td{background:#fde9e3}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:10px}
@media print{h1{font-size:27px}.cover h1{font-size:23px}}
'''})
