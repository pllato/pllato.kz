logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M10 38h60v24H10z" fill="#f2b705"/><path d="M70 54h18" stroke="#f2b705" stroke-width="6" stroke-linecap="round"/><circle cx="32" cy="68" r="10" fill="#23292f" stroke="#f2b705" stroke-width="5"/></svg>'
build({'out':ROOT+'/app/kp-pricep-valeriy.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · ТрейлерГо · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2323292f'/><path d='M14 40h56v22H14z' fill='%23f2b705'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#23292f;--ink2:#2c4a5e;--y:#b07f00;--y2:#8a6400;--y3:#f2b705;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#eceeef'),('#cfe4d5','#d6dadd'),('#b9cbbd','#b3b9be'),('#93a898','#8d959b'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#2c4a5e')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#fdf3d2}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#23292f;background:#fdf3d2}
.strip div:last-child b{color:#b07f00}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
