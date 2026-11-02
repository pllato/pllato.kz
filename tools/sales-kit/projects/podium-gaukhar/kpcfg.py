logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="4" y="4" width="92" height="92" fill="none" stroke="#f7f3ee" stroke-width="4"/><path d="M18 70c14 0 24-3 32-13l11-17h7l3 9c3 9 9 13 13 14v7H58l-4-6-6 6H18z" fill="#f7f3ee"/></svg>'
build({'out':ROOT+'/app/kp-podium-gaukhar.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Подиум · бутики обуви и аксессуаров · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a1715'/><path d='M14 70c14 0 24-3 32-13l11-17h7l3 9c3 9 9 13 15 14v7H56l-4-6-6 6H14z' fill='%23f7f3ee'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Golos+Text:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1a1715;--ink2:#2a2522;--y:#8c2f39;--y2:#6e2430;--y3:#d9bd8c;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Playfair Display','fallback':'serif',
 'colors':[('#e7f2ea','#f5e6e6'),('#cfe4d5','#e8cfcf'),('#b9cbbd','#a89e94'),('#93a898','#9a928a'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#3d6b4f')],
 'extra':'''
h1{font-weight:600;font-size:32px;text-transform:none}.cover h1{font-size:28px}h2{font-weight:600;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#f5e6e6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:0}
.said{border-left-color:#8c2f39;background:#f5e6e6}
.strip div:last-child b{color:#d9bd8c}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
