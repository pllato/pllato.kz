import subprocess,sys
subprocess.run([sys.executable,HERE+'/gen.py'],check=True)
logo='<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a978" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M9 21V7l6-4 6 4v14"/><path d="M9 12h6"/><path d="M3 21V11l6-3"/></svg>'
build({'out':ROOT+'/app/kp-nedvizhimost-zadachi.html','pages':HERE+'/kp_pages.html','logo':logo,
 'title':'Дополнительное предложение · Менеджер задач CRM · Недвижимость · Pllato',
 'fav':"<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='4' fill='%230a1628'/><path d='M5 20h14M9 20V8l5-3 5 3v12M9 12h5' fill='none' stroke='%23d4a978' stroke-width='1.8' stroke-linecap='round'/></svg>\">",
 'fonts':'https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Serif:wght@400;700&family=PT+Sans:ital,wght@0,400;0,700;1,400&display=swap',
 'root':'--ink:#0a1628;--ink2:#142339;--y:#b8895a;--y2:#8f6740;--y3:#d4a978;',
 'mono':'PT Mono','body':'PT Sans','head':'PT Serif','fallback':'serif',
 'colors':[('#e7f2ea','#f4ece2'),('#cfe4d5','#e6d3bd'),('#b9cbbd','#b9c2cf'),('#93a898','#8c97a8'),('#d8dce1','#e6e3da'),('rgba(238,193,112,.2)','rgba(212,169,120,.18)'),('--green:#1f7a5a','--green:#3f7d52')],
 'extra':'''
h1{font-weight:700;font-size:31px;text-transform:none}.cover h1{font-size:27px}h2{font-weight:700;font-size:19px}
td.r,.cvs b,.strip b,.pay b{font-variant-numeric:tabular-nums}
.cover:after{right:-40px;top:-40px;width:240px;height:240px;border-radius:0;background:none;border:26px solid rgba(212,169,120,.12);transform:rotate(45deg)}
.paytab tr.cur td{background:#f4ece2}
th.r{text-align:right}
.paytab td span{display:block;font-size:8px;color:var(--muted)}
.est td{vertical-align:top;padding-top:6px;padding-bottom:6px}.est td span{font-size:8.2px;line-height:1.4;margin-top:2px}
.card,.shot,.pay div,.strip,.quote,.said,.compare{border-radius:3px}
.tzs{font-size:8.3px;line-height:1.48;color:#1d2630}
.tzs h3{font:700 11.2px 'PT Serif',serif;margin:9px 0 3px;color:#0a1628;border-bottom:1px solid #e6e3da;padding-bottom:2px}
.tzs p{margin:0 0 4px}.tzs ul{margin:0 0 4px;padding-left:15px}.tzs li{margin:0 0 1.5px}
.tzs mark{background:#f4ece2;color:#8f6740;padding:0 3px;font-weight:700}
.tzs p.ed{background:#f4ece2;border-left:3px solid #b8895a;padding:6px 9px}
.tzs table.tt{width:100%;border-collapse:collapse;margin:3px 0 6px;font-size:7.9px}
.tzs .tt th,.tzs .tt td{border:1px solid #e6e3da;padding:2.5px 5px;text-align:left;vertical-align:top;line-height:1.38}
.tzs .tt th{background:#f7f6f1;font-weight:700;color:#0a1628}
.tzs .tt td:first-child{font-weight:700}
.tzs .tt.c td+td,.tzs .tt.c th+th{text-align:center}
@media print{h1{font-size:29px}.cover h1{font-size:25px}}
'''})
