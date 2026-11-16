logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#ef6c1a"/><rect x="30" y="24" width="38" height="34" rx="3" fill="#fff"/><path d="M20 22v46h56" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="34" cy="78" r="7" fill="#fff"/><circle cx="66" cy="78" r="7" fill="#fff"/></svg>'
build({'out':ROOT+'/app/kp-gruzchiki-crm.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · CRM для бизнеса грузчиков · по ТЗ · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23ef6c1a'/><path d='M20 22v46h56' fill='none' stroke='%23fff' stroke-width='7'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
 'root':'--ink:#1f2329;--ink2:#3a414b;--y:#d0560f;--y2:#a6440b;--y3:#ef6c1a;',
 'mono':'JetBrains Mono','body':'Onest','head':'Onest','fallback':'sans-serif',
 'colors':[('#e7f2ea','#fdf0e6'),('#cfe4d5','#f6cfb2'),('#b9cbbd','#9fb0c0'),('#93a898','#8a9aaa'),('#d8dce1','#e8dfd4'),('rgba(238,193,112,.2)','rgba(217,189,140,.18)'),('--green:#1f7a5a','--green:#1f6a5a')],
 'extra':'''
h1{font-weight:800;font-size:28px;text-transform:none}.cover h1{font-size:25px}h2{font-weight:700;font-size:20px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:lining-nums tabular-nums}
.cover:after{display:none}
.paytab tr.cur td{background:#fdf0e6}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:8px}
.said{border-left-color:#ef6c1a;background:#fdf0e6}
.strip div:last-child b{color:#ef6c1a}
.shot img{object-fit:contain!important;object-position:left top;background:#fff}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
