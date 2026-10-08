logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M18 30h10l8 38h40l8-28H32" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><circle cx="42" cy="80" r="6" fill="#7fb0ff"/><circle cx="70" cy="80" r="6" fill="#7fb0ff"/></svg>'
build({'out':ROOT+'/app/kp-shop-101kz.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · 101kz · интернет-магазин · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%23101725'/><path d='M18 30h10l8 38h40l8-28H32' fill='none' stroke='%23fff' stroke-width='8'/><circle cx='42' cy='80' r='6' fill='%237fb0ff'/><circle cx='70' cy='80' r='6' fill='%237fb0ff'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
 'root':'--ink:#101725;--ink2:#1a2233;--y:#2f6fed;--y2:#1c4fb8;--y3:#7fb0ff;',
 'mono':'IBM Plex Mono','body':'IBM Plex Sans','head':'IBM Plex Sans','fallback':'sans-serif',
 'colors':[('#e7f2ea','#eaf1fe'),('#cfe4d5','#c3d8fb'),('#b9cbbd','#c6cfdc'),('#93a898','#8d97a8'),('#d8dce1','#e0e5ee'),('rgba(238,193,112,.2)','rgba(127,176,255,.18)'),('--green:#1f7a5a','--green:#2e7a4f')],
 'extra':'''
h1{font-weight:700;font-size:29px;text-transform:none;letter-spacing:-.015em}.cover h1{font-size:25px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:repeating-linear-gradient(135deg,transparent 0 22px,rgba(47,111,237,.22) 22px 30px);border:0}
.paytab tr.cur td{background:#eaf1fe}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:2px}

.arch{display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:8px;align-items:stretch;position:relative}
.arch .ab{border:1px solid var(--line);background:#fafbfd;padding:11px 12px}
.arch .ab.main{background:var(--ink);color:#fff;border-color:var(--ink)}
.arch .ab code{font:600 7px 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--y2)}.arch .ab.main code{color:#7fb0ff}
.arch .ab b{display:block;font-size:12.5px;margin:4px 0 6px}
.arch ul{margin:0;padding-left:14px;font-size:9.4px;line-height:1.6}.arch .ab.main ul{color:#c9d6ea}
.cap .url{display:block;font:500 7.6px 'IBM Plex Mono',monospace;color:var(--y2);margin-top:2px}
.mobs{display:grid;grid-template-columns:repeat(3,26mm) 1fr;gap:8px;align-items:end;margin-top:8px}
.mobs div img{width:100%;height:46mm;object-fit:cover;object-position:top;border:1px solid var(--line);border-radius:6px;display:block}
.mobs div span{display:block;font:500 7.4px 'IBM Plex Mono',monospace;color:var(--muted);margin-top:3px;text-align:center}
.mobs p{font-size:9.6px;align-self:center}
@media print{h1{font-size:27px}.cover h1{font-size:23px}}
'''})
