logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="8" y="22" width="84" height="64" rx="4" fill="none" stroke="#ffffff" stroke-width="7"/><path d="M8 42h84M38 22v20M62 22v20" stroke="#ffffff" stroke-width="7"/><rect x="40" y="56" width="20" height="14" fill="#e2a52b"/></svg>'
build({'out':ROOT+'/app/kp-tauar-nursultan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Тауар · опт и розница · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2324345a'/><rect x='14' y='28' width='72' height='54' fill='none' stroke='%23fff' stroke-width='7'/><rect x='40' y='58' width='20' height='12' fill='%23e2a52b'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#24345a;--ink2:#2f4270;--y:#c98a12;--y2:#a87410;--y3:#f3c66b;',
 'mono':'JetBrains Mono','body':'Onest','head':'Onest','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fbf0d6'),('#cfe4d5','#f0dca8'),('#b9cbbd','#a89e94'),('#93a898','#9a928a'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#3d6b4f')],
 'extra':'''
h1{font-weight:600;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:600;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#fbf0d6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#e2a52b;background:#fbf0d6}
.strip div:last-child b{color:#f3c66b}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
