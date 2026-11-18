logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="22" y="30" width="56" height="40" rx="8" fill="none" stroke="#ffffff" stroke-width="7"/><path d="M34 30V18M50 30V18M66 30V18M34 70v12M50 70v12M66 70v12" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="50" r="8" fill="#18b6e6"/></svg>'
build({'out':ROOT+'/app/kp-sayt-gennadiy.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · интернет-магазин автоэлектроники · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%2322252a'/><path d='M14 48 50 26l36 22v34H14z' fill='%23e8eef4'/><path d='M12 84q9-6 19 0t19 0 19 0 19 0v6H12z' fill='%2318b6e6'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1d2228;--ink2:#2c333b;--y:#0b7fb0;--y2:#085f85;--y3:#18b6e6;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e2f4fb'),('#cfe4d5','#bfe6f5'),('#b9cbbd','#9fb0c0'),('#93a898','#8a9aaa'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6a5a')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#e2f4fb}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#1d2228;background:#e2f4fb}
.strip div:last-child b{color:#18b6e6}
.shot img{object-fit:contain!important;object-position:left top;background:#fff}

.mock{border:1px solid #c9d3db;border-radius:8px;background:#fff;overflow:hidden;font-size:9.5px}.mock .bar{background:#1d2228;color:#e8f6fc;padding:7px 10px;display:flex;justify-content:space-between;font-weight:700}.mock .bar i{font-style:normal;color:#18b6e6}.mock .in{padding:10px}.mock .srch{display:flex;border:2px solid #18b6e6;border-radius:6px;overflow:hidden;margin:4px 0 8px}.mock .srch span{flex:1;padding:7px 9px;font-family:'JetBrains Mono',monospace;color:#1d2228}.mock .srch b{background:#18b6e6;color:#fff;padding:7px 12px}.mock .chips span{display:inline-block;border:1px solid #c9d3db;border-radius:4px;padding:2px 6px;margin:0 4px 4px 0;color:#2c333b}.mock table{font-size:9px;margin:0}.mock td,.mock th{padding:4px 6px}.mock .ok{color:#1f7a45;font-weight:700}.mock .btn{display:inline-block;background:#1d2228;color:#fff;border-radius:5px;padding:5px 10px;margin-right:6px;font-weight:600}.mock .btn.c{background:#18b6e6}.mock .pn{font-family:'JetBrains Mono',monospace}.mrow{display:grid;grid-template-columns:1.6fr 1fr;gap:12px;align-items:start}.phone{width:200px;border:7px solid #1d2228;border-radius:22px;overflow:hidden;margin:0 auto}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
