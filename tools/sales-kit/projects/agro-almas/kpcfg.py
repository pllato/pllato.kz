logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 90V30" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M50 38c-14-2-22-12-22-24 14 2 22 12 22 24zm0 0c14-2 22-12 22-24-14 2-22 12-22 24zM50 58c-14-2-22-12-22-24 14 2 22 12 22 24zm0 0c14-2 22-12 22-24-14 2-22 12-22 24z" fill="#e0a530"/><path d="M14 90h72" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-agro-almas.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Дала · цифровое хозяйство · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231f3d2b'/><path d='M50 84V34' stroke='%23fff' stroke-width='7'/><path d='M50 42c-12-2-19-10-19-21 12 2 19 10 19 21zm0 0c12-2 19-10 19-21-12 2-19 10-19 21z' fill='%23e0a530'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#1f3d2b;--ink2:#2a5039;--y:#b7801c;--y2:#8e6213;--y3:#f0c46a;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#edf3e8'),('#cfe4d5','#d6e2cf'),('#b9cbbd','#cfccbc'),('#93a898','#8b9285'),('#d8dce1','#e3e1d5'),('rgba(238,193,112,.2)','rgba(224,165,48,.18)'),('--green:#1f7a5a','--green:#2e7a4f')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(170deg,transparent 0 18px,rgba(224,165,48,.16) 18px 24px);border:0}
.paytab tr.cur td{background:#edf3e8}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
