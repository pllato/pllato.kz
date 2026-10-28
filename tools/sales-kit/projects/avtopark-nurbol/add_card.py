# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="avtopark_nurbol"' in s: raise SystemExit('already')
links=[('dash','Пульт парка'),('map','Карта машин'),('branches','Филиалы: Астана и Алматы'),('pays','Ежедневные оплаты: Каспий Платежи по коду машины'),('debt','Должники и автоблокировка'),('rules','Правила блокировки'),('cars','Реестр машин'),('repair','Ремонт и ДТП'),('dfunnel','Воронка водителей'),('drivers','Водители'),('contracts','Договоры: ЭЦП, eGov, бумага'),('fines','Штрафы по камерам'),('robot','Сбор штрафов: робот или Smart Bridge'),('wa','WhatsApp-рассылки'),('integr','Интеграции'),('launch','Стоимость: 2 875 000 ₸')]
card='''      <div class="tool-card" data-app-id="avtopark_nurbol" data-created="2026-10-28" data-updated="2026-10-28" data-crm-deal-id="deal_meta_1457788893178309" data-crm-deal-title="Нурбол Aliaskarov · аренда автомобилей под такси">
        <div class="tool-icon" style="background:#141d2b;color:#f5b800;font-size:11px;font-weight:900;letter-spacing:.04em">АВТ</div>
        <h3>Аренда авто под такси: оплаты, автоблокировка, водители, штрафы (Нурбол · Астана + Алматы) — Демо + КП</h3>
        <p>Встреча с Нурболом 28.10: парк аренды легковых машин под Яндекс-такси, 216 машин в Астане и Алматы, аренда от 2 месяцев, оплата ежедневно; часть машин в лизинге (GPS лизингодателя), часть свои (свой GPS). Боль: <b>водители не платят по 2–3 дня</b>, оплаты по QR Каспия проверяют вручную, для блокировки заходят в разные GPS-программы; <b>штрафы по камерам</b> выгружают, пересылают протоколы и переводят на ИИН вручную. Готовые решения — 2 500–3 000 ₸ за машину и до 3 % оборота — дорого. Платон: Каспий Платежи с кодом машины + разбор писем, автоблокировка в 21:00, робот штрафов (или Smart Bridge), WhatsApp через Green API, договоры ЭЦП/eGov/бумага, два города с раздельными базами. Демо: 16 экранов, 5 ролей. КП: 2 500 000 + 15 % за второй город = 2 875 000 ₸, 4–6 недель, 287 500 / 1 293 750 / 1 293 750. Решение — с братом (собственник), ответ 29.10.</p>
        <a class="tool-cta as-link" href="app/avtopark-nurbol.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/avtopark-nurbol.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-avtopark-nurbol.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 8 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Avtopark.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 2 875 000 ₸ (пакет + второй город) · PDF 8 страниц</a>
        </div></details>
        <span class="tool-badge new">Ответ 29.10</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="myaso_vitaliy"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "myaso_vitaliy",'
assert a in s; s=s.replace(a,'  { id: "avtopark_nurbol", label: "Аренда авто под такси (Нурбол) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
