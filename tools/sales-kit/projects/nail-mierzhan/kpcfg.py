logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="40" y="10" width="20" height="32" rx="4" fill="#e7c9b8"/><path d="M28 42h44v38a9 9 0 0 1-9 9H37a9 9 0 0 1-9-9z" fill="#c48b72"/><path d="M38 60h24" stroke="#5a1a2b" stroke-width="5" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-nail-mierzhan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Лакмус Про · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%235a1a2b'/><path d='M30 44h40v34a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z' fill='%23c48b72'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=Lora:wght@600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#2b1118;--ink2:#7a2238;--y:#a8664f;--y2:#7d4636;--y3:#e2b39c;',
 'mono':'JetBrains Mono','body':'Onest','head':'Lora','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f6e6e3'),('#cfe4d5','#ecd2cc'),('#b9cbbd','#cbb0b4'),('#93a898','#9a8085'),('#d8dce1','#eadfdc'),('rgba(238,193,112,.2)','rgba(226,179,156,.22)'),('--green:#1f7a5a','--green:#7a2238')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#f8e8df}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#7a2238;background:#f8e8df}
.strip div:last-child b{color:#a8664f}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
