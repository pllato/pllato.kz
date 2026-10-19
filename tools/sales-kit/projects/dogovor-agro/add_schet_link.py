# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
a='<a href="app/dogovor-agro.docx" target="_blank" rel="noopener"><span class="dot"></span>Договор AGR-2026-01 · Word (DOCX)</a>'
assert s.count(a)==1
if 'schet-agro-1.html' not in s:
    s=s.replace(a,a+'\n          <a href="app/schet-agro-1.html" target="_blank" rel="noopener"><span class="dot"></span>Счёт № AGR-С-2026-01 · предоплата 10% · 242 500 ₸ · ТОО «Аграрное»</a>\n          <a class="is-pdf" href="app/schet-agro-1.pdf" target="_blank" rel="noopener"><span class="dot"></span>Счёт на предоплату · PDF</a>')
open(p,'w',encoding='utf-8').write(s)
print('ok')
