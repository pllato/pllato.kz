# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="zapchasti_sultan"' in s: raise SystemExit('already')
links=[('dash','Пульт владельца'),('money','Журнал оплат'),('groups','Продажи вместо групп'),('orders','Заказы клиентов'),('clients','Клиенты и кэшбэк'),('debts','Долги клиентов'),('nakl','Накладные'),('catalog','Каталог и прайс'),('stock','Остатки'),('income','Приход контейнеров'),('inv','Инвентаризация'),('purchase','Что заказать'),('site','Сайт с каталогом'),('launch','Стоимость: 2 000 000 ₸')]
card='''      <div class="tool-card" data-app-id="zapchasti_sultan" data-created="2026-10-29" data-updated="2026-10-29" data-crm-deal-id="deal_site_6db17c47-6427-49cf-b3a3-efe043730cfc" data-transcript-id="zoom:pmeet_crm-0c785793-9a4b-475a-a011-4ba80b7d3626-1793259968969_transcript" data-crm-deal-title="Султан · запчасти на спецтехнику">
        <div class="tool-icon" style="background:#262b30;color:#f39a4a;font-size:11px;font-weight:900;letter-spacing:.04em">ЗАП</div>
        <h3>Запчасти для самосвалов: продажи, долги, склад, закуп (Султан) — Демо + КП</h3>
        <p>Встреча с Султаном (бизнес старшего брата): запчасти на самосвалы и грузовики, от кузова до шайб, 1000+ наименований, товар контейнерами. Сейчас продажи — через ~20 групп WhatsApp (фото + цена), один оператор пишет журнал оплат (QR / нал / безнал), второй — долги на бумажных накладных; 1С только у бухгалтера. Хотят CRM, долги, склад, закуп, кэшбэк; сайт с каталогом отдельно — 800 000 ₸. Демо: 14 экранов, 5 ролей. КП: 2 000 000 ₸, ≈ 6 недель, 200 000 / 900 000 / 900 000, до 50 пользователей. Показ — 30.10 с братом.</p>
        <a class="tool-cta as-link" href="app/zapchasti-sultan.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/zapchasti-sultan.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-zapchasti-sultan.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 8 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Zapchasti.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 2 000 000 ₸ (+ сайт 800 000 ₸ отдельно) · PDF 8 страниц</a>
        </div></details>
        <span class="tool-badge new">Демо с братом 30.10</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="stom_ademi"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "stom_ademi",'
assert a in s; s=s.replace(a,'  { id: "zapchasti_sultan", label: "Запчасти для спецтехники (Султан) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
