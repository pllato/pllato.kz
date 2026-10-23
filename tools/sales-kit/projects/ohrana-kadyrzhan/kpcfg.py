logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#141b24"><path d="M50 16l26 10v20c0 17-11 29-26 35C35 75 24 63 24 46V26z" fill="#fff"/><path d="M50 32v30M38 47h24" stroke="#e0453a" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-ohrana-kadyrzhan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · охранное агентство · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23141b24'/><path d='M50 16l26 10v20c0 17-11 29-26 35C35 75 24 63 24 46V26z' fill='%23fff'/><path d='M50 32v30M38 47h24' stroke='%23e0453a' stroke-width='7' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#141b24;--ink2:#222c39;--y:#e0453a;--y2:#b8352c;--y3:#ffc9c3;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fbecea'),('#cfe4d5','#f3d3cf'),('#b9cbbd','#c9d2dc'),('#93a898','#8b98a8'),('#d8dce1','#e2e6ec'),('rgba(238,193,112,.2)','rgba(224,69,58,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.10) 20px 27px);border:0}
.paytab tr.cur td{background:#fbecea}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
