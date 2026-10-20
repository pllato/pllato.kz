# -*- coding: utf-8 -*-
import os
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','..','..'))
p=os.path.join(ROOT,'app.html')
s=open(p,encoding='utf-8').read()
if 'data-app-id="tigers_alibek"' in s: raise SystemExit('already')
links=[('dash','Пульт собственника'),('inbox','Заявки: Instagram, TikTok, WhatsApp'),('funnel','Воронка заказов'),('order','Карточка заказа: только то, что есть'),('clients','Клиенты'),('pos','Касса точки'),('shops','Точки и перемещения'),('stock','Остатки'),('receipt','Приход и закуп'),('invent','Инвентаризация камерой'),('kits','Комплекты'),('reports','Продажи и маржа'),('content','Видео → заявки'),('team','Сотрудники и задачи'),('costs','Расходы: сейчас и после'),('launch','Стоимость: 2,5 млн, −5% за сутки')]
card='''      <div class="tool-card" data-app-id="tigers_alibek" data-created="2026-10-20" data-updated="2026-10-20">
        <div class="tool-icon" style="background:#161412;color:#e8862a;font-size:11px;font-weight:900;letter-spacing:.04em">TGR</div>
        <h3>Tigers · товары для отдыха, рыбалки и охоты (Алибек, Миндегали · Алматы) — Демо + КП</h3>
        <p>Встреча 20 октября: магазин @tigers001_team (43K в Instagram) — палатки, мебель, газ, рыбалка. Заявки с органики в Instagram, TikTok, YouTube, Threads; WhatsApp через Wazzup (~30 000 ₸/мес); amoCRM только подключили. Точка у Барахолки, скоро — точка в городе. Учёта по факту нет: остатки, приходы, цифры «в голове», продажи в Excel (внесено ~350 из ~2 000 товаров). 3 человека + 2 продавца. Нужно: <b>одно окно для заявок</b>, <b>воронка от заявки до выдачи</b>, <b>заказ только из того, что есть на складе</b>, касса точки, приход и закуп, инвентаризация, масштабирование на новые точки. Kaspi почти не используют. Решение за основателем Миндегали. Демо: 16 экранов, 5 ролей (плюс комплекты и «видео → заявки»). КП: 2 500 000 ₸, −5% при решении за сутки = 2 375 000 ₸ (237 500 / 1 068 750 / 1 068 750), 4–6 недель, 3 месяца поддержки.</p>
        <a class="tool-cta as-link" href="app/tigers-alibek.html">Открыть демо →</a>
        <details class="tool-dd"><summary>Материалы проекта</summary><div class="tool-dd-menu">
'''+''.join(f'          <a href="app/tigers-alibek.html?s={k}" target="_blank" rel="noopener"><span class="dot"></span>{t}</a>\n' for k,t in links)+'''          <a href="app/kp-tigers-alibek.html" target="_blank" rel="noopener"><span class="dot"></span>КП — веб-версия · 11 стр.</a>
          <a class="is-pdf" href="app/Pllato_KP_Tigers.pdf" target="_blank" rel="noopener"><span class="dot"></span>КП · 2 500 000 ₸ (−5% = 2 375 000 ₸) · PDF 11 страниц</a>
        </div></details>
        <span class="tool-badge new">Демо с основателем</span>
      </div>

'''
a='      <div class="tool-card" data-app-id="vladimir_svod"'
assert s.count(a)==1; s=s.replace(a,card+a)
a='  { id: "vladimir_svod",'
assert a in s; s=s.replace(a,'  { id: "tigers_alibek", label: "Tigers · товары для отдыха (Алибек) — Демо + КП" },\n'+a)
open(p,'w',encoding='utf-8').write(s)
print('card ok')
