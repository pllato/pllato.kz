logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:8px;border:2px solid #fff;background:#3a2418"><ellipse cx="42" cy="58" rx="15" ry="26" fill="#f3e7d6"/><ellipse cx="66" cy="34" rx="10" ry="17" fill="#d08a4e"/></svg>'
build({'out':ROOT+'/app/kp-obuv-mukhtar.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · единая система магазинов обуви · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%233a2418'/><ellipse cx='42' cy='58' rx='15' ry='26' fill='%23f3e7d6'/><ellipse cx='66' cy='34' rx='10' ry='17' fill='%23d08a4e'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Golos+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#3a2418;--ink2:#4d3122;--y:#b8682c;--y2:#8a4b1d;--y3:#f0c8a0;',
 'mono':'JetBrains Mono','body':'Golos Text','head':'Golos Text','fallback':'sans-serif',
 'colors':[('#e7f2ea','#f8efe5'),('#cfe4d5','#efd9c2'),('#b9cbbd','#d6c9bb'),('#93a898','#a8988a'),('#d8dce1','#e9e0d6'),('rgba(238,193,112,.2)','rgba(184,104,44,.14)'),('--green:#1f7a5a','--green:#1f8a5b')],
 'extra':'''
h1{font-weight:700;font-size:28px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:24px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-50px;top:-60px;width:220px;height:320px;border-radius:50%;background:rgba(240,200,160,.10);border:0}
.paytab tr.cur td{background:#f8efe5}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
@media print{h1{font-size:27px}.cover h1{font-size:22px}}
'''})
