# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="otchety_aleksandr"' in s: raise SystemExit('already')
links=[('dash','Пульт руководителя'),('phone','Отчёт в телефоне'),('stock','Остатки по 11 складам'),('moves','Движение по складам'),('turn','Оборачиваемость и запас'),('abc','ABC/XYZ-анализ'),('sales','План-факт по филиалам'),('mgr','Менеджеры и клиенты'),('debt','Дебиторка'),('builder','Конструктор отчётов'),('rights','Кто какие отчёты видит'),('bitrix','Отчёты в задачи Битрикс24'),('onec','Подключение к 1С'),('launch','Стоимость: 1 млн ₸ с 1С')]
card='''      <div class="tool-card" data-app-id="otchety_aleksandr" data-created="2026-10-23" data-updated="2026-10-23" data-crm-deal-id="deal_site_29cf0cc2-d448-416b-b642-8e2914ac8c8b" data-transcript-id="zoom:69fe2d66-b0c3-466b-9b46-d0f581ccd709" data-crm-deal-title="Александр · дистрибуция масел · отчёты из 1С">
        <div class="tool-icon" style="background:#10202b;color:#f6b73c;font-size:11px;font-weight:900;letter-spacing:.04em">ПЛС</div>
        <h3>Портал отчётности из 1С: склады, ABC, продажи (Александр · дистрибуция масел, 11 филиалов) — Демо + КП</h3>
        <p>Встреча с Александром 22.10: дистрибьютор масел и техжидкостей (выкупают у брендодержателей, дистрибуция по РК, B2B и частично Kaspi), 11 филиалов, ~200 сотрудников, ~100 в Битрикс24, 1С. Уходить с Битрикс не хотят — процессы работают. Нужен <b>блок отчётности из 1С</b>: движение остатков по складам, ABC, нестандартные отчёты, быстро и в телефоне, Excel, <b>права на каждый отчёт</b> (15–20 отчётов). Платон предложил: отдельный портал отчётов, сотрудникам — отчёты задачей в Битрикс24. Демо: 14 экранов, 5 ролей. КП: пакет отчётности с подключением 1С — 1 000 000 ₸ (800 000 + 200 000), 3–4 недели, 10/45/45; полная замена Битрикс — стандартный пакет 2 млн. Ждём от Александра список отчётов.</p>
        <a class="tool-cta as-link" href="app/otchety-aleksandr.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/otchety-aleksandr.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-otchety-aleksandr.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 8 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Otchety.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · отчётность с 1С · 1 000 000 ₸ · PDF 8 страниц</a>
        </div></details>
        <span class="tool-badge new">Ждём список отчётов</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="ohrana_kadyrzhan"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "ohrana_kadyrzhan",'
assert a in s; s=s.replace(a,'  { id: "otchety_aleksandr", label: "Портал отчётности из 1С (Александр) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
