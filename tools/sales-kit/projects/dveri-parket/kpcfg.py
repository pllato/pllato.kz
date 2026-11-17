logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="28" y="12" width="44" height="72" rx="2" fill="none" stroke="#ffffff" stroke-width="7"/><circle cx="62" cy="50" r="5" fill="#e0b277"/><path d="M12 88h76" stroke="#e0b277" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-dveri-parket.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Дуб и Дверь · двери и паркет: CRM на своём сервере · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%234a2f1f'/><path d='M14 48 50 26l36 22v34H14z' fill='%23e8eef4'/><path d='M12 84q9-6 19 0t19 0 19 0 19 0v6H12z' fill='%23c4904f'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=Golos+Text:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#4a2f1f;--ink2:#6b4428;--y:#9a6a35;--y2:#7a5228;--y3:#c4904f;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Lora','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f8ecd9'),('#cfe4d5','#e9d2b2'),('#b9cbbd','#9fb0c0'),('#93a898','#8a9aaa'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6a5a')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#f8ecd9}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#4a2f1f;background:#f8ecd9}
.strip div:last-child b{color:#c4904f}
.shot img{object-fit:contain!important;object-position:left top;background:#fff}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
