logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M37 9h26v28h28v26H63v28H37V63H9V37h28z" fill="none" stroke="#5fc6b4" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="50" r="9" fill="#e8b04a"/></svg>'
build({'out':ROOT+'/app/kp-apteka-flow-yerlan.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · BIPHARM · две аптеки · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%230f5b52'/><path d='M39 14h22v25h25v22H61v25H39V61H14V39h25z' fill='%23fff'/><circle cx='50' cy='50' r='8' fill='%23e8b04a'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans+Condensed:wght@500;600;700&family=Fira+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
 'root':'--ink:#0d3b36;--ink2:#14504a;--y:#0f5b52;--y2:#0a4840;--y3:#e8b04a;',
 'mono':'Fira Code','body':'Fira Sans','head':'Fira Sans Condensed','fallback':'sans-serif',
 'colors':[('#e7f2ea','#e1efec'),('#cfe4d5','#c6dfd9'),('#b9cbbd','#a6c2bc'),('#93a898','#8fb3ac'),('#d8dce1','#d6dfdc'),('rgba(238,193,112,.2)','rgba(232,176,74,.18)'),('--green:#1f7a5a','--green:#2b7a3d')],
 'extra':'''
h1{font-weight:600;font-size:34px;text-transform:none}.cover h1{font-size:29px}h2{font-weight:600;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:250px;height:250px;border-radius:0;border:0;background:rgba(232,176,74,.11);clip-path:polygon(35% 0,65% 0,65% 35%,100% 35%,100% 65%,65% 65%,65% 100%,35% 100%,35% 65%,0 65%,0 35%,35% 35%)}
.paytab tr.cur td{background:#e1efec}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.num i{border-radius:2px}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:3px}
.said{border-left-color:#e8b04a}
@media print{h1{font-size:31px}.cover h1{font-size:27px}}
'''})
