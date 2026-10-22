# -*- coding: utf-8 -*-
# Ссылки на счёт LB-С-2026-05 в карточку imghub; старый LB-С-2026-03 помечается как заменённый
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'schet-imghub-ostatok.html' in s: raise SystemExit('already')
old1='<span class="dot"></span>Итоговый счёт № LB-С-2026-03 — платёж 40% · 524 000 ₸ (врем. доступ)</a>'
old2='<span class="dot"></span>Итоговый счёт № LB-С-2026-03 — 524 000 ₸ · PDF</a>'
assert old1 in s and old2 in s
s=s.replace(old1,'<span class="dot"></span>Счёт № LB-С-2026-03 — 524 000 ₸ · заменён счётом LB-С-2026-05</a>')
s=s.replace(old2,'<span class="dot"></span>Счёт № LB-С-2026-03 · PDF · заменён</a>\n'
 '            <a href="app/schet-imghub-ostatok.html" target="_blank" rel="noopener"><span class="dot"></span>Счёт № LB-С-2026-05 — остаток по договору · 474 000 ₸ (врем. доступ)</a>\n'
 '            <a class="is-pdf" href="app/Pllato_Schet_ImgHub_Ostatok_474000.pdf" target="_blank" rel="noopener"><span class="dot"></span>Счёт № LB-С-2026-05 — остаток 474 000 ₸ · PDF ← выставить сейчас</a>')
open(p,'w',encoding='utf-8').write(s)
print('ok')
