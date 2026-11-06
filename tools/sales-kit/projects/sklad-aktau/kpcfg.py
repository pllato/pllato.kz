logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 48 50 26l36 22v34H14z" fill="#ffffff"/><path d="M26 56h48v8H26zm0 12h48v8H26z" fill="#0d2a44"/><path d="M12 84q9-6 19 0t19 0 19 0 19 0v6H12z" fill="#ff7a1a"/></svg>'
build({'out':ROOT+'/app/kp-sklad-aktau.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Каспий Терминал · Актау · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%230d2a44'/><path d='M14 48 50 26l36 22v34H14z' fill='%23e8eef4'/><path d='M12 84q9-6 19 0t19 0 19 0 19 0v6H12z' fill='%23ff7a1a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#0d2a44;--ink2:#145a8a;--y:#c45a0c;--y2:#9a4508;--y3:#ff7a1a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#ffeedd'),('#cfe4d5','#f6d2b3'),('#b9cbbd','#9fb0c0'),('#93a898','#8a9aaa'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6a5a')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#ffeedd}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#145a8a;background:#ffeedd}
.strip div:last-child b{color:#ff7a1a}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
