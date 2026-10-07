logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="14" width="72" height="72" fill="none" stroke="#e8f1f7" stroke-width="6"/><path d="M50 6v88M6 50h88" stroke="#e0533a" stroke-width="5" stroke-dasharray="14 6 3 6"/><circle cx="50" cy="50" r="9" fill="#5fb3d9"/></svg>'
build({'out':ROOT+'/app/kp-proekt-timur.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Ось · проектная компания · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%230f2a44'/><rect x='20' y='20' width='60' height='60' fill='none' stroke='%23e8f1f7' stroke-width='7'/><path d='M50 10v80M10 50h80' stroke='%23e0533a' stroke-width='6'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=PT+Mono&family=Onest:wght@400;500;600;700;800&display=swap',
 'root':'--ink:#0f2a44;--ink2:#173a5c;--y:#1f5f8b;--y2:#174a6d;--y3:#5fb3d9;',
 'mono':'PT Mono','body':'Onest','head':'Onest','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e6f1f8'),('#cfe4d5','#c6e1ef'),('#b9cbbd','#c3cfd9'),('#93a898','#8796a5'),('#d8dce1','#dce4eb'),('rgba(238,193,112,.2)','rgba(95,179,217,.16)'),('--green:#1f7a5a','--green:#2e7a4f')],
 'extra':'''
h1{font-weight:800;font-size:29px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:25px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 22px,rgba(95,179,217,.12) 22px 30px);border:0}
.paytab tr.cur td{background:#e6f1f8}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:2px}
@media print{h1{font-size:27px}.cover h1{font-size:23px}}
'''})
