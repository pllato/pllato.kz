logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><rect x="10" y="10" width="36" height="36" rx="9" fill="#23935f"/><rect x="54" y="10" width="36" height="36" rx="9" fill="#1f7aa8"/><rect x="10" y="54" width="36" height="36" rx="9" fill="#c98a1b"/><rect x="54" y="54" width="36" height="36" rx="9" fill="#c4506e"/></svg>'
build({'out':ROOT+'/app/kp-kvarta-sanzhar.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Кварта · B2B-платформа аутсорсинга · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='8' y='8' width='38' height='38' rx='9' fill='%2323935f'/><rect x='54' y='8' width='38' height='38' rx='9' fill='%231f7aa8'/><rect x='8' y='54' width='38' height='38' rx='9' fill='%23c98a1b'/><rect x='54' y='54' width='38' height='38' rx='9' fill='%23c4506e'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=Geologica:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600&family=Wix+Madefor+Text:wght@400;500;600;700&display=swap',
 'root':'--ink:#15171d;--ink2:#232733;--y:#2f5bea;--y2:#2147c9;--y3:#8fa9ff;',
 'mono':'Source Code Pro','body':'Wix Madefor Text','head':'Geologica','fallback':'sans-serif',
 'colors':[('#e7f2ea','#eef2ff'),('#cfe4d5','#d6e0fd'),('#b9cbbd','#aab2c3'),('#93a898','#9aa3b5'),('#d8dce1','#e4e7ee'),('rgba(238,193,112,.2)','rgba(143,169,255,.16)'),('--green:#1f7a5a','--green:#23935f')],
 'extra':'''
h1{font-weight:600;font-size:33px;text-transform:none}.cover h1{font-size:28px}h2{font-weight:600;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-30px;top:-30px;width:230px;height:230px;border-radius:0;background:conic-gradient(from 0deg,rgba(35,147,95,.18) 0 25%,rgba(31,122,168,.18) 0 50%,rgba(196,80,110,.18) 0 75%,rgba(201,138,27,.18) 0);-webkit-mask:radial-gradient(circle,#000 0 60%,transparent 61%);mask:radial-gradient(circle,#000 0 60%,transparent 61%)}
.paytab tr.cur td{background:#eef2ff}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:10px}
.said{border-left-color:#2f5bea;background:#eef2ff}
@media print{h1{font-size:30px}.cover h1{font-size:26px}}
'''})
