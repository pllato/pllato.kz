logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="18" y="10" width="64" height="80" rx="3" fill="none" stroke="#d9a35b" stroke-width="7"/><path d="M50 10v80" stroke="#d9a35b" stroke-width="6"/><path d="M42 44v12M58 44v12" stroke="#f3ece2" stroke-width="6" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-mebel-vasiliy.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Корпус · мебель на заказ · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%232b2420'/><rect x='22' y='14' width='56' height='72' rx='3' fill='none' stroke='%23d9a35b' stroke-width='8'/><path d='M50 14v72' stroke='%23d9a35b' stroke-width='7'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
 'root':'--ink:#2b2420;--ink2:#3a312b;--y:#8a5a2e;--y2:#6b4422;--y3:#d9a35b;',
 'mono':'Source Code Pro','body':'Source Sans 3','head':'Lora','fallback':'serif',
 'colors':[('#e7f2ea','#f5ece1'),('#cfe4d5','#ead8c2'),('#b9cbbd','#c9bcae'),('#93a898','#a59684'),('#d8dce1','#e4ddd3'),('rgba(238,193,112,.2)','rgba(217,163,91,.18)'),('--green:#1f7a5a','--green:#3d7a3d')],
 'extra':'''
h1{font-weight:600;font-size:32px;text-transform:none}.cover h1{font-size:28px}h2{font-weight:600;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-30px;top:-40px;width:200px;height:300px;border-radius:4px;background:none;border:22px solid rgba(217,163,91,.13)}
.paytab tr.cur td{background:#f5ece1}
.paytab tr.gift td{background:#e7f2e5;color:#2d5e2d}.paytab tr.gift s{color:#8a8a8a;font-weight:400;margin-right:4px}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:4px}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
