# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="ohrana_kadyrzhan"' in s: raise SystemExit('already')
links=[('dash','Пульт директоров — цифры в телефоне'),('money','Начисления и оплаты'),('subs','База абонентов вместо Excel'),('card','Карточка абонента'),('billing','Счета и акты за месяц'),('remind','Напоминания об оплате и отключении'),('cut','Отключение и включение'),('funnel','Заявки и подключение'),('contracts','Договоры и ЭЦП'),('alarm','Тревоги сейчас'),('map','Карта объектов и экипажей'),('crew','Приложение экипажа · маршрут в 2ГИС'),('journal','Журнал событий'),('lk','Личный кабинет клиента'),('staff','Кадровый учёт'),('apps','Заявления и визы ЭЦП'),('onec','Обмен с 1С'),('site','Сайт и кабинет'),('server','Ваш сервер и безопасность'),('launch','Стоимость: 2,5 млн + 1С и сайт')]
card='''      <div class="tool-card" data-app-id="ohrana_kadyrzhan" data-created="2026-10-23" data-updated="2026-10-23" data-crm-deal-id="deal_site_6b55a2d2-e4d5-4390-bca0-53320b261f56" data-crm-deal-title="Кадыржан · охранное агентство">
        <div class="tool-icon" style="background:#141b24;color:#ff7a6e;font-size:11px;font-weight:900;letter-spacing:.04em">ОХР</div>
        <h3>Охранное агентство: абоненты, пульт, кабинет клиента, кадры (Кадыржан) — Демо + КП</h3>
        <p>Встреча с Кадыржаном (название агентства не раскрыли до согласования с руководством, сравнивают трёх подрядчиков). Сейчас всё в Excel и 1С, оба не справляются: 4 000+ контрагентов, 120 сотрудников, к 2027 — 200. Запрос: <b>убрать Excel и ручные операции</b>; полный цикл абонента — счета, договоры, напоминания об оплате и отключении; <b>личный кабинет клиента</b> с актами, счетами, ЭСФ; <b>пульт для двух директоров</b> в телефоне; кадровый учёт и заявления с визой директора ЭЦП; тревожные кнопки в системе, вызов экипажу с координатами и маршрутом в 2ГИС; сайт (макет готов) с кабинетом и формами; 1С; свой выделенный сервер, NDA. Демо: 20 экранов, 7 ролей. КП: портал 2,5 млн ₸ (10/45/45, 4–6 недель) + 1С 800 тыс. + сайт 800 тыс. = 4,1 млн ₸. Клиент просил последние 45% через месяц после запуска — Платон отказал, оставили 10/45/45. Демо — в понедельник 26.10.</p>
        <a class="tool-cta as-link" href="app/ohrana-kadyrzhan.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/ohrana-kadyrzhan.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-ohrana-kadyrzhan.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 9 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Ohrana.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · портал 2,5 млн + 1С и сайт · 4,1 млн ₸ · PDF 9 страниц</a>
        </div></details>
        <span class="tool-badge new">Демо 26.10</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="sanatoriy_erzhan"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "sanatoriy_erzhan",'
assert a in s; s=s.replace(a,'  { id: "ohrana_kadyrzhan", label: "Охранное агентство (Кадыржан) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
