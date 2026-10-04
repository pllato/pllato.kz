logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M30 14v34a12 12 0 0 0 24 0V14" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/><path d="M42 60v28" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/><path d="M66 30a22 22 0 0 1 0 30M76 22a34 34 0 0 1 0 46" fill="none" stroke="#e0684b" stroke-width="6" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-kamerton-akmaral.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Камертон · ЛОР-клиника и центр слуха · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231f2a44'/><path d='M30 16v32a12 12 0 0 0 24 0V16' fill='none' stroke='%23fff' stroke-width='8' stroke-linecap='round'/><path d='M42 60v26' stroke='%23fff' stroke-width='8' stroke-linecap='round'/><path d='M68 32a20 20 0 0 1 0 28' fill='none' stroke='%23e0684b' stroke-width='7' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Commissioner:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,500;0,7..72,600;1,7..72,500&family=Roboto+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1f2a44;--ink2:#2a3756;--y:#2a4a7f;--y2:#1f3a66;--y3:#f0a58f;',
 'mono':'Roboto Mono','body':'Commissioner','head':'Literata','fallback':'serif',
 'colors':[('#e7f2ea','#fbefe9'),('#cfe4d5','#f3d6cb'),('#b9cbbd','#b7c3d8'),('#93a898','#9fb0cc'),('#d8dce1','#e3dfd7'),('rgba(238,193,112,.2)','rgba(240,165,143,.16)'),('--green:#1f7a5a','--green:#3e7d4e')],
 'extra':'''
h1{font-weight:600;font-size:33px;text-transform:none}.cover h1{font-size:28px}h2{font-weight:600;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-60px;top:-60px;width:300px;height:300px;border-radius:50%;background:none;border:2px solid rgba(240,165,143,.28);box-shadow:0 0 0 26px rgba(240,165,143,.06),0 0 0 54px rgba(240,165,143,.04)}
.paytab tr.cur td{background:#fbefe9}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:10px}
.said{border-left-color:#e0684b}
.strip div:last-child b{color:#f0a58f}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
