# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="korpus_sergey"' in s: raise SystemExit('already')
links=[('dash','Пульт руководителя'),('inbox','Единый чат: WhatsApp, Telegram, MAX, Instagram'),('calls','Телефония: один номер, распределение'),('funnel','Жёсткая воронка продаж'),('deal','Карточка сделки: чек-лист и сроки'),('sla','Просрочки и объяснения'),('counter','Контрагенты и аффилированность'),('prod','Производство по участкам'),('post','Пост участка с телефона'),('supply','Закупка и логистика'),('stock','Склады и остатки из 1С'),('onec','Обмен с 1С (OData)'),('analytics','Источники и воронка'),('builder','Конструктор воронок и отделов'),('costs','Тарифы в месяц'),('launch','Стоимость: 2,5 млн + 1С 800 тыс.')]
card='''      <div class="tool-card" data-app-id="korpus_sergey" data-created="2026-10-20" data-updated="2026-10-20">
        <div class="tool-icon" style="background:#2b3036;color:#e0483a;font-size:11px;font-weight:900;letter-spacing:.04em">ПОЖ</div>
        <h3>КОРПУС · металлические корпуса и пожарное оборудование (Сергей Ена, Александр Сторожев) — Демо + КП</h3>
        <p>Встреча 20 октября: производство металлических корпусных изделий и пожарного оборудования, филиалы (Алматы, Актобе, планируют ещё), 50–70 пользователей. Работа децентрализована (WhatsApp, звонки, почта, 1С). Нужно: <b>один источник для всего предприятия</b>; единый чат WhatsApp, Telegram, MAX, Instagram, почта; <b>один многоканальный номер</b> с распределением по регионам и всплывающим окном (Beeline «Онлайн АТС» планируют); <b>жёсткая воронка</b> с обязательными полями, сроками этапов, просрочками и обязательным объяснением; сделка на каждый запрос, контрагенты и <b>аффилированность</b>; <b>параллельные воронки производства и закупки</b> с ответом; посты участков с телефона; <b>обмен с 1С без двойного ввода</b> (остатки, счета, реализации); аналитика Яндекс/Google/сайт/Instagram; добавлять отделы. Просили расписать тарифы. 1С на своём физическом сервере. Сравнивают 2–3 предложения. Демо: 16 экранов, 5 ролей. КП: 2 500 000 ₸ + обмен с 1С 800 000 ₸ = 3 300 000 ₸, 10/45/45 (330 000 / 1 485 000 / 1 485 000), 4–6 недель.</p>
        <a class="tool-cta as-link" href="app/korpus-sergey.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/korpus-sergey.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-korpus-sergey.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 11 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Korpus.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 3 300 000 ₸ (2,5 млн + 1С) · PDF 11 страниц</a>
        </div></details>
        <span class="tool-badge new">Демо 21.10</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="tigers_alibek"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "tigers_alibek",'
assert a in s; s=s.replace(a,'  { id: "korpus_sergey", label: "КОРПУС · корпуса и пожарное оборудование (Сергей) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
