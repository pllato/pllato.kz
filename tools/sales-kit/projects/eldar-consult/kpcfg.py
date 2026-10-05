logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M22 8h40l18 18v66H22z" fill="none" stroke="#f4ede2" stroke-width="7" stroke-linejoin="round"/><path d="M62 8v18h18" fill="none" stroke="#f4ede2" stroke-width="6"/><path d="M34 40h30M34 52h22" stroke="#f4ede2" stroke-width="6" stroke-linecap="round"/><circle cx="62" cy="72" r="14" fill="#c99a4a"/><path d="M55 72l5 5 9-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-eldar-consult.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Реестр · лицензирование и готовые фирмы · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%235c1a28'/><path d='M26 14h36l14 14v58H26z' fill='none' stroke='%23f4ede2' stroke-width='7'/><circle cx='60' cy='70' r='13' fill='%23c99a4a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=PT+Mono&family=Onest:wght@400;500;600;700;800&display=swap',
 'root':'--ink:#3e111b;--ink2:#561a27;--y:#7a2337;--y2:#5c1a28;--y3:#e0b56a;',
 'mono':'PT Mono','body':'Onest','head':'Onest','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f6e9ea'),('#cfe4d5','#ead2d5'),('#b9cbbd','#cbb3b6'),('#93a898','#a58e91'),('#d8dce1','#e7ddd2'),('rgba(238,193,112,.2)','rgba(224,181,106,.18)'),('--green:#1f7a5a','--green:#2f7a4f')],
 'extra':'''
h1{font-weight:800;font-size:31px;text-transform:none;letter-spacing:-.02em}.cover h1{font-size:27px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-50px;top:-50px;width:240px;height:240px;border-radius:50%;background:none;border:28px solid rgba(224,181,106,.12)}
.paytab tr.cur td{background:#f6e9ea}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:5px}
@media print{h1{font-size:29px}.cover h1{font-size:25px}}
'''})
