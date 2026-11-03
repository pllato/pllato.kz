logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 40h72l-8 44H22z" fill="#ffffff"/><path d="M24 52h52M27 64h46M30 76h40" stroke="#24272b" stroke-width="5"/><circle cx="36" cy="30" r="10" fill="#d23c48"/><circle cx="52" cy="26" r="10" fill="#d23c48"/><circle cx="67" cy="31" r="9" fill="#d23c48"/></svg>'
build({'out':ROOT+'/app/kp-yashik-dmitriy.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Карасу Тара · производство ящиков · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2324272b'/><circle cx='36' cy='40' r='12' fill='%23d23c48'/><circle cx='60' cy='40' r='12' fill='%23d23c48'/><path d='M18 56h64l-8 28H26z' fill='%23fff'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#24272b;--ink2:#c8323f;--y:#c8323f;--y2:#a52833;--y3:#f08a92;',
 'mono':'JetBrains Mono','body':'Source Sans 3','head':'Source Sans 3','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fbe9ea'),('#cfe4d5','#f0dca8'),('#b9cbbd','#a89e94'),('#93a898','#9a928a'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#3d6b4f')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#fbe9ea}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#c8323f;background:#fbe9ea}
.strip div:last-child b{color:#f08a92}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
