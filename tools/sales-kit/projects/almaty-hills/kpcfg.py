logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M6 78l24-30 14 16 18-28 32 42z" fill="#f6f1e7"/><path d="M36 30a14 14 0 1 1 28 0v16M36 30v16" fill="none" stroke="#d9a441" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-almaty-hills.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Almaty Hills · конноспортивный клуб · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%231d3b30'/><path d='M8 80l24-30 14 16 18-28 28 42z' fill='%23f6f1e7'/><path d='M36 30a14 14 0 1 1 28 0v14M36 30v14' fill='none' stroke='%23d9a441' stroke-width='8' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1d3b30;--ink2:#28493c;--y:#b0703c;--y2:#8f5a2f;--y3:#e7c27a;',
 'mono':'IBM Plex Mono','body':'Source Sans 3','head':'Lora','fallback':'serif',
 'colors':[('#e7f2ea','#f6ebde'),('#cfe4d5','#e3c39f'),('#b9cbbd','#b9c9bd'),('#93a898','#9fb4a6'),('#d8dce1','#e4dccd'),('rgba(238,193,112,.2)','rgba(231,194,122,.18)'),('--green:#1f7a5a','--green:#3e7d4e')],
 'extra':'''
h1{font-weight:600;font-size:33px;text-transform:none}.cover h1{font-size:28px}h2{font-weight:600;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;bottom:-10px;top:auto;width:320px;height:150px;border-radius:0;background:linear-gradient(135deg,transparent 48%,rgba(231,194,122,.14) 49%),linear-gradient(225deg,transparent 48%,rgba(231,194,122,.09) 49%)}
.paytab tr.cur td{background:#f6ebde}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:3px}
.said{border-left-color:#b0703c;background:#f6ebde}
.strip div:last-child b{color:#e7c27a}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
