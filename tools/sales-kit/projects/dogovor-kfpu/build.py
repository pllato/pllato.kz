import re,sys,os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
HERE=os.path.dirname(os.path.abspath(__file__))
s=open(ROOT+'/app/dogovor-saldo.html',encoding='utf-8').read()
head=s[:s.index('<body>')]
head=head.replace('<title>Договор на разработку · САЛЬДО KZ × ELC ALMATY</title>','<title>Договор на разработку № KFPU-2026-01 · Карагандинская Фабрика Подшипниковых Узлов × ELC ALMATY</title>')
assert 'KFPU' in head
head=head.replace('</style></head>','.mut{color:var(--muted);font-size:8.3px}\n</style></head>')
logo=re.search(r'<div class="bm">(<svg.*?</svg>)</div>',s).group(1)
b=open(os.path.join(HERE,'body.html'),encoding='utf-8').read().replace('LOGO',logo,1)
b=b.replace('RUNFOOT','Договор № KFPU-2026-01 · ТОО «ELC ALMATY» × ТОО «Карагандинская Фабрика Подшипниковых Узлов»')
n=b.count('{P}');i=0
def f(m):
    global i;i+=1;return f'{i} из {n}'
b=re.sub(r'\{P\}',f,b)
open(ROOT+'/app/dogovor-kfpu.html','w',encoding='utf-8').write(head+'<body>\n'+b)
print(n,'pages')
