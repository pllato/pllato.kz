logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12a38 38 0 1 0 38 38" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="M70 10l20 4-6 19" fill="none" stroke="#2fb67c" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 52l10 10 20-22" fill="none" stroke="#2fb67c" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
build({'out':ROOT+'/app/kp-vozvrat-margulan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Возврат · CRM коллекторского агентства · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2317324d'/><path d='M34 52l11 11 22-24' fill='none' stroke='%232fb67c' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#17324d;--ink2:#21425f;--y:#1f9a66;--y2:#167a50;--y3:#7fe0b0;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e8f0f6'),('#cfe4d5','#cfdde9'),('#b9cbbd','#c9d4df'),('#93a898','#8796a8'),('#d8dce1','#e0e7ee'),('rgba(238,193,112,.2)','rgba(47,182,124,.16)'),('--green:#1f7a5a','--green:#1f9a66')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(47,182,124,.14) 20px 27px);border:0}
.paytab tr.cur td{background:#e8f0f6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
