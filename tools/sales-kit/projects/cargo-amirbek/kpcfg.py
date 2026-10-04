logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 90L44 10M74 90L56 10" stroke="#dfe5ea" stroke-width="8" stroke-linecap="round"/><path d="M50 84v-12M50 58v-10M50 36v-8M50 18v-5" stroke="#f0a020" stroke-width="7" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-cargo-amirbek.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Трасса · транспортная экспедиция · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2315191e'/><path d='M28 88L45 12M72 88L55 12' stroke='%23dfe5ea' stroke-width='9' stroke-linecap='round'/><path d='M50 82v-12M50 56v-10M50 34v-8' stroke='%23f0a020' stroke-width='8' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
 'root':'--ink:#15191e;--ink2:#252c34;--y:#c2541b;--y2:#9a4012;--y3:#f0a020;',
 'mono':'IBM Plex Mono','body':'IBM Plex Sans','head':'IBM Plex Sans Condensed','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fbefe6'),('#cfe4d5','#f3d6c2'),('#b9cbbd','#b8c0c8'),('#93a898','#95a0aa'),('#d8dce1','#dde2e7'),('rgba(238,193,112,.2)','rgba(240,160,32,.18)'),('--green:#1f7a5a','--green:#2e7d4f')],
 'extra':'''
h1{font-weight:700;font-size:33px;text-transform:none}.cover h1{font-size:29px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-60px;width:220px;height:320px;border-radius:0;background:none;border-left:26px solid rgba(240,160,32,.14);border-right:26px solid rgba(240,160,32,.14);transform:skewX(-12deg)}
.paytab tr.cur td{background:#fbefe6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:3px}
@media print{h1{font-size:30px}.cover h1{font-size:27px}}
'''})
