logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="18" y="22" width="64" height="44" fill="none" stroke="#f2c230" stroke-width="6"/><path d="M28 32v24M36 32v24M42 32v24M50 32v24M56 32v24M64 32v24M72 32v24" stroke="#ffffff" stroke-width="3"/><path d="M30 78l10 8 20-16" fill="none" stroke="#3ccf7a" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-sklad-rakhat.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Дала Трейд · склад без пересорта · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%231d2126'/><path d='M14 48 50 26l36 22v34H14z' fill='%23e8eef4'/><path d='M12 84q9-6 19 0t19 0 19 0 19 0v6H12z' fill='%23f2c230'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1d2126;--ink2:#2c3a47;--y:#a37a00;--y2:#7d5d00;--y3:#f2c230;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fdf4d3'),('#cfe4d5','#efe0a6'),('#b9cbbd','#9fb0c0'),('#93a898','#8a9aaa'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6a5a')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#fdf4d3}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#2c3a47;background:#fdf4d3}
.strip div:last-child b{color:#d9a400}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
