logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#0f4a52"><path d="M50 18C38 36 30 48 30 60a20 20 0 0040 0c0-12-8-24-20-42z" fill="#fff"/><path d="M40 62c4 7 12 8 17 3" stroke="#c9a24a" stroke-width="6" fill="none" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-sanatoriy-erzhan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · санаторий · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230f4a52'/><path d='M50 18C38 36 30 48 30 60a20 20 0 0040 0c0-12-8-24-20-42z' fill='%23fff'/><path d='M40 62c4 7 12 8 17 3' stroke='%23c9a24a' stroke-width='6' fill='none' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#0f4a52;--ink2:#1a5c65;--y:#c08a2a;--y2:#9a6c1c;--y3:#ecd9a8;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f6efe0'),('#cfe4d5','#ecdcb8'),('#b9cbbd','#c3d6d8'),('#93a898','#86a0a4'),('#d8dce1','#e0e9ea'),('rgba(238,193,112,.2)','rgba(192,138,42,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 20px,rgba(255,255,255,.12) 20px 27px);border:0}
.paytab tr.cur td{background:#f6efe0}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
