logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="26" fill="none" stroke="#ffffff" stroke-width="7"/><circle cx="50" cy="50" r="9" fill="#d7261e"/><path d="M50 16v12M50 72v12M16 50h12M72 50h12" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-zapchasti-berik.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · ПартсМаркет · автозапчасти, склад и сайт · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%2322252a'/><path d='M14 48 50 26l36 22v34H14z' fill='%23e8eef4'/><path d='M12 84q9-6 19 0t19 0 19 0 19 0v6H12z' fill='%23d7261e'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#22252a;--ink2:#33373e;--y:#b81f18;--y2:#8f1812;--y3:#d7261e;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fbe6e3'),('#cfe4d5','#f2c4bf'),('#b9cbbd','#9fb0c0'),('#93a898','#8a9aaa'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6a5a')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#fbe6e3}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#22252a;background:#fbe6e3}
.strip div:last-child b{color:#d7261e}
.shot img{object-fit:contain!important;object-position:left top;background:#fff}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
