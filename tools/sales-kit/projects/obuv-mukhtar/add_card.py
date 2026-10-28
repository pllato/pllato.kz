# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="obuv_mukhtar"' in s: raise SystemExit('already')
links=[('dash','Пульт собственников'),('money','Финансы и движение денег'),('ads','Реклама и креативы'),('inbox','Все чаты и звонки: WhatsApp, Instagram'),('funnel','Воронка заявок'),('clients','Клиенты'),('loyal','Программа лояльности'),('pos','Касса на моноблоке'),('kaspi','Kaspi-магазин'),('stock','Остатки по размерам'),('move','Приход и перемещения'),('inv','Инвентаризация с QR'),('migr','Переход с МойСклад'),('launch','Стоимость: 2 000 000 ₸')]
card='''      <div class="tool-card" data-app-id="obuv_mukhtar" data-created="2026-10-28" data-updated="2026-10-28" data-crm-deal-id="deal_meta_1669058181243587" data-crm-deal-title="Мухтар Асылханов · магазины обуви">
        <div class="tool-icon" style="background:#3a2418;color:#e9a46a;font-size:11px;font-weight:900;letter-spacing:.04em">ОБУ</div>
        <h3>Магазины обуви: чаты, склад по размерам, касса, лояльность (Мухтар · Алматы + Астана) — Демо + КП</h3>
        <p>Встреча с Мухтаром: магазины обуви в Алматы (≈ 50 м²) и Астане (≈ 70 м²), ведёт с супругой. Retail CRM не прижилась — данные склада переносились с ошибками; сейчас склад и касса в МойСклад, касса с личного телефона; WhatsApp и Instagram менеджеры ведут отдельно, обращения не считают. Хотят видеть, с какого креатива пришёл лид, и всю аналитику «как Power BI». Платон: одно окно — CRM, склад, касса, финансы, пульт; WhatsApp через Green API; инвентаризация с QR, лояльность, Kaspi; 1–2 зума в неделю. Демо: 14 экранов, 5 ролей. КП: стандартный пакет 1 800 000 + касса 200 000 = 2 000 000 ₸, 4–6 недель, 200 000 / 900 000 / 900 000. Демо — с супругой.</p>
        <a class="tool-cta as-link" href="app/obuv-mukhtar.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/obuv-mukhtar.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-obuv-mukhtar.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 8 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Obuv.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 2 000 000 ₸ (пакет + касса) · PDF 8 страниц</a>
        </div></details>
        <span class="tool-badge new">Демо с супругой</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="avtopark_nurbol"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "avtopark_nurbol",'
assert a in s; s=s.replace(a,'  { id: "obuv_mukhtar", label: "Магазины обуви (Мухтар) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
