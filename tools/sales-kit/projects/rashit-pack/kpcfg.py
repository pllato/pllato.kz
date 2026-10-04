logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12a38 38 0 1 1-35 23" fill="none" stroke="#c99a5b" stroke-width="9" stroke-linecap="round"/><path d="M6 28l10 12 12-9" fill="none" stroke="#c99a5b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 42l16-8 16 8v18l-16 8-16-8z" fill="none" stroke="#5fb27e" stroke-width="7" stroke-linejoin="round"/></svg>'
build({'out':ROOT+'/app/kp-rashit-pack.html','pages':HERE+'/kp_pages.html','logo':logo,
 'fixes':[('<tr><td>«Воронки нет» · реклама есть</td>','<tr><td>Воронка продаж? — «Нет, ничего нет пока». Реклама есть</td>')],
 'title':'Коммерческое предложение · Цикл · коробки и вторсырьё · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%2320251f'/><path d='M50 16a34 34 0 1 1-31 20' fill='none' stroke='%23c99a5b' stroke-width='9' stroke-linecap='round'/><path d='M34 42l16-8 16 8v18l-16 8-16-8z' fill='none' stroke='%235fb27e' stroke-width='7'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&family=PT+Sans:ital,wght@0,400;0,700;1,400&display=swap',
 'root':'--ink:#20251f;--ink2:#2d332b;--y:#9a6a32;--y2:#7a5226;--y3:#c99a5b;',
 'mono':'PT Mono','body':'PT Sans','head':'PT Sans Narrow','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f3e9da'),('#cfe4d5','#e6d2b4'),('#b9cbbd','#aeb6ab'),('#93a898','#97a095'),('#d8dce1','#dcdfd9'),('rgba(238,193,112,.2)','rgba(201,154,91,.18)'),('--green:#1f7a5a','--green:#2f7a4f')],
 'extra':'''
h1{font-weight:700;font-size:35px;text-transform:none}.cover h1{font-size:31px}h2{font-weight:700;font-size:19px;text-transform:uppercase;letter-spacing:.02em}
.hd h2{text-transform:uppercase}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-50px;top:-50px;width:280px;height:280px;border-radius:50%;background:none;border:30px solid rgba(201,154,91,.13);border-left-color:transparent}
.paytab tr.cur td{background:#f3e9da}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.num i{border-radius:2px}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:2px}
@media print{h1{font-size:32px}.cover h1{font-size:28px}}
'''})
