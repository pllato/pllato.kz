logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 14h34l16 16v56H26z" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/><path d="M38 50h26M38 62h26M38 74h16" stroke="#d08442" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-svod-vladimir.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · СВОД · документооборот · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23173a3a'/><path d='M36 50h28M36 64h28M36 78h18' stroke='%23d08442' stroke-width='9' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#173a3a;--ink2:#214c4c;--y:#c0702c;--y2:#9a5520;--y3:#e9a46a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#ebf2f1'),('#cfe4d5','#d6e4e2'),('#b9cbbd','#c9d6df'),('#93a898','#8a9aa8'),('#d8dce1','#e0e8ee'),('rgba(238,193,112,.2)','rgba(208,132,66,.18)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(208,132,66,.18) 20px 27px);border:0}
.paytab tr.cur td{background:#ebf2f1}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
