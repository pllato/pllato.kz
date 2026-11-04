logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8a20 20 0 0 1 20 20c0 15-20 34-20 34S30 43 30 28A20 20 0 0 1 50 8z" fill="#f0a020"/><circle cx="50" cy="28" r="7" fill="#17382b"/><path d="M20 68h60v24H20z" fill="#ffffff"/></svg>'
build({'out':ROOT+'/app/kp-distrib-uralsk.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Жайык Дистрибуция · Уральск · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%231f4d3a'/><path d='M50 12a18 18 0 0 1 18 18c0 13-18 30-18 30S32 43 32 30a18 18 0 0 1 18-18z' fill='%23f0a020'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#17382b;--ink2:#1f6b4f;--y:#b8780a;--y2:#8f5d06;--y3:#f0a020;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fdf1da'),('#cfe4d5','#f0dca8'),('#b9cbbd','#a89e94'),('#93a898','#9a928a'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#3d6b4f')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#fdf1da}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#1f6b4f;background:#fdf1da}
.strip div:last-child b{color:#f0a020}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
