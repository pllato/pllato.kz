logo='<svg width="48" height="48" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#1e2a33"/><path d="M3 26L12 9l5 9 3-5 8 13z" fill="none" stroke="#f2a25a" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9" r="1.7" fill="#f2a25a"/></svg>'
build({'out':ROOT+'/app/kp-skala-site.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Скала · сайт с кабинетом и CRM · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%231e2a33'/><path d='M50 12a18 18 0 0 1 18 18c0 13-18 30-18 30S32 43 32 30a18 18 0 0 1 18-18z' fill='%23f0a020'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1e2a33;--ink2:#2b3a46;--y:#c9711f;--y2:#9a5512;--y3:#f2a25a;',
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
.said{border-left-color:#1e2a33;background:#fdf1da}
.strip div:last-child b{color:#f0a020}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
