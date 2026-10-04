logo='<svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true"><path d="M10 13h80" stroke="#d9a441" stroke-width="7" stroke-linecap="round"/><path d="M15 18v70c13 0 21-17 24-37 2-13 0-24-5-33z" fill="#c4472f"/><path d="M85 18v70c-13 0-21-17-24-37-2-13 0-24 5-33z" fill="#c4472f"/><path d="M39 88h22" stroke="#f3efe8" stroke-width="5" stroke-linecap="round"/></svg>'
build({'out':ROOT+'/app/kp-eventflow-inna.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Коммерческое предложение · Кулиса · система event-агентства · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%231d1b21'/><path d='M18 21v62c11 0 18-15 21-32 2-11 0-21-4-30z' fill='%23c4472f'/><path d='M82 21v62c-11 0-18-15-21-32-2-11 0-21 4-30z' fill='%23c4472f'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:wght@400;600;700;800&display=swap',
 'root':'--ink:#1d1b21;--ink2:#2c2a31;--y:#b5432c;--y2:#8f321f;--y3:#d9a441;',
 'mono':'JetBrains Mono','body':'Source Sans 3','head':'Lora',
 'colors':[('#e7f2ea','#f8ebe5'),('#cfe4d5','#efcfc4'),('#b9cbbd','#b4aca2'),('#93a898','#a1988e'),('#d8dce1','#ddd6cc'),('rgba(238,193,112,.2)','rgba(217,164,65,.16)'),('#fbf3e4','#f8f2e6')],
 'extra':'''
h1{font-weight:600;font-size:33px}.cover h1{font-size:30px;font-weight:600}h2{font-weight:600;font-size:18px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-30px;top:-10px;width:230px;height:230px;border-radius:0;background:repeating-linear-gradient(90deg,rgba(196,71,47,.18) 0 14px,transparent 14px 30px);clip-path:polygon(0 0,100% 0,100% 100%,60% 70%)}
.chainrow{display:flex;align-items:stretch;gap:0;margin:2px 0 8px}
.chainrow div{flex:1;border:1px solid var(--line);border-left:3px solid var(--ink);padding:7px 8px;background:#f8f5f0}
.chainrow div.hl{border-left-color:var(--y);background:#f8ebe5}
.chainrow b{display:block;font:600 10px 'Lora',serif}
.chainrow span{display:block;font-size:7.8px;color:var(--muted);line-height:1.35;margin-top:2px}
.chainrow i{align-self:center;font-style:normal;color:var(--y);font-weight:700;padding:0 3px;font-size:13px}
.paytab tr.cur td{background:#f8ebe5}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.num i{border-radius:50%}
.said p{font-family:'Lora',serif}
@media print{h1{font-size:30px}.cover h1{font-size:27px}.chainrow span{font-size:7.4px}}
'''})
